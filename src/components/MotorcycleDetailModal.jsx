import { useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import useEscapeToClose from '../hooks/useEscapeToClose';
import useModalA11y from '../hooks/useModalA11y';

const SPEC_ICONS = {
  engine: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  ),
  transmission: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3v18M18 3v18M6 8h12M6 15h12" />
      <circle cx="6" cy="3" r="1.6" /><circle cx="18" cy="3" r="1.6" />
    </svg>
  ),
  fuel: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.7s5 5 5 8.8a5 5 0 0 1-10 0c0-3.8 5-8.8 5-8.8Z" />
    </svg>
  ),
  weight: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 21h16L18 8H6L4 21Z" />
      <circle cx="12" cy="5" r="2.2" />
    </svg>
  )
};

// "Yamaha NMAX V3" -> brand line + model line, matching how the reference
// separates the marque from the model.
function splitName(name) {
  const parts = String(name || '').trim().split(' ');
  if (parts.length < 2) return { brand: '', model: name || '' };
  return { brand: parts[0], model: parts.slice(1).join(' ') };
}

function BikeGlyph({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5.5" cy="17" r="3.5" /><circle cx="18.5" cy="17" r="3.5" />
      <path d="M5.5 17h5l4-8h-3M14 5h3l1.5 12" />
    </svg>
  );
}

