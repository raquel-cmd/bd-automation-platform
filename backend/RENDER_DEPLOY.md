# Render Deployment Guide

## Prerequisites
- GitHub account connected to Render
- Render account (https://render.com)
- PostgreSQL database

## Step 1: Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com/
2. Click **"New +"** button
3. Select **"PostgreSQL"**
4. Fill in:
   - **Name**: `bd-automation-db`
   - **Database**: `bdautomation`
   - **User**: `bdautomation`
   - **Region**: Matching your service region (Frankfurt recommended for EU)
   - **Version**: Latest
5. Click **"Create Database"**
6. **Wait 2-3 minutes** for database to initialize
7. Copy the **"Internal Database URL"** (not the external one)

## Step 2: Update Backend Environment Variables

1. Go to https://dashboard.render.com/web/srv-d5r86i15pdvs739jqim0/env
2. Click **"Edit"**
3. Update `DATABASE_URL` with the PostgreSQL URL from Step 1:
   ```
   postgresql://bdautomation:[password]@[host]:[port]/bdautomation
   ```
4. Ensure these variables are set:
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://bd-automation-platform.vercel.app`
   - `JWT_SECRET=[your-secret-key]`
5. Click **"Save"**

## Step 3: Deploy Backend with Migrations

1. Go to https://dashboard.render.com/web/srv-d5r86i15pdvs739jqim0
2. Click **"Manual Deploy"** dropdown
3. Select **"Deploy latest commit"**
4. Wait for deployment to complete
5. Check logs for: `Prisma migrations running...`
6. Verify: `Your service is live`

## Step 4: Run Prisma Migrations

Once backend is deployed:

```bash
# Via Render Shell (if available)
cd /opt/render/project/src/backend
npx prisma migrate deploy

# Via local terminal (if you have psql)
psql [DATABASE_URL] < prisma/migrations/init.sql
```

## Step 5: Upload Real Data (CSV)

Once database is ready:

1. Go to https://bd-automation-platform.vercel.app/admin
2. Login (admin / password)
3. Select "Skimlinks" platform
4. Upload your CSV file
5. Click "Upload"
6. Verify data in dashboard

## Step 6: Update Vercel Frontend

1. Go to https://vercel.com/raquel-cmds-projects/bd-automation-platform/settings/environment-variables
2. Update `VITE_API_URL`:
   ```
   https://bd-automation-platform-1.onrender.com
   ```
3. Redeploy frontend

## Troubleshooting

### Database Connection Error
- Verify DATABASE_URL format is correct
- Check Render database is in "available" state
- Try redeploying backend service

### Prisma Migration Error
- Ensure NODE_ENV=production
- Check database user has CREATE TABLE permissions
- Review Render logs for specific error

### API Returns 403 Unauthorized
- Check CORS is enabled for Vercel domain
- Verify JWT_SECRET matches frontend
- Clear browser cache and cookies

## Database Schema

The following tables are created by Prisma migrations:

```sql
CREATE TABLE platform_metrics (
  id SERIAL PRIMARY KEY,
  platformKey VARCHAR(255) NOT NULL,
  date VARCHAR(10) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  weeklyRevenue DECIMAL(12,2),
  mtdRevenue DECIMAL(12,2),
  mtdGmv DECIMAL(12,2),
  targetGmv DECIMAL(12,2),
  totalContractRevenue DECIMAL(12,2),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(platformKey, date, brand)
);
```

## Success Indicators

✅ Backend deployed and running  
✅ Database migrations complete  
✅ CSV data uploaded successfully  
✅ Dashboard shows real data from database  
✅ No "mock data" references in UI  
✅ API endpoints return production data  

## Next Steps

1. Monitor Render logs for any errors
2. Test all dashboard pages with real data
3. Upload additional CSV files for other platforms
4. Set up automated backups (Render -> PostgreSQL -> S3)
5. Configure alerts for database usage
