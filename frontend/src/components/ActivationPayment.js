import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Use relative URL for proxy
const API = "/api";

const ActivationPayment = ({ onSuccess }) => {
  const { token, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  const handleCreateOrder = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/cuddlist/create-activation-order`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { order_id, payment_session_id, test_mode, message } = response.data;
      setOrderId(order_id);
      
      // Check if in test mode - show manual payment
      if (test_mode) {
        setShowManualPayment(true);
        setLoading(false);
        return;
      }

      // Production mode: Initialize Cashfree SDK
      const cashfree = window.Cashfree({
        mode: "production"
      });

      // Open Cashfree payment page
      cashfree.checkout({
        paymentSessionId: payment_session_id,
        returnUrl: `${window.location.origin}/dashboard?order_id=${order_id}&type=activation`
      });
      
    } catch (err) {
      console.error('Activation payment error:', err);
      setError(err.response?.data?.detail || 'Failed to create payment order');
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (order_id) => {
    try {
      const response = await axios.post(
        `${API}/cuddlist/verify-activation-payment?order_id=${order_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateUser({
        membership_paid: true,
        profile_activated: true
      });
      
      onSuccess();
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment verification failed');
      setLoading(false);
    }
  };

  const handleManualPaymentSubmit = async () => {
    if (!transactionId.trim()) {
      setError('Please enter transaction ID');
      return;
    }

    setUploadingProof(true);
    setError('');

    try {
      await axios.post(
        `${API}/client/submit-payment-proof`,
        {
          order_id: orderId,
          transaction_id: transactionId,
          payment_method: 'PhonePe'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Payment proof submitted! Admin will verify within 24 hours and activate your profile.');
      if (onSuccess) onSuccess();
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit payment proof');
      setUploadingProof(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8" data-testid="activation-payment">
      <h2 className="text-2xl font-bold mb-4">Activate Your KoPartner Profile</h2>
      <p className="text-gray-600 mb-6">
        Pay ₹1000 membership fee to activate your profile and start offering services.
      </p>

      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-medium">Membership Fee</span>
          <span className="text-3xl font-bold text-purple-600">₹1000</span>
        </div>
        <div className="text-sm text-gray-600">
          <p>✓ Valid for 1 year</p>
          <p>✓ Access to all platform features</p>
          <p>✓ List your services with custom rates</p>
          <p>✓ Receive bookings from clients</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!orderId && !showManualPayment ? (
        <button
          onClick={handleCreateOrder}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg disabled:opacity-50 transition"
          data-testid="pay-now-button"
        >
          {loading ? 'Processing...' : 'Pay Now ₹1000'}
        </button>
      ) : showManualPayment ? (
        <div className="space-y-6" data-testid="manual-payment-form">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-center">
            <h3 className="text-lg font-bold mb-4">Scan & Pay via PhonePe/UPI</h3>
            <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
              <img 
                src="/phonepe-qr.jpeg" 
                alt="PhonePe Payment QR Code" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-sm text-gray-600 mt-4">Amount: ₹1000</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID / UTR Number *
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter 12-digit transaction ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              data-testid="activation-transaction-id"
            />
          </div>

          <button
            onClick={handleManualPaymentSubmit}
            disabled={uploadingProof || !transactionId.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-xl transition disabled:opacity-50"
            data-testid="submit-activation-proof"
          >
            {uploadingProof ? 'Submitting...' : 'Submit Payment Proof'}
          </button>
        </div>
      ) : (
        <div className="text-center" data-testid="payment-processing">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
          <p className="text-sm text-gray-500 mt-2">Order ID: {orderId}</p>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center mt-4">
        Secure payment powered by Cashfree
      </p>
    </div>
  );
};

export default ActivationPayment;
