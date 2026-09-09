import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, MessageCircle, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import useAuth from '../hooks/useAuth.js';
import './RegisterPage.css';

function RegisterPage() {
  const { register, isSubmitting } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', displayName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const { confirmPassword: _confirmPassword, ...details } = form;
      const result = await register(details);
      sessionStorage.setItem('chatly_verification_email', result.email);
      navigate('/verify-email', { state: { email: result.email } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reach the server. Please try again.');
    }
  }

  return (
    <main className="register-page">
      <section className="register-card">
        <button type="button" className="register-back" onClick={() => navigate('/')}><ArrowLeft size={16} /> Back to home</button>
        <div className="register-brand"><span><MessageCircle size={20} /></span> Chatly<b>AI</b></div>
        <p className="register-kicker">Start a better conversation</p>
        <h1>Create your account</h1>

        <form className="register-form" onSubmit={handleSubmit}>
          <label><span>Username</span><div className="register-input"><UserRound size={17} /><input name="username" value={form.username} onChange={updateField} required minLength="3" maxLength="30" autoComplete="username" placeholder="karan_sharma" /></div></label>
          <label><span>Display name <em>(optional)</em></span><div className="register-input"><UserRound size={17} /><input name="displayName" value={form.displayName} onChange={updateField} maxLength="50" placeholder="Karan Sharma" /></div></label>
          <label><span>Email address</span><div className="register-input"><Mail size={17} /><input type="email" name="email" value={form.email} onChange={updateField} required autoComplete="email" placeholder="you@example.com" /></div></label>
          <label><span>Password</span><div className="register-input"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={updateField} required minLength="8" autoComplete="new-password" placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          <label><span>Confirm password</span><div className="register-input"><LockKeyhole size={17} /><input type="password" name="confirmPassword" value={form.confirmPassword} onChange={updateField} required minLength="8" autoComplete="new-password" placeholder="Repeat your password" /></div></label>
          {error && <p className="register-error" role="alert">{error}</p>}
          <button className="register-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait...' : 'Create account'}</button>
        </form>
        <p className="register-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </section>
    </main>
  );
}

export default RegisterPage;
