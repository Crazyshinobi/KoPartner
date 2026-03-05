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
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-blue-800 font-semibold">
                KoPartner is a <strong>digital platform</strong> that provides technology services to connect individuals seeking social and lifestyle support with verified KoPartners. We do not directly provide support services - we only provide the digital infrastructure and platform for service providers and clients to connect.
              </p>
            </div>
            <p className="text-gray-700 mb-4">All interactions facilitated through our platform must be:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Strictly professional</li>
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
            <h2 className="text-2xl font-bold mb-4">5. KoPartner Membership Terms</h2>
            <p className="text-gray-700 mb-4">KoPartners (Service Providers) must:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
              <li>Pay membership fee as per selected plan</li>
              <li>Complete profile verification</li>
              <li>Maintain professional conduct</li>
              <li>Provide services as described</li>
              <li>Accept platform commission of 20% per booking</li>
            </ul>
            
            {/* Important Disclaimer */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mt-4">
              <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center">
                <span className="mr-2">⚠️</span> Important Disclaimer for KoPartners
              </h3>
              <p className="text-amber-900 mb-3">
                By becoming a KoPartner and purchasing a membership plan, you acknowledge and agree to the following:
              </p>
              <ul className="list-disc list-inside space-y-2 text-amber-800">
                <li><strong>Digital Platform Only:</strong> KoPartner is a digital technology platform that facilitates connections between service providers and clients. We do not employ KoPartners, nor do we directly provide any support services.</li>
                <li><strong>No Guarantee of Bookings:</strong> KoPartner does not guarantee any minimum number of bookings, service requests, or client inquiries.</li>
                <li><strong>No Commitment on Duration:</strong> There is no commitment or guarantee on when you will receive your first booking or any subsequent bookings.</li>
                <li><strong>No Income Promise:</strong> KoPartner does not promise or guarantee any specific income, earnings, or financial returns from your membership.</li>
                <li><strong>Independent Service Providers:</strong> KoPartners are independent service providers, not employees or agents of KoPartner. You are solely responsible for your services, conduct, and compliance with laws.</li>
                <li><strong>Membership is Non-Refundable:</strong> Once purchased, membership fees are non-refundable regardless of the number of bookings received.</li>
              </ul>
              <p className="text-amber-900 mt-4 font-medium">
                You are solely responsible for your decision to become a KoPartner. Please consider all factors before purchasing a membership.
              </p>
            </div>
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
            <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">To the maximum extent permitted by applicable law:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>KoPartner provides the platform on an "as is" and "as available" basis without any warranties, expressed or implied.</li>
              <li>KoPartner shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</li>
              <li>KoPartner does not guarantee continuous, uninterrupted access to the platform.</li>
              <li>KoPartner is not responsible for the conduct of any user or KoPartner on or off the platform.</li>
              <li>KoPartner's total liability shall not exceed the amount paid by you for the service in question.</li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">9. Indemnification</h2>
            <p className="text-gray-700">You agree to indemnify and hold harmless KoPartner, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the platform or violation of these terms.</p>
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