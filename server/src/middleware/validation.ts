import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors';

// Helper function to validate email
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Helper function to validate password strength
export const isStrongPassword = (password: string): boolean => {
    // Relaxed rule: require a string with minimum length 6 and at least one letter and one number
    return (
        typeof password === 'string' &&
        password.length >= 6 &&
        /[a-zA-Z]/.test(password) &&
        /[0-9]/.test(password)
    );
};

// Helper function to validate required fields
export const validateRequiredFields = (data: any, fields: string[]): string[] => {
    const missing: string[] = [];
    fields.forEach((field) => {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            missing.push(field);
        }
    });
    return missing;
};

// Validation middleware factory
export const validateRequest = (validator: (req: Request) => string | null) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const error = validator(req);
        if (error) {
            throw new BadRequestError(error);
        }
        next();
    };
};

// Auth validators
export const validateRegister = (req: Request): string | null => {
    const { firstName, lastName, email, password } = req.body;
    const missing = validateRequiredFields(req.body, ['firstName', 'lastName', 'email', 'password']);

    if (missing.length > 0) {
        return `Missing required fields: ${missing.join(', ')}`;
    }

    if (typeof firstName !== 'string' || firstName.trim().length < 2) {
        return 'First name must be at least 2 characters';
    }

    if (typeof lastName !== 'string' || lastName.trim().length < 2) {
        return 'Last name must be at least 2 characters';
    }

    if (!isValidEmail(email)) {
        return 'Invalid email address';
    }

    if (!isStrongPassword(password)) {
        return 'Password must be at least 6 characters and contain letters and numbers';
    }

    return null;
};

export const validateLogin = (req: Request): string | null => {
    const { email, password } = req.body;
    const missing = validateRequiredFields(req.body, ['email', 'password']);

    if (missing.length > 0) {
        return `Missing required fields: ${missing.join(', ')}`;
    }

    if (!isValidEmail(email)) {
        return 'Invalid email address';
    }

    if (typeof password !== 'string' || password.length === 0) {
        return 'Password is required';
    }

    return null;
};

export const validateVerifyEmail = (req: Request): string | null => {
    const { email, verificationToken } = req.body;
    const missing = validateRequiredFields(req.body, ['email', 'verificationToken']);

    if (missing.length > 0) {
        return `Missing required fields: ${missing.join(', ')}`;
    }

    if (!isValidEmail(email)) {
        return 'Invalid email address';
    }

    return null;
};

export const validateForgotPassword = (req: Request): string | null => {
    const { email } = req.body;
    const missing = validateRequiredFields(req.body, ['email']);

    if (missing.length > 0) {
        return 'Email is required';
    }

    if (!isValidEmail(email)) {
        return 'Invalid email address';
    }

    return null;
};

export const validateResetPassword = (req: Request): string | null => {
    const { email, token, password } = req.body;
    const missing = validateRequiredFields(req.body, ['email', 'token', 'password']);

    if (missing.length > 0) {
        return `Missing required fields: ${missing.join(', ')}`;
    }

    if (!isValidEmail(email)) {
        return 'Invalid email address';
    }

    if (!isStrongPassword(password)) {
        return 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }

    return null;
};

// Student validators
export const validateCreateStudent = (req: Request): string | null => {
    const { firstName, lastName, email, dateOfBirth, gender } = req.body;
    const missing = validateRequiredFields(req.body, ['firstName', 'lastName', 'email', 'dateOfBirth', 'gender']);

    if (missing.length > 0) {
        return `Missing required fields: ${missing.join(', ')}`;
    }

    if (typeof firstName !== 'string' || firstName.trim().length < 2) {
        return 'First name must be at least 2 characters';
    }

    if (typeof lastName !== 'string' || lastName.trim().length < 2) {
        return 'Last name must be at least 2 characters';
    }

    if (!isValidEmail(email)) {
        return 'Invalid email address';
    }

    if (!['male', 'female', 'other'].includes(gender)) {
        return 'Gender must be male, female, or other';
    }

    return null;
};

export const validateUpdateStudent = (req: Request): string | null => {
    if (req.body.firstName && typeof req.body.firstName !== 'string' || req.body.firstName?.trim().length < 2) {
        return 'First name must be at least 2 characters';
    }

    if (req.body.lastName && typeof req.body.lastName !== 'string' || req.body.lastName?.trim().length < 2) {
        return 'Last name must be at least 2 characters';
    }

    if (req.body.email && !isValidEmail(req.body.email)) {
        return 'Invalid email address';
    }

    if (req.body.gender && !['male', 'female', 'other'].includes(req.body.gender)) {
        return 'Gender must be male, female, or other';
    }

    if (req.body.passportNumber && req.body.passportNumber.trim().length < 5) {
        return 'Passport number must be at least 5 characters';
    }

    return null;
};

