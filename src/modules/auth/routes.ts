import { Router } from 'express';
import { AuthController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new AuthController();

// New endpoints
router.post('/signup', controller.signup);
router.post('/verify-signup-otp', controller.verifySignupOtp);
router.post('/login', controller.login);
router.post('/rider/login', controller.riderLogin);
router.post('/reset-password-request', controller.requestPasswordReset);
router.post('/reset-password', controller.resetPassword);

// Existing endpoints (kept for backward compatibility)
router.post('/send-otp', controller.sendOTP);
router.post('/verify-otp', controller.verifyOTP);
router.post('/refresh', controller.refresh);
router.post('/logout', authenticate, controller.logout);

export default router;

