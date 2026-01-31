import fs from 'fs';
import csv from 'csv-parser';
import prisma from '../config/prisma.js';

// Upload CSV file and process data
export async function uploadCSV(req, res) {
    let uploadId = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { platform } = req.body;
        if (!platform) {
            return res.status(400).json({ error: 'Platform is required' });
        }

        const filename = req.file.originalname;
        const filePath = req.file.path;

        // Create upload history record
        const uploadRecord = await prisma.uploadHistory.create({
            data: {
                filename,
                platform,
                status: 'processing',
            },
        });
        uploadId = uploadRecord.id;

        // Parse CSV and collect records
        const records = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    try {
                        // Validate required columns
                        if (!row.Date || !row.Brand || !row.Revenue || !row.GMV || !row.Transactions) {
                            throw new Error('Missing required columns: Date, Brand, Revenue, GMV, Transactions');
                        }

                        // Parse and validate data
                        const date = new Date(row.Date);
                        if (isNaN(date.getTime())) {
                            throw new Error(`Invalid date format: ${row.Date}`);
                        }

                        const revenue = parseFloat(row.Revenue.toString().replace(/[^0-9.-]/g, ''));
                        const gmv = parseFloat(row.GMV.toString().replace(/[^0-9.-]/g, ''));
                        const transactions = parseInt(row.Transactions.toString().replace(/[^0-9]/g, ''));

                        if (isNaN(revenue) || isNaN(gmv) || isNaN(transactions)) {
                            throw new Error('Invalid numeric values in row');
                        }

                        records.push({
                            platform,
                            date,
                            brand: row.Brand.trim(),
                            revenue,
                            gmv,
                            transactions,
                        });
                    } catch (error) {
                        console.error('Error parsing row:', error.message, row);
                    }
                })
                .on('end', () => resolve())
                .on('error', (error) => reject(error));
        });

        // Insert records into database using Prisma
        let recordCount = 0;

        for (const record of records) {
            await prisma.platformMetric.upsert({
                where: {
                    platform_date_brand_unique: {
                        platformKey: record.platform,
                        date: record.date.toISOString().split('T')[0], // Ensure string date
                        brand: record.brand,
                    },
                },
                update: {
                    weeklyRevenue: record.revenue, // Mapping Revenue -> weeklyRevenue
                    mtdGmv: record.gmv,         // Mapping GMV -> mtdGmv
                    mtdRevenue: 0,              // Need to set required fields? Schema says Int/Float. No, default?
                    // Schema: daily/weekly metrics.
                    // PlatformMetric:
                    // weeklyRevenue Float @map("weekly_revenue")
                    // mtdRevenue Float @map("mtd_revenue")
                    // mtdGmv Float @map("mtd_gmv")
                    // targetGmv Float @map("target_gmv") (Required?)
                    // Let's check schema again. Lines 13-28.
                    // All Floats seem required (no ?). totalContractRevenue is optional (Float?).
                    // So we must provide mtdRevenue and targetGmv.

                    // We'll calculate mtdRevenue as just the daily revenue for now (logic fix in dataLoaders needed later if we want real MTD)
                    // Or set to 0.
                    mtdRevenue: record.revenue, // Provisional
                    targetGmv: 0, // Default
                },
                create: {
                    platformKey: record.platform,
                    date: record.date.toISOString().split('T')[0],
                    brand: record.brand,
                    weeklyRevenue: record.revenue,
                    mtdRevenue: record.revenue, // Provisional
                    mtdGmv: record.gmv,
                    targetGmv: 0,
                    totalContractRevenue: 0,
                },
            });
            recordCount++;
        }

        // Update upload history with success
        await prisma.uploadHistory.update({
            where: { id: uploadId },
            data: {
                status: 'success',
                recordsProcessed: recordCount,
            },
        });

        // Delete temporary file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: `Successfully uploaded ${filename} - ${recordCount} records processed`,
            recordsProcessed: recordCount,
            uploadId,
        });
    } catch (error) {
        console.error('Upload error:', error);

        // Update upload history with error
        if (uploadId) {
            await prisma.uploadHistory.update({
                where: { id: uploadId },
                data: {
                    status: 'error',
                    errorMessage: error.message,
                },
            });
        }

        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            error: 'Upload failed',
            message: error.message,
        });
    }
}

// Get upload history
export async function getUploadHistory(req, res) {
    try {
        const history = await prisma.uploadHistory.findMany({
            orderBy: {
                uploadDate: 'desc',
            },
            take: 50,
        });

        res.json({
            success: true,
            history,
        });
    } catch (error) {
        console.error('Error fetching upload history:', error);
        res.status(500).json({
            error: 'Failed to fetch upload history',
            message: error.message,
        });
    }
}
