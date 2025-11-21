import express from 'express';
import { getApplications } from '../controllers/applicationController';

const router = express.Router();

router.get('/', getApplications);

export default router;