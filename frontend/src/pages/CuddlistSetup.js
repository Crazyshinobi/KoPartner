import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Plus, X, Home } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Use relative URL for proxy
const API = "/api";

const KoPartnerSetup = () => {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    city: user?.city || '',
    pincode: user?.pincode || '',
    upi_id: user?.upi_id || ''
  });
  
  const [hobbies, setHobbies] = useState(user?.hobbies || []);
  const [hobbyInput, setHobbyInput] = useState('');
  
  const availableServices = [
    { name: 'Voice Call Chat', defaultRate: 500 },
    { name: 'Video Call Chat', defaultRate: 1000 },
    { name: 'Movie Companion', defaultRate: 2000 },
    { name: 'Shopping Buddy', defaultRate: 2000 },
    { name: 'Medical Support', defaultRate: 2000 },
    { name: 'Domestic Help', defaultRate: 2000 },
    { name: 'Travel Partner', defaultRate: 2000 },
    { name: 'Stress Relief', defaultRate: 2000 }
  ];
  
  const [selectedServices, setSelectedServices] = useState(user?.services || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddHobby = () => {
    if (hobbyInput.trim() && !hobbies.includes(hobbyInput.trim())) {
      setHobbies([...hobbies, hobbyInput.trim()]);
      setHobbyInput('');
    }
  };

  const handleRemoveHobby = (hobby) => {
    setHobbies(hobbies.filter(h => h !== hobby));
  };

  const handleServiceToggle = (service) => {
    const exists = selectedServices.find(s => s.service === service.name);
    if (exists) {
      setSelectedServices(selectedServices.filter(s => s.service !== service.name));
    } else {
      setSelectedServices([...selectedServices, { service: service.name, rate: service.defaultRate }]);
    }
  };

  const handleRateChange = (serviceName, newRate) => {
    setSelectedServices(selectedServices.map(s => 
      s.service === serviceName ? { ...s, rate: parseInt(newRate) || 0 } : s
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.put(
        `${API}/kopartner/setup-profile`,
        {
          ...formData,
          hobbies,
          services: selectedServices
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateUser(response.data);
      alert('Profile setup successful! Please proceed to pay activation fee.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to setup profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'kopartner' && user.role !== 'both')) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8 mt-20">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="setup-title">KoPartner Profile Setup</h1>
          <p className="text-gray-600 mb-8">Complete your profile to start offering services</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                  data-testid="name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                  data-testid="city-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Pincode *</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  maxLength={6}
                  required
                  data-testid="pincode-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">UPI ID *</label>
                <input
                  type="text"
                  value={formData.upi_id}
                  onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                  placeholder="yourname@upi"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                  data-testid="upi-input"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium mb-2">Bio *</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Tell us about yourself..."
                required
                data-testid="bio-input"
              />
            </div>

            {/* Hobbies */}
            <div>
              <label className="block text-sm font-medium mb-2">Hobbies</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={hobbyInput}
                  onChange={(e) => setHobbyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHobby())}
                  placeholder="Add a hobby"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  data-testid="hobby-input"
                />
                <button
                  type="button"
                  onClick={handleAddHobby}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
                  data-testid="add-hobby-button"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {hobbies.map((hobby, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center gap-2"
                    data-testid={`hobby-tag-${index}`}
                  >
                    {hobby}
                    <button
                      type="button"
                      onClick={() => handleRemoveHobby(hobby)}
                      className="hover:text-purple-900"
                    >
                      <X size={16} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <label className="block text-sm font-medium mb-2">Services & Rates *</label>
              <p className="text-sm text-gray-600 mb-4">Select services you want to offer and set your rates</p>
              <div className="space-y-3">
                {availableServices.map((service) => {
                  const isSelected = selectedServices.find(s => s.service === service.name);
                  return (
                    <div
                      key={service.name}
                      className={`border rounded-lg p-4 transition ${
                        isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                      }`}
                      data-testid={`service-${service.name}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={() => handleServiceToggle(service)}
                            className="w-5 h-5 text-purple-600"
                          />
                          <span className="font-medium">{service.name}</span>
                        </div>
                        {isSelected && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">₹</span>
                            <input
                              type="number"
                              value={isSelected.rate}
                              onChange={(e) => handleRateChange(service.name, e.target.value)}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                              min="0"
                              data-testid={`rate-${service.name}`}
                            />
                            <span className="text-gray-600">/hour</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || selectedServices.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              data-testid="submit-profile-button"
            >
              {loading ? 'Saving...' : 'Save Profile & Continue'}
            </button>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default KoPartnerSetup;
