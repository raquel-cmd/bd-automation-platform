# Deployment Guide

## Vercel Deployment

This project can be deployed to Vercel in two ways:

### Option 1: Automatic Deployment via GitHub Actions (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys to Vercel when you push to the `main` or feature branches.

#### Setup Steps:

1. **Get your Vercel credentials:**
   ```bash
   # Install Vercel CLI locally
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Link your project (run from project root)
   vercel link
   ```

2. **Get required values:**
   - Run `cat .vercel/project.json` to get your `projectId`
   - Run `vercel --token` or go to https://vercel.com/account/tokens to create a token
   - Your Org ID is in the `.vercel/project.json` file as `orgId`

3. **Add GitHub Secrets:**
   Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

   Add these three secrets:
   - `VERCEL_TOKEN`: Your Vercel authentication token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

4. **Push your code:**
   ```bash
   git push origin claude/add-weekly-revenue-table-hh6Za
   ```

   The GitHub Action will automatically build and deploy to Vercel!

### Option 2: Manual Deployment via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository: `raquel-cmd/bd-automation-platform`
4. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add environment variable:
   - `VITE_API_URL`: Your backend API URL (e.g., your Railway deployment URL)
6. Click "Deploy"

### Option 3: Command Line Deployment

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Backend Deployment (Railway/Render)

Your backend should be deployed separately. The backend is in the `/backend` directory.

### Environment Variables Required:

For the backend, set:
- `DATABASE_URL`: Your database connection string
- `PORT`: The port to run on (default: 5002)
- `NODE_ENV`: Set to `production`

For the frontend, set:
- `VITE_API_URL`: Your deployed backend URL (e.g., `https://your-backend.railway.app`)

## Current Status

✅ All database integration complete
✅ Mock data replaced with real Prisma queries
✅ Production build created (`npm run build`)
✅ Code committed and pushed to GitHub
⏳ Awaiting Vercel deployment configuration

## What's New in This Deployment

This deployment includes:
- Real database integration with Prisma ORM
- SQLite database (upgradeable to PostgreSQL)
- CSV upload functionality with data persistence
- Dashboard displaying real data from database
- Weekly revenue tracking with finance week logic (Thursday-Wednesday)
- Platform performance metrics with pacing calculations
- Flat fee contract management with automatic weekly allocations
