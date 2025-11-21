// controllers/studentController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

export const getStudents = async (req: Request, res: Response) => {
    try {
        const students = await prisma.student.findMany({
            select: {
                id: true,
                studentId: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                nationality: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        res.status(StatusCodes.OK).json(students);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: "Error fetching students",
        });
    }
};