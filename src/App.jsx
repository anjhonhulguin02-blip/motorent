import React, { useState, useEffect, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Bikes from './components/Bikes';
import Reviews from './components/Reviews';
import About from './components/About';
import Contact from './components/Contact';
import ConsentBanner from './components/ConsentBanner';
import { supabase } from './supabaseClient';

// Code-split the account-gated / modal-only screens — none of these are
// needed for the first paint of the public homepage/catalog, so keeping
// them out of the main bundle shrinks the JS a first-time visitor pays for.
const AuthModal = lazy(() => import('./components/AuthModal'));
const PaymentModal = lazy(() => import('./components/PaymentModal'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  // 🌟 ETO ANG FIX: Idinagdag natin ang 'lang' variable para hindi na mag-crash!
  const [lang, setLang] = useState('en'); 
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

  // Handler kapag pinindot ang Rent Now sa mismong catalog ng motor
  const handleRentClick = (bike) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedBikeForRent(bike);
    setPaymentModalOpen(true);
  };

  // Helper/Wrapper para sa Hero button navigation
  const handleHeroRentNowNavigation = () => {
    setActiveTab('bikes');
    // Awtomatikong mag-scroll up sa catalog section para kitang-kita ng user
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusUpdate = () => {
    // Admin refresh trigger callback placeholder
  };

  return (
    <div className="bg-brand-bg min-h-screen text-white font-sans">

      {/* GLOBAL APPLICATION NAVIGATION HEADER */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onAuthClick={() => setAuthModalOpen(true)}
        isAdmin={isAdmin}
      />

      {/* CORE ROUTER ENGINE MAIN RENDERING NODES */}
      <main className="w-full min-h-[calc(100vh-90px)] box-border">
        
        {/* HOMEPAGE LANDING ARCHITECTURE */}
        {activeTab === 'home' && (
          <Hero 
            setActiveTab={handleHeroRentNowNavigation} 
            lang={lang} 
          />
        )}

        {/* PREMIUM FLEET MOTORCYCLE CATALOG */}
        {activeTab === 'bikes' && (
          <Bikes onRentClick={handleRentClick} lang={lang} activeRentals={activeRentals} />
        )}

        {activeTab === 'reviews' && <Reviews lang={lang} />}

        {activeTab === 'about' && <About lang={lang} />}

        {activeTab === 'contact' && <Contact lang={lang} />}

        {/* USER PROFILE MANAGEMENT PORTAL */}
        {activeTab === 'dashboard' && user && !isAdmin && (
          <Suspense fallback={<ScreenLoadingFallback />}>
            <Dashboard user={user} lang={lang} activeTab={activeTab} />
          </Suspense>
        )}

        {/* PRIVILEGED FLEET COMMAND CORE */}
        {activeTab === 'admin' && user && isAdmin && (
          <Suspense fallback={<ScreenLoadingFallback />}>
            <AdminDashboard onStatusUpdate={handleStatusUpdate} lang={lang} />
          </Suspense>
        )}
      </main>

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
            onClose={() => setPaymentModalOpen(false)}
            bikeData={selectedBikeForRent}
            user={user}
            lang={lang}
            onSuccess={() => {
              setPaymentModalOpen(false);
              setActiveTab('dashboard');
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
    <div className="flex justify-center items-center min-h-[60vh] text-brand-primary font-sans">
      <div className="text-center tracking-wide font-bold text-sm animate-pulse">LOADING...</div>
    </div>
  );
}