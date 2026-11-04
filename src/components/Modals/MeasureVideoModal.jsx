import React from 'react';
import { useModal } from '../../context/ModalContext';

export default function MeasureVideoModal() {
  const { measureVideoOpen, closeMeasureVideo } = useModal();

  if (!measureVideoOpen) return null;

  return (
    <div
      className="modal"
      id="measureVideoModal"
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 10000,
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={(e) => {
        if (e.target.id === 'measureVideoModal') closeMeasureVideo();
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'transparent',
          padding: 0,
          borderRadius: 0,
          width: '90%',
          maxWidth: 800,
          position: 'relative'
        }}
      >
        <span
          className="modal-close"
          style={{
            position: 'absolute',
            top: -40,
            right: 0,
            fontSize: 30,
            cursor: 'pointer',
            color: '#fff'
          }}
          onClick={closeMeasureVideo}
        >
          ×
        </span>
        <div
          style={{
            position: 'relative',
            paddingBottom: '56.25%',
            height: 0,
            overflow: 'hidden',
            borderRadius: 12,
            boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
          }}
        >
          <iframe
            id="measureVideoIframe"
            src="https://www.youtube.com/embed/d3-M4xWfA2M?autoplay=1"
            title="Blouse Measurement Tutorial"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
}
