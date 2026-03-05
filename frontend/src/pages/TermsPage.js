import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <h1 className="text-4xl font-bold mb-2">Terms of Use</h1>
        <p className="text-gray-600 mb-8">Last Updated: January 2025</p>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700">By accessing and using KoPartner's services, you agree to be bound by these Terms of Use. If you do not agree, please do not use our services.</p>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">2. Service Description</h2>
            <p className="text-gray-700 mb-4">KoPartner is a platform connecting individuals seeking emotional support and companionship with verified kopartners. All interactions must be:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Strictly platonic</li>
              <li>Consent-based</li>
              <li>Professional and respectful</li>
              <li>In compliance with applicable laws</li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">3. Age Requirement</h2>
            <p className="text-gray-700">You must be 18 years or older to use KoPartner services. By using our platform, you confirm that you meet this requirement.</p>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">4. User Responsibilities</h2>
            <p className="text-gray-700 mb-4">As a user, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Provide accurate and truthful information</li>
              <li>Maintain the confidentiality of your account</li>
              <li>Respect boundaries and consent</li>
              <li>Report any inappropriate behavior</li>
              <li>Not engage in any illegal activities</li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">5. Cuddlist Requirements</h2>
            <p className="text-gray-700 mb-4">Cuddlists must:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Pay annual membership fee of ₹1000</li>
              <li>Complete profile verification</li>
              <li>Maintain professional conduct</li>
              <li>Provide services as described</li>
              <li>Accept platform commission of 20% per booking</li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">6. Payment and Refunds</h2>
            <p className="text-gray-700">All payments are processed through Cashfree. Refund policy applies as per our separate Refund Policy document. GST at 18% is applicable on all transactions.</p>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">7. Prohibited Conduct</h2>
            <p className="text-gray-700 mb-4">The following is strictly prohibited:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Any sexual or romantic solicitation</li>
              <li>Harassment or abusive behavior</li>
              <li>Sharing inappropriate content</li>
              <li>Violating consent or boundaries</li>
              <li>Fraudulent activities</li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">10. Contact</h2>
            <p className="text-gray-700">For questions about these terms, contact: <strong>kopartnerhelp@gmail.com</strong> or <strong>9810502313</strong></p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsPage;