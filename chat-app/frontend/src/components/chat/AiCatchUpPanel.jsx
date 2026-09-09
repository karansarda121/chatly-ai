import { Sparkles, X } from 'lucide-react';
import { useRef } from 'react';

import useClickOutside from '../../hooks/useClickOutside.js';
import './AiCatchUpPanel.css';

function AiCatchUpPanel({ error, isGenerating, isOpen, onClose, onGenerate, onSelectSource, summary, unreadCount }) {
  const panelRef = useRef(null);

  useClickOutside(panelRef, onClose);

  if (!isOpen) return null;

  return (
    <aside ref={panelRef} className="ai-catch-up-panel" aria-label="AI catch-up summary">
      <header>
        <span><Sparkles size={18} /> AI catch-up</span>
        <button type="button" onClick={onClose} aria-label="Close AI catch-up"><X size={18} /></button>
      </header>

      {!summary && unreadCount > 0 && (
        <>
          <p>Summarize the {unreadCount} message{unreadCount === 1 ? '' : 's'} that were unread when you opened this chat.</p>
          <button type="button" className="ai-catch-up-panel__generate" disabled={isGenerating} onClick={onGenerate}>
            <Sparkles size={16} /> {isGenerating ? 'Creating summary...' : 'Generate catch-up'}
          </button>
        </>
      )}

      {!summary && unreadCount === 0 && <p>You are already caught up in this group.</p>}
      {error && <p className="ai-catch-up-panel__error">{error}</p>}

      {summary && (
        <div className="ai-catch-up-panel__summary">
          <p className="ai-catch-up-panel__overview">{summary.overview}</p>

          {summary.keyPoints.length > 0 && (
            <section>
              <h3>Key points</h3>
              <ul>{summary.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>
            </section>
          )}

          {summary.actionItems.length > 0 && (
            <section>
              <h3>Possible action items</h3>
              <ul>{summary.actionItems.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          )}

          {summary.sources.length > 0 && (
            <section>
              <h3>Sources</h3>
              {summary.sources.map((message) => (
                <button key={message._id} type="button" onClick={() => onSelectSource(message)}>
                  <strong>{message.sender?.displayName || message.sender?.username}</strong>
                  <span>{message.text || `${message.type} attachment`}</span>
                </button>
              ))}
            </section>
          )}
          <small>AI can be incorrect. Check the linked source messages before acting.</small>
        </div>
      )}
    </aside>
  );
}

export default AiCatchUpPanel;
