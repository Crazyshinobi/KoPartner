import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import RazorpayPayment from '../components/RazorpayPayment';
import { 
  Search, MapPin, Star, Phone, Mail, Heart, 
  Filter, CreditCard, CheckCircle, Lock, AlertCircle,
  User, Clock, Shield, ChevronRight, IndianRupee
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = '/api';

const FindKoPartner = () => {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState('message'); // 'message', 'payment', 'search', 'select'
  const [kopartners, setKopartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedKoPartner, setSelectedKoPartner] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  
  const [filters, setFilters] = useState({
    city: '',
    service: '',
    pincode: ''
  });

  const serviceOptions = [
    { name: 'Voice Call Chat', rate: 500 },
    { name: 'Video Call Chat', rate: 800 },
    { name: 'In-Person Meeting', rate: 1500 },
    { name: 'Cuddle Session', rate: 2000 },
    { name: 'Movie Companion', rate: 1000 },
    { name: 'Dinner Companion', rate: 1500 },
    { name: 'Travel Companion', rate: 3000 },
    { name: 'Event Companion', rate: 2000 }
  ];

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    // Check if client has already paid
    if (user.can_search && user.service_payment_done) {
      setStep('search');
      fetchKoPartners();
    } else {
      setStep('message'); // Show payment message first
    }
  }, [user]);

  const fetchKoPartners = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.service) params.append('service', filters.service);
      if (filters.pincode) params.append('pincode', filters.pincode);
      
      const response = await axios.get(`${API}/kopartner/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKopartners(response.data.kopartners || []);
    } catch (err) {
      console.error('Failed to fetch KoPartners:', err);
      if (err.response?.status === 403) {
        setStep('message'); // Show payment message if not paid
      } else {
        setError('Failed to load KoPartners');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (data) => {
    await refreshUser();
    setStep('search');
    fetchKoPartners();
  };

  const toggleServiceSelection = (service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.name === service.name);
      if (exists) {
        return prev.filter(s => s.name !== service.name);
      } else {
        return [...prev, { ...service, hours: 1 }];
      }
    });
  };

  const updateServiceHours = (serviceName, hours) => {
    setSelectedServices(prev => 
      prev.map(s => s.name === serviceName ? { ...s, hours: parseInt(hours) } : s)
    );
  };

  const handleSelectKoPartner = (kopartner) => {
    setSelectedKoPartner(kopartner);
    setShowConfirmModal(true);
  };

  const confirmSelection = async () => {
    if (!selectedKoPartner) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/client/select-kopartner`, {
        kopartner_id: selectedKoPartner.id,
        selected_services: selectedServices.length > 0 ? selectedServices : [{ name: 'General Consultation', rate: 500 }],
        preferred_date: null,
        preferred_time: null,
        notes: ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBookingSuccess(response.data);
      setShowConfirmModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to book KoPartner');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = selectedServices.reduce((sum, s) => sum + (s.hours || 1) * (s.rate || 0), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  if (!user || (user.role !== 'client' && user.role !== 'both')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Header />
      
      {/* Page Title */}
      <div className="bg-white shadow-sm py-6 mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900">Find a KoPartner</h1>
          <p className="text-gray-600">Connect with verified companions in your area</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Message Step - Show when client hasn't paid */}
        {step === 'message' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-purple-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Please make payment to see or select KoPartner profiles
              </h2>
              
              <p className="text-gray-600 mb-6">
                Complete your service payment first to unlock access to browse and select from our verified KoPartner profiles.
              </p>

              <div className="bg-purple-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-purple-800 mb-2">What you'll get after payment:</h3>
                <ul className="text-left text-purple-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Browse all verified KoPartner profiles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>View ratings, reviews, and services offered</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Select your preferred KoPartner</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Receive contact details via SMS & Email</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setStep('payment')}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition flex items-center justify-center gap-3"
                data-testid="make-payment-btn"
              >
                <CreditCard className="w-6 h-6" />
                Make Payment
              </button>

              <p className="text-sm text-gray-500 mt-4">
                Secure payment powered by Razorpay
              </p>
            </div>
          </div>
        )}

        {/* Payment Step */}
        {step === 'payment' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Lock className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Complete Payment to Search</h2>
              <p className="text-gray-600">Select your desired services and pay to unlock KoPartner search</p>
            </div>

            {/* Service Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Select Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {serviceOptions.map((service) => {
                  const isSelected = selectedServices.find(s => s.name === service.name);
                  return (
                    <div
                      key={service.name}
                      onClick={() => toggleServiceSelection(service)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition ${
                        isSelected 
                          ? 'border-purple-600 bg-purple-50' 
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{service.name}</span>
                        <span className="text-purple-600 font-bold">₹{service.rate}/hr</span>
                      </div>
                      {isSelected && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm text-gray-600">Hours:</span>
                          <select
                            value={isSelected.hours}
                            onChange={(e) => updateServiceHours(service.name, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-1 border rounded"
                          >
                            {[1, 2, 3, 4, 5].map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedServices.length > 0 && (
              <RazorpayPayment
                type="service"
                services={selectedServices}
                token={token}
                onSuccess={handlePaymentSuccess}
                onError={(err) => setError(err.message)}
              />
            )}

            {selectedServices.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-yellow-700">Please select at least one service to proceed</p>
              </div>
            )}
          </div>
        )}

        {/* Search Step */}
        {step === 'search' && !bookingSuccess && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold">Filter KoPartners</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="City"
                  value={filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={filters.pincode}
                  onChange={(e) => setFilters(prev => ({ ...prev, pincode: e.target.value }))}
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                />
                <select
                  value={filters.service}
                  onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Services</option>
                  {serviceOptions.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <button
                  onClick={fetchKoPartners}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search
                </button>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                <p>Loading KoPartners...</p>
              </div>
            ) : kopartners.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">No KoPartners Found</h3>
                <p className="text-gray-500">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kopartners.map((kp) => (
                  <div key={kp.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                          {(kp.name || 'K')[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{kp.name || 'KoPartner'}</h3>
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span>{kp.rating?.toFixed(1) || '0.0'}</span>
                            <span className="text-gray-400 text-sm">({kp.total_reviews || 0} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{kp.city || 'Location not specified'}{kp.pincode ? `, ${kp.pincode}` : ''}</span>
                        </div>
                        {kp.birth_year && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Age:</span>
                            <span>{new Date().getFullYear() - kp.birth_year} years</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-purple-600">
                          <Lock className="w-4 h-4" />
                          <span className="text-xs">Contact details shared after selection</span>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{kp.bio || 'No bio available'}</p>

                      {/* Availability */}
                      {kp.availability && kp.availability.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2">Available:</p>
                          <div className="flex flex-wrap gap-1">
                            {kp.availability.map((slot, idx) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                {slot.day.slice(0, 3)} {slot.start}-{slot.end}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Services */}
                      {kp.services && kp.services.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2">Services:</p>
                          <div className="flex flex-wrap gap-1">
                            {kp.services.slice(0, 3).map((s, idx) => (
                              <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                {s.name || s.service} - ₹{s.rate}/hr
                              </span>
                            ))}
                            {kp.services.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{kp.services.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Hobbies */}
                      {kp.hobbies && kp.hobbies.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2">Interests:</p>
                          <div className="flex flex-wrap gap-1">
                            {kp.hobbies.slice(0, 4).map((hobby, idx) => (
                              <span key={idx} className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">
                                {hobby}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => handleSelectKoPartner(kp)}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                      >
                        <Heart className="w-5 h-5" />
                        Select This KoPartner
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Booking Success */}
        {bookingSuccess && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Contact details have been sent to both you and the KoPartner via SMS and email.
            </p>

            <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
              <h3 className="font-bold mb-4">KoPartner Contact Details:</h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {bookingSuccess.kopartner_contact?.name}</p>
                <p><strong>Phone:</strong> {bookingSuccess.kopartner_contact?.phone}</p>
                {bookingSuccess.kopartner_contact?.email && (
                  <p><strong>Email:</strong> {bookingSuccess.kopartner_contact?.email}</p>
                )}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Safety Guidelines
              </h4>
              <ul className="text-sm text-red-600 text-left list-disc pl-5 space-y-1">
                <li>Always meet in public places first</li>
                <li>Share your location with trusted contacts</li>
                <li>If you feel unsafe, call 112 immediately</li>
                <li>Report any inappropriate behavior</li>
              </ul>
              <p className="mt-2 text-red-700 font-semibold">
                SOS Helpline: 112 | Support: support@kopartner.in
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedKoPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Selection</h3>
            <p className="text-gray-600 mb-4">
              You are about to select <strong>{selectedKoPartner.name}</strong> as your KoPartner. 
              Once confirmed, both of you will receive each other's contact details via SMS and email.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> Please follow our safety guidelines when meeting your KoPartner.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSelection}
                disabled={loading}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default FindKoPartner;
