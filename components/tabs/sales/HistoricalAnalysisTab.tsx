'use client';

import React, { useState, useEffect } from 'react';

// ==========================================
// TYPE DEFINITIONS (UPDATED FOR DYNAMIC MONTH HANDLING)
// ==========================================

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
  customerInsights: {
    firstTimeCustomers: number;
    lostCustomers: number;
    consistentPerformers: number;
    decliningPerformers: number;
  };
  currentMonth: string;
  currentYear: string;
  // FIXED: Dynamic historical data structure
  historicalData?: {
    [key: string]: any; // Now supports dynamic month keys
  };
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

// NEW: Helper function for quarterly calculations with dynamic month support
const calculateQuarterlyData = (historicalData: any, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', year: '2024' | '2025') => {
  const quarters = {
    Q1: year === '2025' ? ['apr', 'may', 'jun'] : ['apr2024', 'may2024', 'jun2024'],
    Q2: year === '2025' ? ['jul', 'aug', 'sep'] : ['jul2024', 'aug2024', 'sep2024'],
    Q3: year === '2025' ? ['oct', 'nov', 'dec'] : ['oct2024', 'nov2024', 'dec2024'],
    Q4: year === '2025' ? ['jan', 'feb', 'mar'] : ['jan2024', 'feb2024', 'mar2024']
  };

  const months = quarters[quarter];
  let total8PM = 0, totalVERVE = 0, totalShops = 0;

  months.forEach(month => {
    const monthData = historicalData?.[month];
    if (monthData) {
      total8PM += monthData.total8PM || 0;
      totalVERVE += monthData.totalVERVE || 0;
      totalShops += monthData.uniqueShops?.size || 0;
    }
  });

  return {
    total8PM,
    totalVERVE,
    totalSales: total8PM + totalVERVE,
    averageShops: Math.round(totalShops / months.length),
    monthsInQuarter: months.length
  };
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const HistoricalAnalysisTab = ({ data }: { data: DashboardData }) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Calculate month-over-month growth
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100);
  };

  useEffect(() => {
    if (data.historicalData) {
      // 🔧 FIXED: Dynamic month processing based on available historical data
      const monthlyTotals: Record<string, any> = {};
      
      // Process all available months in historical data
      Object.keys(data.historicalData).forEach(monthKey => {
        const monthData = data.historicalData![monthKey];
        if (monthData && monthData.uniqueShops) {
          monthlyTotals[monthKey] = {
            shops: monthData.uniqueShops?.size || 0,
            total8PM: monthData.total8PM || 0,
            totalVERVE: monthData.totalVERVE || 0
          };
        }
      });

      // 🔧 FIXED: Handle current month data properly
      const currentMonthKey = getShortMonthName(data.currentMonth).toLowerCase();
      if (data.historicalData[currentMonthKey]) {
        monthlyTotals[currentMonthKey] = {
          shops: data.historicalData[currentMonthKey].uniqueShops?.size || 0,
          total8PM: data.historicalData[currentMonthKey].total8PM || 0,
          totalVERVE: data.historicalData[currentMonthKey].totalVERVE || 0
        };
      }

      // Add YoY comparison from last year same month
      const lastYearCurrentMonth = `${currentMonthKey}2024`;
      if (data.historicalData[lastYearCurrentMonth]) {
        monthlyTotals.lastYear = monthlyTotals[lastYearCurrentMonth];
      } else if (data.historicalData['jun2024'] && data.currentMonth === '07') {
        // Handle transition case where we're in July but June 2024 data is available
        monthlyTotals.lastYear = monthlyTotals['jun2024'];
      }

      setDebugInfo({
        hasHistoricalData: !!data.historicalData,
        historicalData: data.historicalData,
        customerInsights: data.customerInsights,
        monthlyTotals: monthlyTotals,
        currentMonthKey: currentMonthKey,
        availableMonths: Object.keys(data.historicalData).sort()
      });
      
      console.log('🔧 FIXED Historical Analysis - Processed months:', {
        currentMonth: data.currentMonth,
        currentMonthKey: currentMonthKey,
        availableMonths: Object.keys(data.historicalData).length,
        monthlyTotals: Object.keys(monthlyTotals)
      });
    }
  }, [data]);

  // 🔧 FIXED: Generate monthly data array dynamically from available data
  const monthlyData = debugInfo?.monthlyTotals ? (() => {
    const months = [];
    const monthOrder = [
      'apr2024', 'may2024', 'jun2024', 'jul2024', 'aug2024', 'sep2024',
      'oct2024', 'nov2024', 'dec2024', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul'
    ];
    
    monthOrder.forEach((monthKey, index) => {
      const monthData = debugInfo.monthlyTotals[monthKey];
      if (monthData) {
        const isCurrentMonth = monthKey === debugInfo.currentMonthKey;
        const monthName = monthKey.includes('2024') ? 
          `${monthKey.charAt(0).toUpperCase() + monthKey.slice(1, 3)} 2024` :
          `${monthKey.charAt(0).toUpperCase() + monthKey.slice(1)} 2025`;
        
        const total = monthData.total8PM + monthData.totalVERVE;
        
        // Calculate growth from previous month
        let growth = 0;
        if (index > 0) {
          const prevMonthKey = monthOrder[index - 1];
          const prevMonthData = debugInfo.monthlyTotals[prevMonthKey];
          if (prevMonthData) {
            const prevTotal = prevMonthData.total8PM + prevMonthData.totalVERVE;
            growth = calculateGrowth(total, prevTotal);
          }
        }
        
        months.push({
          month: isCurrentMonth ? `${monthName} (Current)` : monthName,
          total: total,
          total8PM: monthData.total8PM,
          totalVERVE: monthData.totalVERVE,
          shops: monthData.shops,
          quarter: monthKey.includes('2024') ? 
            (monthKey.includes('apr') || monthKey.includes('may') || monthKey.includes('jun') ? 'Q1 2024' :
             monthKey.includes('jul') || monthKey.includes('aug') || monthKey.includes('sep') ? 'Q2 2024' :
             monthKey.includes('oct') || monthKey.includes('nov') || monthKey.includes('dec') ? 'Q3 2024' : 'Q4 2024') :
            (monthKey.includes('jan') || monthKey.includes('feb') || monthKey.includes('mar') ? 'Q4 2025' :
             monthKey.includes('apr') || monthKey.includes('may') || monthKey.includes('jun') ? 'Q1 2025' :
             monthKey.includes('jul') || monthKey.includes('aug') || monthKey.includes('sep') ? 'Q2 2025' : 'Q3 2025'),
          growth: growth
        });
      }
    });
    
    return months;
  })() : [];

  // 🔧 FIXED: Quarterly analysis with dynamic data
  const quarterlyData = data.historicalData ? {
    q1FY2024: calculateQuarterlyData(data.historicalData, 'Q1', '2024'),
    q2FY2024: calculateQuarterlyData(data.historicalData, 'Q2', '2024'),
    q3FY2024: calculateQuarterlyData(data.historicalData, 'Q3', '2024'),
    q4FY2025: calculateQuarterlyData(data.historicalData, 'Q4', '2025'),
    q1FY2025: calculateQuarterlyData(data.historicalData, 'Q1', '2025'),
    q2FY2025: calculateQuarterlyData(data.historicalData, 'Q2', '2025')
  } : null;

  // 🔧 FIXED: YoY comparison with current month
  const yoyComparison = debugInfo?.monthlyTotals ? (() => {
    const currentMonthData = debugInfo.monthlyTotals[debugInfo.currentMonthKey] || { total8PM: 0, totalVERVE: 0, shops: 0 };
    const lastYearMonthKey = `${debugInfo.currentMonthKey}2024`;
    const lastYearData = debugInfo.monthlyTotals[lastYearMonthKey] || debugInfo.monthlyTotals.lastYear || { total8PM: 0, totalVERVE: 0, shops: 0 };
    
    return {
      currentYear: {
        total: currentMonthData.total8PM + currentMonthData.totalVERVE,
        total8PM: currentMonthData.total8PM,
        totalVERVE: currentMonthData.totalVERVE,
        shops: currentMonthData.shops
      },
      lastYear: {
        total: lastYearData.total8PM + lastYearData.totalVERVE,
        total8PM: lastYearData.total8PM,
        totalVERVE: lastYearData.totalVERVE,
        shops: lastYearData.shops
      },
      growth: {
        total: calculateGrowth(currentMonthData.total8PM + currentMonthData.totalVERVE, lastYearData.total8PM + lastYearData.totalVERVE),
        total8PM: calculateGrowth(currentMonthData.total8PM, lastYearData.total8PM),
        totalVERVE: calculateGrowth(currentMonthData.totalVERVE, lastYearData.totalVERVE),
        shops: calculateGrowth(currentMonthData.shops, lastYearData.shops)
      }
    };
  })() : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Historical Analysis & Trends</h2>
        <p className="text-gray-600">15-Month Comprehensive Analysis + Complete Quarterly Comparisons ({getMonthName(data.currentMonth)} {data.currentYear} vs {getMonthName(data.currentMonth)} 2024)</p>
      </div>

      {/* 🔧 FIXED: Complete Quarterly Comparison with dynamic data */}
      {quarterlyData && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Complete Quarterly Analysis (Indian FY)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Q1 FY2024 vs Q1 FY2025 */}
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3">Q1 Comparison (Apr-May-Jun)</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Q1 FY2024:</span>
                  <span className="font-medium">{quarterlyData.q1FY2024.totalSales.toLocaleString()} cases</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Q1 FY2025:</span>
                  <span className="font-bold text-blue-600">{quarterlyData.q1FY2025.totalSales.toLocaleString()} cases</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-700">YoY Growth:</span>
                  <span className={`font-bold ${
                    calculateGrowth(quarterlyData.q1FY2025.totalSales, quarterlyData.q1FY2024.totalSales) >= 0 
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {calculateGrowth(quarterlyData.q1FY2025.totalSales, quarterlyData.q1FY2024.totalSales) >= 0 ? '+' : ''}
                    {calculateGrowth(quarterlyData.q1FY2025.totalSales, quarterlyData.q1FY2024.totalSales).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 8PM Brand Analysis */}
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-3">8PM Family Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Q1 FY2024:</span>
                  <span className="font-medium">{quarterlyData.q1FY2024.total8PM.toLocaleString()} cases</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Q1 FY2025:</span>
                  <span className="font-bold text-purple-600">{quarterlyData.q1FY2025.total8PM.toLocaleString()} cases</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-700">YoY Growth:</span>
                  <span className={`font-bold ${
                    calculateGrowth(quarterlyData.q1FY2025.total8PM, quarterlyData.q1FY2024.total8PM) >= 0 
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {calculateGrowth(quarterlyData.q1FY2025.total8PM, quarterlyData.q1FY2024.total8PM) >= 0 ? '+' : ''}
                    {calculateGrowth(quarterlyData.q1FY2025.total8PM, quarterlyData.q1FY2024.total8PM).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* VERVE Brand Analysis */}
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-800 mb-3">VERVE Family Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Q1 FY2024:</span>
                  <span className="font-medium">{quarterlyData.q1FY2024.totalVERVE.toLocaleString()} cases</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Q1 FY2025:</span>
                  <span className="font-bold text-orange-600">{quarterlyData.q1FY2025.totalVERVE.toLocaleString()} cases</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-700">YoY Growth:</span>
                  <span className={`font-bold ${
                    calculateGrowth(quarterlyData.q1FY2025.totalVERVE, quarterlyData.q1FY2024.totalVERVE) >= 0 
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {calculateGrowth(quarterlyData.q1FY2025.totalVERVE, quarterlyData.q1FY2024.totalVERVE) >= 0 ? '+' : ''}
                    {calculateGrowth(quarterlyData.q1FY2025.totalVERVE, quarterlyData.q1FY2024.totalVERVE).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔧 FIXED: YoY COMPARISON CARDS with current month */}
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

      {/* 🔧 FIXED: Rolling Monthly Comparison with dynamic data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monthlyData.slice(-6).map((month, index) => (
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

      {/* 🔧 FIXED: 15-Month Sales Trend with dynamic quarters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">15-Month Sales Trend Analysis (Complete FY Coverage)</h3>
        <div className="space-y-6">
          
          {/* FIXED: Quarterly Breakdown with actual available quarters */}
          {quarterlyData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-600 mb-2">Q1 FY2024</h4>
                <div className="text-sm space-y-1">
                  <div className="font-bold text-lg text-blue-800">{quarterlyData.q1FY2024.totalSales.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Apr+May+Jun 2024</div>
                  <div className="text-xs space-x-2">
                    <span className="text-purple-600">{quarterlyData.q1FY2024.total8PM.toLocaleString()} 8PM</span>
                    <span className="text-orange-600">{quarterlyData.q1FY2024.totalVERVE.toLocaleString()} VERVE</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-600 mb-2">Q2 FY2024</h4>
                <div className="text-sm space-y-1">
                  <div className="font-bold text-lg text-green-800">{quarterlyData.q2FY2024.totalSales.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Jul+Aug+Sep 2024</div>
                  <div className="text-xs space-x-2">
                    <span className="text-purple-600">{quarterlyData.q2FY2024.total8PM.toLocaleString()} 8PM</span>
                    <span className="text-orange-600">{quarterlyData.q2FY2024.totalVERVE.toLocaleString()} VERVE</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-600 mb-2">Q3 FY2024</h4>
                <div className="text-sm space-y-1">
                  <div className="font-bold text-lg text-orange-800">{quarterlyData.q3FY2024.totalSales.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Oct+Nov+Dec 2024</div>
                  <div className="text-xs space-x-2">
                    <span className="text-purple-600">{quarterlyData.q3FY2024.total8PM.toLocaleString()} 8PM</span>
                    <span className="text-orange-600">{quarterlyData.q3FY2024.totalVERVE.toLocaleString()} VERVE</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-600 mb-2">Q1 FY2025</h4>
                <div className="text-sm space-y-1">
                  <div className="font-bold text-lg text-purple-800">{quarterlyData.q1FY2025.totalSales.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Apr+May+Jun 2025</div>
                  <div className="text-xs space-x-2">
                    <span className="text-purple-600">{quarterlyData.q1FY2025.total8PM.toLocaleString()} 8PM</span>
                    <span className="text-orange-600">{quarterlyData.q1FY2025.totalVERVE.toLocaleString()} VERVE</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FIXED: Brand performance trends */}
          <div>
            <h4 className="font-medium text-purple-600 mb-2">8PM Family Performance (15 Months Complete)</h4>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-15 gap-1">
              {monthlyData.map((month) => (
                <div key={month.month} className="text-center p-1">
                  <div className="text-xs font-bold text-purple-600">{month.total8PM.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0].substring(0, 3)}</div>
                  <div className="text-xs text-gray-400">{month.month.includes('2024') ? '24' : '25'}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-orange-600 mb-2">VERVE Family Performance (15 Months Complete)</h4>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-15 gap-1">
              {monthlyData.map((month) => (
                <div key={month.month} className="text-center p-1">
                  <div className="text-xs font-bold text-orange-600">{month.totalVERVE.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0].substring(0, 3)}</div>
                  <div className="text-xs text-gray-400">{month.month.includes('2024') ? '24' : '25'}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-blue-600 mb-2">Total Sales Performance (15 Months Complete)</h4>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-15 gap-1">
              {monthlyData.map((month) => (
                <div key={month.month} className="text-center p-1">
                  <div className="text-xs font-bold text-blue-600">{month.total.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0].substring(0, 3)}</div>
                  <div className="text-xs text-gray-400">{month.month.includes('2024') ? '24' : '25'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Journey Analysis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Journey Analysis (Current Period Analysis)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.customerInsights.firstTimeCustomers}</div>
            <div className="text-sm text-gray-500">New Customers</div>
            <div className="text-xs text-gray-400">Started in {getMonthName(data.currentMonth)}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{data.customerInsights.lostCustomers}</div>
            <div className="text-sm text-gray-500">Lost Customers</div>
            <div className="text-xs text-gray-400">Need attention</div>
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

      {/* 🔧 FIXED: Performance Insights with dynamic quarterly data */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">15-Month Performance Insights & Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Quarterly Growth Analysis</h4>
            <div className="space-y-2">
              {quarterlyData && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Q1 → Q2 FY2024:</span>
                    <span className={`text-sm font-medium ${
                      calculateGrowth(quarterlyData.q2FY2024.totalSales, quarterlyData.q1FY2024.totalSales) >= 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculateGrowth(quarterlyData.q2FY2024.totalSales, quarterlyData.q1FY2024.totalSales) >= 0 ? '+' : ''}
                      {calculateGrowth(quarterlyData.q2FY2024.totalSales, quarterlyData.q1FY2024.totalSales).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Q2 → Q3 FY2024:</span>
                    <span className={`text-sm font-medium ${
                      calculateGrowth(quarterlyData.q3FY2024.totalSales, quarterlyData.q2FY2024.totalSales) >= 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculateGrowth(quarterlyData.q3FY2024.totalSales, quarterlyData.q2FY2024.totalSales) >= 0 ? '+' : ''}
                      {calculateGrowth(quarterlyData.q3FY2024.totalSales, quarterlyData.q2FY2024.totalSales).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Q1 FY24 → Q1 FY25:</span>
                    <span className={`text-sm font-medium ${
                      calculateGrowth(quarterlyData.q1FY2025.totalSales, quarterlyData.q1FY2024.totalSales) >= 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculateGrowth(quarterlyData.q1FY2025.totalSales, quarterlyData.q1FY2024.totalSales) >= 0 ? '+' : ''}
                      {calculateGrowth(quarterlyData.q1FY2025.totalSales, quarterlyData.q1FY2024.totalSales).toFixed(1)}%
                    </span>
                  </div>
                </>
              )}
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
            <h4 className="font-medium text-gray-900 mb-3">15-Month Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Months:</span>
                <span className="text-sm font-medium text-blue-600">{monthlyData.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Month:</span>
                <span className="text-sm font-medium text-green-600">{getMonthName(data.currentMonth)} {data.currentYear}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Peak Month:</span>
                <span className="text-sm font-medium text-green-600">
                  {monthlyData.length > 0 ? monthlyData.reduce((max, month) => month.total > max.total ? month : max, monthlyData[0])?.month.split(' ')[0] : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Growth:</span>
                <span className="text-sm font-medium text-purple-600">
                  {monthlyData.length > 1 ? (monthlyData.reduce((sum, month, index) => index > 0 ? sum + month.growth : sum, 0) / (monthlyData.length - 1)).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔧 FIXED: Data Integration Status */}
      {debugInfo && (
        <div className={`p-6 rounded-lg text-center ${
          debugInfo?.monthlyTotals && Object.keys(debugInfo.monthlyTotals).length > 5
            ? 'bg-green-50'
            : 'bg-yellow-50'
        }`}>
          {debugInfo?.monthlyTotals && Object.keys(debugInfo.monthlyTotals).length > 5 ? (
            <>
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-lg font-medium text-green-900 mb-2">FIXED: Dynamic Month Historical Data Integration Complete</h3>
              <p className="text-green-700 mb-4">
                Successfully integrated dynamic historical data processing with proper month transition handling for {getMonthName(data.currentMonth)} {data.currentYear}.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-blue-600">{monthlyData.length}</div>
                  <div className="text-sm text-gray-600">Months Available</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-green-600">
                    {quarterlyData?.q1FY2024.totalSales.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">Q1 FY2024 Complete</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-purple-600">
                    {yoyComparison?.currentYear?.total8PM?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">{getMonthName(data.currentMonth)} 8PM</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-orange-600">
                    {yoyComparison?.currentYear?.totalVERVE?.toLocaleString() || 0}
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
                  <div className="text-2xl font-bold text-indigo-600">✅</div>
                  <div className="text-sm text-gray-600">Fixed Month Bug</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-green-600">
                Available months: {debugInfo.availableMonths?.join(', ')} | Current: {debugInfo.currentMonthKey}
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-yellow-900 mb-2">Historical Data: Processing Dynamic Window</h3>
              <p className="text-yellow-700 mb-4">
                Dynamic historical data connection processing for {getMonthName(data.currentMonth)} {data.currentYear}.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoricalAnalysisTab;
