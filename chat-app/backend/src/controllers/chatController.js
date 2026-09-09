import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { deleteImageKitFile } from '../config/imagekit.js';

const memberUserFields = 'username displayName avatarUrl isOnline lastSeen isSystemBot';
const lastMessageFields = 'text type media sender createdAt isDeletedForEveryone';

function populateChat(chatQuery) {
  // Mongoose queries allow chained populate calls, but a saved document's
  // populate() returns a Promise. One array-based call works with both.
  return chatQuery.populate([
    { path: 'members.user', select: memberUserFields },
    { path: 'lastMessage', select: lastMessageFields },
  ]);
}

function hasBlockedUser(user, userId) {
  return user.blockedUsers.some((blockedUserId) => blockedUserId.equals(userId));
}

async function findManagedGroup(chatId, userId) {
  const chat = await Chat.findOne({ _id: chatId, type: 'group', 'members.user': userId });
  const actor = chat?.members.find((member) => member.user.equals(userId));
  return { chat, actor };
}

function canManageMembers(member) {
  return member?.role === 'owner' || member?.role === 'admin';
}

function canManageTarget(actor, target) {
  if (!target || target.role === 'owner') return false;
  return actor.role === 'owner' || target.role === 'member';
}

function emitGroupUpdate(io, chat) {
  if (!io) return;
  chat.members.forEach((member) => {
    io.to(`user:${member.user._id}`).emit('chat:updated', { chat });
  });
}

/** POST /api/chats/:chatId/members */
export async function addGroupMember(req, res, next) {
  try {
    const { chat, actor } = await findManagedGroup(req.params.chatId, req.user._id);
    if (!chat) return res.status(404).json({ message: 'Group not found.' });
    if (!canManageMembers(actor)) return res.status(403).json({ message: 'Only an owner or admin can add members.' });
    if (chat.members.some((member) => member.user.equals(req.body.userId))) return res.status(409).json({ message: 'User is already in this group.' });
    if (!(req.user.contacts || []).some((contactId) => contactId.equals(req.body.userId))) return res.status(403).json({ message: 'Add this person to your contacts before adding them to the group.' });
    const user = await User.findOne({ _id: req.body.userId, isSystemBot: false });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    chat.members.push({ user: user._id, role: 'member' });
    await chat.save();
    await populateChat(chat);
    req.app.get('io')?.to(`user:${user._id}`).emit('chat:added', { chat });
    emitGroupUpdate(req.app.get('io'), chat);
    return res.json({ chat });
  } catch (error) { return next(error); }
}

/** DELETE /api/chats/:chatId/members/:userId */
export async function removeGroupMember(req, res, next) {
  try {
    const { chat, actor } = await findManagedGroup(req.params.chatId, req.user._id);
    if (!chat) return res.status(404).json({ message: 'Group not found.' });
    if (!canManageMembers(actor)) return res.status(403).json({ message: 'Only an owner or admin can remove members.' });

    const target = chat.members.find((member) => member.user.equals(req.params.userId));
    if (!target) return res.status(404).json({ message: 'User is not in this group.' });
    if (!canManageTarget(actor, target)) return res.status(403).json({ message: 'You cannot remove this group member.' });

    chat.members = chat.members.filter((member) => !member.user.equals(req.params.userId));
    await chat.save();
    await populateChat(chat);

    const io = req.app.get('io');
    io?.to(`user:${req.params.userId}`).emit('chat:removed', { chatId: chat._id });
    emitGroupUpdate(io, chat);
    return res.json({ chat });
  } catch (error) { return next(error); }
}

/** PUT /api/chats/:chatId/members/:userId/role */
export async function updateGroupMemberRole(req, res, next) {
  try {
    const { chat, actor } = await findManagedGroup(req.params.chatId, req.user._id);
    if (!chat) return res.status(404).json({ message: 'Group not found.' });
    if (actor?.role !== 'owner') return res.status(403).json({ message: 'Only the group owner can change roles.' });

    const target = chat.members.find((member) => member.user.equals(req.params.userId));
    if (!target) return res.status(404).json({ message: 'User is not in this group.' });
    if (target.role === 'owner') return res.status(400).json({ message: 'The group owner role cannot be changed.' });

    target.role = req.body.role;
    await chat.save();
    await populateChat(chat);
    emitGroupUpdate(req.app.get('io'), chat);
    return res.json({ chat });
  } catch (error) { return next(error); }
}

/** PUT /api/chats/:chatId/group */
export async function updateGroup(req, res, next) {
  try {
    const { chat, actor } = await findManagedGroup(req.params.chatId, req.user._id);
    if (!chat) return res.status(404).json({ message: 'Group not found.' });
    if (actor?.role !== 'owner') return res.status(403).json({ message: 'Only the group owner can edit group details.' });

    if (req.body.name !== undefined) chat.name = req.body.name.trim();
    if (req.body.description !== undefined) chat.description = req.body.description.trim();
    await chat.save();
    await populateChat(chat);
    emitGroupUpdate(req.app.get('io'), chat);
    return res.json({ chat });
  } catch (error) { return next(error); }
}

