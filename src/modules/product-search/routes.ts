import { Router } from 'express';
import { ProductSearchController } from './controller';

const router = Router();
const controller = new ProductSearchController();

router.get('/products/search', controller.search);

export default router;

