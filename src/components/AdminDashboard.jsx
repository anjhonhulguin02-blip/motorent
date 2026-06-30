import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import mainWebsiteBg from '../assets/BG.png';

export default function AdminDashboard({ onStatusUpdate, lang }) {
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('active'); 
  const [selectedProofImg, setSelectedProofImg] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const calculateEndTime = (booking) => {
    let startDate;
    
    if (booking.petsa_ng_pagkuha) {
      const timeString = booking.oras_ng_pagkuha || '00:00';
      const combinedDateTime = `${booking.petsa_ng_pagkuha} ${timeString}`;
      startDate = new Date(combinedDateTime);
      
      if (isNaN(startDate.getTime())) {
        startDate = new Date(booking.created_at);
      }
    } else {
      startDate = new Date(booking.created_at);
    }

    const packageStr = (booking.uri_ng_arkila || '').toLowerCase();
    let baseHours = 24; 
    
    if (packageStr.includes('per hour') || packageStr.includes('hourly')) {
      baseHours = 1;
    } else if (packageStr.includes('12')) {
      baseHours = 12;
    } else if (packageStr.includes('24') || packageStr.includes('1 day') || packageStr.includes('magdamagan')) {
      baseHours = 24;
    } else if (packageStr.includes('week')) {
      baseHours = 168;
    } else {
      const match = packageStr.match(/(\d+)\s*hour/);
      if (match) baseHours = parseInt(match[1], 10);
    }

    const multiplier = booking.tagal_ng_arkila || 1;
    const totalMillisecondsToAdd = baseHours * multiplier * 60 * 60 * 1000;

    return new Date(startDate.getTime() + totalMillisecondsToAdd);
  };

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
      } else {
        setAllBookings([]);
      }
    } catch (err) {
      console.error("System error fetching admin bookings:", err);
      setAllBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // 🌟 INAYOS NA STATUS UPDATE (Kasama na ang Availability ng Motor)
  const updateStatus = async (bookingId, newStatus, bikeName) => {
    if (!bookingId) return;
    try {
      // 1. I-update ang status ng arkila
      const { error: mainError } = await supabase
        .from('mga_arkila')
        .update({ status: newStatus, status_ng_renta: newStatus })
        .eq('id', bookingId);

      if (mainError) throw mainError;

      // 2. I-update ang status ng motor sa database (Para hindi mag-double book)
      let bikeStatus = 'Available'; 
      if (newStatus === 'Approved') {
        bikeStatus = 'Rented'; // Hide sa iba
      } else if (newStatus === 'Pending' || newStatus === 'Rejected' || newStatus === 'Completed') {
        bikeStatus = 'Available'; // Ipakita ulit sa iba
      }

      const { error: bikeError } = await supabase
        .from('mga_motor') 
        .update({ status: bikeStatus }) 
        .eq('pangalan', bikeName); 

      if (bikeError) {
        console.error("Error updating motorcycle availability:", bikeError);
      }

      if (typeof onStatusUpdate === 'function') {
        onStatusUpdate(bikeName, newStatus);
      }

      alert(lang === 'en' ? `Booking successfully marked as ${newStatus}!` : `Matagumpay na nailipat ang booking sa status na: ${newStatus}!`);
      fetchAllBookings(); 
    } catch (err) {
      console.error("Error setting control state status:", err);
      alert("Operational failure updating status logs: " + err.message);
    }
  };

  const deleteBookingRecord = async (bookingId) => {
    if (!bookingId) return;
    const confirmCheck = window.confirm(lang === 'en' ? "Are you sure you want to permanently delete this archive record?" : "Sigurado ka bang nais mong burahin nang tuluyan ang record na ito?");
    if (!confirmCheck) return;

    try {
      const { error } = await supabase.from('mga_arkila').delete().eq('id', bookingId);
      if (error) throw error;
      alert(lang === 'en' ? "Record successfully purged." : "Matagumpay na nabura ang archival logs.");
      fetchAllBookings();
    } catch (err) {
      console.error("Failure processing delete protocol:", err);
      alert("Error processing delete pipeline: " + err.message);
    }
  };

  // 🌟 INAYOS NA AUTO-COMPLETE (Ibabalik sa "Available" ang motor)
  const checkAndAutoCompleteRentals = (bookingsList) => {
    if (!bookingsList || bookingsList.length === 0) return;
    const realTimeNow = new Date();
    
    bookingsList.forEach(async (booking) => {
      const status = booking.status_ng_renta || booking.status;
      const bikeName = booking.pangalan_ng_motor || booking.motor_na_arkila;

      if (status === 'Approved') {
        const expectedEndTime = calculateEndTime(booking);
        
        if (realTimeNow >= expectedEndTime) {
          try {
            // 1. Kumpletuhin ang arkila
            await supabase
              .from('mga_arkila')
              .update({ status: 'Completed', status_ng_renta: 'Completed' })
              .eq('id', booking.id);

            // 2. Gawing 'Available' ulit ang motor
            await supabase
              .from('mga_motor')
              .update({ status: 'Available' })
              .eq('pangalan', bikeName);

          } catch (e) {
            console.error("Auto expiration routine intercept error:", e);
          }
        }
      }
    });
  };

  useEffect(() => {
    fetchAllBookings();
    
    const liveSubscription = supabase
      .channel('table-db-live-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mga_arkila' }, () => {
        fetchAllBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(liveSubscription);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const autoChecker = setInterval(() => {
      checkAndAutoCompleteRentals(allBookings);
    }, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(autoChecker);
    };
  }, [allBookings]);

  const filteredCollections = allBookings.filter((b) => {
    const activeState = b.status_ng_renta || b.status || 'Pending';
    if (currentTab === 'active') {
      return activeState === 'Pending' || activeState === 'Approved';
    } else {
      return activeState === 'Completed' || activeState === 'Rejected';
    }
  });

  if (loading) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '1.2rem', fontWeight: 'bold' }}>
        {lang === 'en' ? 'Loading Master Control Database...' : 'Kinakarga ang Master Control Database...'}
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      backgroundImage: `url(${mainWebsiteBg})`, backgroundSize: '100% 100%',
      backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
      boxSizing: 'border-box', padding: '130px 2rem 4rem 2rem',
      backgroundColor: '#0f172a'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ffffff', margin: '0 0 0.5rem 0', letterSpacing: '1px' }}>
            ADMIN <span style={{ color: '#eaa974' }}>DASHBOARD</span>
          </h2>
          <div style={{ width: '60px', height: '4px', backgroundColor: '#eaa974', margin: '0 auto 1rem auto', borderRadius: '2px' }}></div>
          
          <div style={{ color: '#cbd5e1', fontSize: '1rem', fontWeight: '600', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
            {currentTime.toLocaleDateString(lang === 'en' ? 'en-US' : 'fil-PH', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })} | <span style={{ color: '#eaa974' }}>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <button 
            onClick={() => setCurrentTab('active')}
            style={{
              padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              backgroundColor: currentTab === 'active' ? '#eaa974' : 'rgba(255,255,255,0.05)',
              color: currentTab === 'active' ? '#151c29' : '#cbd5e1'
            }}
          >
            {lang === 'en' ? 'Active Bookings' : 'Mga Kasalukuyang Arkila'}
          </button>
          <button 
            onClick={() => setCurrentTab('history')}
            style={{
              padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              backgroundColor: currentTab === 'history' ? '#eaa974' : 'rgba(255,255,255,0.05)',
              color: currentTab === 'history' ? '#151c29' : '#cbd5e1'
            }}
          >
            {lang === 'en' ? 'Transaction History' : 'Kasaysayan ng Transaksyon'}
          </button>
        </div>

        <div style={{
          backgroundColor: 'rgba(21, 28, 41, 0.9)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }}>
          {filteredCollections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#94a3b8', fontSize: '1rem' }}>
              {lang === 'en' ? 'No booking records found in this category.' : 'Walang nakitang tala ng transaksyon sa kategoryang ito.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(234, 169, 116, 0.08)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '18px 20px', color: '#eaa974', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>Motorcycle</th>
                    <th style={{ padding: '18px 20px', color: '#eaa974', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>User ID Token</th>
                    <th style={{ padding: '18px 20px', color: '#eaa974', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>Rental Timeline</th>
                    <th style={{ padding: '18px 20px', color: '#eaa974', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>Total Payment</th>
                    <th style={{ padding: '18px 20px', color: '#eaa974', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>Proof</th>
                    <th style={{ padding: '18px 20px', color: '#eaa974', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollections.map((booking) => {
                    const bikeName = booking.pangalan_ng_motor || booking.motor_na_arkila || 'Unknown Unit';
                    const totalPrice = booking.kabuuang_bayad || booking.kabuuang_halaga || 0;
                    const status = booking.status_ng_renta || booking.status || 'Pending';
                    
                    const receiptUrl = booking.resibo_url || booking.proof_of_payment || booking.proof || null;
                    const govIdUrl = booking.id_gobyerno_url || booking.valid_id_url || booking.id_url || booking.id_picture_url || booking.id_picture || null;

                    const endTime = calculateEndTime(booking);
                    const isExpired = currentTime >= endTime;

                    return (
                      <tr 
                        key={booking.id} 
                        style={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                            <span style={{ color: '#ffffff', fontWeight: '800', fontSize: '1.05rem' }}>{bikeName}</span>
                            <span style={{
                              padding: '3px 10px', borderRadius: '99px', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px',
                              backgroundColor: status === 'Pending' ? 'rgba(234, 169, 116, 0.15)' : status === 'Approved' ? 'rgba(34, 197, 94, 0.15)' : status === 'Completed' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: status === 'Pending' ? '#eaa974' : status === 'Approved' ? '#22c55e' : status === 'Completed' ? '#3b82f6' : '#ef4444'
                            }}>
                              {status}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '20px' }}>
                          <div style={{ 
                            color: '#cbd5e1', 
                            fontFamily: 'monospace', 
                            fontSize: '0.85rem', 
                            maxWidth: '180px', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.03)'
                          }} title={booking.user_id || booking.kliyente_id}>
                            {booking.user_id || booking.kliyente_id || 'N/A'}
                          </div>
                        </td>

                        <td style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '600' }}>{booking.uri_ng_arkila || 'N/A'}</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Duration: <strong style={{ color: '#eaa974' }}>{booking.tagal_ng_arkila || 1}x</strong></span>
                            
                            {status === 'Approved' && (
                              <div style={{ 
                                marginTop: '6px', padding: '6px 8px', borderRadius: '6px', 
                                backgroundColor: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                border: `1px solid ${isExpired ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                              }}>
                                <span style={{ color: '#cbd5e1', fontSize: '0.7rem', display: 'block' }}>Expected Return:</span>
                                <span style={{ color: isExpired ? '#ef4444' : '#22c55e', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  {endTime.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ color: '#eaa974', fontWeight: '900', fontSize: '1.2rem' }}>₱{totalPrice}</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>via {booking.paraan_ng_pagbayad || 'N/A'}</span>
                          </div>
                        </td>

                        <td style={{ padding: '20px' }}>
                          {receiptUrl ? (
                            <button
                              onClick={() => setSelectedProofImg(receiptUrl)}
                              style={{
                                backgroundColor: 'rgba(234, 169, 116, 0.1)',
                                border: '1px solid rgba(234, 169, 116, 0.4)',
                                color: '#eaa974',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'block'
                              }}
                              onMouseEnter={(e) => { e.target.style.backgroundColor = '#eaa974'; e.target.style.color = '#151c29'; }}
                              onMouseLeave={(e) => { e.target.style.backgroundColor = 'rgba(234, 169, 116, 0.1)'; e.target.style.color = '#eaa974'; }}
                            >
                              {lang === 'en' ? 'View Proof' : 'Tingnan'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', display: 'block' }}>
                              {booking.paraan_ng_pagbayad === 'Cash' ? 'Cash Basis' : 'No Image'}
                            </span>
                          )}

                          {govIdUrl && (
                            <button
                              onClick={() => setSelectedProofImg(govIdUrl)}
                              style={{
                                backgroundColor: 'transparent',
                                border: '1px solid #f472b6',
                                color: '#f472b6',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                marginTop: '8px',
                                display: 'block',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(244, 114, 182, 0.1)'; }}
                              onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
                            >
                              🪪 {lang === 'en' ? 'View Gov ID' : 'Tingnan ang ID'}
                            </button>
                          )}
                        </td>

                        <td style={{ padding: '20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            {status === 'Pending' && (
                              <>
                                <button 
                                  onClick={() => updateStatus(booking.id, 'Approved', bikeName)} 
                                  style={{ padding: '8px 14px', backgroundColor: '#22c55e', color: '#151c29', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                  {lang === 'en' ? 'Approve' : 'Pahintulutan'}
                                </button>
                                <button 
                                  onClick={() => updateStatus(booking.id, 'Rejected', bikeName)} 
                                  style={{ padding: '8px 14px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                  {lang === 'en' ? 'Reject' : 'Tanggihan'}
                                </button>
                              </>
                            )}

                            {status === 'Approved' && (
                              <button 
                                onClick={() => updateStatus(booking.id, 'Completed', bikeName)} 
                                style={{ padding: '10px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                {lang === 'en' ? 'Mark as Completed' : 'Ibalik ang Motor'}
                              </button>
                            )}

                            {(status === 'Completed' || status === 'Rejected') && (
                              <button 
                                onClick={() => deleteBookingRecord(booking.id)} 
                                style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }} 
                                onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }} 
                                onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
                              >
                                {lang === 'en' ? 'Delete' : 'Burahin'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {selectedProofImg && (
        <div 
          onClick={() => setSelectedProofImg(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '2rem'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '450px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedProofImg(null)}
              style={{
                position: 'absolute',
                top: '-40px', right: '0px',
                background: 'none', border: 'none',
                color: '#ffffff', fontSize: '1.5rem',
                cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              ✕ Close
            </button>
            <img 
              src={selectedProofImg} 
              alt="Proof of payment verification file" 
              style={{
                width: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '16px',
                border: '3px solid rgba(234, 169, 116, 0.6)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}