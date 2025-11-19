import { Router } from "express";
import { getProducts, createProducts } from "../productController";

const router = Router();

router.get("/", getProducts).post("/", createProducts);

export default router;