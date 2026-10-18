import { Router } from 'express';
import { login, createCashier, updateCashier, deleteCashier } from '../controllers/auth.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Public Routes
router.post('/login', login);

// Protected Routes (Owner Only)
router.post('/cashier', authenticate, requireRole(['OWNER']), createCashier);
router.put('/cashier/:id', authenticate, requireRole(['OWNER']), updateCashier);
router.delete('/cashier/:id', authenticate, requireRole(['OWNER']), deleteCashier);

export default router;
