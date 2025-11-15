"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
function deleteAllData() {
    return __awaiter(this, void 0, void 0, function* () {
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
            "User", // ← This is "User" not "user"
            "University",
            "Country",
            "ApplicationStatus",
            "Role",
            "Product"
        ];
        for (const modelName of deletionOrder) {
            try {
                const model = prisma[modelName];
                if (model && typeof model.deleteMany === 'function') {
                    yield model.deleteMany({});
                    console.log(`✅ Cleared ${modelName}`);
                }
                else {
                    console.log(`⚠️  No model found for: ${modelName}`);
                }
            }
            catch (error) {
                console.error(`❌ Failed to clear ${modelName}:`, error.message);
            }
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const dataDirectory = path_1.default.join(__dirname, "seedData");
        // Seed in CORRECT order (parent tables first, child tables last)
        const orderedFileNames = [
            // Study Abroad tables - parent tables first
            "userRoles.json", // Role (independent)
            "applicationStatus.json", // ApplicationStatus (independent)
            "countries.json", // Country (independent)
            "users.json", // User (needs Role)
            "universities.json", // University (needs Country)
            // Business tables - parent tables first
            "products.json", // Product (independent)
            "expenses.json", // Expense (independent)
            "purchases.json", // Purchase (needs Product)
            "sales.json", // Sale (needs Product)
            "expenseSummary.json", // ExpenseSummary (independent)
            "purchaseSummary.json", // PurchaseSummary (independent)  
            "salesSummary.json", // SalesSummary (independent)
            "expenseByCategory.json" // ExpenseByCategory (needs ExpenseSummary)
        ];
        try {
            yield deleteAllData();
            console.log('🌱 Seeding new data...');
            for (const fileName of orderedFileNames) {
                const filePath = path_1.default.join(dataDirectory, fileName);
                if (!fs_1.default.existsSync(filePath)) {
                    console.error(`❌ File not found: ${fileName}`);
                    continue;
                }
                try {
                    const jsonData = JSON.parse(fs_1.default.readFileSync(filePath, "utf-8"));
                    const modelName = path_1.default.basename(fileName, path_1.default.extname(fileName));
                    // Map file names to EXACT Prisma model names (case-sensitive)
                    const modelMap = {
                        'userRoles': 'Role',
                        'applicationStatus': 'ApplicationStatus',
                        'countries': 'Country',
                        'users': 'User', // ← This maps to "User" model
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
                    const model = prisma[prismaModelName];
                    if (!model) {
                        console.error(`❌ No Prisma model found for: ${prismaModelName}`);
                        continue;
                    }
                    if (jsonData.length > 0) {
                        // Use createMany for better performance
                        yield model.createMany({
                            data: jsonData,
                            skipDuplicates: true,
                        });
                        console.log(`✅ Seeded ${prismaModelName} with ${jsonData.length} records`);
                    }
                    else {
                        console.log(`⚠️  No data in ${fileName}`);
                    }
                }
                catch (error) {
                    console.error(`❌ Error seeding ${fileName}:`, error.message);
                }
            }
            console.log('🎉 Seeding completed successfully!');
        }
        catch (error) {
            console.error('💥 Seeding failed:', error);
            process.exit(1);
        }
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
