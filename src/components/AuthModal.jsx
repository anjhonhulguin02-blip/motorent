import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import useEscapeToClose from '../hooks/useEscapeToClose';
import useModalA11y from '../hooks/useModalA11y';
import PrivacyPolicyModal from './PrivacyPolicyModal';

const inputClass = "w-full px-4 py-3 bg-black/25 border border-white/10 rounded-xl text-white text-[0.95rem] outline-none mb-1 transition-all duration-200 placeholder:text-slate-500 focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/15";
const labelClass = "block text-[0.78rem] font-semibold text-slate-300 mb-1.5";
const fieldWrapClass = "mb-4";
const hintClass = "text-[0.72rem] text-slate-500 mb-1";
const inlineErrorClass = "text-[0.72rem] text-red-400 mb-1";

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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

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
      setConfirmPassword('');
      setAgreeTerms(false);
    }
  }, [isOpen, isRecoveryModeInitial]);

  useEscapeToClose(isOpen, onClose);
  const dialogRef = useRef(null);
  useModalA11y(isOpen, dialogRef);

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
        if (password.length < 6) throw new Error(lang === 'en' ? 'Password must be at least 6 characters.' : 'Ang password ay dapat hindi bababa sa 6 na karakter.');
        if (password !== confirmPassword) throw new Error(lang === 'en' ? 'Passwords do not match.' : 'Hindi magkatugma ang password.');
        if (!agreeTerms) throw new Error(lang === 'en' ? 'Please agree to the Privacy Notice to continue.' : 'Pakisang-ayunan ang Privacy Notice para magpatuloy.');

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

  // Client-side hints that don't need a network round trip — shown live as
  // the person types, instead of only surfacing after a failed submit.
  const showPasswordRules = isSignUp || isUpdatePassword;
  const passwordTooShort = showPasswordRules && password.length > 0 && password.length < 6;
  const passwordsMismatch = showPasswordRules && confirmPassword.length > 0 && password !== confirmPassword;
  const phoneInvalid = isSignUp && phoneNumber.length > 0 && !formatPhNumber(phoneNumber);

  // --- MAS MALINIS NA TEXT VARIABLES ---
  let headerText;
  if (isUpdatePassword) {
    headerText = lang === 'en' ? 'Create New Password' : 'Gumawa ng Bagong Password';
  } else if (isForgotPassword) {
    headerText = lang === 'en' ? 'Reset Password' : 'I-reset ang Password';
  } else if (isSignUp) {
    headerText = lang === 'en' ? 'Create Account' : 'Gumawa ng Account';
  } else {
    headerText = lang === 'en' ? 'Welcome Back' : 'Mag-log In';
  }

  let buttonText;
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

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 w-screen h-screen bg-[rgba(10,14,22,0.8)] backdrop-blur-lg flex items-center justify-center z-[100000]"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={headerText}
        className="bg-brand-card/95 backdrop-blur-xl border border-brand-primary/15 rounded-3xl p-8 sm:p-10 w-[90%] max-w-[460px] shadow-[0_0_0_1px_rgba(234,169,116,0.04),0_30px_60px_rgba(0,0,0,0.6)] animate-[fadeInEffect_0.25s_ease-out] outline-none"
      >

        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display m-0 text-2xl font-bold text-white">
            {headerText}
          </h2>
          {!isUpdatePassword && (
            <button
              onClick={onClose}
              aria-label="Close"
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

        <form onSubmit={handleSubmit} noValidate>
          {isUpdatePassword ? (
            <>
              <div className={fieldWrapClass}>
                <label htmlFor="auth-new-password" className={labelClass}>{lang === 'en' ? 'New Password' : 'Bagong Password'}</label>
                <div className="relative w-full">
                  <input
                    id="auth-new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={lang === 'en' ? 'Enter New Password' : 'Ilagay ang Bagong Password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-invalid={passwordTooShort}
                    className={`${inputClass} pr-11`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none p-0 m-0 flex items-center justify-center cursor-pointer text-brand-muted outline-none" title={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <p className={passwordTooShort ? inlineErrorClass : hintClass}>
                  {lang === 'en' ? 'At least 6 characters.' : 'Hindi bababa sa 6 na karakter.'}
                </p>
              </div>

              <div className={fieldWrapClass}>
                <label htmlFor="auth-confirm-new-password" className={labelClass}>{lang === 'en' ? 'Confirm New Password' : 'Kumpirmahin ang Bagong Password'}</label>
                <div className="relative w-full">
                  <input
                    id="auth-confirm-new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder={lang === 'en' ? 'Confirm New Password' : 'Kumpirmahin ang Bagong Password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    aria-invalid={passwordsMismatch}
                    className={`${inputClass} pr-11`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none p-0 m-0 flex items-center justify-center cursor-pointer text-brand-muted outline-none" title={showConfirmPassword ? "Hide password" : "Show password"}>
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {passwordsMismatch && (
                  <p className={inlineErrorClass}>{lang === 'en' ? "Passwords don't match." : 'Hindi magkatugma ang password.'}</p>
                )}
              </div>
            </>
          ) : isForgotPassword ? (
            <div className={fieldWrapClass}>
              <label htmlFor="auth-forgot-email" className={labelClass}>{lang === 'en' ? 'Email Address' : 'Email Address'}</label>
              <input
                id="auth-forgot-email"
                type="email"
                autoComplete="email"
                placeholder={lang === 'en' ? 'Enter your registered email' : 'Ilagay ang iyong nakarehistrong email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          ) : isSignUp ? (
            <>
              <div className={fieldWrapClass}>
                <label htmlFor="auth-fullname" className={labelClass}>{lang === 'en' ? 'Full Name' : 'Buong Pangalan'}</label>
                <input id="auth-fullname" type="text" autoComplete="name" placeholder={lang === 'en' ? 'Juan Dela Cruz' : 'Juan Dela Cruz'} value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} />
              </div>

              <div className={fieldWrapClass}>
                <label htmlFor="auth-username" className={labelClass}>{lang === 'en' ? 'Username' : 'Username'}</label>
                <input id="auth-username" type="text" autoComplete="username" placeholder={lang === 'en' ? 'e.g., anjhon21' : 'Hal. anjhon21'} value={username} onChange={(e) => setUsername(e.target.value)} required className={inputClass} />
              </div>

              <div className={fieldWrapClass}>
                <label htmlFor="auth-email" className={labelClass}>{lang === 'en' ? 'Email Address' : 'Email Address'}</label>
                <input id="auth-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
              </div>

              <div className={fieldWrapClass}>
                <label htmlFor="auth-phone" className={labelClass}>{lang === 'en' ? 'Phone Number' : 'Numero ng Telepono'}</label>
                <input
                  id="auth-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="09123456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={13}
                  required
                  aria-invalid={phoneInvalid}
                  className={inputClass}
                />
                <p className={phoneInvalid ? inlineErrorClass : hintClass}>
                  {phoneInvalid
                    ? (lang === 'en' ? 'Enter a valid PH mobile number, e.g. 09123456789.' : 'Maglagay ng tamang numero, hal. 09123456789.')
                    : (lang === 'en' ? 'Format: 09XXXXXXXXX' : 'Format: 09XXXXXXXXX')}
                </p>
              </div>
            </>
          ) : (
            <div className={fieldWrapClass}>
              <label htmlFor="auth-login-id" className={labelClass}>{lang === 'en' ? 'Email or Username' : 'Email o Username'}</label>
              <input id="auth-login-id" type="text" autoComplete="username" placeholder={lang === 'en' ? 'Email or Username' : 'Email o Username'} value={emailOrUsername} onChange={(e) => setEmailOrUsername(e.target.value)} required className={inputClass} />
            </div>
          )}

          {!isForgotPassword && !isUpdatePassword && (
            <>
              <div className={fieldWrapClass}>
                <label htmlFor="auth-password" className={labelClass}>{lang === 'en' ? 'Password' : 'Password'}</label>
                <div className="relative w-full">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    placeholder={lang === 'en' ? 'Password' : 'Password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-invalid={passwordTooShort}
                    className={`${inputClass} pr-11`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none p-0 m-0 flex items-center justify-center cursor-pointer text-brand-muted outline-none" title={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {isSignUp && (
                  <p className={passwordTooShort ? inlineErrorClass : hintClass}>
                    {lang === 'en' ? 'At least 6 characters.' : 'Hindi bababa sa 6 na karakter.'}
                  </p>
                )}
              </div>

              {isSignUp && (
                <div className={fieldWrapClass}>
                  <label htmlFor="auth-confirm-password" className={labelClass}>{lang === 'en' ? 'Confirm Password' : 'Kumpirmahin ang Password'}</label>
                  <div className="relative w-full">
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={lang === 'en' ? 'Re-enter your password' : 'Ulitin ang password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      aria-invalid={passwordsMismatch}
                      className={`${inputClass} pr-11`}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none p-0 m-0 flex items-center justify-center cursor-pointer text-brand-muted outline-none" title={showConfirmPassword ? "Hide password" : "Show password"}>
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {passwordsMismatch && (
                    <p className={inlineErrorClass}>{lang === 'en' ? "Passwords don't match." : 'Hindi magkatugma ang password.'}</p>
                  )}
                </div>
              )}

              {!isSignUp && (
                <div className="text-right -mt-3 mb-4">
                  <button type="button" onClick={() => { setIsForgotPassword(true); setIsSignUp(false); setErrorMessage(''); }} className="bg-none border-none text-brand-muted text-xs cursor-pointer underline p-0 hover:text-white transition-colors">
                    {lang === 'en' ? 'Forgot Password?' : 'Nakalimutan ang Password?'}
                  </button>
                </div>
              )}

              {isSignUp && (
                <label htmlFor="auth-agree-terms" className="flex items-start gap-2.5 mb-5 cursor-pointer select-none">
                  <input
                    id="auth-agree-terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    required
                    className="mt-0.5 w-4 h-4 shrink-0 accent-brand-primary cursor-pointer"
                  />
                  <span className="text-[0.78rem] text-slate-300 leading-snug">
                    {lang === 'en' ? 'I agree to the ' : 'Sumasang-ayon ako sa '}
                    <button type="button" onClick={(e) => { e.preventDefault(); setPrivacyOpen(true); }} className="bg-none border-none p-0 text-brand-primary underline cursor-pointer text-[0.78rem] font-semibold">
                      {lang === 'en' ? 'Privacy Notice' : 'Privacy Notice'}
                    </button>
                    {lang === 'en' ? ' and consent to MotoRent collecting my details to process bookings.' : ' at pumapayag na kolektahin ng MotoRent ang aking impormasyon para sa pagproseso ng booking.'}
                  </span>
                </label>
              )}
            </>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none">
            {buttonText}
          </button>
        </form>

        <PrivacyPolicyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />

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
    </div>,
    document.body
  );
}
