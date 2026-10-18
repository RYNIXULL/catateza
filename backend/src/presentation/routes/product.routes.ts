import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const productController = new ProductController();

// All product routes require authentication
router.use(authenticate);

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// OWNER and CASHIER can create products, but only OWNER can update/delete
router.post('/bulk', requireRole(['OWNER', 'CASHIER']), productController.createBulkProducts);
router.post('/', requireRole(['OWNER', 'CASHIER']), productController.createProduct);
router.put('/:id', requireRole(['OWNER']), productController.updateProduct);
router.delete('/:id', requireRole(['OWNER']), productController.deleteProduct);

export default router;
