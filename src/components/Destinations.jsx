import { useState, useEffect, useCallback, useRef } from 'react';

import baguioImg from '../assets/Places/Baguio.jpg';
import balerImg from '../assets/Places/Baler.jpg';
import dingalanImg from '../assets/Places/Dingalan.jpeg';
import pagudpudImg from '../assets/Places/Pagudpud.jpg';
import tagaytayImg from '../assets/Places/TAGAYTAY.jpg';
import viganImg from '../assets/Places/Vigan.jpg';

const DESTINATIONS = [
  { id: 1, name: 'BAGUIO CITY', desc: 'Navigate the misty, winding mountain passes and feel the crisp breeze of the City of Pines.', img: baguioImg },
  { id: 2, name: 'BALER, AURORA', desc: 'Ride where the Sierra Madre meets the Pacific waves in the ultimate coastal surf capital.', img: balerImg },
  { id: 3, name: 'DINGALAN', desc: 'Explore the rugged "Batanes of the East" and witness breathtaking cliffside ocean views.', img: dingalanImg },
  { id: 4, name: 'PAGUDPUD', desc: 'Cruise the northernmost paradise through the iconic Patapat Viaduct and white sand shores.', img: pagudpudImg },
  { id: 5, name: 'TAGAYTAY RIDGE', desc: 'A classic smooth ridge ride with the majestic silhouette of Taal Volcano as your backdrop.', img: tagaytayImg },
  { id: 6, name: 'VIGAN HERITAGE', desc: 'Time-travel on two wheels through the historic cobblestone streets and Spanish-era architecture.', img: viganImg }
];

export default function Destinations({ lang }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % DESTINATIONS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + DESTINATIONS.length) % DESTINATIONS.length);
  }, []);

  // Auto-advance pauses on hover/focus and is skipped for reduced-motion users,
  // so the carousel can always be stopped (WCAG 2.2).
  useEffect(() => {
    if (isPaused) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
    touchStartX.current = null;
  };

  return (
    <section className="w-full flex flex-col items-center bg-brand-bg box-border px-4 sm:px-8 pb-20">
      <div className="w-full max-w-[1240px]">
        <div className="mb-7">
          <span className="eyebrow block mb-2">Where You Can Ride</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white m-0 tracking-tight text-balance">
            Popular <span className="text-brand-primary">Destinations</span>
          </h2>
          <p className="text-brand-muted mt-2 mb-0 text-sm sm:text-base max-w-[560px] leading-relaxed">
            {lang === 'en'
              ? 'Riders take our units well beyond Bulacan — here are a few routes worth the trip.'
              : 'Malayo ang naaabot ng mga umaarkila sa amin — ilan ito sa mga rutang sulit puntahan.'}
          </p>
        </div>

        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
          className="relative w-full h-[300px] sm:h-[420px] bg-[#090d16] rounded-[24px] overflow-hidden border border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
        >
          <div
            className="flex w-full h-full transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {DESTINATIONS.map((dest, index) => (
              <div key={dest.id} className="shrink-0 w-full h-full relative">
                <img
                  src={dest.img}
                  alt={dest.name}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050811] from-0% via-[rgba(5,8,17,0.1)] via-60% to-transparent to-100% pointer-events-none" />
                <div className="absolute bottom-8 left-6 sm:left-8 right-6 sm:right-8 z-[5]">
                  <h3 className="font-display text-white m-0 mb-1.5 text-xl sm:text-3xl font-bold tracking-tight">{dest.name}</h3>
                  <p className="text-slate-300 m-0 text-[0.82rem] sm:text-sm leading-snug max-w-[90%]">{dest.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-7 right-6 sm:right-8 flex gap-1 z-10 items-center">
            {DESTINATIONS.map((dest, index) => (
              <button
                key={dest.id}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Show ${dest.name}`}
                aria-current={index === currentSlide}
                className="p-2.5 bg-transparent border-none cursor-pointer group"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-400 ${
                    index === currentSlide
                      ? 'w-6 bg-brand-primary shadow-[0_0_12px_#eaa974]'
                      : 'w-1.5 bg-white/20 group-hover:bg-white/40'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
