import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

export const sendMessageValidation: ValidationChain[] = [
  body('conversationId').optional().isString().trim(),
  body('userId').isString().trim().notEmpty().withMessage('userId is required'),
  body('message').isString().trim().notEmpty().withMessage('message is required')
    .isLength({ max: 5000 }).withMessage('message must not exceed 5000 characters'),
  body('metadata').optional().isObject(),
];

export const createTicketValidation: ValidationChain[] = [
  body('conversationId').isString().trim().notEmpty().withMessage('conversationId is required'),
  body('subject').isString().trim().notEmpty().withMessage('subject is required')
    .isLength({ max: 200 }).withMessage('subject must not exceed 200 characters'),
  body('description').isString().trim().notEmpty().withMessage('description is required')
    .isLength({ max: 5000 }).withMessage('description must not exceed 5000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('category').optional().isString().trim(),
  body('metadata').optional().isObject(),
];

export const getHistoryValidation: ValidationChain[] = [
  body('conversationId').isString().trim().notEmpty().withMessage('conversationId is required'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const validateFileUpload = (file: Express.Multer.File | undefined): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (sanitizedFilename.length === 0) {
    return { valid: false, error: 'Invalid filename' };
  }

  return { valid: true };
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 5000);
};

export const sanitizeMetadata = (metadata: unknown): Record<string, unknown> => {
  if (typeof metadata !== 'object' || metadata === null) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  const obj = metadata as Record<string, unknown>;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof key === 'string' && key.length <= 100) {
      if (typeof value === 'string') {
        sanitized[key] = value.slice(0, 1000);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.slice(0, 50);
      }
    }
  }

  return sanitized;
};
