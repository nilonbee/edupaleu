import { generateApplicationRef } from '../utils/generateRef';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../lib/prisma';

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
            error: error.message,
        });
    }
};

export const createApplication = async (req: Request, res: Response) => {
    try {
        const {
            student,
            university,
            academicQualifications,
            documents,
            maritalStatus,
            marriageCertificate,
            intendedPrograms
        } = req.body;

        if (!student || !student.id) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Student information is required"
            });
        }

        if (!university || !university.id) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "University information is required"
            });
        }

        const studentId = student.id;
        const universityId = university.id;

        const studentExists = await prisma.student.findUnique({
            where: { id: studentId }
        });

        if (!studentExists) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Student not found"
            });
        }

        const universityExists = await prisma.university.findUnique({
            where: { id: universityId }
        });

        if (!universityExists) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "University not found"
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

        // Generate application reference
        const applicationRef = generateApplicationRef();

        // Create application with all related data in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the main application
            const application = await tx.application.create({
                data: {
                    applicationRef,
                    studentId: studentId,
                    universityId: universityId,
                    intendedProgram: primaryProgram.programme || 'Not specified',
                    intakeYear: new Date().getFullYear(),
                    intakeMonth: 'SEPTEMBER',
                    applicationStatusId: 1, // Assuming 1 = PENDING
                    applicationFee: 0,
                    feePaid: false,
                    submissionDate: new Date(),
                }
            });

            // 2. Create application documents
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

            // 4. Create intended programs
            if (intendedPrograms && intendedPrograms.length > 0) {
                await tx.intendedProgram.createMany({
                    data: intendedPrograms.map((program: any, index: number) => ({
                        applicationId: application.id,
                        country: program.country || 'Not specified',
                        university: program.university || 'Not specified',
                        programme: program.programme || 'Not specified',
                        priority: index + 1,
                        isPrimary: index === 0
                    }))
                });
            }

            // 5. Update student's marital status
            await tx.student.update({
                where: { id: studentId },
                data: {
                    maritalStatus: maritalStatus || 'SINGLE',
                    ...(maritalStatus === 'MARRIED' && marriageCertificate?.filePath && {
                        marriageCertificatePath: marriageCertificate.filePath
                    })
                }
            });

            // 6. Create academic qualifications using nested write
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
                student: true,
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

        // Prepare student response
        const studentResponse = {
            id: createdApp?.student?.id,
            firstName: createdApp?.student?.firstName,
            lastName: createdApp?.student?.lastName,
            email: createdApp?.student?.email
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
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: "Application reference already exists"
            });
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
                university: true,
                applicationStatus: true,
                documents: true,
                intendedPrograms: {
                    orderBy: { priority: 'asc' }
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

        // Prepare student response
        const studentResponse = {
            id: application.student.id,
            firstName: application.student.firstName,
            lastName: application.student.lastName,
            email: application.student.email
        };

        return res.status(StatusCodes.OK).json({
            success: true,
            data: {
                id: application.id,
                applicationRef: application.applicationRef,
                student: studentResponse,
                university: application.university,
                academicQualifications: formattedAcademicQualifications,
                applicationStatus: application.applicationStatus,
                documents: application.documents,
                intendedPrograms: application.intendedPrograms,
                submissionDate: application.submissionDate,
                updatedAt: application.updatedAt
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

        // Validate student
        if (!student || !student.id) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Student information is required"
            });
        }

        // Validate university
        if (!university || !university.id) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "University information is required"
            });
        }

        const studentId = student.id;
        const universityId = university.id;

        // Check if student exists
        const studentExists = await prisma.student.findUnique({
            where: { id: studentId }
        });

        if (!studentExists) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Student not found"
            });
        }

        // Check if university exists
        const universityExists = await prisma.university.findUnique({
            where: { id: universityId }
        });

        if (!universityExists) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "University not found"
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

        // Update application with all related data in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update the main application
            const application = await tx.application.update({
                where: { id: parseInt(id) },
                data: {
                    studentId: studentId,
                    universityId: universityId,
                    intendedProgram: primaryProgram.programme || 'Not specified',
                    updatedAt: new Date(),
                }
            });

            // 2. Delete existing documents and create new ones
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

            // 4. Delete existing intended programs and create new ones
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
                        priority: index + 1,
                        isPrimary: index === 0
                    }))
                });
            }

            // 5. Update student's marital status
            await tx.student.update({
                where: { id: studentId },
                data: {
                    maritalStatus: maritalStatus || 'SINGLE',
                    ...(maritalStatus === 'MARRIED' && marriageCertificate?.filePath && {
                        marriageCertificatePath: marriageCertificate.filePath
                    })
                }
            });

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

        // Prepare student response
        const studentResponse = {
            id: updatedApp?.student?.id,
            firstName: updatedApp?.student?.firstName,
            lastName: updatedApp?.student?.lastName,
            email: updatedApp?.student?.email,
            maritalStatus: updatedApp?.student?.maritalStatus
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
            student: {
                id: updatedApp?.student?.id,
                firstName: updatedApp?.student?.firstName,
                lastName: updatedApp?.student?.lastName,
                email: updatedApp?.student?.email,
                maritalStatus: updatedApp?.student?.maritalStatus
            },
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