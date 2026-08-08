import React, { useState, useEffect } from 'react';
import PrivacyPolicyModal from './PrivacyPolicyModal';

const STORAGE_KEY = 'motorent_consent_ack_v1';

export default function ConsentBanner({ lang }) {
  const [visible, setVisible] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch (e) {
      setVisible(true);
    }
  }, []);

  const acknowledge = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div
        role="region"
        aria-label="Privacy notice"
        className="fixed bottom-0 left-0 right-0 z-[99998] bg-brand-bg/97 backdrop-blur-xl border-t border-brand-primary/25 px-5 py-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-5"
      >
        <p className="m-0 text-[0.8rem] text-slate-300 leading-relaxed flex-1 text-center sm:text-left">
          {lang === 'en'
            ? 'MotoRent collects your name, contact info, government ID, and payment proof to process bookings and verify identity before pickup.'
            : 'Kinukuha ng MotoRent ang iyong pangalan, contact info, gov ID, at patunay ng bayad para iproseso ang booking at i-verify ang pagkakakilanlan bago mag-pickup.'}
          {' '}
          <button onClick={() => setPrivacyOpen(true)} className="bg-transparent border-none p-0 text-brand-primary underline cursor-pointer text-[0.8rem] font-semibold">
            {lang === 'en' ? 'Learn more' : 'Alamin pa'}
          </button>
        </p>
        <button
          onClick={acknowledge}
          className="btn-primary px-5 py-2.5 text-sm shrink-0 whitespace-nowrap"
        >
          {lang === 'en' ? 'Got it' : 'Nakuha ko'}
        </button>
      </div>

      <PrivacyPolicyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </>
  );
}
