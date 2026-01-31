/**
 * Dashboard Controllers
 * Handles dashboard API endpoints with real database queries
 */

import {
  getDashboardOverview,
  getPlatformPerformance as getPlatformPerformanceData,
  getCategorizedPlatforms,
  getWeeklyRevenueByPlatform,
} from '../lib/dataLoaders.js';

/**
 * GET /api/dashboard/overview
 * Returns overall dashboard summary
 */
export const getOverview = async (req, res) => {
  try {
    const overview = await getDashboardOverview();
    const categorized = await getCategorizedPlatforms();

    res.json({
      summary: overview,
      platforms: categorized.all,
      platformsByCategory: {
        attribution: categorized.attribution,
        affiliate: categorized.affiliate,
        flatfee: categorized.flatfee,
      },
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard overview',
      message: error.message,
    });
  }
};

/**
 * GET /api/dashboard/platform-performance
 * Returns detailed platform performance data with top brands
 */
export const getPlatformPerformance = async (req, res) => {
  try {
    const { platforms } = await getPlatformPerformanceData();

    res.json({
      success: true,
      platforms,
    });
  } catch (error) {
    console.error('Platform performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform performance',
      message: error.message,
    });
  }
};

/**
 * GET /api/dashboard/weekly-revenue
 * Returns weekly revenue data for all platforms
 * Query params:
 *   - fromWeek: Start week date (YYYY-MM-DD)
 *   - toWeek: End week date (YYYY-MM-DD)
 */
export const getWeeklyRevenue = async (req, res) => {
  try {
    const { fromWeek, toWeek } = req.query;

    if (!fromWeek || !toWeek) {
      return res.status(400).json({
        success: false,
        error: 'fromWeek and toWeek query parameters are required',
      });
    }

    const weeklyData = await getWeeklyRevenueByPlatform({ fromWeek, toWeek });

    res.json({
      success: true,
      data: weeklyData,
      fromWeek,
      toWeek,
    });
  } catch (error) {
    console.error('Weekly revenue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weekly revenue',
      message: error.message,
    });
  }
};

/**
 * GET /api/dashboard/brands/:platform
 * Returns brand details for a specific platform
 */
export const getBrandsByPlatform = async (req, res) => {
  try {
    const { platform } = req.params;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { platforms } = await getPlatformPerformanceData();
    const platformData = platforms.find(p => p.name === platform);

    if (!platformData) {
      return res.status(404).json({
        success: false,
        error: `Platform '${platform}' not found`,
      });
    }

    res.json({
      success: true,
      platform: platformData.name,
      brands: platformData.brands,
      summary: {
        mtdRevenue: platformData.mtdRevenue,
        mtdGmv: platformData.mtdGmv,
        targetGmv: platformData.targetGmv,
        pacing: platformData.pacing,
        brandCount: platformData.brandCount,
      },
    });
  } catch (error) {
    console.error('Brands by platform error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brands',
      message: error.message,
    });
  }
};
