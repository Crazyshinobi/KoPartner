import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle, Home, ArrowRight } from 'lucide-react';

const API = '/api';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, user, updateUser, refreshUser } = useAuth();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, failed, error
  const [message, setMessage] = useState('Verifying your payment...');
  const [paymentDetails, setPaymentDetails] = useState(null);
  
  const orderId = searchParams.get('order_id');
  const paymentType = searchParams.get('type') || 'membership';

  useEffect(() => {
    if (orderId && token) {
      verifyPayment();
    } else if (!orderId) {
      setStatus('error');
      setMessage('No order ID found. Please try again from the dashboard.');
    } else if (!token) {
      setStatus('error');
      setMessage('Please login to verify your payment.');
    }
  }, [orderId, token]);

  const verifyPayment = async () => {
    setStatus('verifying');
    setMessage('Verifying your payment with Cashfree...');
    
    try {
      const endpoint = paymentType === 'service' 
        ? `${API}/payment/verify-service`
        : `${API}/payment/verify-membership`;
      
      const response = await axios.post(
        endpoint,
        { order_id: orderId },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );
      
      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message || 'Payment successful!');
        setPaymentDetails({
          paymentId: response.data.payment_id,
          membershipType: response.data.membership_type,
          user: response.data.user
        });
        
        // Update user state
        if (paymentType === 'membership') {
          updateUser({
            membership_paid: true,
            profile_activated: true,
            membership_type: response.data.membership_type,
            cuddlist_status: 'approved'
          });
        } else {
          updateUser({
            can_search: true,
            service_payment_done: true
          });
        }
        
        // Refresh user data
        try {
          await refreshUser();
        } catch (e) {
          console.warn('Failed to refresh user data:', e);
        }
      } else {
        setStatus('failed');
        setMessage('Payment verification failed. Please contact support if amount was deducted.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      const errorMessage = error.response?.data?.detail || 'Unable to verify payment. Please try again.';
      
      if (errorMessage.includes('not completed') || errorMessage.includes('ACTIVE')) {
        setStatus('failed');
        setMessage('Payment was not completed. Please try again.');
      } else {
        setStatus('error');
        setMessage(errorMessage);
      }
    }
  };

  const handleContinue = () => {
    if (paymentType === 'membership') {
      navigate('/dashboard');
    } else {
      navigate('/find-kopartner');
    }
  };

  const handleRetry = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Status Icon */}
        <div className="mb-6">
          {status === 'verifying' && (
            <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-yellow-600 animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          )}
          {status === 'failed' && (
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-orange-600" />
            </div>
          )}
        </div>

        {/* Status Title */}
        <h1 className={`text-2xl font-bold mb-2 ${
          status === 'success' ? 'text-green-700' :
          status === 'failed' ? 'text-red-700' :
          status === 'error' ? 'text-orange-700' :
          'text-gray-700'
        }`}>
          {status === 'verifying' && 'Verifying Payment'}
          {status === 'success' && '🎉 Payment Successful!'}
          {status === 'failed' && 'Payment Failed'}
          {status === 'error' && 'Verification Error'}
        </h1>

        {/* Status Message */}
        <p className="text-gray-600 mb-6">{message}</p>

        {/* Payment Details (if success) */}
        {status === 'success' && paymentDetails && (
          <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-green-800 mb-2">Payment Details</h3>
            <div className="space-y-1 text-sm text-green-700">
              <p><span className="font-medium">Order ID:</span> {orderId}</p>
              {paymentDetails.paymentId && (
                <p><span className="font-medium">Payment ID:</span> {paymentDetails.paymentId}</p>
              )}
              {paymentDetails.membershipType && (
                <p><span className="font-medium">Plan:</span> {paymentDetails.membershipType}</p>
              )}
            </div>
          </div>
        )}

        {/* Order ID (if failed/error) */}
        {(status === 'failed' || status === 'error') && orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Order ID:</span> {orderId}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Please save this ID and contact support if you need assistance.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {status === 'success' && (
            <button
              onClick={handleContinue}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              Continue to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          
          {(status === 'failed' || status === 'error') && (
            <>
              <button
                onClick={handleRetry}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </>
          )}
          
          {status === 'verifying' && (
            <p className="text-sm text-gray-500">Please wait while we verify your payment...</p>
          )}
        </div>

        {/* Support Info */}
        {(status === 'failed' || status === 'error') && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:kopartnerhelp@gmail.com" className="text-purple-600 hover:underline">
                kopartnerhelp@gmail.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
