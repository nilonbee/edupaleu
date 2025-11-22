import express from 'express';
import { getStudents } from '../controllers/studentController';
import { sendMail } from '../controllers/testSendgrid'

const router = express.Router();

router.get('/', sendMail);

export default router;