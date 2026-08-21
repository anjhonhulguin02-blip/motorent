import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mainWebsiteBg from '../assets/BG.jpg';
import { supabase } from '../supabaseClient';

// 🏍️ Background-removed product shots — used for the hero showcase only, so the
// bike reads as floating on the dark panel. The originals (white studio backdrop)
// are still what the catalogue and dashboards use.
import nmaxCut from '../assets/Bikes/cutout/nmaxv3.png';
import aeroxCut from '../assets/Bikes/cutout/aeroxv3.png';
import clickCut from '../assets/Bikes/cutout/click125.png';
import beatCut from '../assets/Bikes/cutout/beat.png';
import fazzioCut from '../assets/Bikes/cutout/fazzio.png';
import mioCut from '../assets/Bikes/cutout/mio i 125.png';

function getCutoutImage(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('nmax')) return nmaxCut;
  if (n.includes('aerox')) return aeroxCut;
  if (n.includes('click')) return clickCut;
  if (n.includes('beat')) return beatCut;
  if (n.includes('fazzio')) return fazzioCut;
  if (n.includes('mio')) return mioCut;
  return null;
}

// Real, verified rental terms — these mirror the policies on the Guidelines page.
const TRUST_POINTS = [
  { label: 'No Mileage Limit', icon: 'road' },
  { label: 'Helmet Included', icon: 'helmet' },
  { label: 'Hourly to Full-Day', icon: 'clock' },
  { label: 'Norzagaray Pickup', icon: 'pin' }
];

function TrustIcon({ type }) {
  const common = {
    width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
    'aria-hidden': true, className: 'shrink-0'
  };
  if (type === 'road') return <svg {...common}><path d="M4 20 8 4M20 20 16 4M12 5v3M12 11v3M12 17v3" /></svg>;
  if (type === 'helmet') return <svg {...common}><path d="M3 14a9 9 0 0 1 18 0v2a2 2 0 0 1-2 2h-6l-3 3v-3H5a2 2 0 0 1-2-2Z" /><path d="M8 14h13" /></svg>;
  if (type === 'clock') return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  return <svg {...common}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
}

