import React from 'react';
import { useStore } from '../../context/StoreContext';
import { useModal } from '../../context/ModalContext';
import { optimizeImageUrl } from '../../utils/helpers';

export default function WishlistModal() {
  const { wishlist, removeFromWishlist, wishToCart, moveAllToCart, currentUser } = useStore();
  const { wishlistOpen, closeWishlist, openCart, openAuth } = useModal();

  if (!wishlistOpen) return null;

  return (
    <div
      id="wishlistModal"
      className="modal"
      style={{ display: 'flex' }}
      onClick={(e) => {
        if (e.target.id === 'wishlistModal') closeWishlist();
      }}
    >
      <div className="modal-content">
        <span className="modal-close" onClick={closeWishlist}>×</span>
        <h3 style={{ marginBottom: 20, fontFamily: "'Playfair Display', serif", fontSize: 24 }}>
          Your Wishlist
        </h3>

        <div id="wishlist-items" className="cart-items">
          {wishlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: '#888' }}>
              <div style={{ fontSize: '32px', color: 'var(--gold, #C9A84C)', marginBottom: 10 }}>♡</div>
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#2A1810', margin: '0 0 6px' }}>
                Your Wishlist is Empty
              </h4>
              <p style={{ fontSize: '12.5px', color: '#8C7D6E', margin: '0 0 18px' }}>
                {currentUser ? 'Save your favourite sarees & jewellery to review them anytime.' : 'Sign in to access your saved wishlist and favourite designs.'}
              </p>
              {!currentUser && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    closeWishlist();
                    openAuth('login');
                  }}
                  style={{ fontSize: '12px', padding: '9px 24px' }}
                >
                  Sign In to View Saved Items
                </button>
              )}
            </div>
          ) : (
            wishlist.map((item, idx) => (
              <div key={idx} className="cart-item">
                <img
                  src={optimizeImageUrl(item.image || item.img)}
                  width="50"
                  height="66"
                  style={{ width: 50, height: 66, objectFit: 'cover', borderRadius: 4 }}
                  loading="lazy"
                  decoding="async"
                  alt={item.name}
                />
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">₹{parseInt(item.price || 0).toLocaleString('en-IN')}</div>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold)',
                      fontSize: '11px',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                      marginTop: '4px'
                    }}
                    onClick={() => {
                      wishToCart(idx);
                      closeWishlist();
                      openCart();
                    }}
                  >
                    Move to Bag →
                  </button>
                </div>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeFromWishlist(idx)}
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>

        {wishlist.length > 0 && (
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', marginTop: 20 }}
            onClick={() => {
              moveAllToCart();
              closeWishlist();
              openCart();
            }}
          >
            Move All to Cart
          </button>
        )}
      </div>
    </div>
  );
}
