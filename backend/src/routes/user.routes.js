import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as users from '../controllers/user.controller.js';

const router = Router();
router.use(protect, authorize('Admin'));

router.get('/', users.listUsers);
router.post('/', users.createUser);
router.put('/:id', users.updateUser);
router.delete('/:id', users.deleteUser);
router.put('/:id/schedule', users.updateSchedule);

export default router;
