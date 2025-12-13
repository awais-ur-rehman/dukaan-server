import { Router } from 'express';
import { UploadController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new UploadController();

router.post('/upload/image', authenticate, controller.uploadImage);

export default router;

