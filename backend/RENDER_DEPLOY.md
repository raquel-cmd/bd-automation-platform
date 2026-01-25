# Render Deployment Instructions

## Quick Deploy

### 1. Create Render Account
Go to https://render.com and sign up with GitHub

### 2. Create PostgreSQL Database

1. Click **New** → **PostgreSQL**
2. Name: `bd-automation-db`
3. Database: `bd_automation`
4. User: `bd_user`
5. Region: Choose closest to you
6. Instance Type: **Free**
7. Click **Create Database**
8. **Copy the Internal Database URL** (starts with `postgresql://`)

### 3. Deploy Backend

1. Click **New** → **Web Service**
2. Connect your GitHub repository: `raquel-cmd/bd-automation-platform`
3. Configure:
   - **Name**: `bd-automation-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=5002
   JWT_SECRET=your-secret-key-change-in-production-12345
   FRONTEND_URL=https://bd-automation-platform.vercel.app
   DATABASE_URL=<paste-internal-database-url-from-step-2>
   ```

5. Click **Create Web Service**

### 4. Wait for Deployment

- Render will build and deploy your backend
- Watch the logs for "✓ Database connected successfully"
- Once deployed, you'll get a URL like: `https://bd-automation-backend.onrender.com`

### 5. Test Backend

```bash
curl https://your-backend-url.onrender.com/health
```

Expected response:
```json
{"status":"ok","timestamp":"...","uptime":...}
```

### 6. Update Vercel Frontend

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
3. Go to Deployments → Click ⋯ on latest → Redeploy

### 7. Test Upload

1. Go to https://bd-automation-platform.vercel.app/admin
2. Upload a CSV file
3. Verify it shows the correct record count

## Troubleshooting

### Database Connection Errors
- Verify DATABASE_URL is the **Internal** URL from Render PostgreSQL
- Check database is in the same region as web service
- Look for connection errors in Render logs

### Build Failures
- Check `package.json` has all dependencies
- Verify `npm start` command works locally
- Check Render build logs for specific errors

### CORS Errors
- Verify FRONTEND_URL matches your Vercel domain exactly
- Check backend logs for CORS-related messages

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| NODE_ENV | Environment mode | `production` |
| PORT | Server port | `5002` |
| JWT_SECRET | Secret for JWT tokens | Random string |
| FRONTEND_URL | Vercel frontend URL | `https://your-app.vercel.app` |

## Monitoring

- **Logs**: Render Dashboard → Your Service → Logs
- **Metrics**: Render Dashboard → Your Service → Metrics
- **Database**: Render Dashboard → Your Database → Metrics

## Free Tier Limits

- **Web Service**: 750 hours/month (enough for 24/7)
- **PostgreSQL**: 90 days free, then $7/month
- **Bandwidth**: 100 GB/month
- **Build Minutes**: 500 minutes/month
