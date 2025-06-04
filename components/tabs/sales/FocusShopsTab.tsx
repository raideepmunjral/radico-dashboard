'use client';

import React, { useState, useMemo } from 'react';
import { Target, TrendingUp, Users, MapPin, Star, AlertTriangle, CheckCircle, BarChart3, Filter, Search, Download, Edit3 } from 'lucide-react';

// 🎯 UPDATED FOCUS SHOPS CONFIGURATION - Your Complete List
const FOCUS_SHOP_CODES = [
  '01/2024/1034', '01/2024/1041', '01/2024/0498', '01/2024/1458', '01/2024/1176', '01/2024/1480',
  '01/2024/0507', '01/2024/1612', '01/2024/0352', '01/2024/1900', '01/2024/0692', '01/2024/1417',
  '01/2024/0799', '01/2024/0867', '01/2024/0832', '01/2024/0611', '01/2024/0679', '01/2024/1839',
  '01/2024/1183', '01/2024/1951', '01/2024/1539', '01/2024/1365', '01/2024/1258', '01/2024/1323',
  '01/2024/0237', '01/2024/1250', '01/2024/1083', '01/2024/0551', '01/2024/1058', '01/2024/1066',
  '01/2024/1271', '01/2024/1254', '01/2024/1262', '01/2024/1105', '01/2024/0297', '01/2024/0232',
  '01/2024/2898', '01/2024/0374', '01/2024/0390', '01/2024/0310', '01/2024/0416', '01/2024/1601',
  '01/2024/0405', '01/2024/1923', '01/2024/1177', '01/2024/1426', '01/2024/0736', '01/2024/1404',
  '01/2024/0271', '01/2024/1115', '01/2024/1284', '01/2024/0334', '01/2024/0322', '01/2024/0256',
  '01/2024/2918', '01/2024/2910', '01/2024/0247', '01/2024/0664', '01/2024/0684', '01/2024/1208',
  '01/2024/0241', '01/2024/0233', '01/2024/1310', '01/2024/1040', '01/2024/1484', '01/2024/0501',
  '01/2024/0465', '01/2024/2807', '01/2024/0816', '01/2024/2937', '01/2024/0189', '01/2024/2912',
  '01/2024/2913', '01/2024/0276', '01/2024/1515', '01/2024/1523', '01/2024/0454', '01/2024/0279',
  '01/2024/1537', '01/2024/0812', '01/2024/0417', '01/2024/0689', '01/2024/0440', '01/2024/0369',
  '01/2024/0205', '01/2024/0796'
];

