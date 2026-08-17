import { Router } from 'express';
import { getUsers, createUser, updateUserStatus, updateUserRole, updateProfile } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.patch('/profile', updateProfile);
router.get('/', authorize(['HOD', 'ADMIN']), getUsers);
router.post('/', authorize(['ADMIN']), createUser);
router.patch('/:id/status', authorize(['ADMIN']), updateUserStatus);
router.patch('/:id/role', authorize(['ADMIN']), updateUserRole);

export default router;
