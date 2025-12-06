import { Router } from "express";
import { getProducts, createProducts } from "../controllers/productController";
import { authenticateUser, authorizePermissions } from "../middleware/authentication";

const router = Router();

// Products routes require authentication
// Only admins can create products
router.get("/", authenticateUser, getProducts)
       .post("/", authenticateUser, authorizePermissions('admin'), createProducts);

export default router;