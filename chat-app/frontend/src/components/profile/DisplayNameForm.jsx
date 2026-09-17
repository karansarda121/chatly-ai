import { Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import useAuth from '../../hooks/useAuth.js';
import './DisplayNameForm.css';

function DisplayNameForm() {
  const { user, updateProfile, isSubmitting } = useAuth();
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) setDisplayName(user.displayName || '');
  }, [isEditing, user.displayName]);

  function startEditing() {
    setDisplayName(user.displayName || '');
    setMessage('');
    setError('');
    setIsEditing(true);
  }

  function cancelEditing() {
    setDisplayName(user.displayName || '');
    setError('');
    setIsEditing(false);
  }

  async function submitDisplayName(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      await updateProfile({ displayName });
      setMessage('Display name updated successfully.');
      setIsEditing(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update display name.');
    }
  }

  const savedDisplayName = user.displayName || user.username;

  return (
    <section className="display-name-section">
      <h2>Account details</h2>
      <p>Username and email are read-only after registration.</p>
      <div className="display-name-current">
        <span><strong>Display name</strong><small>{savedDisplayName}</small></span>
        {!isEditing && <button type="button" className="display-name-edit" onClick={startEditing}><Pencil size={15} /> Edit</button>}
      </div>
      {isEditing && (
        <form onSubmit={submitDisplayName} className="display-name-form">
          <label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength="50" autoFocus /></label>
          <div className="display-name-actions"><button type="button" className="display-name-cancel" onClick={cancelEditing} disabled={isSubmitting}><X size={15} /> Cancel</button><button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save display name'}</button></div>
        </form>
      )}
      <div className="account-read-only"><span><strong>Username</strong><small>{user.username}</small></span><span><strong>Email</strong><small>{user.email}</small></span></div>
      {(error || message) && <p className={error ? 'profile-error' : 'profile-success'} role={error ? 'alert' : 'status'}>{error || message}</p>}
    </section>
  );
}

export default DisplayNameForm;