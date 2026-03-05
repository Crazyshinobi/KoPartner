import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, AlertCircle, Book, Shield, CreditCard, Users } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const HelpCenter = () => {
  const navigate = useNavigate();

  const categories = [
    {
      icon: Users,
      title: "Getting Started",
      description: "Learn how to use KoPartner",
      link: "/faq"
    },
    {
      icon: Shield,
      title: "Safety & Security",
      description: "Your safety is our priority",
      link: "/code-of-conduct"
    },
    {
      icon: CreditCard,
      title: "Payments & Refunds",
      description: "Billing and refund information",
      link: "/refund"
    },
    {
      icon: Book,
      title: "Policies",
      description: "Terms, privacy, and guidelines",
      link: "/terms"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-12 pt-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
          <p className="text-gray-600 text-lg">Find answers and get support</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(category.link)}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition text-left"
              >
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Icon size={24} className="text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">{category.title}</h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </button>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Popular Topics</h2>
            <div className="space-y-4">
              <button onClick={() => navigate('/faq')} className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition">
                <p className="font-semibold">How do I register as a KoPartner?</p>
              </button>
              <button onClick={() => navigate('/faq')} className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition">
                <p className="font-semibold">How does payment work?</p>
              </button>
              <button onClick={() => navigate('/faq')} className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition">
                <p className="font-semibold">What if I need to cancel?</p>
              </button>
              <button onClick={() => navigate('/faq')} className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition">
                <p className="font-semibold">How are kopartners verified?</p>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-red-800 mb-2">Emergency Support</h3>
                  <p className="text-red-700 text-sm mb-3">If you're in immediate danger, call local authorities first.</p>
                  <p className="text-red-700 text-sm">Police: <strong>100</strong></p>
                  <p className="text-red-700 text-sm">Women Helpline: <strong>1091</strong></p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
              <h3 className="text-xl font-bold mb-4">Need Direct Support?</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone size={20} />
                  <span>9810502313</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail size={20} />
                  <span>kopartnerhelp@gmail.com</span>
                </div>
                <p className="text-sm opacity-90 mt-4">Mon-Sat, 10 AM - 6 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HelpCenter;