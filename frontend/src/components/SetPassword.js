import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

// Use relative URL for proxy
const API = "/api";

const SetPassword = ({ onSuccess }) => {
  const { token, updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

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
      console.log('Setting password...', { hasToken: !!token, apiUrl: API });
      
      const response = await axios.post(
        `${API}/auth/set-password`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Password set successfully:', response.data);
      setSuccess(true);
      updateUser({ password_set: true });

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);

    } catch (err) {
      console.error('Set password error:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Failed to set password';
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Password Set Successfully!</h2>
          <p className="text-gray-600 mb-6">
            You can now login using your mobile number and password.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
            <p className="text-blue-800 font-semibold mb-2">📱 Your Login Credentials:</p>
            <p className="text-blue-700">
              <strong>Mobile Number (User ID):</strong> Your registered mobile number
            </p>
            <p className="text-blue-700 mt-2">
              <strong>Password:</strong> The password you just set
            </p>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-gray-800">Set Your Password</h2>
          <p className="text-gray-600">
            Create a secure password to enable quick login for next time
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm font-semibold mb-2">🔐 Important:</p>
          <p className="text-yellow-700 text-sm">
            After setting your password, you can login using:
          </p>
          <p className="text-yellow-700 text-sm font-semibold mt-2">
            Mobile Number + Password
          </p>
          <p className="text-yellow-600 text-xs mt-2">
            (Your mobile number will be your user ID)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSetPassword} className="space-y-4">
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
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Setting Password...' : 'Set Password & Continue'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            💡 You can reset your password anytime using OTP if you forget it
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
