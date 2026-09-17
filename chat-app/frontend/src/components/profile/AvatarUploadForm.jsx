import { ImageUp } from 'lucide-react';
import { useState } from 'react';

import useAuth from '../../hooks/useAuth.js';
import './AvatarUploadForm.css';

function AvatarUploadForm() {
  const { updateAvatar, isSubmitting } = useAuth();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submitAvatar(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!file) {
      setMessage('');
      setError('Choose a JPEG, PNG, or WebP image first.');
      return;
    }

    setError('');
    setMessage('');
    try {
      await updateAvatar(file);
      setError('');
      setMessage('Profile picture updated successfully.');
      setFile(null);
      form.reset();
    } catch (requestError) {
      setMessage('');
      setError(requestError.response?.data?.message || 'Profile picture upload failed. Please try again.');
    }
  }

  return (
    <section className="avatar-form-section">
      <h2>Profile picture</h2>
      <p>Upload a JPEG, PNG, or WebP image. Replacing it removes the old ImageKit profile picture.</p>
      <form onSubmit={submitAvatar} className="avatar-form">
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setFile(event.target.files[0] || null); setMessage(''); setError(''); }} />
        <button type="submit" disabled={isSubmitting}><ImageUp size={17} /> {isSubmitting ? 'Uploading...' : 'Upload profile picture'}</button>
      </form>
      {(error || message) && <p className={error ? 'profile-error' : 'profile-success'} role={error ? 'alert' : 'status'}>{error || message}</p>}
    </section>
  );
}

export default AvatarUploadForm;