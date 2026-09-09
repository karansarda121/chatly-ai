import { Search } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import useIntersectionObserver from '../../hooks/useIntersectionObserver.js';
import './UserSearch.css';
import UserAvatar from '../common/UserAvatar.jsx';

function UserSearch({ hasMoreUsers, isCreatingChat, isLoadingMoreUsers, isLoadingUsers, isSearching, onAddContact, onLoadMore, onReset, onSearch, onStartChat, results }) {
  const [query, setQuery] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const resultsRef = useRef(null);
  const usersSentinelRef = useRef(null);

  const loadMoreUsers = useCallback(() => {
    if (!isLoadingMoreUsers && !isSearching && hasMoreUsers) onLoadMore();
  }, [hasMoreUsers, isLoadingMoreUsers, isSearching, onLoadMore]);

  useIntersectionObserver({
    enabled: !isLoadingUsers && !isSearching && !isLoadingMoreUsers && hasMoreUsers,
    onIntersect: loadMoreUsers,
    rootRef: resultsRef,
    targetRef: usersSentinelRef,
  });

  async function handleSubmit(event) {
    event.preventDefault();
    if (!query.trim()) return;

    setHasSearched(true);
    await onSearch(query.trim());
  }

  async function handleStartChat(userId) {
    const chat = await onStartChat(userId);
    if (chat) setQuery('');
  }

  async function handleAddContact(event) {
    event.preventDefault();
    if (!contactEmail.trim() || isAddingContact) return;
    setIsAddingContact(true);
    const added = await onAddContact(contactEmail.trim());
    if (added) setContactEmail('');
    setIsAddingContact(false);
  }

  return (
    <section className="user-search" aria-label="Start a new chat">
      <form className="user-search__form" onSubmit={handleAddContact}>
        <label className="user-search__label" htmlFor="contact-email-input">Add a contact</label>
        <div className="user-search__input-wrap">
          <Search size={17} aria-hidden="true" />
          <input id="contact-email-input" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="Enter their registered email" maxLength="254" />
          <button type="submit" disabled={isAddingContact || !contactEmail.trim()}>{isAddingContact ? 'Adding…' : 'Add'}</button>
        </div>
        <p className="user-search__status">Only contacts you add can be seen here or invited to groups.</p>
      </form>
      <form className="user-search__form" onSubmit={handleSubmit}>
        <label className="user-search__label" htmlFor="user-search-input">
          Your contacts
        </label>

        <div className="user-search__input-wrap">
          <Search size={17} aria-hidden="true" />
          <input
            id="user-search-input"
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              if (!nextQuery.trim()) {
                setHasSearched(false);
                onReset();
              }
            }}
            placeholder="Search contacts"
            maxLength="50"
          />
          <button type="submit" disabled={isSearching || !query.trim()}>
            {isSearching ? '…' : 'Search'}
          </button>
        </div>
      </form>

      {isLoadingUsers && <p className="user-search__status">Loading users…</p>}
      {isSearching && <p className="user-search__status">Searching users…</p>}

      {!isSearching && results.length > 0 && (
        <ul ref={resultsRef} className="user-search__results">
          {results.map((result) => (
            <li key={result._id}>
              <span className="user-search__picture">
                <UserAvatar user={result} />
              </span>

              <span className="user-search__details">
                <strong>{result.displayName || result.username}</strong>
                <small>@{result.username}</small>
              </span>

              <button
                type="button"
                onClick={() => handleStartChat(result._id)}
                disabled={isCreatingChat}
              >
                {isCreatingChat ? 'Opening…' : 'Chat'}
              </button>
            </li>
          ))}
          <li ref={usersSentinelRef} className="user-search__sentinel" aria-hidden="true" />
        </ul>
      )}

      {isLoadingMoreUsers && <p className="user-search__status">Loading more users...</p>}

      {!isLoadingUsers && !isSearching && hasSearched && results.length === 0 && (
        <p className="user-search__status">No users match this search.</p>
      )}

      {!isLoadingUsers && !isSearching && !hasSearched && results.length === 0 && (
        <p className="user-search__status">No contacts yet. Add someone using their email address.</p>
      )}
    </section>
  );
}

export default UserSearch;
