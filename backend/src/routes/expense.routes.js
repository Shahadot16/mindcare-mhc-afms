import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as expenses from '../controllers/expense.controller.js';

const router = Router();
router.use(protect, authorize('Admin'));

router.get('/', expenses.listExpenses);
router.post('/', expenses.createExpense);
router.put('/:id', expenses.updateExpense);
router.delete('/:id', expenses.deleteExpense);

export default router;
