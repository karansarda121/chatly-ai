import { Brain, ListChecks, MessageSquareText, Search, Sparkles, X } from 'lucide-react';
import { useRef, useState } from 'react';

import useClickOutside from '../../hooks/useClickOutside.js';
import './ConversationMemoryPanel.css';
import './ConversationMemoryDaily.css';

function formatMessageDate(date) {
  return new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function ConversationMemoryPanel({ error, isOpen, isSearching, isTaskActionOpen, onClose, onSearch, onSelectMessage, onTaskAction, result }) {
  const panelRef = useRef(null);
  const [query, setQuery] = useState('');
  const [inputError, setInputError] = useState('');
  const [taskMenuMessageId, setTaskMenuMessageId] = useState('');

  useClickOutside(panelRef, () => { if (!isTaskActionOpen) onClose(); });
  if (!isOpen) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (query.trim().length < 3) { setInputError('Enter at least 3 characters to ask AI.'); return; }
    setInputError(''); setTaskMenuMessageId('');
    await onSearch(query.trim());
  }

  function runTaskAction(mode, message) { setTaskMenuMessageId(''); onTaskAction(mode, message); }
  function sourceCard(message) {
    const isTaskMenuOpen = taskMenuMessageId === message._id;
    return <article className="conversation-memory-panel__source-card" key={message._id}><button type="button" className="conversation-memory-panel__source-message" onClick={() => onSelectMessage(message)}><strong>{message.sender?.displayName || message.sender?.username} · {formatMessageDate(message.createdAt)}</strong><span>{message.text}</span></button>{message.isTask && <div className="conversation-memory-panel__task-tools"><button type="button" className="conversation-memory-panel__use-ai" onClick={() => setTaskMenuMessageId(isTaskMenuOpen ? '' : message._id)}><Sparkles size={13}/>Use AI</button>{isTaskMenuOpen && <div className="conversation-memory-panel__task-menu"><button type="button" onClick={() => runTaskAction('explain_task', message)}><Brain size={13}/>Explain task</button><button type="button" onClick={() => runTaskAction('break_into_steps', message)}><ListChecks size={13}/>Break into steps</button><button type="button" onClick={() => runTaskAction('draft_reply', message)}><MessageSquareText size={13}/>Draft reply</button></div>}</div>}</article>;
  }

  return <aside ref={panelRef} className="conversation-memory-panel" aria-label="Ask this chat"><header><span><Brain size={18} /> Ask this chat</span><button type="button" onClick={onClose} aria-label="Close Ask this chat"><X size={18} /></button></header><form onSubmit={handleSubmit}><Search size={17} /><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setInputError(''); }} placeholder="Did I mention an idea about...?" maxLength="500"/><button type="submit" disabled={isSearching}>{isSearching ? 'Searching...' : 'Ask'}</button></form><p className="conversation-memory-panel__hint">Ask naturally—AI explains who said what and shows the supporting message.</p>{(inputError || error) && <p className="conversation-memory-panel__error">{inputError || error}</p>}{result && <div className="conversation-memory-panel__result"><p className="conversation-memory-panel__answer">{result.answer}</p>{result.dailySummaries?.length > 0 && <section><h3>Messages by day</h3>{result.dailySummaries.map((dailySummary) => <div key={dailySummary.date} className="conversation-memory-panel__daily-summary"><strong>{dailySummary.date}</strong><span>{dailySummary.summary}</span></div>)}</section>}{result.sources?.length > 0 && <section><h3>{result.sources.length === 1 ? 'Relevant message' : 'Relevant messages'}</h3><small className="conversation-memory-panel__source-hint">Open any message to view it in the chat.</small>{result.sources.map(sourceCard)}</section>}{!result.sources?.length && result.matches?.length > 0 && <section><h3>Most relevant message</h3>{result.matches.map(sourceCard)}</section>}{result.isTruncated && <small>Showing matches from the most recent 500 searchable messages.</small>}<small>AI can be incorrect. Verify information using the messages above.</small></div>}</aside>;
}

export default ConversationMemoryPanel;