'use client';

import React from 'react';
import { ShoppingBag, TrendingUp, BarChart3, Target, Users, Zap, Award, PieChart } from 'lucide-react';

// ==========================================
// TYPE DEFINITIONS (Same as before)
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
  januaryTotal?: number;
  januaryEightPM?: number;
  januaryVerve?: number;
  februaryTotal?: number;
  februaryEightPM?: number;
  februaryVerve?: number;
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
  historicalData?: {
    april2024?: any;
    may2024?: any;
    june2024?: any;
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
    july?: any;
    august?: any;
    september?: any;
    october?: any;
    november?: any;
    december?: any;
    juneLastYear?: any;
    [key: string]: any;
  };
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const getMonthName = (monthNum: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

const getMonthNameFromNumber = (monthNum: number) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthNum - 1] || 'Unknown';
};

const getShortMonthName = (monthNum: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
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
// MAIN COMPONENT WITH DEBUG
// ==========================================

const OverviewTab = ({ data }: { data: DashboardData }) => {
  
  // 🔍 DEBUG: Log all data first
  console.log('🔍 DEBUG OVERVIEW TAB - Full Data:', data);
  console.log('🔍 Current Month:', data.currentMonth);
  console.log('🔍 Current Year:', data.currentYear);
  console.log('🔍 Shops Count:', data.allShopsComparison.length);
  console.log('🔍 Sample Shop Data:', data.allShopsComparison[0]);
  console.log('🔍 Historical Data Keys:', Object.keys(data.historicalData || {}));
  
  // 🔍 DEBUG: Check month-specific properties on shops
  const sampleShop = data.allShopsComparison[0];
  if (sampleShop) {
    console.log('🔍 Sample Shop Month Properties:', {
      shopId: sampleShop.shopId,
      shopName: sampleShop.shopName,
      aprilTotal: sampleShop.aprilTotal,
      aprilEightPM: sampleShop.aprilEightPM,
      aprilVerve: sampleShop.aprilVerve,
      mayTotal: sampleShop.mayTotal,
      mayEightPM: sampleShop.mayEightPM,
      mayVerve: sampleShop.mayVerve,
      juneTotal: sampleShop.juneTotal,
      juneEightPM: sampleShop.juneEightPM,
      juneVerve: sampleShop.juneVerve,
      julyTotal: sampleShop.julyTotal,
      julyEightPM: sampleShop.julyEightPM,
      julyVerve: sampleShop.julyVerve,
      total: sampleShop.total,
      eightPM: sampleShop.eightPM,
      verve: sampleShop.verve
    });
  }
  
  // Brand-wise Market Coverage Calculations
  const shopsWithAnyOrder = data.allShopsComparison.filter(shop => shop.total > 0);
  const shopsWith8PM = data.allShopsComparison.filter(shop => shop.eightPM > 0);
  const shopsWithVERVE = data.allShopsComparison.filter(shop => shop.verve > 0);
  const shopsWithBothBrands = data.allShopsComparison.filter(shop => shop.eightPM > 0 && shop.verve > 0);
  
  const coverage8PM = ((shopsWith8PM.length / data.summary.totalShops) * 100).toFixed(1);
  const coverageVERVE = ((shopsWithVERVE.length / data.summary.totalShops) * 100).toFixed(1);
  const crossSellingRate = shopsWithAnyOrder.length > 0 ? ((shopsWithBothBrands.length / shopsWithAnyOrder.length) * 100).toFixed(1) : '0';
  
  // ==========================================
  // 🔍 DEBUG QUARTERLY LOGIC
  // ==========================================
  
  // Helper functions for Indian FY quarters
  const getCompletedQuarter = (month: string) => {
    const m = parseInt(month);
    console.log('🔍 getCompletedQuarter input month:', m);
    if (m >= 4 && m <= 6) return m === 6 ? 'Q1' : null;
    if (m >= 7 && m <= 9) return m === 9 ? 'Q2' : 'Q1';
    if (m >= 10 && m <= 12) return m === 12 ? 'Q3' : 'Q2';
    return m === 3 ? 'Q4' : 'Q3';
  };

  const getOngoingQuarter = (month: string) => {
    const m = parseInt(month);
    console.log('🔍 getOngoingQuarter input month:', m);
    if (m >= 4 && m <= 6) return m === 6 ? null : 'Q1';
    if (m >= 7 && m <= 9) return m === 9 ? null : 'Q2';
    if (m >= 10 && m <= 12) return m === 12 ? null : 'Q3';
    return m === 3 ? null : 'Q4';
  };

  const getQuarterMonths = (quarter: string, year: string) => {
    console.log('🔍 getQuarterMonths input:', { quarter, year });
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
    
    const monthMap: Record<string, number> = {
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };
    
    const result = allMonths.filter(month => monthMap[month] <= currentMonthIndex);
    console.log('🔍 getOngoingQuarterMonths result:', { quarter, currentMonth, allMonths, result });
    return result;
  };

  // Calculate COMPLETED quarter data
  const completedQuarter = getCompletedQuarter(data.currentMonth);
  console.log('🔍 Completed Quarter:', completedQuarter);
  
  let completedQ_8PM = 0, completedQ_VERVE = 0, completedQ_Total = 0;
  let completedQuarterMonths: string[] = [];
  
  if (completedQuarter) {
    completedQuarterMonths = getQuarterMonths(completedQuarter, data.currentYear);
    console.log('🔍 Completed Quarter Months:', completedQuarterMonths);
    
    // 🔍 DEBUG: Calculate with detailed logging
    completedQ_8PM = data.allShopsComparison.reduce((sum, shop, shopIndex) => {
      const shopSum = completedQuarterMonths.reduce((monthSum, month) => {
        const key = `${month}EightPM` as keyof ShopData;
        const value = (shop[key] as number) || 0;
        if (shopIndex < 3) {
          console.log(`🔍 Shop ${shopIndex} (${shop.shopName}) - ${month}EightPM:`, value);
        }
        return monthSum + value;
      }, 0);
      return sum + shopSum;
    }, 0);
    
    completedQ_VERVE = data.allShopsComparison.reduce((sum, shop) => {
      return sum + completedQuarterMonths.reduce((monthSum, month) => {
        const key = `${month}Verve` as keyof ShopData;
        return monthSum + ((shop[key] as number) || 0);
      }, 0);
    }, 0);
    
    completedQ_Total = completedQ_8PM + completedQ_VERVE;
    
    console.log('🔍 Completed Quarter Calculation Results:', {
      completedQuarter,
      completedQuarterMonths,
      completedQ_8PM,
      completedQ_VERVE,
      completedQ_Total
    });
  }

  // Calculate ONGOING quarter data
  const ongoingQuarter = getOngoingQuarter(data.currentMonth);
  console.log('🔍 Ongoing Quarter:', ongoingQuarter);
  
  let ongoingQ_8PM = 0, ongoingQ_VERVE = 0, ongoingQ_Total = 0;
  let ongoingMonths: string[] = [];
  
  if (ongoingQuarter) {
    ongoingMonths = getOngoingQuarterMonths(ongoingQuarter, data.currentMonth);
    console.log('🔍 Ongoing Quarter Months:', ongoingMonths);
    
    // 🔍 DEBUG: Calculate with detailed logging
    ongoingQ_8PM = data.allShopsComparison.reduce((sum, shop, shopIndex) => {
      const shopSum = ongoingMonths.reduce((monthSum, month) => {
        const key = `${month}EightPM` as keyof ShopData;
        const value = (shop[key] as number) || 0;
        if (shopIndex < 3) {
          console.log(`🔍 Shop ${shopIndex} (${shop.shopName}) - ${month}EightPM:`, value);
        }
        return monthSum + value;
      }, 0);
      return sum + shopSum;
    }, 0);
    
    ongoingQ_VERVE = data.allShopsComparison.reduce((sum, shop) => {
      return sum + ongoingMonths.reduce((monthSum, month) => {
        const key = `${month}Verve` as keyof ShopData;
        return monthSum + ((shop[key] as number) || 0);
      }, 0);
    }, 0);
    
    ongoingQ_Total = ongoingQ_8PM + ongoingQ_VERVE;
    
    console.log('🔍 Ongoing Quarter Calculation Results:', {
      ongoingQuarter,
      ongoingMonths,
      ongoingQ_8PM,
      ongoingQ_VERVE,
      ongoingQ_Total
    });
  }

  // 🔍 DEBUG: Check current month data vs quarterly data
  console.log('🔍 Current Month Data vs Quarterly:', {
    summary_total8PM: data.summary.total8PM,
    summary_totalVERVE: data.summary.totalVERVE,
    summary_totalSales: data.summary.totalSales,
    calculated_ongoingQ_8PM: ongoingQ_8PM,
    calculated_ongoingQ_VERVE: ongoingQ_VERVE,
    calculated_ongoingQ_Total: ongoingQ_Total
  });

  // Simple last year data for now
  let lastYearCompletedQ_8PM = 0;
  let lastYearCompletedQ_VERVE = 0;
  let lastYearCompletedQ_Total = 0;
  
  if (completedQuarter === 'Q1') {
    lastYearCompletedQ_8PM = data.summary.lastYearTotal8PM || 0;
    lastYearCompletedQ_VERVE = data.summary.lastYearTotalVERVE || 0;
  }
  lastYearCompletedQ_Total = lastYearCompletedQ_8PM + lastYearCompletedQ_VERVE;

  // Growth Calculations
  const completedQGrowth8PM = completedQuarter && lastYearCompletedQ_8PM > 0 ? (((completedQ_8PM - lastYearCompletedQ_8PM) / lastYearCompletedQ_8PM) * 100).toFixed(1) : '0';
  const completedQGrowthVERVE = completedQuarter && lastYearCompletedQ_VERVE > 0 ? (((completedQ_VERVE - lastYearCompletedQ_VERVE) / lastYearCompletedQ_VERVE) * 100).toFixed(1) : '0';
  const completedQGrowthTotal = completedQuarter && lastYearCompletedQ_Total > 0 ? (((completedQ_Total - lastYearCompletedQ_Total) / lastYearCompletedQ_Total) * 100).toFixed(1) : '0';

  console.log('🔍 Final Results to Display:', {
    completedQuarter,
    completedQ_8PM,
    completedQ_VERVE,
    completedQ_Total,
    lastYearCompletedQ_8PM,
    lastYearCompletedQ_VERVE,
    lastYearCompletedQ_Total,
    completedQGrowth8PM,
    completedQGrowthVERVE,
    completedQGrowthTotal,
    ongoingQuarter,
    ongoingQ_8PM,
    ongoingQ_VERVE,
    ongoingQ_Total
  });

  return (
    <div className="space-y-6">
      {/* 🔍 DEBUG PANEL */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-medium text-yellow-800 mb-4">🔍 DEBUG INFO</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Current Month:</strong> {data.currentMonth} ({getMonthName(data.currentMonth)})
          </div>
          <div>
            <strong>Completed Quarter:</strong> {completedQuarter || 'None'}
          </div>
          <div>
            <strong>Ongoing Quarter:</strong> {ongoingQuarter || 'None'}
          </div>
          <div>
            <strong>Total Shops:</strong> {data.allShopsComparison.length}
          </div>
          <div>
            <strong>Summary 8PM:</strong> {data.summary.total8PM}
          </div>
          <div>
            <strong>Summary VERVE:</strong> {data.summary.totalVERVE}
          </div>
          <div>
            <strong>Calculated Q1 8PM:</strong> {completedQ_8PM}
          </div>
          <div>
            <strong>Calculated Q1 VERVE:</strong> {completedQ_VERVE}
          </div>
          <div>
            <strong>Calculated Q2 8PM:</strong> {ongoingQ_8PM}
          </div>
          <div>
            <strong>Sample Shop Data:</strong> {sampleShop ? `${sampleShop.shopName}: July=${sampleShop.julyTotal}, June=${sampleShop.juneTotal}` : 'None'}
          </div>
        </div>
      </div>

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
          trendValue={`${(data.summary.total8PM / (shopsWith8PM.length || 1)).toFixed(1)} avg cases/shop`}
        />
        
        <MetricCard
          title="VERVE Market Penetration"
          value={`${coverageVERVE}%`}
          subtitle={`${shopsWithVERVE.length} shops selling VERVE`}
          icon={Zap}
          color="orange"
          trend={parseFloat(coverageVERVE) > 30 ? 'up' : parseFloat(coverageVERVE) > 15 ? 'neutral' : 'down'}
          trendValue={`${(data.summary.totalVERVE / (shopsWithVERVE.length || 1)).toFixed(1)} avg cases/shop`}
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
          Quarterly Performance Analysis (DEBUG MODE)
        </h3>
        
        {/* COMPLETED QUARTER SECTION */}
        {completedQuarter && (
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
        )}

        {/* ONGOING QUARTER SECTION */}
        {ongoingQuarter && (
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-800 mb-2 flex items-center">
              📈 Ongoing Quarter Progress: {ongoingQuarter} FY{data.currentYear} (Month-to-Date)
            </h4>
            <div className="text-sm text-gray-600 mb-4">
              Current progress: {ongoingMonths.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* 8PM Ongoing Quarter */}
              <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
                <h5 className="font-medium text-purple-800 mb-3">8PM {ongoingQuarter} Progress</h5>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current progress:</span>
                    <span className="font-bold text-purple-600">{ongoingQ_8PM.toLocaleString()} cases</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {ongoingMonths.length} of 3 months
                  </div>
                </div>
              </div>

              {/* VERVE Ongoing Quarter */}
              <div className="bg-orange-100 p-4 rounded-lg border border-orange-300">
                <h5 className="font-medium text-orange-800 mb-3">VERVE {ongoingQuarter} Progress</h5>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current progress:</span>
                    <span className="font-bold text-orange-600">{ongoingQ_VERVE.toLocaleString()} cases</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {ongoingMonths.length} of 3 months
                  </div>
                </div>
              </div>

              {/* Combined Ongoing Quarter */}
              <div className="bg-indigo-100 p-4 rounded-lg border border-indigo-300">
                <h5 className="font-medium text-indigo-800 mb-3">Combined {ongoingQuarter} Progress</h5>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current progress:</span>
                    <span className="font-bold text-indigo-600">{ongoingQ_Total.toLocaleString()} cases</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Quarter progress tracking
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quarter Info Banner */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Financial Year Quarters:</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className={`text-center p-2 rounded ${(completedQuarter === 'Q1' || (ongoingQuarter === 'Q1')) ? 'bg-blue-100 border border-blue-300' : 'bg-white'}`}>
                <div className="font-medium">Q1</div>
                <div className="text-xs text-gray-600">Apr-May-Jun</div>
                {completedQuarter === 'Q1' && <div className="text-xs text-green-600">✓ Completed</div>}
                {ongoingQuarter === 'Q1' && <div className="text-xs text-orange-600">⏳ Ongoing</div>}
              </div>
              <div className={`text-center p-2 rounded ${(completedQuarter === 'Q2' || (ongoingQuarter === 'Q2')) ? 'bg-blue-100 border border-blue-300' : 'bg-white'}`}>
                <div className="font-medium">Q2</div>
                <div className="text-xs text-gray-600">Jul-Aug-Sep</div>
                {completedQuarter === 'Q2' && <div className="text-xs text-green-600">✓ Completed</div>}
                {ongoingQuarter === 'Q2' && <div className="text-xs text-orange-600">⏳ Ongoing</div>}
              </div>
              <div className={`text-center p-2 rounded ${(completedQuarter === 'Q3' || (ongoingQuarter === 'Q3')) ? 'bg-blue-100 border border-blue-300' : 'bg-white'}`}>
                <div className="font-medium">Q3</div>
                <div className="text-xs text-gray-600">Oct-Nov-Dec</div>
                {completedQuarter === 'Q3' && <div className="text-xs text-green-600">✓ Completed</div>}
                {ongoingQuarter === 'Q3' && <div className="text-xs text-orange-600">⏳ Ongoing</div>}
              </div>
              <div className={`text-center p-2 rounded ${(completedQuarter === 'Q4' || (ongoingQuarter === 'Q4')) ? 'bg-blue-100 border border-blue-300' : 'bg-white'}`}>
                <div className="font-medium">Q4</div>
                <div className="text-xs text-gray-600">Jan-Feb-Mar</div>
                {completedQuarter === 'Q4' && <div className="text-xs text-green-600">✓ Completed</div>}
                {ongoingQuarter === 'Q4' && <div className="text-xs text-orange-600">⏳ Ongoing</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the component remains the same for now... */}
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
            <div className={`text-2xl font-bold ${completedQuarter && parseFloat(completedQGrowthTotal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {completedQuarter ? (parseFloat(completedQGrowthTotal) >= 0 ? '+' : '') + completedQGrowthTotal + '%' : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">{completedQuarter || 'Latest'} YoY Growth</div>
            <div className="text-xs text-gray-400">vs last year</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
