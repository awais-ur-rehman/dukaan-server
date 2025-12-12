import { Router } from 'express';
import { MerchantController } from './controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const controller = new MerchantController();

router.post('/', authenticate, controller.create);
router.get('/pending', authenticate, authorize('admin', 'super_admin'), controller.findPending);
router.get('/:id', controller.findById);
router.patch('/:id', authenticate, controller.update);
router.get('/', controller.findNearby);
router.patch('/:id/verify', authenticate, authorize('admin', 'super_admin'), controller.verify);

export default router;

