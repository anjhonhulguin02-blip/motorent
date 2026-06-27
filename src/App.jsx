import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css'; // Kinabit na para hindi mawala ang css grid layout mo

import Navbar from './components/Navbar';
import Bikes from './components/Bikes';
import About from './components/About';
import Contact from './components/Contact';
import AuthModal from './components/AuthModal';
import PaymentModal from './components/PaymentModal'; // Ang bagong payment view component mo
import Dashboard from './components/Dashboard'; // Ang dashboard tracker component mo
import AdminDashboard from './components/AdminDashboard'; // Ang admin panel controller mo

// CORRECTION: Nilagay ang iyong totoong email para gumana ang is_admin flag dynamic router routing matrix nasaan ka man
const ADMIN_EMAIL = "anjhon.hulguin02@gmail.com"; 

export default function App() {
  // --- 1. GLOBAL APP STATES ---
  const [theme, setTheme] = useState('dark'); // Default premium dark theme
  const [lang, setLang] = useState('en'); // CRITICAL: Ginawang Default English Language
  const [activeTab, setActiveTab] = useState('home'); // Content view selector
  const [isAuthModalOpen, setAuthModalOpen] = useState(false); // Register modal system

  // --- 2. PAYMENT & BIKE SELECTION STATES ---
  const [selectedBike, setSelectedBike] = useState(null);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

  // --- 3. AVAILABILITY ENGINE STATES ---
  const [activeRentals, setActiveRentals] = useState([]); // Tagatago ng mga motor na 'Rented' na sa database

  // --- 4. SUPABASE ACTIVE USER TRACKER ---
  const [user, setUser] = useState(null);

  // --- INTERCEPTOR LOGIC: Tinitingnan kung ang naka-login ay ang Owner/Admin ---
  const isAdmin = user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // --- 5. THEME TOGGLE CONTROLLER ---
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // --- 6. LANGUAGE SWAP CONTROLLER ---
  const toggleLang = () => {
    setLang((prevLang) => (prevLang === 'en' ? 'tl' : 'en'));
  };

  // --- 7. REAL-TIME ENGINE: KUNIN ANG MGA KASALUKUYANG RENTED BIKES ---
  const fetchActiveRentals = async () => {
    try {
      const { data, error } = await supabase
        .from('mga_arkila') // Tumutugma sa iyong database table
        .select('pangalan_ng_motor, status_ng_renta')
        // Kukunin LANG ang mga active at aprubado para mai-lock ang card sa catalog view
        .or('status_ng_renta.eq.Approved,status_ng_renta.eq.Active,status.eq.Approved,status.eq.Active'); 

      if (!error && data) {
        // Ginagawang flat array ng mga pangalan (halimbawa: ['Yamaha Aerox', 'Honda Click'])
        const rentedNames = data.map(item => item.pangalan_ng_motor || item.uri_ng_arkila);
        setActiveRentals(rentedNames);
      }
    } catch (err) {
      console.error("Error loading availability data:", err);
    }
  };

  // --- 8. AUTHENTICATION LISTENER & INITIAL LOAD ---
  useEffect(() => {
    // Siguraduhing nakalapat ang active design variable sa background ng screen mo
    document.documentElement.setAttribute('data-theme', theme);

    // Kuhanin ang kasalukuyang active user cookies sa browser window
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Makikinig sa kahit anong log action (Login, Signup, Logout) ng kustomer
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Kung nag-logout, ibalik sa home view para iwas white-screen bugs sa restricted blocks
      if (!session) setActiveTab('home');
    });

    // I-load ang mga rented na motor sa pag-open ng website
    fetchActiveRentals();

    return () => subscription.unsubscribe();
  }, [theme]);

  // --- 9. VEHICLE RENTAL TRIGGER ---
  const handleRentClick = (motorInfo) => {
    if (!user) {
      alert(lang === 'en' 
        ? `Please login or register first to rent this vehicle!` 
        : `Mangyaring mag-login o mag-rehistro muna para rentahan ang motor!`);
      setAuthModalOpen(true); // Piliting pabalikin sa signup modal kapag walang account
    } else {
      // Kung ligtas at naka-login, bubuksan ang bagong gawang payment form sheet
      setSelectedBike(motorInfo);
      setPaymentModalOpen(true);
    }
  };

  // --- 10. DYNAMIC REFRESH FOR DASHBOARDS ---
  const handlePaymentModalClose = () => {
    setPaymentModalOpen(false);
    fetchActiveRentals();
    
    // FIX: Catch kahit anong spelling ng active tab ang gamit ng Navbar mo para mag-trigger ang state refresh
    const currentTab = activeTab;
    if (['dashboard', 'bookings', 'my-bookings', 'my bookings'].includes(currentTab.toLowerCase())) {
      setActiveTab('home');
      setTimeout(() => setActiveTab(currentTab), 100);
    }
  };

  return (
    <div className={`app-container ${theme}-mode`}>
      
      {/* HEADER SECTION */}
      <Navbar 
        theme={theme} 
        toggleTheme={toggleTheme} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        lang={lang} 
        toggleLang={toggleLang}
        user={user}
        setUser={setUser}
        setAuthModalOpen={setAuthModalOpen}
        isAdmin={isAdmin} // Ipinasa para malaman ng Navbar kung ano ang ipapakitang pangalan sa link
      />

      {/* CORE DISPLAY WINDOW */}
      <main style={{ minHeight: '80vh', paddingBottom: '4rem' }}>
        
        {/* VIEW 1: MAIN HERO DISPLAY */}
        {activeTab === 'home' && (
          <section>
            <div className="hero">
              <h1>
                {lang === 'en' ? 'PREMIUM MOTORCYCLE RENTALS' : 'ABOT-KAYANG RENTA NG MOTOR'}
              </h1>
              <p>
                {lang === 'en' 
                  ? 'Explore Norzagaray Bulacan smoothly. Rent top-tier maintained scooters with instant booking verification.' 
                  : 'Galugarin ang Norzagaray Bulacan nang swabe. Mag-renta ng mga de-kalidad na motor na may mabilisang booking.'}
              </p>
              <button 
                onClick={() => setActiveTab('bikes')} 
                className="btn"
                style={{ border: 'none', cursor: 'pointer' }}
              >
                {lang === 'en' ? '🚀 Book Your Ride Now' : '🚀 Mag-book ng Motor Ngayon'}
              </button>
            </div>
          </section>
        )}

        {/* VIEW 2: BIKE LISTING SYSTEM */}
        {activeTab === 'bikes' && (
          <Bikes onRentClick={handleRentClick} lang={lang} activeRentals={activeRentals} />
        )}

        {/* VIEW 3: CONDITIONAL ROUTING PANEL FOR BOOKINGS / DASHBOARD (FIXED MATRIX) */}
        {['dashboard', 'bookings', 'my-bookings', 'my bookings'].includes(activeTab.toLowerCase()) && user && (
          isAdmin ? (
            /* KUNG ADMIN: Lalabas ang Controller Panel na may "Mark as Completed" button */
            <AdminDashboard onStatusUpdate={fetchActiveRentals} lang={lang} />
          ) : (
            /* KUNG CUSTOMER: Lalabas ang kanyang personal "My Bookings" list view tracker */
            <Dashboard user={user} lang={lang} />
          )
        )}

        {/* VIEW 4: REQUIREMENTS CHECKLIST */}
        {activeTab === 'about' && (
          <About lang={lang} />
        )}

        {/* VIEW 5: MAPS & ADDRESS CONTACT PAGE */}
        {activeTab === 'contact' && (
          <Contact lang={lang} />
        )}

      </main>

      {/* REGISTRATION POPUP CONTAINER */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onLoginSuccess={() => setAuthModalOpen(false)} 
        lang={lang}
      />

      {/* SECURE CHECKOUT PAYMENT SYSTEM CONTAINER */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={handlePaymentModalClose}
        bikeData={selectedBike}
        lang={lang}
        user={user}
      />

      {/* APPLICATION FOOTER BAR */}
      <footer>
        &copy; {new Date().getFullYear()} MOTORENT Norzagaray. All Rights Reserved.
      </footer>

    </div>
  );
}