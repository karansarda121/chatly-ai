const NOTIFICATION_SETTING_KEY = 'chatly_notifications_enabled';

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function areNotificationsEnabled() {
  return isNotificationSupported()
    && Notification.permission === 'granted'
    && localStorage.getItem(NOTIFICATION_SETTING_KEY) === 'true';
}

export function setNotificationsEnabled(enabled) {
  localStorage.setItem(NOTIFICATION_SETTING_KEY, String(enabled));
}

export function getNotificationPermission() {
  return isNotificationSupported() ? Notification.permission : 'unsupported';
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission === 'granted') setNotificationsEnabled(true);
  return permission;
}

/** Lets the user verify browser permission before relying on realtime messages. */
export function showNotificationEnabledConfirmation() {
  if (!areNotificationsEnabled()) return false;

  new Notification('Chatly AI', {
    body: 'Notifications are enabled for this browser.',
    tag: 'chatly-notification-enabled',
  });
  return true;
}

/** Show a notification only for another user's message while this app is inactive. */
export function showChatNotification({ activeChatId, chat, currentUserId, message, onClick }) {
  const isViewingThisChat = document.visibilityState === 'visible'
    && document.hasFocus()
    && String(activeChatId) === String(chat._id);

  if (!isNotificationSupported()
    || Notification.permission !== 'granted'
    || !areNotificationsEnabled()
    || isViewingThisChat
    || String(message.sender?._id || message.sender) === String(currentUserId)) {
    return;
  }

  const senderName = message.sender?.displayName || message.sender?.username || 'New message';
  const isGroup = chat.type === 'group';
  const body = message.text || `Sent a ${message.type === 'video' ? 'video' : 'photo'}`;
  const notification = new Notification(isGroup ? chat.name : senderName, {
    body: isGroup ? `${senderName}: ${body}` : body,
    icon: message.sender?.avatarUrl || undefined,
    tag: `chatly-chat-${chat._id}`,
  });

  notification.onclick = () => {
    window.focus();
    onClick();
    notification.close();
  };
}
