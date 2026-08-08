import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import mainWebsiteBg from '../assets/BG.png';
import MotorcycleDetailModal from './MotorcycleDetailModal';

// 🏍️ Local fallback photos — used only for motors that don't have an
// admin-uploaded image_url yet (the 6 original launch units).
import nmaxImg from '../assets/Bikes/nmaxv3.jpg';
import aeroxImg from '../assets/Bikes/aeroxv3.jpg';
import clickImg from '../assets/Bikes/click125.jpg';
import beatImg from '../assets/Bikes/beat.jpg';
import fazzioImg from '../assets/Bikes/fazzio.png';
import mioImg from '../assets/Bikes/mio i 125.jpg';

function getFallbackImage(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('nmax')) return nmaxImg;
  if (n.includes('aerox')) return aeroxImg;
  if (n.includes('click')) return clickImg;
  if (n.includes('beat')) return beatImg;
  if (n.includes('fazzio')) return fazzioImg;
  if (n.includes('mio')) return mioImg;
  return null;
}

export default function Bikes({ onRentClick, activeRentals = [] }) {
  const [motors, setMotors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailMotor, setDetailMotor] = useState(null);

  useEffect(() => {
    async function fetchMotors() {
      try {
        const { data, error } = await supabase
          .from('motorcycles')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) throw error;
        setMotors(data || []);
      } catch (err) {
        console.error('Error fetching fleet catalog:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMotors();
  }, []);

  const computeIsRented = (motor) => {
    // MAGIGING UNAVAILABLE KAPAG: (1) manually na-mark ng admin as "Rented"
    // sa Fleet Management, O (2) may active booking na naka-lock dito
    const isManuallyMarkedRented = motor.status === 'Rented';

    const hasActiveBookingLock = activeRentals.some(rental => {
      const rentalBikeName = (rental.motorcycle_name || '').toLowerCase().trim();
      const currentBikeName = motor.name.toLowerCase().trim();
      const rentalStatus = (rental.status || '').toLowerCase().trim();

      const mayResiboNa = !!rental.has_receipt;
      const isSameBike = rentalBikeName === currentBikeName;
      const isOngoing = !['completed', 'ended', 'cancelled', 'rejected'].includes(rentalStatus);
      const isLockedStatus = ['picked up', 'approved', 'active', 'rented'].includes(rentalStatus);
      const dapatIlock = isOngoing && (mayResiboNa || isLockedStatus);

      return isSameBike && dapatIlock;
    });

    return isManuallyMarkedRented || hasActiveBookingLock;
  };

  return (
    <section
      id="bikes"
      className="w-full min-h-screen flex flex-col items-center bg-[#0f172a] bg-cover bg-center bg-no-repeat box-border relative p-4 sm:p-8 animate-[fadeInEffect_0.5s_ease-out_forwards]"
      style={{ backgroundImage: `url(${mainWebsiteBg})` }}
    >
      <div className="absolute top-0 left-0 w-full h-[90px] bg-transparent z-10" />

      <div className="glass-panel border-2 max-w-[1280px] w-full p-6 sm:p-14 box-border mt-[120px] mb-16 z-20">

        <div className="text-center mb-12">
          <span className="eyebrow block mb-2">The Full Lineup</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2 text-balance">
            Available <span className="text-brand-primary">Fleet Catalog</span>
          </h2>
          <p className="text-brand-muted text-base m-0">
            Rates and details are shown on every card — tap "Rent Now" when you're ready.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-brand-muted text-sm">⏳ Loading fleet catalog...</div>
        ) : motors.length === 0 ? (
          <div className="text-center py-16 text-brand-muted text-sm">No motorcycles available right now.</div>
        ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6 sm:gap-8 w-full">
          {motors.map((motor) => {
            const displayImg = motor.image_url || getFallbackImage(motor.name);
            const isRented = computeIsRented(motor);

            return (
              <div
                key={motor.id}
                className="group flex flex-col bg-brand-surface/60 border border-white/[0.08] rounded-3xl overflow-hidden box-border shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-brand-primary/50 hover:shadow-[0_25px_50px_-10px_rgba(234,169,116,0.18)]"
              >

                {/* Photo — fixed aspect ratio, always visible */}
                <div className="relative w-full aspect-[4/3] bg-white/[0.03] overflow-hidden shrink-0">
                  {displayImg ? (
                    <img
                      src={displayImg}
                      alt={motor.name}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      style={{
                        filter: isRented ? 'blur(4px) grayscale(100%) opacity(45%)' : 'none',
                        transition: 'filter 0.4s ease'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">🏍️</div>
                  )}

                  {isRented && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-lg text-[0.7rem] font-black uppercase z-[4] shadow-lg">
                      🚫 Rented Out
                    </div>
                  )}
                </div>

                {/* Info — always visible, no hover required */}
                <div className="flex flex-col gap-3 p-5 sm:p-6 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg sm:text-xl font-bold text-white m-0 leading-tight">
                      {motor.name}
                    </h3>
                    <div className="text-right shrink-0">
                      <div className="text-brand-primary font-extrabold text-lg leading-none">₱{motor.rate_24hr}</div>
                      <div className="text-brand-muted text-[0.68rem] font-semibold">/ day</div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed m-0 flex-1">
                    {motor.description}
                  </p>

                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setDetailMotor(motor)}
                      className="shrink-0 px-4 py-3 rounded-xl font-bold text-sm bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => {
                        if (!isRented) onRentClick(motor);
                      }}
                      disabled={isRented}
                      className={`flex-1 border-none py-3 rounded-xl font-bold text-sm uppercase tracking-wide ${
                        isRented
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed transition-none'
                          : 'btn-primary cursor-pointer'
                      }`}
                    >
                      {isRented ? 'Rented Out / Unavailable' : 'Rent Now'}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
        )}

      </div>

      <MotorcycleDetailModal
        motor={detailMotor}
        isOpen={!!detailMotor}
        onClose={() => setDetailMotor(null)}
        isRented={detailMotor ? computeIsRented(detailMotor) : false}
        onRentClick={onRentClick}
        resolvedImage={detailMotor ? getFallbackImage(detailMotor.name) : null}
      />
    </section>
  );
}
