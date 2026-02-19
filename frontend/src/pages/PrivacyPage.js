import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last Updated: January 2025</p>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-4">We collect personal information that you provide to us including:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Name, email address, and phone number</li>
              <li>Location and pincode</li>
              <li>Profile information, bio, and hobbies</li>
              <li>Payment information (processed securely through Cashfree)</li>
              <li>Service preferences and booking history</li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use the collected information for:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Providing and improving our services</li>
              <li>Matching clients with suitable kopartners</li>
              <li>Processing payments and transactions</li>
              <li>Sending OTP verification codes</li>
              <li>Communication about bookings and services</li>
              <li>Safety and security purposes</li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">3. Information Sharing</h2>
            <p className="text-gray-700 mb-4">We do not sell your personal information. We may share information with:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Matched kopartners/clients (limited to necessary contact details after confirmed booking)</li>
              <li>Payment processors (Cashfree) for transaction processing</li>
              <li>SMS service providers (Fast2SMS) for OTP delivery</li>
              <li>Law enforcement when legally required</li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
            <p className="text-gray-700">
              We implement industry-standard security measures to protect your data including encryption, secure servers, and access controls.
            </p>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">5. Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">6. Contact Us</h2>
            <p className="text-gray-700">
              For privacy concerns, contact us at: <strong>kopartnerhelp@gmail.com</strong> or call <strong>9810502313</strong>
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPage;