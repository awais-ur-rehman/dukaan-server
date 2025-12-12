import { Router } from 'express';
import { FeedbackController } from './controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const controller = new FeedbackController();

router.post('/feedback', authenticate, authorize('customer'), controller.create);
router.get('/feedback', authenticate, authorize('customer'), controller.getByCustomer);

export default router;

