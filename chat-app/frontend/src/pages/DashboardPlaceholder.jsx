import { Menu, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import ChatList from '../components/chat/ChatList.jsx';
import ChatWindow from '../components/chat/ChatWindow.jsx';
import GroupCreateModal from '../components/chat/GroupCreateModal.jsx';
import SelectedChatPlaceholder from '../components/chat/SelectedChatPlaceholder.jsx';
import SavedMessagesModal from '../components/chat/SavedMessagesModal.jsx';
import UserDirectoryModal from '../components/chat/UserDirectoryModal.jsx';
import UserSearch from '../components/chat/UserSearch.jsx';
import AppSidebar from '../components/navigation/AppSidebar.jsx';
import GlobalCatchUp from '../components/dashboard/GlobalCatchUp.jsx';
import useAuth from '../hooks/useAuth.js';
import { createDirectChat, createGroupChat, getChats, markChatDelivered } from '../services/chatService.js';
import { getSocket } from '../services/socket.js';
import { showChatNotification } from '../services/notificationService.js';
import { addContactByEmail, getUsersPage, searchUsersPage } from '../services/userService.js';
import './DashboardPlaceholder.css';

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

function DashboardPlaceholder() {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMoreUsers, setIsLoadingMoreUsers] = useState(false);
  const [nextUserCursor, setNextUserCursor] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isUserDirectoryOpen, setIsUserDirectoryOpen] = useState(false);
  const [isGroupCreateOpen, setIsGroupCreateOpen] = useState(false);
  const [isGlobalCatchUpOpen, setIsGlobalCatchUpOpen] = useState(false);
  const [isSavedMessagesOpen, setIsSavedMessagesOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [error, setError] = useState('');

  const loadChats = useCallback(async () => {
    setIsLoadingChats(true);
    setError('');
    try {
      setChats(await getChats());
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load your chats.'));
    } finally {
      setIsLoadingChats(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const page = await getUsersPage();
      setSearchResults(page.users);
      setNextUserCursor(page.nextCursor);
      setUserSearchQuery('');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load the user list.'));
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      await Promise.resolve();
      await Promise.all([loadChats(), loadUsers()]);
    }

    loadDashboardData();
  }, [loadChats, loadUsers]);

  useEffect(() => {
    function handleForwardedMessages(event) {
      const forwarded = Array.isArray(event.detail) ? event.detail : [];
      const latestByChatId = new Map(forwarded.map((item) => [String(item.chatId), item.message]));
      if (!latestByChatId.size) return;
      setChats((currentChats) => currentChats
        .map((chat) => (latestByChatId.has(String(chat._id))
          ? { ...chat, lastMessage: latestByChatId.get(String(chat._id)), lastActivityAt: latestByChatId.get(String(chat._id)).createdAt }
          : chat))
        .sort((first, second) => new Date(second.lastActivityAt) - new Date(first.lastActivityAt)));
    }
    window.addEventListener('chatly:messages-forwarded', handleForwardedMessages);
    return () => window.removeEventListener('chatly:messages-forwarded', handleForwardedMessages);
  }, []);
  useEffect(() => {
    const socket = getSocket();

    function handleIncomingMessage({ chat, message }) {
      const isActiveChat = activeChat?._id === chat._id;

      setChats((currentChats) => {
        const currentChat = currentChats.find((item) => item._id === chat._id);
        const updatedChat = {
          ...chat,
          lastMessage: message,
          lastActivityAt: message.createdAt,
          unreadCount: isActiveChat ? 0 : (currentChat?.unreadCount || 0) + 1,
        };

        return [updatedChat, ...currentChats.filter((item) => item._id !== updatedChat._id)];
      });

      markChatDelivered(chat._id);
      showChatNotification({
        activeChatId: activeChat?._id,
        chat,
        currentUserId: user._id,
        message,
        onClick: () => selectChat(chat),
      });
    }

    function handlePresence({ userId, isOnline, lastSeen }) {
      setChats((currentChats) => currentChats.map((chat) => ({
        ...chat,
        members: chat.members.map((member) => (
          String(member.user?._id || member.user) === String(userId)
            ? { ...member, user: { ...member.user, isOnline, lastSeen: lastSeen || member.user?.lastSeen } }
            : member
        )),
      })));
    }

    function handleChatAdded({ chat }) {
      setChats((currentChats) => [chat, ...currentChats.filter((item) => item._id !== chat._id)]);
    }

    function handleChatUpdated({ chat }) {
      setChats((currentChats) => currentChats.map((currentChat) => {
        if (currentChat._id !== chat._id) return currentChat;
        return { ...chat, unreadCount: currentChat.unreadCount || 0 };
      }));
      setActiveChat((currentChat) => {
        if (currentChat?._id !== chat._id) return currentChat;
        return { ...chat, unreadCount: currentChat.unreadCount || 0 };
      });
    }

    function handleChatRemoved({ chatId }) {
      setChats((currentChats) => currentChats.filter((chat) => chat._id !== chatId));
      setActiveChat((currentChat) => (
        currentChat?._id === chatId ? null : currentChat
      ));
    }

    function handleMessageUpdated({ chatId, message }) {
      setChats((currentChats) => currentChats.map((chat) => (
        chat._id === chatId && chat.lastMessage?._id === message._id
          ? { ...chat, lastMessage: { ...chat.lastMessage, ...message } }
          : chat
      )));
    }

    socket.on('chat:message', handleIncomingMessage);
    socket.on('user:presence', handlePresence);
    socket.on('chat:added', handleChatAdded);
    socket.on('chat:updated', handleChatUpdated);
    socket.on('chat:removed', handleChatRemoved);
    socket.on('message:updated', handleMessageUpdated);
    return () => {
      socket.off('chat:message', handleIncomingMessage);
      socket.off('user:presence', handlePresence);
      socket.off('chat:added', handleChatAdded);
      socket.off('chat:updated', handleChatUpdated);
      socket.off('chat:removed', handleChatRemoved);
      socket.off('message:updated', handleMessageUpdated);
    };
  }, [activeChat?._id]);

  async function findUsers(query) {
    setIsSearching(true);
    setError('');
    try {
      const page = await searchUsersPage(query);
      setSearchResults(page.users);
      setNextUserCursor(page.nextCursor);
      setUserSearchQuery(query);
    } catch (requestError) {
      setSearchResults([]);
      setError(getErrorMessage(requestError, 'Could not search for users.'));
    } finally {
      setIsSearching(false);
    }
  }

  async function loadMoreUsers() {
    if (!nextUserCursor || isLoadingMoreUsers || isSearching) return;

    setIsLoadingMoreUsers(true);
    setError('');
    try {
      const page = userSearchQuery
        ? await searchUsersPage(userSearchQuery, nextUserCursor)
        : await getUsersPage(nextUserCursor);
      setSearchResults((currentUsers) => {
        const existingIds = new Set(currentUsers.map((user) => user._id));
        return [...currentUsers, ...page.users.filter((user) => !existingIds.has(user._id))];
      });
      setNextUserCursor(page.nextCursor);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load more users.'));
    } finally {
      setIsLoadingMoreUsers(false);
    }
  }

  async function handleStartChat(recipientId) {
    setIsCreatingChat(true);
    setError('');
    try {
      const chat = await createDirectChat(recipientId);
      setChats((currentChats) => [chat, ...currentChats.filter((item) => item._id !== chat._id)]);
      setActiveChat(chat);
      setIsUserDirectoryOpen(false);
      return chat;
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not start this chat.'));
      return null;
    } finally {
      setIsCreatingChat(false);
    }
  }

  async function handleAddContact(email) {
    setError('');
    try {
      await addContactByEmail(email);
      await loadUsers();
      return true;
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not add this contact.'));
      return false;
    }
  }

  async function handleCreateGroup(name, memberIds) {
    setIsCreatingGroup(true);
    setError('');
    try {
      const chat = await createGroupChat(name, memberIds);
      setChats((currentChats) => [chat, ...currentChats]);
      setActiveChat(chat);
      setIsGroupCreateOpen(false);
      return chat;
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not create the group.'));
      return null;
    } finally {
      setIsCreatingGroup(false);
    }
  }

  function recordSentMessage(chatId, message) {
    setChats((currentChats) => currentChats
      .map((chat) => (chat._id === chatId
        ? { ...chat, lastMessage: message, lastActivityAt: message.createdAt }
        : chat))
      .sort((first, second) => new Date(second.lastActivityAt) - new Date(first.lastActivityAt)));
  }

  function updateChat(updatedChat) {
    setChats((currentChats) => currentChats.map((chat) => (
      chat._id === updatedChat._id ? { ...updatedChat, unreadCount: chat.unreadCount || 0 } : chat
    )));
    setActiveChat((currentChat) => (
      currentChat?._id === updatedChat._id ? { ...updatedChat, unreadCount: currentChat.unreadCount || 0 } : currentChat
    ));
  }

  function removeChat(chatId) {
    setChats((currentChats) => currentChats.filter((chat) => chat._id !== chatId));
    setActiveChat((currentChat) => (
      currentChat?._id === chatId ? null : currentChat
    ));
  }

  function openUserDirectory() {
    setIsUserDirectoryOpen(true);
    loadUsers();
  }

  function selectChat(chat) {
    const openedChat = { ...chat, unreadCount: 0 };
    setChats((currentChats) => currentChats.map((item) => (
      item._id === chat._id ? openedChat : item
    )));
    setActiveChat(openedChat);
  }

  return (
    <main className={`dashboard-placeholder${isGlobalCatchUpOpen ? ' dashboard-placeholder--catch-up-open' : ''}`}>
      <AppSidebar isMobileOpen={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} onOpenGroupCreate={() => { setIsGroupCreateOpen(true); loadUsers(); }} onOpenSavedMessages={() => setIsSavedMessagesOpen(true)} onOpenUserDirectory={openUserDirectory}>
        {error && <p className="dashboard-placeholder__error">{error}</p>}
        <ChatList activeChatId={activeChat?._id} chats={chats} currentUserId={user._id} isLoading={isLoadingChats} onSelect={(chat) => { selectChat(chat); setIsMobileSidebarOpen(false); }} />
      </AppSidebar>
      {isMobileSidebarOpen && <button type="button" className="dashboard-placeholder__mobile-sidebar-backdrop" onClick={() => setIsMobileSidebarOpen(false)} aria-label="Close chats menu" />}

      <section className="dashboard-placeholder__content">
        {activeChat ? <ChatWindow key={`${activeChat._id}-${activeChat.openedFromCatchUp ? 'catch-up' : 'manual'}`} chat={activeChat} currentUserId={user._id} openedFromCatchUp={Boolean(activeChat.openedFromCatchUp)} onChatDeleted={removeChat} onChatUpdated={updateChat} onMessageSent={recordSentMessage} onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} /> : <SelectedChatPlaceholder chat={activeChat} currentUserId={user._id} onOpenCatchUp={() => setIsGlobalCatchUpOpen(true)} />}
      </section>

      {!activeChat && <button type="button" className="dashboard-placeholder__mobile-sidebar-toggle" onClick={() => setIsMobileSidebarOpen(true)} aria-label="Open chats and account menu"><Menu size={20} /></button>}

      <UserDirectoryModal isOpen={isUserDirectoryOpen} onClose={() => setIsUserDirectoryOpen(false)}>
        <UserSearch hasMoreUsers={Boolean(nextUserCursor)} isCreatingChat={isCreatingChat} isLoadingMoreUsers={isLoadingMoreUsers} isLoadingUsers={isLoadingUsers} isSearching={isSearching} onAddContact={handleAddContact} onLoadMore={loadMoreUsers} onReset={loadUsers} onSearch={findUsers} onStartChat={handleStartChat} results={searchResults} />
      </UserDirectoryModal>

      <GroupCreateModal isCreating={isCreatingGroup} isOpen={isGroupCreateOpen} onClose={() => setIsGroupCreateOpen(false)} onCreate={handleCreateGroup} users={searchResults} />
<SavedMessagesModal isOpen={isSavedMessagesOpen} onClose={() => setIsSavedMessagesOpen(false)} onOpenChat={(chatId) => { const selectedChat = chats.find((chat) => chat._id === chatId); if (selectedChat) setActiveChat(selectedChat); }} />
      {!isGlobalCatchUpOpen && <button className="global-catch-up-fab" type="button" onClick={() => setIsGlobalCatchUpOpen(true)} title="Open AI Assistant" aria-label="Open AI Assistant"><Sparkles size={22}/></button>}
      <GlobalCatchUp isOpen={isGlobalCatchUpOpen} onClose={() => setIsGlobalCatchUpOpen(false)} onMarkedRead={(chatId) => setChats((currentChats) => currentChats.map((chat) => (chat._id === chatId ? { ...chat, unreadCount: 0 } : chat)))} onSelectChat={(chatId) => { const selectedChat = chats.find((chat) => chat._id === chatId); if (selectedChat) setActiveChat({ ...selectedChat, openedFromCatchUp: true }); }} />
    </main>
  );
}

export default DashboardPlaceholder;


