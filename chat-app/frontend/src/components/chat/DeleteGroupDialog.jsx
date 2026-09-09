import { useRef, useState } from 'react';

import useClickOutside from '../../hooks/useClickOutside.js';

function DeleteGroupDialog({ groupName, isDeleting, isOpen, onCancel, onDelete }) {
  const dialogRef = useRef(null);
  const [confirmation, setConfirmation] = useState('');

  useClickOutside(dialogRef, onCancel);

  if (!isOpen) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (confirmation !== 'DELETE') return;
    await onDelete();
  }

  return (
    <div className="delete-group-dialog" role="presentation">
      <form ref={dialogRef} className="delete-group-dialog__card" onSubmit={handleSubmit}>
        <h3>Delete “{groupName}”?</h3>
        <p>This permanently deletes the group, its messages, and its uploaded media for every member.</p>
        <label htmlFor="delete-group-confirmation">Type DELETE to confirm</label>
        <input
          id="delete-group-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
        />
        <div className="delete-group-dialog__actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="submit" disabled={isDeleting || confirmation !== 'DELETE'}>
            {isDeleting ? 'Deleting...' : 'Delete group'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DeleteGroupDialog;
