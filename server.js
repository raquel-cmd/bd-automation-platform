const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'BD Automation Platform API is running' });
});

// API endpoints
app.get('/api/dashboard', (req, res) => {
  // Mock data for now
  res.json({
    summary: {
      totalRevenue: 8125,
      totalTransactions: 237,
      totalBrands: 79,
      averageCommission: 34.28
    },
    recentTransactions: []
  });
});

app.get('/api/transactions', (req, res) => {
  res.json({ transactions: [] });
});

app.get('/api/brands', (req, res) => {
  res.json({ brands: [] });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
