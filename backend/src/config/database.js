import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test connection
pool.on('connect', () => {
    console.log('✓ Database connected successfully');
});

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    process.exit(-1);
});

// Initialize database tables
export async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // Create revenue_data table
        await client.query(`
      CREATE TABLE IF NOT EXISTS revenue_data (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        brand VARCHAR(255) NOT NULL,
        revenue DECIMAL(12, 2) NOT NULL,
        gmv DECIMAL(12, 2) NOT NULL,
        transactions INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(platform, date, brand)
      );
    `);

        // Create upload_history table
        await client.query(`
      CREATE TABLE IF NOT EXISTS upload_history (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        platform VARCHAR(100) NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) NOT NULL,
        records_processed INTEGER DEFAULT 0,
        uploaded_by VARCHAR(100) DEFAULT 'admin',
        error_message TEXT
      );
    `);

        // Create indexes for better query performance
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_revenue_platform ON revenue_data(platform);
      CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_data(date);
      CREATE INDEX IF NOT EXISTS idx_revenue_brand ON revenue_data(brand);
      CREATE INDEX IF NOT EXISTS idx_revenue_platform_date ON revenue_data(platform, date);
    `);

        console.log('✓ Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        client.release();
    }
}

export default pool;
