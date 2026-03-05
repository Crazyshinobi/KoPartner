import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Plus, Minus } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Use relative URL for proxy
const API = "/api";

const BookServices = () => {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();

  const availableServices = [
    { name: 'Voice Call Chat', rate: 500 },
    { name: 'Video Call Chat', rate: 1000 },
    { name: 'Movie Companion', rate: 2000 },
    { name: 'Shopping Buddy', rate: 2000 },
    { name: 'Medical Support', rate: 2000 },
    { name: 'Domestic Help', rate: 2000 },
    { name: 'Travel Partner', rate: 2000 },
    { name: 'Stress Relief', rate: 2000 }
  ];

  const [selectedServices, setSelectedServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  const handleAddService = (service) => {
    if (!selectedServices.find(s => s.service === service.name)) {
      setSelectedServices([...selectedServices, {
        service: service.name,
        rate_per_hour: service.rate,
        hours: 1
      }]);
    }
  };

  const handleRemoveService = (serviceName) => {
    setSelectedServices(selectedServices.filter(s => s.service !== serviceName));
  };

  const handleHoursChange = (serviceName, delta) => {
    setSelectedServices(selectedServices.map(s => {
      if (s.service === serviceName) {
        const newHours = Math.max(1, s.hours + delta);
        return { ...s, hours: newHours };
      }
      return s;
    }));
  };

  const calculateTotal = () => {
    const subtotal = selectedServices.reduce((sum, s) => sum + (s.hours * s.rate_per_hour), 0);
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    return { subtotal, gst, total };
  };

  const handlePayment = async () => {
    if (selectedServices.length === 0) {
      setError('Please select at least one service');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Create payment order
      const response = await axios.post(
        `${API}/client/create-booking-payment`,
        { services: selectedServices },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { order_id, payment_session_id, test_mode, message } = response.data;
      setOrderId(order_id);
      setPaymentProcessing(true);

      // Check if in test mode - Show manual payment option
      if (test_mode) {
        // Keep payment processing state and order ID visible
        setLoading(false);
        // Manual payment form will be shown below
        return;
      }

      // Production mode: Initialize Cashfree SDK
      const cashfree = window.Cashfree({
        mode: "production"
      });

      // Open Cashfree payment page
      cashfree.checkout({
        paymentSessionId: payment_session_id,
        returnUrl: `${window.location.origin}/dashboard?order_id=${order_id}`
      });

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.detail || 'Failed to create payment order');
      setLoading(false);
      setPaymentProcessing(false);
    }
  };

  const handleVerifyPayment = async (order_id) => {
    try {
      const response = await axios.post(
        `${API}/client/verify-booking-payment?order_id=${order_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateUser({ can_search: true });
      alert('Payment successful! You can now search for kopartners.');
      navigate('/find-cuddlist');
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment verification failed');
      setPaymentProcessing(false);
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

      alert('Payment proof submitted successfully! Admin will verify and activate your account within 24 hours. You will receive a confirmation.');
      navigate('/dashboard');
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit payment proof');
      setUploadingProof(false);
    }
  };

  if (!user || (user.role !== 'client' && user.role !== 'both')) {
    navigate('/dashboard');
    return null;
  }

  const { subtotal, gst, total } = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8 mt-20">
        <h1 className="text-3xl font-bold mb-2" data-testid="book-services-title">Select Services & Book</h1>
        <p className="text-gray-600 mb-8">Choose services and hours, then make payment to find kopartners</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {paymentProcessing ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Manual Payment with QR Code */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-4 text-purple-600">Complete Your Payment</h2>
              <p className="text-gray-600 mb-2">Order ID: <span className="font-mono font-bold">{orderId}</span></p>
              <p className="text-xl font-bold text-gray-800 mb-6">Amount: ₹{total.toFixed(2)}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* QR Code Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 text-center">
                <h3 className="text-xl font-bold mb-4">Scan & Pay via PhonePe/UPI</h3>
                <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
                  <img 
                    src="/phonepe-qr.jpeg" 
                    alt="PhonePe Payment QR Code" 
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Scan this QR code with any UPI app to pay
                </p>
              </div>

              {/* Payment Proof Form */}
              <div className="bg-white rounded-2xl p-6 border-2 border-purple-200">
                <h3 className="text-xl font-bold mb-4">After Payment</h3>
                <p className="text-gray-600 mb-4">
                  Once you've completed the payment, enter your transaction ID below:
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID / UTR Number *
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter 12-digit transaction ID"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      data-testid="transaction-id-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You can find this in your UPI app's payment history
                    </p>
                  </div>

                  <button
                    onClick={handleManualPaymentSubmit}
                    disabled={uploadingProof || !transactionId.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    data-testid="submit-payment-proof-button"
                  >
                    {uploadingProof ? 'Submitting...' : 'Submit Payment Proof'}
                  </button>

                  <button
                    onClick={() => {
                      setPaymentProcessing(false);
                      setOrderId(null);
                      setTransactionId('');
                    }}
                    className="w-full border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel & Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Available Services */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Available Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableServices.map((service) => {
                    const isSelected = selectedServices.find(s => s.service === service.name);
                    return (
                      <div
                        key={service.name}
                        className={`border rounded-lg p-4 cursor-pointer transition ${
                          isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-300'
                        }`}
                        onClick={() => !isSelected && handleAddService(service)}
                        data-testid={`service-option-${service.name}`}
                      >
                        <h3 className="font-semibold mb-2">{service.name}</h3>
                        <p className="text-purple-600 font-bold">₹{service.rate}/hour</p>
                        {!isSelected && (
                          <button className="mt-2 text-sm text-purple-600 font-medium">
                            + Add Service
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Services */}
              {selectedServices.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
                  <h2 className="text-xl font-bold mb-4">Selected Services</h2>
                  <div className="space-y-4">
                    {selectedServices.map((service) => (
                      <div
                        key={service.service}
                        className="flex items-center justify-between border-b pb-4"
                        data-testid={`selected-${service.service}`}
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold">{service.service}</h3>
                          <p className="text-sm text-gray-600">₹{service.rate_per_hour}/hour</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleHoursChange(service.service, -1)}
                              className="bg-gray-200 rounded-full p-1 hover:bg-gray-300"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="font-semibold w-8 text-center">{service.hours}</span>
                            <button
                              onClick={() => handleHoursChange(service.service, 1)}
                              className="bg-gray-200 rounded-full p-1 hover:bg-gray-300"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <div className="text-right w-24">
                            <p className="font-bold">₹{service.hours * service.rate_per_hour}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveService(service.service)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Summary */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Payment Summary</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST (18%)</span>
                    <span className="font-semibold">₹{gst.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-purple-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={loading || selectedServices.length === 0}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                  data-testid="proceed-to-pay-button"
                >
                  {loading ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  After payment, you can search and book kopartners
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default BookServices;
