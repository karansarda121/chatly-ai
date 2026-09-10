import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import useAuth from '../hooks/useAuth.js';
import './LoginPage.css';

function LoginPage() {
  const { login, isSubmitting } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice] = useState(() => location.state?.notice || '');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      await login({ email, password });
    } catch (requestError) {
      const response = requestError.response?.data;
      if (response?.code === 'EMAIL_NOT_VERIFIED') {
        sessionStorage.setItem('chatly_verification_email', response.email);
        navigate('/verify-email', { state: { email: response.email, verificationStatus: response } });
        return;
      }
      setError(response?.message || 'Unable to reach the server. Please try again.');
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <button type="button" className="login-back" onClick={() => navigate('/')}><ArrowLeft size={17} /> Back to home</button>
        <div className="login-brand"><span><MessageCircle size={22} /></span> Chatly<b>AI</b></div>
        <p className="login-kicker">Welcome back</p>
        <h1>Sign in to ChatlyAI</h1>
        <p className="login-intro">Use your email and password to continue.</p>
        {notice && <p className="login-notice" role="status">{notice}</p>}

        <form className="login-form" onSubmit={handleSubmit}>
          <label><span>Email address</span><div className="login-input"><Mail size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" /></div></label>
          <label><span>Password</span><div className="login-input"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength="8" autoComplete="current-password" placeholder="Your password" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait...' : 'Log in'}</button>
        </form>
        <p className="login-switch"><Link to="/forgot-password">Forgot password?</Link></p>
        <p className="login-switch">New to ChatlyAI? <Link to="/register">Create an account</Link></p>
      </section>
    </main>
  );
}

export default LoginPage;
