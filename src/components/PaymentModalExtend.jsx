import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import useEscapeToClose from '../hooks/useEscapeToClose';

const labelClass = "text-brand-muted block mb-1.5 text-[0.8rem] font-bold";
const inputClass = "p-3 bg-[#0b1329] text-white border border-brand-primary/20 rounded-lg w-full outline-none box-border focus:border-brand-primary/50 transition-colors";

export default function PaymentModalExtend({ booking, onClose, onSuccess, lang }) {
  useEscapeToClose(true, onClose);

  const [selectedPackage, setSelectedPackage] = useState('24');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('eWallet');
  const [activeQR, setActiveQR] = useState('gcash');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [motors, setMotors] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function fetchMotors() {
      const { data, error } = await supabase.from('motorcycles').select('*');
      if (!error && data) setMotors(data);
    }
    fetchMotors();
  }, []);

  const getBookingBaseHours = () => {
    const pkg = (booking.rental_package || '').toLowerCase();
    if (pkg.includes('per hour') || pkg.includes('hourly')) return 1;
    if (pkg.includes('12')) return 12;
    if (pkg.includes('6')) return 6;
    if (pkg.includes('24') || pkg.includes('1 day') || pkg.includes('magdamagan')) return 24;
    return 24;
  };

  const baseHours = getBookingBaseHours();

  // Find this booking's motor in the live fleet catalog (by name) so the
  // extension is priced with the admin's current rates, not stale hardcoded ones.
  const bookingBikeName = (booking.motorcycle_name || '').toLowerCase().trim();
  const matchedMotor = motors.find(m => (m.name || '').toLowerCase().trim() === bookingBikeName)
    || motors.find(m => bookingBikeName.includes((m.name || '').toLowerCase().trim()));

  const rates = {
    '24': matchedMotor?.rate_24hr || 0,
    '12': matchedMotor?.rate_12hr || 0,
    '6': matchedMotor?.rate_6hr || 0,
    '1': matchedMotor?.rate_1hr || 0
  };
  const baseFee = rates[selectedPackage];
  const extensionFee = baseFee * quantity;

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let extensionReceiptUrl = booking.extension_receipt_url || null;

      if (paymentMethod === 'eWallet' && file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `extension_${booking.id}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('resibo_extension')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Bare storage path lang — private na ang bucket, signed URL na
        // lang ang gagamitin on-demand kapag titingnan ni admin.
        extensionReceiptUrl = fileName;
      }

      const currentUnits = Number(booking.rental_units) || 1;
      const addedUnits = (parseInt(selectedPackage) / baseHours) * quantity;
      const newUnits = currentUnits + addedUnits;

      let finalPaymentMethod = paymentMethod;
      if (paymentMethod === 'eWallet') {
        finalPaymentMethod = activeQR === 'maya' ? 'Maya' : 'GCash';
      } else {
        finalPaymentMethod = 'Cash';
      }

      // 🔥 ITO ANG SIKRETO: Gawing 0 ang ibabayad kung Cash para maging balance ito!
      const paidAmountToSave = (finalPaymentMethod === 'Cash') ? 0 : extensionFee;

      const currentExtFee = Number(booking.extension_amount) || 0;
      const currentExtPaid = Number(booking.extension_paid) || 0;

      const newTotalExtFee = currentExtFee + extensionFee;
      const newTotalExtPaid = currentExtPaid + paidAmountToSave;

      const updatePayload = {
        rental_units: newUnits,
        extension_receipt_url: extensionReceiptUrl,
        extension_payment_method: finalPaymentMethod,
        extension_amount: newTotalExtFee,
        extension_paid: newTotalExtPaid,
        is_extended: true,
        extended_at: new Date().toISOString()
      };

      if (!booking.original_rental_units) {
        updatePayload.original_rental_units = currentUnits;
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', booking.id);

      if (updateError) throw updateError;

      setSuccessMessage(lang === 'en' ? "Extension Successful!" : "Matagumpay na na-extend ang iyong biyahe!");
      setTimeout(() => onSuccess(), 1200);
    } catch (err) {
      console.error(err);
      setErrorMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(5,8,16,0.9)] backdrop-blur-sm flex justify-center items-center z-[10000] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'en' ? 'Extend rental' : 'Mag-extend ng arkila'}
        className="bg-[#111827]/95 backdrop-blur-xl border border-brand-primary/15 rounded-[20px] p-8 w-full max-w-[420px] box-border max-h-[90vh] overflow-y-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] animate-[fadeInEffect_0.25s_ease-out]"
      >
        <h2 className="font-display text-brand-primary m-0 mb-2.5 text-xl font-bold">{lang === 'en' ? 'Extend Rental' : 'Mag-extend ng Arkila'}</h2>
        <p className="text-brand-muted text-[0.85rem] mb-5">
          Unit: <strong className="text-white">{booking.motorcycle_name || 'Bike'}</strong>
        </p>

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

        <form onSubmit={handleExtendSubmit} className="flex flex-col gap-4">

          <div className="flex gap-2.5">
            <div className="flex-[2]">
              <label className={labelClass}>{lang === 'en' ? 'Promo Package' : 'Promo Package'}</label>
              <select value={selectedPackage} onChange={(e) => setSelectedPackage(e.target.value)} className={inputClass}>
                <option value="24">24 Hours (1 Day) — ₱{rates['24']}</option>
                <option value="12">12 Hours — ₱{rates['12']}</option>
                <option value="6">6 Hours — ₱{rates['6']}</option>
                <option value="1">1 Hour — ₱{rates['1']}</option>
              </select>
            </div>

            <div className="flex-1">
              <label className={labelClass}>{lang === 'en' ? 'Quantity' : 'Dami'}</label>
              <select value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} className={inputClass}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>x{num}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{lang === 'en' ? 'Payment Method' : 'Paraan ng Bayad sa Extension'}</label>
            <select value={paymentMethod} onChange={(e) => {
              setPaymentMethod(e.target.value);
              if (e.target.value === 'eWallet') setActiveQR('gcash');
            }} className={inputClass}>
              <option value="eWallet">eWallet (GCash/Maya)</option>
              <option value="Cash">Cash (Over-the-Counter)</option>
            </select>
          </div>

          {paymentMethod === 'eWallet' && (
            <div className="bg-[#0f172a] p-4 rounded-[10px] border border-white/5">
              <label className={`${labelClass} text-center mb-2.5 text-slate-200`}>
                {lang === 'en' ? 'Select eWallet to Scan' : 'Pumili ng eWallet para ma-scan'}
              </label>

              <div className="flex gap-2.5 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveQR('gcash')}
                  className={`flex-1 p-2.5 text-white border border-white/10 rounded-lg font-bold cursor-pointer transition-colors ${activeQR === 'gcash' ? 'bg-[#007DFE]' : 'bg-brand-surface'}`}
                >
                  GCash
                </button>
                <button
                  type="button"
                  onClick={() => setActiveQR('maya')}
                  className={`flex-1 p-2.5 text-white border border-white/10 rounded-lg font-bold cursor-pointer transition-colors ${activeQR === 'maya' ? 'bg-[#1b1b1b]' : 'bg-brand-surface'}`}
                >
                  Maya
                </button>
              </div>

              {activeQR === 'gcash' && (
                <div className="text-center mb-4">
                  <img src="/gcash-qr.jpg" alt="GCash QR" className="max-w-[200px] rounded-xl inline-block" />
                </div>
              )}
              {activeQR === 'maya' && (
                <div className="text-center mb-4">
                  <img src="/maya-qr.jpg" alt="Maya QR" className="max-w-[200px] rounded-xl inline-block" />
                </div>
              )}

              <div>
                <label className={labelClass}>{lang === 'en' ? 'Upload Extension Receipt' : 'I-upload ang Resibo ng Extension'}</label>
                <input type="file" accept="image/*" required onChange={(e) => setFile(e.target.files[0])} className="text-brand-muted text-[0.8rem] w-full file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-primary file:text-brand-bg file:font-bold file:cursor-pointer" />
              </div>
            </div>
          )}

          <div className="bg-brand-bg p-4 rounded-[10px] border border-brand-primary/15 text-white text-sm">
            <div className="flex justify-between mb-1.5">
              <span>Extension Additional Fee:</span>
              <strong className="text-brand-primary text-[1.05rem]">₱{extensionFee.toLocaleString()}</strong>
            </div>
            <div className="text-[0.7rem] text-slate-500 leading-normal">
              *Note: This will be added to your current record. Your active contract end-time will automatically adjust forward based on your package and quantity selection.
            </div>
          </div>

          <div className="flex gap-2.5 mt-2.5">
            <button type="button" onClick={onClose} className="flex-1 p-3 bg-white/5 text-white border-none rounded-lg cursor-pointer transition-colors hover:bg-white/10">{lang === 'en' ? 'Cancel' : 'Bumalik'}</button>
            <button type="submit" disabled={loading} className="flex-1 p-3 bg-emerald-500 text-white border-none rounded-lg font-bold cursor-pointer transition-all duration-200 hover:bg-emerald-600 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0">
              {loading ? 'Processing...' : (lang === 'en' ? 'Confirm Extension' : 'Kumpirmahin ang Extension')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
