import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HeroPromoOffer() {
  const navigate = useNavigate();

  // Sparkle burst visibility on release
  const [showBurst, setShowBurst] = useState(false);

  // Thread resting length
  const THREAD_LENGTH = 62;

  // DOM element references for direct hardware-accelerated 60/120fps animation (Zero React re-render lag)
  const containerRef = useRef(null);
  const medallionRef = useRef(null);
  const threadSvgRef = useRef(null);
  const threadLineRef = useRef(null);
  const beadRef = useRef(null);

  // Continuous physics engine state
  const stateRef = useRef({
    mode: 'idle', // 'idle' | 'dragging' | 'releasing'
    time: 0,
    lastTimestamp: null,
    // Drag state
    dragStart: { x: 0, y: 0 },
    dragOriginPos: { x: 0, y: 0 },
    currentDrag: { x: 0, y: 0 },
    wasDragged: false,
    // Release spring physics
    spring: { x: 0, y: 0, vx: 0, vy: 0 },
    // Current animated position
    currentPos: { x: 0, y: 0 },
    currentAngle: 0
  });

  // Direct DOM application for silky smooth 60fps/120fps motion
  const applyDOM = (x, y, angleDeg) => {
    const totalY = THREAD_LENGTH + y;
    if (threadLineRef.current) {
      threadLineRef.current.setAttribute('x2', (140 + x).toFixed(2));
      threadLineRef.current.setAttribute('y2', totalY.toFixed(2));
    }
    if (beadRef.current) {
      beadRef.current.setAttribute('cx', (140 + x * 0.5).toFixed(2));
      beadRef.current.setAttribute('cy', (totalY * 0.5).toFixed(2));
    }
    if (threadSvgRef.current) {
      const requiredH = Math.max(90, totalY + 28);
      threadSvgRef.current.style.height = `${requiredH}px`;
    }
    if (medallionRef.current) {
      medallionRef.current.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${angleDeg.toFixed(2)}deg)`;
    }
  };

  // ── UNIFIED PHYSICS ANIMATION LOOP (CONTINUOUS SMOOTH SWAY) ──
  useEffect(() => {
    let rafId = null;

    const loop = (timestamp) => {
      const s = stateRef.current;
      if (!s.lastTimestamp) s.lastTimestamp = timestamp;
      const dt = Math.min(0.05, (timestamp - s.lastTimestamp) / 1000);
      s.lastTimestamp = timestamp;

      // Continuous natural pendulum oscillation ("அழகா ஆடிக்கிட்டே இருக்கும்")
      // Frequency omega = 2.15 rad/s (~2.92s period for a calming luxury rhythm)
      // Max swing angle = 0.27 rad (~15.5 degrees of graceful swing arc)
      s.time += dt;
      const maxAngleRad = 0.27;
      const idleAngle = Math.sin(s.time * 2.15) * maxAngleRad;
      const idleX = THREAD_LENGTH * Math.sin(idleAngle);
      const idleY = THREAD_LENGTH * (1 - Math.cos(idleAngle)); // Natural pendulum vertical rise at peaks
      const idleAngleDeg = (idleAngle * (180 / Math.PI)) * 0.92;

      let finalX = idleX;
      let finalY = idleY;
      let finalAngleDeg = idleAngleDeg;

      if (s.mode === 'dragging') {
        // Active interactive drag follows user cursor/finger
        finalX = s.currentDrag.x;
        finalY = s.currentDrag.y;
        const totalY = THREAD_LENGTH + finalY;
        finalAngleDeg = Math.atan2(finalX, Math.max(20, totalY)) * (180 / Math.PI) * 0.75;
      } else if (s.mode === 'releasing') {
        // 2D Damped Harmonic Spring simulation on the offset from the idle swing
        const k = 0.088; // Spring stiffness
        const damping = 0.88; // Air resistance damping
        const ax = -k * s.spring.x;
        const ay = -k * s.spring.y;
        s.spring.vx = (s.spring.vx + ax) * damping;
        s.spring.vy = (s.spring.vy + ay) * damping;
        s.spring.x += s.spring.vx;
        s.spring.y += s.spring.vy;

        finalX = idleX + s.spring.x;
        finalY = idleY + s.spring.y;
        const totalY = THREAD_LENGTH + finalY;
        finalAngleDeg = Math.atan2(finalX, Math.max(20, totalY)) * (180 / Math.PI) * 0.82;

        // When spring motion decays, seamlessly merge into idle swing
        if (Math.hypot(s.spring.x, s.spring.y) < 0.25 && Math.hypot(s.spring.vx, s.spring.vy) < 0.25) {
          s.mode = 'idle';
          s.spring = { x: 0, y: 0, vx: 0, vy: 0 };
        }
      }

      s.currentPos = { x: finalX, y: finalY };
      s.currentAngle = finalAngleDeg;

      // Hardware-accelerated direct DOM update
      applyDOM(finalX, finalY, finalAngleDeg);

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // ── MOUSE / TOUCH DRAG START ──
  const handleStart = (clientX, clientY) => {
    const s = stateRef.current;
    s.mode = 'dragging';
    s.wasDragged = false;
    s.dragStart = { x: clientX, y: clientY };
    s.dragOriginPos = { ...s.currentPos };
    s.currentDrag = { ...s.currentPos };

    if (containerRef.current) containerRef.current.classList.add('is-pulling');
  };

  // ── OMNIDIRECTIONAL DRAG MOVE ──
  const handleMove = (clientX, clientY) => {
    const s = stateRef.current;
    if (s.mode !== 'dragging') return;

    const deltaX = clientX - s.dragStart.x;
    const deltaY = clientY - s.dragStart.y;
    const rawDist = Math.hypot(deltaX, deltaY);

    if (rawDist > 7) {
      s.wasDragged = true;
    }

    // Elastic rubber-band resistance curve
    const maxPull = 130;
    const tension = rawDist > 0 ? (Math.min(maxPull, rawDist * 0.72) / rawDist) : 0;

    const targetX = s.dragOriginPos.x + deltaX * tension;
    const targetY = Math.max(-15, s.dragOriginPos.y + deltaY * tension);

    s.currentDrag = { x: targetX, y: targetY };
  };

  // ── DRAG RELEASE ──
  const handleEnd = () => {
    const s = stateRef.current;
    if (s.mode !== 'dragging') return;

    if (containerRef.current) containerRef.current.classList.remove('is-pulling');

    const dist = Math.hypot(s.currentDrag.x - s.dragOriginPos.x, s.currentDrag.y - s.dragOriginPos.y);
    if (dist > 18) {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 1400);
    }

    // Calculate spring offset relative to the continuous idle oscillation
    const maxAngleRad = 0.27;
    const idleAngle = Math.sin(s.time * 2.15) * maxAngleRad;
    const currentIdleX = THREAD_LENGTH * Math.sin(idleAngle);
    const currentIdleY = THREAD_LENGTH * (1 - Math.cos(idleAngle));

    s.mode = 'releasing';
    s.spring = {
      x: s.currentDrag.x - currentIdleX,
      y: s.currentDrag.y - currentIdleY,
      vx: 0,
      vy: 0
    };
  };

  // Global window listeners for drag move & release
  useEffect(() => {
    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e) => {
      if (e.touches && e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Click on badge navigates if not dragged
  const handleBadgeClick = (e) => {
    if (stateRef.current.wasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    navigate('/collections');
    window.scrollTo(0, 0);
  };

  return (
    <div
      ref={containerRef}
      className="hero-promo-nonintrusive"
      aria-label="Interactive 20% OFF Special Offer Seal"
    >
      {/* ── TOP ANCHOR BRACKET (MOUNTED TO CEILING) ── */}
      <div className="nonintrusive-ceiling-mount" aria-hidden="true">
        <span className="mount-bar"></span>
        <span className="mount-pin"></span>
      </div>

      {/* ── REAL-TIME 2D VECTOR STRING (NOOL) ── */}
      <svg
        ref={threadSvgRef}
        className="nonintrusive-thread-svg"
        style={{
          width: '280px',
          height: '120px',
          overflow: 'visible'
        }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="noolThreadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF9D6" />
            <stop offset="35%" stopColor="#D4AF37" />
            <stop offset="70%" stopColor="#ECC85B" />
            <stop offset="100%" stopColor="#8A6510" />
          </linearGradient>
        </defs>

        {/* Dynamic golden line connecting ceiling (140, 2) to medallion top (140 + x, totalY) */}
        <line
          ref={threadLineRef}
          x1="140"
          y1="2"
          x2="140"
          y2={THREAD_LENGTH}
          stroke="url(#noolThreadGrad)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Mid-string decorative golden bead */}
        <circle
          ref={beadRef}
          cx="140"
          cy={THREAD_LENGTH * 0.5}
          r="3.2"
          fill="url(#noolThreadGrad)"
          stroke="#5C3D06"
          strokeWidth="0.8"
        />
      </svg>

      {/* ── DRAGGABLE COMPACT GOLD MEDALLION (SMOOTH PENDULUM SWING) ── */}
      <div
        ref={medallionRef}
        className="nonintrusive-medallion-box"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          if (e.touches && e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onClick={handleBadgeClick}
        title="Pull me in any direction to swing! Click to explore."
        role="button"
        tabIndex={0}
      >
        {/* Soft Golden Background Aura */}
        <div className="nonintrusive-aura" aria-hidden="true"></div>

        {/* Sparkle Burst on Release */}
        {showBurst && (
          <div className="nonintrusive-burst" aria-hidden="true">
            <span className="burst-glyph glyph-1">✦</span>
            <span className="burst-glyph glyph-2">★</span>
            <span className="burst-glyph glyph-3">✦</span>
            <span className="burst-glyph glyph-4">★</span>
          </div>
        )}

        {/* Top Connecting Ring */}
        <div className="nonintrusive-top-ring" aria-hidden="true">
          <span className="mini-ring"></span>
        </div>

        {/* ── COMPACT VECTOR GRAPHIC (20% OFF) ── */}
        <svg
          className="nonintrusive-medallion-svg"
          viewBox="0 0 200 175"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 3D Burgundy Satin */}
            <linearGradient id="niBurgundy" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A81D35" />
              <stop offset="40%" stopColor="#7E0C20" />
              <stop offset="85%" stopColor="#4A0612" />
              <stop offset="100%" stopColor="#2A0208" />
            </linearGradient>

            {/* 3D Metallic Gold Trim */}
            <linearGradient id="niGoldTrim" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B38728" />
              <stop offset="30%" stopColor="#FFF2B2" />
              <stop offset="60%" stopColor="#ECC85B" />
              <stop offset="100%" stopColor="#8A6510" />
            </linearGradient>

            {/* 3D Metallic Gold Numbers */}
            <linearGradient id="niGold3d" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF9D6" />
              <stop offset="20%" stopColor="#F7DF8C" />
              <stop offset="42%" stopColor="#D4AF37" />
              <stop offset="58%" stopColor="#8A6510" />
              <stop offset="72%" stopColor="#FFECA8" />
              <stop offset="88%" stopColor="#B38728" />
              <stop offset="100%" stopColor="#FFF2B2" />
            </linearGradient>

            {/* Gold Banner Gradient */}
            <linearGradient id="niBannerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF5C2" />
              <stop offset="30%" stopColor="#F5D775" />
              <stop offset="60%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#A67B18" />
            </linearGradient>

            {/* 3D Depth Shadow */}
            <filter id="ni3dDepth" x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="0.2" floodColor="#FFF9D6" floodOpacity="0.8" result="hi" />
              <feDropShadow dx="0" dy="2.5" stdDeviation="0" floodColor="#7A530A" floodOpacity="1" result="b1" />
              <feDropShadow dx="0" dy="4" stdDeviation="0" floodColor="#422902" floodOpacity="1" result="b2" />
              <feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#000000" floodOpacity="0.75" result="sh" />
              <feMerge>
                <feMergeNode in="sh" />
                <feMergeNode in="b2" />
                <feMergeNode in="b1" />
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="hi" />
              </feMerge>
            </filter>
          </defs>

          {/* Golden Laurel Ring */}
          <circle cx="100" cy="92" r="58" fill="none" stroke="url(#niGoldTrim)" strokeWidth="0.8" strokeDasharray="3 2" strokeOpacity="0.55" />

          {/* Left Laurel Leaves */}
          <path d="M48 102 C44 82 55 64 70 50" fill="none" stroke="url(#niGoldTrim)" strokeWidth="1" />
          <path d="M46 95 C41 93 40 88 43 86 C47 84 48 89 46 95 Z" fill="url(#niGold3d)" />
          <path d="M46 82 C41 80 40 75 44 73 C48 71 49 76 46 82 Z" fill="url(#niGold3d)" />
          <path d="M50 70 C45 66 45 61 49 59 C53 58 54 64 50 70 Z" fill="url(#niGold3d)" />

          {/* Right Laurel Leaves */}
          <path d="M152 102 C156 82 145 64 130 50" fill="none" stroke="url(#niGoldTrim)" strokeWidth="1" />
          <path d="M154 95 C159 93 160 88 157 86 C153 84 152 89 154 95 Z" fill="url(#niGold3d)" />
          <path d="M154 82 C159 80 160 75 156 73 C152 71 151 76 154 82 Z" fill="url(#niGold3d)" />
          <path d="M150 70 C155 66 155 61 151 59 C147 58 146 64 150 70 Z" fill="url(#niGold3d)" />

          {/* ── Top Arched Burgundy Ribbon ("Special Offer") ── */}
          <g>
            <path d="M28 42 L40 38 L39 52 L28 54 L32 48 Z" fill="url(#niBurgundy)" stroke="url(#niGoldTrim)" strokeWidth="0.7" />
            <path d="M172 42 L160 38 L161 52 L172 54 L168 48 Z" fill="url(#niBurgundy)" stroke="url(#niGoldTrim)" strokeWidth="0.7" />
            <path
              d="M38 44 C66 28 134 28 162 44 L158 57 C132 42 68 42 42 57 Z"
              fill="url(#niBurgundy)"
              filter="drop-shadow(0 3px 6px rgba(0,0,0,0.5))"
            />
            <path d="M38 44 C66 28 134 28 162 44" fill="none" stroke="url(#niGoldTrim)" strokeWidth="1.8" />
            <path d="M42 57 C68 42 132 42 158 57" fill="none" stroke="url(#niGoldTrim)" strokeWidth="1.2" />

            <path id="niSpecialCurve" d="M46 52 C72 37 128 37 154 52" fill="none" />
            <text className="ni-special-text">
              <textPath href="#niSpecialCurve" startOffset="50%" textAnchor="middle">
                Special Offer
              </textPath>
            </text>
          </g>

          {/* ── 3D Gold "20% OFF" ── */}
          <g filter="url(#ni3dDepth)">
            {/* 20 */}
            <text
              x="62"
              y="112"
              fontFamily="'Playfair Display', Georgia, serif"
              fontWeight="900"
              fontSize="60"
              fill="url(#niGold3d)"
              letterSpacing="-2"
            >
              20
            </text>
            {/* % */}
            <text
              x="126"
              y="85"
              fontFamily="'Playfair Display', Georgia, serif"
              fontWeight="900"
              fontSize="28"
              fill="url(#niGold3d)"
            >
              %
            </text>
            {/* OFF */}
            <text
              x="127"
              y="108"
              fontFamily="'Cinzel', 'Playfair Display', serif"
              fontWeight="900"
              fontSize="18"
              letterSpacing="1"
              fill="url(#niGold3d)"
            >
              OFF
            </text>
          </g>

          {/* ── Golden Satin Banner ("★ FOR ALL ★") ── */}
          <g>
            <path d="M25 133 L38 126 L37 144 L25 148 L30 140 Z" fill="url(#niBannerGrad)" stroke="#7A530A" strokeWidth="0.5" />
            <path d="M175 133 L162 126 L163 144 L175 148 L170 140 Z" fill="url(#niBannerGrad)" stroke="#7A530A" strokeWidth="0.5" />
            <path
              d="M36 130 C66 124 134 124 164 130 L161 146 C131 141 69 141 39 146 Z"
              fill="url(#niBannerGrad)"
              filter="drop-shadow(0 3px 8px rgba(0,0,0,0.5))"
            />
            <path d="M36 130 C66 124 134 124 164 130" fill="none" stroke="#FFF7D6" strokeWidth="0.8" />
            <path d="M39 146 C69 141 131 141 161 146" fill="none" stroke="#7A530A" strokeWidth="0.8" />

            <text
              x="100"
              y="140"
              textAnchor="middle"
              fontFamily="'Cinzel', 'Poppins', sans-serif"
              fontWeight="900"
              fontSize="8.5"
              letterSpacing="2"
              fill="#4A0E17"
            >
              ★ FOR ALL PRODUCTS ★
            </text>
          </g>

          {/* Little Stars */}
          <g fill="url(#niGoldTrim)">
            <path d="M164 32 Q164 35 167 35 Q164 35 164 38 Q164 35 161 35 Q164 35 164 32 Z" />
            <path d="M36 68 Q36 71 39 71 Q36 71 36 74 Q36 71 33 71 Q36 71 36 68 Z" />
          </g>
        </svg>

        {/* ── Compact SHOP NOW Button ── */}
        <div className="nonintrusive-action">
          <span className="nonintrusive-btn">
            SHOP NOW &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}
