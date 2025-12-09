import express from 'express';
import {
    showMe,
    getAllUsers,
    getSingleUser,
    createUser,
    updateUser,
    deleteUser,
    updateCurrentUser,
    resendInviteEmail,
} from '../controllers/userController';
import { authenticateUser, authorizePermissions } from '../middleware/authentication';

const router = express.Router();

// Current user routes
router.get('/showMe', authenticateUser, showMe);
router.patch('/updateMe', authenticateUser, updateCurrentUser);

// User management routes (Admin and Agent access)
router
    .route('/')
    .get(authenticateUser, getAllUsers)
    .post(authenticateUser, authorizePermissions('admin'), createUser);

router
    .route('/:id')
    .get(authenticateUser, getSingleUser)
    .patch(authenticateUser, updateUser)
    .delete(authenticateUser, authorizePermissions('admin'), deleteUser);

// Resend invite email
router.post('/:id/resend-invite', authenticateUser, resendInviteEmail);

export default router;

