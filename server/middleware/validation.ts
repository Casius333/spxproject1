import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { config } from '../config';

// Common validation rules
export const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Must provide a valid email address');

export const passwordValidation = body('password')
  .isLength({ min: config.BUSINESS.MIN_PASSWORD_LENGTH })
  .withMessage(`Password must be at least ${config.BUSINESS.MIN_PASSWORD_LENGTH} characters long`)
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

export const usernameValidation = body('username')
  .isLength({ min: 3, max: 30 })
  .matches(/^[a-zA-Z0-9_]+$/)
  .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores');

export const phoneValidation = body('phoneNumber')
  .optional()
  .isMobilePhone('any')
  .withMessage('Must provide a valid phone number');

export const betAmountValidation = body('amount')
  .isFloat({ min: config.BUSINESS.MIN_BET_AMOUNT, max: config.BUSINESS.MAX_BET_AMOUNT })
  .withMessage(`Bet amount must be between $${config.BUSINESS.MIN_BET_AMOUNT} and $${config.BUSINESS.MAX_BET_AMOUNT}`);

export const withdrawalAmountValidation = body('amount')
  .isFloat({ min: config.BUSINESS.MIN_WITHDRAWAL_AMOUNT, max: config.BUSINESS.MAX_WITHDRAWAL_AMOUNT })
  .withMessage(`Withdrawal amount must be between $${config.BUSINESS.MIN_WITHDRAWAL_AMOUNT} and $${config.BUSINESS.MAX_WITHDRAWAL_AMOUNT}`);

export const idParamValidation = param('id')
  .isInt({ min: 1 })
  .withMessage('ID must be a positive integer');

// Validation sets for common operations
export const registerValidation = [
  emailValidation,
  passwordValidation,
  usernameValidation,
  phoneValidation,
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .withMessage('First name must be 1-50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .withMessage('Last name must be 1-50 characters'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Date of birth must be a valid date'),
];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const profileUpdateValidation = [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .withMessage('First name must be 1-50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .withMessage('Last name must be 1-50 characters'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Date of birth must be a valid date'),
  phoneValidation,
];

export const passwordChangeValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  passwordValidation.custom((value, { req }) => {
    if (value === req.body.currentPassword) {
      throw new Error('New password must be different from current password');
    }
    return true;
  }),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
];

export const otpValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must provide a valid email address'),
  body('token')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
];

export const depositValidation = [
  body('amount')
    .isFloat({ min: 1, max: 50000 })
    .withMessage('Deposit amount must be between $1 and $50,000'),
  body('method')
    .isIn(['credit_card', 'bank_transfer', 'crypto', 'paypal'])
    .withMessage('Invalid payment method'),
  body('promotionId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Promotion ID must be a positive integer'),
];

export const betValidation = [
  betAmountValidation,
  body('gameId')
    .isInt({ min: 1 })
    .withMessage('Game ID must be a positive integer'),
  body('betType')
    .optional()
    .isIn(['spin', 'max_bet', 'auto_spin'])
    .withMessage('Invalid bet type'),
];

export const withdrawalValidation = [
  withdrawalAmountValidation,
  body('method')
    .isIn(['bank_transfer', 'crypto', 'paypal'])
    .withMessage('Invalid withdrawal method'),
  body('address')
    .notEmpty()
    .isLength({ min: 5, max: 200 })
    .withMessage('Withdrawal address is required and must be 5-200 characters'),
];

export const promotionActivationValidation = [
  body('promotionId')
    .isInt({ min: 1 })
    .withMessage('Promotion ID must be a positive integer'),
  body('depositAmount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Deposit amount must be positive'),
];

export const adminLoginValidation = [
  body('username')
    .notEmpty()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const adminUserCreationValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('role')
    .isIn(['admin', 'super_admin', 'support'])
    .withMessage('Invalid role'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must provide a valid email address'),
];

export const balanceAdjustmentValidation = [
  body('amount')
    .isFloat()
    .withMessage('Amount must be a valid number'),
  body('type')
    .isIn(['deposit', 'withdrawal', 'bonus', 'adjustment'])
    .withMessage('Invalid transaction type'),
  body('reason')
    .notEmpty()
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be 5-200 characters'),
];

// Pagination validation
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Search validation
export const searchValidation = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape()
    .withMessage('Search query must be 1-100 characters'),
];

// Date range validation
export const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('End date must be a valid date'),
];

// Middleware to handle validation results
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : error.type,
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    throw new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      { errors: errorDetails }
    );
  }
  
  next();
};

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove any potential HTML/script tags from string inputs
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/<[^>]*>/g, '')
                  .trim();
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};