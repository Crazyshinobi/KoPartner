import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { X, Heart } from 'lucide-react';

// Use relative URL for proxy
const API = "/api";

const AuthModal = ({ isOpen, onClose, initialRole = 'client' }) => {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/send-otp`, { phone });
      // OTP is sent via SMS - check your mobile
      alert('✅ OTP sent successfully! Please check your mobile for the 6-digit code.');
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

      login(response.data.token, response.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          data-testid="auth-modal-close-button"
        >
          <X size={24} />
        </button>

        {step === 'phone' && (
          <div data-testid="auth-phone-step">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full">
                <Heart size={32} className="text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Welcome to Kopartner</h2>
            <p className="text-gray-600 text-center mb-8">Your emotional wellness companion</p>

            <form onSubmit={handleSendOTP}>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500 font-medium">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
                    maxLength={10}
                    required
                    data-testid="phone-input"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-gray-700">I want to join as</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`py-3 px-3 rounded-xl border-2 transition font-medium text-sm ${
                      role === 'client'
                        ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-md'
                        : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/30'
                    }`}
                    data-testid="role-client-button"
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('cuddlist')}
                    className={`py-3 px-3 rounded-xl border-2 transition font-medium text-sm ${
                      role === 'cuddlist'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
                    }`}
                    data-testid="role-cuddlist-button"
                  >
                    KoPartner
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('both')}
                    className={`py-3 px-3 rounded-xl border-2 transition font-medium text-sm ${
                      role === 'both'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                    }`}
                    data-testid="role-both-button"
                  >
                    Both
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Name (Optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
                  data-testid="name-input"
                />
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-[1.02]"
                data-testid="send-otp-button"
              >
                {loading ? 'Sending OTP...' : 'Continue →'}
              </button>
            </form>
          </div>
        )}

        {step === 'otp' && (
          <div data-testid="auth-otp-step">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full">
                <Heart size={32} className="text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center mb-2">Verify OTP</h2>
            <p className="text-gray-600 text-center mb-8">
              Enter the 6-digit code sent to<br/>
              <span className="font-semibold text-gray-800">+91 {phone}</span>
            </p>

            <form onSubmit={handleVerifyOTP}>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700 text-center">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full px-4 py-5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-center text-3xl font-bold tracking-[0.5em] transition"
                  maxLength={6}
                  required
                  data-testid="otp-input"
                />
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-[1.02]"
                data-testid="verify-otp-button"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full mt-4 text-purple-600 hover:text-purple-700 font-semibold transition"
                data-testid="back-to-phone-button"
              >
                ← Change Number
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;