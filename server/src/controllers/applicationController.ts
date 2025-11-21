// controllers/applicationController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

export const getApplications = async (req: Request, res: Response) => {
    try {
        const applications = await prisma.application.findMany({
            take: 10,
            orderBy: {
                updatedAt: 'desc',
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        studentId: true,
                        displayPicture: true,
                    }
                },
                university: {
                    select: {
                        id: true,
                        name: true,
                        website: true,
                        ranking: true,
                    }
                },
                applicationStatus: {
                    select: {
                        id: true,
                        status: true,
                        description: true,
                    }
                },
                assignedAgent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                },
            }
        });

        res.status(StatusCodes.OK).json(applications);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: "Error fetching applications",
        });
    }
};