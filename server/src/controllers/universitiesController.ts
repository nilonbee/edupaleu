// controllers/universityController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

export const getUniversities = async (req: Request, res: Response) => {
    try {
        const universities = await prisma.university.findMany({
            select: {
                id: true,
                name: true,
                website: true,
                email: true,
                phone: true,
                ranking: true,
                tuitionFeeRange: true,
                country: {
                    select: {
                        name: true,
                        code: true,
                    }
                }
            },
            orderBy: {
                name: 'asc',
            }
        });

        res.status(StatusCodes.OK).json(universities);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: "Error fetching universities",
        });
    }
};