import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Minus } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CashfreePayment from '../components/CashfreePayment';

const BookServices = () => {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();

  const availableServices = [
    { name: 'Elder Care', rate: 1000 },
    { name: 'Hanging Out', rate: 1500 },
    { name: 'Movie Companion', rate: 2000 },
    { name: 'Shopping Buddy', rate: 2000 },
    { name: 'Medical Support', rate: 2000 },
    { name: 'Domestic Help', rate: 2000 },
    { name: 'Travel Partner', rate: 2000 },
    { name: 'Clubbing', rate: 2000 }
  ];

  const [selectedServices, setSelectedServices] = useState([]);
  const [error, setError] = useState('');

  const handleAddService = (service) => {
    if (!selectedServices.find(s => s.name === service.name)) {
      setSelectedServices([...selectedServices, {
        name: service.name,
        service: service.name,
        rate: service.rate,
        rate_per_hour: service.rate,
        hours: 1
      }]);
    }
  };

  const handleRemoveService = (serviceName) => {
    setSelectedServices(selectedServices.filter(s => s.name !== serviceName));
  };

  const handleHoursChange = (serviceName, delta) => {
    setSelectedServices(selectedServices.map(s => {
      if (s.name === serviceName) {
        const newHours = Math.max(1, s.hours + delta);
        return { ...s, hours: newHours };
      }
      return s;
    }));
  };

  const calculateTotal = () => {
    const subtotal = selectedServices.reduce((sum, s) => sum + (s.hours * s.rate), 0);
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    return { subtotal, gst, total };
  };

  const handlePaymentSuccess = async (data) => {
    await refreshUser();
    alert('Payment successful! You can now search for KoPartners.');
    navigate('/find-kopartner');
  };

  const handlePaymentError = (err) => {
    setError(err.response?.data?.detail || 'Payment failed. Please try again.');
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
        <p className="text-gray-600 mb-8">Choose services and hours, then make payment to find KoPartners</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Services */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Available Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableServices.map((service) => {
                  const isSelected = selectedServices.find(s => s.name === service.name);
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
                      key={service.name}
                      className="flex items-center justify-between border-b pb-4"
                      data-testid={`selected-${service.name}`}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-gray-600">₹{service.rate}/hour</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleHoursChange(service.name, -1)}
                            className="bg-gray-200 rounded-full p-1 hover:bg-gray-300"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-semibold w-8 text-center">{service.hours}</span>
                          <button
                            onClick={() => handleHoursChange(service.name, 1)}
                            className="bg-gray-200 rounded-full p-1 hover:bg-gray-300"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="text-right w-24">
                          <p className="font-bold">₹{service.hours * service.rate}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveService(service.name)}
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

          {/* Payment Section */}
          <div>
            {selectedServices.length > 0 ? (
              <CashfreePayment
                type="service"
                services={selectedServices}
                token={token}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Payment Summary</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">₹0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST (18%)</span>
                    <span className="font-semibold">₹0.00</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-purple-600">₹0.00</span>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-500 py-4 rounded-lg font-semibold text-lg cursor-not-allowed"
                >
                  Select a Service First
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  After payment, you can search and book KoPartners
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default BookServices;
