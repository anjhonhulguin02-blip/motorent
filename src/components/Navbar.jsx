import React from 'react';
import { supabase } from '../supabaseClient';

export default function Navbar({ 
  theme, 
  toggleTheme, 
  activeTab, 
  setActiveTab, 
  lang, 
  toggleLang, 
  user, 
  setUser, 
  setAuthModalOpen 
}) {

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setActiveTab('home'); // Awtomatikong ibalik sa home kapag nag-logout
      alert(lang === 'en' ? 'Logged out successfully!' : 'Matagumpay na nakalabas!');
    } else {
      alert(error.message);
    }
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: 'var(--card-bg, rgba(23, 42, 44, 0.8))',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      flexWrap: 'wrap', 
      gap: '1rem'
    }}>
      
      {/* KALIWA: BRAND LOGO */}
      <div 
        onClick={() => setActiveTab('home')} 
        style={{ 
          fontSize: '1.6rem', 
          fontWeight: '900', 
          cursor: 'pointer', 
          letterSpacing: '1px',
          color: 'var(--text-color)'
        }}
      >
        MOTO<span style={{ color: 'var(--primary-color, #ff6b6b)' }}>RENT.</span>
      </div>

      {/* GITNA: NAVIGATION LINKS */}
      <nav style={{ 
        display: 'flex', 
        gap: '1.5rem', 
        alignItems: 'center',
        flexWrap: 'wrap' 
      }}>
        <button 
          onClick={() => setActiveTab('home')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'home' ? 'var(--primary-color)' : 'var(--text-color)',
            fontWeight: activeTab === 'home' ? '800' : '500',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: '0.3s'
          }}
        >
          {lang === 'en' ? 'Home' : 'Tahanan'}
        </button>

        <button 
          onClick={() => setActiveTab('bikes')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'bikes' ? 'var(--primary-color)' : 'var(--text-color)',
            fontWeight: activeTab === 'bikes' ? '800' : '500',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: '0.3s'
          }}
        >
          {lang === 'en' ? 'Bikes' : 'Mga Motor'}
        </button>

        {/* MGA ARKILA / DASHBOARD BUTTON */}
        {user && (
          <button 
            onClick={() => setActiveTab('dashboard')} 
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'dashboard' ? 'var(--primary-color)' : 'var(--text-color)',
              fontWeight: activeTab === 'dashboard' ? '800' : '500',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: '0.3s'
            }}
          >
            {lang === 'en' ? 'My Bookings' : 'Aking Arkila'}
          </button>
        )}

        <button 
          onClick={() => setActiveTab('about')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'about' ? 'var(--primary-color)' : 'var(--text-color)',
            fontWeight: activeTab === 'about' ? '800' : '500',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: '0.3s'
          }}
        >
          {lang === 'en' ? 'About' : 'Tungkol sa Amin'}
        </button>

        <button 
          onClick={() => setActiveTab('contact')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'contact' ? 'var(--primary-color)' : 'var(--text-color)',
            fontWeight: activeTab === 'contact' ? '800' : '500',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: '0.3s'
          }}
        >
          {lang === 'en' ? 'Contact' : 'Kontak'}
        </button>
      </nav>

      {/* KANAN: CONTROLS & AUTHENTICATION */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1.2rem',
        flexWrap: 'wrap'
      }}>
        
        {/* MODERN FLAG LOGO SWITCHER */}
        <button 
          onClick={toggleLang} 
          title={lang === 'en' ? 'Switch to Filipino' : 'Lumipat sa Ingles'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            padding: '6px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
            color: 'var(--text-color)',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.borderColor = 'var(--primary-color)'}
          onMouseLeave={(e) => e.target.style.borderColor = 'var(--border-color)'}
        >
          {lang === 'en' ? '🇺🇸 EN' : '🇵🇭 TL'}
        </button>

        {/* THEME TOGGLE */}
        <button 
          onClick={toggleTheme} 
          style={{
            background: 'var(--text-color)',
            color: 'var(--bg-color)',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
          }}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        {/* USER PROFILE & LOGOUT SCRIPT */}
        {user ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <span style={{ 
              fontSize: '0.9rem', 
              color: 'var(--text-color)', 
              opacity: 0.9,
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              👋 {user.email}
            </span>
            <button 
              onClick={handleLogout} 
              style={{
                background: 'rgba(255, 75, 75, 0.2)',
                color: '#ff4b4b',
                border: '1px solid #ff4b4b',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                transition: '0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#ff4b4b';
                e.target.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 75, 75, 0.2)';
                e.target.style.color = '#ff4b4b';
              }}
            >
              {lang === 'en' ? 'Logout' : 'Lumabas'}
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setAuthModalOpen(true)}
            style={{
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
          >
            {lang === 'en' ? 'Login' : 'Mag-login'}
          </button>
        )}

      </div>
    </header>
  );
}