import express from 'express';
import { getCountries } from '../controllers/countryController';
import { authenticateUser } from '../middleware/authentication';

const router = express.Router();

// Countries route requires authentication
router.get('/', authenticateUser, getCountries);

export default router;

