import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const RefundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <h1 className="text-4xl font-bold mb-2">Refund Policy</h1>
        <p className="text-gray-600 mb-8">Last Updated: January 2025</p>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">1. Booking Cancellations</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold mb-2">Client Cancellations:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>More than 24 hours before service: <strong>100% refund</strong></li>
                  <li>12-24 hours before service: <strong>50% refund</strong></li>
                  <li>Less than 12 hours before service: <strong>No refund</strong></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Cuddlist Cancellations:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>If KoPartner cancels, client receives full refund</li>
                  <li>Repeated cancellations may result in account suspension</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">2. Membership Fee (Non-Refundable)</h2>
            <p className="text-gray-700 mb-4">KoPartner membership fees are available in 3 plans:</p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-purple-800">6 Months Plan</h3>
                <p className="text-gray-700">₹199 + 18% GST = <strong>₹235</strong></p>
                <ul className="list-disc list-inside text-gray-600 mt-2 text-sm">
                  <li><strong>Non-Refundable</strong></li>
                  <li>Not transferable to another person</li>
                </ul>
              </div>
              
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <h3 className="font-bold text-pink-800">1 Year Plan <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full ml-2">Most Popular</span></h3>
                <p className="text-gray-700">₹499 + 18% GST = <strong>₹589</strong></p>
                <ul className="list-disc list-inside text-gray-600 mt-2 text-sm">
                  <li><strong>Non-Refundable</strong></li>
                  <li>Not transferable to another person</li>
                </ul>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-bold text-amber-800">Lifetime Plan</h3>
                <p className="text-gray-700">₹999 + 18% GST = <strong>₹1179</strong></p>
                <ul className="list-disc list-inside text-gray-600 mt-2 text-sm">
                  <li><strong>Non-Refundable</strong></li>
                  <li>Not transferable to another person</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-gray-700 text-sm">
                <strong>Note:</strong> All membership fees enable you as a KoPartner, allowing you to earn through the platform. 
                Once purchased, memberships cannot be refunded or transferred under any circumstances.
              </p>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">3. Service Quality Issues</h2>
            <p className="text-gray-700 mb-4">If you experience service quality issues:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Report within 24 hours of service completion</li>
              <li>Provide detailed explanation and evidence if available</li>
              <li>We will investigate and may issue partial or full refund</li>
              <li>Repeated false claims may result in account termination</li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">5. Refund Processing Time</h2>
            <p className="text-gray-700 mb-4">Approved refunds are processed within:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>5-7 business days to original payment method</li>
              <li>Bank processing may take additional 2-3 days</li>
              <li>You will receive refund confirmation via email</li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">7. Dispute Resolution</h2>
            <p className="text-gray-700 mb-2">For refund disputes:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Contact support: <strong>kopartnerhelp@gmail.com</strong></li>
              <li>Call: <strong>9810502313</strong> (Mon-Sat, 10 AM - 6 PM)</li>
              <li>Response within 48 hours</li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RefundPage;