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
    
    if (booking.tunay_na_oras_ng_kuha) {
      startDate = new Date(booking.tunay_na_oras_ng_kuha);
    } else if (booking.petsa_ng_pagkuha) {
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
        // 🚨 KINOMENT OUT: Inalis muna ang auto-complete para mapagana ang manual checking ng Overtime/Returned status mo.
        // checkAndAutoCompleteRentals(data);
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

  const updateStatus = async (bookingId, newStatus, bikeName) => {
    if (!bookingId) return;
    try {
      let updatePayload = { status: newStatus, status_ng_renta: newStatus };

      if (newStatus === 'Picked Up') {
        updatePayload.tunay_na_oras_ng_kuha = new Date().toISOString(); 
      }

      const { error: mainError } = await supabase
        .from('mga_arkila')
        .update(updatePayload)
        .eq('id', bookingId);

      if (mainError) throw mainError;

      // 🧠 SMART ENGINE: Kapag Approved, Picked Up, o Returned — NANANATILING RESERVED/RENTED ang motor para walang maka-book habang sinusuri mo pa.
      let bikeStatus = 'Available'; 
      if (newStatus === 'Approved' || newStatus === 'Picked Up' || newStatus === 'Returned') {
        bikeStatus = 'Rented';
      } else if (newStatus === 'Pending' || newStatus === 'Rejected' || newStatus === 'Completed') {
        bikeStatus = 'Available';
      }

      const { error: bikeError } = await supabase
        .from('mga_motor') 
        .update({ status: bikeStatus }) 
        .ilike('pangalan', `%${bikeName}%`); 

      if (bikeError) {
        console.error("Error updating motorcycle availability:", bikeError);
      }

      if (typeof onStatusUpdate === 'function') {
        onStatusUpdate(bikeName, newStatus);
      }

      alert(lang === 'en' ? `Booking status updated to ${newStatus}!` : `Matagumpay na nailipat sa status na: ${newStatus}!`);
      fetchAllBookings(); 
    } catch (err) {
      console.error("Error setting control state status:", err);
      alert("Operational failure updating status logs: " + err.message);
    }
  };

  const deleteBookingRecord = async (bookingId) => {
    if (!bookingId) return;
    const confirmCheck = window.confirm(
      lang === 'en' 
        ? "Are you sure you want to remove this record from the dashboard? (It will be safely archived in the database)" 
        : "Sigurado ka bang nais mong alisin ang record na ito sa dashboard? (Mananatili itong ligtas sa iyong database/Supabase)"
    );
    if (!confirmCheck) return;

    try {
      const { error } = await supabase
        .from('mga_arkila')
        .update({ status_ng_renta: 'Archived', status: 'Archived' })
        .eq('id', bookingId);

      if (error) throw error;
      alert(lang === 'en' ? "Record successfully hidden and archived." : "Matagumpay na naitago at nai-archive ang log.");
      fetchAllBookings();
    } catch (err) {
      console.error("Failure processing soft-delete protocol:", err);
      alert("Error processing archive pipeline: " + err.message);
    }
  };

  // 🚨 OPTIONAL BACKEND CHECKER (Naka-disable sa ngayon para protektahan ang Overtime inspection flow mo)
  const checkAndAutoCompleteRentals = (bookingsList) => {
    if (!bookingsList || bookingsList.length === 0) return;
    const realTimeNow = new Date();
    
    bookingsList.forEach(async (booking) => {
      const status = booking.status_ng_renta || booking.status;
      const bikeName = booking.pangalan_ng_motor || booking.motor_na_arkila;

      if (status === 'Picked Up') {
        const expectedEndTime = calculateEndTime(booking);
        
        if (realTimeNow >= expectedEndTime) {
          try {
            await supabase
              .from('mga_arkila')
              .update({ status: 'Completed', status_ng_renta: 'Completed' })
              .eq('id', booking.id);

            await supabase
              .from('mga_motor')
              .update({ status: 'Available' })
              .ilike('pangalan', `%${bikeName}%`);

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

    // 🚨 KINOMENT OUT: Pinatay ang loop checker para hindi mag-auto-complete kapag late na ang pagsasauli
    // const autoChecker = setInterval(() => {
    //   checkAndAutoCompleteRentals(allBookings);
    // }, 15000);

    return () => {
      clearInterval(timer);
      // clearInterval(autoChecker);
    };
  }, [allBookings]);

  const filteredCollections = allBookings.filter((b) => {
    const activeState = b.status_ng_renta || b.status || 'Pending';
    if (activeState === 'Archived') return false; 

    // 🌟 KASAMA NA: Kasama na rito ang 'Returned' status para makita mo pa rin sa Active Bookings list habang pending ang inspection
    if (currentTab === 'active') {
      return activeState === 'Pending' || activeState === 'Approved' || activeState === 'Picked Up' || activeState === 'Returned';
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
      
      <style>{`
        @media (max-width: 768px) {
          button[style*="position: absolute"], 
          button[style*="position: fixed"],
          div[style*="position: absolute"] > button,
          div[style*="position: fixed"] > button {
            top: 90px !important; 
            right: 15px !important;
            z-index: 9999 !important;
          }
        }
      `}</style>

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
                    <th style={{ padding: '18px 20px', color: '#eaa974', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>Payment Method</th>
                    <th style={{ padding: '18px 20px', color: '#eaa974', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase' }}>Proof</th>
                    <th style={{ padding: '18px 20px', color: '#eaa974', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollections.map((booking) => {
                    const bikeName = booking.pangalan_ng_motor || booking.motor_na_arkila || 'Unknown Unit';
                    const totalPrice = booking.kabuuang_bayad || booking.kabuuang_halaga || 0;
                    const status = booking.status_ng_renta || booking.status || 'Pending';
                    const rawMethod = booking.paraan_ng_pagbayad || 'N/A';
                    const isCash = rawMethod.toLowerCase() === 'cash';
                    
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
                              backgroundColor: status === 'Pending' ? 'rgba(234, 169, 116, 0.15)' : status === 'Approved' ? 'rgba(245, 158, 11, 0.2)' : status === 'Picked Up' ? 'rgba(34, 197, 94, 0.15)' : status === 'Returned' ? 'rgba(168, 85, 247, 0.2)' : status === 'Completed' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: status === 'Pending' ? '#eaa974' : status === 'Approved' ? '#f59e0b' : status === 'Picked Up' ? '#22c55e' : status === 'Returned' ? '#a855f7' : status === 'Completed' ? '#3b82f6' : '#ef4444'
                            }}>
                              {status === 'Approved' ? 'Approved (Waiting)' : status === 'Returned' ? (lang === 'en' ? '🏍️ Returned (Inspecting)' : '🏍️ Nabalik Na (Sinusuri)') : status}
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <span style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '600' }}>
                              {booking.uri_ng_arkila || 'N/A'} (x{booking.tagal_ng_arkila || 1})
                            </span>
                            
                            <div style={{ 
                              fontSize: '0.78rem', 
                              color: '#cbd5e1', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: '4px', 
                              backgroundColor: 'rgba(0,0,0,0.15)', 
                              padding: '8px 12px', 
                              borderRadius: '8px', 
                              border: '1px solid rgba(255,255,255,0.04)' 
                            }}>
                              {booking.tunay_na_oras_ng_kuha ? (
                                <>
                                  <div>
                                    <strong style={{ color: '#22c55e' }}>🚀 Actual Release: </strong> 
                                    <span style={{ fontFamily: 'monospace', color: '#22c55e', fontWeight: 'bold' }}>
                                      {new Date(booking.tunay_na_oras_ng_kuha).toLocaleString(lang === 'en' ? 'en-US' : 'fil-PH', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </span>
                                  </div>
                                  <div>
                                    <strong style={{ color: status === 'Completed' ? '#3b82f6' : '#22c55e' }}>🛬 Expiration/Return: </strong> 
                                    <span style={{ fontFamily: 'monospace' }}>
                                      {endTime.toLocaleString(lang === 'en' ? 'en-US' : 'fil-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '4px 0' }}>
                                  {lang === 'en' ? 'Waiting for unit release...' : 'Naghihintay na mai-release ang motor...'}
                                </div>
                              )}
                            </div>

                            {status === 'Picked Up' && (
                              <div style={{ 
                                marginTop: '2px', padding: '4px 8px', borderRadius: '4px', textAlign: 'center',
                                backgroundColor: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                border: `1px solid ${isExpired ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                              }}>
                                <span style={{ color: isExpired ? '#ef4444' : '#22c55e', fontSize: '0.72rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                  {isExpired ? (lang === 'en' ? 'Overdue / Late Return' : 'Overdue / Huli sa Pagbabalik') : (lang === 'en' ? 'On-Going Rental' : 'Kasalukuyang Nirerentahan')}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '20px' }}>
                          <span style={{ color: '#eaa974', fontWeight: '900', fontSize: '1.2rem' }}>₱{totalPrice}</span>
                        </td>

                        <td style={{ padding: '20px' }}>
                          <span style={{
                            padding: '5px 12px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            textTransform: 'capitalize',
                            backgroundColor: isCash ? 'rgba(34, 197, 94, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                            color: isCash ? '#4ade80' : '#60a5fa',
                            border: `1px solid ${isCash ? 'rgba(34, 197, 94, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`
                          }}>
                            {isCash ? '💵 Cash' : '📱 eWallet'}
                          </span>
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
                                display: 'block',
                                width: '100%',
                                textAlign: 'center',
                                marginBottom: govIdUrl ? '6px' : '0'
                              }}
                              onMouseEnter={(e) => { e.target.style.backgroundColor = '#eaa974'; e.target.style.color = '#151c29'; }}
                              onMouseLeave={(e) => { e.target.style.backgroundColor = 'rgba(234, 169, 116, 0.1)'; e.target.style.color = '#eaa974'; }}
                            >
                              📸 {lang === 'en' ? 'Payment Receipt' : 'Resibo'}
                            </button>
                          ) : (
                            !isCash && (
                              <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', display: 'block', marginBottom: govIdUrl ? '6px' : '0' }}>
                                No Receipt Attachment
                              </span>
                            )
                          )}

                          {govIdUrl ? (
                            <button
                              onClick={() => setSelectedProofImg(govIdUrl)}
                              style={{
                                backgroundColor: 'rgba(244, 114, 182, 0.1)',
                                border: '1px solid rgba(244, 114, 182, 0.4)',
                                color: '#f472b6',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'block',
                                width: '100%',
                                textAlign: 'center',
                                transition: 'all 0.2s',
                                marginTop: (!receiptUrl && isCash) ? '0' : '4px'
                              }}
                              onMouseEnter={(e) => { e.target.style.backgroundColor = '#f472b6'; e.target.style.color = '#151c29'; }}
                              onMouseLeave={(e) => { e.target.style.backgroundColor = 'rgba(244, 114, 182, 0.1)'; e.target.style.color = '#f472b6'; }}
                            >
                              🪪 {lang === 'en' ? 'View Gov ID' : 'Tingnan ang ID'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', display: 'block' }}>
                              ⚠️ No ID Submitted
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
                                onClick={() => updateStatus(booking.id, 'Picked Up', bikeName)} 
                                style={{ padding: '10px 16px', backgroundColor: '#f59e0b', color: '#151c29', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                🔑 {lang === 'en' ? 'Release / Pick Up' : 'I-Pick Up na'}
                              </button>
                            )}

                            {/* 🌟 STEP 1: Sa halip na derecho Complete, i-Mark muna natin bilang Returned (Soli na ang Motor sa shop pero che-check-in pa) */}
                            {status === 'Picked Up' && (
                              <button 
                                onClick={() => updateStatus(booking.id, 'Returned', bikeName)} 
                                style={{ padding: '10px 16px', backgroundColor: '#a855f7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                🛬 {lang === 'en' ? 'Mark as Returned' : 'I-Mark na Nabalik'}
                              </button>
                            )}

                            {/* 🌟 STEP 2: Kapag 'Returned' na, dito mo na kukunin ang multa (kung late sila) bago tuluyang i-Settle / I-Complete ang transaksyon */}
                            {status === 'Returned' && (
                              <button 
                                onClick={() => updateStatus(booking.id, 'Completed', bikeName)} 
                                style={{ padding: '10px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                🏁 {lang === 'en' ? 'Settle & Complete' : 'I-Settle at I-Complete'}
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
            backgroundColor: 'rgba(10, 15, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1.5rem'
          }}
        >
          <div 
            style={{ 
              position: 'relative', 
              maxWidth: '420px', 
              width: '100%',
              backgroundColor: '#151c29',
              borderRadius: '20px',
              border: '2px solid rgba(234, 169, 116, 0.4)',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '100%',
              backgroundColor: 'rgba(21, 28, 41, 0.9)',
              padding: '12px 16px',
              boxSizing: 'border-box',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
              <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '700' }}>
                {lang === 'en' ? 'Document Preview' : 'Pagsusuri ng Dokumento'}
              </span>
              <button 
                onClick={() => setSelectedProofImg(null)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444', 
                  fontSize: '0.85rem',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer', 
                  fontWeight: '900',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = '#ef4444'; e.target.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.target.style.color = '#ef4444'; }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', backgroundColor: '#0f172a' }}>
              <img 
                src={selectedProofImg} 
                alt="Verification File Layout" 
                style={{
                  width: '100%',
                  maxHeight: '55vh', 
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}