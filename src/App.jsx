import { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Destinations from './components/Destinations';
import Bikes from './components/Bikes';
import Reviews from './components/Reviews';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ConsentBanner from './components/ConsentBanner';
import SEO from './components/SEO';
import LoadingSpinner from './components/LoadingSpinner';
import { supabase } from './supabaseClient';

// Code-split the account-gated / modal-only screens — none of these are
// needed for the first paint of the public homepage/catalog, so keeping
// them out of the main bundle shrinks the JS a first-time visitor pays for.
const AuthModal = lazy(() => import('./components/AuthModal'));
const PaymentModal = lazy(() => import('./components/PaymentModal'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

const SITE_URL = 'https://motorent-xi.vercel.app';

// Scrolls to the top on every route change — React Router doesn't do this
// automatically, and without it a tab switch keeps whatever scroll
// position the previous page was left at.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

// Lets a direct link to /book/:motorName (shared, bookmarked, or a page
// refresh) hydrate the booking modal on its own, instead of only working
// when reached by clicking "Rent Now" inside the app.
function useBookingDeepLink(selectedBikeForRent, onHydrate) {
  const { motorName } = useParams();
  useEffect(() => {
    async function hydrate() {
      if (!motorName) return;
      const decoded = decodeURIComponent(motorName);
      if (selectedBikeForRent?.name === decoded) return;
      const { data } = await supabase.from('motorcycles').select('*').eq('name', decoded).maybeSingle();
      if (data) onHydrate(data);
    }
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motorName]);
}

function BookingRoute({ selectedBikeForRent, onHydrate, onRentClick, activeRentals, lang }) {
  useBookingDeepLink(selectedBikeForRent, onHydrate);
  return <Bikes onRentClick={onRentClick} lang={lang} activeRentals={activeRentals} />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  // Bilingual (EN/TL) copy is written throughout the app, but there's no
  // language switcher yet — the site is English-only for now.
  const lang = 'en';
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBikeForRent, setSelectedBikeForRent] = useState(null);
  const [activeRentals, setActiveRentals] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Tiyakin ang User Authentication State mula sa Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Admin status ay galing na sa database (clients.is_admin), hindi na sa
  // email string lang — ang RLS policies mismo ang tunay na nagbabantay,
  // pero kailangan din nating malaman dito para itago/ipakita ang tamang UI.
  useEffect(() => {
    async function syncAdminFlag() {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data, error } = await supabase
        .from('clients')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) setIsAdmin(!!data.is_admin);
      else setIsAdmin(false);
    }

    syncAdminFlag();
  }, [user]);

  // Sync fleet-wide active bookings — para malaman ng Bikes catalog kung aling
  // motor ang unavailable dahil sa kahit sinong customer's ongoing booking,
  // hindi lang sa booking ng kasalukuyang naka-login na user. Kailangan din
  // ito kahit walang naka-login, para tama ang makita ng bisitang hindi pa
  // naka-log in. Limitado lang sa mga field na kailangan para sa lock check,
  // hindi buong record, para hindi malantad ang personal info ng ibang kliyente.
  useEffect(() => {
    async function fetchFleetActiveBookings() {
      try {
        const { data, error } = await supabase
          .from('booking_activity')
          .select('motorcycle_name, status, has_receipt')
          .not('status', 'in', '(Completed,Rejected,Cancelled)');

        if (!error && data) {
          setActiveRentals(data);
        }
      } catch (err) {
        console.error("Rentals sync failure:", err);
      }
    }

    fetchFleetActiveBookings();
  }, []);

  // Handler kapag pinindot ang Rent Now sa mismong catalog ng motor. Bukas
  // na ito sa lahat, kahit hindi pa naka-login — makikita muna ng bisita
  // ang package, duration, at estimated total bago hingin ang login, sa
  // huling hakbang na lang (Confirm Book & Dispatch) kailangan mag-login.
  const handleRentClick = (bike) => {
    setSelectedBikeForRent(bike);
    setPaymentModalOpen(true);
    navigate(`/book/${encodeURIComponent(bike.name)}`);
  };

  const handleBookingHydrate = (bike) => {
    setSelectedBikeForRent(bike);
    setPaymentModalOpen(true);
  };

  const closeBookingModal = () => {
    setPaymentModalOpen(false);
    navigate('/bikes');
  };

  // Kapag naka-encounter ang guest ng "kailangan mag-login" habang nasa
  // gitna na ng booking wizard, buksan ang AuthModal sa ibabaw lang —
  // hindi natin sinasara ang PaymentModal, kaya hindi nawawala ang mga
  // napili na niya (package, duration, payment method, atbp.).
  const handleRequireLogin = () => {
    setAuthModalOpen(true);
  };

  const handleStatusUpdate = () => {
    // Admin refresh trigger callback placeholder
  };

  return (
    <div className="bg-brand-bg min-h-screen text-white font-sans">
      <ScrollToTop />

      {/* GLOBAL APPLICATION NAVIGATION HEADER */}
      <Navbar
        user={user}
        onAuthClick={() => setAuthModalOpen(true)}
        isAdmin={isAdmin}
      />

      {/* CORE ROUTER ENGINE MAIN RENDERING NODES */}
      <main className="w-full min-h-[calc(100vh-90px)] box-border">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <SEO
                  title="Motorcycle Rentals in Norzagaray, Bulacan"
                  description="MotoRent offers premium, well-maintained motorcycle rentals in Norzagaray, Bulacan. Book by the hour, half-day, or full day — no mileage limit."
                  path="/"
                />
                <Hero lang={lang} />
                <Destinations lang={lang} />
              </>
            }
          />

          <Route
            path="/bikes"
            element={
              <>
                <SEO
                  title="Available Fleet Catalog"
                  description="Browse MotoRent's full motorcycle lineup with real-time availability and transparent hourly, half-day, and full-day rates."
                  path="/bikes"
                />
                <Bikes onRentClick={handleRentClick} lang={lang} activeRentals={activeRentals} />
              </>
            }
          />

          <Route
            path="/book/:motorName"
            element={
              <>
                <SEO title="Book a Motorcycle" description="Reserve your motorcycle rental with MotoRent Bulacan." path={location.pathname} />
                <BookingRoute
                  selectedBikeForRent={selectedBikeForRent}
                  onHydrate={handleBookingHydrate}
                  onRentClick={handleRentClick}
                  activeRentals={activeRentals}
                  lang={lang}
                />
              </>
            }
          />

          <Route
            path="/guidelines"
            element={
              <>
                <SEO
                  title="Rental Guidelines & Policies"
                  description="What you need to rent a motorcycle from MotoRent, and our real deposit, helmet, fuel, late-return, and cancellation policies."
                  path="/guidelines"
                />
                <About lang={lang} />
              </>
            }
          />

          <Route
            path="/reviews"
            element={
              <>
                <SEO
                  title="Customer Reviews"
                  description="See what MotoRent customers say about their motorcycle rental experience in Norzagaray, Bulacan."
                  path="/reviews"
                />
                <Reviews lang={lang} />
              </>
            }
          />

          <Route
            path="/contact"
            element={
              <>
                <SEO
                  title="Contact Us"
                  description="Get in touch with MotoRent Bulacan — phone, email, Facebook, and our hub location in Norzagaray."
                  path="/contact"
                />
                <Contact lang={lang} />
              </>
            }
          />

          {/* USER PROFILE MANAGEMENT PORTAL */}
          <Route
            path="/dashboard"
            element={
              user && !isAdmin ? (
                <Suspense fallback={<ScreenLoadingFallback />}>
                  <SEO title="My Bookings" description="View and manage your MotoRent bookings." path="/dashboard" />
                  <Dashboard user={user} lang={lang} />
                </Suspense>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* PRIVILEGED FLEET COMMAND CORE */}
          <Route
            path="/admin"
            element={
              user && isAdmin ? (
                <Suspense fallback={<ScreenLoadingFallback />}>
                  <AdminDashboard onStatusUpdate={handleStatusUpdate} />
                </Suspense>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer lang={lang} />

      {/* MODALS ENTRY NODES */}
      <div className="relative z-[100000]">
        <Suspense fallback={null}>
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => {
              setAuthModalOpen(false);
              setIsRecoveryMode(false);
            }}
            onLoginSuccess={() => setAuthModalOpen(false)}
            lang={lang}
            isRecoveryModeInitial={isRecoveryMode}
          />

          <PaymentModal
            isOpen={paymentModalOpen}
            onClose={closeBookingModal}
            onRequireLogin={handleRequireLogin}
            bikeData={selectedBikeForRent}
            user={user}
            lang={lang}
            onSuccess={() => {
              setPaymentModalOpen(false);
              navigate('/dashboard');
            }}
          />
        </Suspense>
      </div>

      <ConsentBanner lang={lang} />
    </div>
  );
}

function ScreenLoadingFallback() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <LoadingSpinner label="Loading" size="lg" />
    </div>
  );
}

export { SITE_URL };
