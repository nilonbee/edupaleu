import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getDashboardMetrics = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        // Get past 6 months of enquiry data
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1); // Start of month
        sixMonthsAgo.setHours(0, 0, 0, 0);

        // Get enquiries grouped by month for past 6 months
        const enquiries = await prisma.enquiry.findMany({
            where: {
                createdAt: {
                    gte: sixMonthsAgo,
                },
            },
            select: {
                createdAt: true,
            },
        });

        // Group enquiries by month
        const enquiryCountByMonth: { [key: string]: number } = {};
        const monthNames: string[] = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            monthNames.push(monthName);
            enquiryCountByMonth[monthKey] = 0;
        }

        enquiries.forEach((enquiry) => {
            const date = new Date(enquiry.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (enquiryCountByMonth[monthKey] !== undefined) {
                enquiryCountByMonth[monthKey]++;
            }
        });

        // Format enquiry summary data
        const salesSummary = monthNames.map((monthName, index) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - index));
            date.setDate(1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return {
                date: date.toISOString(),
                totalValue: Math.floor(enquiryCountByMonth[monthKey] || 0),
                changePercentage: 0, // Can calculate if needed
            };
        });

        // Get conversion data (applications where registered === true) for past 6 months
        const registeredApplications = await prisma.application.findMany({
            where: {
                registered: true,
                createdAt: {
                    gte: sixMonthsAgo,
                },
            },
            select: {
                createdAt: true,
            },
        });

        // Group conversions by month
        const conversionCountByMonth: { [key: string]: number } = {};
        const conversionMonthNames: string[] = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            conversionMonthNames.push(monthName);
            conversionCountByMonth[monthKey] = 0;
        }

        registeredApplications.forEach((app) => {
            const date = new Date(app.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (conversionCountByMonth[monthKey] !== undefined) {
                conversionCountByMonth[monthKey]++;
            }
        });

        // Format conversion summary data
        const purchaseSummary = conversionMonthNames.map((monthName, index) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - index));
            date.setDate(1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const count = Math.floor(conversionCountByMonth[monthKey] || 0);
            return {
                date: date.toISOString(),
                totalPurchased: count,
                changePercentage: 0, // Can calculate if needed
            };
        });

        // Get application status distribution
        const applications = await prisma.application.findMany({
            include: {
                applicationStatus: {
                    select: {
                        status: true,
                    },
                },
            },
        });

        // Count applications by status
        const statusCounts: { [key: string]: number } = {};
        applications.forEach((app) => {
            const status = app.applicationStatus?.status || 'No Status';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        // Format application status data for expense summary
        const expenseByCategorySummary = Object.entries(statusCounts).map(([status, count]) => ({
            category: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            amount: count.toString(),
            date: new Date().toISOString(),
        }));

        // Keep popularProducts for bottom graphs (as requested)
        const popularProducts = await prisma.product.findMany({
            take: 15,
            orderBy: {
                stockQuantity: 'desc',
            }
        });

        // Keep expenseSummary structure but with empty data (for bottom graphs)
        const expenseSummary: any[] = [];

        res.json({
            popularProducts,
            salesSummary,
            purchaseSummary,
            expenseSummary,
            expenseByCategorySummary,
        });

    } catch (error: any) {
        console.error('Error retrieving dashboard-metrics:', error);
        res.status(500).json({ message: 'Error retrieving dashboard-metrics', error: error.message });
    }
}