'use client';

import React, { useState, useMemo } from 'react';
import { X, AlertTriangle, TrendingUp, TrendingDown, Activity, Clock, Target, Info } from 'lucide-react';

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
// 🚀 HELPER FUNCTIONS WITH CLEAR NAMING
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

// 🚀 CLEAR: 5-MONTH ROLLING WINDOW CALCULATION
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

// 🚀 CLEAR: ROLLING WINDOW LABEL
const getDepartmentRollingLabel = (currentMonth: string, currentYear: string) => {
  const window = getDepartmentRolling5MonthWindow(currentMonth, currentYear);
  return window.map(m => m.shortName).join('-') + ` ${currentYear}`;
};

// 🚀 CLEAR: GET SHOP DATA FOR ANY SPECIFIC MONTH
const getShopDataForMonth = (shop: ShopData, monthKey: string, dataType: 'total' | 'eightPM' | 'verve' = 'total') => {
  if (monthKey === 'current') {
    return shop[dataType] || 0;
  }
  
  // Historical month data with clear mapping
  let fieldKey: string;
  switch (dataType) {
    case 'eightPM':
      fieldKey = `${monthKey}EightPM`;
      break;
    case 'verve':
      fieldKey = `${monthKey}Verve`;
      break;
    default:
      fieldKey = `${monthKey}Total`;
  }
  
  const value = (shop as any)[fieldKey];
  return typeof value === 'number' ? value : 0;
};

// 🚀 CLEAR: TREND PATTERN ANALYSIS
const analyzeTrendPattern = (recentMonthSales: number, middleMonthSales: number, oldestMonthSales: number) => {
  // Define clear trend patterns using completed months only
  if (recentMonthSales > middleMonthSales && middleMonthSales > oldestMonthSales && oldestMonthSales > 0) {
    return 'uptrend'; // Accelerating growth: Jun > May > Apr
  } else if (recentMonthSales > middleMonthSales && middleMonthSales > 0) {
    return 'growing'; // Recent improvement: Jun > May
  } else if (recentMonthSales < middleMonthSales && middleMonthSales > 0) {
    return 'declining'; // Recent decline: Jun < May
  } else if (recentMonthSales > 0 && middleMonthSales === 0 && oldestMonthSales === 0) {
    return 'new'; // New customer
  } else if (Math.abs(recentMonthSales - middleMonthSales) <= (middleMonthSales * 0.1) && middleMonthSales > 0) {
    return 'stable'; // Within ±10%
  } else {
    return 'volatile'; // Inconsistent pattern
  }
};

