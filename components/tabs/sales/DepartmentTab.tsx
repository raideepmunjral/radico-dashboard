'use client';

import React, { useState, useMemo } from 'react';
import { X, AlertTriangle, TrendingUp, TrendingDown, Activity, Clock, Target, Info, Download } from 'lucide-react';

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
  
  // Historical data
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
  
  // Extended Historical Data
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
// HELPER FUNCTIONS WITH CLEAR NAMING
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

// NEW: Convert month name to month key
const getMonthKeyFromName = (monthName: string) => {
  const monthNames = {
    'january': 'january', 'february': 'february', 'march': 'march', 
    'april': 'april', 'may': 'may', 'june': 'june',
    'july': 'july', 'august': 'august', 'september': 'september', 
    'october': 'october', 'november': 'november', 'december': 'december'
  };
  return monthNames[monthName.toLowerCase()] || 'unknown';
};

// 5-MONTH ROLLING WINDOW CALCULATION
const getDepartmentRolling5MonthWindow = (currentMonth: string, currentYear: string) => {
  const monthNum = parseInt(currentMonth);
  const yearNum = parseInt(currentYear);
  const months = [];
  
  for (let i = 4; i >= 0; i--) {
    let targetMonth = monthNum - i;
    let targetYear = yearNum;
    
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

// ROLLING WINDOW LABEL
const getDepartmentRollingLabel = (currentMonth: string, currentYear: string) => {
  const window = getDepartmentRolling5MonthWindow(currentMonth, currentYear);
  return window.map(m => m.shortName).join('-') + ` ${currentYear}`;
};

// GET SHOP DATA FOR ANY SPECIFIC MONTH
const getShopDataForMonth = (shop: ShopData, monthKey: string, dataType: 'total' | 'eightPM' | 'verve' = 'total') => {
  if (monthKey === 'current') {
    return shop[dataType] || 0;
  }
  
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

// TREND PATTERN ANALYSIS
const analyzeTrendPattern = (recentMonthSales: number, middleMonthSales: number, oldestMonthSales: number) => {
  if (recentMonthSales > middleMonthSales && middleMonthSales > oldestMonthSales && oldestMonthSales > 0) {
    return 'uptrend';
  } else if (recentMonthSales > middleMonthSales && middleMonthSales > 0) {
    return 'growing';
  } else if (recentMonthSales < middleMonthSales && middleMonthSales > 0) {
    return 'declining';
  } else if (recentMonthSales > 0 && middleMonthSales === 0 && oldestMonthSales === 0) {
    return 'new';
  } else if (Math.abs(recentMonthSales - middleMonthSales) <= (middleMonthSales * 0.1) && middleMonthSales > 0) {
    return 'stable';
  } else {
    return 'volatile';
  }
};

// 🚀 NEW: BRAND-SPECIFIC ACTIVITY TRACKING
const getBrandSpecificActivity = (shop: ShopData, rollingWindow: any[], brand: '8PM' | 'VERVE') => {
  let daysSinceLastOrder = -1;
  let lastOrderValue = 0;
  
  for (let i = rollingWindow.length - 1; i >= 0; i--) {
    const monthData = rollingWindow[i];
    const monthSales = getShopDataForMonth(shop, monthData.key, brand === '8PM' ? 'eightPM' : 'verve');
    
    if (monthSales > 0) {
      daysSinceLastOrder = i === rollingWindow.length - 1 ? 0 : (rollingWindow.length - 1 - i) * 30;
      lastOrderValue = monthSales;
      break;
    }
  }
  
  if (daysSinceLastOrder === -1) {
    daysSinceLastOrder = 999; // Never ordered this brand in window
  }
  
  return { daysSinceLastOrder, lastOrderValue };
};

// 🚀 ENHANCED: DEPARTMENT INTELLIGENCE WITH BRAND-SPECIFIC INACTIVE TRACKING
const calculateDepartmentIntelligenceWithBrandSpecificTracking = (salesData: Record<string, ShopData>, currentMonth: string, currentYear: string) => {
  const allShops = Object.values(salesData);
  const rollingWindow = getDepartmentRolling5MonthWindow(currentMonth, currentYear);
  
  const recentCompletedMonth = rollingWindow[rollingWindow.length - 2];
  const middleCompletedMonth = rollingWindow[rollingWindow.length - 3];  
  const oldestCompletedMonth = rollingWindow[rollingWindow.length - 4];

  const shopsWithBrandSpecificActivityData = allShops.map(shop => {
    // Get brand-specific activity
    const activity8PM = getBrandSpecificActivity(shop, rollingWindow, '8PM');
    const activityVERVE = getBrandSpecificActivity(shop, rollingWindow, 'VERVE');
    
    // Overall activity (for backward compatibility)
    let daysSinceLastOrder = Math.min(activity8PM.daysSinceLastOrder, activityVERVE.daysSinceLastOrder);
    if (daysSinceLastOrder === 999 && (activity8PM.daysSinceLastOrder < 999 || activityVERVE.daysSinceLastOrder < 999)) {
      daysSinceLastOrder = Math.max(activity8PM.daysSinceLastOrder, activityVERVE.daysSinceLastOrder);
    }
    
    const recentMonthSales = getShopDataForMonth(shop, recentCompletedMonth.key, 'total');
    const middleMonthSales = getShopDataForMonth(shop, middleCompletedMonth.key, 'total');
    const oldestMonthSales = getShopDataForMonth(shop, oldestCompletedMonth.key, 'total');
    const shopTrendPattern = analyzeTrendPattern(recentMonthSales, middleMonthSales, oldestMonthSales);
    
    return {
      ...shop,
      // Overall activity
      daysSinceLastOrder,
      lastOrderValue: Math.max(activity8PM.lastOrderValue, activityVERVE.lastOrderValue),
      hasRecentActivity: daysSinceLastOrder < 30,
      
      // 🚀 NEW: Brand-specific activity
      daysSinceLastOrder8PM: activity8PM.daysSinceLastOrder,
      lastOrderValue8PM: activity8PM.lastOrderValue,
      daysSinceLastOrderVERVE: activityVERVE.daysSinceLastOrder,
      lastOrderValueVERVE: activityVERVE.lastOrderValue,
      
      shopTrendPattern,
      recentMonthSales,
      middleMonthSales,
      oldestMonthSales
    };
  });
  
  const departmentIntelligenceData: Record<string, any> = {};
  
  const validDepartments = [...new Set(allShops.map(shop => shop.department))]
    .filter(dept => dept && dept !== 'Unknown' && dept.trim() !== '');
  
  validDepartments.forEach(departmentName => {
    const departmentShops = shopsWithBrandSpecificActivityData.filter(shop => shop.department === departmentName);
    
    const totalShopsInDepartment = departmentShops.length;
    const shopsActiveInLast30Days = departmentShops.filter(shop => shop.daysSinceLastOrder < 30).length;
    
    // 🚀 NEW: Brand-specific inactive tracking
    const shopsInactive60Days8PM = departmentShops.filter(shop => shop.daysSinceLastOrder8PM >= 60 && shop.daysSinceLastOrder8PM < 90).length;
    const shopsInactive90Days8PM = departmentShops.filter(shop => shop.daysSinceLastOrder8PM >= 90 && shop.daysSinceLastOrder8PM < 999).length;
    const shopsInactive60DaysVERVE = departmentShops.filter(shop => shop.daysSinceLastOrderVERVE >= 60 && shop.daysSinceLastOrderVERVE < 90).length;
    const shopsInactive90DaysVERVE = departmentShops.filter(shop => shop.daysSinceLastOrderVERVE >= 90 && shop.daysSinceLastOrderVERVE < 999).length;
    
    // Shop lists for drill-downs
    const shopsInactive60Days8PMList = departmentShops.filter(shop => shop.daysSinceLastOrder8PM >= 60 && shop.daysSinceLastOrder8PM < 90);
    const shopsInactive90Days8PMList = departmentShops.filter(shop => shop.daysSinceLastOrder8PM >= 90 && shop.daysSinceLastOrder8PM < 999);
    const shopsInactive60DaysVERVEList = departmentShops.filter(shop => shop.daysSinceLastOrderVERVE >= 60 && shop.daysSinceLastOrderVERVE < 90);
    const shopsInactive90DaysVERVEList = departmentShops.filter(shop => shop.daysSinceLastOrderVERVE >= 90 && shop.daysSinceLastOrderVERVE < 999);
    
    // Legacy: Overall inactive (both brands)
    const shopsInactive60to90Days = departmentShops.filter(shop => shop.daysSinceLastOrder >= 60 && shop.daysSinceLastOrder < 90).length;
    const shopsInactiveOver90Days = departmentShops.filter(shop => shop.daysSinceLastOrder >= 90 && shop.daysSinceLastOrder < 999).length;
    const shopsNeverOrderedInWindow = departmentShops.filter(shop => shop.daysSinceLastOrder === 999).length;
    
    const shopsWithUptrendPattern = departmentShops.filter(shop => shop.shopTrendPattern === 'uptrend');
    const shopsWithGrowingPattern = departmentShops.filter(shop => shop.shopTrendPattern === 'growing');
    const shopsWithDecliningPattern = departmentShops.filter(shop => shop.shopTrendPattern === 'declining');
    const shopsWithStablePattern = departmentShops.filter(shop => shop.shopTrendPattern === 'stable');
    const shopsWithVolatilePattern = departmentShops.filter(shop => shop.shopTrendPattern === 'volatile');
    const shopsWithNewPattern = departmentShops.filter(shop => shop.shopTrendPattern === 'new');
    
    const shopsCurrentlyBuying8PM = departmentShops.filter(shop => (shop.eightPM || 0) > 0).length;
    const shopsCurrentlyBuyingVERVE = departmentShops.filter(shop => (shop.verve || 0) > 0).length;
    
    const total8PMCasesInDepartment = departmentShops.reduce((sum, shop) => sum + (shop.eightPM || 0), 0);
    const totalVERVECasesInDepartment = departmentShops.reduce((sum, shop) => sum + (shop.verve || 0), 0);
    
    // Calculate percentages
    const percentageShopsWithUptrend = totalShopsInDepartment > 0 ? ((shopsWithUptrendPattern.length / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageShopsWithGrowing = totalShopsInDepartment > 0 ? ((shopsWithGrowingPattern.length / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageShopsWithDeclining = totalShopsInDepartment > 0 ? ((shopsWithDecliningPattern.length / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageShopsWithStable = totalShopsInDepartment > 0 ? ((shopsWithStablePattern.length / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageShopsWithNew = totalShopsInDepartment > 0 ? ((shopsWithNewPattern.length / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageShopsWithVolatile = totalShopsInDepartment > 0 ? ((shopsWithVolatilePattern.length / totalShopsInDepartment) * 100).toFixed(1) : '0';
    
    // 🚀 NEW: Brand-specific percentages
    const percentageShopsInactive60Days8PM = totalShopsInDepartment > 0 ? ((shopsInactive60Days8PM / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageShopsInactive90Days8PM = totalShopsInDepartment > 0 ? ((shopsInactive90Days8PM / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageShopsInactive60DaysVERVE = totalShopsInDepartment > 0 ? ((shopsInactive60DaysVERVE / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageShopsInactive90DaysVERVE = totalShopsInDepartment > 0 ? ((shopsInactive90DaysVERVE / totalShopsInDepartment) * 100).toFixed(1) : '0';
    
    const percentage8PMPenetration = totalShopsInDepartment > 0 ? ((shopsCurrentlyBuying8PM / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageVERVEPenetration = totalShopsInDepartment > 0 ? ((shopsCurrentlyBuyingVERVE / totalShopsInDepartment) * 100).toFixed(1) : '0';
    
    const inactiveRate = totalShopsInDepartment > 0 ? (shopsInactiveOver90Days / totalShopsInDepartment) * 100 : 0;
    const departmentHealthScore = inactiveRate < 10 ? 'healthy' : inactiveRate < 20 ? 'moderate' : 'critical';
    
    departmentIntelligenceData[departmentName] = {
      totalShopsInDepartment,
      shopsActiveInLast30Days,
      shopsInactive60to90Days,
      shopsInactiveOver90Days,
      shopsNeverOrderedInWindow,
      
      // 🚀 NEW: Brand-specific inactive counts
      shopsInactive60Days8PM,
      shopsInactive90Days8PM,
      shopsInactive60DaysVERVE,
      shopsInactive90DaysVERVE,
      
      // 🚀 NEW: Brand-specific shop lists
      shopsInactive60Days8PMList,
      shopsInactive90Days8PMList,
      shopsInactive60DaysVERVEList,
      shopsInactive90DaysVERVEList,
      
      shopsWithUptrendPattern,
      shopsWithGrowingPattern,
      shopsWithDecliningPattern,
      shopsWithStablePattern,
      shopsWithVolatilePattern,
      shopsWithNewPattern,
      
      // Legacy: Shop lists for inactive periods (for drill-downs)
      shopsInactive60to90DaysList: departmentShops.filter(shop => shop.daysSinceLastOrder >= 60 && shop.daysSinceLastOrder < 90),
      shopsInactiveOver90DaysList: departmentShops.filter(shop => shop.daysSinceLastOrder >= 90 && shop.daysSinceLastOrder < 999),
      
      percentageShopsWithUptrend,
      percentageShopsWithGrowing,
      percentageShopsWithDeclining,
      percentageShopsWithStable,
      percentageShopsWithNew,
      percentageShopsWithVolatile,
      
      // 🚀 NEW: Brand-specific percentages
      percentageShopsInactive60Days8PM,
      percentageShopsInactive90Days8PM,
      percentageShopsInactive60DaysVERVE,
      percentageShopsInactive90DaysVERVE,
      
      total8PMCasesInDepartment,
      totalVERVECasesInDepartment,
      shopsCurrentlyBuying8PM,
      shopsCurrentlyBuyingVERVE,
      percentage8PMPenetration,
      percentageVERVEPenetration,
      
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
  const rollingWindow = useMemo(() => {
    return getDepartmentRolling5MonthWindow(data.currentMonth, data.currentYear);
  }, [data.currentMonth, data.currentYear]);

  const rollingLabel = useMemo(() => {
    return getDepartmentRollingLabel(data.currentMonth, data.currentYear);
  }, [data.currentMonth, data.currentYear]);

  const departmentIntelligence = useMemo(() => {
    return calculateDepartmentIntelligenceWithBrandSpecificTracking(data.salesData, data.currentMonth, data.currentYear);
  }, [data.salesData, data.currentMonth, data.currentYear]);

  const [showDepartmentShops, setShowDepartmentShops] = useState(false);
  const [selectedDepartmentShops, setSelectedDepartmentShops] = useState<{
    department: string;
    title: string;
    subtitle: string;
    shops: any[];
    type: 'all' | 'active' | 'inactive' | '8pm' | 'verve' | 'both' | 'monthly' | 'uptrend' | 'growing' | 'declining' | 'stable' | 'new' | 'volatile' | 'inactive60' | 'inactive90' | 'inactive60_8PM' | 'inactive90_8PM' | 'inactive60_VERVE' | 'inactive90_VERVE';
    monthData?: { month: string; total: number; eightPM: number; verve: number; };
    brandType?: '8PM' | 'VERVE' | 'both';
  } | null>(null);

  const handleTrendDrillDown = (
    department: string,
    trendType: 'uptrend' | 'growing' | 'declining' | 'stable' | 'new' | 'volatile',
    shops: any[],
    percentage: string
  ) => {
    const trendLabels = {
      uptrend: 'Shops with Accelerating Growth (Jun > May > Apr)',
      growing: 'Shops with Simple Growth (Jun > May)',
      declining: 'Shops with Declining Sales (Jun < May)', 
      stable: 'Shops with Consistent Performance (±10% variation)',
      new: 'New Shops (First-time Buyers)',
      volatile: 'Shops with Irregular Patterns'
    };
    
    const trendDescriptions = {
      uptrend: `These ${shops.length} shops show accelerating growth pattern over the last 3 months`,
      growing: `These ${shops.length} shops show recovery or simple growth (June better than May)`,
      declining: `These ${shops.length} shops show declining pattern and need immediate attention`,
      stable: `These ${shops.length} shops maintain consistent performance levels`,
      new: `These ${shops.length} shops are new customers who started buying recently`,
      volatile: `These ${shops.length} shops have irregular buying patterns`
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

  // 🚀 NEW: Handle brand-specific inactive drill-downs
  const handleBrandInactiveDrillDown = (
    department: string,
    brand: '8PM' | 'VERVE',
    period: '60' | '90',
    shops: any[],
    percentage: string
  ) => {
    const periodLabels = {
      '60': '60-89 Days',
      '90': '90+ Days'
    };
    
    const descriptions = {
      '60': `Early warning: ${shops.length} shops haven't bought ${brand} for 60-89 days`,
      '90': `Critical: ${shops.length} shops haven't bought ${brand} for 90+ days`
    };

    setSelectedDepartmentShops({
      department,
      title: `${department} - ${brand} Inactive ${periodLabels[period]}`,
      subtitle: descriptions[period],
      shops,
      type: period === '60' ? `inactive60_${brand}` as any : `inactive90_${brand}` as any,
      brandType: brand
    });
    setShowDepartmentShops(true);
  };

  const handleDepartmentShopsClick = (
    department: string, 
    title: string, 
    subtitle: string, 
    shops: any[], 
    type: 'all' | 'active' | 'inactive' | '8pm' | 'verve' | 'both' | 'monthly' | 'inactive60' | 'inactive90',
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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Department Intelligence Overview - {rollingLabel}
          </h2>
          <div className="text-sm text-blue-600 font-medium flex items-center">
            <Info className="w-4 h-4 mr-1" />
            🚀 Enhanced with Brand-Specific Intelligence
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
                {/* ENHANCED: Complete Trend Metrics with All 6 Patterns */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Accelerating (3M):
                  </span>
                  <button
                    onClick={() => handleTrendDrillDown(dept, 'uptrend', intelligence.shopsWithUptrendPattern, intelligence.percentageShopsWithUptrend)}
                    className="text-sm font-bold text-green-600 hover:text-green-800 hover:underline"
                    title={`${intelligence.shopsWithUptrendPattern.length} shops showing accelerating growth (Jun>May>Apr)`}
                  >
                    {intelligence.percentageShopsWithUptrend}% shops
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Simple Growth (3M):
                  </span>
                  <button
                    onClick={() => handleTrendDrillDown(dept, 'growing', intelligence.shopsWithGrowingPattern, intelligence.percentageShopsWithGrowing)}
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
                    title={`${intelligence.shopsWithGrowingPattern.length} shops showing recovery/simple growth (Jun>May)`}
                  >
                    {intelligence.percentageShopsWithGrowing}% shops
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 flex items-center">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Declining (3M):
                  </span>
                  <button
                    onClick={() => handleTrendDrillDown(dept, 'declining', intelligence.shopsWithDecliningPattern, intelligence.percentageShopsWithDeclining)}
                    className="text-sm font-bold text-red-600 hover:text-red-800 hover:underline"
                    title={`${intelligence.shopsWithDecliningPattern.length} shops showing declining sales (Jun<May)`}
                  >
                    {intelligence.percentageShopsWithDeclining}% shops
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 flex items-center">
                    <Activity className="w-3 h-3 mr-1" />
                    Stable (3M):
                  </span>
                  <button
                    onClick={() => handleTrendDrillDown(dept, 'stable', intelligence.shopsWithStablePattern, intelligence.percentageShopsWithStable)}
                    className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    title={`${intelligence.shopsWithStablePattern.length} shops with consistent performance (±10%)`}
                  >
                    {intelligence.percentageShopsWithStable}% shops
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 flex items-center">
                    <Target className="w-3 h-3 mr-1" />
                    New Customers (3M):
                  </span>
                  <button
                    onClick={() => handleTrendDrillDown(dept, 'new', intelligence.shopsWithNewPattern, intelligence.percentageShopsWithNew)}
                    className="text-sm font-bold text-cyan-600 hover:text-cyan-800 hover:underline"
                    title={`${intelligence.shopsWithNewPattern.length} shops are new first-time buyers`}
                  >
                    {intelligence.percentageShopsWithNew}% shops
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Irregular Pattern (3M):
                  </span>
                  <button
                    onClick={() => handleTrendDrillDown(dept, 'volatile', intelligence.shopsWithVolatilePattern, intelligence.percentageShopsWithVolatile)}
                    className="text-sm font-bold text-amber-600 hover:text-amber-800 hover:underline"
                    title={`${intelligence.shopsWithVolatilePattern.length} shops with irregular buying patterns`}
                  >
                    {intelligence.percentageShopsWithVolatile}% shops
                  </button>
                </div>
                
                {/* ENHANCED: Current Month Brand Penetration */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">8PM (This Month):</span>
                    <button
                      onClick={() => handleDepartmentShopsClick(
                        dept,
                        `${dept} - 8PM Brand Buyers (Current Month)`,
                        `${intelligence.shopsCurrentlyBuying8PM} shops currently buying 8PM brand in ${dept}`,
                        departmentShopsData[dept]?.shops8PM || [],
                        '8pm'
                      )}
                      className="text-sm font-bold text-purple-600 hover:text-purple-800 hover:underline"
                      title={`${intelligence.shopsCurrentlyBuying8PM} out of ${intelligence.totalShopsInDepartment} shops buying 8PM this month`}
                    >
                      {intelligence.percentage8PMPenetration}% shops
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">VERVE (This Month):</span>
                    <button
                      onClick={() => handleDepartmentShopsClick(
                        dept,
                        `${dept} - VERVE Brand Buyers (Current Month)`,
                        `${intelligence.shopsCurrentlyBuyingVERVE} shops currently buying VERVE brand in ${dept}`,
                        departmentShopsData[dept]?.shopsVERVE || [],
                        'verve'
                      )}
                      className="text-sm font-bold text-orange-600 hover:text-orange-800 hover:underline"
                      title={`${intelligence.shopsCurrentlyBuyingVERVE} out of ${intelligence.totalShopsInDepartment} shops buying VERVE this month`}
                    >
                      {intelligence.percentageVERVEPenetration}% shops
                    </button>
                  </div>
                </div>
                
                {/* 🚀 NEW: Brand-Specific Inactive Indicators */}
                <div className="pt-2 border-t bg-purple-50 -mx-2 px-2 py-2 rounded">
                  <div className="text-xs font-medium text-purple-800 mb-1">🟣 8PM Brand Inactive Analysis</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      60+ Days 8PM:
                    </span>
                    <button
                      onClick={() => handleBrandInactiveDrillDown(
                        dept,
                        '8PM',
                        '60',
                        intelligence.shopsInactive60Days8PMList || [],
                        intelligence.percentageShopsInactive60Days8PM
                      )}
                      className={`text-sm font-bold hover:underline ${
                        parseFloat(intelligence.percentageShopsInactive60Days8PM || '0') < 5 ? 'text-yellow-600 hover:text-yellow-800' :
                        parseFloat(intelligence.percentageShopsInactive60Days8PM || '0') < 15 ? 'text-orange-600 hover:text-orange-800' : 'text-red-600 hover:text-red-800'
                      }`}
                      title={`${intelligence.shopsInactive60Days8PM} shops haven't bought 8PM for 60-89 days`}
                    >
                      {intelligence.percentageShopsInactive60Days8PM || '0.0'}% shops
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      90+ Days 8PM:
                    </span>
                    <button
                      onClick={() => handleBrandInactiveDrillDown(
                        dept,
                        '8PM',
                        '90',
                        intelligence.shopsInactive90Days8PMList || [],
                        intelligence.percentageShopsInactive90Days8PM
                      )}
                      className={`text-sm font-bold hover:underline ${
                        parseFloat(intelligence.percentageShopsInactive90Days8PM) < 10 ? 'text-yellow-600 hover:text-yellow-800' :
                        parseFloat(intelligence.percentageShopsInactive90Days8PM) < 20 ? 'text-orange-600 hover:text-orange-800' : 'text-red-600 hover:text-red-800'
                      }`}
                      title={`${intelligence.shopsInactive90Days8PM} shops haven't bought 8PM for 90+ days`}
                    >
                      {intelligence.percentageShopsInactive90Days8PM}% shops
                    </button>
                  </div>
                </div>

                {/* 🚀 NEW: VERVE Brand-Specific Inactive Indicators */}
                <div className="pt-2 bg-orange-50 -mx-2 px-2 py-2 rounded">
                  <div className="text-xs font-medium text-orange-800 mb-1">🟠 VERVE Brand Inactive Analysis</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      60+ Days VERVE:
                    </span>
                    <button
                      onClick={() => handleBrandInactiveDrillDown(
                        dept,
                        'VERVE',
                        '60',
                        intelligence.shopsInactive60DaysVERVEList || [],
                        intelligence.percentageShopsInactive60DaysVERVE
                      )}
                      className={`text-sm font-bold hover:underline ${
                        parseFloat(intelligence.percentageShopsInactive60DaysVERVE || '0') < 5 ? 'text-yellow-600 hover:text-yellow-800' :
                        parseFloat(intelligence.percentageShopsInactive60DaysVERVE || '0') < 15 ? 'text-orange-600 hover:text-orange-800' : 'text-red-600 hover:text-red-800'
                      }`}
                      title={`${intelligence.shopsInactive60DaysVERVE} shops haven't bought VERVE for 60-89 days`}
                    >
                      {intelligence.percentageShopsInactive60DaysVERVE || '0.0'}% shops
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      90+ Days VERVE:
                    </span>
                    <button
                      onClick={() => handleBrandInactiveDrillDown(
                        dept,
                        'VERVE',
                        '90',
                        intelligence.shopsInactive90DaysVERVEList || [],
                        intelligence.percentageShopsInactive90DaysVERVE
                      )}
                      className={`text-sm font-bold hover:underline ${
                        parseFloat(intelligence.percentageShopsInactive90DaysVERVE) < 10 ? 'text-yellow-600 hover:text-yellow-800' :
                        parseFloat(intelligence.percentageShopsInactive90DaysVERVE) < 20 ? 'text-orange-600 hover:text-orange-800' : 'text-red-600 hover:text-red-800'
                      }`}
                      title={`${intelligence.shopsInactive90DaysVERVE} shops haven't bought VERVE for 90+ days`}
                    >
                      {intelligence.percentageShopsInactive90DaysVERVE}% shops
                    </button>
                  </div>
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

        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
          <h5 className="font-medium text-blue-900 mb-2">🚀 Complete Trend Analysis - All Scenarios Captured:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
            <div><strong>🚀 Accelerating (3M):</strong> Jun &gt; May &gt; Apr (all positive) - Best performers</div>
            <div><strong>📈 Simple Growth (3M):</strong> Jun &gt; May (recovery/improvement)</div>
            <div><strong>📉 Declining (3M):</strong> Jun &lt; May (needs attention)</div>
            <div><strong>➡️ Stable (3M):</strong> Jun ≈ May (±10% consistent performance)</div>
            <div><strong>🆕 New Customers (3M):</strong> First-time buyers (May=0, Apr=0, Jun&gt;0)</div>
            <div><strong>🌊 Irregular Pattern (3M):</strong> Volatile/unpredictable buying behavior</div>
            <div><strong>🟣 60+ Days 8PM:</strong> No 8PM orders for 60-89 days (cross-sell opportunity)</div>
            <div><strong>🟣 90+ Days 8PM:</strong> No 8PM orders for 90+ days (critical 8PM attention)</div>
            <div><strong>🟠 60+ Days VERVE:</strong> No VERVE orders for 60-89 days (early VERVE warning)</div>
            <div><strong>🟠 90+ Days VERVE:</strong> No VERVE orders for 90+ days (critical VERVE attention)</div>
            <div className="col-span-1 md:col-span-2 text-xs text-blue-600 mt-1 font-bold">
              ✅ <strong>100% COVERAGE:</strong> Every shop now fits into exactly one trend category - no gaps, complete business intelligence!
            </div>
          </div>
        </div>
      </div>

      {/* Department Performance Overview */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Department Performance Overview - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.deptPerformance)
            .filter(([dept]) => dept && dept !== 'Unknown' && dept.trim() !== '')
            .map(([dept, performance]) => {
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

      {/* Department Performance Table */}
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
              {Object.entries(data.deptPerformance)
                .filter(([dept]) => dept && dept !== 'Unknown' && dept.trim() !== '')
                .map(([dept, performance]) => {
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

      {/* 5-Month Historical Department Performance */}
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
              {Object.entries(data.deptPerformance)
                .filter(([dept]) => dept && dept !== 'Unknown' && dept.trim() !== '')
                .map(([dept, performance]) => {
                const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept);
                
                const monthlyTotals = rollingWindow.map(month => 
                  deptShops.reduce((sum: number, shop: any) => sum + getShopDataForMonth(shop, month.key, 'total'), 0)
                );
                
                const avg5Month = (monthlyTotals.reduce((sum, val) => sum + val, 0) / 5).toFixed(0);
                
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

      {/* Department Brand Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">8PM Performance by Department</h3>
            <p className="text-sm text-gray-500">Brand distribution across territories (click bars for shop details)</p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {Object.entries(data.deptPerformance)
                .filter(([dept]) => dept && dept !== 'Unknown' && dept.trim() !== '')
                .map(([dept, performance]) => {
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
              {Object.entries(data.deptPerformance)
                .filter(([dept]) => dept && dept !== 'Unknown' && dept.trim() !== '')
                .map(([dept, performance]) => {
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

      {/* Department Performance Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Department Analysis Summary - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.deptPerformance)
            .filter(([dept]) => dept && dept !== 'Unknown' && dept.trim() !== '')
            .slice(0, 4).map(([dept, performance]) => {
            const coveragePercent = (performance.billedShops / performance.totalShops) * 100;
            const deptData = departmentShopsData[dept];
            const intelligence = departmentIntelligence[dept];
            
            const monthlyTotals = rollingWindow.map(month => {
              const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept);
              return deptShops.reduce((sum: number, shop: any) => sum + getShopDataForMonth(shop, month.key, 'total'), 0);
            });
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
                <div className="text-xs text-gray-600 mt-1">
                  {intelligence && `${intelligence.percentageShopsWithUptrend}% uptrend`}
                </div>
                <div className="text-lg mt-2">{trend}</div>
              </button>
            );
          })}
        </div>
      </div>

      {showDepartmentShops && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Modal Coming Soon</h3>
            <button
              onClick={() => setShowDepartmentShops(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentTab;
