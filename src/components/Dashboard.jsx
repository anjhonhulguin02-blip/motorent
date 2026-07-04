import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import mainWebsiteBg from '../assets/BG.png';

// 🚨 SAFETY FIX: Naka-comment muna ito incase wala ka pang PaymentModalExtend.jsx file
// import PaymentModalExtend from './PaymentModalExtend'; 

export default function Dashboard({ user, lang, activeTab }) {
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('active'); 
  const [uploadingId, setUploadingId] = useState(null);
  
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedBookingIds, setReviewedBookingIds] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [selectedBookingForExtend, setSelectedBookingForExtend] = useState(null);

  // 🚨 SAFETY FIX: Ligtas na pagbasa sa LocalStorage
  const [hiddenHistoryIds, setHiddenHistoryIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`hidden_bookings_${user?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const calculateEndTime = (booking) => {
    let startDate;
    if (booking.tunay_na_oras_ng_kuha) {
      startDate = new Date(booking.tunay_na_oras_ng_kuha);
    } else if (booking.petsa_ng_pagkuha) {
      const timeString = booking.oras_ng_pagkuha || '00:00';
      const combinedDateTime = `${booking.petsa_ng_pagkuha} ${timeString}`;
      startDate = new Date(combinedDateTime);
      if (isNaN(startDate.getTime())) startDate = new Date(booking.created_at);
    } else {
      startDate = new Date(booking.created_at);
    }

    const packageStr = String(booking.uri_ng_arkila || '').toLowerCase();
    let baseHours = 24; 
    if (packageStr.includes('per hour') || packageStr.includes('hourly')) baseHours = 1;
    else if (packageStr.includes('12')) baseHours = 12;
    else if (packageStr.includes('6')) baseHours = 6;
    else if (packageStr.includes('24') || packageStr.includes('1 day') || packageStr.includes('magdamagan')) baseHours = 24;

    const multiplier = Number(booking.tagal_ng_arkila) || 1;
    return new Date(startDate.getTime() + baseHours * multiplier * 60 * 60 * 1000);
  };

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      let activeId = user?.id;
      if (!activeId) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeId = sessionData?.session?.user?.id;
      }
      if (!activeId) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('mga_arkila')
        .select('*')
        .eq('user_id', activeId) 
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewedBookings = async () => {
    try {
      let activeId = user?.id;
      if (!activeId) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeId = sessionData?.session?.user?.id;
      }
      if (!activeId) return;

      const { data, error } = await supabase
        .from('mga_review')
        .select('arkila_id')
        .eq('user_id', activeId);

      if (error) return; 
      if (data) setReviewedBookingIds(data.map(r => r.arkila_id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMyBookings();
    fetchReviewedBookings();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [user, activeTab]);

  const handleIDUpload = async (e, bookingId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingId(bookingId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'guest'}_${bookingId}_${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('mga_id_bucket')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('mga_id_bucket')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('mga_arkila')
        .update({ id_gobyerno_url: publicUrlData.publicUrl })
        .eq('id', bookingId);

      if (updateError) throw updateError;
      alert(lang === 'en' ? "Government ID uploaded successfully!" : "Matagumpay na na-upload ang iyong ID!");
      fetchMyBookings();
    } catch (err) {
      alert("Upload failed.");
      console.error(err);
    } finally {
      setUploadingId(null);
    }
  };

  const submitReviewHandler = async (e) => {
    e.preventDefault();
    if (!selectedBookingForReview) return;

    setSubmittingReview(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const activeUserId = user?.id || sessionData?.session?.user?.id || selectedBookingForReview.user_id || "guest-user";
      const activeName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Client';

      const { error } = await supabase
        .from('mga_review')
        .insert([{
          arkila_id: selectedBookingForReview.id,
          user_id: activeUserId, 
          pangalan_ng_kliyente: activeName,
          rating: parseInt(rating),
          motor_na_narkila: selectedBookingForReview.pangalan_ng_motor || selectedBookingForReview.motor_na_arkila || 'Motorcycle Unit',
          komento: comment
        }]);

      if (error) throw error;
      alert(lang === 'en' ? "Thank you for your feedback!" : "Salamat sa iyong review at komento!");
      setReviewedBookingIds(prev => [...prev, selectedBookingForReview.id]);
      setSelectedBookingForReview(null);
      setComment('');
      fetchReviewedBookings();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const hideFromHistory = (bookingId) => {
    const updated = [...hiddenHistoryIds, bookingId];
    setHiddenHistoryIds(updated);
    localStorage.setItem(`hidden_bookings_${user?.id || 'guest'}`, JSON.stringify(updated));
  };

  const visibleBookings = myBookings.filter((b) => {
    if (hiddenHistoryIds.includes(b.id)) return false;
    const status = b.status_ng_renta || b.estado || b.status;
    if (currentTab === 'active') return status === 'Pending' || status === 'Approved' || status === 'Picked Up';
    if (currentTab === 'history') return status === 'Completed' || status === 'Rejected';
    return true;
  });

  const styles = {
    fontStack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    glassInput: {
      padding: '10px 14px', background: '#0e1424', color: '#fff', 
      border: '1px solid rgba(234, 169, 116, 0.2)', borderRadius: '8px', 
      width: '100%', boxSizing: 'border-box', fontSize: '0.9rem', outline: 'none'
    },
    tableHeader: {
      padding: '16px 20px', color: '#cbd5e1', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)'
    }, 
    tableCell: { 
      padding: '20px', color: '#ffffff', fontSize: '0.88rem', verticalAlign: 'middle', borderBottom: '1px solid rgba(255,255,255,0.04)' 
    }
  };

  const formatSystemDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + ` | ` + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#050811', color: '#eaa974', fontFamily: styles.fontStack }}>
        <div style={{ textAlign: 'center', letterSpacing: '1px', fontWeight: 'bold', fontSize: '0.9rem' }}>LOADING ENVIRONMENT...</div>
      </div>
    );
  }

  const lacksGovId = visibleBookings.some(b => !b.id_gobyerno_url);

  return (
    <div style={{ minHeight: '100vh', width: '100%', fontFamily: styles.fontStack, backgroundImage: `url(${mainWebsiteBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#050811', boxSizing: 'border-box', padding: '140px 2rem 4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <style>{`
        @keyframes urgentPulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); border-color: #ef4444; }
          50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); border-color: #f87171; }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); border-color: #ef4444; }
        }
        @keyframes bannerPulse {
          0% { background-color: rgba(239, 68, 68, 0.15); }
          50% { background-color: rgba(239, 68, 68, 0.3); }
          100% { background-color: rgba(239, 68, 68, 0.15); }
        }
      `}</style>

      <h1 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
        {lang === 'en' ? 'Client Dashboard' : 'Dashboard ng Arkila'}
      </h1>
      <p style={{ margin: '0 0 2rem 0', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
        {formatSystemDate(currentTime)}
      </p>

      {currentTab === 'active' && lacksGovId && visibleBookings.length > 0 && (
        <div style={{ width: '100%', maxWidth: '1100px', padding: '14px 20px', borderRadius: '14px', border: '1px solid #ef4444', animation: 'bannerPulse 2.5s infinite', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', boxSizing: 'border-box' }}>
          <span style={{ fontSize: '1.4rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <h5 style={{ margin: '0 0 2px 0', color: '#f87171', fontSize: '0.95rem', fontWeight: '800' }}>Verification Action Required!</h5>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.82rem', lineHeight: '1.4' }}>
              {lang === 'en' ? 'To complete your rental process and securely unlock your dispatched unit, please upload a clear photo of your valid Government ID or Driver License in the input field highlighted below.' : 'Upang makumpleto ang pag-arkila, mangyaring mag-upload ng malinaw na larawan ng iyong valid Government ID o Driver License sa pulang kahon sa ibaba.'}
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '6px', borderRadius: '14px', marginBottom: '1.5rem', width: '100%', maxWidth: '1100px', boxSizing: 'border-box' }}>
        <button onClick={() => setCurrentTab('active')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: currentTab === 'active' ? '#eaa974' : 'transparent', color: currentTab === 'active' ? '#0f172a' : '#94a3b8', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}>
          {lang === 'en' ? 'Active Rentals' : 'Mga Aktibong Renta'}
        </button>
        <button onClick={() => setCurrentTab('history')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: currentTab === 'history' ? '#eaa974' : 'transparent', color: currentTab === 'history' ? '#0f172a' : '#94a3b8', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}>
          {lang === 'en' ? 'Past History' : 'Kasaysayan'}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '1100px', background: 'rgba(10, 17, 32, 0.75)', border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)', borderRadius: '20px', overflowX: 'auto', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(11, 15, 26, 0.4)' }}>
              <th style={styles.tableHeader}>{lang === 'en' ? 'Motorcycle' : 'Motor'}</th>
              <th style={styles.tableHeader}>{lang === 'en' ? 'Rental Timeline' : 'Tagal ng Arkila'}</th>
              <th style={styles.tableHeader}>{lang === 'en' ? 'Total Paid' : 'Kabuuang Bayad'}</th>
              <th style={styles.tableHeader}>{lang === 'en' ? 'Payment Method' : 'Paraan ng Bayad'}</th>
              <th style={styles.tableHeader}>{lang === 'en' ? 'Proof / Verification ID' : 'Dokumento / Lisensya'}</th>
              <th style={{ ...styles.tableHeader, textAlign: 'right' }}>{lang === 'en' ? 'Actions' : 'Aksyon'}</th>
            </tr>
          </thead>
          <tbody>
            {visibleBookings.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '50px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  No current lifecycle records found.
                </td>
              </tr>
            ) : (
              visibleBookings.map((booking) => {
                const status = booking.status_ng_renta || booking.estado || booking.status;
                const isAlreadyReviewed = reviewedBookingIds.includes(booking.id);
                
                let pickupDateObj = booking.tunay_na_oras_ng_kuha ? new Date(booking.tunay_na_oras_ng_kuha) : null;
                if (!pickupDateObj && booking.petsa_ng_pagkuha) {
                  const timeString = booking.oras_ng_pagkuha || '00:00';
                  pickupDateObj = new Date(`${booking.petsa_ng_pagkuha} ${timeString}`);
                }

                const endDeadlineObj = calculateEndTime(booking);
                const isExpired = currentTime > endDeadlineObj;

                const displayPickup = pickupDateObj && !isNaN(pickupDateObj.getTime()) ? pickupDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (booking.petsa_ng_pagkuha || 'Pending Set');
                const displayReturn = endDeadlineObj && !isNaN(endDeadlineObj.getTime()) ? endDeadlineObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending Set';
                
                const displayPrice = booking.kabuuang_bayad || booking.halaga || 0;
                const displayMode = booking.paraan_ng_pagbayad || booking.paraan_ng_bayad || 'GCash';

                return (
                  <tr key={booking.id} style={{ transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    
                    <td style={styles.tableCell}>
                      <div style={{ fontWeight: '700', color: '#fff', fontSize: '1rem' }}>{booking.pangalan_ng_motor}</div>
                      {/* 🚨 SAFETY FIX: Ginamitan ng String() para sure na hindi mag-crash ang app kung sakaling Number ang Supabase ID */}
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Ref ID: #{String(booking.id).substring(0, 8).toUpperCase()}</div>
                    </td>

                    <td style={styles.tableCell}>
                      <div style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>{booking.uri_ng_arkila || 'Standard Contract'}</div>
                      {status === 'Picked Up' || status === 'Approved' ? (
                        <div style={{ fontSize: '0.78rem', color: isExpired && status === 'Picked Up' ? '#ef4444' : '#94a3b8', fontWeight: '500', marginTop: '4px' }}>
                          {displayPickup} → {displayReturn} {status === 'Picked Up' && isExpired && <span style={{ color: '#ef4444', marginLeft: '4px', fontWeight: 'bold' }}>[OVERDUE]</span>}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic', marginTop: '4px' }}>Waiting for unit release...</div>
                      )}
                    </td>

                    <td style={{ ...styles.tableCell, fontWeight: '700', color: '#eaa974', fontSize: '0.95rem' }}>
                      ₱{displayPrice}
                    </td>

                    <td style={styles.tableCell}>
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                        {displayMode}
                      </span>
                    </td>

                    <td style={styles.tableCell}>
                      {booking.id_gobyerno_url ? (
                        <span style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ✓ Verified ID 
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px dashed #ef4444', borderRadius: '10px', animation: 'urgentPulse 2s infinite', width: '190px', boxSizing: 'border-box' }}>
                          <span style={{ color: '#f87171', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase' }}>⚠️ Upload Gov ID Required</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            disabled={uploadingId === booking.id}
                            onChange={(e) => handleIDUpload(e, booking.id)} 
                            style={{ fontSize: '0.7rem', color: '#cbd5e1', width: '100%' }} 
                          />
                          {uploadingId === booking.id && (
                            <span style={{ fontSize: '0.7rem', color: '#eaa974', fontWeight: 'bold' }}>Uploading file...</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td style={{ ...styles.tableCell, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {status === 'Picked Up' && (
                          <button onClick={() => alert("Extension Logic Needs Setup")} style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>
                            Extend Lease
                          </button>
                        )}
                        {currentTab === 'history' && status === 'Completed' && !isAlreadyReviewed && (
                          <button onClick={() => setSelectedBookingForReview(booking)} style={{ padding: '6px 12px', background: '#eaa974', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>
                            Review Unit
                          </button>
                        )}
                        {currentTab === 'history' && (
                          <button onClick={() => hideFromHistory(booking.id)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                            Archive
                          </button>
                        )}
                        <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', background: status === 'Completed' ? 'rgba(16,185,129,0.1)' : status === 'Rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(234,169,116,0.1)', color: status === 'Completed' ? '#10b981' : status === 'Rejected' ? '#f87171' : '#eaa974' }}>
                          {status}
                        </span>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedBookingForReview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid rgba(254, 255, 255, 0.08)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '420px', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '1.3rem', fontWeight: '800' }}>Write a Review</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#94a3b8', fontSize: '0.8rem' }}>Unit: {selectedBookingForReview.pangalan_ng_motor}</p>
            <form onSubmit={submitReviewHandler} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Rating Star Score:</label>
                <select value={rating} onChange={(e) => setRating(e.target.value)} style={styles.glassInput}>
                  <option value="5">⭐⭐⭐⭐⭐ Excellent Deal (5/5)</option>
                  <option value="4">⭐⭐⭐⭐ Great Experience (4/5)</option>
                  <option value="3">⭐⭐⭐ Standard Average (3/5)</option>
                  <option value="2">⭐⭐ Disappointing Ride (2/5)</option>
                  <option value="1">⭐ Terrible / Unacceptable (1/5)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Feedback Commentary:</label>
                <textarea rows="3" required value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your experience?" style={{ ...styles.glassInput, resize: 'none' }}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button type="button" onClick={() => setSelectedBookingForReview(null)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>Cancel</button>
                <button type="submit" disabled={submittingReview} style={{ flex: 1, padding: '10px', background: '#eaa974', border: 'none', borderRadius: '8px', color: '#0f172a', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700' }}>{submittingReview ? 'Sending...' : 'Post Review'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚨 SAFETY FIX: Tinanggal ko muna ang rendering ng PaymentModalExtend incase wala pa itong file */}
    </div>
  );
}