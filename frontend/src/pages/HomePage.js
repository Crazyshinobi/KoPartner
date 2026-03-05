import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Shield, Star, Users } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState('client');

  const services = [
    {
      emoji: '💬',
      title: 'Voice Call Chat',
      description: 'Personal Gossip or Stress Relief',
      price: '₹500/hour',
      gradient: 'from-purple-400 to-purple-600'
    },
    {
      emoji: '🎥',
      title: 'Video Call Chat',
      description: 'Personal Gossip or Stress Relief',
      price: '₹1000/hour',
      gradient: 'from-pink-400 to-pink-600'
    },
    {
      emoji: '🎬',
      title: 'Movie Companion',
      description: 'Watch together, share laughs',
      price: '₹2000/hour',
      gradient: 'from-indigo-400 to-indigo-600'
    },
    {
      emoji: '🛍️',
      title: 'Shopping Buddy',
      description: 'Groceries, errands, or window shopping',
      price: '₹2000/hour',
      gradient: 'from-violet-400 to-violet-600'
    },
    {
      emoji: '🩺',
      title: 'Medical Support',
      description: 'Appointment companionship',
      price: '₹2000/hour',
      gradient: 'from-fuchsia-400 to-fuchsia-600'
    },
    {
      emoji: '🏠',
      title: 'Domestic Help',
      description: 'Light support & organizing',
      price: '₹2000/hour',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      emoji: '✈️',
      title: 'Travel Partner',
      description: 'Explore and travel together',
      price: '₹2000/hour',
      gradient: 'from-cyan-400 to-blue-600'
    },
    {
      emoji: '😊',
      title: 'Stress Relief',
      description: 'Soothe anxiety with presence',
      price: '₹2000/hour',
      gradient: 'from-rose-400 to-rose-600'
    }
  ];

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Video & Voice Calls',
      description: 'Flexible sessions matched to your comfort.',
      color: 'text-purple-600'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Clear Boundaries',
      description: 'Strictly platonic, consent-first interactions.',
      color: 'text-pink-600'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Safe & Verified',
      description: 'Profiles with services, rates & reviews.',
      color: 'text-indigo-600'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Nearby',
      description: 'Choose KoPartners by city, service, hobby.',
      color: 'text-violet-600'
    }
  ];

  const handleGetStarted = () => {
    if (user) {
      // User already logged in, go to dashboard
      navigate('/dashboard');
    } else {
      // Show login modal with client role
      setAuthRole('client');
      setShowAuthModal(true);
    }
  };

  const handleBecomePartner = () => {
    if (user) {
      if (user.role === 'cuddlist' || user.role === 'both') {
        navigate('/dashboard');
      } else {
        alert('You are registered as a client only. Please create a new account with "Both" role to become a KoPartner.');
      }
    } else {
      // Show login modal with cuddlist role
      setAuthRole('cuddlist');
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Header />

      {/* Enhanced Hero Section */}
      <section className="pt-24 pb-12 px-4" data-testid="hero-section">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="bg-purple-100 text-purple-700 px-5 py-2 rounded-full text-sm font-semibold">
              🌟 India's Trusted Emotional Wellness Platform
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              KoPartner in India
            </span>
            <br />
            <span className="text-gray-800">Professional Companionship Therapy</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Safe, consent-first, strictly platonic companionship with verified KoPartners across Delhi NCR, Mumbai, and Bengaluru.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
              data-testid="find-cuddlist-button"
            >
              <span>Find a KoPartner</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button
              onClick={handleBecomePartner}
              className="group bg-white border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              data-testid="become-cuddlist-button"
            >
              <span>Become a KoPartner</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* User-Visible Content Section - No "cuddle" word visible */}
      <section className="py-12 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Professional Companionship Service in Delhi, Noida, Gurgaon & Gurugram
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-lg leading-relaxed mb-4">
                Looking for a trusted <strong>emotional wellness service in Delhi</strong>? KoPartner is India's leading platform for professional companionship services across Delhi NCR, including <strong>services in Noida</strong>, <strong>Gurgaon</strong>, and <strong>Gurugram</strong>.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                <strong>Find a KoPartner near me</strong> has never been easier! Our platform connects you with verified, professional companions who provide safe, consent-first, and strictly platonic emotional wellness support. Whether you're searching for <strong>companionship service near me</strong> or looking to book a session in Mumbai or Bengaluru, KoPartner ensures quality emotional wellness support.
              </p>
              <div className="grid md:grid-cols-3 gap-6 my-8">
                <div className="bg-purple-50 p-6 rounded-2xl text-center">
                  <h3 className="text-xl font-bold mb-2 text-purple-900">Delhi & NCR</h3>
                  <p className="text-sm text-gray-600">Professional companionship service available in Delhi, Noida, Gurgaon, Gurugram</p>
                </div>
                <div className="bg-pink-50 p-6 rounded-2xl text-center">
                  <h3 className="text-xl font-bold mb-2 text-pink-900">Mumbai & Pune</h3>
                  <p className="text-sm text-gray-600">Professional KoPartners across Maharashtra</p>
                </div>
                <div className="bg-indigo-50 p-6 rounded-2xl text-center">
                  <h3 className="text-xl font-bold mb-2 text-indigo-900">Bengaluru & More</h3>
                  <p className="text-sm text-gray-600">Expanding to major cities across India</p>
                </div>
              </div>
              <p className="text-lg leading-relaxed">
                Our <strong>companionship services</strong> help reduce stress, anxiety, and loneliness through safe emotional support and professional care. All our KoPartners are background-verified, trained professionals committed to maintaining strict boundaries and ensuring your comfort and safety.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Services Section */}
      <section id="services" className="py-12 px-4 bg-white/50 backdrop-blur-sm" data-testid="services-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Our Services
            </h2>
            <p className="text-lg text-gray-600">Choose from our wide range of companionship services</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="group bg-white p-6 rounded-3xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-purple-100"
                data-testid={`service-card-${index}`}
              >
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{service.emoji}</div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{service.title}</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{service.description}</p>
                <p className={`text-2xl font-bold bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent mb-4`}>{service.price}</p>
                <button
                  onClick={handleGetStarted}
                  className={`w-full bg-gradient-to-r ${service.gradient} text-white py-2.5 rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm`}
                  data-testid={`book-now-button-${index}`}
                >
                  Book Now →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Why Choose Us Section */}
      <section id="why-choose" className="py-12 px-4" data-testid="why-choose-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Why Choose Us
            </h2>
            <p className="text-lg text-gray-600">Trusted by thousands across India</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group text-center bg-white p-6 rounded-3xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
                data-testid={`feature-${index}`}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 mb-4 ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Earning Potential Section */}
      <section className="py-12 px-4 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="mb-4">
            <span className="inline-block bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full text-sm font-semibold">
              💰 Earning Opportunity
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Earn ₹1 Lakh+ Per Month
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed opacity-95">
            Join India's fastest-growing emotional wellness platform. Set your own rates, choose your services, and earn while helping others.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 transform hover:scale-105 transition-all duration-300">
              <p className="text-4xl md:text-5xl font-bold mb-2">₹1L+</p>
              <p className="text-green-50 text-sm">Monthly Earning</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 transform hover:scale-105 transition-all duration-300">
              <p className="text-4xl md:text-5xl font-bold mb-2">80%</p>
              <p className="text-green-50 text-sm">You Keep</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 transform hover:scale-105 transition-all duration-300">
              <p className="text-4xl md:text-5xl font-bold mb-2">24/7</p>
              <p className="text-green-50 text-sm">Flexible</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 transform hover:scale-105 transition-all duration-300">
              <p className="text-4xl md:text-5xl font-bold mb-2">₹1K</p>
              <p className="text-green-50 text-sm">Membership</p>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 max-w-4xl mx-auto mb-8">
            <h3 className="text-2xl font-bold mb-5">How KoPartners Earn:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="font-bold text-lg mb-1">✓ Voice Calls: ₹500/hour</p>
                <p className="text-green-50 text-sm">10 hours = ₹5,000</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="font-bold text-lg mb-1">✓ Video Calls: ₹1,000/hour</p>
                <p className="text-green-50 text-sm">10 hours = ₹10,000</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="font-bold text-lg mb-1">✓ In-Person: ₹2,000/hour</p>
                <p className="text-green-50 text-sm">10 hours = ₹20,000</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="font-bold text-lg mb-1">✓ Set Your Own Rates</p>
                <p className="text-green-50 text-sm">Full flexibility & control</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleBecomePartner}
            className="bg-white text-green-600 px-10 py-4 rounded-full text-lg font-bold hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            Start Earning Today →
          </button>
        </div>
      </section>

      {/* Enhanced Transparent Pricing Section */}
      <section id="pricing" className="py-12 px-4 bg-gradient-to-br from-purple-50 to-pink-50" data-testid="pricing-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">Clear and upfront pricing with no hidden fees</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-purple-100 transform hover:scale-105 transition-all duration-300" data-testid="client-pricing">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 mb-3">
                  <Users className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-800">For Clients</h3>
                <p className="text-gray-600 text-sm">Find your perfect companion</p>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-700">Voice Calls</span>
                  <span className="font-bold text-xl text-purple-600">₹100/hr</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-700">Video Calls</span>
                  <span className="font-bold text-xl text-purple-600">₹500/hr</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-700">In-person</span>
                  <span className="font-bold text-xl text-purple-600">₹1000+/hr</span>
                </div>
              </div>
              <button
                onClick={handleGetStarted}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl text-base font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                data-testid="client-get-started-button"
              >
                Get Started →
              </button>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-green-100 transform hover:scale-105 transition-all duration-300" data-testid="cuddlist-pricing">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 mb-3">
                  <Star className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-800">For KoPartners</h3>
                <p className="text-gray-600 text-sm">Start your earning journey</p>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-700">Annual Membership</span>
                  <span className="font-bold text-xl text-green-600">₹1000</span>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5">
                  <p className="text-green-800 font-bold text-lg mb-2">💰 Earning Potential</p>
                  <p className="text-green-700 mb-1">₹50,000 - ₹1,50,000 per month</p>
                  <p className="text-green-600 text-sm">Based on your availability & services</p>
                </div>
              </div>
              <button
                onClick={handleBecomePartner}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl text-base font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                data-testid="cuddlist-join-button"
              >
                Join Now →
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
      {/* Login Modal */}
      <LoginModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialRole={authRole}
      />
    </div>
  );
};

export default HomePage;