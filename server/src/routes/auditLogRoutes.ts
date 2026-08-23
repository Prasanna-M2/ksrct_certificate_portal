import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/', authorize(['CREATOR']), getAuditLogs);

export default router;
