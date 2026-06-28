import React, { useState } from 'react';

export default function Bikes({ onRentClick, lang = 'en', activeRentals = [] }) {
  const [selectedRate, setSelectedRate] = useState('day');

  // Kumpletong Fleet Matrix in Pure English
  const akingMgaMotor = [
    { 
      id: 1, 
      name: 'Yamaha NMAX V3', 
      descEn: 'Comfortable, powerful, and perfect for long distance rides.',
      img: 'https://motortrade.com.ph/wp-content/uploads/2025/02/NMAX-BUA1-BK-938x938.jpg', 
      rates: { day: 800, hrs12: 600, hrs6: 400, hr: 100 }
    },
    { 
      id: 2, 
      name: 'Yamaha Aerox V3', 
      descEn: 'Sporty look and fast acceleration, ideal for city streets.',
      img: 'https://motortrade.com.ph/wp-content/uploads/2025/09/AEROX-D541-LBL.jpg', 
      rates: { day: 750, hrs12: 550, hrs6: 350, hr: 95 }
    },
    { 
      id: 3, 
      name: 'Yamaha Fazzio', 
      descEn: 'Classic retro modern design, extremely fuel efficient.',
      img: 'https://motortrade.com.ph/wp-content/uploads/2025/02/FAZZIO-CYAN.jpg', 
      rates: { day: 650, hrs12: 450, hrs6: 300, hr: 80 }
    },
    { 
      id: 4, 
      name: 'Honda Click 125i', 
      descEn: 'Reliable daily commuter with superb liquid-cooled engine performance.',
      img: 'https://motortrade.com.ph/wp-content/uploads/2025/02/CLICK125-5G-RED.png', 
      rates: { day: 600, hrs12: 400, hrs6: 250, hr: 75 }
    },
    { 
      id: 5, 
      name: 'Honda Beat', 
      descEn: 'Lightweight, nimble, and highly recommended for beginners.',
      img: 'https://motortrade.com.ph/wp-content/uploads/2025/02/BEAT-PLAYFUL-BLUE.png', 
      rates: { day: 500, hrs12: 350, hrs6: 200, hr: 60 }
    },
    { 
      id: 6, 
      name: 'Mio i 125', 
      descEn: 'Slim, compact, and highly maneuverable daily scooter.',
      img: 'https://motortrade.com.ph/wp-content/uploads/2025/02/MIO-I125-S-ORANGE.png', 
      rates: { day: 500, hrs12: 350, hrs6: 200, hr: 60 }
    }
  ];

  const getRateLabel = (key) => {
    if (key === 'day') return '/ 24 Hours';
    if (key === 'hrs12') return '/ 12 Hours';
    if (key === 'hrs6') return '/ 6 Hours';
    return '/ Hour';
  };

  return (
    <section id="bikes" style={{ padding: '5rem 2rem', backgroundColor: 'var(--bg-color)', textAlign: 'center' }}>
      
      <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-color)', marginBottom: '0.5rem', letterSpacing: '1px' }}>
        OUR FLEET
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1rem', fontWeight: '500' }}>
        Move cursor over a bike to inspect specifications and start booking.
      </p>

      {/* RENTAL TIME PACKAGE SWITCHER BUTTONBAR */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '4rem', flexWrap: 'wrap' }}>
        {[
          { key: 'day', labelEn: '24 Hours' },
          { key: 'hrs12', labelEn: '12 Hours' },
          { key: 'hrs6', labelEn: '6 Hours' },
          { key: 'hr', labelEn: 'Per Hour' }
        ].map((pkg) => {
          const isActive = selectedRate === pkg.key;
          return (
            <button
              key={pkg.key}
              onClick={() => setSelectedRate(pkg.key)}
              style={{
                background: isActive ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#151c29' : 'var(--text-muted)',
                border: isActive ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                padding: '10px 24px',
                borderRadius: '30px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease'
              }}
            >
              {pkg.labelEn}
            </button>
          );
        })}
      </div>

      {/* MAIN PREMIUM GLASS MATRIX GRID */}
      <div className="bike-grid">
        {akingMgaMotor.map((motor) => {
          const currentPrice = motor.rates[selectedRate];
          
          const isRented = activeRentals.some(r => {
            const status = r.current_status || r.current_status_ng_renta || r.status_ng_renta || r.status || '';
            return (r.uri_ng_arkila === motor.name || r.pangalan_ng_motor === motor.name) && ['Approved', 'Ongoing', 'Rented'].includes(status);
          });

          return (
            <div key={motor.id} className="bike-card">
              
              <div>
                {/* Clean Image View */}
                <div className="bike-card-image-wrap">
                  <img 
                    src={motor.img} 
                    alt={motor.name} 
                    style={{ filter: isRented ? 'grayscale(100%) opacity(0.4)' : 'none' }} 
                  />
                </div>

                {/* Permanent Clean Inline Headers */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1rem', width: '100%' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-color)', textAlign: 'left' }}>
                    {motor.name}
                  </h3>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary-color)' }}>
                      ₱{currentPrice}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '2px' }}>
                      {getRateLabel(selectedRate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* DYNAMIC FADE INTERACTION GROUP */}
              <div className="bike-interactive-group">
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textAlign: 'left', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                  {motor.descEn}
                </p>

                <button
                  disabled={isRented}
                  onClick={() => onRentClick && onRentClick({ ...motor, chosenRateType: selectedRate })}
                  className="btn-primary"
                >
                  {isRented ? '🚫 Fully Booked' : '⚡ Rent This Bike'}
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
}