'use client';

import React, { useState, useMemo } from 'react';
import { X, AlertTriangle, TrendingUp, TrendingDown, Activity, Clock, Target } from 'lucide-react';

// ==========================================
// TYPE DEFINITIONS (UNCHANGED)
// ==========================================

interface ShopData {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  total: number;
  eightPM: number;
  verve: number;
  
  // EXISTING: Rolling months (UNCHANGED)
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
  
  // NEW: Extended Historical Data
  februaryTotal?: number;
  februaryEightPM?: number;
  februaryVerve?: number;
  januaryTotal?: number;
  januaryEightPM?: number;
  januaryVerve?: number;
  decemberTotal?: number;
  decemberEightPM?: number;
  decemberVerve?: number;
  novemberTotal?: number;
  novemberEightPM?: number;
  novemberVerve?: number;
  octoberTotal?: number;
  octoberEightPM?: number;
  octoberVerve?: number;
  septemberTotal?: number;
  septemberEightPM?: number;
  septemberVerve?: number;
  augustTotal?: number;
  augustEightPM?: number;
  augustVerve?: number;
  julyTotal?: number;
  julyEightPM?: number;
  julyVerve?: number;
}

interface DashboardData {
  deptPerformance: Record<string, any>;
  salesData: Record<string, ShopData>;
  summary: {
    total8PM: number;
    totalVERVE: number;
  };
  currentMonth: string;
  currentYear: string;
}

// ==========================================
// 🚀 NEW: FUTURE-READY ROLLING WINDOW FUNCTIONS
// ==========================================

