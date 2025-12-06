import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const search = req.query.search?.toString();
        const products = await prisma.product.findMany({
            where: {
                name: {
                    contains: search,
                },
            },
        });
        res.json(products)
    } catch (error) {
        res.status(500).json({ message: "Error retrieving products" });
    }
};

export const createProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId, name, price, rating, stockQuantity } = req.body;
        const product = await prisma.product.create({
            data: {
                productId,
                name,
                price,
                rating,
                stockQuantity,
            },
        });
        res.status(201).json(product);

    } catch (error) {
        res.status(500).json({ message: "Error creating product" });
    }
}