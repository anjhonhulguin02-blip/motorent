import React from 'react';
// Import ng iyong Canva background asset
import mainWebsiteBg from '../assets/BG.png';

export default function Hero({ setActiveTab }) {
  const textColorMuted = '#94a3b8';
  const textColorFull = '#ffffff';

  // Requirements items - Clean glass card design
  const subCardStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'rgba(30, 41, 59, 0.45)', 
    border: '1px solid rgba(255, 255, 255, 0.05)', 
    borderRadius: '14px',
    padding: '1.25rem',
    backdropFilter: 'blur(4px)',
  };

  return (
    <section 
      id="home" 
      style={{ 
        width: '100%',
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundImage: `url(${mainWebsiteBg})`, 
        backgroundSize: '100% 100%', 
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#0f172a', 
        boxSizing: 'border-box',
        position: 'relative'
      }}
    >
      {/* PLAIN DARK BLUE HEADER BLOCK BACKGROUND ACCENT */}
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

      {/* THE MAIN HERO CONTENT BOX WRAPPER */}
      <div style={{
        backgroundColor: 'rgba(21, 28, 41, 0.88)', 
        backdropFilter: 'blur(16px)',
        border: '2px solid rgba(234, 169, 116, 0.6)', 
        borderRadius: '32px',
        maxWidth: '1280px', 
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        overflow: 'hidden',
        boxShadow: '0 0 50px rgba(234, 169, 116, 0.15), 0 40px 80px -15px rgba(0, 0, 0, 0.8)',
        boxSizing: 'border-box',
        marginTop: '110px', 
        marginBottom: '4rem',
        zIndex: 20
      }}>
        
        {/* LEFT SIDE CONTENTS */}
        <div style={{
          padding: '4rem 3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '2.5rem',
          boxSizing: 'border-box'
        }}>
          
          <div>
            <h1 style={{ 
              fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', 
              fontWeight: '900', 
              color: textColorFull, 
              lineHeight: '1.15', 
              margin: 0,
              letterSpacing: '-1px'
            }}>
              RIDE THE CITY WITH <br />
              <span style={{ color: 'var(--primary-color)' }}>ABSOLUTE FREEDOM</span>
            </h1>
          </div>

          {/* CLEAN SECTION FOR REQUIREMENTS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            position: 'relative'
          }}>
            {[
              { num: 1, title: 'VALID ID & ADDRESS PROOF', desc: 'Matching government details.' },
              { num: 2, title: "DRIVER'S LICENSE", desc: 'Valid motorcycle restriction.' },
              { num: 3, title: 'SECURITY DEPOSIT', desc: 'Refundable authorization hold.' },
              { num: 4, title: 'CONFIRMATION RECEIPT', desc: 'Required online dashboard upload.' }
            ].map((item, index) => (
              <div key={index} style={subCardStyle}>
                <span style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--primary-color)' }}>
                  {item.num}.
                </span>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: textColorFull, display: 'block', letterSpacing: '0.5px' }}>
                    {item.title}
                  </strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: textColorMuted }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 🛠️ INAYOS NA EXPLORE FLEET TRIGGER BUTTON */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              // 1. Inililipat muna natin ang global active view tab sa 'bikes'
              setActiveTab('bikes');
              
              // 2. May maikling delay para payagan ang React na i-mount ang Bikes view bago mag-scroll down
              setTimeout(() => {
                const bikesSection = document.getElementById('bikes');
                if (bikesSection) {
                  bikesSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }
              }, 60);
            }}
            style={{
              alignSelf: 'flex-start',
              background: 'linear-gradient(135deg, #e7c27d 0%, #b38b4d 100%)',
              color: '#151c29', 
              border: 'none',
              padding: '18px 48px',
              borderRadius: '40px',
              fontSize: '1.1rem',
              fontWeight: '900',
              cursor: 'pointer',
              boxShadow: '0 10px 30px -5px rgba(234, 169, 116, 0.35)',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.75px'
            }}
          >
            EXPLORE FLEET & BOOK NOW
          </button>
        </div>

        {/* RIGHT SIDE SHOWCASE IMAGE */}
        <div style={{
          position: 'relative',
          width: '100%',
          minHeight: '500px', 
          backgroundColor: '#111827',
          overflow: 'hidden'
        }}>
          <img 
            src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=1600" 
            alt="Premium Motorcycle Showcase Fleet" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
          />
          <div style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            background: 'linear-gradient(to right, rgba(21, 28, 41, 0.5) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
        </div>

      </div>
    </section>
  );
}