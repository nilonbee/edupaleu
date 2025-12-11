import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../lib/prisma';

// Get all countries
export const getCountries = async (req: Request, res: Response): Promise<void> => {
    try {
        const countries = await prisma.country.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                name: 'asc',
            },
            select: {
                id: true,
                name: true,
                code: true,
            },
        });

        res.status(StatusCodes.OK).json({
            success: true,
            data: countries,
        });
    } catch (error: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message || 'Failed to fetch countries',
        });
    }
};

