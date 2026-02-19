import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Users, Star, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// City data with SEO content
const cityData = {
  'delhi': {
    name: 'Delhi',
    fullName: 'Delhi NCR',
    state: 'Delhi',
    description: 'Find trusted KoPartners in Delhi NCR for professional companionship services. Connect with verified companions in Delhi, Noida, Gurgaon for emotional wellness support.',
    population: '32 million',
    landmarks: ['India Gate', 'Red Fort', 'Qutub Minar'],
    areas: ['Connaught Place', 'South Delhi', 'Noida', 'Gurgaon', 'Dwarka', 'Rohini']
  },
  'noida': {
    name: 'Noida',
    fullName: 'Noida',
    state: 'Uttar Pradesh',
    description: 'Professional KoPartner services in Noida. Find verified companions for emotional wellness, stress relief, and companionship in Noida and Greater Noida.',
    population: '6 million',
    landmarks: ['Worlds of Wonder', 'Noida Film City', 'Botanical Garden'],
    areas: ['Sector 18', 'Sector 62', 'Greater Noida', 'Sector 137', 'Sector 50']
  },
  'gurgaon': {
    name: 'Gurgaon',
    fullName: 'Gurugram',
    state: 'Haryana',
    description: 'KoPartner companionship services in Gurgaon/Gurugram. Professional, verified companions for emotional support and wellness in the millennium city.',
    population: '4 million',
    landmarks: ['Cyber Hub', 'Kingdom of Dreams', 'Ambience Mall'],
    areas: ['Cyber City', 'DLF Phase', 'Sohna Road', 'Golf Course Road', 'MG Road']
  },
  'mumbai': {
    name: 'Mumbai',
    fullName: 'Mumbai',
    state: 'Maharashtra',
    description: 'Mumbai\'s trusted KoPartner platform for professional companionship. Find verified companions in Mumbai for emotional wellness and support.',
    population: '21 million',
    landmarks: ['Gateway of India', 'Marine Drive', 'Bandra-Worli Sea Link'],
    areas: ['Bandra', 'Andheri', 'Juhu', 'Colaba', 'Powai', 'Lower Parel']
  },
  'bangalore': {
    name: 'Bangalore',
    fullName: 'Bengaluru',
    state: 'Karnataka',
    description: 'Professional KoPartner services in Bangalore. Connect with verified companions for emotional wellness in India\'s Silicon Valley.',
    population: '13 million',
    landmarks: ['Lalbagh', 'Cubbon Park', 'Bangalore Palace'],
    areas: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Electronic City', 'MG Road']
  },
  'pune': {
    name: 'Pune',
    fullName: 'Pune',
    state: 'Maharashtra',
    description: 'Find KoPartners in Pune for professional companionship and emotional wellness services. Verified companions in the cultural capital of Maharashtra.',
    population: '7 million',
    landmarks: ['Shaniwar Wada', 'Aga Khan Palace', 'Sinhagad Fort'],
    areas: ['Koregaon Park', 'Viman Nagar', 'Hinjewadi', 'Kothrud', 'Baner', 'Aundh']
  },
  'hyderabad': {
    name: 'Hyderabad',
    fullName: 'Hyderabad',
    state: 'Telangana',
    description: 'KoPartner services in Hyderabad. Professional companionship and emotional wellness support from verified companions in the City of Pearls.',
    population: '10 million',
    landmarks: ['Charminar', 'Golconda Fort', 'Hussain Sagar'],
    areas: ['Banjara Hills', 'Jubilee Hills', 'HITEC City', 'Gachibowli', 'Madhapur', 'Secunderabad']
  },
  'chennai': {
    name: 'Chennai',
    fullName: 'Chennai',
    state: 'Tamil Nadu',
    description: 'Professional KoPartner companionship in Chennai. Find verified companions for emotional wellness in the gateway to South India.',
    population: '11 million',
    landmarks: ['Marina Beach', 'Kapaleeshwarar Temple', 'Fort St. George'],
    areas: ['T. Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'OMR', 'ECR']
  },
  'kolkata': {
    name: 'Kolkata',
    fullName: 'Kolkata',
    state: 'West Bengal',
    description: 'KoPartner services in Kolkata. Professional companionship and emotional support from verified companions in the City of Joy.',
    population: '15 million',
    landmarks: ['Victoria Memorial', 'Howrah Bridge', 'Park Street'],
    areas: ['Salt Lake', 'New Town', 'Park Street', 'Ballygunge', 'Alipore', 'Rajarhat']
  },
  'ahmedabad': {
    name: 'Ahmedabad',
    fullName: 'Ahmedabad',
    state: 'Gujarat',
    description: 'Find KoPartners in Ahmedabad for professional companionship services. Verified companions for emotional wellness in Gujarat\'s largest city.',
    population: '8 million',
    landmarks: ['Sabarmati Ashram', 'Adalaj Stepwell', 'Kankaria Lake'],
    areas: ['SG Highway', 'Prahlad Nagar', 'Navrangpura', 'Satellite', 'Bodakdev', 'Vastrapur']
  },
  'jaipur': {
    name: 'Jaipur',
    fullName: 'Jaipur',
    state: 'Rajasthan',
    description: 'Professional KoPartner services in Jaipur. Find verified companions for emotional wellness in the Pink City of India.',
    population: '4 million',
    landmarks: ['Hawa Mahal', 'Amber Fort', 'City Palace'],
    areas: ['C-Scheme', 'Vaishali Nagar', 'Malviya Nagar', 'Mansarovar', 'Raja Park', 'Tonk Road']
  },
  'chandigarh': {
    name: 'Chandigarh',
    fullName: 'Chandigarh',
    state: 'Chandigarh',
    description: 'KoPartner companionship in Chandigarh. Professional, verified companions for emotional support in India\'s best planned city.',
    population: '1.2 million',
    landmarks: ['Rock Garden', 'Sukhna Lake', 'Capitol Complex'],
    areas: ['Sector 17', 'Sector 35', 'Sector 22', 'Mohali', 'Panchkula', 'Zirakpur']
  },
  'indore': {
    name: 'Indore',
    fullName: 'Indore',
    state: 'Madhya Pradesh',
    description: 'Find KoPartners in Indore for professional companionship. Verified companions for emotional wellness in India\'s cleanest city.',
    population: '3.5 million',
    landmarks: ['Rajwada Palace', 'Lal Bagh Palace', 'Sarafa Bazaar'],
    areas: ['Vijay Nagar', 'Palasia', 'South Tukoganj', 'AB Road', 'Bhawarkuan', 'Sapna Sangeeta']
  },
  'lucknow': {
    name: 'Lucknow',
    fullName: 'Lucknow',
    state: 'Uttar Pradesh',
    description: 'Professional KoPartner services in Lucknow. Find verified companions for emotional wellness in the City of Nawabs.',
    population: '4 million',
    landmarks: ['Bara Imambara', 'Rumi Darwaza', 'Hazratganj'],
    areas: ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Alambagh', 'Mahanagar']
  },
  'kochi': {
    name: 'Kochi',
    fullName: 'Kochi',
    state: 'Kerala',
    description: 'KoPartner companionship services in Kochi. Professional companions for emotional wellness in the Queen of the Arabian Sea.',
    population: '2.5 million',
    landmarks: ['Fort Kochi', 'Chinese Fishing Nets', 'Mattancherry Palace'],
    areas: ['MG Road', 'Marine Drive', 'Kakkanad', 'Edappally', 'Vytilla', 'Palarivattom']
  },
  'coimbatore': {
    name: 'Coimbatore',
    fullName: 'Coimbatore',
    state: 'Tamil Nadu',
    description: 'Find KoPartners in Coimbatore for professional companionship. Verified companions for emotional support in the Manchester of South India.',
    population: '2.5 million',
    landmarks: ['Marudhamalai Temple', 'Isha Yoga Center', 'Siruvani Waterfalls'],
    areas: ['RS Puram', 'Gandhipuram', 'Peelamedu', 'Saibaba Colony', 'Race Course', 'Brookefields']
  },
  'nashik': {
    name: 'Nashik',
    fullName: 'Nashik',
    state: 'Maharashtra',
    description: 'Professional KoPartner services in Nashik. Find verified companions for emotional wellness in the Wine Capital of India.',
    population: '2 million',
    landmarks: ['Sula Vineyards', 'Trimbakeshwar', 'Pandavleni Caves'],
    areas: ['College Road', 'Gangapur Road', 'Panchavati', 'CIDCO', 'Nashik Road', 'Satpur']
  },
  'surat': {
    name: 'Surat',
    fullName: 'Surat',
    state: 'Gujarat',
    description: 'KoPartner companionship in Surat. Professional, verified companions for emotional support in the Diamond City of India.',
    population: '7 million',
    landmarks: ['Dumas Beach', 'Surat Castle', 'ISKCON Temple'],
    areas: ['Athwa', 'Adajan', 'Vesu', 'City Light', 'Piplod', 'Varachha']
  },
  'dehradun': {
    name: 'Dehradun',
    fullName: 'Dehradun',
    state: 'Uttarakhand',
    description: 'Find KoPartners in Dehradun for professional companionship. Verified companions for emotional wellness in the gateway to Himalayas.',
    population: '0.8 million',
    landmarks: ['Robber\'s Cave', 'Sahastradhara', 'Forest Research Institute'],
    areas: ['Rajpur Road', 'Race Course', 'Clement Town', 'Prem Nagar', 'Balliwala', 'Dalanwala']
  }
};

const CityPage = () => {
  const { citySlug: paramCitySlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState('client');
  const [cityKoPartners, setCityKoPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeKoPartnersCount, setActiveKoPartnersCount] = useState(4836);

  // Extract city slug from URL path (handles both /kopartner-delhi and /kopartner-:citySlug)
  const pathname = window.location.pathname;
  const citySlug = paramCitySlug || pathname.replace('/kopartner-', '').toLowerCase();
  
  const city = cityData[citySlug];

  // Animate active KoPartners count - updates every second with random 4000+ number
  useEffect(() => {
    const interval = setInterval(() => {
      // Generate random number between 4000 and 4999
      const randomCount = Math.floor(Math.random() * 1000) + 4000;
      setActiveKoPartnersCount(randomCount);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch KoPartners for this city
  useEffect(() => {
    const fetchCityKoPartners = async () => {
      if (!city) return;
      
      try {
        const response = await fetch(`${BACKEND_URL}/public/online-kopartners?limit=12`);
        if (response.ok) {
          const data = await response.json();
          // Filter by city if we have data
          const filtered = data.kopartners.filter(kp => 
            kp.city?.toLowerCase() === city.name.toLowerCase() ||
            kp.city?.toLowerCase() === city.fullName.toLowerCase()
          );
          setCityKoPartners(filtered);
        }
      } catch (error) {
        console.error('Error fetching KoPartners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCityKoPartners();
  }, [city]);

  // If city not found, redirect to home
  if (!city) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">City Not Found</h1>
          <p className="text-gray-600 mb-6">The city you're looking for is not available.</p>
          <Link to="/" className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-colors">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const handleBecomePartner = () => {
    if (user) {
      if (user.role === 'cuddlist' || user.role === 'both') {
        navigate('/dashboard');
      } else {
        alert('You are registered as a client. Please create a new account to become a KoPartner.');
      }
    } else {
      setAuthRole('cuddlist');
      setShowAuthModal(true);
    }
  };

  const handleFindPartner = () => {
    if (user) {
      navigate(`/find-kopartner?city=${encodeURIComponent(city.name)}`);
    } else {
      setAuthRole('client');
      setShowAuthModal(true);
    }
  };

  // All 8 services matching homepage
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

  // All cities for the navigation
  const allCities = Object.keys(cityData).map(slug => ({
    slug,
    name: cityData[slug].name
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-purple-600">Home</Link>
            <span>/</span>
            <span className="text-purple-600 font-medium">KoPartner in {city.name}</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  Now Available
                </span>
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                KoPartner in {city.fullName}
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {city.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={handleFindPartner}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Users className="w-5 h-5" />
                Find a KoPartner in {city.name}
              </button>
              <button
                onClick={handleBecomePartner}
                className="flex-1 bg-white border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-purple-50 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Star className="w-5 h-5" />
                Become a KoPartner in {city.name}
              </button>
            </div>

            {/* City Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>
      </section>

      {/* How It Works - Two Flows */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            How KoPartner Works in {city.name}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Find a KoPartner Flow */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Find a KoPartner in {city.name}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-gray-800">Sign Up</p>
                    <p className="text-sm text-gray-600">Create your account with phone number</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-gray-800">Choose Services</p>
                    <p className="text-sm text-gray-600">Select voice call, video call, or in-person</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <p className="font-semibold text-gray-800">Pay Service Fee</p>
                    <p className="text-sm text-gray-600">Secure payment for your chosen service</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
                  <div>
                    <p className="font-semibold text-gray-800">Select KoPartner</p>
                    <p className="text-sm text-gray-600">Browse KoPartners in {city.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Auto Info Exchange</p>
                    <p className="text-sm text-gray-600">Get KoPartner contact via Email & SMS</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleFindPartner}
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Find KoPartner Now →
              </button>
            </div>

            {/* Become a KoPartner Flow */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <Star className="w-6 h-6" />
                Become a KoPartner in {city.name}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-gray-800">Sign Up</p>
                    <p className="text-sm text-gray-600">Create your KoPartner account</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-gray-800">Pay Membership</p>
                    <p className="text-sm text-gray-600">One-time ₹1,000 annual fee</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Profile Auto-Activated!</p>
                    <p className="text-sm text-gray-600">Start receiving bookings immediately</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/60 rounded-xl p-4 mt-4">
                <p className="text-green-800 font-semibold mb-2">💰 Earning Potential in {city.name}</p>
                <p className="text-2xl font-bold text-green-600">₹50,000 - ₹1,50,000/month</p>
                <p className="text-sm text-gray-600">You keep 80% of all earnings</p>
              </div>
              <button
                onClick={handleBecomePartner}
                className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Start Earning in {city.name} →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Available - All 8 Services like Homepage */}
      <section className="py-12 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            KoPartner Services in {city.name}
          </h2>
          <p className="text-center text-gray-600 mb-8">Choose from our wide range of companionship services</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((service, index) => (
              <div
                key={index}
                onClick={handleFindPartner}
                className="group bg-white p-5 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-purple-100"
              >
                <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">{service.emoji}</div>
                <h3 className="text-lg font-bold mb-1 text-gray-800">{service.title}</h3>
                <p className="text-gray-600 mb-3 text-sm leading-relaxed">{service.description}</p>
                <p className={`text-xl font-bold bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent mb-3`}>{service.price}</p>
                <button
                  className={`w-full bg-gradient-to-r ${service.gradient} text-white py-2 rounded-xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm`}
                >
                  Book Now →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Areas Covered */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">
            KoPartner Available in {city.name} Areas
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {city.areas.map((area, index) => (
              <span 
                key={index}
                className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-100 cursor-pointer transition-colors"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Other Cities */}
      <section className="py-12 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">
            KoPartner in Other Cities
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {allCities.filter(c => c.slug !== citySlug).map((c, index) => (
              <Link
                key={index}
                to={`/kopartner-${c.slug}`}
                className="bg-white text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-600 hover:text-white transition-all shadow-sm"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            About KoPartner Services in {city.fullName}
          </h2>
          <div className="prose prose-lg text-gray-600">
            <p>
              <strong>KoPartner in {city.name}</strong> provides professional companionship services for emotional wellness and support. 
              Our verified KoPartners in {city.fullName}, {city.state} offer safe, consent-first, strictly platonic services including 
              voice calls, video calls, movie companions, shopping buddies, travel partners, and stress relief support.
            </p>
            <p className="mt-4">
              Whether you're looking to <strong>find a KoPartner in {city.name}</strong> or want to <strong>become a KoPartner in {city.name}</strong>, 
              our platform ensures quality, safety, and professionalism. All KoPartners are background-verified and trained to provide 
              emotional support while maintaining strict boundaries.
            </p>
            <p className="mt-4">
              <strong>KoPartner {city.name}</strong> is part of India's Number 1 Best Trusted Emotional Wellness Platform, 
              serving clients across {city.areas.slice(0, 3).join(', ')} and other areas in {city.fullName}.
            </p>
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

export default CityPage;
