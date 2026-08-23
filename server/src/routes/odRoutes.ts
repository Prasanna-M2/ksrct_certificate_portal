import { Router } from 'express';
import {
  createOdRequest,
  getOdRequests,
  getOdRequestById,
  approveOdRequest,
  rejectOdRequest,
  resubmitOdRequest,
  deleteOdRequest,
} from '../controllers/odController';
import { authenticate, authorize } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const uploadDir = path.join(__dirname, '../../../uploads/certificates');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `od-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage });

const router = Router();

router.use(authenticate);

router.post('/', upload.single('supportingFile'), createOdRequest);
router.get('/', getOdRequests);
router.get('/:id', getOdRequestById);
router.delete('/:id', deleteOdRequest);

// Resubmit route for students
router.post('/:id/resubmit', upload.single('supportingFile'), resubmitOdRequest);

// Workflow actions for approver roles (Supports both POST & PATCH for flexibility)
router.post(
  '/:id/approve',
  authorize(['MENTOR', 'ADVISOR', 'HOD', 'STAFF', 'ADMIN']),
  approveOdRequest
);
router.patch(
  '/:id/approve',
  authorize(['MENTOR', 'ADVISOR', 'HOD', 'STAFF', 'ADMIN']),
  approveOdRequest
);

router.post(
  '/:id/reject',
  authorize(['MENTOR', 'ADVISOR', 'HOD', 'STAFF', 'ADMIN']),
  rejectOdRequest
);
router.patch(
  '/:id/reject',
  authorize(['MENTOR', 'ADVISOR', 'HOD', 'STAFF', 'ADMIN']),
  rejectOdRequest
);

export default router;
