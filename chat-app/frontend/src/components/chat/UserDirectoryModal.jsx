import { X } from 'lucide-react';
import { useRef } from 'react';

import useClickOutside from '../../hooks/useClickOutside.js';
import './UserDirectoryModal.css';

function UserDirectoryModal({ children, isOpen, onClose }) {
  const dialogRef = useRef(null);

  useClickOutside(dialogRef, onClose);

  if (!isOpen) return null;

  return (
    <div className="user-directory-modal" role="presentation">
      <section ref={dialogRef} className="user-directory-modal__dialog" role="dialog" aria-modal="true" aria-label="Users">
        <header>
          <div><h2>New chat</h2><p>Choose a user to start a private conversation.</p></div>
          <button type="button" onClick={onClose} aria-label="Close user directory"><X size={20} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

export default UserDirectoryModal;