/** DELETE /api/chats/:chatId/group */
export async function deleteGroup(req, res, next) {
  try {
    const { chat, actor } = await findManagedGroup(req.params.chatId, req.user._id);
    if (!chat) return res.status(404).json({ message: 'Group not found.' });
    if (actor?.role !== 'owner') return res.status(403).json({ message: 'Only the group owner can delete this group.' });

    const messages = await Message.find({ chat: chat._id }).select('media.fileId');
    const memberIds = chat.members.map((member) => member.user.toString());
    await Message.deleteMany({ chat: chat._id });
    await chat.deleteOne();

    const io = req.app.get('io');
    memberIds.forEach((memberId) => {
      io?.to(`user:${memberId}`).emit('chat:removed', { chatId: chat._id.toString() });
    });

    messages
      .map((message) => message.media?.fileId)
      .filter(Boolean)
      .forEach((fileId) => {
        deleteImageKitFile(fileId).catch((error) => {
          console.error('Failed to delete group media from ImageKit:', error.message);
        });
      });

    return res.json({ chatId: chat._id.toString() });
  } catch (error) { return next(error); }
}

/** POST /api/chats/direct */
export async function createOrGetDirectChat(req, res, next) {
  try {
    const { recipientId } = req.body;

    if (req.user._id.equals(recipientId)) {
      return res.status(400).json({ message: 'You cannot start a chat with yourself.' });
    }

    const recipient = await User.findOne({ _id: recipientId, isSystemBot: false });
    if (!recipient) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!(req.user.contacts || []).some((contactId) => contactId.equals(recipient._id))) {
      return res.status(403).json({ message: 'Add this person to your contacts before starting a chat.' });
    }

    if (hasBlockedUser(req.user, recipient._id) || hasBlockedUser(recipient, req.user._id)) {
      return res.status(403).json({ message: 'You cannot start a chat with this user.' });
    }

    const memberIds = [req.user._id, recipient._id];
    const existingChat = await populateChat(
      Chat.findOne({ type: 'direct', 'members.user': { $all: memberIds } }),
    );

    if (existingChat) {
      return res.json({ chat: existingChat, created: false });
    }

    const chat = await Chat.create({
      type: 'direct',
      members: memberIds.map((user) => ({ user })),
    });

    await populateChat(chat);
    return res.status(201).json({ chat, created: true });
  } catch (error) {
    return next(error);
  }
}

/** POST /api/chats/group */
export async function createGroupChat(req, res, next) {
  try {
    const memberIds = [...new Set(req.body.memberIds)];
    const contactIds = new Set((req.user.contacts || []).map(String));
    if (memberIds.some((memberId) => !contactIds.has(String(memberId)))) {
      return res.status(403).json({ message: 'You can add only saved contacts to a group.' });
    }
    const members = await User.find({ _id: { $in: memberIds }, isSystemBot: false }).select('_id');

    if (members.length !== memberIds.length) {
      return res.status(404).json({ message: 'One or more selected users no longer exist.' });
    }

    const chat = await Chat.create({
      type: 'group',
      name: req.body.name.trim(),
      members: [
        { user: req.user._id, role: 'owner' },
        ...members.map((member) => ({ user: member._id, role: 'member' })),
      ],
    });

    await populateChat(chat);

    const io = req.app.get('io');
    if (io) {
      chat.members
        .filter((member) => !member.user._id.equals(req.user._id))
        .forEach((member) => {
          io.to(`user:${member.user._id}`).emit('chat:added', { chat });
        });
    }

    return res.status(201).json({ chat });
  } catch (error) {
    return next(error);
  }
}

/** GET /api/chats */
export async function getMyChats(req, res, next) {
  try {
    const chats = await populateChat(
      Chat.find({ 'members.user': req.user._id }).sort({ lastActivityAt: -1 }),
    );

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          chat: { $in: chats.map((chat) => chat._id) },
          sender: { $ne: req.user._id },
          readBy: { $ne: req.user._id },
          deletedFor: { $ne: req.user._id },
          isDeletedForEveryone: false,
        },
      },
      { $group: { _id: '$chat', count: { $sum: 1 } } },
    ]);
    const unreadCountByChatId = new Map(
      unreadCounts.map((item) => [item._id.toString(), item.count]),
    );
    const chatsWithUnreadCounts = chats.map((chat) => ({
      ...chat.toObject(),
      unreadCount: unreadCountByChatId.get(chat._id.toString()) || 0,
    }));

    return res.json({ chats: chatsWithUnreadCounts });
  } catch (error) {
    return next(error);
  }
}
