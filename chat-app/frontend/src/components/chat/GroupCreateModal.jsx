import { useRef, useState } from 'react';

import useClickOutside from '../../hooks/useClickOutside.js';
import './GroupCreateModal.css';

function GroupCreateModal({ isCreating, isOpen, onClose, onCreate, users }) {
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const dialogRef = useRef(null);

  useClickOutside(dialogRef, onClose);

  if (!isOpen) return null;

  const matchingUsers = users.filter((user) => {
    const searchableText = `${user.displayName} ${user.username}`.toLowerCase();
    return searchableText.includes(userQuery.trim().toLowerCase());
  });

  function toggleUser(userId) {
    setSelectedIds((currentIds) => currentIds.includes(userId)
      ? currentIds.filter((id) => id !== userId)
      : [...currentIds, userId]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (name.trim().length < 3 || selectedIds.length === 0) return;
    const chat = await onCreate(name.trim(), selectedIds);
    if (chat) {
      setName('');
      setSelectedIds([]);
    }
  }

  return (
    <div className="group-create-modal">
      <form ref={dialogRef} className="group-create-modal__dialog" onSubmit={handleSubmit}>
        <h2>Create group</h2>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Group name" maxLength="100" />
        <p>Select members ({selectedIds.length})</p>
        <input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Search your contacts" />
        <div className="group-create-modal__users">{matchingUsers.map((user) => <label key={user._id}><input type="checkbox" checked={selectedIds.includes(user._id)} onChange={() => toggleUser(user._id)} /><span>{user.displayName || user.username}<small>@{user.username}</small></span></label>)}</div>
        <div className="group-create-modal__actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={isCreating || name.trim().length < 3 || selectedIds.length === 0}>{isCreating ? 'Creating…' : 'Create group'}</button></div>
      </form>
    </div>
  );
}

export default GroupCreateModal;
