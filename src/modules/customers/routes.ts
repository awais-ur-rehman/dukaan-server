import { Router } from 'express';
import { CustomerController } from './controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const controller = new CustomerController();

router.get('/customers/profile', authenticate, authorize('customer'), controller.getProfile);
router.patch('/customers/profile', authenticate, authorize('customer'), controller.updateProfile);

export default router;