const FocusShopsTab = ({ data }: { data: DashboardData }) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('total'); // total, growth, trend
  const [showEditMode, setShowEditMode] = useState(false);

  // ==========================================
  // MOBILE CARD COMPONENT
  // ==========================================

  const MobileFocusShopCard = ({ shop, index }: { shop: ShopData, index: number }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <span className="text-lg font-bold text-gray-900 mr-2">#{index + 1}</span>
            {index < 3 && (
              <span>
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
              </span>
            )}
            {index < 5 && <Star className="w-4 h-4 text-yellow-500 ml-1" />}
          </div>
          <h3 className="font-medium text-gray-900 text-sm leading-tight">{shop.shopName}</h3>
          <p className="text-xs text-gray-500">{shop.shopId}</p>
          <p className="text-xs text-gray-500">{shop.department} • {shop.salesman}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">{(shop.juneTotal || shop.total || 0).toLocaleString()}</div>
          <div className="text-xs text-gray-500">Total Cases</div>
        </div>
      </div>
      
      {/* Current Month Performance */}
      <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-blue-50 rounded-lg">
        <div className="text-center">
          <div className="text-sm font-bold text-purple-600">{(shop.juneEightPM || shop.eightPM || 0).toLocaleString()}</div>
          <div className="text-xs text-gray-500">8PM Cases</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-orange-600">{(shop.juneVerve || shop.verve || 0).toLocaleString()}</div>
          <div className="text-xs text-gray-500">VERVE Cases</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-sm font-bold text-blue-600">
            {shop.threeMonthAvgTotal?.toFixed(1) || 
             (((shop.marchTotal || 0) + (shop.aprilTotal || 0) + (shop.mayTotal || 0)) / 3).toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">3M Avg</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className={`text-sm font-bold ${
            (shop.growthPercent || 0) > 0 ? 'text-green-600' : 
            (shop.growthPercent || 0) < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {(shop.growthPercent || 0) >= 0 ? '+' : ''}{(shop.growthPercent || 0).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Growth</div>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="flex justify-center">
        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
          shop.monthlyTrend === 'improving' ? 'bg-green-100 text-green-800' :
          shop.monthlyTrend === 'declining' ? 'bg-red-100 text-red-800' :
          shop.monthlyTrend === 'new' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {shop.monthlyTrend === 'improving' ? '📈 Growing' :
           shop.monthlyTrend === 'declining' ? '📉 Declining' :
           shop.monthlyTrend === 'new' ? '✨ New' : '➡️ Stable'}
        </span>
      </div>
    </div>
  );

  // Filter data to show only focus shops
  const focusShopsData = useMemo((): ShopData[] => {
    if (!data?.salesData) return [];

    const focusShops = (Object.values(data.salesData) as ShopData[])
      .filter((shop: ShopData) => FOCUS_SHOP_CODES.includes(shop.shopId))
      .filter((shop: ShopData) => 
        !searchFilter || 
        shop.shopName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        shop.department.toLowerCase().includes(searchFilter.toLowerCase()) ||
        shop.salesman.toLowerCase().includes(searchFilter.toLowerCase())
      );

    // Sort focus shops
    return focusShops.sort((a: ShopData, b: ShopData) => {
      switch (sortBy) {
        case 'growth':
          return (b.growthPercent || 0) - (a.growthPercent || 0);
        case 'trend':
          const trendOrder = { improving: 3, stable: 2, declining: 1, new: 0 };
          return (trendOrder[b.monthlyTrend as keyof typeof trendOrder] || 0) - 
                 (trendOrder[a.monthlyTrend as keyof typeof trendOrder] || 0);
        default: // total
          return (b.total || 0) - (a.total || 0);
      }
    });
  }, [data, searchFilter, sortBy]);

  // Calculate focus group metrics
  const focusMetrics = useMemo(() => {
    if (!focusShopsData.length) return null;

    const totalFocusShops = FOCUS_SHOP_CODES.length;
    const activeFocusShops = focusShopsData.length;
    const totalSales = focusShopsData.reduce((sum: number, shop: ShopData) => sum + (shop.total || 0), 0);
    const total8PM = focusShopsData.reduce((sum: number, shop: ShopData) => sum + (shop.eightPM || 0), 0);
    const totalVERVE = focusShopsData.reduce((sum: number, shop: ShopData) => sum + (shop.verve || 0), 0);
    const avgGrowth = focusShopsData.reduce((sum: number, shop: ShopData) => sum + (shop.growthPercent || 0), 0) / activeFocusShops;
    
    const improving = focusShopsData.filter((shop: ShopData) => shop.monthlyTrend === 'improving').length;
    const declining = focusShopsData.filter((shop: ShopData) => shop.monthlyTrend === 'declining').length;
    const stable = focusShopsData.filter((shop: ShopData) => shop.monthlyTrend === 'stable').length;
    const newShops = focusShopsData.filter((shop: ShopData) => shop.monthlyTrend === 'new').length;

    return {
      totalFocusShops,
      activeFocusShops,
      totalSales,
      total8PM,
      totalVERVE,
      avgGrowth,
      improving,
      declining,
      stable,
      newShops,
      coveragePercent: (activeFocusShops / totalFocusShops) * 100
    };
  }, [focusShopsData]);

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Target className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Focus Shops Performance</h2>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">Tracking {FOCUS_SHOP_CODES.length} priority shops for detailed analysis</p>
        <div className="mt-2 flex flex-col sm:flex-row justify-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
          <span>Period: {data?.currentMonth ? `${data.currentMonth}/${data.currentYear}` : 'Current Month'}</span>
          <span className="hidden sm:inline">•</span>
          <span>Active: {focusMetrics?.activeFocusShops || 0}/{FOCUS_SHOP_CODES.length}</span>
          <span className="hidden sm:inline">•</span>
          <span>Coverage: {focusMetrics?.coveragePercent?.toFixed(1) || 0}%</span>
        </div>
      </div>

      {/* Focus Group Summary - Mobile Responsive */}
      {focusMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-lg bg-blue-600">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="ml-3 sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-blue-900">{focusMetrics.activeFocusShops}</div>
                <div className="text-sm text-blue-700">Active Focus Shops</div>
                <div className="text-xs text-blue-600">of {focusMetrics.totalFocusShops} tracked</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-lg bg-green-100">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{focusMetrics.totalSales.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Cases</div>
                <div className="text-xs text-gray-400">Focus group total</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <div className={`text-xl sm:text-2xl font-bold ${focusMetrics.avgGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {focusMetrics.avgGrowth >= 0 ? '+' : ''}{focusMetrics.avgGrowth.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Avg Growth</div>
                <div className="text-xs text-gray-400">Month-over-month</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-lg bg-orange-100">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{focusMetrics.improving}</div>
                <div className="text-sm text-gray-500">Improving</div>
                <div className="text-xs text-gray-400">{focusMetrics.declining} declining</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-lg bg-yellow-100">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{focusMetrics.stable}</div>
                <div className="text-sm text-gray-500">Stable</div>
                <div className="text-xs text-gray-400">{focusMetrics.newShops} new shops</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls - Mobile Responsive */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="space-y-4">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search focus shops..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="total">Sort by Total Sales</option>
                <option value="growth">Sort by Growth %</option>
                <option value="trend">Sort by Trend</option>
              </select>

              <button
                onClick={() => setShowEditMode(!showEditMode)}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center space-x-2 text-sm"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Focus List</span>
                <span className="sm:hidden">Edit</span>
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500 text-center sm:text-left">
            Showing {focusShopsData.length} focus shops
          </div>
        </div>
      </div>

      {/* Edit Mode Instructions - Mobile Responsive */}
      {showEditMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">📝 How to Update Focus Shops List:</h4>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>1. Open <code className="bg-yellow-100 px-1 rounded text-xs">components/tabs/sales/FocusShopsTab.tsx</code></p>
            <p>2. Find the <code className="bg-yellow-100 px-1 rounded text-xs">FOCUS_SHOP_CODES</code> array at the top</p>
            <p>3. Add, remove, or modify shop codes as needed</p>
            <p>4. Save the file - changes will appear immediately</p>
            <p>5. Current tracking: <strong>{FOCUS_SHOP_CODES.length} shops</strong></p>
          </div>
        </div>
      )}

      {/* Mobile View - Card Layout */}
      <div className="block lg:hidden">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Focus Shops - Mobile View
            </h3>
            <p className="text-sm text-gray-500">
              Priority shops ranked by {sortBy === 'total' ? 'total sales' : sortBy === 'growth' ? 'growth %' : 'trend'}
            </p>
          </div>
          
          <div className="p-4">
            {focusShopsData.map((shop: ShopData, index: number) => (
              <MobileFocusShopCard key={shop.shopId} shop={shop} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop View - Enhanced Table */}
      <div className="hidden lg:block bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Focus Shops Detailed Performance</h3>
          <p className="text-sm text-gray-500">Rolling 4-month analysis for priority shops (Mar-Apr-May-Jun {data?.currentYear || '2025'})</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">8PM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VERVE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Growth %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">3M Avg</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {focusShopsData.map((shop: ShopData, index: number) => (
                <tr key={shop.shopId} className={`${index < 5 ? 'bg-green-50' : ''} hover:bg-gray-50`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      {index + 1}
                      {index < 3 && (
                        <span className="ml-2">
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                        </span>
                      )}
                      {index < 5 && <Star className="w-4 h-4 text-yellow-500 ml-1" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-900 max-w-xs truncate">{shop.shopName}</div>
                      <div className="text-gray-500 text-xs">{shop.shopId}</div>
                      <div className="text-gray-500 text-xs">{shop.salesman}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {(shop.juneTotal || shop.total || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                    {(shop.juneEightPM || shop.eightPM || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                    {(shop.juneVerve || shop.verve || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (shop.growthPercent || 0) > 0 
                        ? 'bg-green-100 text-green-800' 
                        : (shop.growthPercent || 0) < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {(shop.growthPercent || 0) >= 0 ? '+' : ''}{(shop.growthPercent || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      shop.monthlyTrend === 'improving' ? 'bg-green-100 text-green-800' :
                      shop.monthlyTrend === 'declining' ? 'bg-red-100 text-red-800' :
                      shop.monthlyTrend === 'new' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {shop.monthlyTrend === 'improving' ? '📈 Growing' :
                       shop.monthlyTrend === 'declining' ? '📉 Declining' :
                       shop.monthlyTrend === 'new' ? '✨ New' : '➡️ Stable'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {shop.threeMonthAvgTotal?.toFixed(1) || 
                     (((shop.marchTotal || 0) + (shop.aprilTotal || 0) + (shop.mayTotal || 0)) / 3).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Focus Group Insights - Mobile Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Focus Group Performance Distribution</h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Top Performers (Top 25%)</span>
                <span className="font-medium text-green-600">{Math.ceil(focusShopsData.length * 0.25)} shops</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Good Performers (25-50%)</span>
                <span className="font-medium text-blue-600">{Math.floor(focusShopsData.length * 0.25)} shops</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Performers (50-75%)</span>
                <span className="font-medium text-yellow-600">{Math.floor(focusShopsData.length * 0.25)} shops</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Needs Attention (Bottom 25%)</span>
                <span className="font-medium text-red-600">{Math.floor(focusShopsData.length * 0.25)} shops</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Action Items</h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">High Performers</div>
                  <div className="text-sm text-gray-600">Maintain momentum, consider expansion</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Declining Trends</div>
                  <div className="text-sm text-gray-600">Investigate causes, implement recovery plan</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Growth Opportunities</div>
                  <div className="text-sm text-gray-600">Focus on stable shops with potential</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusShopsTab;
