// ==========================================
// 🎯 DYNAMIC FOCUS SHOPS TAB - GOOGLE SHEET INTEGRATED
// ==========================================
// ✅ FEATURES:
// - Dynamic focus shops list from Google Sheet
// - Dynamic targets from Google Sheet (progressive building)
// - Rolling 4-month window (3 historical + 1 current)
// - VERVE sales-only display (no targets)
// - Progressive target building (June → July → August → etc.)
// - Automatic month transitions
// ==========================================

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Target, TrendingUp, Users, Star, AlertTriangle, CheckCircle, BarChart3, Filter, Search, Download, Edit3, RefreshCw, Info } from 'lucide-react';

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
  [key: string]: any;
}

interface DashboardData {
  salesData?: Record<string, ShopData>;
  currentMonth?: string;
  currentYear?: string;
}

interface FocusShopConfig {
  shopId: string;
  targets: Record<string, number>; // monthKey: target value
}

// Google Sheets API response type
interface GoogleSheetsResponse {
  values?: any[][];
}

// ==========================================
// GOOGLE SHEETS INTEGRATION
// ==========================================

const FOCUS_SHOPS_SHEET_ID = process.env.NEXT_PUBLIC_FOCUS_SHOPS_SHEET_ID || '1_e0IIGNvQkixUyVuy-T_bPCV0EUzQ3EnoCdY81aNXWw';
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

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

// 🛠️ Dynamic month data field mapping
const getMonthDataField = (monthNum: string, field: 'Total' | 'EightPM' | 'Verve') => {
  const monthMapping: Record<string, string> = {
    '01': 'january', '02': 'february', '03': 'march', '04': 'april',
    '05': 'may', '06': 'june', '07': 'july', '08': 'august', 
    '09': 'september', '10': 'october', '11': 'november', '12': 'december'
  };
  
  const monthKey = monthMapping[monthNum];
  return monthKey ? `${monthKey}${field}` : `${field.toLowerCase()}`;
};

// 🛠️ Get dynamic month data from shop
const getMonthData = (shop: ShopData, monthNum: string, field: 'Total' | 'EightPM' | 'Verve'): number => {
  const fieldName = getMonthDataField(monthNum, field);
  return shop[fieldName] || 0;
};

// 🛠️ Get current month data for shop
const getCurrentMonthData = (shop: ShopData, currentMonth: string) => {
  const total = getMonthData(shop, currentMonth, 'Total') || shop.total || 0;
  const eightPM = getMonthData(shop, currentMonth, 'EightPM') || shop.eightPM || 0;
  const verve = getMonthData(shop, currentMonth, 'Verve') || shop.verve || 0;
  
  return { total, eightPM, verve };
};

