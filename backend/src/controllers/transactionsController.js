import { transactions } from '../data/mockData.js';

export const getAllTransactions = (req, res) => {
  try {
    const { platform, brandId, startDate, endDate, limit = 100, offset = 0 } = req.query;

    let filteredTransactions = [...transactions];

    // Filter by platform
    if (platform) {
      filteredTransactions = filteredTransactions.filter(t => t.platform === platform);
    }

    // Filter by brand
    if (brandId) {
      filteredTransactions = filteredTransactions.filter(t => t.brandId === parseInt(brandId));
    }

    // Filter by date range
    if (startDate) {
      filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= new Date(startDate));
    }

    if (endDate) {
      filteredTransactions = filteredTransactions.filter(t => new Date(t.date) <= new Date(endDate));
    }

    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Pagination
    const total = filteredTransactions.length;
    const paginatedTransactions = filteredTransactions.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    // Calculate aggregates
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.revenue, 0);
    const totalGMV = filteredTransactions.reduce((sum, t) => sum + t.gmv, 0);
    const totalQuantity = filteredTransactions.reduce((sum, t) => sum + t.quantity, 0);

    res.json({
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      transactions: paginatedTransactions,
      aggregates: {
        totalRevenue,
        totalGMV,
        totalQuantity,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTransactionById = (req, res) => {
  try {
    const { id } = req.params;
    const transaction = transactions.find(t => t.id === parseInt(id));

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
