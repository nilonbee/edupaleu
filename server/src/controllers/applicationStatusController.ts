// controllers/applicationStatusController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

export const getApplicationStatuses = async (req: Request, res: Response) => {
    try {
        const statuses = await prisma.applicationStatus.findMany({
            select: {
                id: true,
                status: true,
                description: true,
            },
            orderBy: {
                id: 'asc',
            }
        });

        res.status(StatusCodes.OK).json(statuses);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: "Error fetching application statuses",
        });
    }
};