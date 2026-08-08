import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const inputClass = "w-full px-4 py-3 bg-black/25 border border-white/10 rounded-xl text-white text-[0.95rem] outline-none mb-4 transition-all duration-200 placeholder:text-slate-500 focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/15";

// Supabase intentionally returns the same generic error for "wrong password"
// and "email not found" (para hindi ma-guess kung anong email ang registered).
// I-translate natin ito sa mas malinaw na mensahe para sa user.
function getFriendlyAuthError(err, lang) {
  const raw = err?.message || '';
  if (raw.toLowerCase().includes('invalid login credentials')) {
    return lang === 'en'
      ? 'Incorrect password, or that email/username isn\'t registered. Please check and try again.'
      : 'Mali ang password, o hindi pa nakarehistro ang email/username na iyon. Pakisuri at subukan ulit.';
  }
  if (raw.toLowerCase().includes('email not confirmed')) {
    return lang === 'en'
      ? 'Please verify your email first before logging in.'
      : 'Pakiverify muna ang iyong email bago mag-log in.';
  }
  return raw || (lang === 'en' ? 'Authentication error occurred.' : 'May naganap na error sa pag-log in.');
}

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
  const [phoneNumber, setPhoneNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, isRecoveryModeInitial]);

  if (!isOpen) return null;

  const formatPhNumber = (num) => {
    let cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('09') && cleaned.length === 11) {
      return '+63' + cleaned.substring(1);
    } else if (cleaned.startsWith('639') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isUpdatePassword) {
        if (password !== confirmPassword) throw new Error(lang === 'en' ? 'Passwords do not match.' : 'Hindi magkatugma ang password.');
        if (password.length < 6) throw new Error(lang === 'en' ? 'Password must be at least 6 characters.' : 'Ang password ay dapat hindi bababa sa 6 na karakter.');

        const { error: updateError } = await supabase.auth.updateUser({ password: password.trim() });
        if (updateError) throw updateError;

        setSuccessMessage(lang === 'en' ? '🎉 Password updated successfully!' : '🎉 Matagumpay na nabago ang iyong password!');
        window.history.replaceState(null, null, window.location.pathname);
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setIsUpdatePassword(false);
          onClose();
        }, 1400);

      } else if (isForgotPassword) {
        if (!email.trim()) throw new Error(lang === 'en' ? 'Please enter your email.' : 'Mangyaring ilagay ang iyong email.');
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}` });
        if (resetError) throw resetError;

        setSuccessMessage(lang === 'en' ? '📬 Reset link sent! Check your email.' : '📬 Naipadala na ang reset link! Pakitingnan ang email.');
        setIsForgotPassword(false);

      } else if (isSignUp) {
        const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
        if (cleanUsername.length < 3) throw new Error(lang === 'en' ? 'Username too short.' : 'Masyadong maikli ang username.');

        const formattedPhone = formatPhNumber(phoneNumber);
        if (!formattedPhone) throw new Error(lang === 'en' ? 'Invalid Philippine Number (e.g. 09123456789)' : 'Mali ang format ng numero. (Hal. 09123456789)');

        const { data: existingUser } = await supabase.from('clients').select('username').eq('username', cleanUsername).maybeSingle();
        if (existingUser) throw new Error(lang === 'en' ? 'Username taken.' : 'Nakuha na ang username na ito.');

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: { data: { full_name: fullName.trim(), username: cleanUsername } }
        });
        if (authError) throw authError;

        if (authData?.user) {
          const { error: profileError } = await supabase.from('clients').insert([{
            id: authData.user.id,
            full_name: fullName.trim(),
            username: cleanUsername,
            email: email.trim(),
            phone_number: formattedPhone,
            created_at: new Date().toISOString()
          }]);

          if (profileError) throw new Error(`Database Error: ${profileError.message}`);

          const { data: profileData } = await supabase.from('clients').select('*').eq('id', authData.user.id).maybeSingle();

          setSuccessMessage(lang === 'en' ? '✅ Registration successful!' : '✅ Matagumpay ang pag-rehistro!');

          setTimeout(() => {
            if (onLoginSuccess) onLoginSuccess(authData.user, profileData);
            onClose();
          }, 1400);
        }

      } else {
        let finalEmail = emailOrUsername.trim();
        const isEmailInput = finalEmail.includes('@');

        if (!isEmailInput) {
          const { data: clientData, error: clientError } = await supabase.from('clients').select('email').eq('username', finalEmail.toLowerCase()).maybeSingle();
          if (clientError) throw clientError;
          if (!clientData || !clientData.email) throw new Error(lang === 'en' ? 'Username or Email not found.' : 'Hindi mahanap ang Username o Email.');
          finalEmail = clientData.email;
        }

        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email: finalEmail, password: password });
        if (loginError) throw loginError;

        if (loginData?.user) {
          const { data: profileData } = await supabase.from('clients').select('*').eq('id', loginData.user.id).maybeSingle();
          if (onLoginSuccess) onLoginSuccess(loginData.user, profileData || null);
          onClose();
        }
      }
    } catch (err) {
      setErrorMessage(getFriendlyAuthError(err, lang));
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );

  // --- MAS MALINIS NA TEXT VARIABLES ---
  let headerText = '';
  if (isUpdatePassword) {
    headerText = lang === 'en' ? 'Create New Password' : 'Gumawa ng Bagong Password';
  } else if (isForgotPassword) {
    headerText = lang === 'en' ? 'Reset Password' : 'I-reset ang Password';
  } else if (isSignUp) {
    headerText = lang === 'en' ? 'Create Account' : 'Gumawa ng Account';
  } else {
    headerText = lang === 'en' ? 'Welcome Back' : 'Mag-log In';
  }

  let buttonText = '';
  if (loading) {
    buttonText = '...';
  } else if (isUpdatePassword) {
    buttonText = lang === 'en' ? 'Save New Password' : 'I-save ang Bagong Password';
  } else if (isForgotPassword) {
    buttonText = lang === 'en' ? 'Send Reset Link' : 'Ipadala ang Reset Link';
  } else if (isSignUp) {
    buttonText = lang === 'en' ? 'Register Account' : 'Mag-rehistro';
  } else {
    buttonText = lang === 'en' ? 'Login Securely' : 'Ligtas na Pumasok';
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 w-screen h-screen bg-[rgba(10,14,22,0.8)] backdrop-blur-lg flex items-center justify-center z-[9999]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-brand-card/95 backdrop-blur-xl border border-brand-primary/15 rounded-3xl p-8 sm:p-10 w-[90%] max-w-[460px] shadow-[0_0_0_1px_rgba(234,169,116,0.04),0_30px_60px_rgba(0,0,0,0.6)] animate-[fadeInEffect_0.25s_ease-out]"
      >

        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display m-0 text-2xl font-bold text-white">
            {headerText}
          </h2>
          {!isUpdatePassword && (
            <button
              onClick={onClose}
              className="bg-transparent border-none text-brand-muted text-3xl cursor-pointer leading-none hover:text-white transition-colors"
            >&times;</button>
          )}
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-2.5 rounded-lg text-[0.8rem] mb-4 break-words">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-2.5 rounded-lg text-[0.8rem] mb-4 break-words">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isUpdatePassword ? (
            <div className="mb-4">
              <div className="relative w-full mb-4">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={lang === 'en' ? 'Enter New Password' : 'Ilagay ang Bagong Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputClass} mb-0 pr-11`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none p-0 m-0 flex items-center justify-center cursor-pointer text-brand-muted outline-none" title={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <div className="relative w-full mb-4">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={lang === 'en' ? 'Confirm New Password' : 'Kumpirmahin ang Bagong Password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`${inputClass} mb-0 pr-11`}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none p-0 m-0 flex items-center justify-center cursor-pointer text-brand-muted outline-none" title={showConfirmPassword ? "Hide password" : "Show password"}>
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
              className={inputClass}
            />
          ) : isSignUp ? (
            <>
              <input type="text" placeholder={lang === 'en' ? 'Full Name' : 'Buong Pangalan'} value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} />
              <input type="text" placeholder={lang === 'en' ? 'Username (e.g., anjhon21)' : 'Username (Hal. anjhon21)'} value={username} onChange={(e) => setUsername(e.target.value)} required className={inputClass} />
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />

              <input
                type="text"
                placeholder={lang === 'en' ? 'Phone Number (09...)' : 'Numero ng Telepono (09...)'}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={13}
                required
                className={inputClass}
              />
            </>
          ) : (
            <input type="text" placeholder={lang === 'en' ? 'Email or Username' : 'Email o Username'} value={emailOrUsername} onChange={(e) => setEmailOrUsername(e.target.value)} required className={inputClass} />
          )}

          {!isForgotPassword && !isUpdatePassword && (
            <>
              <div className="relative w-full mb-4">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={lang === 'en' ? 'Password' : 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputClass} mb-0 pr-11`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none p-0 m-0 flex items-center justify-center cursor-pointer text-brand-muted outline-none" title={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {!isSignUp && (
                <div className="text-right -mt-3 mb-4">
                  <button type="button" onClick={() => { setIsForgotPassword(true); setIsSignUp(false); setErrorMessage(''); }} className="bg-none border-none text-brand-muted text-xs cursor-pointer underline p-0 hover:text-white transition-colors">
                    {lang === 'en' ? 'Forgot Password?' : 'Nakalimutan ang Password?'}
                  </button>
                </div>
              )}
            </>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none">
            {buttonText}
          </button>
        </form>

        <div className="mt-6 text-center text-[0.88rem] text-brand-muted">
          {!isUpdatePassword && (
            isForgotPassword ? (
              <button type="button" onClick={() => { setIsForgotPassword(false); setErrorMessage(''); }} className="cursor-pointer bg-none border-none text-brand-primary font-bold underline">
                {lang === 'en' ? '← Back to Login' : '← Bumalik sa Log In'}
              </button>
            ) : (
              <>
                {isSignUp ? (lang === 'en' ? 'Already have an account? ' : 'May account ka na ba? ') : (lang === 'en' ? "Don't have an account yet? " : 'Wala ka pa bang account? ')}
                <button type="button" onClick={() => { setIsSignUp(!isSignUp); setIsForgotPassword(false); setErrorMessage(''); }} className="cursor-pointer bg-none border-none text-brand-primary font-bold underline px-1">
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
