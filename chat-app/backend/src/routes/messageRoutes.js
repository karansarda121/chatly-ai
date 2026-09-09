import { Router } from 'express';

import { getPinnedMessages, togglePinnedMessage } from '../controllers/messageBookmarkController.js';
import { deleteMessage, editMessage, forwardMessage, getChatMessages, markChatMessagesDelivered, markChatMessagesRead, searchChatMessages, sendMediaMessage, sendTextMessage, toggleReaction } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { validateChatId, validateMediaMessage, validateMessageCursor, validateMessageDeletion, validateMessageEdit, validateMessageId, validateReaction, validateTextMessage, validateUserSearch } from '../middleware/validate.js';

const router = Router();

router.get('/:chatId/pins', protect, validateChatId, getPinnedMessages);
router.get('/:chatId', protect, validateChatId, validateMessageCursor, getChatMessages);
router.get('/:chatId/search', protect, validateChatId, validateUserSearch, searchChatMessages);
router.post('/:chatId', protect, validateChatId, validateTextMessage, sendTextMessage);
router.post('/:chatId/media', protect, validateChatId, validateMediaMessage, sendMediaMessage);
router.post('/:messageId/forward', protect, validateMessageId, forwardMessage);
router.put('/:chatId/delivered', protect, validateChatId, markChatMessagesDelivered);
router.put('/:chatId/read', protect, validateChatId, markChatMessagesRead);
router.put('/:chatId/:messageId', protect, validateChatId, validateMessageId, validateMessageEdit, editMessage);
router.delete('/:chatId/:messageId', protect, validateChatId, validateMessageId, validateMessageDeletion, deleteMessage);
router.put('/:chatId/:messageId/pin', protect, validateChatId, validateMessageId, togglePinnedMessage);
router.put('/:chatId/:messageId/reaction', protect, validateChatId, validateMessageId, validateReaction, toggleReaction);

export default router;
