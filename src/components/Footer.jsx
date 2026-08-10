import React, { useState } from 'react';
import PrivacyPolicyModal from './PrivacyPolicyModal';

const linkClass = "bg-transparent border-none p-0 text-left text-brand-muted text-sm cursor-pointer hover:text-brand-primary transition-colors";
const headingClass = "font-display text-white text-sm font-bold uppercase tracking-wider mb-4";

export default function Footer({ lang, setActiveTab }) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=TOMMY+STORE+Minuyan+Norzagaray+Bulacan";
  const year = new Date().getFullYear();

  const goTo = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-[#0a0f1c] border-t border-white/[0.08] px-4 sm:px-8 pt-14 pb-8">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div>
          <div className="font-display text-white font-bold text-xl tracking-tight mb-3">
            MOTO<span className="text-brand-primary">RENT</span>
          </div>
          <p className="text-brand-muted text-sm leading-relaxed max-w-[240px]">
            {lang === 'en'
              ? 'Premium motorcycle rentals in Norzagaray, Bulacan. Ride now, explore more.'
              : 'Premium na pag-arkila ng motor sa Norzagaray, Bulacan. Sumakay na, mag-explore pa.'}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className={headingClass}>{lang === 'en' ? 'Quick Links' : 'Mga Link'}</h4>
          <div className="flex flex-col gap-2.5">
            <button onClick={() => goTo('home')} className={linkClass}>{lang === 'en' ? 'Home' : 'Home'}</button>
            <button onClick={() => goTo('bikes')} className={linkClass}>{lang === 'en' ? 'Bikes' : 'Mga Motor'}</button>
            <button onClick={() => goTo('about')} className={linkClass}>{lang === 'en' ? 'Guidelines' : 'Patnubay'}</button>
            <button onClick={() => goTo('reviews')} className={linkClass}>{lang === 'en' ? 'Reviews' : 'Mga Review'}</button>
            <button onClick={() => goTo('contact')} className={linkClass}>{lang === 'en' ? 'Contact' : 'Makipag-ugnayan'}</button>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 className={headingClass}>{lang === 'en' ? 'Contact' : 'Kontak'}</h4>
          <div className="flex flex-col gap-2.5 text-sm text-brand-muted">
            <p className="m-0">📞 09708560510</p>
            <p className="m-0">✉️ anjhon.hulguin02@gmail.com</p>
            <p className="m-0">💬 MotoRent Bulacan</p>
          </div>
        </div>

        {/* Location */}
        <div>
          <h4 className={headingClass}>{lang === 'en' ? 'Location' : 'Lokasyon'}</h4>
          <p className="text-sm text-brand-muted leading-relaxed mb-3">
            #1816 Saint Peter st., Marlane Subdivision, Minuyan, Norzagaray Bulacan
          </p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-primary font-semibold hover:underline"
          >
            🗺️ {lang === 'en' ? 'Open in Google Maps' : 'Tingnan sa Google Maps'}
          </a>
        </div>

      </div>

      <div className="max-w-[1200px] mx-auto mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-500 m-0">
          © {year} MotoRent Bulacan. {lang === 'en' ? 'All rights reserved.' : 'Lahat ng karapatan ay nakalaan.'}
        </p>
        <button
          onClick={() => setPrivacyOpen(true)}
          className="bg-transparent border-none text-xs text-slate-500 underline cursor-pointer hover:text-brand-primary transition-colors"
        >
          🔒 {lang === 'en' ? 'Privacy Notice' : 'Patakaran sa Privacy'}
        </button>
      </div>

      <PrivacyPolicyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </footer>
  );
}
