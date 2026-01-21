# BD Automation Platform - BestReviews

A complete React-based dashboard for tracking revenue across multiple channels for BestReviews e-commerce publishing.

## Business Context

BestReviews tracks revenue across 4 channels:
- **Creator Connections (CC)** - Amazon influencer: ~$2.7M/year
- **Skimlinks** - Non-Amazon affiliate: ~$285K/year
- **Flat Fee** - Sponsored content: ~$593K/year
- **Other Attribution** - Misc partners: ~$96K/year

## Key Features

### Enhanced Dashboard (TABLE Format)
- Platform performance table with expandable rows
- Brands grouped BY PLATFORM
- Shows BOTH GMV (retail sales) AND Revenue (commission)
- Proper pacing calculations using straight-line formula
- Week-based tracking (Thursday to Wednesday finance cycle)

### Pacing Formula
```
(MTD Revenue ÷ Days Accounted) × Days in Month ÷ Target × 100
```

### Other Pages
- **Login** - Secure authentication (Demo: admin/password)
- **Insights** - Revenue trends, top brands, and top products
- **Admin** - CSV upload for data import
- **Proposals** - Manage brand partnership proposals

## Tech Stack

- React 18 with hooks
- React Router v6
- Tailwind CSS
- lucide-react icons
- Vite (build tool)
- Backend API: http://localhost:5002 (proxy configured)

## Installation

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build

Create a production build:

```bash
npm run build
```

## Project Structure

```
bd-automation-platform/
├── src/
│   ├── components/
│   │   ├── Layout.jsx           # Main layout with navigation
│   │   └── PrivateRoute.jsx     # Route protection
│   ├── context/
│   │   └── AuthContext.jsx      # Authentication context
│   ├── pages/
│   │   ├── Dashboard.jsx        # Enhanced Dashboard (TABLE format)
│   │   ├── Insights.jsx         # Analytics and trends
│   │   ├── Admin.jsx            # CSV upload
│   │   ├── Proposals.jsx        # Proposal management
│   │   └── Login.jsx            # Authentication
│   ├── utils/
│   │   ├── api.js               # API utility functions
│   │   └── dateUtils.js         # Date/pacing calculations
│   ├── App.jsx                  # Main app with routing
│   ├── main.jsx                 # Entry point
│   └── index.css                # Tailwind styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Critical Requirements Implementation

✅ **Weeks are Thursday to Wednesday** - Implemented in `dateUtils.js`
✅ **Dashboard is a TABLE, not cards** - See `Dashboard.jsx`
✅ **Pacing uses straight-line formula** - Implemented in `calculatePacing()`
✅ **Brands grouped BY PLATFORM** - Expandable rows in dashboard table
✅ **Show BOTH GMV and Revenue** - Both columns visible in table

## Demo Credentials

- Username: `admin`
- Password: `password`

## API Integration

The app is configured to connect to a backend API at `http://localhost:5002`. API calls are proxied through Vite's dev server.

Current implementation uses mock data for demonstration. To connect to a real backend:

1. Ensure the backend API is running at `http://localhost:5002`
2. Update the API calls in `src/utils/api.js` to use real endpoints
3. Remove mock data from component files

## Finance Cycle

The platform follows a Thursday-to-Wednesday finance week cycle. All date calculations in `dateUtils.js` are configured accordingly.

## License

© 2025 BestReviews. All rights reserved.

## Latest Updates

- ✅ Dashboard UI improvements deployed (Jan 21, 2026)
  - MTD Revenue now shows '% of goal' instead of pacing %
  - Weekly Revenue table reorganized with reversed week order
  - Platform Performance table columns reordered
  - New Flat Fee Performance section added
  - CSV upload functionality for data management

**Status**: Dashboard enhancements are now live in production
