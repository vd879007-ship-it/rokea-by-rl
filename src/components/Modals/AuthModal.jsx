import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useModal } from '../../context/ModalContext';

export default function AuthModal() {
  const { authOpen, closeAuth, authMode, setAuthMode, openAdmin } = useModal();
  const { login, register, loginWithGoogle, quickCustomerLogin, showToast } = useStore();

  const [loginMethod, setLoginMethod] = useState('quick'); // 'quick' | 'password'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Quick login state
  const [quickName, setQuickName] = useState('');
  const [quickEmail, setQuickEmail] = useState('');

  // Password Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');

  if (!authOpen) return null;

  const handleQuickLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanMail = (quickEmail || loginEmail || '').trim();
    if (!cleanMail || !cleanMail.includes('@')) {
      alert('Please enter a valid email address (e.g. yourname@gmail.com) so we can send your reminder and order confirmations.');
      return;
    }
    setLoading(true);
    try {
      const res = await quickCustomerLogin(quickName || cleanMail.split('@')[0], cleanMail);
      setLoading(false);
      closeAuth();
      showToast('Welcome to ROKEA by RK', 'success', `Signed in as ${res.user?.name || cleanMail}!`);
    } catch (err) {
      setLoading(false);
      alert(err.message || 'Login failed. Please try again.');
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const demoEmail = 'dineshrk.boutique@gmail.com';
      const res = await quickCustomerLogin('Dinesh Kumar', demoEmail);
      setLoading(false);
      closeAuth();
      showToast('Demo Customer Active', 'success', `Logged in as ${demoEmail} for instant cart reminder testing!`);
    } catch (err) {
      setLoading(false);
      alert(err.message || 'Demo login failed');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(loginEmail, loginPass);
      setLoading(false);
      closeAuth();
      if (res.isAdmin) {
        showToast('Welcome Boutique Admin', 'success');
        openAdmin();
      } else {
        showToast('Logged in successfully', 'success', 'Welcome back to ROKEA by RK!');
      }
    } catch (err) {
      setLoading(false);
      alert(err.message || 'Login failed');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPass) {
      alert('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await register(regName, regEmail, regPhone, regPass);
      setLoading(false);
      closeAuth();
      showToast('Account Created!', 'success', 'Welcome to ROKEA by RK family.');
    } catch (err) {
      setLoading(false);
      alert(err.message || 'Registration failed');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      setLoading(false);
      if (res && res.redirecting) {
        showToast('Connecting to Google...', 'info');
        return;
      }
      if (res && res.success) {
        closeAuth();
        showToast('Logged in successfully', 'success', `Welcome back, ${res.user?.name || 'Customer'}!`);
      }
    } catch (err) {
      setLoading(false);
      console.error("Google sign in error:", err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        alert("Google Sign-In popup was closed or blocked by browser cookies. Please use the 'Quick Access (No Password)' sign-in right here!");
        return;
      }
      if (err.code === 'auth/operation-not-allowed') {
        alert("Google Sign-In is not enabled yet in your Firebase project. Please enable Google provider under Authentication -> Sign-in method in Firebase Console, or use Quick Access with Email!");
        return;
      }
      if (err.code === 'auth/unauthorized-domain') {
        alert(`This domain (${window.location.hostname}) is not authorized in Firebase Console -> Authentication -> Settings -> Authorized Domains. Please use Quick Access with Email!`);
        return;
      }
      alert(err.message || 'Google Sign-In failed. Please try Quick Access with Email below.');
    }
  };

  const isLogin = authMode === 'login';

  return (
    <div
      className="modal"
      id="authModal"
      style={{ display: 'flex' }}
      onClick={(e) => {
        if (e.target.id === 'authModal') closeAuth();
      }}
    >
      <div className="modal-content auth-modal-card">
        <span className="modal-close auth-card-close" onClick={closeAuth}>
          &times;
        </span>

        <div className="auth-card-grid">
          {/* Left Column: Branding, Lotus Motif & Saree Visual */}
          <div className="auth-card-left">
            <div className="auth-left-decor-top" aria-hidden="true">
              <svg viewBox="0 0 100 100" width="70" height="70" fill="none" stroke="rgba(107, 19, 39, 0.12)" strokeWidth="1.2">
                <path d="M5 95 C 15 50, 45 15, 95 5 M35 50 C 20 38, 15 22, 25 12 C 38 18, 48 30, 35 50 M55 32 C 50 15, 62 8, 72 15 C 68 28, 62 38, 55 32 M68 68 C 50 62, 42 75, 50 85 C 62 80, 72 72, 68 68" />
              </svg>
            </div>

            <div className="auth-left-content">
              {/* Lotus with flanking lines */}
              <div className="auth-lotus-row">
                <span className="auth-lotus-line"></span>
                <span className="auth-lotus-icon">
                  <svg viewBox="0 0 24 18" width="24" height="18" fill="none" stroke="#6B1327" strokeWidth="1.3">
                    <path d="M12 2 C12 2, 9 7, 9 12 C9 14.5, 10.5 16, 12 16 C13.5 16, 15 14.5, 15 12 C15 7, 12 2, 12 2 Z" fill="rgba(107, 19, 39, 0.12)" />
                    <path d="M12 2 C12 2, 5 7, 4 11.5 C3 14, 6 16, 8.5 16 C10 16, 11 14.5, 11 13" />
                    <path d="M12 2 C12 2, 19 7, 20 11.5 C21 14, 18 16, 15.5 16 C14 16, 13 14.5, 13 13" />
                  </svg>
                </span>
                <span className="auth-lotus-line"></span>
              </div>

              {/* Brand Name */}
              <h2 className="auth-brand-name">ROKEA</h2>
              <div className="auth-brand-tagline">by RK</div>

              <p className="auth-brand-quote" id="authBrandQuote">
                <em>{isLogin ? 'Sign in to continue your elegant journey with us.' : 'Sign up to begin your elegant journey with us.'}</em>
              </p>
            </div>

            {/* Bottom Visual: Saree & Jasmine */}
            <div className="auth-left-bottom-visual">
              <img src="/auth_saree_art.png" alt="ROKEA Heritage Saree & Jasmine" className="auth-saree-img" />
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="auth-card-right">
            {/* Top Method Switcher: Quick Access vs Password */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: '#F5EFEB', padding: 4, borderRadius: 24 }}>
              <button
                type="button"
                onClick={() => setLoginMethod('quick')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: 20,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: loginMethod === 'quick' ? '#6B1327' : 'transparent',
                  color: loginMethod === 'quick' ? '#FFF' : '#695B50'
                }}
              >
                ✨ Quick Access
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('password')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: 20,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: loginMethod === 'password' ? '#6B1327' : 'transparent',
                  color: loginMethod === 'password' ? '#FFF' : '#695B50'
                }}
              >
                🔑 Password / Admin
              </button>
            </div>

            {loginMethod === 'quick' ? (
              /* QUICK SIGN IN (FASTEST & 100% RELIABLE) */
              <div className="auth-form-pane">
                <h3 className="auth-main-title">Instant Sign In</h3>
                <p className="auth-main-subtitle">Enter your email to receive exclusive bag reminders & discounts.</p>

                <form className="auth-inner-form" onSubmit={handleQuickLoginSubmit}>
                  {/* Name Input */}
                  <div className="auth-input-pill">
                    <span className="auth-field-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8C7D6E" strokeWidth="1.8">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Your Name (Optional)"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                    />
                  </div>

                  {/* Email Input */}
                  <div className="auth-input-pill">
                    <span className="auth-field-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8C7D6E" strokeWidth="1.8">
                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                    </span>
                    <input
                      type="email"
                      placeholder="Your Email (e.g. name@gmail.com)"
                      required
                      value={quickEmail}
                      onChange={(e) => setQuickEmail(e.target.value)}
                    />
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="auth-submit-maroon-btn" disabled={loading} style={{ marginTop: 8 }}>
                    <span>{loading ? 'Signing In...' : 'Continue as Customer'}</span>
                    <span className="btn-arrow">→</span>
                  </button>

                  {/* Divider */}
                  <div className="auth-sep-divider" style={{ margin: '14px 0 10px 0' }}>
                    <span className="sep-line"></span>
                    <span className="sep-text">or sign in with</span>
                    <span className="sep-line"></span>
                  </div>

                  {/* Google Social Button */}
                  <div className="auth-social-buttons" style={{ marginBottom: 10 }}>
                    <button
                      type="button"
                      className="auth-social-btn"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </div>

                  {/* 1-Click Demo Login for quick testing */}
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(212, 175, 55, 0.1)',
                      border: '1px dashed #D4AF37',
                      borderRadius: 24,
                      color: '#8A6510',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <span>⚡</span> 1-Click Instant Demo Login (For Email Test)
                  </button>
                </form>
              </div>
            ) : isLogin ? (
              /* VIEW 1: PASSWORD SIGN IN */
              <div id="loginView" className="auth-form-pane">
                <h3 className="auth-main-title">Sign In</h3>
                <p className="auth-main-subtitle">Welcome back! Please sign in to your account.</p>

                <form className="auth-inner-form" onSubmit={handleLoginSubmit}>
                  {/* Input: Email/Mobile */}
                  <div className="auth-input-pill">
                    <span className="auth-field-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8C7D6E" strokeWidth="1.8">
                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="loginEmail"
                      placeholder="Email address or admin"
                      required
                      autoComplete="username"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>

                  {/* Input: Password */}
                  <div className="auth-input-pill">
                    <span className="auth-field-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8C7D6E" strokeWidth="1.8">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="loginPass"
                      placeholder="Password"
                      required
                      autoComplete="current-password"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg className="eye-closed" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8C7D6E" strokeWidth="1.8">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg className="eye-open" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8C7D6E" strokeWidth="1.8">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Options Row */}
                  <div className="auth-options-row">
                    <label className="auth-remember-check">
                      <input type="checkbox" defaultChecked />
                      <span className="check-box-custom"></span>
                      <span className="check-label">Remember me</span>
                    </label>
                    <a
                      href="javascript:void(0)"
                      onClick={() => alert('Password reset link will be sent to your registered email.')}
                      className="auth-forgot-link"
                    >
                      Forgot password?
                    </a>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="auth-submit-maroon-btn" disabled={loading}>
                    <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                    <span className="btn-arrow">→</span>
                  </button>

                  {/* Divider */}
                  <div className="auth-sep-divider">
                    <span className="sep-line"></span>
                    <span className="sep-text">or</span>
                    <span className="sep-line"></span>
                  </div>

                  {/* Social Login Buttons */}
                  <div className="auth-social-buttons">
                    <button
                      type="button"
                      className="auth-social-btn"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </div>

                  {/* Switch to Sign Up */}
                  <p className="auth-toggle-prompt">
                    Don't have an account?{' '}
                    <a href="javascript:void(0)" onClick={() => setAuthMode('register')} className="auth-toggle-btn">
                      Sign Up
                    </a>
                  </p>
                </form>
              </div>
            ) : (
              /* VIEW 2: SIGN UP */
              <div id="registerView" className="auth-form-pane">
                <h3 className="auth-main-title">Sign Up</h3>
                <p className="auth-main-subtitle">Create your account to start your journey.</p>

                <form className="auth-inner-form" onSubmit={handleRegisterSubmit}>
                  {/* Full Name */}
                  <div className="auth-input-pill">
                    <span className="auth-field-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8C7D6E" strokeWidth="1.8">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="regName"
                      placeholder="Full Name"
                      required
                      autoComplete="name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                    />
                  </div>

                  {/* Email */}
                  <div className="auth-input-pill">
                    <span className="auth-field-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8C7D6E" strokeWidth="1.8">
                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                    </span>
                    <input
                      type="email"
                      id="regEmail"
                      placeholder="Email address"
                      required
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>

                  {/* Phone */}
                  <div className="auth-input-pill">
                    <span className="auth-field-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8C7D6E" strokeWidth="1.8">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </span>
                    <input
                      type="tel"
                      id="regPhone"
                      placeholder="Mobile number"
                      required
                      autoComplete="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>

                  {/* Password */}
                  <div className="auth-input-pill">
                    <span className="auth-field-icon">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8C7D6E" strokeWidth="1.8">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="regPass"
                      placeholder="Create Password"
                      required
                      autoComplete="new-password"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <svg className="eye-closed" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8C7D6E" strokeWidth="1.8">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg className="eye-open" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8C7D6E" strokeWidth="1.8">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="auth-submit-maroon-btn" disabled={loading}>
                    <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                    <span className="btn-arrow">→</span>
                  </button>

                  {/* Divider */}
                  <div className="auth-sep-divider">
                    <span className="sep-line"></span>
                    <span className="sep-text">or</span>
                    <span className="sep-line"></span>
                  </div>

                  {/* Social Login Buttons */}
                  <div className="auth-social-buttons">
                    <button
                      type="button"
                      className="auth-social-btn"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </div>

                  {/* Switch to Sign In */}
                  <p className="auth-toggle-prompt">
                    Already have an account?{' '}
                    <a href="javascript:void(0)" onClick={() => setAuthMode('login')} className="auth-toggle-btn">
                      Sign In
                    </a>
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
