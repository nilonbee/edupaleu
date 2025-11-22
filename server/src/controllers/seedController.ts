import { Request, Response } from 'express';
import { exec } from 'child_process';

export const seedDatabase = (req: Request, res: Response) => {
    console.log('Starting database setup...');

    exec('npx prisma generate && npx prisma db push && npx ts-node prisma/seed.ts',
        (error, stdout, stderr) => {
            if (error) {
                console.error('Database setup failed:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Database setup failed',
                    error: error.message
                });
            }

            console.log('✅ All commands completed successfully');
            res.json({
                success: true,
                message: 'Database setup and seeding completed successfully'
            });
        }
    );
};