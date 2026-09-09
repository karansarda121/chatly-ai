import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { deleteImageKitFile } from '../config/imagekit.js';

const senderFields = 'username displayName avatarUrl';
const replyFields = 'text type media sender isDeletedForEveryone';
const MESSAGE_PAGE_SIZE = 50;

async function findMemberChat(chatId, userId) {
  return Chat.findOne({ _id: chatId, 'members.user': userId });
}

function hasBlockedUser(user, userId) {
  return user.blockedUsers?.some((blockedUserId) => blockedUserId.equals(userId));
}

async function ensureDirectChatIsNotBlocked(chat, senderId) {
  if (chat.type !== 'direct') return;

  const recipientId = chat.members.find((member) => !member.user.equals(senderId))?.user;
  const users = await User.find({ _id: { $in: [senderId, recipientId] } }).select('blockedUsers');
  const sender = users.find((user) => user._id.equals(senderId));
  const recipient = users.find((user) => user._id.equals(recipientId));

  if (!sender || !recipient || hasBlockedUser(sender, recipientId) || hasBlockedUser(recipient, senderId)) {
    const error = new Error('You cannot send messages in this conversation because one user has blocked the other.');
    error.status = 403;
    throw error;
  }
}

async function getReplyTarget(replyTo, chatId) {
  if (!replyTo) return null;

  const message = await Message.findOne({
    _id: replyTo,
    chat: chatId,
    isDeletedForEveryone: false,
  });

  if (!message) {
    const error = new Error('The message you are replying to is unavailable.');
    error.status = 400;
    throw error;
  }

  return message._id;
}

async function resolveMentions(chat, text, explicitMentionIds = [], senderId = null) {
  const memberIds = chat.members.map((member) => String(member.user));
  const verifiedIds = [...new Set(explicitMentionIds.map(String))].filter((id) => memberIds.includes(id) && id !== String(senderId));
  const mentionsEveryone = chat.type === 'group' && /(^|\s)@all\b/i.test(String(text || ''));
  if (mentionsEveryone) return [...new Set([...verifiedIds, ...memberIds.filter((id) => id !== String(senderId))])];
  if (verifiedIds.length) return verifiedIds;
  const handles = [...new Set([...String(text || '').matchAll(/@([a-zA-Z0-9_]{3,30})/g)].map((match) => match[1]))];
  if (!handles.length) return [];

  const members = chat.members.map((member) => member.user);
  const users = await User.find({ _id: { $in: members }, username: { $in: handles } }).select('_id');
  return users.filter((user) => String(user._id) !== String(senderId)).map((user) => user._id);
}

async function broadcastMessage(req, chat, message) {
  await message.populate([
    { path: 'sender', select: senderFields },
    { path: 'replyTo', select: replyFields, populate: { path: 'sender', select: senderFields } },
  ]);

  const io = req.app.get('io');
  if (!io) return;

  await chat.populate({
    path: 'members.user',
    select: 'username displayName avatarUrl isOnline lastSeen',
  });

  const chatPayload = chat.toObject();
  chatPayload.lastMessage = message.toObject();

  chat.members
    .filter((member) => !member.user._id.equals(req.user._id))
    .forEach((member) => {
      io.to(`user:${member.user._id}`).emit('chat:message', {
        chat: chatPayload,
        message: message.toObject(),
      });
    });
}

async function saveMessageAndUpdateChat(req, chat, messageData) {
  const mentions = messageData.type === 'text' ? await resolveMentions(chat, messageData.text, messageData.mentionIds, req.user._id) : [];
  const message = await Message.create({
    chat: chat._id,
    sender: req.user._id,
    deliveredTo: [req.user._id],
    readBy: [req.user._id],
    mentions,
    ...messageData,
  });

  chat.lastMessage = message._id;
  chat.lastActivityAt = message.createdAt;
  await chat.save();
  await broadcastMessage(req, chat, message);
  return message;
}

