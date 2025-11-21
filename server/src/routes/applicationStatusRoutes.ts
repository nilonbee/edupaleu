// routes/applicationStatusRoutes.ts
import express from 'express';
import { getApplicationStatuses } from '../controllers/applicationStatusController';

const router = express.Router();

router.get('/', getApplicationStatuses);

export default router;