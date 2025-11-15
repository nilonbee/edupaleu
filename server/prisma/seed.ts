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
    "User",           // ← This is "User" not "user"
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

  // Seed in CORRECT order (parent tables first, child tables last)
  const orderedFileNames = [
    // Study Abroad tables - parent tables first
    "userRoles.json",        // Role (independent)
    "applicationStatus.json", // ApplicationStatus (independent)
    "countries.json",        // Country (independent)
    "users.json",            // User (needs Role)
    "universities.json",     // University (needs Country)

    // Business tables - parent tables first
    "products.json",         // Product (independent)
    "expenses.json",         // Expense (independent)
    "purchases.json",        // Purchase (needs Product)
    "sales.json",            // Sale (needs Product)
    "expenseSummary.json",   // ExpenseSummary (independent)
    "purchaseSummary.json",  // PurchaseSummary (independent)  
    "salesSummary.json",     // SalesSummary (independent)
    "expenseByCategory.json" // ExpenseByCategory (needs ExpenseSummary)
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
          'users': 'User',           // ← This maps to "User" model
          'universities': 'University',
          'products': 'Product',
          'expenses': 'Expense',
          'purchases': 'Purchase',
          'sales': 'Sale',
          'expenseSummary': 'ExpenseSummary',
          'purchaseSummary': 'PurchaseSummary',
          'salesSummary': 'SalesSummary',
          'expenseByCategory': 'ExpenseByCategory'
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
          // Use createMany for better performance
          await model.createMany({
            data: jsonData,
            skipDuplicates: true,
          });
          console.log(`✅ Seeded ${prismaModelName} with ${jsonData.length} records`);
        } else {
          console.log(`⚠️  No data in ${fileName}`);
        }

      } catch (error: any) {
        console.error(`❌ Error seeding ${fileName}:`, error.message);
      }
    }

    console.log('🎉 Seeding completed successfully!');

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