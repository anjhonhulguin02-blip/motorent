import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import useEscapeToClose from '../hooks/useEscapeToClose';
import useModalA11y from '../hooks/useModalA11y';

const specRowClass = "flex flex-col gap-0.5 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3";
const specLabelClass = "text-[0.68rem] text-brand-muted font-bold uppercase tracking-wider";
const specValueClass = "text-white font-semibold text-sm";

export default function MotorcycleDetailModal({ motor, isOpen, onClose, isRented, onRentClick, resolvedImage }) {
  useEscapeToClose(isOpen && !!motor, onClose);
  const dialogRef = useRef(null);
  useModalA11y(isOpen && !!motor, dialogRef);

  if (!isOpen || !motor) return null;

  const displayImg = motor.image_url || resolvedImage;

  // Only real, admin-entered specs are shown — a field with no verified
  // value is left out entirely rather than filled with a placeholder.
  const specs = [
    { label: 'Engine', value: motor.engine_size },
    { label: 'Transmission', value: motor.transmission },
    { label: 'Fuel Capacity', value: motor.fuel_capacity },
    { label: 'Weight', value: motor.weight }
  ].filter((s) => s.value);

  const rates = [
    { label: '24 Hours', value: motor.rate_24hr },
    { label: '12 Hours', value: motor.rate_12hr },
    { label: '6 Hours', value: motor.rate_6hr },
    { label: 'Per Hour', value: motor.rate_1hr }
  ];

  return createPortal(
    <div className="fixed inset-0 bg-[rgba(15,23,42,0.85)] backdrop-blur-md flex items-center justify-center z-[100000] p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${motor.name} details`}
        className="bg-brand-bg/95 backdrop-blur-xl border-2 border-brand-primary/40 rounded-3xl w-full max-w-[600px] relative box-border shadow-[0_0_0_1px_rgba(234,169,116,0.04),0_25px_50px_-12px_rgba(0,0,0,0.6),0_0_60px_-15px_rgba(234,169,116,0.15)] max-h-[90vh] overflow-y-auto animate-[fadeInEffect_0.25s_ease-out] outline-none"
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-5 right-5 z-10 bg-black/40 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center border-none text-white text-xl cursor-pointer hover:bg-black/60 transition-colors">✕</button>

        <div className="relative w-full aspect-[16/9] bg-white/[0.03] overflow-hidden">
          {displayImg ? (
            <img src={displayImg} alt={motor.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">🏍️</div>
          )}
          {isRented && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-lg text-[0.7rem] font-black uppercase shadow-lg">
              🚫 Rented Out
            </div>
          )}
        </div>

        <div className="p-7 sm:p-8 flex flex-col gap-5">
          <div>
            <h3 className="font-display text-2xl sm:text-3xl text-white font-bold mb-1">{motor.name}</h3>
            {motor.tagline && (
              <p className="text-brand-primary text-sm font-semibold italic">{motor.tagline}</p>
            )}
          </div>

          {motor.description && (
            <p className="text-sm text-slate-300 leading-relaxed m-0">{motor.description}</p>
          )}

          {specs.length > 0 && (
            <div>
              <span className="eyebrow block mb-2">Specifications</span>
              <div className="grid grid-cols-2 gap-2.5">
                {specs.map((s) => (
                  <div key={s.label} className={specRowClass}>
                    <span className={specLabelClass}>{s.label}</span>
                    <span className={specValueClass}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="eyebrow block mb-2">Rental Rates</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {rates.map((r) => (
                <div key={r.label} className="bg-brand-primary/[0.06] border border-brand-primary/20 rounded-xl px-3 py-3 text-center">
                  <div className="text-brand-muted text-[0.68rem] font-bold uppercase tracking-wider mb-1">{r.label}</div>
                  <div className="text-brand-primary font-extrabold text-lg">₱{r.value}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              if (isRented) return;
              onClose();
              onRentClick(motor);
            }}
            disabled={isRented}
            className={`w-full border-none py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide mt-1 ${
              isRented
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'btn-primary cursor-pointer'
            }`}
          >
            {isRented ? 'Rented Out / Unavailable' : 'Rent Now'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
