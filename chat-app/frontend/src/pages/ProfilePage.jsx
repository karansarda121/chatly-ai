import { ArrowLeft, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import AvatarUploadForm from '../components/profile/AvatarUploadForm.jsx';
import BlockedUsersSettings from '../components/profile/BlockedUsersSettings.jsx';
import DisplayNameForm from '../components/profile/DisplayNameForm.jsx';
import NotificationSettings from '../components/profile/NotificationSettings.jsx';
import ProfileSummary from '../components/profile/ProfileSummary.jsx';
import PasswordSettings from '../components/profile/PasswordSettings.jsx';
import useAuth from '../hooks/useAuth.js';
import './ProfilePage.css';

function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function signOut() {
    logout();
    navigate('/');
  }

  return (
    <main className="profile-page">
      <header className="profile-page__header"><Link to="/app"><ArrowLeft size={17} /> Back to dashboard</Link><button type="button" onClick={signOut}><LogOut size={17} /> Log out</button></header>
      <div className="profile-page__content">
        <ProfileSummary />
        <div className="profile-page__grid">
          <AvatarUploadForm />
          <DisplayNameForm />
          <NotificationSettings />
          <PasswordSettings />
          <BlockedUsersSettings />
        </div>
      </div>
    </main>
  );
}

export default ProfilePage;
