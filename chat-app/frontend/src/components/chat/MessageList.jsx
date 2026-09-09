import MessageBubble from './MessageBubble.jsx';
import { useCallback, useLayoutEffect, useRef } from 'react';
import useIntersectionObserver from '../../hooks/useIntersectionObserver.js';
import './MessageList.css';

function MessageList({ chatId, currentUserId, deletingMessageId, editingMessageId, hasMoreMessages, initialUnreadMessageId, isLoading, isLoadingOlder, messages, onAiTool, onCancelEdit, onDelete, onEdit, onForward, onLoadOlder, onPin, onReact, onReply, onSave, onStartEdit }) {
  const listRef = useRef(null);
  const olderMessagesSentinelRef = useRef(null);
  const wasNearBottomRef = useRef(true);
  const hasHandledInitialFocusRef = useRef(false);

  const loadOlderMessages = useCallback(async () => {
    const list = listRef.current;
    if (!list || isLoadingOlder || !hasMoreMessages) return;

    const previousHeight = list.scrollHeight;
    const previousTop = list.scrollTop;
    const didLoad = await onLoadOlder();
    if (didLoad) {
      requestAnimationFrame(() => {
        list.scrollTop = list.scrollHeight - previousHeight + previousTop;
      });
    }
  }, [hasMoreMessages, isLoadingOlder, onLoadOlder]);

  useIntersectionObserver({
    enabled: !isLoading && hasMoreMessages && !isLoadingOlder,
    onIntersect: loadOlderMessages,
    rootRef: listRef,
    targetRef: olderMessagesSentinelRef,
  });

  function handleScroll() {
    const list = listRef.current;
    if (!list) return;

    const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
    wasNearBottomRef.current = distanceFromBottom < 80;
  }

  useLayoutEffect(() => {
    // Each new chat must start at its newest message, even if the previous
    // chat was being read higher up in its history.
    wasNearBottomRef.current = true;
    hasHandledInitialFocusRef.current = false;
  }, [chatId]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || isLoading) return;

    if (!hasHandledInitialFocusRef.current && initialUnreadMessageId) {
      const firstUnreadMessage = document.getElementById(`message-${initialUnreadMessageId}`);
      if (firstUnreadMessage) {
        firstUnreadMessage.scrollIntoView({ block: 'start' });
        wasNearBottomRef.current = false;
        hasHandledInitialFocusRef.current = true;
        return;
      }
    }

    if (!wasNearBottomRef.current) return;

    function scrollToLatestMessage() {
      list.scrollTop = list.scrollHeight;
    }

    // Run once immediately and once after the browser has completed layout.
    // The second pass handles images or fonts changing message heights.
    scrollToLatestMessage();
    const frameId = requestAnimationFrame(scrollToLatestMessage);
    return () => cancelAnimationFrame(frameId);
  }, [chatId, initialUnreadMessageId, isLoading, messages.length]);

  if (isLoading) return <div className="message-list__status">Loading messagesâ€¦</div>;
  if (messages.length === 0) return <div className="message-list__status">No messages yet. Send the first one.</div>;

  return (
    <section ref={listRef} className="message-list" aria-label="Messages" onScroll={handleScroll}>
      <div ref={olderMessagesSentinelRef} className="message-list__history-sentinel" aria-hidden="true" />
      {isLoadingOlder && <p className="message-list__history-status">Loading older messages...</p>}
      {messages.map((message, index) => (
        <MessageBubble key={message._id} currentUserId={currentUserId} isDeleting={deletingMessageId === message._id} isEditing={editingMessageId === message._id} message={message} recentContext={messages.slice(Math.max(0, index - 5), index).map((item) => `${item.sender?.displayName || item.sender?.username || 'User'}: ${item.text || ''}`)} onAiTool={onAiTool} onCancelEdit={onCancelEdit} onDelete={(scope) => onDelete(message._id, scope)} onEdit={onEdit} onForward={onForward} onPin={onPin} onReact={(emoji) => onReact(message._id, emoji)} onReply={() => onReply(message)} onSave={onSave} onStartEdit={() => onStartEdit(message._id)} />
      ))}
    </section>
  );
}

export default MessageList;
