import { Brain, ListChecks, MessageSquareText, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import './MessageAiResultModal.css';

const languages = ['Hindi', 'English', 'Spanish', 'French', 'German', 'Arabic'];
const actionDetails = {
  translate: { Icon: null, title: 'Translate message', resultTitle: 'Translation', loading: 'Translating your message…' },
  explain_simply: { Icon: Sparkles, title: 'Explain with AI', resultTitle: 'Simple explanation', loading: 'Making this easier to understand…' },
  explain_task: { Icon: Brain, title: 'Explain task', resultTitle: 'Task explanation', loading: 'Explaining this task…' },
  break_into_steps: { Icon: ListChecks, title: 'Break into steps', resultTitle: 'Suggested steps', loading: 'Creating practical steps…' },
  draft_reply: { Icon: MessageSquareText, title: 'Draft reply', resultTitle: 'Reply draft', loading: 'Writing a reply draft…' },
};

function MessageAiResultModal({ action, onApplyDraft, onClose, onTranslate }) {
  const [language, setLanguage] = useState('Hindi');
  useEffect(() => { setLanguage(action?.targetLanguage || 'Hindi'); }, [action?.targetLanguage]);
  useEffect(() => { function closeOnEscape(event) { if (event.key === 'Escape') onClose(); } window.addEventListener('keydown', closeOnEscape); return () => window.removeEventListener('keydown', closeOnEscape); }, [onClose]);
  if (!action) return null;
  const details = actionDetails[action.mode] || actionDetails.explain_simply;
  const { Icon, title, resultTitle, loading } = details;
  const selectingLanguage = action.mode === 'translate' && action.needsLanguageSelection;
  return <div className="message-ai-result-modal" role="presentation" onMouseDown={onClose}><section className={`message-ai-result-modal__dialog${action.mode === 'translate' ? ' message-ai-result-modal__dialog--translate' : ''}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><header><span>{Icon && <Icon size={18}/>}<strong>{title}</strong></span><button type="button" onClick={onClose} aria-label={`Close ${title}`}><X size={18}/></button></header><section className="message-ai-result-modal__source"><small>Selected message</small><p>{action.sourceText}</p></section>{selectingLanguage ? <section className="message-ai-result-modal__language"><span><strong>Choose a language</strong><small>Translation is private and does not send a message.</small></span><div>{languages.map((item) => <button type="button" key={item} className={language === item ? 'is-selected' : ''} onClick={() => setLanguage(item)}>{item}</button>)}</div><button type="button" className="message-ai-result-modal__translate-button" onClick={() => onTranslate(language)}>Translate to {language}</button></section> : action.isLoading ? <div className="message-ai-result-modal__loading"><i/><span>{loading}</span></div> : action.error ? <p className="message-ai-result-modal__error">{action.error}</p> : <><section className="message-ai-result-modal__answer"><small>{action.mode === 'translate' ? `${action.targetLanguage} translation` : resultTitle}</small><p>{action.answer}</p></section>{action.isDraft && <button type="button" className="message-ai-result-modal__apply" onClick={onApplyDraft}><MessageSquareText size={16}/>Use in reply</button>}</>}</section></div>;
}

export default MessageAiResultModal;