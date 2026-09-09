import { Bookmark, ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSavedChatMessages, toggleSavedChatMessage } from '../../services/chatService.js';
import './SavedMessagesModal.css';

function savedDate(date) { return new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }
function SavedMessagesModal({ isOpen, onClose, onOpenChat }) {
  const [items, setItems] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  useEffect(() => { if (!isOpen) return; setLoading(true); setError(''); getSavedChatMessages().then(setItems).catch(() => setError('Could not load saved messages.')).finally(() => setLoading(false)); }, [isOpen]);
  async function remove(item) { try { await toggleSavedChatMessage(item.message._id); setItems((current) => current.filter((saved) => saved._id !== item._id)); } catch { setError('Could not remove this saved message.'); } }
  if (!isOpen) return null;
  return <div className="saved-messages-modal" role="presentation" onMouseDown={onClose}><section className="saved-messages-modal__dialog" role="dialog" aria-modal="true" aria-label="Saved messages" onMouseDown={(event) => event.stopPropagation()}><header><span><Bookmark size={18}/><strong>Saved messages</strong></span><button type="button" onClick={onClose} aria-label="Close saved messages"><X size={18}/></button></header>{loading ? <p>Loading saved messages…</p> : error ? <p className="saved-messages-modal__error">{error}</p> : !items.length ? <p className="saved-messages-modal__empty">No saved messages yet.</p> : <div>{items.map((item) => { const message = item.message; const chat = message.chat; return <article key={item._id}><small>{chat?.type === 'group' ? chat.name : 'Direct chat'} · {message.sender?.displayName || message.sender?.username} · {savedDate(message.createdAt)}</small><p>{message.text || `Shared ${message.type}`}</p><footer><button type="button" onClick={() => { onOpenChat(chat?._id); onClose(); }}><ExternalLink size={14}/>Open chat</button><button type="button" onClick={() => remove(item)}>Remove</button></footer></article>; })}</div>}</section></div>;
}
export default SavedMessagesModal;