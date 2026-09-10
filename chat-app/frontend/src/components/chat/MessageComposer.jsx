import { LoaderCircle, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import useClickOutside from '../../hooks/useClickOutside.js';
import MediaPicker from './MediaPicker.jsx';
import './MessageComposer.css';
import './MentionPicker.css';

function MessageComposer({ draftText, isLoadingSmartReplies, isSending, isUploadingMedia, mediaUpload = null, members = [], onCancelMediaUpload, onCancelReply, onDismissMediaUpload, onDismissSmartReplies, onDraftApplied, onMediaSelect, onRetryMediaUpload, onSend, onTranslate, onTyping, onTypingStop, replyTo, smartReplySuggestions = [] }) {
  const [text, setText] = useState('');
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const translateMenuRef = useRef(null);
  const [language, setLanguage] = useState('Hindi');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState('');
  const [selectedMentions, setSelectedMentions] = useState([]);
  const [isMentionPickerDismissed, setIsMentionPickerDismissed] = useState(false);
  const mentionMatch = text.match(/@([a-zA-Z0-9_]*)$/);
  const mentionQuery = mentionMatch ? mentionMatch[1].toLowerCase() : null;
  const mentionSuggestions = mentionQuery === null ? [] : members.filter((member) => member?.username).filter((member) => member.username.toLowerCase().includes(mentionQuery) || (member.displayName || '').toLowerCase().includes(mentionQuery)).slice(0, 5);
  const displayNameCount = members.reduce((counts, member) => { const name = (member?.displayName || member?.username || '').trim().toLowerCase(); if (name) counts[name] = (counts[name] || 0) + 1; return counts; }, {});

  useEffect(() => { if (!draftText) return; setText(draftText); onDraftApplied(); }, [draftText, onDraftApplied]);
  useClickOutside(translateMenuRef, () => { if (isTranslateOpen) setIsTranslateOpen(false); });
  useEffect(() => { if (!isTranslateOpen) return undefined; const closeOnEscape = (event) => { if (event.key === 'Escape') setIsTranslateOpen(false); }; document.addEventListener('keydown', closeOnEscape); return () => document.removeEventListener('keydown', closeOnEscape); }, [isTranslateOpen]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!text.trim() || isSending) return;
    const messageText = text.trim();
    const mentionIds = selectedMentions.filter((mention) => messageText.includes(mention.token)).map((mention) => mention.id);
    const message = await onSend(messageText, mentionIds);
    if (message) { setText(''); setSelectedMentions([]); onTypingStop(); }
  }

  async function translateDraft() {
    if (!text.trim()) return;
    setIsTranslating(true); setTranslationError('');
    try { setText(await onTranslate(text.trim(), language)); setIsTranslateOpen(false); } catch (error) { setTranslationError(error.response?.data?.message || 'Could not translate this message.'); } finally { setIsTranslating(false); }
  }

  function insertMention(member) {
    const displayName = (member.displayName || member.username).trim();
    const token = `@${displayName}`;
    setText((currentText) => currentText.replace(/@([a-zA-Z0-9_]*)$/, `${token} `));
    setSelectedMentions((current) => [...current.filter((mention) => mention.id !== member._id), { id: member._id, token }]);
    onTyping();
  }

  function applySmartReply(suggestion) { setText(suggestion); onDismissSmartReplies(); onTyping(); }
  function cancelReply() { onDismissSmartReplies(); onCancelReply(); }

  return (
    <form className="message-composer" onSubmit={handleSubmit}>
      {replyTo && <div className="message-composer__reply"><span><strong>Replying to {replyTo.sender?.displayName || replyTo.sender?.username}</strong>{replyTo.text || `Shared ${replyTo.type}`}</span><button type="button" onClick={cancelReply} aria-label="Cancel reply"><X size={16} /></button></div>}
      {replyTo && (isLoadingSmartReplies || smartReplySuggestions.length > 0) && <section className="message-composer__smart-replies" aria-label="AI reply suggestions"><div><span><Sparkles size={14} /> Smart replies</span><button type="button" onClick={onDismissSmartReplies} aria-label="Dismiss smart replies"><X size={14} /></button></div>{isLoadingSmartReplies ? <small>Thinking of a few ways to reply...</small> : <div className="message-composer__smart-reply-chips">{smartReplySuggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => applySmartReply(suggestion)}>{suggestion}</button>)}</div>}</section>}
      <MediaPicker canTranslate={Boolean(text.trim())} disabled={isSending || isUploadingMedia} onOpenTranslate={() => setIsTranslateOpen(true)} onSelect={onMediaSelect} />
      {!isMentionPickerDismissed && mentionSuggestions.length > 0 && <div className="message-composer__mentions" role="listbox" aria-label="Tag a member"><button type="button" className="message-composer__mentions-close" onClick={() => setIsMentionPickerDismissed(true)} aria-label="Close tag suggestions"><X size={15} /></button>{mentionSuggestions.map((member) => { const displayName = member.displayName || member.username; const isAmbiguous = displayNameCount[displayName.trim().toLowerCase()] > 1; return <button type="button" role="option" key={member._id || member.username} onMouseDown={(event) => event.preventDefault()} onClick={() => insertMention(member)}><span>@{displayName}</span>{isAmbiguous && <small>({member.username})</small>}</button>; })}</div>}
      <div className="message-composer__input-wrap">
        <input value={text} onChange={(event) => { setText(event.target.value); setIsMentionPickerDismissed(false); onTyping(); }} placeholder="Write a message" maxLength="2000" disabled={isUploadingMedia} />
        {mediaUpload && <div className={`message-composer__upload-status message-composer__upload-status--${mediaUpload.status}`} role="status" aria-live="polite">
          {mediaUpload.status === 'failed' ? <strong>Upload failed</strong> : <LoaderCircle className="message-composer__upload-spinner" size={16} aria-hidden="true" />}
          <span><strong>{mediaUpload.status === 'sending' ? 'Sending attachment...' : mediaUpload.status === 'failed' ? 'Could not upload' : `Uploading ${mediaUpload.progress}%`}</strong><small>{mediaUpload.file.name}</small></span>
          {mediaUpload.status === 'failed' ? <><button type="button" className="message-composer__upload-action" onClick={onRetryMediaUpload} aria-label="Retry upload" title="Retry upload"><RotateCcw size={16} /></button><button type="button" className="message-composer__upload-action" onClick={onDismissMediaUpload} aria-label="Dismiss failed upload" title="Dismiss"><X size={16} /></button></> : <button type="button" className="message-composer__upload-action" onClick={onCancelMediaUpload} aria-label="Cancel upload" title="Cancel upload"><X size={17} /></button>}
          {mediaUpload.status === 'uploading' && <i style={{ width: `${mediaUpload.progress}%` }} />}
        </div>}
      </div>
      <button type="submit" disabled={isSending || isUploadingMedia || !text.trim()} aria-label={isUploadingMedia ? 'Uploading attachment' : 'Send message'} title={isUploadingMedia ? 'Uploading attachment...' : 'Send message'}>{isUploadingMedia ? <LoaderCircle className="message-composer__upload-spinner" size={18} aria-hidden="true" /> : <Send size={18} />}</button>      {isTranslateOpen && <div ref={translateMenuRef} className="message-composer__translate-menu" role="dialog" aria-label="Translate draft"><header><strong>Translate draft</strong><button type="button" onClick={() => setIsTranslateOpen(false)} aria-label="Close translation menu" title="Close"><X size={16}/></button></header><label>Translate to<select value={language} onChange={(event) => setLanguage(event.target.value)}><option>Hindi</option><option>English</option><option>Spanish</option><option>French</option><option>German</option><option>Arabic</option></select></label><button type="button" onClick={translateDraft} disabled={isTranslating}>{isTranslating ? 'Translating...' : 'Apply translation'}</button>{translationError && <small>{translationError}</small>}</div>}
    </form>
  );
}

export default MessageComposer;
