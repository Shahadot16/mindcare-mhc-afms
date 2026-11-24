import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as messages from '../controllers/message.controller.js';

const router = Router();
router.use(protect);

router.get('/unread-count', messages.unreadCount);
router.get('/contacts', authorize('Doctor', 'Patient'), messages.contacts);
router.get('/:userId', authorize('Doctor', 'Patient'), messages.conversation);
router.post('/:userId', authorize('Doctor', 'Patient'), messages.sendMessage);

export default router;
