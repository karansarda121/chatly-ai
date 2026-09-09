import { Router } from 'express';
import { getSavedMessages, toggleSavedMessage } from '../controllers/messageBookmarkController.js';
import { protect } from '../middleware/auth.js';
import { validateMessageId } from '../middleware/validate.js';
const router = Router();
router.get('/', protect, getSavedMessages);
router.put('/:messageId', protect, validateMessageId, toggleSavedMessage);
export default router;