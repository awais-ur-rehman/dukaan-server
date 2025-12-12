import { Router } from 'express';
import { CartController } from './controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const controller = new CartController();

router.post('/cart', authenticate, authorize('customer'), controller.addToCart);
router.get('/cart', authenticate, authorize('customer'), controller.getCart);
router.patch('/cart/:merchantId/items/:productId', authenticate, authorize('customer'), controller.updateCartItem);
router.delete('/cart/:merchantId/items/:productId', authenticate, authorize('customer'), controller.removeFromCart);
router.delete('/cart/:merchantId', authenticate, authorize('customer'), controller.clearCart);

export default router;

