import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as appts from '../controllers/appointment.controller.js';

const router = Router();
router.use(protect);

// Specific paths first, then "/:id"
router.post('/', authorize('Patient'), appts.bookAppointment);
router.get('/', authorize('Admin', 'Staff'), appts.allAppointments);
router.get('/mine', authorize('Patient'), appts.myAppointments);
router.get('/doctor', authorize('Doctor'), appts.doctorAppointments);
router.get('/lab-tests', authorize('Admin', 'Staff'), appts.labTests);
router.get('/:id', appts.getAppointment);
router.patch('/:id/approve', authorize('Admin', 'Staff'), appts.approveAppointment);
router.patch('/:id/cancel', authorize('Admin', 'Staff', 'Patient'), appts.cancelAppointment);
router.patch('/:id/diagnosis', authorize('Doctor'), appts.submitDiagnosis);
router.patch('/:id/tests/:testItemId', authorize('Patient'), appts.respondToTest);
router.patch('/:id/tests/:testItemId/complete', authorize('Admin', 'Staff'), appts.completeTest);

export default router;
