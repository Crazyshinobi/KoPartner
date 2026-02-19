import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserCircle, RefreshCw } from 'lucide-react';

const ProfileSwitcher = () => {
  const { user } = useAuth();
  const [activeProfile, setActiveProfile] = useState('client'); // client or cuddlist

  if (!user || user.role !== 'both') return null;

  const switchProfile = (profile) => {
    setActiveProfile(profile);
    // You can store this in localStorage or context for persistent switching
    localStorage.setItem('activeProfile', profile);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <RefreshCw size={24} className="text-purple-600" />
          <h3 className="text-xl font-bold text-purple-900">Switch Profile</h3>
        </div>
        <span className="text-sm text-purple-600 bg-purple-100 px-3 py-1 rounded-full font-semibold">
          Both Roles Active
        </span>
      </div>
      
      <p className="text-gray-600 mb-4 text-sm">
        You have access to both Client and KoPartner features. Switch between profiles to access different functionalities.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => switchProfile('client')}
          className={`p-4 rounded-xl border-2 transition transform hover:scale-105 ${
            activeProfile === 'client'
              ? 'border-pink-500 bg-pink-50 shadow-lg'
              : 'border-gray-200 bg-white hover:border-pink-300'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <UserCircle size={32} className={activeProfile === 'client' ? 'text-pink-600' : 'text-gray-400'} />
            <span className={`font-bold ${
              activeProfile === 'client' ? 'text-pink-700' : 'text-gray-600'
            }`}>
              Client Mode
            </span>
            <span className="text-xs text-gray-500">Find & Book Services</span>
            {activeProfile === 'client' && (
              <span className="text-xs bg-pink-500 text-white px-3 py-1 rounded-full font-semibold">
                Active
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => switchProfile('cuddlist')}
          className={`p-4 rounded-xl border-2 transition transform hover:scale-105 ${
            activeProfile === 'cuddlist'
              ? 'border-purple-500 bg-purple-50 shadow-lg'
              : 'border-gray-200 bg-white hover:border-purple-300'
          }`}
        >
          <div className="flex flex-col items-center space-y-2">
            <Users size={32} className={activeProfile === 'cuddlist' ? 'text-purple-600' : 'text-gray-400'} />
            <span className={`font-bold ${
              activeProfile === 'cuddlist' ? 'text-purple-700' : 'text-gray-600'
            }`}>
              KoPartner Mode
            </span>
            <span className="text-xs text-gray-500">Offer Services & Earn</span>
            {activeProfile === 'cuddlist' && (
              <span className="text-xs bg-purple-500 text-white px-3 py-1 rounded-full font-semibold">
                Active
              </span>
            )}
          </div>
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> {activeProfile === 'client' 
            ? 'In Client mode, you can search and book services from kopartners.'
            : 'In KoPartner mode, you can manage your profile, services, and earnings.'}
        </p>
      </div>
    </div>
  );
};

export default ProfileSwitcher;