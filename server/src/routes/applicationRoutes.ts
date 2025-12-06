import express from 'express';
import {
    getApplications,
    getApplication,
    createApplication,
    updateApplication,
    deleteApplication
} from '../controllers/applicationController';
import { authenticateUser, authorizePermissions } from '../middleware/authentication';

const router = express.Router();

// All application routes require authentication
router
    .get('/', authenticateUser, getApplications)
    .get('/:id', authenticateUser, getApplication)
    .post('/', authenticateUser, createApplication)
    .put('/:id', authenticateUser, updateApplication)
    // Only admins can delete applications
    .delete('/:id', authenticateUser, authorizePermissions('admin'), deleteApplication);

export default router;