import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import mainWebsiteBg from '../assets/BG.png';
import AdminFleetManager from './AdminFleetManager';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';
import useEscapeToClose from '../hooks/useEscapeToClose';

// 🏍️ IMPORT MGA PICTURES NG MOTOR
import nmaxImg from '../assets/Bikes/nmaxv3.jpg';
import aeroxImg from '../assets/Bikes/aeroxv3.jpg';
import clickImg from '../assets/Bikes/click125.jpg';
import beatImg from '../assets/Bikes/beat.jpg';
import fazzioImg from '../assets/Bikes/fazzio.png';
import mioiImg from '../assets/Bikes/mio i 125.jpg';

// --- SHARED TAILWIND CLASS TOKENS (matches the booking card design system) ---
const bookingGridClass = "grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 w-full";
const bookingCardClass = "bg-[rgba(10,17,32,0.85)] backdrop-blur-lg border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-3 transition-all duration-300 ease-out shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)] hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_20px_45px_-15px_rgba(59,130,246,0.18)]";
const cardHeaderClass = "flex justify-between items-start border-b border-white/5 pb-4 mb-2";
const cardRowClass = "flex justify-between items-start text-[0.85rem] gap-2.5";
const cardLabelClass = "text-brand-muted font-medium whitespace-nowrap";
const cardValueClass = "text-slate-50 font-semibold text-right break-words";
const cardActionsClass = "mt-auto pt-4 border-t border-white/5 flex flex-col gap-3";

const proofButtonClass = "flex-1 min-w-[100px] p-2 bg-white/5 text-white border border-white/10 rounded-md text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors";
const proofEmptyClass = "flex-1 min-w-[100px] p-2 text-center bg-transparent text-slate-500 border border-dashed border-white/10 rounded-md text-xs";
const extProofButtonClass = "flex-1 min-w-[100px] p-2 bg-brand-primary/10 text-brand-primary border border-brand-primary/30 rounded-md text-xs font-semibold cursor-pointer hover:bg-brand-primary/20 transition-colors";
const extProofEmptyClass = "flex-1 min-w-[100px] p-2 text-center bg-transparent text-slate-500 border border-dashed border-brand-primary/20 rounded-md text-xs";

const actionButtonBase = "flex-1 min-w-[140px] py-2.5 px-2 rounded-lg text-[0.8rem] font-bold cursor-pointer transition-colors";

