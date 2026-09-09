import { Search, X } from 'lucide-react';
import { useState } from 'react';

import './MessageSearch.css';

function MessageSearch({ isSearching, onClose, onSearch, onSelect, results }) {
  const [query, setQuery] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (query.trim()) await onSearch(query.trim());
  }

  return (
    <section className="message-search">
      <form onSubmit={handleSubmit}>
        <Search size={17} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search messages" />
        <button type="button" onClick={onClose} aria-label="Close search"><X size={18} /></button>
      </form>
      {isSearching && <p>Searching…</p>}
      {!isSearching && results.map((message) => <button key={message._id} type="button" onClick={() => onSelect(message)}><strong>{message.sender?.displayName || message.sender?.username}</strong><span>{message.text}</span></button>)}
    </section>
  );
}

export default MessageSearch;
