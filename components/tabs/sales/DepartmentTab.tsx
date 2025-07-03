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

// DEPARTMENT INTELLIGENCE WITH CRYSTAL CLEAR CALCULATIONS
const calculateDepartmentIntelligenceWithClearLabels = (salesData: Record<string, ShopData>, currentMonth: string, currentYear: string) => {
  const allShops = Object.values(salesData);
  const rollingWindow = getDepartmentRolling5MonthWindow(currentMonth, currentYear);
  
  const recentCompletedMonth = rollingWindow[rollingWindow.length - 2];
  const middleCompletedMonth = rollingWindow[rollingWindow.length - 3];  
  const oldestCompletedMonth = rollingWindow[rollingWindow.length - 4];

  const shopsWithClearActivityData = allShops.map(shop => {
    let daysSinceLastOrder = -1;
    let lastOrderValue = 0;
    
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
      daysSinceLastOrder = 999;
    }
    
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
  
  const departmentIntelligenceData: Record<string, any> = {};
  
  const validDepartments = [...new Set(allShops.map(shop => shop.department))]
    .filter(dept => dept && dept !== 'Unknown' && dept.trim() !== '');
  
  validDepartments.forEach(departmentName => {
    const departmentShops = shopsWithClearActivityData.filter(shop => shop.department === departmentName);
    
    const totalShopsInDepartment = departmentShops.length;
    const shopsActiveInLast30Days = departmentShops.filter(shop => shop.daysSinceLastOrder < 30).length;
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
    
    const percentageShopsWithUptrend = totalShopsInDepartment > 0 ? ((shopsWithUptrendPattern.length / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageShopsWithDeclining = totalShopsInDepartment > 0 ? ((shopsWithDecliningPattern.length / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageShopsWithStable = totalShopsInDepartment > 0 ? ((shopsWithStablePattern.length / totalShopsInDepartment) * 100).toFixed(1) : '0';
    const percentageShopsInactiveOver90Days = totalShopsInDepartment > 0 ? ((shopsInactiveOver90Days / totalShopsInDepartment) * 100).toFixed(1) : '0';
    
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
      
      shopsWithUptrendPattern,
      shopsWithGrowingPattern,
      shopsWithDecliningPattern,
      shopsWithStablePattern,
      shopsWithVolatilePattern,
      shopsWithNewPattern,
      
      percentageShopsWithUptrend,
      percentageShopsWithDeclining,
      percentageShopsWithStable,
      percentageShopsInactiveOver90Days,
      
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
    return calculateDepartmentIntelligenceWithClearLabels(data.salesData, data.currentMonth, data.currentYear);
  }, [data.salesData, data.currentMonth, data.currentYear]);

  const [showDepartmentShops, setShowDepartmentShops] = useState(false);
  const [selectedDepartmentShops, setSelectedDepartmentShops] = useState<{
    department: string;
    title: string;
    subtitle: string;
    shops: any[];
    type: 'all' | 'active' | 'inactive' | '8pm' | 'verve' | 'both' | 'monthly' | 'uptrend' | 'declining' | 'stable';
    monthData?: { month: string; total: number; eightPM: number; verve: number; };
  } | null>(null);

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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className={`${typeStyles.bg} p-4 rounded-lg text-center border ${typeStyles.border}`}>
                    <div className={`text-2xl font-bold ${typeStyles.text}`}>{shops.length}</div>
                    <div className="text-sm text-gray-600">Total Shops in Category</div>
                  </div>
                  <div className={`${typeStyles.bg} p-4 rounded-lg text-center border ${typeStyles.border}`}>
                    <div className={`text-2xl font-bold ${typeStyles.text}`}>
                      {shops.reduce((sum, shop) => sum + (shop.total || 0), 0).toLocaleString()}
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

                <div className="border border-gray-200 rounded-lg">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                          
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

        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
          <h5 className="font-medium text-blue-900 mb-2">📊 Metrics Explanation:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
            <div><strong>Growth Trend:</strong> % of shops with Jun &gt; May &gt; Apr sales</div>
            <div><strong>Declining Trend:</strong> % of shops with Jun &lt; May sales</div>
            <div><strong>8PM/VERVE Buyers:</strong> % of shops currently buying each brand</div>
            <div><strong>Inactive 90+ Days:</strong> % of shops with no orders for 90+ days</div>
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
