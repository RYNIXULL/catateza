import { Router } from 'express';
import { login, createCashier, updateCashier, deleteCashier, changePassword } from '../controllers/auth.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Public Routes
router.post('/login', login);

// Authenticated Routes (Any logged in user can change password)
router.put('/change-password', authenticate, changePassword);

// Protected Routes (Owner Only)
router.post('/cashier', authenticate, requireRole(['OWNER']), createCashier);
router.put('/cashier/:id', authenticate, requireRole(['OWNER']), updateCashier);
router.delete('/cashier/:id', authenticate, requireRole(['OWNER']), deleteCashier);

export default router;
