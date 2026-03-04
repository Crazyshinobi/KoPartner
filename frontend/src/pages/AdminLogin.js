/**
 * KOPARTNER ADMIN LOGIN PAGE - PERFECT & BULLETPROOF
 * ===================================================
 * Simple, clean admin authentication with:
 * - Username/password login
 * - Clear error messages
 * - Retry logic
 * - Professional design
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Lock, User, Shield, Loader2, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = '/api';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const apiCall = async (url, data, maxRetries = 2) => {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(url, data, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });
      return response;
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      
      // Don't retry on authentication errors
      if (status && status >= 400 && status < 500) {
        break;
      }
      
      if (attempt < maxRetries) {
        await wait(1000 * attempt);
      }
    }
  }
  
  throw lastError;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ========================================================================
  // FORM HANDLERS
  // ========================================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate inputs
    const cleanUsername = username.trim();
    const cleanPassword = password;
    
    if (!cleanUsername) {
      setError('Please enter your username');
      return;
    }
    
    if (!cleanPassword) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await apiCall(`${API}/auth/admin-login`, {
        username: cleanUsername,
        password: cleanPassword
      });
      
      // Success - login and redirect
      login(response.data.token, response.data.user);
      navigate('/admin');
      
    } catch (err) {
      const detail = err.response?.data?.detail;
      const status = err.response?.status;
      
      if (status === 401) {
        setError('Invalid username or password. Please try again.');
      } else if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        setError('Network error. Please check your internet connection.');
      } else if (status === 429) {
        setError('Too many login attempts. Please wait a minute.');
      } else if (status === 503) {
        setError('Server is busy. Please try again.');
      } else {
        setError(detail || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header hideLoginButton={true} />
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 pt-24">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-10 text-center">
              <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Shield size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Admin Login</h1>
              <p className="text-purple-100 mt-2">KoPartner Admin Panel</p>
            </div>
            
            {/* Form */}
            <div className="px-8 py-8">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      autoComplete="username"
                      autoFocus
                      data-testid="admin-username-input"
                    />
                  </div>
                </div>
                
                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      autoComplete="current-password"
                      data-testid="admin-password-input"
                    />
                  </div>
                </div>
                
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !username.trim() || !password}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  data-testid="admin-login-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <Lock size={20} />
                      Login
                    </>
                  )}
                </button>
              </form>
              
              {/* Back Link */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  <ArrowLeft size={18} />
                  Back to Home
                </button>
              </div>
            </div>
          </div>
          
          {/* Security Notice */}
          <p className="text-center text-gray-500 text-sm mt-6">
            This is a secure area. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AdminLogin;
