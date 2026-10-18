import { Router } from 'express';
import { CashFlowController } from '../controllers/cashflow.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const cashFlowController = new CashFlowController();

router.use(authenticate);

router.get('/:storeId', cashFlowController.getByStore);
router.post('/', cashFlowController.create);
router.delete('/:id', cashFlowController.delete);

export default router;
