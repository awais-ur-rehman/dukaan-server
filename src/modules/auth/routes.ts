import { Router } from 'express';
import { AuthController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new AuthController();

router.post('/send-otp', controller.sendOTP);
router.post('/verify-otp', controller.verifyOTP);
router.post('/refresh', controller.refresh);
router.post('/logout', authenticate, controller.logout);

export default router;

