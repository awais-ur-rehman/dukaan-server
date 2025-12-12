import { Router } from 'express';
import { ProductController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new ProductController();

router.post('/merchants/:mid/products', authenticate, controller.create);
router.get('/merchants/:mid/products', controller.findByMerchantId);
router.get('/products/:id', controller.findById);
router.patch('/products/:id', authenticate, controller.update);
router.delete('/products/:id', authenticate, controller.delete);

export default router;

