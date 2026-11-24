import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as wellbeing from '../controllers/wellbeing.controller.js';

// PHQ-9 / GAD-7 assessments
export const assessmentRouter = Router();
assessmentRouter.use(protect);
assessmentRouter.get('/definitions', wellbeing.definitions);
assessmentRouter.post('/', authorize('Patient'), wellbeing.submitAssessment);
assessmentRouter.get('/mine', authorize('Patient'), wellbeing.myAssessments);
assessmentRouter.get('/alerts', authorize('Doctor', 'Admin'), wellbeing.riskAlerts);
assessmentRouter.patch('/:id/review', authorize('Doctor', 'Admin'), wellbeing.reviewAssessment);

// Daily mood tracker
export const moodRouter = Router();
moodRouter.use(protect, authorize('Patient'));
moodRouter.put('/', wellbeing.saveMood);
moodRouter.get('/mine', wellbeing.myMoods);

// Clinical patient records
export const patientRouter = Router();
patientRouter.use(protect);
patientRouter.get('/', authorize('Doctor', 'Admin'), wellbeing.listPatients);
patientRouter.get('/:id/record', wellbeing.patientRecord);
