import { Check, Forward, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { forwardChatMessage, getChats } from '../../services/chatService.js';
import './ForwardMessageModal.css';

function ForwardMessageModal({ message, onClose }) {
  const [chats, setChats] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isForwarding, setIsForwarding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getChats().then(setChats).catch(() => setError('Could not load your chats.')).finally(() => setIsLoading(false));
    function closeOnEscape(event) { if (event.key === 'Escape') onClose(); }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  function toggle(chatId) {
    setSelectedIds((current) => current.includes(chatId) ? current.filter((id) => id !== chatId) : [...current, chatId]);
  }

  async function forward() {
    if (!selectedIds.length || isForwarding) return;
    setIsForwarding(true); setError('');
    try { const forwarded = await forwardChatMessage(message._id, selectedIds); window.dispatchEvent(new CustomEvent('chatly:messages-forwarded', { detail: forwarded })); onClose(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Could not forward this message.'); }
    finally { setIsForwarding(false); }
  }

  return <div className="forward-message-modal" role="presentation" onMouseDown={onClose}><section className="forward-message-modal__dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Forward message"><header><div><strong>Forward message</strong><small>Select one or more chats</small></div><button type="button" onClick={onClose} aria-label="Close forward"><X size={18} /></button></header><p className="forward-message-modal__preview">{message.text || `Shared ${message.type}`}</p>{isLoading ? <p>Loading chatsâ€¦</p> : <div className="forward-message-modal__chats">{chats.map((chat) => { const selected = selectedIds.includes(chat._id); const other = chat.members?.find((member) => member.user?._id !== message.sender?._id)?.user; const name = chat.type === 'group' ? chat.name : other?.displayName || other?.username || 'Direct chat'; return <button type="button" key={chat._id} onClick={() => toggle(chat._id)} className={selected ? 'is-selected' : ''}><span>{name}</span>{selected && <Check size={16} />}</button>; })}</div>}{error && <p className="forward-message-modal__error">{error}</p>}<footer><button type="button" onClick={onClose}>Cancel</button><button type="button" onClick={forward} disabled={!selectedIds.length || isForwarding}>{isForwarding ? 'Forwardingâ€¦' : <><Forward size={15} /> Forward</>}</button></footer></section></div>;
}

export default ForwardMessageModal;

