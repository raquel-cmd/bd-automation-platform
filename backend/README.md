# BD Automation Platform - Backend API

Express.js REST API for the BestReviews BD Automation Platform.

## Features

- ✅ JWT Authentication
- ✅ Dashboard endpoints with pacing calculations
- ✅ Brands and transactions management
- ✅ Insights and analytics
- ✅ CORS configured for Vercel frontend
- ✅ Production-ready for Render/Railway deployment

## Installation

```bash
cd backend
npm install
```

## Environment Variables

Create a `.env` file:

```env
PORT=5002
NODE_ENV=production
JWT_SECRET=your-secret-key-change-in-production
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## Development

```bash
npm run dev
```

Server runs on `http://localhost:5002`

## Production

```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (username: admin, password: password)
- `GET /api/auth/verify` - Verify token

### Dashboard
- `GET /api/dashboard/overview` - Get overview with platform data
- `GET /api/dashboard/platform-performance` - Get platform performance
- `GET /api/dashboard/brands/:platform` - Get brands by platform

### Brands
- `GET /api/brands` - Get all brands (optional: ?platform=Skimlinks)
- `GET /api/brands/:id` - Get brand by ID

### Transactions
- `GET /api/transactions` - Get all transactions (supports filtering)
- `GET /api/transactions/:id` - Get transaction by ID

### Insights
- `GET /api/insights/trends` - Get revenue trends
- `GET /api/insights/top-brands` - Get top brands
- `GET /api/insights/top-products` - Get top products
- `GET /api/insights/overview` - Get insights overview

### Health Check
- `GET /health` - Server health status

## Authentication

All endpoints except `/api/auth/login` and `/health` require authentication.

Include the token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## Deployment to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables in Render dashboard
5. Deploy!

## Deployment to Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Set root directory to `backend`
4. Add environment variables
5. Deploy!

## Data Structure

The API uses mock data defined in `/src/data/mockData.js`:
- 26 brands across 4 platforms
- Sample transactions with revenue, GMV, and quantity
- Platform targets for pacing calculations
- Top products and revenue trends

## CORS Configuration

The API accepts requests from:
- Development: `http://localhost:3000`
- Production: Set via `FRONTEND_URL` environment variable

## License

© 2025 BestReviews. All rights reserved.
