import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import SavedMessage from '../models/SavedMessage.js';

async function memberChat(chatId, userId) { return Chat.findOne({ _id: chatId, 'members.user': userId }); }

export async function getPinnedMessages(req, res, next) {
  try {
    const chat = await memberChat(req.params.chatId, req.user._id);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    const messages = await Message.find({ _id: { $in: chat.pinnedMessages }, isDeletedForEveryone: false }).populate('sender', 'username displayName avatarUrl').lean();
    const byId = new Map(messages.map((message) => [message._id.toString(), message]));
    return res.json({ messages: chat.pinnedMessages.map((id) => byId.get(id.toString())).filter(Boolean) });
  } catch (error) { return next(error); }
}
export async function togglePinnedMessage(req, res, next) {
  try {
    const chat = await memberChat(req.params.chatId, req.user._id);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    const message = await Message.findOne({ _id: req.params.messageId, chat: chat._id, isDeletedForEveryone: false });
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    const index = chat.pinnedMessages.findIndex((id) => id.equals(message._id));
    const isPinned = index === -1;
    if (isPinned) chat.pinnedMessages.unshift(message._id); else chat.pinnedMessages.splice(index, 1);
    await chat.save();
    return res.json({ messageId: message._id, isPinned });
  } catch (error) { return next(error); }
}

export async function toggleSavedMessage(req, res, next) {
  try {
    const message = await Message.findOne({ _id: req.params.messageId, isDeletedForEveryone: false });
    if (!message || !await memberChat(message.chat, req.user._id)) return res.status(404).json({ message: 'Message not found.' });
    const existing = await SavedMessage.findOne({ user: req.user._id, message: message._id });
    if (existing) { await existing.deleteOne(); return res.json({ messageId: message._id, isSaved: false }); }
    await SavedMessage.create({ user: req.user._id, message: message._id });
    return res.json({ messageId: message._id, isSaved: true });
  } catch (error) { return next(error); }
}

export async function getSavedMessages(req, res, next) {
  try {
    const saved = await SavedMessage.find({ user: req.user._id }).sort({ createdAt: -1 }).populate({ path: 'message', populate: [{ path: 'sender', select: 'username displayName avatarUrl' }, { path: 'chat', select: 'name type members', populate: { path: 'members.user', select: 'username displayName' } }] }).lean();
    return res.json({ saved: saved.filter((item) => item.message && !item.message.isDeletedForEveryone) });
  } catch (error) { return next(error); }
}