'use client';

import React, { useState, useMemo } from 'react';
import { Download, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  
  // EXISTING: Rolling 4 months (UNCHANGED)
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
  
  // NEW: Extended Historical Data (12+ months)
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
  
  // EXISTING: YoY comparison (UNCHANGED)
  juneLastYearTotal?: number;
  juneLastYearEightPM?: number;
  juneLastYearVerve?: number;
  yoyGrowthPercent?: number;
  growthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
  skuBreakdown?: SKUData[];
  detailedSKUBreakdown?: DetailedSKUData[];
  historicalData?: MonthlyData[];
  
  // EXISTING: 3-month averages (UNCHANGED)
  threeMonthAvgTotal?: number;
  threeMonthAvg8PM?: number;
  threeMonthAvgVERVE?: number;
}

interface SKUData {
  brand: string;
  cases: number;
  percentage: number;
  month?: string;
}

interface DetailedSKUData {
  originalBrand: string;
  displayName: string;
  family: string;
  variant: string;
  size: string;
  cases: number;
  percentage: number;
  month?: string;
}

interface MonthlyData {
  month: string;
  total: number;
  eightPM: number;
  verve: number;
  skuBreakdown: SKUData[];
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
  allShopsComparison: ShopData[];
  currentMonth: string;
  currentYear: string;
}

interface TopShopsFilterState {
  department: string;
  salesman: string;
  searchText: string;
  minCases: string;
  performanceTrend: string;
}

// ==========================================
// 🚀 FUTURE-READY 5-MONTH ROLLING WINDOW HELPER FUNCTIONS
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
const get5MonthRollingWindow = (currentMonth: string, currentYear: string) => {
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
      key: getMonthKey(targetMonth.toString()), // For data access
      color: getMonthColor(months.length) // For UI coloring
    });
  }
  
  return months;
};

// 🚀 NEW: MONTH COLOR CODING FOR UI
const getMonthColor = (index: number) => {
  const colors = [
    'blue', 'green', 'yellow', 'pink', 'red'
  ];
  return colors[index] || 'gray';
};

// 🚀 NEW: 5-MONTH ROLLING WINDOW LABEL
const get5MonthRollingLabel = (currentMonth: string, currentYear: string) => {
  const window = get5MonthRollingWindow(currentMonth, currentYear);
  return window.map(m => m.shortName).join('-') + ` ${currentYear}`;
};

// 🚀 NEW: GET SHOP DATA FOR ANY MONTH IN 5-MONTH WINDOW
const getShopDataForMonth = (shop: any, monthKey: string, dataType: 'total' | 'eightPM' | 'verve' = 'total') => {
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
  
  const value = shop[key];
  return typeof value === 'number' ? value : 0;
};

// 🚀 NEW: CALCULATE 5-MONTH AVERAGE (Replaces 3-month for ranking)
const calculate5MonthAverage = (shop: any, rollingWindow: any[]) => {
  const totals = rollingWindow.map(month => getShopDataForMonth(shop, month.key, 'total'));
  const eightPMs = rollingWindow.map(month => getShopDataForMonth(shop, month.key, 'eightPM'));
  const verves = rollingWindow.map(month => getShopDataForMonth(shop, month.key, 'verve'));
  
  const validMonths = rollingWindow.length;
  
  return {
    avgTotal: totals.reduce((sum, val) => sum + val, 0) / validMonths,
    avg8PM: eightPMs.reduce((sum, val) => sum + val, 0) / validMonths,
    avgVerve: verves.reduce((sum, val) => sum + val, 0) / validMonths
  };
};

