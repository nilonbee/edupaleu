import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BadRequestError } from '../errors';

// Allowed file types for document uploads
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Maximum file size for marriage certificates (5MB)
export const MAX_MARRIAGE_CERT_SIZE = 5 * 1024 * 1024;

/**
 * Sanitize filename to prevent path traversal attacks
 */
export const sanitizeFileName = (fileName: string): string => {
  // Remove path separators and dangerous characters
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/^\./, '_')
    .substring(0, 255); // Limit filename length
};

/**
 * Validate file type
 */
export const validateFileType = (mimetype: string, allowedTypes: string[] = ALLOWED_FILE_TYPES): boolean => {
  return allowedTypes.includes(mimetype);
};

/**
 * Validate file size
 */
export const validateFileSize = (size: number, maxSize: number = MAX_FILE_SIZE): boolean => {
  return size > 0 && size <= maxSize;
};

/**
 * Middleware to validate uploaded files
 */
export const validateFileUpload = (options?: {
  maxSize?: number;
  allowedTypes?: string[];
  fieldName?: string;
  isMarriageCert?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const {
      maxSize = options?.isMarriageCert ? MAX_MARRIAGE_CERT_SIZE : MAX_FILE_SIZE,
      allowedTypes = ALLOWED_FILE_TYPES,
      fieldName = 'document',
    } = options || {};

    const file = (req as any).files?.[fieldName];

    if (!file) {
      throw new BadRequestError(`No file provided in field: ${fieldName}`);
    }

    // Validate file size
    if (!validateFileSize(file.size, maxSize)) {
      throw new BadRequestError(
        `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
      );
    }

    // Validate file type
    if (!validateFileType(file.mimetype, allowedTypes)) {
      throw new BadRequestError(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    // Sanitize filename
    if (file.name) {
      file.name = sanitizeFileName(file.name);
    }

    next();
  };
};

