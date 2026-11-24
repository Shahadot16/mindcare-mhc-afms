import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { dashboard } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/', protect, dashboard); // numbers tailored to the logged-in role

export default router;
