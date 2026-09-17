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
  const [fieldErrors, setFieldErrors] = useState({});

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    setError('');
  }

  function validateForm() {
    const nextErrors = {};
    const username = form.username.trim();
    const email = form.email.trim();

    if (!username) nextErrors.username = 'Enter a username.';
    else if (username.length < 3) nextErrors.username = 'Username must be at least 3 characters.';

    if (!email) nextErrors.email = 'Enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email address.';

    if (!form.password) nextErrors.password = 'Create a password.';
    else if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';

    if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirm your password.';
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!validateForm()) return;

    try {
      const { confirmPassword: _confirmPassword, ...details } = form;
      const result = await register(details);
      sessionStorage.setItem('chatly_verification_email', result.email);
      sessionStorage.setItem('chatly_verification_session', result.verificationSessionToken);
      navigate('/verify-email', { state: { email: result.email, verificationStatus: result, notice: result.message } });
    } catch (requestError) {
      const response = requestError.response?.data;
      if (response?.verificationRequired && response.email) {
        sessionStorage.setItem('chatly_verification_email', response.email);
        if (response.verificationSessionToken) sessionStorage.setItem('chatly_verification_session', response.verificationSessionToken);
        navigate('/verify-email', {
          state: {
            email: response.email,
            verificationStatus: response,
            deliveryFailed: true,
            message: response.message,
          },
        });
        return;
      }
      setError(response?.message || 'Unable to reach the server. Please try again.');
    }
  }

  function inputClass(name) {
    return `register-input${fieldErrors[name] ? ' is-invalid' : ''}`;
  }

  return (
    <main className="register-page">
      <section className="register-card">
        <button type="button" className="register-back" onClick={() => navigate('/')}><ArrowLeft size={16} /> Back to home</button>
        <div className="register-brand"><span><MessageCircle size={20} /></span> Chatly<b>AI</b></div>
        <p className="register-kicker">Start a better conversation</p>
        <h1>Create your account</h1>

        {error && <p className="register-error" role="alert">{error}</p>}

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <label><span>Username</span><div className={inputClass('username')}><UserRound size={17} /><input name="username" value={form.username} onChange={updateField} aria-invalid={Boolean(fieldErrors.username)} aria-describedby={fieldErrors.username ? 'username-error' : undefined} minLength="3" maxLength="30" autoComplete="username" placeholder="karan_sharma" /></div>{fieldErrors.username && <small id="username-error" className="register-field-error">{fieldErrors.username}</small>}</label>
          <label><span>Display name <em>(optional)</em></span><div className="register-input"><UserRound size={17} /><input name="displayName" value={form.displayName} onChange={updateField} maxLength="50" placeholder="Karan Sharma" /></div></label>
          <label><span>Email address</span><div className={inputClass('email')}><Mail size={17} /><input type="email" name="email" value={form.email} onChange={updateField} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-error' : undefined} autoComplete="email" placeholder="you@example.com" /></div>{fieldErrors.email && <small id="email-error" className="register-field-error">{fieldErrors.email}</small>}</label>
          <label><span>Password</span><div className={inputClass('password')}><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={updateField} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'password-error' : undefined} autoComplete="new-password" placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{fieldErrors.password && <small id="password-error" className="register-field-error">{fieldErrors.password}</small>}</label>
          <label><span>Confirm password</span><div className={inputClass('confirmPassword')}><LockKeyhole size={17} /><input type="password" name="confirmPassword" value={form.confirmPassword} onChange={updateField} aria-invalid={Boolean(fieldErrors.confirmPassword)} aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined} autoComplete="new-password" placeholder="Repeat your password" /></div>{fieldErrors.confirmPassword && <small id="confirm-password-error" className="register-field-error">{fieldErrors.confirmPassword}</small>}</label>
          <button className="register-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait...' : 'Create account'}</button>
        </form>
        <p className="register-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </section>
    </main>
  );
}

export default RegisterPage;