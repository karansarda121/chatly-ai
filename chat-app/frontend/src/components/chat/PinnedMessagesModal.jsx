import { Pin, X } from 'lucide-react';
import './PinnedMessagesModal.css';

function messageDate(date) { return new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }
function PinnedMessagesModal({ messages, onClose, onSelect, onUnpin }) {
  return <div className="pinned-messages-modal" role="presentation" onMouseDown={onClose}><section className="pinned-messages-modal__dialog" role="dialog" aria-modal="true" aria-label="Pinned messages" onMouseDown={(event) => event.stopPropagation()}><header><span><Pin size={17}/><strong>Pinned messages</strong></span><button type="button" onClick={onClose} aria-label="Close pinned messages"><X size={18}/></button></header>{messages.map((message) => <article key={message._id}><button type="button" className="pinned-messages-modal__open" onClick={() => onSelect(message)}><strong>{message.sender?.displayName || message.sender?.username}</strong><span>{message.text || `Shared ${message.type}`}</span><small>{messageDate(message.createdAt)}</small></button><button type="button" className="pinned-messages-modal__unpin" onClick={() => onUnpin(message)}>Unpin</button></article>)}</section></div>;
}
export default PinnedMessagesModal;