import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import mainWebsiteBg from '../assets/BG.jpg';
import MotorcycleDetailModal from './MotorcycleDetailModal';
import LoadingSpinner from './LoadingSpinner';

// The catalogue uses the original studio photos on their white background —
// the background-removed cutouts are kept for the homepage hero only.
import nmaxImg from '../assets/Bikes/nmaxv3.jpg';
import aeroxImg from '../assets/Bikes/aeroxv3.jpg';
import clickImg from '../assets/Bikes/click125.jpg';
import beatImg from '../assets/Bikes/beat.jpg';
import fazzioImg from '../assets/Bikes/fazzio.jpg';
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

// The four rates every unit is priced at. These are real columns on the
// motorcycles table — the catalogue used to show only the 24-hour one, which
// hid the thing that actually makes the pricing worth comparing.
const RATE_TIERS = [
  { column: 'rate_1hr', short: '1 hr', full: 'per hour' },
  { column: 'rate_6hr', short: '6 hrs', full: 'for 6 hours' },
  { column: 'rate_12hr', short: '12 hrs', full: 'for 12 hours' },
  { column: 'rate_24hr', short: '24 hrs', full: 'for 24 hours' }
];

// "Yamaha NMAX V3" -> marque on its own line above the model, the way the
// reference separates the two.
function splitName(name) {
  const parts = String(name || '').trim().split(' ');
  if (parts.length < 2) return { brand: '', model: name || '' };
  return { brand: parts[0], model: parts.slice(1).join(' ') };
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function BikeGlyph() {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5.5" cy="17" r="3.5" />
      <circle cx="18.5" cy="17" r="3.5" />
      <path d="M5.5 17h5l4-8h-3M14 5h3l1.5 12" />
    </svg>
  );
}

