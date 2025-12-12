import { Router } from 'express';
import { DisputeController } from './controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const controller = new DisputeController();

router.post('/disputes', authenticate, authorize('customer'), controller.create);
router.get('/disputes', authenticate, authorize('customer'), controller.getByCustomer);
router.get('/disputes/:id', authenticate, authorize('customer'), controller.getById);
router.post('/disputes/:id/comments', authenticate, authorize('customer'), controller.addComment);

export default router;

