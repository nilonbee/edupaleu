import express from 'express';
import fileupload from '../controllers/fileUploadController';
import batchUpload from '../controllers/batchUploadController';
import { authenticateUser } from '../middleware/authentication';
import { validateFileUpload } from '../middleware/fileValidation';

const router = express.Router();

// All file upload routes require authentication
// Marriage certificate upload (single file)
router.post('/',
  authenticateUser,
  validateFileUpload({ fieldName: 'marriageCertificate', isMarriageCert: true }),
  fileupload
);

// Batch document upload
router.post('/batch',
  authenticateUser,
  validateFileUpload({ fieldName: 'document' }),
  batchUpload
);

export default router;