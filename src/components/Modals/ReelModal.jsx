import React from 'react';
import { useModal } from '../../context/ModalContext';

export default function ReelModal() {
  const { reelOpen, reelUrl, closeReel } = useModal();

  if (!reelOpen) return null;

  return (
    <div
      id="reelModal"
      className="modal"
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 10000,
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none'
      }}
      onClick={(e) => {
        if (e.target.id === 'reelModal') closeReel();
      }}
    >
      <span
        className="modal-close"
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          fontSize: 40,
          cursor: 'pointer',
          color: '#fff',
          zIndex: 99999
        }}
        onClick={closeReel}
      >
        ×
      </span>
      <div
        className="modal-content"
        style={{
          background: 'transparent',
          padding: 0,
          border: 'none',
          width: '90%',
          maxWidth: 400,
          height: '80vh',
          position: 'relative',
          overflow: 'visible',
          boxShadow: 'none'
        }}
      >
        <video
          id="reelVideo"
          src={reelUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000', display: 'block', borderRadius: 12 }}
          controls
          autoPlay
          playsInline
        ></video>
      </div>
    </div>
  );
}
