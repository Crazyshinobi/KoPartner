import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, Save, Loader } from 'lucide-react';
import axios from 'axios';

const API = '/api';

const ProfileEditModal = ({ isOpen, onClose, user, token, onUpdate }) => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    bio: '',
    city: '',
    pincode: '',
    birth_year: '',
    hobbies: [],
    services: [],
    upi_id: '',
    profile_photo: '',
    availability: []
  });
  
  const [hobbyInput, setHobbyInput] = useState('');
  const [loading, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Generate birth year options (18-60 years old)
  const currentYear = new Date().getFullYear();
  const birthYearOptions = Array.from({ length: 43 }, (_, i) => currentYear - 18 - i);

  const defaultAvailability = [
    { day: 'Monday', enabled: false, start: '09:00', end: '18:00' },
    { day: 'Tuesday', enabled: false, start: '09:00', end: '18:00' },
    { day: 'Wednesday', enabled: false, start: '09:00', end: '18:00' },
    { day: 'Thursday', enabled: false, start: '09:00', end: '18:00' },
    { day: 'Friday', enabled: false, start: '09:00', end: '18:00' },
    { day: 'Saturday', enabled: false, start: '09:00', end: '18:00' },
    { day: 'Sunday', enabled: false, start: '09:00', end: '18:00' }
  ];

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

  useEffect(() => {
    if (user && isOpen) {
      // Merge user availability with default availability
      const userAvailability = user.availability || [];
      const mergedAvailability = defaultAvailability.map(defaultSlot => {
        const userSlot = userAvailability.find(s => s.day === defaultSlot.day);
        if (userSlot) {
          return { ...defaultSlot, ...userSlot, enabled: true };
        }
        return defaultSlot;
      });

      setProfile({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        city: user.city || '',
        pincode: user.pincode || '',
        birth_year: user.birth_year || '',
        hobbies: user.hobbies || [],
        services: user.services || [{ name: 'Voice Call Chat', rate: 500 }],
        upi_id: user.upi_id || '',
        profile_photo: user.profile_photo || '',
        availability: mergedAvailability
      });
      setError('');
      setSuccess('');
    }
  }, [user, isOpen]);

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

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

  const updateAvailability = (dayIndex, field, value) => {
    setProfile(prev => ({
      ...prev,
      availability: prev.availability.map((slot, i) => 
        i === dayIndex ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Filter only enabled availability slots
      const enabledAvailability = profile.availability
        .filter(slot => slot.enabled)
        .map(({ day, start, end }) => ({ day, start, end }));

      const profileData = {
        ...profile,
        birth_year: profile.birth_year ? parseInt(profile.birth_year) : null,
        availability: enabledAvailability
      };

      const response = await axios.put(`${API}/users/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Profile updated successfully!');
      if (onUpdate) {
        onUpdate(response.data);
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg">{success}</div>
          )}

          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-semibold mb-2">Profile Photo</label>
            <div className="flex items-center gap-4">
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
              
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                  id="edit-photo-upload"
                />
                <label
                  htmlFor="edit-photo-upload"
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
            >
              <option value="">Select Birth Year</option>
              {birthYearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
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
              rows={3}
              placeholder="Tell clients about yourself..."
              required
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
                placeholder="Add a hobby"
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
                  className="w-28 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                  placeholder="₹/hr"
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
              className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
            >
              + Add Another Service
            </button>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-semibold mb-2">Availability</label>
            <p className="text-xs text-gray-500 mb-3">Set your available days and times</p>
            <div className="space-y-2">
              {profile.availability.map((slot, idx) => (
                <div key={slot.day} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <label className="flex items-center gap-2 w-24">
                    <input
                      type="checkbox"
                      checked={slot.enabled}
                      onChange={(e) => updateAvailability(idx, 'enabled', e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-xs font-medium">{slot.day}</span>
                  </label>
                  {slot.enabled && (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateAvailability(idx, 'start', e.target.value)}
                        className="px-2 py-1 border rounded text-xs focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-gray-500 text-xs">to</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateAvailability(idx, 'end', e.target.value)}
                        className="px-2 py-1 border rounded text-xs focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* UPI ID */}
          <div>
            <label className="block text-sm font-semibold mb-2">UPI ID *</label>
            <input
              type="text"
              value={profile.upi_id}
              onChange={(e) => setProfile(prev => ({ ...prev, upi_id: e.target.value }))}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
              placeholder="yourname@upi"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || photoUploading}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;
