import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Bikes from './components/Bikes';
import Reviews from './components/Reviews';
import About from './components/About';
import Contact from './components/Contact';
import AuthModal from './components/AuthModal';
import PaymentModal from './components/PaymentModal';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './supabaseClient';

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

  // Admin Configuration gamit ang iyong totoong email
  const isAdmin = 
    user?.email === 'anjhon.hulguin02@gmail.com' || 
    user?.email?.startsWith('admin') || 
    user?.email === 'admin@motorent.local';

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
          .from('bookings')
          .select('motorcycle_name, status, receipt_url')
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
          <Dashboard user={user} lang={lang} activeTab={activeTab} />
        )}

        {/* PRIVILEGED FLEET COMMAND CORE */}
        {activeTab === 'admin' && user && isAdmin && (
          <AdminDashboard onStatusUpdate={handleStatusUpdate} lang={lang} />
        )}
      </main>

      {/* MODALS ENTRY NODES */}
      <div className="relative z-[100000]">
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
      </div>
    </div>
  );
}