import React, { Suspense, lazy } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Eager load HomePage for fastest initial render
import HomePage from './pages/HomePage';

// Lazy load other pages for better initial bundle size
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CuddlistSetup = lazy(() => import('./pages/CuddlistSetup'));
const KoPartnerSetup = lazy(() => import('./pages/KoPartnerSetup'));
const BookServices = lazy(() => import('./pages/BookServices'));
const FindCuddlist = lazy(() => import('./pages/FindCuddlist'));
const FindKoPartner = lazy(() => import('./pages/FindKoPartner'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const RefundPage = lazy(() => import('./pages/RefundPage'));
const CodeOfConductPage = lazy(() => import('./pages/CodeOfConductPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const SetPassword = lazy(() => import('./components/SetPassword'));
const CityPage = lazy(() => import('./pages/CityPage'));

// Loading fallback component - minimal for fast display
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
      <p className="text-gray-500 text-sm">Loading...</p>
    </div>
  </div>
);

// Protected route wrapper for SetPassword
function SetPasswordRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.password_set) {
    // Already set password, redirect based on role
    if (user.role === 'cuddlist' || user.role === 'both') {
      if (!user.membership_paid || !user.profile_completed) {
        return <Navigate to="/kopartner-setup" replace />;
      }
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleSuccess = () => {
    // After password set, redirect based on role
    if (user.role === 'cuddlist' || user.role === 'both') {
      if (!user.membership_paid || !user.profile_completed) {
        navigate('/kopartner-setup');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <SetPassword onSuccess={handleSuccess} />
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/set-password" element={<SetPasswordRoute />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cuddlist-setup" element={<CuddlistSetup />} />
            <Route path="/kopartner-setup" element={<KoPartnerSetup />} />
            <Route path="/book-services" element={<BookServices />} />
            <Route path="/find-cuddlist" element={<FindCuddlist />} />
            <Route path="/find-kopartner" element={<FindKoPartner />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/refund" element={<RefundPage />} />
            <Route path="/code-of-conduct" element={<CodeOfConductPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminPanel />} />
            
            {/* City-specific SEO pages */}
            <Route path="/kopartner-delhi" element={<CityPage />} />
            <Route path="/kopartner-noida" element={<CityPage />} />
            <Route path="/kopartner-gurgaon" element={<CityPage />} />
            <Route path="/kopartner-mumbai" element={<CityPage />} />
            <Route path="/kopartner-bangalore" element={<CityPage />} />
            <Route path="/kopartner-pune" element={<CityPage />} />
            <Route path="/kopartner-hyderabad" element={<CityPage />} />
            <Route path="/kopartner-chennai" element={<CityPage />} />
            <Route path="/kopartner-kolkata" element={<CityPage />} />
            <Route path="/kopartner-ahmedabad" element={<CityPage />} />
            <Route path="/kopartner-jaipur" element={<CityPage />} />
            <Route path="/kopartner-chandigarh" element={<CityPage />} />
            <Route path="/kopartner-indore" element={<CityPage />} />
            <Route path="/kopartner-lucknow" element={<CityPage />} />
            <Route path="/kopartner-kochi" element={<CityPage />} />
            <Route path="/kopartner-coimbatore" element={<CityPage />} />
            <Route path="/kopartner-nashik" element={<CityPage />} />
            <Route path="/kopartner-surat" element={<CityPage />} />
            <Route path="/kopartner-dehradun" element={<CityPage />} />
            <Route path="/kopartner-:citySlug" element={<CityPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;