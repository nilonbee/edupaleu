import { Router } from "express";
import { getDashboardMetrics } from "../dashboardController";

const router = Router();

router.get("/", getDashboardMetrics);

export default router;