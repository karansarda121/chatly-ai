import { Router } from 'express';
import { createWorkItem, getWorkItems, updateWorkItem } from '../controllers/workItemController.js';
import { protect } from '../middleware/auth.js';
const router = Router();
const id = /^[a-f\d]{24}$/i;
router.get('/', protect, getWorkItems);
router.post('/', protect, (req, res, next) => { const b = req.body || {}; if (!['commitment', 'task', 'event'].includes(b.category) || typeof b.title !== 'string' || !b.title.trim() || b.title.length > 180 || !id.test(b.chatId) || !id.test(b.sourceMessageId)) return res.status(400).json({ message: 'Provide a category, title, chat, and source message.' }); next(); }, createWorkItem);
router.patch('/:itemId', protect, (req, res, next) => { if (!id.test(req.params.itemId) || !['open', 'completed'].includes(req.body?.status)) return res.status(400).json({ message: 'Provide a valid tracker status.' }); next(); }, updateWorkItem);
export default router;
