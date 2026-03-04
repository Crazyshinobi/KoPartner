/**
 * KOPARTNER LOGIN/SIGNUP MODAL - PERFECT & BULLETPROOF
 * =====================================================
 * Complete authentication UI with:
 * - OTP-based login/signup
 * - Password login
 * - Role selection (Find/Offer/Both)
 * - Perfect error handling
 * - Sentry error tracking for production debugging
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Sentry } from '../instrument';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Phone, Lock, Eye, EyeOff, MapPin, User, Mail, Loader2 } from 'lucide-react';

const API = "/api";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const cleanPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
};

const validatePhone = (phone) => {
  const clean = cleanPhone(phone);
  return clean.length === 10;
};

const validateOTP = (otp) => {
  if (!otp) return false;
  const clean = otp.trim();
  return clean.length === 6 && /^\d+$/.test(clean);
};

const validateEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// API FUNCTIONS - Direct calls, no retries (handled by backend)
// ============================================================================

const apiCall = async (method, url, data) => {
  const startTime = Date.now();
  try {
    const response = await axios({
      method,
      url,
      data,
      timeout: 15000, // 15 second timeout
      headers: { 'Content-Type': 'application/json' }
    });
    const elapsed = Date.now() - startTime;
    console.log(`[API] ${method} ${url} - ${elapsed}ms`);
    return response;
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`[API] ${method} ${url} FAILED after ${elapsed}ms:`, err.message);
    
    // Capture API errors in Sentry for debugging
    if (err.response?.status >= 500 || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
      Sentry.captureException(err, {
        tags: { flow: 'auth', endpoint: url },
        extra: { elapsed, status: err.response?.status }
      });
    }
    
    throw err;
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const LoginModal = ({ isOpen, onClose, initialRole = 'client' }) => {
  // State
  const [step, setStep] = useState('otp-form'); // 'otp-form', 'otp-verify', 'password-form'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Hooks
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Reset role when initialRole changes
  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);
  
  // ========================================================================
  // FORM HANDLERS
  // ========================================================================
  
  const resetForm = useCallback(() => {
    setStep('otp-form');
    setPhone('');
    setOtp('');
    setPassword('');
    setName('');
    setEmail('');
    setCity('');
    setPincode('');
    setError('');
    setSuccess('');
    setShowPassword(false);
  }, []);
  
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);
  
  // ========================================================================
  // SEND OTP
  // ========================================================================
  
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate phone
    const cleanedPhone = cleanPhone(phone);
    if (!validatePhone(cleanedPhone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    // Validate required fields for new users
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!email.trim() || !validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!city.trim()) {
      setError('Please enter your city');
      return;
    }
    
    if ((role === 'cuddlist' || role === 'both') && pincode.length !== 6) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await apiCall('POST', `${API}/auth/send-otp`, { phone: cleanedPhone });
      
      if (response.data?.success) {
        setSuccess('OTP sent successfully! Check your mobile.');
        setStep('otp-verify');
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      const status = err.response?.status;
      
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        setError('Network error. Please check your internet connection.');
      } else if (status === 429) {
        setError('Too many requests. Please wait a minute and try again.');
      } else if (status === 503) {
        setError('Server is busy. Please try again in a few seconds.');
      } else {
        setError(detail || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // ========================================================================
  // VERIFY OTP
  // ========================================================================
  
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate OTP
    const cleanedOtp = otp.replace(/\s/g, '').trim();
    if (!cleanedOtp || cleanedOtp.length !== 6 || !/^\d+$/.test(cleanedOtp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await apiCall('POST', `${API}/auth/verify-otp`, {
        phone: cleanPhone(phone),
        otp: cleanedOtp,
        role,
        name: name.trim(),
        email: email.trim(),
        city: city.trim(),
        pincode: pincode.trim() || undefined
      });
      
      // Success - login user
      login(response.data.token, response.data.user);
      handleClose();
      
      // Redirect based on password status
      const userData = response.data.user;
      await wait(200);
      
      if (!userData.password_set) {
        navigate('/set-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      
      if (detail?.includes('expired') || detail?.includes('not found')) {
        setError('OTP expired or not found. Please request a new OTP.');
      } else if (detail?.includes('Incorrect') || detail?.includes('attempt')) {
        setError(detail);
      } else if (detail?.includes('Too many')) {
        setError('Too many incorrect attempts. Please request a new OTP.');
        setStep('otp-form');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(detail || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // ========================================================================
  // PASSWORD LOGIN
  // ========================================================================
  
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate inputs
    const cleanedPhone = cleanPhone(phone);
    if (!validatePhone(cleanedPhone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await apiCall('POST', `${API}/auth/password-login`, {
        phone: cleanedPhone,
        password
      }, { maxRetries: 2 });
      
      // Success - login user
      login(response.data.token, response.data.user);
      handleClose();
      
      await wait(200);
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      
      if (detail?.includes('Password not set')) {
        setError('Password not set. Please use OTP login first, then set your password.');
        setStep('otp-form');
      } else if (detail?.includes('Account not found')) {
        setError('Account not found. Please signup using OTP login.');
      } else if (detail?.includes('Incorrect password')) {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please check your internet connection.');
      } else if (err.response?.status === 429) {
        setError('Too many attempts. Please wait a minute.');
      } else {
        setError(detail || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // ========================================================================
  // RESEND OTP
  // ========================================================================
  
  const handleResendOTP = async () => {
    setError('');
    setLoading(true);
    
    try {
      await apiCall('POST', `${API}/auth/send-otp`, { phone: cleanPhone(phone) });
      setSuccess('New OTP sent successfully!');
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  if (!isOpen) return null;
  
  const isOTPFormValid = validatePhone(phone) && name.trim() && validateEmail(email) && city.trim() && 
    ((role === 'client') || (pincode.length === 6));
  
  const isPasswordFormValid = validatePhone(phone) && password;
  
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            data-testid="close-modal-btn"
            aria-label="Close"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold text-white">Welcome to KoPartner</h2>
          <p className="text-purple-100 mt-1">Your social & lifestyle support platform</p>
        </div>
        
        <div className="p-6">
          {/* Tab Switcher (only on form steps) */}
          {step !== 'otp-verify' && (
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => { setStep('otp-form'); setError(''); }}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  step === 'otp-form' 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                data-testid="tab-otp"
              >
                Login with OTP
              </button>
              <button
                type="button"
                onClick={() => { setStep('password-form'); setError(''); }}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  step === 'password-form' 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                data-testid="tab-password"
              >
                Login with Password
              </button>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
          
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {success}
            </div>
          )}
          
          {/* ================================================================
              OTP LOGIN FORM
              ================================================================ */}
          {step === 'otp-form' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">I want to:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'client', label: 'Find' },
                    { value: 'cuddlist', label: 'Offer' },
                    { value: 'both', label: 'Both' }
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        role === value
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      data-testid={`role-${value}-btn`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow"
                    maxLength="10"
                    data-testid="phone-input"
                  />
                </div>
              </div>
              
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow"
                    data-testid="name-input"
                  />
                </div>
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow"
                    data-testid="email-input"
                  />
                </div>
              </div>
              
              {/* City & Pincode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Your city"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow"
                      data-testid="city-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode {(role === 'cuddlist' || role === 'both') && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow"
                    maxLength="6"
                    data-testid="pincode-input"
                  />
                </div>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isOTPFormValid}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                data-testid="send-otp-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          )}
          
          {/* ================================================================
              OTP VERIFICATION FORM
              ================================================================ */}
          {step === 'otp-verify' && (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                Enter the 6-digit OTP sent to <strong>+91 {phone}</strong>
              </p>
              
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-2xl tracking-[0.5em] font-mono transition-all"
                    maxLength="6"
                    autoFocus
                    data-testid="otp-input"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !validateOTP(otp)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  data-testid="verify-otp-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </form>
              
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep('otp-form'); setOtp(''); setError(''); }}
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  ← Change Number
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}
          
          {/* ================================================================
              PASSWORD LOGIN FORM
              ================================================================ */}
          {step === 'password-form' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow"
                    maxLength="10"
                    data-testid="phone-input-password"
                  />
                </div>
              </div>
              
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow"
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isPasswordFormValid}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                data-testid="password-login-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
              
              <p className="text-center text-sm text-gray-500">
                Don't have a password?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('otp-form'); setError(''); }}
                  className="text-purple-600 font-semibold hover:text-purple-700"
                >
                  Login with OTP
                </button>
              </p>
            </form>
          )}
          
          {/* Footer */}
          <p className="text-xs text-gray-500 text-center mt-6">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-purple-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
