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

  // Kumuha ng Active Rentals para sa Real-time Booking at Blockings
  const fetchActiveRentals = async () => {
    try {
      const { data, error } = await supabase
        .from('mga_arkila')
        .select('*');
      if (!error && data) {
        setActiveRentals(data);
      }
    } catch (err) {
      console.error("Error linking live state database:", err);
    }
  };

  useEffect(() => {
    fetchActiveRentals();
    const interval = setInterval(fetchActiveRentals, 10000); // Auto update kada 10 segundo
    return () => clearInterval(interval);
  }, []);

  const handleRentClick = (bike) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedBikeForRent(bike);
    setPaymentModalOpen(true);
  };

  const handleStatusUpdate = () => {
    fetchActiveRentals();
  };

  // Suriin kung ang Naka-login ay ang Admin account
  const isAdmin = user?.email === 'admin@motorent.com' || user?.email === 'moto@rent.com';

  return (
    <div className="app-wrapper">
      {/* GLOBAL HEADER NAVIGATION */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        lang="en" 
        user={user} 
        setUser={setUser}
        setAuthModalOpen={setAuthModalOpen} 
      />

      {/* CORE DISPLAY ROUTER VIEWPORT */}
      <main className="main-content">
        
        {/* HOME SCREEN: Hero Banner Content mag-isa */}
        {activeTab === 'home' && (
          <Hero setActiveTab={setActiveTab} lang="en" />
        )}

        {/* BIKES TAB: Listahan ng mga motor */}
        {activeTab === 'bikes' && (
          <Bikes onRentClick={handleRentClick} lang="en" activeRentals={activeRentals} />
        )}

        {/* REVIEWS TRANSMISSION LOGS */}
        {activeTab === 'reviews' && <Reviews lang="en" />}

        {/* COMPREHENSIVE ABOUT INFOGRAPHIC WALL */}
        {activeTab === 'about' && <About lang="en" />}

        {/* DIRECT WAZE AND PHYSICAL AREA MAP CHANNELS */}
        {activeTab === 'contact' && <Contact lang="en" />}

        {/* USER PROFILE MANAGEMENT PORTAL */}
        {activeTab === 'dashboard' && user && !isAdmin && (
          <Dashboard user={user} lang="en" />
        )}

        {/* PRIVILEGED FLEET COMMAND CORE */}
        {activeTab === 'admin' && user && isAdmin && (
          <AdminDashboard onStatusUpdate={handleStatusUpdate} lang="en" />
        )}
      </main>

      {/* MODALS ENTRY NODES */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onLoginSuccess={() => setAuthModalOpen(false)}
        lang="en" 
      />

      <PaymentModal 
        isOpen={paymentModalOpen} 
        onClose={() => { setPaymentModalOpen(false); setSelectedBikeForRent(null); }} 
        bikeData={selectedBikeForRent} 
        lang="en" 
        user={user} 
      />

      {/* NON-FLOATING COMPACT STICKY FOOTER */}
      <footer className="global-footer">
        © {new Date().getFullYear()} MOTORENT Hub. Norzagaray, Bulacan. All Rights Reserved.
      </footer>
    </div>
  );
}