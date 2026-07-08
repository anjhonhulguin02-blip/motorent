import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import mainWebsiteBg from '../assets/BG.png';

// 🏍️ IMPORT MGA PICTURES NG MOTOR 
import nmaxImg from '../assets/Bikes/nmaxv3.jpg';
import aeroxImg from '../assets/Bikes/aeroxv3.jpg';
import clickImg from '../assets/Bikes/click125.jpg';
import beatImg from '../assets/Bikes/beat.jpg';
import fazzioImg from '../assets/Bikes/fazzio.png';
import mioiImg from '../assets/Bikes/mio i 125.jpg'; 

export default function AdminDashboard({ onStatusUpdate, lang }) {
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('active'); 
  const [selectedProofImg, setSelectedProofImg] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [hiddenHistoryIds, setHiddenHistoryIds] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_hidden_bookings');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const calculateEndTime = (booking) => {
    let startDate;
    if (booking?.tunay_na_oras_ng_kuha) {
      startDate = new Date(booking.tunay_na_oras_ng_kuha);
    } else if (booking?.petsa_ng_pagkuha) {
      const timeString = booking?.oras_ng_pagkuha || '00:00';
      const combinedDateTime = `${booking.petsa_ng_pagkuha} ${timeString}`;
      startDate = new Date(combinedDateTime);
      if (isNaN(startDate.getTime())) {
        startDate = new Date(booking?.created_at || new Date());
      }
    } else {
      startDate = new Date(booking?.created_at || new Date());
    }

    const packageStr = String(booking?.uri_ng_arkila || '').toLowerCase();
    let baseHours = 24; 
    
    if (packageStr.includes('per hour') || packageStr.includes('hourly')) {
      baseHours = 1;
    } else if (packageStr.includes('12')) {
      baseHours = 12;
    } else if (packageStr.includes('6')) {
      baseHours = 6;
    } else if (packageStr.includes('24') || packageStr.includes('1 day') || packageStr.includes('magdamagan')) {
      baseHours = 24;
    }

    const multiplier = Number(booking?.tagal_ng_arkila) || 1;
    return new Date(startDate.getTime() + baseHours * multiplier * 60 * 60 * 1000);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAllBookings = async () => {
    setLoading(true);
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('mga_arkila')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      const { data: clientsData, error: clientsError } = await supabase
        .from('mga_kliyente')
        .select('*');
      
      if (clientsError) console.warn("Error fetching clients:", clientsError);

      const combinedData = (bookingsData || []).map(booking => {
        const clientMatch = (clientsData || []).find(c => 
          c.id == booking.user_id || 
          c.id == booking.kliyente_id || 
          c.user_id == booking.user_id ||
          c.user_id == booking.kliyente_id
        );
        return {
          ...booking,
          client_info: clientMatch || null
        };
      });

      setAllBookings(combinedData || []);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const updateMotorAvailability = async (motorName, availabilityStatus) => {
    if (!motorName) return;
    try {
      const { error } = await supabase
        .from('mga_motor') 
        .update({ status: availabilityStatus }) 
        .eq('pangalan', motorName); 

      if (error) console.error("Error updating motor availability:", error);
    } catch (err) {
      console.error("Motor status trigger failed:", err);
    }
  };

  const handleConfirmBalancePayment = async (booking) => {
    let rawMode = String(booking.paraan_ng_pagbabayad || booking.mode_of_payment || '').toLowerCase();
    let baseMode = 'Cash';
    if (rawMode.includes('maya')) baseMode = 'Maya';
    else if (rawMode.includes('gcash') || booking.resibo_url) baseMode = 'GCash';

    const totalAmt = Number(booking.kabuuang_bayad || booking.halaga || booking.total_price || 0);
    const currentCashPaid = Number(booking.cash_paid || 0);
    
    let amountToClear = Number(booking.balance_due || 0);
    if (baseMode === 'Cash' && currentCashPaid < totalAmt && amountToClear === 0) {
      amountToClear = totalAmt - currentCashPaid;
    }

    const isConfirm = window.confirm(`Kumpirmahin ang Cash Payment na ₱${amountToClear}? Kapag kinumpirma, magiging 0 na ang balanse ng kliyenteng ito.`);
    if (!isConfirm) return;

    try {
      const { error } = await supabase
        .from('mga_arkila')
        .update({ 
          balance_due: 0, 
          cash_paid: currentCashPaid + amountToClear 
        }) 
        .eq('id', booking.id);

      if (error) {
        console.error(error);
        alert("🚨 UPDATE ERROR: Pakisigurado na nakagawa ka na ng 'cash_paid' (type: numeric) na column sa mga_arkila table mo sa Supabase.");
        return;
      }

      alert("Cash Payment Confirmed Successfully!");
      fetchAllBookings();
    } catch (err) {
      console.error(err);
      alert("Failed to confirm balance payment.");
    }
  };

  const handleConfirmExtPayment = async (booking, amountToClear) => {
    const isConfirm = window.confirm(`Kumpirmahin ang Cash Payment para sa Extension na ₱${amountToClear}?`);
    if (!isConfirm) return;

    try {
      const currentExtPaid = Number(booking.bayad_sa_extension || 0);

      const { error } = await supabase
        .from('mga_arkila')
        .update({
          bayad_sa_extension: currentExtPaid + amountToClear
        })
        .eq('id', booking.id);

      if (error) throw error;

      alert("Extension Payment Confirmed!");
      fetchAllBookings();
    } catch (err) {
      console.error(err);
      alert("Failed to confirm extension payment.");
    }
  };

  const updateBookingStatus = async (bookingId, newStatus, motorName) => {
    const isConfirm = window.confirm(`Sigurado ka bang gusto mong i-update ang status sa: ${newStatus}?`);
    if (!isConfirm) return;

    try {
      const updatePayload = { status: newStatus };
      
      if (newStatus === 'Picked Up') {
        updatePayload.tunay_na_oras_ng_kuha = new Date().toISOString();
        await updateMotorAvailability(motorName, 'Rented');
      }

      if (newStatus === 'Rejected' || newStatus === 'Cancelled') {
        await updateMotorAvailability(motorName, 'Available');
      }

      const { error } = await supabase
        .from('mga_arkila')
        .update(updatePayload)
        .eq('id', bookingId);

      if (error) throw error;

      alert(`Status updated to ${newStatus}`);
      fetchAllBookings();
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update status.");
    }
  };

  const handleCompleteTransaction = async (bookingId, motorName, penaltyFee) => {
    let confirmMsg = "Tatapatan ba natin ito na 'Completed'? Ang ibig sabihin ay naisauli na ang motor nang walang isyu at bayad na ang lahat.";
    
    // 🔥 Penalty Check for Admin Alert
    if (penaltyFee > 0) {
      confirmMsg = `⚠️ OVERDUE LATE PENALTY DETECTED: ₱${penaltyFee}.\n\nSiguraduhing siningil at bayad na ang penalty na ito bago i-complete ang transaction. I-confirm ang pag-complete?`;
    }

    const isConfirm = window.confirm(confirmMsg);
    if (!isConfirm) return;

    try {
      const { error } = await supabase
        .from('mga_arkila')
        .update({ status: 'Completed', balance_due: 0 })
        .eq('id', bookingId);

      if (error) throw error;
      
      await updateMotorAvailability(motorName, 'Available');
      
      alert("Transaction Completed & Balance Cleared!");
      fetchAllBookings();
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      console.error("Complete transaction error:", err);
      alert("Failed to complete transaction.");
    }
  };

  const hideFromHistory = (bookingId) => {
    const updated = [...hiddenHistoryIds, bookingId];
    setHiddenHistoryIds(updated);
    localStorage.setItem('admin_hidden_bookings', JSON.stringify(updated));
  };

  const handleDeleteBooking = async (bookingId) => {
    const isConfirm = window.confirm("⚠️ WARNING: Tuluyan mo bang buburahin ang record na ito sa Database? Hindi na ito maibabalik.");
    if (!isConfirm) return;

    try {
      const { error } = await supabase
        .from('mga_arkila')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      alert("Record permanently deleted.");
      fetchAllBookings(); 
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete record.");
    }
  };

  const handleProofClick = (url) => {
    if (!url) return;
    if (url.startsWith('http')) {
      setSelectedProofImg(url);
    } else {
      alert("Reference text: " + url);
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

  const visibleBookings = (allBookings || []).filter((b) => {
    if (!b) return false;
    if (hiddenHistoryIds.includes(b.id)) return false; 

    const st = b.status || b.status_ng_renta || b.estado || 'Pending';
    if (currentTab === 'active') {
      return st === 'Pending' || st === 'Approved' || st === 'Picked Up' || st === 'Pending Verification';
    } else {
      return st === 'Completed' || st === 'Rejected' || st === 'Cancelled';
    }
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#050811', color: '#eaa974', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', letterSpacing: '1px', fontWeight: 'bold', fontSize: '0.9rem' }}>LOADING COMMAND CENTER...</div>
      </div>
    );
  }

  const formatSystemDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + ` | ` + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', fontFamily: 'system-ui, sans-serif', backgroundImage: `url(${mainWebsiteBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#050811', boxSizing: 'border-box', padding: '140px 2rem 4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <style>{`
        .booking-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
          width: 100%;
        }
        .booking-card {
          background: rgba(10, 17, 32, 0.85);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 20px 40px -15px rgba(0,0,0,0.8);
        }
        .booking-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          border-color: rgba(59, 130, 246, 0.4);
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
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
            Fleet Command Center
          </h1>
          <p style={{ margin: '0', color: '#60a5fa', fontSize: '0.9rem', fontWeight: '600' }}>
            Administrator Privileges Active
          </p>
        </div>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '10px 16px', borderRadius: '10px', color: '#93c5fd', fontSize: '0.85rem', fontWeight: '700' }}>
          {formatSystemDate(currentTime)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '6px', borderRadius: '14px', marginBottom: '1.5rem', width: '100%', maxWidth: '1200px', boxSizing: 'border-box' }}>
        <button onClick={() => setCurrentTab('active')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: currentTab === 'active' ? '#3b82f6' : 'transparent', color: currentTab === 'active' ? '#fff' : '#94a3b8', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}>
          Live & Pending Operations
        </button>
        <button onClick={() => setCurrentTab('history')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: currentTab === 'history' ? '#3b82f6' : 'transparent', color: currentTab === 'history' ? '#fff' : '#94a3b8', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}>
          System History
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '1200px' }}>
        {visibleBookings.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(10, 17, 32, 0.75)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '20px' }}>
            No records found for this category.
          </div>
        ) : (
          <div className="booking-grid">
            {visibleBookings.map((booking) => {
              if (!booking) return null;

              const status = booking.status || booking.status_ng_renta || booking.estado || 'Pending';
              const isExtended = booking.is_extended === true || booking.orihinal_na_tagal != null;
              
              let pickupDateObj = booking.tunay_na_oras_ng_kuha ? new Date(booking.tunay_na_oras_ng_kuha) : null;
              if (!pickupDateObj && booking.petsa_ng_pagkuha) {
                const timeString = booking.oras_ng_pagkuha || '00:00';
                pickupDateObj = new Date(`${booking.petsa_ng_pagkuha} ${timeString}`);
              }

              const endDeadlineObj = calculateEndTime(booking);
              const isExpired = status === 'Picked Up' && currentTime > endDeadlineObj;

              // 🔥 LATE PENALTY COMPUTATION LOGIC 🔥
              let penaltyFee = 0;
              let overdueHours = 0;
              if (isExpired) {
                const diffMs = currentTime.getTime() - endDeadlineObj.getTime();
                overdueHours = Math.ceil(diffMs / (1000 * 60 * 60)); // round up per hour
                
                let hourlyRate = 100; // Default (Nmax, Aerox)
                const bName = String(booking?.pangalan_ng_motor || '').toLowerCase();
                if (bName.includes('fazzio') || bName.includes('click')) {
                  hourlyRate = 75;
                } else if (bName.includes('mio') || bName.includes('beat')) {
                  hourlyRate = 70;
                }
                
                penaltyFee = overdueHours * hourlyRate;
              }

              const displayPickup = pickupDateObj && !isNaN(pickupDateObj.getTime()) ? pickupDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (booking.petsa_ng_pagkuha || 'Pending Set');
              const displayReturn = endDeadlineObj && !isNaN(endDeadlineObj.getTime()) ? endDeadlineObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending Set';
              
              const refId = String(booking.id || 'xxxx').substring(0, 8).toUpperCase();

              let statusColor = '#60a5fa'; 
              let statusBg = 'rgba(59, 130, 246, 0.1)';
              if (status === 'Completed') { statusColor = '#10b981'; statusBg = 'rgba(16, 185, 129, 0.1)'; }
              else if (status === 'Pending') { statusColor = '#f59e0b'; statusBg = 'rgba(245, 158, 11, 0.1)'; }
              else if (status === 'Rejected' || status === 'Cancelled') { statusColor = '#ef4444'; statusBg = 'rgba(239, 68, 68, 0.1)'; }

              let rawMode = String(booking.paraan_ng_pagbabayad || booking.mode_of_payment || '').toLowerCase();
              let baseMode = 'Cash'; 
              
              if (rawMode.includes('maya')) {
                baseMode = 'Maya';
              } else if (rawMode.includes('gcash') || booking.resibo_url) {
                baseMode = 'GCash';
              }

              const totalAmt = Number(booking.kabuuang_bayad || booking.halaga || booking.total_price || 0);
              const cashPaid = Number(booking.cash_paid || 0);
              
              let balance = Number(booking.balance_due || 0);
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
              
              let dpLabel = `Downpayment (${baseMode}):`;
              if (!isSplit && downpayment === totalAmt) {
                dpLabel = `Full Payment (${baseMode}):`;
              }

              // EXTENSION COMPUTATIONS 
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
                <div key={booking.id || Math.random()} className="booking-card">
                  
                  <div className="card-header">
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '55px', height: '55px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {getBikeImage(booking.pangalan_ng_motor) ? (
                          <img src={getBikeImage(booking.pangalan_ng_motor)} alt={booking.pangalan_ng_motor} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.5rem' }}>🏍️</span>
                        )}
                      </div>
                      
                      <div>
                        <h3 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: '800' }}>{booking.pangalan_ng_motor || 'Unknown Unit'}</h3>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace' }}>Ref ID: #{refId}</div>
                      </div>
                    </div>
                    
                    <div style={{ paddingLeft: '8px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', whiteSpace: 'nowrap', display: 'inline-block', background: statusBg, color: statusColor }}>
                        {status} {isExtended && "➕ EXT"}
                      </span>
                    </div>
                  </div>

                  <div className="card-row">
                    <span className="card-label">Client Name:</span>
                    <span className="card-value" style={{ color: '#93c5fd' }}>
                      {booking.client_info?.buong_pangalan || booking.client_info?.pangalan || booking.pangalan_ng_kliyente || booking.buong_pangalan || booking.pangalan || booking.name || 'No Name'}
                    </span>
                  </div>
                  <div className="card-row">
                    <span className="card-label">Contact No:</span>
                    <span className="card-value">
                      {booking.client_info?.numero_ng_telepono || booking.client_info?.contact_number || booking.numero_ng_telepono || booking.contact_number || booking.phone || booking.contact || 'N/A'}
                    </span>
                  </div>

                  <div className="card-row">
                    <span className="card-label">Booked On:</span>
                    <span className="card-value">
                      {new Date(booking.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                  </div>

                  <div className="card-row">
                    <span className="card-label">Timeline:</span>
                    <span className="card-value">
                      {status === 'Picked Up' || status === 'Approved' ? (
                        <>
                          <div style={{ marginBottom: '4px' }}>{displayPickup} → {displayReturn}</div>
                          {isExpired && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>⚠️ [OVERDUE]</span>}
                        </>
                      ) : status === 'Completed' ? (
                        <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold' }}>✓ Returned / Completed</div>
                      ) : status === 'Cancelled' || status === 'Rejected' ? (
                         <span style={{ fontStyle: 'italic', color: '#ef4444' }}>Booking {status}</span>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Awaiting unit release...</span>
                      )}
                    </span>
                  </div>
                  
                  <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '8px 0' }} />

                  {isExtended && (
                    <div style={{ background: 'rgba(234, 169, 116, 0.1)', padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(234, 169, 116, 0.2)', fontSize: '0.75rem', marginTop: '4px', marginBottom: '8px' }}>
                      <span style={{ color: '#eaa974', fontWeight: 'bold' }}>🕒 Extension Record Active</span>
                      <div style={{ color: '#fff', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span>Original Duration:</span> <span>{booking.orihinal_na_tagal || 'N/A'} Units</span>
                      </div>
                    </div>
                  )}

                  <div className="card-row">
                    <span className="card-label">Mode of payment:</span>
                    <span className="card-value" style={{ color: paymentModeColor, fontWeight: 'bold' }}>
                      {displayModeName}
                    </span>
                  </div>

                  <div className="card-row">
                    <span className="card-label">Total Amount:</span>
                    <span className="card-value">₱{totalAmt}</span>
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
                      <span className="card-label">Full Payment (Cash):</span>
                      <span className="card-value" style={{ color: '#10b981' }}>
                        ₱{cashPaid}
                      </span>
                    </div>
                  )}

                  <div className="card-row" style={{ backgroundColor: hasBalance ? 'rgba(239, 68, 68, 0.05)' : 'transparent', padding: hasBalance ? '4px 8px' : '0', borderRadius: '6px', marginTop: '4px' }}>
                    <span className="card-label" style={{ color: hasBalance ? '#f87171' : '#94a3b8' }}>Balance:</span>
                    <span className="card-value" style={{ color: hasBalance ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                      ₱{balance} 
                      {!hasBalance && <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'normal', display: 'block' }}>(Cleared)</span>}
                      {hasBalance && <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 'normal', display: 'block' }}>(Cash upon pick up)</span>}
                    </span>
                  </div>

                  {/* 🔥 VISUAL LATE PENALTY PARA SA ADMIN 🔥 */}
                  {penaltyFee > 0 && (
                    <div className="card-row" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '6px 8px', borderRadius: '6px', border: '1px dashed rgba(239, 68, 68, 0.5)', marginTop: '8px' }}>
                      <span className="card-label" style={{ color: '#f87171', fontWeight: 'bold' }}>⚠️ LATE PENALTY ({overdueHours} hr/s):</span>
                      <span className="card-value" style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        ₱{penaltyFee}
                      </span>
                    </div>
                  )}

                  {/* EXTENSION DETAILS PARA SA ADMIN */}
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
                          <span>🔄</span> Extension Details
                        </span>
                        {booking?.oras_ng_pag_extend && (
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            Processed: {new Date(booking.oras_ng_pag_extend).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <div className="card-row">
                        <span className="card-label">Mode of Payment (Ext):</span>
                        <span className="card-value" style={{ color: extPaymentColor, fontWeight: 'bold' }}>
                          {extBaseMode}
                        </span>
                      </div>

                      <div className="card-row">
                        <span className="card-label">Total Amount (Ext):</span>
                        <span className="card-value" style={{ color: '#eaa974', fontWeight: '700' }}>
                          ₱{extTotalAmt}
                        </span>
                      </div>

                      {extBalance > 0 ? (
                        <div className="card-row" style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '4px 8px', borderRadius: '6px' }}>
                          <span className="card-label" style={{ color: '#f87171' }}>Balance (Ext):</span>
                          <span className="card-value" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                            ₱{extBalance}
                            <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 'normal', display: 'block' }}>(Cash upon return/pickup)</span>
                          </span>
                        </div>
                      ) : extTotalAmt > 0 ? (
                        <div className="card-row">
                          <span className="card-label">
                            {extBaseMode === 'GCash' ? 'GCash Paid:' 
                              : extBaseMode === 'Maya' ? 'Maya Paid:' 
                              : 'Cash Paid:'}
                          </span>
                          <span className="card-value" style={{ color: '#10b981' }}>
                            ₱{extPaidAmt}
                          </span>
                        </div>
                      ) : null}

                    </div>
                  )}

                  <div className="card-actions">
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      {booking.id_gobyerno_url ? (
                        <button onClick={() => handleProofClick(booking.id_gobyerno_url)} style={{ flex: 1, minWidth: '100px', padding: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>
                          📸 View Gov ID
                        </button>
                      ) : (
                        <span style={{ flex: 1, minWidth: '100px', padding: '8px', textAlign: 'center', background: 'transparent', color: '#64748b', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.75rem' }}>No ID Uploaded</span>
                      )}

                      {booking.resibo_url ? (
                        <button onClick={() => handleProofClick(booking.resibo_url)} style={{ flex: 1, minWidth: '100px', padding: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>
                          🧾 View Receipt
                        </button>
                      ) : (
                        <span style={{ flex: 1, minWidth: '100px', padding: '8px', textAlign: 'center', background: 'transparent', color: '#64748b', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.75rem' }}>No Receipt</span>
                      )}

                      {isExtended && extBaseMode !== 'Cash' ? (
                        booking.resibo_extension ? (
                          <button onClick={() => handleProofClick(booking.resibo_extension)} style={{ flex: 1, minWidth: '100px', padding: '8px', background: 'rgba(234, 169, 116, 0.1)', color: '#eaa974', border: '1px solid rgba(234, 169, 116, 0.3)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>
                            🧾 Ext. Receipt
                          </button>
                        ) : (
                          <span style={{ flex: 1, minWidth: '100px', padding: '8px', textAlign: 'center', background: 'transparent', color: '#64748b', border: '1px dashed rgba(234, 169, 116, 0.2)', borderRadius: '6px', fontSize: '0.75rem' }}>No Ext Receipt</span>
                        )
                      ) : null}
                    </div>

                    {currentTab === 'active' && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        
                        {(status === 'Pending' || status === 'Pending Verification') && (
                          <button onClick={() => updateBookingStatus(booking.id, 'Approved', booking.pangalan_ng_motor)} style={{ flex: 1, padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                            ✓ Approve
                          </button>
                        )}
                        
                        {hasBalance && (status === 'Approved' || status === 'Picked Up') && (
                          <button onClick={() => handleConfirmBalancePayment(booking)} style={{ flex: 1, padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}>
                            💰 Confirm Cash Payment (₱{balance})
                          </button>
                        )}

                        {extBalance > 0 && (status === 'Picked Up' || status === 'Approved') && (
                          <button onClick={() => handleConfirmExtPayment(booking, extBalance)} style={{ flex: 1, padding: '10px', background: '#eaa974', color: '#050811', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 0 15px rgba(234, 169, 116, 0.3)' }}>
                            💰 Confirm Ext. Payment (₱{extBalance})
                          </button>
                        )}

                        {status === 'Approved' && !hasBalance && (
                          <button onClick={() => updateBookingStatus(booking.id, 'Picked Up', booking.pangalan_ng_motor)} style={{ flex: 1, padding: '10px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                            🏍️ Mark Picked Up
                          </button>
                        )}

                        {/* 🔥 Ipapasa natin yung computed penaltyFee sa function 🔥 */}
                        {status === 'Picked Up' && !hasBalance && extBalance === 0 && (
                          <button onClick={() => handleCompleteTransaction(booking.id, booking.pangalan_ng_motor, penaltyFee)} style={{ flex: 1, padding: '10px', background: '#06b6d4', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                            ✅ Complete & Return
                          </button>
                        )}

                        {(status === 'Pending' || status === 'Approved' || status === 'Pending Verification') && (
                          <button onClick={() => updateBookingStatus(booking.id, 'Rejected', booking.pangalan_ng_motor)} style={{ flex: 1, padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                            ✕ Reject
                          </button>
                        )}

                      </div>
                    )}

                    {currentTab === 'history' && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                        
                        <button 
                          onClick={() => hideFromHistory(booking.id)} 
                          style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}
                        >
                          📦 Archive View
                        </button>

                        <button 
                          onClick={() => handleDeleteBooking(booking.id)} 
                          style={{ flex: 1, padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '700' }}
                        >
                          🗑️ Delete Permanently
                        </button>

                      </div>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedProofImg && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(10px)', zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setSelectedProofImg(null)}>
          <div 
            style={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column' }} 
            onClick={(e) => e.stopPropagation()} 
          >
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b' }}>
              <span style={{ color: '#f8fafc', fontWeight: '700', fontSize: '1rem' }}>
                <span style={{ marginRight: '8px' }}>📋</span> Verification Document
              </span>
              <button 
                onClick={() => setSelectedProofImg(null)}
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.85rem', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s' }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#050811', minHeight: '40vh' }}>
              <img 
                src={selectedProofImg} 
                alt="Verification Proof" 
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}