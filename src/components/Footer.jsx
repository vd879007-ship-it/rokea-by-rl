import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useModal } from '../context/ModalContext';

export default function Footer() {
  const { openAppointment } = useModal();
  const navigate = useNavigate();

  const handleNav = (path) => {
    if (path.startsWith('/#')) {
      const id = path.replace('/#', '');
      if (window.location.pathname === '/') {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      navigate(path);
      window.scrollTo(0, 0);
    }
  };

  return (
    <footer id="footer">
      <div class="footer-grid">
        <div class="footer-brand">
          <Link to="/" class="nav-logo" aria-label="ROKEA by RK Homepage" onClick={() => window.scrollTo(0, 0)}>
            <img
              src="https://static.wixstatic.com/media/9881b8_16e714ef67304ad7812d38944b0b0b16~mv2.png/v1/crop/x_0,y_92,w_5000,h_1065/fill/w_155,h_33,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/ROKEA%20horizontal%20logo%20(1).png"
              alt="ROKEA by RK"
              class="logo-img"
              loading="lazy"
              decoding="async"
              width="800"
              height="800"
            />
          </Link>
          <p class="footer-tagline">
            Coimbatore's finest destination for luxury handwoven sarees and heritage jewellery, celebrating the art of Indian craftsmanship since 2010.
          </p>
          <div class="footer-social">
            <div
              class="social-btn"
              title="Facebook"
              onClick={() => window.open('https://www.facebook.com/profile.php?id=61587639092396', '_blank')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </div>
            <div
              class="social-btn"
              title="Instagram"
              onClick={() => window.open('https://www.instagram.com/rokeabyrk/', '_blank')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
              </svg>
            </div>
            <div
              class="social-btn"
              title="YouTube"
              onClick={() => window.open('https://www.youtube.com/@rokeabyrk', '_blank')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"></path>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
              </svg>
            </div>
          </div>
        </div>

        <div>
          <div class="footer-col-title">Quick Links</div>
          <ul class="footer-links">
            <li>
              <Link to="/" onClick={() => handleNav('/#home')}>Home</Link>
            </li>
            <li>
              <Link to="/about" onClick={() => handleNav('/about')}>Our Heritage</Link>
            </li>
            <li>
              <Link to="/collections" onClick={() => handleNav('/collections')}>Products</Link>
            </li>
            <li>
              <Link to="/ai-stylist" onClick={() => handleNav('/ai-stylist')}>AI Virtual Stylist</Link>
            </li>
            <li>
              <a href="/#instagram-hub" onClick={(e) => { e.preventDefault(); handleNav('/#instagram-hub'); }}>Social Hub</a>
            </li>
          </ul>
        </div>

        <div>
          <div class="footer-col-title">Visit Us</div>
          <ul class="footer-links">
            <li>
              <a href="https://maps.google.com/?q=11/4,+Bharathi+Park+4th+Cross+Rd,+Jawahar+Nagar,+Saibaba+Colony,+Coimbatore+-+641011" target="_blank" rel="noreferrer">
                11/4, Bharathi Park 4th Cross Rd, Jawahar Nagar, Saibaba Colony, Coimbatore - 641011
              </a>
            </li>
            <li><a href="tel:+917010394051">+91 7010394051</a></li>
            <li><a href="mailto:rokeabyrk@gmail.com">rokeabyrk@gmail.com</a></li>
            <li style={{ marginTop: 15 }}>
              <button class="btn-primary" style={{ padding: '8px 15px', fontSize: 12 }} onClick={openAppointment}>
                Book Appointment
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span class="footer-copy">© 2025 ROKEA by RK Luxury Sarees &amp; Jewellery. All rights reserved.</span>
      </div>
    </footer>
  );
}
