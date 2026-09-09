import { Router } from 'express';

import { addGroupMember, createGroupChat, createOrGetDirectChat, deleteGroup, getMyChats, removeGroupMember, updateGroup, updateGroupMemberRole } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import { validateChatId, validateDirectChat, validateGroupChat, validateGroupMember, validateGroupMemberRole, validateGroupUpdate } from '../middleware/validate.js';

const router = Router();

router.get('/', protect, getMyChats);
router.post('/group', protect, validateGroupChat, createGroupChat);
router.post('/direct', protect, validateDirectChat, createOrGetDirectChat);
router.post('/:chatId/members', protect, validateGroupMember, addGroupMember);
router.delete('/:chatId/members/:userId', protect, validateGroupMember, removeGroupMember);
router.put('/:chatId/members/:userId/role', protect, validateGroupMemberRole, updateGroupMemberRole);
router.put('/:chatId/group', protect, validateGroupUpdate, updateGroup);
router.delete('/:chatId/group', protect, validateChatId, deleteGroup);

export default router;
