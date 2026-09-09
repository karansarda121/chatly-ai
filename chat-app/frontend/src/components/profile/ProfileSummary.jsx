import { AtSign, Mail } from 'lucide-react';

import UserAvatar from '../common/UserAvatar.jsx';
import useAuth from '../../hooks/useAuth.js';
import './ProfileSummary.css';

function ProfileSummary() {
  const { user } = useAuth();
  const displayName = user.displayName || user.username;

  return (
    <section className="profile-summary">
      <div className="profile-summary__avatar">
        <UserAvatar user={user} alt={`${displayName}'s avatar`} />
      </div>
      <div>
        <p className="profile-summary__label">Your profile</p>
        <h1>{displayName}</h1>
        <p className="profile-summary__detail"><AtSign size={16} /> {user.username}</p>
        <p className="profile-summary__detail"><Mail size={16} /> {user.email}</p>
      </div>
    </section>
  );
}

export default ProfileSummary;
