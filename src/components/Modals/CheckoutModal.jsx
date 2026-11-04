import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useModal } from '../../context/ModalContext';
import { db } from '../../services/firebase';
import { optimizeImageUrl } from '../../utils/helpers';
import { removeAbandonedCartRecord } from '../../services/reminderService';

export default function CheckoutModal() {
  const { cart, currentUser, clearCart, showToast, processCartAbandonment } = useStore();
  const { checkoutOpen, closeCheckout } = useModal();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || navigator.vendor || window.opera || '';
      if (/FBAN|FBAV|Instagram|WhatsApp|Line|Twitter|Snapchat/i.test(ua)) {
        setIsInAppBrowser(true);
      }
    }
  }, []);

  const handleDismissCheckout = () => {
    closeCheckout();
    const cleanMail = (email || currentUser?.email || '').trim();
    if (cleanMail && cart.length > 0 && typeof processCartAbandonment === 'function') {
      console.log('[CheckoutModal] Checkout closed without completing payment. Triggering recovery to', cleanMail);
      processCartAbandonment({
        user: { name: name.trim() || 'Customer', email: cleanMail, phone: phone.trim() },
        cart,
        triggerSource: 'checkout_dismissed',
        force: true
      }).then(res => {
        if (res && res.success) {
          showToast('📧 Cart Recovery Sent', 'success', `Reminder email sent to ${res.email}`, 3000);
        }
      }).catch(console.error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setName(currentUser.name);
      if (currentUser.phone) setPhone(currentUser.phone);
      if (currentUser.email) setEmail(currentUser.email);
    } else {
      try {
        const savedEmail = localStorage.getItem('saforio_customer_email') || '';
        if (savedEmail) setEmail(savedEmail);
      } catch (e) {}
    }
  }, [currentUser, checkoutOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && checkoutOpen) handleDismissCheckout();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checkoutOpen, email, cart, name, phone]);

  if (!checkoutOpen) return null;

  const totalAmount = cart.reduce((sum, item) => sum + parseInt(item.price || 0, 10), 0);

  const loadRazorpaySDK = () => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      const existing = document.getElementById('razorpay-sdk');
      if (existing) {
        if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        setTimeout(() => resolve(typeof window !== 'undefined' && !!window.Razorpay), 2000);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (!totalAmount || totalAmount <= 0) {
      alert("Invalid cart amount. Please check your selected items.");
      return;
    }

    // Clean phone number for Razorpay Indian mobile prefill (strictly 10 digits)
    let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    if (cleanPhone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number (e.g. 9876543210).");
      return;
    }

    // Razorpay SDK resolution (prefer synchronous access if already loaded to preserve mobile user gesture context)
    let RazorpayConstructor = typeof window !== 'undefined' && window.Razorpay ? window.Razorpay : null;
    if (!RazorpayConstructor) {
      setLoading(true);
      const isLoaded = await loadRazorpaySDK();
      if (isLoaded && typeof window !== 'undefined' && window.Razorpay) {
        RazorpayConstructor = window.Razorpay;
      }
    }

    if (!RazorpayConstructor) {
      setLoading(false);
      alert("Could not load Razorpay payment gateway. Please disable your Ad-Blocker or check your internet connection.");
      return;
    }

    setLoading(true);

    const razorpayKey =
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_RAZORPAY_KEY_ID) ||
      (typeof process !== 'undefined' && process.env && process.env.RAZORPAY_KEY_ID) ||
      "rzp_live_SEMSm8iPbUKAu9";

    const options = {
      key: razorpayKey,
      amount: Math.round(totalAmount * 100), // In paise (integer)
      currency: "INR",
      name: "ROKEA by RK Boutique",
      description: `Order (${cart.length} item${cart.length > 1 ? 's' : ''}) by ${name.trim()}`,
      image: "https://static.wixstatic.com/media/9881b8_16e714ef67304ad7812d38944b0b0b16~mv2.png/v1/crop/x_0,y_92,w_5000,h_1065/fill/w_1500,h_320,al_c,q_100,enc_avif,quality_auto/ROKEA%20horizontal%20logo%20(1).png",
      prefill: {
        name: name.trim(),
        contact: cleanPhone,
        email: email.trim() || (currentUser ? currentUser.email : '')
      },
      theme: {
        color: "#6B1C2E",
        backdrop_color: "rgba(15, 10, 8, 0.85)"
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
          console.log("Razorpay payment modal closed.");
        },
        handleback: true,     // Critical on mobile: handles Android hardware back & UPI app switching
        backdropclose: false, // Prevents accidental touch dismissal on mobile
        confirm_close: true   // Ask user confirmation before abandoning payment
      },
      retry: {
        enabled: true,
        max_count: 3
      },
      send_sms_hash: true,
      notes: {
        order_platform: "mobile_web_react",
        customer_phone: cleanPhone,
        customer_name: name.trim()
      },
      handler: function (response) {
        setLoading(false);
        const orderData = {
          items: cart,
          total: totalAmount,
          customer: { name: name.trim(), phone: cleanPhone, email: email.trim() || (currentUser ? currentUser.email : ''), address: address.trim() },
          paymentId: response.razorpay_payment_id || 'PAY_' + Date.now(),
          userId: currentUser ? currentUser.uid : 'guest',
          date: new Date().toISOString()
        };

        try {
          const orders = JSON.parse(localStorage.getItem('saforio_orders')) || [];
          orders.push({ id: Date.now(), ...orderData, date: new Date().toLocaleDateString() });
          localStorage.setItem('saforio_orders', JSON.stringify(orders));
        } catch (err) {
          console.error(err);
        }

        if (db) {
          db.collection("orders").add(orderData)
            .then(() => console.log("Order saved to Firestore!"))
            .catch((error) => console.error("Firestore order error:", error));

          // Clear user's saved cart in Firestore
          if (currentUser && currentUser.uid) {
            db.collection("users").doc(currentUser.uid).update({ cart: [] }).catch(() => {});
          }
        }

        // Permanently remove customer from Abandoned Reminders upon successful purchase!
        const purchasedEmail = (email.trim() || (currentUser ? currentUser.email : '') || '').trim().toLowerCase();
        if (purchasedEmail) {
          removeAbandonedCartRecord(purchasedEmail);
        }

        if (currentUser && currentUser.email) {
          try {
            localStorage.removeItem(`saforio_last_reminder_${currentUser.email.toLowerCase()}`);
          } catch (e) {}
        }

        clearCart();
        closeCheckout();
        showToast("Payment Successful!", "success", `Payment ID: ${response.razorpay_payment_id}`);
      }
    };

    try {
      const rzp = new RazorpayConstructor(options);
      rzp.on('payment.failed', function (resp) {
        setLoading(false);
        console.error("Razorpay payment.failed:", resp);
        const err = resp?.error || {};
        const desc = err.description || "Transaction failed or cancelled.";
        const reason = err.reason ? ` (${err.reason})` : '';
        const step = err.step ? ` [at ${err.step}]` : '';

        let help = '';
        if (err.reason === 'payment_cancelled') {
          help = '\n\nPayment was cancelled in UPI app or window was closed.';
        } else if (err.code === 'BAD_REQUEST_ERROR') {
          help = '\n\nPlease ensure your Razorpay Live merchant account KYC is activated.';
        } else {
          help = '\n\nIf money was debited from your account, it will automatically refund within 24-48 hours.';
        }

        alert(`Payment Incomplete: ${desc}${reason}${step}${help}`);
      });
      rzp.open();
    } catch (err) {
      setLoading(false);
      console.error("Razorpay initialization error:", err);
      alert(`Razorpay error: ${err.message || 'Failed to open payment gateway'}`);
    }
  };

  return (
    <div
      id="checkoutModal"
      className="modal"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 10, 8, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999
      }}
      onClick={(e) => {
        if (e.target.id === 'checkoutModal' && !loading) {
          handleDismissCheckout();
        }
      }}
    >
      <style>{`
        @keyframes checkoutPopIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .checkout-modal-card {
          animation: checkoutPopIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .checkout-input:focus, .checkout-textarea:focus {
          border-color: #C9A84C !important;
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.16) !important;
          outline: none !important;
        }
      `}</style>

      <div
        className="modal-content checkout-modal-card"
        style={{
          background: '#FDFBF7',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          borderRadius: '16px',
          padding: '0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(201, 168, 76, 0.3)',
          position: 'relative'
        }}
      >
        {/* TOP HEADER */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #ECE4DA',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(201, 168, 76, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8B6914'
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#2A1810',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Secure Checkout
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    background: '#E8F5E9',
                    color: '#2E7D32',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}
                >
                  ✓ 256-bit SSL
                </span>
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#8C7D6E' }}>
                ROKEA by RK • Luxury Express Delivery
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismissCheckout}
            aria-label="Close Checkout"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid #E5DED4',
              background: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#666',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#6B1C2E';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#6B1C2E';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#666';
              e.currentTarget.style.borderColor = '#E5DED4';
            }}
          >
            ×
          </button>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* MINI ORDER PREVIEW STRIP */}
          {cart.length > 0 && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #ECE4DA',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  {cart.slice(0, 3).map((item, idx) => (
                    <img
                      key={idx}
                      src={optimizeImageUrl(item.image || item.img)}
                      alt={item.name}
                      style={{
                        width: 44,
                        height: 56,
                        objectFit: 'cover',
                        borderRadius: 6,
                        border: '1px solid #EFEAE3',
                        background: '#f8f8f8'
                      }}
                    />
                  ))}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#2A1810',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={cart[0]?.name}
                  >
                    {cart.length === 1 ? cart[0].name : `${cart.length} Luxury Items in Bag`}
                  </div>
                  <div style={{ fontSize: '11px', color: '#2E7D32', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: 2 }}>
                    <span>⚡</span> <span>FREE Express Courier Delivery</span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '10.5px', color: '#8C7D6E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payable</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#6B1C2E' }}>
                  ₹{totalAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )}

          {/* IN-APP BROWSER NOTICE FOR INSTAGRAM / WHATSAPP MOBILE USERS */}
          {isInAppBrowser && (
            <div
              style={{
                background: 'linear-gradient(135deg, #FFF9E6 0%, #FFF3D0 100%)',
                border: '1px solid #FFE082',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>💡</span>
              <div style={{ fontSize: '11.5px', color: '#6D4C41', lineHeight: 1.45 }}>
                <strong>Mobile Payment Tip:</strong> In Instagram or WhatsApp browser, UPI auto-redirection can sometimes be blocked. If Google Pay/PhonePe doesn't open, tap the <strong>top ⋮ or ⋯ menu</strong> and choose <strong>"Open in Chrome / Safari"</strong>.
              </div>
            </div>
          )}

          {/* CHECKOUT FORM */}
          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3A2E28', marginBottom: '6px' }}>
                Full Name <span style={{ color: '#D32F2F' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8C7D6E', display: 'flex' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <input
                  type="text"
                  id="orderName"
                  className="checkout-input"
                  required
                  placeholder="e.g. Priyadarshini"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5DED4',
                    background: '#ffffff',
                    fontSize: '13.5px',
                    color: '#2A1810',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* Email Address */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#3A2E28' }}>
                  Email Address <span style={{ color: '#D32F2F' }}>*</span>
                </label>
                <span style={{ fontSize: '10.5px', color: '#8C7D6E' }}>For digital bill &amp; order tracking</span>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8C7D6E', display: 'flex' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <input
                  type="email"
                  id="orderEmail"
                  className="checkout-input"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    try {
                      if (val.trim()) localStorage.setItem('saforio_customer_email', val.trim());
                    } catch (err) {}
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5DED4',
                    background: '#ffffff',
                    fontSize: '13.5px',
                    color: '#2A1810',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#3A2E28' }}>
                  Mobile Number <span style={{ color: '#D32F2F' }}>*</span>
                </label>
                <span style={{ fontSize: '10.5px', color: '#8C7D6E' }}>For courier dispatch & SMS tracking</span>
              </div>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#8C7D6E',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#4A3B32', borderRight: '1px solid #D8CFBE', paddingRight: '6px' }}>
                    +91
                  </span>
                </span>
                <input
                  type="tel"
                  id="orderPhone"
                  className="checkout-input"
                  required
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 76px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5DED4',
                    background: '#ffffff',
                    fontSize: '13.5px',
                    color: '#2A1810',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* Delivery Address */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3A2E28', marginBottom: '6px' }}>
                Complete Delivery Address <span style={{ color: '#D32F2F' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '13px', color: '#8C7D6E', display: 'flex' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </span>
                <textarea
                  id="orderAddress"
                  className="checkout-textarea"
                  rows={3}
                  required
                  placeholder="House/Door No, Street name, Locality, City, State & Pincode"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '10px',
                    border: '1.5px solid #E5DED4',
                    background: '#ffffff',
                    fontSize: '13.5px',
                    color: '#2A1810',
                    fontFamily: 'inherit',
                    resize: 'none',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* RAZORPAY PAYMENT PILL STRIP */}
            <div
              style={{
                background: '#F8F4EE',
                border: '1px solid #ECE4DA',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#554638', fontWeight: 600 }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#2E7D32" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>Secured by Razorpay</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#8C7D6E', fontWeight: 600 }}>
                <span style={{ background: '#fff', border: '1px solid #E0D6C8', padding: '1px 6px', borderRadius: '4px' }}>UPI</span>
                <span style={{ background: '#fff', border: '1px solid #E0D6C8', padding: '1px 6px', borderRadius: '4px' }}>GPay</span>
                <span style={{ background: '#fff', border: '1px solid #E0D6C8', padding: '1px 6px', borderRadius: '4px' }}>PhonePe</span>
                <span style={{ background: '#fff', border: '1px solid #E0D6C8', padding: '1px 6px', borderRadius: '4px' }}>Cards</span>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6B1C2E 0%, #4A0E17 100%)',
                color: '#ffffff',
                fontSize: '14.5px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 8px 22px rgba(107, 28, 46, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? (
                <span>Securing Payment & Connecting...</span>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>PAY ₹{totalAmount.toLocaleString('en-IN')} VIA RAZORPAY</span>
                  <span style={{ fontSize: '16px' }}>➔</span>
                </>
              )}
            </button>
          </form>

          {/* TRUST FOOTER */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '14px',
              fontSize: '11px',
              color: '#8C7D6E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>🛡️</span>
            <span>Handpicked Boutique Quality • Dispatched in 24 Hours</span>
          </div>
        </div>
      </div>
    </div>
  );
}
