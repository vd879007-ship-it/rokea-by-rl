import React, { createContext, useContext, useState, useEffect } from 'react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [adminOpen, setAdminOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [reelOpen, setReelOpen] = useState(false);
  const [reelUrl, setReelUrl] = useState('');
  const [measureVideoOpen, setMeasureVideoOpen] = useState(false);
  const [blouseModalOpen, setBlouseModalOpen] = useState(false);

  // Sync modal-open body class for smooth scrolling lock
  useEffect(() => {
    const isAnyOpen = cartOpen || wishlistOpen || checkoutOpen || appointmentOpen || authOpen || adminOpen || shareOpen || reelOpen || measureVideoOpen || blouseModalOpen;
    if (isAnyOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [cartOpen, wishlistOpen, checkoutOpen, appointmentOpen, authOpen, adminOpen, shareOpen, reelOpen, measureVideoOpen, blouseModalOpen]);

  // Listen for custom event to trigger auth modal from anywhere
  useEffect(() => {
    const handleOpenAuth = (e) => {
      const mode = (e && e.detail && e.detail.mode) ? e.detail.mode : 'login';
      setAuthMode(mode);
      setAuthOpen(true);
    };
    window.addEventListener('saforio:open-auth', handleOpenAuth);
    return () => window.removeEventListener('saforio:open-auth', handleOpenAuth);
  }, []);

  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);
  const toggleCart = () => setCartOpen(prev => !prev);

  const openWishlist = () => setWishlistOpen(true);
  const closeWishlist = () => setWishlistOpen(false);
  const toggleWishlist = () => setWishlistOpen(prev => !prev);

  const openCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };
  const closeCheckout = () => setCheckoutOpen(false);

  const openAppointment = () => setAppointmentOpen(true);
  const closeAppointment = () => setAppointmentOpen(false);

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };
  const closeAuth = () => setAuthOpen(false);

  const openAdmin = () => setAdminOpen(true);
  const closeAdmin = () => setAdminOpen(false);

  const openShare = (product) => {
    setShareData(product);
    setShareOpen(true);
  };
  const closeShare = () => {
    setShareOpen(false);
    setShareData(null);
  };

  const openReel = (url) => {
    setReelUrl(url || 'https://www.w3schools.com/html/mov_bbb.mp4');
    setReelOpen(true);
  };
  const closeReel = () => {
    setReelOpen(false);
    setReelUrl('');
  };

  const openMeasureVideo = () => setMeasureVideoOpen(true);
  const closeMeasureVideo = () => setMeasureVideoOpen(false);

  const openBlouseModal = () => setBlouseModalOpen(true);
  const closeBlouseModal = () => setBlouseModalOpen(false);

  return (
    <ModalContext.Provider
      value={{
        cartOpen,
        openCart,
        closeCart,
        toggleCart,
        wishlistOpen,
        openWishlist,
        closeWishlist,
        toggleWishlist,
        checkoutOpen,
        openCheckout,
        closeCheckout,
        appointmentOpen,
        openAppointment,
        closeAppointment,
        authOpen,
        authMode,
        setAuthMode,
        openAuth,
        closeAuth,
        adminOpen,
        openAdmin,
        closeAdmin,
        shareOpen,
        shareData,
        openShare,
        closeShare,
        reelOpen,
        reelUrl,
        openReel,
        closeReel,
        measureVideoOpen,
        openMeasureVideo,
        closeMeasureVideo,
        blouseModalOpen,
        openBlouseModal,
        closeBlouseModal
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
