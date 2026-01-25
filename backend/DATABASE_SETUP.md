# Database Setup Guide

## PostgreSQL Database Setup

This backend uses PostgreSQL to store revenue data and upload history.

### Local Development Setup

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS
   brew install postgresql@15
   brew services start postgresql@15

   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib

   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database**:
   ```bash
   # Connect to PostgreSQL
   psql postgres

   # Create database
   CREATE DATABASE bd_automation;

   # Create user (optional)
   CREATE USER bd_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE bd_automation TO bd_user;
   ```

3. **Configure Environment Variables**:
   ```bash
   # Copy .env.example to .env
   cp .env.example .env

   # Edit .env and set DATABASE_URL
   DATABASE_URL=postgresql://bd_user:your_password@localhost:5432/bd_automation
   ```

4. **Start the Backend**:
   ```bash
   npm run dev
   ```

   The database tables will be created automatically on first run.

### Production Setup (Vercel/Railway/Render)

1. **Create a PostgreSQL database** on your hosting provider:
   - **Railway**: Add PostgreSQL plugin
   - **Render**: Create new PostgreSQL database
   - **Supabase**: Create new project
   - **Neon**: Create new database

2. **Get the connection string** (DATABASE_URL) from your provider

3. **Set environment variable**:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
   ```

4. **Deploy backend** - tables will be created automatically

## Database Schema

### `revenue_data` Table
Stores all uploaded revenue data from CSV files.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| platform | VARCHAR(100) | Platform name (Levanta, Skimlinks, etc.) |
| date | DATE | Transaction date |
| brand | VARCHAR(255) | Brand name |
| revenue | DECIMAL(12,2) | Revenue amount |
| gmv | DECIMAL(12,2) | Gross Merchandise Value |
| transactions | INTEGER | Number of transactions |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Unique Constraint**: (platform, date, brand)

### `upload_history` Table
Tracks all CSV file uploads.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| filename | VARCHAR(255) | Original filename |
| platform | VARCHAR(100) | Platform name |
| upload_date | TIMESTAMP | Upload timestamp |
| status | VARCHAR(50) | success/error/processing |
| records_processed | INTEGER | Number of records imported |
| uploaded_by | VARCHAR(100) | Username (default: 'admin') |
| error_message | TEXT | Error details (if failed) |

## CSV File Format

Upload CSV files must have the following columns:

- **Date**: YYYY-MM-DD format
- **Brand**: Brand name
- **Revenue**: Numeric value (currency symbols will be stripped)
- **GMV**: Numeric value (currency symbols will be stripped)
- **Transactions**: Integer value

Example:
```csv
Date,Brand,Revenue,GMV,Transactions
2025-01-15,Nike,$1250.50,$5000.00,42
2025-01-15,Adidas,$980.25,$3500.00,28
```

## API Endpoints

### Upload CSV
```
POST /api/admin/upload
Content-Type: multipart/form-data

Body:
- file: CSV file
- platform: Platform name (e.g., "Levanta")

Response:
{
  "success": true,
  "message": "Successfully uploaded filename.csv - 47 records processed",
  "recordsProcessed": 47,
  "uploadId": 1
}
```

### Get Upload History
```
GET /api/admin/history

Response:
{
  "success": true,
  "history": [
    {
      "id": 1,
      "filename": "levanta_jan_2025.csv",
      "platform": "Levanta",
      "upload_date": "2025-01-25T16:00:00Z",
      "status": "success",
      "records_processed": 47,
      "uploaded_by": "admin"
    }
  ]
}
```

## Troubleshooting

### Connection Errors
- Verify DATABASE_URL is correct
- Check PostgreSQL is running: `pg_isready`
- Test connection: `psql $DATABASE_URL`

### Upload Errors
- Check CSV file format matches requirements
- Verify all required columns are present
- Check server logs for detailed error messages

### Permission Errors
- Ensure database user has CREATE and INSERT permissions
- Grant permissions: `GRANT ALL PRIVILEGES ON DATABASE bd_automation TO bd_user;`
