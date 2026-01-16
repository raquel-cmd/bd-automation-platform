import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Skimlinks data storage
const SKIMLINKS_DATA_FILE = path.join(__dirname, 'data', 'skimlinks-merchants.json');

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

// Skimlinks helper functions
function loadSkimlinksData() {
  try {
    if (fs.existsSync(SKIMLINKS_DATA_FILE)) {
      const content = fs.readFileSync(SKIMLINKS_DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error loading Skimlinks data:', error);
  }
  return {};
}

function saveSkimlinksData(data) {
  try {
    const dir = path.dirname(SKIMLINKS_DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SKIMLINKS_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving Skimlinks data:', error);
    throw error;
  }
}

function parseSkimlinksCSV(csvContent) {
  const lines = csvContent.split('\n');
  const merchants = [];
  let headerFound = false;
  let headerIndex = -1;

  // Find header line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('Merchant,Clicks,Sales') || line.startsWith('Merchant, Clicks, Sales')) {
      headerFound = true;
      headerIndex = i;
      break;
    }
  }

  if (!headerFound) {
    throw new Error('Invalid CSV format: Could not find header line');
  }

  // Parse data rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split(',').map(col => col.trim().replace(/^"(.*)"$/, '$1'));
    if (columns.length < 7) continue;

    const merchant = columns[0];
    if (!merchant || merchant.toLowerCase().includes('total')) continue;

    try {
      merchants.push({
        merchant,
        clicks: parseInt(columns[1].replace(/,/g, '')) || 0,
        sales: parseInt(columns[2].replace(/,/g, '')) || 0,
        conversionRate: parseFloat(columns[3].replace('%', '').trim()) || 0,
        gmv: parseFloat(columns[4].replace(/[$,]/g, '').trim()) || 0,
        revenue: parseFloat(columns[5].replace(/[$,]/g, '').trim()) || 0,
        epc: parseFloat(columns[6].replace(/[$,]/g, '').trim()) || 0,
      });
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
    }
  }

  return merchants;
}

// Skimlinks endpoints
app.post('/api/skimlinks/upload', (req, res) => {
  try {
    const { csvContent, month } = req.body;

    if (!csvContent) {
      return res.status(400).json({ error: 'CSV content is required' });
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Valid month (YYYY-MM) is required' });
    }

    const merchants = parseSkimlinksCSV(csvContent);

    if (merchants.length === 0) {
      return res.status(400).json({ error: 'No merchant data found in CSV' });
    }

    const data = loadSkimlinksData();
    data[month] = {
      uploadedAt: new Date().toISOString(),
      merchants,
    };
    saveSkimlinksData(data);

    res.json({
      success: true,
      message: `Successfully uploaded ${merchants.length} merchants for ${month}`,
      count: merchants.length,
      month,
    });
  } catch (error) {
    console.error('Error uploading Skimlinks CSV:', error);
    res.status(500).json({
      error: 'Failed to upload CSV',
      message: error.message,
    });
  }
});

app.get('/api/skimlinks/merchants', (req, res) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Valid month (YYYY-MM) query parameter is required' });
    }

    const data = loadSkimlinksData();
    const monthData = data[month];

    if (!monthData) {
      return res.json({
        month,
        merchants: [],
        message: 'No data available for this month',
      });
    }

    const merchants = [...monthData.merchants].sort((a, b) => b.revenue - a.revenue);

    res.json({
      month,
      uploadedAt: monthData.uploadedAt,
      merchants,
    });
  } catch (error) {
    console.error('Error getting Skimlinks merchants:', error);
    res.status(500).json({
      error: 'Failed to retrieve merchants',
      message: error.message,
    });
  }
});

app.get('/api/skimlinks/months', (req, res) => {
  try {
    const data = loadSkimlinksData();
    const months = Object.keys(data).sort().reverse();

    res.json({
      months: months.map(month => ({
        month,
        uploadedAt: data[month].uploadedAt,
        merchantCount: data[month].merchants.length,
      })),
    });
  } catch (error) {
    console.error('Error getting available months:', error);
    res.status(500).json({
      error: 'Failed to retrieve available months',
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
