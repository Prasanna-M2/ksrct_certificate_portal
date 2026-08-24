import { Router } from 'express';
import {
  getUsers,
  getStaff,
  getAvailableMentors,
  getAvailableAdvisors,
  getEeeStructure,
  createUser,
  updateUserStatus,
  assignStaffResponsibilities,
  assignYearAdvisors,
  assignStudentMentorAdvisor,
  updateProfile,
  assignMentor,
  updateUserRole,
  deleteUser,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public Mentors and Advisors for student registration
router.get('/mentors', getAvailableMentors);
router.get('/advisors', getAvailableAdvisors);

router.use(authenticate);

// Student Profile / Available Selectors
router.get('/structure', getEeeStructure);
router.patch('/profile', updateProfile);
router.put('/profile', updateProfile);

// Staff & Student Lists
router.get('/staff', authorize(['HOD', 'ADMIN', 'CREATOR', 'STAFF']), getStaff);
router.get('/', authorize(['HOD', 'ADMIN', 'CREATOR', 'STAFF', 'MENTOR', 'ADVISOR']), getUsers);

// Creator & HOD Management
router.post('/', authorize(['ADMIN', 'CREATOR']), createUser);
router.patch('/assign-student', authorize(['ADMIN', 'CREATOR', 'HOD']), assignStudentMentorAdvisor);
router.patch('/assign-mentor', authorize(['ADMIN', 'CREATOR', 'HOD']), assignMentor);
router.patch('/assign-year-advisors', authorize(['ADMIN', 'CREATOR']), assignYearAdvisors);
router.patch('/:staffId/responsibilities', authorize(['ADMIN', 'CREATOR']), assignStaffResponsibilities);
router.patch('/:id/status', authorize(['ADMIN', 'CREATOR']), updateUserStatus);
router.patch('/:id/role', authorize(['ADMIN', 'CREATOR']), updateUserRole);
router.delete('/:id', authorize(['ADMIN', 'CREATOR']), deleteUser);

export default router;
