import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticate, requireStoreIsolation } from '../middlewares/auth.middleware';

const router = Router();
const transactionController = new TransactionController();

// All transaction routes require authentication
router.use(authenticate);
// Ensure store isolation logic is applied
router.use(requireStoreIsolation);

router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getTransactions);

export default router;
