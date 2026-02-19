import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Square } from 'lucide-react';

// Use relative URL for proxy
const API = "/api";

const TermsAcceptanceModal = ({ user, onAccept }) => {
  const navigate = useNavigate();
  const { token, updateUser } = useAuth();
  const [accepted, setAccepted] = useState({
    terms: false,
    privacy: false,
    codeOfConduct: false
  });
  const [loading, setLoading] = useState(false);

  const allAccepted = accepted.terms && accepted.privacy && accepted.codeOfConduct;

  const handleAccept = async () => {
    if (!allAccepted) return;
    
    setLoading(true);
    try {
      await axios.put(
        `${API}/users/profile`,
        { terms_accepted: true, terms_accepted_at: new Date().toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser({ terms_accepted: true });
      onAccept();
    } catch (error) {
      console.error('Failed to accept terms:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold mb-4">Welcome to Kopartner!</h2>
        <p className="text-gray-600 mb-6">Before you continue, please review and accept our policies.</p>

        <div className="space-y-4 mb-6">
          <div 
            className="border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-purple-500 transition"
            onClick={() => setAccepted({ ...accepted, terms: !accepted.terms })}
          >
            <div className="flex items-start space-x-3">
              {accepted.terms ? (
                <CheckSquare size={24} className="text-purple-600 flex-shrink-0 mt-1" />
              ) : (
                <Square size={24} className="text-gray-400 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h3 className="font-bold mb-1">Terms of Use</h3>
                <p className="text-sm text-gray-600 mb-2">
                  I have read and agree to the Terms of Use including service guidelines, user responsibilities, and platform rules.
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/terms');
                  }}
                  className="text-purple-600 hover:underline text-sm font-medium"
                >
                  Read Terms of Use →
                </button>
              </div>
            </div>
          </div>

          <div 
            className="border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-purple-500 transition"
            onClick={() => setAccepted({ ...accepted, privacy: !accepted.privacy })}
          >
            <div className="flex items-start space-x-3">
              {accepted.privacy ? (
                <CheckSquare size={24} className="text-purple-600 flex-shrink-0 mt-1" />
              ) : (
                <Square size={24} className="text-gray-400 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h3 className="font-bold mb-1">Privacy Policy</h3>
                <p className="text-sm text-gray-600 mb-2">
                  I understand how my personal data will be collected, used, and protected as described in the Privacy Policy.
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/privacy');
                  }}
                  className="text-purple-600 hover:underline text-sm font-medium"
                >
                  Read Privacy Policy →
                </button>
              </div>
            </div>
          </div>

          <div 
            className="border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-purple-500 transition"
            onClick={() => setAccepted({ ...accepted, codeOfConduct: !accepted.codeOfConduct })}
          >
            <div className="flex items-start space-x-3">
              {accepted.codeOfConduct ? (
                <CheckSquare size={24} className="text-purple-600 flex-shrink-0 mt-1" />
              ) : (
                <Square size={24} className="text-gray-400 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h3 className="font-bold mb-1">Code of Conduct</h3>
                <p className="text-sm text-gray-600 mb-2">
                  I agree to follow the Code of Conduct including safety guidelines, respectful behavior, and consent-first interactions.
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/code-of-conduct');
                  }}
                  className="text-purple-600 hover:underline text-sm font-medium"
                >
                  Read Code of Conduct →
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleAccept}
          disabled={!allAccepted || loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Processing...' : 'Accept & Continue'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          You must accept all policies to use Kopartner services
        </p>
      </div>
    </div>
  );
};

export default TermsAcceptanceModal;
