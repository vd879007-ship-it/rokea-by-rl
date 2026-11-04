import React, { useState } from 'react';
import { useModal } from '../../context/ModalContext';
import { useStore } from '../../context/StoreContext';
import { db } from '../../services/firebase';

export default function AppointmentModal() {
  const { appointmentOpen, closeAppointment } = useModal();
  const { showToast } = useStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('Morning (10:30 AM - 1:00 PM)');
  const [service, setService] = useState('Bridal Saree Consultation');
  const [loading, setLoading] = useState(false);

  if (!appointmentOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      showToast("Required Fields Missing", "warning", "Please fill your name and phone number.");
      return;
    }

    setLoading(true);

    const whatsappNumber = "917010394051";
    const textLines = [
      "📅 *Boutique Visit Appointment - ROKEA BY RK* 📅",
      "",
      `👤 *Client Name:* ${name.trim()}`,
      `📱 *Phone / WhatsApp:* ${phone.trim()}`,
      date ? `🗓️ *Preferred Date:* ${date}` : null,
      time ? `⏰ *Preferred Slot:* ${time}` : null,
      `🏷️ *Service Requested:* ${service}`,
      "",
      "_Booked via ROKEA Website Appointment Form_"
    ].filter(Boolean).join("\n");

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(textLines)}`;

    const appointmentData = {
      name: name.trim(),
      phone: phone.trim(),
      date,
      time,
      service,
      type: 'appointment',
      source: 'Book Appointment Modal',
      createdAt: new Date().toISOString()
    };

    if (db) {
      try {
        await db.collection("leads").add(appointmentData);
      } catch (err) {
        console.error("Firestore lead save error:", err);
      }
    }

    setLoading(false);
    closeAppointment();
    showToast(
      "Connecting to WhatsApp ✦",
      "success",
      `Thank you, ${name}! Opening WhatsApp to confirm your appointment slot...`
    );

    // Redirect to WhatsApp
    const win = window.open(whatsappUrl, '_blank');
    if (!win) {
      window.location.href = whatsappUrl;
    }

    setName('');
    setPhone('');
    setDate('');
  };

  return (
    <div
      className="modal"
      id="appointmentModal"
      style={{ display: 'flex' }}
      onClick={(e) => {
        if (e.target.id === 'appointmentModal') closeAppointment();
      }}
    >
      <div className="modal-content appointment-popup-content">
        <span className="modal-close" onClick={closeAppointment}>×</span>
        <div className="appointment-popup-inner">
          <div className="appointment-popup-header">
            <span className="section-label">Bespoke Experience</span>
            <h3 className="appointment-popup-title">Book a Boutique Visit</h3>
            <p className="appointment-popup-subtitle">
              Schedule an exclusive styling consultation at our Saibaba Colony, Coimbatore boutique.
            </p>
          </div>
          <form id="appointmentForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                id="aptName"
                required
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone Number (WhatsApp)</label>
              <input
                type="tel"
                id="aptPhone"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-row" style={{ display: 'flex', gap: 15 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Preferred Date</label>
                <input
                  type="date"
                  id="aptDate"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Preferred Time</label>
                <select
                  id="aptTime"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                >
                  <option value="Morning (10:30 AM - 1:00 PM)">Morning (10:30 AM - 1:00 PM)</option>
                  <option value="Afternoon (1:00 PM - 4:00 PM)">Afternoon (1:00 PM - 4:00 PM)</option>
                  <option value="Evening (4:00 PM - 7:30 PM)">Evening (4:00 PM - 7:30 PM)</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Interested In</label>
              <select
                id="aptService"
                value={service}
                onChange={(e) => setService(e.target.value)}
              >
                <option value="Bridal Saree Consultation">Bridal Saree Consultation</option>
                <option value="Custom Blouse Stitching & Measurements">Custom Blouse Stitching & Measurements</option>
                <option value="Heritage Jewellery Trial">Heritage Jewellery Trial</option>
                <option value="Complete Bridal Adornment Look">Complete Bridal Adornment Look</option>
              </select>
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: 15 }}
              disabled={loading}
            >
              {loading ? 'Opening WhatsApp...' : 'Confirm & Book on WhatsApp →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
