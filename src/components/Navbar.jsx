import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  user, 
  setUser, 
  onAuthClick 
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Admin Verification
  const isAdmin = 
    user?.email === 'anjhon.hulguin02@gmail.com' || 
    user?.email?.startsWith('admin') || 
    user?.email === 'admin@motorent.local';

  // Display name para sa greeting
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
      if (setUser) setUser(null); 
      setActiveTab('home');
    }
    setIsMenuOpen(false);
  };

  // Inline style helper para sa mobile dropdown menu links
  const getMobileNavStyle = (isActive) => ({
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
        zIndex: 99999, 
        backgroundColor: isScrolled ? '#151c29' : 'transparent',
        borderBottom: isScrolled ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
        transition: 'all 0.3s ease'
      }}
    >
      {/* 🧠 DYNAMIC RESPONSIVE BREAKPOINTS ENGINE */}
      <style>{`
        .main-navbar {
          padding: 0 4rem !important;
        }
        .navbar-right-container {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .navbar-greeting {
          font-size: 0.9rem;
          color: #94a3b8;
          font-weight: 600;
          line-height: 1.2;
        }

        /* 🖥️ DESKTOP LINKS INJECTION */
        .desktop-nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .desktop-link-btn {
          background: transparent;
          border: none;
          color: #ffffff;
          padding: 8px 16px;
          border-radius: '8px';
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .desktop-link-btn:hover {
          color: #eaa974;
        }
        .desktop-link-btn.active {
          color: #eaa974;
        }
        .desktop-link-btn.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 16px;
          right: 16px;
          height: 2px;
          background-color: #eaa974;
          border-radius: 2px;
        }

        /* 📱 MOBILE HIDDEN ENGINE BREAKPOINT (992px is ideal for complex navs) */
        @media (min-width: 993px) {
          .unified-menu-container {
            display: none !important; /* Itago ang hamburger sa Desktop */
          }
        }

        @media (max-width: 992px) {
          .main-navbar {
            padding: 0 1.5rem !important;
          }
          .desktop-nav-links {
            display: none !important; /* Itago ang flat horizontal menu sa Mobile */
          }
          .navbar-right-container {
            gap: 12px !important;
          }
          .navbar-greeting {
            font-size: 0.8rem !important;
            text-align: right !important;
          }
          .navbar-greeting-prefix {
            display: none !important; /* Itago ang "Welcome back," para swak sa screen ng phone */
          }
        }
      `}</style>

      {/* Brand Logo */}
      <div onClick={handleBrandClick} className="navbar-logo" style={{ color: '#ffffff', fontWeight: '900', fontSize: '1.4rem', cursor: 'pointer', letterSpacing: '0.5px' }}>
        MOTO<span style={{ color: '#eaa974' }}>RENT</span>
      </div>

      {/* 🖥️ DESKTOP FLAT HORIZONTAL NAVIGATION LIST */}
      <nav className="desktop-nav-links">
        <button onClick={() => setActiveTab('home')} className={`desktop-link-btn ${activeTab === 'home' ? 'active' : ''}`}>Home</button>
        <button onClick={() => setActiveTab('bikes')} className={`desktop-link-btn ${activeTab === 'bikes' ? 'active' : ''}`}>Bikes</button>
        <button onClick={() => setActiveTab('about')} className={`desktop-link-btn ${activeTab === 'about' ? 'active' : ''}`}>Guidelines</button>
        <button onClick={() => setActiveTab('reviews')} className={`desktop-link-btn ${activeTab === 'reviews' ? 'active' : ''}`}>Reviews</button>
        <button onClick={() => setActiveTab('contact')} className={`desktop-link-btn ${activeTab === 'contact' ? 'active' : ''}`}>Contact</button>
        
        {user && !isAdmin && (
          <button onClick={() => setActiveTab('dashboard')} className={`desktop-link-btn ${activeTab === 'dashboard' ? 'active' : ''}`}>My Bookings</button>
        )}
        {user && isAdmin && (
          <button onClick={() => setActiveTab('admin')} className={`desktop-link-btn ${activeTab === 'admin' ? 'active' : ''}`} style={{ color: '#eaa974' }}>Admin Panel</button>
        )}
      </nav>

      {/* Right Side Control Station: User Context (Greeting + Action Trigger) */}
      <div className="navbar-right-container">
        
        {/* User Context Dynamic Card */}
        {user && (
          <div className="navbar-greeting">
            <span className="navbar-greeting-prefix">Welcome back, </span>
            <span style={{ color: '#eaa974', fontWeight: '800' }}>{displayName}!</span>
          </div>
        )}

        {/* 💻 DESKTOP AUTH BUTTON (Nakaladlad lang sa screen kapag walang dropdown) */}
        <div className="desktop-nav-links">
          {user ? (
            <button 
              onClick={handleLogout} 
              style={{
                background: 'transparent', border: '1px solid rgba(231, 76, 60, 0.4)', color: '#e74c3c',
                padding: '7px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(231, 76, 60, 0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              Logout
            </button>
          ) : (
            <button 
              onClick={onAuthClick} 
              style={{
                background: '#eaa974', color: '#151c29', border: 'none', padding: '8px 18px',
                borderRadius: '8px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              Login / Register
            </button>
          )}
        </div>

        {/* 📱 MOBILE HAMBURGER MECHANICS (Automatic na lalabas via Media Queries below 992px) */}
        <div className="unified-menu-container" ref={menuRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="unified-hamburger-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
              width: '42px', height: '42px', borderRadius: '50%', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>☰</span>
          </button>

          {/* Translucent Floating Dashboard Cards for Mobile Viewers */}
          {isMenuOpen && (
            <div 
              className="unified-dropdown-card"
              style={{
                position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: '240px',
                backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px',
                padding: '10px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 100000
              }}
            >
              <button onClick={() => { setActiveTab('home'); setIsMenuOpen(false); }} style={getMobileNavStyle(activeTab === 'home')}>Home</button>
              <button onClick={() => { setActiveTab('bikes'); setIsMenuOpen(false); }} style={getMobileNavStyle(activeTab === 'bikes')}>Bikes</button>
              <button onClick={() => { setActiveTab('about'); setIsMenuOpen(false); }} style={getMobileNavStyle(activeTab === 'about')}>Guidelines</button>
              <button onClick={() => { setActiveTab('reviews'); setIsMenuOpen(false); }} style={getMobileNavStyle(activeTab === 'reviews')}>Reviews</button>
              <button onClick={() => { setActiveTab('contact'); setIsMenuOpen(false); }} style={getMobileNavStyle(activeTab === 'contact')}>Contact</button>
              
              {user && !isAdmin && (
                <button onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }} style={getMobileNavStyle(activeTab === 'dashboard')}>My Bookings</button>
              )}
              {user && isAdmin && (
                <button onClick={() => { setActiveTab('admin'); setIsMenuOpen(false); }} style={getMobileNavStyle(activeTab === 'admin')}>Admin Dashboard</button>
              )}
              
              <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '6px 0' }}></div>

              {user ? (
                <button onClick={handleLogout} style={{ width: '100%', background: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.3)', padding: '10px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', textAlign: 'center' }}>
                  Logout
                </button>
              ) : (
                <button onClick={() => { onAuthClick(); setIsMenuOpen(false); }} style={{ width: '100%', background: '#eaa974', color: '#151c29', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', textAlign: 'center' }}>
                  Login / Register
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}