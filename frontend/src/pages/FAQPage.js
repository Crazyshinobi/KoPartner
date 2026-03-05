import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, Phone } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is KoPartner?",
      answer: "KoPartner is India's #1 Social & Lifestyle Support Services Platform connecting individuals with verified KoPartners who provide professional support services including elder care, hangingout, clubbing, movie partners, shopping buddies, medical support, travel partners, and more in a safe, professional environment."
    },
    {
      question: "Is this service legal?",
      answer: "Yes, KoPartner operates within legal boundaries. All services are strictly professional, consent-based, and comply with applicable laws. We maintain professional standards and safety protocols."
    },
    {
      question: "How do I become a KoPartner?",
      answer: "Register on the platform, complete your profile, pay the membership fee (starting at ₹199 for 6 months), and undergo verification. Once approved, you can start offering services."
    },
    {
      question: "What services can I offer as a KoPartner?",
      answer: "You can offer elder care, hangingout, clubbing, movie partner, shopping buddy, medical support, domestic help, and travel partner services. You set your own rates for each service."
    },
    {
      question: "How much can I earn as a KoPartner?",
      answer: "Earnings vary based on your rates and bookings. KoPartner takes a 20% commission, and you receive 80% of each booking. All transactions are transparent and tracked. Many KoPartners earn ₹50,000 to ₹1,50,000+ per month."
    },
    {
      question: "How does payment work?",
      answer: "All payments are processed through Cashfree payment gateway. Clients pay upfront before booking. 18% GST is added to all transactions. KoPartners can request withdrawals from their earnings."
    },
    {
      question: "How are KoPartners verified?",
      answer: "All KoPartners undergo background verification, profile review, and approval process. We ensure all partners maintain professional standards and adhere to our code of conduct."
    },
    {
      question: "What if I face an emergency?",
      answer: "Use the SOS button in your dashboard to report emergencies immediately. Our team responds within minutes. For life-threatening situations, call police (100) first."
    },
    {
      question: "Can I cancel a booking?",
      answer: "Yes. Cancellations more than 24 hours before service get 100% refund. 12-24 hours: 50% refund. Less than 12 hours: No refund. See our Refund Policy for details."
    },
    {
      question: "How does auto-matching work?",
      answer: "Our algorithm matches clients with KoPartners based on location (city/pincode), service type, availability, ratings, and preferences for optimal compatibility."
    },
    {
      question: "What areas do you serve?",
      answer: "We currently serve 20+ major cities across India including Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Pune, Kolkata, and more. You can search for KoPartners by city and pincode."
    },
    {
      question: "Is my personal information safe?",
      answer: "Yes. We use industry-standard encryption and security measures. Your data is never sold. Only necessary contact information is shared after confirmed bookings."
    },
    {
      question: "Can I report inappropriate behavior?",
      answer: "Absolutely. Use the report feature in the app or contact us at kopartnerhelp@gmail.com or call 9810502313. We take all reports seriously and act promptly."
    },
    {
      question: "What are the service rates?",
      answer: "Rates vary by service: Elder Care starts at ₹1,000/hour, Hangingout at ₹1,500/hour, and Clubbing/Events at ₹2,000/hour. Individual KoPartners may set their own rates."
    },
    {
      question: "How do I contact support?",
      answer: "Email us at kopartnerhelp@gmail.com or call 9810502313 (Mon-Sat, 10 AM - 6 PM). For urgent matters, use the in-app SOS features."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-600 mb-8">Find answers to common questions about KoPartner</p>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-left">{faq.question}</span>
                {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-700">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="mb-6">Contact our support team</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="mailto:kopartnerhelp@gmail.com" className="flex items-center justify-center space-x-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition">
              <Mail size={20} />
              <span>kopartnerhelp@gmail.com</span>
            </a>
            <a href="tel:9810502313" className="flex items-center justify-center space-x-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition">
              <Phone size={20} />
              <span>9810502313</span>
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQPage;
