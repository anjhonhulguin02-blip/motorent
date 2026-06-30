import React from 'react';
import mainWebsiteBg from '../assets/BG.png';

export default function Contact({ lang }) {
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=TOMMY+STORE+Minuyan+Norzagaray+Bulacan";

  return (
    <section 
      id="contact" 
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
        padding: '0 1rem 160px 1rem' // Binabaan ang bottom padding para balanse sa offset
      }}
    >
      {/* POSITION BLOCK OFFSET: Pinabababa ang buong card container para lumitaw mula sa likod ng Navbar */}
      <div style={{
        position: 'relative',
        top: '130px',
        backgroundColor: 'rgba(21, 28, 41, 0.88)', 
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '2px solid rgba(234, 169, 116, 0.6)', 
        borderRadius: '32px',
        maxWidth: '1000px', 
        width: '100%', 
        padding: '3.5rem 2rem',
        boxSizing: 'border-box',
        boxShadow: '0 0 50px rgba(234, 169, 116, 0.15), 0 40px 80px -15px rgba(0, 0, 0, 0.8)',
        zIndex: 20,
        marginBottom: '4rem'
      }}>

        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ffffff', margin: '0 0 0.5rem 0', letterSpacing: '2px' }}>
            CONTACT <span style={{ color: '#eaa974' }}>US</span>
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', margin: 0 }}>
            {lang === 'en' 
              ? "Have questions or ready to pick up? Get in touch with us directly."
              : "May mga katanungan o kukunin na ang motor? Direktang makipag-ugnayan sa amin."}
          </p>
        </div>
        
        {/* Interactive Contact Grid */}
        <div className="contact-container" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '2.5rem',
          width: '100%'
        }}>
          
          {/* Card 1: Hotline & Socials */}
          <div style={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.6)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            borderRadius: '16px', 
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#eaa974', margin: '0 0 1.25rem 0' }}>
              {lang === 'en' ? 'Hotline & Socials' : 'Hotline at Socials'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                👤 Contact Person: <span style={{ fontWeight: 'normal', color: '#cbd5e1' }}>Anjhon Hulguin</span>
              </p>
              <p style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                📞 Phone: <span style={{ fontWeight: 'normal', color: '#cbd5e1' }}>09708560510</span>
              </p>
              <p style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                💬 Facebook: <span style={{ fontWeight: 'normal', color: '#cbd5e1' }}>MotoRent Bulacan</span>
              </p>
              <p style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '700', margin: 0 }}>
                ✉️ Email: <span style={{ fontWeight: 'normal', color: '#cbd5e1' }}>anjhon.hulguin02@gmail.com</span>
              </p>
            </div>
          </div>

          {/* Card 2: Our Hub Location */}
          <div style={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.6)', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            borderRadius: '16px', 
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#eaa974', margin: '0 0 1.25rem 0' }}>
              {lang === 'en' ? 'Our Hub Location' : 'Lokasyon ng Aming Hub'}
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '0.5rem' }}>
              #1816 Saint Peter st., Marlane Subdivision, Minuyan, Norzagaray Bulacan
            </p>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#eaa974', margin: '0 0 2rem 0' }}>
              📍 Waze / Maps: "TOMMY STORE"
            </p>

            <a 
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '0.9rem',
                display: 'inline-block',
                textAlign: 'center',
                boxSizing: 'border-box',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#eaa974';
                e.target.style.color = '#151c29';
                e.target.style.borderColor = '#eaa974';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.target.style.color = '#ffffff';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              🗺️ {lang === 'en' ? 'Open in Google Maps' : 'Tingnan sa Google Maps'}
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}