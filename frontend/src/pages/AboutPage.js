import React from 'react';
import { Phone, Mail } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <h1 className="text-4xl font-bold mb-4">About KoPartner</h1>
        <p className="text-xl text-gray-600 mb-8">Bringing Comfort, Connection, and Care to Every Heart</p>

        <div className="space-y-8">
          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Who We Are</h2>
            <p className="text-gray-700 leading-relaxed">
              KoPartner is an emotional wellness platform dedicated to enhancing human connection and mental well-being. We connect individuals with verified cuddle partners who offer comfort, conversation, and care in a safe, non-judgmental environment.
            </p>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">The Challenge We Address</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              In today's fast-paced world, <strong>loneliness has quietly become one of the biggest challenges of modern life</strong>. People are constantly surrounded by technology, yet true emotional connection is harder to find than ever.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Many individuals don't always have their friends, family, or loved ones available when they need emotional comfort, someone to listen, or simply a caring presence. Whether it's after a stressful day, a personal setback, or even during recovery from illness — <strong>everyone deserves a safe space to share, feel heard, and experience warmth without judgment</strong>.
            </p>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Our Solution</h2>
            <p className="text-gray-700 leading-relaxed">
              That's why we created <strong>KoPartner</strong> — a platform designed to bring emotional support, companionship, and human connection within reach for everyone. Through verified and trained cuddle partners, we make it possible to experience genuine care, meaningful conversation, and emotional balance — safely and respectfully.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              At its heart, KoPartner isn't just a service; <strong>it's a movement to make compassion accessible in a disconnected world</strong>.
            </p>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              To become <strong>India's most trusted emotional wellness and companionship network</strong> — bridging the gap between loneliness and meaningful connection through empathy, technology, and human touch.
            </p>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold mb-2">🛡️ Safety First</h3>
                <p className="text-gray-700">All kopartners are thoroughly verified and background-checked to ensure your safety and comfort.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">❤️ Empathy & Care</h3>
                <p className="text-gray-700">We prioritize genuine human connection, compassion, and understanding in every interaction.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">🤝 Consent & Respect</h3>
                <p className="text-gray-700">All services are strictly platonic with clear boundaries and mutual respect at the foundation.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">⭐ Professional Excellence</h3>
                <p className="text-gray-700">We maintain the highest standards of professionalism, training, and service quality.</p>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone size={24} />
                <span className="text-lg">9810502313</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={24} />
                <span className="text-lg">kopartnerhelp@gmail.com</span>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;