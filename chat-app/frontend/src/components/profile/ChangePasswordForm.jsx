import { useState } from 'react';

import useAuth from '../../hooks/useAuth.js';
import './ChangePasswordForm.css';

function ChangePasswordForm() {
  const { changePassword, isSubmitting } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submitPassword(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password changed successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not change password.');
    }
  }

  return (
    <form className="password-form" onSubmit={submitPassword}>
      <label>Current password<input type="password" name="currentPassword" value={form.currentPassword} onChange={updateField} required /></label>
      <label>New password<input type="password" name="newPassword" value={form.newPassword} onChange={updateField} minLength="8" required /></label>
      <label>Confirm new password<input type="password" name="confirmPassword" value={form.confirmPassword} onChange={updateField} minLength="8" required /></label>
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Change password'}</button>
      {message && <p className="profile-success">{message}</p>}
      {error && <p className="profile-error" role="alert">{error}</p>}
    </form>
  );
}

export default ChangePasswordForm;
