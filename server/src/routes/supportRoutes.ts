import { Router } from 'express';
import { createSupportTicket, getSupportTickets, updateTicketStatus } from '../controllers/supportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createSupportTicket);
router.get('/', getSupportTickets);
router.patch('/:id/status', authorize(['ADMIN']), updateTicketStatus);

export default router;
