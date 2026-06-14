import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Dashboard({ user, lang }) {
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      let activeId = user?.id;
      if (!activeId) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeId = sessionData?.session?.user?.id;
      }

      if (!activeId) {
        setLoading(false);
        return;
      }

      // Kukunin ang lahat ng booking na pagmamay-ari ng kasalukuyang nag-log in na user_id
      const { data, error } = await supabase
        .from('mga_arkila')
        .select('*')
        .eq('user_id', activeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Primary fetch failed, attempting fallback filter...");
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('mga_arkila')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (fallbackError) throw fallbackError;
        
        if (fallbackData) {
          const filtered = fallbackData.filter(b => b.user_id === activeId || b.kliyente_id === activeId);
          setMyBookings(filtered);
          return;
        }
      }

      if (data) setMyBookings(data);
    } catch (err) {
      console.error("Dashboard error logging execution:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, [user]);

  const getRateUnitLabel = (booking) => {
    const rate = booking.napiling_rate || '';
    if (rate === 'hr' || rate.includes('hour') || rate.includes('hrs')) {
      return lang === 'en' ? 'hour(s)' : 'oras';
    }
    return lang === 'en' ? 'day(s)' : 'araw';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-color)' }}>
        <h3>{lang === 'en' ? '⏳ Fetching operations data...' : '⏳ Kinukuha ang listahan ng inyong arkila...'}</h3>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--text-color)', margin: 0, fontSize: '1.8rem' }}>
          📊 {lang === 'en' ? 'Your Rental Dashboard' : 'Dashboard ng iyong mga Arkila'}
        </h2>
        <button onClick={fetchMyBookings} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-color)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
          🔄 {lang === 'en' ? 'Refresh' : 'I-refresh'}
        </button>
      </div>

      {myBookings.length === 0 ? (
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: 'var(--text-color)' }}>
          {lang === 'en' ? 'No active rental requests found.' : 'Walang nahanap na kasalukuyang arkila.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {myBookings.map((booking) => {
            
            // 🎯 ULTRA FALLBACK FIX:
            // Babasahin nito ang LAHAT ng posibleng variation ng column name na ginawa sa database
            // para makuha ang totoong status na binago ng Admin dashboard mo.
            const status = 
              booking.current_status || 
              booking.current_status_ng_renta ||
              booking.status_ng_renta || 
              booking.status || 
              'Pending';

            const price = booking.kabuuang_bayad || 0;
            const bikeName = booking.uri_ng_arkila || booking.pangalan_ng_motor || 'Premium Unit';
            const durationNum = booking.tagal_ng_arkila || 1;

            return (
              <div key={booking.id} style={{ backgroundColor: 'rgba(30, 45, 47, 0.5)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                
                <div style={{ color: 'var(--text-color)', textAlign: 'left' }}>
                  <h3 style={{ margin: '0 0 0.4rem 0', color: '#ff6b6b', fontSize: '1.25rem' }}>{bikeName}</h3>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>
                    <strong>{lang === 'en' ? 'Duration:' : 'Tagal:'}</strong> {durationNum} {getRateUnitLabel(booking)}
                  </p>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>
                    <strong>{lang === 'en' ? 'Method:' : 'Paraan:'}</strong> {booking.paraan_ng_pagbayad || 'GCASH'}
                  </p>
                </div>

                <div style={{ textAlign: 'right', minWidth: '160px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.4rem' }}>
                    ₱{Number(price).toLocaleString()}
                  </div>
                  <span style={{
                    display: 'inline-block', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold',
                    backgroundColor: 
                      status === 'Approved' || status === 'Completed' ? 'rgba(46, 204, 113, 0.15)' : 
                      status === 'Rejected' ? 'rgba(231, 76, 60, 0.15)' : 
                      'rgba(241, 196, 15, 0.15)',
                    color: 
                      status === 'Approved' || status === 'Completed' ? '#2ecc71' : 
                      status === 'Rejected' ? '#e74c3c' : 
                      '#f1c40f',
                    border: `1px solid ${
                      status === 'Approved' || status === 'Completed' ? '#2ecc71' : 
                      status === 'Rejected' ? '#e74c3c' : 
                      '#f1c40f'
                    }`
                  }}>
                    {status === 'Pending' ? (lang === 'en' ? '⏳ Pending Verification' : '⏳ Naghihintay ng Apruba') : status}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}