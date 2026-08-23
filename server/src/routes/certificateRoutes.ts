import { Router } from 'express';
import {
  uploadCertificate,
  getCertificates,
  getCertificateById,
  approveCertificate,
  rejectCertificate,
  resubmitCertificate,
  issueCertificate,
  getVerificationByCode,
  deleteCertificate,
  getCertificateFile,
} from '../controllers/certificateController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadCertificateMiddleware } from '../middleware/upload';

const router = Router();

// Public route for QR code verification (no auth required)
router.get('/verify-code/:code', getVerificationByCode);

// Authenticated routes
router.use(authenticate);

router.get('/', getCertificates);
router.post(
  '/',
  uploadCertificateMiddleware.fields([
    { name: 'file', maxCount: 1 },
    { name: 'supportingFile', maxCount: 1 },
  ]),
  uploadCertificate
);
router.get('/:id', getCertificateById);
router.get('/:id/file', getCertificateFile);
router.delete('/:id', deleteCertificate);

// Resubmit route for students
router.post(
  '/:id/resubmit',
  uploadCertificateMiddleware.fields([
    { name: 'file', maxCount: 1 },
    { name: 'supportingFile', maxCount: 1 },
  ]),
  resubmitCertificate
);

// Workflow actions for approver roles
router.post(
  '/:id/approve',
  authorize(['MENTOR', 'ADVISOR', 'HOD', 'STAFF', 'ADMIN', 'CERTIFICATE_COORDINATOR']),
  approveCertificate
);
router.post(
  '/:id/reject',
  authorize(['MENTOR', 'ADVISOR', 'HOD', 'STAFF', 'ADMIN', 'CERTIFICATE_COORDINATOR']),
  rejectCertificate
);
router.post(
  '/:id/issue',
  authorize(['CERTIFICATE_COORDINATOR', 'ADMIN', 'HOD']),
  issueCertificate
);

export default router;
