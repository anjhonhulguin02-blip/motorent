import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import mainWebsiteBg from '../assets/BG.png';

export default function Reviews({ lang }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('mga_review')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setReviews(data);
    } catch (err) {
      console.error("Error pulling transparency logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const renderStars = (count) => {
    return '⭐'.repeat(count);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: '#ffffff' }}>
        <p>⏳ Loading transparency wall...</p>
      </div>
    );
  }

  return (
    <section 
      id="reviews" 
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
        maxWidth: '850px', 
        width: '100%', 
        padding: '3.5rem 2rem',
        boxSizing: 'border-box',
        boxShadow: '0 0 50px rgba(234, 169, 116, 0.15), 0 40px 80px -15px rgba(0, 0, 0, 0.8)',
        zIndex: 20,
        marginBottom: '4rem'
      }}>

        {/* Title Block - Ngayon ay siguradong lilitaw na dito */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ffffff', margin: '0 0 0.5rem 0', letterSpacing: '1px' }}>
            {lang === 'en' ? 'CLIENT ' : 'MGA '}<span style={{ color: '#eaa974' }}>REVIEWS</span>
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', margin: 0 }}>
            {lang === 'en' 
              ? 'Read genuine experiences and transparent ride logs submitted by our community drivers.'
              : 'Basahin ang mga tunay na karanasan at transparent ride logs na ipinasa ng ating mga drivers.'}
          </p>
        </div>

        {/* REVIEWS DISPATCH HANDLING LIST */}
        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            {lang === 'en' ? 'No verified client logs posted yet.' : 'Wala pang naka-post na verified client review.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {reviews.map((rev) => (
              <div 
                key={rev.id} 
                style={{ 
                  backgroundColor: 'rgba(30, 41, 59, 0.6)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '16px', 
                  padding: '1.5rem', 
                  textAlign: 'left',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div>
                    <strong style={{ color: '#eaa974', fontSize: '1.05rem', letterSpacing: '0.5px' }}>@{rev.pangalan_ng_kliyente}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '12px' }}>
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.95rem' }}>{renderStars(rev.rating)}</div>
                </div>
                
                <div style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: '700',
                  color: '#ffffff', 
                  display: 'inline-block', 
                  backgroundColor: 'rgba(234, 169, 116, 0.15)', 
                  border: '1px solid rgba(234, 169, 116, 0.3)',
                  padding: '4px 10px', 
                  borderRadius: '8px', 
                  marginBottom: '12px'
                }}>
                  Grid Unit: {rev.motor_na_narkila}
                </div>

                <p style={{ fontSize: '1rem', color: '#f1f5f9', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>
                  "{rev.mensahe_ng_review || rev.komento || rev.message}"
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}