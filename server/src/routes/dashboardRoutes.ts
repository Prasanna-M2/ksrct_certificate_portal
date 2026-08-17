import { Router } from 'express';
import { getStudentDashboard, getHodDashboard, getAdminDashboard } from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/student', authorize(['STUDENT']), getStudentDashboard);
router.get('/hod', authorize(['HOD', 'ADMIN']), getHodDashboard);
router.get('/admin', authorize(['ADMIN']), getAdminDashboard);

export default router;
