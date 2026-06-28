import React from 'react';

export default function Hero({ setActiveTab, lang }) {
  return (
    <section id="home" style={{ position: 'relative', width: '100%' }}>
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '75vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundImage: 'url("https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=1600")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '2rem 1.5rem',
        zIndex: 1
      }}>
        {/* Dark Overlay Tint para mabasa ang text at lumitaw ang ganda ng background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(21, 28, 41, 0.75)',
          zIndex: -1
        }}></div>

        {/* Hero Headline Text */}
        <h1 style={{ 
          fontSize: 'clamp(2rem, 6vw, 3.8rem)', 
          fontWeight: '900',
          lineHeight: '1.2',
          color: 'var(--text-color)',
          maxWidth: '850px',
          margin: '0 0 1.2rem 0',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          {lang === 'en' ? 'Rent a Motorcycle the Easy Way' : 'Mag-rent ng Motor sa Madaling Paraan'}
        </h1>

        {/* Hero Subtitle Description */}
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          color: 'var(--text-muted)',
          maxWidth: '600px',
          margin: '0 0 2.5rem 0',
          lineHeight: '1.6'
        }}>
          {lang === 'en' 
            ? 'Affordable rentals for your daily commute, work, or road trips.' 
            : 'Abot-kayang renta para sa iyong pang-araw-araw na biyahe, trabaho, o gala.'}
        </p>

        {/* Main CTA Call-To-Action Button using Golden Accent */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            const bikesSection = document.getElementById('bikes');
            if (bikesSection) {
              bikesSection.scrollIntoView({ behavior: 'smooth' });
            } else {
              setActiveTab('bikes');
            }
          }}
          style={{
            background: 'var(--primary-color)',
            color: '#1f293a',
            border: 'none',
            padding: '16px 36px',
            borderRadius: '30px',
            fontSize: '1.05rem',
            fontWeight: '900',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(234, 169, 116, 0.3)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(234, 169, 116, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 6px 20px rgba(234, 169, 116, 0.3)';
          }}
        >
          {lang === 'en' ? 'View Our Bikes 🏍️' : 'Tumingin ng Motor 🏍️'}
        </button>
      </div>
    </section>
  );
}