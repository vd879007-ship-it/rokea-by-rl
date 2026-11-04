import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useModal } from '../context/ModalContext';

export default function BlouseDesignsPage() {
  const navigate = useNavigate();
  const { openBlouseModal } = useModal();

  const designs = [
    {
      img: '/premium_blouse_main.png',
      name: 'Royal Maroon Zardosi',
      category: 'Bridal Collection',
      span: 'tall'
    },
    {
      img: '/blouse_thumb_1.png',
      name: 'Cream & Gold Cutwork',
      category: 'Back Neck Pattern',
      span: ''
    },
    {
      img: '/blouse_thumb_2.png',
      name: 'Beige Floral Sleeves',
      category: 'Sleeve Design',
      span: 'wide'
    },
    {
      img: '/blouse_thumb_3.png',
      name: 'Ivory Silk Neckline',
      category: 'Front Neck Pattern',
      span: ''
    },
    {
      img: '/blouse_thumb_4.png',
      name: 'Deep Maroon Cutout',
      category: 'Modern Traditional',
      span: 'tall'
    },
    {
      img: 'https://res.cloudinary.com/drkgkgiat/image/upload/f_auto,q_auto/v1777447204/rk_saree_banner_copy.jpg_d6mphh.jpg',
      name: 'Classic Gold Border',
      category: 'Silk Saree Blouse',
      span: ''
    },
    {
      img: 'https://i.postimg.cc/cC8hrNM8/DSC01843.jpg',
      name: 'Temple Jewellery Match',
      category: 'Styling Inspiration',
      span: 'wide'
    }
  ];

  return (
    <div className="blouse-designs-view" style={{ background: 'var(--ivory)', minHeight: '100vh', paddingTop: '100px' }}>
      {/* HEADER */}
      <header className="gallery-header" style={{ padding: '80px 24px 50px', textAlign: 'center', backgroundColor: 'var(--dark)', color: '#fff' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', textAlign: 'left', paddingBottom: 20 }}>
          <Link
            to="/#custom-blouse"
            className="btn-outline"
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', padding: '8px 18px', fontSize: 11, textDecoration: 'none' }}
          >
            ← Back to Home
          </Link>
        </div>
        <span className="section-label" style={{ color: 'var(--gold)' }}>Bespoke Elegance</span>
        <h1 className="section-title" style={{ color: '#fff', margin: '15px 0' }}>
          Blouse Design <em style={{ fontFamily: "'Great Vibes', cursive", color: 'var(--gold)' }}>Collection</em>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '15px auto 0', fontSize: 15, lineHeight: 1.8 }}>
          Explore our premium curation of back-neck patterns, exquisite sleeve embroideries, and luxurious hand-crafted blouse designs.
        </p>
      </header>

      {/* GALLERY */}
      <section className="gallery-container" style={{ maxWidth: 1400, margin: '0 auto', padding: '60px 24px' }}>
        <div className="masonry-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 30, gridAutoRows: 250, gridAutoFlow: 'dense' }}>
          {designs.map((d, idx) => (
            <div
              key={idx}
              className={`masonry-item ${d.span}`}
              onClick={openBlouseModal}
              style={{
                position: 'relative',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                gridRow: d.span === 'tall' ? 'span 2' : 'span 1',
                gridColumn: d.span === 'wide' ? 'span 2' : 'span 1'
              }}
            >
              <img
                src={d.img}
                alt={d.name}
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                className="masonry-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: 20
                }}
              >
                <div className="design-name" style={{ color: 'var(--gold)', fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 5 }}>
                  {d.name}
                </div>
                <div className="design-category" style={{ color: '#fff', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>
                  {d.category}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 20, color: 'var(--dark)' }}>
            Ready to create your own bespoke blouse?
          </h3>
          <div style={{ display: 'flex', gap: 15, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://forms.gle/xHJ6hSpyreHVNsNc8"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ textDecoration: 'none', padding: '14px 32px' }}
            >
              Open Custom Blouse Google Form →
            </a>
            <button
              type="button"
              className="btn-outline"
              onClick={openBlouseModal}
              style={{ padding: '14px 28px' }}
            >
              Quick Consultation Call
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
