import React, { useState } from 'react';

export default function Bikes({ onRentClick, lang, activeRentals = [] }) {
  const [selectedRate, setSelectedRate] = useState('day');

  // Lahat ng anim (6) na motor mo kasama ang kumpletong links at accurate rates matrix
  const akingMgaMotor = [
    { 
      id: 1, 
      name: 'Yamaha NMAX V3', 
      descEn: 'Comfortable, powerful, and perfect for long distance rides.',
      descTl: 'Comfortable, powerful, at perpekto sa malayuang biyahe.', 
      img: 'https://motortrade.com.ph/wp-content/uploads/2025/02/NMAX-BUA1-BK-938x938.jpg', 
      rates: { day: 800, hrs12: 600, hrs6: 400, hr: 100 }
    },
    { 
      id: 2, 
      name: 'Yamaha Aerox V3', 
      descEn: 'Sporty look and fast acceleration, ideal for city streets.',
      descTl: 'Sporty look at mabilis para sa mga gustong maporma sa kalsada.', 
      img: 'https://motortrade.com.ph/wp-content/uploads/2025/09/AEROX-D541-LBL.jpg', 
      rates: { day: 750, hrs12: 550, hrs6: 400, hr: 100 }
    },
    { 
      id: 3, 
      name: 'Honda Click 125', 
      descEn: 'Fuel-efficient and time-tested for everyday heavy traffic.',
      descTl: 'Matipid sa gas at subok na subok sa pang-araw-araw na traffic.', 
      img: 'https://motortrade.com.ph/wp-content/uploads/2025/10/CLICK125i-ACB125CBFTII-PW.jpg', 
      rates: { day: 650, hrs12: 450, hrs6: 300, hr: 75 }
    },
    { 
      id: 4, 
      name: 'Yamaha Fazzio', 
      descEn: 'Classic retro look that is incredibly lightweight and easy to ride.',
      descTl: 'Classic retro look na napakagaan at daling imaneho.', 
      img: 'https://img.webike-cdn.net/@news/wp-content/uploads/2025/07/6179c4458b58392738842af117fd58c5.jpg', 
      rates: { day: 650, hrs12: 450, hrs6: 300, hr: 75 }
    },
    { 
      id: 5, 
      name: 'Honda Beat', 
      descEn: 'Compact, nimble, and extreme gas saver for urban environments.',
      descTl: 'Napakaliit, siksik, at sobrang tipid sa gasolina sa lungsod.', 
      img: 'https://motortrade.com.ph/wp-content/uploads/2023/10/white-premium-1017x1017.jpg', 
      rates: { day: 600, hrs12: 400, hrs6: 300, hr: 75 }
    },
    { 
      id: 6, 
      name: 'Yamaha Mio i 125', 
      descEn: 'The crowd favorite automatic scooter, reliable and smooth handling.',
      descTl: 'Ang pambansang automatic na motor, kabisado at swabe imaneho.', 
      img: 'https://motortrade.com.ph/wp-content/uploads/2018/09/1-66.jpg', 
      rates: { day: 600, hrs12: 400, hrs6: 300, hr: 75 }
    },
  ];

  const getRateLabel = (type) => {
    if (lang === 'en') {
      switch(type) {
        case 'day': return '/ 24 Hours';
        case 'hrs12': return '/ 12 Hours';
        case 'hrs6': return '/ 6 Hours';
        case 'hr': return '/ Per Hour';
        default: return '/ day';
      }
    } else {
      switch(type) {
        case 'day': return '/ 24 Oras';
        case 'hrs12': return '/ 12 Oras';
        case 'hrs6': return '/ 6 Oras';
        case 'hr': return '/ Isang Oras';
        default: return '/ araw';
      }
    }
  };

  return (
    <section id="bikes" style={{ padding: '4rem 2rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem', letterSpacing: '2px', color: 'var(--text-color)' }}>
        {lang === 'en' ? 'CHOOSE YOUR RIDE' : 'PILIIN ANG IYONG SASAKYAN'}
      </h2>
      
      {/* Modern Duration Switcher */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '4rem', flexWrap: 'wrap' }}>
        <button onClick={() => setSelectedRate('day')} style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: selectedRate === 'day' ? 'var(--primary-color)' : 'var(--card-bg)', color: selectedRate === 'day' ? 'white' : 'var(--text-color)', boxShadow: 'var(--shadow-sm)', transition: '0.3s' }}>
          📅 {lang === 'en' ? '24 Hours' : '24 Oras'}
        </button>
        <button onClick={() => setSelectedRate('hrs12')} style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: selectedRate === 'hrs12' ? 'var(--primary-color)' : 'var(--card-bg)', color: selectedRate === 'hrs12' ? 'white' : 'var(--text-color)', boxShadow: 'var(--shadow-sm)', transition: '0.3s' }}>
          ☀️ {lang === 'en' ? '12 Hours' : '12 Oras'}
        </button>
        <button onClick={() => setSelectedRate('hrs6')} style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: selectedRate === 'hrs6' ? 'var(--primary-color)' : 'var(--card-bg)', color: selectedRate === 'hrs6' ? 'white' : 'var(--text-color)', boxShadow: 'var(--shadow-sm)', transition: '0.3s' }}>
          ⚡ {lang === 'en' ? '6 Hours' : '6 Oras'}
        </button>
        <button onClick={() => setSelectedRate('hr')} style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: selectedRate === 'hr' ? 'var(--primary-color)' : 'var(--card-bg)', color: selectedRate === 'hr' ? 'white' : 'var(--text-color)', boxShadow: 'var(--shadow-sm)', transition: '0.3s' }}>
          ⏱️ {lang === 'en' ? 'Per Hour' : 'Kada Oras'}
        </button>
      </div>

      {/* FUTURISTIC HOVER GRID */}
      <div className="bike-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
        {akingMgaMotor.map((motor) => {
          // INTERCEPTOR ENGINE: Titingnan kung rented na ang pangalan ng motor sa Supabase
          const isRented = activeRentals.includes(motor.name);

          return (
            <div 
              className="bike-card" 
              key={motor.id}
              style={{
                position: 'relative',
                height: '400px',
                borderRadius: '20px',
                overflow: 'hidden',
                cursor: isRented ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-md)',
                backgroundColor: 'var(--card-bg)',
                border: isRented ? '2px solid #ff4b4b' : '1px solid var(--border-color)',
                opacity: isRented ? 0.75 : 1 // Gagawing medyo malabo para halatang hindi available
              }}
              onMouseEnter={(e) => {
                const img = e.currentTarget.querySelector('.futuristic-img');
                const overlay = e.currentTarget.querySelector('.futuristic-overlay');
                if(img) { 
                  img.style.transform = 'scale(1.1)'; 
                  img.style.filter = 'blur(4px) brightness(0.3)'; 
                }
                if(overlay) { 
                  overlay.style.opacity = '1'; 
                  overlay.style.transform = 'translateY(0)'; 
                }
              }}
              onMouseLeave={(e) => {
                const img = e.currentTarget.querySelector('.futuristic-img');
                const overlay = e.currentTarget.querySelector('.futuristic-overlay');
                if(img) { 
                  img.style.transform = 'scale(1)'; 
                  img.style.filter = 'blur(0) brightness(1)'; 
                }
                if(overlay) { 
                  overlay.style.opacity = '0'; 
                  overlay.style.transform = 'translateY(20px)'; 
                }
              }}
            >
              {/* LALABAS AGAD: Buong Picture ng Motor */}
              <div 
                className="futuristic-img"
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${motor.img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
              />

              {/* LIVE INDICATOR BADGE SA ITAAS NG CARD */}
              {isRented && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  backgroundColor: '#ff4b4b',
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: '30px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  zIndex: 10,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                  letterSpacing: '1px'
                }}>
                  🚫 {lang === 'en' ? 'UNAVAILABLE / RENTED' : 'HINDI AVAILABLE / NAARKILA'}
                </div>
              )}

              {/* MISMONG TEXT & BUTTONS (Nakatago sa simula, lilitaw sa hover) */}
              <div 
                className="futuristic-overlay"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  padding: '2.5rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                  opacity: 0,
                  transform: 'translateY(20px)',
                  transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                  background: 'linear-gradient(to top, rgba(23,42,44,0.95), rgba(23,42,44,0.4))',
                  color: '#f6f4ca' 
                }}
              >
                {/* Taas: Pangalan at Deskripsyon */}
                <div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 0.8rem 0', color: '#fff', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>
                    {motor.name}
                  </h3>
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.5', opacity: 0.9, color: '#f6f4ca' }}>
                    {lang === 'en' ? motor.descEn : motor.descTl}
                  </p>
                </div>

                {/* Baba: Presyo at Rent Button */}
                <div>
                  <div style={{ marginBottom: '1.2rem' }}>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', opacity: 0.6 }}>
                      {lang === 'en' ? 'Rate Selected:' : 'Napiling Rate:'}
                    </span>
                    <span style={{ fontSize: '2rem', fontWeight: '900', color: '#fff' }}>
                      ₱{motor.rates[selectedRate]}
                    </span>
                    <span style={{ fontSize: '0.9rem', marginLeft: '5px', opacity: 0.8 }}>
                      {getRateLabel(selectedRate)}
                    </span>
                  </div>

                  <button 
                    className="btn-rent" 
                    disabled={isRented} // Iba-block ang trigger kapag may gumagamit na
                    onClick={(e) => {
                      e.stopPropagation(); // Iwas gulo sa card click event
                      if (isRented) return;
                      
                      // Ipinapasa nang buo ang detalye ng motor + ang napiling package switcher key
                      onRentClick({
                        ...motor,
                        chosenRateType: selectedRate
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: 'none',
                      borderRadius: '12px',
                      backgroundColor: isRented ? '#444' : 'var(--primary-color)',
                      color: isRented ? '#888' : 'white',
                      fontWeight: '800',
                      fontSize: '1rem',
                      cursor: isRented ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => { if(!isRented) e.target.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={(e) => { if(!isRented) e.target.style.transform = 'scale(1)'; }}
                  >
                    {isRented 
                      ? (lang === 'en' ? '🚫 Fully Booked' : '🚫 Hindi Pwedeng Rentahan')
                      : (lang === 'en' ? '⚡ Rent This Bike' : '⚡ Rentahan Ito')}
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}