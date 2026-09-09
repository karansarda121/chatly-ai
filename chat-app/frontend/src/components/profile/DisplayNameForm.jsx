import { useState } from 'react';

import useAuth from '../../hooks/useAuth.js';
import './DisplayNameForm.css';

function DisplayNameForm() {
  const { user, updateProfile, isSubmitting } = useAuth();
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submitDisplayName(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      await updateProfile({ displayName });
      setMessage('Display name updated successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update display name.');
    }
  }

  return (
    <section className="display-name-section">
      <h2>Account details</h2>
      <p>Username and email are read-only after registration.</p>
      <form onSubmit={submitDisplayName} className="display-name-form">
        <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength="50" /></label>
        <label>Username<input value={user.username} disabled /></label>
        <label>Email<input value={user.email} disabled /></label>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save display name'}</button>
      </form>
      {message && <p className="profile-success">{message}</p>}
      {error && <p className="profile-error" role="alert">{error}</p>}
    </section>
  );
}

export default DisplayNameForm;
