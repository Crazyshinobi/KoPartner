import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff, CheckCircle, Shield } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const API = '/api';

const SetPassword = ({ onSuccess }) => {
  const { token, updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/set-password`, 
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        updateUser({ password_set: true });
        onSuccess && onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4 pt-28 pb-8">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Set Your Password</h1>
            <p className="text-gray-600">Create a secure password for your account</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-purple-700">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">Why set a password?</span>
            </div>
            <ul className="mt-2 text-sm text-purple-600 space-y-1">
              <li>• Quick login with phone + password</li>
              <li>• Stay logged in for 1 year</li>
              <li>• Enhanced account security</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 pr-12"
                  required
                  minLength={6}
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                minLength={6}
                data-testid="confirm-password-input"
              />
            </div>

            {password.length >= 6 && password === confirmPassword && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle size={16} />
                <span>Passwords match!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || password.length < 6 || password !== confirmPassword}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-xl transition disabled:opacity-50"
              data-testid="set-password-btn"
            >
              {loading ? 'Setting Password...' : 'Set Password & Continue'}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            You can use your phone number and this password to login in the future
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SetPassword;
