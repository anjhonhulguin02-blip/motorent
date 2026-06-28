import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-color)' }}>
        <p>⏳ Loading transparency wall...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-color)', fontSize: '2rem', margin: '0 0 0.5rem 0' }}>
          🛡️ {lang === 'en' ? 'Customer Transparency & Reviews' : 'Katapatan at Mga Review ng Kliyente'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {lang === 'en' 
            ? '100% verified feedback collected directly from verified completed bike transactions.' 
            : '100% totoong tugon mula sa mga nakakumpleto ng kanilang arkila.'}
        </p>
      </div>

      {reviews.length === 0 ? (
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {lang === 'en' ? 'No verified transparency logs yet.' : 'Sa kasalukuyan ay wala pang naisusulat na review.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map((rev) => (
            <div key={rev.id} style={{ backgroundColor: 'rgba(30, 45, 47, 0.4)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <strong style={{ color: 'var(--primary-color)', fontSize: '1rem' }}>@{rev.pangalan_ng_kliyente}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem' }}>{renderStars(rev.rating)}</div>
              </div>
              
              <div style={{ fontSize: '0.8rem', color: '#ff6b6b', display: 'inline-block', backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                🏍️ {rev.motor_na_narkila}
              </div>

              <p style={{ margin: 0, color: 'var(--text-color)', fontSize: '0.95rem', fontStyle: 'italic', lineHeight: '1.4' }}>
                "{rev.komento}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}