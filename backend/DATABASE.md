# Database Documentation

## Overview

This project uses **Prisma ORM** with **SQLite** for local development. The database can be upgraded to PostgreSQL for production.

## Setup

### Initial Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. The database is automatically created during migrations. If you need to reset:
   ```bash
   npm run db:migrate
   ```

3. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

### Database Management Commands

```bash
# Run migrations
npm run db:migrate

# Generate Prisma Client
npm run db:generate

# Open Prisma Studio (GUI for database)
npm run db:studio
```

## Schema

### Platform Metrics (`platform_metrics`)

Stores brand-level metrics from CSV uploads.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| platformKey | String | Platform identifier (e.g., "Creator Connections") |
| date | String | ISO date string (YYYY-MM-DD) |
| brand | String | Brand name |
| weeklyRevenue | Float | Weekly revenue |
| mtdRevenue | Float | Month-to-date revenue |
| mtdGmv | Float | Month-to-date GMV |
| targetGmv | Float | Target GMV |
| totalContractRevenue | Float? | Optional total contract revenue |
| createdAt | DateTime | Record creation time |
| updatedAt | DateTime | Last update time |

**Unique Constraint:** `(platformKey, date, brand)`

### Flat Fee Contracts (`flat_fee_contracts`)

Stores annual flat fee contract information.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| partnerName | String | Partner/platform name |
| contractStart | String | Contract start date (ISO) |
| contractEnd | String | Contract end date (ISO) |
| totalContractRevenue | Float | Total contract value |
| createdAt | DateTime | Record creation time |
| updatedAt | DateTime | Last update time |

### Flat Fee Allocations (`flat_fee_allocations`)

Stores weekly revenue allocations for flat fee contracts.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| contractId | Int | Foreign key to contract |
| partnerName | String | Partner name |
| weekStart | String | Week start date (Thursday, ISO) |
| weekEnd | String | Week end date (Wednesday, ISO) |
| weeklyRevenue | Float | Allocated weekly revenue |
| platformKey | String | Always "flat-fee" |
| createdAt | DateTime | Record creation time |

**Unique Constraint:** `(partnerName, weekStart, weekEnd)`

**Relationship:** Each allocation belongs to a contract (cascade delete)

## API Usage

### Upload Platform Data

```javascript
POST /api/upload-platform-data
Content-Type: application/json

{
  "platformKey": "creator-connections",
  "rows": [
    {
      "date": "2025-01-15",
      "brand": "Samsung",
      "weeklyRevenue": 18000,
      "mtdRevenue": 78000,
      "mtdGmv": 1950000,
      "targetGmv": 75000,
      "totalContractRevenue": 187500
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "inserted": 5,
  "updated": 2,
  "platformKey": "creator-connections",
  "totalProcessed": 7
}
```

### Upload Flat Fees

```javascript
POST /api/upload-flat-fees
Content-Type: application/json

{
  "rows": [
    {
      "partnerName": "Dyson",
      "contractStart": "2025-01-01",
      "contractEnd": "2025-12-31",
      "totalContractRevenue": 420000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "inserted": 1,
  "updated": 0,
  "weeksGenerated": 52,
  "contractsProcessed": 1
}
```

## Querying Data

### Using Prisma Client

```javascript
import prisma from './src/db/client.js';

// Get all metrics for a platform
const metrics = await prisma.platformMetric.findMany({
  where: { platformKey: 'Creator Connections' },
  orderBy: { date: 'desc' }
});

// Get flat fee allocations for a week
const allocations = await prisma.flatFeeAllocation.findMany({
  where: {
    weekStart: '2025-01-16',
    weekEnd: '2025-01-22'
  },
  include: { contract: true }
});

// Get total revenue for a date range
const totalRevenue = await prisma.platformMetric.aggregate({
  where: {
    date: { gte: '2025-01-01', lte: '2025-01-31' }
  },
  _sum: { mtdRevenue: true }
});
```

## Migration to PostgreSQL

To use PostgreSQL in production:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```

2. Update `prisma.config.ts`:
   ```typescript
   datasource: {
     url: process.env["DATABASE_URL"],
   }
   ```

3. Set `DATABASE_URL` environment variable:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
   ```

4. Run migration:
   ```bash
   npm run db:migrate
   ```

## Finance Week Logic

Finance weeks run **Thursday to Wednesday**:
- Week starts on Thursday
- Week ends on Wednesday (6 days later)
- Used for weekly revenue allocations

Example:
- Week 1: Jan 16 (Thu) - Jan 22 (Wed)
- Week 2: Jan 23 (Thu) - Jan 29 (Wed)

This logic is implemented in `generateFinanceWeeks()` function in `src/routes/upload.js`.
