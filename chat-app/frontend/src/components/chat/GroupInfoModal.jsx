import { Pencil, Trash2, UsersRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import useClickOutside from '../../hooks/useClickOutside.js';
import { addGroupMember, deleteGroup, removeGroupMember, updateGroup, updateGroupMemberRole } from '../../services/chatService.js';
import { getUsers } from '../../services/userService.js';
import DeleteGroupDialog from './DeleteGroupDialog.jsx';
import GroupSettingsForm from './GroupSettingsForm.jsx';
import './GroupInfoModal.css';

function GroupInfoModal({ chat, currentUserId, isOpen, onClose, onDeleted, onUpdated }) {
  const dialogRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [changingUserId, setChangingUserId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const actor = chat.members.find(
    (member) => String(member.user?._id) === String(currentUserId),
  );
  const isOwner = actor?.role === 'owner';
  const canManageMembers = isOwner || actor?.role === 'admin';

  useClickOutside(dialogRef, () => {
    if (!isDeleteDialogOpen) onClose();
  });

  useEffect(() => {
    if (!isOpen) return;

    getUsers()
      .then((loadedUsers) => {
        setUsers(loadedUsers);
        setError('');
      })
      .catch(() => setError('Could not load users.'));
  }, [isOpen]);

  if (!isOpen) return null;

  const memberIds = new Set(chat.members.map((member) => String(member.user?._id)));
  const normalizedQuery = query.trim().toLowerCase();
  const results = users.filter((user) => {
    const searchableText = `${user.displayName} ${user.username}`.toLowerCase();
    return !memberIds.has(String(user._id)) && searchableText.includes(normalizedQuery);
  });

  function canRemove(member) {
    if (!canManageMembers || member.role === 'owner') return false;
    return isOwner || member.role === 'member';
  }

  async function runMemberAction(userId, action) {
    setChangingUserId(userId);
    setError('');
    try {
      onUpdated(await action());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update the group member.');
    } finally {
      setChangingUserId('');
    }
  }

  async function saveDetails(groupDetails) {
    setIsSavingDetails(true);
    setError('');
    try {
      onUpdated(await updateGroup(chat._id, groupDetails));
      setIsEditing(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update group details.');
    } finally {
      setIsSavingDetails(false);
    }
  }

  async function permanentlyDeleteGroup() {
    setIsDeleting(true);
    setError('');
    try {
      const deletedChatId = await deleteGroup(chat._id);
      setIsDeleteDialogOpen(false);
      onDeleted(deletedChatId);
      onClose();
    } catch (requestError) {
      setIsDeleteDialogOpen(false);
      setError(requestError.response?.data?.message || 'Could not delete this group.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="group-info-modal" role="presentation">
      <section ref={dialogRef} className="group-info-modal__dialog" aria-label="Group information">
        <header className="group-info-modal__hero">
          <span className="group-info-modal__icon"><UsersRound size={27} /></span>
          <div>
            <p>Group space</p>
            <h2>{chat.name}</h2>
            <small>{chat.members.length} members</small>
          </div>
          <button type="button" className="group-info-modal__close" onClick={onClose}>Close</button>
        </header>

        {isOwner && !isEditing && (
          <button type="button" className="group-info-modal__edit" onClick={() => setIsEditing(true)}>
            <Pencil size={16} /> Edit group details
          </button>
        )}

        {isEditing ? (
          <GroupSettingsForm chat={chat} isSaving={isSavingDetails} onCancel={() => setIsEditing(false)} onSave={saveDetails} />
        ) : (
          <p className="group-info-modal__description">{chat.description || 'No group description yet.'}</p>
        )}

        <p className="group-info-modal__label">Members</p>
        <div className="group-info-modal__members">
          {chat.members.map((member) => {
            const memberId = member.user._id;
            const isChanging = changingUserId === memberId;

            return (
              <div key={memberId} className="group-info-modal__member">
                <p>
                  {member.user.displayName || member.user.username}
                  <span>{member.role}</span>
                </p>
                {(isOwner && member.role !== 'owner') || canRemove(member) ? (
                  <div className="group-info-modal__member-actions">
                    {isOwner && member.role !== 'owner' && (
                      <button type="button" disabled={isChanging} onClick={() => runMemberAction(memberId, () => updateGroupMemberRole(chat._id, memberId, member.role === 'admin' ? 'member' : 'admin'))}>
                        {member.role === 'admin' ? 'Make member' : 'Make admin'}
                      </button>
                    )}
                    {canRemove(member) && (
                      <button type="button" disabled={isChanging} onClick={() => runMemberAction(memberId, () => removeGroupMember(chat._id, memberId))}>
                        {isChanging ? 'Updating...' : 'Remove'}
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {canManageMembers && (
          <>
            <label className="group-info-modal__label" htmlFor="group-member-search">Add members</label>
            <input id="group-member-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users to add" />
            <div className="group-info-modal__results">
              {results.map((user) => (
                <button key={user._id} type="button" disabled={changingUserId === user._id} onClick={() => runMemberAction(user._id, () => addGroupMember(chat._id, user._id))}>
                  {changingUserId === user._id ? 'Adding...' : `Add ${user.displayName || user.username}`}
                </button>
              ))}
            </div>
          </>
        )}

        {isOwner && (
          <button type="button" className="group-info-modal__delete" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 size={16} /> Delete group
          </button>
        )}
        {error && <p className="group-info-modal__error">{error}</p>}
      </section>

      <DeleteGroupDialog
        key={isDeleteDialogOpen ? chat._id : 'closed'}
        groupName={chat.name}
        isDeleting={isDeleting}
        isOpen={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onDelete={permanentlyDeleteGroup}
      />
    </div>
  );
}

export default GroupInfoModal;