const getMonthName = (monthNum: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

const getShortMonthName = (monthNum: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

const getMonthKey = (monthNum: string) => {
  const keys = ['january', 'february', 'march', 'april', 'may', 'june',
                'july', 'august', 'september', 'october', 'november', 'december'];
  return keys[parseInt(monthNum) - 1] || 'unknown';
};

// 🚀 NEW: 5-MONTH ROLLING WINDOW CALCULATION
const getDepartmentRolling5MonthWindow = (currentMonth: string, currentYear: string) => {
  const monthNum = parseInt(currentMonth);
  const yearNum = parseInt(currentYear);
  const months = [];
  
  // Calculate last 5 months including current
  for (let i = 4; i >= 0; i--) {
    let targetMonth = monthNum - i;
    let targetYear = yearNum;
    
    // Handle year rollover
    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    
    months.push({
      month: targetMonth.toString().padStart(2, '0'),
      shortName: getShortMonthName(targetMonth.toString()),
      fullName: getMonthName(targetMonth.toString()),
      year: targetYear.toString(),
      key: getMonthKey(targetMonth.toString())
    });
  }
  
  return months;
};

// 🚀 NEW: DYNAMIC ROLLING WINDOW LABEL
const getDepartmentRollingLabel = (currentMonth: string, currentYear: string) => {
  const window = getDepartmentRolling5MonthWindow(currentMonth, currentYear);
  return window.map(m => m.shortName).join('-') + ` ${currentYear}`;
};

// 🚀 NEW: GET SHOP DATA FOR ANY MONTH
const getShopDataForMonth = (shop: ShopData, monthKey: string, dataType: 'total' | 'eightPM' | 'verve' = 'total') => {
  if (monthKey === 'current') {
    return shop[dataType] || 0;
  }
  
  // Historical month data
  let key: string;
  switch (dataType) {
    case 'eightPM':
      key = `${monthKey}EightPM`;
      break;
    case 'verve':
      key = `${monthKey}Verve`;
      break;
    default:
      key = `${monthKey}Total`;
  }
  
  const value = (shop as any)[key];
  return typeof value === 'number' ? value : 0;
};

// 🚀 NEW: DEPARTMENT INTELLIGENCE CALCULATIONS
const calculateDepartmentIntelligence = (salesData: Record<string, ShopData>, currentMonth: string, currentYear: string) => {
  const allShops = Object.values(salesData);
  const rollingWindow = getDepartmentRolling5MonthWindow(currentMonth, currentYear);
  
  // Calculate days since last order for each shop
  const shopsWithActivity = allShops.map(shop => {
    let lastOrderMonth = -1;
    let lastOrderValue = 0;
    
    // Check from most recent to oldest month
    for (let i = rollingWindow.length - 1; i >= 0; i--) {
      const monthData = rollingWindow[i];
      const monthValue = getShopDataForMonth(shop, monthData.key, 'total');
      
      if (monthValue > 0) {
        lastOrderMonth = i;
        lastOrderValue = monthValue;
        break;
      }
    }
    
    // Calculate days since last order (approximate)
    const daysSinceLastOrder = lastOrderMonth === -1 ? 999 : 
                              lastOrderMonth === rollingWindow.length - 1 ? 0 : // Current month
                              (rollingWindow.length - 1 - lastOrderMonth) * 30;
    
    return {
      ...shop,
      daysSinceLastOrder,
      lastOrderValue,
      hasRecentActivity: daysSinceLastOrder < 30
    };
  });
  
  // Calculate department-level metrics
  const departmentIntelligence: Record<string, any> = {};
  
  Object.keys(salesData).forEach(shopId => {
    const shop = salesData[shopId];
    const dept = shop.department;
    
    if (!departmentIntelligence[dept]) {
      departmentIntelligence[dept] = {
        totalShops: 0,
        activeShops: 0,
        inactive60Days: 0,
        inactive90Days: 0,
        neverOrdered: 0,
        volumeIncreasing: 0,
        volumeDecreasing: 0,
        volumeStable: 0,
        total8PM: 0,
        totalVERVE: 0,
        active8PM: 0,
        activeVERVE: 0
      };
    }
    
    const deptData = departmentIntelligence[dept];
    const shopWithActivity = shopsWithActivity.find(s => s.shopId === shopId);
    
    deptData.totalShops++;
    
    // Activity status
    if (shopWithActivity) {
      if (shopWithActivity.daysSinceLastOrder < 30) {
        deptData.activeShops++;
      } else if (shopWithActivity.daysSinceLastOrder >= 60 && shopWithActivity.daysSinceLastOrder < 90) {
        deptData.inactive60Days++;
      } else if (shopWithActivity.daysSinceLastOrder >= 90) {
        deptData.inactive90Days++;
      }
      
      if (shopWithActivity.daysSinceLastOrder === 999) {
        deptData.neverOrdered++;
      }
    }
    
    // Volume trends (compare current vs 2 months ago)
    const currentTotal = shop.total || 0;
    const twoMonthsAgoKey = rollingWindow[2]?.key; // 3rd month back
    const twoMonthsAgoTotal = twoMonthsAgoKey ? getShopDataForMonth(shop, twoMonthsAgoKey, 'total') : 0;
    
    if (currentTotal > 0 && twoMonthsAgoTotal > 0) {
      const change = ((currentTotal - twoMonthsAgoTotal) / twoMonthsAgoTotal) * 100;
      if (change > 10) deptData.volumeIncreasing++;
      else if (change < -10) deptData.volumeDecreasing++;
      else deptData.volumeStable++;
    }
    
    // Brand metrics
    deptData.total8PM += shop.eightPM || 0;
    deptData.totalVERVE += shop.verve || 0;
    if ((shop.eightPM || 0) > 0) deptData.active8PM++;
    if ((shop.verve || 0) > 0) deptData.activeVERVE++;
  });
  
  return departmentIntelligence;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const DepartmentTab = ({ data }: { data: DashboardData }) => {
  // 🚀 NEW: Rolling window calculation
  const rollingWindow = useMemo(() => {
    return getDepartmentRolling5MonthWindow(data.currentMonth, data.currentYear);
  }, [data.currentMonth, data.currentYear]);

  const rollingLabel = useMemo(() => {
    return getDepartmentRollingLabel(data.currentMonth, data.currentYear);
  }, [data.currentMonth, data.currentYear]);

  // 🚀 NEW: Department intelligence calculation
  const departmentIntelligence = useMemo(() => {
    return calculateDepartmentIntelligence(data.salesData, data.currentMonth, data.currentYear);
  }, [data.salesData, data.currentMonth, data.currentYear]);

  // STATE for drill-down modals (UNCHANGED)
  const [showDepartmentShops, setShowDepartmentShops] = useState(false);
  const [selectedDepartmentShops, setSelectedDepartmentShops] = useState<{
    department: string;
    title: string;
    subtitle: string;
    shops: any[];
    type: 'all' | 'active' | 'inactive' | '8pm' | 'verve' | 'both' | 'monthly';
    monthData?: { month: string; total: number; eightPM: number; verve: number; };
  } | null>(null);

  // FUNCTIONS to handle drill-down clicks (UNCHANGED)
  const handleDepartmentShopsClick = (
    department: string, 
    title: string, 
    subtitle: string, 
    shops: any[], 
    type: 'all' | 'active' | 'inactive' | '8pm' | 'verve' | 'both' | 'monthly',
    monthData?: { month: string; total: number; eightPM: number; verve: number; }
  ) => {
    setSelectedDepartmentShops({
      department,
      title,
      subtitle,
      shops,
      type,
      monthData
    });
    setShowDepartmentShops(true);
  };

  // MEMOIZED department shop data (UNCHANGED)
  const departmentShopsData = useMemo(() => {
    const deptData: Record<string, any> = {};
    
    Object.keys(data.deptPerformance).forEach(dept => {
      const allShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept);
      const activeShops = allShops.filter((shop: any) => shop.total > 0);
      const inactiveShops = allShops.filter((shop: any) => shop.total === 0);
      const shops8PM = activeShops.filter((shop: any) => (shop.eightPM || 0) > 0);
      const shopsVERVE = activeShops.filter((shop: any) => (shop.verve || 0) > 0);
      const shopsBoth = activeShops.filter((shop: any) => (shop.eightPM || 0) > 0 && (shop.verve || 0) > 0);
      
      deptData[dept] = {
        allShops,
        activeShops,
        inactiveShops,
        shops8PM,
        shopsVERVE,
        shopsBoth
      };
    });
    
    return deptData;
  }, [data.salesData]);

  // Calculate overall intelligence metrics
  const overallMetrics = useMemo(() => {
    const allDepts = Object.values(departmentIntelligence);
    const totals = allDepts.reduce((acc: any, dept: any) => ({
      totalShops: acc.totalShops + dept.totalShops,
      activeShops: acc.activeShops + dept.activeShops,
      inactive60Days: acc.inactive60Days + dept.inactive60Days,
      inactive90Days: acc.inactive90Days + dept.inactive90Days,
      neverOrdered: acc.neverOrdered + dept.neverOrdered,
      volumeIncreasing: acc.volumeIncreasing + dept.volumeIncreasing,
      volumeDecreasing: acc.volumeDecreasing + dept.volumeDecreasing,
      active8PM: acc.active8PM + dept.active8PM,
      activeVERVE: acc.activeVERVE + dept.activeVERVE
    }), {
      totalShops: 0, activeShops: 0, inactive60Days: 0, inactive90Days: 0, 
      neverOrdered: 0, volumeIncreasing: 0, volumeDecreasing: 0, active8PM: 0, activeVERVE: 0
    });

    return {
      ...totals,
      inactive60DaysPct: totals.totalShops > 0 ? ((totals.inactive60Days / totals.totalShops) * 100).toFixed(1) : '0',
      inactive90DaysPct: totals.totalShops > 0 ? ((totals.inactive90Days / totals.totalShops) * 100).toFixed(1) : '0',
      volumeIncreasingPct: totals.totalShops > 0 ? ((totals.volumeIncreasing / totals.totalShops) * 100).toFixed(1) : '0',
      volumeDecreasingPct: totals.totalShops > 0 ? ((totals.volumeDecreasing / totals.totalShops) * 100).toFixed(1) : '0',
      eightPMPenetration: totals.totalShops > 0 ? ((totals.active8PM / totals.totalShops) * 100).toFixed(1) : '0',
      vervePenetration: totals.totalShops > 0 ? ((totals.activeVERVE / totals.totalShops) * 100).toFixed(1) : '0'
    };
  }, [departmentIntelligence]);

  // COMPONENT: Department Shops Modal (UNCHANGED)
  const DepartmentShopsModal = ({ onClose }: { onClose: () => void }) => {
    if (!selectedDepartmentShops) return null;

    const { department, title, subtitle, shops, type, monthData } = selectedDepartmentShops;

    const getTypeStyles = (type: string) => {
      switch(type) {
        case 'all': return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
        case 'active': return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' };
        case 'inactive': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
        case '8pm': return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' };
        case 'verve': return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' };
        case 'both': return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' };
        case 'monthly': return { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' };
        default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
      }
    };

    const typeStyles = getTypeStyles(type);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg max-w-5xl w-full h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b flex-shrink-0">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {shops.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No shops found in this category.</p>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className={`${typeStyles.bg} p-4 rounded-lg text-center border ${typeStyles.border}`}>
                    <div className={`text-2xl font-bold ${typeStyles.text}`}>{shops.length}</div>
                    <div className="text-sm text-gray-600">Total Shops</div>
                  </div>
                  <div className={`${typeStyles.bg} p-4 rounded-lg text-center border ${typeStyles.border}`}>
                    <div className={`text-2xl font-bold ${typeStyles.text}`}>
                      {shops.reduce((sum, shop) => sum + (shop.total || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Cases</div>
                  </div>
                  <div className={`${typeStyles.bg} p-4 rounded-lg text-center border ${typeStyles.border}`}>
                    <div className={`text-2xl font-bold ${typeStyles.text}`}>
                      {shops.reduce((sum, shop) => sum + (shop.eightPM || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">8PM Cases</div>
                  </div>
                  <div className={`${typeStyles.bg} p-4 rounded-lg text-center border ${typeStyles.border}`}>
                    <div className={`text-2xl font-bold ${typeStyles.text}`}>
                      {shops.reduce((sum, shop) => sum + (shop.verve || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">VERVE Cases</div>
                  </div>
                </div>

                {/* Shop List Table - Fixed Scrolling */}
                <div className="border border-gray-200 rounded-lg">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cases</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">8PM Cases</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VERVE Cases</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {shops
                          .sort((a, b) => (b.total || 0) - (a.total || 0))
                          .map((shop, index) => (
                          <tr key={shop.shopId} className={index === 0 && shop.total > 0 ? 'bg-yellow-50' : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {index + 1}
                              {index === 0 && shop.total > 0 && <span className="ml-1">🏆</span>}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {shop.shopName || 'Unknown Shop'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {shop.salesman || 'Unknown'}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">
                              {(shop.total || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-purple-600">
                              {(shop.eightPM || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-orange-600">
                              {(shop.verve || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {(shop.eightPM || 0) > 0 && (shop.verve || 0) > 0 ? (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Both Brands</span>
                              ) : (shop.eightPM || 0) > 0 ? (
                                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">8PM Only</span>
                              ) : (shop.verve || 0) > 0 ? (
                                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">VERVE Only</span>
                              ) : (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">No Sales</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="border-t p-4 sm:p-6 flex justify-end space-x-3 flex-shrink-0">
            <button
              onClick={() => {
                const csvContent = shops.map(shop => 
                  `${shop.shopName},${shop.salesman},${shop.total},${shop.eightPM || 0},${shop.verve || 0}`
                ).join('\n');
                const header = 'Shop Name,Salesman,Total Cases,8PM Cases,VERVE Cases\n';
                const blob = new Blob([header + csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${department}_${type}_shops.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 🚀 NEW: Bird's Eye Intelligence Cards */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Department Intelligence Overview - {rollingLabel}
          </h2>
          <div className="text-sm text-blue-600 font-medium">
            🔄 Rolling 5-Month Window (Auto-Updates)
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Shop Activity Status */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 text-red-500 mr-2" />
              <h4 className="font-medium text-gray-800 text-sm">Inactive Shops</h4>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">60+ Days:</span>
                <span className="text-sm font-bold text-orange-600">{overallMetrics.inactive60DaysPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">90+ Days:</span>
                <span className="text-sm font-bold text-red-600">{overallMetrics.inactive90DaysPct}%</span>
              </div>
            </div>
          </div>

          {/* Volume Trends */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
              <h4 className="font-medium text-gray-800 text-sm">Volume Trends</h4>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Increasing:</span>
                <span className="text-sm font-bold text-green-600">{overallMetrics.volumeIncreasingPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Decreasing:</span>
                <span className="text-sm font-bold text-red-600">{overallMetrics.volumeDecreasingPct}%</span>
              </div>
            </div>
          </div>

          {/* Brand Penetration */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <Target className="w-4 h-4 text-purple-500 mr-2" />
              <h4 className="font-medium text-gray-800 text-sm">8PM Penetration</h4>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{overallMetrics.eightPMPenetration}%</div>
              <div className="text-xs text-gray-500">{overallMetrics.active8PM} shops</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <Target className="w-4 h-4 text-orange-500 mr-2" />
              <h4 className="font-medium text-gray-800 text-sm">VERVE Penetration</h4>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">{overallMetrics.vervePenetration}%</div>
              <div className="text-xs text-gray-500">{overallMetrics.activeVERVE} shops</div>
            </div>
          </div>

          {/* Health Score */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-4 h-4 text-blue-500 mr-2" />
              <h4 className="font-medium text-gray-800 text-sm">Health Score</h4>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold ${
                parseFloat(overallMetrics.inactive90DaysPct) < 10 ? 'text-green-600' :
                parseFloat(overallMetrics.inactive90DaysPct) < 20 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {parseFloat(overallMetrics.inactive90DaysPct) < 10 ? '🟢' :
                 parseFloat(overallMetrics.inactive90DaysPct) < 20 ? '🟡' : '🔴'}
              </div>
              <div className="text-xs text-gray-500">
                {parseFloat(overallMetrics.inactive90DaysPct) < 10 ? 'Healthy' :
                 parseFloat(overallMetrics.inactive90DaysPct) < 20 ? 'Moderate' : 'Critical'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Performance Overview (UNCHANGED) */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Department Performance Overview - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.deptPerformance).map(([dept, performance]) => {
            const coveragePercent = (performance.billedShops / performance.totalShops) * 100;
            const deptShops = departmentShopsData[dept];
            
            return (
              <div key={dept} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-medium text-gray-900 mb-2 truncate">{dept}</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => handleDepartmentShopsClick(
                      dept,
                      `${dept} Department - All Shops`,
                      `${deptShops?.allShops.length || 0} total shops in ${dept} department`,
                      deptShops?.allShops || [],
                      'all'
                    )}
                    className="text-xl sm:text-2xl font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    {performance.sales.toLocaleString()}
                  </button>
                  <div className="text-sm text-gray-500">Total Sales</div>
                  <div className="text-sm">
                    <button
                      onClick={() => handleDepartmentShopsClick(
                        dept,
                        `${dept} Department - Coverage Breakdown`,
                        `${performance.billedShops} active shops out of ${performance.totalShops} total`,
                        deptShops?.activeShops || [],
                        'active'
                      )}
                      className="font-medium text-green-600 hover:text-green-800 hover:underline cursor-pointer"
                    >
                      {performance.billedShops}
                    </button>
                    <span className="text-gray-500">/{performance.totalShops} shops</span>
                  </div>
                  <div className={`text-sm font-medium ${
                    coveragePercent > 80 ? 'text-green-600' : 
                    coveragePercent > 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {coveragePercent.toFixed(1)}% coverage
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Department Performance Table (UNCHANGED) */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Department Performance Analysis - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
          <p className="text-sm text-gray-500">Coverage and sales performance by territory (click numbers for details)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Shops</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Shops</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg per Shop</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">8PM Share</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VERVE Share</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(data.deptPerformance).map(([dept, performance]) => {
                const coveragePercent = (performance.billedShops / performance.totalShops) * 100;
                const avgPerShop = performance.billedShops > 0 ? (performance.sales / performance.billedShops).toFixed(1) : 0;
                
                const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept && shop.total > 0);
                const dept8PM = deptShops.reduce((sum: number, shop: any) => sum + shop.eightPM, 0);
                const deptVERVE = deptShops.reduce((sum: number, shop: any) => sum + shop.verve, 0);
                const deptTotal = dept8PM + deptVERVE;
                const eightPMShare = deptTotal > 0 ? ((dept8PM / deptTotal) * 100).toFixed(1) : '0';
                const verveShare = deptTotal > 0 ? ((deptVERVE / deptTotal) * 100).toFixed(1) : '0';
                
                const deptData = departmentShopsData[dept];
                
                return (
                  <tr key={dept} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{performance.totalShops}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleDepartmentShopsClick(
                            dept,
                            `${dept} - Active Shops`,
                            `${performance.billedShops} shops with sales in ${dept}`,
                            deptData?.activeShops || [],
                            'active'
                          )}
                          className="text-green-600 hover:text-green-800 hover:underline cursor-pointer font-medium"
                        >
                          {performance.billedShops}
                        </button>
                        {deptData?.inactiveShops.length > 0 && (
                          <span className="text-gray-400">
                            (<button
                              onClick={() => handleDepartmentShopsClick(
                                dept,
                                `${dept} - Inactive Shops`,
                                `${deptData.inactiveShops.length} shops with zero sales need attention`,
                                deptData.inactiveShops,
                                'inactive'
                              )}
                              className="text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                            >
                              {deptData.inactiveShops.length} inactive
                            </button>)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          coveragePercent > 80 
                            ? 'bg-green-100 text-green-800' 
                            : coveragePercent > 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {coveragePercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      <button
                        onClick={() => handleDepartmentShopsClick(
                          dept,
                          `${dept} Department - All Shops`,
                          `Complete shop list for ${dept} department (${performance.sales.toLocaleString()} total cases)`,
                          deptData?.allShops || [],
                          'all'
                        )}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {performance.sales.toLocaleString()}
                      </button>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{avgPerShop}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                      <button
                        onClick={() => handleDepartmentShopsClick(
                          dept,
                          `${dept} - 8PM Buyers`,
                          `${deptData?.shops8PM.length || 0} shops buying 8PM in ${dept}`,
                          deptData?.shops8PM || [],
                          '8pm'
                        )}
                        className="hover:text-purple-800 hover:underline cursor-pointer"
                      >
                        {eightPMShare}%
                      </button>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                      <button
                        onClick={() => handleDepartmentShopsClick(
                          dept,
                          `${dept} - VERVE Buyers`,
                          `${deptData?.shopsVERVE.length || 0} shops buying VERVE in ${dept}`,
                          deptData?.shopsVERVE || [],
                          'verve'
                        )}
                        className="hover:text-orange-800 hover:underline cursor-pointer"
                      >
                        {verveShare}%
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🚀 UPDATED: 5-Month Historical Department Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">5-Month Department Trend ({rollingLabel})</h3>
          <p className="text-sm text-gray-500">Historical sales performance by department - automatically updates each month (click for monthly details)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                {rollingWindow.map(month => (
                  <th key={month.month} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{month.shortName} Sales</th>
                ))}
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">5M Avg</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(data.deptPerformance).map(([dept, performance]) => {
                // Calculate historical data for this department dynamically
                const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept);
                
                const monthlyTotals = rollingWindow.map(month => 
                  deptShops.reduce((sum: number, shop: any) => sum + getShopDataForMonth(shop, month.key, 'total'), 0)
                );
                
                const avg5Month = (monthlyTotals.reduce((sum, val) => sum + val, 0) / 5).toFixed(0);
                
                // Simple trend calculation: compare last 2 vs first 3 months
                const recent2 = monthlyTotals.slice(-2).reduce((sum, val) => sum + val, 0) / 2;
                const earlier3 = monthlyTotals.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
                const trend = recent2 > earlier3 * 1.1 ? 'improving' : recent2 < earlier3 * 0.9 ? 'declining' : 'stable';
                
                const deptData = departmentShopsData[dept];
                
                return (
                  <tr key={dept} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept}</td>
                    {rollingWindow.map((month, index) => {
                      const monthTotal = monthlyTotals[index];
                      const monthEightPM = deptShops.reduce((sum: number, shop: any) => sum + getShopDataForMonth(shop, month.key, 'eightPM'), 0);
                      const monthVERVE = deptShops.reduce((sum: number, shop: any) => sum + getShopDataForMonth(shop, month.key, 'verve'), 0);
                      
                      return (
                        <td key={month.month} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => handleDepartmentShopsClick(
                              dept,
                              `${dept} - ${month.fullName} ${month.year} Performance`,
                              `${month.fullName} sales breakdown for ${dept} department`,
                              deptData?.allShops || [],
                              'monthly',
                              { month: month.fullName, total: monthTotal, eightPM: monthEightPM, verve: monthVERVE }
                            )}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {monthTotal.toLocaleString()}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{avg5Month}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        trend === 'improving' ? 'bg-green-100 text-green-800' :
                        trend === 'declining' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {trend === 'improving' ? '📈 Growing' : trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Brand Performance Comparison (UNCHANGED) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">8PM Performance by Department</h3>
            <p className="text-sm text-gray-500">Brand distribution across territories (click bars for shop details)</p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {Object.entries(data.deptPerformance).map(([dept, performance]) => {
                const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept && shop.total > 0);
                const dept8PM = deptShops.reduce((sum: number, shop: any) => sum + shop.eightPM, 0);
                const sharePercent = data.summary.total8PM > 0 ? (dept8PM / data.summary.total8PM) * 100 : 0;
                const deptData = departmentShopsData[dept];
                
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate flex-1 mr-2">{dept}</span>
                      <span className="whitespace-nowrap">{dept8PM.toLocaleString()} cases ({sharePercent.toFixed(1)}%)</span>
                    </div>
                    <button
                      onClick={() => handleDepartmentShopsClick(
                        dept,
                        `${dept} - 8PM Buyers`,
                        `${deptData?.shops8PM.length || 0} shops buying 8PM in ${dept} (${dept8PM.toLocaleString()} cases)`,
                        deptData?.shops8PM || [],
                        '8pm'
                      )}
                      className="w-full bg-gray-200 rounded-full h-2 hover:bg-gray-300 transition-colors cursor-pointer"
                    >
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${sharePercent}%` }}
                      ></div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">VERVE Performance by Department</h3>
            <p className="text-sm text-gray-500">Brand distribution across territories (click bars for shop details)</p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {Object.entries(data.deptPerformance).map(([dept, performance]) => {
                const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept && shop.total > 0);
                const deptVERVE = deptShops.reduce((sum: number, shop: any) => sum + shop.verve, 0);
                const sharePercent = data.summary.totalVERVE > 0 ? (deptVERVE / data.summary.totalVERVE) * 100 : 0;
                const deptData = departmentShopsData[dept];
                
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate flex-1 mr-2">{dept}</span>
                      <span className="whitespace-nowrap">{deptVERVE.toLocaleString()} cases ({sharePercent.toFixed(1)}%)</span>
                    </div>
                    <button
                      onClick={() => handleDepartmentShopsClick(
                        dept,
                        `${dept} - VERVE Buyers`,
                        `${deptData?.shopsVERVE.length || 0} shops buying VERVE in ${dept} (${deptVERVE.toLocaleString()} cases)`,
                        deptData?.shopsVERVE || [],
                        'verve'
                      )}
                      className="w-full bg-gray-200 rounded-full h-2 hover:bg-gray-300 transition-colors cursor-pointer"
                    >
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${sharePercent}%` }}
                      ></div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Department Performance Summary (UNCHANGED) */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Department Analysis Summary - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.deptPerformance).slice(0, 4).map(([dept, performance]) => {
            const coveragePercent = (performance.billedShops / performance.totalShops) * 100;
            const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept);
            const deptData = departmentShopsData[dept];
            
            // Calculate trend using rolling window
            const monthlyTotals = rollingWindow.map(month => 
              deptShops.reduce((sum: number, shop: any) => sum + getShopDataForMonth(shop, month.key, 'total'), 0)
            );
            const recent2 = monthlyTotals.slice(-2).reduce((sum, val) => sum + val, 0) / 2;
            const earlier3 = monthlyTotals.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
            const trend = recent2 > earlier3 * 1.1 ? '📈' : recent2 < earlier3 * 0.9 ? '📉' : '➡️';
            
            return (
              <button
                key={dept}
                onClick={() => handleDepartmentShopsClick(
                  dept,
                  `${dept} Department Overview`,
                  `Complete department analysis for ${dept}`,
                  deptData?.allShops || [],
                  'all'
                )}
                className="text-center bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="text-lg font-bold text-gray-900 mb-1">{dept}</div>
                <div className="text-sm text-blue-600 font-medium">{performance.sales.toLocaleString()} cases</div>
                <div className="text-xs text-gray-500">{coveragePercent.toFixed(1)}% coverage</div>
                <div className="text-lg mt-2">{trend}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal (UNCHANGED) */}
      {showDepartmentShops && (
        <DepartmentShopsModal 
          onClose={() => {
            setShowDepartmentShops(false);
            setSelectedDepartmentShops(null);
          }} 
        />
      )}
    </div>
  );
};

export default DepartmentTab;
