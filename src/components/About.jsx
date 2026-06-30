import React from 'react';
// Import ng iyong Canva background para maging parehas sila ng Home at Bikes Tab!
import mainWebsiteBg from '../assets/BG.png';

export default function About({ lang }) {
  return (
    <section 
      id="about" 
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
        animation: 'aboutFadeIn 0.5s ease-out forwards'
      }}
    >
      {/* CSS Injection para sa standard smooth entry animation */}
      <style>{`
        @keyframes aboutFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* PLAIN DARK BLUE HEADER BLOCK BACKGROUND ACCENT (Para hindi matakpan ng navbar) */}
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

      {/* INTEGRATED CONTENT CONTAINER WITH GOLDEN LININGS */}
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

        {/* Main Title Block */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ffffff', margin: '0 0 1rem 0', letterSpacing: '2px' }}>
            {lang === 'en' ? 'ABOUT ' : 'TUNGKOL SA '}<span style={{ color: '#eaa974' }}>MOTORENT</span>
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.8', maxWidth: '900px', margin: '0 auto' }}>
            {lang === 'en' 
              ? 'We provide reliable, safe, and affordable motorcycle rentals in Norzagaray and nearby towns. All our units are brand new, meticulously maintained, and come with complete documents for your smooth and secure journey.'
              : 'Kami ay nagbibigay ng maaasahan, ligtas, at abot-kayang pag-renta ng mga motorsiklo sa Norzagaray at mga karatig-bayan. Lahat ng aming mga yunit ay bago, alagang-alaga sa maintenance, at may kumpletong papeles para sa iyong smooth at ligtas na biyahe.'}
          </p>
        </div>

        {/* REQUIREMENTS & POLICIES GLASS CARDS SECTION */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '2rem', 
          width: '100%' 
        }}>
          
          {/* Card 1: Driver's License */}
          <div style={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.6)', 
            padding: '2.5rem 2rem', 
            borderRadius: '20px', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.borderColor = 'rgba(234, 169, 116, 0.5)';
            e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.85)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
          }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪪</div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#eaa974', fontWeight: '800' }}>
              {lang === 'en' ? "Driver's License" : "Lisensya sa Pagmamaneho"}
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
              {lang === 'en' 
                ? 'Must present 1 Valid Original Driver\'s License upon claiming the motorcycle.' 
                : 'Kailangang magpakita ng 1 Valid Original Driver\'s License sa araw ng pagkuha ng motor.'}
            </p>
          </div>

          {/* Card 2: Government ID */}
          <div style={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.6)', 
            padding: '2.5rem 2rem', 
            borderRadius: '20px', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.borderColor = 'rgba(234, 169, 116, 0.5)';
            e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.85)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
          }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#eaa974', fontWeight: '800' }}>
              {lang === 'en' ? 'Government ID' : 'Gobyerno na ID'}
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
              {lang === 'en' 
                ? 'Provide 1 additional Valid Government ID (e.g., UMID, SSS, Passport, PRC) for secondary verification.' 
                : 'Magdala ng 1 karagdagang Valid Government ID (hal. UMID, SSS, Passport, PRC) para sa pangalawang pagpapatunay.'}
            </p>
          </div>

          {/* Card 3: Fuel Policy */}
          <div style={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.6)', 
            padding: '2.5rem 2rem', 
            borderRadius: '20px', 
            border: '1px solid rgba(255, 255, 255, 0.08)', 
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.borderColor = 'rgba(234, 169, 116, 0.5)';
            e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.85)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
          }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⛽</div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#eaa974', fontWeight: '800' }}>
              {lang === 'en' ? 'Fuel Policy' : 'Patakaran sa Gasolina'}
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
              {lang === 'en' 
                ? 'Gasoline is NOT included in the rental price. The unit will be handed over with gas, and must be returned with the same level.' 
                : 'Ang gasolina ay HINDI kasama sa presyo ng renta. Ibibigay ang motor na may gas, at kailangang ibalik na may parehong rami ng gas.'}
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}