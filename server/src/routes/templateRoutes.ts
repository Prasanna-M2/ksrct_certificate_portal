import { Router } from 'express';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/templateController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.post('/', authorize(['CREATOR', 'ADMIN', 'CERTIFICATE_COORDINATOR']), createTemplate);
router.put('/:id', authorize(['CREATOR', 'ADMIN', 'CERTIFICATE_COORDINATOR']), updateTemplate);
router.delete('/:id', authorize(['CREATOR', 'ADMIN']), deleteTemplate);

export default router;
