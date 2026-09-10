import { Check, Forward, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { forwardChatMessage, getChats } from '../../services/chatService.js';
import './ForwardMessageModal.css';

function memberId(member) {
  return String(member?.user?._id || member?.user || '');
}

function ForwardMessageModal({ currentUserId, message, onClose, sourceChatId }) {
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

  const availableChats = useMemo(() => chats.filter((chat) => {
    if (String(chat._id) === String(sourceChatId || message.chat?._id || message.chat)) return false;
    if (chat.type === 'group') return true;
    return chat.members?.some((member) => memberId(member) && memberId(member) !== String(currentUserId));
  }), [chats, currentUserId, message.chat, sourceChatId]);

  function chatName(chat) {
    if (chat.type === 'group') return chat.name || 'Unnamed group';
    const recipient = chat.members?.find((member) => memberId(member) !== String(currentUserId))?.user;
    return recipient?.displayName || recipient?.username || 'Direct chat';
  }

  function toggle(chatId) {
    setSelectedIds((current) => current.includes(chatId) ? current.filter((id) => id !== chatId) : [...current, chatId]);
  }

  async function forward() {
    if (!selectedIds.length || isForwarding) return;
    setIsForwarding(true);
    setError('');
    try {
      const forwarded = await forwardChatMessage(message._id, selectedIds);
      window.dispatchEvent(new CustomEvent('chatly:messages-forwarded', { detail: forwarded }));
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not forward this message.');
    } finally {
      setIsForwarding(false);
    }
  }

  return (
    <div className="forward-message-modal" role="presentation" onMouseDown={onClose}>
      <section className="forward-message-modal__dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Forward message">
        <header><div><strong>Forward message</strong><small>Select one or more other chats or groups</small></div><button type="button" onClick={onClose} aria-label="Close forward"><X size={18} /></button></header>
        <p className="forward-message-modal__preview">{message.text || `Shared ${message.type}`}</p>
        {isLoading ? <p>Loading chats...</p> : availableChats.length > 0 ? <div className="forward-message-modal__chats">{availableChats.map((chat) => { const selected = selectedIds.includes(chat._id); return <button type="button" key={chat._id} onClick={() => toggle(chat._id)} className={selected ? 'is-selected' : ''}><span>{chatName(chat)}</span>{selected && <Check size={16} />}</button>; })}</div> : <p className="forward-message-modal__empty">There are no other chats or groups to forward to.</p>}
        {error && <p className="forward-message-modal__error" role="alert">{error}</p>}
        <footer><button type="button" onClick={onClose}>Cancel</button><button type="button" onClick={forward} disabled={!selectedIds.length || isForwarding}>{isForwarding ? 'Forwarding...' : <><Forward size={15} /> Forward</>}</button></footer>
      </section>
    </div>
  );
}

export default ForwardMessageModal;