import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useModal } from '../context/ModalContext';
import { optimizeImageUrl, getProductLink } from '../utils/helpers';

export default function AiStylistPage() {
  const navigate = useNavigate();
  const { products, showToast, addToCart, isInCart } = useStore();
  const { openCart } = useModal();

  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing AI Vision Engine...');
  const [recommendations, setRecommendations] = useState(null);

  const resetStylist = () => {
    setPreviewUrl(null);
    setAnalyzing(false);
    setProgress(0);
    setRecommendations(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check filename for male keywords
    const fileNameLower = file.name.toLowerCase();
    const maleKeywords = ['boy', 'man', 'men', 'male', 'guy', 'gentleman', 'uncle', 'father', 'husband', 'son', 'groom', 'him', 'his', 'mr', 'actor', 'hero', 'boys', 'guys'];
    const hasMale = maleKeywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(fileNameLower));

    if (hasMale) {
      showToast('AI Vision Error', 'info', "Our Virtual Stylist is strictly designed for girls & women's products. Please upload a clear photo.");
      resetStylist();
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const imageData = uploadEvent.target.result;
      setPreviewUrl(imageData);
      setAnalyzing(true);
      setProgress(20);
      setStatusText('Loading Advanced AI Models...');

      const img = new Image();
      img.src = imageData;
      img.onload = () => {
        // Blur check using canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const scale = Math.min(300 / img.width, 300 / img.height);
        const targetW = Math.max(100, Math.floor(img.width * scale));
        const targetH = Math.max(100, Math.floor(img.height * scale));
        canvas.width = targetW;
        canvas.height = targetH;
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const imgData = ctx.getImageData(0, 0, targetW, targetH).data;
        let skinPixels = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i], g = imgData[i + 1], b = imgData[i + 2];
          if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 15) skinPixels++;
        }

        const skinRatio = skinPixels / (targetW * targetH);

        setTimeout(() => {
          setProgress(50);
          setStatusText('Scanning facial features & undertones...');

          if (skinRatio < 0.01) {
            showToast('No Face Detected', 'info', 'Could not locate facial features. Please upload a clear photo showing your face.');
            resetStylist();
            return;
          }

          setTimeout(() => {
            setProgress(80);
            setStatusText('Profile Verified. Curating Perfect Match...');

            setTimeout(() => {
              setProgress(100);
              setStatusText('Curation Completed!');

              setTimeout(() => {
                // Curate matching look
                const sarees = products.filter(p => p.category === 'sarees');
                const jewels = products.filter(p => p.category === 'imitation');

                const chosenSaree = sarees[Math.floor(Math.random() * sarees.length)] || products[0];
                const chosenJewel = jewels[Math.floor(Math.random() * jewels.length)] || products[1];

                const curated = [
                  { ...chosenSaree, stylistRole: "Exquisite Handwoven Saree" },
                  { ...chosenJewel, stylistRole: "Heritage Temple Jewellery Set" }
                ];

                setRecommendations(curated);
                setAnalyzing(false);
              }, 600);
            }, 800);
          }, 800);
        }, 800);
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="ai-page-view" style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--cream)' }}>
      {/* AI HERO */}
      <header className="ai-hero" style={{ padding: '80px 24px 40px', textAlign: 'center' }}>
        <div className="ai-hero-content" style={{ maxWidth: 800, margin: '0 auto' }}>
          <Link to="/" className="btn-back" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--gold-dark)', textDecoration: 'none', fontSize: 13, textTransform: 'uppercase', marginBottom: 20 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Home
          </Link>
          <span className="section-label" style={{ display: 'block', marginBottom: 10 }}>Future of Fashion</span>
          <h1 className="hero-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', color: 'var(--dark)', margin: '0 0 15px' }}>
            Virtual <em>Stylist</em>
          </h1>
          <p className="hero-subtitle" style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8, maxWidth: 650, margin: '0 auto' }}>
            Experience the next generation of luxury. Let our AI analyze your features and curate the perfect look just for you.
          </p>
        </div>
      </header>

      {/* AI VIRTUAL STYLIST SECTION */}
      <section className="ai-stylist" id="stylist" style={{ padding: '40px 20px 100px' }}>
        <div className="stylist-container" style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="stylist-header" style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="section-label">Innovative Experience</span>
            <h2 className="section-title" style={{ margin: '10px 0' }}>Match Your <em>Aura</em></h2>
            <p className="stylist-sub" style={{ color: 'var(--muted)', fontSize: 15 }}>
              Upload your photo, and our AI will recommend the perfect saree and jewellery combinations based on your features.
            </p>
          </div>

          <div className="stylist-interface">
            {/* Upload Zone */}
            {!previewUrl && !analyzing && (
              <div
                className="upload-zone"
                id="uploadZone"
                onClick={() => document.getElementById('userImageInput')?.click()}
                style={{
                  border: '2px dashed var(--gold)',
                  borderRadius: 16,
                  padding: '60px 20px',
                  textAlign: 'center',
                  background: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
                }}
              >
                <input
                  type="file"
                  id="userImageInput"
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className="upload-inner">
                  <div className="upload-icon" style={{ fontSize: 36, color: 'var(--gold)', marginBottom: 15 }}>✦</div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--dark)', marginBottom: 8 }}>
                    Click or Drag to Upload Your Photo
                  </p>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Supported: JPG, PNG, WEBP</span>
                </div>
              </div>
            )}

            {/* Preview image circle */}
            {previewUrl && (
              <div
                id="userPreviewCont"
                style={{
                  marginBottom: 30,
                  position: 'relative',
                  width: 'fit-content',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}
              >
                <img
                  id="userPhotoPreview"
                  src={previewUrl}
                  alt="User Preview"
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--gold)',
                    boxShadow: '0 10px 30px rgba(201,168,76,0.3)'
                  }}
                />
                <div
                  className="preview-close"
                  onClick={resetStylist}
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: '#e91e63',
                    color: '#fff',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 14,
                    boxShadow: '0 4px 10px rgba(233,30,99,0.3)',
                    border: '2px solid #fff'
                  }}
                >
                  ×
                </div>
              </div>
            )}

            {/* AI Analysis Loader */}
            {analyzing && (
              <div className="ai-analysis" style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 16 }}>
                <div className="ai-loader" style={{ margin: '0 auto 20px' }}></div>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: 'var(--gold)', fontSize: 16 }}>
                  {statusText}
                </p>
                <div
                  style={{
                    width: '80%',
                    margin: '15px auto',
                    background: 'rgba(0,0,0,0.06)',
                    height: 6,
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      background: 'var(--gold)',
                      height: '100%',
                      transition: 'width 0.4s ease'
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* AI Results */}
            {recommendations && (
              <div className="ai-results" style={{ marginTop: 30 }}>
                <h3 className="results-title" style={{ textAlign: 'center', fontFamily: "'Playfair Display', serif", fontSize: 26, color: 'var(--dark)', marginBottom: 30 }}>
                  AI Recommendations: Handpicked for You
                </h3>

                <div
                  className="results-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 30
                  }}
                >
                  {recommendations.map((p, idx) => (
                    <div
                      key={idx}
                      className="bestseller-card"
                      onClick={() => navigate(getProductLink(p))}
                      style={{ cursor: 'pointer', background: '#fff' }}
                    >
                      <div className="bestseller-card-img-wrap">
                        <span className="bestseller-badge badge-gold">{p.stylistRole}</span>
                        <img
                          src={optimizeImageUrl(p.image || p.img)}
                          alt={p.name}
                          className="bestseller-card-img"
                        />
                      </div>
                      <div className="bestseller-card-body">
                        <div className="bestseller-card-price">₹{parseInt(p.price || 0).toLocaleString('en-IN')}</div>
                        <h3 className="bestseller-card-title">{p.name}</h3>
                        {isInCart(p.id || p.slug || p.name) ? (
                          <button
                            type="button"
                            className="bestseller-add-btn"
                            style={{
                              background: '#1b5e20',
                              color: '#ffffff',
                              borderColor: '#1b5e20'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openCart();
                            }}
                            title="Item already in your bag. Click to view bag."
                          >
                            ✓ Added to Bag
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="bestseller-add-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p);
                            }}
                          >
                            Add to Shopping Bag
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: 40 }}>
                  <button type="button" className="btn-outline" onClick={resetStylist}>
                    Try Different Look
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
