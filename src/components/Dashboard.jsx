import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Dashboard({ user, lang }) {
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

      if (error) {
        const { data: fallbackData } = await supabase
          .from('mga_arkila')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (fallbackData) {
          const filtered = fallbackData.filter(b => b.user_id === activeId || b.kliyente_id === activeId);
          setMyBookings(filtered);
          return;
        }
      }
      if (data) setMyBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReviews = async () => {
    try {
      const { data } = await supabase
        .from('mga_review')
        .select('arkila_id')
        .eq('user_id', user?.id);
      if (data) setReviewedBookingIds(data.map(r => r.arkila_id));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchMyBookings();
    if (user?.id) fetchMyReviews();
  }, [user]);

  const handleProofUpload = async (e, bookingId, currentMethod) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingId(bookingId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${bookingId}-${Date.now()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resibo')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('resibo').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;
      const baseMethod = String(currentMethod || 'GCASH').split(' | ')[0];

      const { error: updateError } = await supabase
        .from('mga_arkila')
        .update({ paraan_ng_pagbayad: `${baseMethod} | ${publicUrl}` }) 
        .eq('id', bookingId);

      if (updateError) {
        await supabase
          .from('mga_arkila')
          .update({ paraan_ng_bayad: `${baseMethod} | ${publicUrl}` }) 
          .eq('id', bookingId);
      }
      alert(lang === 'en' ? 'Proof uploaded!' : 'Na-upload na ang resibo!');
      fetchMyBookings();
    } catch (err) {
      alert('Upload error.');
    } finally { setUploadingId(null); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingForReview) return;
    setSubmittingReview(true);
    try {
      const bikeName = selectedBookingForReview.uri_ng_arkila || selectedBookingForReview.pangalan_ng_motor || 'Premium Unit';
      const { error } = await supabase
        .from('mga_review')
        .insert([{
          user_id: user?.id,
          pangalan_ng_kliyente: user?.email ? user.email.split('@')[0] : 'Client',
          motor_na_narkila: bikeName,
          rating: rating,
          komento: comment,
          arkila_id: selectedBookingForReview.id
        }]);

      if (error) throw error;
      alert(lang === 'en' ? 'Review submitted!' : 'Salamat sa iyong review!');
      setReviewedBookingIds([...reviewedBookingIds, selectedBookingForReview.id]);
      setSelectedBookingForReview(null);
      setComment('');
      setRating(5);
    } catch (err) { alert(err.message); } 
    finally { setSubmittingReview(false); }
  };

  const getRateUnitLabel = (booking) => {
    const rate = booking.napiling_rate || '';
    if (rate === 'hr' || rate.includes('hour') || rate.includes('hrs')) {
      return lang === 'en' ? 'hour(s)' : 'oras';
    }
    return lang === 'en' ? 'day(s)' : 'araw';
  };

  const getBookingStatus = (booking) => {
    return booking.current_status || booking.current_status_ng_renta || booking.status_ng_renta || booking.status || 'Pending';
  };

  const activeBookings = myBookings.filter(b => getBookingStatus(b) !== 'Completed' && getBookingStatus(b) !== 'Rejected');
  const historyBookings = myBookings.filter(b => (getBookingStatus(b) === 'Completed' || getBookingStatus(b) === 'Rejected') && !hiddenHistoryIds.includes(b.id));
  const displayedBookings = currentTab === 'active' ? activeBookings : historyBookings;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-color)' }}>
        <h3>⏳ {lang === 'en' ? 'Fetching records...' : 'Kinukuha ang listahan...'}</h3>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
          📊 {lang === 'en' ? 'Your Rental Dashboard' : 'Dashboard ng iyong mga Arkila'}
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)' }}>
        <button onClick={() => setCurrentTab('active')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', color: currentTab === 'active' ? 'var(--primary-color)' : 'var(--text-muted)', borderBottom: currentTab === 'active' ? '3px solid var(--primary-color)' : 'none' }}>
          🏍️ {lang === 'en' ? 'Active' : 'Kasalukuyan'} ({activeBookings.length})
        </button>
        <button onClick={() => setCurrentTab('history')} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', color: currentTab === 'history' ? 'var(--primary-color)' : 'var(--text-muted)', borderBottom: currentTab === 'history' ? '3px solid var(--primary-color)' : 'none' }}>
          📜 {lang === 'en' ? 'History' : 'Nakaraan'} ({historyBookings.length})
        </button>
      </div>

      {/* Review Form Overlay Modal */}
      {selectedBookingForReview && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <form style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)' }} onSubmit={handleReviewSubmit}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-color)' }}>⭐ {lang === 'en' ? 'Leave Review' : 'Sumulat ng Review'}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{selectedBookingForReview.uri_ng_arkila || selectedBookingForReview.pangalan_ng_motor}</p>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 'bold' }}>Rating:</label>
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}>
                <option value="5">5 ★ - Excellent</option>
                <option value="4">4 ★ - Good</option>
                <option value="3">3 ★ - Fair</option>
                <option value="2">2 ★ - Poor</option>
                <option value="1">1 ★ - Terrible</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 'bold' }}>Komento:</label>
              <textarea required rows="4" value={comment} onChange={(e) => setComment(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)', resize: 'none' }}></textarea>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setSelectedBookingForReview(null)} style={{ padding: '8px 16px', borderRadius: '6px', background: '#e2e8f0', color: '#475569', border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submittingReview} style={{ padding: '8px 16px', borderRadius: '6px' }}>Submit</button>
            </div>
          </form>
        </div>
      )}

      {displayedBookings.length === 0 ? (
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '3rem', borderRadius: '12px', textAlign: 'center' }}>
          {currentTab === 'active' ? (lang === 'en' ? 'No active requests.' : 'Walang kasalukuyang arkila.') : (lang === 'en' ? 'No history.' : 'Walang nakaraang rekord.')}
        </div>
      ) : (
        /* LOCK 3 ROWS & 3 COLUMNS COHERENT SYSTEM */
        <div className="bike-grid">
          {displayedBookings.map((booking) => {
            const status = getBookingStatus(booking);
            const price = booking.kabuuang_bayad || 0;
            const bikeName = booking.uri_ng_arkila || booking.pangalan_ng_motor || 'Premium Unit';
            const durationNum = booking.tagal_ng_arkila || 1;
            const rawMethod = booking.paraan_ng_pagbayad || booking.paraan_ng_bayad || 'GCASH';
            const paymentParts = String(rawMethod).split(' | ');
            const paymentName = paymentParts[0];
            const hasUploaded = paymentParts.length > 1 && paymentParts[1].startsWith('http');
            const isAlreadyReviewed = reviewedBookingIds.includes(booking.id);

            return (
              <div key={booking.id} className="bike-card">
                
                <div style={{ width: '100%' }}>
                  <h3 style={{ color: 'var(--primary-color)', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{bikeName}</h3>
                  <p style={{ fontSize: '0.9rem', margin: '0.3rem 0' }}>
                    <strong>{lang === 'en' ? 'Duration:' : 'Tagal:'}</strong> {durationNum} {getRateUnitLabel(booking)}
                  </p>
                  <p style={{ fontSize: '0.9rem', margin: '0.3rem 0' }}>
                    <strong>{lang === 'en' ? 'Method:' : 'Paraan:'}</strong> {paymentName}
                  </p>

                  {status === 'Pending' && (paymentName.toUpperCase() === 'GCASH' || paymentName.toUpperCase() === 'E-WALLET') && (
                    <div style={{ marginTop: '0.8rem', backgroundColor: 'var(--bg-color)', padding: '8px', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--primary-color)', marginBottom: '4px', fontWeight: 'bold' }}>
                        📢 Upload Receipt:
                      </label>
                      <input type="file" accept="image/*" disabled={uploadingId === booking.id} onChange={(e) => handleProofUpload(e, booking.id, rawMethod)} style={{ fontSize: '0.75rem', width: '100%' }} />
                      {hasUploaded && <p style={{ color: '#38a169', fontSize: '0.75rem', marginTop: '4px' }}>✓ Uploaded</p>}
                    </div>
                  )}
                </div>

                <div style={{ width: '100%', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-color)' }}>₱{Number(price).toLocaleString()}</div>
                  
                  <span style={{ 
                    alignSelf: 'flex-start',
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    backgroundColor: status === 'Approved' || status === 'Completed' ? 'rgba(56, 161, 105, 0.15)' : status === 'Rejected' ? 'rgba(229, 62, 62, 0.15)' : 'rgba(234, 169, 116, 0.15)', 
                    color: status === 'Approved' || status === 'Completed' ? '#38a169' : status === 'Rejected' ? '#e53e3e' : 'var(--primary-color)', 
                    border: `1px solid ${status === 'Approved' || status === 'Completed' ? '#38a169' : status === 'Rejected' ? '#e53e3e' : 'var(--primary-color)'}` 
                  }}>
                    {status}
                  </span>

                  {status === 'Completed' && (
                    <div style={{ display: 'flex', gap: '6px', width: '100%', marginTop: '4px' }}>
                      {!isAlreadyReviewed ? (
                        <button onClick={() => setSelectedBookingForReview(booking)} style={{ background: 'var(--primary-color)', color: '#1f293a', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>⭐ Review</button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#38a169', fontStyle: 'italic' }}>✓ Reviewed</span>
                      )}
                      <button onClick={() => hideFromHistory(booking.id)} style={{ background: 'rgba(229, 62, 62, 0.1)', border: '1px solid rgba(229, 62, 62, 0.3)', color: '#e53e3e', fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Clear</button>
                    </div>
                  )}

                  {status === 'Rejected' && (
                    <button onClick={() => hideFromHistory(booking.id)} style={{ background: 'rgba(229, 62, 62, 0.1)', border: '1px solid rgba(229, 62, 62, 0.3)', color: '#e53e3e', fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', textAlign: 'center' }}>Clear</button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}