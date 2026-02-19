import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LogOut, Home, Activity, DollarSign, RefreshCw, Star, ArrowRight, Search, X, CheckCircle, Gift, Edit, Calendar, Users, Phone, Mail } from 'lucide-react';
import ActivationPayment from '../components/ActivationPayment';
import TermsAcceptanceModal from '../components/TermsAcceptanceModal';
import ProfileEditModal from '../components/ProfileEditModal';
import RazorpayPayment from '../components/RazorpayPayment';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Use relative URL for proxy
const API = "/api";

const Dashboard = () => {
  const { user, logout, loading, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showActivationPayment, setShowActivationPayment] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [dashboardView, setDashboardView] = useState('client'); // 'client' or 'kopartner'
  const [switchingMode, setSwitchingMode] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeType, setUpgradeType] = useState('client'); // 'client' (to become kopartner) or 'kopartner' (to find kopartner)
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [kopartnerBookings, setKopartnerBookings] = useState([]);
  const [clientBookings, setClientBookings] = useState([]);
  const [showBookings, setShowBookings] = useState(false);
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('1year');

  useEffect(() => {
    // Check if user needs to set password first
    if (user && !user.password_set) {
      navigate('/set-password');
      return;
    }
    
    if (user && !user.terms_accepted) {
      setShowTermsModal(true);
    }
    
    // Set initial dashboard view based on active_mode or role
    if (user) {
      if (user.role === 'both' && user.active_mode) {
        setDashboardView(user.active_mode === 'offer' ? 'kopartner' : 'client');
      } else if (user.role === 'cuddlist') {
        setDashboardView('kopartner');
      } else {
        setDashboardView('client');
      }
      
      // Show payment popup for KoPartners who haven't paid
      if ((user.role === 'cuddlist' || user.role === 'both') && !user.membership_paid) {
        // Fetch membership plans
        fetchMembershipPlans();
        // Small delay to let page load first
        setTimeout(() => {
          setShowPaymentPopup(true);
        }, 500);
      }
    }
  }, [user, navigate]);

  const fetchMembershipPlans = async () => {
    try {
      const response = await axios.get(`${API}/payment/membership-plans`);
      setMembershipPlans(response.data.plans || []);
    } catch (error) {
      console.error('Failed to fetch membership plans:', error);
      // Set default plans if API fails - DISCOUNTED PRICES (10 Lac+ Family Celebration!)
      setMembershipPlans([
        { id: '6month', name: '6 Months', base_amount: 199, gst_amount: 36, total_amount: 235, duration_days: 182, is_popular: false, original_base: 500, original_total: 590 },
        { id: '1year', name: '1 Year', base_amount: 499, gst_amount: 90, total_amount: 589, duration_days: 365, is_popular: true, original_base: 1000, original_total: 1180 },
        { id: 'lifetime', name: 'Lifetime', base_amount: 999, gst_amount: 180, total_amount: 1179, duration_days: null, is_popular: false, original_base: 2000, original_total: 2360 }
      ]);
    }
  };

  const handleSwitchMode = async (mode) => {
    if (user.role !== 'both') return;
    
    setSwitchingMode(true);
    try {
      await axios.post(`${API}/auth/switch-mode`, 
        { mode: mode === 'kopartner' ? 'offer' : 'find' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDashboardView(mode);
      await refreshUser();
    } catch (error) {
      console.error('Failed to switch mode:', error);
    } finally {
      setSwitchingMode(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API}/transactions/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data.transactions);
      setShowTransactions(true);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const fetchKoPartnerBookings = async () => {
    try {
      const response = await axios.get(`${API}/kopartner/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKopartnerBookings(response.data.bookings || []);
      setShowBookings(true);
    } catch (error) {
      console.error('Failed to fetch KoPartner bookings:', error);
    }
  };

  const fetchClientBookings = async () => {
    try {
      const response = await axios.get(`${API}/client/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientBookings(response.data.bookings || []);
      setShowBookings(true);
    } catch (error) {
      console.error('Failed to fetch client bookings:', error);
    }
  };

  const handleUpgradeToBoth = async () => {
    setUpgrading(true);
    try {
      const response = await axios.post(`${API}/auth/upgrade-to-both`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        await refreshUser();
        setShowUpgradeModal(false);
        // Show payment popup instead of navigating away
        setShowPaymentPopup(true);
      }
    } catch (error) {
      console.error('Failed to upgrade:', error);
      alert(error.response?.data?.detail || 'Failed to upgrade. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleKoPartnerUpgradeToBoth = async () => {
    setUpgrading(true);
    try {
      const response = await axios.post(`${API}/auth/kopartner-upgrade-to-both`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        await refreshUser();
        setShowUpgradeModal(false);
        alert('🎉 Congratulations! You can now find KoPartners too. Book services to start searching.');
        // Navigate to book services
        navigate('/book-services');
      }
    } catch (error) {
      console.error('Failed to upgrade:', error);
      alert(error.response?.data?.detail || 'Failed to upgrade. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 pt-28">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8" data-testid="user-profile-card">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Profile Photo */}
              {user.profile_photo ? (
                <img 
                  src={user.profile_photo} 
                  alt={user.name} 
                  className="w-20 h-20 rounded-full object-cover border-4 border-purple-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                  {(user.name || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  Welcome, {user.name || 'User'}!
                </h1>
                <p className="text-gray-600 mb-1">Role: {user.role}</p>
                <p className="text-gray-600">Phone: +91 {user.phone}</p>
                {/* Show membership info for KoPartners */}
                {(user.role === 'cuddlist' || user.role === 'both') && user.membership_paid && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <CheckCircle size={14} />
                    Membership: {user.membership_type === 'lifetime' ? 'Lifetime' : 
                      user.membership_type === '6month' ? '6 Months' : 
                      user.membership_type === '1year' ? '1 Year' : '1 Year'}
                    {user.membership_expiry && user.membership_type !== 'lifetime' && (
                      <span className="text-green-600 text-xs ml-1">
                        (Expires: {new Date(user.membership_expiry).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Edit Profile Button - Show for KoPartners who have paid membership */}
            {(user.role === 'cuddlist' || user.role === 'both') && user.membership_paid && (
              <button
                onClick={() => setShowProfileEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition font-semibold"
                data-testid="edit-profile-btn"
              >
                <Edit size={18} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Role Switcher for "both" role users */}
        {user.role === 'both' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8" data-testid="role-switcher">
            <h3 className="text-lg font-semibold mb-4">Switch Dashboard View</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setDashboardView('client')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition ${
                  dashboardView === 'client'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid="switch-to-client"
              >
                🔍 Find a KoPartner
              </button>
              <button
                onClick={() => {
                  // If membership not paid, show payment popup instead of switching view
                  if (!user.membership_paid) {
                    setShowPaymentPopup(true);
                  } else {
                    setDashboardView('kopartner');
                  }
                }}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition ${
                  dashboardView === 'kopartner'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid="switch-to-kopartner"
              >
                ⭐ Become a KoPartner
              </button>
            </div>
          </div>
        )}

        {/* Become a KoPartner Card for Client-only users */}
        {user.role === 'client' && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg p-8 mb-8 text-white" data-testid="become-kopartner-card">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-4 rounded-xl">
                <Star size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Want to Earn as a KoPartner?</h3>
                <p className="mb-4 opacity-90">
                  You can also become a KoPartner and start earning by offering your services. 
                  Your current profile will work for both - finding partners and offering services!
                </p>
                <ul className="mb-6 space-y-2 text-sm opacity-90">
                  <li>✅ Keep your client access</li>
                  <li>✅ Earn money by helping others</li>
                  <li>✅ Set your own rates and availability</li>
                  <li>✅ Flexible working hours</li>
                </ul>
                <button
                  onClick={() => {
                    setUpgradeType('client');
                    setShowUpgradeModal(true);
                  }}
                  className="bg-white text-orange-600 px-8 py-4 rounded-xl font-bold hover:shadow-xl transform hover:scale-105 transition flex items-center gap-2"
                  data-testid="become-kopartner-button"
                >
                  <Star size={20} />
                  Become a KoPartner
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Book More Services Button for Clients */}
        {((user.role === 'client') || (user.role === 'both' && dashboardView === 'client')) && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-8 mb-8 text-white" data-testid="book-more-services">
            <h3 className="text-2xl font-bold mb-4">Need More Services?</h3>
            <p className="mb-6">Book additional services and make payments anytime</p>
            <button
              onClick={() => navigate('/book-services')}
              className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:shadow-xl transform hover:scale-105 transition"
              data-testid="book-more-button"
            >
              📋 Book More Services
            </button>
          </div>
        )}

        {/* Find a KoPartner Card for KoPartner-only users */}
        {user.role === 'cuddlist' && (
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg p-8 mb-8 text-white" data-testid="find-kopartner-card">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-4 rounded-xl">
                <Search size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Need a KoPartner for Yourself?</h3>
                <p className="mb-4 opacity-90">
                  You can also find and book KoPartners for your own needs. 
                  Your current KoPartner profile will remain active - you'll have access to both!
                </p>
                <ul className="mb-6 space-y-2 text-sm opacity-90">
                  <li>✅ Keep your KoPartner profile active</li>
                  <li>✅ Find companions for your needs</li>
                  <li>✅ Book services from other KoPartners</li>
                  <li>✅ Access both dashboards anytime</li>
                </ul>
                <button
                  onClick={() => {
                    setUpgradeType('kopartner');
                    setShowUpgradeModal(true);
                  }}
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:shadow-xl transform hover:scale-105 transition flex items-center gap-2"
                  data-testid="find-kopartner-upgrade-button"
                >
                  <Search size={20} />
                  Find a KoPartner
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {(user.role === 'cuddlist' || (user.role === 'both' && dashboardView === 'kopartner')) && !user.profile_activated && (
          <>
            {/* Show Complete Profile prompt for users who have paid but not completed profile */}
            {user.membership_paid && !user.profile_completed ? (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 mb-8 text-white" data-testid="complete-profile-prompt">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-4 rounded-xl">
                    <CheckCircle size={32} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">
                      🎉 Payment Successful! Complete Your Profile
                    </h2>
                    <p className="text-green-100 mb-4">
                      Your membership is now active! Complete your profile to start receiving bookings from clients.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => navigate('/kopartner-setup')}
                        className="bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition"
                        data-testid="complete-profile-button"
                      >
                        Complete Profile Now →
                      </button>
                      <button
                        onClick={() => setShowProfileEditModal(true)}
                        className="bg-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition"
                      >
                        Edit Basic Info
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : !user.bio || !user.city ? (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-8 mb-8" data-testid="setup-profile-warning">
                <h2 className="text-2xl font-bold mb-4 text-yellow-800">
                  Complete Your KoPartner Profile
                </h2>
                <p className="text-yellow-700 mb-4">
                  Before activating, please complete your profile with services, rates, and other details.
                </p>
                <button
                  onClick={() => navigate('/kopartner-setup')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                  data-testid="setup-profile-button"
                >
                  Setup Profile
                </button>
              </div>
            ) : !user.membership_paid ? (
              showActivationPayment ? (
                <ActivationPayment onSuccess={async () => {
                  setShowActivationPayment(false);
                  // Refresh user data to reflect payment status
                  await refreshUser();
                  // Force page reload to ensure all states are updated
                  window.location.reload();
                }} />
              ) : (
                <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-8 mb-8" data-testid="activation-ready">
                  <h2 className="text-2xl font-bold mb-4 text-green-800">
                    Profile Ready! Pay Activation Fee
                  </h2>
                  <p className="text-green-700 mb-4">
                    Your profile is complete. Pay membership fee starting ₹199 to activate and start receiving bookings.
                    <span className="block text-sm mt-1 text-amber-700 font-semibold">🎉 10 Lac+ Family Celebration - Up to 60% OFF!</span>
                  </p>
                  <button
                    onClick={() => setShowActivationPayment(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                    data-testid="pay-activation-fee-button"
                  >
                    Pay Activation Fee (from ₹199)
                  </button>
                </div>
              )
            ) : null}
          </>
        )}

        {((user.role === 'client') || (user.role === 'both' && dashboardView === 'client')) && !user.can_search && (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-2xl p-8 mb-8" data-testid="client-info">
            <h2 className="text-2xl font-bold mb-4 text-blue-800">
              Ready to Book Services?
            </h2>
            <p className="text-blue-700 mb-4">
              Select services and hours, then make a payment to start searching for kopartners.
            </p>
            <button
              onClick={() => navigate('/book-services')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
              data-testid="select-services-button"
            >
              Select Services & Book
            </button>
          </div>
        )}

        {((user.role === 'client') || (user.role === 'both' && dashboardView === 'client')) && user.can_search && (
          <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-8 mb-8" data-testid="search-enabled">
            <h2 className="text-2xl font-bold mb-4 text-green-800">
              Payment Complete! Find KoPartners
            </h2>
            <p className="text-green-700 mb-4">
              You can now search for kopartners and book your services.
            </p>
            <button
              onClick={() => navigate('/find-kopartner')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
              data-testid="find-kopartner-button"
            >
              Find KoPartner
            </button>
          </div>
        )}

        {/* KoPartner Earning Potential Banner */}
        {((user.role === 'kopartner') || (user.role === 'both' && dashboardView === 'kopartner')) && user.profile_activated && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 mb-8 text-white">
            <h2 className="text-3xl font-bold mb-4">💰 Start Earning Today!</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-4">
              <div>
                <p className="text-4xl font-bold">₹1L+</p>
                <p className="text-green-100">Potential Monthly Earnings</p>
              </div>
              <div>
                <p className="text-4xl font-bold">80%</p>
                <p className="text-green-100">You Keep (20% Platform Fee)</p>
              </div>
              <div>
                <p className="text-4xl font-bold">24/7</p>
                <p className="text-green-100">Flexible Working Hours</p>
              </div>
            </div>
            <p className="text-green-100 mb-4">
              Set your own rates, choose your services, and earn by providing emotional wellness and companionship. 
              Many kopartners earn ₹50,000 - ₹1,50,000 per month!
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Activities Card - Clickable with bookings */}
          <div 
            className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-lg transition" 
            onClick={() => {
              if (user.role === 'cuddlist' || (user.role === 'both' && dashboardView === 'kopartner')) {
                fetchKoPartnerBookings();
              } else {
                fetchClientBookings();
              }
            }}
            data-testid="bookings-card"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Activity size={24} className="text-purple-600" />
              <h3 className="text-xl font-bold">My Activities</h3>
            </div>
            <p className="text-gray-600 mb-4">
              {dashboardView === 'kopartner' 
                ? 'View booking requests & client interactions' 
                : 'View your hired KoPartners & bookings'}
            </p>
            <button className="text-purple-600 hover:underline font-medium flex items-center gap-1">
              View Bookings <ArrowRight size={16} />
            </button>
          </div>

          <div 
            className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-lg transition" 
            onClick={fetchTransactions}
            data-testid="payments-card"
          >
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign size={24} className="text-green-600" />
              <h3 className="text-xl font-bold">Payment History</h3>
            </div>
            <p className="text-gray-600 mb-4">{transactions.length > 0 ? `${transactions.length} transactions` : 'View your payment details'}</p>
            <button className="text-purple-600 hover:underline font-medium flex items-center gap-1">
              View Payments <ArrowRight size={16} />
            </button>
          </div>

          {(user.role === 'cuddlist' || user.role === 'both') && (
            <div className="bg-white rounded-xl shadow p-6" data-testid="earnings-card">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign size={24} className="text-green-600" />
                <h3 className="text-xl font-bold">Earnings</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">₹{(user.earnings || 0).toFixed(0)}</p>
              <p className="text-sm text-gray-500 mt-2">80% of bookings (Available for withdrawal)</p>
            </div>
          )}
        </div>

        {/* Bookings Modal */}
        {showBookings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">
                    {dashboardView === 'kopartner' ? '📋 My Booking Requests' : '🤝 My Hired KoPartners'}
                  </h2>
                  <button onClick={() => setShowBookings(false)} className="text-white/80 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {dashboardView === 'kopartner' ? (
                  // KoPartner view - show booking requests from clients
                  kopartnerBookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No booking requests yet</p>
                      <p className="text-sm mt-2">Complete your profile to start receiving bookings</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {kopartnerBookings.map((booking) => (
                        <div key={booking.id} className="border rounded-xl p-4 hover:shadow-md transition">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">{booking.client_name || 'Client'}</p>
                              <p className="text-sm text-gray-600">{booking.service_name || 'Service'}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              booking.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  // Client view - show hired KoPartners
                  clientBookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No bookings yet</p>
                      <p className="text-sm mt-2">Search and book a KoPartner to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {clientBookings.map((booking) => (
                        <div key={booking.id} className="border rounded-xl p-4 hover:shadow-md transition">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">{booking.kopartner_name || 'KoPartner'}</p>
                              <p className="text-sm text-gray-600">{booking.service_name || 'Service'}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              booking.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          {booking.status === 'accepted' && (
                            <div className="mt-3 p-3 bg-green-50 rounded-lg">
                              <p className="text-sm font-semibold text-green-800 mb-2">Contact Details:</p>
                              <div className="flex gap-4 text-sm">
                                {booking.kopartner_phone && (
                                  <span className="flex items-center gap-1 text-green-700">
                                    <Phone size={14} /> {booking.kopartner_phone}
                                  </span>
                                )}
                                {booking.kopartner_email && (
                                  <span className="flex items-center gap-1 text-green-700">
                                    <Mail size={14} /> {booking.kopartner_email}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bookings Section for KoPartners */}
        {(user.role === 'cuddlist' || (user.role === 'both' && dashboardView === 'kopartner')) && user.profile_activated && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Bookings (as KoPartner)</h2>
              <button
                onClick={fetchKoPartnerBookings}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition font-semibold flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh Bookings
              </button>
            </div>
            
            {kopartnerBookings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">No Bookings Yet</h3>
                <p className="text-gray-500">When clients book your services, they will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {kopartnerBookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            {booking.status}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Booking from {booking.client_name || 'Client'}
                        </h3>
                        <div className="space-y-1 text-gray-600">
                          <p className="flex items-center gap-2">
                            <Phone size={16} />
                            {booking.client_phone}
                          </p>
                          {booking.client_email && (
                            <p className="flex items-center gap-2">
                              <Mail size={16} />
                              {booking.client_email}
                            </p>
                          )}
                          {booking.selected_services && (
                            <p className="flex items-center gap-2">
                              <Calendar size={16} />
                              Services: {booking.selected_services.map(s => s.name || s.service).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {booking.kopartner_earning && (
                          <div>
                            <p className="text-2xl font-bold text-green-600">₹{booking.kopartner_earning.toFixed(0)}</p>
                            <p className="text-xs text-gray-500">Your Earning (80%)</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">ID: {booking.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings Section for Clients */}
        {(user.role === 'client' || (user.role === 'both' && dashboardView === 'client')) && user.can_search && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Bookings (as Client)</h2>
              <button
                onClick={fetchClientBookings}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition font-semibold flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh Bookings
              </button>
            </div>
            
            {clientBookings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">No Bookings Yet</h3>
                <p className="text-gray-500">When you book KoPartners, they will appear here</p>
                <button
                  onClick={() => navigate('/find-kopartner')}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                >
                  Find KoPartners
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {clientBookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            {booking.status}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Booked: {booking.kopartner_name || 'KoPartner'}
                        </h3>
                        <div className="space-y-1 text-gray-600">
                          <p className="flex items-center gap-2">
                            <Phone size={16} />
                            {booking.kopartner_phone}
                          </p>
                          {booking.kopartner_email && (
                            <p className="flex items-center gap-2">
                              <Mail size={16} />
                              {booking.kopartner_email}
                            </p>
                          )}
                          {booking.selected_services && (
                            <p className="flex items-center gap-2">
                              <Calendar size={16} />
                              Services: {booking.selected_services.map(s => s.name || s.service).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Booking ID: {booking.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transaction History Modal */}
        {showTransactions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-8 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Payment History</h2>
                <button
                  onClick={() => setShowTransactions(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              {transactions.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{txn.type.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-sm text-gray-600">{new Date(txn.created_at).toLocaleString()}</p>
                          {txn.subtotal && (
                            <div className="text-sm text-gray-600 mt-2">
                              <p>Subtotal: ₹{txn.subtotal?.toFixed(2)}</p>
                              <p>GST (18%): ₹{txn.gst_amount?.toFixed(2)}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">₹{txn.amount?.toFixed(2)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            txn.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {txn.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Terms Acceptance Modal */}
      {showTermsModal && user && !user.terms_accepted && (
        <TermsAcceptanceModal 
          user={user} 
          onAccept={() => setShowTermsModal(false)} 
        />
      )}

      {/* Upgrade to Both Role Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            {upgradeType === 'client' ? (
              // Client upgrading to become KoPartner
              <>
                <div className="text-center mb-6">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star size={40} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Become a KoPartner?</h2>
                  <p className="text-gray-600">
                    You're about to unlock KoPartner access along with your existing client profile.
                  </p>
                </div>

                <div className="bg-amber-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-amber-800 mb-2">What you'll get:</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>✅ Access to both - Find & Become a KoPartner</li>
                    <li>✅ Your existing profile details will be retained</li>
                    <li>✅ Start earning by offering your services</li>
                    <li>✅ Set your own rates and schedule</li>
                  </ul>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-purple-800 mb-2">Next Steps:</h4>
                  <p className="text-sm text-purple-700">
                    After upgrade, you'll need to pay the membership fee (₹199/6mo, ₹499/yr, or ₹999/lifetime) to start earning.
                    <span className="block text-amber-700 font-semibold mt-1">🎉 10 Lac+ Family Celebration - Save up to 60%!</span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                    disabled={upgrading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpgradeToBoth}
                    disabled={upgrading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                    data-testid="confirm-upgrade-button"
                  >
                    {upgrading ? 'Upgrading...' : 'Yes, Upgrade Now'}
                  </button>
                </div>
              </>
            ) : (
              // KoPartner upgrading to find KoPartners
              <>
                <div className="text-center mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={40} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Find a KoPartner?</h2>
                  <p className="text-gray-600">
                    You're about to unlock client access along with your existing KoPartner profile.
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-blue-800 mb-2">What you'll get:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✅ Access to both - Find & Become a KoPartner</li>
                    <li>✅ Your KoPartner profile remains active</li>
                    <li>✅ Find and book other KoPartners</li>
                    <li>✅ Switch between dashboards anytime</li>
                  </ul>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-purple-800 mb-2">Next Steps:</h4>
                  <p className="text-sm text-purple-700">
                    After upgrade, you can book services and search for KoPartners. Your earning profile stays intact!
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition"
                    disabled={upgrading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleKoPartnerUpgradeToBoth}
                    disabled={upgrading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                    data-testid="confirm-kopartner-upgrade-button"
                  >
                    {upgrading ? 'Upgrading...' : 'Yes, Upgrade Now'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* KoPartner Payment Popup with 3 Membership Options */}
      {showPaymentPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto" data-testid="payment-popup">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-4 max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white relative flex-shrink-0">
              <button 
                onClick={() => setShowPaymentPopup(false)}
                className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 rounded-full p-2 transition"
                title="Close"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 mb-1">
                <Gift size={28} />
                <h2 className="text-xl font-bold">Become a KoPartner!</h2>
              </div>
              <p className="text-white/90 text-sm">Choose your membership plan and start earning today</p>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 overflow-y-auto flex-1">
              <RazorpayPayment
                type="membership"
                membershipPlan={selectedPlan}
                token={token}
                onSuccess={async (data) => {
                  console.log('[DASHBOARD] Payment success:', data);
                  setShowPaymentPopup(false);
                  
                  // Immediately refresh user data from server
                  try {
                    await refreshUser();
                  } catch (e) {
                    console.error('[DASHBOARD] Failed to refresh user:', e);
                  }
                  
                  // Show success message
                  alert('🎉 Payment successful! Your KoPartner profile is now activated. Please complete your profile to start receiving bookings.');
                  
                  // Reload to ensure all states are updated
                  window.location.reload();
                }}
                onError={(error) => {
                  console.error('[DASHBOARD] Payment error:', error);
                }}
              />

              {/* Benefits - Compact */}
              <div className="bg-gray-50 rounded-xl p-3 mt-3">
                <h3 className="font-semibold text-gray-800 mb-2 text-sm">All plans include:</h3>
                <div className="grid grid-cols-2 gap-1">
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    <span className="text-xs text-gray-600">Earn <strong>₹1L+</strong>/month</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    <span className="text-xs text-gray-600">Keep <strong>80%</strong> earnings</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    <span className="text-xs text-gray-600">Set own <strong>rates</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    <span className="text-xs text-gray-600"><strong>Verified</strong> badge</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Back Button - Always visible */}
            <div className="p-4 border-t bg-gray-50 flex-shrink-0">
              {user?.role === 'both' && (
                <button
                  onClick={() => {
                    setShowPaymentPopup(false);
                    setDashboardView('client');
                  }}
                  className="w-full mb-2 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                >
                  <Search size={18} />
                  Find a KoPartner Instead
                </button>
              )}
              <button
                onClick={() => setShowPaymentPopup(false)}
                className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm transition"
              >
                I'll pay later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileEditModal}
        onClose={() => setShowProfileEditModal(false)}
        user={user}
        token={token}
        onUpdate={(updatedUser) => {
          refreshUser();
        }}
      />
      
      <Footer />
    </div>
  );
};

export default Dashboard;
