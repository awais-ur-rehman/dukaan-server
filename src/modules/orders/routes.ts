import { Router } from 'express';
import { OrderController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new OrderController();

router.post('/merchants/:mid/orders', authenticate, controller.create);
router.get('/orders/:id', authenticate, controller.findById);
router.put('/orders/:id/merchant-accept', authenticate, controller.merchantAccept);
router.put('/orders/:id/customer-confirm', authenticate, controller.customerConfirm);
router.put('/orders/:id/assign-rider', authenticate, controller.assignRider);
router.put('/orders/:id/rider-update', authenticate, controller.riderUpdate);
router.get('/merchants/:mid/orders', authenticate, controller.findByMerchantId);
router.get('/orders', authenticate, controller.findByCustomerId);
router.get('/riders/orders', authenticate, controller.findByRiderId);

export default router;

