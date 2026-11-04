import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useModal } from '../context/ModalContext';
import { optimizeImageUrl, getProductLink } from '../utils/helpers';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sliderRef = useRef(null);

  const idQuery = searchParams.get('id') || searchParams.get('slug');
  const { products, addToCart, addToWishlist, wishlist, isInCart, currentUser } = useStore();
  const { openShare, openCheckout, openCart } = useModal();

  // Find product by slug or id or name
  const toSlug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const searchKey = String(slug || idQuery || '').trim().toLowerCase();

  const product = products.find(p => {
    if (!searchKey) return false;
    return (
      String(p.id).trim().toLowerCase() === searchKey ||
      (p.slug && p.slug.toLowerCase() === searchKey) ||
      (p.name && toSlug(p.name) === searchKey) ||
      (p.name && p.name.toLowerCase() === searchKey)
    );
  }) || products[0];

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('desc'); // 'desc' or 'care'

  const inCart = product ? (isInCart ? isInCart(product.id || product.slug || product.name) : false) : false;

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImgIndex(0);
    setActiveTab('desc');
  }, [slug, idQuery, product?.id]);

  // Open cart drawer if customer arrived from email link with ?openBag=true or ?cart=open
  useEffect(() => {
    if (searchParams.get('openBag') === 'true' || searchParams.get('cart') === 'open') {
      const timer = setTimeout(() => {
        if (typeof openCart === 'function') openCart();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, openCart]);

  if (!product) {
    return (
      <section className="product-details-section">
        <div className="featured-inner" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--dark)' }}>Product Not Found</h2>
          <p style={{ marginTop: 15, color: '#777' }}>The requested luxury creation could not be found.</p>
          <Link to="/collections" className="btn-primary" style={{ marginTop: 25, display: 'inline-block' }}>
            Explore Collections
          </Link>
        </div>
      </section>
    );
  }

  // Handle product images
  const extraImgs = Array.isArray(product.extraImages)
    ? product.extraImages
    : (typeof product.extraImages === 'string' ? product.extraImages.split(',').map(s => s.trim()).filter(Boolean) : []);

  const legacyImgs = Array.isArray(product.images)
    ? product.images
    : (typeof product.images === 'string' ? product.images.split(',').map(s => s.trim()).filter(Boolean) : []);

  const allImages = Array.from(new Set([
    product.image || product.img,
    ...extraImgs,
    ...legacyImgs
  ].filter(Boolean)));

  const imagesList = allImages.length > 0 ? allImages : [product.image || product.img].filter(Boolean);
  const mainImageUrl = imagesList[activeImgIndex] || product.image || product.img;

  const isOutOfStock = product.stock === 'Out of Stock';
  const displayPrice = parseInt(product.price || 0, 10);
  const isJewellery = (product.category || '').toLowerCase().includes('jewel') || (product.category || '').toLowerCase().includes('imitation');
  const inWishlist = wishlist && wishlist.some(w => String(w.id) === String(product.id));

  // Related products
  let relatedProducts = products.filter(p => p.id != product.id && (p.category || '').toLowerCase() === (product.category || '').toLowerCase());
  if (relatedProducts.length < 5) {
    relatedProducts = products.filter(p => p.id != product.id);
  }

  // 1. Direct Description from Firebase without any artificial line filtering
  const fullDescription = product.description || "Exquisite handpicked luxury creation from ROKEA by RK.";

  // 2. Dynamic Product Specifications Extraction directly from Firebase
  const getProductSpecs = (p) => {
    const specs = [];
    const seen = new Set();

    const isCareKey = (key) => {
      const k = String(key).toLowerCase();
      return k.includes('clean') || k.includes('wash') || k.includes('iron') || k.includes('stor') ||
             k.includes('moisture') || k.includes('perfume') || k.includes('chemical') ||
             k.includes('handling') || k.includes('longevity') || k.includes('drying') ||
             k.includes('care & safety') || k.includes('care & storage') || k.includes('care');
    };

    const addSpec = (label, value) => {
      if (!label || !value) return;
      const cleanLabel = String(label).trim().replace(/^[✦•\-\*]\s*/, '').replace(/:$/, '').trim();
      const cleanVal = String(value).trim();
      if (!cleanVal || cleanVal.toLowerCase() === 'undefined' || cleanVal.toLowerCase() === 'null') return;
      if (isCareKey(cleanLabel)) return; // belongs to Care Tab
      const lower = cleanLabel.toLowerCase();
      if (lower === 'category') {
        if (seen.has('type') || seen.has('product type') || seen.has('saree type')) return;
      }
      if (seen.has(lower)) return;
      seen.add(lower);
      specs.push({ label: cleanLabel, value: cleanVal });
    };

    // A. From product.details object
    if (p.details && typeof p.details === 'object' && !Array.isArray(p.details)) {
      Object.entries(p.details).forEach(([k, v]) => addSpec(k, v));
    }

    // B. From product.productDetails string
    if (typeof p.productDetails === 'string') {
      p.productDetails.split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx !== -1) addSpec(line.substring(0, idx), line.substring(idx + 1));
      });
    }

    // C. From product.productCare string (where many saree specs are saved in Firebase)
    if (typeof p.productCare === 'string') {
      p.productCare.split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx !== -1) addSpec(line.substring(0, idx), line.substring(idx + 1));
      });
    }

    // D. Direct top-level fields
    const directFields = [
      { key: 'productType', label: 'Product Type' },
      { key: 'category', label: 'Category' },
      { key: 'material', label: 'Material' },
      { key: 'color', label: 'Colour' },
      { key: 'design', label: 'Design' },
      { key: 'style', label: 'Style' },
      { key: 'occasion', label: 'Occasion' },
      { key: 'stoneDetails', label: 'Stone Details' },
      { key: 'setIncludes', label: 'Set Includes' },
      { key: 'finish', label: 'Finish' },
      { key: 'pairing', label: 'Pairing' },
      { key: 'idealFor', label: 'Ideal For' },
      { key: 'shipment', label: 'Shipment' }
    ];
    directFields.forEach(({ key, label }) => {
      if (p[key]) addSpec(label, p[key]);
    });

    // Fallback if no specs found at all
    if (specs.length === 0) {
      if (isJewellery) {
        addSpec('Type', 'Handcrafted Jewellery');
        addSpec('Style', 'Antique Temple Motif');
        addSpec('Ideal For', 'Women, Brides, Classical Dancers');
        addSpec('Occasion', 'Wedding, Festival & Traditional Wear');
      } else {
        addSpec('Type', p.category || 'Soft Silk Saree');
        addSpec('Style', 'Traditional Indian Handloom');
        addSpec('Ideal For', 'Women');
        addSpec('Occasion', 'Wedding, Festival & Traditional Wear');
      }
    }

    return specs;
  };

  const productSpecs = getProductSpecs(product);

  // 3. Dynamic Product Care Tips Extraction directly from Firebase
  const getProductCareItems = (p) => {
    const careList = [];
    const seen = new Set();

    const addCare = (itemStr) => {
      if (!itemStr) return;
      const clean = itemStr.replace(/^[✦•\-\*]\s*/, '').trim();
      if (!clean || clean.toUpperCase() === 'CARE & SAFETY' || clean.toUpperCase() === 'CARE & STORAGE' || clean.toUpperCase() === 'CARE & STORAGE INSTRUCTIONS') return;
      const lower = clean.toLowerCase();
      if (seen.has(lower)) return;
      seen.add(lower);
      careList.push(clean);
    };

    // Check productCare string for care instructions
    if (typeof p.productCare === 'string') {
      const lines = p.productCare.split('\n');
      lines.forEach(l => {
        const lower = l.toLowerCase();
        if (lower.includes('clean') || lower.includes('wash') || lower.includes('iron') || lower.includes('stor') ||
            lower.includes('moisture') || lower.includes('perfume') || lower.includes('chemical') ||
            lower.includes('handling') || lower.includes('longevity') || lower.includes('stone care') || lower.includes('dry')) {
          addCare(l);
        }
      });
    }

    // Check seoFaq for care instruction answer
    if (careList.length === 0 && p.seoFaq) {
      try {
        const faqs = typeof p.seoFaq === 'string' ? JSON.parse(p.seoFaq) : p.seoFaq;
        const careFaq = Array.isArray(faqs) && faqs.find(f => (f.question || '').toLowerCase().includes('care'));
        if (careFaq && careFaq.answer) {
          careFaq.answer.split('\n').forEach(l => addCare(l));
        }
      } catch(e) {}
    }

    // Fallback if none found
    if (careList.length === 0) {
      if (isJewellery) {
        addCare('Cleaning: Wipe gently with a soft, dry cloth after each use. Avoid water, soap, or chemical cleaners.');
        addCare('Storage: Store in a zip-lock pouch or airtight jewellery box to prevent tarnishing and dust accumulation.');
        addCare('Avoid Moisture: Do not wear while bathing, swimming, or during heavy perspiration.');
        addCare('Perfume & Chemicals: Apply perfume and hairspray before wearing. Keep jewellery away from cosmetics.');
        addCare('Handling: Handle gently; avoid bending, dropping, or pulling on delicate stone settings.');
        addCare('Longevity Tip: Occasional light polish with a soft cloth keeps the finish bright.');
      } else {
        addCare('Wash Care: Hand wash or dry clean in cold water using mild detergent to preserve texture.');
        addCare('Storage: Store neatly folded inside breathable muslin cloth or cotton saree bags.');
        addCare('Drying: Dry in shade. Avoid direct sunlight to prevent colour fading.');
        addCare('Ironing: Iron on low-to-medium heat with a protective cotton cloth over the zari.');
        addCare('Handling: Protect borders and pallu motifs from sharp edges and rough surfaces.');
        addCare('Longevity Tip: Refold the saree along different crease lines periodically.');
      }
    }

    return careList;
  };

  const careItems = getProductCareItems(product);

  const getSpecIcon = (label) => {
    const l = (label || '').toLowerCase();
    if (l.includes('type') || l.includes('cat')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" /></svg>;
    }
    if (l.includes('material') || l.includes('fabric')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
    }
    if (l.includes('colo')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /></svg>;
    }
    if (l.includes('design') || l.includes('motif') || l.includes('pattern')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /></svg>;
    }
    if (l.includes('border') || l.includes('finish') || l.includes('zari')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>;
    }
    if (l.includes('style')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>;
    }
    if (l.includes('stone') || l.includes('gem') || l.includes('pearl')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="6 2 18 2 22 8 12 22 2 8 6 2" /></svg>;
    }
    if (l.includes('set') || l.includes('includes')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
    }
    if (l.includes('pairing') || l.includes('match') || l.includes('look')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
    }
    if (l.includes('ideal') || l.includes('for') || l.includes('gender')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    }
    if (l.includes('occasion')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    }
    if (l.includes('ship') || l.includes('dispatch')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
    }
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
  };

  const getCareIcon = (title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('water') || t.includes('moisture') || t.includes('wash') || t.includes('clean') || t.includes('dry')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
    }
    if (t.includes('stor') || t.includes('bag') || t.includes('fold')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>;
    }
    if (t.includes('perfume') || t.includes('chemical')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M10 2v4M14 2v4M6 10v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2z"/></svg>;
    }
    if (t.includes('iron')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line></svg>;
    }
    if (t.includes('handl')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>;
    }
    if (t.includes('longevity') || t.includes('tip') || t.includes('stone')) {
      return <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
    }
    return <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (inCart) {
      openCart();
      return;
    }
    addToCart(product);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    if (!currentUser || (!currentUser.uid && !currentUser.isAdmin)) {
      // Prompt sign in immediately
      addToCart(product);
      return;
    }
    if (!inCart) {
      const added = addToCart(product);
      if (!added) return;
    }
    openCheckout();
  };

  const scrollSlider = (dir) => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 320 * dir, behavior: 'smooth' });
    }
  };

  return (
    <div className="product-page">
      {/* PRODUCT DETAILS SECTION */}
      <section className="product-details-section">
        <div className="featured-inner" style={{ maxWidth: 1300, margin: '0 auto', padding: '0 20px' }}>

          {/* Breadcrumb Navigation */}
          <div style={{ marginBottom: 25, fontSize: 13, color: '#888' }}>
            <Link to="/" style={{ color: '#888', textDecoration: 'none' }}>Home</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <Link
              to={`/collections?category=${isJewellery ? 'imitation' : 'sarees'}`}
              style={{ color: '#888', textDecoration: 'none' }}
            >
              {isJewellery ? 'Jewellery' : 'Sarees'}
            </Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{(product.name || '').toUpperCase()}</span>
          </div>

          <div className="product-container">
            {/* Left Side: Gallery & Badges */}
            <div className="product-gallery-container">
              <div className="product-images-side">
                {/* Thumbnails */}
                <div className="product-thumbs" id="detailThumbnails">
                  {imagesList.map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={optimizeImageUrl(imgUrl)}
                      alt={`${product.name} thumb ${idx + 1}`}
                      className={`thumb-item ${activeImgIndex === idx ? 'active' : ''}`}
                      onClick={() => setActiveImgIndex(idx)}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                        e.target.style.background = 'linear-gradient(135deg,#f0e6d3,#faf6ef)';
                      }}
                    />
                  ))}
                </div>

                {/* Main Visual */}
                <div className="product-main-visual" id="mainVisualCont">
                  <img
                    id="detailMainImg"
                    className="img-loaded"
                    src={optimizeImageUrl(mainImageUrl)}
                    alt={`${product.name} - ${product.category || 'Luxury'} | ROKEA by RK`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                      e.target.style.background = 'linear-gradient(135deg,#f0e6d3,#faf6ef)';
                    }}
                  />

                  {/* Floating Share Button */}
                  <div
                    className="product-share-floating"
                    onClick={() => openShare(product)}
                    title="Share this product"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="trust-badges">
                <div className="trust-badge">
                  <div className="trust-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="8" r="6"></circle>
                      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"></path>
                    </svg>
                  </div>
                  <div className="trust-text">
                    PREMIUM QUALITY<br />{isJewellery ? 'CRAFTSMANSHIP' : 'SILK'}
                  </div>
                </div>
                <div className="trust-badge">
                  <div className="trust-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                      <path d="M3 9h18M9 21V9"></path>
                    </svg>
                  </div>
                  <div className="trust-text">
                    TRADITIONAL<br />{isJewellery ? 'ARTISANS' : 'WEAVING'}
                  </div>
                </div>
                <div className="trust-badge">
                  <div className="trust-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                  </div>
                  <div className="trust-text">
                    TRUSTED<br />AUTHENTICITY
                  </div>
                </div>
                <div className="trust-badge">
                  <div className="trust-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                  <div className="trust-text">
                    SECURE<br />PACKAGING
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Info Panel */}
            <div className="product-info-panel">
              <h1 className="product-title-big" id="detailName">
                {product.name}
              </h1>

              <div className="product-price-big" id="detailPrice">
                ₹{displayPrice.toLocaleString('en-IN')}
              </div>

              {/* Tabs Navigation */}
              <div className="product-tabs-nav">
                <button
                  type="button"
                  className={`tab-nav-btn ${activeTab === 'desc' ? 'active' : ''}`}
                  id="tabDescBtn"
                  onClick={() => setActiveTab('desc')}
                >
                  Description
                </button>
                <button
                  type="button"
                  className={`tab-nav-btn ${activeTab === 'care' ? 'active' : ''}`}
                  id="tabCareBtn"
                  onClick={() => setActiveTab('care')}
                >
                  Product Care
                </button>
              </div>

              {/* Content Card */}
              <div className="content-card">
                {/* Description View */}
                {activeTab === 'desc' && (
                  <div id="detailDesc" className="desc-content">
                    <div id="descBody">
                      {/* Product Description Box */}
                      <div className="info-box">
                        <div className="info-box-title">Product Description</div>
                        <div className="info-box-text" style={{ whiteSpace: 'pre-line', fontSize: '13.5px', lineHeight: '1.8', color: '#444' }}>
                          {fullDescription}
                        </div>
                      </div>

                      {/* Product Details Grid Box */}
                      {productSpecs && productSpecs.length > 0 && (
                        <div className="info-box">
                          <div className="info-box-title">Product Details</div>
                          <div className="details-grid">
                            {productSpecs.map((item, idx) => (
                              <div className="detail-item" key={idx}>
                                <div className="detail-icon">
                                  {getSpecIcon(item.label)}
                                </div>
                                <div className="detail-label">{item.label}</div>
                                <div className="detail-value">: {item.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Product Care View */}
                {activeTab === 'care' && (
                  <div id="detailCare" className="care-content">
                    <div className="info-box">
                      <div className="info-box-title">Product Care Essentials</div>
                      <div id="careBody" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 15, marginTop: 10 }}>
                        {careItems.map((item, idx) => {
                          let title = "Care Tip";
                          let desc = item;
                          if (item.includes(':')) {
                            const parts = item.split(':');
                            title = parts[0].trim();
                            desc = parts.slice(1).join(':').trim();
                          }

                          return (
                            <div
                              key={idx}
                              style={{
                                background: 'rgba(255,255,255,0.7)',
                                border: '1px solid rgba(201,168,76,0.15)',
                                borderRadius: 8,
                                padding: 18,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                                transition: 'transform 0.3s, box-shadow 0.3s',
                                cursor: 'default'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 5px 15px rgba(201,168,76,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div style={{ display: 'flex', alignContent: 'center', alignItems: 'center', gap: 12, marginBottom: 2 }}>
                                <div style={{
                                  background: 'rgba(201,168,76,0.1)',
                                  width: 36,
                                  height: 36,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  boxShadow: 'inset 0 0 10px rgba(201,168,76,0.05)'
                                }}>
                                  {getCareIcon(title)}
                                </div>
                                <div style={{
                                  fontFamily: "'Playfair Display', serif",
                                  fontWeight: 600,
                                  fontSize: 15,
                                  color: 'var(--dark)',
                                  letterSpacing: '0.3px'
                                }}>
                                  {title}
                                </div>
                              </div>
                              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)' }}>
                                {desc}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Shop Banner */}
              <div className="shop-banner">
                <div className="shop-banner-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 22, height: 22 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div className="shop-banner-text" id="shopBannerText">
                  Shop this elegant <strong>{product.name}</strong> from <strong>ROKEA BY RK</strong> in Coimbatore and discover timeless {isJewellery ? 'jewellery' : 'sarees'} curated for every special occasion.
                </div>
              </div>

              {/* Exclusive 1-of-1 Piece Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(201, 168, 76, 0.08)',
                  border: '1px solid rgba(201, 168, 76, 0.25)',
                  padding: '7px 14px',
                  borderRadius: 20,
                  marginBottom: 16,
                  fontSize: 12,
                  color: 'var(--gold-dark, #8B6914)',
                  fontWeight: 600,
                  letterSpacing: '0.04em'
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--gold)' }}>✦</span>
                <span>Exclusive Boutique Piece • Single 1 of 1 Unit</span>
              </div>

              {/* Action Buttons */}
              <div className="action-btns" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {inCart ? (
                  <button
                    id="detailAddToCartBtn"
                    className="btn-primary"
                    style={{
                      flex: 1,
                      minWidth: 150,
                      background: '#1b5e20',
                      borderColor: '#1b5e20',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                    onClick={openCart}
                    title="Already in your shopping bag. Click to view bag."
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Added</span>
                  </button>
                ) : (
                  <button
                    id="detailAddToCartBtn"
                    className="btn-primary"
                    style={{ flex: 1, minWidth: 150 }}
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                  >
                    {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                  </button>
                )}
                <button
                  id="detailBuyNowBtn"
                  className="btn-outline"
                  style={{ flex: 1, minWidth: 130 }}
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                >
                  Buy Now
                </button>
                <button
                  type="button"
                  id="detailWishlistBtn"
                  onClick={() => addToWishlist(product)}
                  aria-label="Save to Wishlist"
                  title={inWishlist ? "Saved to Wishlist" : "Save to Wishlist"}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    border: inWishlist ? '1.5px solid #e91e63' : '1.5px solid #d4af37',
                    background: inWishlist ? '#fff0f5' : '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill={inWishlist ? '#e91e63' : 'none'}
                    stroke={inWishlist ? '#e91e63' : '#4A3B32'}
                    strokeWidth="2"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
              </div>

              {/* Stock Status */}
              <p
                id="detailStockStatus"
                style={{
                  marginTop: 25,
                  fontSize: 11,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isOutOfStock ? '#D93025' : '#4CAF50'
                  }}
                ></span>
                Availability: {isOutOfStock ? 'Sold Out' : 'In Stock'}
              </p>
            </div>
          </div>

          {/* Related Products Section */}
          <div className="related-section">
            <div className="featured-top" style={{ marginBottom: 40 }}>
              <div>
                <span className="section-label">Recommendations</span>
                <h2 className="section-title" style={{ fontSize: 32 }}>
                  You might also <em>like</em>
                </h2>
              </div>
            </div>

            <div className="slider-wrapper" style={{ position: 'relative' }}>
              <button
                type="button"
                className="slider-arrow prev"
                onClick={() => scrollSlider(-1)}
                style={{ position: 'absolute', left: -20, top: '40%', zIndex: 10 }}
                aria-label="Previous Related Products"
              >
                &lt;
              </button>

              <div
                id="relatedSlider"
                ref={sliderRef}
                className="related-slider"
                style={{
                  display: 'flex',
                  gap: 20,
                  overflowX: 'hidden',
                  scrollBehavior: 'smooth',
                  padding: '10px 0'
                }}
              >
                {relatedProducts.map((p, idx) => {
                  const relPrice = parseInt(p.price || 0, 10);
                  const relImg = optimizeImageUrl(p.imageHover || p.imgHover || p.image || p.img);

                  return (
                    <div
                      key={p.id}
                      className="slider-item product-card"
                      onClick={() => navigate(getProductLink(p))}
                      style={{
                        flex: '0 0 calc(20% - 12px)',
                        minWidth: 190,
                        overflow: 'visible',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', background: '#fafafa', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
                        <img
                          src={relImg}
                          alt={p.name}
                          width="300"
                          height="400"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                            e.target.style.background = 'linear-gradient(135deg,#f0e6d3,#faf6ef)';
                          }}
                        />
                        {idx % 3 !== 0 && (
                          <div style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            border: '1px solid rgba(0,0,0,0.3)',
                            color: '#222',
                            padding: '4px 14px',
                            fontSize: 10,
                            borderRadius: 20,
                            background: 'rgba(255,255,255,0.85)'
                          }}>
                            Best Seller
                          </div>
                        )}
                        <div
                          className="product-share"
                          style={{
                            top: 12,
                            right: 12,
                            width: 32,
                            height: 32,
                            background: '#fff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openShare(p);
                          }}
                          title="Share"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                          </svg>
                        </div>
                      </div>

                      <div style={{ padding: '16px 15px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--gold-dark)', fontWeight: 700, marginBottom: 8 }}>
                          ₹{relPrice.toLocaleString('en-IN')}
                        </div>
                        <div style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: 11,
                          color: '#444',
                          textTransform: 'uppercase',
                          marginBottom: 12,
                          fontWeight: 500,
                          letterSpacing: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.5,
                          height: 33
                        }}>
                          {p.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="slider-arrow next"
                onClick={() => scrollSlider(1)}
                style={{ position: 'absolute', right: -20, top: '40%', zIndex: 10 }}
                aria-label="Next Related Products"
              >
                &gt;
              </button>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
