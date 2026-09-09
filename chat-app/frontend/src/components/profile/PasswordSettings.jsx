import { KeyRound, X } from 'lucide-react';
import { useRef, useState } from 'react';

import useClickOutside from '../../hooks/useClickOutside.js';
import ChangePasswordForm from './ChangePasswordForm.jsx';
import './PasswordSettings.css';

function PasswordSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef(null);

  useClickOutside(dialogRef, () => setIsOpen(false));

  return (
    <section className="password-settings">
      <h2><KeyRound size={19} /> Password</h2>
      <p>Update your password securely whenever you need to.</p>
      <button type="button" onClick={() => setIsOpen(true)}>Change password</button>

      {isOpen && <div className="password-settings__overlay" role="presentation"><section ref={dialogRef} className="password-settings__dialog" role="dialog" aria-modal="true" aria-label="Change password"><header><div><h2>Change password</h2><p>Enter your current password before choosing a new one.</p></div><button type="button" onClick={() => setIsOpen(false)} aria-label="Close password dialog"><X size={19} /></button></header><ChangePasswordForm /></section></div>}
    </section>
  );
}

export default PasswordSettings;
