import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff, Phone, Lock } from 'lucide-react';

// Use relative URL for proxy
const API = "/api";

const LoginModal = ({ isOpen, onClose, initialRole = 'client' }) => {
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [step, setStep] = useState('login'); // 'login', 'otp', 'forgot-password', 'reset-password'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    }
  }, [initialRole]);

  if (!isOpen) return null;

  // Check if user has password when phone is entered
  const checkPasswordStatus = async (phoneNumber) => {
    try {
      const response = await axios.get(`${API}/auth/check-password-status?phone=${phoneNumber}`);
      setHasPassword(response.data.has_password);
      if (response.data.has_password) {
        setLoginMethod('password');
      } else {
        setLoginMethod('otp');
      }
    } catch (err) {
      // If check fails, default to OTP
      setLoginMethod('otp');
    }
  };

  const handlePhoneBlur = () => {
    if (phone && phone.length === 10) {
      checkPasswordStatus(phone);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login-with-password`, {
        phone,
        password
      });

      await login(response.data.token, response.data.user);
      onClose();
      
      // Navigate to dashboard after successful login
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('Password not set')) {
        setError('Password not set. Please use OTP login.');
        setLoginMethod('otp');
      } else {
        setError(err.response?.data?.detail || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${API}/auth/send-otp`, { phone });
      alert('✅ OTP sent successfully! Check your mobile.');
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/verify-otp`, {
        phone,
        otp,
        role,
        name: name || undefined
      });

      console.log('OTP Verification Response:', response.data);
      console.log('Password Set Status:', response.data.user.password_set);

      await login(response.data.token, response.data.user);
      
      // Close modal first
      onClose();
      
      // Check if user needs to set password
      if (!response.data.user.password_set) {
        console.log('Redirecting to set-password page');
        // Redirect to set password page
        setTimeout(() => {
          navigate('/set-password');
        }, 100);
      } else {
        console.log('Password already set, redirecting to dashboard');
        // Navigate to dashboard after successful login
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      }
    } catch (err) {
      console.error('OTP Verification Error:', err);
      setError(err.response?.data?.detail || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${API}/auth/forgot-password-otp`, { phone });
      alert('✅ OTP sent for password reset!');
      setStep('reset-password');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${API}/auth/reset-password`, {
        phone,
        otp,
        new_password: newPassword
      });

      alert('✅ Password reset successful! You can now login.');
      setStep('login');
      setLoginMethod('password');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('login');
    setLoginMethod('password');
    setPhone('');
    setPassword('');
    setOtp('');
    setNewPassword('');
    setError('');
    setName('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl relative">
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to KoPartner</h2>
          <p className="text-purple-100">Your companion for emotional wellness</p>
        </div>

        <div className="p-6">
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">I want to:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setRole('client')}
                className={`py-3 px-4 rounded-lg font-semibold transition ${
                  role === 'client'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Find
              </button>
              <button
                onClick={() => setRole('cuddlist')}
                className={`py-3 px-4 rounded-lg font-semibold transition ${
                  role === 'cuddlist'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Offer
              </button>
              <button
                onClick={() => setRole('both')}
                className={`py-3 px-4 rounded-lg font-semibold transition ${
                  role === 'both'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Both
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          {step === 'login' && (
            <div>
              <form onSubmit={loginMethod === 'password' ? handlePasswordLogin : handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number (User ID) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onBlur={handlePhoneBlur}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                      maxLength="10"
                    />
                  </div>
                </div>

                {loginMethod === 'password' && hasPassword && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep('forgot-password')}
                      className="text-sm text-purple-600 hover:text-purple-700 mt-2"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {!hasPassword && role !== 'client' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required={role !== 'client'}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !phone || (loginMethod === 'password' && !password)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-xl transition disabled:opacity-50"
                >
                  {loading ? 'Please wait...' : (loginMethod === 'password' ? 'Login' : 'Send OTP')}
                </button>
              </form>

              {hasPassword && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setLoginMethod('otp')}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Login with OTP instead
                  </button>
                </div>
              )}
            </div>
          )}

          {/* OTP Verification */}
          {step === 'otp' && (
            <div>
              <p className="text-gray-600 mb-4">Enter the 6-digit OTP sent to +91 {phone}</p>
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-center text-2xl tracking-widest"
                    maxLength="6"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-xl transition disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full text-gray-600 hover:text-gray-800"
                >
                  ← Back to Login
                </button>
              </form>
            </div>
          )}

          {/* Forgot Password */}
          {step === 'forgot-password' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Reset Password</h3>
              <p className="text-gray-600 mb-4">Enter your mobile number to receive OTP</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter mobile number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                    maxLength="10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-xl transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full text-gray-600 hover:text-gray-800"
                >
                  ← Back to Login
                </button>
              </form>
            </div>
          )}

          {/* Reset Password with OTP */}
          {step === 'reset-password' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Reset Password</h3>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    maxLength="6"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                    minLength="6"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !otp || !newPassword}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-xl transition disabled:opacity-50"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full text-gray-600 hover:text-gray-800"
                >
                  ← Back to Login
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
