import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, lang }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // 1. SIGN UP sa Supabase Auth System
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: fullName, // Sine-save ang pangalan sa auth metadata
            },
          },
        });

        if (authError) throw authError;

        if (data?.user) {
          // ⚠️ SAFETY TRAP FIX: Kapag naka-ON ang Email Confirmation sa Supabase dashboard,
          // ang user session ay hindi agad magiging "active" (magiging null ang session sa simula).
          // Kung hindi pa kumpirmado, hindi natin magagamit ang RLS (Row Level Security) para mag-insert.
          
          const { error: profileError } = await supabase
            .from('mga_kliyente')
            .insert([
              {
                id: data.user.id,
                buong_pangalan: fullName,
                email_address: email
              },
            ]);

          if (profileError) {
            // Kung nabigo ang pag-insert dahil sa RLS/Email Policy, bibigyan natin ng malinaw na babala ang user
            console.error("Profile insertion error:", profileError);
            throw new Error(
              lang === 'en'
                ? "Account created, but we couldn't set up your profile table. Please check if email confirmation is required."
                : "Gawa na ang account, ngunit nagka-error sa profile table. Paki-check kung kailangan ng email confirmation."
            );
          }

          alert(lang === 'en' 
            ? `Welcome, ${fullName}! Your account has been created and you are now logged in.` 
            : `Maligayang pagdating, ${fullName}! Gawa na ang iyong account at ikaw ay naka-login na.`);
          
          onLoginSuccess(); // Isasara ang modal at ire-refresh ang login state sa App.jsx
        }
      } else {
        // PROCESS REGULAR LOGIN
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess();
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <div className="auth-header">
          <button 
            type="button" 
            className={!isSignUp ? "active-tab" : ""} 
            onClick={() => setIsSignUp(false)}
          >
            {lang === 'en' ? 'Login' : 'Pumasok'}
          </button>
          <button 
            type="button" 
            className={isSignUp ? "active-tab" : ""} 
            onClick={() => setIsSignUp(true)}
          >
            {lang === 'en' ? 'Sign Up' : 'Mag-rehistro'}
          </button>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <input 
              type="text" 
              placeholder={lang === 'en' ? 'Full Name' : 'Buong Pangalan'} 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required 
            />
          )}

          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />

          <input 
            type="password" 
            placeholder={lang === 'en' ? 'Password' : 'Password'} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading 
              ? '...' 
              : isSignUp 
                ? (lang === 'en' ? 'Register & Login' : 'Mag-rehistro at Pumasok') 
                : (lang === 'en' ? 'Login' : 'Pumasok')}
          </button>
        </form>
      </div>
    </div>
  );
}