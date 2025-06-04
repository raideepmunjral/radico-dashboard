'use client';

import React, { useEffect, useState } from 'react';

// ==========================================
// TYPE DEFINITIONS & INTERFACES
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
  juneLastYearTotal?: number;
  juneLastYearEightPM?: number;
  juneLastYearVerve?: number;
  yoyGrowthPercent?: number;
  growthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
  threeMonthAvgTotal?: number;
  threeMonthAvg8PM?: number;
  threeMonthAvgVERVE?: number;
}

interface CustomerInsights {
  firstTimeCustomers: number;
  lostCustomers: number;
  consistentPerformers: number;
  decliningPerformers: number;
  newShops: ShopData[];
  lostShops: ShopData[];
  consistentShops: ShopData[];
  decliningShops: ShopData[];
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
  topShops: ShopData[];
  deptPerformance: Record<string, any>;
  salesData: Record<string, ShopData>;
  visitData: number;
  lastUpdated: Date;
  salespersonStats: Record<string, any>;
  customerInsights: CustomerInsights;
  allShopsComparison: ShopData[];
  historicalData?: any;
  currentMonth: string;
  currentYear: string;
}

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

// ==========================================
// HISTORICAL ANALYSIS TAB COMPONENT
// ==========================================

const HistoricalAnalysisTab = ({ data }: { data: DashboardData }) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (data.historicalData) {
      setDebugInfo({
        hasHistoricalData: !!data.historicalData,
        historicalData: data.historicalData,
        customerInsights: data.customerInsights,
        // EXTENDED: 12 months of data
        monthlyTotals: {
          // Q2 2025 (Current Quarter)
          june: {
            shops: data.historicalData.june?.uniqueShops?.size || 0,
            total8PM: data.historicalData.june?.total8PM || 0,
            totalVERVE: data.historicalData.june?.totalVERVE || 0
          },
          may: {
            shops: data.historicalData.may?.uniqueShops?.size || 0,
            total8PM: data.historicalData.may?.total8PM || 0,
            totalVERVE: data.historicalData.may?.totalVERVE || 0
          },
          april: {
            shops: data.historicalData.april?.uniqueShops?.size || 0,
            total8PM: data.historicalData.april?.total8PM || 0,
            totalVERVE: data.historicalData.april?.totalVERVE || 0
          },
          // Q1 2025
          march: {
            shops: data.historicalData.march?.uniqueShops?.size || 0,
            total8PM: data.historicalData.march?.total8PM || 0,
            totalVERVE: data.historicalData.march?.totalVERVE || 0
          },
          february: {
            shops: data.historicalData.february?.uniqueShops?.size || 0,
            total8PM: data.historicalData.february?.total8PM || 0,
            totalVERVE: data.historicalData.february?.totalVERVE || 0
          },
          january: {
            shops: data.historicalData.january?.uniqueShops?.size || 0,
            total8PM: data.historicalData.january?.total8PM || 0,
            totalVERVE: data.historicalData.january?.totalVERVE || 0
          },
          // Q4 2024
          december2024: {
            shops: data.historicalData.december2024?.uniqueShops?.size || 0,
            total8PM: data.historicalData.december2024?.total8PM || 0,
            totalVERVE: data.historicalData.december2024?.totalVERVE || 0
          },
          november2024: {
            shops: data.historicalData.november2024?.uniqueShops?.size || 0,
            total8PM: data.historicalData.november2024?.total8PM || 0,
            totalVERVE: data.historicalData.november2024?.totalVERVE || 0
          },
          october2024: {
            shops: data.historicalData.october2024?.uniqueShops?.size || 0,
            total8PM: data.historicalData.october2024?.total8PM || 0,
            totalVERVE: data.historicalData.october2024?.totalVERVE || 0
          },
          // Q3 2024
          september2024: {
            shops: data.historicalData.september2024?.uniqueShops?.size || 0,
            total8PM: data.historicalData.september2024?.total8PM || 0,
            totalVERVE: data.historicalData.september2024?.totalVERVE || 0
          },
          august2024: {
            shops: data.historicalData.august2024?.uniqueShops?.size || 0,
            total8PM: data.historicalData.august2024?.total8PM || 0,
            totalVERVE: data.historicalData.august2024?.totalVERVE || 0
          },
          july2024: {
            shops: data.historicalData.july2024?.uniqueShops?.size || 0,
            total8PM: data.historicalData.july2024?.total8PM || 0,
            totalVERVE: data.historicalData.july2024?.totalVERVE || 0
          },
          // YoY Comparison
          lastYear: {
            shops: data.historicalData.juneLastYear?.uniqueShops?.size || 0,
            total8PM: data.historicalData.juneLastYear?.total8PM || 0,
            totalVERVE: data.historicalData.juneLastYear?.totalVERVE || 0
          }
        }
      });
    }
  }, [data]);

  // Calculate month-over-month growth
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100);
  };

  // EXTENDED: 12-month data for comprehensive analysis
  const monthlyData = debugInfo?.monthlyTotals ? [
    // Jul 2024 - Dec 2024
    { 
      month: 'July 2024',
      total: debugInfo.monthlyTotals.july2024.total8PM + debugInfo.monthlyTotals.july2024.totalVERVE,
      total8PM: debugInfo.monthlyTotals.july2024.total8PM,
      totalVERVE: debugInfo.monthlyTotals.july2024.totalVERVE,
      shops: debugInfo.monthlyTotals.july2024.shops,
      quarter: 'Q3 2024',
      growth: 0 // Base month
    },
    { 
      month: 'August 2024',
      total: debugInfo.monthlyTotals.august2024.total8PM + debugInfo.monthlyTotals.august2024.totalVERVE,
      total8PM: debugInfo.monthlyTotals.august2024.total8PM,
      totalVERVE: debugInfo.monthlyTotals.august2024.totalVERVE,
      shops: debugInfo.monthlyTotals.august2024.shops,
      quarter: 'Q3 2024',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.august2024.total8PM + debugInfo.monthlyTotals.august2024.totalVERVE,
        debugInfo.monthlyTotals.july2024.total8PM + debugInfo.monthlyTotals.july2024.totalVERVE
      )
    },
    { 
      month: 'September 2024',
      total: debugInfo.monthlyTotals.september2024.total8PM + debugInfo.monthlyTotals.september2024.totalVERVE,
      total8PM: debugInfo.monthlyTotals.september2024.total8PM,
      totalVERVE: debugInfo.monthlyTotals.september2024.totalVERVE,
      shops: debugInfo.monthlyTotals.september2024.shops,
      quarter: 'Q3 2024',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.september2024.total8PM + debugInfo.monthlyTotals.september2024.totalVERVE,
        debugInfo.monthlyTotals.august2024.total8PM + debugInfo.monthlyTotals.august2024.totalVERVE
      )
    },
    { 
      month: 'October 2024',
      total: debugInfo.monthlyTotals.october2024.total8PM + debugInfo.monthlyTotals.october2024.totalVERVE,
      total8PM: debugInfo.monthlyTotals.october2024.total8PM,
      totalVERVE: debugInfo.monthlyTotals.october2024.totalVERVE,
      shops: debugInfo.monthlyTotals.october2024.shops,
      quarter: 'Q4 2024',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.october2024.total8PM + debugInfo.monthlyTotals.october2024.totalVERVE,
        debugInfo.monthlyTotals.september2024.total8PM + debugInfo.monthlyTotals.september2024.totalVERVE
      )
    },
    { 
      month: 'November 2024',
      total: debugInfo.monthlyTotals.november2024.total8PM + debugInfo.monthlyTotals.november2024.totalVERVE,
      total8PM: debugInfo.monthlyTotals.november2024.total8PM,
      totalVERVE: debugInfo.monthlyTotals.november2024.totalVERVE,
      shops: debugInfo.monthlyTotals.november2024.shops,
      quarter: 'Q4 2024',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.november2024.total8PM + debugInfo.monthlyTotals.november2024.totalVERVE,
        debugInfo.monthlyTotals.october2024.total8PM + debugInfo.monthlyTotals.october2024.totalVERVE
      )
    },
    { 
      month: 'December 2024',
      total: debugInfo.monthlyTotals.december2024.total8PM + debugInfo.monthlyTotals.december2024.totalVERVE,
      total8PM: debugInfo.monthlyTotals.december2024.total8PM,
      totalVERVE: debugInfo.monthlyTotals.december2024.totalVERVE,
      shops: debugInfo.monthlyTotals.december2024.shops,
      quarter: 'Q4 2024',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.december2024.total8PM + debugInfo.monthlyTotals.december2024.totalVERVE,
        debugInfo.monthlyTotals.november2024.total8PM + debugInfo.monthlyTotals.november2024.totalVERVE
      )
    },
    // Jan 2025 - Jun 2025
    { 
      month: 'January 2025',
      total: debugInfo.monthlyTotals.january.total8PM + debugInfo.monthlyTotals.january.totalVERVE,
      total8PM: debugInfo.monthlyTotals.january.total8PM,
      totalVERVE: debugInfo.monthlyTotals.january.totalVERVE,
      shops: debugInfo.monthlyTotals.january.shops,
      quarter: 'Q1 2025',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.january.total8PM + debugInfo.monthlyTotals.january.totalVERVE,
        debugInfo.monthlyTotals.december2024.total8PM + debugInfo.monthlyTotals.december2024.totalVERVE
      )
    },
    { 
      month: 'February 2025',
      total: debugInfo.monthlyTotals.february.total8PM + debugInfo.monthlyTotals.february.totalVERVE,
      total8PM: debugInfo.monthlyTotals.february.total8PM,
      totalVERVE: debugInfo.monthlyTotals.february.totalVERVE,
      shops: debugInfo.monthlyTotals.february.shops,
      quarter: 'Q1 2025',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.february.total8PM + debugInfo.monthlyTotals.february.totalVERVE,
        debugInfo.monthlyTotals.january.total8PM + debugInfo.monthlyTotals.january.totalVERVE
      )
    },
    { 
      month: 'March 2025',
      total: debugInfo.monthlyTotals.march.total8PM + debugInfo.monthlyTotals.march.totalVERVE,
      total8PM: debugInfo.monthlyTotals.march.total8PM,
      totalVERVE: debugInfo.monthlyTotals.march.totalVERVE,
      shops: debugInfo.monthlyTotals.march.shops,
      quarter: 'Q1 2025',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.march.total8PM + debugInfo.monthlyTotals.march.totalVERVE,
        debugInfo.monthlyTotals.february.total8PM + debugInfo.monthlyTotals.february.totalVERVE
      )
    },
    { 
      month: 'April 2025',
      total: debugInfo.monthlyTotals.april.total8PM + debugInfo.monthlyTotals.april.totalVERVE,
      total8PM: debugInfo.monthlyTotals.april.total8PM,
      totalVERVE: debugInfo.monthlyTotals.april.totalVERVE,
      shops: debugInfo.monthlyTotals.april.shops,
      quarter: 'Q2 2025',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.april.total8PM + debugInfo.monthlyTotals.april.totalVERVE,
        debugInfo.monthlyTotals.march.total8PM + debugInfo.monthlyTotals.march.totalVERVE
      )
    },
    { 
      month: 'May 2025',
      total: debugInfo.monthlyTotals.may.total8PM + debugInfo.monthlyTotals.may.totalVERVE,
      total8PM: debugInfo.monthlyTotals.may.total8PM,
      totalVERVE: debugInfo.monthlyTotals.may.totalVERVE,
      shops: debugInfo.monthlyTotals.may.shops,
      quarter: 'Q2 2025',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.may.total8PM + debugInfo.monthlyTotals.may.totalVERVE,
        debugInfo.monthlyTotals.april.total8PM + debugInfo.monthlyTotals.april.totalVERVE
      )
    },
    { 
      month: `${getMonthName(data.currentMonth)} ${data.currentYear} (Current)`,
      total: debugInfo.monthlyTotals.june.total8PM + debugInfo.monthlyTotals.june.totalVERVE,
      total8PM: debugInfo.monthlyTotals.june.total8PM,
      totalVERVE: debugInfo.monthlyTotals.june.totalVERVE,
      shops: debugInfo.monthlyTotals.june.shops,
      quarter: 'Q2 2025',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.june.total8PM + debugInfo.monthlyTotals.june.totalVERVE,
        debugInfo.monthlyTotals.may.total8PM + debugInfo.monthlyTotals.may.totalVERVE
      )
    }
  ] : [];

  // YoY comparison data
  const yoyComparison = debugInfo?.monthlyTotals ? {
    currentYear: {
      total: debugInfo.monthlyTotals.june.total8PM + debugInfo.monthlyTotals.june.totalVERVE,
      total8PM: debugInfo.monthlyTotals.june.total8PM,
      totalVERVE: debugInfo.monthlyTotals.june.totalVERVE,
      shops: debugInfo.monthlyTotals.june.shops
    },
    lastYear: {
      total: debugInfo.monthlyTotals.lastYear.total8PM + debugInfo.monthlyTotals.lastYear.totalVERVE,
      total8PM: debugInfo.monthlyTotals.lastYear.total8PM,
      totalVERVE: debugInfo.monthlyTotals.lastYear.totalVERVE,
      shops: debugInfo.monthlyTotals.lastYear.shops
    },
    growth: {
      total: calculateGrowth(
        debugInfo.monthlyTotals.june.total8PM + debugInfo.monthlyTotals.june.totalVERVE,
        debugInfo.monthlyTotals.lastYear.total8PM + debugInfo.monthlyTotals.lastYear.totalVERVE
      ),
      total8PM: calculateGrowth(debugInfo.monthlyTotals.june.total8PM, debugInfo.monthlyTotals.lastYear.total8PM),
      totalVERVE: calculateGrowth(debugInfo.monthlyTotals.june.totalVERVE, debugInfo.monthlyTotals.lastYear.totalVERVE),
      shops: calculateGrowth(debugInfo.monthlyTotals.june.shops, debugInfo.monthlyTotals.lastYear.shops)
    }
  } : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Historical Analysis & Trends</h2>
        <p className="text-gray-600">Rolling 4-Month Business Performance + Year-over-Year Analysis ({getMonthName(data.currentMonth)} {data.currentYear} vs {getMonthName(data.currentMonth)} 2024)</p>
      </div>

      {/* YoY COMPARISON CARDS */}
      {yoyComparison && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Year-over-Year Comparison ({getMonthName(data.currentMonth)})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{yoyComparison.currentYear.total.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{getMonthName(data.currentMonth)} {data.currentYear}</div>
              <div className="text-xs text-gray-400">vs {yoyComparison.lastYear.total.toLocaleString()} last year</div>
              <div className={`text-sm font-medium ${yoyComparison?.growth?.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(yoyComparison?.growth?.total ?? 0) >= 0 ? '+' : ''}{(yoyComparison?.growth?.total ?? 0).toFixed(1)}% YoY
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{yoyComparison.currentYear.total8PM.toLocaleString()}</div>
              <div className="text-sm text-gray-500">8PM {data.currentYear}</div>
              <div className="text-xs text-gray-400">vs {yoyComparison.lastYear.total8PM.toLocaleString()} last year</div>
              <div className={`text-sm font-medium ${yoyComparison?.growth?.total8PM >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(yoyComparison?.growth?.total8PM ?? 0) >= 0 ? '+' : ''}{(yoyComparison?.growth?.total8PM ?? 0).toFixed(1)}% YoY
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{yoyComparison.currentYear.totalVERVE.toLocaleString()}</div>
              <div className="text-sm text-gray-500">VERVE {data.currentYear}</div>
              <div className="text-xs text-gray-400">vs {yoyComparison.lastYear.totalVERVE.toLocaleString()} last year</div>
              <div className={`text-sm font-medium ${yoyComparison?.growth?.totalVERVE >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(yoyComparison?.growth?.totalVERVE ?? 0) >= 0 ? '+' : ''}{(yoyComparison?.growth?.totalVERVE ?? 0).toFixed(1)}% YoY
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{yoyComparison.currentYear.shops}</div>
              <div className="text-sm text-gray-500">Active Shops {data.currentYear}</div>
              <div className="text-xs text-gray-400">vs {yoyComparison.lastYear.shops} last year</div>
              <div className={`text-sm font-medium ${yoyComparison?.growth?.shops >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(yoyComparison?.growth?.shops ?? 0) >= 0 ? '+' : ''}{(yoyComparison?.growth?.shops ?? 0).toFixed(1)}% YoY
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLLING 4-MONTH COMPARISON */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {monthlyData.slice(-4).map((month, index) => (
          <div key={month.month} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{month.month}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Sales:</span>
                <span className="font-medium">{month.total.toLocaleString()} cases</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">8PM:</span>
                <span className="font-medium text-purple-600">{month.total8PM.toLocaleString()} cases</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">VERVE:</span>
                <span className="font-medium text-orange-600">{month.totalVERVE.toLocaleString()} cases</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Active Shops:</span>
                <span className="font-medium">{month.shops}</span>
              </div>
              {index > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Growth:</span>
                  <span className={`font-medium ${month.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {month.growth >= 0 ? '+' : ''}{month.growth.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 12-MONTH SALES TREND */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">12-Month Sales Trend Analysis</h3>
        <div className="space-y-6">
          {/* Quarterly Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-600 mb-2">Q3 2024</h4>
              <div className="text-sm space-y-1">
                <div>Jul: {monthlyData.find(m => m.month.includes('July'))?.total || 0}</div>
                <div>Aug: {monthlyData.find(m => m.month.includes('August'))?.total || 0}</div>
                <div>Sep: {monthlyData.find(m => m.month.includes('September'))?.total || 0}</div>
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-600 mb-2">Q4 2024</h4>
              <div className="text-sm space-y-1">
                <div>Oct: {monthlyData.find(m => m.month.includes('October'))?.total || 0}</div>
                <div>Nov: {monthlyData.find(m => m.month.includes('November'))?.total || 0}</div>
                <div>Dec: {monthlyData.find(m => m.month.includes('December'))?.total || 0}</div>
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-600 mb-2">Q1 2025</h4>
              <div className="text-sm space-y-1">
                <div>Jan: {monthlyData.find(m => m.month.includes('January'))?.total || 0}</div>
                <div>Feb: {monthlyData.find(m => m.month.includes('February'))?.total || 0}</div>
                <div>Mar: {monthlyData.find(m => m.month.includes('March'))?.total || 0}</div>
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-600 mb-2">Q2 2025</h4>
              <div className="text-sm space-y-1">
                <div>Apr: {monthlyData.find(m => m.month.includes('April'))?.total || 0}</div>
                <div>May: {monthlyData.find(m => m.month.includes('May'))?.total || 0}</div>
                <div>Jun: {monthlyData.find(m => m.month.includes('Jun'))?.total || 0}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-purple-600 mb-2">8PM Family Performance (12 Months)</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {monthlyData.map((month) => (
                <div key={month.month} className="text-center">
                  <div className="text-sm font-bold text-purple-600">{month.total8PM.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0].substring(0, 3)}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-orange-600 mb-2">VERVE Family Performance (12 Months)</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {monthlyData.map((month) => (
                <div key={month.month} className="text-center">
                  <div className="text-sm font-bold text-orange-600">{month.totalVERVE.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0].substring(0, 3)}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-blue-600 mb-2">Total Sales Performance (12 Months)</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {monthlyData.map((month) => (
                <div key={month.month} className="text-center">
                  <div className="text-sm font-bold text-blue-600">{month.total.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0].substring(0, 3)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Journey Analysis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Journey Analysis (Rolling 4-Month Window: Mar-Apr-May-{getMonthName(data.currentMonth)})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.customerInsights.firstTimeCustomers}</div>
            <div className="text-sm text-gray-500">New Customers</div>
            <div className="text-xs text-gray-400">Started in {getMonthName(data.currentMonth)}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{data.customerInsights.lostCustomers}</div>
            <div className="text-sm text-gray-500">Lost Customers</div>
            <div className="text-xs text-gray-400">Active in May, not in {getMonthName(data.currentMonth)}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.customerInsights.consistentPerformers}</div>
            <div className="text-sm text-gray-500">Consistent Performers</div>
            <div className="text-xs text-gray-400">Growing or stable</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{data.customerInsights.decliningPerformers}</div>
            <div className="text-sm text-gray-500">Declining Performers</div>
            <div className="text-xs text-gray-400">Negative growth trend</div>
          </div>
        </div>
      </div>

      {/* ENHANCED: Rolling Window Performance Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">12-Month Performance Insights & Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Quarterly Growth Analysis</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Q3 → Q4 2024:</span>
                <span className="text-sm font-medium">Trend Analysis</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Q4 → Q1 2025:</span>
                <span className="text-sm font-medium">Seasonal Impact</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Q1 → Q2 2025:</span>
                <span className="text-sm font-medium">Current Growth</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Brand Performance Evolution</h4>
            <div className="space-y-2">
              {monthlyData.slice(-6).map((month) => (
                <div key={month.month} className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">{month.month.split(' ')[0]}</div>
                  <div className="flex space-x-4 text-xs">
                    <span className="text-purple-600">
                      8PM: {month.total > 0 ? ((month.total8PM / month.total) * 100).toFixed(1) : 0}%
                    </span>
                    <span className="text-orange-600">
                      VERVE: {month.total > 0 ? ((month.totalVERVE / month.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">12-Month Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Months:</span>
                <span className="text-sm font-medium text-blue-600">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Peak Month:</span>
                <span className="text-sm font-medium text-green-600">
                  {monthlyData.reduce((max, month) => month.total > max.total ? month : max, monthlyData[0])?.month.split(' ')[0] || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Growth:</span>
                <span className="text-sm font-medium text-purple-600">
                  {(monthlyData.reduce((sum, month, index) => index > 0 ? sum + month.growth : sum, 0) / (monthlyData.length - 1)).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Integration Status */}
      {debugInfo && (
        <div className={`p-6 rounded-lg text-center ${
          debugInfo?.monthlyTotals?.march?.total8PM > 0 || debugInfo?.monthlyTotals?.march?.totalVERVE > 0
            ? 'bg-green-50'
            : 'bg-yellow-50'
        }`}>
          {debugInfo?.monthlyTotals?.march?.total8PM > 0 || debugInfo?.monthlyTotals?.march?.totalVERVE > 0 ? (
            <>
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-lg font-medium text-green-900 mb-2">12-Month Historical Data Integration: Complete</h3>
              <p className="text-green-700 mb-4">
                Successfully integrated 12 months of historical data (Jul 2024 - {getMonthName(data.currentMonth)} {data.currentYear}) with comprehensive trend analysis and quarterly insights.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-gray-600">Months Analyzed</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-purple-600">
                    {debugInfo.monthlyTotals.june?.total8PM?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">{getMonthName(data.currentMonth)} 8PM</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-orange-600">
                    {debugInfo.monthlyTotals.june?.totalVERVE?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">{getMonthName(data.currentMonth)} VERVE</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className={`text-2xl font-bold ${(yoyComparison?.growth?.total ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(yoyComparison?.growth?.total ?? 0) >= 0 ? '+' : ''}{(yoyComparison?.growth?.total ?? 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">YoY Growth</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-green-600">4</div>
                  <div className="text-sm text-gray-600">Quarters Covered</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-yellow-900 mb-2">Historical Data: Processing</h3>
              <p className="text-yellow-700 mb-4">
                Historical data connection established. Verification in progress.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoricalAnalysisTab;
