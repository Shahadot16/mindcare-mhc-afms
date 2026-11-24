import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import * as notifications from '../controllers/notification.controller.js';

const router = Router();
router.use(protect);

router.get('/', notifications.listNotifications);
router.patch('/read-all', notifications.markAllRead);
router.patch('/:id/read', notifications.markRead);

export default router;
