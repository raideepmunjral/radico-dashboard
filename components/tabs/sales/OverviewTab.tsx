'use client';

import React from 'react';
import { ShoppingBag, TrendingUp, BarChart3, Target, Users, Zap, Award, PieChart } from 'lucide-react';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface CustomerInsights {
  firstTimeCustomers: number;
  lostCustomers: number;
  consistentPerformers: number;
  decliningPerformers: number;
}

interface ShopData {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  total: number;
  eightPM: number;
  verve: number;
  juneLastYearTotal?: number;
  juneLastYearEightPM?: number;
  juneLastYearVerve?: number;
  // Enhanced historical data for Q1 calculations
  marchTotal?: number;
  marchEightPM?: number;
  marchVerve?: number;
  aprilTotal?: number;
  aprilEightPM?: number;
  aprilVerve?: number;
  mayTotal?: number;
  mayEightPM?: number;
  mayVerve?: number;
}

interface DashboardData {
  summary: {
    totalShops: number;
    billedShops: number;
    total8PM: number;
    totalVERVE: number;
    totalSales: number;
    coverage: string;
    total8PMTarget: number;
    totalVerveTarget: number;
    eightPmAchievement: string;
    verveAchievement: string;
    lastYearTotal8PM?: number;
    lastYearTotalVERVE?: number;
    yoy8PMGrowth?: string;
    yoyVerveGrowth?: string;
  };
  topShops: any[];
  customerInsights: CustomerInsights;
  currentMonth: string;
  currentYear: string;
  allShopsComparison: ShopData[];
  // NEW: Extended historical data for proper quarterly calculations
  historicalData?: {
    // Q1 FY2024 complete data (when available)
    april2024?: any;
    may2024?: any;
    june2024?: any;
    
    // All other historical months
    july2024?: any;
    august2024?: any;
    september2024?: any;
    october2024?: any;
    november2024?: any;
    december2024?: any;
    january?: any;
    february?: any;
    march?: any;
    april?: any;
    may?: any;
    june?: any;
    juneLastYear?: any;
    [key: string]: any;
  };
}

// ==========================================
// ENHANCED HELPER FUNCTIONS FOR FUTURE-READY QUARTER TRACKING
// ==========================================

