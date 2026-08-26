const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware: Run validation result check.
 * If validation errors exist, respond with 422 Unprocessable Entity.
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(e => ({
                field: e.path,
                message: e.msg
            }))
        });
    }
    next();
};

/**
 * Validation rules for POST /api/auth/register
 */
const validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/\d/).withMessage('Password must contain at least one number'),

    body('role')
        .optional()
        .isIn(['CITIZEN', 'RESCUER', 'ADMIN']).withMessage('Invalid role'),

    body('phone')
        .optional()
        .isMobilePhone().withMessage('Must be a valid phone number'),

    handleValidationErrors
];

/**
 * Validation rules for POST /api/auth/login
 */
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),

    handleValidationErrors
];

/**
 * Validation rules for POST /api/reports
 */
const validateCreateReport = [
    body('animalType')
        .trim()
        .notEmpty().withMessage('Animal type is required')
        .isLength({ min: 2, max: 50 }).withMessage('Animal type must be 2-50 characters'),

    body('description')
        .trim()
        .notEmpty().withMessage('Description is required'),

    body('severity')
        .notEmpty().withMessage('Severity is required')
        .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Severity must be LOW, MEDIUM, HIGH, or CRITICAL'),

    body('latitude')
        .notEmpty().withMessage('Latitude is required')
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),

    body('longitude')
        .notEmpty().withMessage('Longitude is required')
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),

    handleValidationErrors
];

/**
 * Validation rules for PATCH /api/rescuers/location
 */
const validateUpdateLocation = [
    body('latitude')
        .notEmpty().withMessage('Latitude is required')
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),

    body('longitude')
        .notEmpty().withMessage('Longitude is required')
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),

    handleValidationErrors
];

/**
 * Validation rules for PATCH /api/rescuers/radius
 */
const validateUpdateRadius = [
    body('radius')
        .notEmpty().withMessage('Radius is required')
        .isFloat({ min: 1, max: 10 }).withMessage('Radius must be between 1 and 10 km'),

    handleValidationErrors
];

/**
 * Validation rules for GET /api/reports (query params)
 */
const validateReportQuery = [
    query('status')
        .optional()
        .isIn(['PENDING', 'NOTIFIED', 'ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
        .withMessage('Invalid status filter'),

    query('sortBy')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'severity', 'status'])
        .withMessage('Invalid sortBy field'),

    query('order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Order must be asc or desc'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin,
    validateCreateReport,
    validateUpdateLocation,
    validateUpdateRadius,
    validateReportQuery,
    handleValidationErrors
};
