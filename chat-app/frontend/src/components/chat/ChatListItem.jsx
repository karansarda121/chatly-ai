import { UsersRound } from 'lucide-react';

import UserAvatar from '../common/UserAvatar.jsx';
import './ChatListItem.css';

function ChatListItem({ chat, currentUserId, isActive, onSelect }) {
  const otherMember = chat.members.find(
    (member) => member.user?._id !== currentUserId,
  )?.user;
  const isGroup = chat.type === 'group';
  const displayName = isGroup ? chat.name : otherMember?.displayName || otherMember?.username || 'Unknown user';
  const unreadCount = chat.unreadCount || 0;
  const lastMessage = chat.lastMessage;
  const lastMessagePreview = lastMessage?.isDeletedForEveryone
    ? 'This message was deleted'
    : lastMessage?.type === 'image'
      ? 'Photo'
      : lastMessage?.type === 'video'
        ? 'Video'
        : lastMessage?.type === 'file'
          ? `File: ${lastMessage.media?.fileName || 'Document'}`
          : lastMessage?.text || 'No messages yet';

  return (
    <button
      type="button"
      data-chat-id={chat._id}
      className={`chat-list-item ${isActive ? 'chat-list-item--active' : ''}`}
      onClick={() => onSelect(chat)}
    >
      <span className="chat-list-item__picture">
        {isGroup ? <UsersRound size={22} /> : <UserAvatar user={otherMember} />}
        {!isGroup && otherMember?.isOnline && <i className="chat-list-item__online" aria-label="Online" />}
      </span>

      <span className="chat-list-item__details">
        <strong>{displayName}</strong>
        <small>{lastMessagePreview}</small>
      </span>
      {unreadCount > 0 && <span className="chat-list-item__unread" aria-label={`${unreadCount} unread messages`}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </button>
  );
}

export default ChatListItem;

