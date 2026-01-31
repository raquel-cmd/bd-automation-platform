import prisma from '../config/prisma.js';
import { getDaysAccounted, getDaysInMonth } from '../utils/dateUtils.js';

export const getAllBrands = async (req, res) => {
  try {
    const { platform } = req.query;
    const currentDate = new Date().toISOString().split('T')[0];
    const monthStart = `${currentDate.substring(0, 7)}-01`;

    const where = {};
    if (platform) {
      where.platformKey = platform;
    }

    // Get metrics for the current month
    const metrics = await prisma.platformMetric.findMany({
      where: {
        ...where,
        date: {
          gte: monthStart,
          lte: currentDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    // Group by brand (and platform if generic query)
    const brandMap = new Map();

    metrics.forEach(metric => {
      // Create a unique key for the brand (per platform)
      const key = `${metric.platformKey}-${metric.brand}`;

      if (!brandMap.has(key)) {
        brandMap.set(key, {
          id: metric.brand, // Use name as ID
          name: metric.brand,
          platform: metric.platformKey,
          revenue: 0,
          gmv: 0,
          transactions: 0,
          transactionDetails: []
        });
      }

      const brandData = brandMap.get(key);

      // Accumulate totals? 
      // The metrics are snapshots per date? Or weekly?
      // PlatformMetric has 'mtdRevenue', 'mtdGmv'. These should be "Month to Date".
      // If we have multiple entries for the same brand in the same month (e.g. weekly updates),
      // the latest one represents the MTD total.

      // Store the details
      brandData.transactionDetails.push(metric);

      // We should use the LATEST metric for the totals
      // Since we iterated, let's find the latest data point effectively.
    });

    // Refine: Get the latest metric for each brand to report current MTD stats
    const brands = Array.from(brandMap.values()).map(b => {
      // Sort details by date desc
      b.transactionDetails.sort((a, b) => new Date(b.date) - new Date(a.date));
      const latestInfo = b.transactionDetails[0];

      return {
        ...b,
        revenue: latestInfo.mtdRevenue || 0,
        gmv: latestInfo.mtdGmv || 0,
        // Assuming transactions are not tracked, or we could sum them if we had a field
      };
    });

    res.json({
      total: brands.length,
      brands: brands,
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    // Interpret ID as brand name
    const brandName = decodeURIComponent(id);

    const currentDate = new Date().toISOString().split('T')[0];
    const monthStart = `${currentDate.substring(0, 7)}-01`;

    // Find all metrics for this brand in current month
    const metrics = await prisma.platformMetric.findMany({
      where: {
        brand: brandName,
        date: {
          gte: monthStart,
          lte: currentDate,
        }
      },
      orderBy: { date: 'desc' },
    });

    if (metrics.length === 0) {
      // Try searching without date constraint if not found (maybe historical?)
      const allTimeMetrics = await prisma.platformMetric.findMany({
        where: { brand: brandName },
        orderBy: { date: 'desc' },
        take: 1
      });

      if (allTimeMetrics.length === 0) {
        return res.status(404).json({ error: 'Brand not found' });
      }
      // Use the historical metric if found
      const latest = allTimeMetrics[0];
      return res.json({
        id: latest.brand,
        name: latest.brand,
        platform: latest.platformKey,
        revenue: latest.mtdRevenue,
        gmv: latest.mtdGmv,
        transactions: 0,
        transactionDetails: allTimeMetrics
      });
    }

    const latest = metrics[0];

    // Calculate aggregate stats if needed, or just use latest MTD
    const revenue = latest.mtdRevenue;
    const gmv = latest.mtdGmv;

    res.json({
      id: brandName,
      name: brandName,
      platform: latest.platformKey, // Note: Brand might exist on multiple platforms? The schema assumes unique [platform, brand].
      revenue,
      gmv,
      transactions: 0,
      transactionDetails: metrics,
    });
  } catch (error) {
    console.error('Get brand by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
