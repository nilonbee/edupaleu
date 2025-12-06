// routes/universityRoutes.ts
import express from 'express';
import { getUniversities } from '../controllers/universitiesController';
import { authenticateUser } from '../middleware/authentication';

const router = express.Router();

// Universities route requires authentication
router.get('/', authenticateUser, getUniversities);

export default router;