// 🚀 NEW: GET MONTH COLOR CLASSES FOR UI
const getMonthColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' }
  };
  return colorMap[color] || colorMap.blue;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const TopShopsTab = ({ data }: { data: DashboardData }) => {
  // ==========================================
  // 🚀 NEW: 5-MONTH ROLLING WINDOW CALCULATION
  // ==========================================
  
  const rollingWindow = useMemo(() => {
    return get5MonthRollingWindow(data.currentMonth, data.currentYear);
  }, [data.currentMonth, data.currentYear]);

  const rollingWindowLabel = useMemo(() => {
    return get5MonthRollingLabel(data.currentMonth, data.currentYear);
  }, [data.currentMonth, data.currentYear]);

  // ==========================================
  // INTERNAL STATE MANAGEMENT
  // ==========================================
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [filters, setFilters] = useState<TopShopsFilterState>({
    department: '',
    salesman: '',
    searchText: '',
    minCases: '',
    performanceTrend: ''
  });

  // ==========================================
  // 🚀 NEW: ENHANCED SHOP DATA WITH 5-MONTH AVERAGES
  // ==========================================

  const shopsWithEnhancedMetrics = useMemo(() => {
    return data.allShopsComparison.map(shop => {
      const fiveMonthAvg = calculate5MonthAverage(shop, rollingWindow);
      return {
        ...shop,
        fiveMonthAvgTotal: fiveMonthAvg.avgTotal,
        fiveMonthAvg8PM: fiveMonthAvg.avg8PM,
        fiveMonthAvgVerve: fiveMonthAvg.avgVerve
      };
    }).sort((a, b) => (b.fiveMonthAvgTotal || 0) - (a.fiveMonthAvgTotal || 0)); // Sort by 5-month average
  }, [data.allShopsComparison, rollingWindow]);

  // ==========================================
  // INTERNAL UTILITY FUNCTIONS
  // ==========================================

  const getFilteredTopShops = useMemo(() => {
    return (shops: any[]): any[] => {
      return shops.filter(shop => {
        const matchesDepartment = !filters.department || shop.department === filters.department;
        const matchesSalesman = !filters.salesman || shop.salesman === filters.salesman;
        const matchesSearch = !filters.searchText || 
          shop.shopName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
          shop.department.toLowerCase().includes(filters.searchText.toLowerCase()) ||
          shop.salesman.toLowerCase().includes(filters.searchText.toLowerCase());
        const matchesMinCases = !filters.minCases || (shop.fiveMonthAvgTotal >= parseFloat(filters.minCases));
        const matchesTrend = !filters.performanceTrend || shop.monthlyTrend === filters.performanceTrend;
        
        return matchesDepartment && matchesSalesman && matchesSearch && matchesMinCases && matchesTrend;
      });
    };
  }, [filters]);

  const filteredShops = getFilteredTopShops(shopsWithEnhancedMetrics);
  const totalPages = Math.ceil(filteredShops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentShops = filteredShops.slice(startIndex, endIndex);

  const departments = [...new Set(data.allShopsComparison.map(shop => shop.department))].sort();
  const salesmen = [...new Set(data.allShopsComparison.map(shop => shop.salesman))].sort();

  // ==========================================
  // 🔧 UPDATED: EXPORT FUNCTION WITH DYNAMIC 5-MONTH LABELS
  // ==========================================

  const exportTopShopsToCSV = async () => {
    if (!data) return;

    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `Radico Top Shops Detailed Analysis Report - ${new Date().toLocaleDateString()}\n`;
      // 🔧 FIXED: Dynamic 5-month rolling window label
      csvContent += `Report Period: ${rollingWindowLabel}\n`;
      csvContent += `Sorted by: 5-Month Average Performance (${rollingWindow.map(m => m.shortName).join('-')})\n`;
      
      if (filters.department || filters.salesman || filters.searchText || filters.minCases || filters.performanceTrend) {
        csvContent += "APPLIED FILTERS: ";
        if (filters.department) csvContent += `Department: ${filters.department}, `;
        if (filters.salesman) csvContent += `Salesman: ${filters.salesman}, `;
        if (filters.searchText) csvContent += `Search: ${filters.searchText}, `;
        if (filters.minCases) csvContent += `Min Cases: ${filters.minCases}, `;
        if (filters.performanceTrend) csvContent += `Trend: ${filters.performanceTrend}`;
        csvContent += "\n";
      }
      csvContent += "\n";
      
      csvContent += "EXECUTIVE SUMMARY\n";
      csvContent += "Total Shops," + data.summary.totalShops + "\n";
      csvContent += "Filtered Shops," + filteredShops.length + "\n";
      csvContent += "Top 5-Month Avg," + (filteredShops[0]?.fiveMonthAvgTotal?.toFixed(1) || 0) + " cases\n\n";
      
      // 🔧 FIXED: Dynamic CSV headers for 5-month window
      csvContent += `DETAILED SHOP ANALYSIS (${rollingWindowLabel})\n`;
      let csvHeaders = `Rank,Shop Name,Department,Salesman`;
      
      // Add dynamic month columns
      rollingWindow.forEach(month => {
        csvHeaders += `,${month.shortName} Total,${month.shortName} 8PM,${month.shortName} VERVE`;
      });
      
      csvHeaders += `,5M Avg Total,5M Avg 8PM,5M Avg VERVE,Growth %,YoY Growth %,Monthly Trend\n`;
      csvContent += csvHeaders;
      
      filteredShops.forEach((shop, index) => {
        let csvRow = `${index + 1},"${shop.shopName}","${shop.department}","${shop.salesman}"`;
        
        // Add dynamic month data
        rollingWindow.forEach(month => {
          const total = getShopDataForMonth(shop, month.key, 'total');
          const eightPM = getShopDataForMonth(shop, month.key, 'eightPM');
          const verve = getShopDataForMonth(shop, month.key, 'verve');
          csvRow += `,${total},${eightPM},${verve}`;
        });
        
        csvRow += `,${shop.fiveMonthAvgTotal?.toFixed(1) || 0},${shop.fiveMonthAvg8PM?.toFixed(1) || 0},${shop.fiveMonthAvgVerve?.toFixed(1) || 0},${shop.growthPercent?.toFixed(1) || 0}%,${shop.yoyGrowthPercent?.toFixed(1) || 0}%,"${shop.monthlyTrend || 'stable'}"\n`;
        csvContent += csvRow;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Radico_Top_Shops_5Month_Analysis_${getShortMonthName(data.currentMonth)}_${data.currentYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting Top Shops CSV:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  // ==========================================
  // 🔧 UPDATED: MOBILE CARD COMPONENT WITH 5-MONTH DATA
  // ==========================================

  const MobileShopCard = ({ shop, index }: { shop: any, index: number }) => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <span className="text-lg font-bold text-gray-900 mr-2">#{startIndex + index + 1}</span>
              {startIndex + index < 3 && (
                <span>
                  {startIndex + index === 0 && '🥇'}
                  {startIndex + index === 1 && '🥈'}
                  {startIndex + index === 2 && '🥉'}
                </span>
              )}
            </div>
            <h3 className="font-medium text-gray-900 text-sm">{shop.shopName}</h3>
            <p className="text-xs text-gray-500">{shop.department} • {shop.salesman}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">{shop.fiveMonthAvgTotal?.toFixed(1) || '0.0'}</div>
            <div className="text-xs text-gray-500">5M Avg</div>
          </div>
        </div>
        
        {/* Current Month Performance */}
        <div className="grid grid-cols-3 gap-3 mb-3 p-3 bg-red-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-bold text-gray-900">
              {getShopDataForMonth(shop, rollingWindow[4]?.key || 'current', 'total').toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">{rollingWindow[4]?.shortName || getShortMonthName(data.currentMonth)} Total</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-purple-600">
              {getShopDataForMonth(shop, rollingWindow[4]?.key || 'current', 'eightPM').toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">8PM</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-orange-600">
              {getShopDataForMonth(shop, rollingWindow[4]?.key || 'current', 'verve').toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">VERVE</div>
          </div>
        </div>

        {/* 5-Month Historical Performance - DYNAMIC */}
        <div className="grid grid-cols-5 gap-1 mb-3">
          {rollingWindow.map((month, idx) => {
            const colorClasses = getMonthColorClasses(month.color);
            return (
              <div key={month.month} className={`text-center p-2 ${colorClasses.bg} rounded`}>
                <div className="text-sm font-medium text-gray-900">
                  {getShopDataForMonth(shop, month.key, 'total').toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">{month.shortName}</div>
              </div>
            );
          })}
        </div>

        {/* Growth Metrics */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              (shop.growthPercent || 0) > 0 ? 'bg-green-100 text-green-800' : 
              (shop.growthPercent || 0) < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {shop.growthPercent?.toFixed(1) || 0}%
            </span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              (shop.yoyGrowthPercent || 0) > 0 ? 'bg-blue-100 text-blue-800' : 
              (shop.yoyGrowthPercent || 0) < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}>
              YoY: {shop.yoyGrowthPercent?.toFixed(1) || 0}%
            </span>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            shop.monthlyTrend === 'improving' ? 'bg-green-100 text-green-800' :
            shop.monthlyTrend === 'declining' ? 'bg-red-100 text-red-800' :
            shop.monthlyTrend === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {shop.monthlyTrend === 'improving' ? '📈' : shop.monthlyTrend === 'declining' ? '📉' : 
             shop.monthlyTrend === 'new' ? '✨' : '➡️'}
          </span>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Summary Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Total Shops</h3>
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{filteredShops.length}</div>
          <div className="text-xs sm:text-sm text-gray-500">
            {filters.department || filters.salesman || filters.searchText || filters.minCases || filters.performanceTrend ? 
              `Filtered from ${data.allShopsComparison.length}` : 
              'All shops'}
          </div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Top 5M Avg</h3>
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {filteredShops[0]?.fiveMonthAvgTotal?.toFixed(1) || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">Cases ({rollingWindow.map(m => m.shortName).join('-')})</div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Avg 8PM</h3>
          <div className="text-xl sm:text-2xl font-bold text-purple-600">
            {(filteredShops.reduce((sum, shop) => sum + (shop.fiveMonthAvg8PM || 0), 0) / Math.max(filteredShops.length, 1)).toFixed(1)}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">5M Avg Cases</div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Avg VERVE</h3>
          <div className="text-xl sm:text-2xl font-bold text-orange-600">
            {(filteredShops.reduce((sum, shop) => sum + (shop.fiveMonthAvgVerve || 0), 0) / Math.max(filteredShops.length, 1)).toFixed(1)}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">5M Avg Cases</div>
        </div>
      </div>

      {/* Enhanced Filters - Mobile Responsive */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="space-y-4">
          {/* Search Row */}
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search shops, departments, salesmen..."
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
            />
          </div>
          
          {/* Filters Row - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={filters.salesman}
              onChange={(e) => setFilters({ ...filters, salesman: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Salesmen</option>
              {salesmen.map(salesman => (
                <option key={salesman} value={salesman}>{salesman}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Min 5M Avg Cases"
              value={filters.minCases}
              onChange={(e) => setFilters({ ...filters, minCases: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />

            <select
              value={filters.performanceTrend}
              onChange={(e) => setFilters({ ...filters, performanceTrend: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Trends</option>
              <option value="improving">📈 Improving</option>
              <option value="stable">➡️ Stable</option>
              <option value="declining">📉 Declining</option>
              <option value="new">✨ New</option>
            </select>

            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({ department: '', salesman: '', searchText: '', minCases: '', performanceTrend: '' })}
                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-1 text-sm"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>

              <button
                onClick={exportTopShopsToCSV}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-1 text-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-500 text-center sm:text-left">
            Showing {filteredShops.length} shops
            {filteredShops.length !== data.allShopsComparison.length && (
              <span> (filtered from {data.allShopsComparison.length} total)</span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="block lg:hidden">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Top Shops - Mobile View
            </h3>
            <p className="text-sm text-gray-500">
              Ranked by 5-month average ({rollingWindowLabel})
            </p>
          </div>
          
          <div className="p-4">
            {currentShops.map((shop, index) => (
              <MobileShopCard key={shop.shopId} shop={shop} index={index} />
            ))}
          </div>

          {/* Mobile Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 flex flex-col items-center">
            <div className="text-sm text-gray-700 mb-3 text-center">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredShops.length)} of {filteredShops.length} shops
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700 flex items-center">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 NEW: Desktop View - Enhanced Table with Dynamic 5-Month Columns */}
      <div className="hidden lg:block bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Detailed Shop Performance Analysis - Ranked by 5-Month Average ({rollingWindowLabel})
          </h3>
          <p className="text-sm text-gray-500">
            Complete brand breakdown for each month with 5-month averages and growth trends. 
            Sorted by highest 5-month average performance ({rollingWindow.map(m => m.shortName).join('-')}).
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Sticky columns */}
                <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  Rank
                </th>
                <th className="sticky left-12 z-10 bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r min-w-48">
                  Shop Name
                </th>
                <th className="sticky left-60 z-10 bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  Department
                </th>
                
                {/* 🚀 NEW: Dynamic Month Columns */}
                {rollingWindow.map((month, index) => {
                  const colorClasses = getMonthColorClasses(month.color);
                  return (
                    <React.Fragment key={month.month}>
                      <th className={`px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider ${colorClasses.bg} border-l border-r`}>
                        {month.shortName} Total
                      </th>
                      <th className={`px-3 py-3 text-center text-xs font-medium text-purple-500 uppercase tracking-wider ${colorClasses.bg}`}>
                        {month.shortName} 8PM
                      </th>
                      <th className={`px-3 py-3 text-center text-xs font-medium text-orange-500 uppercase tracking-wider ${colorClasses.bg} border-r`}>
                        {month.shortName} VERVE
                      </th>
                    </React.Fragment>
                  );
                })}
                
                {/* 5-Month Averages */}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50 border-l border-r">
                  5M Avg Total
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-purple-500 uppercase tracking-wider bg-purple-50">
                  5M Avg 8PM
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-orange-500 uppercase tracking-wider bg-purple-50 border-r">
                  5M Avg VERVE
                </th>
                
                {/* Growth metrics */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth %
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  YoY %
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentShops.map((shop, index) => {
                return (
                  <tr key={shop.shopId} className={`hover:bg-gray-50 ${index < 3 ? 'bg-yellow-50' : ''}`}>
                    {/* Sticky columns */}
                    <td className="sticky left-0 z-10 bg-white px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                      <div className="flex items-center">
                        {startIndex + index + 1}
                        {startIndex + index < 3 && (
                          <span className="ml-2">
                            {startIndex + index === 0 && '🥇'}
                            {startIndex + index === 1 && '🥈'}
                            {startIndex + index === 2 && '🥉'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="sticky left-12 z-10 bg-white px-3 py-4 text-sm text-gray-900 border-r min-w-48">
                      <div className="max-w-xs truncate font-medium">{shop.shopName}</div>
                      <div className="text-xs text-gray-500 truncate">{shop.salesman}</div>
                    </td>
                    <td className="sticky left-60 z-10 bg-white px-3 py-4 whitespace-nowrap text-sm text-gray-900 border-r">
                      {shop.department}
                    </td>
                    
                    {/* 🚀 NEW: Dynamic Month Data Columns */}
                    {rollingWindow.map((month, monthIndex) => {
                      const colorClasses = getMonthColorClasses(month.color);
                      const total = getShopDataForMonth(shop, month.key, 'total');
                      const eightPM = getShopDataForMonth(shop, month.key, 'eightPM');
                      const verve = getShopDataForMonth(shop, month.key, 'verve');
                      
                      return (
                        <React.Fragment key={month.month}>
                          <td className={`px-3 py-4 whitespace-nowrap text-sm text-center font-medium ${colorClasses.bg} border-l border-r`}>
                            {total.toLocaleString()}
                          </td>
                          <td className={`px-3 py-4 whitespace-nowrap text-sm text-center text-purple-600 ${colorClasses.bg}`}>
                            {eightPM.toLocaleString()}
                          </td>
                          <td className={`px-3 py-4 whitespace-nowrap text-sm text-center text-orange-600 ${colorClasses.bg} border-r`}>
                            {verve.toLocaleString()}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    
                    {/* 5-Month Averages */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-600 bg-purple-50 border-l border-r">
                      {shop.fiveMonthAvgTotal?.toFixed(1) || '0.0'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-bold text-purple-600 bg-purple-50">
                      {shop.fiveMonthAvg8PM?.toFixed(1) || '0.0'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-bold text-orange-600 bg-purple-50 border-r">
                      {shop.fiveMonthAvgVerve?.toFixed(1) || '0.0'}
                    </td>
                    
                    {/* Growth metrics */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (shop.growthPercent || 0) > 0 
                          ? 'bg-green-100 text-green-800' 
                          : (shop.growthPercent || 0) < 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {shop.growthPercent?.toFixed(1) || 0}%
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (shop.yoyGrowthPercent || 0) > 0 
                          ? 'bg-blue-100 text-blue-800' 
                          : (shop.yoyGrowthPercent || 0) < 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {shop.yoyGrowthPercent?.toFixed(1) || 0}%
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        shop.monthlyTrend === 'improving' ? 'bg-green-100 text-green-800' :
                        shop.monthlyTrend === 'declining' ? 'bg-red-100 text-red-800' :
                        shop.monthlyTrend === 'new' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {shop.monthlyTrend === 'improving' ? '📈' :
                         shop.monthlyTrend === 'declining' ? '📉' :
                         shop.monthlyTrend === 'new' ? '✨' : '➡️'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination - Desktop Only */}
        <div className="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredShops.length)} of {filteredShops.length} shops
            {filteredShops.length !== data.allShopsComparison.length && (
              <span className="text-gray-500"> (filtered from {data.allShopsComparison.length} total)</span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 NEW: Legend and Summary - Future-Ready Information */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">🚀 5-Month Rolling Window - Future-Ready Display</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">✅ Current Period ({data.currentMonth}/{data.currentYear}):</h4>
            <div className="space-y-1 text-sm">
              <div>• <strong>Display:</strong> {rollingWindowLabel}</div>
              <div>• <strong>Ranking:</strong> By 5-month average performance</div>
              <div>• <strong>Rolling Logic:</strong> Last 5 months including current</div>
              <div>• <strong>Data Integrity:</strong> Direct field references only</div>
              <div>• <strong>Next Month:</strong> March drops off, {getShortMonthName((parseInt(data.currentMonth) + 1).toString())} added</div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Desktop Color Coding:</h4>
            <div className="space-y-1 text-sm">
              {rollingWindow.map((month, index) => {
                const colorClasses = getMonthColorClasses(month.color);
                return (
                  <div key={month.month} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 ${colorClasses.bg} border ${colorClasses.border} rounded`}></div>
                    <span>{month.fullName} {month.year} Data</span>
                  </div>
                );
              })}
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded"></div>
                <span>5-Month Averages</span>
              </div>
            </div>
          </div>
        </div>

        {/* Future Month Preview */}
        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
          <h5 className="font-medium text-blue-900 mb-2">🔮 Future Month Preview:</h5>
          <div className="text-sm text-blue-700">
            <strong>August 2025:</strong> Will show "Apr-May-Jun-Jul-Aug 2025" (March drops off)
            <br />
            <strong>September 2025:</strong> Will show "May-Jun-Jul-Aug-Sep 2025" (April drops off)
            <br />
            <strong>January 2026:</strong> Will show "Sep-Oct-Nov-Dec-Jan 2026" (automatic year transition)
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopShopsTab;
