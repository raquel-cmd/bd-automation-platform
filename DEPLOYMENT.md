# Deployment Guide

Complete deployment guide for both frontend and backend of the BD Automation Platform.

## Frontend Deployment (Vercel)

### Quick Deploy

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy from root directory:**
   ```bash
   vercel --prod
   ```

3. **Your app will be live at:** `https://your-app.vercel.app`

### Environment Variables (Vercel)

No environment variables needed for frontend - API proxy is configured in `vite.config.js`

### Configuration Files

- ✅ `vercel.json` - Handles client-side routing
- ✅ `vite.config.js` - API proxy configuration

---

## Backend Deployment

### Option 1: Deploy to Render (Recommended)

1. **Sign up at:** https://render.com

2. **Create New Web Service:**
   - Connect your GitHub repository
   - Select the `bd-automation-platform` repository
   - **Root Directory:** `backend`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

3. **Add Environment Variables in Render Dashboard:**
   ```
   NODE_ENV=production
   PORT=5002
   JWT_SECRET=your-secure-random-secret-key-here
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

4. **Generate JWT Secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Deploy!**

6. **Copy your Render API URL** (e.g., `https://bd-automation-api.onrender.com`)

---

### Option 2: Deploy to Railway

1. **Sign up at:** https://railway.app

2. **Create New Project:**
   - Connect GitHub repository
   - Select `bd-automation-platform`

3. **Configure Service:**
   - **Root Directory:** `backend`
   - Railway will auto-detect Node.js

4. **Add Environment Variables:**
   ```
   NODE_ENV=production
   JWT_SECRET=your-secure-random-secret-key-here
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

5. **Deploy!**

6. **Copy your Railway API URL**

---

## Connecting Frontend to Backend

After deploying the backend, update the frontend to use the production API:

### Option 1: Update vite.config.js (for development)

Keep the proxy for local development, but the frontend will use the production API when deployed.

### Option 2: Update API base URL

Edit `/src/utils/api.js`:

```javascript
const API_BASE_URL = import.meta.env.PROD
  ? 'https://your-backend-api.onrender.com/api'
  : '/api';
```

Then redeploy to Vercel:
```bash
vercel --prod
```

---

## Testing the Deployment

### 1. Test Backend API

```bash
# Health check
curl https://your-backend-api.onrender.com/health

# Login test
curl -X POST https://your-backend-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### 2. Test Frontend

1. Visit `https://your-vercel-app.vercel.app`
2. Login with: `admin` / `password`
3. Check dashboard loads with data
4. Navigate to Insights, Admin, and Proposals

---

## Environment Variables Reference

### Backend (.env)

```env
# Server Configuration
PORT=5002
NODE_ENV=production

# Security
JWT_SECRET=your-secure-random-secret-key-change-this

# CORS
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Frontend

No environment variables needed - configuration is in `vite.config.js` and `vercel.json`

---

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Check `FRONTEND_URL` in backend environment variables matches your Vercel URL exactly
2. Ensure backend is deployed and running
3. Check browser console for the exact error

### 404 Errors on Frontend Routes

- ✅ `vercel.json` should handle this
- If not, redeploy to Vercel: `vercel --prod`

### API Not Responding

1. Check backend logs in Render/Railway dashboard
2. Test health endpoint: `curl https://your-api.com/health`
3. Verify environment variables are set correctly

### Authentication Failing

1. Check JWT_SECRET is set in backend environment
2. Verify login credentials: `admin` / `password`
3. Check browser console for error messages

---

## Production Checklist

- [ ] Backend deployed to Render or Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] CORS configured correctly
- [ ] Login tested successfully
- [ ] Dashboard loads with data
- [ ] All pages accessible
- [ ] API endpoints responding

---

## Cost Estimate

- **Vercel:** Free tier (unlimited bandwidth)
- **Render:** Free tier (spins down after inactivity) OR $7/month for always-on
- **Railway:** Free $5 credit/month OR $5/month for more resources

**Total:** $0-$12/month depending on usage

---

## Support

For deployment issues:
- Vercel: https://vercel.com/docs
- Render: https://render.com/docs
- Railway: https://docs.railway.app

## Security Notes

1. **Change default password** after first login
2. **Use strong JWT_SECRET** in production
3. **Enable HTTPS** (automatic on Vercel/Render/Railway)
4. **Keep dependencies updated:** `npm audit fix`

---

© 2025 BestReviews. All rights reserved.
