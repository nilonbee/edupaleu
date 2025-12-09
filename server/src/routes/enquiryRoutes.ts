import express from 'express';
import {
    getAllEnquiries,
    getSingleEnquiry,
    createEnquiry,
    updateEnquiry,
    deleteEnquiry,
} from '../controllers/enquiryController';
import { authenticateUser, authorizePermissions } from '../middleware/authentication';

const router = express.Router();

router
    .route('/')
    .get(authenticateUser, getAllEnquiries)
    .post(authenticateUser, authorizePermissions('admin', 'agent'), createEnquiry);

router
    .route('/:id')
    .get(authenticateUser, getSingleEnquiry)
    .patch(authenticateUser, authorizePermissions('admin', 'agent'), updateEnquiry)
    .delete(authenticateUser, authorizePermissions('admin'), deleteEnquiry);

export default router;

