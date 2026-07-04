import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, lang, isRecoveryModeInitial = false }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isUpdatePassword, setIsUpdatePassword] = useState(false); 
  const [emailOrUsername, setEmailOrUsername] = useState(''); 
  const [email, setEmail] = useState(''); 
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const hash = window.location.hash;
      if (hash.includes('type=recovery') || isRecoveryModeInitial) {
        setIsUpdatePassword(true);
        setIsSignUp(false);
        setIsForgotPassword(false);
      }
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, isRecoveryModeInitial]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isUpdatePassword) {
        if (password !== confirmPassword) {
          throw new Error(lang === 'en' ? 'Passwords do not match. Please double check.' : 'Hindi magkatugma ang password. Mangyaring pakisuri ulit.');
        }

        if (password.length < 6) {
          throw new Error(lang === 'en' ? 'Password must be at least 6 characters long.' : 'Ang password ay dapat hindi bababa sa 6 na karakter.');
        }

        const { error: updateError } = await supabase.auth.updateUser({ password: password.trim() });
        if (updateError) throw updateError;

        alert(lang === 'en' ? '🎉 Password updated successfully!' : '🎉 Matagumpay na nabago ang iyong password!');
        window.history.replaceState(null, null, window.location.pathname);
        setPassword('');
        setConfirmPassword('');
        setIsUpdatePassword(false);
        onClose();

      } else if (isForgotPassword) {
        if (!email.trim()) throw new Error(lang === 'en' ? 'Please enter your email address.' : 'Mangyaring ilagay ang iyong email address.');
        
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}` });
        if (resetError) throw resetError;

        alert(lang === 'en' ? '📬 A password reset link has been sent! Please check your email inbox.' : '📬 Naipadala na ang password reset link! Pakitingnan ang iyong email inbox.');
        setIsForgotPassword(false);

      } else if (isSignUp) {
        const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
        if (cleanUsername.length < 3) throw new Error(lang === 'en' ? 'Username must be at least 3 characters long.' : 'Ang username ay dapat hindi bababa sa 3 karakter.');

        const { data: existingUser } = await supabase.from('mga_kliyente').select('username').eq('username', cleanUsername).maybeSingle();
        if (existingUser) throw new Error(lang === 'en' ? 'This username is already taken. Please choose another one.' : 'Ang username na ito ay nakuha na. Pumili ng iba.');

        const { data: authData, error: authError } = await supabase.auth.signUp({ email: email.trim(), password: password, options: { data: { full_name: fullName.trim(), username: cleanUsername } } });
        if (authError) throw authError;

        if (authData?.user) {
          const { error: profileError } = await supabase.from('mga_kliyente').insert([{ id: authData.user.id, buong_pangalan: fullName.trim(), username: cleanUsername, email_address: email.trim(), created_at: new Date().toISOString() }]);
          if (profileError) throw profileError;
          
          const { data: profileData } = await supabase.from('mga_kliyente').select('*').eq('id', authData.user.id).single();
          alert(lang === 'en' ? '✅ Registration successful!' : '✅ Matagumpay ang iyong pag-rehistro!');
          if (onLoginSuccess) onLoginSuccess(authData.user, profileData);
          onClose();
        }
      } else {
        let finalEmail = emailOrUsername.trim();
        const isEmailInput = finalEmail.includes('@');

        if (!isEmailInput) {
          const { data: clientData, error: clientError } = await supabase.from('mga_kliyente').select('email_address').eq('username', finalEmail.toLowerCase()).maybeSingle();
          if (clientError) throw clientError;
          if (!clientData || !clientData.email_address) throw new Error(lang === 'en' ? 'Username or Email not found.' : 'Hindi mahanap ang Username o Email.');
          finalEmail = clientData.email_address;
        }

        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email: finalEmail, password: password });
        if (loginError) throw loginError;

        if (loginData?.user) {
          const { data: profileData, error: profileErr } = await supabase.from('mga_kliyente').select('*').eq('id', loginData.user.id).maybeSingle();
          if (profileErr) console.error("Error retrieving custom client row profile:", profileErr);
          if (onLoginSuccess) onLoginSuccess(loginData.user, profileData || null);
          onClose();
        }
      }
    } catch (err) {
      alert(err.message || 'Authentication Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#ffffff' }}>
            {isUpdatePassword 
              ? (lang === 'en' ? 'Create New Password' : 'Gumawa ng Bagong Password')
              : isForgotPassword 
                ? (lang === 'en' ? 'Reset Password' : 'I-reset ang Password')
                : isSignUp 
                  ? (lang === 'en' ? 'Create Account' : 'Gumawa ng Account') 
                  : (lang === 'en' ? 'Welcome Back' : 'Mag-log In')}
          </h2>
          {!isUpdatePassword && (
            <button 
              onClick={onClose} 
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.75rem', cursor: 'pointer', lineHeight: '1' }}
            >&times;</button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {isUpdatePassword ? (
            <div style={{ marginBottom: '15px' }}>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: 0, marginBottom: '1rem' }}>
                {lang === 'en' ? 'Type and confirm your secure new password below.' : 'I-type at kumpirmahin ang iyong ligtas na bagong password sa ibaba.'}
              </p>
              
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder={lang === 'en' ? 'Enter New Password' : 'Ilagay ang Bagong Password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-btn" title={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <div className="password-input-wrapper">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder={lang === 'en' ? 'Confirm New Password' : 'Kumpirmahin ang Bagong Password'} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-toggle-btn" title={showConfirmPassword ? "Hide password" : "Show password"}>
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          ) : isForgotPassword ? (
            <input 
              type="email" 
              placeholder={lang === 'en' ? 'Enter your registered email' : 'Ilagay ang iyong nakarehistrong email'} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          ) : isSignUp ? (
            <>
              <input type="text" placeholder={lang === 'en' ? 'Full Name' : 'Buong Pangalan'} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <input type="text" placeholder={lang === 'en' ? 'Username (e.g., anjhon21)' : 'Username (Hal. anjhon21)'} value={username} onChange={(e) => setUsername(e.target.value)} required />
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </>
          ) : (
            <input type="text" placeholder={lang === 'en' ? 'Email or Username' : 'Email o Username'} value={emailOrUsername} onChange={(e) => setEmailOrUsername(e.target.value)} required />
          )}

          {!isForgotPassword && !isUpdatePassword && (
            <>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder={lang === 'en' ? 'Password' : 'Password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-btn" title={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              
              {!isSignUp && (
                <div style={{ textAlign: 'right', marginTop: '-12px', marginBottom: '15px' }}>
                  <button 
                    type="button" 
                    onClick={() => { setIsForgotPassword(true); setIsSignUp(false); }}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  >
                    {lang === 'en' ? 'Forgot Password?' : 'Nakalimutan ang Password?'}
                  </button>
                </div>
              )}
            </>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading 
              ? '...' 
              : isUpdatePassword 
                ? (lang === 'en' ? 'Save New Password' : 'I-save ang Bagong Password')
                : isForgotPassword
                  ? (lang === 'en' ? 'Send Reset Link' : 'Ipadala ang Reset Link')
                  : isSignUp 
                    ? (lang === 'en' ? 'Register & Login' : 'Mag-rehistro at Pumasok') 
                    : (lang === 'en' ? 'Login Securely' : 'Ligtas na Pumasok')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem', color: '#94a3b8' }}>
          {!isUpdatePassword && (
            isForgotPassword ? (
              <button type="button" onClick={() => setIsForgotPassword(false)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#eaa974', fontWeight: '700', textDecoration: 'underline' }}>
                {lang === 'en' ? '← Back to Login' : '← Bumalik sa Log In'}
              </button>
            ) : (
              <>
                {isSignUp ? (lang === 'en' ? 'Already have an account? ' : 'May account ka na ba? ') : (lang === 'en' ? "Don't have an account yet? " : 'Wala ka pa bang account? ')}
                <button type="button" onClick={() => { setIsSignUp(!isSignUp); setIsForgotPassword(false); }} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#eaa974', fontWeight: '700', textDecoration: 'underline', padding: '0 4px' }}>
                  {isSignUp ? (lang === 'en' ? 'Login Here' : 'Pumasok Dito') : (lang === 'en' ? 'Register Here' : 'Mag-rehistro Dito')}
                </button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}