import { Router } from 'express';

import { uploadMedia } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';
import { uploadChatMedia } from '../middleware/upload.js';

const router = Router();

router.post('/media', protect, uploadChatMedia.single('file'), uploadMedia);

export default router;
