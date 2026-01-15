import { brands, transactions, topProducts, revenueTrends } from '../data/mockData.js';

export const getTrends = (req, res) => {
  try {
    res.json({
      trends: revenueTrends,
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTopBrands = (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Calculate revenue per brand
    const brandRevenue = brands.map(brand => {
      const brandTransactions = transactions.filter(t => t.brandId === brand.id);
      const revenue = brandTransactions.reduce((sum, t) => sum + t.revenue, 0);

      // Mock growth calculation (random for demo)
      const growth = (Math.random() * 30 - 5).toFixed(1);

      return {
        name: brand.name,
        platform: brand.platform,
        category: brand.category,
        revenue,
        growth: parseFloat(growth),
      };
    });

    // Sort by revenue and limit
    const topBrands = brandRevenue
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, parseInt(limit));

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
    const { limit = 10 } = req.query;

    const limitedProducts = topProducts.slice(0, parseInt(limit));

    res.json({
      total: limitedProducts.length,
      products: limitedProducts,
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getInsightsOverview = (req, res) => {
  try {
    // Calculate key metrics
    const totalRevenue = transactions.reduce((sum, t) => sum + t.revenue, 0);
    const totalGMV = transactions.reduce((sum, t) => sum + t.gmv, 0);
    const totalTransactions = transactions.reduce((sum, t) => sum + t.quantity, 0);

    // Average revenue per brand
    const brandRevenues = brands.map(brand => {
      const brandTransactions = transactions.filter(t => t.brandId === brand.id);
      return brandTransactions.reduce((sum, t) => sum + t.revenue, 0);
    });
    const avgRevenuePerBrand = brandRevenues.reduce((sum, r) => sum + r, 0) / brands.length;

    // Top platform by revenue
    const platformRevenues = {};
    transactions.forEach(t => {
      platformRevenues[t.platform] = (platformRevenues[t.platform] || 0) + t.revenue;
    });
    const topPlatform = Object.entries(platformRevenues)
      .sort((a, b) => b[1] - a[1])[0];

    res.json({
      totalRevenue,
      totalGMV,
      totalTransactions,
      avgRevenuePerBrand,
      topPlatform: {
        name: topPlatform[0],
        revenue: topPlatform[1],
      },
      activeBrands: brands.length,
    });
  } catch (error) {
    console.error('Get insights overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