export default function Hero({ lang }) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fleetModels, setFleetModels] = useState([]);
  const [bikeStats, setBikeStats] = useState({});
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  // 📡 Live fleet + booking counts, so the hero ranking reflects what people
  // have actually rented rather than a hardcoded "featured" list.
  useEffect(() => {
    async function fetchFleetAndStats() {
      try {
        setIsLoadingStats(true);
        const [{ data: motors, error: motorsError }, { data: bookings, error: bookingsError }] = await Promise.all([
          supabase.from('motorcycles').select('*'),
          supabase.from('booking_activity').select('motorcycle_name')
        ]);

        if (motorsError) console.error('Supabase Query Error:', motorsError.message);
        if (bookingsError) console.error('Supabase Query Error:', bookingsError.message);

        setFleetModels(motors || []);

        if (motors && bookings) {
          const counts = {};
          motors.forEach((motor) => {
            const motorName = (motor.name || '').toLowerCase().trim();
            counts[motor.id] = bookings.filter(
              (b) => b.motorcycle_name?.toLowerCase().trim() === motorName
            ).length;
          });
          setBikeStats(counts);
        }
      } catch (err) {
        console.error('System Error during fetch:', err);
      } finally {
        setIsLoadingStats(false);
      }
    }
    fetchFleetAndStats();
  }, []);

  // 🏆 Top 3 most-booked units — the hero's rank number refers to this order.
  const topThree = [...fleetModels]
    .sort((a, b) => (bikeStats[b.id] || 0) - (bikeStats[a.id] || 0))
    .slice(0, 3);

  const slideCount = topThree.length;
  const activeBike = topThree[currentSlide] || null;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (slideCount === 0 ? 0 : (prev + 1) % slideCount));
  }, [slideCount]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (slideCount === 0 ? 0 : (prev - 1 + slideCount) % slideCount));
  }, [slideCount]);

  // Auto-advance, but pause on hover/focus and skip entirely for reduced-motion
  // users — auto-rotating content needs a way to stop (WCAG 2.2).
  useEffect(() => {
    if (slideCount < 2 || isPaused) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [slideCount, isPaused, nextSlide]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
    touchStartX.current = null;
  };

  const rankLabel = String(currentSlide + 1).padStart(2, '0');
  const activeCount = activeBike ? (bikeStats[activeBike.id] || 0) : 0;

  return (
    <section
      id="home"
      className="w-full min-h-screen flex flex-col justify-center items-center bg-brand-bg bg-cover bg-center bg-no-repeat relative box-border px-4 sm:px-8 pt-[120px] pb-10 overflow-hidden"
      style={{ backgroundImage: `url(${mainWebsiteBg})` }}
    >
      {/* Navy scrim over the background artwork. Without the old glass panels
          covering it, the raw BG image reads far too bright/blue for a hero the
          product shot has to sit on — this keeps the texture but restores the
          dark base the palette is built around. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(10,15,28,0.86) 0%, rgba(10,15,28,0.93) 55%, rgba(10,15,28,0.97) 100%)' }}
      />

      {/* Ambient copper depth — the reference's warm bloom, in MotoRent's palette */}
      <div className="absolute top-[6%] left-[10%] w-[520px] h-[520px] rounded-full bg-brand-primary/10 blur-[130px] pointer-events-none animate-[ambientDrift_16s_ease-in-out_infinite]" />
      <div className="absolute bottom-[2%] right-[6%] w-[420px] h-[420px] rounded-full bg-brand-primary/[0.07] blur-[120px] pointer-events-none animate-[ambientDrift_20s_ease-in-out_infinite_reverse]" />

      <div className="relative w-full max-w-[1240px] z-20 animate-[fadeLoadIn_1s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <div
          className="relative grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] gap-8 lg:gap-6 items-center"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
        >
          {/* ── Giant rank numeral: the slide's position in the most-booked ranking */}
          <span
            aria-hidden="true"
            className="pointer-events-none select-none absolute right-0 bottom-[-2rem] lg:bottom-[-3rem] font-display font-black leading-none text-[9rem] sm:text-[13rem] lg:text-[16rem] text-white/[0.035] tracking-tighter"
          >
            {rankLabel}
          </span>

          {/* ══ LEFT: product shot ══ */}
          <div className="relative flex items-center justify-center order-1">
            {/* Rank dots — vertical rail, matching the reference's left edge */}
            {slideCount > 1 && (
              <div className="absolute left-0 lg:-left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-20">
                {topThree.map((bike, index) => (
                  <button
                    key={bike.id}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Show #${index + 1} most booked: ${bike.name}`}
                    aria-current={index === currentSlide}
                    className="p-2.5 bg-transparent border-none cursor-pointer group"
                  >
                    <span
                      className={`block rounded-full transition-all duration-500 ${
                        index === currentSlide
                          ? 'w-1.5 h-7 bg-brand-primary shadow-[0_0_12px_rgba(234,169,116,0.6)]'
                          : 'w-1.5 h-1.5 bg-white/25 group-hover:bg-white/50'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}

            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative w-full aspect-[4/3] max-h-[440px] flex items-center justify-center"
            >
              {/* Elliptical ground glow, standing in for the studio shadow we stripped */}
              <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-[62%] h-[10%] rounded-[50%] bg-brand-primary/20 blur-[38px] pointer-events-none" />

              {isLoadingStats || !activeBike ? (
                <div className="w-[70%] h-[60%] rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
              ) : (
                /* All three slides sit above the fold and auto-advance every 6s,
                   so they are loaded normally rather than lazily — lazy-loading
                   them just causes a visible pop-in when the carousel turns. */
                topThree.map((bike, index) => (
                  <img
                    key={bike.id}
                    src={getCutoutImage(bike.name) || bike.image_url}
                    alt={`${bike.name} — #${index + 1} most booked at MotoRent`}
                    fetchPriority={index === 0 ? 'high' : 'low'}
                    className={`absolute inset-0 w-full h-full object-contain drop-shadow-[0_28px_36px_rgba(0,0,0,0.55)] transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      index === currentSlide
                        ? 'opacity-100 scale-100 translate-x-0'
                        : 'opacity-0 scale-95 translate-x-4 pointer-events-none'
                    }`}
                    style={{
                      // Fades the last sliver so any leftover contact shadow from
                      // the original photo can't read as a grey smudge on navy.
                      maskImage: 'linear-gradient(to bottom, black 88%, transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, black 88%, transparent 100%)'
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* ══ RIGHT: the pitch ══ */}
          <div className="relative flex flex-col items-start order-2 lg:pl-2">
            <span className="flex items-center gap-3 mb-5">
              <span className="w-9 h-px bg-brand-primary" aria-hidden="true" />
              <span className="eyebrow">
                {activeBike ? `#${rankLabel} Most Booked` : 'Norzagaray · Bulacan'}
              </span>
            </span>

            <h1 className="font-display text-[clamp(2.25rem,4.4vw,3.55rem)] font-bold text-white leading-[1.05] m-0 mb-5 tracking-[-0.03em]">
              Premium Motorcycle<br className="hidden sm:block" /> Rental in <span className="text-brand-primary">Norzagaray</span>
            </h1>

            <p className="text-brand-muted m-0 mb-8 text-[0.98rem] leading-relaxed max-w-[430px]">
              {lang === 'en'
                ? 'Well-maintained units, transparent rates, and no mileage limit — book by the hour, half-day, or full day.'
                : 'Maayos na mga unit, malinaw na presyo, at walang mileage limit — umarkila kada oras, kalahating araw, o buong araw.'}
            </p>

            {/* Hand-drawn flourish, echoing the reference's squiggle */}
            <svg
              aria-hidden="true"
              viewBox="0 0 120 46"
              className="hidden lg:block absolute right-2 top-[38%] w-28 text-brand-primary/25 pointer-events-none"
              fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
            >
              <path d="M2 30c22-6 38 8 54 2S92 6 100 14s-6 24-14 18 8-26 32-24" />
            </svg>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-9">
              <button
                onClick={() => navigate('/bikes')}
                className="btn-primary px-8 py-3.5 text-[0.95rem] rounded-full"
              >
                {lang === 'en' ? 'Rent Now' : 'Arkila Na'}
              </button>

              <button
                onClick={() => navigate('/contact')}
                className="group flex items-center gap-2.5 bg-transparent border-none text-white text-[0.92rem] font-semibold cursor-pointer px-1 py-2"
              >
                <span className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center transition-colors duration-300 group-hover:border-brand-primary/60 group-hover:bg-brand-primary/10">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
                  </svg>
                </span>
                <span className="group-hover:text-brand-primary transition-colors duration-300">
                  {lang === 'en' ? 'Contact us' : 'Kontakin kami'}
                </span>
              </button>
            </div>

            {/* Which unit is on display, plus its real booking count */}
            {activeBike && (
              <div className="flex items-baseline gap-3 min-h-[1.6rem]">
                <span className="font-display text-white text-lg font-bold">{activeBike.name}</span>
                <span className="text-brand-muted text-[0.78rem]">
                  ₱{activeBike.rate_24hr}/day · {activeCount} {activeCount === 1 ? 'booking' : 'bookings'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ══ Trust strip — the reference's logo bar, carrying real rental terms ══ */}
        <div className="mt-10 lg:mt-14 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.07] px-5 sm:px-8 py-4 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3.5">
          {TRUST_POINTS.map((point) => (
            <div key={point.label} className="flex items-center gap-2.5 text-brand-muted">
              <span className="text-brand-primary"><TrustIcon type={point.icon} /></span>
              <span className="text-[0.78rem] sm:text-[0.82rem] font-semibold tracking-wide text-slate-300">
                {point.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
