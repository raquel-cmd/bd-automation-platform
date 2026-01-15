import { brands, transactions, platformTargets } from '../data/mockData.js';
import { calculatePacing, getDaysInMonth, getDaysAccounted } from '../utils/dateUtils.js';

export const getOverview = (req, res) => {
  try {
    // Calculate platform aggregates
    const platformData = {};

    Object.keys(platformTargets).forEach(platform => {
      const platformTransactions = transactions.filter(t => t.platform === platform);
      const platformBrands = brands.filter(b => b.platform === platform);

      const mtdRevenue = platformTransactions.reduce((sum, t) => sum + t.revenue, 0);
      const mtdGMV = platformTransactions.reduce((sum, t) => sum + t.gmv, 0);
      const totalTransactions = platformTransactions.reduce((sum, t) => sum + t.quantity, 0);

      // Calculate week revenue (mock - last 3 transactions)
      const weekRevenue = platformTransactions.slice(0, 3).reduce((sum, t) => sum + t.revenue, 0);
      const weekGMV = platformTransactions.slice(0, 3).reduce((sum, t) => sum + t.gmv, 0);

      const target = platformTargets[platform];
      const pacing = calculatePacing(mtdRevenue, target);

      platformData[platform] = {
        name: platform,
        mtdRevenue,
        mtdGMV,
        target,
        pacing,
        weekRevenue,
        weekGMV,
        transactions: totalTransactions,
        brands: platformBrands.length,
      };
    });

    // Calculate totals
    const totalRevenue = Object.values(platformData).reduce((sum, p) => sum + p.mtdRevenue, 0);
    const totalTarget = Object.values(platformData).reduce((sum, p) => sum + p.target, 0);
    const totalGMV = Object.values(platformData).reduce((sum, p) => sum + p.mtdGMV, 0);
    const totalTransactions = Object.values(platformData).reduce((sum, p) => sum + p.transactions, 0);
    const totalBrands = brands.length;

    res.json({
      platforms: Object.values(platformData),
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
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPlatformPerformance = (req, res) => {
  try {
    const platformPerformance = Object.keys(platformTargets).map(platform => {
      const platformTransactions = transactions.filter(t => t.platform === platform);
      const platformBrands = brands.filter(b => b.platform === platform);

      const mtdRevenue = platformTransactions.reduce((sum, t) => sum + t.revenue, 0);
      const mtdGMV = platformTransactions.reduce((sum, t) => sum + t.gmv, 0);
      const target = platformTargets[platform];
      const pacing = calculatePacing(mtdRevenue, target);

      return {
        platform,
        mtdRevenue,
        mtdGMV,
        target,
        pacing,
        brands: platformBrands.length,
        transactions: platformTransactions.length,
      };
    });

    res.json(platformPerformance);
  } catch (error) {
    console.error('Platform performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBrandsByPlatform = (req, res) => {
  try {
    const { platform } = req.params;

    const platformBrands = brands.filter(b => b.platform === platform);
    const brandDetails = platformBrands.map(brand => {
      const brandTransactions = transactions.filter(t => t.brandId === brand.id);

      const revenue = brandTransactions.reduce((sum, t) => sum + t.revenue, 0);
      const gmv = brandTransactions.reduce((sum, t) => sum + t.gmv, 0);
      const quantity = brandTransactions.reduce((sum, t) => sum + t.quantity, 0);

      // Mock pacing calculation for brands
      const brandTarget = platformTargets[platform] / platformBrands.length;
      const pacing = calculatePacing(revenue, brandTarget);

      return {
        name: brand.name,
        revenue,
        gmv,
        transactions: quantity,
        pacing,
        category: brand.category,
      };
    });

    res.json({
      platform,
      brands: brandDetails,
    });
  } catch (error) {
    console.error('Brands by platform error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
