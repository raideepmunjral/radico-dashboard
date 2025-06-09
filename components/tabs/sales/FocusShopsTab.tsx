'use client';

import React, { useState, useMemo } from 'react';
import { Target, TrendingUp, Users, Star, AlertTriangle, CheckCircle, BarChart3, Filter, Search, Download, Edit3 } from 'lucide-react';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface ShopData {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  total: number;
  eightPM: number;
  verve: number;
  marchTotal?: number;
  marchEightPM?: number;
  marchVerve?: number;
  aprilTotal?: number;
  aprilEightPM?: number;
  aprilVerve?: number;
  mayTotal?: number;
  mayEightPM?: number;
  mayVerve?: number;
  juneTotal?: number;
  juneEightPM?: number;
  juneVerve?: number;
  julyTotal?: number;
  julyEightPM?: number;
  julyVerve?: number;
  growthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
  skuBreakdown?: any[];
  threeMonthAvgTotal?: number;
  threeMonthAvg8PM?: number;
  threeMonthAvgVERVE?: number;
  // NEW: Target fields
  juneTarget8PM?: number;
  julyTarget8PM?: number;
}

interface DashboardData {
  salesData?: Record<string, ShopData>;
  currentMonth?: string;
  currentYear?: string;
}

// 🎯 UPDATED FOCUS SHOPS CONFIGURATION - Updated Focus Shops List (28 shops)
// REMOVED: '01/2024/1521', '01/2024/0440' | ADDED: '01/2024/1397'
const FOCUS_SHOP_CODES = [
  '01/2024/1554', '01/2024/0213', '01/2024/0249', '01/2024/1223', '01/2024/1172',
  '01/2024/0859', '01/2024/1826', '01/2024/0323', '01/2024/1397', '01/2024/1336',
  '01/2024/1247', '01/2024/0892', '01/2024/0913', '01/2024/1499', '01/2024/1510',
  '01/2024/0927', '01/2024/1789', '01/2024/1627', '01/2024/0237', '01/2024/0611',
  '01/2024/1262', '01/2024/1923', '01/2024/0689', '01/2024/0271', '01/2024/0649',
  '01/2024/0345', '01/2024/0318', '01/2024/1612'
];

// 🎯 8PM TARGETS FOR JUNE & JULY 2025 - All 28 Focus Shops
// Shop details (name, department, salesman) automatically come from master sales data
const SHOP_TARGETS: Record<string, { juneTarget8PM: number; julyTarget8PM: number }> = {
  '01/2024/1554': { juneTarget8PM: 70, julyTarget8PM: 100 },
  '01/2024/0213': { juneTarget8PM: 70, julyTarget8PM: 100 },
  '01/2024/0249': { juneTarget8PM: 30, julyTarget8PM: 70 },
  '01/2024/1223': { juneTarget8PM: 30, julyTarget8PM: 70 },
  '01/2024/1172': { juneTarget8PM: 40, julyTarget8PM: 60 },
  '01/2024/0859': { juneTarget8PM: 50, julyTarget8PM: 90 },
  '01/2024/1826': { juneTarget8PM: 50, julyTarget8PM: 100 },
  '01/2024/0323': { juneTarget8PM: 50, julyTarget8PM: 100 },
  '01/2024/1397': { juneTarget8PM: 40, julyTarget8PM: 70 },
  '01/2024/1336': { juneTarget8PM: 50, julyTarget8PM: 100 },
  '01/2024/1247': { juneTarget8PM: 50, julyTarget8PM: 100 },
  '01/2024/0892': { juneTarget8PM: 25, julyTarget8PM: 50 },
  '01/2024/0913': { juneTarget8PM: 25, julyTarget8PM: 50 },
  '01/2024/1499': { juneTarget8PM: 50, julyTarget8PM: 100 },
  '01/2024/1510': { juneTarget8PM: 50, julyTarget8PM: 100 },
  '01/2024/0927': { juneTarget8PM: 30, julyTarget8PM: 75 },
  '01/2024/1789': { juneTarget8PM: 50, julyTarget8PM: 100 },
  '01/2024/1627': { juneTarget8PM: 50, julyTarget8PM: 60 },
  '01/2024/0237': { juneTarget8PM: 50, julyTarget8PM: 60 },
  '01/2024/0611': { juneTarget8PM: 50, julyTarget8PM: 60 },
  '01/2024/1262': { juneTarget8PM: 40, julyTarget8PM: 50 },
  '01/2024/1923': { juneTarget8PM: 50, julyTarget8PM: 100 },
  '01/2024/0689': { juneTarget8PM: 40, julyTarget8PM: 75 },
  '01/2024/0271': { juneTarget8PM: 50, julyTarget8PM: 100 },
  '01/2024/0649': { juneTarget8PM: 40, julyTarget8PM: 80 },
  '01/2024/0345': { juneTarget8PM: 50, julyTarget8PM: 100 },
  '01/2024/0318': { juneTarget8PM: 50, julyTarget8PM: 100 },
  '01/2024/1612': { juneTarget8PM: 50, julyTarget8PM: 60 }
};

