import express from 'express';
import {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  setupPasswordFromInvite,
} from '../controllers/authController';
import { authenticateUser } from '../middleware/authentication';
import {
  validateRequest,
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateForgotPassword,
  validateResetPassword,
} from '../middleware/validation';

const router = express.Router();

// Public auth routes - no authentication required (except logout needs optional auth)
router.post('/register', validateRequest(validateRegister), register);
router.post('/login', validateRequest(validateLogin), login);
router.delete('/logout', logout); // Logout can be called without auth (graceful handling in controller)
router.post('/verify-email', validateRequest(validateVerifyEmail), verifyEmail);
router.post('/forgot-password', validateRequest(validateForgotPassword), forgotPassword);
router.post('/reset-password', validateRequest(validateResetPassword), resetPassword);
router.post('/invite', setupPasswordFromInvite); // Setup password from invite token

export default router;

