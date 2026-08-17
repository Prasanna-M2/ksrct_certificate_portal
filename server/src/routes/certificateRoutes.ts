import { Router } from 'express';
import {
  uploadCertificate,
  getCertificates,
  getCertificateById,
  approveCertificate,
  rejectCertificate,
  deleteCertificate,
  getCertificateFile,
} from '../controllers/certificateController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadCertificateMiddleware } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', getCertificates);
router.post('/', uploadCertificateMiddleware.single('file'), uploadCertificate);
router.get('/:id', getCertificateById);
router.get('/:id/file', getCertificateFile);
router.delete('/:id', deleteCertificate);

// HOD & Admin only routes
router.post('/:id/approve', authorize(['HOD', 'ADMIN']), approveCertificate);
router.post('/:id/reject', authorize(['HOD', 'ADMIN']), rejectCertificate);

export default router;
