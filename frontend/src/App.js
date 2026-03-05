import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import CuddlistSetup from './pages/CuddlistSetup';
import BookServices from './pages/BookServices';
import FindCuddlist from './pages/FindCuddlist';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import RefundPage from './pages/RefundPage';
import CodeOfConductPage from './pages/CodeOfConductPage';
import FAQPage from './pages/FAQPage';
import ContactPage from './pages/ContactPage';
import HelpCenter from './pages/HelpCenter';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import SetPassword from './components/SetPassword';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Protected route wrapper for SetPassword
function SetPasswordRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.password_set) {
    return <Navigate to="/dashboard" replace />;
  }

  return <SetPassword onSuccess={() => navigate('/dashboard')} />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/set-password" element={<SetPasswordRoute />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cuddlist-setup" element={<CuddlistSetup />} />
          <Route path="/book-services" element={<BookServices />} />
          <Route path="/find-cuddlist" element={<FindCuddlist />} />
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;