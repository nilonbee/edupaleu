import express from 'express';
import {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
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

router.post('/register', validateRequest(validateRegister), register);
router.post('/login', validateRequest(validateLogin), login);
router.delete('/logout', logout);
router.post('/verify-email', validateRequest(validateVerifyEmail), verifyEmail);
router.post('/forgot-password', validateRequest(validateForgotPassword), forgotPassword);
router.post('/reset-password', validateRequest(validateResetPassword), resetPassword);

export default router;