const getMonthName = (monthNum: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

// NEW: Helper function to get previous month for MoM comparison
const getPreviousMonthData = (currentMonth: string, currentYear: string, historicalData: any) => {
  const currentMonthNum = parseInt(currentMonth);
  const currentYearNum = parseInt(currentYear);
  
  let prevMonth, prevYear, prevMonthName, prevDataKey;
  
  if (currentMonthNum === 1) {
    // January -> December of previous year
    prevMonth = 12;
    prevYear = currentYearNum - 1;
    prevMonthName = 'December';
    prevDataKey = 'december2024'; // Assuming we're in 2025
  } else {
    // Any other month -> previous month same year
    prevMonth = currentMonthNum - 1;
    prevYear = currentYearNum;
    prevMonthName = getMonthName(prevMonth.toString().padStart(2, '0'));
    
    // Map to correct data key
    const monthKeys = ['', 'january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
    prevDataKey = monthKeys[prevMonth];
  }
  
  const prevMonthData = historicalData?.[prevDataKey];
  
  return {
    month: prevMonth,
    year: prevYear,
    monthName: prevMonthName,
    total8PM: prevMonthData?.total8PM || 0,
    totalVERVE: prevMonthData?.totalVERVE || 0,
    displayLabel: `${prevMonthName} ${prevYear}`
  };
};

// NEW: Helper function to get previous month for MoM comparison
const getPreviousMonthData = (currentMonth: string, currentYear: string, historicalData: any) => {
  const currentMonthNum = parseInt(currentMonth);
  const currentYearNum = parseInt(currentYear);
  
  let prevMonth, prevYear, prevMonthName, prevDataKey;
  
  if (currentMonthNum === 1) {
    // January -> December of previous year
    prevMonth = 12;
    prevYear = currentYearNum - 1;
    prevMonthName = 'December';
    prevDataKey = 'december2024'; // Assuming we're in 2025
  } else {
    // Any other month -> previous month same year
    prevMonth = currentMonthNum - 1;
    prevYear = currentYearNum;
    prevMonthName = getMonthName(prevMonth.toString().padStart(2, '0'));
    
    // Map to correct data key
    const monthKeys = ['', 'january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
    prevDataKey = monthKeys[prevMonth];
  }
  
  const prevMonthData = historicalData?.[prevDataKey];
  
  return {
    month: prevMonth,
    year: prevYear,
    monthName: prevMonthName,
    total8PM: prevMonthData?.total8PM || 0,
    totalVERVE: prevMonthData?.totalVERVE || 0,
    displayLabel: `${prevMonthName} ${prevYear}`
  };
};
const getOngoingQuarterPeriodLabel = (currentMonth: string, currentYear: string) => {
  const monthNum = parseInt(currentMonth);
  
  if (monthNum >= 7 && monthNum <= 9) {
    // Q2: July-August-September
    const monthsInQ2 = ['July', 'August', 'September'];
    const currentPosition = monthNum - 6; // 1, 2, or 3
    const periodMonths = monthsInQ2.slice(0, currentPosition);
    
    return {
      currentPeriod: periodMonths.join('-') + ` ${currentYear}`,
      lastYearPeriod: periodMonths.join('-') + ` ${parseInt(currentYear) - 1}`,
      quarterName: 'Q2',
      monthsCompleted: currentPosition,
      totalMonths: 3,
      isComplete: currentPosition === 3
    };
  } else if (monthNum >= 10 && monthNum <= 12) {
    // Q3: October-November-December  
    const monthsInQ3 = ['October', 'November', 'December'];
    const currentPosition = monthNum - 9; // 1, 2, or 3
    const periodMonths = monthsInQ3.slice(0, currentPosition);
    
    return {
      currentPeriod: periodMonths.join('-') + ` ${currentYear}`,
      lastYearPeriod: periodMonths.join('-') + ` ${parseInt(currentYear) - 1}`,
      quarterName: 'Q3', 
      monthsCompleted: currentPosition,
      totalMonths: 3,
      isComplete: currentPosition === 3
    };
  } else if (monthNum >= 1 && monthNum <= 3) {
    // Q4: January-February-March
    const monthsInQ4 = ['January', 'February', 'March'];
    const currentPosition = monthNum; // 1, 2, or 3
    const periodMonths = monthsInQ4.slice(0, currentPosition);
    
    return {
      currentPeriod: periodMonths.join('-') + ` ${currentYear}`,
      lastYearPeriod: periodMonths.join('-') + ` ${parseInt(currentYear) - 1}`,
      quarterName: 'Q4',
      monthsCompleted: currentPosition,
      totalMonths: 3,
      isComplete: currentPosition === 3
    };
  } else if (monthNum >= 4 && monthNum <= 6) {
    // Q1: April-May-June
    const monthsInQ1 = ['April', 'May', 'June'];
    const currentPosition = monthNum - 3; // 1, 2, or 3
    const periodMonths = monthsInQ1.slice(0, currentPosition);
    
    return {
      currentPeriod: periodMonths.join('-') + ` ${currentYear}`,
      lastYearPeriod: periodMonths.join('-') + ` ${parseInt(currentYear) - 1}`,
      quarterName: 'Q1',
      monthsCompleted: currentPosition,
      totalMonths: 3,
      isComplete: currentPosition === 3
    };
  }
  
  // Fallback
  return {
    currentPeriod: `${getMonthName(currentMonth)} ${currentYear}`,
    lastYearPeriod: `${getMonthName(currentMonth)} ${parseInt(currentYear) - 1}`,
    quarterName: 'Current',
    monthsCompleted: 1,
    totalMonths: 3,
    isComplete: false
  };
};

// ==========================================
// ENHANCED METRIC CARD COMPONENT
// ==========================================

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  trend,
  trendValue,
  onClick 
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onClick?: () => void;
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600',
    indigo: 'bg-indigo-600'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div 
      className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <div className="ml-4 sm:ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg sm:text-xl font-bold text-gray-900">{value}</dd>
              {subtitle && <dd className="text-xs sm:text-sm text-gray-500">{subtitle}</dd>}
              {trend && trendValue && (
                <dd className={`text-xs sm:text-sm font-medium ${trendColors[trend]}`}>
                  {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const OverviewTab = ({ data }: { data: DashboardData }) => {
  
  // ==========================================
  // ENHANCED CALCULATIONS
  // ==========================================
  
  // Brand-wise Market Coverage Calculations
  const shopsWithAnyOrder = data.allShopsComparison.filter(shop => shop.total > 0);
  const shopsWith8PM = data.allShopsComparison.filter(shop => shop.eightPM > 0);
  const shopsWithVERVE = data.allShopsComparison.filter(shop => shop.verve > 0);
  const shopsWithBothBrands = data.allShopsComparison.filter(shop => shop.eightPM > 0 && shop.verve > 0);
  
  const coverage8PM = ((shopsWith8PM.length / data.summary.totalShops) * 100).toFixed(1);
  const coverageVERVE = ((shopsWithVERVE.length / data.summary.totalShops) * 100).toFixed(1);
  const crossSellingRate = shopsWithAnyOrder.length > 0 ? ((shopsWithBothBrands.length / shopsWithAnyOrder.length) * 100).toFixed(1) : '0';
  
  // ==========================================
  // ENHANCED QUARTERLY LOGIC: COMPLETED + ONGOING
  // ==========================================
  
  // Helper functions for Indian FY quarters
  const getCompletedQuarter = (month: string) => {
    const m = parseInt(month);
    if (m >= 4 && m <= 6) return m === 6 ? 'Q1' : 'Q4';
    if (m >= 7 && m <= 9) return m === 9 ? 'Q2' : 'Q1';  
    if (m >= 10 && m <= 12) return m === 12 ? 'Q3' : 'Q2';
    return m === 3 ? 'Q4' : 'Q3';
  };

  const getOngoingQuarter = (month: string) => {
    const m = parseInt(month);
    if (m >= 4 && m <= 6) return m === 6 ? null : 'Q1';
    if (m >= 7 && m <= 9) return m === 9 ? null : 'Q2';
    if (m >= 10 && m <= 12) return m === 12 ? null : 'Q3';
    return m === 3 ? null : 'Q4';
  };

  const getQuarterMonths = (quarter: string, year: string) => {
    switch(quarter) {
      case 'Q1': return ['april', 'may', 'june'];
      case 'Q2': return ['july', 'august', 'september'];
      case 'Q3': return ['october', 'november', 'december'];
      case 'Q4': return ['january', 'february', 'march'];
      default: return [];
    }
  };

  const getOngoingQuarterMonths = (quarter: string, currentMonth: string) => {
    const allMonths = getQuarterMonths(quarter, data.currentYear);
    const currentMonthIndex = parseInt(currentMonth);
    
    // Map month names to numbers for comparison
    const monthMap: Record<string, number> = {
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };
    
    return allMonths.filter(month => monthMap[month] <= currentMonthIndex);
  };

  // Calculate COMPLETED quarter data
  const completedQuarter = getCompletedQuarter(data.currentMonth);
  const completedQuarterMonths = getQuarterMonths(completedQuarter, data.currentYear);
  
  const completedQ_8PM = data.allShopsComparison.reduce((sum, shop) => {
    return sum + completedQuarterMonths.reduce((monthSum, month) => {
      const key = `${month}EightPM` as keyof ShopData;
      return monthSum + ((shop[key] as number) || 0);
    }, 0);
  }, 0);
  
  const completedQ_VERVE = data.allShopsComparison.reduce((sum, shop) => {
    return sum + completedQuarterMonths.reduce((monthSum, month) => {
      const key = `${month}Verve` as keyof ShopData;
      return monthSum + ((shop[key] as number) || 0);
    }, 0);
  }, 0);
  
  const completedQ_Total = completedQ_8PM + completedQ_VERVE;

  // ENHANCED: Calculate PROPER last year completed quarter data
  let lastYearCompletedQ_8PM = 0;
  let lastYearCompletedQ_VERVE = 0;
  let lastYearCompletedQ_Total = 0;
  
  // Check if we have extended historical data for proper Q1 FY2024 calculation
  const hasExtendedData = data.historicalData?.april2024 && data.historicalData?.may2024;
  
  if (completedQuarter === 'Q1' && hasExtendedData) {
    // PROPER Q1 FY2024: April 2024 + May 2024 + June 2024
    lastYearCompletedQ_8PM = 
      (data.historicalData?.april2024?.total8PM || 0) +
      (data.historicalData?.may2024?.total8PM || 0) +
      (data.historicalData?.juneLastYear?.total8PM || 0);
    
    lastYearCompletedQ_VERVE = 
      (data.historicalData?.april2024?.totalVERVE || 0) +
      (data.historicalData?.may2024?.totalVERVE || 0) +
      (data.historicalData?.juneLastYear?.totalVERVE || 0);
  } else if (completedQuarter === 'Q1') {
    // FALLBACK: Use available June 2024 data only
    lastYearCompletedQ_8PM = data.summary.lastYearTotal8PM || 0;
    lastYearCompletedQ_VERVE = data.summary.lastYearTotalVERVE || 0;
  } else if (completedQuarter === 'Q2') {
    // Q2 FY2024: July 2024 + August 2024 + September 2024
    lastYearCompletedQ_8PM = 
      (data.historicalData?.july2024?.total8PM || 0) +
      (data.historicalData?.august2024?.total8PM || 0) +
      (data.historicalData?.september2024?.total8PM || 0);
    
    lastYearCompletedQ_VERVE = 
      (data.historicalData?.july2024?.totalVERVE || 0) +
      (data.historicalData?.august2024?.totalVERVE || 0) +
      (data.historicalData?.september2024?.totalVERVE || 0);
  } else if (completedQuarter === 'Q3') {
    // Q3 FY2024: October 2024 + November 2024 + December 2024
    lastYearCompletedQ_8PM = 
      (data.historicalData?.october2024?.total8PM || 0) +
      (data.historicalData?.november2024?.total8PM || 0) +
      (data.historicalData?.december2024?.total8PM || 0);
    
    lastYearCompletedQ_VERVE = 
      (data.historicalData?.october2024?.totalVERVE || 0) +
      (data.historicalData?.november2024?.totalVERVE || 0) +
      (data.historicalData?.december2024?.totalVERVE || 0);
  } else if (completedQuarter === 'Q4') {
    // Q4 FY2024: January 2024 + February 2024 + March 2024 (would need even more historical data)
    lastYearCompletedQ_8PM = data.summary.lastYearTotal8PM || 0;
    lastYearCompletedQ_VERVE = data.summary.lastYearTotalVERVE || 0;
  }
  
  lastYearCompletedQ_Total = lastYearCompletedQ_8PM + lastYearCompletedQ_VERVE;

  // Calculate ONGOING quarter data (if exists) - ENHANCED: Future-ready with descriptive labels
  const ongoingQuarter = getOngoingQuarter(data.currentMonth);
  let ongoingQ_8PM = 0, ongoingQ_VERVE = 0, ongoingQ_Total = 0;
  let lastYearOngoingQ_8PM = 0, lastYearOngoingQ_VERVE = 0, lastYearOngoingQ_Total = 0;
  let ongoingDataLabel = '';
  let periodInfo: any = null;
  
  if (ongoingQuarter) {
    // NEW: Get enhanced period information
    periodInfo = getOngoingQuarterPeriodLabel(data.currentMonth, data.currentYear);
    
    const ongoingMonths = getOngoingQuarterMonths(ongoingQuarter, data.currentMonth);
    
    ongoingQ_8PM = data.allShopsComparison.reduce((sum, shop) => {
      return sum + ongoingMonths.reduce((monthSum, month) => {
        const key = `${month}EightPM` as keyof ShopData;
        return monthSum + ((shop[key] as number) || 0);
      }, 0);
    }, 0);
    
    ongoingQ_VERVE = data.allShopsComparison.reduce((sum, shop) => {
      return sum + ongoingMonths.reduce((monthSum, month) => {
        const key = `${month}Verve` as keyof ShopData;
        return monthSum + ((shop[key] as number) || 0);
      }, 0);
    }, 0);
    
    ongoingQ_Total = ongoingQ_8PM + ongoingQ_VERVE;

    // ENHANCED: Calculate proper last year ongoing quarter data with future-ready logic
    if (ongoingQuarter === 'Q2' && ongoingMonths.length <= 3) {
      // Q2 ongoing: Use actual historical data if available
      lastYearOngoingQ_8PM = ongoingMonths.reduce((sum, month) => {
        const historicalKey = `${month}2024`;
        return sum + (data.historicalData?.[historicalKey]?.total8PM || 0);
      }, 0);
      
      lastYearOngoingQ_VERVE = ongoingMonths.reduce((sum, month) => {
        const historicalKey = `${month}2024`;
        return sum + (data.historicalData?.[historicalKey]?.totalVERVE || 0);
      }, 0);
      
      ongoingDataLabel = periodInfo.lastYearPeriod;
    } else if (ongoingQuarter === 'Q3' && ongoingMonths.length <= 3) {
      // Q3 ongoing: Use actual historical data  
      lastYearOngoingQ_8PM = ongoingMonths.reduce((sum, month) => {
        const historicalKey = `${month}2024`;
        return sum + (data.historicalData?.[historicalKey]?.total8PM || 0);
      }, 0);
      
      lastYearOngoingQ_VERVE = ongoingMonths.reduce((sum, month) => {
        const historicalKey = `${month}2024`;
        return sum + (data.historicalData?.[historicalKey]?.totalVERVE || 0);
      }, 0);
      
      ongoingDataLabel = periodInfo.lastYearPeriod;
    } else if (ongoingQuarter === 'Q4' && ongoingMonths.length <= 3) {
      // Q4 ongoing: Use actual historical data
      lastYearOngoingQ_8PM = ongoingMonths.reduce((sum, month) => {
        const historicalKey = `${month}`;
        return sum + (data.historicalData?.[historicalKey]?.total8PM || 0);
      }, 0);
      
      lastYearOngoingQ_VERVE = ongoingMonths.reduce((sum, month) => {
        const historicalKey = `${month}`;
        return sum + (data.historicalData?.[historicalKey]?.totalVERVE || 0);
      }, 0);
      
      ongoingDataLabel = periodInfo.lastYearPeriod;
    } else {
      // Fallback: Use proportional estimation
      lastYearOngoingQ_8PM = ongoingMonths.length === 1 ? (data.summary.lastYearTotal8PM || 0) : 
                            (data.summary.lastYearTotal8PM || 0) * (ongoingMonths.length / 3);
      lastYearOngoingQ_VERVE = ongoingMonths.length === 1 ? (data.summary.lastYearTotalVERVE || 0) : 
                              (data.summary.lastYearTotalVERVE || 0) * (ongoingMonths.length / 3);
      
      ongoingDataLabel = `${ongoingMonths.length} month(s) - estimated comparison`;
    }
    
    lastYearOngoingQ_Total = lastYearOngoingQ_8PM + lastYearOngoingQ_VERVE;
  }

  // Growth Calculations
  const completedQGrowth8PM = lastYearCompletedQ_8PM > 0 ? (((completedQ_8PM - lastYearCompletedQ_8PM) / lastYearCompletedQ_8PM) * 100).toFixed(1) : '0';
  const completedQGrowthVERVE = lastYearCompletedQ_VERVE > 0 ? (((completedQ_VERVE - lastYearCompletedQ_VERVE) / lastYearCompletedQ_VERVE) * 100).toFixed(1) : '0';
  const completedQGrowthTotal = lastYearCompletedQ_Total > 0 ? (((completedQ_Total - lastYearCompletedQ_Total) / lastYearCompletedQ_Total) * 100).toFixed(1) : '0';

  const ongoingQGrowth8PM = ongoingQuarter && lastYearOngoingQ_8PM > 0 ? (((ongoingQ_8PM - lastYearOngoingQ_8PM) / lastYearOngoingQ_8PM) * 100).toFixed(1) : '0';
  const ongoingQGrowthVERVE = ongoingQuarter && lastYearOngoingQ_VERVE > 0 ? (((ongoingQ_VERVE - lastYearOngoingQ_VERVE) / lastYearOngoingQ_VERVE) * 100).toFixed(1) : '0';
  const ongoingQGrowthTotal = ongoingQuarter && lastYearOngoingQ_Total > 0 ? (((ongoingQ_Total - lastYearOngoingQ_Total) / lastYearOngoingQ_Total) * 100).toFixed(1) : '0';
  
  // Calculate Month-over-Month data for brand performance cards
  const previousMonthData = getPreviousMonthData(data.currentMonth, data.currentYear, data.historicalData);
  const mom8PMGrowth = previousMonthData.total8PM > 0 ? 
    (((data.summary.total8PM - previousMonthData.total8PM) / previousMonthData.total8PM) * 100).toFixed(1) : 
    data.summary.total8PM > 0 ? '100' : '0';
  const momVERVEGrowth = previousMonthData.totalVERVE > 0 ? 
    (((data.summary.totalVERVE - previousMonthData.totalVERVE) / previousMonthData.totalVERVE) * 100).toFixed(1) : 
    data.summary.totalVERVE > 0 ? '100' : '0';
  
  // Average Cases per Shop by Brand
  const avg8PMPerShop = shopsWith8PM.length > 0 ? (data.summary.total8PM / shopsWith8PM.length).toFixed(1) : '0';
  const avgVERVEPerShop = shopsWithVERVE.length > 0 ? (data.summary.totalVERVE / shopsWithVERVE.length).toFixed(1) : '0';
  
  // Sales Velocity (current month vs PREVIOUS completed quarter average)
  const getPreviousQuarter = (quarter: string) => {
    switch(quarter) {
      case 'Q1': return 'Q4';
      case 'Q2': return 'Q1';
      case 'Q3': return 'Q2';
      case 'Q4': return 'Q3';
      default: return 'Q4';
    }
  };
  
  const getCurrentQuarter = (month: string) => {
    const m = parseInt(month);
    if (m >= 4 && m <= 6) return 'Q1';
    if (m >= 7 && m <= 9) return 'Q2';
    if (m >= 10 && m <= 12) return 'Q3';
    return 'Q4';
  };
  
  const currentQuarter = getCurrentQuarter(data.currentMonth);
  const previousQuarter = getPreviousQuarter(currentQuarter);
  const previousQuarterMonths = getQuarterMonths(previousQuarter, data.currentYear);
  
  // Calculate previous quarter totals for velocity comparison
  const prevQ_8PM = data.allShopsComparison.reduce((sum, shop) => {
    return sum + previousQuarterMonths.reduce((monthSum, month) => {
      const key = `${month}EightPM` as keyof ShopData;
      return monthSum + ((shop[key] as number) || 0);
    }, 0);
  }, 0);
  
  const prevQ_VERVE = data.allShopsComparison.reduce((sum, shop) => {
    return sum + previousQuarterMonths.reduce((monthSum, month) => {
      const key = `${month}Verve` as keyof ShopData;
      return monthSum + ((shop[key] as number) || 0);
    }, 0);
  }, 0);
  
  // Calculate velocity against previous quarter's monthly average
  const prevQuarterAvg8PM = prevQ_8PM / 3;
  const prevQuarterAvgVERVE = prevQ_VERVE / 3;
  const velocity8PM = prevQuarterAvg8PM > 0 ? ((data.summary.total8PM / prevQuarterAvg8PM) * 100).toFixed(0) : '0';
  const velocityVERVE = prevQuarterAvgVERVE > 0 ? ((data.summary.totalVERVE / prevQuarterAvgVERVE) * 100).toFixed(0) : '0';

  return (
    <div className="space-y-6">
      {/* Main Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Total Market Coverage"
          value={`${data.summary.coverage}%`}
          subtitle={`${data.summary.billedShops} of ${data.summary.totalShops} shops`}
          icon={ShoppingBag}
          color="blue"
          trend={parseFloat(data.summary.coverage) > 70 ? 'up' : parseFloat(data.summary.coverage) > 50 ? 'neutral' : 'down'}
          trendValue={`${data.summary.billedShops} active shops`}
        />
        
        <MetricCard
          title="8PM Market Penetration"
          value={`${coverage8PM}%`}
          subtitle={`${shopsWith8PM.length} shops selling 8PM`}
          icon={Target}
          color="purple"
          trend={parseFloat(coverage8PM) > 60 ? 'up' : parseFloat(coverage8PM) > 40 ? 'neutral' : 'down'}
          trendValue={`${avg8PMPerShop} avg cases/shop`}
        />
        
        <MetricCard
          title="VERVE Market Penetration"
          value={`${coverageVERVE}%`}
          subtitle={`${shopsWithVERVE.length} shops selling VERVE`}
          icon={Zap}
          color="orange"
          trend={parseFloat(coverageVERVE) > 30 ? 'up' : parseFloat(coverageVERVE) > 15 ? 'neutral' : 'down'}
          trendValue={`${avgVERVEPerShop} avg cases/shop`}
        />
        
        <MetricCard
          title="Cross-Selling Success"
          value={`${crossSellingRate}%`}
          subtitle={`${shopsWithBothBrands.length} shops buying both brands`}
          icon={Award}
          color="green"
          trend={parseFloat(crossSellingRate) > 40 ? 'up' : parseFloat(crossSellingRate) > 25 ? 'neutral' : 'down'}
          trendValue={`${shopsWithBothBrands.length} dual-brand shops`}
        />
      </div>

      {/* QUARTERLY PERFORMANCE SECTION */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Quarterly Performance Analysis
        </h3>
        
        {/* COMPLETED QUARTER SECTION */}
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
            🏆 Latest Completed Quarter: {completedQuarter} FY{data.currentYear} vs {completedQuarter} FY{parseInt(data.currentYear)-1}
          </h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 8PM Completed Quarter */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h5 className="font-medium text-purple-800 mb-3">8PM {completedQuarter} Performance</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{completedQuarter} FY{parseInt(data.currentYear)-1}:</span>
                  <span className="font-medium text-gray-900">{lastYearCompletedQ_8PM.toLocaleString()} cases</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{completedQuarter} FY{data.currentYear}:</span>
                  <span className="font-bold text-purple-600">{completedQ_8PM.toLocaleString()} cases</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-700">YoY Growth:</span>
                  <span className={`font-bold ${parseFloat(completedQGrowth8PM) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {parseFloat(completedQGrowth8PM) >= 0 ? '+' : ''}{completedQGrowth8PM}%
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {completedQuarterMonths.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')}
                </div>
              </div>
            </div>

            {/* VERVE Completed Quarter */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h5 className="font-medium text-orange-800 mb-3">VERVE {completedQuarter} Performance</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{completedQuarter} FY{parseInt(data.currentYear)-1}:</span>
                  <span className="font-medium text-gray-900">{lastYearCompletedQ_VERVE.toLocaleString()} cases</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{completedQuarter} FY{data.currentYear}:</span>
                  <span className="font-bold text-orange-600">{completedQ_VERVE.toLocaleString()} cases</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-700">YoY Growth:</span>
                  <span className={`font-bold ${parseFloat(completedQGrowthVERVE) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {parseFloat(completedQGrowthVERVE) >= 0 ? '+' : ''}{completedQGrowthVERVE}%
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {completedQuarterMonths.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')}
                </div>
              </div>
            </div>

            {/* Combined Completed Quarter */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h5 className="font-medium text-blue-800 mb-3">Combined {completedQuarter} Performance</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{completedQuarter} FY{parseInt(data.currentYear)-1}:</span>
                  <span className="font-medium text-gray-900">{lastYearCompletedQ_Total.toLocaleString()} cases</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{completedQuarter} FY{data.currentYear}:</span>
                  <span className="font-bold text-blue-600">{completedQ_Total.toLocaleString()} cases</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-700">YoY Growth:</span>
                  <span className={`font-bold ${parseFloat(completedQGrowthTotal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {parseFloat(completedQGrowthTotal) >= 0 ? '+' : ''}{completedQGrowthTotal}%
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Total quarter performance
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ONGOING QUARTER SECTION - ENHANCED: Future-ready with descriptive labels */}
        {ongoingQuarter && periodInfo && (
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-800 mb-2 flex items-center">
              📈 Ongoing Quarter Progress: {ongoingQuarter} FY{data.currentYear} 
              <span className="ml-2 text-sm text-blue-600">({periodInfo.currentPeriod})</span>
            </h4>
            
            {/* Enhanced progress indicator */}
            <div className="mb-4 bg-gray-100 rounded-lg p-3">
              <div className="flex justify-between text-sm text-gray-700 mb-2">
                <span>Quarter Progress: {periodInfo.monthsCompleted} of {periodInfo.totalMonths} months</span>
                <span>{Math.round((periodInfo.monthsCompleted / periodInfo.totalMonths) * 100)}% complete</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(periodInfo.monthsCompleted / periodInfo.totalMonths) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Comparing: {periodInfo.currentPeriod} vs {periodInfo.lastYearPeriod}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* 8PM Ongoing Quarter */}
              <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
                <h5 className="font-medium text-purple-800 mb-3">8PM {ongoingQuarter} Progress</h5>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{periodInfo.lastYearPeriod}:</span>
                    <span className="font-medium text-gray-900">{Math.round(lastYearOngoingQ_8PM).toLocaleString()} cases</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{periodInfo.currentPeriod}:</span>
                    <span className="font-bold text-purple-600">{ongoingQ_8PM.toLocaleString()} cases</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium text-gray-700">YoY Tracking:</span>
                    <span className={`font-bold ${parseFloat(ongoingQGrowth8PM) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(ongoingQGrowth8PM) >= 0 ? '+' : ''}{ongoingQGrowth8PM}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {periodInfo.monthsCompleted} of 3 months complete
                  </div>
                </div>
              </div>

              {/* VERVE Ongoing Quarter */}
              <div className="bg-orange-100 p-4 rounded-lg border border-orange-300">
                <h5 className="font-medium text-orange-800 mb-3">VERVE {ongoingQuarter} Progress</h5>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{periodInfo.lastYearPeriod}:</span>
                    <span className="font-medium text-gray-900">{Math.round(lastYearOngoingQ_VERVE).toLocaleString()} cases</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{periodInfo.currentPeriod}:</span>
                    <span className="font-bold text-orange-600">{ongoingQ_VERVE.toLocaleString()} cases</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium text-gray-700">YoY Tracking:</span>
                    <span className={`font-bold ${parseFloat(ongoingQGrowthVERVE) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(ongoingQGrowthVERVE) >= 0 ? '+' : ''}{ongoingQGrowthVERVE}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {periodInfo.monthsCompleted} of 3 months complete
                  </div>
                </div>
              </div>

              {/* Combined Ongoing Quarter */}
              <div className="bg-indigo-100 p-4 rounded-lg border border-indigo-300">
                <h5 className="font-medium text-indigo-800 mb-3">Combined {ongoingQuarter} Progress</h5>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{periodInfo.lastYearPeriod}:</span>
                    <span className="font-medium text-gray-900">{Math.round(lastYearOngoingQ_Total).toLocaleString()} cases</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{periodInfo.currentPeriod}:</span>
                    <span className="font-bold text-indigo-600">{ongoingQ_Total.toLocaleString()} cases</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium text-gray-700">YoY Tracking:</span>
                    <span className={`font-bold ${parseFloat(ongoingQGrowthTotal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(ongoingQGrowthTotal) >= 0 ? '+' : ''}{ongoingQGrowthTotal}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Quarter progress tracking
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quarter Info Banner - ENHANCED: Future-ready with automatic progression preview */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <div>
            <h5 className="font-medium text-gray-800 mb-2 flex items-center">
              🚀 Financial Year Quarters (Automatic Rolling Progression):
              {periodInfo && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  Currently: {periodInfo.quarterName} {periodInfo.monthsCompleted}/{periodInfo.totalMonths}
                </span>
              )}
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div className={`text-center p-2 rounded ${completedQuarter === 'Q1' ? 'bg-blue-100 border border-blue-300' : 'bg-white'}`}>
                <div className="font-medium">Q1</div>
                <div className="text-xs text-gray-600">Apr-May-Jun</div>
                {completedQuarter === 'Q1' && <div className="text-xs text-blue-600 font-medium">✅ Latest Complete</div>}
              </div>
              <div className={`text-center p-2 rounded ${
                (ongoingQuarter === 'Q2' || completedQuarter === 'Q2') ? 'bg-green-100 border border-green-300' : 'bg-white'
              }`}>
                <div className="font-medium">Q2</div>
                <div className="text-xs text-gray-600">Jul-Aug-Sep</div>
                {ongoingQuarter === 'Q2' && <div className="text-xs text-green-600 font-medium">📈 Ongoing</div>}
                {completedQuarter === 'Q2' && <div className="text-xs text-green-600 font-medium">✅ Latest Complete</div>}
              </div>
              <div className={`text-center p-2 rounded ${
                (ongoingQuarter === 'Q3' || completedQuarter === 'Q3') ? 'bg-orange-100 border border-orange-300' : 'bg-white'
              }`}>
                <div className="font-medium">Q3</div>
                <div className="text-xs text-gray-600">Oct-Nov-Dec</div>
                {ongoingQuarter === 'Q3' && <div className="text-xs text-orange-600 font-medium">📈 Ongoing</div>}
                {completedQuarter === 'Q3' && <div className="text-xs text-orange-600 font-medium">✅ Latest Complete</div>}
              </div>
              <div className={`text-center p-2 rounded ${
                (ongoingQuarter === 'Q4' || completedQuarter === 'Q4') ? 'bg-purple-100 border border-purple-300' : 'bg-white'
              }`}>
                <div className="font-medium">Q4</div>
                <div className="text-xs text-gray-600">Jan-Feb-Mar</div>
                {ongoingQuarter === 'Q4' && <div className="text-xs text-purple-600 font-medium">📈 Ongoing</div>}
                {completedQuarter === 'Q4' && <div className="text-xs text-purple-600 font-medium">✅ Latest Complete</div>}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY - MOVED HERE */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Executive Summary - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.summary.totalSales.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total Cases</div>
            <div className="text-xs text-gray-400">This month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.summary.coverage}%</div>
            <div className="text-xs text-gray-600">Market Coverage</div>
            <div className="text-xs text-gray-400">Overall reach</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{coverage8PM}%</div>
            <div className="text-xs text-gray-600">8PM Penetration</div>
            <div className="text-xs text-gray-400">Brand reach</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{coverageVERVE}%</div>
            <div className="text-xs text-gray-600">VERVE Penetration</div>
            <div className="text-xs text-gray-400">Brand reach</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{crossSellingRate}%</div>
            <div className="text-xs text-gray-600">Cross-Selling</div>
            <div className="text-xs text-gray-400">Both brands</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${parseFloat(completedQGrowthTotal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {parseFloat(completedQGrowthTotal) >= 0 ? '+' : ''}{completedQGrowthTotal}%
            </div>
            <div className="text-xs text-gray-600">{completedQuarter} YoY Growth</div>
            <div className="text-xs text-gray-400">vs last year</div>
          </div>
        </div>
      </div>

      {/* Enhanced Brand Performance Cards with Target Achievement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-600" />
            8PM Performance - {getMonthName(data.currentMonth)} {data.currentYear}
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Sales vs Target</span>
                <span className="font-medium">{data.summary.eightPmAchievement}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(parseFloat(data.summary.eightPmAchievement), 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{data.summary.total8PM.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Achieved</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-400">{data.summary.total8PMTarget.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Target</div>
              </div>
            </div>

            {/* Enhanced metrics with velocity explanation */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t text-center">
              <div>
                <div className="text-lg font-bold text-purple-600">{shopsWith8PM.length}</div>
                <div className="text-xs text-gray-500">Active Shops</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">{velocity8PM}%</div>
                <div className="text-xs text-gray-500">Sales Velocity</div>
                <div className="text-xs text-gray-400">(vs {previousQuarter} avg) 🚀</div>
              </div>
            </div>
            
            {/* Velocity Explanation */}
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-xs text-purple-700">
                <strong>🚀 Sales Velocity:</strong> How fast you're selling now vs your {previousQuarter} momentum!
              </div>
            </div>
            
            {/* MoM Comparison - NEW: Month-over-Month instead of Year-over-Year */}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>vs Last Month</span>
                <span className={`font-medium ${parseFloat(mom8PMGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(mom8PMGrowth) >= 0 ? '+' : ''}{mom8PMGrowth}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last month: {previousMonthData.total8PM.toLocaleString()} cases ({previousMonthData.displayLabel})
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-orange-600" />
            VERVE Performance - {getMonthName(data.currentMonth)} {data.currentYear}
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Sales vs Target</span>
                <span className="font-medium">{data.summary.verveAchievement}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-orange-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(parseFloat(data.summary.verveAchievement), 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-orange-600">{data.summary.totalVERVE.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Achieved</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-400">{data.summary.totalVerveTarget.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Target</div>
              </div>
            </div>

            {/* Enhanced metrics with velocity explanation */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t text-center">
              <div>
                <div className="text-lg font-bold text-orange-600">{shopsWithVERVE.length}</div>
                <div className="text-xs text-gray-500">Active Shops</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">{velocityVERVE}%</div>
                <div className="text-xs text-gray-500">Sales Velocity</div>
                <div className="text-xs text-gray-400">(vs {previousQuarter} avg) ⚡</div>
              </div>
            </div>
            
            {/* Velocity Explanation */}
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-xs text-orange-700">
                <strong>⚡ Sales Velocity:</strong> Your current energy vs {previousQuarter} baseline!
              </div>
            </div>
            
            {/* MoM Comparison - NEW: Month-over-Month instead of Year-over-Year */}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>vs Last Month</span>
                <span className={`font-medium ${parseFloat(momVERVEGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(momVERVEGrowth) >= 0 ? '+' : ''}{momVERVEGrowth}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last month: {previousMonthData.totalVERVE.toLocaleString()} cases ({previousMonthData.displayLabel})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Intelligence Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Market Intelligence
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>8PM Market Share</span>
                <span>{((data.summary.total8PM / data.summary.totalSales) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(data.summary.total8PM / data.summary.totalSales) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>VERVE Market Share</span>
                <span>{((data.summary.totalVERVE / data.summary.totalSales) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(data.summary.totalVERVE / data.summary.totalSales) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Market Penetration Insights */}
            <div className="pt-3 border-t">
              <h4 className="font-medium text-gray-700 mb-2">Penetration Analysis</h4>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-purple-50 p-2 rounded">
                  <div className="text-sm font-bold text-purple-600">{coverage8PM}%</div>
                  <div className="text-xs text-gray-600">8PM Reach</div>
                </div>
                <div className="bg-orange-50 p-2 rounded">
                  <div className="text-sm font-bold text-orange-600">{coverageVERVE}%</div>
                  <div className="text-xs text-gray-600">VERVE Reach</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Customer Journey Insights
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-green-600">{data.customerInsights.firstTimeCustomers}</div>
                <div className="text-xs text-gray-600">New Customers</div>
                <div className="text-xs text-gray-400">This month</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-600">{data.customerInsights.lostCustomers}</div>
                <div className="text-xs text-gray-600">Lost Customers</div>
                <div className="text-xs text-gray-400">Need attention</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-blue-600">{data.customerInsights.consistentPerformers}</div>
                <div className="text-xs text-gray-600">Consistent</div>
                <div className="text-xs text-gray-400">Growing/Stable</div>
              </div>
              <div>
                <div className="text-xl font-bold text-orange-600">{data.customerInsights.decliningPerformers}</div>
                <div className="text-xs text-gray-600">At Risk</div>
                <div className="text-xs text-gray-400">Declining trend</div>
              </div>
            </div>

            {/* Cross-selling opportunity */}
            <div className="pt-3 border-t">
              <h4 className="font-medium text-gray-700 mb-2">Cross-Selling Opportunity</h4>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{shopsWithAnyOrder.length - shopsWithBothBrands.length}</div>
                  <div className="text-xs text-gray-600">Single-brand shops</div>
                  <div className="text-xs text-gray-500">Potential for cross-selling</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
