import { Router } from 'express';
import { CODLedgerController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new CODLedgerController();

router.get('/merchants/:mid/cod-ledger', authenticate, controller.findByMerchantId);
router.post('/merchants/:mid/settlements', authenticate, controller.createSettlement);

export default router;

