import { Ban, Search, Sparkles, Unlock, UsersRound } from 'lucide-react';

import UserAvatar from '../common/UserAvatar.jsx';
import './ChatHeader.css';

function ChatHeader({ chat, currentUserId, isOtherUserBlocked, onToggleBlockUser, onOpenAiAssistant, onOpenGroupInfo, onOpenSearch, presence }) {
  const otherMember = chat.members.find(
    (member) => member.user?._id !== currentUserId,
  )?.user;
  const isGroup = chat.type === 'group';
  const displayName = isGroup ? chat.name : otherMember?.displayName || otherMember?.username || 'Unknown user';
  const isOnline = presence?.isOnline ?? otherMember?.isOnline;
  const lastSeen = presence?.lastSeen || otherMember?.lastSeen;
  const status = isGroup
    ? `${chat.members.length} members`
    : isOnline
    ? 'Online'
    : lastSeen
      ? `Last seen ${new Date(lastSeen).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`
      : 'Offline';

  return (
    <header className={`chat-header ${isGroup ? 'chat-header--group' : ''}`}>
      <span className="chat-header__picture">
        {isGroup ? <UsersRound size={22} /> : <UserAvatar user={otherMember} />}
      </span>
      <span>
        <h1>{displayName}</h1>
        <p>{status}</p>
      </span>
      {isGroup && <button type="button" className="chat-header__group-info" onClick={onOpenGroupInfo}>Group info</button>}
      <button type="button" className="chat-header__memory" onClick={onOpenAiAssistant}><Sparkles size={16} /> AI Assistant</button>
      {!isGroup && !otherMember?.isSystemBot && <button type="button" className={`chat-header__block ${isOtherUserBlocked ? 'chat-header__block--active' : ''}`} onClick={() => onToggleBlockUser(otherMember)} aria-label={`${isOtherUserBlocked ? 'Unblock' : 'Block'} ${displayName}`} title={`${isOtherUserBlocked ? 'Unblock' : 'Block'} ${displayName}`}>{isOtherUserBlocked ? <Unlock size={17} /> : <Ban size={17} />}</button>}
      <button type="button" className="chat-header__search" onClick={onOpenSearch} aria-label="Search messages"><Search size={19} /></button>
    </header>
  );
}

export default ChatHeader;
