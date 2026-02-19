import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Search, MapPin, Star } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Use relative URL for proxy
const API = "/api";

const FindKoPartner = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [kopartners, setKoPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    service: '',
    pincode: ''
  });

  useEffect(() => {
    if (!user || (user.role !== 'client' && user.role !== 'both')) {
      navigate('/dashboard');
      return;
    }
    
    if (!user.can_search) {
      alert('Please complete payment to search for kopartners');
      navigate('/book-services');
      return;
    }

    fetchKoPartners();
  }, []);

  const fetchKoPartners = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.service) params.append('service', filters.service);
      if (filters.pincode) params.append('pincode', filters.pincode);

      const response = await axios.get(`${API}/kopartner/all?${params.toString()}`);
      setKoPartners(response.data.kopartners);
    } catch (error) {
      console.error('Failed to fetch kopartners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchKoPartners();
  };

  const handleViewProfile = (kopartnerId) => {
    navigate(`/kopartner/${kopartnerId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8 mt-20">
        <h1 className="text-3xl font-bold mb-2" data-testid="find-kopartner-title">Find a KoPartner</h1>
        <p className="text-gray-600 mb-8">Search for verified kopartners in your area</p>

        {/* Search Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                placeholder="e.g., Mumbai"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                data-testid="city-filter"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Service</label>
              <input
                type="text"
                value={filters.service}
                onChange={(e) => setFilters({ ...filters, service: e.target.value })}
                placeholder="e.g., Voice Call"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                data-testid="service-filter"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pincode</label>
              <input
                type="text"
                value={filters.pincode}
                onChange={(e) => setFilters({ ...filters, pincode: e.target.value })}
                placeholder="e.g., 400001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                maxLength={6}
                data-testid="pincode-filter"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center space-x-2"
                data-testid="search-button"
              >
                <Search size={20} />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading kopartners...</p>
          </div>
        ) : kopartners.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-xl text-gray-600">No kopartners found matching your criteria</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kopartners.map((kopartner) => (
              <div
                key={kopartner.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition cursor-pointer"
                onClick={() => handleViewProfile(kopartner.id)}
                data-testid={`kopartner-card-${kopartner.id}`}
              >
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-32"></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{kopartner.name}</h3>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin size={16} className="mr-1" />
                    <span className="text-sm">{kopartner.city}, {kopartner.pincode}</span>
                  </div>

                  <div className="flex items-center mb-3">
                    <Star size={16} className="text-yellow-400 fill-current" />
                    <span className="ml-1 font-semibold">{kopartner.rating.toFixed(1)}</span>
                    <span className="text-gray-500 text-sm ml-1">({kopartner.total_reviews} reviews)</span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{kopartner.bio}</p>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {kopartner.services.slice(0, 3).map((service, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                        >
                          {service.service}
                        </span>
                      ))}
                      {kopartner.services.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          +{kopartner.services.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProfile(kopartner.id);
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default FindKoPartner;
