import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Shield, Star, Users, Quote, MapPin, X, Heart, Trophy, PartyPopper } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState('client');
  const [currentKoPartnerIndex, setCurrentKoPartnerIndex] = useState(0);
  const [liveKoPartners, setLiveKoPartners] = useState([]);
  const [isLoadingKoPartners, setIsLoadingKoPartners] = useState(true);
  const [activeKoPartnersCount, setActiveKoPartnersCount] = useState(7836);
  const [showCelebrationPopup, setShowCelebrationPopup] = useState(false);

  // Show celebration popup - only once per session, delayed for better UX
  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('celebration_popup_seen');
    if (!hasSeenPopup) {
      // Use requestIdleCallback for non-blocking popup display
      const showPopup = () => {
        setShowCelebrationPopup(true);
      };
      
      // Delay popup to allow page to fully render first (3 seconds)
      const timer = setTimeout(() => {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(showPopup, { timeout: 1000 });
        } else {
          showPopup();
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeCelebrationPopup = useCallback(() => {
    setShowCelebrationPopup(false);
    sessionStorage.setItem('celebration_popup_seen', 'true');
  }, []);

  // OPTIMIZED: Fetch real KoPartners - with caching
  useEffect(() => {
    const fetchLiveKoPartners = async () => {
      // Check cache first
      const cached = sessionStorage.getItem('kopartners_cache');
      const cacheTime = sessionStorage.getItem('kopartners_cache_time');
      
      // Use cache if less than 2 minutes old
      if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 120000) {
        setLiveKoPartners(JSON.parse(cached));
        setIsLoadingKoPartners(false);
        return;
      }
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const response = await fetch(`${BACKEND_URL}/api/public/online-kopartners?limit=12`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.kopartners && data.kopartners.length > 0) {
            const transformedKoPartners = data.kopartners.map(kp => ({
              id: kp.id,
              image: kp.profile_photo,
              name: kp.name,
              city: kp.city || 'India',
              rating: kp.rating || 4.8,
              isNew: kp.isNew || false,
              isReal: true
            }));
            setLiveKoPartners(transformedKoPartners);
            // Cache the results
            sessionStorage.setItem('kopartners_cache', JSON.stringify(transformedKoPartners));
            sessionStorage.setItem('kopartners_cache_time', Date.now().toString());
          } else {
            setLiveKoPartners([]);
          }
        } else {
          setLiveKoPartners([]);
        }
      } catch (error) {
        // Silent fail - don't spam console
        setLiveKoPartners([]);
      } finally {
        setIsLoadingKoPartners(false);
      }
    };

    fetchLiveKoPartners();
    
    // OPTIMIZED: Refresh every 2 minutes instead of 30 seconds
    const refreshInterval = setInterval(fetchLiveKoPartners, 120000);
    return () => clearInterval(refreshInterval);
  }, []);

  // OPTIMIZED: Slower animation for active count - every 5 seconds instead of 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      // Generate random number between 6000 and 10000
      const randomCount = Math.floor(Math.random() * 4001) + 6000;
      setActiveKoPartnersCount(randomCount);
    }, 5000); // Changed from 1000ms to 5000ms

    return () => clearInterval(interval);
  }, []);

  // Only use real KoPartners from database
  const koPartnerImages = liveKoPartners;
  const hasRealKoPartners = liveKoPartners.length > 0;

  // OPTIMIZED: Memoize testimonials to prevent re-creation
  const testimonials = useMemo(() => [
    {
      image: 'https://images.pexels.com/photos/7580822/pexels-photo-7580822.jpeg?auto=compress&cs=tinysrgb&w=200',
      name: 'Priya Sharma',
      city: 'Delhi',
      earning: '₹85,000',
      quote: 'KoPartner changed my life! I earn ₹85,000+ monthly working part-time while helping others feel less lonely. The platform is safe and professional.',
      duration: '6 months'
    },
    {
      image: 'https://images.pexels.com/photos/7580821/pexels-photo-7580821.jpeg?auto=compress&cs=tinysrgb&w=200',
      name: 'Anjali Mehta',
      city: 'Mumbai',
      earning: '₹1,20,000',
      quote: 'Best decision I ever made! Started as a side income, now I earn over ₹1 lakh monthly. The clients are respectful and the support team is amazing.',
      duration: '8 months'
    },
    {
      image: 'https://images.pexels.com/photos/7581115/pexels-photo-7581115.jpeg?auto=compress&cs=tinysrgb&w=200',
      name: 'Sneha Reddy',
      city: 'Bangalore',
      earning: '₹95,000',
      quote: 'Flexible hours, good earnings, and meaningful work. I love connecting with people and helping them through tough times. Highly recommend!',
      duration: '5 months'
    },
    {
      image: 'https://images.pexels.com/photos/5738735/pexels-photo-5738735.jpeg?auto=compress&cs=tinysrgb&w=200',
      name: 'Kavita Patel',
      city: 'Pune',
      earning: '₹70,000',
      quote: 'As a working professional, I do this part-time on weekends. Extra ₹70,000/month has helped me become financially independent!',
      duration: '4 months'
    }
  ], []);

  // OPTIMIZED: Memoize cities array
  const operationalCities = useMemo(() => [
    { name: 'Delhi', slug: 'delhi' },
    { name: 'Noida', slug: 'noida' },
    { name: 'Gurgaon', slug: 'gurgaon' },
    { name: 'Mumbai', slug: 'mumbai' },
    { name: 'Bangalore', slug: 'bangalore' },
    { name: 'Pune', slug: 'pune' },
    { name: 'Hyderabad', slug: 'hyderabad' },
    { name: 'Chennai', slug: 'chennai' },
    { name: 'Kolkata', slug: 'kolkata' },
    { name: 'Ahmedabad', slug: 'ahmedabad' },
    { name: 'Jaipur', slug: 'jaipur' },
    { name: 'Chandigarh', slug: 'chandigarh' },
    { name: 'Indore', slug: 'indore' },
    { name: 'Lucknow', slug: 'lucknow' },
    { name: 'Kochi', slug: 'kochi' },
    { name: 'Coimbatore', slug: 'coimbatore' },
    { name: 'Nashik', slug: 'nashik' },
    { name: 'Surat', slug: 'surat' },
    { name: 'Dehradun', slug: 'dehradun' }
  ], []);

  // OPTIMIZED: Rotate KoPartner images every 4 seconds (was 2.5)
  useEffect(() => {
    if (koPartnerImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentKoPartnerIndex((prev) => (prev + 1) % koPartnerImages.length);
    }, 4000); // Changed from 2500ms to 4000ms
    return () => clearInterval(interval);
  }, [koPartnerImages.length]);

  // OPTIMIZED: Memoize visible KoPartners calculation
  const visibleKoPartners = useMemo(() => {
    if (koPartnerImages.length === 0) return [];
    const visible = [];
    for (let i = 0; i < Math.min(6, koPartnerImages.length); i++) {
      visible.push(koPartnerImages[(currentKoPartnerIndex + i) % koPartnerImages.length]);
    }
    return visible;
  }, [koPartnerImages, currentKoPartnerIndex]);

  // OPTIMIZED: Memoize services
  const services = useMemo(() => [
    {
      emoji: '👴',
      title: 'Elder Care',
      description: 'Senior assistance & daily support',
      price: '₹1000/hour',
      gradient: 'from-purple-400 to-purple-600'
    },
    {
      emoji: '🤝',
      title: 'Hangingout',
      description: 'Casual social time together',
      price: '₹1500/hour',
      gradient: 'from-pink-400 to-pink-600'
    },
    {
      emoji: '🎉',
      title: 'Clubbing',
      description: 'Nightlife & party assistance',
      price: '₹2000/hour',
      gradient: 'from-indigo-400 to-indigo-600'
    },
    {
      emoji: '🎬',
      title: 'Movie Partner',
      description: 'Watch together, share laughs',
      price: '₹2000/hour',
      gradient: 'from-violet-400 to-violet-600'
    },
    {
      emoji: '🛍️',
      title: 'Shopping Buddy',
      description: 'Groceries, errands, or shopping',
      price: '₹2000/hour',
      gradient: 'from-fuchsia-400 to-fuchsia-600'
    },
    {
      emoji: '🩺',
      title: 'Medical Support',
      description: 'Hospital & appointment assistance',
      price: '₹2000/hour',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      emoji: '🏠',
      title: 'Domestic Help',
      description: 'Light support & organizing',
      price: '₹2000/hour',
      gradient: 'from-cyan-400 to-blue-600'
    },
    {
      emoji: '✈️',
      title: 'Travel Partner',
      description: 'Explore and travel together',
      price: '₹2000/hour',
      gradient: 'from-rose-400 to-rose-600'
    }
  ], []);

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Multiple Services',
      description: 'From elder care to clubbing - all your needs covered.',
      color: 'text-purple-600'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Safe & Professional',
      description: 'Strictly professional, consent-first interactions.',
      color: 'text-pink-600'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Verified Partners',
      description: 'All KoPartners with verified profiles & reviews.',
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
      navigate('/dashboard');
    } else {
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
      setAuthRole('cuddlist');
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Header />

      {/* 10 Lac+ Celebration Mini Popup - Bottom Right Corner */}
      {showCelebrationPopup && (
        <div className="fixed bottom-4 right-4 z-50 animate-slideInRight max-w-xs w-full" data-testid="celebration-popup">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-purple-100">
            {/* Compact Header */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 px-4 py-3 relative">
              <button
                onClick={closeCelebrationPopup}
                className="absolute top-2 right-2 w-6 h-6 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition"
                data-testid="close-celebration-popup"
              >
                <X size={14} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">10 Lac+ Family! 🎉</p>
                  <p className="text-white/80 text-xs">Thank You India!</p>
                </div>
              </div>
            </div>

            {/* Compact Content */}
            <div className="p-3">
              {/* Offer */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-2 mb-3 text-center">
                <p className="text-green-700 font-bold text-lg">Up to 60% OFF</p>
                <p className="text-green-600 text-xs">Limited Time Celebration!</p>
              </div>

              {/* Mini Stats */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 bg-purple-50 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-purple-600">10L+</p>
                  <p className="text-[10px] text-gray-500">Members</p>
                </div>
                <div className="flex-1 bg-pink-50 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-pink-600">500+</p>
                  <p className="text-[10px] text-gray-500">Cities</p>
                </div>
                <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-green-600">#1</p>
                  <p className="text-[10px] text-gray-500">India</p>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => { closeCelebrationPopup(); handleBecomePartner(); }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition"
              >
                Join Now - 60% OFF →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Hero Section */}
      <section className="pt-24 pb-12 px-4" data-testid="hero-section">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="bg-purple-100 text-purple-700 px-5 py-2 rounded-full text-sm font-semibold animate-pulse">
              🏆 India's #1 Social & Lifestyle Support Services Platform
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              KoPartner in India
            </span>
            <br />
            <span className="text-gray-800">Professional Social Support Services</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Safe, verified, professional KoPartners across {operationalCities.slice(0, 5).map(c => c.name).join(', ')} and {operationalCities.length - 5}+ more cities. India's trusted social and lifestyle support platform.
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

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 max-w-4xl mx-auto">
            <div className="bg-purple-50 p-4 rounded-xl text-center">
              <p className="text-2xl font-bold text-purple-600">{activeKoPartnersCount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Active KoPartners</p>
            </div>
            <div className="bg-pink-50 p-4 rounded-xl text-center">
              <p className="text-2xl font-bold text-pink-600">4.8★</p>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <p className="text-2xl font-bold text-green-600">24/7</p>
              <p className="text-sm text-gray-600">Available</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <p className="text-2xl font-bold text-blue-600">100%</p>
              <p className="text-sm text-gray-600">Verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Online KoPartners Section - Only shows when there are REAL KoPartners */}
      {hasRealKoPartners && (
      <section className="py-10 px-4 bg-gradient-to-b from-white to-purple-50">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                Live Now
              </div>
              <div className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium">
                <span className="text-purple-500">✓</span>
                Real KoPartners
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              KoPartners Online
            </h2>
            <p className="text-gray-500 text-sm">
              {liveKoPartners.length} verified KoPartners ready to connect
            </p>
          </div>
          
          {/* Loading State */}
          {isLoadingKoPartners ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* Elegant Grid with smaller profile cards */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
                {visibleKoPartners.map((partner, index) => (
                  <div 
                    key={`${partner?.id || partner?.name || index}-${currentKoPartnerIndex}`}
                    className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100"
                    onClick={handleGetStarted}
                  >
                    {/* Profile Image - Smaller */}
                    <div className="relative">
                      <img 
                        src={partner?.image || partner?.profile_photo} 
                        alt={partner?.name || 'KoPartner'}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-28 md:h-32 object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200';
                        }}
                      />
                      {/* Online Badge - Minimal */}
                      <div className="absolute top-2 right-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
                        </span>
                      </div>
                      {/* New KoPartner badge - just joined */}
                      {partner.isNew && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium animate-pulse">
                          New
                        </div>
                      )}
                      {/* Verified KoPartner badge */}
                      {partner.isReal && !partner.isNew && (
                        <div className="absolute bottom-1 left-1 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                          Verified
                        </div>
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    
                    {/* Profile Info - Compact */}
                    <div className="p-2.5 text-center">
                      <h3 className="font-semibold text-gray-800 text-sm truncate">{partner.name}</h3>
                      <p className="text-xs text-gray-500">{partner.city}</p>
                      <div className="flex items-center justify-center gap-0.5 mt-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-medium text-gray-600">{partner.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Dots indicator for rotation */}
          <div className="flex justify-center gap-1.5 mt-6">
            {koPartnerImages.map((_, index) => (
              <div 
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentKoPartnerIndex 
                    ? 'w-6 bg-purple-600' 
                    : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          {/* CTA Button */}
          <div className="text-center mt-6">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              View All KoPartners
              <span>→</span>
            </button>
          </div>
            </>
          )}
        </div>
      </section>
      )}

      {/* User-Visible Content Section - SEO Optimized */}
      <section className="py-12 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Professional Social Support Service Across India
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-lg leading-relaxed mb-4">
                Looking for trusted <strong>social support service in India</strong>? KoPartner is <strong>India's #1 Social & Lifestyle Support Services Platform</strong> - connecting you with professional support services across all major cities.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                <strong>Find a KoPartner near me</strong> has never been easier! Our platform connects you with verified, professional KoPartners who provide safe, consent-first services. Whether you're searching for <strong>social support service near me</strong> in Delhi, Mumbai, Bangalore, or any other city, KoPartner ensures quality professional support.
              </p>
              
              {/* City Grid for SEO - CLICKABLE */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 my-8">
                {operationalCities.map((city, index) => (
                  <Link 
                    key={city.slug} 
                    to={`/kopartner-${city.slug}`}
                    className={`p-3 rounded-xl text-center text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-1 ${
                      index % 4 === 0 ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' :
                      index % 4 === 1 ? 'bg-pink-50 text-pink-700 hover:bg-pink-100' :
                      index % 4 === 2 ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' :
                      'bg-violet-50 text-violet-700 hover:bg-violet-100'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    {city.name}
                  </Link>
                ))}
              </div>

              <p className="text-lg leading-relaxed">
                Our <strong>social support services</strong> help with daily activities through safe professional care. All our KoPartners are background-verified, trained professionals committed to maintaining strict boundaries and ensuring your comfort and safety.
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
            <p className="text-lg text-gray-600">Choose from our wide range of professional support services</p>
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
            <p className="text-lg text-gray-600">India's #1 Trusted Social & Lifestyle Support Platform</p>
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

      {/* Testimonials Section */}
      <section className="py-12 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              KoPartner Success Stories
            </h2>
            <p className="text-lg text-gray-600">Real earnings from real KoPartners</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white rounded-3xl shadow-xl p-6 md:p-8 transform hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-green-200"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800">{testimonial.name}</h3>
                        <p className="text-sm text-gray-500">{testimonial.city} • KoPartner for {testimonial.duration}</p>
                      </div>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold text-sm">
                        {testimonial.earning}/month
                      </div>
                    </div>
                    <div className="relative">
                      <Quote className="absolute -top-2 -left-2 w-8 h-8 text-green-200" />
                      <p className="text-gray-600 pl-6 italic leading-relaxed">
                        {testimonial.quote}
                      </p>
                    </div>
                    <div className="flex items-center mt-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <button
              onClick={handleBecomePartner}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              Start Your Earning Journey →
            </button>
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
            Join India's #1 social support platform. Set your own rates, choose your services, and earn while helping others.
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
              <p className="text-4xl md:text-5xl font-bold mb-2">20+</p>
              <p className="text-green-50 text-sm">Cities</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 transform hover:scale-105 transition-all duration-300 relative">
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">-60%</span>
              <p className="text-sm text-green-200 line-through">₹500</p>
              <p className="text-4xl md:text-5xl font-bold mb-2">₹199</p>
              <p className="text-green-50 text-sm">Membership From</p>
            </div>
          </div>

          {/* 10 Lac+ Celebration Banner */}
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl p-4 max-w-2xl mx-auto mb-8">
            <p className="text-xl font-bold">🎉 10 Lac+ Family Celebration!</p>
            <p className="text-sm">Thank you for making us India's #1 - Up to 60% OFF!</p>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 max-w-4xl mx-auto mb-8">
            <h3 className="text-2xl font-bold mb-5">How KoPartners Earn:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="font-bold text-lg mb-1">✓ Elder Care: ₹1,000/hour</p>
                <p className="text-green-50 text-sm">10 hours = ₹10,000</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="font-bold text-lg mb-1">✓ Hangingout: ₹1,500/hour</p>
                <p className="text-green-50 text-sm">10 hours = ₹15,000</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="font-bold text-lg mb-1">✓ Clubbing & Events: ₹2,000/hour</p>
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
                  <span className="text-gray-700">Elder Care</span>
                  <span className="font-bold text-xl text-purple-600">₹1000/hr</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-700">Hangingout</span>
                  <span className="font-bold text-xl text-purple-600">₹1500/hr</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-gray-700">Clubbing & Events</span>
                  <span className="font-bold text-xl text-purple-600">₹2000/hr</span>
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
              {/* 10 Lac+ Celebration Banner */}
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-xl p-2 mb-4 text-center">
                <p className="text-xs font-bold text-amber-800">🎉 10 Lac+ Family Celebration - Up to 60% OFF!</p>
              </div>
              <div className="space-y-4 mb-6">
                <div className="text-center border-b border-gray-100 pb-3">
                  <span className="text-gray-700 font-semibold">Membership Plans</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                    <span className="text-gray-600 text-sm">6 Months</span>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 line-through mr-1">₹500</span>
                      <span className="font-bold text-green-600">₹199 + GST</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-amber-50 p-2 rounded-lg border-2 border-amber-300">
                    <span className="text-gray-700 text-sm font-medium">1 Year ⭐ Popular</span>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 line-through mr-1">₹1000</span>
                      <span className="font-bold text-green-600">₹499 + GST</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                    <span className="text-gray-600 text-sm">Lifetime</span>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 line-through mr-1">₹2000</span>
                      <span className="font-bold text-green-600">₹999 + GST</span>
                    </div>
                  </div>
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

      {/* SEO Rich Content for Cities - CLICKABLE */}
      <section className="py-12 px-4 bg-white" id="cities">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            KoPartner Services in Your City
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-purple-50 p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-3 text-purple-900">North India</h3>
              <p className="text-gray-600 text-sm mb-3">Professional companionship services available in:</p>
              <ul className="text-sm space-y-2">
                <li><Link to="/kopartner-delhi" className="text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Delhi NCR</Link></li>
                <li><Link to="/kopartner-noida" className="text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Noida</Link></li>
                <li><Link to="/kopartner-gurgaon" className="text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Gurgaon</Link></li>
                <li><Link to="/kopartner-jaipur" className="text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Jaipur</Link></li>
                <li><Link to="/kopartner-chandigarh" className="text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Chandigarh</Link></li>
                <li><Link to="/kopartner-lucknow" className="text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Lucknow</Link></li>
                <li><Link to="/kopartner-dehradun" className="text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Dehradun</Link></li>
                <li><Link to="/kopartner-indore" className="text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Indore</Link></li>
              </ul>
            </div>
            <div className="bg-pink-50 p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-3 text-pink-900">West & Central India</h3>
              <p className="text-gray-600 text-sm mb-3">Professional companionship services available in:</p>
              <ul className="text-sm space-y-2">
                <li><Link to="/kopartner-mumbai" className="text-pink-700 hover:text-pink-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Mumbai</Link></li>
                <li><Link to="/kopartner-pune" className="text-pink-700 hover:text-pink-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Pune</Link></li>
                <li><Link to="/kopartner-ahmedabad" className="text-pink-700 hover:text-pink-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Ahmedabad</Link></li>
                <li><Link to="/kopartner-surat" className="text-pink-700 hover:text-pink-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Surat</Link></li>
                <li><Link to="/kopartner-nashik" className="text-pink-700 hover:text-pink-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Nashik</Link></li>
              </ul>
            </div>
            <div className="bg-indigo-50 p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-3 text-indigo-900">South & East India</h3>
              <p className="text-gray-600 text-sm mb-3">Professional companionship services available in:</p>
              <ul className="text-sm space-y-2">
                <li><Link to="/kopartner-bangalore" className="text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Bangalore</Link></li>
                <li><Link to="/kopartner-chennai" className="text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Chennai</Link></li>
                <li><Link to="/kopartner-hyderabad" className="text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Hyderabad</Link></li>
                <li><Link to="/kopartner-kolkata" className="text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Kolkata</Link></li>
                <li><Link to="/kopartner-kochi" className="text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Kochi</Link></li>
                <li><Link to="/kopartner-coimbatore" className="text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1"><MapPin className="w-3 h-3" /> KoPartner in Coimbatore</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section for AEO (Answer Engine Optimization) */}
      <section className="py-12 px-4 bg-gradient-to-br from-purple-50 to-pink-50" id="faq">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">Everything you need to know about KoPartner</p>
          </div>
          
          <div className="space-y-4">
            {/* FAQ Item 1 */}
            <details className="bg-white rounded-2xl shadow-lg group">
              <summary className="flex justify-between items-center cursor-pointer p-6 font-semibold text-gray-800 text-lg">
                <span>What is KoPartner?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                <p><strong>KoPartner is India's #1 Social & Lifestyle Support Services Platform.</strong> It's a professional social support service that connects people with verified KoPartners for safe, consent-first, professional support services including elder care, hangingout, clubbing, movie partners, shopping buddies, medical support, and more. Our services help you with daily activities through professional care.</p>
              </div>
            </details>

            {/* FAQ Item 2 */}
            <details className="bg-white rounded-2xl shadow-lg group">
              <summary className="flex justify-between items-center cursor-pointer p-6 font-semibold text-gray-800 text-lg">
                <span>How do I find a KoPartner near me?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                <p>To find a KoPartner near you:</p>
                <ol className="list-decimal ml-5 mt-2 space-y-1">
                  <li>Visit KoPartner.in and click "Find a KoPartner"</li>
                  <li>Sign up with your phone number</li>
                  <li>Select your city from 20+ available cities</li>
                  <li>Browse verified KoPartners by service, rating, and availability</li>
                  <li>Book a session - voice call, video call, or in-person</li>
                </ol>
                <p className="mt-3"><strong>Available cities:</strong> Delhi, Noida, Gurgaon, Mumbai, Bangalore, Pune, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur, Chandigarh, Indore, Lucknow, Kochi, Coimbatore, Nashik, Surat, Dehradun.</p>
              </div>
            </details>

            {/* FAQ Item 3 */}
            <details className="bg-white rounded-2xl shadow-lg group">
              <summary className="flex justify-between items-center cursor-pointer p-6 font-semibold text-gray-800 text-lg">
                <span>What services does KoPartner offer?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                <p>KoPartner offers multiple professional social support services:</p>
                <ul className="mt-2 space-y-2">
                  <li><strong>Elder Care (₹1,000/hour)</strong> - Senior assistance & daily support</li>
                  <li><strong>Hangingout (₹1,500/hour)</strong> - Casual social time together</li>
                  <li><strong>Clubbing (₹2,000/hour)</strong> - Nightlife & party assistance</li>
                  <li><strong>Movie Partner (₹2,000/hour)</strong> - Watch movies together, share experiences</li>
                  <li><strong>Shopping Buddy (₹2,000/hour)</strong> - Groceries, errands, shopping</li>
                  <li><strong>Medical Support (₹2,000/hour)</strong> - Hospital & appointment assistance</li>
                  <li><strong>Travel Partner (₹2,000/hour)</strong> - Explore and travel together</li>
                </ul>
              </div>
            </details>

            {/* FAQ Item 4 */}
            <details className="bg-white rounded-2xl shadow-lg group">
              <summary className="flex justify-between items-center cursor-pointer p-6 font-semibold text-gray-800 text-lg">
                <span>Is KoPartner safe and trustworthy?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                <p><strong>Yes, KoPartner is India's most trusted social support platform.</strong> We ensure safety through:</p>
                <ul className="mt-2 space-y-1 list-disc ml-5">
                  <li>All KoPartners are background verified</li>
                  <li>Trained professionals committed to strict boundaries</li>
                  <li>Consent-first, strictly professional services only</li>
                  <li>Clear code of conduct and guidelines</li>
                  <li>Secure payment processing</li>
                  <li>24/7 customer support</li>
                </ul>
                <p className="mt-3">KoPartner is NOT a dating service. All interactions are professional.</p>
              </div>
            </details>

            {/* FAQ Item 5 */}
            <details className="bg-white rounded-2xl shadow-lg group">
              <summary className="flex justify-between items-center cursor-pointer p-6 font-semibold text-gray-800 text-lg">
                <span>How much can I earn as a KoPartner?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                <p><strong>KoPartners can earn ₹50,000 to ₹1,50,000+ per month</strong> based on availability and services offered. You keep <strong>80% of your earnings</strong>.</p>
                <div className="mt-3 bg-green-50 p-4 rounded-xl">
                  <p className="font-semibold text-green-800 mb-2">Example Monthly Earnings:</p>
                  <ul className="space-y-1 text-green-700">
                    <li>• Elder Care: ₹1,000/hr × 20 hrs = ₹20,000</li>
                    <li>• Hangingout: ₹1,500/hr × 20 hrs = ₹30,000</li>
                    <li>• Clubbing/Events: ₹2,000/hr × 20 hrs = ₹40,000</li>
                    <li className="font-bold pt-2 border-t border-green-200">Total: ₹90,000/month (you keep ₹72,000)</li>
                  </ul>
                </div>
                <p className="mt-3">Membership starts at just <strong className="text-green-600">₹199</strong> <span className="line-through text-gray-400 text-sm">₹500</span> (6 months) - pay once, unlimited earnings! 🎉 10 Lac+ Celebration Offer!</p>
              </div>
            </details>

            {/* FAQ Item 6 */}
            <details className="bg-white rounded-2xl shadow-lg group">
              <summary className="flex justify-between items-center cursor-pointer p-6 font-semibold text-gray-800 text-lg">
                <span>How do I become a KoPartner?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                <p>Becoming a KoPartner is easy:</p>
                <ol className="list-decimal ml-5 mt-2 space-y-1">
                  <li>Visit KoPartner.in and click "Become a KoPartner"</li>
                  <li>Sign up with your phone number</li>
                  <li>Complete your profile with photo, bio, services, and rates</li>
                  <li>Pay membership fee (₹199/6mo, ₹499/yr, or ₹999/lifetime) - 🎉 10 Lac+ Celebration Discount!</li>
                  <li>Get verified and start earning!</li>
                </ol>
                <p className="mt-3"><strong>Benefits:</strong> Set your own rates, work flexible hours, keep 80% of earnings, work from anywhere in India.</p>
              </div>
            </details>


            {/* FAQ Item 7 */}
            <details className="bg-white rounded-2xl shadow-lg group">
              <summary className="flex justify-between items-center cursor-pointer p-6 font-semibold text-gray-800 text-lg">
                <span>In which cities is KoPartner available?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                <p><strong>KoPartner is available in 20+ major cities across India:</strong></p>
                <div className="grid md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="font-semibold text-purple-700">North India</p>
                    <ul className="text-sm">
                      <li>• Delhi NCR</li>
                      <li>• Noida</li>
                      <li>• Gurgaon/Gurugram</li>
                      <li>• Jaipur</li>
                      <li>• Chandigarh</li>
                      <li>• Lucknow</li>
                      <li>• Dehradun</li>
                      <li>• Indore</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-pink-700">West India</p>
                    <ul className="text-sm">
                      <li>• Mumbai</li>
                      <li>• Pune</li>
                      <li>• Ahmedabad</li>
                      <li>• Surat</li>
                      <li>• Nashik</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-indigo-700">South & East</p>
                    <ul className="text-sm">
                      <li>• Bangalore</li>
                      <li>• Chennai</li>
                      <li>• Hyderabad</li>
                      <li>• Kolkata</li>
                      <li>• Kochi</li>
                      <li>• Coimbatore</li>
                    </ul>
                  </div>
                </div>
              </div>
            </details>

            {/* FAQ Item 8 */}
            <details className="bg-white rounded-2xl shadow-lg group">
              <summary className="flex justify-between items-center cursor-pointer p-6 font-semibold text-gray-800 text-lg">
                <span>What is social support service?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                <p><strong>Social support service</strong> is a professional service that provides safe assistance for daily activities. Our services focus on:</p>
                <ul className="mt-2 space-y-1 list-disc ml-5">
                  <li>Professional assistance for daily activities</li>
                  <li>Elder care and senior support</li>
                  <li>Social outings and events</li>
                  <li>Non-judgmental support and listening</li>
                  <li>Helping with various lifestyle needs</li>
                </ul>
                <p className="mt-3">KoPartner's verified partners maintain strict professional boundaries while providing genuine support.</p>
              </div>
            </details>

            {/* FAQ Item 9 */}
            <details className="bg-white rounded-2xl shadow-lg group">
              <summary className="flex justify-between items-center cursor-pointer p-6 font-semibold text-gray-800 text-lg">
                <span>Is KoPartner a dating or matrimonial service?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                <p><strong>No, KoPartner is NOT a dating or matrimonial service.</strong></p>
                <p className="mt-2">KoPartner is strictly a professional social support platform. Key differences:</p>
                <ul className="mt-2 space-y-1 list-disc ml-5">
                  <li>All interactions are professional</li>
                  <li>Services are consent-first with clear boundaries</li>
                  <li>Focus is on support services, not romantic relationships</li>
                  <li>KoPartners are trained professionals</li>
                  <li>Strict code of conduct enforced</li>
                </ul>
                <p className="mt-3">Our mission is to help people with social support - not matchmaking.</p>
              </div>
            </details>

            {/* FAQ Item 10 */}
            <details className="bg-white rounded-2xl shadow-lg group">
              <summary className="flex justify-between items-center cursor-pointer p-6 font-semibold text-gray-800 text-lg">
                <span>What is the cost of KoPartner services?</span>
                <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                <p><strong>KoPartner service pricing:</strong></p>
                <div className="mt-3 bg-purple-50 p-4 rounded-xl">
                  <p className="font-semibold text-purple-800 mb-2">For Clients:</p>
                  <ul className="space-y-1 text-purple-700">
                    <li>• Elder Care: Starting ₹1,000/hour</li>
                    <li>• Hangingout: Starting ₹1,500/hour</li>
                    <li>• Clubbing & Events: Starting ₹2,000/hour</li>
                  </ul>
                </div>
                <div className="mt-3 bg-green-50 p-4 rounded-xl">
                  <p className="font-semibold text-green-800 mb-2">For KoPartners: 🎉 10 Lac+ Celebration Discount!</p>
                  <ul className="space-y-1 text-green-700">
                    <li>• Membership: <span className="line-through text-gray-400">₹500</span> ₹199 (6mo) / <span className="line-through text-gray-400">₹1,000</span> ₹499 (1yr) / <span className="line-through text-gray-400">₹2,000</span> ₹999 (lifetime)</li>
                    <li>• You keep: 80% of all earnings</li>
                    <li>• No hidden fees or charges</li>
                  </ul>
                </div>
                <p className="mt-3 text-sm text-gray-500">Prices may vary by individual KoPartner based on their rates and services.</p>
              </div>
            </details>
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
