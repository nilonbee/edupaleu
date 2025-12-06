// Direct test to insert academic qualification
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDirectInsert() {
    try {
        console.log('Testing direct insert of academic qualification...');
        
        const result = await prisma.academicQualification.create({
            data: {
                studentId: 1,
                name: "Test Bachelor of Science",
                educationLevel: "BACHELORS",
                institutionName: "Test University",
                programName: "Computer Science",
                startDate: new Date("2020-09-01"),
                endDate: new Date("2024-06-30"),
                grade: "A",
                gpa: 3.8,
                isCompleted: true,
                documentPath: "https://example.com/certificate.pdf"
            }
        });
        
        console.log('✅ Successfully created:', result);
        
        // Check if it exists
        const found = await prisma.academicQualification.findUnique({
            where: { id: result.id }
        });
        console.log('✅ Verified exists:', found !== null);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Error details:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDirectInsert();

