import React from 'react';
import { useModal } from '../../context/ModalContext';
import { useStore } from '../../context/StoreContext';
import { getProductLink } from '../../utils/helpers';

export default function ShareModal() {
  const { shareOpen, closeShare, shareData } = useModal();
  const { showToast } = useStore();

  if (!shareOpen) return null;

  const urlToShare = shareData
    ? `${window.location.origin}${getProductLink(shareData)}`
    : window.location.href;
  const titleToShare = shareData ? `${shareData.name} | ROKEA by RK` : document.title;

  const handleShare = (platform) => {
    const encodedUrl = encodeURIComponent(urlToShare);
    const encodedText = encodeURIComponent(`Check out this beautiful piece from ROKEA by RK: ${titleToShare}`);

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(urlToShare).then(() => {
        showToast('Link Copied to Clipboard!', 'success');
      }).catch(() => {
        prompt('Copy this link:', urlToShare);
      });
    }
  };

  return (
    <div
      id="shareModal"
      className="modal"
      style={{ display: 'flex' }}
      onClick={(e) => {
        if (e.target.id === 'shareModal') closeShare();
      }}
    >
      <div className="modal-content" style={{ maxWidth: 400, textAlign: 'center' }}>
        <span className="modal-close" onClick={closeShare}>×</span>
        <h3 style={{ marginBottom: 10, fontFamily: "'Playfair Display', serif", fontSize: 24 }}>
          Share This Product
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 25 }}>
          Share this handcrafted piece with your friends and family
        </p>
        <div className="share-options" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20 }}>
          <div className="share-opt" onClick={() => handleShare('whatsapp')} style={{ cursor: 'pointer' }}>
            <div className="share-icon-circle" style={{ background: '#25D366' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24, color: '#fff' }}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div>
            <span className="share-text">WhatsApp</span>
          </div>
          <div className="share-opt" onClick={() => handleShare('facebook')} style={{ cursor: 'pointer' }}>
            <div className="share-icon-circle" style={{ background: '#1877F2' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24, color: '#fff' }}>
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </div>
            <span className="share-text">Facebook</span>
          </div>
          <div className="share-opt" onClick={() => handleShare('twitter')} style={{ cursor: 'pointer' }}>
            <div className="share-icon-circle" style={{ background: '#1DA1F2' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24, color: '#fff' }}>
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </div>
            <span className="share-text">Twitter</span>
          </div>
          <div className="share-opt" onClick={() => handleShare('copy')} style={{ cursor: 'pointer' }}>
            <div className="share-icon-circle" style={{ background: 'var(--muted)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24, color: '#fff' }}>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </div>
            <span className="share-text">Copy Link</span>
          </div>
        </div>
      </div>
    </div>
  );
}
