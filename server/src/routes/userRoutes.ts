import express from 'express';
import { showMe } from '../controllers/userController';
import { authenticateUser } from '../middleware/authentication';

const router = express.Router();

router.get('/showMe', authenticateUser, showMe);

export default router;

