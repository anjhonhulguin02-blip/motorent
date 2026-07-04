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

// 🏍️ MOTOR ASSETS IMPORT (Bikes folder)
import nmaxImg from '../assets/Bikes/nmaxv3.jpg';
import aeroxImg from '../assets/Bikes/aeroxv3.jpg'; // 💻 FIXED: Tinanggal ang "="
import clickImg from '../assets/Bikes/click125.jpg'; // 💻 FIXED: Tinanggal ang "="
import beatImg from '../assets/Bikes/beat.jpg';
import fazzioImg from '../assets/Bikes/fazzio.png';
import mioiImg from '../assets/Bikes/mio i 125.jpg'; 

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
      <div style={{ 
        width: '65px', height: '65px', borderRadius: '12px', 
        backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' 
      }}>
        🏍️
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      onError={() => setIsError(true)}
      style={{ width: '65px', height: '65px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} 
    />
  );
}

export default function Hero({ setActiveTab }) {
  const textColorMuted = '#94a3b8';
  const textColorFull = '#ffffff';
  const futuristicGold = '#eaa974';
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  // 📊 LIVE STATS STATE
  const [bikeStats, setBikeStats] = useState({
    nmax: 0,
    aerox: 0,
    click: 0,
    fazzio: 0,
    mio: 0,
    beat: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // 📡 REAL-TIME SUPABASE QUERY
  useEffect(() => {
    async function fetchRealRentalStats() {
      try {
        setIsLoadingStats(true);
        
        const { data: bookings, error } = await supabase
          .from('mga_arkila')
          .select('pangalan_ng_motor');

        if (error) {
          console.error("Supabase Query Error:", error.message);
          return;
        }

        if (bookings) {
          const countNmax = bookings.filter(b => b.pangalan_ng_motor?.toLowerCase().includes('nmax')).length;
          const countAerox = bookings.filter(b => b.pangalan_ng_motor?.toLowerCase().includes('aerox')).length;
          const countClick = bookings.filter(b => b.pangalan_ng_motor?.toLowerCase().includes('click')).length;
          const countFazzio = bookings.filter(b => b.pangalan_ng_motor?.toLowerCase().includes('fazzio')).length;
          const countMio = bookings.filter(b => b.pangalan_ng_motor?.toLowerCase().includes('mio')).length;
          const countBeat = bookings.filter(b => b.pangalan_ng_motor?.toLowerCase().includes('beat')).length;

          setBikeStats({
            nmax: countNmax,
            aerox: countAerox,
            click: countClick,
            fazzio: countFazzio,
            mio: countMio,
            beat: countBeat
          });
        }
      } catch (err) {
        console.error("System Error during fetch:", err);
      } finally {
        setIsLoadingStats(false);
      }
    }

    fetchRealRentalStats();
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

  const handleNavigationToBikes = (e) => {
    if (e) e.preventDefault();
    setActiveTab('bikes');
    setTimeout(() => {
      const bikesSection = document.getElementById('bikes');
      if (bikesSection) bikesSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 🏆 DYNAMIC SNEAK PEEK ARCHITECTURE (Top 3 Motors Ordered From Highest to Lowest)
  const allFleetModels = [
    { key: 'nmax', name: 'Yamaha NMAX V3', img: nmaxImg, tagline: 'Comfort meets max performance.', badge: 'MOST POPULAR CHOICE' },
    { key: 'aerox', name: 'Yamaha Aerox V3', img: aeroxImg, tagline: 'Aerodynamic race styling DNA.', badge: 'TOP PERFORMANCE RIDE' },
    { key: 'click', name: 'Honda Click 125', img: clickImg, tagline: 'The ultimate city fuel saver.', badge: 'HIGHLY RELIABLE RENTAL' },
    { key: 'fazzio', name: 'Yamaha Fazzio', img: fazzioImg, tagline: 'Retro classic style ride.', badge: 'RETRO VIBE CHOICE' },
    { key: 'mio', name: 'Mio i 125', img: mioiImg, tagline: 'Daily reliable commuter.', badge: 'DAILY DRIVER CHOICE' },
    { key: 'beat', name: 'Honda Beat', img: beatImg, tagline: 'Agile & Efficient city rider.', badge: 'BUDGET FRIENDLY CHOICE' }
  ];

  // Ina-arrange nito ang mga motor mula sa may pinakamalaking total booked hanggang sa pinakamababa, tsaka kukuha ng Top 3
  const topThreeFleet = [...allFleetModels]
    .sort((a, b) => (bikeStats[b.key] || 0) - (bikeStats[a.key] || 0))
    .slice(0, 3);

  return (
    <section 
      id="home" 
      style={{ 
        width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', 
        justifyContent: 'center', alignItems: 'center', backgroundImage: `url(${mainWebsiteBg})`, 
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
        backgroundColor: '#050811', boxSizing: 'border-box', position: 'relative', padding: '2rem'
      }}
    >
      <style>{`
        .hero-dashboard-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 2rem;
          max-width: 1200px;
          width: 100%;
          margin-top: 110px;
          margin-bottom: 3rem;
          zIndex: 20;
          animation: fadeLoadIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .cyber-panel-left, .cyber-panel-right { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .cyber-panel-left:hover { border-color: rgba(234, 169, 116, 0.35) !important; box-shadow: 0 40px 80px rgba(234, 169, 116, 0.04) !important; }
        .cyber-panel-right:hover { border-color: rgba(234, 169, 116, 0.25) !important; box-shadow: 0 40px 80px rgba(234, 169, 116, 0.02) !important; }

        .fleet-live-card { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; }
        .fleet-live-card:hover {
          transform: translateY(-3px);
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(234, 169, 116, 0.4) !important;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
        }
        .fleet-live-card:hover .action-cta-sub {
          background: linear-gradient(135deg, #eaa974 0%, #b38b4d 100%) !important;
          color: #050811 !important;
          box-shadow: 0 0 15px rgba(234, 169, 116, 0.5);
        }

        .side-fleet-stack { display: flex; flex-direction: column; gap: 16px; }
        @keyframes fadeLoadIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 1024px) { .hero-dashboard-grid { grid-template-columns: 1fr; margin-top: 100px; gap: 1.5rem; } }
      `}</style>

      {/* 🧼 FIXED NAVBAR AREA: Walang border o solid colors para mag-blend sa background background niyo */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '90px', backgroundColor: 'transparent', zIndex: 10 }} />

      <div className="hero-dashboard-grid">
        
        {/* 🪟 LEFT PANEL */}
        <div className="cyber-panel-left" style={{
          backgroundColor: 'rgba(10, 15, 30, 0.8)', backdropFilter: 'blur(24px)',
          border: `1px solid rgba(234, 169, 116, 0.2)`, borderRadius: '28px',
          display: 'flex', flexDirection: 'column', padding: '2.5rem 2rem', gap: '2rem', boxSizing: 'border-box'
        }}>
          <div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: '950', color: textColorFull, lineHeight: '1.1', margin: '0 0 10px 0', letterSpacing: '-1.5px', textTransform: 'uppercase' }}>
              WANT TO RIDE?
            </h1>
            <p style={{ color: textColorMuted, margin: 0, fontSize: '0.95rem', letterSpacing: '0.5px', maxWidth: '480px' }}>
              Select your coordinates. Access premium open-road machinery instantly.
            </p>
          </div>

          <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} style={{ position: 'relative', width: '100%', height: '410px', backgroundColor: '#090d16', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', cursor: 'grab' }}>
            <div style={{ display: 'flex', width: '100%', height: '100%', transform: `translateX(-${currentSlide * 100}%)`, transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              {DESTINATIONS.map((dest) => (
                <div key={dest.id} style={{ flexShrink: 0, width: '100%', height: '100%', position: 'relative' }}>
                  <img src={dest.img} alt={dest.name} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5, 8, 17, 0.95) 0%, rgba(5, 8, 17, 0.1) 60%, transparent 100%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: '30px', left: '30px', right: '30px', zIndex: 5 }}>
                    <h3 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-0.5px' }}>{dest.name}</h3>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.88rem', lineHeight: '1.4', maxWidth: '90%' }}>{dest.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', bottom: '34px', right: '30px', display: 'flex', gap: '8px', zIndex: 10, alignItems: 'center' }}>
              {DESTINATIONS.map((_, index) => (
                <button key={index} onClick={() => setCurrentSlide(index)} style={{ padding: 0, border: 'none', cursor: 'pointer', height: '6px', width: index === currentSlide ? '24px' : '6px', borderRadius: '3px', backgroundColor: index === currentSlide ? futuristicGold : 'rgba(255, 255, 255, 0.2)', boxShadow: index === currentSlide ? `0 0 12px ${futuristicGold}` : 'none', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} />
              ))}
            </div>
          </div>
        </div>

        {/* ⚡ RIGHT SIDE PANEL */}
        <div className="cyber-panel-right" style={{
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '28px',
          padding: '2.5rem 1.8rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
          boxShadow: '0 25px 50px rgba(0,0,0,0.45)', boxSizing: 'border-box'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: futuristicGold, letterSpacing: '3px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '6px' }}>
              POPULAR RIDER CHOICE
            </div>
            <h2 style={{ color: '#ffffff', margin: 0, fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
              TOP PICKS THIS MONTH
            </h2>
            <p style={{ color: textColorMuted, margin: '4px 0 0 0', fontSize: '0.85rem', lineHeight: '1.3' }}>
              The most requested and high-demand premium machinery active this month.
            </p>
          </div>

          <div className="side-fleet-stack">
            
            {topThreeFleet.map((bike, index) => (
              <div 
                key={bike.key}
                className="fleet-live-card" 
                onClick={handleNavigationToBikes}
                style={{ 
                  backgroundColor: 'rgba(5, 8, 17, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)', 
                  borderRadius: '18px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  
                  <BikeImage src={bike.img} alt={bike.name} />

                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      backgroundColor: 'rgba(234, 169, 116, 0.1)', color: futuristicGold, 
                      fontSize: '0.62rem', fontWeight: '900', padding: '2px 8px', 
                      borderRadius: '4px', display: 'inline-block', marginBottom: '4px',
                      border: '1px solid rgba(234, 169, 116, 0.15)'
                    }}>
                      RANK #{index + 1} • {bike.badge}
                    </div>
                    <h4 style={{ color: '#fff', margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>{bike.name}</h4>
                    <p style={{ color: textColorMuted, margin: 0, fontSize: '0.78rem' }}>{bike.tagline}</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    flex: 1, backgroundColor: 'rgba(234, 169, 116, 0.02)', padding: '10px 14px', 
                    borderRadius: '10px', border: '1px solid rgba(234, 169, 116, 0.15)', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                  }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>Total Booked:</span>
                    <span style={{ color: futuristicGold, fontSize: '0.82rem', fontWeight: '800', letterSpacing: '0.5px' }}>
                      {isLoadingStats ? 'LOADING...' : `${bikeStats[bike.key]} Times`}
                    </span>
                  </div>
                  
                  <div className="action-cta-sub" style={{
                    border: '1px solid rgba(234, 169, 116, 0.4)', color: futuristicGold, padding: '10px 14px', 
                    borderRadius: '10px', fontSize: '0.72rem', fontWeight: '900', letterSpacing: '1px',
                    transition: 'all 0.3s ease', whiteSpace: 'nowrap'
                  }}>
                    RENT NOW
                  </div>
                </div>
              </div>
            ))}

          </div>

          <div style={{ textTransform: 'none', textAlign: 'center', fontSize: '0.72rem', color: futuristicGold, paddingTop: '12px', marginTop: 'auto', fontWeight: '600', letterSpacing: '0.5px' }}>
            ✓ Verified Cyber-Fleet Analytics
          </div>

        </div>

      </div>
    </section>
  );
}