import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, lang }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState(''); 
  const [email, setEmail] = useState(''); 
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');

        if (cleanUsername.length < 3) {
          throw new Error(
            lang === 'en' 
              ? 'Username must be at least 3 characters long.' 
              : 'Ang username ay dapat hindi bababa sa 3 karakter.'
          );
        }

        const { data: existingUser } = await supabase
          .from('mga_kliyente')
          .select('username')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (existingUser) {
          throw new Error(
            lang === 'en'
              ? 'This username is already taken. Please choose another one.'
              : 'Ang username na ito ay nakuha na. Pumili ng iba.'
          );
        }

        const pseudoEmail = `${cleanUsername}@motorent.local`;

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: pseudoEmail,
          password: password,
        });

        if (authError) throw authError;

        if (authData?.user) {
          const { error: profileError } = await supabase
            .from('mga_kliyente')
            .insert([
              {
                id: authData.user.id,
                buong_pangalan: fullName.trim(),
                username: cleanUsername,
                email_address: email.trim(),
                created_at: new Date().toISOString()
              }
            ]);

          if (profileError) throw profileError;

          const { data: profileData } = await supabase
            .from('mga_kliyente')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          alert(lang === 'en' ? '✅ Registration successful!' : '✅ Matagumpay ang iyong pag-rehistro!');
          if (onLoginSuccess) onLoginSuccess(authData.user, profileData);
          onClose();
        }
      } else {
        let finalEmail = emailOrUsername.trim();
        const isEmailInput = finalEmail.includes('@');

        if (!isEmailInput) {
          const { data: clientData, error: clientError } = await supabase
            .from('mga_kliyente')
            .select('username')
            .eq('username', finalEmail.toLowerCase())
            .maybeSingle();

          if (clientError) throw clientError;
          if (!clientData) {
            throw new Error(
              lang === 'en'
                ? 'Username or Email not found.'
                : 'Hindi mahanap ang Username o Email.'
            );
          }
          finalEmail = `${clientData.username}@motorent.local`;
        }

        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: finalEmail,
          password: password,
        });

        if (loginError) throw loginError;

        if (loginData?.user) {
          const { data: profileData, error: profileErr } = await supabase
            .from('mga_kliyente')
            .select('*')
            .eq('id', loginData.user.id)
            .maybeSingle();

          if (profileErr) console.error("Error retrieving custom client row profile:", profileErr);

          if (onLoginSuccess) onLoginSuccess(loginData.user, profileData || null);
          onClose();
        }
      }
    } catch (err) {
      alert(err.message || 'Authentication Error occured.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* 🌟 PINALAKAS NA OVERLAY LAYERING ENGINE */
    <div 
      className="auth-modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999, /* Pinakamataas na layer para laging mapindot kahit saan */
        pointerEvents: 'auto',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="auth-modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 1000000,
          pointerEvents: 'auto' /* Pinipilit ang click tracking ng input fields mo */
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#ffffff' }}>
            {isSignUp 
              ? (lang === 'en' ? 'Create Account' : 'Gumawa ng Account') 
              : (lang === 'en' ? 'Welcome Back' : 'Mag-log In')}
          </h2>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#94a3b8', 
              fontSize: '1.75rem', 
              cursor: 'pointer',
              lineHeight: '1'
            }}
          >&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <>
              <input 
                type="text" 
                placeholder={lang === 'en' ? 'Full Name' : 'Buong Pangalan'} 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required 
              />
              <input 
                type="text" 
                placeholder={lang === 'en' ? 'Username (e.g., anjhon21)' : 'Username (Hal. anjhon21)'} 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </>
          )}

          {!isSignUp && (
            <input 
              type="text" 
              placeholder={lang === 'en' ? 'Email or Username' : 'Email o Username'} 
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required 
            />
          )}

          <input 
            type="password" 
            placeholder={lang === 'en' ? 'Password' : 'Password'} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />

          <button type="submit" className="auth-submit-btn" disabled={loading} style={{ cursor: 'pointer' }}>
            {loading 
              ? '...' 
              : isSignUp 
                ? (lang === 'en' ? 'Register & Login' : 'Mag-rehistro at Pumasok') 
                : (lang === 'en' ? 'Login Securely' : 'Ligtas na Pumasok')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem', color: '#94a3b8' }}>
          {isSignUp 
            ? (lang === 'en' ? 'Already have an account? ' : 'May account ka na ba? ') 
            : (lang === 'en' ? "Don't have an account yet? " : 'Wala ka pa bang account? ')}
          <button 
            type="button" 
            className="auth-toggle-link" 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ 
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              color: '#eaa974',
              fontWeight: '700',
              textDecoration: 'underline',
              padding: '0 4px'
            }}
          >
            {isSignUp ? (lang === 'en' ? 'Login Here' : 'Pumasok Dito') : (lang === 'en' ? 'Register Here' : 'Mag-rehistro Dito')}
          </button>
        </div>
      </div>
    </div>
  );
}