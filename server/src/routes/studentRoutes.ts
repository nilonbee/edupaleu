// routes/studentRoutes.ts
import express from 'express';
import { getStudents } from '../controllers/studentController';
import { authenticateUser } from '../middleware/authentication';

const router = express.Router();

// Students route requires authentication (users need to be logged in to view students)
router.get('/', authenticateUser, getStudents);

export default router;