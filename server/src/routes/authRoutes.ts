import { Router } from 'express';
import {
  login,
  register,
  checkRegisterNumber,
  completeStudentSetup,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/check-register', checkRegisterNumber);
router.post('/complete-setup', completeStudentSetup);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
