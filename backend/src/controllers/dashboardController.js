import pool from '../config/database.js';
import { calculatePacing, getDaysInMonth, getDaysAccounted } from '../utils/dateUtils.js';

// Platform targets (monthly) - TODO: Move to database table
const platformTargets = {
  'Creator Connections': 225000,
  'Levanta': 50000,
  'Perch': 40000,
  'PartnerBoost': 35000,
  'Archer': 30000,
  'Skimlinks': 285000,
  'Impact': 125000,
  'Howl': 45000,
  'BrandAds': 55000,
  'Other': 20000,
  'Flat Fee': 49417,
};

export const getOverview = async (req, res) => {
  try {
    // Get current month's data from database
    const result = await pool.query(`
      SELECT 
        platform,
        SUM(revenue) as mtd_revenue,
        SUM(gmv) as mtd_gmv,
        SUM(transactions) as total_transactions,
        COUNT(DISTINCT brand) as brand_count
      FROM revenue_data
      WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY platform
    `);

    // Get week revenue (last 7 days)
    const weekResult = await pool.query(`
      SELECT 
        platform,
        SUM(revenue) as week_revenue,
        SUM(gmv) as week_gmv
      FROM revenue_data
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY platform
    `);

    const weekData = {};
    weekResult.rows.forEach(row => {
      weekData[row.platform] = {
        weekRevenue: parseFloat(row.week_revenue) || 0,
        weekGMV: parseFloat(row.week_gmv) || 0,
      };
    });

    // Build platform data
    const platformData = result.rows.map(row => {
      const platform = row.platform;
      const mtdRevenue = parseFloat(row.mtd_revenue) || 0;
      const mtdGMV = parseFloat(row.mtd_gmv) || 0;
      const target = platformTargets[platform] || 0;
      const pacing = calculatePacing(mtdRevenue, target);
      const week = weekData[platform] || { weekRevenue: 0, weekGMV: 0 };

      return {
        name: platform,
        mtdRevenue,
        mtdGMV,
        target,
        pacing,
        weekRevenue: week.weekRevenue,
        weekGMV: week.weekGMV,
        transactions: parseInt(row.total_transactions) || 0,
        brands: parseInt(row.brand_count) || 0,
      };
    });

    // Calculate totals
    const totalRevenue = platformData.reduce((sum, p) => sum + p.mtdRevenue, 0);
    const totalTarget = Object.values(platformTargets).reduce((sum, t) => sum + t, 0);
    const totalGMV = platformData.reduce((sum, p) => sum + p.mtdGMV, 0);
    const totalTransactions = platformData.reduce((sum, p) => sum + p.transactions, 0);
    const totalBrands = platformData.reduce((sum, p) => sum + p.brands, 0);

    res.json({
      platforms: platformData,
      summary: {
        totalRevenue,
        totalTarget,
        totalGMV,
        totalTransactions,
        totalBrands,
        overallPacing: calculatePacing(totalRevenue, totalTarget),
        daysAccounted: getDaysAccounted(),
        daysInMonth: getDaysInMonth(),
      },
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

export const getPlatformPerformance = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        platform,
        SUM(revenue) as mtd_revenue,
        SUM(gmv) as mtd_gmv,
        SUM(transactions) as total_transactions,
        COUNT(DISTINCT brand) as brand_count
      FROM revenue_data
      WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY platform
    `);

    const platformPerformance = result.rows.map(row => {
      const platform = row.platform;
      const mtdRevenue = parseFloat(row.mtd_revenue) || 0;
      const mtdGMV = parseFloat(row.mtd_gmv) || 0;
      const target = platformTargets[platform] || 0;
      const pacing = calculatePacing(mtdRevenue, target);

      return {
        platform,
        mtdRevenue,
        mtdGMV,
        target,
        pacing,
        brands: parseInt(row.brand_count) || 0,
        transactions: parseInt(row.total_transactions) || 0,
      };
    });

    res.json(platformPerformance);
  } catch (error) {
    console.error('Platform performance error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

export const getBrandsByPlatform = async (req, res) => {
  try {
    const { platform } = req.params;

    const result = await pool.query(`
      SELECT 
        brand as name,
        SUM(revenue) as revenue,
        SUM(gmv) as gmv,
        SUM(transactions) as transactions
      FROM revenue_data
      WHERE platform = $1
        AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY brand
      ORDER BY revenue DESC
    `, [platform]);

    const platformTarget = platformTargets[platform] || 0;
    const brandCount = result.rows.length;

    const brandDetails = result.rows.map(row => {
      const revenue = parseFloat(row.revenue) || 0;
      const brandTarget = brandCount > 0 ? platformTarget / brandCount : 0;
      const pacing = calculatePacing(revenue, brandTarget);

      return {
        name: row.name,
        revenue,
        gmv: parseFloat(row.gmv) || 0,
        transactions: parseInt(row.transactions) || 0,
        pacing,
        category: 'General', // TODO: Add category to database
      };
    });

    res.json({
      platform,
      brands: brandDetails,
    });
  } catch (error) {
    console.error('Brands by platform error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
