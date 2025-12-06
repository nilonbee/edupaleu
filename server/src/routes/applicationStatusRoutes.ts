// routes/applicationStatusRoutes.ts
import express from 'express';
import { getApplicationStatuses } from '../controllers/applicationStatusController';
import { authenticateUser } from '../middleware/authentication';

const router = express.Router();

// Application statuses require authentication
router.get('/', authenticateUser, getApplicationStatuses);

export default router;