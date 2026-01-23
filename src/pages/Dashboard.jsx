import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Layout from '../components/Layout';
import { dashboard } from '../utils/api';
import {
  formatCurrency,
  formatPercentage,
  calculatePacing,
  getMonthName,
  getDaysAccounted,
  getDaysInMonth,
  formatDateRange,
  getCurrentWeekStart,
  getCurrentWeekEnd,
  getLastNWeeks,
  getWeekRange,
  formatWeekLabel,
} from '../utils/dateUtils';

export default function Dashboard() {
  const [platformData, setPlatformData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthSummary, setMonthSummary] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [weekRangeStart, setWeekRangeStart] = useState(4); // 4 weeks ago
  const [weekRangeEnd, setWeekRangeEnd] = useState(0); // current week

  // Force refresh - updated layout with 3 sections: Revenue Card, Weekly Revenue (categorized), Top Brands

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Regenerate weekly data when week range changes
    if (platformData.length > 0) {
      generateWeeklyData();
    }
  }, [weekRangeStart, weekRangeEnd, platformData.length]);

  const generateWeeklyData = () => {
    if (platformData.length === 0) return;

    const weeks = getWeekRange(weekRangeStart, weekRangeEnd);
    const mockWeekly = platformData.map(platform => {
      const weekRevenues = weeks.map((week, idx) => {
        // Simulate decreasing revenue for older weeks
        const baseRevenue = platform.weekRevenue || platform.mtdRevenue / 4;
        const variance = 0.8 + Math.random() * 0.4;
        return Math.floor(baseRevenue * variance);
      });

      return {
        platform: platform.name,
        weeks: weekRevenues
      };
    });
    setWeeklyData(mockWeekly);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Mock data for demonstration (replace with real API calls)
      const mockData = {
        platforms: [
          // Attribution Partners
          {
            name: 'Creator Connections',
            mtdRevenue: 225000,
            mtdGMV: 5625000,
            target: 225000,
            weekRevenue: 52000,
            weekGMV: 1300000,
            transactions: 412,
            brands: 124,
            category: 'attribution',
            brandDetails: [
              { name: 'Samsung', revenue: 78000, gmv: 1950000, transactions: 145, target: 75000, weekRevenue: 18000 },
              { name: 'LG', revenue: 68000, gmv: 1700000, transactions: 132, target: 70000, weekRevenue: 15500 },
              { name: 'Sony', revenue: 79000, gmv: 1975000, transactions: 135, target: 72000, weekRevenue: 18500 },
              { name: 'Panasonic', revenue: 45000, gmv: 1125000, transactions: 89, target: 48000, weekRevenue: 10200 },
              { name: 'Philips', revenue: 38000, gmv: 950000, transactions: 76, target: 40000, weekRevenue: 8800 },
              { name: 'Bose', revenue: 35000, gmv: 875000, transactions: 68, target: 38000, weekRevenue: 8100 },
              { name: 'JBL', revenue: 32000, gmv: 800000, transactions: 62, target: 35000, weekRevenue: 7400 },
              { name: 'Canon', revenue: 28000, gmv: 700000, transactions: 54, target: 30000, weekRevenue: 6500 },
              { name: 'Nikon', revenue: 25000, gmv: 625000, transactions: 48, target: 28000, weekRevenue: 5800 },
              { name: 'GoPro', revenue: 22000, gmv: 550000, transactions: 42, target: 25000, weekRevenue: 5100 },
              { name: 'DJI', revenue: 18000, gmv: 450000, transactions: 36, target: 20000, weekRevenue: 4200 },
            ],
          },
          {
            name: 'Levanta',
            mtdRevenue: 145000,
            mtdGMV: 3625000,
            target: 150000,
            weekRevenue: 34000,
            weekGMV: 850000,
            transactions: 268,
            brands: 87,
            category: 'attribution',
            brandDetails: [
              { name: 'Apple', revenue: 52000, gmv: 1300000, transactions: 98, target: 55000, weekRevenue: 12000 },
              { name: 'Microsoft', revenue: 38000, gmv: 950000, transactions: 72, target: 40000, weekRevenue: 8800 },
              { name: 'Dell', revenue: 28000, gmv: 700000, transactions: 53, target: 30000, weekRevenue: 6500 },
              { name: 'HP', revenue: 15000, gmv: 375000, transactions: 28, target: 16000, weekRevenue: 3500 },
              { name: 'Lenovo', revenue: 12000, gmv: 300000, transactions: 17, target: 13000, weekRevenue: 2800 },
            ],
          },
          {
            name: 'Perch',
            mtdRevenue: 98000,
            mtdGMV: 2450000,
            target: 105000,
            weekRevenue: 23000,
            weekGMV: 575000,
            transactions: 182,
            brands: 62,
            category: 'attribution',
            brandDetails: [
              { name: 'Dyson', revenue: 42000, gmv: 1050000, transactions: 78, target: 45000, weekRevenue: 9800 },
              { name: 'Shark', revenue: 28000, gmv: 700000, transactions: 52, target: 30000, weekRevenue: 6500 },
              { name: 'iRobot', revenue: 16000, gmv: 400000, transactions: 30, target: 18000, weekRevenue: 3700 },
              { name: 'Bissell', revenue: 8000, gmv: 200000, transactions: 15, target: 9000, weekRevenue: 1900 },
              { name: 'Hoover', revenue: 4000, gmv: 100000, transactions: 7, target: 5000, weekRevenue: 950 },
            ],
          },
          {
            name: 'PartnerBoost',
            mtdRevenue: 76000,
            mtdGMV: 1900000,
            target: 80000,
            weekRevenue: 18000,
            weekGMV: 450000,
            transactions: 142,
            brands: 48,
            category: 'attribution',
            brandDetails: [
              { name: 'Nike', revenue: 32000, gmv: 800000, transactions: 60, target: 35000, weekRevenue: 7500 },
              { name: 'Adidas', revenue: 24000, gmv: 600000, transactions: 45, target: 25000, weekRevenue: 5600 },
              { name: 'Puma', revenue: 12000, gmv: 300000, transactions: 22, target: 13000, weekRevenue: 2800 },
              { name: 'Under Armour', revenue: 5000, gmv: 125000, transactions: 9, target: 5500, weekRevenue: 1200 },
              { name: 'New Balance', revenue: 3000, gmv: 75000, transactions: 6, target: 3500, weekRevenue: 700 },
            ],
          },
          {
            name: 'Archer',
            mtdRevenue: 62000,
            mtdGMV: 1550000,
            target: 65000,
            weekRevenue: 14500,
            weekGMV: 362500,
            transactions: 115,
            brands: 39,
            category: 'attribution',
            brandDetails: [
              { name: 'KitchenAid', revenue: 28000, gmv: 700000, transactions: 52, target: 30000, weekRevenue: 6500 },
              { name: 'Cuisinart', revenue: 18000, gmv: 450000, transactions: 33, target: 19000, weekRevenue: 4200 },
              { name: 'Ninja', revenue: 10000, gmv: 250000, transactions: 18, target: 11000, weekRevenue: 2300 },
              { name: 'Breville', revenue: 4000, gmv: 100000, transactions: 7, target: 4500, weekRevenue: 950 },
              { name: 'Vitamix', revenue: 2000, gmv: 50000, transactions: 5, target: 2500, weekRevenue: 470 },
            ],
          },
          // Affiliate Platforms
          {
            name: 'Skimlinks',
            mtdRevenue: 200000,
            mtdGMV: 4000000,
            target: 285000,
            weekRevenue: 45000,
            weekGMV: 900000,
            transactions: 237,
            brands: 79,
            category: 'affiliate',
            brandDetails: [
              { name: 'Amazon', revenue: 85000, gmv: 1700000, transactions: 98, target: 120000, weekRevenue: 19800 },
              { name: 'Walmart', revenue: 62000, gmv: 1240000, transactions: 67, target: 88000, weekRevenue: 14400 },
              { name: 'Target', revenue: 53000, gmv: 1060000, transactions: 72, target: 75000, weekRevenue: 12300 },
              { name: 'Best Buy', revenue: 35000, gmv: 700000, transactions: 42, target: 50000, weekRevenue: 8100 },
              { name: 'Home Depot', revenue: 28000, gmv: 560000, transactions: 33, target: 40000, weekRevenue: 6500 },
            ],
          },
          {
            name: 'Impact',
            mtdRevenue: 125000,
            mtdGMV: 2500000,
            target: 140000,
            weekRevenue: 29000,
            weekGMV: 580000,
            transactions: 156,
            brands: 52,
            category: 'affiliate',
            brandDetails: [
              { name: 'Wayfair', revenue: 48000, gmv: 960000, transactions: 60, target: 55000, weekRevenue: 11200 },
              { name: 'Overstock', revenue: 35000, gmv: 700000, transactions: 44, target: 40000, weekRevenue: 8100 },
              { name: 'Etsy', revenue: 24000, gmv: 480000, transactions: 30, target: 27000, weekRevenue: 5600 },
              { name: 'eBay', revenue: 12000, gmv: 240000, transactions: 15, target: 13000, weekRevenue: 2800 },
              { name: 'Rakuten', revenue: 6000, gmv: 120000, transactions: 7, target: 7000, weekRevenue: 1400 },
            ],
          },
          // Flat Fee Partnerships
          {
            name: 'Dyson',
            mtdRevenue: 35000,
            mtdGMV: 0,
            target: 35000,
            weekRevenue: 8750,
            weekGMV: 0,
            transactions: 1,
            brands: 1,
            category: 'flatfee',
            brandDetails: [
              { name: 'Dyson', revenue: 35000, gmv: 0, transactions: 1, target: 35000, weekRevenue: 8750 },
            ],
          },
          {
            name: 'Other Flat Fee',
            mtdRevenue: 49000,
            mtdGMV: 0,
            target: 49417,
            weekRevenue: 12000,
            weekGMV: 0,
            transactions: 8,
            brands: 12,
            category: 'flatfee',
            brandDetails: [
              { name: 'Samsung Sponsorship', revenue: 15000, gmv: 0, transactions: 1, target: 15000, weekRevenue: 3750 },
              { name: 'LG Partnership', revenue: 18000, gmv: 0, transactions: 1, target: 18000, weekRevenue: 4500 },
              { name: 'Sony Deal', revenue: 16000, gmv: 0, transactions: 1, target: 16417, weekRevenue: 4000 },
              { name: 'Brand A', revenue: 8000, gmv: 0, transactions: 2, target: 8000, weekRevenue: 2000 },
              { name: 'Brand B', revenue: 5000, gmv: 0, transactions: 3, target: 5000, weekRevenue: 1250 },
            ],
          },
        ],
      };

      // Calculate pacing for each platform
      const platformsWithPacing = mockData.platforms.map((platform) => ({
        ...platform,
        pacing: calculatePacing(platform.mtdRevenue, platform.target),
      }));

      setPlatformData(platformsWithPacing);

      // Calculate summary
      const totalRevenue = platformsWithPacing.reduce(
        (sum, p) => sum + p.mtdRevenue,
        0
      );
      const totalTarget = platformsWithPacing.reduce((sum, p) => sum + p.target, 0);
      const totalGMV = platformsWithPacing.reduce((sum, p) => sum + p.mtdGMV, 0);
      const totalTransactions = platformsWithPacing.reduce(
        (sum, p) => sum + p.transactions,
        0
      );
      const totalBrands = platformsWithPacing.reduce((sum, p) => sum + p.brands, 0);

      setMonthSummary({
        totalRevenue,
        totalTarget,
        totalGMV,
        totalTransactions,
        totalBrands,
        overallPacing: calculatePacing(totalRevenue, totalTarget),
        daysAccounted: getDaysAccounted(),
        daysInMonth: getDaysInMonth(),
      });

      // Weekly data will be generated by the useEffect hook
      // after platformData is set

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getPacingColor = (pacing) => {
    if (pacing >= 100) return 'text-green-600';
    if (pacing >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPacingBgColor = (pacing) => {
    if (pacing >= 100) return 'bg-green-50';
    if (pacing >= 90) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getProgressBarColor = (pacing) => {
    if (pacing >= 100) return 'bg-green-500';
    if (pacing >= 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const calculateWoWGrowth = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getPlatformsByCategory = (category) => {
    return platformData.filter(p => p.category === category);
  };

  const getTopBrandsForPlatform = (platform) => {
    const brands = platform.brandDetails || [];
    const limit = platform.name === 'Creator Connections' ? 10 : 5;

    // Sort by MTD revenue descending and take top N
    return brands
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map(brand => ({
        ...brand,
        pacing: brand.target ? calculatePacing(brand.revenue, brand.target) : null
      }));
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'attribution': 'Attribution Partners',
      'affiliate': 'Affiliate Platforms',
      'flatfee': 'Flat Fee Partnerships'
    };
    return labels[category] || category;
  };

  const ProgressBar = ({ value, max, className = '' }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const color = getProgressBarColor((value / max) * 100);

    return (
      <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Enhanced Dashboard
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {getMonthName()} • {formatDateRange(getCurrentWeekStart(), getCurrentWeekEnd())}
            </p>
          </div>
          {monthSummary && (
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Day {monthSummary.daysAccounted} of {monthSummary.daysInMonth}
              </div>
              <div className={`text-2xl font-bold ${getPacingColor(monthSummary.overallPacing)}`}>
                {formatPercentage(monthSummary.overallPacing, 1)} Pacing
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {monthSummary && (
          <div className="max-w-md">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500">MTD Revenue vs Target</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(monthSummary.totalRevenue)} / {formatCurrency(monthSummary.totalTarget)}
              </div>
              <div className="text-sm text-gray-500 mt-2">% of Goal</div>
              <div className={`text-lg font-semibold ${getPacingColor((monthSummary.totalRevenue / monthSummary.totalTarget) * 100)}`}>
                {formatPercentage((monthSummary.totalRevenue / monthSummary.totalTarget) * 100, 2)}
              </div>
              <ProgressBar
                value={monthSummary.totalRevenue}
                max={monthSummary.totalTarget}
                className="mt-2"
              />
            </div>
          </div>
        )}

        {/* Week-on-Week Revenue Table */}
        {weeklyData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Weekly Revenue by Platform
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Finance weeks run Thursday to Wednesday
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">From:</label>
                    <select
                      value={weekRangeStart}
                      onChange={(e) => setWeekRangeStart(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 13 }, (_, i) => {
                        const weeksAgo = 12 - i;
                        const week = getWeekRange(weeksAgo, weeksAgo)[0];
                        return (
                          <option key={weeksAgo} value={weeksAgo}>
                            {week.label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">To:</label>
                    <select
                      value={weekRangeEnd}
                      onChange={(e) => setWeekRangeEnd(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 13 }, (_, i) => {
                        const weeksAgo = 12 - i;
                        const week = getWeekRange(weeksAgo, weeksAgo)[0];
                        return (
                          <option key={weeksAgo} value={weeksAgo}>
                            {week.label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setWeekRangeStart(4);
                      setWeekRangeEnd(0);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Reset to Last 5 Weeks
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platform
                    </th>
                    {getWeekRange(weekRangeStart, weekRangeEnd).reverse().map((week, idx) => (
                      <th
                        key={idx}
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div>{week.label}</div>
                        {idx < getWeekRange(weekRangeStart, weekRangeEnd).length - 1 && <div className="text-xs text-gray-400">WoW %</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {['attribution', 'affiliate', 'flatfee'].map((category) => {
                    const categoryPlatforms = weeklyData.filter(pw => {
                      const platform = platformData.find(p => p.name === pw.platform);
                      return platform?.category === category;
                    });

                    if (categoryPlatforms.length === 0) return null;

                    return (
                      <React.Fragment key={category}>
                        {/* Category Header Row */}
                        <tr className="bg-gray-100">
                          <td colSpan={getWeekRange(weekRangeStart, weekRangeEnd).length + 1} className="px-6 py-2">
                            <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                              {getCategoryLabel(category)}
                            </div>
                          </td>
                        </tr>
                        {/* Platform Rows */}
                        {categoryPlatforms.map((platformWeekly) => {
                          const weeks = [...(platformWeekly.weeks || [])].reverse();
                          return (
                            <tr key={platformWeekly.platform} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                {platformWeekly.platform}
                              </td>
                              {weeks.map((revenue, idx) => {
                                const previousRevenue = idx < weeks.length - 1 ? weeks[idx + 1] : null;
                                const wowGrowth = previousRevenue
                                  ? calculateWoWGrowth(revenue, previousRevenue)
                                  : null;

                                return (
                                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="font-semibold text-gray-900">
                                      {formatCurrency(revenue)}
                                    </div>
                                    {wowGrowth !== null && (
                                      <div
                                        className={`text-xs font-medium ${wowGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                                          }`}
                                      >
                                        {wowGrowth >= 0 ? '+' : ''}
                                        {formatPercentage(wowGrowth, 1)}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Platform Performance - Top Brands by Platform */}
        {platformData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Platform Performance - Top Brands by Platform
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Top 10 brands for Creator Connections, top 5 for all other platforms
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {['attribution', 'affiliate', 'flatfee'].map((category) => {
                const categoryPlatforms = getPlatformsByCategory(category);
                if (categoryPlatforms.length === 0) return null;

                return (
                  <div key={category} className="p-6">
                    {/* Category Header */}
                    <h4 className="text-md font-semibold text-gray-800 mb-4 uppercase tracking-wide">
                      {getCategoryLabel(category)}
                    </h4>

                    {/* Platform Sections */}
                    <div className="space-y-6">
                      {categoryPlatforms.map((platform) => {
                        const topBrands = getTopBrandsForPlatform(platform);
                        if (topBrands.length === 0) return null;

                        return (
                          <div key={platform.name} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Platform Header */}
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                              <h5 className="font-semibold text-gray-900">{platform.name}</h5>
                            </div>

                            {/* Brands Table */}
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Brand
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                      MTD Revenue
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                      MTD GMV
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                      Target
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                      Pacing %
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                      Week Revenue
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {topBrands.map((brand, idx) => (
                                    <tr key={`${platform.name}-${brand.name}-${idx}`} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {brand.name}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                        {formatCurrency(brand.revenue)}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                        {brand.gmv > 0 ? formatCurrency(brand.gmv) : '—'}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                        {brand.target ? formatCurrency(brand.target) : '—'}
                                      </td>
                                      <td className={`px-4 py-3 whitespace-nowrap text-right text-sm font-medium ${brand.pacing ? getPacingColor(brand.pacing) : 'text-gray-400'}`}>
                                        {brand.pacing ? formatPercentage(brand.pacing, 1) : '—'}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                        {brand.weekRevenue ? formatCurrency(brand.weekRevenue) : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Formula Reference */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <strong>Pacing Formula:</strong> (MTD Revenue ÷ Days Accounted) × Days in Month ÷ Target × 100
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Finance Cycle: Weeks run Thursday to Wednesday
          </div>
        </div>
      </div>
    </Layout>
  );
}
