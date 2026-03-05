import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LogOut, Home, Activity, DollarSign } from 'lucide-react';
import ActivationPayment from '../components/ActivationPayment';
import TermsAcceptanceModal from '../components/TermsAcceptanceModal';
import Footer from '../components/Footer';

// Use relative URL for proxy
const API = "/api";

const Dashboard = () => {
  const { user, logout, loading, token } = useAuth();
  const navigate = useNavigate();
  const [showActivationPayment, setShowActivationPayment] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [dashboardView, setDashboardView] = useState('client'); // 'client' or 'kopartner'

  useEffect(() => {
    // Check if user needs to set password first
    if (user && !user.password_set) {
      navigate('/set-password');
      return;
    }
    
    if (user && !user.terms_accepted) {
      setShowTermsModal(true);
    }
  }, [user, navigate]);

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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
            data-testid="dashboard-logo-button"
          >
            <Home size={24} className="text-purple-600" />
            <span>Kopartner</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition"
            data-testid="logout-button"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8" data-testid="user-profile-card">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {user.name || 'User'}!
          </h1>
          <p className="text-gray-600 mb-4">Role: {user.role}</p>
          <p className="text-gray-600">Phone: +91 {user.phone}</p>
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
                📱 Client Dashboard
              </button>
              <button
                onClick={() => setDashboardView('kopartner')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition ${
                  dashboardView === 'kopartner'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid="switch-to-kopartner"
              >
                ⭐ KoPartner Dashboard
              </button>
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

        {(user.role === 'kopartner' || (user.role === 'both' && dashboardView === 'kopartner')) && !user.profile_activated && (
          <>
            {!user.bio || !user.city ? (
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
                <ActivationPayment onSuccess={() => {
                  setShowActivationPayment(false);
                  window.location.reload();
                }} />
              ) : (
                <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-8 mb-8" data-testid="activation-ready">
                  <h2 className="text-2xl font-bold mb-4 text-green-800">
                    Profile Ready! Pay Activation Fee
                  </h2>
                  <p className="text-green-700 mb-4">
                    Your profile is complete. Pay ₹1000/year membership fee to activate and start receiving bookings.
                  </p>
                  <button
                    onClick={() => setShowActivationPayment(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                    data-testid="pay-activation-fee-button"
                  >
                    Pay Activation Fee (₹1000)
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
          <div className="bg-white rounded-xl shadow p-6" data-testid="bookings-card">
            <div className="flex items-center space-x-2 mb-2">
              <Activity size={24} className="text-purple-600" />
              <h3 className="text-xl font-bold">My Activities</h3>
            </div>
            <p className="text-gray-600 mb-4">View your platform activities</p>
            <button className="text-purple-600 hover:underline font-medium">
              View All →
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
            <button className="text-purple-600 hover:underline font-medium">
              View Payments →
            </button>
          </div>

          {(user.role === 'kopartner' || user.role === 'both') && (
            <div className="bg-white rounded-xl shadow p-6" data-testid="earnings-card">
              <h3 className="text-xl font-bold mb-2">Earnings</h3>
              <p className="text-3xl font-bold text-purple-600">₹{user.earnings || 0}</p>
              <p className="text-sm text-gray-500 mt-2">Available for withdrawal</p>
            </div>
          )}
        </div>

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
      
      <Footer />
    </div>
  );
};

export default Dashboard;
