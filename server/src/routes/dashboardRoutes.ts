import { Router } from 'express';
import {
  getStudentDashboard,
  getStaffDashboard,
  getHodDashboard,
  getAdminDashboard,
  getCoordinatorDashboard,
  getCreatorDashboard,
} from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/student', authorize(['STUDENT']), getStudentDashboard);
router.get('/staff', authorize(['STAFF', 'MENTOR', 'ADVISOR', 'HOD', 'ADMIN', 'CREATOR']), getStaffDashboard);
router.get('/hod', authorize(['STAFF', 'HOD', 'ADMIN', 'CREATOR']), getHodDashboard);
router.get('/coordinator', authorize(['STAFF', 'CERTIFICATE_COORDINATOR', 'ADMIN']), getCoordinatorDashboard);
router.get('/creator', authorize(['CREATOR', 'ADMIN']), getCreatorDashboard);
router.get('/admin', authorize(['CREATOR', 'ADMIN']), getAdminDashboard);

export default router;
