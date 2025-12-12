import { Router } from 'express';
import { AddressController } from './controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const controller = new AddressController();

router.post('/addresses', authenticate, authorize('customer'), controller.create);
router.get('/addresses', authenticate, authorize('customer'), controller.list);
router.patch('/addresses/:id', authenticate, authorize('customer'), controller.update);
router.delete('/addresses/:id', authenticate, authorize('customer'), controller.delete);
router.patch('/addresses/:id/set-default', authenticate, authorize('customer'), controller.setDefault);

export default router;

