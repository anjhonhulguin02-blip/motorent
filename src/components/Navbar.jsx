import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import useEscapeToClose from '../hooks/useEscapeToClose';

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/bikes', label: 'Bikes' },
  { path: '/guidelines', label: 'Guidelines' },
  { path: '/reviews', label: 'Reviews' },
  { path: '/contact', label: 'Contact' }
];

export default function Navbar({ user, onAuthClick, isAdmin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

  useEscapeToClose(isMenuOpen, () => setIsMenuOpen(false));

  const goTo = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleBrandClick = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  const desktopLinkClass = (isActive) =>
    `relative px-4 py-2 rounded-lg text-sm font-semibold tracking-wide transition-colors duration-200 cursor-pointer ${
      isActive ? 'text-brand-primary' : 'text-white/85 hover:text-white'
    } after:content-[''] after:absolute after:left-4 after:right-4 after:-bottom-1 after:h-[2px] after:rounded-full after:bg-gradient-to-r after:from-brand-primary after:to-brand-primary-light after:transition-all after:duration-300 ${
      isActive ? 'after:opacity-100 after:scale-x-100' : 'after:opacity-0 after:scale-x-50'
    }`;

  const mobileLinkClass = (isActive) =>
    `w-full text-left block px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
      isActive ? 'bg-brand-primary/15 text-brand-primary' : 'text-white hover:bg-white/5'
    }`;

  return (
    <header
      className={`fixed top-0 left-0 w-full z-[99999] flex items-center justify-between px-6 lg:px-16 transition-all duration-500 ease-out ${
        isScrolled
          ? 'h-16 bg-brand-bg/90 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)]'
          : 'h-[76px] bg-gradient-to-b from-black/30 to-transparent border-b border-transparent'
      }`}
    >
      {/* Brand Logo */}
      <div
        onClick={handleBrandClick}
        className="font-display text-white font-bold text-2xl tracking-tight cursor-pointer select-none flex items-baseline gap-0.5"
      >
        MOTO<span className="text-brand-primary">RENT</span>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-1">
        {NAV_LINKS.map((link) => (
          <button key={link.path} onClick={() => goTo(link.path)} className={desktopLinkClass(location.pathname === link.path)}>
            {link.label}
          </button>
        ))}

        {user && !isAdmin && (
          <button onClick={() => goTo('/dashboard')} className={desktopLinkClass(location.pathname === '/dashboard')}>My Bookings</button>
        )}
        {user && isAdmin && (
          <button onClick={() => goTo('/admin')} className={`${desktopLinkClass(location.pathname === '/admin')} text-brand-primary`}>Admin Panel</button>
        )}
      </nav>

      {/* Right Side: greeting + auth + mobile menu */}
      <div className="flex items-center gap-3 lg:gap-6">
        {user && (
          <div className="text-sm font-semibold text-brand-muted leading-tight text-right">
            <span className="hidden lg:inline">Welcome back, </span>
            <span className="text-brand-primary font-extrabold">{displayName}!</span>
          </div>
        )}

        {/* Desktop auth button */}
        <div className="hidden lg:block">
          {user ? (
            <button
              onClick={handleLogout}
              className="border border-red-500/40 text-red-500 px-4 py-1.5 rounded-lg font-semibold text-sm transition-colors duration-200 hover:bg-red-500/10"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={onAuthClick}
              className="btn-primary px-5 py-2 text-sm"
            >
              Login / Register
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="relative lg:hidden" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-colors duration-200 hover:bg-white/10 hover:border-white/20"
          >
            <span className="text-lg">☰</span>
          </button>

          {isMenuOpen && (
            <div className="absolute top-[calc(100%+12px)] right-0 w-60 bg-brand-card/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 shadow-[0_25px_50px_-15px_rgba(0,0,0,0.7)] flex flex-col gap-1 z-[100000] animate-[fadeInEffect_0.2s_ease-out]">
              {NAV_LINKS.map((link) => (
                <button key={link.path} onClick={() => goTo(link.path)} className={mobileLinkClass(location.pathname === link.path)}>
                  {link.label}
                </button>
              ))}

              {user && !isAdmin && (
                <button onClick={() => goTo('/dashboard')} className={mobileLinkClass(location.pathname === '/dashboard')}>My Bookings</button>
              )}
              {user && isAdmin && (
                <button onClick={() => goTo('/admin')} className={mobileLinkClass(location.pathname === '/admin')}>Admin Dashboard</button>
              )}

              <div className="h-px bg-white/[0.08] my-1.5"></div>

              {user ? (
                <button onClick={handleLogout} className="w-full bg-red-500/15 text-red-500 border border-red-500/30 px-2.5 py-2.5 rounded-xl font-bold text-center">
                  Logout
                </button>
              ) : (
                <button onClick={() => { onAuthClick(); setIsMenuOpen(false); }} className="btn-primary w-full py-2.5 text-center">
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
