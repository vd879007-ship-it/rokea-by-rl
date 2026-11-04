import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import { useStore } from '../context/StoreContext';
import { db } from '../services/firebase';

export default function ContactPage() {
  const { openAppointment } = useModal();
  const { showToast } = useStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const whatsappNumber = "917010394051";
    const textLines = [
      "✨ *New Enquiry - ROKEA BY RK* ✨",
      "",
      `👤 *Name:* ${name.trim()}`,
      `📱 *Phone:* ${phone.trim()}`,
      email.trim() ? `✉️ *Email:* ${email.trim()}` : null,
      message.trim() ? `💬 *Message:* ${message.trim()}` : null,
      "",
      "_Sent via ROKEA Contact Page_"
    ].filter(Boolean).join("\n");

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(textLines)}`;

    if (db) {
      try {
        await db.collection("leads").add({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          message: message.trim(),
          service: 'Contact Page Inquiry',
          source: 'Contact Page Enquiry Form',
          type: 'enquiry',
          date: new Date().toLocaleDateString('en-IN'),
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Contact lead save error:", err);
      }
    }

    setLoading(false);
    showToast('Connecting to WhatsApp ✦', 'success', 'Opening WhatsApp to send your enquiry...');

    // Redirect to WhatsApp
    const win = window.open(whatsappUrl, '_blank');
    if (!win) {
      window.location.href = whatsappUrl;
    }

    setName('');
    setPhone('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="contact-page-view" style={{ paddingTop: '100px', background: 'var(--cream)', minHeight: '100vh' }}>
      <div className="ash-heading-wrap" style={{ textAlign: 'center', padding: '60px 24px 20px' }}>
        <span className="ash-eyebrow" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold-dark)', display: 'inline-block', marginBottom: 14 }}>
          Connect With Us
        </span>
        <h1 className="ash-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 700, color: 'var(--charcoal, #1a1a1a)', margin: '0 0 20px' }}>
          Contact <span className="ash-script" style={{ fontFamily: "'Great Vibes', cursive", fontSize: '1.5em', color: 'var(--gold)' }}>Us</span>
        </h1>
        <div className="ash-rule" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div className="ash-rule-line" style={{ width: 70, height: 1, background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.55), transparent)' }}></div>
          <span className="ash-rule-dot" style={{ color: 'var(--gold)', fontSize: '0.55rem', letterSpacing: 5 }}>✦ ✦ ✦</span>
          <div className="ash-rule-line" style={{ width: 70, height: 1, background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.55), transparent)' }}></div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, marginTop: 30 }}>
          {/* Left: Contact Info */}
          <div className="contact-info-card" style={{ background: 'var(--ivory)', padding: 35, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <span className="contact-tag" style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 2, fontWeight: 600 }}>✦ VISIT OUR STUDIO</span>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, margin: '10px 0 20px', color: 'var(--dark)' }}>
              ROKEA <em>by RK</em>
            </h3>
            <p style={{ color: '#666', lineHeight: 1.8, marginBottom: 30, fontSize: 14 }}>
              Experience Coimbatore's finest handpicked luxury sarees, handcrafted temple jewellery, and custom tailored blouses at our studio.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>Boutique Address</strong>
                <a
                  href="https://maps.google.com/?q=11/4,+Bharathi+Park+4th+Cross+Rd,+Jawahar+Nagar,+Saibaba+Colony,+Coimbatore+-+641011"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#333', textDecoration: 'none', lineHeight: 1.6 }}
                >
                  11/4, Bharathi Park 4th Cross Rd, Jawahar Nagar, Saibaba Colony, Coimbatore, Tamil Nadu - 641011
                </a>
              </div>

              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>Direct Phone / WhatsApp</strong>
                <a href="tel:+917010394051" style={{ color: '#333', textDecoration: 'none' }}>+91 70103 94051</a>
              </div>

              <div>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>Office Email</strong>
                <a href="mailto:rokeabyrk@gmail.com" style={{ color: '#333', textDecoration: 'none' }}>rokeabyrk@gmail.com</a>
              </div>

              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={openAppointment}
                  style={{ width: '100%', padding: '12px' }}
                >
                  Book Private In-Store Appointment
                </button>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="contact-form-card" style={{ background: '#fff', padding: 35, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 10, color: 'var(--dark)' }}>
              Send an Enquiry
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 25 }}>
              Have questions regarding our bridal collections or bespoke blouse orders? Fill out the form below.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Phone Number (WhatsApp)</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Email Address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Message</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Tell us about the sarees, jewellery or blouse designs you are looking for..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, fontFamily: 'inherit' }}
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: 14 }}
                disabled={loading}
              >
                {loading ? 'Opening WhatsApp...' : 'Send Enquiry via WhatsApp →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