export default function Bikes({ onRentClick, activeRentals = [] }) {
  const [motors, setMotors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailMotor, setDetailMotor] = useState(null);
  const [originRect, setOriginRect] = useState(null);
  const [ratings, setRatings] = useState({});
  const [tierIndex, setTierIndex] = useState(3); // defaults to the 24-hour rate

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const [{ data: motorData, error }, { data: reviewData }] = await Promise.all([
          supabase.from('motorcycles').select('*').order('display_order', { ascending: true }),
          supabase.from('reviews').select('motorcycle_name, rating')
        ]);

        if (error) throw error;
        setMotors(motorData || []);

        // Average score per unit, from reviews customers left after a completed
        // rental. Units nobody has reviewed simply don't show a score.
        if (reviewData) {
          const acc = {};
          reviewData.forEach((r) => {
            const key = (r.motorcycle_name || '').toLowerCase().trim();
            if (!key || !r.rating) return;
            if (!acc[key]) acc[key] = { total: 0, count: 0 };
            acc[key].total += Number(r.rating);
            acc[key].count += 1;
          });
          const summary = {};
          Object.entries(acc).forEach(([key, { total, count }]) => {
            summary[key] = { average: (total / count).toFixed(1), count };
          });
          setRatings(summary);
        }
      } catch (err) {
        console.error('Error fetching fleet catalog:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCatalog();
  }, []);

  // Remember where the card's photo sat so the detail view can grow out of it.
  const openDetail = (motor, event) => {
    const card = event.currentTarget.closest('article');
    const img = card?.querySelector('img');
    setOriginRect(img ? img.getBoundingClientRect() : null);
    setDetailMotor(motor);
  };

  const closeDetail = () => {
    setDetailMotor(null);
    setOriginRect(null);
  };

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
      // Whitelist ng aktibong status, hindi blacklist ng tapos na — para
      // hindi awtomatikong mag-lock ang bike sa hindi kilala/lumang status
      // values (hal. "Archived" mula sa lumang data) na hindi pa naisip.
      const isOngoing = ['pending', 'pending verification', 'approved', 'picked up', 'active', 'rented'].includes(rentalStatus);
      const isLockedStatus = ['picked up', 'approved', 'active', 'rented'].includes(rentalStatus);
      const dapatIlock = isOngoing && (mayResiboNa || isLockedStatus);

      return isSameBike && dapatIlock;
    });

    return isManuallyMarkedRented || hasActiveBookingLock;
  };

  const tier = RATE_TIERS[tierIndex];
  const availableCount = motors.filter((m) => !computeIsRented(m)).length;

  return (
    <section
      id="bikes"
      className="w-full min-h-screen flex flex-col items-center bg-brand-bg bg-cover bg-center bg-no-repeat box-border relative px-4 sm:px-8 pt-[120px] pb-16 animate-[fadeInEffect_0.5s_ease-out_forwards]"
      style={{ backgroundImage: `url(${mainWebsiteBg})` }}
    >
      {/* Navy scrim — the background artwork is far too bright to sit cards on */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(10,15,28,0.88) 0%, rgba(10,15,28,0.94) 60%, rgba(10,15,28,0.97) 100%)' }}
      />
      <div className="absolute top-[12%] right-[8%] w-[420px] h-[420px] rounded-full bg-brand-primary/[0.07] blur-[130px] pointer-events-none" />

      <div className="relative w-full max-w-[1240px] z-20">

        {/* ══ Header ══ */}
        <div className="mb-8">
          <span className="flex items-center gap-3 mb-4">
            <span className="w-9 h-px bg-brand-primary" aria-hidden="true" />
            <span className="eyebrow">The Full Lineup</span>
          </span>
          <h1 className="font-display text-[clamp(2.1rem,4vw,3.1rem)] font-bold text-white leading-[1.05] m-0 mb-3 tracking-[-0.03em]">
            Pick your <span className="text-brand-primary">ride</span>
          </h1>
          <p className="text-brand-muted m-0 text-[0.95rem] leading-relaxed max-w-[520px]">
            Every unit is priced by how long you keep it. Choose your rental length and the
            whole lineup reprices, so you can compare on what you'll actually pay.
          </p>
        </div>

        {/* ══ Rate-tier selector — real radios, styled as a segmented control, so
             keyboard and screen-reader behaviour comes from the platform ══ */}
        <fieldset className="mb-9 border-none p-0 m-0">
          <legend className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-brand-muted mb-3 p-0">
            Show rates for
          </legend>
          <div className="inline-flex flex-wrap gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-1.5">
            {RATE_TIERS.map((t, i) => (
              <label
                key={t.column}
                className={`relative cursor-pointer rounded-xl px-4 sm:px-5 py-2.5 text-[0.82rem] font-bold transition-colors duration-200 select-none ${
                  i === tierIndex
                    ? 'bg-brand-primary text-brand-bg'
                    : 'text-slate-300 hover:bg-white/[0.06]'
                } focus-within:outline-2 focus-within:outline-offset-2`}
              >
                <input
                  type="radio"
                  name="rate-tier"
                  value={t.column}
                  checked={i === tierIndex}
                  onChange={() => setTierIndex(i)}
                  className="absolute opacity-0 w-px h-px"
                />
                {t.short}
              </label>
            ))}
          </div>
        </fieldset>

        {loading ? (
          <div className="py-20"><LoadingSpinner label="Loading fleet catalog" /></div>
        ) : motors.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-white font-display text-lg font-bold m-0 mb-1.5">No units listed yet</p>
            <p className="text-brand-muted text-sm m-0">The fleet catalogue is empty right now. Check back shortly.</p>
          </div>
        ) : (
          <>
            <p className="text-[0.78rem] text-brand-muted mb-5 tabular-nums">
              <span className="text-white font-bold">{availableCount}</span> of{' '}
              <span className="text-white font-bold">{motors.length}</span> units available right now
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full">
              {motors.map((motor) => {
                const displayImg = motor.image_url || getFallbackImage(motor.name);
                const isRented = computeIsRented(motor);
                const price = motor[tier.column];
                const hasPrice = price !== null && price !== undefined && Number(price) > 0;

                // Only specs the admin has actually filled in — an unverified
                // field is left out rather than shown as a placeholder.
                const specs = [motor.engine_size, motor.transmission].filter(Boolean);
                const { brand, model } = splitName(motor.name);
                const score = ratings[(motor.name || '').toLowerCase().trim()];

                return (
                  <article
                    key={motor.id}
                    className={`group relative flex flex-col rounded-3xl border overflow-hidden box-border transition-all duration-300 ease-out ${
                      isRented
                        ? 'bg-white/[0.02] border-white/[0.06]'
                        : 'bg-brand-surface/50 border-white/[0.08] hover:-translate-y-1 hover:border-brand-primary/45 hover:shadow-[0_24px_48px_-16px_rgba(234,169,116,0.2)]'
                    }`}
                  >
                    {/* Unit photo — the studio shot fills the frame on its own
                        white background, as it did before. Absolutely positioned
                        so a photo's proportions can't stretch the frame and knock
                        the titles out of line across a row. */}
                    <div className="relative w-full aspect-[5/4] shrink-0 overflow-hidden bg-white/[0.03]">
                      <div className="absolute inset-0">
                        {displayImg ? (
                          <img
                            src={displayImg}
                            alt={motor.name}
                            loading="lazy"
                            className={`w-full h-full object-cover transition-all duration-500 ease-out ${
                              isRented ? 'grayscale opacity-40' : 'group-hover:scale-[1.04]'
                            }`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-muted/40">
                            <BikeGlyph />
                          </div>
                        )}
                      </div>

                      {isRented && (
                        <span className="absolute top-4 right-4 flex items-center gap-1.5 bg-brand-bg/80 backdrop-blur-sm text-slate-300 border border-white/10 px-2.5 py-1.5 rounded-lg text-[0.68rem] font-bold uppercase tracking-wide">
                          <LockIcon /> Out on rental
                        </span>
                      )}
                    </div>

                    {/* Unit details */}
                    <div className="flex flex-col gap-3.5 px-5 sm:px-6 pb-6 pt-1 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {brand && (
                            <p className="text-brand-muted text-[0.6rem] font-bold uppercase tracking-[0.18em] m-0 mb-0.5">{brand}</p>
                          )}
                          <h2 className="font-display text-lg font-bold text-white m-0 leading-tight">
                            {model}
                          </h2>
                        </div>
                        {score && (
                          <span className="flex items-center gap-1 shrink-0 text-brand-primary pt-1">
                            <StarIcon />
                            <span className="text-white text-[0.78rem] font-bold tabular-nums">{score.average}</span>
                          </span>
                        )}
                      </div>

                      {specs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {specs.map((s) => (
                            <span
                              key={s}
                              className="text-[0.68rem] font-semibold text-slate-300 bg-white/[0.04] border border-white/[0.07] rounded-md px-2 py-1"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* The number that moves with the selector above */}
                      <div className="flex items-baseline gap-2 pt-1.5 mt-auto border-t border-white/[0.07]">
                        {hasPrice ? (
                          <>
                            <span className="font-display text-2xl font-extrabold text-brand-primary tabular-nums pt-3">
                              ₱{Number(price).toLocaleString()}
                            </span>
                            <span className="text-brand-muted text-[0.75rem] font-medium">{tier.full}</span>
                          </>
                        ) : (
                          <span className="text-brand-muted text-[0.78rem] pt-3">
                            No {tier.short} rate set — see all rates in details
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => openDetail(motor, e)}
                          className="shrink-0 px-4 py-3 rounded-xl font-bold text-[0.82rem] bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => { if (!isRented) onRentClick(motor); }}
                          disabled={isRented}
                          className={`flex-1 border-none py-3 rounded-xl font-bold text-[0.82rem] ${
                            isRented
                              ? 'bg-white/[0.04] text-slate-500 cursor-not-allowed'
                              : 'btn-primary cursor-pointer'
                          }`}
                        >
                          {isRented ? 'Unavailable' : 'Rent Now'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      <MotorcycleDetailModal
        motor={detailMotor}
        isOpen={!!detailMotor}
        onClose={closeDetail}
        isRented={detailMotor ? computeIsRented(detailMotor) : false}
        onRentClick={onRentClick}
        resolvedImage={detailMotor ? getFallbackImage(detailMotor.name) : null}
        tier={tier}
        originRect={originRect}
        rating={detailMotor ? ratings[(detailMotor.name || '').toLowerCase().trim()]?.average : null}
        reviewCount={detailMotor ? (ratings[(detailMotor.name || '').toLowerCase().trim()]?.count || 0) : 0}
      />
    </section>
  );
}
