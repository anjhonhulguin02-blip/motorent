import React, { useState, useEffect } from 'react';
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
  const [isScrolled, setIsScrolled] = useState(false);

  // 1. NAKIKINIG SA SCROLL NG CLIENT (Mobile at Desktop)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setIsScrolled(true); // Kapag lumagpas sa 60px ang scroll down, itatago ang links at controls
      } else {
        setIsScrolled(false); // Babalik sa normal kapag nasa pinakataas
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. BACK-TO-TOP FUNCTION (Nananatili sa kasalukuyang tab pero lulundag sa taas)
  const handleBrandClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setActiveTab('home'); 
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
      padding: isScrolled ? '0.6rem 2rem' : '1rem 2rem', // Lumiliit ang padding kapag naka-scroll
      backgroundColor: 'var(--card-bg, rgba(23, 42, 44, 0.95))', // Solid opacity para sa malinis na scroll overlay
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      flexDirection: 'row', // Pinipilit nating laging pahiga para hindi magulo sa mobile
      gap: '1rem',
      transition: 'all 0.4s ease-in-out' // Swabeng animation ng pagliit
    }}>
      
      {/* KALIWA: BRAND LOGO & USERNAME DISPLAY */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div 
          onClick={handleBrandClick} 
          style={{ 
            fontSize: '1.4rem', 
            fontWeight: '900', 
            cursor: 'pointer', 
            letterSpacing: '1px',
            color: 'var(--text-color)',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          MOTO
          <span style={{ color: 'var(--primary-color, #ff6b6b)' }}>
            RENT
          </span>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: '400', 
            color: 'gray', 
            marginLeft: '4px',
            letterSpacing: '0px'
          }}>
            | BULACAN
          </span>
        </div>

        {/* 💥 DYNAMIC USERNAME GREETING (Naglalaho kapag naka-scroll down para malinis sa mobile) */}
        {user && (
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-color)',
            opacity: isScrolled ? 0 : 0.8,
            visibility: isScrolled ? 'hidden' : 'visible',
            transition: 'all 0.3s ease-in-out',
            marginTop: '-2px'
          }}>
            {lang === 'en' ? 'Welcome back! ' : 'Balik-loob! '}
            <strong style={{ color: 'var(--primary-color, #ff6b6b)' }}>
              {user.user_metadata?.username || user.email.split('@')[0]}
            </strong>
          </span>
        )}
      </div>

      {/* GITNA: NAVIGATION LINKS (Awtomatikong itatago kapag `isScrolled === true`) */}
      <nav style={{ 
        display: 'flex', 
        gap: '1.2rem', 
        alignItems: 'center',
        opacity: isScrolled ? 0 : 1, // Naglalaho kapag nag-scroll down
        visibility: isScrolled ? 'hidden' : 'visible', // Inaalis ang click-ability kapag tago
        maxHeight: isScrolled ? '0px' : '100px', // Binabawi ang space para hindi mag-overlap
        transform: isScrolled ? 'translateY(-10px)' : 'translateY(0)', // May kaunting pag-angat effect habang nawawala
        transition: 'all 0.3s ease-in-out',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={() => setActiveTab('home')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'home' ? 'var(--primary-color)' : 'var(--text-color)',
            fontWeight: activeTab === 'home' ? '800' : '500',
            fontSize: '0.95rem',
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
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: '0.3s'
          }}
        >
          {lang === 'en' ? 'Bikes' : 'Mga Motor'}
        </button>

        {user && (
          <button 
            onClick={() => setActiveTab('dashboard')} 
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'dashboard' ? 'var(--primary-color)' : 'var(--text-color)',
              fontWeight: activeTab === 'dashboard' ? '800' : '500',
              fontSize: '0.95rem',
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
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: '0.3s'
          }}
        >
          {lang === 'en' ? 'About' : 'Tungkol'}
        </button>

        <button 
          onClick={() => setActiveTab('contact')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'contact' ? 'var(--primary-color)' : 'var(--text-color)',
            fontWeight: activeTab === 'contact' ? '800' : '500',
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: '0.3s'
          }}
        >
          {lang === 'en' ? 'Contact' : 'Kontak'}
        </button>
      </nav>

      {/* KANAN: CONTROLS & AUTHENTICATION (Kasama ring maglalaho para malinis ang screen sa mobile) */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.8rem',
        opacity: isScrolled ? 0 : 1,
        visibility: isScrolled ? 'hidden' : 'visible',
        maxHeight: isScrolled ? '0px' : '100px',
        transform: isScrolled ? 'translateY(-10px)' : 'translateY(0)',
        transition: 'all 0.3s ease-in-out',
        flexWrap: 'nowrap'
      }}>
        
        {/* LANG SWITCHER */}
        <button 
          onClick={toggleLang} 
          title={lang === 'en' ? 'Switch to Filipino' : 'Lumipat sa Ingles'}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            padding: '4px 10px',
            borderRadius: '20px',
            cursor: 'pointer',
            color: 'var(--text-color)',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            transition: 'all 0.3s'
          }}
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
            padding: '4px 10px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* AUTH SECTION */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handleLogout} 
              style={{
                background: 'rgba(255, 75, 75, 0.2)',
                color: '#ff4b4b',
                border: '1px solid #ff4b4b',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                transition: '0.3s'
              }}
            >
              {lang === 'en' ? 'Out' : 'Alis'}
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setAuthModalOpen(true)}
            style={{
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {lang === 'en' ? 'Login' : 'Pumasok'}
          </button>
        )}

      </div>
    </header>
  );
}