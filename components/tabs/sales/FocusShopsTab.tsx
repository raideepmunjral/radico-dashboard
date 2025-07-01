// ==========================================
// 🎯 DYNAMIC FOCUS SHOPS TAB - FULLY FUTURE-PROOF
// ==========================================
// ✅ FEATURES:
// - Shows June COMPLETED performance (cases sold + achievement %)
// - Shows current month LIVE progress (July, August, etc.)
// - Dynamic month detection - works for any month automatically
// - Fixed ranking - shops ranked by current month performance
// - Real targets only (June & July 2025) - no fabricated data
// - Future-ready - easily extend targets via Google Sheets/database
// ==========================================

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
  augustTotal?: number;
  augustEightPM?: number;
  augustVerve?: number;
  septemberTotal?: number;
  septemberEightPM?: number;
  septemberVerve?: number;
  octoberTotal?: number;
  octoberEightPM?: number;
  octoberVerve?: number;
  novemberTotal?: number;
  novemberEightPM?: number;
  novemberVerve?: number;
  decemberTotal?: number;
  decemberEightPM?: number;
  decemberVerve?: number;
  growthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
  skuBreakdown?: any[];
  threeMonthAvgTotal?: number;
  threeMonthAvg8PM?: number;
  threeMonthAvgVERVE?: number;
  // Dynamic target fields
  [key: string]: any; // Allows dynamic target field access
}

interface DashboardData {
  salesData?: Record<string, ShopData>;
  currentMonth?: string;
  currentYear?: string;
}

// 🎯 UPDATED FOCUS SHOPS CONFIGURATION - Updated Focus Shops List (28 shops)
const FOCUS_SHOP_CODES = [
  '01/2024/1554', '01/2024/0213', '01/2024/0249', '01/2024/1223', '01/2024/1172',
  '01/2024/0859', '01/2024/1826', '01/2024/0323', '01/2024/1397', '01/2024/1336',
  '01/2024/1247', '01/2024/0892', '01/2024/0913', '01/2024/1499', '01/2024/1510',
  '01/2024/0927', '01/2024/1789', '01/2024/1627', '01/2024/0237', '01/2024/0611',
  '01/2024/1262', '01/2024/1923', '01/2024/0689', '01/2024/0271', '01/2024/0649',
  '01/2024/0345', '01/2024/0318', '01/2024/1612'
];

