import express from 'express';
import { getSeeds } from '../controllers/seedController';

const router = express.Router();

router.get('/', getSeeds);

export default router;


