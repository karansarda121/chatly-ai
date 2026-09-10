import { Check, CheckCheck, Forward, Pin } from 'lucide-react';
import { useEffect, useState } from 'react';

import MediaContent from './MediaContent.jsx';
import MessageDeleteMenu from './MessageDeleteMenu.jsx';
import './MessageBubble.css';

function hasOtherUser(values, currentUserId) {
  return values?.some((user) => String(user._id || user) !== currentUserId);
}

function MessageBubble({ currentUserId, isDeleting, isEditing, message, recentContext, onAiTool, onCancelEdit, onDelete, onEdit, onForward = () => {}, onPin, onReact, onReply, onSave, onStartEdit }) {
  const isMine = String(message.sender?._id || message.sender) === String(currentUserId);
  const [editedText, setEditedText] = useState(message.text || '');
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const isRead = hasOtherUser(message.readBy, currentUserId);
  const isDelivered = hasOtherUser(message.deliveredTo, currentUserId);

  useEffect(() => {
    if (isEditing) setEditedText(message.text || '');
  }, [isEditing, message.text]);

  async function handleEditSubmit(event) {
    event.preventDefault();
    if (!editedText.trim()) return;
    await onEdit(message._id, editedText.trim());
  }

  return (
    <article id={`message-${message._id}`} className={`message-bubble ${isMine ? 'message-bubble--mine' : ''}`}>
      {!message.isDeletedForEveryone && <MessageDeleteMenu currentUserId={currentUserId} canEdit={isMine && message.type === 'text'} isDeleting={isDeleting} isMine={isMine} isPinned={Boolean(message.isPinned)} isSaved={Boolean(message.isSaved)} message={message} onAiTool={(mode) => onAiTool(mode, message, recentContext)} onDelete={onDelete} onEdit={onStartEdit} onForward={() => onForward(message)} onPin={() => onPin(message._id)} onReact={onReact} onSave={() => onSave(message._id)} onReply={onReply} />}
      {!isMine && <strong>{message.sender?.displayName || message.sender?.username}</strong>}
      {message.isPinned && <span className="message-bubble__pinned"><Pin size={11} />Pinned</span>}{message.forwardedFrom?.message && <span className="message-bubble__forwarded"><Forward size={12} />Forwarded</span>}
      {message.replyTo && <div className="message-bubble__reply"><strong>{message.replyTo.sender?.displayName || message.replyTo.sender?.username || 'Message'}</strong><span>{message.replyTo.isDeletedForEveryone ? 'This message was deleted' : message.replyTo.text || `Shared ${message.replyTo.type}`}</span></div>}
      {message.isDeletedForEveryone ? <p className="message-bubble__deleted">This message was deleted</p> : isEditing ? <form className="message-bubble__edit" onSubmit={handleEditSubmit}><textarea value={editedText} onChange={(event) => setEditedText(event.target.value)} maxLength="2000" autoFocus /><span><button type="button" onClick={onCancelEdit}>Cancel</button><button type="submit">Save</button></span></form> : <>{message.media && <MediaContent media={message.media} />}{message.text && <p>{message.text}</p>}</>}
      {message.reactions?.length > 0 && <div className="message-bubble__reactions">{[...new Set(message.reactions.map((reaction) => reaction.emoji))].map((emoji) => <span key={emoji}>{emoji} {message.reactions.filter((reaction) => reaction.emoji === emoji).length}</span>)}</div>}
      <time dateTime={message.createdAt}>
        {time}
        {message.editedAt && <em>edited</em>}
        {isMine && (isRead ? <CheckCheck className="message-bubble__read" size={15} /> : isDelivered ? <CheckCheck size={15} /> : <Check size={15} />)}
      </time>
    </article>
  );
}

export default MessageBubble;
