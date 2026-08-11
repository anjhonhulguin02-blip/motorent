import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import useEscapeToClose from '../hooks/useEscapeToClose';
import useModalA11y from '../hooks/useModalA11y';

const selectClass = "w-full bg-brand-surface/50 border border-white/10 rounded-xl p-3 text-white text-[0.9rem] outline-none focus:border-brand-primary/60 transition-colors";
const numberInputClass = "bg-brand-surface/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-brand-primary/60 transition-colors";
const stepTitleClass = "font-display text-lg text-white font-bold mb-1";
const stepSubClass = "text-[0.8rem] text-brand-muted mb-5";

const TOTAL_STEPS = 7;

export default function PaymentModal({ isOpen, onClose, bikeData, user, onRequireLogin, onSuccess, lang }) {
  const [currentStep, setCurrentStep] = useState(1);
  // Guest reached the final step and asked to confirm — we opened the
  // login modal on top instead of failing, and once `user` shows up we
  // finish the SAME booking automatically instead of making them redo it.
  const [awaitingLogin, setAwaitingLogin] = useState(false);

  const [rateType, setRateType] = useState('hrs24');
  const [duration, setDuration] = useState(1);
  const [gateway, setGateway] = useState('GCash');

  // Payment Structure Options ('Full Payment', 'Down Payment (30%)', or 'Custom Reservation Fee')
  const [paymentType, setPaymentType] = useState('Full Payment');
  const [customAmount, setCustomAmount] = useState(150); // Default custom down payment initial value

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Storage bucket file upload state
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setRateType('hrs24');
      setDuration(1);
      setGateway('GCash');
      setPaymentType('Full Payment');
      setCustomAmount(150);
      setErrorMessage('');
      setIsSubmitting(false);
      setSelectedFile(null);
    }
  }, [isOpen, bikeData]);

  useEscapeToClose(isOpen && !!bikeData, onClose);
  const dialogRef = useRef(null);
  useModalA11y(isOpen && !!bikeData, dialogRef);

  // Ref lang ito (hindi hook), kaya ligtas na i-update sa ibaba pagkatapos
  // ma-define ang tunay na handleConfirmBooking — pero ang useEffect na
  // gumagamit nito ay kailangang nasa itaas ng anumang conditional return,
  // dahil laging naka-mount ang PaymentModal (toggle lang ang `isOpen`
  // prop), kaya bawal magkaiba ang bilang ng hooks sa bawat render.
  const handleConfirmBookingRef = useRef(() => {});

  useEffect(() => {
    if (awaitingLogin && user?.id) {
      setAwaitingLogin(false);
      handleConfirmBookingRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, awaitingLogin]);

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
    if (paymentType === 'Down Payment (30%)') {
      amountToPayNow = grandTotal * 0.3;
    } else if (paymentType === 'Custom Reservation Fee') {
      amountToPayNow = Math.min(Number(customAmount) || 0, grandTotal);
    }
  }

  const balanceDueUponPickup = gateway === 'Cash' ? 0 : Math.max(0, grandTotal - amountToPayNow);

  const rateLabel = rateType === 'hrs24' ? '24 Hours Deal' :
                     rateType === 'hrs12' ? '12 Hours Half-Day' :
                     rateType === 'hrs6'  ? '6 Hours Quick Deal' : 'Per Hour Rate';

  // STORAGE UPLOAD HANDLER ROUTINE (Para sa mga resibo ng GCash/Maya)
  const uploadReceiptToBucket = async (fileObject) => {
    if (!fileObject) return null;
    const fileExtension = fileObject.name.split('.').pop();
    const fileUniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    const { error } = await supabase.storage
      .from('resibo')
      .upload(fileUniqueName, fileObject);

    if (error) throw error;

    // Bare storage path lang ang itinatago — private na ang bucket na ito,
    // signed URL na lang ang gagawin on-demand kapag titingnan ito ni admin.
    return fileUniqueName;
  };

  const goNext = () => {
    setErrorMessage('');

    if (currentStep === 2 && safeDuration < 1) {
      setErrorMessage('Duration must be at least 1.');
      return;
    }

    if (currentStep === 4 && gateway !== 'Cash' && paymentType === 'Custom Reservation Fee' && amountToPayNow <= 0) {
      setErrorMessage('Desired custom amount must be greater than ₱0.');
      return;
    }

    if (currentStep === 5 && (gateway === 'GCash' || gateway === 'Maya') && !selectedFile) {
      setErrorMessage('Please upload a screenshot of your transaction proof of payment.');
      return;
    }

    if (currentStep === 3) {
      setCurrentStep(gateway === 'Cash' ? 5 : 4);
      return;
    }

    setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const goBack = () => {
    setErrorMessage('');

    if (currentStep === 5) {
      setCurrentStep(gateway === 'Cash' ? 3 : 4);
      return;
    }

    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let activeUserId = user?.id;
      if (!activeUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) activeUserId = sessionData.session.user.id;
      }

      // Guest browsing: don't fail here — open the login modal on top of
      // this one (your selections stay put) and finish automatically once
      // they're signed in, instead of making them start over.
      if (!activeUserId) {
        setAwaitingLogin(true);
        setIsSubmitting(false);
        if (typeof onRequireLogin === 'function') onRequireLogin();
        return;
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

      // Swak sa Database Schema (bookings)
      const bookingPayload = {
        client_id: activeUserId,
        payment_method: gateway,
        rental_package: rateLabel,
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

      setCurrentStep(7);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || JSON.stringify(err) || 'An error occurred while processing your database transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Plain ref assignment lang ito, hindi hook — ligtas itong tumbugin
  // dito sa ibaba ng component body kada render.
  handleConfirmBookingRef.current = handleConfirmBooking;

  const handleDone = () => {
    if (typeof onSuccess === 'function') onSuccess();
    else console.warn("Wala o hindi function ang onSuccess prop.");
    if (typeof onClose === 'function') onClose();
  };

  const stepTitle = {
    1: 'Choose Your Package',
    2: 'Set Duration',
    3: 'Payment Method',
    4: 'Payment Structure',
    5: gateway === 'Cash' ? 'Pickup Payment' : 'Payment Proof',
    6: 'Review & Confirm',
    7: 'Booking Submitted'
  }[currentStep];

  return (
    <div className="fixed inset-0 bg-[rgba(15,23,42,0.85)] backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Secure rental checkout"
        className="bg-brand-bg/95 backdrop-blur-xl border-2 border-brand-primary/40 rounded-3xl w-full max-w-[460px] p-7 sm:p-8 relative box-border shadow-[0_0_0_1px_rgba(234,169,116,0.04),0_25px_50px_-12px_rgba(0,0,0,0.6),0_0_60px_-15px_rgba(234,169,116,0.15)] max-h-[90vh] overflow-y-auto animate-[fadeInEffect_0.25s_ease-out] outline-none"
      >

        <button onClick={onClose} aria-label="Close" className="absolute top-5 right-5 bg-none border-none text-brand-muted text-2xl cursor-pointer hover:text-white transition-colors">✕</button>

        <h3 className="font-display m-0 mb-1 text-2xl text-white font-bold"> Secure Rental Checkout </h3>
        <p className="m-0 mb-5 text-brand-muted text-sm">
          Unit Selected: <span className="text-brand-primary font-bold">{bikeData.name}</span>
        </p>

        <div className="flex gap-1.5 mb-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
            <div key={n} className={`flex-1 h-1 rounded-full transition-colors ${n <= currentStep ? 'bg-brand-primary' : 'bg-white/10'}`}></div>
          ))}
        </div>
        <p className="text-[0.7rem] text-brand-muted font-semibold uppercase tracking-wider mb-5">
          Step {currentStep} of {TOTAL_STEPS} — {stepTitle}
        </p>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-2.5 rounded-lg text-[0.8rem] mb-4 break-words">
            {errorMessage}
          </div>
        )}

        {/* STEP 1 — choose rate package */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h4 className={stepTitleClass}>Choose Your Package</h4>
              <p className={stepSubClass}>Pick the rate option that fits how long you need the unit.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pm-rate-type" className="text-[0.8rem] text-slate-300 font-semibold">Select Rate Option:</label>
              <select id="pm-rate-type" value={rateType} onChange={(e) => setRateType(e.target.value)} className={selectClass}>
                <option value="hrs24">24 Hours Deal (₱{getStaticPriceByRateType('hrs24')})</option>
                <option value="hrs12">12 Hours Half-Day (₱{getStaticPriceByRateType('hrs12')})</option>
                <option value="hrs6">6 Hours Quick Deal (₱{getStaticPriceByRateType('hrs6')})</option>
                <option value="hr">Per Hour Rate (₱{getStaticPriceByRateType('hr')})</option>
              </select>
            </div>
            <button onClick={goNext} className="btn-primary py-3.5 text-base">Next: Set Duration →</button>
          </div>
        )}

        {/* STEP 2 — duration */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h4 className={stepTitleClass}>Set Duration</h4>
              <p className={stepSubClass}>How many units of "{rateLabel}" do you need?</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pm-duration" className="text-[0.8rem] text-slate-300 font-semibold">Duration multiplier: <span className="text-brand-primary">{duration}x</span></label>
              <input
                id="pm-duration"
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
            <div className="flex justify-between items-center pt-3 border-t border-white/[0.08]">
              <span className="text-sm text-brand-muted font-semibold">Running Total:</span>
              <span className="text-xl text-white font-bold">₱{grandTotal}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={goBack} className="flex-1 bg-transparent border border-white/20 text-white py-3.5 rounded-xl font-bold cursor-pointer hover:bg-white/5 transition-colors">← Back</button>
              <button onClick={goNext} className="flex-[2] btn-primary py-3.5 text-base">Next: Payment Method →</button>
            </div>
          </div>
        )}

        {/* STEP 3 — payment method */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h4 className={stepTitleClass}>Payment Method</h4>
              <p className={stepSubClass}>How would you like to pay?</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pm-gateway" className="text-[0.8rem] text-slate-300 font-semibold">Payment Channel Method:</label>
              <select id="pm-gateway" value={gateway} onChange={(e) => setGateway(e.target.value)} className={selectClass}>
                <option value="GCash">GCash Instant Transfer</option>
                <option value="Maya">Maya Wallet Gateway</option>
                <option value="Cash">Over the Counter / Cash upon Pickup</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={goBack} className="flex-1 bg-transparent border border-white/20 text-white py-3.5 rounded-xl font-bold cursor-pointer hover:bg-white/5 transition-colors">← Back</button>
              <button onClick={goNext} className="flex-[2] btn-primary py-3.5 text-base">
                {gateway === 'Cash' ? 'Next: Pickup Info →' : 'Next: Payment Structure →'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — payment structure (skipped entirely for Cash) */}
        {currentStep === 4 && gateway !== 'Cash' && (
          <div className="flex flex-col gap-5">
            <div>
              <h4 className={stepTitleClass}>Payment Structure</h4>
              <p className={stepSubClass}>Pay in full now, or secure the unit with a smaller amount.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pm-payment-type" className="text-[0.8rem] text-slate-300 font-semibold">Payment Option Structure:</label>
              <select id="pm-payment-type" value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={selectClass}>
                <option value="Full Payment">Pay Full Amount Upfront (100%)</option>
                <option value="Down Payment (30%)">Secure via Down Payment (30%)</option>
                <option value="Custom Reservation Fee">Custom Reservation / Down Payment Amount</option>
              </select>
            </div>

            {paymentType === 'Custom Reservation Fee' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pm-custom-amount" className="text-[0.8rem] text-brand-primary font-bold">Your Desired Deposit Amount (₱):</label>
                <input
                  id="pm-custom-amount"
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

            <div className="flex flex-col gap-1.5 pt-3 border-t border-white/[0.08]">
              <div className="flex justify-between items-center">
                <span className="text-sm text-brand-muted font-semibold">Total Rental Cost:</span>
                <span className="text-xl text-white font-bold">₱{grandTotal}</span>
              </div>
              {paymentType !== 'Full Payment' && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-primary font-bold">Initial Deposit Due Now:</span>
                  <span className="text-2xl text-brand-primary font-black">₱{amountToPayNow}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={goBack} className="flex-1 bg-transparent border border-white/20 text-white py-3.5 rounded-xl font-bold cursor-pointer hover:bg-white/5 transition-colors">← Back</button>
              <button onClick={goNext} className="flex-[2] btn-primary py-3.5 text-base">Next: Payment Proof →</button>
            </div>
          </div>
        )}

        {/* STEP 5 — payment proof (eWallet) or pickup info (Cash) */}
        {currentStep === 5 && (
          <div className="flex flex-col gap-5">
            <div>
              <h4 className={stepTitleClass}>{gateway === 'Cash' ? 'Pickup Payment' : 'Payment Proof'}</h4>
              <p className={stepSubClass}>
                {gateway === 'Cash' ? 'No upload required — settle payment at our counter.' : `Scan the QR code and attach your receipt screenshot.`}
              </p>
            </div>

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
                  <label htmlFor="pm-receipt-file" className="text-[0.8rem] text-slate-300 font-bold">Attach Proof of Payment (Image File):</label>
                  <input id="pm-receipt-file" type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0] || null)} className="text-slate-300 text-[0.8rem] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-primary file:text-brand-bg file:font-bold file:cursor-pointer" />
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

            <div className="flex gap-3">
              <button onClick={goBack} className="flex-1 bg-transparent border border-white/20 text-white py-3.5 rounded-xl font-bold cursor-pointer hover:bg-white/5 transition-colors">← Back</button>
              <button onClick={goNext} className="flex-[2] btn-primary py-3.5 text-base">Next: Review →</button>
            </div>
          </div>
        )}

        {/* STEP 6 — review & confirm */}
        {currentStep === 6 && (
          <div className="flex flex-col gap-5">
            <div>
              <h4 className={stepTitleClass}>Review & Confirm</h4>
              <p className={stepSubClass}>Double-check everything before you dispatch this booking.</p>
            </div>

            <div className="flex flex-col gap-2.5 bg-white/[0.02] p-4 rounded-2xl border border-white/5 text-[0.85rem]">
              <div className="flex justify-between"><span className="text-brand-muted">Unit:</span><span className="text-white font-semibold">{bikeData.name}</span></div>
              <div className="flex justify-between"><span className="text-brand-muted">Package:</span><span className="text-white font-semibold">{rateLabel} × {safeDuration}</span></div>
              <div className="flex justify-between"><span className="text-brand-muted">Payment Method:</span><span className="text-white font-semibold">{gateway}</span></div>
              {gateway !== 'Cash' && (
                <div className="flex justify-between"><span className="text-brand-muted">Payment Structure:</span><span className="text-white font-semibold">{paymentType}</span></div>
              )}
              {gateway !== 'Cash' && (
                <div className="flex justify-between"><span className="text-brand-muted">Proof Attached:</span><span className={selectedFile ? "text-emerald-500 font-semibold" : "text-red-400 font-semibold"}>{selectedFile ? selectedFile.name : 'None'}</span></div>
              )}
              <div className="flex justify-between pt-2.5 border-t border-white/[0.08]"><span className="text-brand-muted font-semibold">Total Rental Cost:</span><span className="text-white font-bold text-base">₱{grandTotal}</span></div>
              {gateway !== 'Cash' && paymentType !== 'Full Payment' && (
                <div className="flex justify-between"><span className="text-brand-primary font-bold">Due Now:</span><span className="text-brand-primary font-black text-lg">₱{amountToPayNow}</span></div>
              )}
              {balanceDueUponPickup > 0 && (
                <div className="flex justify-between"><span className="text-amber-400 font-semibold">Balance on Pickup:</span><span className="text-amber-400 font-bold">₱{balanceDueUponPickup}</span></div>
              )}
            </div>

            {!user && (
              <p className="text-[0.78rem] text-brand-primary bg-brand-primary/[0.06] border border-brand-primary/20 rounded-lg px-3 py-2.5 m-0">
                🔒 You'll be asked to log in or create an account to finish this booking — everything above stays exactly as you set it.
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={goBack} disabled={isSubmitting} className="flex-1 bg-transparent border border-white/20 text-white py-3.5 rounded-xl font-bold cursor-pointer hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">← Back</button>
              <button
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
                className={`flex-[2] border-none py-3.5 rounded-xl font-bold ${isSubmitting ? 'bg-slate-700 text-brand-muted cursor-not-allowed' : 'btn-primary cursor-pointer'}`}
              >
                {isSubmitting ? 'Submitting Your Booking...' : user ? 'Confirm Booking' : 'Log In & Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 7 — success */}
        {currentStep === 7 && (
          <div className="flex flex-col gap-5 text-center items-center py-4">
            <span className="text-5xl">✅</span>
            <div>
              <h4 className={`${stepTitleClass} text-center`}>Booking Submitted!</h4>
              <p className="text-[0.85rem] text-brand-muted leading-relaxed">
                {lang === 'en'
                  ? 'Thank you! Your booking request has been submitted successfully. Please complete your registration profile by uploading your valid Government ID / License now.'
                  : 'Salamat! Ang iyong booking ay matagumpay na naipadala. Mangyaring kumpletuhin ang iyong veripikasyon sa pamamagitan ng pag-upload ng iyong Gov ID / Lisensya ngayon.'}
              </p>
            </div>
            <button onClick={handleDone} className="btn-primary py-3.5 text-base w-full">Go to My Bookings</button>
          </div>
        )}

      </div>
    </div>
  );
}
