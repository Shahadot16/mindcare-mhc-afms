// Mounts every feature router under /api
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import userRoutes from './user.routes.js';
import doctorRoutes from './doctor.routes.js';
import appointmentRoutes from './appointment.routes.js';
import medicalTestRoutes from './medicalTest.routes.js';
import leaveRoutes from './leave.routes.js';
import { assessmentRouter, moodRouter, patientRouter } from './wellbeing.routes.js';
import billingRoutes from './billing.routes.js';
import financeRoutes from './finance.routes.js';
import expenseRoutes from './expense.routes.js';
import payrollRoutes from './payroll.routes.js';
import messageRoutes from './message.routes.js';
import notificationRoutes from './notification.routes.js';
import auditRoutes from './audit.routes.js';
import callRoutes from './call.routes.js';

const router = Router();

// Access
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);

// Clinic
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/tests', medicalTestRoutes);
router.use('/leaves', leaveRoutes);

// Wellbeing
router.use('/assessments', assessmentRouter);
router.use('/moods', moodRouter);
router.use('/patients', patientRouter);

// Money
router.use('/billing', billingRoutes);
router.use('/finance', financeRoutes);
router.use('/expenses', expenseRoutes);
router.use('/payroll', payrollRoutes);

// Communication & system
router.use('/messages', messageRoutes);
router.use('/calls', callRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);

export default router;
