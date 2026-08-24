import { Router } from 'express';
import {
  createOdRequest,
  getOdRequests,
  getOdRequestById,
  getOdFile,
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
const flexibleUpload = upload.fields([
  { name: 'supportingFile', maxCount: 1 },
  { name: 'documentFile', maxCount: 1 },
  { name: 'file', maxCount: 1 },
]);

const router = Router();

router.use(authenticate);

router.post('/', flexibleUpload, createOdRequest);
router.get('/', getOdRequests);
router.get('/my', getOdRequests);
router.get('/:id', getOdRequestById);
router.get('/:id/file', getOdFile);
router.delete('/:id', deleteOdRequest);

// Resubmit route for students (Supports POST, PUT, PATCH)
router.post('/:id/resubmit', flexibleUpload, resubmitOdRequest);
router.put('/:id/resubmit', flexibleUpload, resubmitOdRequest);
router.patch('/:id/resubmit', flexibleUpload, resubmitOdRequest);

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
