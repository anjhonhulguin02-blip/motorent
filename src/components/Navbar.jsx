import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  user, 
  setUser, 
  setAuthModalOpen 
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleBrandClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveTab('home');
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setActiveTab('home');
    }
    setIsMenuOpen(false);
  };

  const isAdmin = user?.email === 'admin@motorent.com' || user?.email === 'moto@rent.com';

  return (
    <header className={`main-navbar ${isScrolled ? 'scrolled' : ''}`}>
      {/* Brand Logo */}
      <div onClick={handleBrandClick} className="navbar-logo">
        MOTO<span>RENT</span>
      </div>

      {/* UNIFIED INTERFACE SYSTEM (Isang Menu Button para sa Lahat) */}
      <div className="unified-menu-container" ref={menuRef}>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className={`unified-hamburger-btn ${isMenuOpen ? 'open' : ''}`}
          aria-label="Toggle Navigation Menu"
        >
          <span className="hamburger-text">MENU</span>
          <div className="hamburger-bars">
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </div>
        </button>

        {isMenuOpen && (
          <div className="unified-dropdown-card">
            <button onClick={() => { setActiveTab('home'); setIsMenuOpen(false); }} style={getNavigationStyle(activeTab === 'home')}>Home</button>
            <button onClick={() => { setActiveTab('bikes'); setIsMenuOpen(false); }} style={getNavigationStyle(activeTab === 'bikes')}>Bikes</button>
            <button onClick={() => { setActiveTab('reviews'); setIsMenuOpen(false); }} style={getNavigationStyle(activeTab === 'reviews')}>Reviews</button>
            <button onClick={() => { setActiveTab('about'); setIsMenuOpen(false); }} style={getNavigationStyle(activeTab === 'about')}>About</button>
            <button onClick={() => { setActiveTab('contact'); setIsMenuOpen(false); }} style={getNavigationStyle(activeTab === 'contact')}>Contact</button>
            
            {user && !isAdmin && (
              <button onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }} style={getNavigationStyle(activeTab === 'dashboard')}>Dashboard</button>
            )}
            {user && isAdmin && (
              <button onClick={() => { setActiveTab('admin'); setIsMenuOpen(false); }} style={getNavigationStyle(activeTab === 'admin')}>Admin Core</button>
            )}
            
            <div className="dropdown-divider"></div>

            {user ? (
              <button onClick={handleLogout} className="btn-logout unified-menu-action-btn">
                Logout
              </button>
            ) : (
              <button onClick={() => { setAuthModalOpen(true); setIsMenuOpen(false); }} className="btn-primary unified-menu-action-btn">
                Login
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

const getNavigationStyle = (isActive) => ({
  background: isActive ? 'rgba(234, 169, 116, 0.12)' : 'transparent',
  color: isActive ? 'var(--primary-color)' : 'var(--text-color)',
  border: 'none',
  padding: '12px 18px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: '700',
  fontSize: '0.95rem',
  width: '100%',
  textAlign: 'left',
  transition: 'all 0.2s ease',
  display: 'block',
  marginBottom: '2px'
});