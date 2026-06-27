import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, lang }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState(''); // Ginamit nating unpified field para sa login
  const [email, setEmail] = useState(''); // Gagamitin lamang kapag nag-sa-Sign Up
  const [username, setUsername] = useState(''); // Bagong state para sa username field
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // --- PROCESS SIGN UP ---
        
        // Proteksyon laban sa may mga spacing o bawal na letra sa username
        const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');

        if (cleanUsername.length < 3) {
          throw new Error(
            lang === 'en' 
              ? 'Username must be at least 3 characters long.' 
              : 'Ang username ay dapat hindi bababa sa 3 karakter.'
          );
        }

        // Tiyakin muna natin na walang katulad ang username na pinili sa database table mo
        const { data: existingUser, error: checkError } = await supabase
          .from('mga_kliyente')
          .select('username')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (checkError) throw checkError;
        if (existingUser) {
          throw new Error(
            lang === 'en'
              ? 'Username is already taken! Please choose another one.'
              : 'May gumagamit na ng username na ito! Pumili ng iba.'
          );
        }

        // 1. I-sign up sa Supabase Auth System kasama ang username sa metadata
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: fullName,
              username: cleanUsername, // Isinasama sa secure metadata para sa Navbar greeting
            },
          },
        });

        if (authError) throw authError;

        if (data?.user) {
          // 2. I-insert ang karagdagang impormasyon sa 'mga_kliyente' table mo
          const { error: profileError } = await supabase
            .from('mga_kliyente')
            .insert([
              {
                id: data.user.id,
                buong_pangalan: fullName,
                email_address: email,
                username: cleanUsername // Pasok sa bagong column na ginawa mo!
              },
            ]);

          if (profileError) {
            console.error("Profile insertion error:", profileError);
            throw new Error(
              lang === 'en'
                ? "Account created, but we couldn't set up your profile table."
                : "Gawa na ang account, ngunit nagka-error sa pag-save sa profile table."
            );
          }

          alert(lang === 'en' 
            ? `Welcome, ${fullName}! Your account has been created successfully.` 
            : `Maligayang pagdating, ${fullName}! Matagumpay na nagawa ang iyong account.`);
          
          onLoginSuccess();
        }
      } else {
        // --- PROCESS LOGIN (EMAIL OR USERNAME) ---
        let targetEmail = emailOrUsername.trim();

        // Kung walang '@', ibig sabihin ay username ang tinype ng kliyente
        if (!targetEmail.includes('@')) {
          const searchUsername = targetEmail.toLowerCase();
          
          // Hahanapin natin ang katapat na email address sa 'mga_kliyente' table
          const { data: profile, error: searchError } = await supabase
            .from('mga_kliyente')
            .select('email_address')
            .eq('username', searchUsername)
            .maybeSingle();

          if (searchError) throw searchError;
          
          if (!profile) {
            throw new Error(
              lang === 'en'
                ? 'Username not found. Please register first.'
                : 'Hindi mahanap ang username. Mag-rehistro muna.'
            );
          }
          
          // Kapag nahanap, ito ang ipapasa natin sa login logic sa ibaba
          targetEmail = profile.email_address;
        }

        // I-authenticate gamit ang nahanap na email (o ang tinype na email) at ang password
        const { error } = await supabase.auth.signInWithPassword({ 
          email: targetEmail, 
          password 
        });
        
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
          {/* LALABAS LANG KAPAG MAGRE-REHISTRO */}
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

          {/* LALABAS LANG KAPAG PILING PUMASOK (LOGIN SCREEN) */}
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