import api from './api.js';

export async function getChats() {
  const { data } = await api.get('/api/chats');
  return data.chats;
}

export async function createDirectChat(recipientId) {
  const { data } = await api.post('/api/chats/direct', { recipientId });
  return data.chat;
}

export async function createGroupChat(name, memberIds) {
  const { data } = await api.post('/api/chats/group', { name, memberIds });
  return data.chat;
}

export async function addGroupMember(chatId, userId) {
  const { data } = await api.post(`/api/chats/${chatId}/members`, { userId });
  return data.chat;
}

export async function removeGroupMember(chatId, userId) {
  const { data } = await api.delete(`/api/chats/${chatId}/members/${userId}`);
  return data.chat;
}

export async function updateGroupMemberRole(chatId, userId, role) {
  const { data } = await api.put(`/api/chats/${chatId}/members/${userId}/role`, { role });
  return data.chat;
}

export async function updateGroup(chatId, groupDetails) {
  const { data } = await api.put(`/api/chats/${chatId}/group`, groupDetails);
  return data.chat;
}

export async function deleteGroup(chatId) {
  const { data } = await api.delete(`/api/chats/${chatId}/group`);
  return data.chatId;
}

export async function summarizeUnreadGroupMessages(chatId, messageIds) {
  const { data } = await api.post(`/api/ai/chats/${chatId}/catch-up`, { messageIds });
  return data;
}

export async function summarizeGlobalUnreadMessages() {
  const { data } = await api.post('/api/ai/catch-up');
  return data;
}

export async function getPendingResponses() {
  const { data } = await api.get('/api/pending-responses');
  return data.items;
}

export async function resolvePendingResponse(itemId, status) {
  const { data } = await api.patch(`/api/pending-responses/${itemId}`, { status });
  return data.item;
}

export async function searchConversationMemory(chatId, query) {
  const { data } = await api.post(`/api/ai/chats/${chatId}/memory-search`, { query });
  return data;
}

export async function findChatActionItems(chatId) {
  const { data } = await api.post(`/api/ai/chats/${chatId}/action-items`);
  return data;
}
export async function findWorkspaceInsights() { const { data } = await api.post('/api/ai/work-insights'); return data; }

export async function findChatDecisions(chatId, query) {
  const { data } = await api.post(`/api/ai/chats/${chatId}/decisions`, query ? { query } : {});
  return data;
}

export async function askGeneralAi(query) {
  const { data } = await api.post('/api/ai/ask', { query });
  return data;
}

export async function runMessageAiTool(payload) {
  const { data } = await api.post('/api/ai/message-tools', payload);
  return data;
}

export async function getSmartReplySuggestions(chatId, messageId) {
  const { data } = await api.post(`/api/ai/chats/${chatId}/smart-replies`, { messageId });
  return data.suggestions;
}
export async function getMessages(chatId, cursor) {
  const { data } = await api.get(`/api/messages/${chatId}`, { params: cursor ? { cursor } : {} });
  return data;
}

export async function searchMessages(chatId, query) {
  const { data } = await api.get(`/api/messages/${chatId}/search`, { params: { query } });
  return data.messages;
}

export async function sendTextMessage(chatId, text, replyTo, mentionIds = []) {
  const { data } = await api.post(`/api/messages/${chatId}`, { text, ...(replyTo && { replyTo }), ...(mentionIds.length && { mentionIds }) });
  return data.message;
}

export async function forwardChatMessage(messageId, chatIds) {
  const { data } = await api.post(`/api/messages/${messageId}/forward`, { chatIds });
  return data.forwarded;
}

export async function uploadChatMedia(file, { onProgress, signal } = {}) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post('/api/uploads/media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
    onUploadProgress: (event) => {
      if (!event.total || !onProgress) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    },
  });
  return data.media;
}

export async function sendMediaMessage(chatId, media, replyTo) {
  const { data } = await api.post(`/api/messages/${chatId}/media`, { media, ...(replyTo && { replyTo }) });
  return data.message;
}

export async function editTextMessage(chatId, messageId, text) {
  const { data } = await api.put(`/api/messages/${chatId}/${messageId}`, { text });
  return data.message;
}

export async function markChatRead(chatId) {
  const { data } = await api.put(`/api/messages/${chatId}/read`);
  return data.messageIds;
}

export async function markChatDelivered(chatId) {
  const { data } = await api.put(`/api/messages/${chatId}/delivered`);
  return data.messageIds;
}

export async function deleteChatMessage(chatId, messageId, scope) {
  const { data } = await api.delete(`/api/messages/${chatId}/${messageId}`, { data: { scope } });
  return data;
}

export async function getPinnedChatMessages(chatId) {
  const { data } = await api.get(`/api/messages/${chatId}/pins`);
  return data.messages;
}
export async function togglePinnedChatMessage(chatId, messageId) {
  const { data } = await api.put(`/api/messages/${chatId}/${messageId}/pin`);
  return data;
}

export async function toggleSavedChatMessage(messageId) {
  const { data } = await api.put(`/api/saved-messages/${messageId}`);
  return data;
}

export async function getSavedChatMessages() {
  const { data } = await api.get('/api/saved-messages');
  return data.saved;
}
export async function toggleMessageReaction(chatId, messageId, emoji) {
  const { data } = await api.put(`/api/messages/${chatId}/${messageId}/reaction`, { emoji });
  return data.reactions;
}
