import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, ArrowLeft, LogOut } from 'lucide-react';
import Logo from './Logo';
import LoginModal from './LoginModal';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState('client');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if we're not on homepage
  const isNotHomePage = location.pathname !== '/';

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const scrollToSection = (id) => {
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-xl z-50 border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              {/* Go Back Button - only show when not on homepage */}
              {isNotHomePage && (
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-1 text-gray-600 hover:text-purple-600 transition-colors px-3 py-2 rounded-lg hover:bg-purple-50"
                  data-testid="go-back-button"
                >
                  <ArrowLeft size={20} />
                  <span className="hidden sm:inline font-medium">Back</span>
                </button>
              )}
              
              <button
                onClick={() => navigate('/')}
                data-testid="logo-button"
                className="transform hover:scale-105 transition-transform duration-200"
              >
                <Logo size="md" showText={true} />
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => scrollToSection('services')}
                className="text-gray-700 hover:text-purple-600 transition font-medium"
                data-testid="nav-services"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection('why-choose')}
                className="text-gray-700 hover:text-purple-600 transition font-medium"
                data-testid="nav-why-choose"
              >
                Why Choose Us
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-gray-700 hover:text-purple-600 transition font-medium"
                data-testid="nav-pricing"
              >
                Pricing
              </button>
              {user ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    data-testid="nav-dashboard-button"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-4 py-2.5 rounded-full border border-gray-300 hover:border-red-300 transition-all"
                    data-testid="nav-logout-button"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthRole('client');
                    setShowAuthModal(true);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  data-testid="nav-login-button"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-700"
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3" data-testid="mobile-menu">
              {/* Go Back Button in Mobile Menu */}
              {isNotHomePage && (
                <button
                  onClick={() => {
                    handleGoBack();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-3 text-gray-700 hover:bg-purple-50 rounded-lg transition font-medium"
                >
                  <ArrowLeft size={18} />
                  Go Back
                </button>
              )}
              <button
                onClick={() => scrollToSection('services')}
                className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-purple-50 rounded-lg transition font-medium"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection('why-choose')}
                className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-purple-50 rounded-lg transition font-medium"
              >
                Why Choose Us
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-purple-50 rounded-lg transition font-medium"
              >
                Pricing
              </button>
              {user ? (
                <>
                  <button
                    onClick={() => {
                      navigate('/dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                    data-testid="mobile-logout-button"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setAuthRole('client');
                    setShowAuthModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold"
                >
                  Login
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <LoginModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialRole={authRole}
      />
    </>
  );
};

export default Header;