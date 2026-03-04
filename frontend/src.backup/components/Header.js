import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-purple-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <button
          onClick={() => navigate('/')}
          data-testid="header-logo"
          className="transform hover:scale-105 transition-transform duration-200"
        >
          <Logo size="md" showText={true} />
        </button>
      </div>
    </header>
  );
};

export default Header;