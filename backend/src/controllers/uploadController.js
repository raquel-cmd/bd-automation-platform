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
            await prisma.revenueData.upsert({
                where: {
                    platform_date_brand: {
                        platform: record.platform,
                        date: record.date,
                        brand: record.brand,
                    },
                },
                update: {
                    revenue: record.revenue,
                    gmv: record.gmv,
                    transactions: record.transactions,
                },
                create: record,
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