export default function MotorcycleDetailModal({
  motor, isOpen, onClose, isRented, onRentClick, resolvedImage,
  tier, rating, reviewCount, originRect
}) {
  useEscapeToClose(isOpen && !!motor, onClose);
  const dialogRef = useRef(null);
  const imgRef = useRef(null);
  useModalA11y(isOpen && !!motor, dialogRef);

  // Shared-element expand: the unit photo starts exactly where its catalogue
  // card left it, then settles into place — so the detail view reads as the
  // card growing open rather than a separate panel appearing over it.
  useLayoutEffect(() => {
    if (!isOpen || !originRect || !imgRef.current) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const el = imgRef.current;
    const last = el.getBoundingClientRect();
    if (!last.width || !last.height) return;

    const dx = (originRect.left + originRect.width / 2) - (last.left + last.width / 2);
    const dy = (originRect.top + originRect.height / 2) - (last.top + last.height / 2);
    const scale = Math.min(originRect.width / last.width, originRect.height / last.height);

    el.style.transition = 'none';
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

    let played = false;
    const play = () => {
      if (played || !imgRef.current) return;
      played = true;
      el.style.transition = 'transform 460ms cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transform = 'none';
    };
    // rAF normally lands on the next paint; the timeout covers a background or
    // non-compositing tab, where rAF never fires and the photo would otherwise
    // stay stuck at its inverted start position.
    requestAnimationFrame(play);
    const t = setTimeout(play, 60);
    return () => clearTimeout(t);
  }, [isOpen, originRect]);

  if (!isOpen || !motor) return null;

  const displayImg = motor.image_url || resolvedImage;
  const { brand, model } = splitName(motor.name);

  const specs = [
    { key: 'engine', label: 'Engine', value: motor.engine_size },
    { key: 'weight', label: 'Weight', value: motor.weight },
    { key: 'fuel', label: 'Fuel', value: motor.fuel_capacity },
    { key: 'transmission', label: 'Gearbox', value: motor.transmission }
  ].filter((s) => s.value);

  const rates = [
    { label: 'Per hour', value: motor.rate_1hr, column: 'rate_1hr' },
    { label: '6 hours', value: motor.rate_6hr, column: 'rate_6hr' },
    { label: '12 hours', value: motor.rate_12hr, column: 'rate_12hr' },
    { label: '24 hours', value: motor.rate_24hr, column: 'rate_24hr' }
  ];

  const activeColumn = tier?.column || 'rate_24hr';
  const barPrice = motor[activeColumn];

  return createPortal(
    <div
      className="fixed inset-0 bg-[rgba(5,8,16,0.86)] backdrop-blur-md flex items-end sm:items-center justify-center z-[100000] sm:p-4 animate-[fadeInEffect_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${motor.name} details`}
        className="bg-brand-bg border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-[560px] relative box-border shadow-[0_-10px_60px_-15px_rgba(0,0,0,0.8),0_25px_50px_-12px_rgba(0,0,0,0.6)] max-h-[92vh] flex flex-col outline-none"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 bg-white/[0.06] backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center border border-white/10 text-white cursor-pointer hover:bg-white/[0.12] transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="overflow-y-auto flex-1">
          {/* Unit photo — the element that carries over from the card */}
          <div className="relative w-full aspect-[16/10] flex items-center justify-center overflow-hidden">
            <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 w-[50%] h-[9%] rounded-[50%] bg-brand-primary/25 blur-[32px] pointer-events-none" />
            {displayImg ? (
              <img
                ref={imgRef}
                src={displayImg}
                alt={motor.name}
                className={`relative max-w-full max-h-full object-contain p-6 will-change-transform ${isRented ? 'grayscale opacity-45' : ''}`}
                style={{
                  // Softens the last sliver, where a faint contact shadow from
                  // the original studio photo can survive the cutout.
                  maskImage: 'linear-gradient(to bottom, black 92%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 92%, transparent 100%)'
                }}
              />
            ) : (
              <div className="text-brand-muted/40"><BikeGlyph /></div>
            )}

            {isRented && (
              <span className="absolute top-4 left-4 flex items-center gap-1.5 bg-brand-bg/80 backdrop-blur-sm text-slate-300 border border-white/10 px-2.5 py-1.5 rounded-lg text-[0.68rem] font-bold uppercase tracking-wide">
                Out on rental
              </span>
            )}
          </div>

          <div className="px-6 sm:px-8 pb-6 flex flex-col gap-6">
            {/* Marque, model, and what people who rented it thought */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  {brand && (
                    <p className="text-brand-muted text-[0.68rem] font-bold uppercase tracking-[0.2em] m-0 mb-1">{brand}</p>
                  )}
                  <h2 className="font-display text-2xl sm:text-[1.75rem] text-white font-bold m-0 leading-tight">{model}</h2>
                </div>
                {reviewCount > 0 && (
                  <div className="flex items-center gap-1.5 shrink-0 pt-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-brand-primary" aria-hidden="true">
                      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
                    </svg>
                    <span className="text-white text-sm font-bold tabular-nums">{rating}</span>
                    <span className="text-brand-muted text-[0.75rem] tabular-nums">({reviewCount})</span>
                  </div>
                )}
              </div>
              {motor.description && (
                <p className="text-[0.88rem] text-slate-300 leading-relaxed m-0 mt-3">{motor.description}</p>
              )}
            </div>

            {specs.length > 0 && (
              <div>
                <span className="eyebrow block mb-3">Specifications</span>
                {/* Each label is pinned to the bottom of its tile, so the row
                    stays aligned even when one value wraps to two lines. */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {specs.map((s) => (
                    <div key={s.key} className="flex flex-col items-center text-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-2 py-3.5">
                      <span className="text-brand-primary">{SPEC_ICONS[s.key]}</span>
                      <span className="text-white font-bold text-[0.8rem] leading-tight">{s.value}</span>
                      <span className="text-brand-muted text-[0.63rem] font-semibold uppercase tracking-wider mt-auto pt-0.5">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="eyebrow block mb-3">All rental rates</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {rates.map((r) => {
                  const active = r.column === activeColumn;
                  return (
                    <div
                      key={r.column}
                      className={`rounded-2xl px-3 py-3 text-center border transition-colors ${
                        active
                          ? 'bg-brand-primary/12 border-brand-primary/45'
                          : 'bg-white/[0.02] border-white/[0.06]'
                      }`}
                    >
                      <div className="text-brand-muted text-[0.62rem] font-bold uppercase tracking-wider mb-1">{r.label}</div>
                      <div className={`font-extrabold text-base tabular-nums ${active ? 'text-brand-primary' : 'text-slate-300'}`}>
                        {r.value ? `₱${Number(r.value).toLocaleString()}` : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Price and the one action, pinned so it stays reachable while scrolling */}
        <div className="shrink-0 flex items-center gap-4 px-6 sm:px-8 py-4 border-t border-white/[0.08] bg-brand-surface/40 backdrop-blur-xl rounded-b-3xl">
          <div className="min-w-0">
            <div className="font-display text-xl font-extrabold text-brand-primary tabular-nums leading-none">
              {barPrice ? `₱${Number(barPrice).toLocaleString()}` : '—'}
            </div>
            <div className="text-brand-muted text-[0.7rem] mt-1">{tier?.full || 'for 24 hours'}</div>
          </div>
          <button
            onClick={() => { if (isRented) return; onClose(); onRentClick(motor); }}
            disabled={isRented}
            className={`ml-auto shrink-0 border-none px-7 py-3.5 rounded-full font-bold text-[0.85rem] ${
              isRented ? 'bg-white/[0.05] text-slate-500 cursor-not-allowed' : 'btn-primary cursor-pointer'
            }`}
          >
            {isRented ? 'Unavailable' : 'Rent Now'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
