import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
} from '../errors';
import prisma from '../lib/prisma';

// Get all enquiries with search, filter, and pagination
export const getAllEnquiries = async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;

    const {
        search = '',
        page = '1',
        limit = '10',
        sort_by = 'createdAt',
        order = 'desc',
        assignedTo,
        countryId,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Search by firstName, lastName, email, phone, and country
    if (search) {
        where.OR = [
            { firstName: { contains: search as string, mode: 'insensitive' } },
            { lastName: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
            { phone: { contains: search as string, mode: 'insensitive' } },
            {
                country: {
                    OR: [
                        { name: { contains: search as string, mode: 'insensitive' } },
                        { code: { contains: search as string, mode: 'insensitive' } }
                    ]
                }
            }
        ];
    }

    // Filter by assignedTo
    if (assignedTo) {
        where.assignedToId = parseInt(assignedTo as string, 10);
    }

    // Filter by countryId
    if (countryId) {
        where.countryId = parseInt(countryId as string, 10);
    }

    // Build orderBy clause - handle relation fields specially
    let orderBy: any = {};

    // Map frontend sort fields to Prisma orderBy
    // Handle relation fields that need nested sorting
    if (sort_by === 'country') {
        orderBy = {
            country: {
                name: order,
            },
        };
    } else if (sort_by === 'assignee' || sort_by === 'assignedTo') {
        orderBy = {
            assignedTo: {
                firstName: order,
            },
        };
    } else {
        // Direct fields on Enquiry model
        const validSortFields = [
            'id',
            'firstName',
            'lastName',
            'email',
            'phone',
            'createdAt',
            'updatedAt',
            'assignedToId',
            'countryId',
            'remarks',
        ];

        if (validSortFields.includes(sort_by as string)) {
            orderBy = {
                [sort_by as string]: order,
            };
        } else {
            // Default to updatedAt if invalid field (to prioritize recently updated enquiries)
            orderBy = {
                updatedAt: order,
            };
        }
    }

    const [enquiries, totalCount] = await Promise.all([
        prisma.enquiry.findMany({
            where,
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                country: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy,
            skip,
            take: limitNum,
        }),
        prisma.enquiry.count({ where }),
    ]);

    res.status(StatusCodes.OK).json({
        success: true,
        data: enquiries,
        pagination: {
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
            pageSize: limitNum,
        },
    });
};

// Get single enquiry
export const getSingleEnquiry = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const enquiry = await prisma.enquiry.findUnique({
        where: { id: parseInt(id, 10) },
        include: {
            assignedTo: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            country: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
            applications: {
                select: {
                    id: true,
                    applicationRef: true,
                    intendedProgram: true,
                    applicationStatus: {
                        select: {
                            status: true,
                        },
                    },
                },
            },
        },
    });

    if (!enquiry) {
        throw new NotFoundError(`No enquiry with id ${id}`);
    }

    res.status(StatusCodes.OK).json({
        success: true,
        data: enquiry,
    });
};

// Create enquiry
export const createEnquiry = async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const {
        firstName,
        lastName,
        email,
        phone,
        cvDocument,
        firstFollowUpRemarks,
        secondFollowUpRemarks,
        thirdFollowUpRemarks,
        remarks,
        assignedToId,
        countryId,
    } = req.body;

    if (!firstName || !phone) {
        throw new BadRequestError('firstName and phone are required fields');
    }

    if (!countryId) {
        throw new BadRequestError('countryId is required');
    }

    // Validate country exists
    const country = await prisma.country.findUnique({
        where: { id: parseInt(countryId, 10) },
    });

    if (!country) {
        throw new BadRequestError('Invalid countryId');
    }

    // Format remarks with timestamp first for sortability: "timestamp||text||user"
    const userName = currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`;
    const formattedRemarks = remarks ? `${new Date().toISOString()}||${remarks}||${userName}` : null;

    const enquiry = await prisma.enquiry.create({
        data: {
            firstName,
            lastName,
            email,
            phone,
            cvDocument,
            firstFollowUpRemarks,
            secondFollowUpRemarks,
            thirdFollowUpRemarks,
            remarks: formattedRemarks,
            createdBy: userName,
            assignedToId: assignedToId ? parseInt(assignedToId, 10) : null,
            countryId: parseInt(countryId, 10),
        },
        include: {
            assignedTo: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            country: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
        },
    });

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Enquiry created successfully',
        data: enquiry,
    });
};

// Update enquiry
export const updateEnquiry = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
        firstName,
        lastName,
        email,
        phone,
        cvDocument,
        firstFollowUpRemarks,
        secondFollowUpRemarks,
        thirdFollowUpRemarks,
        remarks,
        assignedToId,
        countryId,
    } = req.body;

    const existingEnquiry = await prisma.enquiry.findUnique({
        where: { id: parseInt(id, 10) },
    });

    if (!existingEnquiry) {
        throw new NotFoundError(`No enquiry with id ${id}`);
    }

    // firstName and phone are required
    if (firstName === undefined) {
        throw new BadRequestError('firstName is required');
    }
    if (phone === undefined) {
        throw new BadRequestError('phone is required');
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (cvDocument !== undefined) updateData.cvDocument = cvDocument;
    if (firstFollowUpRemarks !== undefined) updateData.firstFollowUpRemarks = firstFollowUpRemarks;
    if (secondFollowUpRemarks !== undefined) updateData.secondFollowUpRemarks = secondFollowUpRemarks;
    if (thirdFollowUpRemarks !== undefined) updateData.thirdFollowUpRemarks = thirdFollowUpRemarks;

    // When remarks is updated, format with timestamp first for sortability: "timestamp||text||user"
    if (remarks !== undefined) {
        const currentUser = (req as any).user;
        const userName = currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`;
        updateData.remarks = remarks ? `${new Date().toISOString()}||${remarks}||${userName}` : null;
    }
    if (assignedToId !== undefined) {
        updateData.assignedToId = assignedToId ? parseInt(assignedToId, 10) : null;
    }
    if (countryId !== undefined) {
        if (countryId) {
            // Validate country exists
            const country = await prisma.country.findUnique({
                where: { id: parseInt(countryId, 10) },
            });
            if (!country) {
                throw new BadRequestError('Invalid countryId');
            }
            updateData.countryId = parseInt(countryId, 10);
        } else {
            updateData.countryId = null;
        }
    }

    const updatedEnquiry = await prisma.enquiry.update({
        where: { id: parseInt(id, 10) },
        data: updateData,
        include: {
            assignedTo: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
            country: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
        },
    });

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Enquiry updated successfully',
        data: updatedEnquiry,
    });
};

// Delete enquiry
export const deleteEnquiry = async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const { id } = req.params;

    if (currentUser.role !== 'admin') {
        throw new UnauthorizedError('Only admins can delete enquiries');
    }

    const enquiry = await prisma.enquiry.findUnique({
        where: { id: parseInt(id, 10) },
        include: {
            applications: true,
        },
    });

    if (!enquiry) {
        throw new NotFoundError(`No enquiry with id ${id}`);
    }

    if (enquiry.applications.length > 0) {
        throw new BadRequestError('Cannot delete enquiry with associated applications');
    }

    await prisma.enquiry.delete({
        where: { id: parseInt(id, 10) },
    });

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Enquiry deleted successfully',
    });
};

