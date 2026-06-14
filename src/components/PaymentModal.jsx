import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

import gcashQr from '../assets/gcash-qr.jpg';
import mayaQr from '../assets/maya-qr.jpg';

export default function PaymentModal({ isOpen, onClose, bikeData, lang, user }) {
  const initialRateType = bikeData?.chosenRateType || 'day';

  const [rentalType, setRentalType] = useState(initialRateType);
  const [duration, setDuration] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bikeData?.chosenRateType) {
      setRentalType(bikeData.chosenRateType);
      setDuration(1);
    }
  }, [bikeData]);

  if (!isOpen || !bikeData) return null;

  const ratesMatrix = bikeData.rates || { day: 600, hrs12: 400, hrs6: 300, hr: 75 };
  const baseRate = ratesMatrix[rentalType] || 0;
  const totalAmount = baseRate * duration;

  const getDisplayLabel = (type) => {
    switch(type) {
      case 'day': return lang === 'en' ? '24 Hours Package' : '24 Oras na Package';
      case 'hrs12': return lang === 'en' ? '12 Hours Package' : '12 Oras na Package';
      case 'hrs6': return lang === 'en' ? '6 Hours Package' : '6 Oras na Package';
      case 'hr': return lang === 'en' ? 'Per Hour Rate' : 'Kada Oras na Rate';
      default: return '';
    }
  };

  const handleConfirmPayment = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      // 🛡️ KAILANGANG MAKUHA ANG TOTOONG USER ID PARA KONTRA SA NOT-NULL CONSTRAINT ERROR
      let activeId = user?.id;

      if (!activeId) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeId = sessionData?.session?.user?.id;
      }

      if (!activeId) {
        alert(lang === 'en' 
          ? "Auth Session Error: Please log out and log back in to refresh your account session." 
          : "Error sa Session: Paki-logout at mag-login muli para ma-refresh ang account mo."
        );
        setLoading(false);
        return;
      }

      // SAFE FALLBACK INJECTION MATRIX:
      // Sinesend natin pareho ang lumang system keys at bagong keys para sigurado ang salo sa database!
      const payload = {
        user_id: activeId,                           // UUID key column
        kliyente_id: activeId,                       // Structural constraint key
        pangalan_ng_motor: bikeData.name, 
        uri_ng_arkila: bikeData.name,                // Mapped sa character column
        tagal_ng_arkila: parseInt(duration),         // Integer column parameters
        kabuuang_bayad: totalAmount,              
        paraan_ng_pagbayad: paymentMethod.toUpperCase(), // Match text
        napiling_rate: rentalType,
        status: 'Pending',                           // Standard state
        status_ng_renta: 'Pending'                   // Fallback metadata state alternative
      };

      const { error } = await supabase
        .from('mga_arkila')
        .insert([payload]);

      if (error) throw error;

      alert(lang === 'en'
        ? `Booking requested successfully! Please check your dashboard.`
        : `Matagumpay na nai-request! Pumunta sa dashboard para tingnan ang status.`
      );
      onClose();
    } catch (error) {
      console.error("Supabase Insert Error Detail:", error);
      alert("Database Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="auth-modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '440px',
          width: '90%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: '2rem 1.5rem',
          boxSizing: 'border-box'
        }}
      >
        <button className="close-btn" onClick={onClose} style={{ zIndex: 10 }}>&times;</button>
        
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '1rem', fontSize: '1.4rem' }}>
            {lang === 'en' ? '🔒 Secure Checkout' : '🔒 Pagbabayad'}
          </h2>

          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '0.8rem', textAlign: 'left' }}>
            <p style={{ margin: '0.2rem 0', fontSize: '1.1rem' }}>
              <strong>{lang === 'en' ? 'Unit:' : 'Motor:'}</strong> <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{bikeData.name}</span>
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.6rem', fontSize: '0.75rem', opacity: 0.8, backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
              <div>📅 24h: ₱{ratesMatrix.day}</div>
              <div>☀️ 12h: ₱{ratesMatrix.hrs12}</div>
              <div>⚡ 6h: ₱{ratesMatrix.hrs6}</div>
              <div>⏱️ 1h: ₱{ratesMatrix.hr}</div>
            </div>
          </div>
        </div>

        <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '4px', marginBottom: '1rem' }} className="modal-scroll-area">
          <form onSubmit={handleConfirmPayment} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-color)', display: 'block', marginBottom: '4px' }}>
                {lang === 'en' ? 'Change Rental Plan (Optional):' : 'Baguhin ang Plan (Kung Gusto):'}
              </label>
              <select value={rentalType} onChange={(e) => { setRentalType(e.target.value); setDuration(1); }} style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}>
                <option value="day">📅 {lang === 'en' ? '24 Hours Package' : '24 Oras na Package'}</option>
                <option value="hrs12">☀️ {lang === 'en' ? '12 Hours Package' : '12 Oras na Package'}</option>
                <option value="hrs6">⚡ {lang === 'en' ? '6 Hours Package' : '6 Oras na Package'}</option>
                <option value="hr">⏱️ {lang === 'en' ? 'Per Hour Rate' : 'Kada Oras'}</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-color)', display: 'block', marginBottom: '4px' }}>
                {lang === 'en' ? 'Quantity / Multiplier:' : 'Dami / Beses Rentahan:'} 
                <span style={{ fontSize: '0.7rem', fontWeight: 'normal', opacity: 0.6, marginLeft: '4px' }}>
                  ({getDisplayLabel(rentalType)})
                </span>
              </label>
              <input 
                type="number" 
                min="1" 
                value={duration} 
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                required 
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-color)', display: 'block', marginBottom: '4px' }}>
                {lang === 'en' ? 'Select Payment Method:' : 'Paraan ng Pagbayad:'}
              </label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}>
                <option value="gcash">💎 GCash (Instant)</option>
                <option value="maya">💸 Maya (Digital)</option>
                <option value="cod">🏪 Cash on Pickup</option>
              </select>
            </div>

            {paymentMethod === 'gcash' && (
              <div style={{ textAlign: 'center', padding: '0.8rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <p style={{ fontSize: '0.8rem', margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#1076f2' }}>
                  {lang === 'en' ? 'Scan to Pay via GCash' : 'I-scan para magbayad gamit ang GCash'}
                </p>
                <img src={gcashQr} alt="GCash QR Code" style={{ width: '150px', height: 'auto', borderRadius: '8px' }} />
              </div>
            )}

            {paymentMethod === 'maya' && (
              <div style={{ textAlign: 'center', padding: '0.8rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <p style={{ fontSize: '0.8rem', margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#00c483' }}>
                  {lang === 'en' ? 'Scan to Pay via Maya' : 'I-scan para magbayad gamit ang Maya'}
                </p>
                <img src={mayaQr} alt="Maya QR Code" style={{ width: '150px', height: 'auto', borderRadius: '8px' }} />
              </div>
            )}
          </form>
        </div>

        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
              {lang === 'en' ? 'Grand Total:' : 'Kabuuang Halaga:'}
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--primary-color)' }}>
              ₱{totalAmount.toLocaleString()}
            </span>
          </div>

          <button onClick={handleConfirmPayment} className="auth-submit-btn" disabled={loading} style={{ marginTop: '0.8rem', width: '100%', padding: '0.8rem' }}>
            {loading ? '...' : (lang === 'en' ? 'Confirm Booking' : 'Kumpirmahin ang Booking')}
          </button>
        </div>

      </div>
    </div>
  );
}