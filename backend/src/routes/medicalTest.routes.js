import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as tests from '../controllers/medicalTest.controller.js';

const router = Router();
router.use(protect);

router.get('/', tests.listTests);
router.post('/', authorize('Admin', 'Staff'), tests.createTest);
router.put('/:id', authorize('Admin', 'Staff'), tests.updateTest);
router.delete('/:id', authorize('Admin', 'Staff'), tests.deleteTest);

export default router;
