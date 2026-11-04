import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { useModal } from '../../context/ModalContext';
import { optimizeImageUrl } from '../../utils/helpers';

export default function CartModal() {
  const navigate = useNavigate();
  const { cart, removeFromCart, addToWishlist, showToast, currentUser, processCartAbandonment } = useStore();
  const { cartOpen, closeCart, openCheckout, openAuth } = useModal();

  const handleDismissCart = () => {
    closeCart();
    // If user is closing the bag drawer with items still inside, trigger automated recovery
    const userMail = (currentUser?.email || (() => {
      try { return localStorage.getItem('saforio_customer_email') || ''; } catch (e) { return ''; }
    })()).trim();

    if (userMail && cart.length > 0 && typeof processCartAbandonment === 'function') {
      console.log('[CartModal] Bag closed with items. Triggering automated recovery to', userMail);
      processCartAbandonment({
        user: currentUser || { email: userMail, name: userMail.split('@')[0] },
        cart,
        triggerSource: 'cart_drawer_closed',
        force: true
      }).then(res => {
        if (res && res.success) {
          console.log('[CartModal] Recovery email dispatched to', res.email);
          showToast('📧 Cart Recovery Sent', 'success', `Reminder email sent to ${res.email}`, 3000);
        }
      }).catch(console.error);
    }
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && cartOpen) handleDismissCart();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartOpen, cart, currentUser]);

  if (!cartOpen) return null;

  const totalSelling = cart.reduce((sum, item) => sum + parseInt(item.price || 0, 10), 0);
  const totalMrp = cart.reduce((sum, item) => {
    const p = parseInt(item.price || 0, 10);
    const m = parseInt(item.mrp || 0, 10);
    return sum + (m && m > p ? m : Math.round(p * 1.3));
  }, 0);
  const totalSavings = totalMrp - totalSelling;

  const handleMoveToWishlist = (item, idx) => {
    addToWishlist(item);
    removeFromCart(idx);
    showToast('Moved to Wishlist', 'success', `${item.name} saved to your wishlist.`);
  };

  return (
    <div
      id="cartModal"
      className="cart-drawer-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 10, 8, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
        animation: 'cartBackdropFade 0.25s ease-out'
      }}
      onClick={(e) => {
        if (e.target.id === 'cartModal') handleDismissCart();
      }}
    >
      <style>{`
        @keyframes cartBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cartDrawerSlideRight {
          from {
            transform: translateX(100%);
            opacity: 0.6;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .cart-side-drawer {
          animation: cartDrawerSlideRight 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (max-width: 480px) {
          .cart-side-drawer {
            max-width: 100vw !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      {/* SIDE DRAWER CONTAINER */}
      <div
        className="cart-side-drawer"
        style={{
          width: '100%',
          maxWidth: '470px',
          height: '100vh',
          maxHeight: '100dvh',
          background: '#FDFBF7',
          borderLeft: '1px solid rgba(201, 168, 76, 0.35)',
          borderRadius: '20px 0 0 20px',
          boxShadow: '-12px 0 45px rgba(0, 0, 0, 0.32)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* DRAWER TOP HEADER */}
        <div
          style={{
            padding: '18px 22px',
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
            <button
              type="button"
              onClick={handleDismissCart}
              aria-label="Close Drawer"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1px solid #E6DED4',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B1C2E',
                fontSize: '16px',
                transition: 'all 0.2s ease'
              }}
              title="Close Bag"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#6B1C2E';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#6B1C2E';
              }}
            >
              ➔
            </button>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '19px',
                  fontWeight: 700,
                  color: '#2A1810',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Shopping Bag
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '11.5px',
                    fontWeight: 600,
                    background: '#F0E8D8',
                    color: '#6B1C2E',
                    padding: '2px 9px',
                    borderRadius: '12px'
                  }}
                >
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#8C7D6E' }}>
                ROKEA by RK • Exclusive Handpicked Pieces
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCart}
            aria-label="Close Drawer"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              color: '#8C7D6E',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* FREE DELIVERY BANNER (Amazon / Flipkart Style) */}
        {cart.length > 0 && (
          <div
            style={{
              background: 'linear-gradient(90deg, #E8F5E9 0%, #F1F8E9 100%)',
              borderBottom: '1px solid #C8E6C9',
              padding: '9px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11.5px',
              color: '#2E7D32',
              fontWeight: 600
            }}
          >
            <span>⚡</span>
            <span>Yay! You unlocked <strong>FREE Express Delivery</strong> across India!</span>
          </div>
        )}

        {/* SCROLLABLE DRAWER BODY */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {cart.length === 0 ? (
            /* EMPTY CART STATE */
            <div
              style={{
                textAlign: 'center',
                padding: '60px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 'auto 0'
              }}
            >
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: '50%',
                  background: 'rgba(201, 168, 76, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold, #C9A84C)',
                  marginBottom: 16
                }}
              >
                <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                  <path d="M3 6h18"></path>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#2A1810', margin: '0 0 8px' }}>
                Your Shopping Bag is Empty
              </h4>
              <p style={{ fontSize: '13px', color: '#8C7D6E', maxWidth: '300px', lineHeight: 1.5, margin: '0 0 24px' }}>
                {currentUser
                  ? "Discover Coimbatore's most exquisite silk sarees and handpicked heritage jewellery."
                  : "Please sign in to access your personal shopping bag and saved exclusive pieces."}
              </p>
              {!currentUser ? (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '12px 30px', fontSize: '13px' }}
                  onClick={() => {
                    closeCart();
                    openAuth('login');
                  }}
                >
                  SIGN IN TO SHOP →
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '12px 30px', fontSize: '13px' }}
                  onClick={() => {
                    closeCart();
                    navigate('/collections');
                  }}
                >
                  EXPLORE COLLECTIONS →
                </button>
              )}
            </div>
          ) : (
            <>
              {/* CART ITEMS LIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.map((item, idx) => {
                  const price = parseInt(item.price || 0, 10);
                  const mrp = item.mrp && parseInt(item.mrp, 10) > price ? parseInt(item.mrp, 10) : Math.round(price * 1.3);
                  const discountPercent = Math.max(10, Math.round(((mrp - price) / mrp) * 100));

                  return (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #ECE4DA',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      {/* Product Row */}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {/* Thumbnail */}
                        <div
                          style={{
                            width: 72,
                            height: 94,
                            flexShrink: 0,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#f8f8f8',
                            border: '1px solid #EFEAE3'
                          }}
                        >
                          <img
                            src={optimizeImageUrl(item.image || item.img)}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <h4
                              style={{
                                margin: '0 0 4px',
                                fontSize: '13.5px',
                                fontWeight: 600,
                                color: '#2A1810',
                                lineHeight: 1.4,
                                display: '-webkit-box',
                                WebKitLineClamp: 2,
                                WebKitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                              title={item.name}
                            >
                              {item.name}
                            </h4>

                            {/* 1-of-1 Badge */}
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#FFF8E7',
                                color: '#8B6914',
                                border: '1px solid rgba(201, 168, 76, 0.35)',
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '2px 7px',
                                borderRadius: '5px',
                                marginBottom: '6px'
                              }}
                            >
                              <span>✦</span>
                              <span>Exclusive 1-of-1 Piece • Qty: 1</span>
                            </div>
                          </div>

                          {/* Price Row */}
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '17px', fontWeight: 700, color: '#6B1C2E' }}>
                              ₹{price.toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '12px', color: '#9E9E9E', textDecoration: 'line-through' }}>
                              ₹{mrp.toLocaleString('en-IN')}
                            </span>
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                color: '#2E7D32',
                                background: '#E8F5E9',
                                padding: '1px 5px',
                                borderRadius: '4px'
                              }}
                            >
                              {discountPercent}% OFF
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div
                        style={{
                          borderTop: '1px solid #F3EDE6',
                          paddingTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleMoveToWishlist(item, idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#8B6914',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                          Save for Later
                        </button>

                        <button
                          type="button"
                          onClick={() => removeFromCart(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#D32F2F',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PRICE DETAILS BREAKDOWN (Flipkart / Amazon Style) */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #ECE4DA',
                  borderRadius: '12px',
                  padding: '14px 16px'
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#8C7D6E',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                    borderBottom: '1px solid #F0EAE1',
                    paddingBottom: '6px'
                  }}
                >
                  PRICE DETAILS ({cart.length} {cart.length === 1 ? 'ITEM' : 'ITEMS'})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                    <span>Total MRP</span>
                    <span>₹{totalMrp.toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2E7D32' }}>
                    <span>Discount on MRP</span>
                    <span>-₹{totalSavings.toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                    <span>Delivery Charges</span>
                    <span style={{ color: '#2E7D32', fontWeight: 600 }}>
                      <span style={{ textDecoration: 'line-through', color: '#999', marginRight: 5 }}>₹149</span>
                      FREE
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                    <span>Boutique Packaging</span>
                    <span style={{ color: '#2E7D32', fontWeight: 600 }}>FREE</span>
                  </div>

                  <div style={{ height: '1px', background: '#EAE3D8', margin: '4px 0' }} />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#2A1810'
                    }}
                  >
                    <span>Total Amount</span>
                    <span style={{ color: '#6B1C2E', fontSize: '18px' }}>
                      ₹{totalSelling.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {totalSavings > 0 && (
                  <div
                    style={{
                      background: '#E8F5E9',
                      color: '#2E7D32',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      marginTop: '12px',
                      textAlign: 'center'
                    }}
                  >
                    🎉 You will save ₹{totalSavings.toLocaleString('en-IN')} on this order!
                  </div>
                )}
              </div>

              {/* TRUST BADGES STRIP */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                  padding: '10px 4px',
                  textAlign: 'center',
                  background: '#F8F4EE',
                  borderRadius: '10px'
                }}
              >
                <div style={{ fontSize: '10.5px', color: '#554638' }}>
                  <div style={{ fontSize: '14px', marginBottom: 2 }}>🛡️</div>
                  <strong>100% Authentic</strong>
                  <div style={{ fontSize: '9px', color: '#8C7D6E' }}>Handpicked Silk</div>
                </div>
                <div style={{ fontSize: '10.5px', color: '#554638' }}>
                  <div style={{ fontSize: '14px', marginBottom: 2 }}>🔒</div>
                  <strong>Secure Pay</strong>
                  <div style={{ fontSize: '9px', color: '#8C7D6E' }}>256-bit SSL</div>
                </div>
                <div style={{ fontSize: '10.5px', color: '#554638' }}>
                  <div style={{ fontSize: '14px', marginBottom: 2 }}>⚡</div>
                  <strong>Fast Dispatch</strong>
                  <div style={{ fontSize: '9px', color: '#8C7D6E' }}>Within 24 Hrs</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* BOTTOM STICKY CHECKOUT BAR */}
        {cart.length > 0 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid #ECE4DA',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              boxShadow: '0 -4px 15px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div>
              <div style={{ fontSize: '10.5px', color: '#8C7D6E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Payable
              </div>
              <div style={{ fontSize: '19px', fontWeight: 800, color: '#6B1C2E', lineHeight: 1.2 }}>
                ₹{totalSelling.toLocaleString('en-IN')}
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{
                flex: 1,
                padding: '13px 18px',
                fontSize: '13.5px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #6B1C2E 0%, #4A0E17 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(107, 28, 46, 0.35)',
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                closeCart();
                openCheckout();
              }}
            >
              <span>PROCEED TO CHECKOUT</span>
              <span style={{ fontSize: '15px' }}>➔</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