export default function AdminDashboard({ onStatusUpdate, lang }) {
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [mainView, setMainView] = useState('bookings');
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('active');
  const [selectedProofImg, setSelectedProofImg] = useState(null);
  useEscapeToClose(!!selectedProofImg, () => setSelectedProofImg(null));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const BOOKINGS_PER_PAGE = 12;

  const [hiddenHistoryIds, setHiddenHistoryIds] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_hidden_bookings');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const calculateEndTime = (booking) => {
    const startDate = booking?.picked_up_at
      ? new Date(booking.picked_up_at)
      : new Date(booking?.created_at || new Date());

    const packageStr = String(booking?.rental_package || '').toLowerCase();
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

    const multiplier = Number(booking?.rental_units) || 1;
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
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*');

      if (clientsError) console.warn("Error fetching clients:", clientsError);

      const combinedData = (bookingsData || []).map(booking => {
        const clientMatch = (clientsData || []).find(c => c.id === booking.client_id);
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
        .from('motorcycles')
        .update({ status: availabilityStatus })
        .eq('name', motorName);

      if (error) console.error("Error updating motor availability:", error);
    } catch (err) {
      console.error("Motor status trigger failed:", err);
    }
  };

  const handleConfirmBalancePayment = async (booking) => {
    let rawMode = String(booking.payment_method || '').toLowerCase();
    let baseMode = 'Cash';
    if (rawMode.includes('maya')) baseMode = 'Maya';
    else if (rawMode.includes('gcash') || booking.receipt_url) baseMode = 'GCash';

    const totalAmt = Number(booking.total_amount || 0);
    const currentCashPaid = Number(booking.cash_paid || 0);

    let amountToClear = Number(booking.balance_due || 0);
    if (baseMode === 'Cash' && currentCashPaid < totalAmt && amountToClear === 0) {
      amountToClear = totalAmt - currentCashPaid;
    }

    setConfirmState({
      message: `Confirm Cash Payment of ₱${amountToClear}? This will clear the client's balance to ₱0.`,
      onConfirm: () => executeConfirmBalancePayment(booking, currentCashPaid, amountToClear)
    });
  };

  const executeConfirmBalancePayment = async (booking, currentCashPaid, amountToClear) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          balance_due: 0,
          cash_paid: currentCashPaid + amountToClear
        })
        .eq('id', booking.id);

      if (error) {
        console.error(error);
        setToast({ type: 'error', message: "🚨 UPDATE ERROR: Please make sure you've created a 'cash_paid' (type: numeric) column on your bookings table in Supabase." });
        return;
      }

      setToast({ type: 'success', message: "Cash Payment Confirmed Successfully!" });
      fetchAllBookings();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: "Failed to confirm balance payment." });
    }
  };

  const handleConfirmExtPayment = (booking, amountToClear) => {
    setConfirmState({
      message: `Confirm the Cash Payment for the extension: ₱${amountToClear}?`,
      onConfirm: () => executeConfirmExtPayment(booking, amountToClear)
    });
  };

  const executeConfirmExtPayment = async (booking, amountToClear) => {
    try {
      const currentExtPaid = Number(booking.extension_paid || 0);

      const { error } = await supabase
        .from('bookings')
        .update({
          extension_paid: currentExtPaid + amountToClear
        })
        .eq('id', booking.id);

      if (error) throw error;

      setToast({ type: 'success', message: "Extension Payment Confirmed!" });
      fetchAllBookings();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: "Failed to confirm extension payment." });
    }
  };

  const updateBookingStatus = (bookingId, newStatus, motorName) => {
    setConfirmState({
      message: `Are you sure you want to update the status to: ${newStatus}?`,
      onConfirm: () => executeUpdateBookingStatus(bookingId, newStatus, motorName)
    });
  };

  const executeUpdateBookingStatus = async (bookingId, newStatus, motorName) => {
    try {
      const updatePayload = { status: newStatus };

      if (newStatus === 'Picked Up') {
        updatePayload.picked_up_at = new Date().toISOString();
        await updateMotorAvailability(motorName, 'Rented');
      }

      if (newStatus === 'Rejected' || newStatus === 'Cancelled') {
        await updateMotorAvailability(motorName, 'Available');
      }

      const { error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingId);

      if (error) throw error;

      setToast({ type: 'success', message: `Status updated to ${newStatus}` });
      fetchAllBookings();
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      console.error("Status update error:", err);
      setToast({ type: 'error', message: "Failed to update status." });
    }
  };

  const handleCompleteTransaction = (bookingId, motorName, penaltyFee) => {
    let confirmMsg = "Mark this as 'Completed'? This means the motorcycle has been returned in good condition and everything has been paid in full.";

    // 🔥 Penalty Check for Admin Alert
    if (penaltyFee > 0) {
      confirmMsg = `⚠️ OVERDUE LATE PENALTY DETECTED: ₱${penaltyFee}.\n\nMake sure this penalty has been charged and paid before completing the transaction. Confirm completion?`;
    }

    setConfirmState({
      message: confirmMsg,
      onConfirm: () => executeCompleteTransaction(bookingId, motorName)
    });
  };

  const executeCompleteTransaction = async (bookingId, motorName) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'Completed', balance_due: 0 })
        .eq('id', bookingId);

      if (error) throw error;

      await updateMotorAvailability(motorName, 'Available');

      setToast({ type: 'success', message: "Transaction Completed & Balance Cleared!" });
      fetchAllBookings();
      if (onStatusUpdate) onStatusUpdate();
    } catch (err) {
      console.error("Complete transaction error:", err);
      setToast({ type: 'error', message: "Failed to complete transaction." });
    }
  };

  const hideFromHistory = (bookingId) => {
    const updated = [...hiddenHistoryIds, bookingId];
    setHiddenHistoryIds(updated);
    localStorage.setItem('admin_hidden_bookings', JSON.stringify(updated));
  };

  const handleDeleteBooking = (bookingId) => {
    setConfirmState({
      message: "⚠️ WARNING: Permanently delete this record from the database? This cannot be undone.",
      danger: true,
      confirmLabel: 'Delete',
      onConfirm: () => executeDeleteBooking(bookingId)
    });
  };

  const executeDeleteBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      setToast({ type: 'success', message: "Record permanently deleted." });
      fetchAllBookings();
    } catch (err) {
      console.error("Delete error:", err);
      setToast({ type: 'error', message: "Failed to delete record." });
    }
  };

  // Private na ngayon ang mga bucket na ito (gov ID / resibo), kaya signed
  // URL na lang ang tanging paraan para makita ito — hindi na basta
  // getPublicUrl. Sinusuportahan pa rin ang mga lumang row na naka-save ang
  // buong public URL bago nag-lockdown (extractStoragePath).
  const extractStoragePath = (bucket, value) => {
    if (!value) return null;
    if (value.startsWith('http')) {
      const marker = `/object/public/${bucket}/`;
      const idx = value.indexOf(marker);
      if (idx === -1) return null;
      return decodeURIComponent(value.slice(idx + marker.length));
    }
    return value;
  };

  const handleProofClick = async (bucket, value) => {
    const path = extractStoragePath(bucket, value);
    if (!path) {
      setToast({ type: 'error', message: "File not found." });
      return;
    }
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
    if (error || !data?.signedUrl) {
      setToast({ type: 'error', message: "Could not load file." });
      return;
    }
    setSelectedProofImg(data.signedUrl);
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

    const st = b.status || 'Pending';
    const matchesTab = currentTab === 'active'
      ? (st === 'Pending' || st === 'Approved' || st === 'Picked Up' || st === 'Pending Verification')
      : (st === 'Completed' || st === 'Rejected' || st === 'Cancelled');
    if (!matchesTab) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const refId = String(b.id || '').substring(0, 8).toLowerCase();
    const haystack = [
      b.motorcycle_name,
      b.client_info?.full_name,
      b.client_info?.email,
      refId
    ].filter(Boolean).join(' ').toLowerCase();

    return haystack.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(visibleBookings.length / BOOKINGS_PER_PAGE));
  const pagedBookings = visibleBookings.slice(
    (currentPage - 1) * BOOKINGS_PER_PAGE,
    currentPage * BOOKINGS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, currentTab, mainView]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#050811] text-brand-primary font-sans">
        <div className="font-display text-center tracking-wide font-bold text-sm animate-pulse">LOADING COMMAND CENTER...</div>
      </div>
    );
  }

  const formatSystemDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + ` | ` + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      className="min-h-screen w-full font-sans bg-cover bg-center bg-[#050811] box-border px-4 sm:px-8 pt-[140px] pb-16 flex flex-col items-center"
      style={{ backgroundImage: `url(${mainWebsiteBg})` }}
    >

      <div className="w-full max-w-[1200px] flex justify-between items-center flex-wrap gap-4 mb-8">
        <div>
          <h1 className="font-display mb-1 text-white text-[2.2rem] font-bold tracking-tight">
            Fleet Command Center
          </h1>
          <p className="m-0 text-blue-400 text-xs font-bold uppercase tracking-[0.2em]">
            Administrator Privileges Active
          </p>
        </div>
        <div className="bg-blue-500/10 backdrop-blur-md border border-blue-500/30 px-4 py-2.5 rounded-[10px] text-blue-300 text-sm font-bold">
          {formatSystemDate(currentTime)}
        </div>
      </div>

      {/* PRIMARY NAVIGATION — which section of the admin panel */}
      <div className="w-full max-w-[1200px] border-b border-white/10 mb-6 flex gap-2 sm:gap-6">
        <button
          onClick={() => setMainView('bookings')}
          className={`shrink-0 px-2 sm:px-1 pb-3 -mb-px border-b-2 text-sm sm:text-base font-bold cursor-pointer transition-colors whitespace-nowrap ${
            mainView === 'bookings' ? 'border-blue-500 text-white' : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          📋 Bookings
        </button>
        <button
          onClick={() => setMainView('fleet')}
          className={`shrink-0 px-2 sm:px-1 pb-3 -mb-px border-b-2 text-sm sm:text-base font-bold cursor-pointer transition-colors whitespace-nowrap ${
            mainView === 'fleet' ? 'border-blue-500 text-white' : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          🏍️ Fleet
        </button>
      </div>

      {mainView === 'fleet' && <AdminFleetManager />}

      {mainView === 'bookings' && (
      <>
      {/* SECONDARY FILTER — which bookings to show within this section */}
      <div className="flex items-center gap-2 mb-6 w-full max-w-[1200px] flex-wrap">
        <span className="text-[0.68rem] text-brand-muted font-semibold uppercase tracking-wider mr-1">Showing:</span>
        <button
          onClick={() => setCurrentTab('active')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors border ${
            currentTab === 'active' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-brand-muted border-white/10 hover:border-white/25 hover:text-white'
          }`}
        >
          Live & Pending
        </button>
        <button
          onClick={() => setCurrentTab('history')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors border ${
            currentTab === 'history' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-brand-muted border-white/10 hover:border-white/25 hover:text-white'
          }`}
        >
          History
        </button>

        <div className="relative ml-auto w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, motor, or ref ID..."
            className="w-full px-3.5 py-1.5 bg-[#0e1424] text-white text-xs border border-white/10 rounded-full outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-[1200px]">
        {visibleBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm italic bg-[rgba(10,17,32,0.75)] backdrop-blur-md border border-white/5 rounded-[20px]">
            {searchQuery ? `No bookings match "${searchQuery}".` : 'No records found for this category.'}
          </div>
        ) : (
          <div className={bookingGridClass}>
            {pagedBookings.map((booking) => {
              if (!booking) return null;

              const status = booking.status || 'Pending';
              const isExtended = booking.is_extended === true || booking.original_rental_units != null;

              const pickupDateObj = booking.picked_up_at ? new Date(booking.picked_up_at) : null;

              const endDeadlineObj = calculateEndTime(booking);
              const isExpired = status === 'Picked Up' && currentTime > endDeadlineObj;

              // 🔥 LATE PENALTY COMPUTATION LOGIC 🔥
              let penaltyFee = 0;
              let overdueHours = 0;
              if (isExpired) {
                const diffMs = currentTime.getTime() - endDeadlineObj.getTime();
                overdueHours = Math.ceil(diffMs / (1000 * 60 * 60)); // round up per hour

                let hourlyRate = 100; // Default (Nmax, Aerox)
                const bName = String(booking?.motorcycle_name || '').toLowerCase();
                if (bName.includes('fazzio') || bName.includes('click')) {
                  hourlyRate = 75;
                } else if (bName.includes('mio') || bName.includes('beat')) {
                  hourlyRate = 70;
                }

                penaltyFee = overdueHours * hourlyRate;
              }

              const displayPickup = pickupDateObj && !isNaN(pickupDateObj.getTime()) ? pickupDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending Set';
              const displayReturn = endDeadlineObj && !isNaN(endDeadlineObj.getTime()) ? endDeadlineObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending Set';

              const refId = String(booking.id || 'xxxx').substring(0, 8).toUpperCase();

              let statusBadgeClass = 'bg-blue-500/10 text-blue-400';
              if (status === 'Completed') { statusBadgeClass = 'bg-emerald-500/10 text-emerald-500'; }
              else if (status === 'Pending') { statusBadgeClass = 'bg-amber-500/10 text-amber-500'; }
              else if (status === 'Rejected' || status === 'Cancelled') { statusBadgeClass = 'bg-red-500/10 text-red-500'; }

              let rawMode = String(booking.payment_method || '').toLowerCase();
              let baseMode = 'Cash';

              if (rawMode.includes('maya')) {
                baseMode = 'Maya';
              } else if (rawMode.includes('gcash') || booking.receipt_url) {
                baseMode = 'GCash';
              }

              const totalAmt = Number(booking.total_amount || 0);
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

              let paymentModeColorClass = baseMode === 'GCash' ? 'text-blue-500' : baseMode === 'Maya' ? 'text-emerald-500' : 'text-amber-500';

              let dpLabel = `Downpayment (${baseMode}):`;
              if (!isSplit && downpayment === totalAmt) {
                dpLabel = `Full Payment (${baseMode}):`;
              }

              // EXTENSION COMPUTATIONS
              let extRawMode = String(booking?.extension_payment_method || '').toLowerCase();
              let extBaseMode = 'Cash';

              if (extRawMode.includes('maya')) {
                extBaseMode = 'Maya';
              } else if (extRawMode.includes('gcash') || extRawMode.includes('ewallet')) {
                extBaseMode = 'GCash';
              } else if (extRawMode.includes('cash')) {
                extBaseMode = 'Cash';
              }

              let extPaymentColorClass = extBaseMode === 'GCash' ? 'text-blue-500' : extBaseMode === 'Maya' ? 'text-emerald-500' : 'text-amber-500';

              const extTotalAmt = Number(booking?.extension_amount || 0);
              const extPaidAmt = Number(booking?.extension_paid || 0);
              const extBalance = extTotalAmt > 0 ? extTotalAmt - extPaidAmt : 0;

              return (
                <div key={booking.id || Math.random()} className={bookingCardClass}>

                  <div className={cardHeaderClass}>
                    <div className="flex gap-3 items-center">
                      <div className="w-[55px] h-[55px] rounded-[10px] bg-white/[0.03] overflow-hidden shrink-0 flex justify-center items-center border border-white/10">
                        {getBikeImage(booking.motorcycle_name) ? (
                          <img src={getBikeImage(booking.motorcycle_name)} alt={booking.motorcycle_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">🏍️</span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-display text-white mb-1 text-[1.15rem] font-bold">{booking.motorcycle_name || 'Unknown Unit'}</h3>
                        <div className="text-slate-500 text-xs font-mono">Ref ID: #{refId}</div>
                      </div>
                    </div>

                    <div className="pl-2">
                      <span className={`px-2.5 py-1 rounded-full text-[0.7rem] font-extrabold uppercase whitespace-nowrap inline-block ${statusBadgeClass}`}>
                        {status} {isExtended && "➕ EXT"}
                      </span>
                    </div>
                  </div>

                  <div className={cardRowClass}>
                    <span className={cardLabelClass}>Client Name:</span>
                    <span className="font-semibold text-right break-words text-blue-300">
                      {booking.client_info?.full_name || 'No Name'}
                    </span>
                  </div>
                  <div className={cardRowClass}>
                    <span className={cardLabelClass}>Contact No:</span>
                    <span className={cardValueClass}>
                      {booking.client_info?.phone_number || 'N/A'}
                    </span>
                  </div>

                  <div className={cardRowClass}>
                    <span className={cardLabelClass}>Booked On:</span>
                    <span className={cardValueClass}>
                      {new Date(booking.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                  </div>

                  <div className={cardRowClass}>
                    <span className={cardLabelClass}>Timeline:</span>
                    <span className={cardValueClass}>
                      {status === 'Picked Up' || status === 'Approved' ? (
                        <>
                          <div className="mb-1">{displayPickup} → {displayReturn}</div>
                          {isExpired && <span className="text-red-500 font-bold">⚠️ [OVERDUE]</span>}
                        </>
                      ) : status === 'Completed' ? (
                        <div className="text-emerald-500 text-xs font-bold">✓ Returned / Completed</div>
                      ) : status === 'Cancelled' || status === 'Rejected' ? (
                         <span className="italic text-red-500">Booking {status}</span>
                      ) : (
                        <span className="italic text-brand-muted">Awaiting unit release...</span>
                      )}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-white/10 my-2" />

                  {isExtended && (
                    <div className="bg-brand-primary/10 px-2.5 py-1.5 rounded-lg border border-brand-primary/20 text-xs mt-1 mb-2">
                      <span className="text-brand-primary font-bold">🕒 Extension Record Active</span>
                      <div className="text-white flex justify-between mt-0.5">
                        <span>Original Duration:</span> <span>{booking.original_rental_units || 'N/A'} Units</span>
                      </div>
                    </div>
                  )}

                  <div className={cardRowClass}>
                    <span className={cardLabelClass}>Mode of payment:</span>
                    <span className={`text-right break-words font-bold ${paymentModeColorClass}`}>
                      {displayModeName}
                    </span>
                  </div>

                  <div className={cardRowClass}>
                    <span className={cardLabelClass}>Total Amount:</span>
                    <span className={cardValueClass}>₱{totalAmt}</span>
                  </div>

                  {downpayment > 0 && (
                    <div className={cardRowClass}>
                      <span className={cardLabelClass}>{dpLabel}</span>
                      <span className={`text-right break-words font-semibold ${paymentModeColorClass}`}>
                        ₱{downpayment}
                      </span>
                    </div>
                  )}

                  {cashPaid > 0 && (
                    <div className={cardRowClass}>
                      <span className={cardLabelClass}>Full Payment (Cash):</span>
                      <span className="text-right break-words font-semibold text-emerald-500">
                        ₱{cashPaid}
                      </span>
                    </div>
                  )}

                  <div className={`${cardRowClass} mt-1 rounded-md ${hasBalance ? 'bg-red-500/5 px-2 py-1' : 'bg-transparent p-0'}`}>
                    <span className={`font-medium whitespace-nowrap ${hasBalance ? 'text-red-400' : 'text-brand-muted'}`}>Balance:</span>
                    <span className={`text-right break-words font-bold ${hasBalance ? 'text-red-500' : 'text-emerald-500'}`}>
                      ₱{balance}
                      {!hasBalance && <span className="text-[0.7rem] text-emerald-500 font-normal block">(Cleared)</span>}
                      {hasBalance && <span className="text-[0.7rem] text-red-400 font-normal block">(Cash upon pick up)</span>}
                    </span>
                  </div>

                  {/* 🔥 VISUAL LATE PENALTY PARA SA ADMIN 🔥 */}
                  {penaltyFee > 0 && (
                    <div className={`${cardRowClass} bg-red-500/15 px-2 py-1.5 rounded-md border border-dashed border-red-500/50 mt-2`}>
                      <span className="font-bold whitespace-nowrap text-red-400">⚠️ LATE PENALTY ({overdueHours} hr/s):</span>
                      <span className="text-right break-words font-bold text-lg text-red-500">
                        ₱{penaltyFee}
                      </span>
                    </div>
                  )}

                  {/* EXTENSION DETAILS PARA SA ADMIN */}
                  {isExtended && (
                    <div className="mt-3 pt-3 border-t border-dashed border-white/10 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-display text-brand-primary text-sm font-bold flex items-center gap-1.5">
                          <span>🔄</span> Extension Details
                        </span>
                        {booking?.extended_at && (
                          <span className="text-[0.7rem] text-slate-500">
                            Processed: {new Date(booking.extended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <div className={cardRowClass}>
                        <span className={cardLabelClass}>Mode of Payment (Ext):</span>
                        <span className={`text-right break-words font-bold ${extPaymentColorClass}`}>
                          {extBaseMode}
                        </span>
                      </div>

                      <div className={cardRowClass}>
                        <span className={cardLabelClass}>Total Amount (Ext):</span>
                        <span className="text-right break-words font-bold text-brand-primary">
                          ₱{extTotalAmt}
                        </span>
                      </div>

                      {extBalance > 0 ? (
                        <div className={`${cardRowClass} bg-red-500/5 px-2 py-1 rounded-md`}>
                          <span className="font-medium whitespace-nowrap text-red-400">Balance (Ext):</span>
                          <span className="text-right break-words font-bold text-red-500">
                            ₱{extBalance}
                            <span className="text-[0.7rem] text-red-400 font-normal block">(Cash upon return/pickup)</span>
                          </span>
                        </div>
                      ) : extTotalAmt > 0 ? (
                        <div className={cardRowClass}>
                          <span className={cardLabelClass}>
                            {extBaseMode === 'GCash' ? 'GCash Paid:'
                              : extBaseMode === 'Maya' ? 'Maya Paid:'
                              : 'Cash Paid:'}
                          </span>
                          <span className="text-right break-words font-semibold text-emerald-500">
                            ₱{extPaidAmt}
                          </span>
                        </div>
                      ) : null}

                    </div>
                  )}

                  <div className={cardActionsClass}>

                    <div className="flex gap-2 mb-2 flex-wrap">
                      {booking.government_id_url ? (
                        <button onClick={() => handleProofClick('mga_id_bucket', booking.government_id_url)} className={proofButtonClass}>
                          📸 View Gov ID
                        </button>
                      ) : (
                        <span className={proofEmptyClass}>No ID Uploaded</span>
                      )}

                      {booking.receipt_url ? (
                        <button onClick={() => handleProofClick('resibo', booking.receipt_url)} className={proofButtonClass}>
                          🧾 View Receipt
                        </button>
                      ) : (
                        <span className={proofEmptyClass}>No Receipt</span>
                      )}

                      {isExtended && extBaseMode !== 'Cash' ? (
                        booking.extension_receipt_url ? (
                          <button onClick={() => handleProofClick('resibo_extension', booking.extension_receipt_url)} className={extProofButtonClass}>
                            🧾 Ext. Receipt
                          </button>
                        ) : (
                          <span className={extProofEmptyClass}>No Ext Receipt</span>
                        )
                      ) : null}
                    </div>

                    {currentTab === 'active' && (
                      <div className="flex gap-2 flex-wrap">

                        {(status === 'Pending' || status === 'Pending Verification') && (
                          <button onClick={() => updateBookingStatus(booking.id, 'Approved', booking.motorcycle_name)} className={`${actionButtonBase} bg-emerald-500 text-white hover:bg-emerald-600`}>
                            ✓ Approve
                          </button>
                        )}

                        {hasBalance && (status === 'Approved' || status === 'Picked Up') && (
                          <button onClick={() => handleConfirmBalancePayment(booking)} className={`${actionButtonBase} bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]`}>
                            💰 Confirm Cash Payment (₱{balance})
                          </button>
                        )}

                        {extBalance > 0 && (status === 'Picked Up' || status === 'Approved') && (
                          <button onClick={() => handleConfirmExtPayment(booking, extBalance)} className={`${actionButtonBase} bg-brand-primary text-brand-bg hover:opacity-90 shadow-[0_0_15px_rgba(234,169,116,0.3)]`}>
                            💰 Confirm Ext. Payment (₱{extBalance})
                          </button>
                        )}

                        {status === 'Approved' && !hasBalance && (
                          <button onClick={() => updateBookingStatus(booking.id, 'Picked Up', booking.motorcycle_name)} className={`${actionButtonBase} bg-amber-500 text-white hover:bg-amber-600`}>
                            🏍️ Mark Picked Up
                          </button>
                        )}

                        {/* 🔥 Ipapasa natin yung computed penaltyFee sa function 🔥 */}
                        {status === 'Picked Up' && !hasBalance && extBalance === 0 && (
                          <button onClick={() => handleCompleteTransaction(booking.id, booking.motorcycle_name, penaltyFee)} className={`${actionButtonBase} bg-cyan-500 text-white hover:bg-cyan-600`}>
                            ✅ Complete & Return
                          </button>
                        )}

                        {(status === 'Pending' || status === 'Approved' || status === 'Pending Verification') && (
                          <button onClick={() => updateBookingStatus(booking.id, 'Rejected', booking.motorcycle_name)} className={`${actionButtonBase} bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20`}>
                            ✕ Reject
                          </button>
                        )}

                      </div>
                    )}

                    {currentTab === 'history' && (
                      <div className="flex gap-2 flex-wrap mt-1">

                        <button
                          onClick={() => hideFromHistory(booking.id)}
                          className={`${actionButtonBase} bg-white/5 text-brand-muted border border-white/10 hover:bg-white/10`}
                        >
                          📦 Archive View
                        </button>

                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className={`${actionButtonBase} bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20`}
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

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-xs text-brand-muted font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
      </>
      )}

      {selectedProofImg && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100000] flex justify-center items-center p-5" onClick={() => setSelectedProofImg(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Verification document"
            className="bg-slate-900/95 backdrop-blur-xl border border-blue-500/15 rounded-3xl overflow-hidden w-full max-w-[600px] flex flex-col shadow-[0_0_0_1px_rgba(59,130,246,0.05),0_30px_60px_-15px_rgba(0,0,0,0.85),0_0_60px_-20px_rgba(59,130,246,0.12)] animate-[fadeInEffect_0.25s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-800/80 backdrop-blur-sm">
              <span className="font-display text-slate-50 font-bold text-base">
                <span className="mr-2">📋</span> Verification Document
              </span>
              <button
                onClick={() => setSelectedProofImg(null)}
                className="bg-red-500/10 border border-red-500/30 text-red-500 text-[0.85rem] px-3.5 py-1.5 rounded-lg cursor-pointer font-bold transition-colors hover:bg-red-500/20"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-5 flex justify-center items-center bg-[#050811] min-h-[40vh]">
              <img
                src={selectedProofImg}
                alt="Verification Proof"
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              />
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <ConfirmDialog confirmState={confirmState} onCancel={() => setConfirmState(null)} />

    </div>
  );
}