// 🚀 NEW: Rolling 4-month window calculation
const getRollingMonths = (currentMonth: string, currentYear: string): Array<{
  month: string;
  year: string;
  monthName: string;
  shortName: string;
  isCurrent: boolean;
  key: string;
}> => {
  const months = [];
  let month = parseInt(currentMonth);
  let year = parseInt(currentYear);
  
  // Get 4 months (3 historical + 1 current)
  for (let i = 3; i >= 0; i--) {
    let targetMonth = month - i;
    let targetYear = year;
    
    if (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    
    const monthStr = targetMonth.toString().padStart(2, '0');
    const yearStr = targetYear.toString();
    const isCurrent = (targetMonth === month && targetYear === year);
    
    months.push({
      month: monthStr,
      year: yearStr,
      monthName: getMonthName(monthStr),
      shortName: getShortMonthName(monthStr),
      isCurrent,
      key: `${monthStr}-${yearStr}`
    });
  }
  
  return months;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const FocusShopsTab = ({ data }: { data: DashboardData }) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('total');
  const [showEditMode, setShowEditMode] = useState(false);
  const [focusShopsConfig, setFocusShopsConfig] = useState<FocusShopConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic current month detection
  const currentMonth = data?.currentMonth || '07';
  const currentYear = data?.currentYear || '2025';
  
  // 🚀 NEW: Rolling months calculation
  const rollingMonths = useMemo(() => getRollingMonths(currentMonth, currentYear), [currentMonth, currentYear]);

  console.log(`🎯 DYNAMIC Focus Shops: Current month is ${currentMonth} (${getMonthName(currentMonth)})`);
  console.log('🔄 Rolling 4-month window:', rollingMonths.map((m: any) => `${m.shortName} ${m.year}`).join(' | '));

  // ==========================================
  // 🚀 NEW: FETCH FOCUS SHOPS FROM GOOGLE SHEET (SHOP ID + TARGETS ONLY)
  // ==========================================
  
  const fetchFocusShopsConfig = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!GOOGLE_API_KEY) {
        throw new Error('Google API key not configured');
      }

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${FOCUS_SHOPS_SHEET_ID}/values/Sheet1?key=${GOOGLE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch focus shops data: ${response.statusText}`);
      }
      
      const result: GoogleSheetsResponse = await response.json();
      const rows = result.values || [];
      
      if (rows.length < 2) {
        throw new Error('Focus shops sheet appears to be empty or invalid');
      }
      
      // Parse headers to find month columns
      const headers: any[] = rows[0] || [];
      console.log('📊 Focus Shops Sheet Headers:', headers);
      
      // Expected structure: Shop ID, Shop Info, Department, June Target, Jul Target, Aug Target, etc.
      const focusShops: FocusShopConfig[] = [];
      
      rows.slice(1).forEach((row: any[], index: number) => {
        if (row.length >= 4) {
          const shopId = row[0]?.toString().trim();
          
          if (shopId) {
            const targets: Record<string, number> = {};
            
            // Parse target columns (starting from column 3 - June Target is column D)
            for (let i = 3; i < row.length && i < headers.length; i++) {
              const headerValue = headers[i]?.toString().trim();
              const targetValue = parseFloat(row[i]) || 0;
              
              if (headerValue && targetValue > 0) {
                // Parse month from header (e.g., "June Target", "Jul Target", "Aug Target")
                let monthKey = '';
                
                if (headerValue.toLowerCase().includes('june')) {
                  monthKey = '06';
                } else if (headerValue.toLowerCase().includes('jul')) {
                  monthKey = '07';
                } else if (headerValue.toLowerCase().includes('aug')) {
                  monthKey = '08';
                } else if (headerValue.toLowerCase().includes('sept')) {
                  monthKey = '09';
                } else if (headerValue.toLowerCase().includes('oct')) {
                  monthKey = '10';
                } else if (headerValue.toLowerCase().includes('nov')) {
                  monthKey = '11';
                } else if (headerValue.toLowerCase().includes('dec')) {
                  monthKey = '12';
                } else if (headerValue.toLowerCase().includes('jan')) {
                  monthKey = '01';
                } else if (headerValue.toLowerCase().includes('feb')) {
                  monthKey = '02';
                } else if (headerValue.toLowerCase().includes('mar')) {
                  monthKey = '03';
                }
                
                if (monthKey) {
                  targets[monthKey] = targetValue;
                }
              }
            }
            
            focusShops.push({
              shopId,
              targets
            });
          }
        }
      });
      
      console.log(`✅ Loaded ${focusShops.length} focus shops from Google Sheet`);
      const availableMonths = Object.keys(focusShops.reduce((acc, shop) => ({...acc, ...shop.targets}), {} as Record<string, number>));
      console.log('🎯 Available targets by month:', 
        availableMonths.map((month: string) => `${getShortMonthName(month)}: ${month}`)
      );
      
      setFocusShopsConfig(focusShops);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Error fetching focus shops config:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch focus shops config on component mount
  useEffect(() => {
    fetchFocusShopsConfig();
  }, []);

  // 🛠️ Get target for specific month from dynamic config
  const getMonthTarget = (shopId: string, monthNum: string): number => {
    const shopConfig = focusShopsConfig.find(config => config.shopId === shopId);
    return shopConfig?.targets[monthNum] || 0;
  };

  // 🛠️ Calculate target achievement for any month
  const calculateTargetAchievement = (shop: ShopData, monthNum: string): number => {
    const target = getMonthTarget(shop.shopId, monthNum);
    const actual = getMonthData(shop, monthNum, 'EightPM');
    
    if (!target || target === 0) return 0;
    return (actual / target) * 100;
  };

  // ==========================================
  // 🚀 NEW: ENHANCED MOBILE CARD WITH ROLLING MONTHS
  // ==========================================

  const MobileFocusShopCard = ({ shop, index }: { shop: ShopData, index: number }) => {
    const currentData = getCurrentMonthData(shop, currentMonth);
    const currentMonthInfo = rollingMonths.find((m: any) => m.isCurrent);
    
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
            <div className="text-xs text-gray-500">{currentMonthInfo?.monthName} Total</div>
          </div>
        </div>

        {/* 🚀 NEW: Rolling Months Display */}
        <div className="space-y-3">
          {rollingMonths.map((monthInfo: any, idx: number) => {
            const monthData = {
              total: getMonthData(shop, monthInfo.month, 'Total'),
              eightPM: getMonthData(shop, monthInfo.month, 'EightPM'),
              verve: getMonthData(shop, monthInfo.month, 'Verve')
            };
            const target = getMonthTarget(shop.shopId, monthInfo.month);
            const achievement = target > 0 ? (monthData.eightPM / target) * 100 : 0;
            
            return (
              <div key={monthInfo.key} className={`p-3 rounded-lg border ${
                monthInfo.isCurrent 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="text-xs font-medium mb-2 ${monthInfo.isCurrent ? 'text-blue-900' : 'text-green-900'}">
                  {monthInfo.isCurrent ? '🔄' : '✅'} {monthInfo.monthName} {monthInfo.year} {monthInfo.isCurrent ? '(Current)' : '(Completed)'}
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="text-center">
                    <div className={`text-sm font-bold ${monthInfo.isCurrent ? 'text-blue-700' : 'text-green-700'}`}>
                      {monthData.eightPM}
                    </div>
                    <div className={`text-xs ${monthInfo.isCurrent ? 'text-blue-600' : 'text-green-600'}`}>
                      8PM Sold
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-bold ${monthInfo.isCurrent ? 'text-blue-700' : 'text-green-700'}`}>
                      {target > 0 ? target : 'No Target'}
                    </div>
                    <div className={`text-xs ${monthInfo.isCurrent ? 'text-blue-600' : 'text-green-600'}`}>
                      8PM Target
                    </div>
                  </div>
                  <div className="text-center">
                    {target > 0 ? (
                      <div className={`text-sm font-bold ${
                        achievement >= 100 ? 'text-green-700' : 
                        achievement >= 80 ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                        {achievement.toFixed(0)}%
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 italic">Target TBD</div>
                    )}
                    <div className={`text-xs ${monthInfo.isCurrent ? 'text-blue-600' : 'text-green-600'}`}>
                      Achievement
                    </div>
                  </div>
                </div>

                {/* 🟠 VERVE Sales-Only Display */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">VERVE Sales:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-orange-600">{monthData.verve} cases</span>
                      <Info className="w-3 h-3 text-gray-400" title="VERVE tracking only - no targets" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">Sales tracking only</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Growth Metrics */}
        <div className="grid grid-cols-2 gap-3 mt-3 mb-3">
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

  // 🛠️ Enhanced filter and enrich data with dynamic targets (using master sheet for shop details)
  const focusShopsData = useMemo((): ShopData[] => {
    if (!data?.salesData || focusShopsConfig.length === 0) return [];

    const focusShopIds = focusShopsConfig.map((config: FocusShopConfig) => config.shopId);
    
    const focusShops = (Object.values(data.salesData) as ShopData[])
      .filter((shop: ShopData) => focusShopIds.includes(shop.shopId))
      .map((shop: ShopData) => {
        const currentData = getCurrentMonthData(shop, currentMonth);
        const currentTarget = getMonthTarget(shop.shopId, currentMonth);
        
        // ✅ All shop details (name, department, salesman) come from master sheet data
        return {
          ...shop, // This includes shopName, department, salesman from master sheet
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
        default:
          return (b.currentTotal || 0) - (a.currentTotal || 0);
      }
    });
  }, [data, searchFilter, sortBy, currentMonth, focusShopsConfig]);

  // 🛠️ Calculate enhanced focus metrics with dynamic month detection
  const focusMetrics = useMemo(() => {
    if (!focusShopsData.length) return null;

    const totalFocusShops = focusShopsConfig.length;
    const activeFocusShops = focusShopsData.length;
    
    // Calculate metrics for all rolling months
    const monthlyMetrics = rollingMonths.map((monthInfo: any) => {
      const monthTotals = focusShopsData.reduce((acc, shop: ShopData) => {
        const monthData = {
          total: getMonthData(shop, monthInfo.month, 'Total'),
          eightPM: getMonthData(shop, monthInfo.month, 'EightPM'),
          verve: getMonthData(shop, monthInfo.month, 'Verve')
        };
        acc.totalSales += monthData.total;
        acc.total8PM += monthData.eightPM;
        acc.totalVERVE += monthData.verve;
        return acc;
      }, { totalSales: 0, total8PM: 0, totalVERVE: 0 });

      const targetSum = focusShopsData.reduce((sum: number, shop: ShopData) => sum + getMonthTarget(shop.shopId, monthInfo.month), 0);
      const achievement = targetSum > 0 ? (monthTotals.total8PM / targetSum) * 100 : 0;
      const targetAchievers = focusShopsData.filter((shop: ShopData) => calculateTargetAchievement(shop, monthInfo.month) >= 100).length;

      return {
        ...monthInfo,
        ...monthTotals,
        targetSum,
        achievement,
        targetAchievers
      };
    });

    const currentMonthMetrics = monthlyMetrics.find((m: any) => m.isCurrent) || monthlyMetrics[monthlyMetrics.length - 1];
    
    const avgGrowth = focusShopsData.reduce((sum: number, shop: ShopData) => sum + (shop.growthPercent || 0), 0) / activeFocusShops;
    
    const improving = focusShopsData.filter((shop: ShopData) => shop.monthlyTrend === 'improving').length;
    const declining = focusShopsData.filter((shop: ShopData) => shop.monthlyTrend === 'declining').length;

    return {
      totalFocusShops,
      activeFocusShops,
      monthlyMetrics,
      currentMonthMetrics,
      avgGrowth,
      improving,
      declining,
      coveragePercent: (activeFocusShops / totalFocusShops) * 100,
      currentMonth,
      currentMonthName: getMonthName(currentMonth)
    };
  }, [focusShopsData, currentMonth, rollingMonths, focusShopsConfig]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Dynamic Focus Shops</h3>
          <p className="text-gray-600">Fetching latest configuration from Google Sheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Configuration Error</h3>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <button
              onClick={fetchFocusShopsConfig}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Target className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dynamic Focus Shops Performance</h2>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">
          Tracking {focusShopsConfig.length} priority shops • IDs + targets from Focus Sheet • Details from Master Sheet
        </p>
        <div className="mt-2 flex flex-col sm:flex-row justify-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
          <span>Current: {getMonthName(currentMonth)} {currentYear}</span>
          <span className="hidden sm:inline">•</span>
          <span>Active: {focusMetrics?.activeFocusShops || 0}/{focusShopsConfig.length}</span>
          <span className="hidden sm:inline">•</span>
          <span>Rolling: {rollingMonths.map((m: any) => m.shortName).join(' → ')}</span>
        </div>
      </div>

      {/* 🚀 NEW: Enhanced Focus Group Summary with Rolling Months */}
      {focusMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-600">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <div className="text-xl font-bold text-blue-900">{focusMetrics.activeFocusShops}</div>
                <div className="text-sm text-blue-700">Active Focus Shops</div>
                <div className="text-xs text-blue-600">from Google Sheet</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <div className="text-xl font-bold text-gray-900">
                  {focusMetrics.currentMonthMetrics?.totalSales.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">{focusMetrics.currentMonthName} Total</div>
                <div className="text-xs text-gray-400">Current period</div>
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
                <div className={`text-xl font-bold ${
                  focusMetrics.currentMonthMetrics?.achievement >= 100 ? 'text-green-600' : 'text-purple-900'
                }`}>
                  {focusMetrics.currentMonthMetrics?.targetSum > 0 
                    ? `${focusMetrics.currentMonthMetrics.achievement.toFixed(0)}%`
                    : 'No Targets'
                  }
                </div>
                <div className="text-sm text-purple-700">{getShortMonthName(currentMonth)} 8PM Target</div>
                <div className="text-xs text-purple-600">
                  {focusMetrics.currentMonthMetrics?.targetAchievers || 0} shops at 100%+
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
                <div className="text-xl font-bold text-orange-900">
                  {focusMetrics.currentMonthMetrics?.totalVERVE.toLocaleString()}
                </div>
                <div className="text-sm text-orange-700">VERVE {focusMetrics.currentMonthName}</div>
                <div className="text-xs text-orange-600">Sales tracking only</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
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
                <option value="target_achievement">Sort by Target Achievement</option>
              </select>

              <button
                onClick={fetchFocusShopsConfig}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center space-x-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh Config</span>
                <span className="sm:hidden">Refresh</span>
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500 text-center sm:text-left">
            Showing {focusShopsData.length} focus shops • 🎯 IDs + Targets from Focus Sheet • 📋 Details from Master Sheet • 🟠 VERVE: Sales tracking only
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📊 Optimized Configuration Status:</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>✅ <strong>Focus Shop IDs:</strong> {focusShopsConfig.length} shops from Focus Shops Sheet</p>
          <p>📋 <strong>Shop Details:</strong> Names, departments, salesmen from Master Sheet (single source of truth)</p>
          <p>🎯 <strong>Available Targets:</strong> {Object.keys(
            focusShopsConfig.reduce((acc: Record<string, number>, shop: FocusShopConfig) => ({...acc, ...shop.targets}), {} as Record<string, number>)
          ).map((month: string) => getShortMonthName(month)).join(', ') || 'None yet'}</p>
          <p>🔄 <strong>Rolling Window:</strong> {rollingMonths.map(m => `${m.shortName} ${m.year}`).join(' → ')}</p>
          <p>🟠 <strong>VERVE:</strong> Sales tracking only (no targets required)</p>
          <p>🔗 <strong>Data Sync:</strong> Focus Sheet (IDs + Targets) + Master Sheet (Details) = Complete View</p>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block lg:hidden">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Dynamic Focus Shops - Rolling Window
            </h3>
            <p className="text-sm text-gray-500">
              {rollingMonths.map(m => `${m.shortName} ${m.year}`).join(' → ')} • 8PM targets + VERVE sales tracking
            </p>
          </div>
          
          <div className="p-4">
            {focusShopsData.map((shop: ShopData, index: number) => (
              <MobileFocusShopCard key={shop.shopId} shop={shop} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* 🚀 NEW: Desktop View with Rolling Months */}
      <div className="hidden lg:block bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Focus Shops Rolling 4-Month Performance</h3>
          <p className="text-sm text-gray-500">
            IDs + targets from Focus Sheet • Shop details from Master Sheet •             Rolling window: {rollingMonths.map((m: any) => `${m.shortName} ${m.year}`).join(' → ')}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Info</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                
                {/* 🚀 Dynamic Rolling Month Headers */}
                {rollingMonths.map((monthInfo: any) => (
                  <React.Fragment key={monthInfo.key}>
                    <th className={`px-3 py-3 text-center text-xs font-medium uppercase ${
                      monthInfo.isCurrent 
                        ? 'text-blue-700 bg-blue-50' 
                        : 'text-green-700 bg-green-50'
                    }`}>
                      {monthInfo.shortName} 8PM Sold
                    </th>
                    <th className={`px-3 py-3 text-center text-xs font-medium uppercase ${
                      monthInfo.isCurrent 
                        ? 'text-blue-700 bg-blue-50' 
                        : 'text-green-700 bg-green-50'
                    }`}>
                      8PM {monthInfo.shortName.toUpperCase()} TARGET
                    </th>
                    {monthInfo.isCurrent && (
                      <th className="px-3 py-3 text-center text-xs font-medium text-orange-700 uppercase bg-orange-50">
                        VERVE Sales
                      </th>
                    )}
                    <th className={`px-3 py-3 text-center text-xs font-medium uppercase ${
                      monthInfo.isCurrent 
                        ? 'text-blue-700 bg-blue-50' 
                        : 'text-green-700 bg-green-50'
                    }`}>
                      {monthInfo.shortName} Achievement
                    </th>
                  </React.Fragment>
                ))}
                
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Growth %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {focusShopsData.map((shop: ShopData, index: number) => (
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
                  
                  {/* 🚀 Dynamic Rolling Month Data */}
                  {rollingMonths.map((monthInfo: any) => {
                    const monthData = {
                      eightPM: getMonthData(shop, monthInfo.month, 'EightPM'),
                      verve: getMonthData(shop, monthInfo.month, 'Verve')
                    };
                    const target = getMonthTarget(shop.shopId, monthInfo.month);
                    const achievement = target > 0 ? (monthData.eightPM / target) * 100 : 0;
                    
                    return (
                      <React.Fragment key={monthInfo.key}>
                        {/* 8PM Sold */}
                        <td className={`px-3 py-4 whitespace-nowrap text-center text-sm font-bold ${
                          monthInfo.isCurrent ? 'text-blue-800 bg-blue-50' : 'text-green-800 bg-green-50'
                        }`}>
                          {monthData.eightPM.toLocaleString()}
                        </td>
                        
                        {/* 8PM Target */}
                        <td className={`px-3 py-4 whitespace-nowrap text-center text-sm font-medium ${
                          monthInfo.isCurrent ? 'text-blue-700 bg-blue-50' : 'text-green-700 bg-green-50'
                        }`}>
                          {target > 0 ? target : 'No Target'}
                        </td>
                        
                        {/* VERVE Sales (only for current month) */}
                        {monthInfo.isCurrent && (
                          <td className="px-3 py-4 whitespace-nowrap text-center text-sm bg-orange-50">
                            <div className="flex items-center justify-center space-x-1">
                              <span className="font-medium text-orange-600">{monthData.verve}</span>
                              <Info className="w-3 h-3 text-orange-400" title="Sales tracking only" />
                            </div>
                            <div className="text-xs text-orange-500">Sales only</div>
                          </td>
                        )}
                        
                        {/* Achievement */}
                        <td className={`px-3 py-4 whitespace-nowrap text-center text-sm ${
                          monthInfo.isCurrent ? 'bg-blue-50' : 'bg-green-50'
                        }`}>
                          {target > 0 ? (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              achievement >= 100 ? 'bg-green-200 text-green-900' :
                              achievement >= 80 ? 'bg-yellow-200 text-yellow-900' :
                              'bg-red-200 text-red-900'
                            }`}>
                              {achievement.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 italic">Target TBD</span>
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Rolling Window Performance Analysis</h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {focusMetrics?.monthlyMetrics.map((monthMetrics: any) => (
                <div key={monthMetrics.key} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {monthMetrics.monthName} {monthMetrics.year} {monthMetrics.isCurrent ? '(Current)' : ''}
                  </span>
                  <div className="text-right">
                    <span className="font-medium text-gray-900">
                      {monthMetrics.total8PM} cases
                    </span>
                    {monthMetrics.targetSum > 0 && (
                      <span className={`ml-2 text-sm ${
                        monthMetrics.achievement >= 100 ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        ({monthMetrics.achievement.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Optimized Data Architecture Benefits</h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Single Source of Truth</div>
                  <div className="text-sm text-gray-600">Shop details from master sheet, targets from focus sheet</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">No Data Duplication</div>
                  <div className="text-sm text-gray-600">Focus sheet stays lean - just IDs and targets</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <BarChart3 className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Automatic Sync</div>
                  <div className="text-sm text-gray-600">Shop name/department changes auto-reflected from master</div>
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
