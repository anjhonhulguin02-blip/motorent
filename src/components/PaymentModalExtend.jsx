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
  const [extendUnits, setExtendUnits] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('eWallet');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Lookup Promo Rate
  const getPromoRate = () => {
    const bikeName = (booking.pangalan_ng_motor || booking.motor_na_arkila || '').toLowerCase();
    let bikeKey = 'fazzio';
    if (bikeName.includes('nmax')) bikeKey = 'nmax';
    else if (bikeName.includes('aerox')) bikeKey = 'aerox';
    else if (bikeName.includes('fazzio')) bikeKey = 'fazzio';
    else if (bikeName.includes('click')) bikeKey = 'click';
    else if (bikeName.includes('mio')) bikeKey = 'mio';
    else if (bikeName.includes('beat')) bikeKey = 'beat';

    const rates = PROMO_RATES[bikeKey];
    const pkg = (booking.uri_ng_arkila || '').toLowerCase();
    if (pkg.includes('24') || pkg.includes('day')) return rates['24'];
    if (pkg.includes('12')) return rates['12'];
    if (pkg.includes('6')) return rates['6'];
    return rates['1'];
  };

  const extensionFee = getPromoRate() * extendUnits;

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let publicUrl = booking.resibo_url; // Default sa luma kung walang bago

      // 1. Upload New Receipt if eWallet
      if (paymentMethod === 'eWallet' && file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `extension_${booking.id}_${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('mga_resibo_bucket')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('mga_resibo_bucket').getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      }

      // 2. Compute New Database Values
      const newUnits = (booking.tagal_ng_arkila || 1) + parseInt(extendUnits);
      const oldPrice = booking.kabuuang_bayad || booking.kabuuang_halaga || booking.total_price || 0;
      const newTotalPrice = oldPrice + extensionFee;

      const updatePayload = {
        tagal_ng_arkila: newUnits,
        resibo_url: publicUrl,
        paraan_ng_pagbayad: paymentMethod // I-update kung nagbago ng method sa extension
      };

      // I-map sa tamang column name ng presyo mo
      if ('kabuuang_bayad' in booking) updatePayload.kabuuang_bayad = newTotalPrice;
      else if ('kabuuang_halaga' in booking) updatePayload.kabuuang_halaga = newTotalPrice;

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
          {/* Unit Input */}
          <div>
            <label style={labelStyle}>{lang === 'en' ? 'Add Units' : 'Ilang Units Idadagdag?'}</label>
            <input 
              type="number" min="1" required 
              value={extendUnits} onChange={(e) => setExtendUnits(e.target.value)} 
              style={inputStyle} 
            />
          </div>

          {/* Payment Method Toggle */}
          <div>
            <label style={labelStyle}>{lang === 'en' ? 'Payment Method' : 'Paraan ng Bayad'}</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={inputStyle}>
              <option value="eWallet">eWallet (GCash/Maya)</option>
              <option value="Cash">Cash (Over-the-Counter)</option>
            </select>
          </div>

          {/* File Upload for eWallet */}
          {paymentMethod === 'eWallet' && (
            <div>
              <label style={labelStyle}>{lang === 'en' ? 'Upload New Receipt' : 'I-upload ang Bagong Resibo'}</label>
              <input type="file" accept="image/*" required onChange={(e) => setFile(e.target.files[0])} style={{ color: '#94a3b8', fontSize: '0.8rem' }} />
            </div>
          )}

          {/* Pricing Summary */}
          <div style={priceBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Extension Fee:</span>
              <strong style={{ color: '#eaa974' }}>₱{extensionFee.toFixed(2)}</strong>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              *Note: This is an additional charge on top of your initial payment.
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={cancelBtn}>{lang === 'en' ? 'Cancel' : 'Bumalik'}</button>
            <button type="submit" disabled={loading} style={submitBtn}>
              {loading ? 'Processing...' : (lang === 'en' ? 'Confirm Extension' : 'Kumpirmahin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Styles (Matching Admin/Dashboard)
const modalOverlay = { position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 8, 16, 0.9)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 };
const modalContent = { backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '420px' };
const labelStyle = { color: '#94a3b8', display: 'block', marginBottom: '5px', fontSize: '0.8rem', fontWeight: 'bold' };
const inputStyle = { padding: '12px', background: '#0b1329', color: '#fff', border: '1px solid rgba(234, 169, 116, 0.2)', borderRadius: '8px', width: '100%', outline: 'none' };
const priceBox = { backgroundColor: '#0b1220', padding: '15px', borderRadius: '10px', border: '1px solid rgba(234, 169, 116, 0.15)', color: '#fff', fontSize: '0.9rem' };
const cancelBtn = { flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' };
const submitBtn = { flex: 1, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };