import React, { useState } from 'react';
import { useModal } from '../../context/ModalContext';
import { useStore } from '../../context/StoreContext';
import { db } from '../../services/firebase';

export default function BlouseBookingModal() {
  const { blouseModalOpen, closeBlouseModal } = useModal();
  const { showToast } = useStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!blouseModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      showToast('Required Fields Missing', 'warning', 'Please enter your name and phone number.');
      return;
    }

    setLoading(true);

    const whatsappNumber = "917010394051";
    const textLines = [
      "✂️ *Custom Blouse Consultation - ROKEA BY RK* ✂️",
      "",
      `👤 *Name:* ${name.trim()}`,
      `📱 *Phone / WhatsApp:* ${phone.trim()}`,
      notes ? `💬 *Design Notes:* ${notes.trim()}` : null,
      "",
      "_Sent via ROKEA Custom Blouse Studio_"
    ].filter(Boolean).join("\n");

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(textLines)}`;

    if (db) {
      try {
        await db.collection("leads").add({
          name: name.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
          service: 'Custom Blouse Consultation',
          source: 'Blouse Booking Modal',
          type: 'blouse_booking',
          date: new Date().toLocaleDateString('en-IN'),
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Blouse lead save error:", err);
      }
    }

    setLoading(false);
    closeBlouseModal();
    showToast('Connecting to WhatsApp ✦', 'success', `Thank you, ${name}! Opening WhatsApp to discuss your blouse design...`);

    // Redirect to WhatsApp
    const win = window.open(whatsappUrl, '_blank');
    if (!win) {
      window.location.href = whatsappUrl;
    }

    setName('');
    setPhone('');
    setNotes('');
  };

  return (
    <div
      className="modal"
      id="blouseModal"
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        zIndex: 10000,
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={(e) => {
        if (e.target.id === 'blouseModal') closeBlouseModal();
      }}
    >
      <div
        className="modal-content"
        style={{
          background: '#fff',
          padding: 40,
          borderRadius: 16,
          width: '90%',
          maxWidth: 500,
          position: 'relative'
        }}
      >
        <span
          className="modal-close"
          style={{
            position: 'absolute',
            top: 15,
            right: 20,
            fontSize: 24,
            cursor: 'pointer',
            color: 'var(--dark)'
          }}
          onClick={closeBlouseModal}
        >
          ×
        </span>
        <span className="section-label">Tailored For You</span>
        <h3 style={{ marginBottom: 15, fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--dark)' }}>
          Design Your Blouse
        </h3>
        <p style={{ color: 'var(--muted)', marginBottom: 25, fontSize: 14 }}>
          Please fill out your details and we will contact you to discuss your bespoke blouse design and measurements.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15, textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 5, color: 'var(--text)' }}>
              Full Name
            </label>
            <input
              type="text"
              id="blouseName"
              placeholder="Your Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: 12, border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8 }}
            />
          </div>
          <div style={{ marginBottom: 15, textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 5, color: 'var(--text)' }}>
              Phone Number
            </label>
            <input
              type="tel"
              id="blousePhone"
              placeholder="Your Contact Number"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: 12, border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8 }}
            />
          </div>
          <div style={{ marginBottom: 15, textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: 12, marginBottom: 5, color: 'var(--text)' }}>
              Design Preferences / Notes
            </label>
            <textarea
              id="blouseNotes"
              placeholder="Any specific pattern, material, or design in mind?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid rgba(201,168,76,0.3)',
                borderRadius: 8,
                fontFamily: "'Poppins', sans-serif",
                resize: 'vertical',
                minHeight: 80
              }}
            ></textarea>
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: 15 }}
            disabled={loading}
          >
            {loading ? 'Opening WhatsApp...' : 'Book Consultation via WhatsApp →'}
          </button>
        </form>
      </div>
    </div>
  );
}
