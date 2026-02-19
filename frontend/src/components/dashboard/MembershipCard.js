import React from 'react';
import { CreditCard, CheckCircle, Clock, Gift } from 'lucide-react';

const MembershipCard = ({ user, onPayNow, loading = false }) => {
  const isKoPartner = user?.role === 'cuddlist' || user?.role === 'both';
  
  if (!isKoPartner) return null;

  const isPaid = user?.membership_paid;
  const membershipType = user?.membership_type;

  const plans = [
    { id: '6month', name: '6 Months', price: 199, originalPrice: 500, discount: 60 },
    { id: '1year', name: '1 Year', price: 499, originalPrice: 1000, discount: 50, popular: true },
    { id: 'lifetime', name: 'Lifetime', price: 999, originalPrice: 2000, discount: 50 }
  ];

  if (isPaid) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <CheckCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Membership Active</h3>
            <p className="text-white/80 text-sm capitalize">{membershipType} Plan</p>
          </div>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4 mt-4">
          <div className="flex items-center gap-2">
            <Gift size={18} />
            <span className="text-sm">Your profile is visible to all clients</span>
          </div>
        </div>
        
        {user.membership_expiry && (
          <p className="text-xs text-white/70 mt-4">
            Valid until: {new Date(user.membership_expiry).toLocaleDateString('en-IN')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <CreditCard size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Activate Your Profile</h3>
            <p className="text-white/80 text-sm">Complete payment to start earning</p>
          </div>
        </div>
        
        {/* 10 Lac+ Celebration Badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-400 text-yellow-900 rounded-full text-sm font-medium">
          <Gift size={16} />
          10 Lac+ Family Celebration - Up to 60% OFF!
        </div>
      </div>

      {/* Plans */}
      <div className="p-6 space-y-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
              plan.popular 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
            onClick={() => onPayNow(plan.id)}
          >
            {plan.popular && (
              <span className="absolute -top-2 right-4 px-2 py-0.5 bg-purple-500 text-white text-xs font-medium rounded-full">
                Most Popular
              </span>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-purple-600">₹{plan.price}</span>
                  <span className="text-sm text-gray-400 line-through">₹{plan.originalPrice}</span>
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                    {plan.discount}% OFF
                  </span>
                </div>
              </div>
              
              <button
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  plan.popular
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Pay Now'
                )}
              </button>
            </div>
          </div>
        ))}

        <p className="text-xs text-gray-500 text-center mt-4">
          All prices include 18% GST. Secure payment via Razorpay.
        </p>
      </div>
    </div>
  );
};

export default MembershipCard;
