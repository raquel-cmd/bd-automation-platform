import prisma from '../config/prisma.js';

export const getTrends = async (req, res) => {
  try {
    // Generate monthly revenue trends for the last 6 months
    const today = new Date();
    const trends = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-indexed for string formatting/Prisma? No, stored as ISO string 'YYYY-MM-DD'

      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      const nextMonthStr = month === 12
        ? `${year + 1}-01`
        : `${year}-${(month + 1).toString().padStart(2, '0')}`;

      // Sum revenue for this month
      const aggregate = await prisma.platformMetric.aggregate({
        where: {
          date: {
            gte: `${monthStr}-01`,
            lt: `${nextMonthStr}-01`,
          },
        },
        _sum: {
          weeklyRevenue: true,
        },
      });

      trends.push({
        month: date.toLocaleString('default', { month: 'short' }),
        revenue: aggregate._sum.weeklyRevenue || 0,
        // Mock growth or calculate if previous month exists
      });
    }

    res.json({
      trends,
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTopBrands = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const brandAggregates = await prisma.platformMetric.groupBy({
      by: ['brand', 'platformKey'],
      _sum: {
        weeklyRevenue: true,
      },
      orderBy: {
        _sum: {
          weeklyRevenue: 'desc',
        },
      },
      take: parseInt(limit),
    });

    const topBrands = brandAggregates.map(b => ({
      name: b.brand,
      platform: b.platformKey,
      category: 'Unknown', // Not stored in metric
      revenue: b._sum.weeklyRevenue || 0,
      growth: 0, // Requires historical comparison
    }));

    res.json({
      total: topBrands.length,
      brands: topBrands,
    });
  } catch (error) {
    console.error('Get top brands error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTopProducts = (req, res) => {
  try {
    // Product level data not currently supported in schema
    res.json({
      total: 0,
      products: [],
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getInsightsOverview = async (req, res) => {
  try {
    // Total Revenue (All time or needed range? Assuming all time for overview)
    const totalAgg = await prisma.platformMetric.aggregate({
      _sum: {
        weeklyRevenue: true,
        mtdGmv: true,
      },
    });

    const totalRevenue = totalAgg._sum.weeklyRevenue || 0;
    const totalGMV = totalAgg._sum.mtdGmv || 0;
    const totalTransactions = 0; // Not tracked

    // Active brands count
    const brands = await prisma.platformMetric.groupBy({
      by: ['brand'],
    });
    const activeBrands = brands.length;

    // Average revenue per brand
    const avgRevenuePerBrand = activeBrands > 0 ? totalRevenue / activeBrands : 0;

    // Top Platform
    const platformAgg = await prisma.platformMetric.groupBy({
      by: ['platformKey'],
      _sum: {
        weeklyRevenue: true,
      },
      orderBy: {
        _sum: {
          weeklyRevenue: 'desc',
        },
      },
      take: 1,
    });

    const topPlatform = platformAgg.length > 0 ? {
      name: platformAgg[0].platformKey,
      revenue: platformAgg[0]._sum.weeklyRevenue || 0,
    } : { name: 'None', revenue: 0 };

    res.json({
      totalRevenue,
      totalGMV,
      totalTransactions,
      avgRevenuePerBrand,
      topPlatform,
      activeBrands,
    });
  } catch (error) {
    console.error('Get insights overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
