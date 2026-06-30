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
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
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
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // RE-FETCH INFRASTRUCTURE FOR REAL-TIME RENTAL ASYNC DATA BOUNDS
  const fetchRentals = async () => {
    try {
      const { data, error } = await supabase
        .from('mga_arkila')
        .select('*');

      if (error) throw error;
      if (data) {
        setActiveRentals(data);
      }
    } catch (err) {
      console.error("System error mapping live data bounds from Supabase:", err);
    }
  };

  // Patakbuhin ang fetch ng rentals kapag nag-load ang application
  useEffect(() => {
    fetchRentals();
  }, []);

  // Bridge controller endpoint for internal state tracking refresh signals
  const handleStatusUpdate = () => {
    fetchRentals();
  };

  // Secure checkout deployment guard validation
  const handleRentClick = (bikeObj) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedBikeForRent(bikeObj);
    paymentModalOpenOpenChange(true);
  };

  const paymentModalOpenOpenChange = (isOpenState) => {
    setPaymentModalOpen(isOpenState);
    if (!isOpenState) {
      fetchRentals(); // Awtomatikong mag-re-fetch pagkasara ng payment modal para mag-lock agad ang motor
    }
  };

  return (
    <div 
      className="app-container" 
      style={{ 
        backgroundColor: '#0f172a', 
        minHeight: '100vh',
        display: 'flex',          // 🌟 PINALITAN: Ginawang flex control para kontrolado ang salubong ng layout
        flexDirection: 'column'
      }}
    >
      
      {/* GLOBAL NAVBAR COMPONENT CONTROLLER NODE */}
      {/* 🌟 DAGDAG WRAPPER CSS PARA PILITING MAPINDOT AT LUMUTANG SA PINAKA-TAAS */}
      <div style={{ position: 'relative', zIndex: 99999 }}>
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          user={user} 
          onAuthClick={() => setAuthModalOpen(true)} 
          isAdmin={isAdmin}
          lang="en"
        />
      </div>

      <main className="main-content" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {/* MUTUALLY EXCLUSIVE TABS */}
        {activeTab === 'home' && (
          <Hero setActiveTab={setActiveTab} />
        )}

        {activeTab === 'bikes' && (
          <Bikes onRentClick={handleRentClick} lang="en" activeRentals={activeRentals} />
        )}

        {activeTab === 'reviews' && <Reviews lang="en" />}

        {activeTab === 'about' && <About lang="en" />}

        {activeTab === 'contact' && <Contact lang="en" />}

        {/* USER PROFILE MANAGEMENT PORTAL */}
        {activeTab === 'dashboard' && user && !isAdmin && (
          <Dashboard user={user} lang="en" activeTab={activeTab} />
        )}

        {/* PRIVILEGED FLEET COMMAND CORE */}
        {activeTab === 'admin' && user && isAdmin && (
          <AdminDashboard onStatusUpdate={handleStatusUpdate} lang="en" />
        )}
      </main>

      {/* MODALS ENTRY NODES (Laging nakataas para sa screen prompt overlays) */}
      <div style={{ position: 'relative', zIndex: 100000 }}>
        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)} 
          onLoginSuccess={() => setAuthModalOpen(false)}
          lang="en" 
        />

        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => paymentModalOpenOpenChange(false)}
          bikeData={selectedBikeForRent}
          user={user}
        />
      </div>

    </div>
  );
}