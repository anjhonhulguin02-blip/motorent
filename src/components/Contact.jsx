import React from 'react';

export default function Contact({ lang }) {
  // Direct encoding para sa Google Maps search link ng Tommy Store, Minuyan, Norzagaray
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=TOMMY+STORE+Minuyan+Norzagaray+Bulacan";

  return (
    <section id="contact" style={{ padding: '5rem 2rem', backgroundColor: 'var(--bg-color)' }}>
      {/* Section Header */}
      <h2 style={{ textAlign: 'center', marginBottom: '1rem', letterSpacing: '2px' }}>
        {lang === 'en' ? 'CONTACT US' : 'KONTAKIN KAMI'}
      </h2>
      <p style={{ textAlign: 'center', marginBottom: '4rem', opacity: 0.7, fontSize: '1rem' }}>
        {lang === 'en' 
          ? "Have questions or ready to pick up? Get in touch with us directly."
          : "May mga katanungan o kukunin na ang motor? Direktang makipag-ugnayan sa amin."}
      </p>
      
      {/* Interactive Contact Grid */}
      <div className="contact-container" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '2.5rem',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        
        {/* Card 1: Owner / Contact Person (Ngayon ay may EMAIL na!) */}
        <div 
          className="contact-card" 
          style={{ 
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
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👤</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.8rem', color: 'var(--primary-color)' }}>
            {lang === 'en' ? 'Contact Person' : 'Maaaring Hanapin'}
          </h3>
          <p style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-color)', margin: '0 0 5px 0' }}>
            Anjhon Hulguin
          </p>
          
          {/* Naisingit na ang email mo rito gamit ang clickable mailto link */}
          <a 
            href="mailto:anjhon.hulguin02@gmail.com" 
            style={{ 
              fontSize: '0.95rem', 
              color: 'var(--primary-color)', 
              textDecoration: 'none',
              fontWeight: '600',
              display: 'block',
              marginBottom: '10px'
            }}
          >
            anjhon.hulguin02@gmail.com
          </a>

          <p style={{ fontSize: '0.85rem', opacity: 0.6, margin: 0 }}>
            {lang === 'en' ? 'Authorized Unit Handler' : 'Tagapamahala ng mga yunit'}
          </p>
        </div>

        {/* Card 2: Phone & GCash */}
        <div 
          className="contact-card" 
          style={{ 
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
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📞</div>
          <h3>{lang === 'en' ? 'Phone Number' : 'Numero ng Telepono'}</h3>
          <p style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary-color)', letterSpacing: '1px', margin: '0.5rem 0' }}>
            09708560510
          </p>
          <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>
            {lang === 'en' ? 'Available for Calls, SMS, and GCash' : 'Maaaring tawagan, i-text, o padalhan ng GCash'}
          </p>
        </div>

        {/* Card 3: Precise Location with Maps Link */}
        <div 
          className="contact-card" 
          style={{ 
            backgroundColor: 'var(--card-bg)',
            padding: '2.5rem 2rem',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'transform 0.3s' 
          }} 
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} 
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📍</div>
            <h3 style={{ marginBottom: '0.5rem' }}>{lang === 'en' ? 'Our Location' : 'Aming Lokasyon'}</h3>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '0.5rem', opacity: 0.9 }}>
              #1816 Saint Peter st., Marlane Subdivision, Minuyan, Norzagaray Bulacan
            </p>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-color)', margin: '0 0 1.5rem 0' }}>
              🔍 Waze / Maps: "TOMMY STORE"
            </p>
          </div>

          <a 
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              width: '100%',
              padding: '0.8rem',
              borderRadius: '12px',
              backgroundColor: 'var(--border-color)',
              color: 'var(--text-color)',
              fontWeight: '700',
              fontSize: '0.9rem',
              display: 'inline-block',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--primary-color)';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--border-color)';
              e.target.style.color = 'var(--text-color)';
            }}
          >
            🗺️ {lang === 'en' ? 'Open in Google Maps / Waze' : 'Buksan sa Maps / Waze'}
          </a>
        </div>

      </div>
    </section>
  );
}