// 📝 NOTE: Shop details automatically populated from master sales data
// 📝 TODO: Find actual shop code for "shadahra" shop (DCCWS, Akshay Kumar Gill) to replace '01/2024/1612' if needed

const FocusShopsTab = ({ data }: { data: DashboardData }) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('total'); // total, growth, trend, target_achievement
  const [showEditMode, setShowEditMode] = useState(false);

  // Helper function to calculate target achievement for 8PM
  const calculateTargetAchievement = (shop: ShopData, month: 'june' | 'july'): number => {
    const target = month === 'june' ? shop.juneTarget8PM : shop.julyTarget8PM;
    const actual = month === 'june' ? shop.juneEightPM : shop.julyEightPM;
    
    if (!target || target === 0) return 0;
    return ((actual || 0) / target) * 100;
  };

  // ==========================================
  // MOBILE CARD COMPONENT
  // ==========================================

  const MobileFocusShopCard = ({ shop, index }: { shop: ShopData, index: number }) => {
    const juneAchievement = calculateTargetAchievement(shop, 'june');
    const julyAchievement = calculateTargetAchievement(shop, 'july');
    
    return (
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
        <div className="grid grid-cols-3 gap-2 mb-3 p-3 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-bold text-purple-600">{(shop.juneEightPM || shop.eightPM || 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500">8PM Cases</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-orange-600">{(shop.juneVerve || shop.verve || 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500">VERVE Cases</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-gray-600">
              {((shop.juneTotal || shop.total || 0) - (shop.juneEightPM || shop.eightPM || 0) - (shop.juneVerve || shop.verve || 0)) > 0 
                ? `+${((shop.juneTotal || shop.total || 0) - (shop.juneEightPM || shop.eightPM || 0) - (shop.juneVerve || shop.verve || 0)).toLocaleString()}`
                : '0'
              }
            </div>
            <div className="text-xs text-gray-400">Others</div>
          </div>
        </div>

        {/* Target vs Achievement for 8PM */}
        <div className="mb-3 p-3 bg-purple-50 rounded-lg">
          <div className="text-xs font-medium text-purple-900 mb-2">8PM Target vs Achievement</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-sm font-bold text-purple-600">
                {shop.juneEightPM || 0}/{shop.juneTarget8PM || 0}
              </div>
              <div className="text-xs text-gray-500">June (Target)</div>
              <div className={`text-xs font-semibold ${juneAchievement >= 100 ? 'text-green-600' : juneAchievement >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                {juneAchievement.toFixed(0)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-purple-600">
                {shop.julyEightPM || 0}/{shop.julyTarget8PM || 0}
              </div>
              <div className="text-xs text-gray-500">July (Target)</div>
              <div className={`text-xs font-semibold ${julyAchievement >= 100 ? 'text-green-600' : julyAchievement >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                {julyAchievement.toFixed(0)}%
              </div>
            </div>
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
  };

  // Enhanced filter and enrich data with targets
  const focusShopsData = useMemo((): ShopData[] => {
    if (!data?.salesData) return [];

    const focusShops = (Object.values(data.salesData) as ShopData[])
      .filter((shop: ShopData) => FOCUS_SHOP_CODES.includes(shop.shopId))
      .map((shop: ShopData) => {
        // Enrich with target data
        const targetData = SHOP_TARGETS[shop.shopId];
        return {
          ...shop,
          juneTarget8PM: targetData?.juneTarget8PM || 0,
          julyTarget8PM: targetData?.julyTarget8PM || 0
        };
      })
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
        case 'target_achievement':
          const aAchievement = calculateTargetAchievement(a, 'june');
          const bAchievement = calculateTargetAchievement(b, 'june');
          return bAchievement - aAchievement;
        default: // total
          return (b.total || 0) - (a.total || 0);
      }
    });
  }, [data, searchFilter, sortBy]);

  // Calculate enhanced focus metrics including targets
  const focusMetrics = useMemo(() => {
    if (!focusShopsData.length) return null;

    const totalFocusShops = FOCUS_SHOP_CODES.length;
    const activeFocusShops = focusShopsData.length;
    const totalSales = focusShopsData.reduce((sum: number, shop: ShopData) => sum + (shop.total || 0), 0);
    const total8PM = focusShopsData.reduce((sum: number, shop: ShopData) => sum + (shop.eightPM || 0), 0);
    const totalVERVE = focusShopsData.reduce((sum: number, shop: ShopData) => sum + (shop.verve || 0), 0);
    const avgGrowth = focusShopsData.reduce((sum: number, shop: ShopData) => sum + (shop.growthPercent || 0), 0) / activeFocusShops;
    
    // Target calculations
    const totalJuneTarget8PM = focusShopsData.reduce((sum: number, shop: ShopData) => sum + (shop.juneTarget8PM || 0), 0);
    const totalJulyTarget8PM = focusShopsData.reduce((sum: number, shop: ShopData) => sum + (shop.julyTarget8PM || 0), 0);
    const totalJune8PM = focusShopsData.reduce((sum: number, shop: ShopData) => sum + (shop.juneEightPM || 0), 0);
    const totalJuly8PM = focusShopsData.reduce((sum: number, shop: ShopData) => sum + (shop.julyEightPM || 0), 0);
    
    const juneTargetAchievement = totalJuneTarget8PM > 0 ? (totalJune8PM / totalJuneTarget8PM) * 100 : 0;
    const julyTargetAchievement = totalJulyTarget8PM > 0 ? (totalJuly8PM / totalJulyTarget8PM) * 100 : 0;
    
    const improving = focusShopsData.filter((shop: ShopData) => shop.monthlyTrend === 'improving').length;
    const declining = focusShopsData.filter((shop: ShopData) => shop.monthlyTrend === 'declining').length;
    const stable = focusShopsData.filter((shop: ShopData) => shop.monthlyTrend === 'stable').length;
    const newShops = focusShopsData.filter((shop: ShopData) => shop.monthlyTrend === 'new').length;

    // Count shops achieving targets
    const juneTargetAchievers = focusShopsData.filter((shop: ShopData) => calculateTargetAchievement(shop, 'june') >= 100).length;
    const julyTargetAchievers = focusShopsData.filter((shop: ShopData) => calculateTargetAchievement(shop, 'july') >= 100).length;

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
      coveragePercent: (activeFocusShops / totalFocusShops) * 100,
      totalJuneTarget8PM,
      totalJulyTarget8PM,
      totalJune8PM,
      totalJuly8PM,
      juneTargetAchievement,
      julyTargetAchievement,
      juneTargetAchievers,
      julyTargetAchievers
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
        <p className="text-gray-600 text-sm sm:text-base">Tracking {FOCUS_SHOP_CODES.length} priority shops with 8PM targets</p>
        <div className="mt-2 flex flex-col sm:flex-row justify-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
          <span>Period: {data?.currentMonth ? `${data.currentMonth}/${data.currentYear}` : 'Current Month'}</span>
          <span className="hidden sm:inline">•</span>
          <span>Active: {focusMetrics?.activeFocusShops || 0}/{FOCUS_SHOP_CODES.length}</span>
          <span className="hidden sm:inline">•</span>
          <span>Coverage: {focusMetrics?.coveragePercent?.toFixed(1) || 0}%</span>
        </div>
      </div>

      {/* Enhanced Focus Group Summary with Targets */}
      {focusMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 sm:gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-600">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <div className="text-xl font-bold text-blue-900">{focusMetrics.activeFocusShops}</div>
                <div className="text-sm text-blue-700">Active Focus Shops</div>
                <div className="text-xs text-blue-600">of {focusMetrics.totalFocusShops} tracked</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <div className="text-xl font-bold text-gray-900">{focusMetrics.totalSales.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Cases</div>
                <div className="text-xs text-gray-400">Focus group total</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <div className={`text-xl font-bold ${focusMetrics.avgGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {focusMetrics.avgGrowth >= 0 ? '+' : ''}{focusMetrics.avgGrowth.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Avg Growth</div>
                <div className="text-xs text-gray-400">Month-over-month</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-600">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <div className={`text-xl font-bold ${focusMetrics.juneTargetAchievement >= 100 ? 'text-green-600' : 'text-purple-900'}`}>
                  {focusMetrics.juneTargetAchievement.toFixed(0)}%
                </div>
                <div className="text-sm text-purple-700">June 8PM Target</div>
                <div className="text-xs text-purple-600">{focusMetrics.juneTargetAchievers} shops at 100%+</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-orange-600">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <div className={`text-xl font-bold ${focusMetrics.julyTargetAchievement >= 100 ? 'text-green-600' : 'text-orange-900'}`}>
                  {focusMetrics.julyTargetAchievement.toFixed(0)}%
                </div>
                <div className="text-sm text-orange-700">July 8PM Target</div>
                <div className="text-xs text-orange-600">{focusMetrics.julyTargetAchievers} shops at 100%+</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Users className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <div className="text-xl font-bold text-gray-900">{focusMetrics.improving}</div>
                <div className="text-sm text-gray-500">Improving</div>
                <div className="text-xs text-gray-400">{focusMetrics.declining} declining</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-orange-600">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <div className="text-xl font-bold text-orange-900">{focusMetrics.totalVERVE.toLocaleString()}</div>
                <div className="text-sm text-orange-700">VERVE Cases</div>
                <div className="text-xs text-orange-600">Focus group total</div>
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
                <option value="target_achievement">Sort by Target Achievement</option>
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
            Showing {focusShopsData.length} focus shops • 🎯 8PM Targets: June ({focusMetrics?.totalJuneTarget8PM.toLocaleString()}) | July ({focusMetrics?.totalJulyTarget8PM.toLocaleString()}) • 🟠 VERVE: {focusMetrics?.totalVERVE.toLocaleString()} cases
          </div>
        </div>
      </div>

      {/* Edit Mode Instructions */}
      {showEditMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">📝 Focus Shops & Targets Configuration:</h4>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>✅ <strong>Updated:</strong> {FOCUS_SHOP_CODES.length} shops with June/July 8PM targets</p>
            <p>🔄 <strong>Recent Changes:</strong> ➕ Added: 01/2024/1397 | ➖ Removed: 01/2024/1521, 01/2024/0440</p>
            <p>🔍 <strong>Auto-Detection:</strong> Shop details populated from master sales data automatically</p>
            <p>📊 <strong>Target totals:</strong> June: {focusMetrics?.totalJuneTarget8PM} | July: {focusMetrics?.totalJulyTarget8PM}</p>
            <p>🎯 <strong>Achievement:</strong> June: {focusMetrics?.juneTargetAchievement.toFixed(1)}% | July: {focusMetrics?.julyTargetAchievement.toFixed(1)}%</p>
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
              Priority shops with 8PM targets ranked by {sortBy === 'total' ? 'total sales' : sortBy === 'growth' ? 'growth %' : sortBy === 'target_achievement' ? 'target achievement' : 'trend'} • Shows 8PM, VERVE & others breakdown
            </p>
          </div>
          
          <div className="p-4">
            {focusShopsData.map((shop: ShopData, index: number) => (
              <MobileFocusShopCard key={shop.shopId} shop={shop} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop View - Enhanced Table with Targets */}
      <div className="hidden lg:block bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Focus Shops Detailed Performance</h3>
          <p className="text-sm text-gray-500">Rolling analysis with June/July 8PM targets • Includes VERVE breakdown (Mar-Apr-May-Jun-Jul {data?.currentYear || '2025'})</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">8PM (Jun)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VERVE (Jun)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">8PM Target Jun</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Achievement %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">8PM Target Jul</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Growth %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {focusShopsData.map((shop: ShopData, index: number) => {
                const juneAchievement = calculateTargetAchievement(shop, 'june');
                
                return (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-bold">
                      {(shop.juneEightPM || shop.eightPM || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                      {(shop.juneVerve || shop.verve || 0).toLocaleString()}
                      <div className="text-xs text-gray-400">
                        {((shop.juneTotal || shop.total || 0) - (shop.juneEightPM || shop.eightPM || 0) - (shop.juneVerve || shop.verve || 0)) > 0 
                          ? `+${((shop.juneTotal || shop.total || 0) - (shop.juneEightPM || shop.eightPM || 0) - (shop.juneVerve || shop.verve || 0)).toLocaleString()} others`
                          : 'no others'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-800 font-medium">
                      {shop.juneTarget8PM || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        juneAchievement >= 100 ? 'bg-green-100 text-green-800' :
                        juneAchievement >= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {juneAchievement.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-800 font-medium">
                      {shop.julyTarget8PM || 0}
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Insights with Target Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">8PM Target Performance Analysis</h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">June Target Achievers (100%+)</span>
                <span className="font-medium text-green-600">{focusMetrics?.juneTargetAchievers || 0} shops</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">June Near Miss (80-99%)</span>
                <span className="font-medium text-yellow-600">
                  {focusShopsData.filter(shop => {
                    const achievement = calculateTargetAchievement(shop, 'june');
                    return achievement >= 80 && achievement < 100;
                  }).length} shops
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">June Below Target (&lt;80%)</span>
                <span className="font-medium text-red-600">
                  {focusShopsData.filter(shop => calculateTargetAchievement(shop, 'june') < 80).length} shops
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Overall June Achievement</span>
                  <span className={`font-bold ${focusMetrics && focusMetrics.juneTargetAchievement >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                    {focusMetrics?.juneTargetAchievement.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Priority Actions</h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Target Achievers</div>
                  <div className="text-sm text-gray-600">Maintain momentum, prepare for July targets</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Near Miss Shops</div>
                  <div className="text-sm text-gray-600">Intensive support needed, close to target</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Below Target Shops</div>
                  <div className="text-sm text-gray-600">Immediate intervention required</div>
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
