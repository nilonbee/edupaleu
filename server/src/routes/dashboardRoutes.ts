import { Router } from "express";
import { getDashboardMetrics } from "../controllers/dashboardController";
import { authenticateUser } from "../middleware/authentication";

const router = Router();

// Dashboard requires authentication
router.get("/", authenticateUser, getDashboardMetrics);

export default router;