import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import mainWebsiteBg from '../assets/BG.png';

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

  const [hiddenHistoryIds, setHiddenHistoryIds] = useState(() => {
    const saved = localStorage.getItem(`hidden_bookings_${user?.id || 'guest'}`);
    return saved ? JSON.parse(saved) : [];
  });

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

      const { data, error } = await supabase
        .from('mga_arkila')
        .select('*')
        .eq('user_id', activeId) 
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyBookings(data || []);
    } catch (err) {
      console.error(err);
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
        .eq('id_ng_gumagamit', activeId);

      if (error) {
        console.warn("Reviews array fetch skipped:", error.message);
        return;
      }
      
      if (data) {
        setReviewedBookingIds(data.map(r => r.arkila_id));
      }
    } catch (err) {
      console.error("Review array lookup error:", err);
    }
  };

  useEffect(() => {
    fetchMyBookings();
    fetchReviewedBookings();
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

      if (uploadError) {
        console.error("Storage Upload Error:", uploadError);
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('mga_id_bucket')
        .getPublicUrl(filePath);

      const fullPublicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('mga_arkila')
        .update({ id_gobyerno_url: fullPublicUrl })
        .eq('id', bookingId);

      if (updateError) {
        console.error("Database Update Error:", updateError);
        throw updateError;
      }

      alert(lang === 'en' ? "Government ID uploaded successfully!" : "Matagumpay na na-upload ang iyong Government ID!");
      fetchMyBookings();
    } catch (err) {
      alert("Upload failed. Make sure your storage bucket exists and is public.");
      console.error("Buong Error Details:", err);
    } finally {
      setUploadingId(null);
    }
  };

  const submitReviewHandler = async (e) => {
    e.preventDefault();
    if (!selectedBookingForReview) return;

    setSubmittingReview(true);
    try {
      // ✅ Kumuha ng fresh session para maiwasan ang 401 Unauthorized Error
      const { data: sessionData } = await supabase.auth.getSession();
      const activeUserId = user?.id || sessionData?.session?.user?.id || null;
      const activeName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || sessionData?.session?.user?.user_metadata?.full_name || 'Client';

      const { error } = await supabase
        .from('mga_review')
        .insert([{
          arkila_id: selectedBookingForReview.id,
          id_ng_gumagamit: activeUserId,
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
      console.error("Review Submit Error Details:", err);
      alert(lang === 'en' ? "Error submitting review." : "Nagka-error sa pag-submit ng review.");
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
    const status = b.estado || b.status;
    if (currentTab === 'active') return status === 'Pending' || status === 'Approved';
    if (currentTab === 'history') return status === 'Completed' || status === 'Rejected';
    return true;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: '#ffffff' }}>
        <p>⏳ Loading your personal transaction hub...</p>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundImage: `url(${mainWebsiteBg})`,
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: '#0f172a',
      boxSizing: 'border-box',
      padding: '130px 1.5rem 4rem 1.5rem'
    }}>
      <div style={{
        backgroundColor: 'rgba(21, 28, 41, 0.88)', 
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '2px solid rgba(234, 169, 116, 0.6)', 
        borderRadius: '24px',
        maxWidth: '1000px', 
        width: '100%',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
        boxSizing: 'border-box',
        boxShadow: '0 0 50px rgba(234, 169, 116, 0.15), 0 40px 80px -15px rgba(0, 0, 0, 0.8)',
      }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#ffffff', margin: '0 0 0.5rem 0', letterSpacing: '1px' }}>
            YOUR <span style={{ color: '#eaa974' }}>DASHBOARD</span>
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: 0 }}>
            {lang === 'en' ? "Track your active bike reservations and history logs" : "I-track ang iyong mga reserbasyon sa motor at history"}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
          <button 
            onClick={() => setCurrentTab('active')} 
            style={{ 
              padding: '8px 16px', 
              backgroundColor: currentTab === 'active' ? '#eaa974' : 'transparent', 
              color: currentTab === 'active' ? '#151c29' : '#ffffff',
              border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' 
            }}
          >
            📋 {lang === 'en' ? 'Active Bookings' : 'Kasalukuyang Transaksyon'}
          </button>
          <button 
            onClick={() => setCurrentTab('history')} 
            style={{ 
              padding: '8px 16px', 
              backgroundColor: currentTab === 'history' ? '#eaa974' : 'transparent', 
              color: currentTab === 'history' ? '#151c29' : '#ffffff',
              border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' 
            }}
          >
            🗄️ {lang === 'en' ? 'Past Records' : 'Naraang Biyahe (History)'}
          </button>
        </div>

        {visibleBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
            {lang === 'en' ? "No transaction records found inside this log module." : "Walang nakitang transaksyon dito sa tab na ito."}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {visibleBookings.map((booking) => {
              const status = booking.estado || booking.status;
              const isAlreadyReviewed = reviewedBookingIds.includes(booking.id);

              let pickupDateObj = new Date(booking.created_at);
              if (booking.petsa_ng_pagkuha) {
                const timeString = booking.oras_ng_pagkuha || '00:00';
                const combined = new Date(`${booking.petsa_ng_pagkuha} ${timeString}`);
                if (!isNaN(combined.getTime())) {
                  pickupDateObj = combined;
                }
              }

              const displayPickup = pickupDateObj.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const endTimeObj = calculateEndTime(booking);
              const displayReturn = endTimeObj.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              
              const displayBikeName = booking.pangalan_ng_motor || booking.motor_na_arkila || 'Motorcycle Unit';
              const displayPrice = booking.kabuuang_bayad || booking.kabuuang_halaga || booking.total_price || 0;

              return (
                <div 
                  key={booking.id} 
                  style={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.5)', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    borderRadius: '16px', 
                    padding: '1.5rem',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: '#eaa974', fontSize: '1.15rem' }}>🏍️ {displayBikeName}</h4>
                    <span style={{
                      padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800',
                      backgroundColor: status === 'Pending' ? '#f59e0b' : status === 'Approved' ? '#10b981' : status === 'Completed' ? '#3b82f6' : '#ef4444',
                      color: 'white'
                    }}>{status}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                    <div><strong>Rent Price:</strong> ₱{displayPrice}</div>
                    <div><strong>Pickup:</strong> {displayPickup}</div>
                    <div><strong>Return:</strong> {displayReturn}</div>
                  </div>

                  {status === 'Pending' && !booking.id_gobyerno_url && (
                    <div style={{ marginTop: '1.25rem', backgroundColor: 'rgba(234,169,116,0.05)', border: '1px dashed rgba(234,169,116,0.3)', padding: '1rem', borderRadius: '10px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#eaa974', marginBottom: '8px', fontWeight: 'bold' }}>
                        🪪 {lang === 'en' ? 'Upload Required Government ID to verify booking:' : 'I-upload ang Required Government ID para ma-verify:'}
                      </label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleIDUpload(e, booking.id)} 
                        disabled={uploadingId === booking.id}
                        style={{ color: '#ffffff', fontSize: '0.85rem' }} 
                      />
                      {uploadingId === booking.id && <span style={{ fontSize: '0.8rem', color: '#eaa974', display: 'block', marginTop: '5px' }}>⚡ Uploading secure file...</span>}
                    </div>
                  )}

                  {booking.id_gobyerno_url && status === 'Pending' && (
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#10b981', fontWeight: '700' }}>
                      ✓ Government ID photo linked. Waiting for administrator hub verification.
                    </div>
                  )}

                  <div style={{ marginTop: '1rem', display: 'flex', gap: '6px' }}>
                    {status === 'Completed' && (
                      <div style={{ display: 'flex', gap: '6px', width: '100%', marginTop: '4px' }}>
                        {!isAlreadyReviewed ? (
                          <button onClick={() => setSelectedBookingForReview(booking)} style={{ background: '#eaa974', color: '#151c29', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Review</button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#10b981', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>✓ Reviewed</span>
                        )}
                        <button onClick={() => hideFromHistory(booking.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Clear</button>
                      </div>
                    )}

                    {status === 'Rejected' && (
                      <button onClick={() => hideFromHistory(booking.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Clear from History</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ✅ INAYOS NA REVIEW MODAL (CENTERED AT RESPONSIVE) */}
        {selectedBookingForReview && (
          <div style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(0,0,0,0.85)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            zIndex: 9999,
            padding: '1rem'
          }}>
            <div style={{ 
              backgroundColor: '#1e293b', 
              border: '2px solid #eaa974', 
              borderRadius: '16px', 
              padding: '2rem', 
              width: '100%', 
              maxWidth: '450px', 
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              boxSizing: 'border-box'
            }}>
              <h3 style={{ color: '#eaa974', margin: '0 0 1rem 0', textAlign: 'center', fontSize: '1.4rem' }}>Write a Review</h3>
              
              <form onSubmit={submitReviewHandler} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ color: '#cbd5e1', display: 'block', marginBottom: '5px', fontSize: '0.95rem', fontWeight: 'bold' }}>Rating Stars:</label>
                  <select value={rating} onChange={(e) => setRating(e.target.value)} style={{ padding: '10px', background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', width: '100%', fontSize: '1rem', outline: 'none' }}>
                    <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value="4">⭐⭐⭐⭐ (4/5)</option>
                    <option value="3">⭐⭐⭐ (3/5)</option>
                    <option value="2">⭐⭐ (2/5)</option>
                    <option value="1">⭐ (1/5)</option>
                  </select>
                </div>
                
                <div style={{ textAlign: 'left' }}>
                  <label style={{ color: '#cbd5e1', display: 'block', marginBottom: '5px', fontSize: '0.95rem', fontWeight: 'bold' }}>Your Message:</label>
                  <textarea required rows="4" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your ride experience?..." style={{ padding: '12px', background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', width: '100%', boxSizing: 'border-box', fontSize: '0.95rem', outline: 'none', resize: 'vertical' }}></textarea>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                  <button type="button" onClick={() => setSelectedBookingForReview(null)} style={{ flex: 1, padding: '10px 16px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                  <button type="submit" disabled={submittingReview} style={{ flex: 1, padding: '10px 16px', background: '#eaa974', color: '#151c29', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {submittingReview ? 'Sending...' : 'Submit Log'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}