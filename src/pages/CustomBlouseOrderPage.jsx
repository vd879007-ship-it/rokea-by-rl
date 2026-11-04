import React from 'react';
import { Link } from 'react-router-dom';

export default function CustomBlouseOrderPage() {
  return (
    <div className="custom-blouse-order-view" style={{ paddingTop: '100px', minHeight: '100vh', background: 'var(--ivory)' }}>
      <section className="custom-blouse-page" style={{ padding: '40px 20px 80px' }}>
        <div className="cb-container" style={{ maxWidth: 1000, margin: '0 auto' }}>
          
          <div className="cb-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div className="cb-title-container" style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <img
                src="https://static.wixstatic.com/media/9881b8_16e714ef67304ad7812d38944b0b0b16~mv2.png/v1/crop/x_0,y_92,w_5000,h_1065/fill/w_155,h_33,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/ROKEA%20horizontal%20logo%20(1).png"
                alt="Blouse"
                className="cb-blouse-icon"
                style={{ height: 40 }}
                loading="lazy"
                decoding="async"
                width="800"
                height="800"
              />
              <div>
                <span className="cb-subtitle" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--gold)', fontWeight: 600 }}>
                  Your Style, Your Blouse
                </span>
                <h1 className="cb-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', margin: '4px 0', color: 'var(--dark)' }}>
                  CUSTOM BLOUSE ORDER
                </h1>
                <p className="cb-desc" style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
                  Fill in the Google Form below to place your bespoke blouse stitching order
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 15, alignItems: 'center', flexWrap: 'wrap' }}>
              <a
                href="https://forms.gle/xHJ6hSpyreHVNsNc8"
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 12, textDecoration: 'none' }}
              >
                <span>Open in New Tab</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>

              <a
                href="https://wa.me/917010394051?text=Hi%20ROKEA%20by%20RK%2C%20I%20need%20help%20with%20Custom%20Blouse%20Order."
                target="_blank"
                rel="noreferrer"
                className="cb-help-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#fff',
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid rgba(201,168,76,0.3)',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <svg viewBox="0 0 24 24" fill="#25D366" width="24" height="24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path>
                </svg>
                <div className="cb-help-text" style={{ fontSize: 11 }}>
                  <span style={{ display: 'block', color: '#888' }}>Need Help?</span>
                  <strong style={{ display: 'block', color: '#25D366' }}>WhatsApp us</strong>
                  <span style={{ color: '#555' }}>+91 70103 94051</span>
                </div>
              </a>
            </div>
          </div>

          <div className="cb-divider" style={{ textAlign: 'center', margin: '25px 0' }}>
            <span className="cb-divider-icon" style={{ color: 'var(--gold)', fontSize: 18 }}>♦</span>
          </div>

          {/* GOOGLE FORM EMBED CONTAINER */}
          <div
            className="google-form-container"
            style={{
              width: '100%',
              margin: '20px 0',
              background: '#fff',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid rgba(201, 168, 76, 0.2)'
            }}
          >
            <iframe
              id="googleBlouseFormIframe"
              src="https://forms.gle/xHJ6hSpyreHVNsNc8"
              width="100%"
              height="1100"
              style={{ width: '100%', minHeight: 900, border: 'none', display: 'block' }}
              title="Custom Blouse Order Form"
              loading="lazy"
            >
              Loading Google Form…
            </iframe>
          </div>
        </div>
      </section>
    </div>
  );
}
