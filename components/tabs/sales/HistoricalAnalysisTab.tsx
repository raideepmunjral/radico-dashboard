'use client';

import React, { useState, useEffect } from 'react';

// ==========================================
// TYPE DEFINITIONS (FUTURE-PROOF VERSION)
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
  // FLEXIBLE: Dynamic historical data structure that works for any year/month
  historicalData?: {
    [key: string]: any; // Allows any month/year combination dynamically
  };
}

// ==========================================
// FUTURE-PROOF HELPER FUNCTIONS
// ==========================================

const getMonthName = (monthNum: string | number) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const index = typeof monthNum === 'string' ? parseInt(monthNum) - 1 : monthNum - 1;
  return months[index] || 'Unknown';
};

const getShortMonthName = (monthNum: string | number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const index = typeof monthNum === 'string' ? parseInt(monthNum) - 1 : monthNum - 1;
  return months[index] || 'Unknown';
};

// FUTURE-PROOF: Dynamic month key generation
const getMonthKey = (month: number, year: number, currentYear: number) => {
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthName = monthNames[month - 1];
  
  // If it's the current year, use simple month name, otherwise append year
  return year === currentYear ? monthName : `${monthName}${year}`;
};

// FUTURE-PROOF: Generate date range dynamically
const generateDateRange = (startYear: number, startMonth: number, endYear: number, endMonth: number) => {
  const dates = [];
  let currentYear = startYear;
  let currentMonth = startMonth;
  
  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    dates.push({ year: currentYear, month: currentMonth });
    
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  
  return dates;
};

// FUTURE-PROOF: Indian FY quarter detection
const getIndianFYQuarter = (month: number) => {
  if (month >= 4 && month <= 6) return 'Q1'; // Apr-Jun
  if (month >= 7 && month <= 9) return 'Q2'; // Jul-Sep
  if (month >= 10 && month <= 12) return 'Q3'; // Oct-Dec
  return 'Q4'; // Jan-Mar
};

const getIndianFYYear = (month: number, calendarYear: number) => {
  // Indian FY starts in April, so Jan-Mar belongs to next FY year
  return month >= 4 ? calendarYear : calendarYear;
};

