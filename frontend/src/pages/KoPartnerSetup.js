import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import RazorpayPayment from '../components/RazorpayPayment';
import { 
  CheckCircle, User, MapPin, Briefcase, CreditCard, 
  ArrowRight, Star, Shield, Clock, Camera, Upload, X
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = '/api';

const KoPartnerSetup = () => {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Payment, 2: Profile, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
    city: '',
    pincode: '',
    birth_year: '',
    hobbies: [],
    services: [{ name: 'Voice Call Chat', rate: 500 }],
    upi_id: '',
    profile_photo: '',
    availability: [
      { day: 'Monday', enabled: false, start: '09:00', end: '18:00' },
      { day: 'Tuesday', enabled: false, start: '09:00', end: '18:00' },
      { day: 'Wednesday', enabled: false, start: '09:00', end: '18:00' },
      { day: 'Thursday', enabled: false, start: '09:00', end: '18:00' },
      { day: 'Friday', enabled: false, start: '09:00', end: '18:00' },
      { day: 'Saturday', enabled: false, start: '09:00', end: '18:00' },
      { day: 'Sunday', enabled: false, start: '09:00', end: '18:00' }
    ]
  });
  
  const [hobbyInput, setHobbyInput] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Generate birth year options (18-60 years old)
  const currentYear = new Date().getFullYear();
  const birthYearOptions = Array.from({ length: 43 }, (_, i) => currentYear - 18 - i);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    // Check user status
    if (user.membership_paid && user.profile_completed) {
      navigate('/dashboard');
    } else if (user.membership_paid && !user.profile_completed) {
      setStep(2);
    }
  }, [user, navigate]);

  const handlePaymentSuccess = async (data) => {
    console.log('[KoPartnerSetup] Payment success, data:', data);
    
    // The payment verification returns updated user data
    // Use it directly to update the local state immediately
    if (data && data.user) {
      // Update the user in context with the fresh data from payment verification
      await refreshUser();
    } else {
      // Fallback: Refresh from server
      await refreshUser();
    }
    
    // Small delay to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Move to profile completion step
    setStep(2);
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setPhotoUploading(true);
    setError('');

    try {
      const base64 = await fileToBase64(file);
      setProfile(prev => ({ ...prev, profile_photo: base64 }));
    } catch (err) {
      setError('Failed to process image');
    } finally {
      setPhotoUploading(false);
    }
  };

  const removePhoto = () => {
    setProfile(prev => ({ ...prev, profile_photo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateAvailability = (dayIndex, field, value) => {
    setProfile(prev => ({
      ...prev,
      availability: prev.availability.map((slot, i) => 
        i === dayIndex ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Filter only enabled availability slots and format for backend
      const enabledAvailability = profile.availability
        .filter(slot => slot.enabled)
        .map(({ day, start, end }) => ({ day, start, end }));

      const profileData = {
        ...profile,
        birth_year: profile.birth_year ? parseInt(profile.birth_year) : null,
        availability: enabledAvailability
      };

      const response = await axios.post(`${API}/kopartner/complete-profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        await refreshUser();
        setStep(3);
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const addHobby = () => {
    if (hobbyInput.trim() && !profile.hobbies.includes(hobbyInput.trim())) {
      setProfile(prev => ({
        ...prev,
        hobbies: [...prev.hobbies, hobbyInput.trim()]
      }));
      setHobbyInput('');
    }
  };

  const removeHobby = (hobby) => {
    setProfile(prev => ({
      ...prev,
      hobbies: prev.hobbies.filter(h => h !== hobby)
    }));
  };

  const addService = () => {
    setProfile(prev => ({
      ...prev,
      services: [...prev.services, { name: '', rate: 0 }]
    }));
  };

  const updateService = (index, field, value) => {
    setProfile(prev => ({
      ...prev,
      services: prev.services.map((s, i) => 
        i === index ? { ...s, [field]: field === 'rate' ? Number(value) : value } : s
      )
    }));
  };

  const removeService = (index) => {
    setProfile(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const serviceOptions = [
    'Voice Call Chat',
    'Video Call Chat',
    'In-Person Meeting',
    'Cuddle Session',
    'Movie Companion',
    'Dinner Companion',
    'Travel Companion',
    'Event Companion'
  ];

  if (!user || user.role === 'client') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Header />
      
      {/* Progress Steps */}
      <div className="bg-white shadow-sm py-6 mt-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-4">
            {[
              { num: 1, label: 'Payment', icon: CreditCard },
              { num: 2, label: 'Profile', icon: User },
              { num: 3, label: 'Complete', icon: CheckCircle }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className={`flex items-center gap-2 ${step >= s.num ? 'text-purple-600' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step > s.num ? 'bg-green-500 text-white' :
                    step === s.num ? 'bg-purple-600 text-white' : 'bg-gray-200'
                  }`}>
                    {step > s.num ? <CheckCircle size={20} /> : <s.icon size={20} />}
                  </div>
                  <span className="font-semibold hidden sm:block">{s.label}</span>
                </div>
                {idx < 2 && (
                  <ArrowRight className={`w-6 h-6 ${step > s.num ? 'text-green-500' : 'text-gray-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step 1: Payment */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a KoPartner</h1>
              <p className="text-gray-600">Join our platform and start earning today!</p>
            </div>

            {/* PAYMENT SECTION AT TOP */}
            <RazorpayPayment
              type="membership"
              token={token}
              onSuccess={handlePaymentSuccess}
              onError={(err) => setError(err.message)}
            />

            {/* Growing Community Badge */}
            <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 py-3 px-4 rounded-xl">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Growing Community - Join thousands of KoPartners across India</span>
            </div>

            {/* BENEFITS SECTION BELOW */}
            {/* Earning Potential */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-2xl font-bold mb-4 text-center">💰 Earning Potential</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/20 rounded-xl p-4">
                  <p className="text-3xl font-bold">₹500</p>
                  <p className="text-sm opacity-90">Voice Calls/hr</p>
                </div>
                <div className="bg-white/20 rounded-xl p-4">
                  <p className="text-3xl font-bold">₹1,000</p>
                  <p className="text-sm opacity-90">Video Calls/hr</p>
                </div>
                <div className="bg-white/20 rounded-xl p-4">
                  <p className="text-3xl font-bold">₹2,000</p>
                  <p className="text-sm opacity-90">In-Person/hr</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-xl font-bold">Earn ₹1L+ Monthly</p>
                <p className="text-sm opacity-90">Top KoPartners earn more!</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-center">🎁 Membership Benefits</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: '💵', title: '80%', subtitle: 'You Keep' },
                  { icon: '⏰', title: '24/7', subtitle: 'Flexible Hours' },
                  { icon: '📅', title: 'Flexible', subtitle: '6mo/1yr/Lifetime' },
                  { icon: '💰', title: 'From ₹500', subtitle: 'Membership' },
                  { icon: '⭐', title: 'Verified', subtitle: 'Badge' },
                  { icon: '📊', title: 'Featured', subtitle: 'Profile Listing' },
                  { icon: '🎯', title: 'Set Your', subtitle: 'Own Rates' },
                  { icon: '📱', title: 'Unlimited', subtitle: 'Bookings' }
                ].map((benefit, idx) => (
                  <div key={idx} className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                    <div className="text-3xl mb-2">{benefit.icon}</div>
                    <p className="font-bold text-purple-700">{benefit.title}</p>
                    <p className="text-sm text-gray-600">{benefit.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Join */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">✨ Why Join as a KoPartner?</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Be Your Own Boss</strong> - Set your own schedule, rates, and services</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Instant Payments</strong> - Receive payments directly to your UPI</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Safe & Secure</strong> - Verified clients, SOS support, and safety guidelines</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Growing Community</strong> - Join thousands of KoPartners across India</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: Profile Setup */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600">Now complete your profile to start receiving bookings</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Profile Photo Upload */}
              <div>
                <label className="block text-sm font-semibold mb-2">Profile Photo *</label>
                <div className="flex items-center gap-4">
                  {/* Photo Preview */}
                  <div className="relative">
                    {profile.profile_photo ? (
                      <div className="relative">
                        <img
                          src={profile.profile_photo}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-4 border-purple-200"
                        />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-dashed border-gray-300">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Button */}
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-xl cursor-pointer hover:bg-purple-50 transition ${photoUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Upload size={18} />
                      {photoUploading ? 'Uploading...' : profile.profile_photo ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB.</p>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                    required
                    data-testid="profile-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email *</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                    required
                    data-testid="profile-email"
                  />
                </div>
              </div>

              {/* Birth Year */}
              <div>
                <label className="block text-sm font-semibold mb-2">Birth Year *</label>
                <select
                  value={profile.birth_year}
                  onChange={(e) => setProfile(prev => ({ ...prev, birth_year: e.target.value }))}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                  required
                  data-testid="profile-birth-year"
                >
                  <option value="">Select Birth Year</option>
                  {birthYearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">You must be at least 18 years old</p>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">City *</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Delhi, Mumbai"
                    required
                    data-testid="profile-city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Pincode *</label>
                  <input
                    type="text"
                    value={profile.pincode}
                    onChange={(e) => setProfile(prev => ({ ...prev, pincode: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 110001"
                    required
                    data-testid="profile-pincode"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold mb-2">About You *</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                  rows={4}
                  placeholder="Tell clients about yourself, your personality, and what makes you a great companion..."
                  required
                  data-testid="profile-bio"
                />
              </div>

              {/* Hobbies */}
              <div>
                <label className="block text-sm font-semibold mb-2">Hobbies & Interests</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={hobbyInput}
                    onChange={(e) => setHobbyInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHobby())}
                    className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                    placeholder="Add a hobby and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addHobby}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map((hobby, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1"
                    >
                      {hobby}
                      <button
                        type="button"
                        onClick={() => removeHobby(hobby)}
                        className="ml-1 text-purple-500 hover:text-purple-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div>
                <label className="block text-sm font-semibold mb-2">Services & Rates *</label>
                {profile.services.map((service, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select
                      value={service.name}
                      onChange={(e) => updateService(idx, 'name', e.target.value)}
                      className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Select Service</option>
                      {serviceOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={service.rate}
                      onChange={(e) => updateService(idx, 'rate', e.target.value)}
                      className="w-32 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                      placeholder="Rate/hr"
                      min="0"
                      required
                    />
                    {profile.services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeService(idx)}
                        className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addService}
                  className="text-purple-600 hover:text-purple-700 font-semibold"
                >
                  + Add Another Service
                </button>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-semibold mb-2">Availability *</label>
                <p className="text-xs text-gray-500 mb-3">Select the days and times you're available for services</p>
                <div className="space-y-3">
                  {profile.availability.map((slot, idx) => (
                    <div key={slot.day} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <label className="flex items-center gap-2 w-28">
                        <input
                          type="checkbox"
                          checked={slot.enabled}
                          onChange={(e) => updateAvailability(idx, 'enabled', e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium">{slot.day}</span>
                      </label>
                      {slot.enabled && (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateAvailability(idx, 'start', e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateAvailability(idx, 'end', e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* UPI ID */}
              <div>
                <label className="block text-sm font-semibold mb-2">UPI ID (for receiving payments) *</label>
                <input
                  type="text"
                  value={profile.upi_id}
                  onChange={(e) => setProfile(prev => ({ ...prev, upi_id: e.target.value }))}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                  placeholder="yourname@upi"
                  required
                  data-testid="profile-upi"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50"
                data-testid="submit-profile-btn"
              >
                {loading ? 'Saving...' : 'Complete Profile & Activate'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile Activated!</h1>
            <p className="text-gray-600 mb-6">
              Congratulations! Your KoPartner profile is now active. Clients can now find and book your services.
            </p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};


export default KoPartnerSetup;
