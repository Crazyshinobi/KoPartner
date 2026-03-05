import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Clock, Crown, Infinity, CreditCard, RefreshCw, AlertTriangle, ExternalLink, Shield } from 'lucide-react';

const API = "/api";

const PlanIcons = {
  "6month": Clock,
  "1year": Crown,
  "lifetime": Infinity
};

const ActivationPayment = ({ onSuccess }) => {
  const { token, updateUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [membershipPlans, setMembershipPlans] = useState([
    { id: '6month', name: '6 Months', base_amount: 199, gst_amount: 36, total_amount: 235, duration_days: 182, is_popular: false, original_base: 500, original_total: 590 },
    { id: '1year', name: '1 Year', base_amount: 499, gst_amount: 90, total_amount: 589, duration_days: 365, is_popular: true, original_base: 1000, original_total: 1180 },
    { id: 'lifetime', name: 'Lifetime', base_amount: 999, gst_amount: 180, total_amount: 1179, duration_days: null, is_popular: false, original_base: 2000, original_total: 2360 }
  ]);
  const [selectedPlan, setSelectedPlan] = useState('1year');

  useEffect(() => {
    const fetchMembershipPlans = async () => {
      try {
        const response = await axios.get(`${API}/payment/membership-plans`);
        if (response.data.plans && response.data.plans.length > 0) {
          setMembershipPlans(response.data.plans);
        }
      } catch (err) {
        console.error('Failed to fetch membership plans:', err);
      }
    };
    fetchMembershipPlans();
    
    // Check if returning from payment
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    
    if (orderId && token) {
      verifyPayment(orderId);
    }
  }, [token]);

  const selectedPlanData = membershipPlans.find(p => p.id === selectedPlan) || membershipPlans[1];

  const verifyPayment = async (orderId) => {
    setVerifying(true);
    setError('');
    
    try {
      console.log(`[ACTIVATION] Verifying payment for order: ${orderId}`);
      
      const verifyResponse = await axios.post(
        `${API}/payment/verify-membership`,
        { order_id: orderId },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      console.log('[ACTIVATION] Verification response:', verifyResponse.data);

      if (verifyResponse.data.success) {
        // Update local user state immediately with ALL activation fields
        updateUser({
          membership_paid: true,
          profile_activated: true,
          membership_type: verifyResponse.data.membership_type,
          cuddlist_status: 'approved',
          membership_expiry: verifyResponse.data.user?.membership_expiry
        });
        
        // Refresh user data from server to ensure sync
        try {
          await refreshUser();
          console.log('[ACTIVATION] User data refreshed from server');
        } catch (refreshError) {
          console.warn('[ACTIVATION] Failed to refresh user, but local state updated:', refreshError);
        }
        
        // Clear URL params
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show success alert
        alert('🎉 Payment successful! Your profile is now activated. You can start completing your profile.');
        
        // Call success callback
        onSuccess && onSuccess(verifyResponse.data);
        
      } else {
        throw new Error('Payment verification returned unsuccessful');
      }
      
    } catch (err) {
      console.error('[ACTIVATION] Verification error:', err);
      setError(
        err.response?.data?.detail || 
        'Payment verification failed. If amount was deducted, please contact support.'
      );
    } finally {
      setVerifying(false);
    }
  };

  const handlePayment = async () => {
    setError('');
    setLoading(true);

    try {
      // Create order with Cashfree
      const orderResponse = await axios.post(
        `${API}/payment/create-membership-order`,
        { plan: selectedPlan },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const orderData = orderResponse.data;
      
      if (!orderData.order_id) {
        throw new Error('Failed to create payment order');
      }

      console.log('[ACTIVATION] Order created:', orderData.order_id);

      // Redirect to Cashfree hosted checkout
      if (orderData.checkout_url) {
        window.location.href = orderData.checkout_url;
      } else {
        throw new Error('Checkout URL not received');
      }

    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8" data-testid="activation-payment">
      <div className="flex items-center gap-3 mb-4">
        <CreditCard className="w-8 h-8 text-purple-600" />
        <h2 className="text-2xl font-bold">Activate Your KoPartner Profile</h2>
      </div>
      
      <p className="text-gray-600 mb-2">
        Choose your membership plan to activate your profile and start offering services.
      </p>
      <p className="text-sm text-purple-600 font-semibold mb-6">
        🎉 10 Lac+ Family Celebration - Up to 60% OFF!
      </p>

      {/* Membership Plan Selection */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {membershipPlans.map((plan) => {
          const IconComponent = PlanIcons[plan.id] || Crown;
          const isSelected = selectedPlan === plan.id;
          const discount = plan.original_base ? Math.round((1 - plan.base_amount / plan.original_base) * 100) : 0;
          
          return (
            <div 
              key={plan.id}
              onClick={() => !loading && !verifying && setSelectedPlan(plan.id)}
              className={`relative cursor-pointer rounded-2xl p-4 border-2 transition-all transform hover:scale-[1.02] ${
                isSelected 
                  ? 'border-purple-600 bg-purple-50 shadow-lg' 
                  : 'border-gray-200 bg-white hover:border-purple-300'
              } ${loading || verifying ? 'opacity-50 cursor-not-allowed' : ''}`}
              data-testid={`activation-plan-${plan.id}`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </span>
                </div>
              )}
              
              {discount > 0 && (
                <div className="absolute -top-2 -right-2">
                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {discount}% OFF
                  </span>
                </div>
              )}
              
              <div className="text-center pt-2">
                <IconComponent className={`w-10 h-10 mx-auto mb-2 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                <h3 className="font-bold text-lg">{plan.name}</h3>
                
                {plan.original_base && (
                  <p className="text-sm text-gray-400 line-through">₹{plan.original_base}</p>
                )}
                
                <p className="text-3xl font-bold text-gray-900 my-1">
                  ₹{plan.base_amount}
                </p>
                <p className="text-xs text-gray-500">+ ₹{plan.gst_amount} GST</p>
                <p className="text-sm font-semibold text-purple-600 mt-1">
                  Total: ₹{plan.total_amount}
                </p>
                
                {isSelected && (
                  <div className="mt-2">
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">Payment Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Verifying Indicator */}
      {verifying && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />
          <p className="text-yellow-700">Verifying payment... Please wait.</p>
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={loading || verifying}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
          loading || verifying
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
        }`}
        data-testid="pay-now-btn"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Redirecting to Payment...
          </span>
        ) : verifying ? (
          <span className="flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Verifying...
          </span>
        ) : (
          <>
            <span>Pay ₹{selectedPlanData.total_amount} - Activate Now</span>
            <ExternalLink className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <Shield className="w-4 h-4 text-gray-400" />
        <p className="text-xs text-gray-500">
          Secured by Cashfree | Your payment is 100% safe
        </p>
      </div>
      
      {/* Info about redirect */}
      <p className="text-center text-gray-400 text-[10px] mt-2">
        You will be redirected to Cashfree's secure payment page
      </p>
    </div>
  );
};

export default ActivationPayment;
