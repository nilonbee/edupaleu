import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function deleteAllData() {
  console.log('🗑️  Clearing existing data in correct order...');

  // Delete in REVERSE order of dependencies (child tables first, parent tables last)
  // Using EXACT Prisma model names from your schema
  const deletionOrder = [
    // Most dependent tables FIRST (those with foreign keys)
    "ApplicationCommunication",
    "ApplicationDocument",
    "Application",
    "AcademicQualification",
    "Student",
    "AuthToken",
    "RefreshToken",

    // Business tables - child tables first
    "ExpenseByCategory",
    "Sale",
    "Purchase",
    "Expense",

    // Summary tables
    "SalesSummary",
    "PurchaseSummary",
    "ExpenseSummary",

    // Independent tables LAST (no foreign keys or referenced by others)
    // "User",           // REMOVED: First registered user should be admin
    "University",
    "Country",
    "ApplicationStatus",
    "Role",
    "Product"
  ];

  for (const modelName of deletionOrder) {
    try {
      const model: any = prisma[modelName as keyof typeof prisma];
      if (model && typeof model.deleteMany === 'function') {
        await model.deleteMany({});
        console.log(`✅ Cleared ${modelName}`);
      } else {
        console.log(`⚠️  No model found for: ${modelName}`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to clear ${modelName}:`, error.message);
    }
  }
}

async function main() {
  const dataDirectory = path.join(__dirname, "seedData");

  try {
    // Disable foreign key constraints temporarily to allow reseeding
    await prisma.$executeRawUnsafe('SET session_replication_role = replica;');
    console.log('🔓 Foreign key constraints disabled');
  } catch (error) {
    console.warn('⚠️  Could not disable FK constraints:', error);
  }

  // Seed in CORRECT order (parent tables first, child tables last)
  const orderedFileNames = [
    // Study Abroad tables - parent tables first
    "userRoles.json",        // Role (independent)
    "applicationStatus.json", // ApplicationStatus (independent)
    "countries.json",        // Country (independent)
    // "users.json",            // User (needs Role) - REMOVED: First registered user should be admin
    "universities.json",     // University (needs Country)
    "student.json",          // Student (needs User)
    "application.json",      // Application (needs Student, University, User, ApplicationStatus)

    // Business tables - parent tables first
    "products.json",         // Product (independent)
    "expenses.json",         // Expense (independent)
    "purchases.json",        // Purchase (needs Product)
    "sales.json",            // Sale (needs Product)
    "expenseSummary.json",   // ExpenseSummary (independent)
    "purchaseSummary.json",  // PurchaseSummary (independent)  
    "salesSummary.json",     // SalesSummary (independent)
    "expenseByCategory.json",// ExpenseByCategory (needs ExpenseSummary)
  ];

  try {
    await deleteAllData();

    console.log('🌱 Seeding new data...');

    for (const fileName of orderedFileNames) {
      const filePath = path.join(dataDirectory, fileName);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${fileName}`);
        continue;
      }

      try {
        const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const modelName = path.basename(fileName, path.extname(fileName));

        // Map file names to EXACT Prisma model names (case-sensitive)
        const modelMap: { [key: string]: string } = {
          'userRoles': 'Role',
          'applicationStatus': 'ApplicationStatus',
          'countries': 'Country',
          // 'users': 'User',  // REMOVED: First registered user should be admin
          'universities': 'University',
          'student': 'Student',
          'application': 'Application',
          'products': 'Product',
          'expenses': 'Expense',
          'purchases': 'Purchase',
          'sales': 'Sale',
          'expenseSummary': 'ExpenseSummary',
          'purchaseSummary': 'PurchaseSummary',
          'salesSummary': 'SalesSummary',
          'expenseByCategory': 'ExpenseByCategory',
        };

        const prismaModelName = modelMap[modelName];
        if (!prismaModelName) {
          console.error(`❌ No mapping found for: ${fileName}`);
          continue;
        }

        const model: any = prisma[prismaModelName as keyof typeof prisma];

        if (!model) {
          console.error(`❌ No Prisma model found for: ${prismaModelName}`);
          continue;
        }

        if (jsonData.length > 0) {
          // Special handling for Application: add firstName and lastName from Student if studentId exists
          let processedData = jsonData;
          if (prismaModelName === 'Application') {
            // Fetch all students to map IDs to names
            const students = await prisma.student.findMany({
              select: { id: true, firstName: true, lastName: true }
            });
            const studentMap = new Map(students.map(s => [s.id, { firstName: s.firstName, lastName: s.lastName }]));
            
            processedData = jsonData.map((app: any) => {
              if (app.studentId && studentMap.has(app.studentId)) {
                const student = studentMap.get(app.studentId)!;
                return {
                  ...app,
                  firstName: app.firstName || student.firstName,
                  lastName: app.lastName || student.lastName,
                };
              }
              // If no studentId but has firstName/lastName, use them; otherwise throw error
              if (!app.firstName || !app.lastName) {
                throw new Error(`Application ${app.applicationRef} requires firstName and lastName`);
              }
              return app;
            });
          }
          
          // Use createMany for better performance
          await model.createMany({
            data: processedData,
            skipDuplicates: true,
          });
          console.log(`✅ Seeded ${prismaModelName} with ${processedData.length} records`);
        } else {
          console.log(`⚠️  No data in ${fileName}`);
        }

      } catch (error: any) {
        console.error(`❌ Error seeding ${fileName}:`, error.message);
      }
    }

    console.log('🎉 Seeding completed successfully!');

    // Ensure Postgres sequences are set correctly after inserting explicit id values
    // This prevents future inserts from attempting to reuse existing ids (causing P2002)
    // Maps table name to its primary key column name
    const tableSequences: { [table: string]: string } = {
      'Role': 'id',
      // 'User': 'id',  // REMOVED: First registered user should be admin
      'Country': 'id',
      'University': 'id',
      'Student': 'id',
      'AcademicQualification': 'id',
      'ApplicationStatus': 'id',
      'Application': 'id',
      'RefreshToken': 'id',
      'AuthToken': 'id',
      'ApplicationDocument': 'id',
      'ApplicationCommunication': 'id',
      'Expense': 'expenseId',
      'Purchase': 'purchaseId',
      'Sale': 'saleId',
      'SalesSummary': 'salesSummaryId',
      'PurchaseSummary': 'purchaseSummaryId',
      'ExpenseSummary': 'expenseSummaryId',
      'ExpenseByCategory': 'expenseByCategoryId',
      'Product': 'productId',
    };

    for (const [table, pkColumn] of Object.entries(tableSequences)) {
      try {
        // Check if PK is an integer (has a sequence) or UUID (doesn't need sequence adjustment)
        const sequenceQuery = `SELECT setval(pg_get_serial_sequence('"${table}"','${pkColumn}'), COALESCE((SELECT MAX(CAST("${pkColumn}" AS INTEGER)) FROM "${table}"), 1), true);`;
        await prisma.$executeRawUnsafe(sequenceQuery);
        console.log(`🔧 Adjusted sequence for ${table}.${pkColumn}`);
      } catch (error: any) {
        // Silently ignore errors (UUID columns don't have sequences, will throw error)
        // Only log if it's an unexpected error
        if (!error?.message?.includes('column') && !error?.message?.includes('pg_get_serial_sequence')) {
          console.warn(`⚠️  Issue adjusting sequence for ${table}.${pkColumn}: ${error?.message || error}`);
        }
      }
    }

    // Re-enable foreign key constraints
    try {
      await prisma.$executeRawUnsafe('SET session_replication_role = default;');
      console.log('🔒 Foreign key constraints re-enabled');
    } catch (error) {
      console.warn('⚠️  Could not re-enable FK constraints:', error);
    }

  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });