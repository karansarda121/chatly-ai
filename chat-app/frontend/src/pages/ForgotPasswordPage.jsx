import { ArrowLeft, Eye, EyeOff, KeyRound, LockKeyhole, Mail, MessageCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import useAuth from '../hooks/useAuth.js';
import './LoginPage.css';

function secondsRemaining(timestamp, now) {
  if (!timestamp) return 0;
  return Math.max(0, Math.ceil((new Date(timestamp).getTime() - now) / 1000));
}

function formatCountdown(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function ForgotPasswordPage() {
  const { isSubmitting, requestPasswordReset, resendPasswordResetOtp, resetPassword, verifyPasswordResetOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [step, setStep] = useState('email');
  const [resetStatus, setResetStatus] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const otpSeconds = secondsRemaining(resetStatus?.otpExpiresAt, now);
  const resendSeconds = secondsRemaining(resetStatus?.resendAvailableAt, now);
  const canResend = !isSubmitting && resendSeconds === 0;
  const knownOtpExpired = Boolean(resetStatus?.otpExpiresAt) && otpSeconds === 0;

  async function requestCode(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      const result = await requestPasswordReset(email);
      setResetStatus(result);
      setNotice(result.message);
      setStep('otp');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send a reset code.');
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    try {
      const result = await verifyPasswordResetOtp({ email, otp });
      setResetToken(result.resetToken);
      setNotice(result.message);
      setStep('password');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to verify the code.');
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const result = await resetPassword({ email, resetToken, newPassword: password });
      navigate('/login', { replace: true, state: { notice: result.message } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update your password.');
    }
  }

  async function resendCode() {
    if (!canResend) return;
    setError('');
    setNotice('');
    try {
      const result = await resendPasswordResetOtp(email);
      setResetStatus(result);
      setOtp('');
      setNotice(result.message);
    } catch (requestError) {
      const response = requestError.response?.data;
      if (response?.passwordResetRequested) setResetStatus(response);
      setError(response?.message || 'Unable to resend the code.');
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <button type="button" className="login-back" onClick={() => navigate('/login')}><ArrowLeft size={17} /> Back to login</button>
        <div className="login-brand"><span><MessageCircle size={22} /></span> Chatly<b>AI</b></div>
        <p className="login-kicker">Account recovery</p>
        <h1>{step === 'email' ? 'Forgot password?' : step === 'otp' ? 'Verify reset code' : 'Set a new password'}</h1>
        <p className="login-intro">{step === 'email' ? 'Enter your email and we will send a secure reset code.' : step === 'otp' ? `Enter the code sent to ${email}.` : 'Choose a strong password you have not used before.'}</p>

        {notice && <p className="login-notice" role="status">{notice}</p>}
        {error && <p className="login-error" role="alert">{error}</p>}

        {step === 'email' ? (
          <form className="login-form" onSubmit={requestCode}>
            <label><span>Email address</span><div className="login-input"><Mail size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" /></div></label>
            <button className="login-submit" disabled={isSubmitting}>{isSubmitting ? 'Sending code...' : 'Send reset code'}</button>
          </form>
        ) : step === 'otp' ? (
          <form className="login-form" onSubmit={verifyCode}>
            {!knownOtpExpired && <label><span>6-digit reset code</span><div className="login-input"><KeyRound size={18} /><input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required placeholder="000000" /></div></label>}
            {otpSeconds > 0 && <p className="login-otp-meta">This code expires in <strong>{formatCountdown(otpSeconds)}</strong>.</p>}
            {knownOtpExpired && <p className="login-otp-meta">This code expired. Send a new code to continue.</p>}
            {!knownOtpExpired && <button className="login-submit" disabled={isSubmitting || otp.length !== 6}>{isSubmitting ? 'Verifying...' : <><ShieldCheck size={18} /> Verify code</>}</button>}
            <p className="login-otp-resend">{resendSeconds > 0 ? <>You can request a new code in <strong>{formatCountdown(resendSeconds)}</strong>.</> : <>Did not receive it? <button className="login-back" type="button" onClick={resendCode} disabled={!canResend}><RefreshCw size={15} /> Send new code</button></>}</p>
          </form>
        ) : (
          <form className="login-form" onSubmit={savePassword}>
            <label><span>New password</span><div className="login-input"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" required autoComplete="new-password" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            <label><span>Confirm new password</span><div className="login-input"><LockKeyhole size={18} /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength="8" required autoComplete="new-password" /></div></label>
            <button className="login-submit" disabled={isSubmitting}>{isSubmitting ? 'Updating password...' : 'Set new password'}</button>
          </form>
        )}
        <p className="login-switch">Remembered your password? <Link to="/login">Log in</Link></p>
      </section>
    </main>
  );
}

export default ForgotPasswordPage;