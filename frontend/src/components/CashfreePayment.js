import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, CheckCircle, AlertCircle, Shield, Clock, Crown, Infinity, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';

const API = '/api';

// Membership plan configuration - DISCOUNTED PRICES (10 Lac+ Family Celebration!)
const MEMBERSHIP_PLANS = {
  "6month": { name: "6 Months", base: 199, gst: 36, total: 235, duration: "6 months", originalBase: 500, originalTotal: 590 },
  "1year": { name: "1 Year", base: 499, gst: 90, total: 589, duration: "1 year", originalBase: 1000, originalTotal: 1180 },
  "lifetime": { name: "Lifetime", base: 999, gst: 180, total: 1179, duration: "Lifetime", originalBase: 2000, originalTotal: 2360 }
};

// Plan icons mapping
const PlanIcons = {
  "6month": Clock,
  "1year": Crown,
  "lifetime": Infinity
};

const CashfreePayment = ({ 
  type, // 'membership' or 'service'
  membershipPlan: initialPlan = '1year', // '6month', '1year', or 'lifetime'
  services = [], // For service payment
  token,
  onSuccess,
  onError,
  onBack // Optional: callback when user wants to go back/change plan
}) => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [showPlanSelector, setShowPlanSelector] = useState(type === 'membership');

  // Verify payment status when returning from Cashfree checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    const paymentType = urlParams.get('type');
    
    if (orderId && token) {
      // User has returned from Cashfree checkout, verify payment
      verifyPayment(orderId, paymentType || type);
    }
  }, [token]);

  const verifyPayment = async (orderId, paymentType = 'membership') => {
    setVerifying(true);
    setError('');
    
    try {
      console.log(`[CASHFREE] Verifying payment for order: ${orderId}`);
      
      const verifyEndpoint = paymentType === 'membership' 
        ? `${API}/payment/verify-membership`
        : `${API}/payment/verify-service`;
      
      const response = await axios.post(verifyEndpoint, 
        { order_id: orderId },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );
      
      if (response.data.success) {
        console.log('[CASHFREE] ✅ Payment verification successful!');
        
        // Clear URL params
        window.history.replaceState({}, document.title, window.location.pathname);
        
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (err) {
      console.error('[CASHFREE] Payment verification error:', err);
      setError(err.response?.data?.detail || 'Payment verification failed. Please contact support.');
      if (onError) {
        onError(err);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Check if Cashfree SDK is loaded
      if (!window.Cashfree) {
        throw new Error('Cashfree SDK not loaded. Please refresh the page and try again.');
      }

      // Create order based on type
      let orderResponse;
      if (type === 'membership') {
        orderResponse = await axios.post(`${API}/payment/create-membership-order`, 
          { plan: selectedPlan },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        orderResponse = await axios.post(`${API}/payment/create-service-order`, 
          { services },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const orderData = orderResponse.data;
      console.log('[CASHFREE] Full order response:', orderData);
      console.log('[CASHFREE] Order created:', orderData.order_id);
      console.log('[CASHFREE] Payment session ID:', orderData.payment_session_id);

      if (!orderData.payment_session_id) {
        console.error('[CASHFREE] Missing payment_session_id. Full response:', orderData);
        throw new Error('Payment session ID not received');
      }

      // Initialize Cashfree SDK
      const cashfree = window.Cashfree({
        mode: orderData.environment === 'SANDBOX' ? 'sandbox' : 'production'
      });

      // Open Cashfree checkout using SDK with custom theme
      const checkoutOptions = {
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: '_self',  // Redirect in same tab
        appearance: {
          theme: 'light',
          variables: {
            colorPrimary: '#7e22ce',  // Purple-700 to match your brand
            colorBackground: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '12px'
          }
        }
      };

      console.log('[CASHFREE] Opening checkout with options:', checkoutOptions);
      
      cashfree.checkout(checkoutOptions).then((result) => {
        if (result.error) {
          console.error('[CASHFREE] Checkout error:', result.error);
          setError(result.error.message || 'Payment initialization failed');
          setLoading(false);
        }
        if (result.redirect) {
          console.log('[CASHFREE] Redirecting to payment page...');
        }
      }).catch((err) => {
        console.error('[CASHFREE] Checkout exception:', err);
        setError('Failed to open payment page');
        setLoading(false);
      });

    } catch (err) {
      console.error('[CASHFREE] Order creation error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  // Get pricing based on type
  const plan = type === 'membership' ? MEMBERSHIP_PLANS[selectedPlan] || MEMBERSHIP_PLANS['1year'] : null;
  const amount = type === 'membership' ? plan.base : services.reduce((sum, s) => sum + (s.hours || 1) * (s.rate || 0), 0);
  const gst = type === 'membership' ? plan.gst : amount * 0.18;
  const total = type === 'membership' ? plan.total : amount + gst;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-bold">
          {type === 'membership' ? 'Membership Payment' : 'Service Payment'}
        </h2>
      </div>

      {/* Plan Selector for Membership */}
      {type === 'membership' && showPlanSelector && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2 text-gray-700">Choose Your Plan</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(MEMBERSHIP_PLANS).map(([planId, planData]) => {
              const IconComponent = PlanIcons[planId] || Crown;
              const isSelected = selectedPlan === planId;
              const isPopular = planId === '1year';
              
              return (
                <div
                  key={planId}
                  onClick={() => setSelectedPlan(planId)}
                  className={`relative cursor-pointer rounded-xl p-2 border-2 transition-all transform hover:scale-[1.02] ${
                    isSelected 
                      ? 'border-purple-600 bg-purple-50 shadow-md' 
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                  data-testid={`cashfree-plan-${planId}`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        ⭐ POPULAR
                      </span>
                    </div>
                  )}

                  {/* Discount Badge */}
                  {planData.originalBase && (
                    <div className="absolute -top-1 -right-1">
                      <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        -{Math.round((1 - planData.base / planData.originalBase) * 100)}%
                      </span>
                    </div>
                  )}
                  
                  {/* Plan Icon */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-1 ${
                    isSelected ? 'bg-purple-600' : 'bg-gray-100'
                  }`}>
                    <IconComponent size={14} className={isSelected ? 'text-white' : 'text-gray-600'} />
                  </div>
                  
                  {/* Plan Name */}
                  <h4 className={`text-xs font-bold text-center mb-0.5 ${isSelected ? 'text-purple-700' : 'text-gray-800'}`}>
                    {planData.name}
                  </h4>
                  
                  {/* Price with strikethrough original */}
                  <div className="text-center">
                    {planData.originalBase && (
                      <span className="text-[10px] text-gray-400 line-through mr-1">₹{planData.originalBase}</span>
                    )}
                    <span className={`text-base font-bold ${isSelected ? 'text-purple-600' : 'text-gray-800'}`}>
                      ₹{planData.base}
                    </span>
                    <p className="text-[9px] text-gray-500">+ GST = ₹{planData.total}</p>
                  </div>
                  
                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <CheckCircle size={12} className="text-purple-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 10 Lac+ Celebration Banner */}
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-lg p-2 text-center mt-2">
            <p className="text-xs font-bold text-amber-800">🎉 10 Lac+ Family Celebration - Thank You for Making Us #1!</p>
          </div>
        </div>
      )}

      {/* Payment Details - Compact */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4">
        <div className="space-y-1">
          {type === 'membership' ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Membership ({plan?.name || '1 Year'})</span>
                <div>
                  {plan?.originalBase && (
                    <span className="text-gray-400 line-through text-xs mr-2">₹{plan.originalBase.toLocaleString()}</span>
                  )}
                  <span className="font-semibold text-green-600">₹{plan?.base?.toLocaleString() || '499'}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>GST (18%)</span>
                <span>₹{plan?.gst || 90}</span>
              </div>
            </>
          ) : (
            <>
              {services.map((service, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{service.name || service.service} x {service.hours || 1} hr</span>
                  <span className="font-semibold">₹{(service.hours || 1) * (service.rate || 0)}</span>
                </div>
              ))}
              <div className="border-t pt-1 mt-1">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{amount.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>GST (18%)</span>
                  <span>₹{gst.toFixed(0)}</span>
                </div>
              </div>
            </>
          )}
          <div className="border-t pt-1 mt-1">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-purple-600">₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Badge - Compact */}
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Shield className="w-3 h-3" />
        <span>Secured by Cashfree • 100% Safe</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 text-red-600 rounded-lg mb-3 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Verifying Indicator */}
      {verifying && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-700 rounded-lg mb-3 text-sm border border-yellow-200">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Verifying payment... Please wait, do not close this window.</span>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || verifying}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-base hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        data-testid="pay-now-btn"
      >
        {loading || verifying ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            {verifying ? 'Verifying...' : 'Redirecting to Payment...'}
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Pay ₹{total.toLocaleString()} Now
            <ExternalLink className="w-3 h-3" />
          </>
        )}
      </button>

      {type === 'membership' && (
        <p className="text-center text-gray-500 text-xs mt-2">
          {plan?.name === 'Lifetime' ? 'Lifetime membership never expires!' : `Valid for ${plan?.duration || '1 year'}.`}
        </p>
      )}

      {/* Info about redirect */}
      <p className="text-center text-gray-400 text-[10px] mt-2">
        You will be redirected to Cashfree's secure payment page
      </p>
    </div>
  );
};

export default CashfreePayment;
