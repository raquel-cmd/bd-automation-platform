import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSkimlinksCSV } from '../utils/csvParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data file path
const DATA_FILE = path.join(__dirname, '../../data/skimlinks-merchants.json');

/**
 * Load Skimlinks data from JSON file
 */
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error loading Skimlinks data:', error);
  }
  return {};
}

/**
 * Save Skimlinks data to JSON file
 */
function saveData(data) {
  try {
    // Ensure directory exists
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving Skimlinks data:', error);
    throw error;
  }
}

/**
 * Upload Skimlinks CSV
 * POST /api/skimlinks/upload
 */
export const uploadCSV = async (req, res) => {
  try {
    const { csvContent, month } = req.body;

    if (!csvContent) {
      return res.status(400).json({ error: 'CSV content is required' });
    }

    if (!month) {
      return res.status(400).json({ error: 'Month (YYYY-MM) is required' });
    }

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    // Parse CSV
    const merchants = parseSkimlinksCSV(csvContent);

    if (merchants.length === 0) {
      return res.status(400).json({ error: 'No merchant data found in CSV' });
    }

    // Load existing data
    const data = loadData();

    // Store merchants for this month
    data[month] = {
      uploadedAt: new Date().toISOString(),
      merchants,
    };

    // Save to file
    saveData(data);

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
};

/**
 * Get merchants for a specific month
 * GET /api/skimlinks/merchants?month=YYYY-MM
 */
export const getMerchants = async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({ error: 'Month (YYYY-MM) query parameter is required' });
    }

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    // Load data
    const data = loadData();

    // Get merchants for this month
    const monthData = data[month];

    if (!monthData) {
      return res.json({
        month,
        merchants: [],
        message: 'No data available for this month',
      });
    }

    // Sort by revenue (descending)
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
};

/**
 * Get list of available months
 * GET /api/skimlinks/months
 */
export const getAvailableMonths = async (req, res) => {
  try {
    const data = loadData();
    const months = Object.keys(data).sort().reverse(); // Most recent first

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
};
