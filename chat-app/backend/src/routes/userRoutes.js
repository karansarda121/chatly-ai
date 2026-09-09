import { Router } from 'express';

import { addContactByEmail, blockUser, getBlockedUsers, getUsers, removeContact, searchUsers, unblockUser } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { validateUserCursor, validateUserId, validateUserSearch } from '../middleware/validate.js';

const router = Router();

router.get('/', protect, validateUserCursor, getUsers);
router.get('/blocked', protect, getBlockedUsers);
router.get('/search', protect, validateUserSearch, validateUserCursor, searchUsers);
router.post('/contacts', protect, addContactByEmail);
router.delete('/contacts/:userId', protect, validateUserId, removeContact);
router.put('/:userId/block', protect, validateUserId, blockUser);
router.delete('/:userId/block', protect, validateUserId, unblockUser);

export default router;
