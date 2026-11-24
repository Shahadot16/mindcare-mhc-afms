import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import * as doctors from '../controllers/doctor.controller.js';

const router = Router();
router.use(protect);

router.get('/', doctors.listDoctors);
router.get('/:id', doctors.getDoctor);
router.get('/:id/slots', doctors.getSlots);

export default router;
