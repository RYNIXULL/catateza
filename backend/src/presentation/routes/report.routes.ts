import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const reportController = new ReportController();

// Only OWNER should be able to view financial reports
router.use(authenticate);
router.use(requireRole(['OWNER']));

router.get('/profit-loss', reportController.getProfitLoss);

export default router;
