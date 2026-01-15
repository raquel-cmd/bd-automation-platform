import { brands, transactions } from '../data/mockData.js';

export const getAllBrands = (req, res) => {
  try {
    const { platform } = req.query;

    let filteredBrands = brands;

    if (platform) {
      filteredBrands = brands.filter(b => b.platform === platform);
    }

    // Enrich with transaction data
    const enrichedBrands = filteredBrands.map(brand => {
      const brandTransactions = transactions.filter(t => t.brandId === brand.id);

      const revenue = brandTransactions.reduce((sum, t) => sum + t.revenue, 0);
      const gmv = brandTransactions.reduce((sum, t) => sum + t.gmv, 0);
      const quantity = brandTransactions.reduce((sum, t) => sum + t.quantity, 0);

      return {
        ...brand,
        revenue,
        gmv,
        transactions: quantity,
      };
    });

    res.json({
      total: enrichedBrands.length,
      brands: enrichedBrands,
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBrandById = (req, res) => {
  try {
    const { id } = req.params;
    const brand = brands.find(b => b.id === parseInt(id));

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const brandTransactions = transactions.filter(t => t.brandId === brand.id);
    const revenue = brandTransactions.reduce((sum, t) => sum + t.revenue, 0);
    const gmv = brandTransactions.reduce((sum, t) => sum + t.gmv, 0);
    const quantity = brandTransactions.reduce((sum, t) => sum + t.quantity, 0);

    res.json({
      ...brand,
      revenue,
      gmv,
      transactions: quantity,
      transactionDetails: brandTransactions,
    });
  } catch (error) {
    console.error('Get brand by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
