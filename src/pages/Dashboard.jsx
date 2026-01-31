import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [showOtherAffiliateDetails, setShowOtherAffiliateDetails] = useState(false);
  const [showFlatFeeDetails, setShowFlatFeeDetails] = useState(false);

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

  // Normalize platform names
  const normalizePlatformName = (name) => {
    if (name.toLowerCase() === 'skimbit') return 'Skimlinks';
    return name;
  };

  const generateWeeklyData = async () => {
    if (platformData.length === 0) return;

    try {
      const weeks = getWeekRange(weekRangeStart, weekRangeEnd);
      if (weeks.length === 0) return;

      // Get start and end dates for API call
      const fromWeek = weeks[weeks.length - 1].start.toISOString().split('T')[0];
      const toWeek = weeks[0].end.toISOString().split('T')[0];

      // Fetch real weekly revenue data from API
      const response = await dashboard.getWeeklyRevenue(fromWeek, toWeek);

      if (!response.success || !response.data) {
        console.error('Failed to fetch weekly revenue data');
        return;
      }

      // Transform API data to match component structure
      const weeklyDataFormatted = response.data.map(weeklyPlatformData => {
        // Create a map of dates to revenues
        const revenueByDate = {};
        weeklyPlatformData.weekRevenues.forEach(wr => {
          revenueByDate[wr.date] = wr.revenue;
        });

        // Map weeks to revenues in correct order
        const weekRevenues = weeks.map(week => {
          const weekStart = week.start.toISOString().split('T')[0];
          return revenueByDate[weekStart] || 0;
        });

        // Find platform category from state platformData
        const platformName = weeklyPlatformData.platform;
        const platformInfo = platformData.find(p => p.name === platformName);
        const category = platformInfo?.category || 'unknown';

        return {
          platform: weeklyPlatformData.platform,
          category: category,
          weeks: weekRevenues,
        };
      });

      setWeeklyData(weeklyDataFormatted);
    } catch (error) {
      console.error('Error generating weekly data:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch real data from API
      const overviewResponse = await dashboard.getOverview();

      if (!overviewResponse || !overviewResponse.platforms) {
        console.error('Failed to fetch dashboard overview');
        setLoading(false);
        return;
      }

      const {
        platforms: rawPlatforms,
        summary,
        platformsByCategory,
      } = overviewResponse;

      // Normalize platform names and prepare data
      const normalizedPlatforms = rawPlatforms.map(platform => ({
        name: normalizePlatformName(platform.name),
        mtdRevenue: platform.mtdRevenue || 0,
        mtdGMV: platform.mtdGmv || 0,
        target: platform.targetGmv || 0,
        weekRevenue: platform.weeklyRevenue || 0,
        weekGMV: 0, // Not currently tracked
        transactions: 0, // Not currently tracked
        brands: platform.brandCount || 0,
        category: platform.category || 'attribution',
        pacing: platform.pacing || 0,
        brandDetails: (platform.brands || []).map(brand => ({
          name: brand.brand,
          revenue: brand.mtdRevenue,
          gmv: brand.mtdGmv,
          transactions: 0, // Not currently tracked
          target: brand.targetGmv,
          weekRevenue: brand.weeklyRevenue,
          totalContractRevenue: brand.totalContractRevenue,
          pctToTarget: brand.pctToTarget,
          pacingPct: brand.pacingPct,
          daysLeft: brand.daysLeft,
        })),
      }));

      setPlatformData(normalizedPlatforms);

      // Set month summary
      setMonthSummary({
        totalRevenue: summary.totalRevenue || 0,
        totalTarget: summary.totalTarget || 0,
        totalGMV: summary.totalGMV || 0,
        totalTransactions: 0, // Not currently tracked
        totalBrands: summary.totalBrands || 0,
        overallPacing: summary.overallPacing || 0,
        daysAccounted: summary.daysAccounted || getDaysAccounted(),
        daysInMonth: summary.daysInMonth || getDaysInMonth(),
      });

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

    const daysAccounted = getDaysAccounted();
    const daysInMonth = getDaysInMonth();
    const daysLeft = daysInMonth - daysAccounted;

    // Sort by MTD revenue descending and take top N
    return brands
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map(brand => {
        // Map old fields to new structure
        const mtdRevenue = brand.revenue;
        const mtdGmv = brand.gmv;
        const targetGmv = brand.target || 0;
        const weeklyRevenue = brand.weekRevenue || 0;

        // Stub totalContractRevenue as 2.5x the target (typical contract structure)
        const totalContractRevenue = targetGmv * 2.5;

        // Calculate % to Target
        const pctToTarget = targetGmv > 0 ? (mtdGmv / targetGmv) * 100 : 0;

        // Calculate new pacing formula: ((mtdGmv / daysAccounted) * daysLeft / targetGmv) * 100
        const pacingPct = (targetGmv > 0 && daysAccounted > 0)
          ? ((mtdGmv / daysAccounted) * daysLeft / targetGmv) * 100
          : 0;

        return {
          brand: brand.name,
          weeklyRevenue,
          mtdRevenue,
          totalContractRevenue,
          mtdGmv,
          targetGmv,
          pctToTarget,
          daysLeft,
          pacingPct,
          daysAccounted
        };
      });
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'attribution': 'Attribution Partners',
      'affiliate': 'Affiliate Partners', // Changed from "Affiliate Platforms"
      'flatfee': 'Flat Fee Partnerships'
    };
    return labels[category] || category;
  };

  // Helper to get organized weekly data (no category grouping)
  const getOrganizedWeeklyData = () => {
    // Define platforms to show explicitly
    const mainPlatforms = ['Skimlinks', 'Impact', 'Howl', 'BrandAds'];

    // Platforms that go into "Other"
    const otherPlatformNames = ['Awin', 'Partnerize', 'Connexity', 'Apple', 'Rakuten'];

    // Get main platforms
    const main = weeklyData.filter(pw => mainPlatforms.includes(pw.platform));

    // Get "Other" platforms (affiliate platforms not in main list)
    const otherPlatforms = weeklyData.filter(pw => {
      const platform = platformData.find(p => p.name === pw.platform);
      // Include if it's in otherPlatformNames OR if it's affiliate/attribution but not in main
      return (
        otherPlatformNames.includes(pw.platform) ||
        (platform?.category === 'affiliate' && !mainPlatforms.includes(pw.platform) && !otherPlatformNames.includes(pw.platform)) ||
        (platform?.category === 'attribution' && !mainPlatforms.includes(pw.platform) && !otherPlatformNames.includes(pw.platform))
      );
    });

    // Aggregate "Other" platforms
    let otherAggregate = null;
    if (otherPlatforms.length > 0) {
      const numWeeks = otherPlatforms[0]?.weeks?.length || 0;
      const aggregatedWeeks = Array(numWeeks).fill(0);

      otherPlatforms.forEach(pw => {
        pw.weeks.forEach((revenue, idx) => {
          aggregatedWeeks[idx] += revenue;
        });
      });

      otherAggregate = {
        platform: 'Other',
        weeks: aggregatedWeeks,
        isAggregate: true,
        details: otherPlatforms
      };
    }

    return { main, otherAggregate };
  };

  // Helper to aggregate flat fee platforms
  const getFlatFeeWeeklyData = () => {
    const flatFeeData = weeklyData.filter(pw => {
      const platform = platformData.find(p => p.name === pw.platform);
      return platform?.category === 'flatfee';
    });

    if (flatFeeData.length === 0) return null;

    const numWeeks = flatFeeData[0]?.weeks?.length || 0;
    const aggregatedWeeks = Array(numWeeks).fill(0);

    flatFeeData.forEach(pw => {
      pw.weeks.forEach((revenue, idx) => {
        aggregatedWeeks[idx] += revenue;
      });
    });

    return {
      platform: 'Flat Fee Deals',
      category: 'flatfee',
      weeks: aggregatedWeeks,
      isAggregate: true,
      details: flatFeeData
    };
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

  // Get weeks for display (reversed - newest first)
  const weeks = getWeekRange(weekRangeStart, weekRangeEnd);
 const displayWeeks = weeks;
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Dashboard</h1>
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
              {(() => {
                const percentOfGoal = (monthSummary.totalRevenue / monthSummary.totalTarget) * 100;
                return (
                  <div className={`text-lg font-semibold mt-1 ${getPacingColor(percentOfGoal)}`}>
                    {formatPercentage(percentOfGoal, 1)} of goal
                  </div>
                );
              })()}
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
                    {displayWeeks.map((week, idx) => (
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
                  {/* Main platforms (no category grouping) */}
                  {(() => {
                    const { main, otherAggregate } = getOrganizedWeeklyData();

                    return (
                      <>
                        {/* Main platforms */}
                        {main.map((platformWeekly) => {
                          const weeks = platformWeekly.weeks || [];
                          const reversedWeeks = [...weeks].reverse();
                          return (
                            <tr key={platformWeekly.platform} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                {platformWeekly.platform}
                              </td>
                              {reversedWeeks.map((revenue, idx) => {
                                const previousRevenue = idx > 0 ? reversedWeeks[idx - 1] : null;
                                const wowGrowth = previousRevenue
                                  ? calculateWoWGrowth(revenue, previousRevenue)
                                  : null;

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

                        {/* "Other" aggregate row with expandable details */}
                        {otherAggregate && (
                          <>
                            <tr
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => setShowOtherAffiliateDetails(!showOtherAffiliateDetails)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                <div className="flex items-center">
                                  {showOtherAffiliateDetails ? (
                                    <ChevronDown className="w-4 h-4 mr-2" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 mr-2" />
                                  )}
                                  Other
                                </div>
                              </td>
                              {[...otherAggregate.weeks].reverse().map((revenue, idx) => {
                                const reversedWeeks = [...otherAggregate.weeks].reverse();
                                const previousRevenue = idx > 0 ? reversedWeeks[idx - 1] : null;
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
                            {/* Expandable "Other" details */}
                            {showOtherAffiliateDetails && otherAggregate.details.map((detail) => {
                              const reversedWeeks = [...detail.weeks].reverse();
                              return (
                                <tr key={detail.platform} className="bg-gray-50 hover:bg-gray-100">
                                  <td className="px-6 py-3 pl-12 whitespace-nowrap text-sm text-gray-700">
                                    {detail.platform}
                                  </td>
                                  {reversedWeeks.map((revenue, idx) => {
                                    const previousRevenue = idx > 0 ? reversedWeeks[idx - 1] : null;
                                    const wowGrowth = previousRevenue
                                      ? calculateWoWGrowth(revenue, previousRevenue)
                                      : null;

                                    return (
                                      <td key={idx} className="px-6 py-3 whitespace-nowrap text-right text-sm">
                                        <div className="font-semibold text-gray-700">
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
                          </>
                        )}

                        {/* Flat Fee Deals (single aggregated row) */}
                        {(() => {
                          const flatFeeAggregate = getFlatFeeWeeklyData();
                          if (!flatFeeAggregate) return null;

                          return (
                            <>
                              <tr
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => setShowFlatFeeDetails(!showFlatFeeDetails)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                  <div className="flex items-center">
                                    {showFlatFeeDetails ? (
                                      <ChevronDown className="w-4 h-4 mr-2" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 mr-2" />
                                    )}
                                    Flat Fee Deals
                                  </div>
                                </td>
                                {[...flatFeeAggregate.weeks].reverse().map((revenue, idx) => {
                                  const reversedWeeks = [...flatFeeAggregate.weeks].reverse();
                                  const previousRevenue = idx > 0 ? reversedWeeks[idx - 1] : null;
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
                              {/* Expandable flat fee details */}
                              {showFlatFeeDetails && flatFeeAggregate.details.map((detail) => {
                                const reversedWeeks = [...detail.weeks].reverse();
                                return (
                                  <tr key={detail.platform} className="bg-gray-50 hover:bg-gray-100">
                                    <td className="px-6 py-3 pl-12 whitespace-nowrap text-sm text-gray-700">
                                      {detail.platform}
                                    </td>
                                    {reversedWeeks.map((revenue, idx) => {
                                      const previousRevenue = idx > 0 ? reversedWeeks[idx - 1] : null;
                                      const wowGrowth = previousRevenue
                                        ? calculateWoWGrowth(revenue, previousRevenue)
                                        : null;

                                      return (
                                        <td key={idx} className="px-6 py-3 whitespace-nowrap text-right text-sm">
                                          <div className="font-semibold text-gray-700">
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
                            </>
                          );
                        })()}
                      </>
                    );
                  })()}
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

                            {/* Brands Table */}
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
                                      % to Target
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                      Pacing
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                      MTD GMV
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {topBrands.map((brand, idx) => (
                                    <tr key={`${platform.name}-${brand.brand}-${idx}`} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {brand.brand}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                        {formatCurrency(brand.weeklyRevenue)}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                        {formatCurrency(brand.mtdRevenue)}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                        {brand.pctToTarget.toFixed(1)}%
                                      </td>
                                      <td className={`px-4 py-3 whitespace-nowrap text-right text-sm font-medium ${getPacingColor(brand.pacingPct)}`}>
                                        {brand.pacingPct.toFixed(1)}%
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                                        {brand.mtdGmv > 0 ? formatCurrency(brand.mtdGmv) : '—'}
                                      </td>
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

        {/* Flat Fee Performance Section */}
        {(() => {
          const flatFeePlatforms = getPlatformsByCategory('flatfee');
          if (flatFeePlatforms.length === 0) return null;

          const daysAccounted = getDaysAccounted();
          const daysInMonth = getDaysInMonth();
          const daysLeft = daysInMonth - daysAccounted;

          // Aggregate all flat fee data
          const flatFeeData = flatFeePlatforms.flatMap(platform => {
            const topBrands = getTopBrandsForPlatform(platform);
            return topBrands.map(brand => ({
              platform: brand.brand, // Use brand name as platform
              mtdRevenue: brand.mtdRevenue,
              totalContractRevenue: brand.totalContractRevenue,
              mtdGmv: brand.mtdGmv,
              targetGmv: brand.targetGmv,
              pctToTarget: brand.pctToTarget,
              daysLeft: daysLeft,
              pacingPct: brand.pacingPct,
            }));
          });

          if (flatFeeData.length === 0) return null;

          return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Flat Fee Performance
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Combined flat fee partnership performance metrics
                </p>
              </div>

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
                        Days Left in Campaign
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Pacing
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {flatFeeData.map((item, idx) => (
                      <tr key={`flatfee-${item.platform}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.platform}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                          {formatCurrency(item.mtdRevenue)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                          {formatCurrency(item.totalContractRevenue)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                          {item.mtdGmv > 0 ? formatCurrency(item.mtdGmv) : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                          {item.targetGmv > 0 ? formatCurrency(item.targetGmv) : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {item.pctToTarget.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                          {item.daysLeft}
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap text-right text-sm font-medium ${getPacingColor(item.pacingPct)}`}>
                          {item.pacingPct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Formula Reference */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <strong>Pacing Formula:</strong> ((GMV to Date ÷ Days Accounted) × Days Left ÷ Target GMV) × 100
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Finance Cycle: Weeks run Thursday to Wednesday
          </div>
        </div>
      </div>
    </Layout>
  );
}
