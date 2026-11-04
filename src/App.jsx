import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Providers
import { StoreProvider } from './context/StoreContext';
import { ModalProvider } from './context/ModalContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileAppBottomBar from './components/MobileAppBottomBar';
import FloatingButtons from './components/FloatingButtons';
import SplashScreen from './components/SplashScreen';
import ToastContainer from './components/ToastContainer';

// Modals
import CartModal from './components/Modals/CartModal';
import WishlistModal from './components/Modals/WishlistModal';
import CheckoutModal from './components/Modals/CheckoutModal';
import AuthModal from './components/Modals/AuthModal';
import AdminModal from './components/Modals/AdminModal';
import AppointmentModal from './components/Modals/AppointmentModal';
import ShareModal from './components/Modals/ShareModal';
import ReelModal from './components/Modals/ReelModal';
import MeasureVideoModal from './components/Modals/MeasureVideoModal';
import BlouseBookingModal from './components/Modals/BlouseBookingModal';

// Pages
import HomePage from './pages/HomePage';
import CollectionsPage from './pages/CollectionsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import BlouseDesignsPage from './pages/BlouseDesignsPage';
import CustomBlouseOrderPage from './pages/CustomBlouseOrderPage';
import AiStylistPage from './pages/AiStylistPage';

// Scroll to top helper on route change
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    // Only scroll if there's no hash anchor
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, search]);
  return null;
}

export default function App() {
  return (
    <StoreProvider>
      <ModalProvider>
        <Router>
          <ScrollToTop />
          <SplashScreen />
          <Navbar />

          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/index.html" element={<HomePage />} />

              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/collections.html" element={<CollectionsPage />} />

              <Route path="/product/:slug" element={<ProductDetailPage />} />
              <Route path="/product-details" element={<ProductDetailPage />} />
              <Route path="/product-details.html" element={<ProductDetailPage />} />

              <Route path="/about" element={<AboutPage />} />
              <Route path="/about.html" element={<AboutPage />} />

              <Route path="/contact" element={<ContactPage />} />
              <Route path="/contact.html" element={<ContactPage />} />

              <Route path="/blouse-designs" element={<BlouseDesignsPage />} />
              <Route path="/blouse-designs.html" element={<BlouseDesignsPage />} />

              <Route path="/custom-blouse-order" element={<CustomBlouseOrderPage />} />
              <Route path="/custom-blouse-order.html" element={<CustomBlouseOrderPage />} />

              <Route path="/ai-stylist" element={<AiStylistPage />} />
              <Route path="/ai-stylist.html" element={<AiStylistPage />} />

              {/* Fallback route */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>

          <Footer />
          <MobileAppBottomBar />
          <FloatingButtons />

          {/* Global Modals */}
          <CartModal />
          <WishlistModal />
          <CheckoutModal />
          <AuthModal />
          <AdminModal />
          <AppointmentModal />
          <ShareModal />
          <ReelModal />
          <MeasureVideoModal />
          <BlouseBookingModal />

          <ToastContainer />
        </Router>
      </ModalProvider>
    </StoreProvider>
  );
}
