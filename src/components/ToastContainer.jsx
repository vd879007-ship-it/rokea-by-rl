import React from 'react';
import { useStore } from '../context/StoreContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div
      id="toastContainer"
      style={{
        position: 'fixed',
        top: '26px',
        right: '24px',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 32px)'
      }}
    >
      <style>{`
        @keyframes sideToastSlideInOut {
          0% {
            transform: translateX(120%);
            opacity: 0;
          }
          16% {
            transform: translateX(0);
            opacity: 1;
          }
          82% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(120%);
            opacity: 0;
          }
        }
        @keyframes sideToastProgressBar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>

      {toasts.map(toast => {
        const msg = (toast.message || '').toLowerCase();
        const isWarning = toast.type === 'warning' || msg.includes('sign in') || msg.includes('login') || msg.includes('required');
        const isWishlist = !isWarning && msg.includes('wishlist');
        const isBag = !isWarning && (msg.includes('bag') || msg.includes('cart'));
        const isError = toast.type === 'error';
        const durationMs = toast.duration || 1000;

        // Theme colors
        const accentColor = isWarning
          ? '#E65100'
          : isWishlist
          ? '#E91E63'
          : isError
          ? '#D32F2F'
          : '#2E7D32';

        const accentBg = isWarning
          ? 'rgba(230, 81, 0, 0.1)'
          : isWishlist
          ? 'rgba(233, 30, 99, 0.1)'
          : isError
          ? 'rgba(211, 47, 47, 0.1)'
          : 'rgba(46, 125, 50, 0.1)';

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: '#FFFFFF',
              border: '1px solid #ECE4DA',
              borderLeft: `4px solid ${accentColor}`,
              borderRadius: '12px',
              padding: '12px 14px 14px 14px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '340px',
              maxWidth: '100%',
              position: 'relative',
              overflow: 'hidden',
              animation: `sideToastSlideInOut ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`
            }}
          >
            {/* Side Icon Badge */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: accentBg,
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {isWarning ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <circle cx="12" cy="11" r="1"></circle>
                  <line x1="12" y1="7" x2="12" y2="10"></line>
                </svg>
              ) : isWishlist ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : isBag ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                  <path d="M3 6h18"></path>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              ) : isError ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <span style={{ fontSize: '16px' }}>✦</span>
              )}
            </div>

            {/* Message Details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: '#2A1810',
                  fontFamily: "'Poppins', sans-serif",
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {toast.message}
              </div>
              {toast.subText && (
                <div
                  style={{
                    fontSize: '11.5px',
                    color: '#8C7D6E',
                    marginTop: '2px',
                    fontFamily: "'Poppins', sans-serif",
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {toast.subText}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#AAA',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
                lineHeight: 1,
                borderRadius: '4px'
              }}
              title="Dismiss"
            >
              ×
            </button>

            {/* Bottom Progress Countdown Line */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '2.5px',
                background: accentColor,
                animation: `sideToastProgressBar ${durationMs}ms linear forwards`
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
