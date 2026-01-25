import fs from 'fs';
import csv from 'csv-parser';
import pool from '../config/database.js';

// Upload CSV file and process data
export async function uploadCSV(req, res) {
    const client = await pool.connect();
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
        const uploadResult = await client.query(
            `INSERT INTO upload_history (filename, platform, status) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
            [filename, platform, 'processing']
        );
        uploadId = uploadResult.rows[0].id;

        // Parse CSV and insert data
        const records = [];
        let recordCount = 0;
        let errorMessage = null;

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
                            date: date.toISOString().split('T')[0],
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

        // Insert records into database using transaction
        await client.query('BEGIN');

        try {
            for (const record of records) {
                await client.query(
                    `INSERT INTO revenue_data (platform, date, brand, revenue, gmv, transactions)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (platform, date, brand) 
           DO UPDATE SET 
             revenue = EXCLUDED.revenue,
             gmv = EXCLUDED.gmv,
             transactions = EXCLUDED.transactions,
             updated_at = CURRENT_TIMESTAMP`,
                    [record.platform, record.date, record.brand, record.revenue, record.gmv, record.transactions]
                );
                recordCount++;
            }

            await client.query('COMMIT');

            // Update upload history with success
            await client.query(
                `UPDATE upload_history 
         SET status = $1, records_processed = $2 
         WHERE id = $3`,
                ['success', recordCount, uploadId]
            );

            // Delete temporary file
            fs.unlinkSync(filePath);

            res.json({
                success: true,
                message: `Successfully uploaded ${filename} - ${recordCount} records processed`,
                recordsProcessed: recordCount,
                uploadId,
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Upload error:', error);

        // Update upload history with error
        if (uploadId) {
            await client.query(
                `UPDATE upload_history 
         SET status = $1, error_message = $2 
         WHERE id = $3`,
                ['error', error.message, uploadId]
            );
        }

        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            error: 'Upload failed',
            message: error.message,
        });
    } finally {
        client.release();
    }
}

// Get upload history
export async function getUploadHistory(req, res) {
    try {
        const result = await pool.query(
            `SELECT * FROM upload_history 
       ORDER BY upload_date DESC 
       LIMIT 50`
        );

        res.json({
            success: true,
            history: result.rows,
        });
    } catch (error) {
        console.error('Error fetching upload history:', error);
        res.status(500).json({
            error: 'Failed to fetch upload history',
            message: error.message,
        });
    }
}
