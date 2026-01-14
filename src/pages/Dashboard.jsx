import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
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
} from '../utils/dateUtils';

export default function Dashboard() {
  const [platformData, setPlatformData] = useState([]);
  const [expandedPlatforms, setExpandedPlatforms] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [monthSummary, setMonthSummary] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const togglePlatform = (platformName) => {
    const newExpanded = new Set(expandedPlatforms);
    if (newExpanded.has(platformName)) {
      newExpanded.delete(platformName);
    } else {
      newExpanded.add(platformName);
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
              <div className="text-sm text-gray-500">MTD Revenue</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(monthSummary.totalRevenue)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Target: {formatCurrency(monthSummary.totalTarget)}
              </div>
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
                      <td className={`px-6 py-4 whitespace-nowrap text-right font-semibold ${getPacingColor(platform.pacing)}`}>
                        <div className={`inline-flex items-center px-2 py-1 rounded ${getPacingBgColor(platform.pacing)}`}>
                          {platform.pacing >= 100 ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          {formatPercentage(platform.pacing, 1)}
                        </div>
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
                            Pacing
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
                        {platform.brandDetails.map((brand) => (
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
                            <td className={`px-6 py-3 whitespace-nowrap text-right text-sm font-medium ${getPacingColor(brand.pacing)}`}>
                              {formatPercentage(brand.pacing, 1)}
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
                  </React.Fragment>
                ))}
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
