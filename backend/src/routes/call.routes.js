import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as calls from '../controllers/call.controller.js';

const router = Router();
router.use(protect, authorize('Doctor', 'Patient'));

router.get('/:id', calls.getCall);
router.post('/:id/no-show', authorize('Doctor'), calls.markNoShow);

export default router;
