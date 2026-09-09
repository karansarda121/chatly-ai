import { Ban, UserRoundX } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getBlockedUsers, unblockUser } from '../../services/userService.js';
import UserAvatar from '../common/UserAvatar.jsx';
import './BlockedUsersSettings.css';

function BlockedUsersSettings() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUserId, setPendingUserId] = useState('');

  useEffect(() => {
    async function loadBlockedUsers() {
      try {
        setUsers(await getBlockedUsers());
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Could not load blocked users.');
      } finally {
        setIsLoading(false);
      }
    }

    loadBlockedUsers();
  }, []);

  async function handleUnblock(userId) {
    setPendingUserId(userId);
    setError('');
    try {
      await unblockUser(userId);
      setUsers((currentUsers) => currentUsers.filter((user) => user._id !== userId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not unblock this user.');
    } finally {
      setPendingUserId('');
    }
  }

  return <section className="blocked-users-settings"><h2><Ban size={19} /> Blocked users</h2><p>Blocked users cannot start or send messages in a direct conversation with you.</p>{error && <p className="blocked-users-settings__error" role="alert">{error}</p>}{isLoading ? <p>Loading blocked users...</p> : users.length === 0 ? <div className="blocked-users-settings__empty"><UserRoundX size={22} /> You have not blocked anyone.</div> : <ul>{users.map((user) => <li key={user._id}><UserAvatar user={user} /><span><strong>{user.displayName || user.username}</strong><small>@{user.username}</small></span><button type="button" onClick={() => handleUnblock(user._id)} disabled={pendingUserId === user._id}>{pendingUserId === user._id ? 'Unblocking...' : 'Unblock'}</button></li>)}</ul>}</section>;
}

export default BlockedUsersSettings;
