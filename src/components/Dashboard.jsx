import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import mainWebsiteBg from '../assets/BG.png';
import PaymentModalExtend from './PaymentModalExtend'; 

// 🏍️ IMPORT MGA PICTURES NG MOTOR
import nmaxImg from '../assets/Bikes/nmaxv3.jpg';
import aeroxImg from '../assets/Bikes/aeroxv3.jpg';
import clickImg from '../assets/Bikes/click125.jpg';
import beatImg from '../assets/Bikes/beat.jpg';
import fazzioImg from '../assets/Bikes/fazzio.png';
import mioiImg from '../assets/Bikes/mio i 125.jpg'; 

export default function Dashboard({ user, lang, activeTab }) {
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('active'); 
  const [uploadingId, setUploadingId] = useState(null);
  
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [selectedBookingForExtend, setSelectedBookingForExtend] = useState(null); 
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedBookingIds, setReviewedBookingIds] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [hiddenHistoryIds, setHiddenHistoryIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`hidden_bookings_${user?.id || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const calculateEndTime = (booking) => {
    if (!booking) return new Date(); 
    let startDate;
    if (booking?.tunay_na_oras_ng_kuha) {
      startDate = new Date(booking.tunay_na_oras_ng_kuha);
    } else if (booking?.petsa_ng_pagkuha) {
      const timeString = booking?.oras_ng_pagkuha || '00:00';
      const combinedDateTime = `${booking.petsa_ng_pagkuha} ${timeString}`;
      startDate = new Date(combinedDateTime);
      if (isNaN(startDate.getTime())) startDate = new Date(booking?.created_at || new Date());
    } else {
      startDate = new Date(booking?.created_at || new Date());
    }

    const packageStr = String(booking?.uri_ng_arkila || '').toLowerCase();
    let baseHours = 24; 
    if (packageStr.includes('per hour') || packageStr.includes('hourly')) baseHours = 1;
    else if (packageStr.includes('12')) baseHours = 12;
    else if (packageStr.includes('6')) baseHours = 6;
    else if (packageStr.includes('24') || packageStr.includes('1 day') || packageStr.includes('magdamagan')) baseHours = 24;

    const multiplier = Number(booking?.tagal_ng_arkila) || 1;
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
      const activeUserId = user?.id || sessionData?.session?.user?.id || selectedBookingForReview?.user_id || "guest-user";
      const activeName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Client';

      const { error } = await supabase
        .from('mga_review')
        .insert([{
          arkila_id: selectedBookingForReview?.id,
          user_id: activeUserId, 
          pangalan_ng_kliyente: activeName,
          rating: parseInt(rating),
          motor_na_narkila: selectedBookingForReview?.pangalan_ng_motor || 'Motorcycle Unit',
          komento: comment
        }]);

      if (error) throw error;
      alert(lang === 'en' ? "Thank you for your feedback!" : "Salamat sa iyong review at komento!");
      setReviewedBookingIds(prev => [...prev, selectedBookingForReview?.id]);
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

  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm(lang === 'en' ? "Are you sure you want to cancel this booking?" : "Sigurado ka bang gusto mong i-cancel ang booking na ito?");
    if (!confirmCancel) return;

    try {
      const { error } = await supabase
        .from('mga_arkila')
        .update({ status: 'Cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      alert(lang === 'en' ? "Booking cancelled successfully." : "Matagumpay na na-cancel ang booking.");
      fetchMyBookings(); 
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("Failed to cancel booking.");
    }
  };

  const getBikeImage = (bikeName) => {
    if (!bikeName) return null;
    const name = String(bikeName).toLowerCase();
    if (name.includes('nmax')) return nmaxImg;
    if (name.includes('aerox')) return aeroxImg;
    if (name.includes('click')) return clickImg;
    if (name.includes('beat')) return beatImg;
    if (name.includes('fazzio')) return fazzioImg;
    if (name.includes('mio')) return mioiImg;
    return null; 
  };

  const visibleBookings = (myBookings || []).filter((b) => {
    if (!b) return false; 
    if (hiddenHistoryIds.includes(b?.id)) return false;
    
    const status = b?.status || 'Pending';
    
    if (currentTab === 'active') return status === 'Pending' || status === 'Approved' || status === 'Picked Up';
    if (currentTab === 'history') return status === 'Completed' || status === 'Rejected' || status === 'Cancelled'; 
    return true;
  });

  const styles = {
    fontStack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    glassInput: {
      padding: '10px 14px', background: '#0e1424', color: '#fff', 
      border: '1px solid rgba(234, 169, 116, 0.2)', borderRadius: '8px', 
      width: '100%', boxSizing: 'border-box', fontSize: '0.9rem', outline: 'none'
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

  const lacksGovId = visibleBookings.some(b => b && !b?.id_gobyerno_url);

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
        .booking-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
          width: 100%;
        }
        .booking-card {
          background: rgba(10, 17, 32, 0.75);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 20px 40px -15px rgba(0,0,0,0.7);
        }
        .booking-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
          border-color: rgba(234, 169, 116, 0.3);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 1rem;
          margin-bottom: 0.5rem;
        }
        .card-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          font-size: 0.85rem;
          gap: 10px;
        }
        .card-label {
          color: #94a3b8;
          font-weight: 500;
          white-space: nowrap;
        }
        .card-value {
          color: #f8fafc;
          font-weight: 600;
          text-align: right;
          word-wrap: break-word;
        }
        .card-actions {
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
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
              {lang === 'en' ? 'To complete your rental process, please upload a clear photo of your valid Government ID or Driver License.' : 'Upang makumpleto ang pag-arkila, mangyaring mag-upload ng malinaw na larawan ng iyong valid Government ID o Driver License.'}
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

      <div style={{ width: '100%', maxWidth: '1100px' }}>
        {visibleBookings.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(10, 17, 32, 0.75)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '20px' }}>
            No current lifecycle records found.
          </div>
        ) : (
          <div className="booking-grid">
            {visibleBookings.map((booking) => {
              if (!booking) return null;

              const status = booking?.status || 'Pending';
              const isExtended = booking?.is_extended === true || booking?.orihinal_na_tagal != null;
              const isAlreadyReviewed = reviewedBookingIds.includes(booking?.id);
              
              let pickupDateObj = booking?.tunay_na_oras_ng_kuha ? new Date(booking.tunay_na_oras_ng_kuha) : null;
              if (!pickupDateObj && booking?.petsa_ng_pagkuha) {
                const timeString = booking?.oras_ng_pagkuha || '00:00';
                pickupDateObj = new Date(`${booking.petsa_ng_pagkuha} ${timeString}`);
              }

              const endDeadlineObj = calculateEndTime(booking);
              const isExpired = status === 'Picked Up' && currentTime > endDeadlineObj;

              // 🔥 LATE PENALTY COMPUTATION LOGIC PARA SA CLIENT 🔥
              let penaltyFee = 0;
              let overdueHours = 0;
              if (isExpired) {
                const diffMs = currentTime.getTime() - endDeadlineObj.getTime();
                overdueHours = Math.ceil(diffMs / (1000 * 60 * 60)); 
                
                let hourlyRate = 100;
                const bName = String(booking?.pangalan_ng_motor || '').toLowerCase();
                if (bName.includes('fazzio') || bName.includes('click')) hourlyRate = 75;
                else if (bName.includes('mio') || bName.includes('beat')) hourlyRate = 70;
                
                penaltyFee = overdueHours * hourlyRate;
              }

              const displayPickup = pickupDateObj && !isNaN(pickupDateObj.getTime()) ? pickupDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (booking?.petsa_ng_pagkuha || 'Pending Set');
              const displayReturn = endDeadlineObj && !isNaN(endDeadlineObj.getTime()) ? endDeadlineObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending Set';
              
              let rawMode = String(booking?.paraan_ng_pagbabayad || booking?.mode_of_payment || '').toLowerCase();
              let baseMode = 'Cash'; 

              if (rawMode.includes('maya')) {
                baseMode = 'Maya';
              } else if (rawMode.includes('gcash') || booking?.resibo_url) {
                baseMode = 'GCash';
              }

              const totalAmt = Number(booking?.kabuuang_bayad || booking?.halaga || booking?.total_price || 0);
              const cashPaid = Number(booking?.cash_paid || 0);

              let balance = Number(booking?.balance_due || booking?.balance || booking?.balanse || 0);
              if (baseMode === 'Cash' && cashPaid < totalAmt && balance === 0) {
                balance = totalAmt - cashPaid;
              }

              let downpayment = totalAmt - balance - cashPaid;
              if (downpayment < 0) downpayment = 0;

              const hasBalance = balance > 0;
              const isSplit = downpayment > 0 && (hasBalance || cashPaid > 0);

              let displayModeName = baseMode;
              if (isSplit) displayModeName = `${baseMode}/Cash`;

              let paymentModeColor = baseMode === 'GCash' ? '#3b82f6' : baseMode === 'Maya' ? '#10b981' : '#f59e0b';

              let dpLabel = lang === 'en' ? `Downpayment (${baseMode}):` : `Paunang Bayad (${baseMode}):`;
              if (!isSplit && downpayment === totalAmt) {
                dpLabel = lang === 'en' ? `Full Payment (${baseMode}):` : `Buong Bayad (${baseMode}):`;
              }

              const refId = String(booking?.id || 'xxxx').substring(0, 8).toUpperCase();

              // EXTENSION DETAILS 
              let extRawMode = String(booking?.paraan_ng_pagbayad_extension || '').toLowerCase();
              let extBaseMode = 'Cash'; 

              if (extRawMode.includes('maya')) {
                extBaseMode = 'Maya';
              } else if (extRawMode.includes('gcash') || extRawMode.includes('ewallet')) {
                extBaseMode = 'GCash';
              } else if (extRawMode.includes('cash')) {
                extBaseMode = 'Cash';
              }

              let extPaymentColor = extBaseMode === 'GCash' ? '#3b82f6' : extBaseMode === 'Maya' ? '#10b981' : '#f59e0b';

              const extTotalAmt = Number(booking?.halaga_ng_extension || 0);
              const extPaidAmt = Number(booking?.bayad_sa_extension || 0);
              const extBalance = extTotalAmt > 0 ? extTotalAmt - extPaidAmt : 0; 

              return (
                <div key={booking?.id || Math.random()} className="booking-card">
                  
                  <div className="card-header">
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '55px', height: '55px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {getBikeImage(booking?.pangalan_ng_motor) ? (
                          <img src={getBikeImage(booking?.pangalan_ng_motor)} alt={booking?.pangalan_ng_motor} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.5rem' }}>🏍️</span>
                        )}
                      </div>
                      
                      <div>
                        <h3 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: '800' }}>{booking?.pangalan_ng_motor || 'Unknown Unit'}</h3>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace' }}>Ref ID: #{refId}</div>
                      </div>
                    </div>
                    
                    <div>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', whiteSpace: 'nowrap', display: 'inline-block', background: status === 'Completed' ? 'rgba(16,185,129,0.1)' : status === 'Rejected' || status === 'Cancelled' ? 'rgba(239,68,68,0.1)' : 'rgba(234,169,116,0.1)', color: status === 'Completed' ? '#10b981' : status === 'Rejected' || status === 'Cancelled' ? '#f87171' : '#eaa974' }}>
                        {status} {isExtended && "➕ EXT"}
                      </span>
                    </div>
                  </div>

                  <div className="card-row">
                    <span className="card-label">Contract Type:</span>
                    <span className="card-value">{booking?.uri_ng_arkila || 'Standard Contract'}</span>
                  </div>

                  <div className="card-row">
                    <span className="card-label">Timeline:</span>
                    <span className="card-value">
                      {status === 'Completed' ? (
                        <>
                          <div style={{ marginBottom: '4px' }}>{displayPickup} → {displayReturn}</div>
                          <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold' }}>✓ Returned / Completed</div>
                        </>
                      ) : status === 'Cancelled' || status === 'Rejected' ? (
                        <span style={{ fontStyle: 'italic', color: '#ef4444' }}>Booking {status}</span>
                      ) : (
                        <>
                          <div style={{ marginBottom: '4px' }}>{displayPickup} → {displayReturn}</div>
                          {isExpired && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>⚠️ [OVERDUE]</span>}
                        </>
                      )}
                    </span>
                  </div>

                  {isExtended && (
                    <div style={{ background: 'rgba(234, 169, 116, 0.1)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(234, 169, 116, 0.2)', fontSize: '0.75rem', marginTop: '4px', marginBottom: '8px' }}>
                      <span style={{ color: '#eaa974', fontWeight: 'bold' }}>🕒 Extension Record Active</span>
                      <div style={{ color: '#fff', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span>Original Duration:</span> <span>{booking.orihinal_na_tagal || 'N/A'} Units</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="card-row">
                    <span className="card-label">{lang === 'en' ? 'Mode of payment:' : 'Paraan ng pagbabayad:'}</span>
                    <span className="card-value" style={{ color: paymentModeColor, fontWeight: 'bold' }}>
                      {displayModeName}
                    </span>
                  </div>

                  <div className="card-row">
                    <span className="card-label">{lang === 'en' ? 'Total Amount:' : 'Kabuuang Halaga:'}</span>
                    <span className="card-value" style={{ color: '#eaa974', fontWeight: '700', fontSize: '1rem' }}>₱{totalAmt}</span>
                  </div>

                  {downpayment > 0 && (
                    <div className="card-row">
                      <span className="card-label">{dpLabel}</span>
                      <span className="card-value" style={{ color: paymentModeColor }}>
                        ₱{downpayment}
                      </span>
                    </div>
                  )}

                  {cashPaid > 0 && (
                    <div className="card-row">
                      <span className="card-label">{lang === 'en' ? 'Cash Paid:' : 'Bayad na Cash:'}</span>
                      <span className="card-value" style={{ color: '#10b981' }}>
                        ₱{cashPaid}
                      </span>
                    </div>
                  )}

                  <div className="card-row" style={{ backgroundColor: hasBalance ? 'rgba(239, 68, 68, 0.05)' : 'transparent', padding: hasBalance ? '4px 8px' : '0', borderRadius: '6px', marginTop: '4px' }}>
                    <span className="card-label" style={{ color: hasBalance ? '#f87171' : '#94a3b8' }}>
                      {lang === 'en' ? 'Balance:' : 'Balanse:'}
                    </span>
                    <span className="card-value" style={{ color: hasBalance ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                      ₱{balance} 
                      {!hasBalance && (
                        <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'normal', display: 'block' }}>
                          ({lang === 'en' ? 'Cleared' : 'Bayad Na'})
                        </span>
                      )}
                      {hasBalance && (
                        <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 'normal', display: 'block' }}>
                          ({lang === 'en' ? 'Cash upon pick up' : 'Ibabayad sa pagkuha'})
                        </span>
                      )}
                    </span>
                  </div>

                  {/* 🔥 VISUAL LATE PENALTY PARA SA CLIENT 🔥 */}
                  {penaltyFee > 0 && (
                    <div className="card-row" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '6px 8px', borderRadius: '6px', border: '1px dashed rgba(239, 68, 68, 0.5)', marginTop: '8px' }}>
                      <span className="card-label" style={{ color: '#f87171', fontWeight: 'bold' }}>⚠️ {lang === 'en' ? 'LATE PENALTY' : 'LATE PENALTY'} ({overdueHours} {lang === 'en' ? 'hr/s' : 'oras'}):</span>
                      <span className="card-value" style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        ₱{penaltyFee}
                      </span>
                    </div>
                  )}

                  {isExtended && (
                    <div style={{ 
                      marginTop: '12px', 
                      paddingTop: '12px', 
                      borderTop: '1px dashed rgba(255,255,255,0.1)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '6px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ color: '#eaa974', fontSize: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>🔄</span> {lang === 'en' ? 'Extension Details' : 'Detalye ng Extension'}
                        </span>
                        {booking?.oras_ng_pag_extend && (
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {lang === 'en' ? 'Processed: ' : 'Na-process: '}
                            {new Date(booking.oras_ng_pag_extend).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <div className="card-row">
                        <span className="card-label">{lang === 'en' ? 'Mode of Payment (Ext):' : 'Paraan ng pagbabayad (Ext):'}</span>
                        <span className="card-value" style={{ color: extPaymentColor, fontWeight: 'bold' }}>
                          {extBaseMode}
                        </span>
                      </div>

                      <div className="card-row">
                        <span className="card-label">{lang === 'en' ? 'Total Amount (Ext):' : 'Kabuuang Halaga (Ext):'}</span>
                        <span className="card-value" style={{ color: '#eaa974', fontWeight: '700' }}>
                          ₱{extTotalAmt}
                        </span>
                      </div>

                      {extBalance > 0 ? (
                        <div className="card-row" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '4px 8px', borderRadius: '6px' }}>
                          <span className="card-label" style={{ color: '#f87171' }}>{lang === 'en' ? 'Balance (Ext):' : 'Balanse (Ext):'}</span>
                          <span className="card-value" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                            ₱{extBalance}
                            <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 'normal', display: 'block' }}>
                              ({lang === 'en' ? 'Cash upon return' : 'Ibabayad sa pag-return'})
                            </span>
                          </span>
                        </div>
                      ) : extTotalAmt > 0 ? (
                        <div className="card-row">
                          <span className="card-label">
                            {extBaseMode === 'GCash' ? (lang === 'en' ? 'GCash Paid:' : 'Bayad sa GCash:') 
                              : extBaseMode === 'Maya' ? (lang === 'en' ? 'Maya Paid:' : 'Bayad sa Maya:') 
                              : (lang === 'en' ? 'Cash Paid:' : 'Bayad na Cash:')}
                          </span>
                          <span className="card-value" style={{ color: '#10b981' }}>
                            ₱{extPaidAmt}
                          </span>
                        </div>
                      ) : null}

                    </div>
                  )}

                  <div className="card-actions">
                    {booking?.id_gobyerno_url ? (
                      <div style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                        ✓ Verified ID / License
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px dashed #ef4444', borderRadius: '10px', animation: 'urgentPulse 2s infinite', width: '100%', boxSizing: 'border-box', marginBottom: '8px' }}>
                        <span style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>⚠️ Upload Gov ID Required</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          disabled={uploadingId === booking?.id}
                          onChange={(e) => handleIDUpload(e, booking?.id)} 
                          style={{ fontSize: '0.75rem', color: '#cbd5e1', width: '100%' }} 
                        />
                        {uploadingId === booking?.id && (
                          <span style={{ fontSize: '0.75rem', color: '#eaa974', fontWeight: 'bold' }}>Uploading file...</span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
                      
                      {currentTab === 'active' && (status === 'Pending' || status === 'Approved') && (
                        <button onClick={() => handleCancelBooking(booking?.id)} style={{ flex: 1, padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                          ✖️ Cancel Booking
                        </button>
                      )}

                      {currentTab === 'active' && status === 'Picked Up' && (
                        <button onClick={() => setSelectedBookingForExtend(booking)} style={{ flex: 1, padding: '10px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                          ⏳ Extend Booking
                        </button>
                      )}

                      {currentTab === 'history' && status === 'Completed' && !isAlreadyReviewed && (
                        <button onClick={() => setSelectedBookingForReview(booking)} style={{ flex: 1, padding: '10px', background: '#eaa974', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                          Review Unit
                        </button>
                      )}
                      
                      {currentTab === 'history' && (
                        <button onClick={() => hideFromHistory(booking?.id)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                          Archive
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

      {selectedBookingForExtend && (
        <PaymentModalExtend
          booking={selectedBookingForExtend}
          onClose={() => setSelectedBookingForExtend(null)}
          onSuccess={() => {
            setSelectedBookingForExtend(null);
            fetchMyBookings();
          }}
          lang={lang}
        />
      )}

      {selectedBookingForReview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid rgba(254, 255, 255, 0.08)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '420px', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '1.3rem', fontWeight: '800' }}>Write a Review</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#94a3b8', fontSize: '0.8rem' }}>Unit: {selectedBookingForReview?.pangalan_ng_motor || 'Unit'}</p>
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

    </div>
  );
}