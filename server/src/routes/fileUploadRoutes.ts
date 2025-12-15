import express from 'express';
import batchUpload from '../controllers/batchUploadController';
import { authenticateUser } from '../middleware/authentication';
import { validateFileUpload } from '../middleware/fileValidation';

const router = express.Router();

// Batch document upload
router.post('/batch',
  authenticateUser,
  validateFileUpload({ fieldName: 'document' }),
  batchUpload
);

export default router;