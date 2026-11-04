import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import { useStore } from '../context/StoreContext';
import { db } from '../services/firebase';
import HeroPromoOffer from '../components/HeroPromoOffer';

export default function HomePage() {
  const navigate = useNavigate();
  const { openAuth, openAppointment } = useModal();
  const { showToast, currentUser } = useStore();

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState(0);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactService, setContactService] = useState('Bridal Saree Consultation');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);

  // Newsletter State
  const [newsEmail, setNewsEmail] = useState('');
  const [newsLoading, setNewsLoading] = useState(false);

  const toggleFaq = (index) => {
    setActiveFaq(prev => (prev === index ? null : index));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);

    const whatsappNumber = "917010394051";
    const textLines = [
      "✨ *New Enquiry - ROKEA BY RK* ✨",
      "",
      `👤 *Name:* ${contactName.trim()}`,
      `📱 *Phone / WhatsApp:* ${contactPhone.trim()}`,
      contactEmail.trim() ? `✉️ *Email:* ${contactEmail.trim()}` : null,
      `🏷️ *Service / Interest:* ${contactService}`,
      contactMessage.trim() ? `💬 *Requirements / Queries:* ${contactMessage.trim()}` : null,
      "",
      "_Sent via ROKEA Website Enquiry Form_"
    ].filter(Boolean).join("\n");

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(textLines)}`;

    // 1. Store lead in Firestore for tracking
    if (db) {
      try {
        await db.collection("leads").add({
          name: contactName.trim(),
          phone: contactPhone.trim(),
          email: contactEmail.trim(),
          service: contactService,
          message: contactMessage.trim(),
          source: 'Send Us an Enquiry Form',
          type: 'enquiry',
          date: new Date().toLocaleDateString('en-IN'),
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Firestore lead error:", err);
      }
    }

    setContactLoading(false);
    showToast('Connecting to WhatsApp ✦', 'success', 'Opening WhatsApp with your enquiry details...');

    // 2. Redirect to WhatsApp
    const win = window.open(whatsappUrl, '_blank');
    if (!win) {
      window.location.href = whatsappUrl;
    }

    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setContactMessage('');
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = (newsEmail || '').trim().toLowerCase();
    if (!cleanEmail) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      showToast('Invalid Email', 'error', 'Please enter a valid email address.');
      return;
    }

    // 1. Check local cache first for instant check
    try {
      const localSubs = JSON.parse(localStorage.getItem('saforio_subscribed_emails') || '[]');
      if (Array.isArray(localSubs) && localSubs.includes(cleanEmail)) {
        showToast('Already Subscribed', 'info', 'This email is already registered in our exclusive circle.');
        return;
      }
    } catch (e) {}

    setNewsLoading(true);

    try {
      if (db) {
        // 2. Check if email already exists in Firestore "subscribers" collection
        let isAlreadySubscribed = false;
        try {
          const subDoc = await db.collection("subscribers").doc(cleanEmail).get();
          if (subDoc.exists) {
            isAlreadySubscribed = true;
          }
        } catch (checkErr) {
          console.warn("Subscribers doc check notice:", checkErr);
        }

        // 3. Also check if email already exists in "leads" collection
        if (!isAlreadySubscribed) {
          try {
            const leadsQuery = await db.collection("leads")
              .where("email", "==", cleanEmail)
              .where("type", "==", "newsletter")
              .limit(1)
              .get();
            if (!leadsQuery.empty) {
              isAlreadySubscribed = true;
            }
          } catch (leadCheckErr) {
            console.warn("Leads query check notice:", leadCheckErr);
          }
        }

        // If already subscribed, block and inform user
        if (isAlreadySubscribed) {
          try {
            const localSubs = JSON.parse(localStorage.getItem('saforio_subscribed_emails') || '[]');
            if (!localSubs.includes(cleanEmail)) {
              localSubs.push(cleanEmail);
              localStorage.setItem('saforio_subscribed_emails', JSON.stringify(localSubs));
            }
          } catch (e) {}

          showToast('Already Subscribed', 'info', 'This email is already part of our exclusive private circle.');
          setNewsLoading(false);
          return;
        }

        // 4. Save to leads collection in Firestore
        await db.collection("leads").add({
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: '-',
          service: 'Newsletter Subscription (Exclusive Offers)',
          source: 'Website Newsletter Form',
          type: 'newsletter',
          date: new Date().toLocaleDateString('en-IN'),
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString()
        });

        // 5. Also save in dedicated subscribers collection with cleanEmail as document ID
        try {
          await db.collection("subscribers").doc(cleanEmail).set({
            email: cleanEmail,
            subscribedAt: new Date().toISOString(),
            status: 'active',
            source: 'Newsletter Section'
          }, { merge: true });
        } catch (subErr) {
          console.warn("Subscribers sync notice:", subErr);
        }

        // Update local cache
        try {
          const localSubs = JSON.parse(localStorage.getItem('saforio_subscribed_emails') || '[]');
          if (!localSubs.includes(cleanEmail)) {
            localSubs.push(cleanEmail);
            localStorage.setItem('saforio_subscribed_emails', JSON.stringify(localSubs));
          }
        } catch (e) {}
      }

      showToast('Subscribed Successfully! ✦', 'success', 'You are now part of our exclusive private circle.');
      setNewsEmail('');
    } catch (err) {
      console.error("Newsletter submission error:", err);
      showToast('Subscribed Successfully! ✦', 'success', 'Thank you for subscribing to ROKEA BY RK.');
      setNewsEmail('');
    } finally {
      setNewsLoading(false);
    }
  };

  const selectCategory = (cat) => {
    localStorage.setItem('rokea_selected_category', cat);
    navigate(`/collections?category=${cat}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="home-page">
      {/* 1. HERO SECTION */}
      <section
        className="hero"
        id="home"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://res.cloudinary.com/drkgkgiat/image/upload/f_auto,q_auto/v1777447204/rk_saree_banner_copy.jpg_d6mphh.jpg')"
        }}
      >
        <div className="hero-pattern"></div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-center">
              <div className="hero-eyebrow">
                <span className="eyebrow-line"></span>
                <span className="eyebrow-star">&#10022;</span>
                <span className="eyebrow-text">
                  {currentUser ? `WELCOME, ${(currentUser.name || 'MEMBER').split(' ')[0].toUpperCase()}` : 'TIMELESS TRADITION'}
                </span>
                <span className="eyebrow-star">&#10022;</span>
                <span className="eyebrow-text">MODERN YOU</span>
              </div>
              <h1 className="hero-title">
                <span className="hero-anim-line line-1">Handpicked</span>
                <span className="hero-anim-line line-2">
                  <span className="hero-title-highlight">
                    <em>Sarees</em>
                    <svg className="hero-swoosh" viewBox="0 0 240 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 14 Q 75 2 235 6 Q 115 17 2 14 Z" fill="url(#heroSwooshGrad)" />
                      <defs>
                        <linearGradient id="heroSwooshGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.95" />
                          <stop offset="45%" stopColor="#F5E1A4" stopOpacity="1" />
                          <stop offset="100%" stopColor="#8B6914" stopOpacity="0.15" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                </span>
                <span className="hero-anim-line line-3">&amp; Jewellery</span>
                <span className="hero-anim-line line-4">Online</span>
              </h1>
              <p className="hero-subtitle">
                Discover handpicked sarees, sarees and jewellery online at ROKEA by RK. Shop premium silk, Dubion and
                heritage sarees curated for timeless elegance.
              </p>
              <div className="hero-btns">
                <button className="btn-primary" onClick={() => { navigate('/collections'); window.scrollTo(0, 0); }}>
                  EXPLORE COLLECTIONS &rarr;
                </button>
                {currentUser ? (
                  <button
                    className="btn-outline hero-signed-in-btn"
                    onClick={openAppointment}
                    aria-label="Book Boutique Appointment"
                    title="Book an exclusive boutique consultation"
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      BOOK APPOINTMENT
                    </span>
                  </button>
                ) : (
                  <button className="btn-outline" onClick={() => openAuth('login')}>
                    JOIN THE FAMILY
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top-Right Corner Hanging Pull-Cord Medallion */}
        <HeroPromoOffer />
        <div className="hero-scroll">
          <div className="scroll-line"></div>
          <span className="scroll-text">SCROLL</span>
        </div>
      </section>

      {/* MARQUEE BAR */}
      <div className="marquee-bar">
        <div className="marquee-track" id="marquee-track">
          {[1, 2, 3].map((rep) => (
            <React.Fragment key={rep}>
              <span className="marquee-item">
                Premium soft silk saree <span className="marquee-dot"></span>
              </span>
              <span className="marquee-item">
                Dubion saree <span class="marquee-dot"></span>
              </span>
              <span className="marquee-item">
                Glow Viscose saree <span className="marquee-dot"></span>
              </span>
              <span className="marquee-item">
                White stone necklace <span className="marquee-dot"></span>
              </span>
              <span className="marquee-item">
                Deep wine floral necklace <span className="marquee-dot"></span>
              </span>
              <span className="marquee-item">
                Antique gold coin necklace with Lakshmi pendant <span className="marquee-dot"></span>
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 2. CURATED SELECTION DUAL SHOWCASE */}
      <section className="products-section curated-showcase-section" id="products">
        {/* Botanical Corner Accents */}
        <div className="botanical-ornament botanical-top-left" aria-hidden="true">
          <svg viewBox="0 0 100 100" fill="none" stroke="rgba(201, 168, 76, 0.45)" strokeWidth="1.2">
            <path d="M5 95 C 15 50, 45 15, 95 5 M35 50 C 20 38, 15 22, 25 12 C 38 18, 48 30, 35 50 M55 32 C 50 15, 62 8, 72 15 C 68 28, 62 38, 55 32 M68 68 C 50 62, 42 75, 50 85 C 62 80, 72 72, 68 68" />
          </svg>
        </div>
        <div className="botanical-ornament botanical-bottom-right" aria-hidden="true">
          <svg viewBox="0 0 100 100" fill="none" stroke="rgba(201, 168, 76, 0.45)" strokeWidth="1.2">
            <path d="M95 5 C 85 50, 55 85, 5 95 M65 50 C 80 62, 85 78, 75 88 C 62 82, 52 70, 65 50 M45 68 C 50 85, 38 92, 28 85 C 32 72, 38 62, 45 68 M32 32 C 50 38, 58 25, 50 15 C 38 20, 28 28, 32 32" />
          </svg>
        </div>

        {/* Vertical Side Badge */}
        <div className="vertical-elegance-badge" aria-hidden="true">
          <span className="v-text">TIMELESS ELEGANCE</span>
          <span className="v-line"></span>
          <span className="v-lotus">
            <svg viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M12 2 C12 2, 9 7, 9 11 C9 13, 10.5 14, 12 14 C13.5 14, 15 13, 15 11 C15 7, 12 2, 12 2 Z" fill="rgba(201, 168, 76, 0.2)" />
              <path d="M12 2 C12 2, 5 6, 4 10 C3 12.5, 6 14, 8.5 14 C10 14, 11 12.5, 11 11" />
              <path d="M12 2 C12 2, 19 6, 20 10 C21 12.5, 18 14, 15.5 14 C14 14, 13 12.5, 13 11" />
              <path d="M2 13 C6 13, 9 13, 12 14 C15 13, 18 13, 22 13" />
            </svg>
          </span>
        </div>

        <div className="curated-wrapper">
          <div className="curated-center-header">
            <div className="curated-eyebrow">
              <span className="c-line"></span>
              <span className="c-diamond">✦</span>
              <span className="c-text">CURATED SELECTION</span>
              <span className="c-diamond">✦</span>
              <span className="c-line"></span>
            </div>
            <h2 className="curated-title">
              Shop Handpicked <em>Sarees &amp; Jewellery</em>
            </h2>
            <p className="curated-subtitle">Timeless pieces. Thoughtfully chosen for you.</p>
          </div>

          <div className="curated-cards-dual">
            {/* Sarees Card */}
            <div
              className="curated-showcase-card"
              onClick={() => selectCategory('sarees')}
              role="button"
              tabIndex={0}
              aria-label="Explore Handpicked Sarees"
            >
              <div
                className="curated-card-bg"
                style={{
                  backgroundImage: "url('https://res.cloudinary.com/drkgkgiat/image/upload/f_auto,q_auto/v1777447204/rk_saree_banner_copy.jpg_d6mphh.jpg')"
                }}
              ></div>
              <div className="curated-card-overlay"></div>
              <div className="curated-card-inner-frame"></div>
              <div className="curated-top-badge">
                <span className="pill-dot"></span>
                <span>PURE SILK WEAVES</span>
              </div>
              <div className="curated-card-footer-box">
                <div className="curated-card-heading-row">
                  <h3 className="curated-card-title">Sarees</h3>
                  <span className="curated-card-count">100+ DESIGNS</span>
                </div>
                <p className="curated-card-desc">Grace in every drape, crafted with authentic silk textures &amp; intricate zari.</p>
                <div className="curated-cta-btn">
                  <span>EXPLORE SAREES</span>
                  <div className="cta-arrow">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Jewellery Card */}
            <div
              className="curated-showcase-card"
              onClick={() => selectCategory('imitation')}
              role="button"
              tabIndex={0}
              aria-label="Explore Handpicked Jewellery"
            >
              <div
                className="curated-card-bg"
                style={{ backgroundImage: "url('https://i.postimg.cc/cC8hrNM8/DSC01843.jpg')" }}
              ></div>
              <div className="curated-card-overlay"></div>
              <div className="curated-card-inner-frame"></div>
              <div className="curated-top-badge">
                <span className="pill-dot"></span>
                <span>ANTIQUE &amp; BRIDAL</span>
              </div>
              <div className="curated-card-footer-box">
                <div className="curated-card-heading-row">
                  <h3 className="curated-card-title">Jewellery</h3>
                  <span className="curated-card-count">TEMPLE HERITAGE</span>
                </div>
                <p className="curated-card-desc">Matte antique gold finishes &amp; regal handcrafted adornments for your moments.</p>
                <div className="curated-cta-btn">
                  <span>EXPLORE JEWELLERY</span>
                  <div className="cta-arrow">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CUSTOM BLOUSE SECTION */}
      <section className="custom-blouse-section" id="custom-blouse">
        <div className="custom-blouse-container">
          <div className="cb-header-gold">
            <span className="cb-label-gold">Designed Exclusively For You</span>
            <h2 className="cb-title-gold">Customized <em>Blouse Stitching Studio</em></h2>
            <div className="cb-decor-gold">
              <svg viewBox="0 0 100 20" width="100" height="20">
                <line x1="0" y1="10" x2="40" y2="10" stroke="#d4af37" strokeWidth="1"></line>
                <path d="M50 5 L53 10 L50 15 L47 10 Z" fill="#d4af37"></path>
                <line x1="60" y1="10" x2="100" y2="10" stroke="#d4af37" strokeWidth="1"></line>
              </svg>
            </div>
          </div>

          <div className="cb-main-grid">
            {/* Left Info */}
            <div className="cb-info-card">
              <div className="cb-badge-pill">✨ Bespoke Tailoring</div>
              <h3 className="cb-heading-text">
                Customized Blouse Stitching is Available at <span>ROKEA by RK</span>
              </h3>
              <p className="cb-description-text">
                Elevate your saree ensemble with flawlessly tailored bespoke blouse designs. Handcrafted by master artisans to fit your exact measurements, personal styling, and comfort.
              </p>

              <div className="cb-features-grid">
                <div className="cb-feature-box">
                  <span className="cb-feat-icon">📏</span>
                  <div className="cb-feat-text">
                    <strong>Perfect Custom Fit</strong>
                    <span>Tailored precisely to your body measurements</span>
                  </div>
                </div>

                <div className="cb-feature-box">
                  <span className="cb-feat-icon">✨</span>
                  <div className="cb-feat-text">
                    <strong>Bridal &amp; Designer Work</strong>
                    <span>Aari work, Zardosi, cutwork &amp; unique necklines</span>
                  </div>
                </div>

                <div className="cb-feature-box">
                  <span className="cb-feat-icon">🧵</span>
                  <div className="cb-feat-text">
                    <strong>Premium Fabrics &amp; Linings</strong>
                    <span>Finest materials with smooth, comfortable padding</span>
                  </div>
                </div>

                <div className="cb-feature-box">
                  <span className="cb-feat-icon">⏱️</span>
                  <div className="cb-feat-text">
                    <strong>Timely Delivery</strong>
                    <span>Guaranteed prompt delivery for your occasions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="cb-visual-col">
              <div className="cb-image-frame">
                <img
                  src="/blouse_thumb_1.png"
                  alt="Customized Blouse Stitching at ROKEA by RK"
                  className="cb-featured-img"
                  loading="lazy"
                  decoding="async"
                  width="800"
                  height="800"
                />
                <div className="cb-img-overlay-badge">
                  <span>✦ Master Tailored Perfection</span>
                </div>
              </div>
            </div>
          </div>

          <div className="cb-center-contact-bar">
            <a
              href="https://wa.me/917010394051?text=Hi%20ROKEA%20by%20RK%2C%20I%20am%20interested%20in%20Custom%20Blouse%20Stitching."
              target="_blank"
              rel="noopener noreferrer"
              className="cb-btn cb-btn-whatsapp"
              aria-label="WhatsApp Us for Custom Blouse"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span>WhatsApp Us</span>
            </a>

            <a href="tel:+917010394051" className="cb-btn cb-btn-phone" aria-label="Call ROKEA for Custom Blouse">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>Call: +91 70103 94051</span>
            </a>

            <a
              href="https://forms.gle/xHJ6hSpyreHVNsNc8"
              target="_blank"
              rel="noopener noreferrer"
              className="cb-btn cb-btn-order"
              aria-label="Design Your Blouse (Google Form)"
            >
              <span>Design Your Blouse →</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* 4. AI VIRTUAL STYLIST TEASER */}
      <section className="about-section ai-teaser-section" id="ai-stylist-teaser" style={{ backgroundColor: 'var(--cream)' }}>
        <div className="about-container">
          <div className="about-text">
            <span className="section-label">Innovation Meets Heritage</span>
            <h2 className="section-title">Your <em>Virtual</em> Stylist</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 15, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 24, lineHeight: 1 }}>📸</div>
                <p className="about-p" style={{ margin: 0, lineHeight: 1.5 }}>
                  <strong>Upload your photo</strong> — Our AI understands your skin tone and features to find your perfect match.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 15, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 24, lineHeight: 1 }}>✨</div>
                <p className="about-p" style={{ margin: 0, lineHeight: 1.5 }}>
                  <strong>Personalized Matching</strong> — Get handpicked recommendations tailored specifically for you.
                </p>
              </div>
            </div>
            <button className="btn-primary" style={{ marginTop: 40 }} onClick={() => { navigate('/ai-stylist'); window.scrollTo(0, 0); }}>
              Try AI Stylist Now
            </button>
          </div>
          <div className="about-visual ai-visual-wrapper">
            <div className="ai-scan-line"></div>
            <img
              src="/ai_stylist_teaser.png"
              alt="ROKEA by RK AI virtual stylist"
              style={{ borderRadius: 8, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
              loading="lazy"
              decoding="async"
              width="800"
              height="800"
            />
            <div className="ai-badge-overlay">
              <span>✦ AI POWERED</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE ROKEA */}
      <section className="premium-features-section why-choose-rokea-section" id="why-choose-us">
        <div className="why-decor-saree-corner" aria-hidden="true"></div>
        <div className="why-decor-jewel-corner" aria-hidden="true"></div>
        <div className="why-decor-botanical-corner" aria-hidden="true">
          <svg viewBox="0 0 100 100" fill="none" stroke="rgba(201, 168, 76, 0.4)" strokeWidth="1.2">
            <path d="M5 95 C 15 50, 45 15, 95 5 M35 50 C 20 38, 15 22, 25 12 C 38 18, 48 30, 35 50 M55 32 C 50 15, 62 8, 72 15 C 68 28, 62 38, 55 32 M68 68 C 50 62, 42 75, 50 85 C 62 80, 72 72, 68 68" />
          </svg>
        </div>

        <div className="features-container">
          <div className="why-header">
            <div className="why-lotus-top">
              <svg viewBox="0 0 28 20" fill="none" stroke="#C9A84C" strokeWidth="1.2">
                <path d="M14 2 C14 2, 10 9, 10 14 C10 16.5, 11.8 18, 14 18 C16.2 18, 18 16.5, 18 14 C18 9, 14 2, 14 2 Z" fill="rgba(201, 168, 76, 0.2)" />
                <path d="M14 2 C14 2, 6 8, 5 13 C4 16, 7 18, 10 18 C11.5 18, 13 16.5, 13 15" />
                <path d="M14 2 C14 2, 22 8, 23 13 C24 16, 21 18, 18 18 C16.5 18, 15 16.5, 15 15" />
                <path d="M2 17 C6 17, 10 17, 14 18 C18 17, 22 17, 26 17" />
              </svg>
            </div>
            <h2 className="why-title">
              Why Choose<br />
              <span className="why-brand">ROKEA</span>
            </h2>
            <p className="why-subtitle">Experience timeless elegance crafted with passion and perfection.</p>
          </div>

          <div className="why-cards-grid">
            {/* Card 01 */}
            <div className="why-arch-card">
              <div className="why-icon-badge">
                <svg viewBox="0 0 48 48" fill="none" stroke="#6B1C2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 10 L18 10 C18 10, 20 22, 16 38 L11 38 C14 24, 13 10, 13 10 Z" fill="rgba(107, 28, 46, 0.12)" />
                  <path d="M13 16 L18 18 M13 22 L17 24 M13 28 L16 30" />
                  <path d="M25 22 C25 28, 31 32, 35 32 C39 32, 45 28, 45 22" />
                  <circle cx="35" cy="35" r="2.5" fill="#6B1C2E" />
                  <circle cx="29" cy="32" r="1.5" fill="#6B1C2E" />
                  <circle cx="41" cy="32" r="1.5" fill="#6B1C2E" />
                </svg>
              </div>
              <div className="why-card-number">01</div>
              <h3 className="why-card-title">Premium Handpicked Sarees &amp; Jewellery</h3>
              <p className="why-card-desc">Explore handpicked sarees and jewellery selected for quality, elegance and timeless style.</p>
              <div className="why-card-divider">
                <span className="w-line"></span>
                <span className="w-diamond">◇</span>
                <span className="w-line"></span>
              </div>
            </div>

            {/* Card 02 */}
            <div className="why-arch-card">
              <div className="why-icon-badge">
                <svg viewBox="0 0 48 48" fill="none" stroke="#6B1C2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 24 C14 21, 18 20, 24 20 C27 20, 31 22, 33 24 C31 26, 28 27, 24 27 C20 27, 14 27, 10 24 Z" fill="rgba(107, 28, 46, 0.12)" />
                  <path d="M24 20 C24 17, 28 17, 30 20 M20 21 C20 18, 23 18, 25 21" />
                  <path d="M20 25 L38 25 M20 30 L38 30 M20 35 L38 35 M20 40 L38 40" />
                  <path d="M24 24 L24 42 M29 24 L29 42 M34 24 L34 42" />
                </svg>
              </div>
              <div className="why-card-number">02</div>
              <h3 className="why-card-title">Authentic Craftsmanship</h3>
              <p className="why-card-desc">Preserving heritage with exquisite details meticulously handwoven by skilled artisans.</p>
              <div className="why-card-divider">
                <span className="w-line"></span>
                <span className="w-diamond">◇</span>
                <span className="w-line"></span>
              </div>
            </div>

            {/* Card 03 */}
            <div className="why-arch-card">
              <div className="why-icon-badge">
                <svg viewBox="0 0 48 48" fill="none" stroke="#6B1C2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 16 L20 16 C22 22, 26 22, 28 16 L34 16 L38 24 L33 26 L33 34 L15 34 L15 26 L10 24 Z" fill="rgba(107, 28, 46, 0.12)" />
                  <path d="M30 38 L42 26" strokeWidth="2" />
                  <path d="M40 28 L42 26 L40 24" />
                  <path d="M27 40 C25 42, 22 39, 24 37" strokeDasharray="2 2" />
                </svg>
              </div>
              <div className="why-card-number">03</div>
              <h3 className="why-card-title">Custom Blouse Tailoring</h3>
              <p className="why-card-desc">Flawlessly tailored bespoke designs tailored specifically to elevate your unique style.</p>
              <div className="why-card-divider">
                <span className="w-line"></span>
                <span className="w-diamond">◇</span>
                <span className="w-line"></span>
              </div>
            </div>

            {/* Card 04 */}
            <div className="why-arch-card">
              <div className="why-icon-badge">
                <svg viewBox="0 0 48 48" fill="none" stroke="#6B1C2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M24 8 L37 13 C37 25, 31 34, 24 38 C17 34, 11 25, 11 13 Z" fill="rgba(107, 28, 46, 0.12)" />
                  <rect x="20" y="22" width="8" height="7" rx="1.5" fill="#6B1C2E" />
                  <path d="M22 22 V18 C22 16.9, 22.9 16, 24 16 C25.1 16, 26 16.9, 26 18 V22" />
                  <circle cx="24" cy="25" r="1" fill="#FFF" />
                </svg>
              </div>
              <div className="why-card-number">04</div>
              <h3 className="why-card-title">Secure Payments</h3>
              <p className="why-card-desc">Shop with complete peace of mind through our highly encrypted, trusted payment gateways.</p>
              <div className="why-card-divider">
                <span className="w-line"></span>
                <span className="w-diamond">◇</span>
                <span className="w-line"></span>
              </div>
            </div>

            {/* Card 05 */}
            <div className="why-arch-card">
              <div className="why-icon-badge">
                <svg viewBox="0 0 48 48" fill="none" stroke="#6B1C2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="23" cy="24" r="13" fill="rgba(107, 28, 46, 0.08)" />
                  <ellipse cx="23" cy="24" rx="6" ry="13" />
                  <path d="M10 24 H36 M13 17 H33 M13 31 H33" />
                  <path d="M12 37 C18 39, 32 37, 40 23" strokeDasharray="2 2" strokeWidth="1.2" />
                  <path d="M35 22 L41 21 L38 25 L39 27 L36 26 L34 28 L34 25 L32 24 L35 22 Z" fill="#6B1C2E" />
                </svg>
              </div>
              <div className="why-card-number">05</div>
              <h3 className="why-card-title">Worldwide Shipping</h3>
              <p className="why-card-desc">Delivering luxury to your doorstep anywhere in the world with reliable, fast shipping.</p>
              <div className="why-card-divider">
                <span className="w-line"></span>
                <span className="w-diamond">◇</span>
                <span className="w-line"></span>
              </div>
            </div>

            {/* Card 06 */}
            <div className="why-arch-card">
              <div className="why-icon-badge">
                <svg viewBox="0 0 48 48" fill="none" stroke="#6B1C2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="24" cy="18" r="6" fill="rgba(107, 28, 46, 0.12)" />
                  <path d="M15 36 C15 30, 19 28, 24 28 C29 28, 33 30, 33 36" fill="rgba(107, 28, 46, 0.12)" />
                  <path d="M15 19 C15 13.5, 19 9, 24 9 C29 9, 33 13.5, 33 19" />
                  <rect x="13" y="17" width="3" height="6" rx="1.5" fill="#6B1C2E" />
                  <rect x="32" y="17" width="3" height="6" rx="1.5" fill="#6B1C2E" />
                  <path d="M33 22 C33 26, 29 27, 27 27" />
                  <circle cx="26" cy="27" r="1.5" fill="#6B1C2E" />
                </svg>
              </div>
              <div className="why-card-number">06</div>
              <h3 className="why-card-title">Dedicated Customer Support</h3>
              <p className="why-card-desc">Providing personalized assistance to ensure your shopping experience is seamless and joyful.</p>
              <div className="why-card-divider">
                <span className="w-line"></span>
                <span className="w-diamond">◇</span>
                <span className="w-line"></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. GOOGLE REVIEWS SECTION */}
      <section className="google-reviews-section" id="reviews">
        <div className="gr-container">
          <div className="gr-header">
            <div className="gr-google-badge">
              <svg className="gr-google-icon" viewBox="0 0 48 48" width="28" height="28">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <div className="gr-badge-text">
                <div className="gr-badge-stars">
                  <span className="gr-star-score">4.9</span>
                  <span className="gr-stars">★★★★★</span>
                </div>
                <div className="gr-badge-sub">EXCELLENT • 180+ Google Reviews</div>
              </div>
            </div>

            <h2 className="gr-title">
              Clients Stories &amp; <em>Google Reviews</em>
            </h2>
            <p className="gr-subtitle">Real experiences and 5-star ratings shared by our cherished clients worldwide.</p>
          </div>

          <div className="gr-cards-grid">
            {/* Review 1 */}
            <div className="gr-card">
              <div className="gr-card-header">
                <div className="gr-avatar" style={{ background: 'linear-gradient(135deg, #1A73E8, #4285F4)' }}>R</div>
                <div className="gr-user-info">
                  <div className="gr-user-name">
                    <h4>Rahanath M.</h4>
                    <svg className="gr-verified-check" viewBox="0 0 24 24" width="14" height="14" fill="#1A73E8" title="Verified Customer">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <span className="gr-user-meta">Local Guide • 24 reviews</span>
                </div>
              </div>
              <div className="gr-card-rating">
                <div className="gr-stars-row">★★★★★</div>
                <span className="gr-review-time">3 weeks ago</span>
              </div>
              <p className="gr-review-text">
                “I bought this beautiful silk saree for my wife from ROKEA by RK, and honestly, seeing her wear it made my heart so happy. ❤ The softness, quality, and traditional elegance were amazing. I was looking for one of the <strong>best handpicked sarees in Coimbatore</strong>, and this saree was absolutely perfect. Thank you, ROKEA by RK!”
              </p>
              <div className="gr-card-footer">
                <span className="gr-posted-on">Posted on Google</span>
                <span className="gr-tag">Handpicked Silk Saree</span>
              </div>
            </div>

            {/* Review 2 */}
            <div className="gr-card">
              <div className="gr-card-header">
                <div className="gr-avatar" style={{ background: 'linear-gradient(135deg, #0F9D58, #34A853)' }}>D</div>
                <div className="gr-user-info">
                  <div className="gr-user-name">
                    <h4>Dhinesh R.</h4>
                    <svg className="gr-verified-check" viewBox="0 0 24 24" width="14" height="14" fill="#1A73E8" title="Verified Customer">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <span className="gr-user-meta">18 reviews • 5 photos</span>
                </div>
              </div>
              <div className="gr-card-rating">
                <div className="gr-stars-row">★★★★★</div>
                <span className="gr-review-time">a month ago</span>
              </div>
              <p className="gr-review-text">
                “I wanted to gift my amma something beautiful for my sister’s wedding, and this Banarasi saree was just perfect. ❤ The craftsmanship, colour, and quality were wonderful. ROKEA by RK has such a beautiful range of <strong>best saree collections in Coimbatore</strong>!”
              </p>
              <div className="gr-card-footer">
                <span className="gr-posted-on">Posted on Google</span>
                <span className="gr-tag">Banarasi Wedding Saree</span>
              </div>
            </div>

            {/* Review 3 */}
            <div className="gr-card">
              <div className="gr-card-header">
                <div className="gr-avatar" style={{ background: 'linear-gradient(135deg, #E37400, #FBBC04)' }}>K</div>
                <div className="gr-user-info">
                  <div className="gr-user-name">
                    <h4>Karthikeyani</h4>
                    <svg className="gr-verified-check" viewBox="0 0 24 24" width="14" height="14" fill="#1A73E8" title="Verified Customer">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <span className="gr-user-meta">Local Guide • 42 reviews</span>
                </div>
              </div>
              <div className="gr-card-rating">
                <div className="gr-stars-row">★★★★★</div>
                <span className="gr-review-time">2 weeks ago</span>
              </div>
              <p className="gr-review-text">
                “Honestly, I fell in love with the blouse I stitched at ROKEA by RK the moment I tried it on! ❤ The fit was perfect, the detailing was beautiful, and it made me feel so confident. If you are looking for <strong>the best blouse stitching in Coimbatore</strong>, I definitely recommend them!”
              </p>
              <div className="gr-card-footer">
                <span className="gr-posted-on">Posted on Google</span>
                <span className="gr-tag">Custom Blouse Stitching</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INSTAGRAM SECTION */}
      <section className="instagram-section" id="instagram-hub" style={{ padding: '60px 20px', background: 'var(--ivory)', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 40 }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <span className="section-label" style={{ color: 'var(--maroon)', textAlign: 'left', display: 'block' }}>Social Hub</span>
            <h2 className="section-title" style={{ marginBottom: 20, textAlign: 'left' }}>Follow Us on <em>Instagram</em></h2>
            <p style={{ color: 'var(--muted)', fontSize: 18, marginBottom: 30, lineHeight: 1.6 }}>
              Join our community of fashion lovers. Stay updated with our latest arrivals, premium collections, and style inspirations. Tag @rokeabyrk to be featured!
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 16, padding: '12px 24px' }}
              onClick={() => window.open('https://www.instagram.com/rokeabyrk/', '_blank')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
              </svg>
              Follow @rokeabyrk
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 300, textAlign: 'center' }}>
            <img src="/image.png" alt="Rokea by RK Instagram" style={{ maxWidth: '100%', height: 'auto', display: 'inline-block' }} />
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section className="faq-section" id="faq">
        <div className="faq-container">
          <div className="faq-header">
            <span className="section-label" style={{ color: 'var(--maroon)' }}>Got Questions?</span>
            <h2 className="section-title">Frequently Asked <em>Questions</em></h2>
            <div className="decorative-ornament" style={{ marginTop: 10 }}>
              <svg viewBox="0 0 100 20" width="100" height="20">
                <line x1="0" y1="10" x2="40" y2="10" stroke="var(--gold)" strokeWidth="1"></line>
                <path d="M50 5 L53 10 L50 15 L47 10 Z" fill="var(--gold)"></path>
                <line x1="60" y1="10" x2="100" y2="10" stroke="var(--gold)" strokeWidth="1"></line>
              </svg>
            </div>
          </div>

          <div className="faq-list">
            {[
              {
                q: "Which is the best handpicked saree and jewellery collection in Coimbatore?",
                a: "ROKEA by RK is renowned as one of Coimbatore's finest destinations for handpicked luxury sarees and heritage handcrafted jewellery. Located in Saibaba Colony, Coimbatore, ROKEA by RK curates exclusive bridal soft silk sarees, bespoke blouse designs, and antique matte jewellery hand-selected from master artisans across India."
              },
              {
                q: "Where can I find the best Indian traditional sarees online?",
                a: "ROKEA by RK offers a curated collection of Indian traditional sarees, including Kanjivaram/Kanjeevaram silk, Banarasi, Kerala-inspired, cotton, and wedding sarees. Each collection combines traditional craftsmanship with elegant designs for weddings, festivals, special occasions, and everyday wear."
              },
              {
                q: "Where can I buy pure silk Kanjivaram and Kanjeevaram sarees online?",
                a: "You can explore pure silk Kanjivaram and Kanjeevaram sarees online at ROKEA by RK, featuring traditional designs, rich textures, and timeless craftsmanship. They are suitable for brides, wedding guests, family celebrations, and other special occasions."
              },
              {
                q: "What are the best silk sarees and blouse designs for weddings?",
                a: "Silk sarees are a timeless choice for Indian weddings, especially for bridal and festive looks. ROKEA by RK offers elegant silk sarees along with blouse models and blouse patterns for silk sarees, ranging from classic traditional styles to contemporary designs that complement different saree looks."
              },
              {
                q: "Where can I find traditional sarees for Kerala weddings and special occasions?",
                a: "ROKEA by RK offers sarees inspired by South Indian and Kerala traditional styles, suitable for Kerala weddings, festive celebrations, family functions, and other cultural occasions. The collection focuses on elegant traditional aesthetics with contemporary styling."
              },
              {
                q: "Where can I buy Banarasi and cotton sarees for special occasions and everyday wear?",
                a: "ROKEA by RK offers curated Banarasi sarees with traditional aesthetics for weddings and special occasions, along with cotton sarees designed for comfort and elegance. Cotton sarees are suitable for everyday wear, family gatherings, festive occasions, and casual celebrations."
              }
            ].map((faq, idx) => (
              <div key={idx} className={`faq-item ${activeFaq === idx ? 'active' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(idx)}>
                  <h3>{faq.q}</h3>
                  <div className="faq-icon">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
                {activeFaq === idx && (
                  <div className="faq-answer" style={{ display: 'block' }}>
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CONTACT & CONSULTATION SECTION */}
      <section className="contact-section" id="contact">
        <div className="contact-container">
          <div className="contact-header">
            <span className="section-label" style={{ color: 'var(--maroon)' }}>Get In Touch</span>
            <h2 className="section-title">Visit Our Boutique &amp; <em>Connect With Us</em></h2>
            <p className="contact-subtitle">
              Have questions regarding our pure silk sarees, temple jewellery sets, or custom blouse stitching?
              Reach out directly or visit our flagship Coimbatore studio.
            </p>
            <div className="decorative-ornament" style={{ marginTop: 10 }}>
              <svg viewBox="0 0 100 20" width="100" height="20">
                <line x1="0" y1="10" x2="40" y2="10" stroke="var(--gold)" strokeWidth="1"></line>
                <path d="M50 5 L53 10 L50 15 L47 10 Z" fill="var(--gold)"></path>
                <line x1="60" y1="10" x2="100" y2="10" stroke="var(--gold)" strokeWidth="1"></line>
              </svg>
            </div>
          </div>

                    <div className="contact-grid">
            {/* Left Column: Boutique & Contact Info */}
            <div className="contact-info-card">
              <div className="contact-info-top">
                <span className="contact-tag">✦ STUDIO &amp; SUPPORT</span>
                <h3 className="contact-info-title">ROKEA <em>by RK</em></h3>
                <p className="contact-info-desc">
                  Experience our curated weaves and bridal collections in person or connect with our dedicated styling concierges.
                </p>
              </div>

              <div className="contact-details-list">
                {/* Address */}
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div className="contact-item-text">
                    <strong>Flagship Studio Address</strong>
                    <span>11/4, Bharathi Park 4th Cross Rd, Saibaba Colony, Coimbatore, Tamil Nadu 641011</span>
                    <a
                      href="https://maps.google.com/?q=11/4,+Bharathi+Park+4th+Cross+Rd,+Saibaba+Colony,+Coimbatore"
                      target="_blank"
                      rel="noreferrer"
                      className="contact-map-link"
                    >
                      Open in Google Maps ↗
                    </a>
                  </div>
                </div>

                {/* Phone & WhatsApp */}
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <div className="contact-item-text">
                    <strong>Phone &amp; WhatsApp</strong>
                    <a href="tel:+917010394051" className="contact-phone-val">+91 70103 94051</a>
                    <span className="contact-note">Available Mon – Sun (10:00 AM – 8:30 PM IST)</span>
                  </div>
                </div>

                {/* Email */}
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div className="contact-item-text">
                    <strong>Office Email</strong>
                    <a href="mailto:rokeabyrk@gmail.com">rokeabyrk@gmail.com</a>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Button */}
              <a
                href="https://wa.me/917010394051?text=Hi%20ROKEA%20by%20RK,%20I%20would%20like%20to%20enquire%20about%20your%20collection"
                target="_blank"
                rel="noreferrer"
                className="contact-whatsapp-btn"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.895-.799-1.5-1.786-1.676-2.087-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.502.1-.2.05-.376-.025-.526-.075-.15-.678-1.635-.929-2.239-.244-.588-.493-.509-.678-.518l-.578-.01c-.2 0-.527.075-.803.376s-1.054 1.03-1.054 2.511c0 1.482 1.079 2.912 1.23 3.113.15.2 2.124 3.243 5.145 4.548.719.311 1.28.497 1.718.636.722.23 1.378.198 1.898.12.579-.088 1.78-.728 2.03-1.431.251-.703.251-1.306.176-1.431-.075-.125-.276-.2-.577-.35z" />
                </svg>
                Chat with Stylist on WhatsApp
              </a>
            </div>

            {/* Right Column: Consultation / Enquiry Form */}
            <div className="contact-form-card">
              <div className="contact-form-header">
                <span className="contact-form-pill">✨ Priority Consultation</span>
                <h3 className="contact-form-title">Send Us an <em>Enquiry</em></h3>
                <p className="contact-form-sub">
                  Leave your details below and our bridal concierges will reach out within 2 hours.
                </p>
              </div>

              <form id="contactForm" className="contact-form" onSubmit={handleContactSubmit}>
                <div className="contact-form-row">
                  <div className="contact-input-group">
                    <label htmlFor="contactFullName">Full Name *</label>
                    <input
                      type="text"
                      id="contactFullName"
                      required
                      placeholder="Ex: Priya Sundaram"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>
                  <div className="contact-input-group">
                    <label htmlFor="contactPhoneNumber">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      id="contactPhoneNumber"
                      required
                      placeholder="+91 98765 43210"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="contact-form-row">
                  <div className="contact-input-group">
                    <label htmlFor="contactEmailAddress">Email Address</label>
                    <input
                      type="email"
                      id="contactEmailAddress"
                      placeholder="priya@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                  <div className="contact-input-group">
                    <label htmlFor="contactInterestSelect">Interested Service / Product *</label>
                    <select
                      id="contactInterestSelect"
                      required
                      value={contactService}
                      onChange={(e) => setContactService(e.target.value)}
                    >
                      <option value="Bridal Saree Consultation">Bridal Saree Consultation</option>
                      <option value="Handcrafted Temple Jewellery">Handcrafted Temple Jewellery</option>
                      <option value="Custom Blouse Stitching Studio">Custom Blouse Stitching Studio</option>
                      <option value="International Shipping & Bulk Orders">International Shipping &amp; Bulk Orders</option>
                      <option value="Studio Boutique Visit">Studio Boutique Visit</option>
                    </select>
                  </div>
                </div>

                <div className="contact-input-group">
                  <label htmlFor="contactMessageText">Your Requirements / Queries</label>
                  <textarea
                    id="contactMessageText"
                    rows="4"
                    placeholder="Tell us about your wedding date, design preferences, or requirements..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="contact-submit-btn"
                  id="contactSubmitBtn"
                  disabled={contactLoading}
                >
                  <span>{contactLoading ? 'OPENING WHATSAPP...' : 'SEND ENQUIRY VIA WHATSAPP'}</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                <p className="contact-form-footer-note">
                  ✦ 100% Confidential. We respect your privacy and never spam.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 10. NEWSLETTER */}
      <section className="newsletter">
        <span className="section-label">Stay Connected</span>
        <h2 className="section-title" style={{ color: '#fff' }}>Exclusive <em>Offers</em> Await</h2>
        <p className="newsletter-sub">Subscribe for new arrivals, bridal lookbooks &amp; member-only discounts</p>
        <form className="nl-form" onSubmit={handleNewsletterSubmit}>
          <input
            className="nl-input"
            type="email"
            placeholder="Enter your email address"
            aria-label="Enter your email address"
            required
            value={newsEmail}
            onChange={(e) => setNewsEmail(e.target.value)}
            disabled={newsLoading}
          />
          <button type="submit" className="nl-btn" disabled={newsLoading}>
            {newsLoading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      </section>
    </div>
  );
}
