import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  // --- States ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Handlers ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/app/startup-registration');
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/app/startup-registration');
    } catch (err) {
      setErrorMsg(err.message || 'Google authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMsg('Google Sign-In popup process encountered an error.');
  };

  return (
    <div className="bg-gameBg min-h-screen text-white flex items-center justify-center relative overflow-hidden font-body px-4">
      {/* Background Overlays */}
      <div className="grid-overlay"></div>
      <div className="glow-radial-overlay"></div>
      
      {/* Animated Ambient Glow Dots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyanGlow/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blueGlow/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Main Login Frame */}
      <div className="glass-card max-w-md w-full p-8 border border-white/5 shadow-2xl relative z-10 my-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block h-10 mb-6">
            <img src="/assets/logo.svg" alt="CapitalGrid Logo" className="h-full" />
          </Link>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
            Welcome Back, Entrepreneur.
          </h2>
          <p className="text-xs text-text-secondary mt-2">
            Your companies are waiting for you.
          </p>
        </div>

        {/* Validation Errors Panel */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-900/35 border border-red-500/30 rounded text-red-400 text-xs flex items-start gap-3 animate-shake">
            <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-display uppercase tracking-widest text-text-secondary">
              Email Address
            </label>
            <input 
              type="email" 
              className="glass-input text-sm" 
              placeholder="ceo@capitalgrid.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-display uppercase tracking-widest text-text-secondary">
                Secure Password
              </label>
              <button 
                type="button" 
                onClick={() => setErrorMsg('Password recovery process is under system maintenance.')}
                className="text-[10px] font-display uppercase tracking-widest text-cyanGlow hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <input 
              type="password" 
              className="glass-input text-sm" 
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full py-3 mt-2 shadow-cyan"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-circle-notch animate-spin"></i> Processing...
              </span>
            ) : (
              <span>Login <i className="fa-solid fa-right-to-bracket ml-1"></i></span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="text-[10px] font-display uppercase tracking-widest text-text-muted px-4">
            OR SIGN IN WITH
          </span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        {/* Google Popup Sign-in Button */}
        <div className="flex justify-center border border-white/5 rounded overflow-hidden bg-white/2 hover:border-cyanGlow/30 transition-all">
          <GoogleLogin 
            onSuccess={handleGoogleSuccess} 
            onError={handleGoogleError}
            theme="dark"
            size="large"
            width="384px"
          />
        </div>

        {/* Create Account Redirection link */}
        <div className="text-center mt-8 pt-6 border-t border-white/5">
          <p className="text-xs text-text-secondary">
            New to the simulation?{' '}
            <Link to="/signup" className="text-cyanGlow font-bold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
