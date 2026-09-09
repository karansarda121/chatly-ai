import { Bookmark, CircleHelp, Clipboard, CornerUpLeft, Forward, Globe2, MoreVertical, Pin, Pencil, SmilePlus, Trash2 } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

import useClickOutside from '../../hooks/useClickOutside.js';
import ForwardMessageModal from './ForwardMessageModal.jsx';
import './MessageDeleteMenu.css';

function MessageDeleteMenu({ canEdit, isDeleting, isMine, isPinned, isSaved, message, onAiTool, onDelete, onEdit, onForward, onPin, onReact, onReply, onSave }) {
  const [isOpen, setIsOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState({});
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);
  const optionsRef = useRef(null);

  useClickOutside(menuRef, () => setIsOpen(false));

  async function copyText() {
    if (!message.text) return;
    try { await navigator.clipboard.writeText(message.text); } catch { const field = document.createElement('textarea'); field.value = message.text; document.body.append(field); field.select(); document.execCommand('copy'); field.remove(); }
    setCopied(true); window.setTimeout(() => setCopied(false), 1400); setIsOpen(false);
  }
  async function chooseScope(scope) {
    await onDelete(scope);
    setIsOpen(false);
  }

  useLayoutEffect(() => {
    if (!isOpen) return undefined;

    function positionPopup() {
      const bubble = menuRef.current?.closest('.message-bubble');
      const messageList = menuRef.current?.closest('.message-list');
      const popup = optionsRef.current;
      if (!bubble || !messageList || !popup) return;

      const bubbleRect = bubble.getBoundingClientRect();
      const listRect = messageList.getBoundingClientRect();
      if (bubbleRect.bottom <= listRect.top || bubbleRect.top >= listRect.bottom) {
        setIsOpen(false);
        return;
      }
      const visibleTop = Math.max(bubbleRect.top, listRect.top);
      const visibleBottom = Math.min(bubbleRect.bottom, listRect.bottom);
      const popupWidth = popup.offsetWidth;
      const popupHeight = popup.offsetHeight;
      const viewportPadding = 8;
      const preferredLeft = isMine ? bubbleRect.left - popupWidth : bubbleRect.right;
      const canFitBesideBubble = preferredLeft >= viewportPadding
        && preferredLeft + popupWidth <= window.innerWidth - viewportPadding;
      const preferredTop = visibleTop;
      const top = preferredTop + popupHeight <= listRect.bottom
        ? preferredTop
        : Math.max(listRect.top, visibleBottom - popupHeight);

      if (canFitBesideBubble) {
        setPopupStyle({ left: preferredLeft, top });
        return;
      }

      const canFitBelow = visibleBottom + popupHeight <= listRect.bottom;
      setPopupStyle({
        left: Math.min(Math.max(viewportPadding, bubbleRect.left), window.innerWidth - popupWidth - viewportPadding),
        top: canFitBelow ? visibleBottom : Math.max(listRect.top, visibleTop - popupHeight),
      });
    }

    positionPopup();
    window.addEventListener('resize', positionPopup);
    window.addEventListener('scroll', positionPopup, true);
    return () => {
      window.removeEventListener('resize', positionPopup);
      window.removeEventListener('scroll', positionPopup, true);
    };
  }, [isMine, isOpen, isReactionPickerOpen]);

  return (
    <div ref={menuRef} className={`message-delete-menu ${isMine ? 'message-delete-menu--mine' : ''} ${isOpen ? 'message-delete-menu--open' : ''}`}>
      <button type="button" onClick={() => setIsOpen((open) => !open)} aria-label="Message options" disabled={isDeleting}>
        <MoreVertical size={16} />
      </button>
      {isOpen && (
        <div ref={optionsRef} className="message-delete-menu__options" style={popupStyle}>
          <button type="button" onClick={() => { onReply(); setIsOpen(false); }}><CornerUpLeft size={14} />Reply</button>
          <button type="button" onClick={() => { onForward(); setIsOpen(false); setIsForwardOpen(true); }}><Forward size={14} />Forward</button>
          {message.text && <button type="button" onClick={copyText}><Clipboard size={14} />{copied ? 'Copied' : 'Copy text'}</button>}
          <button type="button" onClick={() => { onPin(); setIsOpen(false); }}><Pin size={14} />{isPinned ? 'Unpin message' : 'Pin message'}</button>
          <button type="button" onClick={() => { onSave(); setIsOpen(false); }}><Bookmark size={14} />{isSaved ? 'Remove from saved' : 'Save message'}</button>

          <button type="button" onClick={() => { onAiTool('translate'); setIsOpen(false); }}><Globe2 size={14} />Translate text with AI</button>
          <button type="button" onClick={() => { onAiTool('explain_simply'); setIsOpen(false); }}><CircleHelp size={14} />Explain with AI</button>
          {canEdit && <button type="button" onClick={() => { onEdit(); setIsOpen(false); }}><Pencil size={14} />Edit message</button>}
          <button type="button" onClick={() => setIsReactionPickerOpen((open) => !open)}><SmilePlus size={14} />React</button>
          {isReactionPickerOpen && <div className="message-delete-menu__reaction-picker" aria-label="Choose a reaction">{['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => <button key={emoji} type="button" aria-label={`React ${emoji}`} onClick={() => { onReact(emoji); setIsReactionPickerOpen(false); setIsOpen(false); }}>{emoji}</button>)}</div>}
          <button type="button" onClick={() => chooseScope('me')}><Trash2 size={14} />Delete for me</button>
          {isMine && <button type="button" onClick={() => chooseScope('everyone')}><Trash2 size={14} />Delete for everyone</button>}
        </div>
      )}
      {isForwardOpen && <ForwardMessageModal message={message} onClose={() => setIsForwardOpen(false)} />}
    </div>
  );
}

export default MessageDeleteMenu;
