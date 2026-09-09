import { Bell } from 'lucide-react';
import { useState } from 'react';

import { areNotificationsEnabled, getNotificationPermission, requestNotificationPermission, setNotificationsEnabled } from '../../services/notificationService.js';
import './NotificationSettings.css';

function NotificationSettings() {
  const [permission, setPermission] = useState(getNotificationPermission);
  const [isEnabled, setIsEnabled] = useState(areNotificationsEnabled);

  async function enableNotifications() {
    const nextPermission = await requestNotificationPermission();
    setPermission(nextPermission);
    setIsEnabled(nextPermission === 'granted');
  }

  const unsupported = permission === 'unsupported';
  const denied = permission === 'denied';

  return (
    <section className="notification-settings">
      <h2><Bell size={19} /> Browser notifications</h2>
      <p>{unsupported ? 'This browser does not support notifications.' : denied ? 'Notifications are blocked in your browser settings.' : isEnabled ? 'Notifications are enabled for new messages when Chatly AI is not active.' : 'Get notified about new messages when this browser tab is not active.'}</p>
      {!unsupported && permission !== 'granted' && <button type="button" onClick={enableNotifications} disabled={denied}>{denied ? 'Blocked by browser' : 'Enable notifications'}</button>}
      {permission === 'granted' && <button type="button" onClick={() => { setNotificationsEnabled(!isEnabled); setIsEnabled(!isEnabled); }}>{isEnabled ? 'Disable notifications' : 'Enable notifications'}</button>}
    </section>
  );
}

export default NotificationSettings;
