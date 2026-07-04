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
  const [isRecoveryMode, setIsRecoveryMode] = useState(false); // BAGONG STATE: Para sa Password Reset Trigger
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

    // Nakikinig na kung PASSWORD_RECOVERY ang event mula sa email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setAuthModalOpen(true); // Awtomatikong bubukas ang login modal ngunit nasa "Create New Password" view na ito
      }
    });

    return () => subscription.unsubscribe();
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
    // Optional hook para sa real-time triggers
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#050811' }}>
      
      {/* GLOBAL TOP NAVIGATION CORE LAYER */}
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

      {/* DYNAMIC WORKSPACE ROUTER NODES */}
      <main className="main-content" style={{ flex: 1, position: 'relative' }}>
        
        {activeTab === 'home' && (
          <Hero onRentNowClick={() => setActiveTab('bikes')} lang="en" />
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
          onClose={() => {
            setAuthModalOpen(false);
            setIsRecoveryMode(false); // Linisin ang recovery state kapag sinara para sa susunod na normal login
          }} 
          onLoginSuccess={() => setAuthModalOpen(false)}
          lang="en" 
          isRecoveryModeInitial={isRecoveryMode} 
        />

        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          bikeData={selectedBikeForRent}
          user={user}
          lang="en"
          onSuccess={() => {
            // Awtomatikong ire-redirect ang user sa Dashboard (My Bookings) kapag pumasok ang payment!
            setActiveTab('dashboard');
          }}
        />
      </div>
    </div>
  );
}