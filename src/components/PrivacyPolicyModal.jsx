import { useRef } from 'react';
import { createPortal } from 'react-dom';
import useEscapeToClose from '../hooks/useEscapeToClose';
import useModalA11y from '../hooks/useModalA11y';

const sectionTitleClass = "font-display text-white font-bold text-base mt-5 mb-2";
const paraClass = "text-sm text-slate-300 leading-relaxed m-0 mb-2";

export default function PrivacyPolicyModal({ isOpen, onClose }) {
  useEscapeToClose(isOpen, onClose);
  const dialogRef = useRef(null);
  useModalA11y(isOpen, dialogRef);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-[rgba(15,23,42,0.85)] backdrop-blur-md flex items-center justify-center z-[100002] p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Privacy notice"
        className="bg-brand-bg/95 backdrop-blur-xl border-2 border-brand-primary/40 rounded-3xl w-full max-w-[560px] p-7 sm:p-8 relative box-border max-h-[85vh] overflow-y-auto animate-[fadeInEffect_0.25s_ease-out] outline-none"
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-5 right-5 bg-none border-none text-brand-muted text-2xl cursor-pointer hover:text-white transition-colors">✕</button>

        <h3 className="font-display m-0 mb-1 text-2xl text-white font-bold">Privacy Notice</h3>
        <p className="text-brand-muted text-sm mb-1">What we collect, and why — in plain language.</p>

        <p className={sectionTitleClass}>What we collect</p>
        <p className={paraClass}>
          Account details (full name, username, email, phone number), booking details (motorcycle, rental duration, payment method, amounts), a screenshot of your GCash/Maya payment when you pay via e-wallet, and a photo of your government-issued ID or driver's license before pickup.
        </p>

        <p className={sectionTitleClass}>Why we collect it</p>
        <p className={paraClass}>
          To process and manage your booking, verify your identity before releasing a motorcycle, prevent fraud, and resolve disputes if something goes wrong with a rental.
        </p>

        <p className={sectionTitleClass}>Who can see it</p>
        <p className={paraClass}>
          Only you and MotoRent staff/admin can access your booking and account data — this is enforced at the database level, not just hidden in the app. Motorcycle catalog and rates are public; your personal details are not.
        </p>

        <p className={sectionTitleClass}>Where it's stored</p>
        <p className={paraClass}>
          Your data is stored with Supabase, our cloud database and file storage provider.
        </p>

        <p className={sectionTitleClass}>Your options</p>
        <p className={paraClass}>
          To request access to, correction of, or deletion of your data, contact us directly — see the Contact page for our phone, email, and Facebook page.
        </p>

        <p className="text-[0.72rem] text-slate-500 leading-relaxed mt-5 pt-4 border-t border-white/10">
          This notice is provided for transparency about our own data practices. It is not legal advice and does not by itself guarantee compliance with the Philippines' Data Privacy Act of 2012 or any other applicable law. Consult a qualified lawyer for a legally reviewed privacy policy.
        </p>
      </div>
    </div>,
    document.body
  );
}