// 🎯 REAL 8PM TARGETS - Only June & July 2025 (actual targets from your data)
const SHOP_TARGETS: Record<string, Record<string, number>> = {
  '01/2024/1554': { '06': 70, '07': 100 },
  '01/2024/0213': { '06': 70, '07': 100 },
  '01/2024/0249': { '06': 30, '07': 70 },
  '01/2024/1223': { '06': 30, '07': 70 },
  '01/2024/1172': { '06': 40, '07': 60 },
  '01/2024/0859': { '06': 50, '07': 90 },
  '01/2024/1826': { '06': 50, '07': 100 },
  '01/2024/0323': { '06': 50, '07': 100 },
  '01/2024/1397': { '06': 40, '07': 70 },
  '01/2024/1336': { '06': 50, '07': 100 },
  '01/2024/1247': { '06': 50, '07': 100 },
  '01/2024/0892': { '06': 25, '07': 50 },
  '01/2024/0913': { '06': 25, '07': 50 },
  '01/2024/1499': { '06': 50, '07': 100 },
  '01/2024/1510': { '06': 50, '07': 100 },
  '01/2024/0927': { '06': 30, '07': 75 },
  '01/2024/1789': { '06': 50, '07': 100 },
  '01/2024/1627': { '06': 50, '07': 60 },
  '01/2024/0237': { '06': 50, '07': 60 },
  '01/2024/0611': { '06': 50, '07': 60 },
  '01/2024/1262': { '06': 40, '07': 50 },
  '01/2024/1923': { '06': 50, '07': 100 },
  '01/2024/0689': { '06': 40, '07': 75 },
  '01/2024/0271': { '06': 50, '07': 100 },
  '01/2024/0649': { '06': 40, '07': 80 },
  '01/2024/0345': { '06': 50, '07': 100 },
  '01/2024/0318': { '06': 50, '07': 100 },
  '01/2024/1612': { '06': 50, '07': 60 }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const getMonthName = (monthNum: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

const getShortMonthName = (monthNum: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

// 🛠️ NEW: Dynamic month data field mapping
const getMonthDataField = (monthNum: string, field: 'Total' | 'EightPM' | 'Verve') => {
  const monthMapping: Record<string, string> = {
    '01': 'january', '02': 'february', '03': 'march', '04': 'april',
    '05': 'may', '06': 'june', '07': 'july', '08': 'august', 
    '09': 'september', '10': 'october', '11': 'november', '12': 'december'
  };
  
  const monthKey = monthMapping[monthNum];
  return monthKey ? `${monthKey}${field}` : `${field.toLowerCase()}`;
};

// 🛠️ NEW: Get dynamic month data from shop
const getMonthData = (shop: ShopData, monthNum: string, field: 'Total' | 'EightPM' | 'Verve'): number => {
  const fieldName = getMonthDataField(monthNum, field);
  return shop[fieldName] || 0;
};

// 🛠️ NEW: Get current month data for shop (prioritizes specific month data, fallbacks to general)
const getCurrentMonthData = (shop: ShopData, currentMonth: string) => {
  const total = getMonthData(shop, currentMonth, 'Total') || shop.total || 0;
  const eightPM = getMonthData(shop, currentMonth, 'EightPM') || shop.eightPM || 0;
  const verve = getMonthData(shop, currentMonth, 'Verve') || shop.verve || 0;
  
  return { total, eightPM, verve };
};

// 🛠️ NEW: Get previous month data for growth calculation
const getPreviousMonthData = (shop: ShopData, currentMonth: string) => {
  const currentMonthNum = parseInt(currentMonth);
  const previousMonthNum = currentMonthNum === 1 ? 12 : currentMonthNum - 1;
  const previousMonthStr = previousMonthNum.toString().padStart(2, '0');
  
  const total = getMonthData(shop, previousMonthStr, 'Total');
  const eightPM = getMonthData(shop, previousMonthStr, 'EightPM');
  const verve = getMonthData(shop, previousMonthStr, 'Verve');
  
  return { total, eightPM, verve };
};

// 🛠️ NEW: Get target for specific month (only June & July 2025 available)
const getMonthTarget = (shopId: string, monthNum: string): number => {
  const target = SHOP_TARGETS[shopId]?.[monthNum];
  if (target) return target;
  
  // For months beyond July 2025, return 0 until real targets are set
  if (parseInt(monthNum) > 7) {
    console.log(`⚠️ No target set for shop ${shopId} month ${monthNum} - only June/July targets available`);
  }
  return 0;
};

// 🛠️ NEW: Calculate target achievement for any month
const calculateTargetAchievement = (shop: ShopData, monthNum: string): number => {
  const target = getMonthTarget(shop.shopId, monthNum);
  const actual = getMonthData(shop, monthNum, 'EightPM');
  
  if (!target || target === 0) return 0;
  return (actual / target) * 100;
};

const FocusShopsTab = ({ data }: { data: DashboardData }) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('total'); // total, growth, trend, target_achievement
  const [showEditMode, setShowEditMode] = useState(false);

  // 🛠️ FIXED: Dynamic current month detection
  const currentMonth = data?.currentMonth || '07'; // Default to July if not provided
  const currentYear = data?.currentYear || '2025';
  const previousMonth = (parseInt(currentMonth) === 1 ? 12 : parseInt(currentMonth) - 1).toString().padStart(2, '0');

  console.log(`🛠️ FocusShops: Current month is ${currentMonth} (${getMonthName(currentMonth)})`);

  // ==========================================
  // MOBILE CARD COMPONENT - UPDATED FOR DYNAMIC MONTHS
  // ==========================================

  const MobileFocusShopCard = ({ shop, index }: { shop: ShopData, index: number }) => {
    const currentData = getCurrentMonthData(shop, currentMonth);
    const currentAchievement = calculateTargetAchievement(shop, currentMonth);
    const juneAchievement = calculateTargetAchievement(shop, '06'); // Always show June as reference
    
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
            <div className="text-lg font-bold text-blue-600">{currentData.total.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{getMonthName(currentMonth)} Total</div>
          </div>
        </div>
        
        {/* Current Month Performance */}
        <div className="grid grid-cols-3 gap-2 mb-3 p-3 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-bold text-purple-600">{currentData.eightPM.toLocaleString()}</div>
            <div className="text-xs text-gray-500">8PM Cases</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-orange-600">{currentData.verve.toLocaleString()}</div>
            <div className="text-xs text-gray-500">VERVE Cases</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-gray-600">
              {(currentData.total - currentData.eightPM - currentData.verve) > 0 
                ? `+${(currentData.total - currentData.eightPM - currentData.verve).toLocaleString()}`
                : '0'
              }
            </div>
            <div className="text-xs text-gray-400">Others</div>
          </div>
        </div>

        {/* June Completed Performance */}
        <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-xs font-medium text-green-900 mb-2">✅ June 2025 (Completed)</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-sm font-bold text-green-700">{getMonthData(shop, '06', 'EightPM')}</div>
              <div className="text-xs text-green-600">8PM Sold</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-green-700">{getMonthTarget(shop.shopId, '06')}</div>
              <div className="text-xs text-green-600">Target</div>
            </div>
            <div className="text-center">
              <div className={`text-sm font-bold ${juneAchievement >= 100 ? 'text-green-800' : juneAchievement >= 80 ? 'text-yellow-700' : 'text-red-700'}`}>
                {juneAchievement.toFixed(0)}%
              </div>
              <div className="text-xs text-green-600">Achievement</div>
            </div>
          </div>
        </div>

        {/* Current Month Progress */}
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs font-medium text-blue-900 mb-2">🔄 {getMonthName(currentMonth)} 2025 (Current)</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-700">{currentData.eightPM}</div>
              <div className="text-xs text-blue-600">8PM Current</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-blue-700">{getMonthTarget(shop.shopId, currentMonth) || 'No Target'}</div>
              <div className="text-xs text-blue-600">Target</div>
            </div>
            <div className="text-center">
              {getMonthTarget(shop.shopId, currentMonth) > 0 ? (
                <div className={`text-sm font-bold ${currentAchievement >= 100 ? 'text-green-700' : currentAchievement >= 80 ? 'text-yellow-700' : 'text-red-700'}`}>
                  {currentAchievement.toFixed(0)}%
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic">Target needed</div>
              )}
              <div className="text-xs text-blue-600">Achievement</div>
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

  // 🛠️ FIXED: Enhanced filter and enrich data with dynamic targets and proper ranking
  const focusShopsData = useMemo((): ShopData[] => {
    if (!data?.salesData) return [];

    const focusShops = (Object.values(data.salesData) as ShopData[])
      .filter((shop: ShopData) => FOCUS_SHOP_CODES.includes(shop.shopId))
      .map((shop: ShopData) => {
        // Enrich with current month data and targets
        const currentData = getCurrentMonthData(shop, currentMonth);
        const currentTarget = getMonthTarget(shop.shopId, currentMonth);
        
        return {
          ...shop,
          // Add dynamic current month data for sorting
          currentTotal: currentData.total,
          currentEightPM: currentData.eightPM,
          currentVerve: currentData.verve,
          currentTarget8PM: currentTarget,
          currentAchievement: calculateTargetAchievement(shop, currentMonth)
        };
      })
      .filter((shop: ShopData) => 
        !searchFilter || 
        shop.shopName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        shop.department.toLowerCase().includes(searchFilter.toLowerCase()) ||
        shop.salesman.toLowerCase().includes(searchFilter.toLowerCase())
      );

    // 🛠️ FIXED: Proper sorting using current month data
    return focusShops.sort((a: ShopData, b: ShopData) => {
      switch (sortBy) {
        case 'growth':
          return (b.growthPercent || 0) - (a.growthPercent || 0);
        case 'trend':
          const trendOrder = { improving: 3, stable: 2, declining: 1, new: 0 };
          return (trendOrder[b.monthlyTrend as keyof typeof trendOrder] || 0) - 
                 (trendOrder[a.monthlyTrend as keyof typeof trendOrder] || 0);
        case 'target_achievement':
          return (b.currentAchievement || 0) - (a.currentAchievement || 0);
        default: // total
          return (b.currentTotal || 0) - (a.currentTotal || 0); // 🛠️ FIXED: Use current month data
      }
    });
  }, [data, searchFilter, sortBy, currentMonth]);

  // 🛠️ FIXED: Calculate enhanced focus metrics with dynamic month detection
  const focusMetrics = useMemo(() => {
    if (!focusShopsData.length) return null;

    const totalFocusShops = FOCUS_SHOP_CODES.length;
    const activeFocusShops = focusShopsData.length;
    
    // Current month totals
    const currentMonthTotals = focusShopsData.reduce((acc, shop) => {
      const currentData = getCurrentMonthData(shop, currentMonth);
      acc.totalSales += currentData.total;
      acc.total8PM += currentData.eightPM;
      acc.totalVERVE += currentData.verve;
      return acc;
    }, { totalSales: 0, total8PM: 0, totalVERVE: 0 });
    
    const avgGrowth = focusShopsData.reduce((sum, shop) => sum + (shop.growthPercent || 0), 0) / activeFocusShops;
    
    // Target calculations for current month and June
    const currentMonthTargetSum = focusShopsData.reduce((sum, shop) => sum + getMonthTarget(shop.shopId, currentMonth), 0);
    const juneTargetSum = focusShopsData.reduce((sum, shop) => sum + getMonthTarget(shop.shopId, '06'), 0);
    
    const currentMonthAchievement = currentMonthTargetSum > 0 ? (currentMonthTotals.total8PM / currentMonthTargetSum) * 100 : 0;
    const juneAchievement = juneTargetSum > 0 ? (focusShopsData.reduce((sum, shop) => sum + getMonthData(shop, '06', 'EightPM'), 0) / juneTargetSum) * 100 : 0;
    
    const improving = focusShopsData.filter(shop => shop.monthlyTrend === 'improving').length;
    const declining = focusShopsData.filter(shop => shop.monthlyTrend === 'declining').length;
    const stable = focusShopsData.filter(shop => shop.monthlyTrend === 'stable').length;
    const newShops = focusShopsData.filter(shop => shop.monthlyTrend === 'new').length;

    // Count shops achieving targets
    const currentTargetAchievers = focusShopsData.filter(shop => calculateTargetAchievement(shop, currentMonth) >= 100).length;
    const juneTargetAchievers = focusShopsData.filter(shop => calculateTargetAchievement(shop, '06') >= 100).length;

    return {
      totalFocusShops,
      activeFocusShops,
      ...currentMonthTotals,
      avgGrowth,
      improving,
      declining,
      stable,
      newShops,
      coveragePercent: (activeFocusShops / totalFocusShops) * 100,
      currentMonthTargetSum,
      juneTargetSum,
      currentMonthAchievement,
      juneAchievement,
      currentTargetAchievers,
      juneTargetAchievers,
      currentMonth,
      currentMonthName: getMonthName(currentMonth)
    };
  }, [focusShopsData, currentMonth]);

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Target className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Focus Shops Performance</h2>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">Tracking {FOCUS_SHOP_CODES.length} priority shops with 8PM targets • Current: {getMonthName(currentMonth)} {currentYear}</p>
        <div className="mt-2 flex flex-col sm:flex-row justify-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
          <span>Period: {getMonthName(currentMonth)} {currentYear}</span>
          <span className="hidden sm:inline">•</span>
          <span>Active: {focusMetrics?.activeFocusShops || 0}/{FOCUS_SHOP_CODES.length}</span>
          <span className="hidden sm:inline">•</span>
          <span>Coverage: {focusMetrics?.coveragePercent?.toFixed(1) || 0}%</span>
        </div>
      </div>

      {/* 🛠️ FIXED: Enhanced Focus Group Summary with Dynamic Current Month */}
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
                <div className="text-sm text-gray-500">{focusMetrics.currentMonthName} Total</div>
                <div className="text-xs text-gray-400">Focus group current</div>
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
                <div className={`text-xl font-bold ${focusMetrics.juneAchievement >= 100 ? 'text-green-600' : 'text-purple-900'}`}>
                  {focusMetrics.juneAchievement.toFixed(0)}%
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
                <div className={`text-xl font-bold ${focusMetrics.currentMonthAchievement >= 100 ? 'text-green-600' : 'text-orange-900'}`}>
                  {focusMetrics.currentMonthTargetSum > 0 ? `${focusMetrics.currentMonthAchievement.toFixed(0)}%` : 'No Target'}
                </div>
                <div className="text-sm text-orange-700">{getShortMonthName(currentMonth)} 8PM Target</div>
                <div className="text-xs text-orange-600">
                  {focusMetrics.currentMonthTargetSum > 0 
                    ? `${focusMetrics.currentTargetAchievers} shops at 100%+`
                    : 'Target needed'
                  }
                </div>
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
                <div className="text-sm text-orange-700">VERVE {focusMetrics.currentMonthName}</div>
                <div className="text-xs text-orange-600">Focus group current</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls - Mobile Responsive */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="space-y-4">
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
                <option value="total">Sort by {getShortMonthName(currentMonth)} Sales</option>
                <option value="growth">Sort by Growth %</option>
                <option value="trend">Sort by Trend</option>
                <option value="target_achievement">Sort by {getShortMonthName(currentMonth)} Target Achievement</option>
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
            Showing {focusShopsData.length} focus shops • 🎯 Targets available: June & July only • Current: {focusMetrics?.currentMonthTargetSum.toLocaleString()} | 🟠 VERVE: {focusMetrics?.totalVERVE.toLocaleString()} cases
          </div>
        </div>
      </div>

      {/* Edit Mode Instructions */}
      {showEditMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">📝 Focus Shops & Targets Configuration:</h4>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>✅ <strong>Real Targets:</strong> {FOCUS_SHOP_CODES.length} shops with June & July 2025 targets only</p>
            <p>🎯 <strong>Available:</strong> June: {Object.values(SHOP_TARGETS).reduce((sum, shop) => sum + (shop['06'] || 0), 0)} total | July: {Object.values(SHOP_TARGETS).reduce((sum, shop) => sum + (shop['07'] || 0), 0)} total</p>
            <p>🔄 <strong>Current Month:</strong> {getMonthName(currentMonth)} {currentYear}</p>
            <p>⚠️ <strong>Future Months:</strong> August+ targets need to be set (currently showing 0)</p>
            <p>📊 <strong>Achievement:</strong> June: {focusMetrics?.juneAchievement.toFixed(1)}% | {getShortMonthName(currentMonth)}: {focusMetrics?.currentMonthAchievement.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Mobile View - Card Layout */}
      <div className="block lg:hidden">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Focus Shops - Mobile View ({getMonthName(currentMonth)} {currentYear})
            </h3>
            <p className="text-sm text-gray-500">
              Priority shops ranked by {sortBy === 'total' ? `${getShortMonthName(currentMonth)} sales` : sortBy === 'growth' ? 'growth %' : sortBy === 'target_achievement' ? `${getShortMonthName(currentMonth)} target achievement` : 'trend'} • Shows 8PM, VERVE & others
            </p>
          </div>
          
          <div className="p-4">
            {focusShopsData.map((shop: ShopData, index: number) => (
              <MobileFocusShopCard key={shop.shopId} shop={shop} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* 🛠️ FIXED: Desktop View - Enhanced Table with June + Current Month Data */}
      <div className="hidden lg:block bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Focus Shops Detailed Performance</h3>
          <p className="text-sm text-gray-500">Complete June performance vs Current {getMonthName(currentMonth)} {currentYear} progress • 8PM targets and achievements</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Info</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                {/* June Completed Performance */}
                <th className="px-3 py-3 text-center text-xs font-medium text-green-700 uppercase bg-green-50">June 8PM Sold</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-green-700 uppercase bg-green-50">June Target</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-green-700 uppercase bg-green-50">June Achievement</th>
                {/* Current Month Performance */}
                <th className="px-3 py-3 text-center text-xs font-medium text-blue-700 uppercase bg-blue-50">{getShortMonthName(currentMonth)} Total</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-blue-700 uppercase bg-blue-50">{getShortMonthName(currentMonth)} 8PM</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-blue-700 uppercase bg-blue-50">{getShortMonthName(currentMonth)} VERVE</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-blue-700 uppercase bg-blue-50">{getShortMonthName(currentMonth)} Target</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-blue-700 uppercase bg-blue-50">{getShortMonthName(currentMonth)} Achievement</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Growth %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {focusShopsData.map((shop: ShopData, index: number) => {
                const currentData = getCurrentMonthData(shop, currentMonth);
                const currentAchievement = calculateTargetAchievement(shop, currentMonth);
                const juneData = getMonthData(shop, '06', 'EightPM');
                const juneTarget = getMonthTarget(shop.shopId, '06');
                const juneAchievement = calculateTargetAchievement(shop, '06');
                
                return (
                  <tr key={shop.shopId} className={`${index < 5 ? 'bg-yellow-50' : ''} hover:bg-gray-50`}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                    <td className="px-4 py-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-900 max-w-xs truncate">{shop.shopName}</div>
                        <div className="text-gray-500 text-xs">{shop.shopId}</div>
                        <div className="text-gray-500 text-xs">{shop.salesman}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
                    
                    {/* June Completed Performance - Green Theme */}
                    <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-bold text-green-800 bg-green-50">
                      {juneData.toLocaleString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium text-green-700 bg-green-50">
                      {juneTarget}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center text-sm bg-green-50">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        juneAchievement >= 100 ? 'bg-green-200 text-green-900' :
                        juneAchievement >= 80 ? 'bg-yellow-200 text-yellow-900' :
                        'bg-red-200 text-red-900'
                      }`}>
                        {juneAchievement.toFixed(0)}%
                      </span>
                    </td>
                    
                    {/* Current Month Performance - Blue Theme */}
                    <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-bold text-blue-800 bg-blue-50">
                      {currentData.total.toLocaleString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-bold text-purple-600 bg-blue-50">
                      {currentData.eightPM.toLocaleString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium text-orange-600 bg-blue-50">
                      {currentData.verve.toLocaleString()}
                      {(currentData.total - currentData.eightPM - currentData.verve) > 0 && (
                        <div className="text-xs text-gray-500">+{(currentData.total - currentData.eightPM - currentData.verve)} others</div>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium text-blue-700 bg-blue-50">
                      {getMonthTarget(shop.shopId, currentMonth) || 'No Target'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center text-sm bg-blue-50">
                      {getMonthTarget(shop.shopId, currentMonth) > 0 ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          currentAchievement >= 100 ? 'bg-green-200 text-green-900' :
                          currentAchievement >= 80 ? 'bg-yellow-200 text-yellow-900' :
                          'bg-red-200 text-red-900'
                        }`}>
                          {currentAchievement.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 italic">Target needed</span>
                      )}
                    </td>
                    
                    {/* Growth and Trend */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
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
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
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

      {/* 🛠️ FIXED: Enhanced Insights with Dynamic Target Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{getMonthName(currentMonth)} 8PM Target Performance Analysis</h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{getShortMonthName(currentMonth)} Target Achievers (100%+)</span>
                <span className="font-medium text-green-600">{focusMetrics?.currentTargetAchievers || 0} shops</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{getShortMonthName(currentMonth)} Near Miss (80-99%)</span>
                <span className="font-medium text-yellow-600">
                  {focusShopsData.filter(shop => {
                    const achievement = calculateTargetAchievement(shop, currentMonth);
                    return achievement >= 80 && achievement < 100;
                  }).length} shops
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{getShortMonthName(currentMonth)} Below Target (&lt;80%)</span>
                <span className="font-medium text-red-600">
                  {focusShopsData.filter(shop => calculateTargetAchievement(shop, currentMonth) < 80).length} shops
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">Overall {getShortMonthName(currentMonth)} Achievement</span>
                  <span className={`font-bold ${focusMetrics && focusMetrics.currentMonthAchievement >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                    {focusMetrics?.currentMonthAchievement.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Priority Actions ({getMonthName(currentMonth)} Focus)</h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{getShortMonthName(currentMonth)} Target Achievers</div>
                  <div className="text-sm text-gray-600">Maintain momentum, prepare for next month targets</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Near Miss Shops</div>
                  <div className="text-sm text-gray-600">Intensive support needed, close to {getShortMonthName(currentMonth)} target</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Below Target Shops</div>
                  <div className="text-sm text-gray-600">Immediate intervention required for {getShortMonthName(currentMonth)}</div>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500">
                  📊 Reference: June completed with {focusMetrics?.juneAchievement.toFixed(1)}% achievement
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
