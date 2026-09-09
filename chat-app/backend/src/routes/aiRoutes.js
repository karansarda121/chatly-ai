import { Router } from 'express';

import { askGeneralAi, findChatActionItems, findChatDecisions, getSmartReplySuggestions, searchConversationMemory, summarizeGlobalCatchUpSimple, summarizeUnreadGroupMessages, useMessageAiTool } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimit.js';
import { validateCatchUpSummary, validateChatId, validateConversationMemorySearch, validateDecisionSearch, validateMessageAiTool } from '../middleware/validate.js';

const router = Router();

router.post('/ask', protect, aiRateLimiter, validateConversationMemorySearch, askGeneralAi);
router.post('/message-tools', protect, aiRateLimiter, validateMessageAiTool, useMessageAiTool);
router.post('/chats/:chatId/smart-replies', protect, aiRateLimiter, validateChatId, (req, res, next) => {
  const { messageId } = req.body || {};
  if (Object.keys(req.body || {}).some((field) => field !== 'messageId') || typeof messageId !== 'string' || !/^[a-f\d]{24}$/i.test(messageId)) return res.status(400).json({ message: 'A valid messageId is required.' });
  return next();
}, getSmartReplySuggestions);
router.post('/catch-up', protect, aiRateLimiter, summarizeGlobalCatchUpSimple);
router.post('/chats/:chatId/catch-up', protect, aiRateLimiter, validateChatId, validateCatchUpSummary, summarizeUnreadGroupMessages);
router.post('/chats/:chatId/memory-search', protect, aiRateLimiter, validateChatId, validateConversationMemorySearch, searchConversationMemory);
router.post('/chats/:chatId/action-items', protect, aiRateLimiter, validateChatId, findChatActionItems);
router.post('/chats/:chatId/decisions', protect, aiRateLimiter, validateChatId, validateDecisionSearch, findChatDecisions);

export default router;

