import { ArrowLeft, MailCheck, MessageCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import useAuth from '../hooks/useAuth.js';
import './VerifyEmailPage.css';

function secondsRemaining(timestamp, now) {
  if (!timestamp) return 0;
  return Math.max(0, Math.ceil((new Date(timestamp).getTime() - now) / 1000));
}

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function VerifyEmailPage() {
  const { changeUnverifiedEmail, getEmailVerificationStatus, isSubmitting, resendVerificationOtp, verifyEmail } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => location.state?.email || sessionStorage.getItem('chatly_verification_email') || '');
  const [status, setStatus] = useState(location.state?.verificationStatus || null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [now, setNow] = useState(Date.now());
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(() => location.state?.deliveryFailed ? (location.state?.message || 'We could not send the verification code. Try again.') : '');
  const [notice, setNotice] = useState(() => location.state?.notice || '');

  async function loadStatus() {
    if (!email) return;
    setIsLoadingStatus(true);
    try {
      const result = await getEmailVerificationStatus(email);
      setStatus(result);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to check verification status.');
    } finally {
      setIsLoadingStatus(false);
    }
  }

  useEffect(() => { if (!email) navigate('/register', { replace: true }); else loadStatus(); }, [email]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);

  const otpSecondsRemaining = secondsRemaining(status?.otpExpiresAt, now);
  const hasActiveOtp = otpSecondsRemaining > 0;
  const canResend = !isLoadingStatus && !isSubmitting && !hasActiveOtp;

  async function handleVerify(event) {
    event.preventDefault();
    setError(''); setNotice('');
    if (!/^\d{6}$/.test(otp)) { setError('Enter the 6-digit code from your email.'); return; }
    try {
      const result = await verifyEmail({ email, otp });
      sessionStorage.removeItem('chatly_verification_email');
      sessionStorage.removeItem('chatly_verification_session');
      navigate('/login', { replace: true, state: { notice: result.message } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to verify the code. Please try again.');
      loadStatus();
    }
  }

  async function handleResend() {
    if (!canResend) return;
    setError(''); setNotice('');
    try {
      const result = await resendVerificationOtp(email);
      setStatus(result);
      setOtp('');
      setNotice(result.message);
    } catch (requestError) {
      const response = requestError.response?.data;
      if (response?.verificationRequired) setStatus(response);
      setError(response?.message || 'Unable to send a new code. Please try again.');
    }
  }

  async function handleEmailChange(event) {
    event.preventDefault();
    setError(''); setNotice('');
    const normalizedNewEmail = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedNewEmail)) {
      setError('Enter a valid new email address.');
      return;
    }

    const verificationSessionToken = sessionStorage.getItem('chatly_verification_session');
    if (!verificationSessionToken) {
      setError('Your registration session expired. Please register again.');
      return;
    }

    try {
      const result = await changeUnverifiedEmail({ email, newEmail: normalizedNewEmail, verificationSessionToken });
      setEmail(result.email);
      sessionStorage.setItem('chatly_verification_email', result.email);
      setStatus(result);
      setOtp('');
      setNewEmail('');
      setIsChangingEmail(false);
      setNotice(result.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update your email. Please try again.');
    }
  }

  if (!email) return null;
  return <main className="verify-email-page"><section className="verify-email-card">
    <button type="button" className="verify-email-back" onClick={() => navigate('/register')}><ArrowLeft size={17} /> Back to registration</button>
    <div className="verify-email-brand"><span><MessageCircle size={22} /></span> Chatly<b>AI</b></div>
    <div className="verify-email-icon"><MailCheck size={29} /></div>
    <p className="verify-email-kicker">One final step</p>
    <h1>Verify your email</h1>
    <p className="verify-email-intro">{hasActiveOtp ? <>We sent a 6-digit code to <strong>{email}</strong>. Enter it below.</> : <>Your previous code has expired. Send a new code to <strong>{email}</strong>.</>}</p>
    {isChangingEmail ? <form className="verify-email-change" onSubmit={handleEmailChange}>
      <label htmlFor="new-verification-email">New email address</label>
      <input id="new-verification-email" type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" autoFocus />
      <p>Changing your email invalidates the old code and sends a new one.</p>
      <div><button type="button" onClick={() => { setIsChangingEmail(false); setNewEmail(''); setError(''); }}>Cancel</button><button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update email'}</button></div>
    </form> : <button type="button" className="verify-email-change-trigger" onClick={() => { setIsChangingEmail(true); setError(''); setNotice(''); }}>Wrong email? Change it</button>}
    {isLoadingStatus ? <p className="verify-email-status">Checking verification status...</p> : hasActiveOtp && <form className="verify-email-form" onSubmit={handleVerify}>
      <label><span>Verification code</span><input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus={!isChangingEmail} maxLength="6" placeholder="000000" aria-label="6-digit verification code" /></label>
      {error && <p className="verify-email-error" role="alert">{error}</p>}
      {notice && <p className="verify-email-notice" role="status">{notice}</p>}
      <button className="verify-email-submit" type="submit" disabled={isSubmitting || otp.length !== 6}>{isSubmitting ? 'Verifying...' : <><ShieldCheck size={18} /> Verify email</>}</button>
    </form>}
    {!isLoadingStatus && !hasActiveOtp && error && <p className="verify-email-error" role="alert">{error}</p>}
    {!isLoadingStatus && !hasActiveOtp && notice && <p className="verify-email-notice" role="status">{notice}</p>}
    {hasActiveOtp ? <p className="verify-email-resend">Your current code expires in <strong>{formatCountdown(otpSecondsRemaining)}</strong>. You can request a new code after it expires.</p> : <p className="verify-email-resend">Ready for a new code? <button type="button" onClick={handleResend} disabled={!canResend}><RefreshCw size={14} /> Send new code</button></p>}
    <p className="verify-email-login">Already verified? <Link to="/login">Go to login</Link></p>
  </section></main>;
}

export default VerifyEmailPage;