import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'https://bd-automation-platform.vercel.app',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'BD Automation Platform API is running' });
});

// Demo users for authentication
const demoUsers = [
  {
    username: 'admin',
    password: 'password',
    name: 'Admin User',
    role: 'admin'
  },
  {
    username: 'demo',
    password: 'demo',
    name: 'Demo User',
    role: 'user'
  },
  {
    username: 'viewer',
    password: 'viewer',
    name: 'Viewer User',
    role: 'viewer'
  }
];

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Find user in demo users
  const user = demoUsers.find(
    u => u.username === username && u.password === password
  );

  if (user) {
    res.json({
      success: true,
      user: {
        username: user.username,
        name: user.name,
        role: user.role
      },
      token: 'demo-token-' + Date.now()
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }
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
