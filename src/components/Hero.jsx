import React, { useState, useEffect } from 'react';
import mainWebsiteBg from '../assets/BG.png';
import { supabase } from '../supabaseClient';

// 📸 LOCAL ASSETS IMPORT (Places folder)
import baguioImg from '../assets/Places/Baguio.jpg';
import balerImg from '../assets/Places/Baler.jpg';
import dingalanImg from '../assets/Places/Dingalan.jpeg';
import pagudpudImg from '../assets/Places/Pagudpud.jpg';
import tagaytayImg from '../assets/Places/TAGAYTAY.jpg';
import viganImg from '../assets/Places/Vigan.jpg';

// 🏍️ Local fallback photos — used only for motors without an admin-uploaded image_url
import nmaxImg from '../assets/Bikes/nmaxv3.jpg';
import aeroxImg from '../assets/Bikes/aeroxv3.jpg';
import clickImg from '../assets/Bikes/click125.jpg';
import beatImg from '../assets/Bikes/beat.jpg';
import fazzioImg from '../assets/Bikes/fazzio.png';
import mioiImg from '../assets/Bikes/mio i 125.jpg';

function getFallbackImage(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('nmax')) return nmaxImg;
  if (n.includes('aerox')) return aeroxImg;
  if (n.includes('click')) return clickImg;
  if (n.includes('beat')) return beatImg;
  if (n.includes('fazzio')) return fazzioImg;
  if (n.includes('mio')) return mioiImg;
  return null;
}

// Rank-based badge labels — describe the *position* (1st/2nd/3rd most booked),
// not a fixed per-bike label, so they stay accurate as booking counts shift.
const RANK_BADGES = ['TOP PERFORMANCE RIDE', 'MOST POPULAR CHOICE', 'BUDGET FRIENDLY CHOICE'];

const DESTINATIONS = [
  { id: 1, name: 'BAGUIO CITY', desc: 'Navigate the misty, winding mountain passes and feel the crisp breeze of the City of Pines.', img: baguioImg },
  { id: 2, name: 'BALER, AURORA', desc: 'Ride where the Sierra Madre meets the Pacific waves in the ultimate coastal surf capital.', img: balerImg },
  { id: 3, name: 'DINGALAN', desc: 'Explore the rugged "Batanes of the East" and witness breathtaking cliffside ocean views.', img: dingalanImg },
  { id: 4, name: 'PAGUDPUD', desc: 'Cruise the northernmost paradise through the iconic Patapat Viaduct and white sand shores.', img: pagudpudImg },
  { id: 5, name: 'TAGAYTAY RIDGE', desc: 'A classic smooth ridge ride with the majestic silhouette of Taal Volcano as your backdrop.', img: tagaytayImg },
  { id: 6, name: 'VIGAN HERITAGE', desc: 'Time-travel on two wheels through the historic cobblestone streets and Spanish-era architecture.', img: viganImg }
];

// 🛡️ SMART IMAGE FALLBACK COMPONENT
function BikeImage({ src, alt }) {
  const [isError, setIsError] = useState(!src);

  if (isError) {
    return (
      <div className="w-16 h-16 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-2xl shrink-0">
        🏍️
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setIsError(true)}
      className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
    />
  );
}

