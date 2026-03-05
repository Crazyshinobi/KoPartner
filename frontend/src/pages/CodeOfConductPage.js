import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CodeOfConductPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <h1 className="text-4xl font-bold mb-4">Code of Conduct</h1>
        <p className="text-gray-600 mb-8">KoPartner is committed to providing a safe, respectful, and professional environment for all users.</p>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Core Principles</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold mb-2">1. Consent First</h3>
                <p className="text-gray-700">All interactions must be based on mutual, informed, and ongoing consent. Either party can withdraw consent at any time.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">2. Strictly Platonic</h3>
                <p className="text-gray-700">All services are non-sexual and non-romantic. Any sexual advances, solicitation, or romantic propositions are strictly prohibited.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">3. Respect Boundaries</h3>
                <p className="text-gray-700">Personal boundaries must be respected at all times. Communicate clearly and honor stated limits.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">4. Professional Conduct</h3>
                <p className="text-gray-700">Maintain professionalism in all communications and interactions. Treat others with dignity and respect.</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center"><XCircle className="mr-2 text-red-500" /> Prohibited Behavior</h2>
            <ul className="space-y-2 text-gray-700">
              <li>❌ Sexual or romantic advances of any kind</li>
              <li>❌ Harassment, bullying, or abusive language</li>
              <li>❌ Discrimination based on gender, race, religion, or any other factor</li>
              <li>❌ Sharing inappropriate photos, videos, or content</li>
              <li>❌ Violation of privacy or sharing personal information without consent</li>
              <li>❌ Substance abuse during service delivery</li>
              <li>❌ Fraudulent activities or misrepresentation</li>
              <li>❌ Recording sessions without explicit consent</li>
              <li>❌ Pressuring for contact outside the platform</li>
              <li>❌ Any illegal activities</li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center"><CheckCircle className="mr-2 text-green-500" /> Expected Behavior</h2>
            <ul className="space-y-2 text-gray-700">
              <li>✅ Communicate clearly and honestly</li>
              <li>✅ Arrive on time for scheduled services</li>
              <li>✅ Honor agreed-upon service terms</li>
              <li>✅ Maintain personal hygiene</li>
              <li>✅ Create a safe, comfortable environment</li>
              <li>✅ Respect privacy and confidentiality</li>
              <li>✅ Provide honest feedback and ratings</li>
              <li>✅ Report any violations or concerns immediately</li>
            </ul>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Safety Guidelines</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold mb-3">For Clients:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Meet in public places for first meetings when applicable</li>
                  <li>Inform a trusted person about your booking</li>
                  <li>Use the in-app emergency features if needed</li>
                  <li>Trust your instincts - cancel if uncomfortable</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3">For KoPartners:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Screen clients through the platform</li>
                  <li>Set clear boundaries before service begins</li>
                  <li>Have an emergency contact aware of your schedule</li>
                  <li>End sessions immediately if boundaries are violated</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-red-800"><AlertCircle className="mr-2" /> Reporting Violations</h2>
            <p className="text-gray-700 mb-4">If you experience or witness behavior that violates this Code of Conduct:</p>
            <ul className="space-y-2 text-gray-700 mb-6">
              <li>Use the in-app report/emergency feature</li>
              <li>Email: <strong>kopartnerhelp@gmail.com</strong> with details</li>
              <li>Call: <strong>9810502313</strong> for urgent matters</li>
              <li>For emergencies, contact local authorities: <strong>100 (Police)</strong></li>
            </ul>
            <p className="text-sm text-gray-600">All reports are taken seriously and investigated promptly. Your identity will be kept confidential.</p>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Consequences</h2>
            <p className="text-gray-700 mb-4">Violations of this Code may result in:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Warning and mandatory review of guidelines</li>
              <li>Temporary suspension of account</li>
              <li>Permanent ban from the platform</li>
              <li>Forfeiture of membership fees</li>
              <li>Legal action if applicable</li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CodeOfConductPage;