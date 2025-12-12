import { Router } from 'express';
import { CheckoutController } from './controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const controller = new CheckoutController();

router.post('/checkout', authenticate, authorize('customer'), controller.checkout);

export default router;

