import { Router } from 'express';
import { NotificationController } from './controller';

const router = Router();
const controller = new NotificationController();

router.post('/notifications/send', controller.send);

export default router;

