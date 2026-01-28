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
  const [expandedPlatforms, setExpandedPlatforms] = useState({}); // Track expanded platforms

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
    const mockWeekly = [];

    platformData.forEach(platform => {
      const weekRevenues = weeks.map((week, idx) => {
        // Simulate decreasing revenue for older weeks
        const baseRevenue = platform.weekRevenue || platform.mtdRevenue / 4;
        const variance = 0.8 + Math.random() * 0.4;
        return Math.floor(baseRevenue * variance);
      });

      mockWeekly.push({
        platform: platform.name,
        weeks: weekRevenues
      });

      // Add sub-platforms if they exist
      if (platform.subPlatforms && platform.subPlatforms.length > 0) {
        platform.subPlatforms.forEach(subPlatform => {
          const subWeekRevenues = weeks.map((week, idx) => {
            const baseRevenue = subPlatform.weekRevenue || subPlatform.mtdRevenue / 4;
            const variance = 0.8 + Math.random() * 0.4;
            return Math.floor(baseRevenue * variance);
          });

          mockWeekly.push({
            platform: subPlatform.name,
            weeks: subWeekRevenues
          });
        });
      }
    });

    setWeeklyData(mockWeekly);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const response = await dashboard.getOverview();

      if (!response || !response.platforms) {
        throw new Error('Invalid API response');
      }

      // Map platforms to categories
      const categorizedPlatforms = response.platforms.map(platform => {
        let category = 'other';
        const name = platform.name;

        if (['Creator Connections', 'Levanta', 'Perch', 'PartnerBoost', 'Archer'].includes(name)) {
          category = 'attribution';
        } else if (['Skimlinks', 'Impact', 'Howl', 'BrandAds', 'Other'].includes(name)) {
          category = 'affiliate';
        } else if (name.includes('Flat Fee')) {
          category = 'flatfee';
        }

        return {
          ...platform,
          category,
          // Calculate pacing if not provided by backend
          pacing: platform.pacing || calculatePacing(platform.mtdRevenue, platform.target),
          // Ensure brandDetails is an array if missing
          brandDetails: platform.brandDetails || []
        };
      });

      setPlatformData(categorizedPlatforms);
      setMonthSummary(response.summary);
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

  const togglePlatformExpansion = (platformName) => {
    setExpandedPlatforms(prev => ({
      ...prev,
      [platformName]: !prev[platformName]
    }));
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
                          const platform = platformData.find(p => p.name === platformWeekly.platform);
                          const weeks = [...(platformWeekly.weeks || [])].reverse();
                          const isExpandable = platform?.subPlatforms && platform.subPlatforms.length > 0;
                          const isExpanded = expandedPlatforms[platformWeekly.platform];

                          return (
                            <React.Fragment key={platformWeekly.platform}>
                              <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                  {isExpandable ? (
                                    <button
                                      onClick={() => togglePlatformExpansion(platformWeekly.platform)}
                                      className="flex items-center gap-2 hover:text-blue-600"
                                    >
                                      <span>{isExpanded ? '▼' : '▶'}</span>
                                      {platformWeekly.platform}
                                    </button>
                                  ) : (
                                    platformWeekly.platform
                                  )}
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

                              {/* Sub-platform rows */}
                              {isExpanded && platform.subPlatforms && platform.subPlatforms.map((subPlatform) => {
                                const subWeekly = weeklyData.find(w => w.platform === subPlatform.name);
                                if (!subWeekly) return null;

                                const subWeeks = [...(subWeekly.weeks || [])].reverse();

                                return (
                                  <tr key={subPlatform.name} className="bg-gray-50 hover:bg-gray-100">
                                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 pl-12">
                                      ↳ {subPlatform.name}
                                    </td>
                                    {subWeeks.map((revenue, idx) => {
                                      const previousRevenue = idx < subWeeks.length - 1 ? subWeeks[idx + 1] : null;
                                      const wowGrowth = previousRevenue
                                        ? calculateWoWGrowth(revenue, previousRevenue)
                                        : null;

                                      return (
                                        <td key={idx} className="px-6 py-3 whitespace-nowrap text-right text-sm">
                                          <div className="font-medium text-gray-700">
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
                        const isExpandable = platform.subPlatforms && platform.subPlatforms.length > 0;
                        const isExpanded = expandedPlatforms[platform.name];

                        if (topBrands.length === 0 && !isExpandable) return null;

                        return (
                          <div key={platform.name} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Platform Header */}
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                              {isExpandable ? (
                                <button
                                  onClick={() => togglePlatformExpansion(platform.name)}
                                  className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600"
                                >
                                  <span>{isExpanded ? '▼' : '▶'}</span>
                                  {platform.name}
                                </button>
                              ) : (
                                <h5 className="font-semibold text-gray-900">{platform.name}</h5>
                              )}
                            </div>

                            {/* Flat Fee Partnerships - Special Table */}
                            {platform.category === 'flatfee' && topBrands.length > 0 && (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Platform
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        MTD Revenue
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        Total Contract Revenue
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        GMV to Date
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        Target GMV
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        % to Target
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        Days Left
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        Pacing %
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {topBrands.map((brand, idx) => {
                                      const today = new Date();
                                      const campaignEnd = brand.campaignEndDate ? new Date(brand.campaignEndDate) : new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                      const daysLeft = Math.max(0, Math.ceil((campaignEnd - today) / (1000 * 60 * 60 * 24)));
                                      const daysAccounted = getDaysAccounted();

                                      // GMV-based pacing: (GMV to date ÷ Days Accounted) × Days left ÷ Target GMV × 100
                                      const gmvPacing = brand.targetGMV && daysAccounted > 0
                                        ? ((brand.gmvToDate / daysAccounted) * daysLeft / brand.targetGMV) * 100
                                        : null;

                                      const percentToTarget = brand.targetGMV ? (brand.gmvToDate / brand.targetGMV) * 100 : null;

                                      return (
                                        <tr key={`${platform.name}-${brand.name}-${idx}`} className="hover:bg-gray-50">
                                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {brand.name}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                            {formatCurrency(brand.revenue)}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                            {brand.contractRevenue ? formatCurrency(brand.contractRevenue) : '—'}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                            {brand.gmvToDate ? formatCurrency(brand.gmvToDate) : '—'}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                            {brand.targetGMV ? formatCurrency(brand.targetGMV) : '—'}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                            {percentToTarget !== null ? (
                                              <div className={percentToTarget >= 100 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                                {formatPercentage(percentToTarget, 1)}
                                              </div>
                                            ) : '—'}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                            {daysLeft} days
                                          </td>
                                          <td className={`px-4 py-3 whitespace-nowrap text-right text-sm font-medium ${gmvPacing ? getPacingColor(gmvPacing) : 'text-gray-400'}`}>
                                            {gmvPacing !== null ? formatPercentage(gmvPacing, 1) : '—'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Main Platform Brands Table (for non-flatfee) */}
                            {platform.category !== 'flatfee' && topBrands.length > 0 && (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        Brand
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        Weekly Revenue
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        MTD Revenue
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        MTD GMV
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {topBrands.map((brand, idx) => (
                                      <tr key={`${platform.name}-${brand.name}-${idx}`} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                          {brand.name}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                          {brand.weekRevenue ? formatCurrency(brand.weekRevenue) : '—'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                          {formatCurrency(brand.revenue)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                          {brand.gmv > 0 ? formatCurrency(brand.gmv) : '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Sub-platforms */}
                            {isExpanded && platform.subPlatforms && platform.subPlatforms.map((subPlatform) => {
                              const subBrands = getTopBrandsForPlatform(subPlatform);
                              if (subBrands.length === 0) return null;

                              return (
                                <div key={subPlatform.name} className="border-t border-gray-200">
                                  <div className="bg-gray-100 px-4 py-2">
                                    <h6 className="text-sm font-semibold text-gray-700">↳ {subPlatform.name}</h6>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Brand
                                          </th>
                                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                            Weekly Revenue
                                          </th>
                                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                            MTD Revenue
                                          </th>
                                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                            MTD GMV
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {subBrands.map((brand, idx) => (
                                          <tr key={`${subPlatform.name}-${brand.name}-${idx}`} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700">
                                              {brand.name}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                              {brand.weekRevenue ? formatCurrency(brand.weekRevenue) : '—'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-700">
                                              {formatCurrency(brand.revenue)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                              {brand.gmv > 0 ? formatCurrency(brand.gmv) : '—'}
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
