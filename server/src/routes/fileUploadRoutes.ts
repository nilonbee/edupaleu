import express from 'express';
import fileupload from '../controllers/fileUploadController';
import batchUpload from '../controllers/batchUploadController';
import { authenticateUser } from '../middleware/authentication';
import { validateFileUpload, validateFileType, validateFileSize, sanitizeFileName, MAX_DISPLAY_PICTURE_SIZE, MAX_MARRIAGE_CERT_SIZE } from '../middleware/fileValidation';

const router = express.Router();

// Custom validation middleware that handles both marriageCertificate and file fields
const validateFileUploadFlexible = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const documentType = (req as any).body?.documentType;
    const file = (req as any).files?.file || (req as any).files?.marriageCertificate;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file provided"
      });
    }

    // Use appropriate validation based on document type
    if (documentType === 'USER_DISPLAY_PICTURE') {
      // For display pictures, only allow images, max 5MB
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validateFileType(file.mimetype, allowedImageTypes)) {
        return res.status(400).json({
          success: false,
          message: "Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed for display pictures."
        });
      }
      if (!validateFileSize(file.size, MAX_DISPLAY_PICTURE_SIZE)) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds maximum allowed size of ${MAX_DISPLAY_PICTURE_SIZE / (1024 * 1024)}MB`
        });
      }
    } else {
      // Use standard validation for other document types (marriage certificates)
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!validateFileType(file.mimetype, allowedTypes)) {
        return res.status(400).json({
          success: false,
          message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        });
      }
      if (!validateFileSize(file.size, MAX_MARRIAGE_CERT_SIZE)) {
        return res.status(400).json({
          success: false,
          message: `File size exceeds maximum allowed size of ${MAX_MARRIAGE_CERT_SIZE / (1024 * 1024)}MB`
        });
      }
    }

    // Sanitize filename
    if (file.name) {
      file.name = sanitizeFileName(file.name);
    }

    next();
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "File validation failed"
    });
  }
};

// All file upload routes require authentication
// Single file upload (supports both marriage certs and display pictures)
router.post('/',
  authenticateUser,
  validateFileUploadFlexible,
  fileupload
);

// Batch document upload
router.post('/batch',
  authenticateUser,
  validateFileUpload({ fieldName: 'document' }),
  batchUpload
);

export default router;