// Test script to query database directly and check academic qualifications
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAcademicQualifications() {
    try {
        console.log('========================================');
        console.log('Testing Academic Qualifications in DB');
        console.log('========================================\n');

        // Get all academic qualifications
        const allQuals = await prisma.academicQualification.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        console.log(`Total academic qualifications found: ${allQuals.length}\n`);

        if (allQuals.length > 0) {
            console.log('Academic Qualifications:');
            console.log(JSON.stringify(allQuals, null, 2));
        } else {
            console.log('❌ NO academic qualifications found in database\n');
        }

        // Test: Get application with ID 17 and check if it has academic qualifications
        const applicationId = 17;
        console.log(`\n========================================`);
        console.log(`Testing GET Application ID: ${applicationId}`);
        console.log('========================================\n');

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                student: {
                    include: {
                        academicQualifications: true
                    }
                },
                university: true
            }
        });

        if (!application) {
            console.log(`❌ Application with ID ${applicationId} not found`);
        } else {
            console.log(`✅ Application found: ${application.applicationRef}`);
            console.log(`   Student ID: ${application.studentId}`);
            console.log(`   Student: ${application.student.firstName} ${application.student.lastName}`);
            console.log(`   Academic Qualifications Count: ${application.student.academicQualifications?.length || 0}\n`);

            if (application.student.academicQualifications && application.student.academicQualifications.length > 0) {
                console.log('✅ Academic Qualifications for this student:');
                console.log(JSON.stringify(application.student.academicQualifications, null, 2));
            } else {
                console.log('❌ NO academic qualifications found for this student');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testAcademicQualifications();

