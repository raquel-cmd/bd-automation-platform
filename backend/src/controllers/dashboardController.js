import prisma from '../config/prisma.js';
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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get current month's data grouped by platform
    const platformData = await prisma.revenueData.groupBy({
      by: ['platform'],
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        revenue: true,
        gmv: true,
        transactions: true,
      },
      _count: {
        brand: true,
      },
    });

    // Get week revenue (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weekData = await prisma.revenueData.groupBy({
      by: ['platform'],
      where: {
        date: {
          gte: sevenDaysAgo,
        },
      },
      _sum: {
        revenue: true,
        gmv: true,
      },
    });

    const weekDataMap = {};
    weekData.forEach(item => {
      weekDataMap[item.platform] = {
        weekRevenue: Number(item._sum.revenue) || 0,
        weekGMV: Number(item._sum.gmv) || 0,
      };
    });

    // Build platform summary
    const platforms = platformData.map(item => {
      const platform = item.platform;
      const mtdRevenue = Number(item._sum.revenue) || 0;
      const mtdGMV = Number(item._sum.gmv) || 0;
      const target = platformTargets[platform] || 0;
      const pacing = calculatePacing(mtdRevenue, target);
      const week = weekDataMap[platform] || { weekRevenue: 0, weekGMV: 0 };

      return {
        name: platform,
        mtdRevenue,
        mtdGMV,
        target,
        pacing,
        weekRevenue: week.weekRevenue,
        weekGMV: week.weekGMV,
        transactions: item._sum.transactions || 0,
        brands: item._count.brand || 0,
      };
    });

    // Calculate totals
    const totalRevenue = platforms.reduce((sum, p) => sum + p.mtdRevenue, 0);
    const totalTarget = Object.values(platformTargets).reduce((sum, t) => sum + t, 0);
    const totalGMV = platforms.reduce((sum, p) => sum + p.mtdGMV, 0);
    const totalTransactions = platforms.reduce((sum, p) => sum + p.transactions, 0);
    const totalBrands = platforms.reduce((sum, p) => sum + p.brands, 0);

    res.json({
      platforms,
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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const platformData = await prisma.revenueData.groupBy({
      by: ['platform'],
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        revenue: true,
        gmv: true,
        transactions: true,
      },
      _count: {
        brand: true,
      },
    });

    const platformPerformance = platformData.map(item => {
      const platform = item.platform;
      const mtdRevenue = Number(item._sum.revenue) || 0;
      const mtdGMV = Number(item._sum.gmv) || 0;
      const target = platformTargets[platform] || 0;
      const pacing = calculatePacing(mtdRevenue, target);

      return {
        platform,
        mtdRevenue,
        mtdGMV,
        target,
        pacing,
        brands: item._count.brand || 0,
        transactions: item._sum.transactions || 0,
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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const brandData = await prisma.revenueData.groupBy({
      by: ['brand'],
      where: {
        platform,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        revenue: true,
        gmv: true,
        transactions: true,
      },
      orderBy: {
        _sum: {
          revenue: 'desc',
        },
      },
    });

    const platformTarget = platformTargets[platform] || 0;
    const brandCount = brandData.length;

    const brandDetails = brandData.map(item => {
      const revenue = Number(item._sum.revenue) || 0;
      const brandTarget = brandCount > 0 ? platformTarget / brandCount : 0;
      const pacing = calculatePacing(revenue, brandTarget);

      return {
        name: item.brand,
        revenue,
        gmv: Number(item._sum.gmv) || 0,
        transactions: item._sum.transactions || 0,
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
