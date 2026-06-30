import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  user, 
  setUser, 
  onAuthClick // 🌟 INAYOS: Tinanggap ang tamang prop name galing sa App.jsx
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Admin Verification gamit ang iyong email
  const isAdmin = 
    user?.email === 'anjhon.hulguin02@gmail.com' || 
    user?.email?.startsWith('admin') || 
    user?.email === 'admin@motorent.local';

  // Kuhanin ang display name para sa login greeting
  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';

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
      // Kung walang setUser prop na gumagana, maaari rin itong maging sanhi ng isyu,
      // ngunit ang mahalaga ay masi-clear ang session sa supabase at magre-redirect.
      if (setUser) setUser(null); 
      setActiveTab('home');
    }
    setIsMenuOpen(false);
  };

  const getNavigationStyle = (isActive) => ({
    width: '100%',
    background: isActive ? 'rgba(234, 169, 116, 0.15)' : 'transparent',
    color: isActive ? '#eaa974' : '#ffffff',
    border: 'none',
    padding: '12px 18px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.95rem',
    textAlign: 'left',
    display: 'block',
    transition: 'all 0.2s ease',
  });

  return (
    <header 
      className={`main-navbar ${isScrolled ? 'scrolled' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: isScrolled ? '64px' : '70px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 2.5rem',
        zIndex: 99999, // 🌟 INANGAT: Tiniyak na lumulutang ang buong header framework
        backgroundColor: isScrolled ? '#151c29' : 'transparent',
        borderBottom: isScrolled ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Brand Logo */}
      <div onClick={handleBrandClick} className="navbar-logo" style={{ color: '#ffffff', fontWeight: '900', fontSize: '1.35rem', cursor: 'pointer' }}>
        MOTO<span style={{ color: '#eaa974' }}>RENT</span>
      </div>

      {/* Unified Action Controller Menu */}
      <div className="unified-menu-container" ref={menuRef} style={{ position: 'relative' }}>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="unified-hamburger-btn"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '8px 16px',
            borderRadius: '30px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>☰</span>
          <span style={{ fontSize: '0.88rem' }}>Menu</span>
        </button>

        {/* Premium Translucent Dropdown Menu */}
        {isMenuOpen && (
          <div 
            className="unified-dropdown-card"
            style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              right: 0,
              width: '240px',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '10px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              zIndex: 100000
            }}
          >
            {/* Welcome back greeting structure */}
            {user && (
              <div style={{
                padding: '10px 14px 6px 14px',
                fontSize: '0.85rem',
                color: '#94a3b8',
                fontWeight: '600',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                marginBottom: '6px'
              }}>
                Welcome back, <span style={{ color: '#eaa974', fontWeight: '700' }}>{displayName}</span>!
              </div>
            )}

            <button onClick={() => { setActiveTab('home'); setIsMenuOpen(false); }} style={getNavigationStyle(activeTab === 'home')}>
              Home
            </button>
            
            <button onClick={() => { setActiveTab('bikes'); setIsMenuOpen(false); }} style={getNavigationStyle(activeTab === 'bikes')}>
              Bikes
            </button>
            
            <button onClick={() => { setActiveTab('about'); setIsMenuOpen(false); }} style={getNavigationStyle(activeTab === 'about')}>
              Guidelines
            </button>
            
            <button onClick={() => { setActiveTab('reviews'); setIsMenuOpen(false); }} style={getNavigationStyle(activeTab === 'reviews')}>
              Reviews
            </button>

            <button onClick={() => { setActiveTab('contact'); setIsMenuOpen(false); }} style={getNavigationStyle(activeTab === 'contact')}>
              Contact
            </button>
            
            {/* Appears when a regular user is logged in */}
            {user && !isAdmin && (
              <button 
                onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }} 
                style={getNavigationStyle(activeTab === 'dashboard')}
              >
                My Bookings
              </button>
            )}
            
            {/* Appears when your admin email is logged in */}
            {user && isAdmin && (
              <button 
                onClick={() => { setActiveTab('admin'); setIsMenuOpen(false); }} 
                style={getNavigationStyle(activeTab === 'admin')}
              >
                Admin Dashboard
              </button>
            )}
            
            <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '6px 0' }}></div>

            {user ? (
              <button 
                onClick={handleLogout} 
                className="btn-logout"
                style={{
                  width: '100%',
                  background: 'rgba(231, 76, 60, 0.15)',
                  color: '#e74c3c',
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                Logout
              </button>
            ) : (
              <button 
                onClick={() => { onAuthClick(); setIsMenuOpen(false); }} // 🌟 INAYOS: Ginamit ang tamang prop na tinukoy sa taas
                style={{
                  width: '100%',
                  background: '#eaa974',
                  color: '#151c29',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                Login / Register
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}