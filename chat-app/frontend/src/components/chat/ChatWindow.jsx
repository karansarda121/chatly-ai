import { Pin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import ChatHeader from './ChatHeader.jsx';
import AiCatchUpPanel from './AiCatchUpPanel.jsx';
import ActionItemsPanel from './ActionItemsPanel.jsx';
import CreateWorkItemModal from './CreateWorkItemModal.jsx';
import ConversationMemoryPanel from './ConversationMemoryPanel.jsx';
import MessageComposer from './MessageComposer.jsx';
import MessageAiResultModal from './MessageAiResultModal.jsx';
import MessageList from './MessageList.jsx';
import PinnedMessagesModal from './PinnedMessagesModal.jsx';
import MessageSearch from './MessageSearch.jsx';
import GroupInfoModal from './GroupInfoModal.jsx';
import { deleteChatMessage, editTextMessage, findWorkspaceInsights, getMessages, getPinnedChatMessages, getSmartReplySuggestions, markChatRead, searchConversationMemory, searchMessages, sendMediaMessage, sendTextMessage, summarizeUnreadGroupMessages, togglePinnedChatMessage, toggleMessageReaction, toggleSavedChatMessage, uploadChatMedia, runMessageAiTool } from '../../services/chatService.js';
import { getSocket } from '../../services/socket.js';
import { createWorkItem } from '../../services/workItemService.js';
import { blockUser, getBlockedUsers, unblockUser } from '../../services/userService.js';
import './AiPanels.css';
import './ChatWindow.css';

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

function ChatWindow({ chat, currentUserId, openedFromCatchUp = false, onChatDeleted, onChatUpdated, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [isPinnedMessagesOpen, setIsPinnedMessagesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [nextMessageCursor, setNextMessageCursor] = useState(null);
  const [pendingScrollMessageId, setPendingScrollMessageId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUpload, setMediaUpload] = useState(null);
  const [deletingMessageId, setDeletingMessageId] = useState('');
  const [editingMessageId, setEditingMessageId] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [smartReplySuggestions, setSmartReplySuggestions] = useState([]);
  const [isLoadingSmartReplies, setIsLoadingSmartReplies] = useState(false);
  const [error, setError] = useState('');
  const [typingUserId, setTypingUserId] = useState('');
  const [presence, setPresence] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [initialUnreadMessageId, setInitialUnreadMessageId] = useState('');
  const [unreadMessageIds, setUnreadMessageIds] = useState([]);
  const [isCatchUpOpen, setIsCatchUpOpen] = useState(false);
  const [isGeneratingCatchUp, setIsGeneratingCatchUp] = useState(false);
  const [catchUpSummary, setCatchUpSummary] = useState(null);
  const [isActionItemsOpen, setIsActionItemsOpen] = useState(false);
  const [isFindingActionItems, setIsFindingActionItems] = useState(false);
  const [actionItemsResult, setActionItemsResult] = useState(null);
  const [workItemSuggestion, setWorkItemSuggestion] = useState(null);
  const [handledInsightIds, setHandledInsightIds] = useState(() => { try { const cutoff = Date.now() - (10 * 24 * 60 * 60 * 1000); const stored = JSON.parse(localStorage.getItem('chatly_handled_insights') || '{}'); return Object.entries(stored).filter(([, handledAt]) => handledAt > cutoff).sort(([, first], [, second]) => second - first).slice(0, 500).map(([id]) => id); } catch { return []; } });
  const [actionItemsError, setActionItemsError] = useState('');
  const [isConversationMemoryOpen, setIsConversationMemoryOpen] = useState(false);
  const [isSearchingConversationMemory, setIsSearchingConversationMemory] = useState(false);
  const [conversationMemoryError, setConversationMemoryError] = useState('');
  const [conversationMemoryResult, setConversationMemoryResult] = useState(null);
  const [messageAiAction, setMessageAiAction] = useState(null);
  const [composerDraft, setComposerDraft] = useState('');
  const [isOtherUserBlocked, setIsOtherUserBlocked] = useState(false);
  const isTyping = useRef(false);
  const hasJoinedChatRoom = useRef(false);
  const stopTypingTimer = useRef();
  const smartReplyRequestId = useRef(0);
  const remoteTypingTimer = useRef();
  const mediaUploadController = useRef(null);
  const mediaUploadRequestId = useRef(0);
  const otherMember = chat.members.find((member) => String(member.user?._id) !== String(currentUserId))?.user;
  const typingMember = chat.members.find((member) => String(member.user?._id) === String(typingUserId))?.user;

  useEffect(() => {
    async function loadMessages() {
      await Promise.resolve();
      setIsLoading(true);
      setError('');
      try {
        const [page, chatPins] = await Promise.all([getMessages(chat._id), getPinnedChatMessages(chat._id)]);
        setPinnedMessages(chatPins);
        const loadedMessages = page.messages;
        const unreadMessages = loadedMessages.filter((message) => {
          const sentByCurrentUser = String(message.sender?._id || message.sender) === String(currentUserId);
          const hasBeenRead = message.readBy?.some(
            (reader) => String(reader._id || reader) === String(currentUserId),
          );
          return !sentByCurrentUser && !hasBeenRead && !message.isDeletedForEveryone;
        });

        setInitialUnreadMessageId(unreadMessages[0]?._id || '');
        setUnreadMessageIds(unreadMessages.map((message) => message._id));
        setMessages(loadedMessages);
        setNextMessageCursor(page.nextCursor);
        if (!openedFromCatchUp) await markChatRead(chat._id);
      } catch (requestError) {
        setError(getErrorMessage(requestError, 'Could not load messages.'));
      } finally {
        setIsLoading(false);
      }
    }

    loadMessages();
  }, [chat._id, currentUserId, openedFromCatchUp]);

  useEffect(() => {
    if (chat.type !== 'direct' || !otherMember?._id || otherMember.isSystemBot) {
      setIsOtherUserBlocked(false);
      return undefined;
    }

    let isCurrent = true;
    getBlockedUsers()
      .then((users) => {
        if (isCurrent) setIsOtherUserBlocked(users.some((user) => user._id === otherMember._id));
      })
      .catch(() => {
        if (isCurrent) setIsOtherUserBlocked(false);
      });
    return () => { isCurrent = false; };
  }, [chat.type, otherMember?._id, otherMember?.isSystemBot]);

  async function loadOlderMessages() {
    if (!nextMessageCursor || isLoadingOlder) return false;

    setIsLoadingOlder(true);
    try {
      const page = await getMessages(chat._id, nextMessageCursor);
      setMessages((currentMessages) => {
        const existingIds = new Set(currentMessages.map((message) => message._id));
        return [...page.messages.filter((message) => !existingIds.has(message._id)), ...currentMessages];
      });
      setNextMessageCursor(page.nextCursor);
      return page.messages.length > 0;
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load older messages.'));
      return false;
    } finally {
      setIsLoadingOlder(false);
    }
  }

  useEffect(() => {
    if (!pendingScrollMessageId) return;
    const messageElement = document.getElementById(`message-${pendingScrollMessageId}`);
    if (!messageElement) return;
    messageElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setPendingScrollMessageId('');
  }, [messages, pendingScrollMessageId]);

  useEffect(() => {
    const socket = getSocket();

    function updateMessageReceipt(messageIds, userId, fieldName) {
      const ids = new Set(messageIds);
      setMessages((currentMessages) => currentMessages.map((message) => {
        if (!ids.has(message._id)) return message;
        const users = message[fieldName] || [];
        const exists = users.some((item) => String(item._id || item) === userId);
        return exists ? message : { ...message, [fieldName]: [...users, userId] };
      }));
    }

    function handleIncomingMessage({ chat: eventChat, message }) {
      if (eventChat._id !== chat._id) return;
      setMessages((currentMessages) => currentMessages.some((item) => item._id === message._id) ? currentMessages : [...currentMessages, message]);
      if (!openedFromCatchUp) markChatRead(chat._id);
    }

    function handleDelivered({ chatId, messageIds, recipientId }) {
      if (chatId === chat._id) updateMessageReceipt(messageIds, recipientId, 'deliveredTo');
    }

    function handleRead({ chatId, messageIds, readerId }) {
      if (chatId === chat._id) updateMessageReceipt(messageIds, readerId, 'readBy');
    }

    function handleTypingStart({ chatId, userId }) {
      if (chatId !== chat._id || userId === currentUserId) return;
      setTypingUserId(userId);
      clearTimeout(remoteTypingTimer.current);
      remoteTypingTimer.current = setTimeout(() => setTypingUserId(''), 1500);
    }

    function handleTypingStop({ chatId, userId }) {
      if (chatId === chat._id && userId !== currentUserId) setTypingUserId('');
    }

    function handlePresence({ userId, isOnline, lastSeen }) {
      if (String(userId) === String(otherMember?._id)) {
        setPresence({ isOnline, lastSeen: lastSeen || new Date().toISOString() });
      }
    }

    function handleDeleted({ chatId, messageId }) {
      if (chatId !== chat._id) return;
      setMessages((currentMessages) => currentMessages.map((message) => (
        message._id === messageId ? { ...message, text: '', media: null, isDeletedForEveryone: true } : message
      )));
    }

    function handleReaction({ chatId, messageId, reactions }) {
      if (chatId !== chat._id) return;
      setMessages((currentMessages) => currentMessages.map((message) => message._id === messageId ? { ...message, reactions } : message));
    }

    function handleMessageUpdated({ chatId, message }) {
      if (chatId !== chat._id) return;
      setMessages((currentMessages) => currentMessages.map((currentMessage) => (
        currentMessage._id === message._id ? { ...currentMessage, ...message } : currentMessage
      )));
    }

    hasJoinedChatRoom.current = false;
    socket.emit('chat:join', { chatId: chat._id }, ({ joined } = {}) => {
      hasJoinedChatRoom.current = Boolean(joined);
    });
    socket.on('chat:message', handleIncomingMessage);
    socket.on('messages:delivered', handleDelivered);
    socket.on('messages:read', handleRead);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('user:presence', handlePresence);
    socket.on('message:deleted', handleDeleted);
    socket.on('message:reaction', handleReaction);
    socket.on('message:updated', handleMessageUpdated);

    return () => {
      clearTimeout(stopTypingTimer.current);
      clearTimeout(remoteTypingTimer.current);
      hasJoinedChatRoom.current = false;
      socket.emit('typing:stop', { chatId: chat._id });
      socket.emit('chat:leave', { chatId: chat._id });
      socket.off('chat:message', handleIncomingMessage);
      socket.off('messages:delivered', handleDelivered);
      socket.off('messages:read', handleRead);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('user:presence', handlePresence);
      socket.off('message:deleted', handleDeleted);
      socket.off('message:reaction', handleReaction);
      socket.off('message:updated', handleMessageUpdated);
    };
  }, [chat._id, currentUserId, otherMember?._id]);

  function stopTyping() {
    clearTimeout(stopTypingTimer.current);
    if (!isTyping.current) return;
    getSocket().emit('typing:stop', { chatId: chat._id });
    isTyping.current = false;
  }

  function startTyping() {
    if (!hasJoinedChatRoom.current) return;

    if (!isTyping.current) {
      getSocket().emit('typing:start', { chatId: chat._id });
      isTyping.current = true;
    }
    clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(stopTyping, 1200);
  }

  async function handleSend(text, mentionIds = []) {
    setIsSending(true);
    setError('');
    try {
      const message = await sendTextMessage(chat._id, text, replyTo?._id, mentionIds);
      setMessages((currentMessages) => [...currentMessages, message]);
      onMessageSent(chat._id, message);
      setReplyTo(null);
      dismissSmartReplies();
      return message;
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not send the message.'));
      return null;
    } finally {
      setIsSending(false);
    }
  }

  function dismissSmartReplies() {
    smartReplyRequestId.current += 1;
    setIsLoadingSmartReplies(false);
    setSmartReplySuggestions([]);
  }

  function cancelReply() {
    dismissSmartReplies();
    setReplyTo(null);
  }

  async function handleReply(message) {
    setReplyTo(message);
    setSmartReplySuggestions([]);
    const requestId = smartReplyRequestId.current + 1;
    smartReplyRequestId.current = requestId;
    setIsLoadingSmartReplies(true);
    try {
      const suggestions = await getSmartReplySuggestions(chat._id, message._id);
      if (smartReplyRequestId.current === requestId) setSmartReplySuggestions(suggestions);
    } catch {
      // Suggestions are optional: a normal reply remains immediately available.
      if (smartReplyRequestId.current === requestId) setSmartReplySuggestions([]);
    } finally {
      if (smartReplyRequestId.current === requestId) setIsLoadingSmartReplies(false);
    }
  }
  async function handleToggleBlockUser(userToBlock) {
    if (!userToBlock?._id) return;
    const displayName = userToBlock.displayName || userToBlock.username;
    const action = isOtherUserBlocked ? 'Unblock' : 'Block';
    if (!window.confirm(`${action} ${displayName}?${isOtherUserBlocked ? '' : ' They will not be able to send you direct messages.'}`)) return;
    setError('');
    try {
      if (isOtherUserBlocked) {
        await unblockUser(userToBlock._id);
        setIsOtherUserBlocked(false);
        setError(`${displayName} is unblocked.`);
      } else {
        await blockUser(userToBlock._id);
        setIsOtherUserBlocked(true);
        setError(`${displayName} is blocked. Manage blocked users from Profile Settings.`);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, `Could not ${action.toLowerCase()} this user.`));
    }
  }

  async function handleMediaSelect(file) {
    const requestId = mediaUploadRequestId.current + 1;
    mediaUploadRequestId.current = requestId;
    const controller = new AbortController();
    mediaUploadController.current = controller;
    setIsUploadingMedia(true);
    setMediaUpload({ file, progress: 0, status: 'uploading' });
    setError('');

    try {
      const media = await uploadChatMedia(file, {
        signal: controller.signal,
        onProgress: (progress) => {
          if (mediaUploadRequestId.current === requestId) setMediaUpload((current) => current ? { ...current, progress } : current);
        },
      });
      if (mediaUploadRequestId.current !== requestId) return;

      setMediaUpload((current) => current ? { ...current, progress: 100, status: 'sending' } : current);
      const message = await sendMediaMessage(chat._id, media, replyTo?._id);
      if (mediaUploadRequestId.current !== requestId) return;

      setMessages((currentMessages) => [...currentMessages, message]);
      onMessageSent(chat._id, message);
      setReplyTo(null);
      dismissSmartReplies();
      setMediaUpload(null);
    } catch (requestError) {
      if (mediaUploadRequestId.current !== requestId) return;
      if (requestError.code === 'ERR_CANCELED' || requestError.name === 'CanceledError') {
        setMediaUpload(null);
        return;
      }
      setMediaUpload({ file, progress: 0, status: 'failed' });
      setError(getErrorMessage(requestError, 'Could not upload and send the media.'));
    } finally {
      if (mediaUploadRequestId.current === requestId) {
        mediaUploadController.current = null;
        setIsUploadingMedia(false);
      }
    }
  }

  function cancelMediaUpload() {
    mediaUploadRequestId.current += 1;
    mediaUploadController.current?.abort();
    mediaUploadController.current = null;
    setIsUploadingMedia(false);
    setMediaUpload(null);
    setError('');
  }

  function retryMediaUpload() {
    if (mediaUpload?.file) handleMediaSelect(mediaUpload.file);
  }
  async function handleDelete(messageId, scope) {
    setDeletingMessageId(messageId);
    setError('');
    try {
      await deleteChatMessage(chat._id, messageId, scope);
      setMessages((currentMessages) => (scope === 'me'
        ? currentMessages.filter((message) => message._id !== messageId)
        : currentMessages.map((message) => (message._id === messageId
          ? { ...message, text: '', media: null, isDeletedForEveryone: true }
          : message))));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not delete the message.'));
    } finally {
      setDeletingMessageId('');
    }
  }

  async function handleEdit(messageId, text) {
    setError('');
    try {
      const updatedMessage = await editTextMessage(chat._id, messageId, text);
      setMessages((currentMessages) => currentMessages.map((message) => (
        message._id === messageId ? { ...message, ...updatedMessage } : message
      )));
      setEditingMessageId('');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not edit the message.'));
    }
  }

  async function handlePin(messageId) {
    try { const result = await togglePinnedChatMessage(chat._id, messageId); setMessages((items) => items.map((message) => message._id === messageId ? { ...message, isPinned: result.isPinned } : message)); setPinnedMessages(await getPinnedChatMessages(chat._id)); } catch (requestError) { setError(getErrorMessage(requestError, 'Could not update the pinned message.')); }
  }

  async function handleSave(messageId) {
    try { const result = await toggleSavedChatMessage(messageId); setMessages((items) => items.map((message) => message._id === messageId ? { ...message, isSaved: result.isSaved } : message)); } catch (requestError) { setError(getErrorMessage(requestError, 'Could not save this message.')); }
  }
  async function handleReaction(messageId, emoji) {
    try {
      const reactions = await toggleMessageReaction(chat._id, messageId, emoji);
      setMessages((currentMessages) => currentMessages.map((message) => message._id === messageId ? { ...message, reactions } : message));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not update reaction.'));
    }
  }

  async function handleSearch(query) {
    setIsSearchingMessages(true);
    try {
      setSearchResults(await searchMessages(chat._id, query));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not search messages.'));
    } finally {
      setIsSearchingMessages(false);
    }
  }

  async function generateCatchUpSummary() {
    setIsGeneratingCatchUp(true);
    setError('');
    try {
      setCatchUpSummary(await summarizeUnreadGroupMessages(chat._id, unreadMessageIds));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not create the AI catch-up summary.'));
    } finally {
      setIsGeneratingCatchUp(false);
    }
  }

  async function searchChatMemory(query) {
    setIsSearchingConversationMemory(true);
    setConversationMemoryError('');
    try {
      setConversationMemoryResult(await searchConversationMemory(chat._id, query));
    } catch (requestError) {
      setConversationMemoryError(getErrorMessage(requestError, 'Could not search this conversation.'));
    } finally {
      setIsSearchingConversationMemory(false);
    }
  }
  async function openSelectedMessageTool(mode, message, recentContext) {
    const sourceText = message.text || `Shared ${message.type}`;
    if (mode === 'translate') {
      setMessageAiAction({ mode, sourceText, recentContext, targetLanguage: 'Hindi', answer: '', error: '', isLoading: false, needsLanguageSelection: true });
      return;
    }
    setMessageAiAction({ mode, sourceText, answer: '', error: '', isLoading: true });
    try {
      const result = await runMessageAiTool({ mode, selectedMessage: sourceText, recentContext });
      setMessageAiAction((current) => current ? { ...current, answer: result.answer, isLoading: false } : null);
    } catch (requestError) {
      setMessageAiAction((current) => current ? { ...current, error: getErrorMessage(requestError, 'Could not use this AI tool.'), isLoading: false } : null);
    }
  }

  async function translateSelectedMessage(targetLanguage) {
    const currentAction = messageAiAction;
    if (!currentAction?.sourceText) return;
    setMessageAiAction((current) => current ? { ...current, targetLanguage, needsLanguageSelection: false, error: '', isLoading: true } : null);
    try {
      const result = await runMessageAiTool({ mode: 'translate', selectedMessage: currentAction.sourceText, recentContext: currentAction.recentContext, targetLanguage });
      setMessageAiAction((current) => current ? { ...current, answer: result.answer, isLoading: false } : null);
    } catch (requestError) {
      setMessageAiAction((current) => current ? { ...current, error: getErrorMessage(requestError, 'Could not translate this message.'), isLoading: false } : null);
    }
  }
  async function runTaskFollowUp(mode, message) {
    const sourceText = message.text || `Shared ${message.type}`;
    const isDraft = mode === 'draft_reply';
    setMessageAiAction({ mode, sourceText, sourceMessage: message, isDraft, answer: '', error: '', isLoading: true });
    try {
      const result = await runMessageAiTool({ mode, selectedMessage: sourceText });
      setMessageAiAction((current) => current ? { ...current, answer: result.answer, isLoading: false } : null);
    } catch (requestError) {
      setMessageAiAction((current) => current ? { ...current, error: getErrorMessage(requestError, 'Could not use this task helper.'), isLoading: false } : null);
    }
  }

  function applyTaskDraft() {
    if (!messageAiAction?.isDraft || !messageAiAction.answer || !messageAiAction.sourceMessage) return;
    setReplyTo(messageAiAction.sourceMessage);
    setComposerDraft(messageAiAction.answer);
    setSmartReplySuggestions([]);
    setIsConversationMemoryOpen(false);
    setMessageAiAction(null);
  }
  async function generateActionItems() {
    setIsFindingActionItems(true);
    setActionItemsError('');
    try {
      setActionItemsResult(await findWorkspaceInsights());
    } catch (requestError) {
      setActionItemsError(getErrorMessage(requestError, 'Could not find tasks and deadlines.'));
    } finally {
      setIsFindingActionItems(false);
    }
  }

  async function saveWorkItem(details) { try { await createWorkItem(details); setWorkItemSuggestion(null); } catch (requestError) { setActionItemsError(getErrorMessage(requestError, 'Could not save tracker.')); } }
  function markInsightHandled(messageId) { setHandledInsightIds((current) => { const next = [messageId, ...current.filter((id) => id !== messageId)].slice(0, 500); const stored = Object.fromEntries(next.map((id) => [id, Date.now()])); localStorage.setItem('chatly_handled_insights', JSON.stringify(stored)); return next; }); }
  async function sendInsightReply(item, text) { try { const message = await sendTextMessage(item.source.chatId, text, item.source._id); markInsightHandled(item.source._id); if (item.source.chatId === chat._id) { setMessages((current) => [...current, message]); onMessageSent(chat._id, message); } } catch (requestError) { setActionItemsError(getErrorMessage(requestError, 'Could not send reply.')); } }
  async function translateComposerDraft(text, targetLanguage) { const result = await runMessageAiTool({ mode: 'translate', selectedMessage: text, targetLanguage }); return result.answer; }
  async function jumpToMessage(message) {
    setIsSearchOpen(false);
    if (messages.some((currentMessage) => currentMessage._id === message._id)) {
      setPendingScrollMessageId(message._id);
      return;
    }
    if (!nextMessageCursor) {
      setError('This source message is older than the currently loaded chat history.');
      return;
    }

    setIsLoadingOlder(true);
    setError('');
    let cursor = nextMessageCursor;
    let olderMessages = [];
    try {
      while (cursor) {
        const page = await getMessages(chat._id, cursor);
        olderMessages = [...page.messages, ...olderMessages];
        cursor = page.nextCursor;
        if (page.messages.some((currentMessage) => currentMessage._id === message._id)) break;
      }

      if (!olderMessages.some((currentMessage) => currentMessage._id === message._id)) {
        setError('This message is no longer available.');
        return;
      }

      setMessages((currentMessages) => {
        const existingIds = new Set(currentMessages.map((currentMessage) => currentMessage._id));
        return [...olderMessages.filter((currentMessage) => !existingIds.has(currentMessage._id)), ...currentMessages];
      });
      setNextMessageCursor(cursor);
      setPendingScrollMessageId(message._id);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load the selected message.'));
    } finally {
      setIsLoadingOlder(false);
    }
  }

  return (
    <section className="chat-window">
      <ChatHeader chat={chat} currentUserId={currentUserId} isOtherUserBlocked={isOtherUserBlocked} onToggleBlockUser={handleToggleBlockUser} onOpenAiAssistant={() => setIsConversationMemoryOpen(true)} onOpenGroupInfo={() => setIsGroupInfoOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} presence={presence} />
      {pinnedMessages.length > 0 && <div className="pinned-messages-banner"><button type="button" onClick={() => setIsPinnedMessagesOpen(true)}><span><Pin size={15} />{pinnedMessages.length} pinned {pinnedMessages.length === 1 ? 'message' : 'messages'}</span><small>Open to view</small></button></div>}
      {isPinnedMessagesOpen && <PinnedMessagesModal messages={pinnedMessages} onClose={() => setIsPinnedMessagesOpen(false)} onSelect={(message) => { setIsPinnedMessagesOpen(false); jumpToMessage(message); }} onUnpin={(message) => handlePin(message._id)} />}
      {chat.type === 'group' && (
        <GroupInfoModal
          chat={chat}
          currentUserId={currentUserId}
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          onDeleted={onChatDeleted}
          onUpdated={onChatUpdated}
        />
      )}
      <AiCatchUpPanel error={error} isGenerating={isGeneratingCatchUp} isOpen={isCatchUpOpen} onClose={() => setIsCatchUpOpen(false)} onGenerate={generateCatchUpSummary} onSelectSource={(message) => { setIsCatchUpOpen(false); jumpToMessage(message); }} summary={catchUpSummary} unreadCount={unreadMessageIds.length} />
      <MessageAiResultModal action={messageAiAction} onApplyDraft={applyTaskDraft} onClose={() => setMessageAiAction(null)} onTranslate={translateSelectedMessage} />
      <ConversationMemoryPanel error={conversationMemoryError} isOpen={isConversationMemoryOpen} isSearching={isSearchingConversationMemory} isTaskActionOpen={Boolean(messageAiAction?.sourceMessage)} onClose={() => setIsConversationMemoryOpen(false)} onSearch={searchChatMemory} onSelectMessage={(message) => { jumpToMessage(message); }} onTaskAction={runTaskFollowUp} result={conversationMemoryResult} />
      <ActionItemsPanel error={actionItemsError} handledIds={handledInsightIds} isLoading={isFindingActionItems} isOpen={isActionItemsOpen} onClose={() => setIsActionItemsOpen(false)} onCreate={setWorkItemSuggestion} onGenerate={generateActionItems} onHandled={markInsightHandled} onReply={sendInsightReply} result={actionItemsResult} />
      {workItemSuggestion && <CreateWorkItemModal suggestion={workItemSuggestion} onClose={() => setWorkItemSuggestion(null)} onSave={saveWorkItem} />}
      {isSearchOpen && <MessageSearch isSearching={isSearchingMessages} onClose={() => setIsSearchOpen(false)} onSearch={handleSearch} onSelect={jumpToMessage} results={searchResults} />}
      {error && <p className="chat-window__error">{error}</p>}
      <MessageList chatId={chat._id} currentUserId={currentUserId} deletingMessageId={deletingMessageId} editingMessageId={editingMessageId} hasMoreMessages={Boolean(nextMessageCursor)} initialUnreadMessageId={initialUnreadMessageId} isLoading={isLoading} isLoadingOlder={isLoadingOlder} messages={messages} onAiTool={openSelectedMessageTool} onCancelEdit={() => setEditingMessageId('')} onDelete={handleDelete} onEdit={handleEdit} onLoadOlder={loadOlderMessages} onPin={handlePin} onReact={handleReaction} onReply={handleReply} onSave={handleSave} onStartEdit={setEditingMessageId} />
      {typingMember && <p className="chat-window__typing"><span>{typingMember.displayName || typingMember.username}</span> is typing...</p>}
      <MessageComposer draftText={composerDraft} isSending={isSending} isUploadingMedia={isUploadingMedia} mediaUpload={mediaUpload} members={chat.members.map((member) => member.user).filter((member) => member && String(member._id) !== String(currentUserId))} onCancelMediaUpload={cancelMediaUpload} onCancelReply={cancelReply} onDismissMediaUpload={() => setMediaUpload(null)} onDismissSmartReplies={dismissSmartReplies} isLoadingSmartReplies={isLoadingSmartReplies} smartReplySuggestions={smartReplySuggestions} onDraftApplied={() => setComposerDraft('')} onMediaSelect={handleMediaSelect} onRetryMediaUpload={retryMediaUpload} onSend={handleSend} onTranslate={translateComposerDraft} onTyping={startTyping} onTypingStop={stopTyping} replyTo={replyTo} />
    </section>
  );
}

export default ChatWindow;
