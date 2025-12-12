import { Router } from 'express';
import { RiderController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new RiderController();

router.post('/merchants/:mid/riders', authenticate, controller.create);
router.get('/merchants/:mid/riders', authenticate, controller.findByMerchantId);
router.patch('/riders/:id', authenticate, controller.update);

export default router;

