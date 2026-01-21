/**
 * Data Loaders for Dashboard
 * Queries the Prisma database to fetch real platform and brand data
 */

import prisma from '../db/client.js';
import { getDaysAccounted, getDaysInMonth } from '../utils/dateUtils.js';

/**
 * Get weekly revenue data by platform for a date range
 * @param {Object} params
 * @param {string} params.fromWeek - Start week date (YYYY-MM-DD)
 * @param {string} params.toWeek - End week date (YYYY-MM-DD)
 * @returns {Promise<Array>}
 */
export async function getWeeklyRevenueByPlatform({ fromWeek, toWeek }) {
  try {
    // Get platform metrics grouped by platform and week
    const platformMetrics = await prisma.platformMetric.groupBy({
      by: ['platformKey', 'date'],
      where: {
        date: {
          gte: fromWeek,
          lte: toWeek,
        },
      },
      _sum: {
        weeklyRevenue: true,
      },
      orderBy: [
        { platformKey: 'asc' },
        { date: 'asc' },
      ],
    });

    // Get flat fee allocations for the same period
    const flatFeeAllocations = await prisma.flatFeeAllocation.findMany({
      where: {
        weekStart: {
          gte: fromWeek,
          lte: toWeek,
        },
      },
      orderBy: [
        { partnerName: 'asc' },
        { weekStart: 'asc' },
      ],
    });

    // Combine and format the data
    const weeklyDataMap = new Map();

    // Process platform metrics
    platformMetrics.forEach(metric => {
      if (!weeklyDataMap.has(metric.platformKey)) {
        weeklyDataMap.set(metric.platformKey, {
          platform: metric.platformKey,
          weeks: {},
        });
      }
      const platformData = weeklyDataMap.get(metric.platformKey);
      platformData.weeks[metric.date] = metric._sum.weeklyRevenue || 0;
    });

    // Process flat fee allocations
    flatFeeAllocations.forEach(allocation => {
      const platformKey = allocation.partnerName;
      if (!weeklyDataMap.has(platformKey)) {
        weeklyDataMap.set(platformKey, {
          platform: platformKey,
          weeks: {},
          isFlatFee: true,
        });
      }
      const platformData = weeklyDataMap.get(platformKey);
      platformData.weeks[allocation.weekStart] = allocation.weeklyRevenue;
    });

    // Convert to array and format
    const result = Array.from(weeklyDataMap.values()).map(data => ({
      platform: data.platform,
      weekRevenues: Object.entries(data.weeks).map(([date, revenue]) => ({
        date,
        revenue,
      })),
      isFlatFee: data.isFlatFee || false,
    }));

    return result;
  } catch (error) {
    console.error('Error in getWeeklyRevenueByPlatform:', error);
    throw error;
  }
}

/**
 * Get platform performance data with top brands
 * @returns {Promise<Object>}
 */
export async function getPlatformPerformance() {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const monthStart = `${currentDate.substring(0, 7)}-01`;

    // Get all metrics for the current month
    const metrics = await prisma.platformMetric.findMany({
      where: {
        date: {
          gte: monthStart,
          lte: currentDate,
        },
      },
      orderBy: [
        { platformKey: 'asc' },
        { brand: 'asc' },
        { date: 'desc' },
      ],
    });

    // Group by platform and brand, taking the latest entry for each
    const platformBrandsMap = new Map();

    metrics.forEach(metric => {
      const platformKey = `${metric.platformKey}`;
      if (!platformBrandsMap.has(platformKey)) {
        platformBrandsMap.set(platformKey, {
          platform: metric.platformKey,
          brands: new Map(),
          totalMtdRevenue: 0,
          totalMtdGmv: 0,
          totalTargetGmv: 0,
        });
      }

      const platformData = platformBrandsMap.get(platformKey);
      const brandKey = metric.brand;

      // Only store the latest metric for each brand
      if (!platformData.brands.has(brandKey) ||
          platformData.brands.get(brandKey).date < metric.date) {
        platformData.brands.set(brandKey, {
          brand: metric.brand,
          weeklyRevenue: metric.weeklyRevenue,
          mtdRevenue: metric.mtdRevenue,
          mtdGmv: metric.mtdGmv,
          targetGmv: metric.targetGmv,
          totalContractRevenue: metric.totalContractRevenue || metric.targetGmv * 2.5,
          date: metric.date,
        });
      }
    });

    // Calculate platform totals and format response
    const platforms = [];
    const daysAccounted = getDaysAccounted();
    const daysInMonth = getDaysInMonth();
    const daysLeft = daysInMonth - daysAccounted;

    platformBrandsMap.forEach((platformData, platformKey) => {
      const brands = Array.from(platformData.brands.values());

      // Calculate platform totals
      const mtdRevenue = brands.reduce((sum, b) => sum + b.mtdRevenue, 0);
      const mtdGmv = brands.reduce((sum, b) => sum + b.mtdGmv, 0);
      const targetGmv = brands.reduce((sum, b) => sum + b.targetGmv, 0);
      const weeklyRevenue = brands.reduce((sum, b) => sum + b.weeklyRevenue, 0);

      // Calculate pacing: ((mtdGmv / daysAccounted) * daysLeft / targetGmv) * 100
      const pacing = (targetGmv > 0 && daysAccounted > 0)
        ? ((mtdGmv / daysAccounted) * daysLeft / targetGmv) * 100
        : 0;

      // Calculate % to target
      const pctToTarget = targetGmv > 0 ? (mtdGmv / targetGmv) * 100 : 0;

      platforms.push({
        name: platformData.platform,
        mtdRevenue,
        mtdGmv,
        targetGmv,
        weeklyRevenue,
        pacing,
        pctToTarget,
        daysLeft,
        daysAccounted,
        brandCount: brands.length,
        brands: brands.map(b => ({
          ...b,
          pctToTarget: b.targetGmv > 0 ? (b.mtdGmv / b.targetGmv) * 100 : 0,
          pacingPct: (b.targetGmv > 0 && daysAccounted > 0)
            ? ((b.mtdGmv / daysAccounted) * daysLeft / b.targetGmv) * 100
            : 0,
          daysLeft,
        })),
      });
    });

    return { platforms };
  } catch (error) {
    console.error('Error in getPlatformPerformance:', error);
    throw error;
  }
}

