import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Package, Award } from 'lucide-react';
import Layout from '../components/Layout';
import { formatCurrency, formatPercentage, getMonthName } from '../utils/dateUtils';

export default function Insights() {
  const [topBrands, setTopBrands] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsightsData();
  }, []);

  const fetchInsightsData = async () => {
    try {
      // Mock data for demonstration
      const mockData = {
        topBrands: [
          { name: 'Amazon', revenue: 85000, growth: 12.5, platform: 'Skimlinks' },
          { name: 'Sony', revenue: 79000, growth: 15.3, platform: 'Creator Connections' },
          { name: 'Samsung', revenue: 78000, growth: 8.7, platform: 'Creator Connections' },
          { name: 'LG', revenue: 68000, growth: 10.2, platform: 'Creator Connections' },
          { name: 'Walmart', revenue: 62000, growth: 6.4, platform: 'Skimlinks' },
          { name: 'Target', revenue: 53000, growth: -2.1, platform: 'Skimlinks' },
          { name: 'Adidas', revenue: 18000, growth: 22.8, platform: 'Flat Fee' },
          { name: 'Puma', revenue: 16000, growth: 18.5, platform: 'Flat Fee' },
          { name: 'Nike', revenue: 15000, growth: 25.3, platform: 'Flat Fee' },
          { name: 'Best Buy', revenue: 3500, growth: 5.2, platform: 'Other Attribution' },
        ],
        topProducts: [
          { name: 'Samsung 65" QLED TV', revenue: 12500, units: 42, brand: 'Samsung' },
          { name: 'Sony WH-1000XM5 Headphones', revenue: 9800, units: 156, brand: 'Sony' },
          { name: 'LG 55" OLED TV', revenue: 8200, units: 28, brand: 'LG' },
          { name: 'Amazon Echo Dot (5th Gen)', revenue: 7500, units: 425, brand: 'Amazon' },
          { name: 'Nike Air Max 270', revenue: 6200, units: 62, brand: 'Nike' },
          { name: 'Samsung Galaxy Buds Pro', revenue: 5800, units: 145, brand: 'Samsung' },
          { name: 'Adidas Ultraboost 22', revenue: 5200, units: 48, brand: 'Adidas' },
          { name: 'Sony PlayStation 5', revenue: 4800, units: 12, brand: 'Sony' },
          { name: 'LG UltraGear Monitor', revenue: 4500, units: 35, brand: 'LG' },
          { name: 'Walmart Basics Cookware Set', revenue: 3800, units: 285, brand: 'Walmart' },
        ],
        trends: [
          { month: 'Jul', revenue: 420000, target: 450000 },
          { month: 'Aug', revenue: 445000, target: 450000 },
          { month: 'Sep', revenue: 468000, target: 450000 },
          { month: 'Oct', revenue: 492000, target: 475000 },
          { month: 'Nov', revenue: 482000, target: 475000 },
        ],
      };

      setTopBrands(mockData.topBrands);
      setTopProducts(mockData.topProducts);
      setTrends(mockData.trends);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching insights data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading insights...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Insights</h2>
          <p className="text-sm text-gray-500 mt-1">{getMonthName()}</p>
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Revenue Trend (Last 5 Months)
            </h3>
          </div>
          <div className="space-y-3">
            {trends.map((trend, index) => {
              const percentage = (trend.revenue / trend.target) * 100;
              const isAboveTarget = trend.revenue >= trend.target;
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{trend.month}</span>
                    <span className="text-gray-600">
                      {formatCurrency(trend.revenue)} / {formatCurrency(trend.target)}
                    </span>
                  </div>
                  <div className="relative w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isAboveTarget ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    >
                      <div className="flex items-center justify-end h-full pr-2">
                        <span className="text-xs font-medium text-white">
                          {formatPercentage(percentage, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Brands */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Award className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Top Brands</h3>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">
                      Brand
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">
                      Platform
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase pb-2">
                      Revenue
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase pb-2">
                      Growth
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topBrands.map((brand, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium text-gray-900">
                        {brand.name}
                      </td>
                      <td className="py-3 text-xs text-gray-500">
                        {brand.platform}
                      </td>
                      <td className="py-3 text-sm text-right text-gray-700">
                        {formatCurrency(brand.revenue)}
                      </td>
                      <td
                        className={`py-3 text-sm text-right font-medium ${
                          brand.growth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {brand.growth >= 0 ? '+' : ''}
                        {brand.growth.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Package className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">
                      Product
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase pb-2">
                      Units
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase pb-2">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topProducts.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 text-sm text-gray-900">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.brand}</div>
                      </td>
                      <td className="py-3 text-sm text-right text-gray-600">
                        {product.units}
                      </td>
                      <td className="py-3 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center mb-2">
              <DollarSign className="w-6 h-6 mr-2" />
              <h4 className="font-semibold">Avg Revenue per Brand</h4>
            </div>
            <div className="text-3xl font-bold">
              {formatCurrency(
                topBrands.reduce((sum, b) => sum + b.revenue, 0) / topBrands.length
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-6 h-6 mr-2" />
              <h4 className="font-semibold">Avg Growth Rate</h4>
            </div>
            <div className="text-3xl font-bold">
              +
              {(
                topBrands.reduce((sum, b) => sum + b.growth, 0) / topBrands.length
              ).toFixed(1)}
              %
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center mb-2">
              <Package className="w-6 h-6 mr-2" />
              <h4 className="font-semibold">Total Units Sold</h4>
            </div>
            <div className="text-3xl font-bold">
              {topProducts.reduce((sum, p) => sum + p.units, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
