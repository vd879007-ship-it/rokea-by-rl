import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useModal } from '../context/ModalContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { cart, wishlist, currentUser, logout, processCartAbandonment, showToast } = useStore();
  const { toggleCart, toggleWishlist, openAuth, openAppointment, openAdmin } = useModal();
  const navigate = useNavigate();

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleNavClick = (path) => {
    closeMobileMenu();
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

  const firstInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
  const shortName = currentUser?.name ? currentUser.name.split(' ')[0] : 'User';

  return (
    <>
      <nav className="main-navbar">
        <Link to="/" className="nav-logo" aria-label="ROKEA by RK Homepage" onClick={() => window.scrollTo(0, 0)}>
          <img
            id="navLogoImg"
            src="https://static.wixstatic.com/media/9881b8_16e714ef67304ad7812d38944b0b0b16~mv2.png/v1/crop/x_0,y_92,w_5000,h_1065/fill/w_155,h_33,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/ROKEA%20horizontal%20logo%20(1).png"
            alt="ROKEA by RK"
            className="logo-img"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width="800"
            height="800"
          />
        </Link>

        <div
          className={`menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
          aria-label="Toggle mobile menu"
          role="button"
          tabIndex={0}
          onClick={toggleMobileMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className="nav-links">
          <li>
            <Link to="/" onClick={() => handleNavClick('/')}>Home</Link>
          </li>
          <li>
            <Link to="/about" onClick={() => handleNavClick('/about')}>About</Link>
          </li>
          <li>
            <Link to="/collections" onClick={() => handleNavClick('/collections')}>Products</Link>
          </li>
          <li>
            <a href="/#custom-blouse" onClick={(e) => { e.preventDefault(); handleNavClick('/#custom-blouse'); }}>Custom Blouse</a>
          </li>
          <li>
            <a href="/#contact" onClick={(e) => { e.preventDefault(); handleNavClick('/#contact'); }}>Contact</a>
          </li>
          <li id="userLinkCont">
            {currentUser ? (
              <div
                className="user-profile-cont"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserDropdownOpen(prev => !prev);
                }}
              >
                <div className="user-info-text">
                  <span className="user-welcome">Welcome</span>
                  <span className="user-name-display">{shortName}</span>
                </div>
                <div className="user-avatar-badge" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name || 'User'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    firstInitial
                  )}
                </div>

                <div className={`user-dropdown ${userDropdownOpen ? 'active' : ''}`} id="userDropdown">
                  <div className="dropdown-header">
                    <div className="user-avatar-badge" style={{ width: 50, height: 50, fontSize: 20, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={currentUser.name || 'User'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        firstInitial
                      )}
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: 'var(--dark)' }}>
                      {currentUser.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                      {currentUser.email}
                    </div>
                  </div>
                  {currentUser.isAdmin && (
                    <a
                      href="javascript:void(0)"
                      className="dropdown-item"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        openAdmin();
                      }}
                      style={{ color: 'var(--gold)', fontWeight: 600 }}
                    >
                      <span>⚙</span> Admin Dashboard
                    </a>
                  )}
                  <a
                    href="javascript:void(0)"
                    className="dropdown-item"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      toggleWishlist();
                    }}
                  >
                    <span>✦</span> My Wishlist
                  </a>
                  <a
                    href="javascript:void(0)"
                    className="dropdown-item"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      toggleCart();
                    }}
                  >
                    <span>✦</span> My Shopping Bag
                  </a>
                  {!currentUser.isAdmin && (cart.length > 0 || wishlist.length > 0) && (
                    <a
                      href="javascript:void(0)"
                      className="dropdown-item"
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        showToast('Sending Reminder Email...', 'info');
                        const res = await processCartAbandonment({
                          user: currentUser,
                          cart,
                          wishlist,
                          triggerSource: 'user_nav_manual_test',
                          force: true
                        });
                        if (res && res.success) {
                          showToast('Email Dispatched!', 'success', `Check your inbox at ${res.email}`);
                        } else {
                          showToast('Notice', 'info', res?.reason || 'Email queued');
                        }
                      }}
                      style={{ color: '#8A6510', fontSize: 11, fontWeight: 600 }}
                    >
                      <span>✉</span> Send Test Reminder Email
                    </a>
                  )}
                  <a
                    href="javascript:void(0)"
                    className="dropdown-item logout-item"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                  >
                    <span>✕</span> Sign Out
                  </a>
                </div>
              </div>
            ) : (
              <a href="javascript:void(0)" onClick={() => openAuth('login')} id="navLogin">
                Login / Register
              </a>
            )}
          </li>
        </ul>

        <div className="nav-actions" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div
            className="wishlist-trigger"
            aria-label="View wishlist"
            role="button"
            tabIndex={0}
            onClick={toggleWishlist}
            style={{ position: 'relative', cursor: 'pointer', marginRight: 20 }}
          >
            <svg
              className="nav-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 24, height: 24 }}
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
            </svg>
            <span
              id="wish-count"
              className="cart-count"
              style={{
                position: 'absolute',
                top: -5,
                right: -10,
                background: '#e91e63',
                color: '#fff',
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: '50%'
              }}
            >
              {wishlist.length}
            </span>
          </div>

          <div
            className="cart-trigger"
            aria-label="View cart"
            role="button"
            tabIndex={0}
            onClick={toggleCart}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <svg
              className="nav-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 24, height: 24 }}
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
              <path d="M3 6h18"></path>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span
              id="cart-count"
              className="cart-count"
              style={{
                position: 'absolute',
                top: -5,
                right: -10,
                background: 'var(--gold)',
                color: '#fff',
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: '50%'
              }}
            >
              {cart.length}
            </span>
          </div>

          <button className="nav-cta" onClick={openAppointment}>
            Book Appointment
          </button>
        </div>
      </nav>

      {/* MOBILE DRAWER MENU */}
      <div id="mobileMenu" className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-header">
          <Link to="/" className="nav-logo" aria-label="ROKEA by RK Homepage" onClick={closeMobileMenu}>
            <img
              src="https://static.wixstatic.com/media/9881b8_16e714ef67304ad7812d38944b0b0b16~mv2.png/v1/crop/x_0,y_92,w_5000,h_1065/fill/w_155,h_33,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/ROKEA%20horizontal%20logo%20(1).png"
              alt="ROKEA by RK"
              className="logo-img"
              loading="lazy"
              decoding="async"
              width="800"
              height="800"
            />
          </Link>
          <span className="menu-close" onClick={closeMobileMenu}>×</span>
        </div>
        <ul className="mobile-nav-links">
          <li>
            <Link to="/" onClick={() => handleNavClick('/')}>Home</Link>
          </li>
          <li>
            <Link to="/about" onClick={() => handleNavClick('/about')}>About</Link>
          </li>
          <li>
            <Link to="/collections" onClick={() => handleNavClick('/collections')}>Products</Link>
          </li>
          <li>
            <a href="/#custom-blouse" onClick={(e) => { e.preventDefault(); handleNavClick('/#custom-blouse'); }}>Custom Blouse</a>
          </li>
          <li>
            <Link to="/blouse-designs" onClick={() => handleNavClick('/blouse-designs')}>Blouse Designs Gallery</Link>
          </li>
          <li>
            <Link to="/ai-stylist" onClick={() => handleNavClick('/ai-stylist')}>AI Virtual Stylist</Link>
          </li>
          <li>
            <a href="/#contact" onClick={(e) => { e.preventDefault(); handleNavClick('/#contact'); }}>Contact</a>
          </li>
          <li id="mobileLoginCont">
            {currentUser ? (
              <a
                href="javascript:void(0)"
                onClick={() => {
                  closeMobileMenu();
                  logout();
                }}
                style={{ color: '#ff4d4d' }}
              >
                Logout ({shortName})
              </a>
            ) : (
              <a
                href="javascript:void(0)"
                onClick={() => {
                  closeMobileMenu();
                  openAuth('login');
                }}
              >
                Login / Register
              </a>
            )}
          </li>
        </ul>
      </div>
    </>
  );
}
