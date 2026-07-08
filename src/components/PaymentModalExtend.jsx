import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const PROMO_RATES = {
  'nmax': { '24': 800, '12': 600, '6': 400, '1': 100 },
  'aerox': { '24': 750, '12': 550, '6': 400, '1': 100 },
  'fazzio': { '24': 650, '12': 450, '6': 300, '1': 75 },
  'click': { '24': 650, '12': 450, '6': 300, '1': 75 },
  'mio': { '24': 600, '12': 400, '6': 275, '1': 70 },
  'beat': { '24': 600, '12': 400, '6': 275, '1': 70 }
};

export default function PaymentModalExtend({ booking, onClose, onSuccess, lang }) {
  const [selectedPackage, setSelectedPackage] = useState('24');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('eWallet');
  const [activeQR, setActiveQR] = useState('gcash'); 
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const getBookingBaseHours = () => {
    const pkg = (booking.uri_ng_arkila || '').toLowerCase();
    if (pkg.includes('per hour') || pkg.includes('hourly')) return 1;
    if (pkg.includes('12')) return 12;
    if (pkg.includes('6')) return 6;
    if (pkg.includes('24') || pkg.includes('1 day') || pkg.includes('magdamagan')) return 24;
    return 24; 
  };

  const baseHours = getBookingBaseHours();

  const bikeName = (booking.pangalan_ng_motor || booking.motor_na_arkila || '').toLowerCase();
  let bikeKey = 'fazzio'; 
  if (bikeName.includes('nmax')) bikeKey = 'nmax';
  else if (bikeName.includes('aerox')) bikeKey = 'aerox';
  else if (bikeName.includes('click')) bikeKey = 'click';
  else if (bikeName.includes('mio')) bikeKey = 'mio';
  else if (bikeName.includes('beat')) bikeKey = 'beat';

  const rates = PROMO_RATES[bikeKey];
  const baseFee = rates[selectedPackage];
  const extensionFee = baseFee * quantity;

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let extensionReceiptUrl = booking.resibo_extension || null; 

      if (paymentMethod === 'eWallet' && file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `extension_${booking.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('resibo_extension')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('resibo_extension')
          .getPublicUrl(fileName);
          
        extensionReceiptUrl = urlData.publicUrl;
      }

      const currentUnits = Number(booking.tagal_ng_arkila) || 1;
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

      const currentExtFee = Number(booking.halaga_ng_extension) || 0;
      const currentExtPaid = Number(booking.bayad_sa_extension) || 0;

      const newTotalExtFee = currentExtFee + extensionFee;
      const newTotalExtPaid = currentExtPaid + paidAmountToSave; 

      const updatePayload = {
        tagal_ng_arkila: newUnits,
        resibo_extension: extensionReceiptUrl, 
        paraan_ng_pagbayad_extension: finalPaymentMethod, 
        halaga_ng_extension: newTotalExtFee,         
        bayad_sa_extension: newTotalExtPaid,         
        is_extended: true,
        oras_ng_pag_extend: new Date().toISOString()
      };

      if (!booking.orihinal_na_tagal) {
        updatePayload.orihinal_na_tagal = currentUnits;
      }

      const { error: updateError } = await supabase
        .from('mga_arkila')
        .update(updatePayload)
        .eq('id', booking.id);

      if (updateError) throw updateError;

      alert(lang === 'en' ? "Extension Successful!" : "Matagumpay na na-extend ang iyong biyahe!");
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalOverlay}>
      <div style={modalContent}>
        <h2 style={{ color: '#eaa974', margin: '0 0 10px 0' }}>{lang === 'en' ? 'Extend Rental' : 'Mag-extend ng Arkila'}</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
          Unit: <strong style={{ color: '#fff' }}>{booking.pangalan_ng_motor || 'Bike'}</strong>
        </p>

        <form onSubmit={handleExtendSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>{lang === 'en' ? 'Promo Package' : 'Promo Package'}</label>
              <select value={selectedPackage} onChange={(e) => setSelectedPackage(e.target.value)} style={inputStyle}>
                <option value="24">24 Hours (1 Day) — ₱{rates['24']}</option>
                <option value="12">12 Hours — ₱{rates['12']}</option>
                <option value="6">6 Hours — ₱{rates['6']}</option>
                <option value="1">1 Hour — ₱{rates['1']}</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{lang === 'en' ? 'Quantity' : 'Dami'}</label>
              <select value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} style={inputStyle}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>x{num}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>{lang === 'en' ? 'Payment Method' : 'Paraan ng Bayad sa Extension'}</label>
            <select value={paymentMethod} onChange={(e) => {
              setPaymentMethod(e.target.value);
              if(e.target.value === 'eWallet') setActiveQR('gcash');
            }} style={inputStyle}>
              <option value="eWallet">eWallet (GCash/Maya)</option>
              <option value="Cash">Cash (Over-the-Counter)</option>
            </select>
          </div>

          {paymentMethod === 'eWallet' && (
            <div style={{ background: '#0f172a', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ ...labelStyle, textAlign: 'center', marginBottom: '10px', color: '#e2e8f0' }}>
                {lang === 'en' ? 'Select eWallet to Scan' : 'Pumili ng eWallet para ma-scan'}
              </label>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button 
                  type="button" 
                  onClick={() => setActiveQR('gcash')}
                  style={{ ...qrBtnStyle, background: activeQR === 'gcash' ? '#007DFE' : '#1e293b' }}
                >
                  GCash
                </button>
                <button 
                  type="button" 
                  onClick={() => setActiveQR('maya')}
                  style={{ ...qrBtnStyle, background: activeQR === 'maya' ? '#1b1b1b' : '#1e293b' }}
                >
                  Maya
                </button>
              </div>

              {activeQR === 'gcash' && (
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <img src="/gcash-qr.jpg" alt="GCash QR" style={{ maxWidth: '200px', borderRadius: '12px' }} />
                </div>
              )}
              {activeQR === 'maya' && (
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <img src="/maya-qr.jpg" alt="Maya QR" style={{ maxWidth: '200px', borderRadius: '12px' }} />
                </div>
              )}

              <div>
                <label style={labelStyle}>{lang === 'en' ? 'Upload Extension Receipt' : 'I-upload ang Resibo ng Extension'}</label>
                <input type="file" accept="image/*" required onChange={(e) => setFile(e.target.files[0])} style={{ color: '#94a3b8', fontSize: '0.8rem', width: '100%' }} />
              </div>
            </div>
          )}

          <div style={priceBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Extension Additional Fee:</span>
              <strong style={{ color: '#eaa974', fontSize: '1.05rem' }}>₱{extensionFee.toLocaleString()}</strong>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: '1.3' }}>
              *Note: This will be added to your current record. Your active contract end-time will automatically adjust forward based on your package and quantity selection.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={cancelBtn}>{lang === 'en' ? 'Cancel' : 'Bumalik'}</button>
            <button type="submit" disabled={loading} style={submitBtn}>
              {loading ? 'Processing...' : (lang === 'en' ? 'Confirm Extension' : 'Kumpirmahin ang Extension')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Styles
const modalOverlay = { position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 8, 16, 0.9)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 };
const modalContent = { backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '420px', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' };
const labelStyle = { color: '#94a3b8', display: 'block', marginBottom: '5px', fontSize: '0.8rem', fontWeight: 'bold' };
const inputStyle = { padding: '12px', background: '#0b1329', color: '#fff', border: '1px solid rgba(234, 169, 116, 0.2)', borderRadius: '8px', width: '100%', outline: 'none', boxSizing: 'border-box' };
const priceBox = { backgroundColor: '#0b1220', padding: '15px', borderRadius: '10px', border: '1px solid rgba(234, 169, 116, 0.15)', color: '#fff', fontSize: '0.9rem' };
const cancelBtn = { flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' };
const submitBtn = { flex: 1, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };
const qrBtnStyle = { flex: 1, padding: '10px', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', border: '1px solid rgba(255,255,255,0.1)' };