/** GET /api/messages/:chatId */
export async function getChatMessages(req, res, next) {
  try {
    const chat = await findMemberChat(req.params.chatId, req.user._id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    const cursor = req.query.cursor;
    const messagesQuery = {
      chat: chat._id,
      deletedFor: { $ne: req.user._id },
      ...(cursor && { _id: { $lt: cursor } }),
    };

    // Query newest first for the database index, then reverse for chat reading order.
    // Fetch one extra document to know whether another older page exists.
    const newestFirst = await Message.find(messagesQuery)
      .populate('sender', senderFields)
      .populate({ path: 'replyTo', select: replyFields, populate: { path: 'sender', select: senderFields } })
      .sort({ _id: -1 })
      .limit(MESSAGE_PAGE_SIZE + 1);

    const hasMore = newestFirst.length > MESSAGE_PAGE_SIZE;
    const page = hasMore ? newestFirst.slice(0, MESSAGE_PAGE_SIZE) : newestFirst;
    const oldestMessage = page.at(-1);

    const pinnedIds = new Set(chat.pinnedMessages.map((messageId) => messageId.toString()));
    return res.json({
      messages: page.reverse().map((message) => ({ ...message.toObject(), isPinned: pinnedIds.has(message._id.toString()) })),
      nextCursor: hasMore ? oldestMessage._id.toString() : null,
    });
  } catch (error) {
    return next(error);
  }
}

/** GET /api/messages/:chatId/search?query=... */
export async function searchChatMessages(req, res, next) {
  try {
    const chat = await findMemberChat(req.params.chatId, req.user._id);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });

    const messages = await Message.find({
      chat: chat._id,
      deletedFor: { $ne: req.user._id },
      isDeletedForEveryone: false,
      $text: { $search: req.query.query.trim() },
    }, { score: { $meta: 'textScore' } })
      .populate('sender', senderFields)
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .limit(20);

    return res.json({ messages });
  } catch (error) {
    return next(error);
  }
}

/** POST /api/messages/:chatId */
export async function sendTextMessage(req, res, next) {
  try {
    const chat = await findMemberChat(req.params.chatId, req.user._id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }
    await ensureDirectChatIsNotBlocked(chat, req.user._id);

    const message = await saveMessageAndUpdateChat(req, chat, {
      type: 'text',
      text: req.body.text.trim(),
      replyTo: await getReplyTarget(req.body.replyTo, chat._id),
      mentionIds: Array.isArray(req.body.mentionIds) ? req.body.mentionIds : [],
    });


    return res.status(201).json({ message });
  } catch (error) {
    return next(error);
  }
}

/** POST /api/messages/:messageId/forward */
export async function forwardMessage(req, res, next) {
  try {
    const targetChatIds = [...new Set(Array.isArray(req.body.chatIds) ? req.body.chatIds : [])];
    if (!targetChatIds.length || targetChatIds.length > 10) return res.status(400).json({ message: 'Choose between 1 and 10 chats to forward to.' });

    const source = await Message.findOne({ _id: req.params.messageId, deletedFor: { $ne: req.user._id }, isDeletedForEveryone: false });
    if (!source || !await findMemberChat(source.chat, req.user._id)) return res.status(404).json({ message: 'Original message not found.' });

    const targets = await Chat.find({ _id: { $in: targetChatIds }, 'members.user': req.user._id });
    if (targets.length !== targetChatIds.length) return res.status(403).json({ message: 'You can forward only to chats you belong to.' });

    const forwarded = [];
    for (const chat of targets) {
      await ensureDirectChatIsNotBlocked(chat, req.user._id);
      const message = await saveMessageAndUpdateChat(req, chat, {
        type: source.type,
        text: source.text,
        media: source.media,
        forwardedFrom: { message: source._id, sender: source.sender },
      });
      await broadcastMessage(req, chat, message);
      forwarded.push({ chatId: chat._id, message });
    }
    return res.status(201).json({ forwarded });
  } catch (error) { return next(error); }
}

/** POST /api/messages/:chatId/media */
export async function sendMediaMessage(req, res, next) {
  try {
    const chat = await findMemberChat(req.params.chatId, req.user._id);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    await ensureDirectChatIsNotBlocked(chat, req.user._id);

    const message = await saveMessageAndUpdateChat(req, chat, {
      type: req.body.media.mediaType,
      media: req.body.media,
      replyTo: await getReplyTarget(req.body.replyTo, chat._id),
    });

    return res.status(201).json({ message });
  } catch (error) {
    return next(error);
  }
}

/** PUT /api/messages/:chatId/:messageId - sender can edit their own text message. */
export async function editMessage(req, res, next) {
  try {
    const chat = await findMemberChat(req.params.chatId, req.user._id);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });

    const message = await Message.findOne({
      _id: req.params.messageId,
      chat: chat._id,
      sender: req.user._id,
      type: 'text',
      isDeletedForEveryone: false,
    });
    if (!message) return res.status(403).json({ message: 'Only the sender can edit an available text message.' });

    message.text = req.body.text.trim();
    message.mentions = await resolveMentions(chat, message.text);
    message.editedAt = new Date();
    await message.save();
    await message.populate('sender', senderFields);

    const io = req.app.get('io');
    if (io) {
      chat.members.forEach((member) => {
        io.to(`user:${member.user}`).emit('message:updated', {
          chatId: chat._id.toString(),
          message: message.toObject(),
        });
      });
    }

    return res.json({ message });
  } catch (error) {
    return next(error);
  }
}