export default function Hero({ lang, setActiveTab }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  // 🏍️ LIVE FLEET + BOOKING STATS STATE
  const [fleetModels, setFleetModels] = useState([]);
  const [bikeStats, setBikeStats] = useState({});
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // 📡 REAL-TIME SUPABASE QUERY — pulls the live fleet catalog, then counts
  // how many bookings reference each motor by name to rank "Top Picks".
  useEffect(() => {
    async function fetchFleetAndStats() {
      try {
        setIsLoadingStats(true);

        const [{ data: motors, error: motorsError }, { data: bookings, error: bookingsError }] = await Promise.all([
          supabase.from('motorcycles').select('*'),
          supabase.from('booking_activity').select('motorcycle_name')
        ]);

        if (motorsError) console.error("Supabase Query Error:", motorsError.message);
        if (bookingsError) console.error("Supabase Query Error:", bookingsError.message);

        setFleetModels(motors || []);

        if (motors && bookings) {
          const counts = {};
          motors.forEach((motor) => {
            const motorName = (motor.name || '').toLowerCase();
            counts[motor.id] = bookings.filter(
              (b) => b.motorcycle_name?.toLowerCase().trim() === motorName
            ).length;
          });
          setBikeStats(counts);
        }
      } catch (err) {
        console.error("System Error during fetch:", err);
      } finally {
        setIsLoadingStats(false);
      }
    }

    fetchFleetAndStats();
  }, []);

  useEffect(() => {
    const autoSlide = setInterval(nextSlide, 6000);
    return () => clearInterval(autoSlide);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === DESTINATIONS.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? DESTINATIONS.length - 1 : prev - 1));
  };

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const touchEnd = e.touches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) { nextSlide(); setTouchStart(null); }
    if (diff < -50) { prevSlide(); setTouchStart(null); }
  };

  // ⚡ ROUTE TAB SWITCH AT SMOOTH SCROLL BACKUP
  const handleNavigationClick = (e) => {
    if (e) e.preventDefault();
    if (typeof setActiveTab === 'function') {
      setActiveTab('bikes');
    }
  };

  // 🏆 DYNAMIC SNEAK PEEK — top 3 most-booked motors from the live fleet
  const topThreeFleet = [...fleetModels]
    .sort((a, b) => (bikeStats[b.id] || 0) - (bikeStats[a.id] || 0))
    .slice(0, 3);

  return (
    <section
      id="home"
      className="w-full min-h-screen flex flex-col justify-center items-center bg-brand-bg bg-cover bg-center bg-no-repeat relative box-border p-4 sm:p-8 overflow-hidden"
      style={{ backgroundImage: `url(${mainWebsiteBg})` }}
    >
      <div className="absolute top-0 left-0 w-full h-[90px] bg-transparent z-10" />

      {/* Ambient depth glows */}
      <div className="absolute top-[10%] left-[5%] w-[420px] h-[420px] rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none animate-[ambientDrift_14s_ease-in-out_infinite]" />
      <div className="absolute bottom-[5%] right-[8%] w-[360px] h-[360px] rounded-full bg-brand-primary/[0.07] blur-[110px] pointer-events-none animate-[ambientDrift_18s_ease-in-out_infinite_reverse]" />

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 lg:gap-8 max-w-[1240px] w-full mt-[100px] lg:mt-[110px] mb-12 z-20 items-stretch animate-[fadeLoadIn_1s_cubic-bezier(0.16,1,0.3,1)_forwards]">

        {/* 🪟 LEFT DOMINANT COORDINATES PANEL */}
        <div className="glass-panel flex flex-col p-6 sm:p-10 gap-8 box-border transition-all duration-500 hover:border-brand-primary/40">
          <div>
            <span className="eyebrow block mb-3">Norzagaray · Bulacan</span>
            <h1 className="font-display text-[clamp(2.3rem,5vw,3.9rem)] font-bold text-white leading-[1.05] m-0 mb-3 tracking-[-0.02em] uppercase text-balance">
              Want to <span className="text-brand-primary">Ride?</span>
            </h1>
            <p className="text-brand-muted m-0 text-[0.95rem] tracking-wide max-w-[480px] leading-relaxed">
              Select your coordinates. Access premium open-road machinery instantly.
            </p>
          </div>

          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            className="relative w-full flex-1 min-h-[460px] bg-[#090d16] rounded-[20px] overflow-hidden border border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.5)] cursor-grab"
          >
            <div
              className="flex w-full h-full transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {DESTINATIONS.map((dest) => (
                <div key={dest.id} className="shrink-0 w-full h-full relative">
                  <img src={dest.img} alt={dest.name} className="w-full h-full object-cover pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050811] from-0% via-[rgba(5,8,17,0.1)] via-60% to-transparent to-100% pointer-events-none" />
                  <div className="absolute bottom-8 left-8 right-8 z-[5]">
                    <h3 className="font-display text-white m-0 mb-1.5 text-2xl sm:text-3xl font-bold tracking-tight">{dest.name}</h3>
                    <p className="text-slate-300 m-0 text-sm leading-snug max-w-[90%]">{dest.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-9 right-8 flex gap-2 z-10 items-center">
              {DESTINATIONS.map((dest, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Show ${dest.name || `slide ${index + 1}`}`}
                  aria-current={index === currentSlide}
                  className={`p-0 border-none cursor-pointer h-1.5 rounded-full transition-all duration-400 ${
                    index === currentSlide ? 'w-6 bg-brand-primary shadow-[0_0_12px_#eaa974]' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ⚡ RIGHT SIDE FLEET STACK */}
        <div className="glass-panel border-white/[0.08] p-6 sm:p-8 flex flex-col gap-6 box-border transition-all duration-500 hover:border-brand-primary/30">
          <div>
            <span className="eyebrow block mb-1.5">Popular Rider Choice</span>
            <h2 className="font-display text-white m-0 text-2xl font-bold tracking-tight">
              Top Picks This Month
            </h2>
            <p className="text-brand-muted mt-1.5 mb-0 text-sm leading-relaxed">
              The most requested and high-demand premium machinery active this month.
            </p>
          </div>

          <div className="flex flex-col gap-4 flex-1 justify-center">
            {topThreeFleet.map((bike, index) => (
              <div
                key={bike.id}
                onClick={handleNavigationClick}
                className="bg-[rgba(5,8,17,0.6)] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-white/5 hover:border-brand-primary/40 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]"
              >
                <div className="flex items-center gap-4">
                  <BikeImage src={bike.image_url || getFallbackImage(bike.name)} alt={bike.name} />
                  <div className="flex-1 min-w-0">
                    <div className="bg-brand-primary/10 text-brand-primary text-[0.62rem] font-black px-2 py-0.5 rounded mb-1 inline-block border border-brand-primary/15">
                      RANK #{index + 1} • {RANK_BADGES[index] || 'FAN FAVORITE'}
                    </div>
                    <h4 className="font-display text-white m-0 text-base font-bold">{bike.name}</h4>
                    <p className="text-brand-muted m-0 text-xs">{bike.tagline || bike.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-brand-primary/[0.02] px-3.5 py-2.5 rounded-lg border border-brand-primary/15 flex justify-between items-center">
                    <span className="text-brand-muted text-xs font-semibold">Total Booked:</span>
                    <span className="text-brand-primary text-[0.82rem] font-extrabold tracking-wide">
                      {isLoadingStats ? '...' : `${bikeStats[bike.id] || 0} Times`}
                    </span>
                  </div>

                  <div className="border border-brand-primary/40 text-brand-primary px-3.5 py-2.5 rounded-lg text-[0.72rem] font-black tracking-wide whitespace-nowrap">
                    RENT NOW
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 🎯 MAIN BOTTOM RENT NOW CTA BUTTON */}
          <button
            onClick={handleNavigationClick}
            className="btn-primary px-6 py-3.5 text-[0.92rem] uppercase tracking-wide w-full block mt-auto"
          >
            {lang === 'en' ? 'Rent Now' : 'Arkila Na'}
          </button>

          <div className="text-center text-xs text-brand-primary pt-1 font-semibold tracking-wide">
            ✓ Verified Cyber-Fleet Analytics
          </div>

        </div>

      </div>
    </section>
  );
}