// 🚀 ENHANCED: DEPARTMENT INTELLIGENCE WITH CRYSTAL CLEAR CALCULATIONS
const calculateDepartmentIntelligenceWithClearLabels = (salesData: Record<string, ShopData>, currentMonth: string, currentYear: string) => {
  const allShops = Object.values(salesData);
  const rollingWindow = getDepartmentRolling5MonthWindow(currentMonth, currentYear);
  
  // Get the last 3 completed months for trend analysis (CLEAR NAMING)
  const recentCompletedMonth = rollingWindow[rollingWindow.length - 2]; // Previous month (June)
  const middleCompletedMonth = rollingWindow[rollingWindow.length - 3]; // Month before (May)  
  const oldestCompletedMonth = rollingWindow[rollingWindow.length - 4]; // Month before that (April)
  
  console.log('🔍 CLEAR Department Analysis:', {
    totalShopsInSystem: allShops.length,
    departmentsFound: [...new Set(allShops.map(shop => shop.department))],
    trendAnalysisMonths: {
      recent: `${recentCompletedMonth.fullName} ${recentCompletedMonth.year}`,
      middle: `${middleCompletedMonth.fullName} ${middleCompletedMonth.year}`,
      oldest: `${oldestCompletedMonth.fullName} ${oldestCompletedMonth.year}`
    }
  });

  // Calculate activity and trends for each shop (CLEAR PROCESSING)
  const shopsWithClearActivityData = allShops.map(shop => {
    let daysSinceLastOrder = -1;
    let lastOrderValue = 0;
    
    // Check from most recent to oldest month to find last activity
    for (let i = rollingWindow.length - 1; i >= 0; i--) {
      const monthData = rollingWindow[i];
      const monthSales = getShopDataForMonth(shop, monthData.key, 'total');
      
      if (monthSales > 0) {
        daysSinceLastOrder = i === rollingWindow.length - 1 ? 0 : (rollingWindow.length - 1 - i) * 30;
        lastOrderValue = monthSales;
        break;
      }
    }
    
    if (daysSinceLastOrder === -1) {
      daysSinceLastOrder = 999; // Never ordered in the window
    }
    
    // Analyze trend pattern using completed months (CLEAR TREND LOGIC)
    const recentMonthSales = getShopDataForMonth(shop, recentCompletedMonth.key, 'total');
    const middleMonthSales = getShopDataForMonth(shop, middleCompletedMonth.key, 'total');
    const oldestMonthSales = getShopDataForMonth(shop, oldestCompletedMonth.key, 'total');
    const shopTrendPattern = analyzeTrendPattern(recentMonthSales, middleMonthSales, oldestMonthSales);
    
    return {
      ...shop,
      daysSinceLastOrder,
      lastOrderValue,
      hasRecentActivity: daysSinceLastOrder < 30,
      shopTrendPattern,
      recentMonthSales,
      middleMonthSales,
      oldestMonthSales
    };
  });
  
  // Calculate department-level metrics with CRYSTAL CLEAR naming
  const departmentIntelligenceData: Record<string, any> = {};
  
  // Filter valid departments (no nulls, unknowns, etc.)
  const validDepartments = [...new Set(allShops.map(shop => shop.department))]
    .filter(dept => dept && dept !== 'Unknown' && dept.trim() !== '');
  
  validDepartments.forEach(departmentName => {
    const departmentShops = shopsWithClearActivityData.filter(shop => shop.department === departmentName);
    
    // CLEAR COUNTS: Activity-based categorization
    const totalShopsInDepartment = departmentShops.length;
    const shopsActiveInLast30Days = departmentShops.filter(shop => shop.daysSinceLastOrder < 30).length;
    const shopsInactive60to90Days = departmentShops.filter(shop => shop.daysSinceLastOrder >= 60 && shop.daysSinceLastOrder < 90).length;
    const shopsInactiveOver90Days = departmentShops.filter(shop => shop.daysSinceLastOrder >= 90 && shop.daysSinceLastOrder < 999).length;
    const shopsNeverOrderedInWindow = departmentShops.filter(shop => shop.daysSinceLastOrder === 999).length;
    
    // CLEAR COUNTS: Trend-based categorization  
    const shopsWithUptrendPattern = departmentShops.filter(shop => shop.shopTrendPattern === 'uptrend');
    const shopsWithGrowingPattern = departmentShops.filter(shop => shop.shopTrendPattern === 'growing');
    const shopsWithDecliningPattern = departmentShops.filter(shop => shop.shopTrendPattern === 'declining');
    const shopsWithStablePattern = departmentShops.filter(shop => shop.shopTrendPattern === 'stable');
    const shopsWithVolatilePattern = departmentShops.filter(shop => shop.shopTrendPattern === 'volatile');
    const shopsWithNewPattern = departmentShops.filter(shop => shop.shopTrendPattern === 'new');
    
    // CLEAR COUNTS: Brand penetration (current month)
    const shopsCurrentlyBuying8PM = departmentShops.filter(shop => (shop.eightPM || 0) > 0).length;
    const shopsCurrentlyBuyingVERVE = departmentShops.filter(shop => (shop.verve || 0) > 0).length;
    
    // CLEAR TOTALS: Sales volumes
    const total8PMCasesInDepartment = departmentShops.reduce((sum, shop) => sum + (shop.eightPM || 0), 0);
    const totalVERVECasesInDepartment = departmentShops.reduce((sum, shop) => sum + (shop.verve || 0), 0);
    
    // CLEAR PERCENTAGES: For dashboard display
    const percentageShopsWithUptrend = totalShopsInDepartment > 0 ? ((shopsWithUptrendPattern.length / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageShopsWithDeclining = totalShopsInDepartment > 0 ? ((shopsWithDecliningPattern.length / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageShopsWithStable = totalShopsInDepartment > 0 ? ((shopsWithStablePattern.length / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageShopsInactiveOver90Days = totalShopsInDepartment > 0 ? ((shopsInactiveOver90Days / totalShopsInDepartment) * 100).toFixed(1) : '0';
    
    const percentage8PMPenetration = totalShopsInDepartment > 0 ? ((shopsCurrentlyBuying8PM / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageVERVEPenetration = totalShopsInDepartment > 0 ? ((shopsCurrentlyBuyingVERVE / totalShopsInDepartment) * 100).toFixed(1) : '0';
    
    // Health assessment
    const inactiveRate = totalShopsInDepartment > 0 ? (shopsInactiveOver90Days / totalShopsInDepartment) * 100 : 0;
    const departmentHealthScore = inactiveRate < 10 ? 'healthy' : inactiveRate < 20 ? 'moderate' : 'critical';
    
    departmentIntelligenceData[departmentName] = {
      // CLEAR: Raw counts
      totalShopsInDepartment,
      shopsActiveInLast30Days,
      shopsInactive60to90Days,
      shopsInactiveOver90Days,
      shopsNeverOrderedInWindow,
      
      // CLEAR: Trend analysis with shop lists
      shopsWithUptrendPattern,
      shopsWithGrowingPattern,
      shopsWithDecliningPattern,
      shopsWithStablePattern,
      shopsWithVolatilePattern,
      shopsWithNewPattern,
      
      // CLEAR: Percentages for UI display
      percentageShopsWithUptrend,
      percentageShopsWithDeclining,
      percentageShopsWithStable,
      percentageShopsInactiveOver90Days,
      
      // CLEAR: Brand penetration
      total8PMCasesInDepartment,
      totalVERVECasesInDepartment,
      shopsCurrentlyBuying8PM,
      shopsCurrentlyBuyingVERVE,
      percentage8PMPenetration,
      percentageVERVEPenetration,
      
      // CLEAR: Health indicators
      departmentHealthScore,
      trendAnalysisDescription: `${recentCompletedMonth.fullName} vs ${middleCompletedMonth.fullName} vs ${oldestCompletedMonth.fullName}`
    };
  });
  
  return departmentIntelligenceData;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const DepartmentTab = ({ data }: { data: DashboardData }) => {
  // Rolling window calculation
  const rollingWindow = useMemo(() => {
    return getDepartmentRolling5MonthWindow(data.currentMonth, data.currentYear);
  }, [data.currentMonth, data.currentYear]);

  const rollingLabel = useMemo(() => {
    return getDepartmentRollingLabel(data.currentMonth, data.currentYear);
  }, [data.currentMonth, data.currentYear]);

  // CLEAR: Department intelligence calculation
  const departmentIntelligence = useMemo(() => {
    return calculateDepartmentIntelligenceWithClearLabels(data.salesData, data.currentMonth, data.currentYear);
  }, [data.salesData, data.currentMonth, data.currentYear]);

  // STATE for drill-down modals
  const [showDepartmentShops, setShowDepartmentShops] = useState(false);
  const [selectedDepartmentShops, setSelectedDepartmentShops] = useState<{
    department: string;
    title: string;
    subtitle: string;
    shops: any[];
    type: 'all' | 'active' | 'inactive' | '8pm' | 'verve' | 'both' | 'monthly' | 'uptrend' | 'declining' | 'stable';
    monthData?: { month: string; total: number; eightPM: number; verve: number; };
  } | null>(null);

  // CLEAR: Functions to handle trend drill-down clicks
  const handleTrendDrillDown = (
    department: string,
    trendType: 'uptrend' | 'declining' | 'stable',
    shops: any[],
    percentage: string
  ) => {
    const trendLabels = {
      uptrend: 'Shops with Accelerating Growth (Jun > May > Apr)',
      declining: 'Shops with Declining Sales (Jun < May)', 
      stable: 'Shops with Consistent Performance (±10% variation)'
    };
    
    const trendDescriptions = {
      uptrend: `These ${shops.length} shops show accelerating growth pattern over the last 3 months`,
      declining: `These ${shops.length} shops show declining pattern and need immediate attention`,
      stable: `These ${shops.length} shops maintain consistent performance levels`
    };

    setSelectedDepartmentShops({
      department,
      title: `${department} - ${trendLabels[trendType]}`,
      subtitle: trendDescriptions[trendType],
      shops,
      type: trendType
    });
    setShowDepartmentShops(true);
  };

  // CLEAR: Functions to handle drill-down clicks
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

  // Memoized department shop data for drill-downs
  const departmentShopsData = useMemo(() => {
    const deptData: Record<string, any> = {};
    
    const validDepartments = Object.keys(data.deptPerformance).filter(dept => 
      dept && dept !== 'Unknown' && dept.trim() !== ''
    );
    
    validDepartments.forEach(dept => {
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

  // ENHANCED: Department Shops Modal with Clear Labels
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
        case 'uptrend': return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' };
        case 'declining': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
        case 'stable': return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
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
                {/* CLEAR: Summary Stats with Proper Calculations */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className={`${typeStyles.bg} p-4 rounded-lg text-center border ${typeStyles.border}`}>
                    <div className={`text-2xl font-bold ${typeStyles.text}`}>{shops.length}</div>
                    <div className="text-sm text-gray-600">Total Shops in Category</div>
                  </div>
                  <div className={`${typeStyles.bg} p-4 rounded-lg text-center border ${typeStyles.border}`}>
                    <div className={`text-2xl font-bold ${typeStyles.text}`}>
                      {/* FIXED: Use correct data source for total cases */}
                      {shops.reduce((sum, shop) => {
                        // Use the same data source as the overview cards
                        return sum + (shop.total || 0);
                      }, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Cases (Current Month)</div>
                  </div>
                  <div className={`${typeStyles.bg} p-4 rounded-lg text-center border ${typeStyles.border}`}>
                    <div className={`text-2xl font-bold ${typeStyles.text}`}>
                      {shops.reduce((sum, shop) => sum + (shop.eightPM || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">8PM Brand Cases</div>
                  </div>
                  <div className={`${typeStyles.bg} p-4 rounded-lg text-center border ${typeStyles.border}`}>
                    <div className={`text-2xl font-bold ${typeStyles.text}`}>
                      {shops.reduce((sum, shop) => sum + (shop.verve || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">VERVE Brand Cases</div>
                  </div>
                </div>

                {/* Trend Analysis Summary for trend types */}
                {(type === 'uptrend' || type === 'declining' || type === 'stable') && (
                  <div className={`mb-6 ${typeStyles.bg} p-4 rounded-lg border ${typeStyles.border}`}>
                    <h4 className={`font-medium ${typeStyles.text} mb-2 flex items-center`}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Trend Analysis Pattern: {type.charAt(0).toUpperCase() + type.slice(1)}
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <div className="font-bold text-gray-800">June 2025</div>
                        <div className="text-gray-600">Most Recent Month</div>
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">May 2025</div>
                        <div className="text-gray-600">Middle Comparison</div>
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">April 2025</div>
                        <div className="text-gray-600">Baseline Comparison</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shop List Table with Clear Headers */}
                <div className="border border-gray-200 rounded-lg">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                          
                          {/* Dynamic columns based on view type */}
                          {(type === 'uptrend' || type === 'declining' || type === 'stable') ? (
                            <>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jun Cases</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">May Cases</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apr Cases</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend Pattern</th>
                            </>
                          ) : (
                            <>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Month Total</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">8PM Cases</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VERVE Cases</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Status</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {shops
                          .sort((a, b) => (b.total || 0) - (a.total || 0))
                          .map((shop, index) => (
                          <tr key={shop.shopId} className={index === 0 && shop.total > 0 ? 'bg-yellow-50' : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {index + 1}
                              {index === 0 && shop.total > 0 && <span className="ml-1" title="Top Performer">🏆</span>}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {shop.shopName || 'Unknown Shop'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {shop.salesman || 'Unknown'}
                            </td>
                            
                            {/* Data columns based on view type */}
                            {(type === 'uptrend' || type === 'declining' || type === 'stable') ? (
                              <>
                                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                  {(shop.juneTotal || 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {(shop.mayTotal || 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {(shop.aprilTotal || 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    shop.shopTrendPattern === 'uptrend' ? 'bg-green-100 text-green-800' :
                                    shop.shopTrendPattern === 'declining' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {shop.shopTrendPattern === 'uptrend' ? '📈 Accelerating' :
                                     shop.shopTrendPattern === 'declining' ? '📉 Declining' :
                                     '➡️ Stable'}
                                  </span>
                                </td>
                              </>
                            ) : (
                              <>
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
                                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">No Brand Sales</span>
                                  )}
                                </td>
                              </>
                            )}
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
                const header = 'Shop Name,Salesman,Current Month Total,8PM Cases,VERVE Cases\n';
                const blob = new Blob([header + csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${department}_${type}_shops_${getShortMonthName(data.currentMonth)}_${data.currentYear}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
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
      {/* 🚀 ENHANCED: Department Intelligence Overview with Crystal Clear Labels */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Department Intelligence Overview - {rollingLabel}
          </h2>
          <div className="text-sm text-blue-600 font-medium flex items-center">
            <Info className="w-4 h-4 mr-1" />
            Real-Time Trend Analysis (Jun vs May vs Apr)
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {Object.entries(departmentIntelligence)
            .filter(([dept]) => dept && dept !== 'Unknown' && dept.trim() !== '')
            .map(([dept, intelligence]) => (
            <div key={dept} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">{dept}</h4>
                <div className={`w-3 h-3 rounded-full ${
                  intelligence.departmentHealthScore === 'healthy' ? 'bg-green-500' :
                  intelligence.departmentHealthScore === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                }`} title={`Health: ${intelligence.departmentHealthScore}`}></div>
              </div>
              
              <div className="space-y-2">
                {/* CLEAR: Trend Metrics with Proper Labels */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Growth Trend:
                  </span>
                  <button
                    onClick={() => handleTrendDrillDown(dept, 'uptrend', intelligence.shopsWithUptrendPattern, intelligence.percentageShopsWithUptrend)}
                    className="text-sm font-bold text-green-600 hover:text-green-800 hover:underline"
                    title={`${intelligence.shopsWithUptrendPattern.length} shops showing accelerating growth`}
                  >
                    {intelligence.percentageShopsWithUptrend}% shops
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 flex items-center">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Declining Trend:
                  </span>
                  <button
                    onClick={() => handleTrendDrillDown(dept, 'declining', intelligence.shopsWithDecliningPattern, intelligence.percentageShopsWithDeclining)}
                    className="text-sm font-bold text-red-600 hover:text-red-800 hover:underline"
                    title={`${intelligence.shopsWithDecliningPattern.length} shops showing declining sales`}
                  >
                    {intelligence.percentageShopsWithDeclining}% shops
                  </button>
                </div>
                
                {/* CLEAR: Brand Penetration with Proper Labels */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">8PM Brand Buyers:</span>
                  <button
                    onClick={() => handleDepartmentShopsClick(
                      dept,
                      `${dept} - 8PM Brand Buyers`,
                      `${intelligence.shopsCurrentlyBuying8PM} shops currently buying 8PM brand in ${dept}`,
                      departmentShopsData[dept]?.shops8PM || [],
                      '8pm'
                    )}
                    className="text-sm font-bold text-purple-600 hover:text-purple-800 hover:underline"
                    title={`${intelligence.shopsCurrentlyBuying8PM} out of ${intelligence.totalShopsInDepartment} shops buying 8PM`}
                  >
                    {intelligence.percentage8PMPenetration}% shops
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">VERVE Brand Buyers:</span>
                  <button
                    onClick={() => handleDepartmentShopsClick(
                      dept,
                      `${dept} - VERVE Brand Buyers`,
                      `${intelligence.shopsCurrentlyBuyingVERVE} shops currently buying VERVE brand in ${dept}`,
                      departmentShopsData[dept]?.shopsVERVE || [],
                      'verve'
                    )}
                    className="text-sm font-bold text-orange-600 hover:text-orange-800 hover:underline"
                    title={`${intelligence.shopsCurrentlyBuyingVERVE} out of ${intelligence.totalShopsInDepartment} shops buying VERVE`}
                  >
                    {intelligence.percentageVERVEPenetration}% shops
                  </button>
                </div>
                
                {/* CLEAR: Activity Indicator with Days Label */}
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-xs text-gray-600 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Inactive 90+ Days:
                  </span>
                  <span className={`text-sm font-bold ${
                    parseFloat(intelligence.percentageShopsInactiveOver90Days) < 10 ? 'text-green-600' :
                    parseFloat(intelligence.percentageShopsInactiveOver90Days) < 20 ? 'text-yellow-600' : 'text-red-600'
                  }`} title={`${intelligence.shopsInactiveOver90Days} shops haven't ordered for 90+ days`}>
                    {intelligence.percentageShopsInactiveOver90Days}% shops
                  </span>
                </div>
              </div>
              
              <div className="mt-3 text-center">
                <button
                  onClick={() => handleDepartmentShopsClick(
                    dept,
                    `${dept} Department - Complete Overview`,
                    `All ${intelligence.totalShopsInDepartment} shops in ${dept} department with detailed analysis`,
                    departmentShopsData[dept]?.allShops || [],
                    'all'
                  )}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center"
                >
                  <Target className="w-3 h-3 mr-1" />
                  View All {intelligence.totalShopsInDepartment} Shops →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CLEAR: Legend explaining the metrics */}
        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
          <h5 className="font-medium text-blue-900 mb-2">📊 Metrics Explanation:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
            <div><strong>Growth Trend:</strong> % of shops with Jun > May > Apr sales</div>
            <div><strong>Declining Trend:</strong> % of shops with Jun < May sales</div>
            <div><strong>8PM/VERVE Buyers:</strong> % of shops currently buying each brand</div>
            <div><strong>Inactive 90+ Days:</strong> % of shops with no orders for 90+ days</div>
          </div>
        </div>
      </div>

      {/* Rest of the component remains the same... */}
      {/* Department Performance Overview, tables, etc. would continue here */}

      {/* Modal */}
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
