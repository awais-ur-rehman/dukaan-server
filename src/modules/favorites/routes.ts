import { Router } from 'express';
import { FavoriteController } from './controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const controller = new FavoriteController();

router.post('/favorites', authenticate, authorize('customer'), controller.addFavorite);
router.get('/favorites', authenticate, authorize('customer'), controller.getFavorites);
router.delete('/favorites/:id', authenticate, authorize('customer'), controller.removeFavorite);

export default router;

