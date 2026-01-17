import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import Layout from '../components/Layout';
import { dashboard, skimlinks } from '../utils/api';
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
  formatWeekLabel,
} from '../utils/dateUtils';

export default function Dashboard() {
  const [platformData, setPlatformData] = useState([]);
  const [expandedPlatforms, setExpandedPlatforms] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [monthSummary, setMonthSummary] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [platformBrands, setPlatformBrands] = useState({});
  const [loadingBrands, setLoadingBrands] = useState({});
  const [skimlinksData, setSkimlinksData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchSkimlinksData();
    }
  }, [selectedMonth]);

  const fetchSkimlinksData = async () => {
    try {
      // Try to fetch from API, fall back to mock data if it fails
      try {
        const data = await skimlinks.getMerchants(selectedMonth);
        setSkimlinksData(data.merchants || []);
      } catch (error) {
        console.log('Using mock Skimlinks data');
        // Mock data for Skimlinks
        setSkimlinksData([
          { name: 'Amazon', revenue: 85000, clicks: 12500, conversions: 450 },
          { name: 'Walmart', revenue: 62000, clicks: 9800, conversions: 320 },
          { name: 'Target', revenue: 53000, clicks: 8200, conversions: 280 },
        ]);
      }
    } catch (error) {
      console.error('Error fetching Skimlinks data:', error);
    }
  };

  const fetchBrandsForPlatform = async (platformName) => {
    if (platformBrands[platformName]) {
      return; // Already fetched
    }

    setLoadingBrands(prev => ({ ...prev, [platformName]: true }));

    try {
      // Try to fetch from API first
      try {
        const data = await dashboard.getBrandsByPlatform(platformName);
        setPlatformBrands(prev => ({
          ...prev,
          [platformName]: data.brands || []
        }));
      } catch (error) {
        console.log('Using mock brand data for', platformName);
        // Fall back to mock data from the platform
        const platform = platformData.find(p => p.name === platformName);
        if (platform && platform.brandDetails) {
          setPlatformBrands(prev => ({
            ...prev,
            [platformName]: platform.brandDetails
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoadingBrands(prev => ({ ...prev, [platformName]: false }));
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Mock data for demonstration (replace with real API calls)
      const mockData = {
        platforms: [
          {
            name: 'Skimlinks',
            mtdRevenue: 200000,
            mtdGMV: 4000000,
            target: 285000,
            weekRevenue: 45000,
            weekGMV: 900000,
            transactions: 237,
            brands: 79,
            brandDetails: [
              {
                name: 'Amazon',
                revenue: 85000,
                gmv: 1700000,
                transactions: 98,
                pacing: 115,
              },
              {
                name: 'Walmart',
                revenue: 62000,
                gmv: 1240000,
                transactions: 67,
                pacing: 95,
              },
              {
                name: 'Target',
                revenue: 53000,
                gmv: 1060000,
                transactions: 72,
                pacing: 88,
              },
            ],
          },
          {
            name: 'Creator Connections',
            mtdRevenue: 225000,
            mtdGMV: 5625000,
            target: 225000,
            weekRevenue: 52000,
            weekGMV: 1300000,
            transactions: 412,
            brands: 124,
            brandDetails: [
              {
                name: 'Samsung',
                revenue: 78000,
                gmv: 1950000,
                transactions: 145,
                pacing: 105,
              },
              {
                name: 'LG',
                revenue: 68000,
                gmv: 1700000,
                transactions: 132,
                pacing: 98,
              },
              {
                name: 'Sony',
                revenue: 79000,
                gmv: 1975000,
                transactions: 135,
                pacing: 110,
              },
            ],
          },
          {
            name: 'Flat Fee',
            mtdRevenue: 49000,
            mtdGMV: 0,
            target: 49417,
            weekRevenue: 12000,
            weekGMV: 0,
            transactions: 8,
            brands: 12,
            brandDetails: [
              {
                name: 'Nike',
                revenue: 15000,
                gmv: 0,
                transactions: 3,
                pacing: 102,
              },
              {
                name: 'Adidas',
                revenue: 18000,
                gmv: 0,
                transactions: 2,
                pacing: 108,
              },
              {
                name: 'Puma',
                revenue: 16000,
                gmv: 0,
                transactions: 3,
                pacing: 98,
              },
            ],
          },
          {
            name: 'Other Attribution',
            mtdRevenue: 8000,
            mtdGMV: 200000,
            target: 8000,
            weekRevenue: 2000,
            weekGMV: 50000,
            transactions: 15,
            brands: 8,
            brandDetails: [
              {
                name: 'Best Buy',
                revenue: 3500,
                gmv: 87500,
                transactions: 6,
                pacing: 105,
              },
              {
                name: 'Home Depot',
                revenue: 2800,
                gmv: 70000,
                transactions: 5,
                pacing: 95,
              },
              {
                name: "Lowe's",
                revenue: 1700,
                gmv: 42500,
                transactions: 4,
                pacing: 88,
              },
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

      // Fetch weekly revenue data (mock for now)
      try {
        const weeklyResponse = await dashboard.getWeeklyRevenue();
        setWeeklyData(weeklyResponse.weeklyData || []);
      } catch (error) {
        console.log('Using mock weekly data');
        // Generate mock weekly data
        const weeks = getLastNWeeks(5);
        const mockWeekly = platformsWithPacing.map(platform => {
          const weekRevenues = weeks.map((week, idx) => {
            // Simulate decreasing revenue for older weeks
            const baseRevenue = platform.weekRevenue;
            const variance = 0.8 + Math.random() * 0.4;
            return Math.floor(baseRevenue * variance);
          });

          return {
            platform: platform.name,
            weeks: weekRevenues
          };
        });
        setWeeklyData(mockWeekly);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const togglePlatform = async (platformName) => {
    const newExpanded = new Set(expandedPlatforms);
    if (newExpanded.has(platformName)) {
      newExpanded.delete(platformName);
    } else {
      newExpanded.add(platformName);
      // Fetch brands when expanding
      await fetchBrandsForPlatform(platformName);
    }
    setExpandedPlatforms(newExpanded);
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500">MTD Revenue vs Target</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(monthSummary.totalRevenue)} / {formatCurrency(monthSummary.totalTarget)}
              </div>
              <div className={`text-lg font-semibold mt-1 ${getPacingColor(monthSummary.overallPacing)}`}>
                {formatPercentage(monthSummary.overallPacing, 1)}
              </div>
              <ProgressBar
                value={monthSummary.totalRevenue}
                max={monthSummary.totalTarget}
                className="mt-2"
              />
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500">MTD GMV</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(monthSummary.totalGMV)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500">Transactions</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {monthSummary.totalTransactions.toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500">Active Brands</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {monthSummary.totalBrands}
              </div>
            </div>
          </div>
        )}

        {/* Week-on-Week Revenue Table */}
        {weeklyData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Weekly Revenue by Platform
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Finance weeks run Thursday to Wednesday
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platform
                    </th>
                    {getLastNWeeks(5).map((week, idx) => (
                      <th
                        key={idx}
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div>{week.label}</div>
                        {idx > 0 && <div className="text-xs text-gray-400">WoW %</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {weeklyData.map((platformWeekly) => {
                    const weeks = platformWeekly.weeks || [];
                    return (
                      <tr key={platformWeekly.platform} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {platformWeekly.platform}
                        </td>
                        {weeks.map((revenue, idx) => {
                          const previousRevenue = idx > 0 ? weeks[idx - 1] : null;
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
                                  className={`text-xs font-medium ${
                                    wowGrowth >= 0 ? 'text-green-600' : 'text-red-600'
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
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Platform Performance Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Platform Performance
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MTD Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MTD GMV
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pacing
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brands
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {platformData.map((platform) => (
                  <React.Fragment key={platform.name}>
                    {/* Platform Row */}
                    <tr
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => togglePlatform(platform.name)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {expandedPlatforms.has(platform.name) ? (
                            <ChevronDown className="w-4 h-4 text-gray-400 mr-2" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                          )}
                          <span className="font-medium text-gray-900">
                            {platform.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                        {formatCurrency(platform.mtdRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                        {platform.mtdGMV > 0 ? formatCurrency(platform.mtdGMV) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                        {formatCurrency(platform.target)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded ${getPacingBgColor(platform.pacing)} font-semibold ${getPacingColor(platform.pacing)}`}>
                          {platform.pacing >= 100 ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          {formatPercentage(platform.pacing, 1)}
                        </div>
                        <ProgressBar
                          value={platform.mtdRevenue}
                          max={platform.target}
                          className="mt-1"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                        {formatCurrency(platform.weekRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                        {platform.transactions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                        {platform.brands}
                      </td>
                    </tr>

                    {/* Expanded Brand Details */}
                    {expandedPlatforms.has(platform.name) && (
                      <>
                        {loadingBrands[platform.name] ? (
                          <tr className="bg-gray-50">
                            <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                              Loading brands...
                            </td>
                          </tr>
                        ) : (
                          <>
                            {/* Brand Header Row */}
                            <tr className="bg-gray-50">
                              <th className="px-6 py-2 pl-12 text-left text-xs font-medium text-gray-500 uppercase">
                                Brand
                              </th>
                              <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Revenue
                              </th>
                              <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                GMV
                              </th>
                              <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                -
                              </th>
                              <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                -
                              </th>
                              <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                -
                              </th>
                              <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Transactions
                              </th>
                              <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                -
                              </th>
                            </tr>
                            {/* Brand Rows */}
                            {(platformBrands[platform.name] || platform.brandDetails || []).map((brand) => (
                              <tr
                                key={brand.name}
                                className="bg-gray-50 hover:bg-gray-100 transition-colors"
                              >
                                <td className="px-6 py-3 pl-12 whitespace-nowrap text-sm text-gray-700">
                                  {brand.name}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-700">
                                  {formatCurrency(brand.revenue)}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                  {brand.gmv > 0 ? formatCurrency(brand.gmv) : '-'}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                  -
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                  -
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                  -
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                  {brand.transactions}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                  -
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Skimlinks Brand Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Skimlinks Brand Performance
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Top performing merchants by revenue
                </p>
              </div>
              <div>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Merchant
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {skimlinksData.length > 0 ? (
                  skimlinksData.map((merchant) => (
                    <tr key={merchant.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {merchant.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                        {formatCurrency(merchant.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                        {merchant.clicks?.toLocaleString() || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                        {merchant.conversions?.toLocaleString() || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                        {merchant.clicks && merchant.conversions
                          ? formatPercentage((merchant.conversions / merchant.clicks) * 100, 2)
                          : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                      No Skimlinks data available for this month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

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
