import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ChatListItem from './ChatListItem.jsx';
import './ChatList.css';

function chatName(chat, currentUserId) {
  if (chat.type === 'group') return chat.name || '';
  const otherMember = chat.members.find((member) => String(member.user?._id) !== String(currentUserId))?.user;
  return `${otherMember?.displayName || ''} ${otherMember?.username || ''}`;
}

function ChatList({ activeChatId, chats, currentUserId, isLoading, onSelect }) {
  const listRef = useRef(null);
  const searchInputRef = useRef(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredChats = normalizedQuery ? chats.filter((chat) => chatName(chat, currentUserId).toLocaleLowerCase().includes(normalizedQuery)) : chats;

  useEffect(() => {
    if (!activeChatId) return;
    const selectedChat = listRef.current?.querySelector(`[data-chat-id="${activeChatId}"]`);
    selectedChat?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeChatId]);

  useEffect(() => { if (isSearchOpen) searchInputRef.current?.focus(); }, [isSearchOpen]);
  function closeSearch() { setQuery(''); setIsSearchOpen(false); }

  return <section ref={listRef} className="chat-list" aria-label="Your chats"><div className="chat-list__heading"><h2>Chats</h2><button type="button" className="chat-list__search-toggle" onClick={() => setIsSearchOpen(true)} aria-label="Search chats" title="Search chats"><Search size={17} /></button></div>{isSearchOpen && <div className="chat-list__search"><Search size={16} aria-hidden="true"/><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') closeSearch(); }} placeholder="Search chats" aria-label="Search chats by person or group"/><button type="button" onClick={closeSearch} aria-label="Close chat search" title="Close search"><X size={16}/></button></div>}{isLoading && <p>Loading chats…</p>}{!isLoading && chats.length === 0 && <p>No chats yet. Add a contact to start a conversation.</p>}{!isLoading && chats.length > 0 && filteredChats.length === 0 && <p className="chat-list__no-results">No chats found for “{query.trim()}”.</p>}{filteredChats.map((chat) => <ChatListItem key={chat._id} chat={chat} currentUserId={currentUserId} isActive={chat._id === activeChatId} onSelect={onSelect} />)}</section>;
}

export default ChatList;