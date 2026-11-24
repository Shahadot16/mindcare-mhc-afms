import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as leaves from '../controllers/leave.controller.js';

const router = Router();
router.use(protect, authorize('Doctor', 'Admin'));

router.get('/', leaves.listLeaves);
router.post('/', leaves.addLeave);
router.delete('/:id', leaves.removeLeave);

export default router;
