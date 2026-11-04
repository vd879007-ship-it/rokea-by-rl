import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      {/* ═══ 1. ABOUT ROKEA SECTION HEADING ═══ */}
      <div className="ash-heading-wrap">
        <span className="ash-eyebrow">About Rokea</span>
        <h1 className="ash-title">
          Our <span className="ash-script">Story</span>
        </h1>
        <div className="ash-rule">
          <div className="ash-rule-line"></div>
          <span className="ash-rule-dot">✦ ✦ ✦</span>
          <div className="ash-rule-line"></div>
        </div>
      </div>

      {/* ═══ 2. WOVEN WITH TRADITION — OWNER INTRO ═══ */}
      <section style={{ background: 'var(--cream)', paddingTop: '80px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          {/* Back link */}
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--gold-dark)',
              fontSize: '0.82rem',
              letterSpacing: '0.06em',
              textDecoration: 'none',
              fontFamily: "'Poppins', sans-serif",
              textTransform: 'uppercase',
              marginBottom: '48px'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '15px', height: '15px' }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Home
          </Link>

          {/* Side-by-side grid */}
          <div className="about-intro-grid">
            {/* LEFT — Photo */}
            <div className="about-intro-visual">
              <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.13)', aspectRatio: '3/4', maxHeight: '560px' }}>
                <img
                  src="https://res.cloudinary.com/drkgkgiat/image/upload/v1777700737/IMG_1523.JPG_h5jbjg.jpg"
                  alt="Keerthana — Founder of ROKEA"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                  loading="lazy"
                  decoding="async"
                  width="800"
                  height="800"
                />
              </div>
              {/* Floating gold badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
                  color: '#fff',
                  padding: '11px 30px',
                  borderRadius: '50px',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.7rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 6px 22px rgba(201,168,76,0.42)'
                }}
              >
                ✦ Founder &amp; Curator
              </div>
            </div>

            {/* RIGHT — Text */}
            <div className="about-intro-text">
              <span className="section-label" style={{ display: 'block', marginBottom: '14px' }}>
                Our Heritage
              </span>

              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)',
                  color: 'var(--charcoal, #1a1a1a)',
                  lineHeight: 1.4,
                  marginBottom: '28px',
                  fontWeight: 600
                }}
              >
                Born from <em style={{ fontFamily: "'Great Vibes', cursive", fontSize: '1.4em', fontWeight: 400, fontStyle: 'normal', padding: '0 4px', color: 'var(--gold)' }}>Passion</em>.<br />
                Rooted in <em style={{ fontFamily: "'Great Vibes', cursive", fontSize: '1.4em', fontWeight: 400, fontStyle: 'normal', padding: '0 4px', color: 'var(--gold)' }}>Tradition</em>.<br />
                Made for <em style={{ fontFamily: "'Great Vibes', cursive", fontSize: '1.4em', fontWeight: 400, fontStyle: 'normal', padding: '0 4px', color: 'var(--gold)' }}>You</em>.
              </h2>

              <div className="about-gold-divider" style={{ margin: '0 0 28px' }}></div>

              <p className="about-p" style={{ lineHeight: 1.95, fontSize: '0.97rem', marginBottom: '18px' }}>
                Rokea was born from a simple but powerful belief — that every woman deserves to feel radiant, rooted, and celebrated, not just on her wedding day, but on every day she chooses to adorn herself.
              </p>
              <p className="about-p" style={{ lineHeight: 1.95, fontSize: '0.97rem', marginBottom: '22px' }}>
                Founded by <strong>Keerthana</strong>, Rokea began as a heartfelt curation project — a personal mission to make heritage-inspired fashion accessible, meaningful, and modern.
              </p>

              {/* Founder Quote */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(201,168,76,0.07), rgba(201,168,76,0.03))',
                  borderLeft: '3px solid var(--gold)',
                  borderRadius: '0 12px 12px 0',
                  padding: '22px 24px 20px',
                  marginBottom: '32px',
                  position: 'relative'
                }}
              >
                <p className="about-p" style={{ fontStyle: 'italic', lineHeight: 1.9, fontSize: '0.93rem', margin: '0 0 14px', color: 'var(--charcoal, #2a2a2a)' }}>
                  I started Rokea because I wanted every woman — regardless of her budget or background — to have access to jewellery and sarees that make her feel like herself, at her finest. India has one of the most extraordinary traditions of adornment in the world. I want Rokea to be the bridge between that heritage and the modern woman who wears it with pride — and now, with our AI Virtual Stylist, I want her to walk into that heritage knowing exactly which pieces were made for her.
                </p>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold-dark)', fontWeight: 600 }}>
                  —&nbsp;Keerthana, Founder, Rokea
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. WHAT ROKEA OFFERS ═══ */}
      <section id="about" style={{ background: 'var(--cream)', padding: '60px 24px 100px', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          {/* Section heading with Round Badge */}
          <div className="offer-header-wrapper">
            <div className="offer-round-badge">
              <img
                src="https://res.cloudinary.com/drkgkgiat/image/upload/v1778566030/Crafted_to_be_chosen_20260504_165516_0000_zugixn.png"
                alt="Rokea Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
                decoding="async"
                width="800"
                height="800"
              />
            </div>
            <div style={{ textAlign: 'center', maxWidth: '560px', position: 'relative', zIndex: 1 }}>
              <span className="section-label" style={{ display: 'block', marginBottom: '12px' }}>
                What We Offer
              </span>
              <h2 className="section-title" style={{ marginBottom: '16px' }}>
                What Rokea <em style={{ fontFamily: "'Great Vibes', cursive", fontSize: '1.4em', fontWeight: 400, fontStyle: 'normal', color: 'var(--gold)', padding: '0 6px' }}>Offers</em>
              </h2>
              <p className="about-p" style={{ margin: '0 auto', fontSize: '0.97rem', lineHeight: 1.85 }}>
                Rokea is a premium online boutique specialising in two timeless categories:
              </p>
            </div>
          </div>

          <div className="offer-grid">
            {/* Sarees */}
            <div className="offer-card">
              <div className="offer-card-corner"></div>
              <div className="offer-card-icon">🥻</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.35rem', color: 'var(--gold-dark)', marginBottom: '14px' }}>
                Exquisite Sarees
              </h3>
              <p className="about-p" style={{ lineHeight: 1.9, margin: 0, fontSize: '0.95rem' }}>
                From the golden weaves of <strong>Kanjivaram</strong> and the breezy elegance of <strong>Organza</strong> to festive silks and contemporary drapes, every saree at Rokea is handpicked for its quality, character, and cultural story. These are not mass-produced pieces — they are thoughtful selections from trusted weavers and artisans who pour their craft into every thread.
              </p>
            </div>

            {/* Jewellery */}
            <div className="offer-card">
              <div className="offer-card-corner"></div>
              <div className="offer-card-icon">💎</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.35rem', color: 'var(--gold-dark)', marginBottom: '14px' }}>
                Premium Imitation Jewellery
              </h3>
              <p className="about-p" style={{ lineHeight: 1.9, margin: 0, fontSize: '0.95rem' }}>
                Where heritage meets everyday wearability. Featuring <strong>Temple, Kundan, Polki, Meenakari, Jadau</strong>, and South Indian bridal sets alongside minimalist pearls, zircon pieces, and everyday essentials — each piece is handcrafted to mirror the magnificence of fine jewellery, without the heavy price. <em>Because luxury should never be a barrier to beauty.</em>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. THE ROKEA DIFFERENCE ═══ */}
      <section style={{ background: 'var(--ivory)', padding: '90px 24px', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', textAlign: 'center' }}>
          <span className="section-label" style={{ display: 'block', marginBottom: '10px' }}>
            Our Promise
          </span>
          <h2 className="section-title" style={{ marginBottom: '12px' }}>
            The Rokea <em style={{ fontFamily: "'Great Vibes', cursive", fontSize: '1.4em', fontWeight: 400, fontStyle: 'normal', color: 'var(--gold)', padding: '0 6px' }}>Difference</em>
          </h2>
          <p className="about-p" style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
            Every piece in the Rokea collection is:
          </p>
          <div className="diff-grid">
            <div className="diff-badge">
              <div className="diff-badge-num">01</div>
              <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>🫶</div>
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: 'var(--gold-dark)', marginBottom: '10px' }}>
                Handpicked
              </h4>
              <p className="about-p" style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.75 }}>
                Personally curated by Keerthana with an eye for quality, authenticity, and elegance
              </p>
            </div>

            <div className="diff-badge">
              <div className="diff-badge-num">02</div>
              <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>✂️</div>
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: 'var(--gold-dark)', marginBottom: '10px' }}>
                Handcrafted
              </h4>
              <p className="about-p" style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.75 }}>
                Made with skilled craftsmanship that honours traditional techniques
              </p>
            </div>

            <div className="diff-badge">
              <div className="diff-badge-num">03</div>
              <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>✨</div>
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: 'var(--gold-dark)', marginBottom: '10px' }}>
                Exclusively Collected
              </h4>
              <p className="about-p" style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.75 }}>
                Part of a carefully limited selection, not mass-produced inventory
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 5. MEET YOUR AI VIRTUAL STYLIST ═══ */}
      <section style={{ background: 'var(--cream)', padding: '90px 24px', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto', textAlign: 'center' }}>
          <span className="section-label" style={{ display: 'block', marginBottom: '10px' }}>
            Powered by AI
          </span>
          <h2 className="section-title" style={{ marginBottom: '12px' }}>
            Meet Your AI Virtual <em style={{ fontFamily: "'Great Vibes', cursive", fontSize: '1.4em', fontWeight: 400, fontStyle: 'normal', color: 'var(--gold)', padding: '0 6px' }}>Stylist</em> ✨
          </h2>
          <p className="about-p" style={{ maxWidth: '540px', margin: '0 auto 16px', textAlign: 'center' }}>
            How it works:
          </p>
          <div className="ai-steps">
            <div className="ai-step">
              <div className="ai-step-number">1</div>
              <span className="ai-step-icon">🤳</span>
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: 'var(--gold-dark)', marginBottom: '8px' }}>
                Upload Your Photo
              </h4>
              <p className="about-p" style={{ margin: 0, fontSize: '0.87rem', lineHeight: 1.7 }}>
                A simple selfie or portrait is all it takes
              </p>
            </div>

            <div className="ai-step">
              <div className="ai-step-number">2</div>
              <span className="ai-step-icon">🤖</span>
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: 'var(--gold-dark)', marginBottom: '8px' }}>
                AI Styling Analysis
              </h4>
              <p className="about-p" style={{ margin: 0, fontSize: '0.87rem', lineHeight: 1.7 }}>
                Our AI reads your unique tones and features to match you with curated picks
              </p>
            </div>

            <div className="ai-step">
              <div className="ai-step-number">3</div>
              <span className="ai-step-icon">💫</span>
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: 'var(--gold-dark)', marginBottom: '8px' }}>
                Personalised Recommendations
              </h4>
              <p className="about-p" style={{ margin: 0, fontSize: '0.87rem', lineHeight: 1.7 }}>
                Receive curated sarees and jewellery that complement your look
              </p>
            </div>
          </div>

          <p className="about-p" style={{ maxWidth: '620px', margin: '0 auto 36px', fontStyle: 'italic', fontSize: '0.97rem', lineHeight: 1.85, color: 'var(--text)' }}>
            No more uncertainty. No more second-guessing. Just effortless, confident style — rooted in tradition, guided by technology.
          </p>

          <Link to="/ai-stylist" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '15px 44px', fontSize: '0.9rem', letterSpacing: '0.08em' }}>
            Try the AI Stylist →
          </Link>
        </div>
      </section>

      {/* ═══ 6. HOW WE SERVE YOU ═══ */}
      <div className="serve-dark">
        <div style={{ maxWidth: '740px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span className="section-label" style={{ display: 'block', marginBottom: '16px', color: 'rgba(255,255,255,0.5)' }}>
            For Every Woman
          </span>
          <span className="serve-quote">How We Serve You</span>
          <div className="about-gold-divider" style={{ margin: '0 auto 32px' }}></div>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1rem', lineHeight: 2, color: 'rgba(255,255,255,0.78)', fontWeight: 300 }}>
            Whether you're a <strong style={{ fontWeight: 500, color: 'var(--gold)' }}>bride</strong> searching for your dream bridal set, a <strong style={{ fontWeight: 500, color: 'var(--gold)' }}>working woman</strong> curating her festive wardrobe, or someone discovering the joy of Indian adornment for the first time — Rokea is designed to serve you. From our handpicked collection to our AI-powered styling experience, every touchpoint is crafted with care, so you always feel <em style={{ color: 'var(--gold)' }}>seen, celebrated, and beautifully dressed.</em>
          </p>
          <div style={{ marginTop: '44px' }}>
            <Link to="/collections" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '15px 44px', fontSize: '0.9rem', letterSpacing: '0.08em' }}>
              Explore the Collection →
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ 7. BRAND TAGLINE STRIP ═══ */}
      <div style={{ background: 'linear-gradient(135deg,#0e0500 0%,#1e0c00 50%,#0e0500 100%)', padding: '64px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Radial glow */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%,rgba(201,168,76,0.12) 0%,transparent 65%)', pointerEvents: 'none' }}></div>
        {/* Decorative dots */}
        <div style={{ position: 'absolute', top: '50%', left: '10%', transform: 'translateY(-50%)', color: 'rgba(201,168,76,0.2)', fontSize: '0.6rem', letterSpacing: '6px' }}>✦ ✦ ✦</div>
        <div style={{ position: 'absolute', top: '50%', right: '10%', transform: 'translateY(-50%)', color: 'rgba(201,168,76,0.2)', fontSize: '0.6rem', letterSpacing: '6px' }}>✦ ✦ ✦</div>
        {/* Tagline */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.72rem', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '16px' }}>
            The Rokea Signature
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.4rem,4vw,2.4rem)', fontWeight: 600, lineHeight: 1.4, margin: 0, color: 'var(--gold)' }}>
            Rokea.&nbsp;&nbsp;Handpicked Heritage.&nbsp;&nbsp;Made for Every Woman.
          </h2>
          <div style={{ width: '48px', height: '1px', background: 'linear-gradient(to right,transparent,rgba(201,168,76,0.6),transparent)', margin: '24px auto 0' }}></div>
        </div>
      </div>
    </div>
  );
}
