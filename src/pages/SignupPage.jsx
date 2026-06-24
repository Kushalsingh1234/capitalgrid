import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signup, googleLogin } = useAuth();
  const navigate = useNavigate();

  // --- States ---
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Client Side Validation checks ---
  const validateForm = () => {
    if (!fullName.trim()) {
      return 'Please enter your full name.';
    }
    
    if (!email.trim()) {
      return 'Please enter your email address.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address.';
    }

    if (!password) {
      return 'Please enter a password.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const numberRegex = /[0-9]/;
    if (!uppercaseRegex.test(password) || !lowercaseRegex.test(password) || !numberRegex.test(password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number.';
    }

    if (password !== confirmPassword) {
      return 'Password confirmation does not match.';
    }

    return '';
  };

  // --- Handlers ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(fullName, email, password);
      navigate('/app/startup-registration');
    } catch (err) {
      setErrorMsg(err.message || 'Signup failed. Please try again.');
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
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyanGlow/5 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blueGlow/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '3s' }}></div>

      {/* Main Signup Frame */}
      <div className="glass-card max-w-md w-full p-8 border border-white/5 shadow-2xl relative z-10 my-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block h-10 mb-6">
            <img src="/assets/logo.svg" alt="CapitalGrid Logo" className="h-full" />
          </Link>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
            Build Your Legacy.
          </h2>
          <p className="text-xs text-text-secondary mt-2">
            Millions of opportunities begin with one company.
          </p>
        </div>

        {/* Validation Errors Panel */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-900/35 border border-red-500/30 rounded text-red-400 text-xs flex items-start gap-3 animate-shake">
            <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-display uppercase tracking-widest text-text-secondary">
              Founder Full Name
            </label>
            <input 
              type="text" 
              className="glass-input text-sm py-2 px-3" 
              placeholder="Elon Musk"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-display uppercase tracking-widest text-text-secondary">
              Email Address
            </label>
            <input 
              type="email" 
              className="glass-input text-sm py-2 px-3" 
              placeholder="elon@spacex.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-display uppercase tracking-widest text-text-secondary">
              Access Code (Password)
            </label>
            <input 
              type="password" 
              className="glass-input text-sm py-2 px-3" 
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-display uppercase tracking-widest text-text-secondary">
              Confirm Access Code
            </label>
            <input 
              type="password" 
              className="glass-input text-sm py-2 px-3" 
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full py-3 mt-3 shadow-cyan"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-circle-notch animate-spin"></i> Initializing...
              </span>
            ) : (
              <span>Create Account <i className="fa-solid fa-user-plus ml-1"></i></span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="text-[9px] font-display uppercase tracking-widest text-text-muted px-4">
            OR REGISTER WITH
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

        {/* Account Login redirection link */}
        <div className="text-center mt-6 pt-5 border-t border-white/5">
          <p className="text-xs text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-cyanGlow font-bold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
