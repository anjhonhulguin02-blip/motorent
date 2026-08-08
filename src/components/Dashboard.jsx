import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import mainWebsiteBg from '../assets/BG.png';
import PaymentModalExtend from './PaymentModalExtend';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';

// 🏍️ IMPORT MGA PICTURES NG MOTOR
import nmaxImg from '../assets/Bikes/nmaxv3.jpg';
import aeroxImg from '../assets/Bikes/aeroxv3.jpg';
import clickImg from '../assets/Bikes/click125.jpg';
import beatImg from '../assets/Bikes/beat.jpg';
import fazzioImg from '../assets/Bikes/fazzio.png';
import mioiImg from '../assets/Bikes/mio i 125.jpg';

const cardRowClass = "flex justify-between items-start text-[0.85rem] gap-2.5";
const cardLabelClass = "text-brand-muted font-medium whitespace-nowrap";
const cardValueClass = "text-slate-50 font-semibold text-right break-words";
const glassInputClass = "w-full px-3.5 py-2.5 bg-[#0e1424] text-white border border-brand-primary/20 rounded-lg text-[0.9rem] outline-none box-border focus:border-brand-primary/50 transition-colors";

export default function Dashboard({ user, lang, activeTab }) {
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
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
    const startDate = booking?.picked_up_at
      ? new Date(booking.picked_up_at)
      : new Date(booking?.created_at || new Date());

    const packageStr = String(booking?.rental_package || '').toLowerCase();
    let baseHours = 24;
    if (packageStr.includes('per hour') || packageStr.includes('hourly')) baseHours = 1;
    else if (packageStr.includes('12')) baseHours = 12;
    else if (packageStr.includes('6')) baseHours = 6;
    else if (packageStr.includes('24') || packageStr.includes('1 day') || packageStr.includes('magdamagan')) baseHours = 24;

    const multiplier = Number(booking?.rental_units) || 1;
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
        .from('bookings')
        .select('*')
        .eq('client_id', activeId)
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
        .from('reviews')
        .select('booking_id')
        .eq('client_id', activeId);

      if (error) return;
      if (data) setReviewedBookingIds(data.map(r => r.booking_id));
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

      // Itago ang bare storage path lang, hindi ang public URL — private na
      // ang bucket na ito, kaya sa signed URL (na-generate on-demand) lang
      // dapat tumingin ang sinuman ng ID na ito.
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ government_id_url: filePath })
        .eq('id', bookingId);

      if (updateError) throw updateError;
      setToast({ type: 'success', message: lang === 'en' ? "Government ID uploaded successfully!" : "Matagumpay na na-upload ang iyong ID!" });
      fetchMyBookings();
    } catch (err) {
      setToast({ type: 'error', message: lang === 'en' ? "Upload failed." : "Hindi na-upload." });
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
      const activeUserId = user?.id || sessionData?.session?.user?.id || selectedBookingForReview?.client_id || "guest-user";
      const activeName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Client';

      // SELF-HEALING GUARD: kung may account pero walang client profile row
      // (hal. na-interrupt ang signup dati), gawa muna ng minimal profile
      // bago mag-insert ng review, para hindi ma-block ng foreign key.
      const { data: existingClient } = await supabase.from('clients').select('id').eq('id', activeUserId).maybeSingle();
      if (!existingClient) {
        await supabase.from('clients').insert([{
          id: activeUserId,
          full_name: activeName,
          username: user?.email?.split('@')[0] || `user_${String(activeUserId).slice(0, 8)}`,
          email: user?.email || '',
          created_at: new Date().toISOString()
        }]);
      }

      const { error } = await supabase
        .from('reviews')
        .insert([{
          booking_id: selectedBookingForReview?.id,
          client_id: activeUserId,
          client_name: activeName,
          rating: parseInt(rating),
          motorcycle_name: selectedBookingForReview?.motorcycle_name || 'Motorcycle Unit',
          comment: comment
        }]);

      if (error) throw error;
      setToast({ type: 'success', message: lang === 'en' ? "Thank you for your feedback!" : "Salamat sa iyong review at komento!" });
      setReviewedBookingIds(prev => [...prev, selectedBookingForReview?.id]);
      setSelectedBookingForReview(null);
      setComment('');
      fetchReviewedBookings();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: lang === 'en' ? "Failed to submit review." : "Hindi naipadala ang review." });
    } finally {
      setSubmittingReview(false);
    }
  };

  const hideFromHistory = (bookingId) => {
    const updated = [...hiddenHistoryIds, bookingId];
    setHiddenHistoryIds(updated);
    localStorage.setItem(`hidden_bookings_${user?.id || 'guest'}`, JSON.stringify(updated));
  };

  const handleCancelBooking = (bookingId) => {
    setConfirmState({
      message: lang === 'en' ? "Are you sure you want to cancel this booking?" : "Sigurado ka bang gusto mong i-cancel ang booking na ito?",
      danger: true,
      confirmLabel: lang === 'en' ? 'Cancel Booking' : 'I-cancel',
      onConfirm: () => executeCancelBooking(bookingId)
    });
  };

  const executeCancelBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'Cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      setToast({ type: 'success', message: lang === 'en' ? "Booking cancelled successfully." : "Matagumpay na na-cancel ang booking." });
      fetchMyBookings();
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setToast({ type: 'error', message: lang === 'en' ? "Failed to cancel booking." : "Hindi na-cancel ang booking." });
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

  const formatSystemDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + ` | ` + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#050811] text-brand-primary">
        <div className="text-center tracking-wide font-bold text-sm">LOADING ENVIRONMENT...</div>
      </div>
    );
  }

  const lacksGovId = visibleBookings.some(b => b && !b?.government_id_url);

  return (
    <div
      className="min-h-screen w-full box-border flex flex-col items-center px-8 pt-[140px] pb-16 bg-cover bg-center bg-[#050811]"
      style={{ backgroundImage: `url(${mainWebsiteBg})` }}
    >

      <span className="eyebrow block mb-2">
        {lang === 'en' ? 'Your Account' : 'Iyong Account'}
      </span>
      <h1 className="font-display mb-1 text-white text-[2.2rem] font-bold tracking-[-0.5px]">
        {lang === 'en' ? 'Client Dashboard' : 'Dashboard ng Arkila'}
      </h1>
      <p className="mb-8 text-brand-muted text-sm font-medium">
        {formatSystemDate(currentTime)}
      </p>

      {currentTab === 'active' && lacksGovId && visibleBookings.length > 0 && (
        <div className="w-full max-w-[1100px] px-5 py-3.5 rounded-2xl border border-red-500 flex items-center gap-3 mb-5 box-border animate-[bannerPulse_2.5s_infinite]">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h5 className="mb-0.5 text-red-400 text-[0.95rem] font-extrabold">Verification Action Required!</h5>
            <p className="m-0 text-slate-300 text-[0.82rem] leading-snug">
              {lang === 'en' ? 'To complete your rental process, please upload a clear photo of your valid Government ID or Driver License.' : 'Upang makumpleto ang pag-arkila, mangyaring mag-upload ng malinaw na larawan ng iyong valid Government ID o Driver License.'}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 bg-slate-900/60 border border-white/5 p-1.5 rounded-2xl mb-6 w-full max-w-[1100px] box-border">
        <button onClick={() => setCurrentTab('active')} className={`flex-1 py-2.5 rounded-[10px] font-bold text-[0.85rem] transition-all duration-200 cursor-pointer ${currentTab === 'active' ? 'bg-brand-primary text-brand-bg' : 'bg-transparent text-brand-muted hover:text-white'}`}>
          {lang === 'en' ? 'Active Rentals' : 'Mga Aktibong Renta'}
        </button>
        <button onClick={() => setCurrentTab('history')} className={`flex-1 py-2.5 rounded-[10px] font-bold text-[0.85rem] transition-all duration-200 cursor-pointer ${currentTab === 'history' ? 'bg-brand-primary text-brand-bg' : 'bg-transparent text-brand-muted hover:text-white'}`}>
          {lang === 'en' ? 'Past History' : 'Kasaysayan'}
        </button>
      </div>

      <div className="w-full max-w-[1100px]">
        {visibleBookings.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-500 text-sm italic">
            No current lifecycle records found.
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 w-full">
            {visibleBookings.map((booking) => {
              if (!booking) return null;

              const status = booking?.status || 'Pending';
              const isExtended = booking?.is_extended === true || booking?.original_rental_units != null;
              const isAlreadyReviewed = reviewedBookingIds.includes(booking?.id);

              const pickupDateObj = booking?.picked_up_at ? new Date(booking.picked_up_at) : null;

              const endDeadlineObj = calculateEndTime(booking);
              const isExpired = status === 'Picked Up' && currentTime > endDeadlineObj;

              // 🔥 LATE PENALTY COMPUTATION LOGIC PARA SA CLIENT 🔥
              let penaltyFee = 0;
              let overdueHours = 0;
              if (isExpired) {
                const diffMs = currentTime.getTime() - endDeadlineObj.getTime();
                overdueHours = Math.ceil(diffMs / (1000 * 60 * 60));

                let hourlyRate = 100;
                const bName = String(booking?.motorcycle_name || '').toLowerCase();
                if (bName.includes('fazzio') || bName.includes('click')) hourlyRate = 75;
                else if (bName.includes('mio') || bName.includes('beat')) hourlyRate = 70;

                penaltyFee = overdueHours * hourlyRate;
              }

              const displayPickup = pickupDateObj && !isNaN(pickupDateObj.getTime()) ? pickupDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending Set';
              const displayReturn = endDeadlineObj && !isNaN(endDeadlineObj.getTime()) ? endDeadlineObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending Set';

              let rawMode = String(booking?.payment_method || '').toLowerCase();
              let baseMode = 'Cash';

              if (rawMode.includes('maya')) {
                baseMode = 'Maya';
              } else if (rawMode.includes('gcash') || booking?.receipt_url) {
                baseMode = 'GCash';
              }

              const totalAmt = Number(booking?.total_amount || 0);
              const cashPaid = Number(booking?.cash_paid || 0);

              let balance = Number(booking?.balance_due || 0);
              if (baseMode === 'Cash' && cashPaid < totalAmt && balance === 0) {
                balance = totalAmt - cashPaid;
              }

              let downpayment = totalAmt - balance - cashPaid;
              if (downpayment < 0) downpayment = 0;

              const hasBalance = balance > 0;
              const isSplit = downpayment > 0 && (hasBalance || cashPaid > 0);

              let displayModeName = baseMode;
              if (isSplit) displayModeName = `${baseMode}/Cash`;

              const paymentModeClass = baseMode === 'GCash' ? 'text-blue-500' : baseMode === 'Maya' ? 'text-emerald-500' : 'text-amber-500';

              let dpLabel = lang === 'en' ? `Downpayment (${baseMode}):` : `Paunang Bayad (${baseMode}):`;
              if (!isSplit && downpayment === totalAmt) {
                dpLabel = lang === 'en' ? `Full Payment (${baseMode}):` : `Buong Bayad (${baseMode}):`;
              }

              const refId = String(booking?.id || 'xxxx').substring(0, 8).toUpperCase();

              // EXTENSION DETAILS
              let extRawMode = String(booking?.extension_payment_method || '').toLowerCase();
              let extBaseMode = 'Cash';

              if (extRawMode.includes('maya')) {
                extBaseMode = 'Maya';
              } else if (extRawMode.includes('gcash') || extRawMode.includes('ewallet')) {
                extBaseMode = 'GCash';
              } else if (extRawMode.includes('cash')) {
                extBaseMode = 'Cash';
              }

              const extPaymentClass = extBaseMode === 'GCash' ? 'text-blue-500' : extBaseMode === 'Maya' ? 'text-emerald-500' : 'text-amber-500';

              const extTotalAmt = Number(booking?.extension_amount || 0);
              const extPaidAmt = Number(booking?.extension_paid || 0);
              const extBalance = extTotalAmt > 0 ? extTotalAmt - extPaidAmt : 0;

              return (
                <div
                  key={booking?.id || Math.random()}
                  className="glass-card glass-card-hover p-6 flex flex-col gap-3"
                >

                  <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-1">
                    <div className="flex gap-3 items-center">
                      <div className="w-[55px] h-[55px] rounded-[10px] bg-white/[0.03] overflow-hidden shrink-0 flex justify-center items-center border border-white/10">
                        {getBikeImage(booking?.motorcycle_name) ? (
                          <img src={getBikeImage(booking?.motorcycle_name)} alt={booking?.motorcycle_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">🏍️</span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-display text-white mb-1 text-[1.15rem] font-extrabold">{booking?.motorcycle_name || 'Unknown Unit'}</h3>
                        <div className="text-slate-500 text-xs font-mono">Ref ID: #{refId}</div>
                      </div>
                    </div>

                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-[0.7rem] font-extrabold uppercase whitespace-nowrap inline-block border ${
                        status === 'Completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : status === 'Rejected' || status === 'Cancelled'
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : 'bg-brand-primary/15 text-brand-primary border-brand-primary/30'
                      }`}>
                        {status} {isExtended && "➕ EXT"}
                      </span>
                    </div>
                  </div>

                  <div className={cardRowClass}>
                    <span className={cardLabelClass}>Contract Type:</span>
                    <span className={cardValueClass}>{booking?.rental_package || 'Standard Contract'}</span>
                  </div>

                  <div className={cardRowClass}>
                    <span className={cardLabelClass}>Timeline:</span>
                    <span className={cardValueClass}>
                      {status === 'Completed' ? (
                        <>
                          <div className="mb-1">{displayPickup} → {displayReturn}</div>
                          <div className="text-emerald-500 text-xs font-bold">✓ Returned / Completed</div>
                        </>
                      ) : status === 'Cancelled' || status === 'Rejected' ? (
                        <span className="italic text-red-500">Booking {status}</span>
                      ) : (
                        <>
                          <div className="mb-1">{displayPickup} → {displayReturn}</div>
                          {isExpired && <span className="text-red-500 font-bold">⚠️ [OVERDUE]</span>}
                        </>
                      )}
                    </span>
                  </div>

                  {isExtended && (
                    <div className="bg-brand-primary/10 px-2.5 py-1.5 rounded-lg border border-brand-primary/20 text-xs mt-1 mb-2">
                      <span className="text-brand-primary font-bold">🕒 Extension Record Active</span>
                      <div className="text-white flex justify-between mt-0.5">
                        <span>Original Duration:</span> <span>{booking.original_rental_units || 'N/A'} Units</span>
                      </div>
                    </div>
                  )}

                  <div className={cardRowClass}>
                    <span className={cardLabelClass}>{lang === 'en' ? 'Mode of payment:' : 'Paraan ng pagbabayad:'}</span>
                    <span className={`${cardValueClass} ${paymentModeClass} font-bold`}>
                      {displayModeName}
                    </span>
                  </div>

                  <div className={cardRowClass}>
                    <span className={cardLabelClass}>{lang === 'en' ? 'Total Amount:' : 'Kabuuang Halaga:'}</span>
                    <span className={`${cardValueClass} text-brand-primary font-bold text-base`}>₱{totalAmt}</span>
                  </div>

                  {downpayment > 0 && (
                    <div className={cardRowClass}>
                      <span className={cardLabelClass}>{dpLabel}</span>
                      <span className={`${cardValueClass} ${paymentModeClass}`}>
                        ₱{downpayment}
                      </span>
                    </div>
                  )}

                  {cashPaid > 0 && (
                    <div className={cardRowClass}>
                      <span className={cardLabelClass}>{lang === 'en' ? 'Cash Paid:' : 'Bayad na Cash:'}</span>
                      <span className={`${cardValueClass} text-emerald-500`}>
                        ₱{cashPaid}
                      </span>
                    </div>
                  )}

                  <div className={`${cardRowClass} mt-1 ${hasBalance ? 'bg-red-500/5 px-2 py-1 rounded-md' : ''}`}>
                    <span className={`${cardLabelClass} ${hasBalance ? 'text-red-400' : ''}`}>
                      {lang === 'en' ? 'Balance:' : 'Balanse:'}
                    </span>
                    <span className={`${cardValueClass} font-bold ${hasBalance ? 'text-red-500' : 'text-emerald-500'}`}>
                      ₱{balance}
                      {!hasBalance && (
                        <span className="text-[0.7rem] text-emerald-500 font-normal block">
                          ({lang === 'en' ? 'Cleared' : 'Bayad Na'})
                        </span>
                      )}
                      {hasBalance && (
                        <span className="text-[0.7rem] text-red-400 font-normal block">
                          ({lang === 'en' ? 'Cash upon pick up' : 'Ibabayad sa pagkuha'})
                        </span>
                      )}
                    </span>
                  </div>

                  {/* 🔥 VISUAL LATE PENALTY PARA SA CLIENT 🔥 */}
                  {penaltyFee > 0 && (
                    <div className={`${cardRowClass} bg-red-500/15 px-2 py-1.5 rounded-md border border-dashed border-red-500/50 mt-2`}>
                      <span className={`${cardLabelClass} text-red-400 font-bold`}>⚠️ {lang === 'en' ? 'LATE PENALTY' : 'LATE PENALTY'} ({overdueHours} {lang === 'en' ? 'hr/s' : 'oras'}):</span>
                      <span className={`${cardValueClass} text-red-500 font-bold text-[1.1rem]`}>
                        ₱{penaltyFee}
                      </span>
                    </div>
                  )}

                  {isExtended && (
                    <div className="mt-3 pt-3 border-t border-dashed border-white/10 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-brand-primary text-[0.85rem] font-extrabold flex items-center gap-1.5">
                          <span>🔄</span> {lang === 'en' ? 'Extension Details' : 'Detalye ng Extension'}
                        </span>
                        {booking?.extended_at && (
                          <span className="text-xs text-slate-500">
                            {lang === 'en' ? 'Processed: ' : 'Na-process: '}
                            {new Date(booking.extended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <div className={cardRowClass}>
                        <span className={cardLabelClass}>{lang === 'en' ? 'Mode of Payment (Ext):' : 'Paraan ng pagbabayad (Ext):'}</span>
                        <span className={`${cardValueClass} ${extPaymentClass} font-bold`}>
                          {extBaseMode}
                        </span>
                      </div>

                      <div className={cardRowClass}>
                        <span className={cardLabelClass}>{lang === 'en' ? 'Total Amount (Ext):' : 'Kabuuang Halaga (Ext):'}</span>
                        <span className={`${cardValueClass} text-brand-primary font-bold`}>
                          ₱{extTotalAmt}
                        </span>
                      </div>

                      {extBalance > 0 ? (
                        <div className={`${cardRowClass} bg-red-500/5 px-2 py-1 rounded-md`}>
                          <span className={`${cardLabelClass} text-red-400`}>{lang === 'en' ? 'Balance (Ext):' : 'Balanse (Ext):'}</span>
                          <span className={`${cardValueClass} text-red-500 font-bold`}>
                            ₱{extBalance}
                            <span className="text-[0.7rem] text-red-400 font-normal block">
                              ({lang === 'en' ? 'Cash upon return' : 'Ibabayad sa pag-return'})
                            </span>
                          </span>
                        </div>
                      ) : extTotalAmt > 0 ? (
                        <div className={cardRowClass}>
                          <span className={cardLabelClass}>
                            {extBaseMode === 'GCash' ? (lang === 'en' ? 'GCash Paid:' : 'Bayad sa GCash:')
                              : extBaseMode === 'Maya' ? (lang === 'en' ? 'Maya Paid:' : 'Bayad sa Maya:')
                              : (lang === 'en' ? 'Cash Paid:' : 'Bayad na Cash:')}
                          </span>
                          <span className={`${cardValueClass} text-emerald-500`}>
                            ₱{extPaidAmt}
                          </span>
                        </div>
                      ) : null}

                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-3">
                    {booking?.government_id_url ? (
                      <div className="text-emerald-500 text-[0.82rem] font-bold flex items-center gap-1 mb-2">
                        ✓ Verified ID / License
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5 p-3 bg-red-500/[0.08] border border-dashed border-red-500 rounded-[10px] w-full box-border mb-2 animate-[urgentPulse_2s_infinite]">
                        <span className="text-red-400 text-xs font-extrabold uppercase">⚠️ Upload Gov ID Required</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingId === booking?.id}
                          onChange={(e) => handleIDUpload(e, booking?.id)}
                          className="text-xs text-slate-300 w-full file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-primary file:text-brand-bg file:font-bold file:cursor-pointer"
                        />
                        {uploadingId === booking?.id && (
                          <span className="text-xs text-brand-primary font-bold">Uploading file...</span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 w-full flex-wrap">

                      {currentTab === 'active' && (status === 'Pending' || status === 'Approved') && (
                        <button onClick={() => handleCancelBooking(booking?.id)} className="flex-1 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-[0.8rem] font-bold cursor-pointer transition-colors hover:bg-red-500/20">
                          ✖️ Cancel Booking
                        </button>
                      )}

                      {currentTab === 'active' && status === 'Picked Up' && (
                        <button onClick={() => setSelectedBookingForExtend(booking)} className="flex-1 py-2.5 bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 rounded-lg text-[0.8rem] font-bold cursor-pointer transition-colors hover:bg-emerald-400/20">
                          ⏳ Extend Booking
                        </button>
                      )}

                      {currentTab === 'history' && status === 'Completed' && !isAlreadyReviewed && (
                        <button onClick={() => setSelectedBookingForReview(booking)} className="btn-primary flex-1 py-2.5 text-[0.8rem]">
                          Review Unit
                        </button>
                      )}

                      {currentTab === 'history' && (
                        <button onClick={() => hideFromHistory(booking?.id)} className="flex-1 py-2.5 bg-white/5 text-brand-muted border border-white/10 rounded-lg text-[0.8rem] cursor-pointer hover:bg-white/10 transition-colors">
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
        <div className="fixed inset-0 bg-[rgba(5,8,16,0.85)] backdrop-blur-md flex justify-center items-center z-[9999] p-4">
          <div className="bg-brand-card/95 backdrop-blur-xl border border-brand-primary/15 rounded-3xl p-8 w-full max-w-[420px] box-border shadow-[0_0_0_1px_rgba(234,169,116,0.04),0_30px_60px_rgba(0,0,0,0.6)] animate-[fadeInEffect_0.25s_ease-out]">
            <h3 className="font-display mb-1 text-white text-[1.3rem] font-bold">Write a Review</h3>
            <p className="mb-6 text-brand-muted text-[0.8rem]">Unit: {selectedBookingForReview?.motorcycle_name || 'Unit'}</p>
            <form onSubmit={submitReviewHandler} className="flex flex-col gap-3">
              <div>
                <label className="block text-slate-300 text-[0.78rem] font-semibold mb-1">Rating Star Score:</label>
                <select value={rating} onChange={(e) => setRating(e.target.value)} className={glassInputClass}>
                  <option value="5">⭐⭐⭐⭐⭐ Excellent Deal (5/5)</option>
                  <option value="4">⭐⭐⭐⭐ Great Experience (4/5)</option>
                  <option value="3">⭐⭐⭐ Standard Average (3/5)</option>
                  <option value="2">⭐⭐ Disappointing Ride (2/5)</option>
                  <option value="1">⭐ Terrible / Unacceptable (1/5)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-[0.78rem] font-semibold mb-1">Feedback Commentary:</label>
                <textarea rows="3" required value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your experience?" className={`${glassInputClass} resize-none`}></textarea>
              </div>
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => setSelectedBookingForReview(null)} className="btn-ghost flex-1 py-2.5 text-[0.85rem]">Cancel</button>
                <button type="submit" disabled={submittingReview} className="btn-primary flex-1 py-2.5 text-[0.85rem] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none">{submittingReview ? 'Sending...' : 'Post Review'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <ConfirmDialog confirmState={confirmState} onCancel={() => setConfirmState(null)} />

    </div>
  );
}