// University validators
export const validateCreateUniversity = (req: Request): string | null => {
    const { name, countryId } = req.body;
    const missing = validateRequiredFields(req.body, ['name', 'countryId']);

    if (missing.length > 0) {
        return `Missing required fields: ${missing.join(', ')}`;
    }

    if (typeof name !== 'string' || name.trim().length < 3) {
        return 'University name must be at least 3 characters';
    }

    if (typeof countryId !== 'number' || countryId <= 0) {
        return 'Country ID must be a positive number';
    }

    if (req.body.website && !isValidUrl(req.body.website)) {
        return 'Invalid website URL';
    }

    if (req.body.email && !isValidEmail(req.body.email)) {
        return 'Invalid email address';
    }

    return null;
};

export const validateUpdateUniversity = (req: Request): string | null => {
    if (req.body.name && typeof req.body.name !== 'string' || req.body.name?.trim().length < 3) {
        return 'University name must be at least 3 characters';
    }

    if (req.body.website && !isValidUrl(req.body.website)) {
        return 'Invalid website URL';
    }

    if (req.body.email && !isValidEmail(req.body.email)) {
        return 'Invalid email address';
    }

    if (req.body.ranking && (typeof req.body.ranking !== 'number' || req.body.ranking <= 0)) {
        return 'Ranking must be a positive number';
    }

    return null;
};

// Application validators
export const validateCreateApplication = (req: Request): string | null => {
    const { studentId, universityId, intendedProgram, intakeYear, intakeMonth } = req.body;
    const missing = validateRequiredFields(req.body, ['studentId', 'universityId', 'intendedProgram', 'intakeYear', 'intakeMonth']);

    if (missing.length > 0) {
        return `Missing required fields: ${missing.join(', ')}`;
    }

    if (typeof studentId !== 'number' || studentId <= 0) {
        return 'Student ID must be a positive number';
    }

    if (typeof universityId !== 'number' || universityId <= 0) {
        return 'University ID must be a positive number';
    }

    if (typeof intendedProgram !== 'string' || intendedProgram.trim().length < 2) {
        return 'Intended program must be at least 2 characters';
    }

    if (typeof intakeYear !== 'number' || intakeYear < new Date().getFullYear()) {
        return `Intake year must be ${new Date().getFullYear()} or later`;
    }

    return null;
};

export const validateUpdateApplication = (req: Request): string | null => {
    if (req.body.intendedProgram && typeof req.body.intendedProgram !== 'string' || req.body.intendedProgram?.trim().length < 2) {
        return 'Intended program must be at least 2 characters';
    }

    if (req.body.intakeYear && (typeof req.body.intakeYear !== 'number' || req.body.intakeYear < new Date().getFullYear())) {
        return `Intake year must be ${new Date().getFullYear()} or later`;
    }

    if (req.body.applicationFee && (typeof req.body.applicationFee !== 'number' || req.body.applicationFee < 0)) {
        return 'Application fee cannot be negative';
    }

    return null;
};

// Product validators
export const validateCreateProduct = (req: Request): string | null => {
    const { name, price, stockQuantity } = req.body;
    const missing = validateRequiredFields(req.body, ['name', 'price', 'stockQuantity']);

    if (missing.length > 0) {
        return `Missing required fields: ${missing.join(', ')}`;
    }

    if (typeof name !== 'string' || name.trim().length < 3) {
        return 'Product name must be at least 3 characters';
    }

    if (typeof price !== 'number' || price <= 0) {
        return 'Price must be greater than 0';
    }

    if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
        return 'Stock quantity cannot be negative';
    }

    if (req.body.rating && (typeof req.body.rating !== 'number' || req.body.rating < 0 || req.body.rating > 5)) {
        return 'Rating must be between 0 and 5';
    }

    return null;
};

export const validateUpdateProduct = (req: Request): string | null => {
    if (req.body.name && typeof req.body.name !== 'string' || req.body.name?.trim().length < 3) {
        return 'Product name must be at least 3 characters';
    }

    if (req.body.price && (typeof req.body.price !== 'number' || req.body.price <= 0)) {
        return 'Price must be greater than 0';
    }

    if (req.body.stockQuantity && (typeof req.body.stockQuantity !== 'number' || req.body.stockQuantity < 0)) {
        return 'Stock quantity cannot be negative';
    }

    if (req.body.rating && (typeof req.body.rating !== 'number' || req.body.rating < 0 || req.body.rating > 5)) {
        return 'Rating must be between 0 and 5';
    }

    return null;
};

// URL validation helper
const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};
