import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as payroll from '../controllers/payroll.controller.js';

const router = Router();
router.use(protect, authorize('Admin'));

router.get('/', payroll.listPayroll);
router.get('/preview', payroll.previewPayroll);
router.post('/', payroll.generatePayroll);
router.patch('/:id/pay', payroll.payPayroll);

export default router;