/** PUT /api/messages/:chatId/read */
export async function markChatMessagesRead(req, res, next) {
  try {
    const chat = await findMemberChat(req.params.chatId, req.user._id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    const unreadMessages = await Message.find({
      chat: chat._id,
      sender: { $ne: req.user._id },
      readBy: { $ne: req.user._id },
      deletedFor: { $ne: req.user._id },
    }).select('_id sender');

    if (unreadMessages.length === 0) return res.json({ messageIds: [] });

    const messageIds = unreadMessages.map((message) => message._id);
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { deliveredTo: req.user._id, readBy: req.user._id } },
    );

    const io = req.app.get('io');
    if (io) {
      const senderIds = [...new Set(unreadMessages.map((message) => message.sender.toString()))];
      senderIds.forEach((senderId) => {
        io.to(`user:${senderId}`).emit('messages:read', {
          chatId: chat._id.toString(),
          messageIds: messageIds.map((messageId) => messageId.toString()),
          readerId: req.user._id.toString(),
        });
      });
    }

    return res.json({ messageIds });
  } catch (error) {
    return next(error);
  }
}

/** PUT /api/messages/:chatId/delivered */
export async function markChatMessagesDelivered(req, res, next) {
  try {
    const chat = await findMemberChat(req.params.chatId, req.user._id);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });

    const undeliveredMessages = await Message.find({
      chat: chat._id,
      sender: { $ne: req.user._id },
      deliveredTo: { $ne: req.user._id },
      deletedFor: { $ne: req.user._id },
    }).select('_id sender');

    if (undeliveredMessages.length === 0) return res.json({ messageIds: [] });

    const messageIds = undeliveredMessages.map((message) => message._id);
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { deliveredTo: req.user._id } },
    );

    const io = req.app.get('io');
    if (io) {
      const senderIds = [...new Set(undeliveredMessages.map((message) => message.sender.toString()))];
      senderIds.forEach((senderId) => {
        io.to(`user:${senderId}`).emit('messages:delivered', {
          chatId: chat._id.toString(),
          messageIds: messageIds.map((messageId) => messageId.toString()),
          recipientId: req.user._id.toString(),
        });
      });
    }

    return res.json({ messageIds });
  } catch (error) {
    return next(error);
  }
}

/** DELETE /api/messages/:chatId/:messageId */
export async function deleteMessage(req, res, next) {
  try {
    const chat = await findMemberChat(req.params.chatId, req.user._id);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });

    const message = await Message.findOne({ _id: req.params.messageId, chat: chat._id });
    if (!message || message.isDeletedForEveryone) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    if (req.body.scope === 'me') {
      await Message.updateOne({ _id: message._id }, { $addToSet: { deletedFor: req.user._id } });
      return res.json({ messageId: message._id, scope: 'me' });
    }

    if (!message.sender.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the sender can delete this message for everyone.' });
    }

    const fileId = message.media?.fileId;
    message.text = '';
    message.media = null;
    message.isDeletedForEveryone = true;
    await message.save();

    if (fileId) {
      deleteImageKitFile(fileId).catch((error) => {
        console.error('Failed to delete chat media from ImageKit:', error.message);
      });
    }

    const io = req.app.get('io');
    if (io) {
      chat.members
        .filter((member) => !member.user.equals(req.user._id))
        .forEach((member) => {
          io.to(`user:${member.user}`).emit('message:deleted', {
            chatId: chat._id.toString(),
            messageId: message._id.toString(),
          });
        });
    }

    return res.json({ messageId: message._id, scope: 'everyone' });
  } catch (error) {
    return next(error);
  }
}

/** PUT /api/messages/:chatId/:messageId/reaction */
export async function toggleReaction(req, res, next) {
  try {
    const chat = await findMemberChat(req.params.chatId, req.user._id);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });

    const message = await Message.findOne({ _id: req.params.messageId, chat: chat._id, isDeletedForEveryone: false });
    if (!message) return res.status(404).json({ message: 'Message not found.' });

    const existingIndex = message.reactions.findIndex((reaction) => reaction.user.equals(req.user._id));
    if (existingIndex >= 0 && message.reactions[existingIndex].emoji === req.body.emoji) {
      message.reactions.splice(existingIndex, 1);
    } else if (existingIndex >= 0) {
      message.reactions[existingIndex].emoji = req.body.emoji;
    } else {
      message.reactions.push({ user: req.user._id, emoji: req.body.emoji });
    }

    await message.save();
    const reactions = message.reactions.map((reaction) => ({ user: reaction.user.toString(), emoji: reaction.emoji }));

    const io = req.app.get('io');
    if (io) {
      chat.members
        .filter((member) => !member.user.equals(req.user._id))
        .forEach((member) => io.to(`user:${member.user}`).emit('message:reaction', {
          chatId: chat._id.toString(), messageId: message._id.toString(), reactions,
        }));
    }

    return res.json({ messageId: message._id, reactions });
  } catch (error) {
    return next(error);
  }
}


