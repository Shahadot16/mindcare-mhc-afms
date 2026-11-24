import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { listAudit } from '../controllers/audit.controller.js';

const router = Router();

router.get('/', protect, authorize('Admin'), listAudit);

export default router;
