import { Router } from 'express';
import { getStoreSettings, updateStoreSettings, getAllStores, createStore, getStoreDashboard, updateStore, deleteStore, getStoreCashiers } from '../controllers/store.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/settings', authenticate, requireRole(['OWNER']), getStoreSettings);
router.put('/settings', authenticate, requireRole(['OWNER']), updateStoreSettings);
router.get('/', authenticate, requireRole(['OWNER', 'CASHIER']), getAllStores);
router.post('/', authenticate, requireRole(['OWNER']), createStore);
router.get('/:id/dashboard', authenticate, requireRole(['OWNER', 'CASHIER']), getStoreDashboard);
router.get('/:id/cashiers', authenticate, requireRole(['OWNER']), getStoreCashiers);
router.put('/:id', authenticate, requireRole(['OWNER']), updateStore);
router.delete('/:id', authenticate, requireRole(['OWNER']), deleteStore);

export default router;
