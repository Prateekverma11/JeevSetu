/**
 * Form Validation Utilities — Animal Rescue Platform
 *
 * A collection of reusable, pure validation functions for client-side
 * form validation. Each function returns null on success or an error
 * message string on failure.
 *
 * Usage:
 *   import { validateEmail, validatePassword, createFormValidator } from './validators';
 *
 *   const errors = createFormValidator({ email, password }, {
 *       email: [required, validateEmail],
 *       password: [required, validatePassword],
 *   });
 */

// ─── Primitive Validators ──────────────────────────────────────────────────────

/**
 * Check that a field is not empty/null/undefined.
 * @param {string} label - Human-readable field name for error messages
 */
export const required = (label = 'This field') => (value) => {
    if (value === null || value === undefined || String(value).trim() === '') {
        return `${label} is required`;
    }
    return null;
};

/**
 * Validate an email address format.
 */
export const validateEmail = (value) => {
    if (!value) return null; // Let `required` handle empty
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(value).trim())) {
        return 'Please enter a valid email address';
    }
    return null;
};

/**
 * Validate password strength.
 * Rules: minimum 6 chars, at least one number.
 */
export const validatePassword = (value) => {
    if (!value) return null;
    if (value.length < 6) {
        return 'Password must be at least 6 characters';
    }
    if (!/\d/.test(value)) {
        return 'Password must contain at least one number';
    }
    return null;
};

/**
 * Validate that two password fields match.
 * @param {string} confirmValue - The confirmation password value
 * @param {string} originalValue - The original password value
 */
export const validatePasswordMatch = (confirmValue, originalValue) => {
    if (!confirmValue) return null;
    if (confirmValue !== originalValue) {
        return 'Passwords do not match';
    }
    return null;
};

/**
 * Validate minimum string length.
 * @param {number} min - Minimum character count
 */
export const minLength = (min) => (value) => {
    if (!value) return null;
    if (String(value).trim().length < min) {
        return `Must be at least ${min} characters`;
    }
    return null;
};

/**
 * Validate maximum string length.
 * @param {number} max - Maximum character count
 */
export const maxLength = (max) => (value) => {
    if (!value) return null;
    if (String(value).trim().length > max) {
        return `Must be no more than ${max} characters`;
    }
    return null;
};

/**
 * Validate that a value is one of the allowed options.
 * @param {string[]} options - Array of allowed values
 */
export const oneOf = (options) => (value) => {
    if (!value) return null;
    if (!options.includes(value)) {
        return `Must be one of: ${options.join(', ')}`;
    }
    return null;
};

/**
 * Validate a latitude value (-90 to 90).
 */
export const validateLatitude = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    if (isNaN(num) || num < -90 || num > 90) {
        return 'Latitude must be between -90 and 90';
    }
    return null;
};

/**
 * Validate a longitude value (-180 to 180).
 */
export const validateLongitude = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    if (isNaN(num) || num < -180 || num > 180) {
        return 'Longitude must be between -180 and 180';
    }
    return null;
};

/**
 * Validate a phone number (basic international format).
 */
export const validatePhone = (value) => {
    if (!value) return null;
    const phoneRegex = /^\+?[\d\s\-()]{8,15}$/;
    if (!phoneRegex.test(String(value).trim())) {
        return 'Please enter a valid phone number';
    }
    return null;
};

/**
 * Validate that a field only contains safe characters (no script injection).
 */
export const noScriptTags = (value) => {
    if (!value) return null;
    if (/<script|javascript:|on\w+=/i.test(String(value))) {
        return 'Input contains invalid characters';
    }
    return null;
};

// ─── Preset Validator Sets ────────────────────────────────────────────────────

/** Validators for the Register form */
export const registerValidators = {
    name: [required('Name'), minLength(2), maxLength(100), noScriptTags],
    email: [required('Email'), validateEmail],
    password: [required('Password'), validatePassword],
    role: [oneOf(['CITIZEN', 'RESCUER'])],
    phone: [validatePhone],
};

/** Validators for the Login form */
export const loginValidators = {
    email: [required('Email'), validateEmail],
    password: [required('Password')],
};

/** Validators for the Report form */
export const reportValidators = {
    animalType: [required('Animal type'), minLength(2), maxLength(50), noScriptTags],
    description: [required('Description'), minLength(10), maxLength(1000), noScriptTags],
    severity: [required('Severity'), oneOf(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])],
    latitude: [required('Location'), validateLatitude],
    longitude: [required('Location'), validateLongitude],
};

// ─── Form Validator Runner ────────────────────────────────────────────────────

/**
 * Run all validators for a form's values and return an errors object.
 *
 * @param {Object} values - The form's current values { fieldName: value }
 * @param {Object} validatorMap - Map of { fieldName: [validator, ...] }
 * @returns {Object} errors - Map of { fieldName: errorMessage | null }
 *
 * @example
 * const errors = runValidators(
 *   { email: 'bad-email', password: '' },
 *   loginValidators
 * );
 * // => { email: 'Please enter a valid email address', password: 'Password is required' }
 */
export const runValidators = (values, validatorMap) => {
    const errors = {};

    for (const [field, validators] of Object.entries(validatorMap)) {
        const value = values[field];
        let error = null;

        for (const validator of validators) {
            error = typeof validator === 'function' ? validator(value) : null;
            if (error) break; // Stop at first error per field
        }

        errors[field] = error;
    }

    return errors;
};

/**
 * Check whether an errors object (from runValidators) has any active errors.
 * @param {Object} errors
 * @returns {boolean}
 */
export const hasErrors = (errors) => {
    return Object.values(errors).some(Boolean);
};

/**
 * React hook-friendly single field validator.
 * @param {*} value - Field value
 * @param {Function[]} validators - Array of validator functions
 * @returns {string|null} First error message, or null
 */
export const validateField = (value, validators = []) => {
    for (const validator of validators) {
        const error = validator(value);
        if (error) return error;
    }
    return null;
};