/**
 * Get dashboard overview summary
 * @returns {Promise<Object>}
 */
export async function getDashboardOverview() {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const monthStart = `${currentDate.substring(0, 7)}-01`;

    // Get latest metrics for each platform/brand combination
    const metrics = await prisma.platformMetric.findMany({
      where: {
        date: {
          gte: monthStart,
          lte: currentDate,
        },
      },
      orderBy: [
        { platformKey: 'asc' },
        { brand: 'asc' },
        { date: 'desc' },
      ],
    });

    // Get unique brands (latest entry for each platform/brand)
    const latestBrands = new Map();
    metrics.forEach(metric => {
      const key = `${metric.platformKey}-${metric.brand}`;
      if (!latestBrands.has(key)) {
        latestBrands.set(key, metric);
      }
    });

    const brandsArray = Array.from(latestBrands.values());

    // Calculate totals
    const totalRevenue = brandsArray.reduce((sum, b) => sum + b.mtdRevenue, 0);
    const totalTarget = brandsArray.reduce((sum, b) => sum + b.targetGmv, 0);
    const totalGMV = brandsArray.reduce((sum, b) => sum + b.mtdGmv, 0);

    const daysAccounted = getDaysAccounted();
    const daysInMonth = getDaysInMonth();
    const daysLeft = daysInMonth - daysAccounted;

    // Overall pacing
    const overallPacing = (totalTarget > 0 && daysAccounted > 0)
      ? ((totalGMV / daysAccounted) * daysLeft / totalTarget) * 100
      : 0;

    // Achievement percentage (for MTD Revenue card)
    const achievementPct = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;

    return {
      totalRevenue,
      totalTarget,
      totalGMV,
      totalBrands: latestBrands.size,
      overallPacing,
      achievementPct,
      daysAccounted,
      daysInMonth,
      daysLeft,
    };
  } catch (error) {
    console.error('Error in getDashboardOverview:', error);
    throw error;
  }
}

/**
 * Get categorized platforms with their data
 * Categorizes platforms into attribution, affiliate, and flatfee
 * @returns {Promise<Object>}
 */
export async function getCategorizedPlatforms() {
  try {
    const { platforms } = await getPlatformPerformance();

    // Platform category mapping
    const categoryMap = {
      'Creator Connections': 'attribution',
      'Levanta': 'attribution',
      'Perch': 'attribution',
      'PartnerBoost': 'attribution',
      'Archer': 'attribution',
      'Skimlinks': 'affiliate',
      'Impact': 'affiliate',
      'Howl': 'affiliate',
      'BrandAds': 'affiliate',
      'Awin': 'affiliate',
      'Partnerize': 'affiliate',
      'Connexity': 'affiliate',
      'Apple': 'affiliate',
    };

    // Get flat fee contracts to identify flat fee platforms
    const flatFeeContracts = await prisma.flatFeeContract.findMany({
      select: { partnerName: true },
      distinct: ['partnerName'],
    });

    const flatFeePlatforms = new Set(flatFeeContracts.map(c => c.partnerName));

    // Categorize platforms
    const categorized = platforms.map(platform => ({
      ...platform,
      category: flatFeePlatforms.has(platform.name)
        ? 'flatfee'
        : (categoryMap[platform.name] || 'attribution'),
    }));

    return {
      attribution: categorized.filter(p => p.category === 'attribution'),
      affiliate: categorized.filter(p => p.category === 'affiliate'),
      flatfee: categorized.filter(p => p.category === 'flatfee'),
      all: categorized,
    };
  } catch (error) {
    console.error('Error in getCategorizedPlatforms:', error);
    throw error;
  }
}
