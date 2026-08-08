import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const selectClass = "w-full bg-brand-surface/50 border border-white/10 rounded-xl p-3 text-white text-[0.9rem] outline-none focus:border-brand-primary/60 transition-colors";
const numberInputClass = "bg-brand-surface/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-brand-primary/60 transition-colors";

export default function PaymentModal({ isOpen, onClose, bikeData, user, onSuccess, lang }) {
  // Navigation Steps Controller ('details' or 'payment')
  const [activeStep, setActiveStep] = useState('details');

  const [rateType, setRateType] = useState('hrs24');
  const [duration, setDuration] = useState(1);
  const [gateway, setGateway] = useState('GCash');

  // Payment Structure Options ('Full Payment', 'Down Payment (50%)', or 'Custom Reservation Fee')
  const [paymentType, setPaymentType] = useState('Full Payment');
  const [customAmount, setCustomAmount] = useState(150); // Default custom down payment initial value

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Storage bucket file upload state
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActiveStep('details');
      setRateType('hrs24');
      setDuration(1);
      setGateway('GCash');
      setPaymentType('Full Payment');
      setCustomAmount(150);
      setErrorMessage('');
      setSuccessMessage('');
      setIsSubmitting(false);
      setSelectedFile(null);
    }
  }, [isOpen, bikeData]);

  // SAFETY GUARD 1: Pipigilan nito ang pag-crash ng app kung sakaling delay pumasok ang data ng motor
  if (!isOpen) return null;
  if (!bikeData) return null;

  // 💰 PRICING MATRIX HANDLER — reads straight from the motor's own DB record
  // (rate_24hr / rate_12hr / rate_6hr / rate_1hr), set by the admin in Fleet Management.
  const getStaticPriceByRateType = (type) => {
    switch (type) {
      case 'hrs24': return Number(bikeData.rate_24hr) || 0;
      case 'hrs12': return Number(bikeData.rate_12hr) || 0;
      case 'hrs6':  return Number(bikeData.rate_6hr) || 0;
      case 'hr':    return Number(bikeData.rate_1hr) || 0;
      default:      return Number(bikeData.rate_24hr) || 0;
    }
  };

  // SAFETY GUARD 2: Ligtas na Number conversions para walang NaN (Not-a-Number) error
  const unitPrice = Number(getStaticPriceByRateType(rateType)) || 0;
  const safeDuration = Number(duration) || 1;
  const grandTotal = unitPrice * safeDuration;

  // MATHEMATICAL MATRIX LOGIC FOR CUSTOM VALUES
  let amountToPayNow = grandTotal;
  if (gateway !== 'Cash') {
    if (paymentType === 'Down Payment (50%)') {
      amountToPayNow = grandTotal * 0.5;
    } else if (paymentType === 'Custom Reservation Fee') {
      amountToPayNow = Math.min(Number(customAmount) || 0, grandTotal);
    }
  }

  const balanceDueUponPickup = gateway === 'Cash' ? 0 : Math.max(0, grandTotal - amountToPayNow);

  // STORAGE UPLOAD HANDLER ROUTINE (Para sa mga resibo ng GCash/Maya)
  const uploadReceiptToBucket = async (fileObject) => {
    if (!fileObject) return null;
    const fileExtension = fileObject.name.split('.').pop();
    const fileUniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    const { data, error } = await supabase.storage
      .from('resibo')
      .upload(fileUniqueName, fileObject);

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('resibo')
      .getPublicUrl(fileUniqueName);

    return publicUrlData?.publicUrl || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let activeUserId = user?.id;
      if (!activeUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) activeUserId = sessionData.session.user.id;
      }

      if (!activeUserId) {
        throw new Error('Please log in first before renting a motorcycle.');
      }

      // SELF-HEALING GUARD: kung may account (auth) pero walang client profile
      // row (hal. na-interrupt ang signup dati), gawa muna ng minimal profile
      // bago mag-insert ng booking, para hindi ma-block ng foreign key sa checkout.
      const { data: existingClient } = await supabase.from('clients').select('id').eq('id', activeUserId).maybeSingle();
      if (!existingClient) {
        const { data: authUserData } = await supabase.auth.getUser();
        const meta = authUserData?.user?.user_metadata || {};
        await supabase.from('clients').insert([{
          id: activeUserId,
          full_name: meta.full_name || meta.display_name || '',
          username: meta.username || (authUserData?.user?.email || '').split('@')[0] || `user_${activeUserId.slice(0, 8)}`,
          email: authUserData?.user?.email || '',
          created_at: new Date().toISOString()
        }]);
      }

      // Input Security Protection Check Rules
      if (gateway !== 'Cash' && paymentType === 'Custom Reservation Fee' && amountToPayNow <= 0) {
        throw new Error('Desired custom amount must be greater than ₱0.');
      }

      if ((gateway === 'GCash' || gateway === 'Maya') && !selectedFile) {
        throw new Error('Please upload a screenshot of your transaction proof of payment.');
      }

      let finalReceiptUrl = null;
      if (selectedFile) {
        finalReceiptUrl = await uploadReceiptToBucket(selectedFile);
      }

      const uriLabel = rateType === 'hrs24' ? '24 Hours Deal' :
                       rateType === 'hrs12' ? '12 Hours Half-Day' :
                       rateType === 'hrs6'  ? '6 Hours Quick Deal' : 'Per Hour Rate';

      // Swak sa Database Schema (bookings)
      const bookingPayload = {
        client_id: activeUserId,
        payment_method: gateway,
        rental_package: uriLabel,
        rental_units: safeDuration,
        status: 'Pending',
        motorcycle_name: bikeData.name || 'Motorcycle',
        total_amount: grandTotal,
        receipt_url: finalReceiptUrl,
        created_at: new Date().toISOString(),
        payment_type: gateway === 'Cash' ? 'Cash Basis' : paymentType,
        balance_due: balanceDueUponPickup
      };

      const { error } = await supabase.from('bookings').insert([bookingPayload]);
      if (error) throw error;

      setSuccessMessage(lang === 'en' ? 'Thank you! Your booking request has been submitted successfully. Please complete your registration profile by uploading your valid Government ID / License now.' : 'Salamat! Ang iyong booking ay matagumpay na naipadala. Mangyaring kumpletuhin ang iyong veripikasyon sa pamamagitan ng pag-upload ng iyong Gov ID / Lisensya ngayon.');

      setTimeout(() => {
        // SAFETY CHECKER PARA HINDI MAG-BLANK SCREEN!
        if (typeof onSuccess === 'function') {
          onSuccess();
        } else {
          console.warn("Wala o hindi function ang onSuccess prop.");
        }

        if (typeof onClose === 'function') {
          onClose();
        }
      }, 1800);

    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || JSON.stringify(err) || 'An error occurred while processing your database transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(15,23,42,0.85)] backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div className="bg-brand-bg/95 backdrop-blur-xl border-2 border-brand-primary/40 rounded-3xl w-full max-w-[460px] p-7 sm:p-8 relative box-border shadow-[0_0_0_1px_rgba(234,169,116,0.04),0_25px_50px_-12px_rgba(0,0,0,0.6),0_0_60px_-15px_rgba(234,169,116,0.15)] max-h-[90vh] overflow-y-auto animate-[fadeInEffect_0.25s_ease-out]">

        <button onClick={onClose} className="absolute top-5 right-5 bg-none border-none text-brand-muted text-2xl cursor-pointer hover:text-white transition-colors">✕</button>

        <h3 className="font-display m-0 mb-1 text-2xl text-white font-bold"> Secure Rental Checkout </h3>
        <p className="m-0 mb-6 text-brand-muted text-sm">
          Unit Selected: <span className="text-brand-primary font-bold">{bikeData.name}</span>
        </p>

        <div className="flex gap-2 mb-6">
          <div className="flex-1 h-1 rounded-full bg-brand-primary"></div>
          <div className={`flex-1 h-1 rounded-full ${activeStep === 'payment' ? 'bg-brand-primary' : 'bg-white/10'}`}></div>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-2.5 rounded-lg text-[0.8rem] mb-4 break-words">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-2.5 rounded-lg text-[0.8rem] mb-4 break-words">
            {successMessage}
          </div>
        )}

        {activeStep === 'details' ? (
          <div className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] text-slate-300 font-semibold">Select Rate Option:</label>
              <select value={rateType} onChange={(e) => setRateType(e.target.value)} className={selectClass}>
                <option value="hrs24">24 Hours Deal (₱{getStaticPriceByRateType('hrs24')})</option>
                <option value="hrs12">12 Hours Half-Day (₱{getStaticPriceByRateType('hrs12')})</option>
                <option value="hrs6">6 Hours Quick Deal (₱{getStaticPriceByRateType('hrs6')})</option>
                <option value="hr">Per Hour Rate (₱{getStaticPriceByRateType('hr')})</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] text-slate-300 font-semibold">Duration multiplier: <span className="text-brand-primary">{duration}x</span></label>
              <input
                type="number"
                min="1"
                max="30"
                value={duration === 0 ? '' : duration}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') setDuration(0);
                  else setDuration(Math.max(0, parseInt(val) || 0));
                }}
                className={numberInputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] text-slate-300 font-semibold">Payment Channel Method:</label>
              <select value={gateway} onChange={(e) => setGateway(e.target.value)} className={selectClass}>
                <option value="GCash">GCash Instant Transfer</option>
                <option value="Maya">Maya Wallet Gateway</option>
                <option value="Cash">Over the Counter / Cash upon Pickup</option>
              </select>
            </div>

            {gateway !== 'Cash' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] text-slate-300 font-semibold">Payment Option Structure:</label>
                <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={selectClass}>
                  <option value="Full Payment">Pay Full Amount Upfront (100%)</option>
                  <option value="Down Payment (50%)">Secure via Down Payment (50%)</option>
                  <option value="Custom Reservation Fee">Custom Reservation / Down Payment Amount</option>
                </select>
              </div>
            )}

            {gateway !== 'Cash' && paymentType === 'Custom Reservation Fee' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] text-brand-primary font-bold">Your Desired Deposit Amount (₱):</label>
                <input
                  type="number"
                  min="50"
                  max={grandTotal}
                  value={customAmount === 0 ? '' : customAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') setCustomAmount(0);
                    else setCustomAmount(Math.max(0, parseInt(val) || 0));
                  }}
                  className="bg-brand-surface/75 border border-brand-primary rounded-xl p-3 text-white font-bold outline-none"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5 pt-4 border-t border-white/[0.08]">
              <div className="flex justify-between items-center">
                <span className="text-sm text-brand-muted font-semibold">Total Contract Value:</span>
                <span className="text-xl text-white font-bold">₱{grandTotal}</span>
              </div>
              {gateway !== 'Cash' && paymentType !== 'Full Payment' && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-primary font-bold">Initial Deposit Due Now:</span>
                  <span className="text-2xl text-brand-primary font-black">₱{amountToPayNow}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveStep('payment')}
              className="btn-primary py-3.5 text-base"
            >
              Proceed to Payment →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {gateway !== 'Cash' ? (
              <div className="flex flex-col items-center gap-2.5 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <span className="text-[0.85rem] text-brand-primary font-extrabold tracking-wide">
                  SCAN TO PAY VIA {gateway.toUpperCase()}
                </span>

                <div className="w-[180px] h-[180px] bg-white rounded-2xl flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.5)] overflow-hidden">
                  <img
                    src={gateway.toLowerCase() === 'maya' ? '/maya-qr.jpg' : '/gcash-qr.jpg'}
                    alt={`${gateway} QR code`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <p className="mt-1 mb-0 text-[0.78rem] text-brand-muted text-center">
                  Please send exactly <strong className="text-white">₱{amountToPayNow}</strong>.
                </p>

                <div className="flex flex-col gap-1.5 w-full mt-2.5 border-t border-white/[0.08] pt-3">
                  <label className="text-[0.8rem] text-slate-300 font-bold">Attach Proof of Payment (Image File):</label>
                  <input type="file" accept="image/*" required onChange={(e) => setSelectedFile(e.target.files[0] || null)} className="text-slate-300 text-[0.8rem] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-primary file:text-brand-bg file:font-bold file:cursor-pointer" />
                </div>
              </div>
            ) : (
              <div className="bg-brand-primary/5 p-5 rounded-2xl border border-dashed border-brand-primary/30 text-center">
                <span className="text-xl block mb-2">🤝</span>
                <span className="text-sm text-brand-primary font-bold block">Over-the-Counter Cash Mode</span>
                <p className="mt-1.5 mb-0 text-[0.8rem] text-slate-300 leading-normal">
                  No reference upload required. You may finalize your booking right away and clear payment directly at our counter upon unit pickup!
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setActiveStep('details')}
                className="flex-1 bg-transparent border border-white/20 text-white py-3.5 rounded-xl font-bold cursor-pointer hover:bg-white/5 transition-colors"
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-[2] border-none py-3.5 rounded-xl font-bold ${
                  isSubmitting ? 'bg-slate-700 text-brand-muted cursor-not-allowed' : 'btn-primary cursor-pointer'
                }`}
              >
                {isSubmitting ? 'Processing Transaction...' : 'Confirm Book & Dispatch'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
