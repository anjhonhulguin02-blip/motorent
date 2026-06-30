import React from 'react';
import mainWebsiteBg from '../assets/BG.png';

import nmaxImg from '../assets/nmaxv3.jpg';
import aeroxImg from '../assets/aeroxv3.jpg';
import clickImg from '../assets/click125.jpg';
import beatImg from '../assets/beat.jpg';
import fazzioImg from '../assets/fazzio.png'; 
import mioImg from '../assets/mio i 125.jpg';  

export default function Bikes({ onRentClick, activeRentals = [] }) {
  
  // NAKA-ARRANGE MULA HIGHEST PRICE TO LOWEST PRICE
  const akingMgaMotor = [
    { 
      id: 1, 
      name: 'Yamaha NMAX V3', 
      desc: 'Comfortable, powerful, and perfect for long distance rides.',
      img: nmaxImg,
      rates: { day: 800 }
    },
    { 
      id: 2, 
      name: 'Yamaha Aerox V3', 
      desc: 'Sporty look with high performance racing engine technology.',
      img: aeroxImg, 
      rates: { day: 750 }
    },
    { 
      id: 5, 
      name: 'Honda Fazzio 125', 
      desc: 'Aesthetic retro classic scooter bringing unique fashion vibes.',
      img: fazzioImg, 
      rates: { day: 650 }
    },
    { 
      id: 4, 
      name: 'Honda Click 125i V3', 
      desc: 'Modern city commuter featuring supreme fuel savings configuration.',
      img: clickImg, 
      rates: { day: 650 }
    },
    { 
      id: 6, 
      name: 'Yamaha Mio i 125', 
      desc: 'Lightweight easy-ride companion reliable for swift daily operations and city slinging.',
      img: mioImg, 
      rates: { day: 600 }
    },
    { 
      id: 7, 
      name: 'Honda BeAT FI', 
      desc: 'Compact agile engineering excellent for heavy metropolitan traffic navigation.',
      img: beatImg, 
      rates: { day: 600 }
    }
  ];

  return (
    <section 
      id="bikes" 
      style={{ 
        width: '100%',
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'flex-start', 
        alignItems: 'center', 
        backgroundImage: `url(${mainWebsiteBg})`, 
        backgroundSize: '100% 100%', 
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#0f172a', 
        boxSizing: 'border-box',
        position: 'relative',
        animation: 'fadeInEffect 0.5s ease-out forwards'
      }}
    >
      <style>{`
        @keyframes fadeInEffect {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .motor-card-wrapper {
          position: relative;
          background-color: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          height: 380px;
          overflow: hidden;
          display: flex;
          justifyContent: center;
          alignItems: center;
          box-sizing: border-box;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .motor-card-wrapper:hover {
          transform: translateY(-6px);
          border-color: rgba(234, 169, 116, 0.6);
          background-color: rgba(30, 41, 59, 0.8);
          box-shadow: 0 20px 40px -5px rgba(234, 169, 116, 0.15);
        }
        .motor-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover; 
          transition: transform 0.4s ease;
        }
        .motor-card-wrapper:hover .motor-card-image {
          transform: scale(1.05); 
        }
        .hover-sliding-panel {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%; 
          background: linear-gradient(to top, #0f172a 0%, rgba(15, 23, 42, 0.95) 70%, rgba(15, 23, 42, 0.85) 100%);
          padding: 2rem 1.75rem;
          box-sizing: border-box;
          transform: translateY(100%); 
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          justifyContent: center; 
          gap: 1.25rem;
          z-index: 5;
        }
        .motor-card-wrapper:hover .hover-sliding-panel {
          transform: translateY(0); 
          opacity: 1;
        }
      `}</style>

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '90px', 
        backgroundColor: '#0f172a', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        zIndex: 10
      }} />

      <div style={{
        backgroundColor: 'rgba(21, 28, 41, 0.88)', 
        backdropFilter: 'blur(16px)',
        border: '2px solid rgba(234, 169, 116, 0.6)', 
        borderRadius: '32px',
        maxWidth: '1280px', 
        width: '100%',
        padding: '3.5rem 2rem',
        boxSizing: 'border-box',
        boxShadow: '0 0 50px rgba(234, 169, 116, 0.15), 0 40px 80px -15px rgba(0, 0, 0, 0.8)',
        marginTop: '120px', 
        marginBottom: '4rem',
        zIndex: 20
      }}>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ffffff', margin: '0 0 0.5rem 0' }}>
            AVAILABLE <span style={{ color: '#eaa974' }}>FLEET CATALOG</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>
            Hover over a motorcycle card to view details, rates, and booking options.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          width: '100%'
        }}>
          {akingMgaMotor.map((motor) => {
            
            // 🌟 AUTOMATIC LOCK LOGIC KAPAG NAG-SEND NG PROOF
            const isRented = activeRentals.some(rental => {
              const rentalBikeName = (rental.pangalan_ng_motor || rental.name || '').toLowerCase().trim();
              const currentBikeName = motor.name.toLowerCase().trim();
              const rentalStatus = (rental.status || rental.status_ng_renta || '').toLowerCase().trim();
              
              // Tinitignan kung may na-upload nang screenshot/file ng resibo
              const mayResiboNa = !!(rental.resibo_url || rental.proof_of_payment || rental.proof);
              
              const isSameBike = rentalBikeName === currentBikeName;
              
              // 🎯 MAGIGING UNAVAILABLE KAPAG:
              // 1. Naka-Approved na ni Admin (rentalStatus === 'approved')
              // 2. O KAYA Pending pa lang pero MERON NANG RESIBO (rentalStatus === 'pending' && mayResiboNa)
              const dapatIlock = rentalStatus === 'approved' || (rentalStatus === 'pending' && mayResiboNa);

              return isSameBike && dapatIlock;
            });

            return (
              <div key={motor.id} className="motor-card-wrapper">
                
                <img 
                  src={motor.img} 
                  alt={motor.name} 
                  className="motor-card-image"
                  style={{
                    filter: isRented ? 'blur(5px) grayscale(100%) opacity(40%)' : 'none',
                    transition: 'filter 0.4s ease'
                  }}
                />

                {isRented && (
                  <div style={{
                    position: 'absolute', top: '15px', right: '15px',
                    backgroundColor: '#ef4444', color: '#ffffff',
                    padding: '10px 24px', borderRadius: '12px',
                    fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', zIndex: 4
                  }}>
                    🚫 Unavailable/Rented
                  </div>
                )}

                <div className="hover-sliding-panel">
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {motor.name}
                    </h3>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', marginRight: '5px' }}>RATE:</span>
                      <span style={{ fontSize: '1.3rem', color: '#eaa974', fontWeight: '900' }}>₱{motor.rates.day}.00</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}> / day</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', margin: 0, textAlign: 'center', padding: '0 5px' }}>
                    {motor.desc}
                  </p>
                  
                  <button
                    onClick={() => {
                      if (!isRented) onRentClick(motor);
                    }}
                    disabled={isRented}
                    style={{
                      width: '100%',
                      backgroundColor: isRented ? '#334155' : '#eaa974', 
                      color: isRented ? '#64748b' : '#151c29',          
                      border: 'none',
                      padding: '12px',
                      borderRadius: '12px',
                      fontWeight: '900',
                      fontSize: '0.95rem',
                      cursor: isRented ? 'not-allowed' : 'pointer',      
                      transition: 'all 0.2s ease',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginTop: '10px',
                      boxShadow: isRented ? 'none' : '0 4px 12px rgba(234, 169, 116, 0.2)'
                    }}
                  >
                    {isRented ? 'Rented Out / Unavailable' : 'Rent now'}
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}