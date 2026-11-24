import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { financeReport, profitLoss, operations } from '../controllers/finance.controller.js';

const router = Router();
router.use(protect, authorize('Admin'));

router.get('/', financeReport);
router.get('/pnl', profitLoss);
router.get('/operations', operations);

export default router;
