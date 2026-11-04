import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useModal } from '../context/ModalContext';

export default function MobileAppBottomBar() {
  const location = useLocation();
  const { cart, wishlist } = useStore();
  const { toggleCart, toggleWishlist, openAppointment } = useModal();

  const isHome = location.pathname === '/' || location.pathname === '/index.html';
  const isShop = location.pathname.includes('/collections');

  return (
    <nav className="mobile-app-bottom-bar" id="mobileAppBottomBar" aria-label="Mobile App Bottom Navigation">
      <Link
        to="/"
        className={`app-nav-item ${isHome ? 'active' : ''}`}
        id="appNavHome"
        aria-label="Home"
        onClick={() => window.scrollTo(0, 0)}
      >
        <div className="app-nav-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <span className="app-nav-label">Home</span>
      </Link>

      <Link
        to="/collections"
        className={`app-nav-item ${isShop ? 'active' : ''}`}
        id="appNavCollections"
        aria-label="Collections"
        onClick={() => window.scrollTo(0, 0)}
      >
        <div className="app-nav-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </div>
        <span className="app-nav-label">Shop</span>
      </Link>

      <button
        type="button"
        className="app-nav-item app-nav-center-btn"
        onClick={openAppointment}
        aria-label="Book Boutique Appointment"
      >
        <div className="app-nav-center-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <path d="M12 14l1.5 2.5L16 14"></path>
          </svg>
        </div>
        <span className="app-nav-label app-center-label">Book Visit</span>
      </button>

      <button
        type="button"
        className="app-nav-item"
        onClick={toggleWishlist}
        aria-label="Wishlist"
      >
        <div className="app-nav-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          {wishlist.length > 0 && (
            <span className="app-nav-badge" id="mobile-wish-count">{wishlist.length}</span>
          )}
        </div>
        <span className="app-nav-label">Wishlist</span>
      </button>

      <button
        type="button"
        className="app-nav-item"
        onClick={toggleCart}
        aria-label="Shopping Bag"
      >
        <div className="app-nav-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
            <path d="M3 6h18"></path>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          {cart.length > 0 && (
            <span className="app-nav-badge" id="mobile-cart-count">{cart.length}</span>
          )}
        </div>
        <span className="app-nav-label">Bag</span>
      </button>
    </nav>
  );
}
