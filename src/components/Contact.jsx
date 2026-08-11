import React, { useState } from 'react';
import mainWebsiteBg from '../assets/BG.jpg';
import PrivacyPolicyModal from './PrivacyPolicyModal';

export default function Contact({ lang }) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=TOMMY+STORE+Minuyan+Norzagaray+Bulacan";

  return (
    <section
      id="contact"
      className="w-full min-h-[60vh] flex flex-col items-center bg-[#0f172a] bg-cover bg-center bg-no-repeat box-border relative px-4 pb-40 pt-0"
      style={{ backgroundImage: `url(${mainWebsiteBg})` }}
    >
      <div className="glass-panel relative top-[130px] border-2 max-w-[1000px] w-full p-6 sm:p-14 box-border z-20 mb-16">

        <div className="text-center mb-12">
          <span className="eyebrow block mb-2">We're Here to Help</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2 tracking-wide text-balance">
            Contact <span className="text-brand-primary">Us</span>
          </h2>
          <p className="text-slate-300 text-base m-0">
            {lang === 'en'
              ? "Have questions or ready to pick up? Get in touch with us directly."
              : "May mga katanungan o kukunin na ang motor? Direktang makipag-ugnayan sa amin."}
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-10 w-full">

          {/* Card 1: Hotline & Socials */}
          <div className="glass-card p-8 text-left">
            <h3 className="font-display text-xl font-bold text-brand-primary mb-5">
              {lang === 'en' ? 'Hotline & Socials' : 'Hotline at Socials'}
            </h3>

            <div className="flex flex-col gap-3">
              <p className="text-white text-base font-bold m-0">
                👤 Contact Person: <span className="font-normal text-slate-300">Anjhon Hulguin</span>
              </p>
              <p className="text-white text-base font-bold m-0">
                📞 Phone: <span className="font-normal text-slate-300">09708560510</span>
              </p>
              <p className="text-white text-base font-bold m-0">
                💬 Facebook: <span className="font-normal text-slate-300">MotoRent Bulacan</span>
              </p>
              <p className="text-white text-base font-bold m-0">
                ✉️ Email: <span className="font-normal text-slate-300">anjhon.hulguin02@gmail.com</span>
              </p>
            </div>
          </div>

          {/* Card 2: Our Hub Location */}
          <div className="glass-card p-8 text-left">
            <h3 className="font-display text-xl font-bold text-brand-primary mb-5">
              {lang === 'en' ? 'Our Hub Location' : 'Lokasyon ng Aming Hub'}
            </h3>
            <p className="text-slate-300 text-[0.95rem] leading-normal mb-2">
              #1816 Saint Peter st., Marlane Subdivision, Minuyan, Norzagaray Bulacan
            </p>
            <p className="text-sm font-bold text-brand-primary mb-8">
              📍 Waze / Maps: "TOMMY STORE"
            </p>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline w-full px-4 py-3 rounded-xl bg-white/5 text-white font-bold text-sm inline-block text-center box-border border border-white/10 uppercase tracking-wide transition-all duration-300 hover:bg-brand-primary hover:text-brand-bg hover:border-brand-primary hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-6px_rgba(234,169,116,0.4)]"
            >
              🗺️ {lang === 'en' ? 'Open in Google Maps' : 'Tingnan sa Google Maps'}
            </a>
          </div>

        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => setPrivacyOpen(true)}
            className="bg-transparent border-none text-brand-muted text-xs font-semibold underline cursor-pointer hover:text-brand-primary transition-colors"
          >
            🔒 {lang === 'en' ? 'Privacy Notice — what we collect & why' : 'Patakaran sa Privacy — ano ang kinukuha namin at bakit'}
          </button>
        </div>

      </div>

      <PrivacyPolicyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </section>
  );
}
