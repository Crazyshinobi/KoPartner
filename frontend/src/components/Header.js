import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import LoginModal from './LoginModal';

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState('client');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <button
              onClick={() => navigate('/')}
              data-testid="logo-button"
              className="transform hover:scale-105 transition-transform duration-200"
            >
              <Logo size="md" showText={true} />
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
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
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  data-testid="nav-dashboard-button"
                >
                  Dashboard
                </button>
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
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold"
                >
                  Dashboard
                </button>
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