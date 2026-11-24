import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as billing from '../controllers/billing.controller.js';

const router = Router();
router.use(protect);

router.get('/unbilled', authorize('Admin', 'Staff'), billing.unbilledAppointments);
router.post('/invoices', authorize('Admin', 'Staff'), billing.generateInvoice);
router.get('/invoices', authorize('Admin', 'Staff'), billing.allInvoices);
router.get('/invoices/mine', authorize('Patient'), billing.myInvoices);
router.get('/invoices/:id', billing.getInvoice);
router.post('/pay', authorize('Patient'), billing.payInvoice);
router.get('/payments/mine', authorize('Patient'), billing.myPayments);

export default router;
