// controllers/universityController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

// controllers/universityController.ts
export const getUniversities = async (req: Request, res: Response) => {
    try {
        console.log('Fetching universities...');

        // Test database connection
        const count = await prisma.university.count();
        console.log(`Total universities in database: ${count}`);

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

        console.log(`Found ${universities.length} universities`);
        console.log('Universities data:', JSON.stringify(universities, null, 2));

        res.status(StatusCodes.OK).json(universities);
    } catch (error) {
        console.error('Error fetching universities:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: error.message,
        });
    }
};