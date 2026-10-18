import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const userController = new UserController();

// Only owner can manage employees
router.use(authenticate);
router.use(requireRole(['OWNER']));

router.get('/employees', userController.getAllEmployees);
router.put('/:id/assign', userController.assignStore);

export default router;
