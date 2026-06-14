import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminDashboard({ onStatusUpdate, lang }) {
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. KUNIN ANG LAHAT NG RENTAL REQUESTS MULA SA SUPABASE
  const fetchAllBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mga_arkila')
        .select('*')
        .order('created_at', { ascending: false }); // Pinakabagong booking ang mauuna

      if (error) throw error;

      if (data) {
        setAllBookings(data);
      }
    } catch (err) {
      console.error("System error fetching admin bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  // 2. CONTROLLER FUNCTION PARA SA STATUS UPDATE (Approve, Reject, Complete)
  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('mga_arkila')
        .update({ status_ng_renta: newStatus })
        .eq('id', id);

      if (!error) {
        alert(lang === 'en' ? `Status updated to ${newStatus}! ` : `Ang status ay nabago sa ${newStatus}! `);
        
        // I-refresh ang local view at ang global active tracker sa App.jsx sa tamang pagkakasunod-sunod
        await fetchAllBookings();
        if (onStatusUpdate) onStatusUpdate();
      } else {
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Helper para sa tamang yunit ng oras/araw base sa napiling rate package
  const getRateUnitLabel = (rateType) => {
    if (!rateType) return lang === 'en' ? 'day(s)' : 'araw';
    if (rateType === 'day') return lang === 'en' ? 'day(s)' : 'araw';
    return lang === 'en' ? 'hour(s)' : 'oras';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-color)' }}>
        <h3>{lang === 'en' ? '🔄 Loading Rental System requests...' : '🔄 Kinukuha ang mga booking request...'}</h3>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      {/* HEADER CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: 'var(--text-color)', margin: 0 }}>
          👑 {lang === 'en' ? 'Owner / Admin Rental Dashboard' : 'Dashboard ng Pamamahala (Admin)'}
        </h2>
        <button 
          onClick={fetchAllBookings}
          style={{
            background: 'var(--primary-color, #ff6b6b)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🔄 {lang === 'en' ? 'Refresh List' : 'I-refresh ang Listahan'}
        </button>
      </div>

      <hr style={{ borderColor: 'rgba(255,255,255,0.1)', marginBottom: '2rem' }} />

      {/* RENDER EMPTY STATE */}
      {allBookings.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--card-bg, rgba(255,255,255,0.02))',
          border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
          padding: '3rem',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'var(--text-color)',
          opacity: 0.7
        }}>
          {lang === 'en' ? 'No active rental requests found.' : 'Walang kasalukuyang active rental requests.'}
        </div>
      ) : (
        /* RENDER BOOKINGS CONTAINER GRID */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {allBookings.map((booking) => {
            const status = booking.status_ng_renta || 'Pending';
            
            return (
              <div 
                key={booking.id}
                style={{
                  backgroundColor: 'rgba(30, 45, 47, 0.4)',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.5rem'
                }}
              >
                {/* KALIWANG BAHAGI: DETALYE NG KLAYENTE AT MOTOR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-color)' }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6, backgroundColor: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '4px', width: 'fit-content', fontFamily: 'monospace' }}>
                    UID: {booking.kliyente_id || booking.user_id || 'N/A'}
                  </span>
                  <h3 style={{ margin: '0.2rem 0', color: '#ff6b6b' }}>
                    {booking.pangalan_ng_motor || 'Unknown Unit'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    <strong>{lang === 'en' ? 'Duration:' : 'Tagal:'}</strong> {booking.tagal_ng_arkila || '1'} {getRateUnitLabel(booking.napiling_rate)}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    <strong>{lang === 'en' ? 'Method:' : 'Paraan:'}</strong> {booking.paraan_ng_bayad || 'COD'}
                  </p>
                  <span style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: '4px' }}>
                    {lang === 'en' ? 'Created at: ' : 'Nilikha noong: '} {booking.created_at ? new Date(booking.created_at).toLocaleString() : 'N/A'}
                  </span>
                </div>

                {/* KANANG BAHAGI: PRESYO, KASALUKUYANG STATUS, AT MGA ACTIONS */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem', minWidth: '220px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff' }}>
                      ₱{(booking.kabuuang_bayad || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-color)', opacity: 0.6 }}>
                        {lang === 'en' ? 'Current Status: ' : 'Kasalukuyang Status: '}
                      </span>
                      <strong style={{
                        color: status === 'Approved' ? '#2ecc71' : status === 'Rejected' ? '#e74c3c' : status === 'Completed' ? '#3498db' : '#ffb300'
                      }}>
                        {status}
                      </strong>
                    </div>
                  </div>

                  {/* ACTION CONTROLLERS BOX */}
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    
                    {/* BUTTON 1: APPROVE (Itatago kapag Approved/Completed/Rejected na) */}
                    {status === 'Pending' && (
                      <button
                        onClick={() => updateStatus(booking.id, 'Approved')}
                        style={{
                          padding: '8px 14px',
                          backgroundColor: '#2ecc71',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        ✔️ {lang === 'en' ? 'Approve' : 'Aprubahan'}
                      </button>
                    )}

                    {/* BUTTON 2: REJECT (Lilitaw lang kapag Pending pa ang transaction) */}
                    {status === 'Pending' && (
                      <button
                        onClick={() => updateStatus(booking.id, 'Rejected')}
                        style={{
                          padding: '8px 14px',
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        ❌ {lang === 'en' ? 'Reject' : 'Tanggihan'}
                      </button>
                    )}

                    {/* BUTTON 3: MARK AS COMPLETED (Lilitaw LANG kapag ang status ay Approved) */}
                    {status === 'Approved' && (
                      <button
                        onClick={() => updateStatus(booking.id, 'Completed')}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        🏍️ {lang === 'en' ? 'Mark as Completed' : 'Tapos na ang Renta / Ibalik'}
                      </button>
                    )}

                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}