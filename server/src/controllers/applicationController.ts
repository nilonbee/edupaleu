import { generateApplicationRef } from '../utils/generateRef';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../lib/prisma';

export const getApplications = async (req: Request, res: Response) => {
    try {
        // Extract query parameters
        const {
            search,
            status,
            countryId,
            sort_by = 'updatedAt',
            order = 'desc',
            page = '1',
            limit = '10'
        } = req.query;

        // Parse pagination parameters
        const pageNumber = parseInt(page as string, 10) || 1;
        const limitNumber = parseInt(limit as string, 10) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        // Build where clause for filtering
        const where: any = {};

        // Status filter - support multiple statuses (comma-separated)
        if (status) {
            const statusArray = (status as string).split(',').map(s => s.trim().toLowerCase());
            const statusRecords = await prisma.applicationStatus.findMany({
                where: {
                    status: {
                        in: statusArray
                    }
                },
                select: { id: true }
            });
            const statusIds = statusRecords.map(s => s.id);
            if (statusIds.length > 0) {
                where.applicationStatusId = {
                    in: statusIds
                };
            }
        }

        // Filter by countryId (application's direct country field)
        if (countryId) {
            where.countryId = parseInt(countryId as string, 10);
        }

        // Global search - search across applicationRef, student name (direct or via student relation), university name, program, country, status
        if (search) {
            const searchTerm = (search as string).trim();
            where.OR = [
                { applicationRef: { contains: searchTerm, mode: 'insensitive' } },
                { intendedProgram: { contains: searchTerm, mode: 'insensitive' } },
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
                {
                    student: {
                        OR: [
                            { firstName: { contains: searchTerm, mode: 'insensitive' } },
                            { lastName: { contains: searchTerm, mode: 'insensitive' } },
                            { email: { contains: searchTerm, mode: 'insensitive' } }
                        ]
                    }
                },
                {
                    university: {
                        OR: [
                            { name: { contains: searchTerm, mode: 'insensitive' } },
                            {
                                country: {
                                    OR: [
                                        { name: { contains: searchTerm, mode: 'insensitive' } },
                                        { code: { contains: searchTerm, mode: 'insensitive' } }
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    country: {
                        OR: [
                            { name: { contains: searchTerm, mode: 'insensitive' } },
                            { code: { contains: searchTerm, mode: 'insensitive' } }
                        ]
                    }
                },
                {
                    enquiry: {
                        OR: [
                            { firstName: { contains: searchTerm, mode: 'insensitive' } },
                            { lastName: { contains: searchTerm, mode: 'insensitive' } },
                            { email: { contains: searchTerm, mode: 'insensitive' } }
                        ]
                    }
                },
                {
                    applicationStatus: {
                        status: { contains: searchTerm, mode: 'insensitive' }
                    }
                }
            ];
        }

        // Build orderBy clause
        const validSortFields: { [key: string]: string } = {
            'applicationRef': 'applicationRef',
            'updatedAt': 'updatedAt',
            'createdAt': 'createdAt',
            'submissionDate': 'submissionDate'
        };

        const sortField = validSortFields[sort_by as string] || 'updatedAt';
        const sortOrder = (order as string).toLowerCase() === 'asc' ? 'asc' : 'desc';

        // Get total count for pagination
        const totalCount = await prisma.application.count({ where });

        // Fetch applications with pagination
        const applications = await prisma.application.findMany({
            where,
            skip,
            take: limitNumber,
            orderBy: {
                [sortField]: sortOrder,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        displayPicture: true,
                    }
                },
                enquiry: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                },
                assignedTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
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
                country: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
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
            }
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limitNumber);

        res.status(StatusCodes.OK).json({
            success: true,
            data: applications,
            pagination: {
                currentPage: pageNumber,
                totalPages,
                totalItems: totalCount,
                itemsPerPage: limitNumber,
                hasNextPage: pageNumber < totalPages,
                hasPreviousPage: pageNumber > 1
            }
        });
    } catch (error: any) {
        console.error('Error fetching applications:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.message,
        });
    }
};

export const createApplication = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;
        const {
            student,
            university,
            academicQualifications,
            documents,
            maritalStatus,
            marriageCertificate,
            intendedPrograms,
            enquiryId,
            countryId
        } = req.body;

        // Validate required fields
        if (!student) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Student information is required"
            });
        }

        if (!student.firstName || student.firstName.trim() === '') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Student first name is required"
            });
        }

        if (!student.email || student.email.trim() === '') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Student email is required"
            });
        }

        if (!intendedPrograms || intendedPrograms.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "At least one intended program is required"
            });
        }

        // Take the first intended program as primary
        const primaryProgram = intendedPrograms[0];

        // University ID is optional - use from request if provided, otherwise null (university is stored as string in intended programs)
        const universityId = university?.id || null;

        // Get countryId from enquiry if not provided and enquiryId exists
        let destinationCountryId = countryId ? parseInt(countryId, 10) : null;
        if (!destinationCountryId && enquiryId) {
            const enquiry = await prisma.enquiry.findUnique({
                where: { id: parseInt(enquiryId, 10) },
                select: { countryId: true }
            });
            if (enquiry?.countryId) {
                destinationCountryId = enquiry.countryId;
            }
        }

        // Check if an application already exists for this enquiry
        if (enquiryId) {
            const existingApplication = await prisma.application.findFirst({
                where: { enquiryId: parseInt(enquiryId, 10) }
            });

            if (existingApplication) {
                return res.status(StatusCodes.CONFLICT).json({
                    success: false,
                    message: "An application already exists for this enquiry",
                    data: {
                        applicationId: existingApplication.id,
                        applicationRef: existingApplication.applicationRef
                    }
                });
            }
        }

        // Create application with all related data in a transaction
        // Handle reference collision inside transaction to prevent race conditions
        const result = await prisma.$transaction(async (tx) => {
            // Generate application reference with collision handling INSIDE transaction
            let applicationRef = generateApplicationRef();
            let refAttempts = 0;
            const maxRefAttempts = 20; // Increased attempts for better collision handling

            // Check if reference already exists and regenerate if needed (atomic check)
            while (refAttempts < maxRefAttempts) {
                const existingRef = await tx.application.findUnique({
                    where: { applicationRef },
                    select: { id: true }
                });

                if (!existingRef) {
                    break; // Reference is unique, proceed
                }

                // Regenerate reference
                applicationRef = generateApplicationRef();
                refAttempts++;
            }

            if (refAttempts >= maxRefAttempts) {
                throw new Error("Failed to generate unique application reference after multiple attempts");
            }

            // 1. Create or get student
            let studentId: number | null = null;

            if (student?.id) {
                // Existing student - verify it exists
                const studentExists = await tx.student.findUnique({
                    where: { id: student.id }
                });
                if (studentExists) {
                    studentId = student.id;
                    // Update student with latest data
                    // Normalize gender to lowercase enum value
                    let normalizedGender: 'male' | 'female' | 'other' | null = null;
                    if (student.gender) {
                        const genderLower = student.gender.toLowerCase();
                        if (genderLower === 'male' || genderLower === 'female' || genderLower === 'other') {
                            normalizedGender = genderLower as 'male' | 'female' | 'other';
                        }
                    }

                    await tx.student.update({
                        where: { id: student.id },
                        data: {
                            firstName: student.firstName.trim(),
                            lastName: student.lastName?.trim() || null,
                            dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : new Date(),
                            gender: normalizedGender,
                            email: student.email.trim(),
                            phone: student.phone || null,
                            nationality: student.nationality || null,
                            passportNumber: student.passportNumber || null,
                            passportExpiry: student.passportExpiry ? new Date(student.passportExpiry) : null,
                            address: student.address || null,
                            city: student.city || null,
                            state: student.state || null,
                            zipCode: student.zipCode || null,
                            displayPicture: student.displayPicture || null,
                            hasEnglishTest: student.hasEnglishTest || false,
                            englishTestType: student.englishTestType || null,
                            englishTestScore: student.englishTestScore || null,
                            englishTestDate: student.englishTestDate ? new Date(student.englishTestDate) : null,
                        }
                    });
                }
            }

            // If no existing student, create a new one
            if (!studentId) {
                // Parse dateOfBirth - handle both string and Date formats
                let dateOfBirth: Date;
                if (student.dateOfBirth) {
                    dateOfBirth = student.dateOfBirth instanceof Date
                        ? student.dateOfBirth
                        : new Date(student.dateOfBirth);
                    // Validate date
                    if (isNaN(dateOfBirth.getTime())) {
                        dateOfBirth = new Date(); // Fallback to current date if invalid
                    }
                } else {
                    dateOfBirth = new Date(); // Default to current date if not provided
                }

                // Normalize gender to lowercase enum value
                let normalizedGender: 'male' | 'female' | 'other' | null = null;
                if (student.gender) {
                    const genderLower = student.gender.toLowerCase();
                    if (genderLower === 'male' || genderLower === 'female' || genderLower === 'other') {
                        normalizedGender = genderLower as 'male' | 'female' | 'other';
                    }
                }

                const newStudent = await tx.student.create({
                    data: {
                        firstName: student.firstName.trim(),
                        lastName: student.lastName?.trim() || null,
                        dateOfBirth: dateOfBirth,
                        gender: normalizedGender,
                        email: student.email.trim(),
                        phone: student.phone?.trim() || null,
                        secondPhone: student.secondPhone?.trim() || null,
                        nationality: student.nationality?.trim() || null,
                        passportNumber: student.passportNumber?.trim() || null,
                        passportExpiry: student.passportExpiry ? (student.passportExpiry instanceof Date ? student.passportExpiry : new Date(student.passportExpiry)) : null,
                        address: student.address?.trim() || null,
                        city: student.city?.trim() || null,
                        state: student.state?.trim() || null,
                        zipCode: student.zipCode?.trim() || null,
                        displayPicture: student.displayPicture || null,
                        hasEnglishTest: student.hasEnglishTest || false,
                        englishTestType: student.englishTestType || null,
                        englishTestScore: student.englishTestScore?.trim() || null,
                        englishTestDate: student.englishTestDate ? (student.englishTestDate instanceof Date ? student.englishTestDate : new Date(student.englishTestDate)) : null,
                        createdBy: currentUser.userId || null,
                    }
                });
                studentId = newStudent.id;
            }

            // 2. Create the main application
            const application = await tx.application.create({
                data: {
                    applicationRef,
                    enquiryId: enquiryId ? parseInt(enquiryId, 10) : null,
                    studentId: studentId,
                    firstName: student.firstName,
                    lastName: student.lastName || '',
                    universityId: universityId || 1, // Use 1 as default if null (schema requires Int)
                    intendedProgram: primaryProgram.programme || 'Not specified',
                    intakeYear: primaryProgram.intakeYear || new Date().getFullYear(),
                    intakeMonth: primaryProgram.intakeMonth || 'SEPTEMBER',
                    applicationStatusId: 1, // Assuming 1 = PENDING
                    applicationFee: 0,
                    feePaid: false,
                    countryId: destinationCountryId,
                    submissionDate: new Date(),
                    createdBy: currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`,
                    assignedToId: currentUser.userId || null,
                }
            });

            // 3. Create application documents
            if (documents && documents.length > 0) {
                await tx.applicationDocument.createMany({
                    data: documents.map((doc: any) => ({
                        applicationId: application.id,
                        documentType: doc.documentType,
                        fileName: doc.fileName,
                        filePath: doc.filePath,
                        fileSize: doc.fileSize || null,
                        uploadedAt: new Date()
                    }))
                });
            }

            // 3. Create marriage certificate document if exists
            if (marriageCertificate?.filePath) {
                await tx.applicationDocument.create({
                    data: {
                        applicationId: application.id,
                        documentType: 'MARRIAGE_CERTIFICATE',
                        fileName: marriageCertificate.fileName,
                        filePath: marriageCertificate.filePath,
                        fileSize: marriageCertificate.fileSize || null,
                        uploadedAt: new Date()
                    }
                });
            }

            // 5. Create intended programs
            if (intendedPrograms && intendedPrograms.length > 0) {
                await tx.intendedProgram.createMany({
                    data: intendedPrograms.map((program: any, index: number) => ({
                        applicationId: application.id,
                        country: program.country || 'Not specified',
                        university: program.university || 'Not specified',
                        programme: program.programme || 'Not specified',
                        priority: program.priority || index + 1, // Use priority from frontend if provided
                        isPrimary: (program.priority || index + 1) === 1 // First priority is primary
                    }))
                });
            }

            // 5. Update student's marital status (only if student exists)
            if (studentId) {
                await tx.student.update({
                    where: { id: studentId },
                    data: {
                        maritalStatus: maritalStatus || 'SINGLE',
                        ...(maritalStatus === 'MARRIED' && marriageCertificate?.filePath && {
                            marriageCertificatePath: marriageCertificate.filePath
                        })
                    }
                });
            }

            // 7. Create academic qualifications using nested write
            if (academicQualifications && Array.isArray(academicQualifications) && academicQualifications.length > 0) {
                await tx.academicQualification.createMany({
                    data: academicQualifications.map((qual: any) => ({
                        applicationId: application.id,
                        name: qual.name || '',
                        educationLevel: qual.educationLevel || 'OTHER',
                        institutionName: qual.institutionName || '',
                        programName: qual.programName || null,
                        startDate: qual.startDate ? new Date(qual.startDate) : null,
                        endDate: qual.endDate ? new Date(qual.endDate) : null,
                        grade: qual.grade || null,
                        gpa: qual.gpa || null,
                        isCompleted: qual.isCompleted !== undefined ? qual.isCompleted : true,
                        documentPath: qual.documentPath || null,
                    }))
                });
            }

            return application;
        });

        // Fetch the created application with all related data
        const createdApp = await prisma.application.findUnique({
            where: { id: result.id },
            include: {
                student: true, // Include ALL student fields
                enquiry: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                },
                assignedTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                },
                academicQualifications: {
                    orderBy: { createdAt: 'asc' }
                },
                university: {
                    select: {
                        id: true,
                        name: true,
                        website: true,
                        ranking: true,
                        country: {
                            select: {
                                name: true,
                                id: true
                            }
                        }
                    }
                },
                documents: {
                    select: {
                        id: true,
                        documentType: true,
                        fileName: true,
                        filePath: true,
                        fileSize: true,
                        uploadedAt: true
                    }
                },
                intendedPrograms: {
                    orderBy: { priority: 'asc' },
                    select: {
                        id: true,
                        country: true,
                        university: true,
                        programme: true,
                        priority: true,
                        isPrimary: true
                    }
                }
            }
        });

        // Format academic qualifications for response
        const formattedAcademicQualifications = (createdApp?.academicQualifications || []).map((qual: any) => ({
            id: qual.id,
            name: qual.name,
            educationLevel: qual.educationLevel,
            institutionName: qual.institutionName,
            programName: qual.programName || null,
            startDate: qual.startDate ? qual.startDate.toISOString().split('T')[0] : null,
            endDate: qual.endDate ? qual.endDate.toISOString().split('T')[0] : null,
            grade: qual.grade || null,
            gpa: qual.gpa ? parseFloat(qual.gpa.toString()) : null,
            isCompleted: qual.isCompleted !== undefined ? qual.isCompleted : true,
            documentPath: qual.documentPath || null,
        }));

        // Prepare student response with ALL fields - use student relation if exists, otherwise use direct firstName/lastName
        const studentResponse = createdApp?.student ? {
            id: createdApp.student.id,
            studentId: (createdApp.student as any).studentId || null, // studentId might not exist in schema
            firstName: createdApp.student.firstName,
            lastName: createdApp.student.lastName || null,
            dateOfBirth: (createdApp.student as any).dateOfBirth ? (createdApp.student as any).dateOfBirth.toISOString().split('T')[0] : null,
            gender: (createdApp.student as any).gender || null,
            email: createdApp.student.email,
            phone: (createdApp.student as any).phone || null,
            nationality: (createdApp.student as any).nationality || null,
            passportNumber: (createdApp.student as any).passportNumber || null,
            passportExpiry: (createdApp.student as any).passportExpiry ? (createdApp.student as any).passportExpiry.toISOString().split('T')[0] : null,
            address: (createdApp.student as any).address || null,
            city: (createdApp.student as any).city || null,
            state: (createdApp.student as any).state || null,
            zipCode: (createdApp.student as any).zipCode || null,
            displayPicture: (createdApp.student as any).displayPicture || null,
            emergencyContactName: (createdApp.student as any).emergencyContactName || null,
            emergencyContactPhone: (createdApp.student as any).emergencyContactPhone || null,
            hasEnglishTest: (createdApp.student as any).hasEnglishTest || false,
            englishTestType: (createdApp.student as any).englishTestType || null,
            englishTestScore: (createdApp.student as any).englishTestScore || null,
            englishTestDate: (createdApp.student as any).englishTestDate ? (createdApp.student as any).englishTestDate.toISOString().split('T')[0] : null,
            maritalStatus: (createdApp.student as any).maritalStatus || null,
        } : {
            id: null,
            studentId: null,
            firstName: createdApp?.firstName || student.firstName,
            lastName: createdApp?.lastName || student.lastName,
            dateOfBirth: student.dateOfBirth || null,
            gender: student.gender || null,
            email: student.email || null,
            phone: student.phone || null,
            nationality: student.nationality || null,
            passportNumber: student.passportNumber || null,
            passportExpiry: student.passportExpiry || null,
            address: student.address || null,
            city: student.city || null,
            state: student.state || null,
            zipCode: student.zipCode || null,
            displayPicture: student.displayPicture || null,
            emergencyContactName: null,
            emergencyContactPhone: null,
            hasEnglishTest: student.hasEnglishTest || false,
            englishTestType: student.englishTestType || null,
            englishTestScore: student.englishTestScore || null,
            englishTestDate: student.englishTestDate || null,
            maritalStatus: null,
        };

        // Build response object explicitly
        const responseData = {
            applicationId: createdApp?.id,
            applicationRef: createdApp?.applicationRef,
            student: studentResponse,
            university: createdApp?.university,
            academicQualifications: Array.isArray(formattedAcademicQualifications) ? formattedAcademicQualifications : [],
            documents: createdApp?.documents || [],
            intendedPrograms: createdApp?.intendedPrograms || [],
            submissionDate: createdApp?.submissionDate
        };

        // Build response object
        const finalResponse = {
            success: true,
            message: "Application created successfully",
            data: {
                applicationId: responseData.applicationId,
                applicationRef: responseData.applicationRef,
                student: responseData.student,
                university: responseData.university,
                academicQualifications: responseData.academicQualifications, // EXPLICITLY INCLUDE
                documents: responseData.documents,
                intendedPrograms: responseData.intendedPrograms,
                submissionDate: responseData.submissionDate
            }
        };

        return res.status(StatusCodes.CREATED).json(finalResponse);

    } catch (error: any) {
        console.error('Error creating application:', error);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            // Check which unique constraint was violated
            const meta = error.meta as any;
            const target = meta?.target as string[] | undefined;

            if (target && Array.isArray(target) && target.includes('applicationRef')) {
                // Reference collision - this shouldn't happen with our collision handling, but handle it gracefully
                return res.status(StatusCodes.CONFLICT).json({
                    success: false,
                    message: "Application reference collision detected. Please try again.",
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            } else {
                // Other unique constraint violation (e.g., email, passportNumber)
                return res.status(StatusCodes.CONFLICT).json({
                    success: false,
                    message: "A duplicate record already exists",
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }

        if (error.code === 'P2003') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid student or university ID"
            });
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to create application",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const getApplication = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const application = await prisma.application.findUnique({
            where: { id: parseInt(id) },
            include: {
                student: true,
                academicQualifications: {
                    orderBy: { createdAt: 'asc' }
                },
                university: {
                    include: {
                        country: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            }
                        }
                    }
                },
                applicationStatus: true,
                documents: true,
                intendedPrograms: {
                    orderBy: { priority: 'asc' }
                },
                assignedTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                },
                assignedAgent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                }
            }
        });

        if (!application) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Application not found"
            });
        }

        // Format academic qualifications for response
        const formattedAcademicQualifications = (application.academicQualifications || []).map((qual: any) => ({
            id: qual.id,
            name: qual.name,
            educationLevel: qual.educationLevel,
            institutionName: qual.institutionName,
            programName: qual.programName || null,
            startDate: qual.startDate ? qual.startDate.toISOString().split('T')[0] : null,
            endDate: qual.endDate ? qual.endDate.toISOString().split('T')[0] : null,
            grade: qual.grade || null,
            gpa: qual.gpa ? parseFloat(qual.gpa.toString()) : null,
            isCompleted: qual.isCompleted !== undefined ? qual.isCompleted : true,
            documentPath: qual.documentPath || null,
        }));

        // Prepare student response with ALL fields (handle null student)
        const studentResponse = application.student ? {
            id: application.student.id,
            studentId: (application.student as any).studentId || null, // studentId might not exist in schema
            firstName: application.student.firstName,
            lastName: application.student.lastName || null,
            dateOfBirth: application.student.dateOfBirth ? application.student.dateOfBirth.toISOString().split('T')[0] : null,
            gender: application.student.gender || null,
            email: application.student.email,
            phone: application.student.phone || null,
            secondPhone: (application.student as any).secondPhone || null,
            nationality: application.student.nationality || null,
            passportNumber: application.student.passportNumber || null,
            passportExpiry: application.student.passportExpiry ? application.student.passportExpiry.toISOString().split('T')[0] : null,
            address: application.student.address || null,
            city: application.student.city || null,
            state: application.student.state || null,
            zipCode: application.student.zipCode || null,
            displayPicture: application.student.displayPicture || null,
            emergencyContactName: application.student.emergencyContactName || null,
            emergencyContactPhone: application.student.emergencyContactPhone || null,
            hasEnglishTest: application.student.hasEnglishTest || false,
            englishTestType: application.student.englishTestType || null,
            englishTestScore: application.student.englishTestScore || null,
            englishTestDate: application.student.englishTestDate ? application.student.englishTestDate.toISOString().split('T')[0] : null,
            maritalStatus: application.student.maritalStatus || null,
        } : {
            id: null,
            studentId: null,
            firstName: application.firstName,
            lastName: application.lastName,
            dateOfBirth: null,
            gender: null,
            email: null,
            phone: null,
            nationality: null,
            passportNumber: null,
            passportExpiry: null,
            address: null,
            city: null,
            state: null,
            zipCode: null,
            displayPicture: null,
            emergencyContactName: null,
            emergencyContactPhone: null,
            hasEnglishTest: false,
            englishTestType: null,
            englishTestScore: null,
            englishTestDate: null,
            maritalStatus: null,
        };

        return res.status(StatusCodes.OK).json({
            success: true,
            data: {
                id: application.id,
                applicationRef: application.applicationRef,
                student: studentResponse,
                university: application.university || null,
                academicQualifications: formattedAcademicQualifications,
                applicationStatus: application.applicationStatus,
                documents: application.documents,
                intendedPrograms: application.intendedPrograms,
                submissionDate: application.submissionDate,
                updatedAt: application.updatedAt,
                registered: application.registered ?? false,
                assignedTo: application.assignedTo || null,
                assignedAgent: application.assignedAgent || null,
                countryId: application.countryId || null,
            }
        });

    } catch (error: any) {
        console.error('Error fetching application:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to fetch application",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }

};

export const updateApplication = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            student,
            university,
            academicQualifications,
            documents,
            maritalStatus,
            marriageCertificate,
            intendedPrograms
        } = req.body;

        // Validate application exists
        const existingApplication = await prisma.application.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingApplication) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Application not found"
            });
        }

        // Validate required fields
        if (!student) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Student information is required"
            });
        }

        if (!student.firstName || student.firstName.trim() === '') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Student first name is required"
            });
        }

        if (!student.email || student.email.trim() === '') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Student email is required"
            });
        }

        // Validate intended programs
        if (!intendedPrograms || intendedPrograms.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "At least one intended program is required"
            });
        }

        // Take the first intended program as primary
        const primaryProgram = intendedPrograms[0];

        // University ID is optional - use from request if provided, otherwise null (university is stored as string in intended programs)
        const universityId = university?.id || null;

        // Update application with all related data in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create or get student
            let studentId: number | null = null;

            if (student?.id) {
                // Existing student - verify it exists
                const studentExists = await tx.student.findUnique({
                    where: { id: student.id }
                });
                if (studentExists) {
                    studentId = student.id;
                    // Update student with latest data
                    // Parse dateOfBirth - handle both string and Date formats
                    let dateOfBirth: Date;
                    if (student.dateOfBirth) {
                        dateOfBirth = student.dateOfBirth instanceof Date
                            ? student.dateOfBirth
                            : new Date(student.dateOfBirth);
                        // Validate date
                        if (isNaN(dateOfBirth.getTime())) {
                            dateOfBirth = new Date(); // Fallback to current date if invalid
                        }
                    } else {
                        dateOfBirth = new Date(); // Default to current date if not provided
                    }

                    // Normalize gender to lowercase enum value
                    let normalizedGender: 'male' | 'female' | 'other' | null = null;
                    if (student.gender) {
                        const genderLower = student.gender.toLowerCase();
                        if (genderLower === 'male' || genderLower === 'female' || genderLower === 'other') {
                            normalizedGender = genderLower as 'male' | 'female' | 'other';
                        }
                    }

                    await tx.student.update({
                        where: { id: student.id },
                        data: {
                            firstName: student.firstName.trim(),
                            lastName: student.lastName?.trim() || null,
                            dateOfBirth: dateOfBirth,
                            gender: normalizedGender,
                            email: student.email.trim(),
                            phone: student.phone?.trim() || null,
                            secondPhone: student.secondPhone?.trim() || null,
                            nationality: student.nationality?.trim() || null,
                            passportNumber: student.passportNumber?.trim() || null,
                            passportExpiry: student.passportExpiry ? (student.passportExpiry instanceof Date ? student.passportExpiry : new Date(student.passportExpiry)) : null,
                            address: student.address?.trim() || null,
                            city: student.city?.trim() || null,
                            state: student.state?.trim() || null,
                            zipCode: student.zipCode?.trim() || null,
                            displayPicture: student.displayPicture || null,
                            hasEnglishTest: student.hasEnglishTest || false,
                            englishTestType: student.englishTestType || null,
                            englishTestScore: student.englishTestScore?.trim() || null,
                            englishTestDate: student.englishTestDate ? (student.englishTestDate instanceof Date ? student.englishTestDate : new Date(student.englishTestDate)) : null,
                        }
                    });
                }
            }

            // If no existing student, create a new one
            if (!studentId) {
                // Parse dateOfBirth - handle both string and Date formats
                let dateOfBirth: Date;
                if (student.dateOfBirth) {
                    dateOfBirth = student.dateOfBirth instanceof Date
                        ? student.dateOfBirth
                        : new Date(student.dateOfBirth);
                    // Validate date
                    if (isNaN(dateOfBirth.getTime())) {
                        dateOfBirth = new Date(); // Fallback to current date if invalid
                    }
                } else {
                    dateOfBirth = new Date(); // Default to current date if not provided
                }

                // Normalize gender to lowercase enum value
                let normalizedGender: 'male' | 'female' | 'other' | null = null;
                if (student.gender) {
                    const genderLower = student.gender.toLowerCase();
                    if (genderLower === 'male' || genderLower === 'female' || genderLower === 'other') {
                        normalizedGender = genderLower as 'male' | 'female' | 'other';
                    }
                }

                const newStudent = await tx.student.create({
                    data: {
                        firstName: student.firstName.trim(),
                        lastName: student.lastName?.trim() || null,
                        dateOfBirth: dateOfBirth,
                        gender: normalizedGender,
                        email: student.email.trim(),
                        phone: student.phone?.trim() || null,
                        secondPhone: student.secondPhone?.trim() || null,
                        nationality: student.nationality?.trim() || null,
                        passportNumber: student.passportNumber?.trim() || null,
                        passportExpiry: student.passportExpiry ? (student.passportExpiry instanceof Date ? student.passportExpiry : new Date(student.passportExpiry)) : null,
                        address: student.address?.trim() || null,
                        city: student.city?.trim() || null,
                        state: student.state?.trim() || null,
                        zipCode: student.zipCode?.trim() || null,
                        displayPicture: student.displayPicture || null,
                        hasEnglishTest: student.hasEnglishTest || false,
                        englishTestType: student.englishTestType || null,
                        englishTestScore: student.englishTestScore?.trim() || null,
                        englishTestDate: student.englishTestDate ? (student.englishTestDate instanceof Date ? student.englishTestDate : new Date(student.englishTestDate)) : null,
                    }
                });
                studentId = newStudent.id;
            }

            // 2. Update the main application
            const application = await tx.application.update({
                where: { id: parseInt(id) },
                data: {
                    studentId: studentId,
                    firstName: student.firstName,
                    lastName: student.lastName || '',
                    universityId: universityId || existingApplication.universityId, // Keep existing if null
                    intendedProgram: primaryProgram.programme || 'Not specified',
                    updatedAt: new Date(),
                }
            });

            // 3. Delete existing documents and create new ones
            await tx.applicationDocument.deleteMany({
                where: { applicationId: application.id }
            });

            if (documents && documents.length > 0) {
                await tx.applicationDocument.createMany({
                    data: documents.map((doc: any) => ({
                        applicationId: application.id,
                        documentType: doc.documentType,
                        fileName: doc.fileName,
                        filePath: doc.filePath,
                        fileSize: doc.fileSize || null,
                        uploadedAt: new Date()
                    }))
                });
            }

            // 3. Create marriage certificate document if exists
            if (marriageCertificate?.filePath) {
                await tx.applicationDocument.create({
                    data: {
                        applicationId: application.id,
                        documentType: 'MARRIAGE_CERTIFICATE',
                        fileName: marriageCertificate.fileName,
                        filePath: marriageCertificate.filePath,
                        fileSize: marriageCertificate.fileSize || null,
                        uploadedAt: new Date()
                    }
                });
            }

            // 5. Delete existing intended programs and create new ones
            await tx.intendedProgram.deleteMany({
                where: { applicationId: application.id }
            });

            if (intendedPrograms && intendedPrograms.length > 0) {
                await tx.intendedProgram.createMany({
                    data: intendedPrograms.map((program: any, index: number) => ({
                        applicationId: application.id,
                        country: program.country || 'Not specified',
                        university: program.university || 'Not specified',
                        programme: program.programme || 'Not specified',
                        priority: program.priority || index + 1, // Use priority from frontend if provided
                        isPrimary: (program.priority || index + 1) === 1 // First priority is primary
                    }))
                });
            }

            // 5. Update student's marital status (only if student exists)
            if (studentId) {
                await tx.student.update({
                    where: { id: studentId },
                    data: {
                        maritalStatus: maritalStatus || 'SINGLE',
                        ...(maritalStatus === 'MARRIED' && marriageCertificate?.filePath && {
                            marriageCertificatePath: marriageCertificate.filePath
                        })
                    }
                });
            }

            // 6. Delete existing academic qualifications and create new ones
            await tx.academicQualification.deleteMany({
                where: { applicationId: application.id }
            });

            if (academicQualifications && Array.isArray(academicQualifications) && academicQualifications.length > 0) {
                await tx.academicQualification.createMany({
                    data: academicQualifications.map((qual: any) => ({
                        applicationId: application.id,
                        name: qual.name || '',
                        educationLevel: qual.educationLevel || 'OTHER',
                        institutionName: qual.institutionName || '',
                        programName: qual.programName || null,
                        startDate: qual.startDate ? new Date(qual.startDate) : null,
                        endDate: qual.endDate ? new Date(qual.endDate) : null,
                        grade: qual.grade || null,
                        gpa: qual.gpa || null,
                        isCompleted: qual.isCompleted !== undefined ? qual.isCompleted : true,
                        documentPath: qual.documentPath || null,
                    }))
                });
            }

            return application;
        });

        // Fetch the updated application with all related data
        const updatedApp = await prisma.application.findUnique({
            where: { id: result.id },
            include: {
                student: true,
                academicQualifications: {
                    orderBy: { createdAt: 'asc' }
                },
                university: {
                    select: {
                        name: true,
                        country: {
                            select: {
                                name: true,
                                id: true
                            }
                        }
                    }
                },
                documents: {
                    select: {
                        id: true,
                        documentType: true,
                        fileName: true,
                        filePath: true,
                        uploadedAt: true
                    }
                },
                intendedPrograms: {
                    select: {
                        country: true,
                        university: true,
                        programme: true,
                        priority: true,
                        isPrimary: true
                    },
                    orderBy: { priority: 'asc' }
                }
            }
        });

        // Prepare student response with ALL fields
        const studentResponse = updatedApp?.student ? {
            id: updatedApp.student.id,
            studentId: (updatedApp.student as any).studentId || null, // studentId might not exist in schema
            firstName: updatedApp.student.firstName,
            lastName: updatedApp.student.lastName || null,
            dateOfBirth: updatedApp.student.dateOfBirth ? updatedApp.student.dateOfBirth.toISOString().split('T')[0] : null,
            gender: updatedApp.student.gender || null,
            email: updatedApp.student.email,
            phone: updatedApp.student.phone || null,
            nationality: updatedApp.student.nationality || null,
            passportNumber: updatedApp.student.passportNumber || null,
            passportExpiry: updatedApp.student.passportExpiry ? updatedApp.student.passportExpiry.toISOString().split('T')[0] : null,
            address: updatedApp.student.address || null,
            city: updatedApp.student.city || null,
            state: updatedApp.student.state || null,
            zipCode: updatedApp.student.zipCode || null,
            displayPicture: updatedApp.student.displayPicture || null,
            emergencyContactName: updatedApp.student.emergencyContactName || null,
            emergencyContactPhone: updatedApp.student.emergencyContactPhone || null,
            hasEnglishTest: updatedApp.student.hasEnglishTest || false,
            englishTestType: updatedApp.student.englishTestType || null,
            englishTestScore: updatedApp.student.englishTestScore || null,
            englishTestDate: updatedApp.student.englishTestDate ? updatedApp.student.englishTestDate.toISOString().split('T')[0] : null,
            maritalStatus: updatedApp.student.maritalStatus || null,
        } : {
            id: null,
            studentId: null,
            firstName: updatedApp?.firstName || null,
            lastName: updatedApp?.lastName || null,
            dateOfBirth: null,
            gender: null,
            email: null,
            phone: null,
            nationality: null,
            passportNumber: null,
            passportExpiry: null,
            address: null,
            city: null,
            state: null,
            zipCode: null,
            displayPicture: null,
            emergencyContactName: null,
            emergencyContactPhone: null,
            hasEnglishTest: false,
            englishTestType: null,
            englishTestScore: null,
            englishTestDate: null,
            maritalStatus: null,
        };

        // Format academic qualifications for response
        const formattedAcademicQualifications = (updatedApp?.academicQualifications || []).map((qual: any) => ({
            id: qual.id,
            name: qual.name,
            educationLevel: qual.educationLevel,
            institutionName: qual.institutionName,
            programName: qual.programName || null,
            startDate: qual.startDate ? qual.startDate.toISOString().split('T')[0] : null,
            endDate: qual.endDate ? qual.endDate.toISOString().split('T')[0] : null,
            grade: qual.grade || null,
            gpa: qual.gpa ? parseFloat(qual.gpa.toString()) : null,
            isCompleted: qual.isCompleted !== undefined ? qual.isCompleted : true,
            documentPath: qual.documentPath || null,
        }));

        // Build response data
        const responseData = {
            applicationId: updatedApp?.id,
            applicationRef: updatedApp?.applicationRef,
            student: studentResponse,
            university: updatedApp?.university,
            academicQualifications: Array.isArray(formattedAcademicQualifications) ? formattedAcademicQualifications : [],
            documents: updatedApp?.documents || [],
            intendedPrograms: updatedApp?.intendedPrograms || [],
            submissionDate: updatedApp?.submissionDate,
            updatedAt: updatedApp?.updatedAt
        };

        // Build response object
        const finalResponse = {
            success: true,
            message: "Application updated successfully",
            data: {
                applicationId: responseData.applicationId,
                applicationRef: responseData.applicationRef,
                student: responseData.student,
                university: responseData.university,
                academicQualifications: responseData.academicQualifications, // EXPLICITLY INCLUDE
                documents: responseData.documents,
                intendedPrograms: responseData.intendedPrograms,
                submissionDate: responseData.submissionDate,
                updatedAt: responseData.updatedAt
            }
        };

        return res.status(StatusCodes.OK).json(finalResponse);

    } catch (error: any) {
        console.error('Error updating application:', error);

        // Handle specific Prisma errors
        if (error.code === 'P2003') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid student or university ID"
            });
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update application",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const deleteApplication = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if application exists
        const application = await prisma.application.findUnique({
            where: { id: parseInt(id) }
        });

        if (!application) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Application not found"
            });
        }

        // Delete application (cascade will handle related records)
        await prisma.application.delete({
            where: { id: parseInt(id) }
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Application deleted successfully"
        });
    } catch (error: any) {
        console.error('Error deleting application:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to delete application",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const currentUser = (req as any).user;

        if (!status) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Status is required"
            });
        }

        // Check if application exists and get current status
        const application = await prisma.application.findUnique({
            where: { id: parseInt(id) },
            include: {
                applicationStatus: {
                    select: {
                        id: true,
                        status: true,
                        description: true
                    }
                }
            }
        });

        if (!application) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Application not found"
            });
        }

        // Check if current status is "completed" and user is not admin
        const currentStatus = application.applicationStatus?.status?.toLowerCase();
        const isCompleted = currentStatus === 'completed';
        const isAdmin = currentUser?.role === 'admin';
        const newStatusLower = status.toLowerCase();

        // Prevent non-admin users from changing status if it's already "completed"
        if (isCompleted && !isAdmin) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: "Cannot change status. This application is marked as completed. Only administrators can modify completed applications."
            });
        }

        // Find the status ID by status name
        const statusRecord = await prisma.applicationStatus.findFirst({
            where: {
                status: {
                    equals: newStatusLower,
                    mode: 'insensitive'
                }
            }
        });

        if (!statusRecord) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: `Invalid status: ${status}. Status not found.`
            });
        }

        // Update application status
        const updatedApplication = await prisma.application.update({
            where: { id: parseInt(id) },
            data: {
                applicationStatusId: statusRecord.id,
                updatedAt: new Date()
            },
            include: {
                applicationStatus: {
                    select: {
                        id: true,
                        status: true,
                        description: true
                    }
                }
            }
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Application status updated successfully",
            data: {
                id: updatedApplication.id,
                applicationRef: updatedApplication.applicationRef,
                status: updatedApplication.applicationStatus
            }
        });
    } catch (error: any) {
        console.error('Error updating application status:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update application status",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const updateApplicationAssignedTo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { assignedToId } = req.body;

        // Check if application exists
        const application = await prisma.application.findUnique({
            where: { id: parseInt(id) }
        });

        if (!application) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Application not found"
            });
        }

        // Validate user exists if assignedToId is provided
        if (assignedToId !== null && assignedToId !== undefined) {
            const user = await prisma.user.findUnique({
                where: { id: parseInt(assignedToId.toString(), 10) }
            });

            if (!user) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `User with id ${assignedToId} not found`
                });
            }
        }

        // Update application assignedTo
        const updatedApplication = await prisma.application.update({
            where: { id: parseInt(id) },
            data: {
                assignedToId: assignedToId ? parseInt(assignedToId.toString(), 10) : null,
                updatedAt: new Date()
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Application assigned to updated successfully",
            data: updatedApplication
        });
    } catch (error: any) {
        console.error('Error updating application assigned to:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update application assigned to",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const updateApplicationAssignedAgent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { assignedAgentId } = req.body;

        // Check if application exists
        const application = await prisma.application.findUnique({
            where: { id: parseInt(id) }
        });

        if (!application) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Application not found"
            });
        }

        // Validate user exists if assignedAgentId is provided
        if (assignedAgentId !== null && assignedAgentId !== undefined) {
            const user = await prisma.user.findUnique({
                where: { id: parseInt(assignedAgentId.toString(), 10) }
            });

            if (!user) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: `User with id ${assignedAgentId} not found`
                });
            }
        }

        // Update application assignedAgent
        const updatedApplication = await prisma.application.update({
            where: { id: parseInt(id) },
            data: {
                assignedAgentId: assignedAgentId ? parseInt(assignedAgentId.toString(), 10) : null,
                updatedAt: new Date()
            },
            include: {
                assignedAgent: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Application assigned agent updated successfully",
            data: updatedApplication
        });
    } catch (error: any) {
        console.error('Error updating application assigned agent:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update application assigned agent",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const updateApplicationRegistered = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { registered } = req.body;

        // Check if application exists
        const application = await prisma.application.findUnique({
            where: { id: parseInt(id) }
        });

        if (!application) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Application not found"
            });
        }

        // Update application registered status
        const updatedApplication = await prisma.application.update({
            where: { id: parseInt(id) },
            data: {
                registered: registered === true || registered === 'true',
                updatedAt: new Date()
            }
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Application registered status updated successfully",
            data: updatedApplication
        });
    } catch (error: any) {
        console.error('Error updating application registered status:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update application registered status",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};