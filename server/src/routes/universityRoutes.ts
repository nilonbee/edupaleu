// routes/universityRoutes.ts
import express from 'express';
import { getUniversities } from '../controllers/universitiesController';

const router = express.Router();

router.get('/', getUniversities);

export default router;