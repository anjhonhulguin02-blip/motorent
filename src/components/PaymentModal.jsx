import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function PaymentModal({ isOpen, onClose, bikeData, user }) {
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
      setIsSubmitting(false);
      setSelectedFile(null); 
    }
  }, [isOpen, bikeData]);

  // 🌟 SAFETY GUARD 1: Pipigilan nito ang pag-crash ng app kung sakaling delay pumasok ang data ng motor
  if (!isOpen) return null;
  if (!bikeData) return null;

  // PRICING MATRIX HANDLER
  const getStaticPriceByRateType = (type) => {
    if (bikeData.rates) {
      switch (type) {
        case 'hrs24': return bikeData.rates.day || bikeData.rates.hrs24 || 600;
        case 'hrs12': return bikeData.rates.hrs12 || 400;
        case 'hrs3':  return bikeData.rates.hrs3 || 275;
        case 'hr':    return bikeData.rates.hr || 70;
        default:      return bikeData.rates.day || 600;
      }
    }

    const motorName = (bikeData.name || bikeData.pangalan || '').toLowerCase().trim();
    if (motorName.includes('nmax')) {
      switch (type) {
        case 'hrs24': return 800;
        case 'hrs12': return 600;
        case 'hrs3':  return 400;
        case 'hr':    return 100;
        default:      return 800;
      }
    }
    else if (motorName.includes('aerox')) {
      switch (type) {
        case 'hrs24': return 750;
        case 'hrs12': return 550;
        case 'hrs3':  return 400;
        case 'hr':    return 100;
        default:      return 750;
      }
    }
    else if (motorName.includes('fazzio') || motorName.includes('click')) {
      switch (type) {
        case 'hrs24': return 650;
        case 'hrs12': return 450;
        case 'hrs3':  return 300;
        case 'hr':    return 75;
        default:      return 650;
      }
    }
    
    switch (type) {
      case 'hrs24': return bikeData.price || 600;
      case 'hrs12': return 400;
      case 'hrs3':  return 275;
      case 'hr':    return 70;
      default:      return 600;
    }
  };

  // 🌟 SAFETY GUARD 2: Ligtas na Number conversions para walang NaN (Not-a-Number) error
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
    
    // Gagamitin ang 'resibo' bucket na nakalagay sa lumang code mo
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
                       rateType === 'hrs3'  ? '3 Hours Quick Deal' : 'Per Hour Rate';

      // 🌟 ITO ANG TUGMA SA IYONG DATABASE SCHEMA (mga_arkila)
      const bookingPayload = {
        user_id: activeUserId,
        kliyente_id: activeUserId,
        paraan_ng_pagbayad: gateway,
        uri_ng_arkila: uriLabel,
        tagal_ng_arkila: safeDuration,
        status: 'Pending',
        status_ng_renta: 'Pending',
        pangalan_ng_motor: bikeData.name || bikeData.pangalan || 'Motorcycle',
        kabuuang_bayad: grandTotal,
        resibo_url: finalReceiptUrl,
        created_at: new Date().toISOString(),
        payment_type: gateway === 'Cash' ? 'Cash Basis' : paymentType,
        balance_due: balanceDueUponPickup
      };

      const { error } = await supabase.from('mga_arkila').insert([bookingPayload]);
      if (error) throw error;

      alert('Thank you! Your booking request and proof of payment have been submitted successfully.');
      onClose();
    } catch (err) {
      console.error(err);
      // Pinalawak ang error message para mas madaling ma-trace
      setErrorMessage(err.message || JSON.stringify(err) || 'An error occurred while processing your database transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#151c29', border: '2px solid rgba(234, 169, 116, 0.5)', borderRadius: '24px',
        width: '100%', maxWidth: '460px', padding: '2rem 1.75rem', position: 'relative', boxSizing: 'border-box',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(234, 169, 116, 0.1)',
        maxHeight: '90vh',      
        overflowY: 'auto'       
      }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>

        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: '#ffffff', fontWeight: '800' }}> Secure Rental Checkout </h3>
        <p style={{ margin: '0 0 1.5rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
          Unit Selected: <span style={{ color: '#eaa974', fontWeight: '700' }}>{bikeData.name || bikeData.pangalan}</span>
        </p>

        {/* Dynamic Multi-Step Progress Tracker */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: '#eaa974' }}></div>
          <div style={{ flex: 1, height: '4px', borderRadius: '2px', backgroundColor: activeStep === 'payment' ? '#eaa974' : 'rgba(255,255,255,0.1)' }}></div>
        </div>

        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#f87171', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem', wordBreak: 'break-word' }}>
            {errorMessage}
          </div>
        )}

        {/* STEP 1: RENTAL CONFIG DETAILS TAB PANELS */}
        {activeStep === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600' }}>Select Rate Option:</label>
              <select value={rateType} onChange={(e) => setRateType(e.target.value)} style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '12px', color: '#ffffff', fontSize: '0.9rem', outline: 'none' }}>
                <option value="hrs24">24 Hours Deal (₱{getStaticPriceByRateType('hrs24')})</option>
                <option value="hrs12">12 Hours Half-Day (₱{getStaticPriceByRateType('hrs12')})</option>
                <option value="hrs3">3 Hours Quick Deal (₱{getStaticPriceByRateType('hrs3')})</option>
                <option value="hr">Per Hour Rate (₱{getStaticPriceByRateType('hr')})</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600' }}>Duration multiplier: <span style={{ color: '#eaa974' }}>{duration}x</span></label>
              <input 
                type="number" 
                min="1" 
                max="30" 
                value={duration === 0 ? '' : duration} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setDuration(0);
                  } else {
                    setDuration(Math.max(0, parseInt(val) || 0));
                  }
                }} 
                style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '12px', color: '#ffffff', outline: 'none' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600' }}>Payment Channel Method:</label>
              <select value={gateway} onChange={(e) => setGateway(e.target.value)} style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '12px', color: '#ffffff', outline: 'none' }}>
                <option value="GCash">GCash Instant Transfer</option>
                <option value="Maya">Maya Wallet Gateway</option>
                <option value="Cash">Over the Counter / Cash upon Pickup</option>
              </select>
            </div>

            {gateway !== 'Cash' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600' }}>Payment Option Structure:</label>
                <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} style={{ width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '12px', color: '#ffffff', fontSize: '0.9rem', outline: 'none' }}>
                  <option value="Full Payment">Pay Full Amount Upfront (100%)</option>
                  <option value="Down Payment (50%)">Secure via Down Payment (50%)</option>
                  <option value="Custom Reservation Fee">Custom Reservation / Down Payment Amount</option>
                </select>
              </div>
            )}

            {gateway !== 'Cash' && paymentType === 'Custom Reservation Fee' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#eaa974', fontWeight: '700' }}>Your Desired Deposit Amount (₱):</label>
                <input 
                  type="number" 
                  min="50" 
                  max={grandTotal}
                  value={customAmount === 0 ? '' : customAmount} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setCustomAmount(0);
                    } else {
                      setCustomAmount(Math.max(0, parseInt(val) || 0));
                    }
                  }} 
                  style={{ backgroundColor: 'rgba(30, 41, 59, 0.75)', border: '1px solid #eaa974', borderRadius: '12px', padding: '12px', color: '#ffffff', fontWeight: '700', outline: 'none' }} 
                />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Enter how much you want to transfer online right now to secure unit.</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '600' }}>Total Contract Value:</span>
                <span style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: '700' }}>₱{grandTotal}</span>
              </div>
              {gateway !== 'Cash' && paymentType !== 'Full Payment' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: '#eaa974', fontWeight: '700' }}>Initial Deposit Due Now:</span>
                  <span style={{ fontSize: '1.4rem', color: '#eaa974', fontWeight: '900' }}>₱{amountToPayNow}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveStep('payment')}
              style={{ backgroundColor: '#eaa974', color: '#151c29', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer' }}
            >
              Proceed to Payment →
            </button>
          </div>
        )}

        {/* STEP 2: QR GATEWAY SCREEN & TRANSACTION PROOF ATTACH */}
        {activeStep === 'payment' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {gateway !== 'Cash' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.85rem', color: '#eaa974', fontWeight: '800', letterSpacing: '0.5px' }}>
                  SCAN TO PAY VIA {gateway.toUpperCase()}
                </span>
                
                <div style={{ 
                  width: '180px', height: '180px', 
                  backgroundColor: '#ffffff', borderRadius: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={gateway.toLowerCase() === 'maya' ? '/maya-qr.jpg' : '/gcash-qr.jpg'} 
                    alt={`${gateway} QR code`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center' }}>
                  Please send exactly <strong style={{ color: '#ffffff' }}>₱{amountToPayNow}</strong> right now.
                </p>
                
                {paymentType !== 'Full Payment' && (
                  <p style={{ margin: '0', fontSize: '0.75rem', color: '#eaa974', textAlign: 'center', fontWeight: '600' }}>
                    Note: Remaining ₱{balanceDueUponPickup} balance is payable upon pickup.
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '700' }}>Attach Proof of Payment (Image File):</label>
                  <input type="file" accept="image/*" required onChange={(e) => setSelectedFile(e.target.files[0] || null)} style={{ color: '#cbd5e1', fontSize: '0.8rem' }} />
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: 'rgba(234, 169, 116, 0.05)', padding: '20px', borderRadius: '16px', border: '1px dashed rgba(234, 169, 116, 0.3)', textAlign: 'center' }}>
                <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '8px' }}>🤝</span>
                <span style={{ fontSize: '0.9rem', color: '#eaa974', fontWeight: '700', display: 'block' }}>Over-the-Counter Cash Mode</span>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                  No reference upload required. You may finalize your booking right away and clear payment directly at our counter upon unit pickup!
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '600' }}>Due Right Now:</span>
                <span style={{ fontSize: '1.6rem', color: '#eaa974', fontWeight: '900' }}>₱{amountToPayNow}</span>
              </div>
              {gateway !== 'Cash' && paymentType !== 'Full Payment' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Remaining Balance Due:</span>
                  <span style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: '700' }}>₱{balanceDueUponPickup}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveStep('details')}
                style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                ← Back
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 2, backgroundColor: isSubmitting ? '#334155' : '#eaa974', color: isSubmitting ? '#94a3b8' : '#151c29',
                  border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
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