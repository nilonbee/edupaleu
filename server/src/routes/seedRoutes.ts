import express from 'express';
import { seedDatabase } from '../controllers/seedController';
import { authenticateUser, authorizePermissions } from '../middleware/authentication';

const router = express.Router();

// Seed routes - protect with admin auth, disable in production
if (process.env.NODE_ENV === 'production') {
  router.get('/', (req, res) => {
    res.status(403).json({ 
      success: false,
      message: 'Seed endpoint is disabled in production' 
    });
  });
} else {
  router.get('/', authenticateUser, authorizePermissions('admin'), seedDatabase);
}

export default router;

