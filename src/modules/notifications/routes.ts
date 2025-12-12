import { Router } from 'express';
import { NotificationController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new NotificationController();

router.post('/notifications/send', controller.send);
router.get('/notifications', authenticate, controller.getByUser);
router.patch('/notifications/:id/read', authenticate, controller.markAsRead);
router.patch('/notifications/read-all', authenticate, controller.markAllAsRead);

export default router;

