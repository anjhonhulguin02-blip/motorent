import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminDashboard({ onStatusUpdate, lang }) {
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('active'); 

  const fetchAllBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('mga_arkila')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setAllBookings(data);
        checkAndAutoCompleteRentals(data);
      }
    } catch (err) {
      console.error("System error fetching admin bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateMotorAvailability = async (bikeName, isAvailable) => {
    try {
      const statusValue = isAvailable ? 'Available' : 'Rented';
      const { error } = await supabase
        .from('mga_motor')
        .update({ estado: statusValue, status: statusValue, availability: isAvailable })
        .eq('pangalan', bikeName);
        
      if (error) {
        await supabase
          .from('bikes')
          .update({ status: statusValue })
          .eq('bike_name', bikeName);
      }
    } catch (e) {
      console.log("Bike tracking system table skip update:", e.message);
    }
  };

  const checkAndAutoCompleteRentals = async (bookingsList) => {
    const ngayon = new Date();
    const approvedRentals = bookingsList.filter(
      (b) => (b.status_ng_renta === 'Approved' || b.current_status === 'Approved') && b.created_at
    );

    for (const booking of approvedRentals) {
      const gawaNoong = new Date(booking.created_at);
      const tagal = Number(booking.tagal_ng_arkila) || 1;
      const rateType = booking.napiling_rate || '';
      const isHour = rateType === 'hr' || rateType.includes('hour') || rateType.includes('hrs');
      
      const takdangBalik = new Date(gawaNoong.getTime());
      if (isHour) {
        takdangBalik.setHours(takdangBalik.getHours() + tagal);
      } else {
        takdangBalik.setDate(takdangBalik.getDate() + tagal);
      }

      if (ngayon >= takdangBalik) {
        try {
          const { error } = await supabase
            .from('mga_arkila')
            .update({ status_ng_renta: 'Completed' })
            .eq('id', booking.id);

          if (!error) {
            const bikeName = booking.pangalan_ng_motor || booking.uri_ng_arkila;
            await updateMotorAvailability(bikeName, true);
            if (onStatusUpdate) onStatusUpdate();
          }
        } catch (e) {
          console.error("Auto-completion update failed:", e);
        }
      }
    }
  };

  useEffect(() => {
    fetchAllBookings();

    const mgaArkilaChannel = supabase
      .channel('realtime-mga-arkila')
      .on('postgres_changes', { event: '*', pattern: 'public', table: 'mga_arkila' }, () => {
        fetchAllBookings();
      })
      .subscribe();

    const autoCheckInterval = setInterval(() => {
      setAllBookings((currentBookings) => {
        checkAndAutoCompleteRentals(currentBookings);
        return currentBookings;
      });
    }, 30000);

    return () => {
      supabase.removeChannel(mgaArkilaChannel);
      clearInterval(autoCheckInterval);
    };
  }, []);

  const updateStatus = async (id, newStatus, bikeName) => {
    try {
      const { error } = await supabase
        .from('mga_arkila')
        .update({ status_ng_renta: newStatus })
        .eq('id', id);

      if (!error) {
        if (newStatus === 'Approved') {
          await updateMotorAvailability(bikeName, false);
        } else if (newStatus === 'Completed' || newStatus === 'Rejected') {
          await updateMotorAvailability(bikeName, true);
        }

        alert(lang === 'en' ? `Status has been changed to ${newStatus}!` : `Ang status ay nabago sa ${newStatus}!`);
        await fetchAllBookings();
        if (onStatusUpdate) onStatusUpdate();
      } else {
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBookingRecord = async (id) => {
    const confirmationText = lang === 'en' 
      ? "Are you sure you want to permanently delete this record from the system?" 
      : "Sigurado ka bang gusto mo itong burahin sa system nang tuluyan?";
    if (!window.confirm(confirmationText)) return;
    
    try {
      const { error } = await supabase
        .from('mga_arkila')
        .delete()
        .eq('id', id);

      if (!error) {
        alert(lang === 'en' ? "Record permanently deleted!" : "Record tuluyan nang nabura!");
        await fetchAllBookings();
      } else {
        alert(`Error deleting record: ${error.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getRateUnitLabel = (rateType) => {
    if (!rateType) return lang === 'en' ? 'day(s)' : 'araw';
    if (rateType === 'day') return lang === 'en' ? 'day(s)' : 'araw';
    return lang === 'en' ? 'hour(s)' : 'oras';
  };

  const activeRequests = allBookings.filter(b => b.status_ng_renta !== 'Completed' && b.status_ng_renta !== 'Rejected');
  const completedHistory = allBookings.filter(b => b.status_ng_renta === 'Completed' || b.status_ng_renta === 'Rejected');
  const displayedBookings = currentTab === 'active' ? activeRequests : completedHistory;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-color)' }}>
        <h3>{lang === 'en' ? '🔄 Loading Management Panel...' : '🔄 Kinukuha ang mga booking request...'}</h3>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--text-color)', margin: 0 }}>
          👑 {lang === 'en' ? 'Owner / Admin Rental Dashboard' : 'Dashboard ng Pamamahala (Admin)'}
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button onClick={() => setCurrentTab('active')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', color: currentTab === 'active' ? 'var(--primary-color)' : 'var(--text-muted)', borderBottom: currentTab === 'active' ? '2px solid var(--primary-color)' : 'none' }}>
          📥 {lang === 'en' ? `Active Requests (${activeRequests.length})` : `Mga Kasalukuyang Request (${activeRequests.length})`}
        </button>
        <button onClick={() => setCurrentTab('history')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', color: currentTab === 'history' ? 'var(--primary-color)' : 'var(--text-muted)', borderBottom: currentTab === 'history' ? '2px solid var(--primary-color)' : 'none' }}>
          🗄️ {lang === 'en' ? `Completed History (${completedHistory.length})` : `History / Tapos na (${completedHistory.length})`}
        </button>
      </div>

      {displayedBookings.length === 0 ? (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: 'var(--text-color)', opacity: 0.7 }}>
          {lang === 'en' ? 'No logs found in this tab.' : 'Walang logs sa tab na ito.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {displayedBookings.map((booking) => {
            const status = booking.status_ng_renta || 'Pending';
            const bikeName = booking.pangalan_ng_motor || booking.uri_ng_arkila || 'Unknown Unit';
            const rawMethod = booking.paraan_ng_pagbayad || booking.paraan_ng_bayad || 'COD';
            const paymentParts = String(rawMethod).split(' | ');
            const paymentMethodName = paymentParts[0];
            const proofUrl = paymentParts.length > 1 && paymentParts[1].startsWith('http') ? paymentParts[1] : null;

            return (
              <div key={booking.id} style={{ backgroundColor: 'rgba(30, 45, 47, 0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-color)', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6, backgroundColor: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '4px', width: 'fit-content', fontFamily: 'monospace' }}>
                    UID: {booking.kliyente_id || booking.user_id || 'N/A'}
                  </span>
                  <h3 style={{ margin: '0.2rem 0', color: '#ff6b6b' }}>{bikeName}</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    <strong>{lang === 'en' ? 'Duration:' : 'Tagal:'}</strong> {booking.tagal_ng_arkila || '1'} {getRateUnitLabel(booking.napiling_rate)}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    <strong>{lang === 'en' ? 'Method:' : 'Paraan:'}</strong> {paymentMethodName}
                  </p>

                  {proofUrl ? (
                    <div style={{ marginTop: '8px' }}>
                      <a href={proofUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', backgroundColor: '#f1c40f', color: '#000', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        🖼️ {lang === 'en' ? 'View GCash Receipt' : 'Tingnan ang Resibo'}
                      </a>
                    </div>
                  ) : (
                    (paymentMethodName.toUpperCase() === 'GCASH' || paymentMethodName.toUpperCase() === 'E-WALLET') && (
                      <span style={{ fontSize: '0.8rem', color: '#e74c3c', fontStyle: 'italic', marginTop: '4px' }}>
                        ⚠️ {lang === 'en' ? 'No proof uploaded yet' : 'Walang resibong na-upload'}
                      </span>
                    )
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem', minWidth: '220px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff' }}>₱{(booking.kabuuang_bayad || 0).toLocaleString()}</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-color)', opacity: 0.6 }}>Status: </span>
                      <strong style={{ color: status === 'Approved' ? '#2ecc71' : status === 'Rejected' ? '#e74c3c' : status === 'Completed' ? '#3498db' : '#ffb300' }}>{status}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {status === 'Pending' && (
                      <button onClick={() => updateStatus(booking.id, 'Approved', bikeName)} style={{ padding: '8px 14px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                        ✔️ {lang === 'en' ? 'Approve' : 'Aprubahan'}
                      </button>
                    )}

                    {status === 'Pending' && (
                      <button onClick={() => updateStatus(booking.id, 'Rejected', bikeName)} style={{ padding: '8px 14px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                        ❌ {lang === 'en' ? 'Reject' : 'Tanggihan'}
                      </button>
                    )}

                    {status === 'Approved' && (
                      <button onClick={() => updateStatus(booking.id, 'Completed', bikeName)} style={{ padding: '10px 16px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                        🏍️ {lang === 'en' ? 'Mark as Completed' : 'Mark as Completed / Ibalik'}
                      </button>
                    )}

                    {(status === 'Completed' || status === 'Rejected') && (
                      <button onClick={() => deleteBookingRecord(booking.id)} style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        🗑️ {lang === 'en' ? 'Delete Record' : 'Burahin ang Record'}
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