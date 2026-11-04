import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useModal } from '../context/ModalContext';
import { optimizeImageUrl, getProductLink } from '../utils/helpers';

export default function CollectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { products, wishlist, addToCart, addToWishlist, isInCart } = useStore();
  const { openCart } = useModal();

  const [category, setCategory] = useState(() => {
    return searchParams.get('category') || localStorage.getItem('rokea_selected_category') || 'sarees';
  });

  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setCategory(cat);
    }
  }, [searchParams]);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setSearchParams({ category: newCat });
    localStorage.removeItem('rokea_selected_category');
  };

  // Filter products by category & sort
  const filteredProducts = useMemo(() => {
    let list = products.filter(p => {
      const cat = (p.category || '').toLowerCase().trim();
      if (category === 'sarees') return cat === 'sarees' || cat === 'saree';
      if (category === 'imitation') return cat === 'imitation' || cat === 'jewellery' || cat === 'jewels' || cat === 'jewelry';
      return true;
    });

    if (sortBy === 'price-low') {
      list = [...list].sort((a, b) => parseInt(a.price || 0, 10) - parseInt(b.price || 0, 10));
    } else if (sortBy === 'price-high') {
      list = [...list].sort((a, b) => parseInt(b.price || 0, 10) - parseInt(a.price || 0, 10));
    }
    return list;
  }, [products, category, sortBy]);

  return (
    <div className="collections-page">
      <section className="bestsellers-page-hero" id="products">
        {/* Top-Left Jasmine Decor */}
        <div className="decor-jasmine-top" aria-hidden="true">
          <img src="/decor_jasmine_top.png" alt="Jasmine Blossom" className="jasmine-art-img" />
        </div>

        {/* Top-Right Tradition Calligraphy & Lotus Motif */}
        <div className="decor-tradition-top" aria-hidden="true">
          <div className="tradition-lotus-sketch">
            <svg viewBox="0 0 120 120" width="110" height="110" fill="none" stroke="rgba(201, 168, 76, 0.25)" strokeWidth="1.2">
              <path d="M60 100 C40 85, 20 60, 28 40 C35 25, 52 40, 60 55 C68 40, 85 25, 92 40 C100 60, 80 85, 60 100 Z" />
              <path d="M60 55 C48 35, 42 18, 60 8 C78 18, 72 35, 60 55 Z" />
              <path d="M28 40 C15 48, 8 68, 25 80" />
              <path d="M92 40 C105 48, 112 68, 95 80" />
            </svg>
          </div>
          <div className="tradition-calligraphy-text">
            <span className="trad-line1">Tradition</span>
            <span className="trad-line2">in every</span>
            <span className="trad-line3">thread</span>
          </div>
          <div className="tradition-divider-line"></div>
          <div className="tradition-lotus-emblem">
            <span className="emblem-line"></span>
            <span className="emblem-icon">
              <svg viewBox="0 0 24 16" width="22" height="15" fill="none" stroke="#C9A84C" strokeWidth="1.3">
                <path d="M12 2 C12 2, 9 6, 9 10 C9 12.5, 10.5 14, 12 14 C13.5 14, 15 12.5, 15 10 C15 6, 12 2, 12 2 Z" fill="rgba(201, 168, 76, 0.2)" />
                <path d="M12 2 C12 2, 5 6, 4 9.5 C3 12, 6 14, 8.5 14 C10 14, 11 12.5, 11 11" />
                <path d="M12 2 C12 2, 19 6, 20 9.5 C21 12, 18 14, 15.5 14 C14 14, 13 12.5, 13 11" />
              </svg>
            </span>
            <span className="emblem-line"></span>
          </div>
        </div>

        {/* Bottom-Left Mandala Decor */}
        <div className="decor-bottom-left" aria-hidden="true">
          <svg viewBox="0 0 140 140" width="130" height="130" fill="none" stroke="rgba(201, 168, 76, 0.18)" strokeWidth="1.1">
            <path d="M10 130 C20 70, 60 20, 130 10 M50 70 C30 52, 22 30, 35 15 C52 25, 65 42, 50 70 M75 45 C68 20, 85 10, 98 20 C92 38, 85 52, 75 45 M95 95 C70 85, 60 105, 70 120 C85 112, 98 100, 95 95" />
          </svg>
        </div>

        {/* Floating Jasmine Petals Decor Bottom */}
        <div className="decor-bottom-right" aria-hidden="true">
          <svg viewBox="0 0 100 80" width="90" height="70" fill="none">
            <path d="M85 70 C70 45, 50 30, 20 25 C40 38, 55 52, 85 70 Z" fill="rgba(60, 90, 45, 0.25)" />
            <circle cx="80" cy="30" r="6" fill="rgba(255, 255, 255, 0.85)" stroke="rgba(201, 168, 76, 0.4)" />
          </svg>
        </div>

        <div className="bestsellers-inner">
          {/* Center Header */}
          <div className="bestsellers-header">
            <div className="bestseller-label-row">
              <span className="label-flank-line"></span>
              <span className="bestseller-label">FEATURED COLLECTION</span>
              <span className="label-flank-line"></span>
            </div>

            <h1 className="bestseller-main-title">Our Best Sellers</h1>

            <p className="bestseller-subtitle">
              Timeless sarees &amp; temple jewellery, handpicked for you. Explore our most loved styles and bring home a piece of authentic tradition.
            </p>

            {/* Filter Navigation Bar & Sort Controls */}
            <div className="bestseller-controls-bar">
              <div className="bestseller-filter-bar">
                <button
                  type="button"
                  className={`filter-pill ${category === 'sarees' ? 'active' : ''}`}
                  onClick={() => handleCategoryChange('sarees')}
                  data-cat="sarees"
                >
                  <span>Sarees</span>
                  <span className="filter-count-badge">
                    ({products.filter(p => (p.category || '').toLowerCase().includes('saree')).length})
                  </span>
                </button>
                <span className="filter-sep">|</span>
                <button
                  type="button"
                  className={`filter-pill ${category === 'imitation' ? 'active' : ''}`}
                  onClick={() => handleCategoryChange('imitation')}
                  data-cat="imitation"
                >
                  <span>Jewellery</span>
                  <span className="filter-count-badge">
                    ({products.filter(p => ['imitation','jewellery','jewels','jewelry'].includes((p.category || '').toLowerCase())).length})
                  </span>
                </button>
              </div>

              {/* Sort Dropdown & Count info */}
              <div className="bestseller-sort-bar">
                <span className="bestseller-item-count">
                  Showing <strong>{filteredProducts.length}</strong> items
                </span>
                <select
                  className="bestseller-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort products"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Full Products Grid - All Items Displayed (No Slider) */}
          <div className="bestsellers-products-grid" id="productsGrid">
            {filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#8C7D6E', width: '100%' }}>
                <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#C9A84C" strokeWidth="1.5" style={{ marginBottom: 12, display: 'inline-block' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#4A0E17', marginBottom: 6 }}>
                  No Products Found
                </h3>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: '#7A6A50' }}>
                  No products have been added to this category yet.
                </p>
              </div>
            ) : (
              filteredProducts.map((p, idx) => {
                const inWishlist = wishlist && wishlist.find(w => w.id == p.id);
                const isOOS = p.stock === 'Out of Stock';
                const mainImg = optimizeImageUrl(p.image || p.img);
                const displayPrice = parseInt(p.price || 0, 10);
                const originalPrice = p.mrp ? parseInt(p.mrp, 10) : Math.round(displayPrice * 1.25);
                const discountPercent = originalPrice > displayPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;

                const badgeText = isOOS ? 'Sold Out' : (p.badge || (idx === 0 ? 'Bestseller' : (idx === 1 ? 'New' : (idx === 2 ? 'Trending' : 'Exclusive'))));
                const badgeClass = isOOS ? 'badge-blush' : (idx === 0 ? 'badge-green' : (idx === 1 ? 'badge-sage' : (idx === 2 ? 'badge-blush' : 'badge-gold')));

                const waMsg = encodeURIComponent(
                  `Hi ROKEA by RK, I am interested in: "${p.name}" (Price: ₹${displayPrice.toLocaleString('en-IN')}). Could you please share more pictures or details?`
                );

                return (
                  <div
                    key={p.id || idx}
                    className="bestseller-card"
                    onClick={() => navigate(getProductLink(p))}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Image Wrap */}
                    <div className={`bestseller-card-img-wrap ${isOOS ? 'out-of-stock' : ''}`}>
                      <span className={`bestseller-badge ${badgeClass}`}>{badgeText}</span>
                      
                      {/* Wishlist Heart Button */}
                      <button
                        type="button"
                        className={`bestseller-wish-btn ${inWishlist ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToWishlist(p);
                        }}
                        aria-label="Wishlist"
                        title={inWishlist ? "Saved in Wishlist" : "Add to Wishlist"}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill={inWishlist ? '#E91E63' : 'none'}
                          stroke={inWishlist ? '#E91E63' : '#4A3B32'}
                          strokeWidth="2"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>

                      <img
                        src={mainImg}
                        alt={p.name}
                        className="bestseller-card-img"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                          e.target.style.background = 'linear-gradient(135deg,#f0e6d3,#faf6ef)';
                        }}
                      />

                      {/* Quick View Pill on Hover */}
                      <div className="bestseller-hover-overlay">
                        <span className="hover-explore-pill">View Saree Details →</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="bestseller-card-body">
                      <div className="bestseller-card-meta-row">
                        <span className="bestseller-card-category">
                          ✦ {p.category === 'sarees' ? 'PURE SILK SAREE' : 'TEMPLE JEWELLERY'}
                        </span>
                        <div className="bestseller-card-rating">
                          <span className="rating-stars">★★★★★</span>
                          <span className="rating-score">(4.9)</span>
                        </div>
                      </div>

                      <h3 className="bestseller-card-title" title={p.name}>
                        {p.name}
                      </h3>

                      {/* Price & Savings */}
                      <div className="bestseller-card-price-row">
                        <span className="bestseller-card-price">₹{displayPrice.toLocaleString('en-IN')}</span>
                        {originalPrice > displayPrice && (
                          <span className="bestseller-card-mrp">₹{originalPrice.toLocaleString('en-IN')}</span>
                        )}
                        {discountPercent > 0 && (
                          <span className="bestseller-card-discount">{discountPercent}% OFF</span>
                        )}
                      </div>

                      {/* Action Buttons: Add to Bag & WhatsApp */}
                      <div className="bestseller-card-actions">
                        {isOOS ? (
                          <button
                            type="button"
                            className="bestseller-add-btn is-soldout"
                            disabled
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>SOLD OUT</span>
                          </button>
                        ) : isInCart(p.id || p.slug || p.name) ? (
                          <button
                            type="button"
                            className="bestseller-add-btn is-added"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCart();
                            }}
                            title="Item already in your bag. Click to view bag."
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>ADDED IN BAG</span>
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
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                              <path d="M3 6h18"></path>
                              <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                            <span>ADD TO BAG</span>
                          </button>
                        )}

                        {/* WhatsApp Quick Enquiry Button */}
                        <a
                          href={`https://wa.me/917010394051?text=${waMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bestseller-card-wa-btn"
                          onClick={(e) => e.stopPropagation()}
                          title="Enquire on WhatsApp about this piece"
                          aria-label="Enquire on WhatsApp"
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.11 7.44C8.95 7.44 8.68 7.5 8.46 7.74C8.24 7.97 7.63 8.55 7.63 9.71C7.63 10.87 8.48 11.99 8.6 12.14C8.72 12.3 10.27 14.68 12.63 15.7C13.2 15.94 13.63 16.08 13.98 16.2C14.54 16.37 15.06 16.35 15.46 16.29C15.91 16.22 16.84 15.72 17.03 15.18C17.23 14.64 17.23 14.18 17.17 14.08C17.11 13.98 16.96 13.92 16.73 13.81C16.5 13.7 15.35 13.13 15.14 13.06C14.93 12.98 14.77 12.94 14.62 13.17C14.47 13.4 14.04 13.92 13.91 14.08C13.78 14.23 13.65 14.25 13.42 14.14C13.19 14.02 12.45 13.78 11.57 13C10.89 12.39 10.43 11.64 10.3 11.41C10.17 11.18 10.29 11.06 10.4 10.95C10.51 10.84 10.64 10.66 10.76 10.53C10.87 10.39 10.91 10.29 10.99 10.14C11.07 9.99 11.03 9.85 10.97 9.74C10.91 9.62 10.45 8.5 10.26 8.04C10.07 7.59 9.88 7.65 9.74 7.64C9.6 7.64 9.45 7.44 9.11 7.44Z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