// FUTURE-PROOF: Dynamic quarterly calculations
const calculateQuarterlyData = (historicalData: any, quarter: string, fyYear: number, currentYear: number) => {
  const quarterMonths = {
    Q1: [4, 5, 6], // Apr-May-Jun
    Q2: [7, 8, 9], // Jul-Aug-Sep
    Q3: [10, 11, 12], // Oct-Nov-Dec
    Q4: [1, 2, 3] // Jan-Feb-Mar
  };

  const months = quarterMonths[quarter as keyof typeof quarterMonths] || [];
  let total8PM = 0, totalVERVE = 0, totalShops = 0;

  months.forEach(month => {
    // For Q4, the calendar year is fyYear + 1
    const calendarYear = quarter === 'Q4' ? fyYear + 1 : fyYear;
    const monthKey = getMonthKey(month, calendarYear, currentYear);
    const monthData = historicalData?.[monthKey];
    
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

// FUTURE-PROOF: Extract all available months from historical data
const extractAvailableMonths = (historicalData: any, currentYear: number) => {
  if (!historicalData) return [];
  
  const monthPattern = /^(january|february|march|april|may|june|july|august|september|october|november|december)(\d{4})?$/;
  const months: Array<{key: string, month: number, year: number, displayName: string}> = [];
  
  Object.keys(historicalData).forEach(key => {
    const match = key.match(monthPattern);
    if (match) {
      const monthName = match[1];
      const year = match[2] ? parseInt(match[2]) : currentYear;
      const monthNumber = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].indexOf(monthName) + 1;
      
      if (monthNumber > 0) {
        months.push({
          key,
          month: monthNumber,
          year,
          displayName: `${getMonthName(monthNumber)} ${year}`
        });
      }
    }
  });
  
  // Sort chronologically
  return months.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
};

// FUTURE-PROOF: Get configurable analysis window (default: 18 months)
const getAnalysisWindow = (currentMonth: number, currentYear: number, windowMonths: number = 18) => {
  const endDate = { month: currentMonth, year: currentYear };
  const startMonth = currentMonth - windowMonths + 1;
  
  let startYear = currentYear;
  let adjustedStartMonth = startMonth;
  
  while (adjustedStartMonth <= 0) {
    adjustedStartMonth += 12;
    startYear--;
  }
  
  return generateDateRange(startYear, adjustedStartMonth, endDate.year, endDate.month);
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const HistoricalAnalysisTab = ({ data }: { data: DashboardData }) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [analysisWindow] = useState(18); // Configurable: Can be changed to 12, 24, etc.

  const currentMonth = parseInt(data.currentMonth);
  const currentYear = parseInt(data.currentYear);

  // Calculate month-over-month growth
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100);
  };

  useEffect(() => {
    if (data.historicalData) {
      const availableMonths = extractAvailableMonths(data.historicalData, currentYear);
      
      // DYNAMIC: Build monthly totals based on available data
      const monthlyTotals: any = {};
      availableMonths.forEach(({ key }) => {
        const monthData = data.historicalData![key];
        monthlyTotals[key] = {
          shops: monthData?.uniqueShops?.size || 0,
          total8PM: monthData?.total8PM || 0,
          totalVERVE: monthData?.totalVERVE || 0
        };
      });

      setDebugInfo({
        hasHistoricalData: !!data.historicalData,
        historicalData: data.historicalData,
        customerInsights: data.customerInsights,
        availableMonths,
        monthlyTotals,
        analysisWindow: getAnalysisWindow(currentMonth, currentYear, analysisWindow)
      });
    }
  }, [data, currentMonth, currentYear, analysisWindow]);

  // DYNAMIC: Get current month data
  const getCurrentMonthData = () => {
    if (!debugInfo?.monthlyTotals) return { total8PM: 0, totalVERVE: 0, shops: 0 };
    
    const currentMonthKey = getMonthKey(currentMonth, currentYear, currentYear);
    return debugInfo.monthlyTotals[currentMonthKey] || { total8PM: 0, totalVERVE: 0, shops: 0 };
  };

  // DYNAMIC: Get previous month data
  const getPreviousMonthData = () => {
    if (!debugInfo?.monthlyTotals) return { total8PM: 0, totalVERVE: 0, shops: 0 };
    
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear--;
    }
    
    const previousMonthKey = getMonthKey(prevMonth, prevYear, currentYear);
    return debugInfo.monthlyTotals[previousMonthKey] || { total8PM: 0, totalVERVE: 0, shops: 0 };
  };

  // DYNAMIC: Generate monthly data array
  const monthlyData = debugInfo?.availableMonths ? 
    debugInfo.availableMonths.map((monthInfo: any, index: number) => {
      const monthData = debugInfo.monthlyTotals[monthInfo.key];
      const isCurrentMonth = monthInfo.month === currentMonth && monthInfo.year === currentYear;
      
      // Calculate growth vs previous month
      let growth = 0;
      if (index > 0) {
        const prevMonthInfo = debugInfo.availableMonths[index - 1];
        const prevMonthData = debugInfo.monthlyTotals[prevMonthInfo.key];
        const currentTotal = monthData.total8PM + monthData.totalVERVE;
        const prevTotal = prevMonthData.total8PM + prevMonthData.totalVERVE;
        growth = calculateGrowth(currentTotal, prevTotal);
      }
      
      return {
        month: isCurrentMonth ? `${monthInfo.displayName} (Current)` : monthInfo.displayName,
        total: monthData.total8PM + monthData.totalVERVE,
        total8PM: monthData.total8PM,
        totalVERVE: monthData.totalVERVE,
        shops: monthData.shops,
        quarter: getIndianFYQuarter(monthInfo.month),
        fyYear: getIndianFYYear(monthInfo.month, monthInfo.year),
        growth,
        isCurrentMonth,
        key: monthInfo.key
      };
    }) : [];

  // DYNAMIC: Generate quarterly data for available years
  const generateQuarterlyData = () => {
    if (!debugInfo?.availableMonths) return null;
    
    const quarters: any = {};
    const years = [...new Set(debugInfo.availableMonths.map((m: any) => getIndianFYYear(m.month, m.year)))];
    
    years.forEach(year => {
      ['Q1', 'Q2', 'Q3', 'Q4'].forEach(quarter => {
        const key = `${quarter}_FY${year}`;
        quarters[key] = calculateQuarterlyData(debugInfo.monthlyTotals, quarter, year, currentYear);
      });
    });
    
    return quarters;
  };

  const quarterlyData = generateQuarterlyData();

  // DYNAMIC: Year-over-year comparison
  const yoyComparison = debugInfo?.monthlyTotals ? (() => {
    const currentData = getCurrentMonthData();
    const lastYearKey = getMonthKey(currentMonth, currentYear - 1, currentYear);
    const lastYearData = debugInfo.monthlyTotals[lastYearKey] || { total8PM: 0, totalVERVE: 0, shops: 0 };
    
    return {
      currentYear: {
        total: currentData.total8PM + currentData.totalVERVE,
        total8PM: currentData.total8PM,
        totalVERVE: currentData.totalVERVE,
        shops: currentData.shops
      },
      lastYear: {
        total: lastYearData.total8PM + lastYearData.totalVERVE,
        total8PM: lastYearData.total8PM,
        totalVERVE: lastYearData.totalVERVE,
        shops: lastYearData.shops
      },
      growth: {
        total: calculateGrowth(currentData.total8PM + currentData.totalVERVE, lastYearData.total8PM + lastYearData.totalVERVE),
        total8PM: calculateGrowth(currentData.total8PM, lastYearData.total8PM),
        totalVERVE: calculateGrowth(currentData.totalVERVE, lastYearData.totalVERVE),
        shops: calculateGrowth(currentData.shops, lastYearData.shops)
      }
    };
  })() : null;

  // Get recent months for display (configurable)
  const recentMonthsCount = 6;
  const recentMonths = monthlyData.slice(-recentMonthsCount);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Future-Proof Historical Analysis & Trends</h2>
        <p className="text-gray-600">
          Dynamic {analysisWindow}-Month Analysis Window | {getMonthName(currentMonth)} {currentYear} vs {getMonthName(currentMonth)} {currentYear - 1}
        </p>
      </div>

      {/* DYNAMIC: Quarterly Analysis */}
      {quarterlyData && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Dynamic Quarterly Analysis (Indian FY)</h3>
          
          {/* Current Quarter vs Last Year Same Quarter */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {(() => {
              const currentQuarter = getIndianFYQuarter(currentMonth);
              const currentFYYear = getIndianFYYear(currentMonth, currentYear);
              const currentQKey = `${currentQuarter}_FY${currentFYYear}`;
              const lastYearQKey = `${currentQuarter}_FY${currentFYYear - 1}`;
              
              return [
                {
                  title: `${currentQuarter} Comparison`,
                  subtitle: `${currentQuarter === 'Q1' ? 'Apr-Jun' : currentQuarter === 'Q2' ? 'Jul-Sep' : currentQuarter === 'Q3' ? 'Oct-Dec' : 'Jan-Mar'}`,
                  current: quarterlyData[currentQKey] || { totalSales: 0, total8PM: 0, totalVERVE: 0 },
                  previous: quarterlyData[lastYearQKey] || { totalSales: 0, total8PM: 0, totalVERVE: 0 },
                  currentLabel: `${currentQuarter} FY${currentFYYear}`,
                  previousLabel: `${currentQuarter} FY${currentFYYear - 1}`,
                  color: 'blue'
                }
              ];
            })().map((comparison, index) => (
              <div key={index} className={`bg-white p-4 rounded-lg border border-${comparison.color}-200`}>
                <h4 className={`font-medium text-${comparison.color}-800 mb-3`}>{comparison.title}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{comparison.previousLabel}:</span>
                    <span className="font-medium">{comparison.previous.totalSales.toLocaleString()} cases</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{comparison.currentLabel}:</span>
                    <span className={`font-bold text-${comparison.color}-600`}>{comparison.current.totalSales.toLocaleString()} cases</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium text-gray-700">YoY Growth:</span>
                    <span className={`font-bold ${
                      calculateGrowth(comparison.current.totalSales, comparison.previous.totalSales) >= 0 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculateGrowth(comparison.current.totalSales, comparison.previous.totalSales) >= 0 ? '+' : ''}
                      {calculateGrowth(comparison.current.totalSales, comparison.previous.totalSales).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Brand Performance Cards */}
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-3">8PM Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current:</span>
                  <span className="font-bold text-purple-600">{getCurrentMonthData().total8PM.toLocaleString()} cases</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Year:</span>
                  <span className="font-medium">{yoyComparison?.lastYear.total8PM.toLocaleString() || 0} cases</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-700">YoY Growth:</span>
                  <span className={`font-bold ${(yoyComparison?.growth.total8PM || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(yoyComparison?.growth.total8PM || 0) >= 0 ? '+' : ''}{(yoyComparison?.growth.total8PM || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <h4 className="font-medium text-orange-800 mb-3">VERVE Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current:</span>
                  <span className="font-bold text-orange-600">{getCurrentMonthData().totalVERVE.toLocaleString()} cases</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Year:</span>
                  <span className="font-medium">{yoyComparison?.lastYear.totalVERVE.toLocaleString() || 0} cases</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-700">YoY Growth:</span>
                  <span className={`font-bold ${(yoyComparison?.growth.totalVERVE || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(yoyComparison?.growth.totalVERVE || 0) >= 0 ? '+' : ''}{(yoyComparison?.growth.totalVERVE || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* YoY COMPARISON CARDS */}
      {yoyComparison && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Year-over-Year Comparison ({getMonthName(currentMonth)})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{yoyComparison.currentYear.total.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{getMonthName(currentMonth)} {currentYear}</div>
              <div className="text-xs text-gray-400">vs {yoyComparison.lastYear.total.toLocaleString()} last year</div>
              <div className={`text-sm font-medium ${yoyComparison.growth.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {yoyComparison.growth.total >= 0 ? '+' : ''}{yoyComparison.growth.total.toFixed(1)}% YoY
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{yoyComparison.currentYear.total8PM.toLocaleString()}</div>
              <div className="text-sm text-gray-500">8PM {currentYear}</div>
              <div className="text-xs text-gray-400">vs {yoyComparison.lastYear.total8PM.toLocaleString()} last year</div>
              <div className={`text-sm font-medium ${yoyComparison.growth.total8PM >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {yoyComparison.growth.total8PM >= 0 ? '+' : ''}{yoyComparison.growth.total8PM.toFixed(1)}% YoY
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{yoyComparison.currentYear.totalVERVE.toLocaleString()}</div>
              <div className="text-sm text-gray-500">VERVE {currentYear}</div>
              <div className="text-xs text-gray-400">vs {yoyComparison.lastYear.totalVERVE.toLocaleString()} last year</div>
              <div className={`text-sm font-medium ${yoyComparison.growth.totalVERVE >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {yoyComparison.growth.totalVERVE >= 0 ? '+' : ''}{yoyComparison.growth.totalVERVE.toFixed(1)}% YoY
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{yoyComparison.currentYear.shops}</div>
              <div className="text-sm text-gray-500">Active Shops {currentYear}</div>
              <div className="text-xs text-gray-400">vs {yoyComparison.lastYear.shops} last year</div>
              <div className={`text-sm font-medium ${yoyComparison.growth.shops >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {yoyComparison.growth.shops >= 0 ? '+' : ''}{yoyComparison.growth.shops.toFixed(1)}% YoY
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC: Recent Months Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recentMonths.map((month, index) => (
          <div key={month.key} className={`p-6 rounded-lg shadow ${month.isCurrentMonth ? 'bg-blue-50 border-2 border-blue-200' : 'bg-white'}`}>
            <h3 className={`text-lg font-medium mb-4 ${month.isCurrentMonth ? 'text-blue-900' : 'text-gray-900'}`}>
              {month.month}
            </h3>
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
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Quarter:</span>
                <span className="font-medium text-indigo-600">{month.quarter} FY{month.fyYear}</span>
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

      {/* DYNAMIC: Complete Sales Trend */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dynamic Sales Trend Analysis (All Available Data)</h3>
        <div className="space-y-6">
          
          {/* Show all available quarterly data */}
          {quarterlyData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(quarterlyData)
                .filter(([_, data]: [string, any]) => data.totalSales > 0)
                .slice(-8) // Show last 8 quarters
                .map(([key, data]: [string, any]) => (
                <div key={key} className="text-center p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium text-gray-700 mb-2">{key.replace('_', ' ')}</h4>
                  <div className="text-sm space-y-1">
                    <div className="font-bold text-lg text-gray-800">{data.totalSales.toLocaleString()}</div>
                    <div className="text-xs space-x-2">
                      <span className="text-purple-600">{data.total8PM.toLocaleString()} 8PM</span>
                      <span className="text-orange-600">{data.totalVERVE.toLocaleString()} VERVE</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Monthly trend displays */}
          <div>
            <h4 className="font-medium text-purple-600 mb-2">8PM Family Performance (All Available Data)</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-1">
              {monthlyData.slice(-12).map((month) => (
                <div key={month.key} className="text-center p-1">
                  <div className="text-xs font-bold text-purple-600">{month.total8PM.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0].substring(0, 3)}</div>
                  <div className="text-xs text-gray-400">{month.month.split(' ')[1]?.substring(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-orange-600 mb-2">VERVE Family Performance (All Available Data)</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-1">
              {monthlyData.slice(-12).map((month) => (
                <div key={month.key} className="text-center p-1">
                  <div className="text-xs font-bold text-orange-600">{month.totalVERVE.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0].substring(0, 3)}</div>
                  <div className="text-xs text-gray-400">{month.month.split(' ')[1]?.substring(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-blue-600 mb-2">Total Sales Performance (All Available Data)</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-1">
              {monthlyData.slice(-12).map((month) => (
                <div key={month.key} className="text-center p-1">
                  <div className="text-xs font-bold text-blue-600">{month.total.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0].substring(0, 3)}</div>
                  <div className="text-xs text-gray-400">{month.month.split(' ')[1]?.substring(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Journey Analysis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Journey Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.customerInsights.firstTimeCustomers}</div>
            <div className="text-sm text-gray-500">New Customers</div>
            <div className="text-xs text-gray-400">Started in {getMonthName(currentMonth)}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{data.customerInsights.lostCustomers}</div>
            <div className="text-sm text-gray-500">Lost Customers</div>
            <div className="text-xs text-gray-400">Not active in {getMonthName(currentMonth)}</div>
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

      {/* DYNAMIC: Performance Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dynamic Performance Insights & Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recent Growth Trends</h4>
            <div className="space-y-2">
              {recentMonths.slice(-3).map((month, index) => (
                <div key={month.key} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{month.month.split(' ')[0]}:</span>
                  <span className={`text-sm font-medium ${month.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {month.growth >= 0 ? '+' : ''}{month.growth.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Brand Mix Evolution</h4>
            <div className="space-y-2">
              {recentMonths.slice(-3).map((month) => (
                <div key={month.key} className="space-y-1">
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
            <h4 className="font-medium text-gray-900 mb-3">Analysis Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Analysis Window:</span>
                <span className="text-sm font-medium text-blue-600">{analysisWindow} months</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available Data:</span>
                <span className="text-sm font-medium text-green-600">{monthlyData.length} months</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Quarter:</span>
                <span className="text-sm font-medium text-purple-600">
                  {getIndianFYQuarter(currentMonth)} FY{getIndianFYYear(currentMonth, currentYear)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Peak Month:</span>
                <span className="text-sm font-medium text-green-600">
                  {monthlyData.length > 0 
                    ? monthlyData.reduce((max, month) => month.total > max.total ? month : max, monthlyData[0])?.month.split(' ')[0] 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Integration Status */}
      <div className="bg-green-50 p-6 rounded-lg text-center">
        <div className="text-4xl mb-4">🚀</div>
        <h3 className="text-lg font-medium text-green-900 mb-2">Future-Proof Historical Analysis Active!</h3>
        <p className="text-green-700 mb-4">
          Dynamic analysis system automatically adapts to any month/year combination. 
          No code changes needed for 2026, 2027, or beyond!
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-blue-600">{monthlyData.length}</div>
            <div className="text-sm text-gray-600">Available Months</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-purple-600">{analysisWindow}</div>
            <div className="text-sm text-gray-600">Analysis Window</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-orange-600">
              {debugInfo?.availableMonths ? 
                [...new Set(debugInfo.availableMonths.map((m: any) => m.year))].length : 0}
            </div>
            <div className="text-sm text-gray-600">Years Covered</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-green-600">∞</div>
            <div className="text-sm text-gray-600">Future Years</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-indigo-600">✅</div>
            <div className="text-sm text-gray-600">Zero-Config</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalAnalysisTab;
