import {
  Bell,
  Bookmark,
  BellOff,
  LogOut,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Settings,
  Sun,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import useAuth from '../../hooks/useAuth.js';
import useClickOutside from '../../hooks/useClickOutside.js';
import useTheme from '../../hooks/useTheme.js';
import UserAvatar from '../common/UserAvatar.jsx';
import { areNotificationsEnabled, requestNotificationPermission, setNotificationsEnabled, showNotificationEnabledConfirmation } from '../../services/notificationService.js';
import './AppSidebar.css';

function AppSidebar({ children, onOpenGroupCreate, onOpenSavedMessages, onOpenUserDirectory }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(areNotificationsEnabled);
  const menuRef = useRef(null);
  const displayName = user.displayName || user.username;

  useClickOutside(menuRef, () => setIsMenuOpen(false));

  function signOut() {
    logout();
    navigate('/');
  }

  async function toggleNotifications() {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      setNotificationsEnabledState(false);
      return;
    }

    const permission = await requestNotificationPermission();
    setNotificationsEnabledState(permission === 'granted');
    if (permission === 'granted') showNotificationEnabledConfirmation();
  }

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__top">
        <Link
          to="/"
          className="app-sidebar__brand"
          aria-label="Go to Chatly AI landing page"
        >
          <span><MessageCircle size={21} /></span>
          <strong>Chatly<b>AI</b></strong>
        </Link>

        <div className="app-sidebar__actions">
          <button type="button" className="app-sidebar__new-chat" onClick={toggleNotifications} aria-label={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'} title={notificationsEnabled ? 'Notifications on' : 'Notifications off'}>{notificationsEnabled ? <Bell size={19} /> : <BellOff size={19} />}</button>
          <button type="button" className="app-sidebar__new-chat" onClick={toggleTheme} aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'} title={theme === 'light' ? 'Dark theme' : 'Light theme'}>{theme === 'light' ? <Moon size={18} /> : <Sun size={19} />}</button>
          <div ref={menuRef} className="app-sidebar__menu-wrap">
          <button
            type="button"
            className="app-sidebar__more"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Open account menu"
            aria-expanded={isMenuOpen}
          >
            <MoreHorizontal size={22} />
          </button>

          {isMenuOpen && (
            <div className="app-sidebar__menu">
              <button type="button" onClick={() => { setIsMenuOpen(false); onOpenUserDirectory(); }}>
                <UserPlus size={16} />
                Contacts
              </button>
              <button type="button" onClick={() => { setIsMenuOpen(false); onOpenGroupCreate(); }}>
                <UsersRound size={16} />
                Create group
              </button>
              <button type="button" onClick={() => { setIsMenuOpen(false); onOpenSavedMessages(); }}><Bookmark size={16} />Saved messages</button>
              <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                <Settings size={16} />
                Profile settings
              </Link>
              <button type="button" onClick={signOut}>
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      <Link
        to="/profile"
        className="app-sidebar__profile"
        aria-label="Open profile settings"
      >
        <span className="app-sidebar__picture">
          <UserAvatar user={user} />
        </span>
        <span>
          <strong>{displayName}</strong>
          <small>{user.email}</small>
        </span>
      </Link>

      <div className="app-sidebar__chat-content">{children}</div>
    </aside>
  );
}

export default AppSidebar;
