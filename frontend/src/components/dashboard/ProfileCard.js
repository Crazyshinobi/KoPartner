import React from 'react';
import { User, MapPin, Star, Clock, CheckCircle } from 'lucide-react';

const ProfileCard = ({ user, showPaymentStatus = true }) => {
  const getRoleBadge = () => {
    if (user.role === 'both') {
      return (
        <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full">
          KoPartner + Client
        </span>
      );
    } else if (user.role === 'cuddlist') {
      return (
        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
          KoPartner
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
          Client
        </span>
      );
    }
  };

  const isKoPartner = user.role === 'cuddlist' || user.role === 'both';

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header with gradient */}
      <div className="h-24 bg-gradient-to-r from-purple-600 to-pink-500 relative">
        {/* Online indicator */}
        {user.is_online && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-white text-xs">Online</span>
          </div>
        )}
      </div>

      {/* Profile content */}
      <div className="px-6 pb-6 -mt-12 relative">
        {/* Avatar */}
        <div className="flex justify-center">
          {user.profile_photo ? (
            <img
              src={user.profile_photo}
              alt={user.name}
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <User size={40} className="text-white" />
            </div>
          )}
        </div>

        {/* Name and role */}
        <div className="text-center mt-4">
          <h2 className="text-xl font-bold text-gray-900">{user.name || 'User'}</h2>
          <div className="mt-2">{getRoleBadge()}</div>
        </div>

        {/* Location */}
        {user.city && (
          <div className="flex items-center justify-center gap-1 mt-3 text-gray-500">
            <MapPin size={16} />
            <span>{user.city}{user.pincode ? `, ${user.pincode}` : ''}</span>
          </div>
        )}

        {/* Stats for KoPartner */}
        {isKoPartner && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-yellow-500">
                <Star size={16} fill="currentColor" />
                <span className="font-bold">{user.rating?.toFixed(1) || '0.0'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Rating</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900">{user.total_reviews || 0}</p>
              <p className="text-xs text-gray-500">Reviews</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-green-600">₹{(user.earnings || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Earnings</p>
            </div>
          </div>
        )}

        {/* Payment Status */}
        {showPaymentStatus && isKoPartner && (
          <div className="mt-6 p-4 rounded-xl bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Membership Status</span>
              {user.membership_paid ? (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <CheckCircle size={16} />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600 font-medium">
                  <Clock size={16} />
                  Pending Payment
                </span>
              )}
            </div>
            {user.membership_type && user.membership_paid && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600">Plan</span>
                <span className="text-sm font-medium capitalize">{user.membership_type}</span>
              </div>
            )}
          </div>
        )}

        {/* Bio */}
        {user.bio && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 line-clamp-3">{user.bio}</p>
          </div>
        )}

        {/* Services */}
        {user.services && user.services.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Services</p>
            <div className="flex flex-wrap gap-1">
              {user.services.slice(0, 4).map((service, idx) => (
                <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
                  {service.name || service.service}
                </span>
              ))}
              {user.services.length > 4 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                  +{user.services.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
