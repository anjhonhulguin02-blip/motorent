import React from 'react';

export default function About({ lang }) {
  return (
    <section id="about" style={{ padding: '5rem 2rem', backgroundColor: 'var(--bg-color)' }}>
      {/* Main Title */}
      <h2 style={{ textAlign: 'center', marginBottom: '3rem', letterSpacing: '2px' }}>
        {lang === 'en' ? 'ABOUT MOTORENT' : 'TUNGKOL SA MOTORENT'}
      </h2>

      {/* Intro Grid */}
      <div style={{ maxWidth: '900px', margin: '0 auto 4rem auto', textAlign: 'center' }}>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.8', opacity: 0.85 }}>
          {lang === 'en' 
            ? 'We provide reliable, safe, and affordable motorcycle rentals in Norzagaray and nearby towns. All our units are brand new, meticulously maintained, and come with complete documents for your smooth and secure journey.'
            : 'Kami ay nagbibigay ng maaasahan, ligtas, at abot-kayang pag-renta ng mga motorsiklo sa Norzagaray at mga karatig-bayan. Lahat ng aming mga yunit ay bago, alagang-alaga sa maintenance, at may kumpletong papeles para sa iyong smooth at ligtas na biyahe.'}
        </p>
      </div>

      {/* FUTURISTIC REQUIREMENTS & POLICIES SECTION */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '2rem', 
        maxWidth: '1000px', 
        margin: '0 auto' 
      }}>
        
        {/* Card 1: Driver's License */}
        <div style={{ 
          backgroundColor: 'var(--card-bg)', 
          padding: '2.5rem 2rem', 
          borderRadius: '20px', 
          border: '1px solid var(--border-color)', 
          boxShadow: 'var(--shadow-sm)',
          textAlign: 'center',
          transition: 'transform 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪪</div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
            {lang === 'en' ? "Driver's License" : "Lisensya sa Pagmamaneho"}
          </h3>
          <p style={{ fontSize: '0.95rem', opacity: 0.8, lineHeight: '1.6' }}>
            {lang === 'en' 
              ? 'Must present 1 Valid Original Driver\'s License upon claiming the motorcycle.' 
              : 'Kailangang magpakita ng 1 Valid Original Driver\'s License sa araw ng pagkuha ng motor.'}
          </p>
        </div>

        {/* Card 2: Government ID */}
        <div style={{ 
          backgroundColor: 'var(--card-bg)', 
          padding: '2.5rem 2rem', 
          borderRadius: '20px', 
          border: '1px solid var(--border-color)', 
          boxShadow: 'var(--shadow-sm)',
          textAlign: 'center',
          transition: 'transform 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
            {lang === 'en' ? 'Government ID' : 'Gobyerno na ID'}
          </h3>
          <p style={{ fontSize: '0.95rem', opacity: 0.8, lineHeight: '1.6' }}>
            {lang === 'en' 
              ? 'Provide 1 additional Valid Government ID (e.g., UMID, SSS, Passport, PRC) for secondary verification.' 
              : 'Magdala ng 1 karagdagang Valid Government ID (hal. UMID, SSS, Passport, PRC) para sa pangalawang pagpapatunay.'}
          </p>
        </div>

        {/* Card 3: Fuel Policy */}
        <div style={{ 
          backgroundColor: 'var(--card-bg)', 
          padding: '2.5rem 2rem', 
          borderRadius: '20px', 
          border: '1px solid var(--border-color)', 
          boxShadow: 'var(--shadow-sm)',
          textAlign: 'center',
          transition: 'transform 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⛽</div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
            {lang === 'en' ? 'Fuel Policy' : 'Patakaran sa Gasolina'}
          </h3>
          <p style={{ fontSize: '0.95rem', opacity: 0.8, lineHeight: '1.6' }}>
            {lang === 'en' 
              ? 'Gasoline is NOT included in the rental price. The unit will be handed over with gas, and must be returned with the same level.' 
              : 'Ang gasolina ay HINDI kasama sa presyo ng renta. Ibibigay ang motor na may gas, at kailangang ibalik na may parehong rami ng gas.'}
          </p>
        </div>

      </div>
    </section>
  );
}