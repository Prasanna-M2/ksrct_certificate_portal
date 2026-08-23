import { Router } from 'express';
import { createSupportTicket, getSupportTickets, updateTicketStatus } from '../controllers/supportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createSupportTicket);
router.get('/', authorize(['CREATOR']), getSupportTickets);
router.patch('/:id/status', authorize(['CREATOR']), updateTicketStatus);

export default router;
