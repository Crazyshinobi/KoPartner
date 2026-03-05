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
        <p className="text-xl text-gray-600 mb-8">India's #1 Social & Lifestyle Support Services Platform</p>

        <div className="space-y-8">
          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Who We Are</h2>
            <p className="text-gray-700 leading-relaxed">
              KoPartner is India's leading social and lifestyle support services platform dedicated to enhancing daily life through professional assistance. We connect individuals with verified KoPartners who offer various support services including elder care, social outings, shopping assistance, medical appointment support, travel partnership, and more - all in a safe, professional environment.
            </p>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">The Challenge We Address</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              In today's fast-paced world, <strong>finding reliable support for daily activities has become a significant challenge</strong>. People are constantly surrounded by technology, yet genuine human assistance is harder to find than ever.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Many individuals need help with daily activities - whether it's accompanying elderly parents, attending social events, going shopping, visiting hospitals, or simply having someone reliable for travel. Whether it's supporting seniors, attending events, or running errands — <strong>everyone deserves professional, trustworthy support without judgment</strong>.
            </p>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Our Solution</h2>
            <p className="text-gray-700 leading-relaxed">
              That's why we created <strong>KoPartner</strong> — a platform designed to bring professional social and lifestyle support within reach for everyone. Through verified and trained KoPartners, we make it possible to get reliable assistance for daily activities — safely and respectfully.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              At its heart, KoPartner isn't just a service; <strong>it's a movement to make professional support accessible across India</strong>.
            </p>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              To become <strong>India's most trusted social and lifestyle support network</strong> — bridging the gap between need and reliable professional assistance through technology, quality service, and human care.
            </p>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold mb-2">🛡️ Safety First</h3>
                <p className="text-gray-700">All KoPartners are thoroughly verified and background-checked to ensure your safety and comfort.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">❤️ Care & Support</h3>
                <p className="text-gray-700">We prioritize genuine care and professional support in every interaction.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">🤝 Professionalism</h3>
                <p className="text-gray-700">All services are strictly professional with clear boundaries and mutual respect at the foundation.</p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">⭐ Service Excellence</h3>
                <p className="text-gray-700">We maintain the highest standards of professionalism, training, and service quality.</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Our Services</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <span className="text-3xl">👴</span>
                <p className="mt-2 font-semibold text-purple-700">Elder Care</p>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-xl">
                <span className="text-3xl">🤝</span>
                <p className="mt-2 font-semibold text-pink-700">Hangingout</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-xl">
                <span className="text-3xl">🎉</span>
                <p className="mt-2 font-semibold text-indigo-700">Clubbing</p>
              </div>
              <div className="text-center p-4 bg-violet-50 rounded-xl">
                <span className="text-3xl">🎬</span>
                <p className="mt-2 font-semibold text-violet-700">Movie Partner</p>
              </div>
              <div className="text-center p-4 bg-fuchsia-50 rounded-xl">
                <span className="text-3xl">🛍️</span>
                <p className="mt-2 font-semibold text-fuchsia-700">Shopping Buddy</p>
              </div>
              <div className="text-center p-4 bg-rose-50 rounded-xl">
                <span className="text-3xl">🩺</span>
                <p className="mt-2 font-semibold text-rose-700">Medical Support</p>
              </div>
              <div className="text-center p-4 bg-cyan-50 rounded-xl">
                <span className="text-3xl">🏠</span>
                <p className="mt-2 font-semibold text-cyan-700">Domestic Help</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-xl">
                <span className="text-3xl">✈️</span>
                <p className="mt-2 font-semibold text-amber-700">Travel Partner</p>
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
