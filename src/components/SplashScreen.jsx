import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export default function SplashScreen() {
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '/index.html';

  const [visible, setVisible] = useState(() => {
    // Only show on home page and only if not played in current session
    if (!isHomePage) return false;
    return sessionStorage.getItem('splashPlayed') !== 'true';
  });

  const [scrolled, setScrolled] = useState(false);
  const splashLogoRef = useRef(null);
  const animationTriggeredRef = useRef(false);

  const cleanupStyles = useCallback(() => {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    const navLogo = document.getElementById('navLogoImg');
    if (navLogo) {
      navLogo.style.opacity = '1';
    }
    const heroEl = document.querySelector('.hero');
    if (heroEl) {
      heroEl.classList.add('hero-revealed');
    }
  }, []);

  const triggerAnimation = useCallback(() => {
    if (animationTriggeredRef.current) return;
    animationTriggeredRef.current = true;

    sessionStorage.setItem('splashPlayed', 'true');
    const splashLogo = splashLogoRef.current;
    const navLogo = document.getElementById('navLogoImg');

    if (splashLogo && navLogo) {
      const navRect = navLogo.getBoundingClientRect();
      const logoRect = splashLogo.getBoundingClientRect();

      const xTranslate = navRect.left + (navRect.width / 2) - (logoRect.left + logoRect.width / 2);
      const yTranslate = navRect.top + (navRect.height / 2) - (logoRect.top + logoRect.height / 2);
      const scale = navRect.width / (logoRect.width || 1);

      splashLogo.style.transform = `translate(${xTranslate}px, ${yTranslate}px) scale(${Math.max(scale, 0.2)})`;

      setTimeout(() => {
        splashLogo.style.opacity = '0';
        navLogo.style.transition = 'opacity 0.5s ease';
        navLogo.style.opacity = '1';
        setScrolled(true);

        const heroEl = document.querySelector('.hero');
        if (heroEl) {
          heroEl.classList.add('hero-revealed');
        }

        setTimeout(() => {
          cleanupStyles();
          setVisible(false);
        }, 600);
      }, 750);
    } else {
      cleanupStyles();
      setVisible(false);
    }
  }, [cleanupStyles]);

  useEffect(() => {
    if (!isHomePage) {
      cleanupStyles();
      setVisible(false);
      return;
    }

    if (!visible) {
      cleanupStyles();
      return;
    }

    // Lock scroll while splash is active
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const navLogoImg = document.getElementById('navLogoImg');
    if (navLogoImg) {
      navLogoImg.style.opacity = '0';
    }

    const handleEvent = (e) => {
      // Trigger on wheel down, touch, or click
      if (e.type === 'wheel' && e.deltaY <= 0) return;
      triggerAnimation();
    };

    const handleKeyDown = (e) => {
      if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        triggerAnimation();
      }
    };

    window.addEventListener('wheel', handleEvent, { passive: true });
    window.addEventListener('touchmove', handleEvent, { passive: true });
    window.addEventListener('touchstart', handleEvent, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    // Safety auto-dismiss: if user doesn't interact within 2.2 seconds, automatically reveal site
    const autoDismissTimer = setTimeout(() => {
      triggerAnimation();
    }, 2200);

    return () => {
      clearTimeout(autoDismissTimer);
      window.removeEventListener('wheel', handleEvent);
      window.removeEventListener('touchmove', handleEvent);
      window.removeEventListener('touchstart', handleEvent);
      window.removeEventListener('keydown', handleKeyDown);
      cleanupStyles();
    };
  }, [visible, isHomePage, triggerAnimation, cleanupStyles]);

  if (!visible) return null;

  return (
    <div
      id="splashScreen"
      className={`splash-screen ${scrolled ? 'scrolled' : ''}`}
      onClick={triggerAnimation}
      role="button"
      tabIndex={0}
      title="Click or scroll to enter"
      style={{ cursor: 'pointer' }}
    >
      <div className="splash-content">
        <img
          id="splashLogo"
          ref={splashLogoRef}
          src="https://static.wixstatic.com/media/9881b8_16e714ef67304ad7812d38944b0b0b16~mv2.png/v1/crop/x_0,y_92,w_5000,h_1065/fill/w_1500,h_320,al_c,q_100,enc_avif,quality_auto/ROKEA%20horizontal%20logo%20(1).png"
          alt="ROKEA by RK"
          className="splash-logo-img"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          width="800"
          height="800"
        />
      </div>
      <div className="splash-scroll-indicator" style={{ opacity: scrolled ? 0 : 1 }}>
        <span className="splash-scroll-text">Scroll or Tap to Discover</span>
        <div className="splash-scroll-mouse">
          <div className="splash-scroll-wheel"></div>
        </div>
      </div>
    </div>
  );
}
