'use client';

import React, { useState, useMemo } from 'react';
import { Download, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  juneLastYearTotal?: number;
  juneLastYearEightPM?: number;
  juneLastYearVerve?: number;
  yoyGrowthPercent?: number;
  growthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
  skuBreakdown?: SKUData[];
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

// 🔧 NEW: Helper function to get current month data dynamically
const getCurrentMonthData = (shop: ShopData, currentMonth: string, field: 'total' | 'eightPM' | 'verve') => {
  const monthNum = parseInt(currentMonth);
  
  switch(monthNum) {
    case 1: return field === 'total' ? (shop.januaryTotal || 0) : field === 'eightPM' ? (shop.januaryEightPM || 0) : (shop.januaryVerve || 0);
    case 2: return field === 'total' ? (shop.februaryTotal || 0) : field === 'eightPM' ? (shop.februaryEightPM || 0) : (shop.februaryVerve || 0);
    case 3: return field === 'total' ? (shop.marchTotal || 0) : field === 'eightPM' ? (shop.marchEightPM || 0) : (shop.marchVerve || 0);
    case 4: return field === 'total' ? (shop.aprilTotal || 0) : field === 'eightPM' ? (shop.aprilEightPM || 0) : (shop.aprilVerve || 0);
    case 5: return field === 'total' ? (shop.mayTotal || 0) : field === 'eightPM' ? (shop.mayEightPM || 0) : (shop.mayVerve || 0);
    case 6: return field === 'total' ? (shop.juneTotal || 0) : field === 'eightPM' ? (shop.juneEightPM || 0) : (shop.juneVerve || 0);
    case 7: return field === 'total' ? (shop.julyTotal || 0) : field === 'eightPM' ? (shop.julyEightPM || 0) : (shop.julyVerve || 0);
    case 8: return field === 'total' ? (shop.augustTotal || 0) : field === 'eightPM' ? (shop.augustEightPM || 0) : (shop.augustVerve || 0);
    case 9: return field === 'total' ? (shop.septemberTotal || 0) : field === 'eightPM' ? (shop.septemberEightPM || 0) : (shop.septemberVerve || 0);
    case 10: return field === 'total' ? (shop.octoberTotal || 0) : field === 'eightPM' ? (shop.octoberEightPM || 0) : (shop.octoberVerve || 0);
    case 11: return field === 'total' ? (shop.novemberTotal || 0) : field === 'eightPM' ? (shop.novemberEightPM || 0) : (shop.novemberVerve || 0);
    case 12: return field === 'total' ? (shop.decemberTotal || 0) : field === 'eightPM' ? (shop.decemberEightPM || 0) : (shop.decemberVerve || 0);
    default: return field === 'total' ? shop.total : field === 'eightPM' ? shop.eightPM : shop.verve;
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const TopShopsTab = ({ data }: { data: DashboardData }) => {
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
  // INTERNAL UTILITY FUNCTIONS
  // ==========================================

  const getFilteredTopShops = useMemo(() => {
    return (shops: ShopData[]): ShopData[] => {
      return shops.filter(shop => {
        const matchesDepartment = !filters.department || shop.department === filters.department;
        const matchesSalesman = !filters.salesman || shop.salesman === filters.salesman;
        const matchesSearch = !filters.searchText || 
          shop.shopName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
          shop.department.toLowerCase().includes(filters.searchText.toLowerCase()) ||
          shop.salesman.toLowerCase().includes(filters.searchText.toLowerCase());
        const matchesMinCases = !filters.minCases || (shop.threeMonthAvgTotal! >= parseFloat(filters.minCases));
        const matchesTrend = !filters.performanceTrend || shop.monthlyTrend === filters.performanceTrend;
        
        return matchesDepartment && matchesSalesman && matchesSearch && matchesMinCases && matchesTrend;
      });
    };
  }, [filters]);

  const filteredShops = getFilteredTopShops(data.allShopsComparison);
  const totalPages = Math.ceil(filteredShops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentShops = filteredShops.slice(startIndex, endIndex);

  const departments = [...new Set(data.allShopsComparison.map(shop => shop.department))].sort();
  const salesmen = [...new Set(data.allShopsComparison.map(shop => shop.salesman))].sort();

  // ==========================================
  // INTERNAL EXPORT FUNCTION
  // ==========================================

  const exportTopShopsToCSV = async () => {
    if (!data) return;

    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `Radico Top Shops Detailed Analysis Report - ${new Date().toLocaleDateString()}\n`;
      csvContent += `Report Period: Mar-Apr-May-${getShortMonthName(data.currentMonth)} ${data.currentYear}\n`;
      csvContent += `Sorted by: 3-Month Average Performance (Mar-Apr-May)\n`;
      
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
      csvContent += "Top 3-Month Avg," + (filteredShops[0]?.threeMonthAvgTotal?.toFixed(1) || 0) + " cases\n\n";
      
      csvContent += `DETAILED SHOP ANALYSIS (Mar-Apr-May-${getShortMonthName(data.currentMonth)} ${data.currentYear})\n`;
      csvContent += `Rank,Shop Name,Department,Salesman,Mar Total,Mar 8PM,Mar VERVE,Apr Total,Apr 8PM,Apr VERVE,May Total,May 8PM,May VERVE,${getShortMonthName(data.currentMonth)} Total,${getShortMonthName(data.currentMonth)} 8PM,${getShortMonthName(data.currentMonth)} VERVE,3M Avg Total,3M Avg 8PM,3M Avg VERVE,Growth %,YoY Growth %,Monthly Trend\n`;
      
      filteredShops.forEach((shop, index) => {
        const currentTotal = getCurrentMonthData(shop, data.currentMonth, 'total');
        const current8PM = getCurrentMonthData(shop, data.currentMonth, 'eightPM');
        const currentVERVE = getCurrentMonthData(shop, data.currentMonth, 'verve');
        
        csvContent += `${index + 1},"${shop.shopName}","${shop.department}","${shop.salesman}",${shop.marchTotal || 0},${shop.marchEightPM || 0},${shop.marchVerve || 0},${shop.aprilTotal || 0},${shop.aprilEightPM || 0},${shop.aprilVerve || 0},${shop.mayTotal || 0},${shop.mayEightPM || 0},${shop.mayVerve || 0},${currentTotal},${current8PM},${currentVERVE},${shop.threeMonthAvgTotal?.toFixed(1) || 0},${shop.threeMonthAvg8PM?.toFixed(1) || 0},${shop.threeMonthAvgVERVE?.toFixed(1) || 0},${shop.growthPercent?.toFixed(1) || 0}%,${shop.yoyGrowthPercent?.toFixed(1) || 0}%,"${shop.monthlyTrend || 'stable'}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Radico_Top_Shops_Detailed_Analysis_${getShortMonthName(data.currentMonth)}_${data.currentYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting Top Shops CSV:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  // ==========================================
  // MOBILE CARD COMPONENT
  // ==========================================

  const MobileShopCard = ({ shop, index }: { shop: ShopData, index: number }) => {
    // 🔧 FIXED: Use dynamic current month data
    const currentTotal = getCurrentMonthData(shop, data.currentMonth, 'total');
    const current8PM = getCurrentMonthData(shop, data.currentMonth, 'eightPM');
    const currentVERVE = getCurrentMonthData(shop, data.currentMonth, 'verve');
    
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
            <div className="text-lg font-bold text-blue-600">{shop.threeMonthAvgTotal?.toFixed(1) || '0.0'}</div>
            <div className="text-xs text-gray-500">3M Avg</div>
          </div>
        </div>
        
        {/* Current Month Performance */}
        <div className="grid grid-cols-3 gap-3 mb-3 p-3 bg-red-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-bold text-gray-900">{currentTotal.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{getShortMonthName(data.currentMonth)} Total</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-purple-600">{current8PM.toLocaleString()}</div>
            <div className="text-xs text-gray-500">8PM</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-orange-600">{currentVERVE.toLocaleString()}</div>
            <div className="text-xs text-gray-500">VERVE</div>
          </div>
        </div>

        {/* Historical Performance */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-sm font-medium text-gray-900">{shop.marchTotal?.toLocaleString() || 0}</div>
            <div className="text-xs text-gray-500">Mar</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-sm font-medium text-gray-900">{shop.aprilTotal?.toLocaleString() || 0}</div>
            <div className="text-xs text-gray-500">Apr</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="text-sm font-medium text-gray-900">{shop.mayTotal?.toLocaleString() || 0}</div>
            <div className="text-xs text-gray-500">May</div>
          </div>
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
          <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Top 3M Avg</h3>
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {filteredShops[0]?.threeMonthAvgTotal?.toFixed(1) || 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">Cases (Mar-May)</div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Avg 8PM</h3>
          <div className="text-xl sm:text-2xl font-bold text-purple-600">
            {(filteredShops.reduce((sum, shop) => sum + (shop.threeMonthAvg8PM || 0), 0) / Math.max(filteredShops.length, 1)).toFixed(1)}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">3M Avg Cases</div>
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Avg VERVE</h3>
          <div className="text-xl sm:text-2xl font-bold text-orange-600">
            {(filteredShops.reduce((sum, shop) => sum + (shop.threeMonthAvgVERVE || 0), 0) / Math.max(filteredShops.length, 1)).toFixed(1)}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">3M Avg Cases</div>
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
              placeholder="Min 3M Avg Cases"
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
              Ranked by 3-month average (Mar-Apr-May {data.currentYear})
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

      {/* Desktop View - Enhanced Table */}
      <div className="hidden lg:block bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Detailed Shop Performance Analysis - Ranked by 3-Month Average (Mar-Apr-May {data.currentYear})
          </h3>
          <p className="text-sm text-gray-500">
            Complete brand breakdown for each month with 3-month averages and growth trends. 
            Sorted by highest 3-month average performance (Mar-Apr-May only).
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
                
                {/* March columns */}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50 border-l border-r">
                  Mar Total
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-purple-500 uppercase tracking-wider bg-blue-50">
                  Mar 8PM
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-orange-500 uppercase tracking-wider bg-blue-50 border-r">
                  Mar VERVE
                </th>
                
                {/* April columns */}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50 border-l border-r">
                  Apr Total
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-purple-500 uppercase tracking-wider bg-green-50">
                  Apr 8PM
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-orange-500 uppercase tracking-wider bg-green-50 border-r">
                  Apr VERVE
                </th>
                
                {/* May columns */}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 border-l border-r">
                  May Total
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-purple-500 uppercase tracking-wider bg-yellow-50">
                  May 8PM
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-orange-500 uppercase tracking-wider bg-yellow-50 border-r">
                  May VERVE
                </th>
                
                {/* Current Month columns - FIXED HEADER */}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-red-50 border-l border-r">
                  {getShortMonthName(data.currentMonth)} Total
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-purple-500 uppercase tracking-wider bg-red-50">
                  {getShortMonthName(data.currentMonth)} 8PM
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-orange-500 uppercase tracking-wider bg-red-50 border-r">
                  {getShortMonthName(data.currentMonth)} VERVE
                </th>
                
                {/* 3-Month Averages */}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50 border-l border-r">
                  3M Avg Total
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-purple-500 uppercase tracking-wider bg-purple-50">
                  3M Avg 8PM
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-orange-500 uppercase tracking-wider bg-purple-50 border-r">
                  3M Avg VERVE
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
                // 🔧 FIXED: Use dynamic current month data
                const currentTotal = getCurrentMonthData(shop, data.currentMonth, 'total');
                const current8PM = getCurrentMonthData(shop, data.currentMonth, 'eightPM');
                const currentVERVE = getCurrentMonthData(shop, data.currentMonth, 'verve');
                
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
                    
                    {/* March data */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-medium bg-blue-50 border-l border-r">
                      {shop.marchTotal?.toLocaleString() || 0}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-purple-600 bg-blue-50">
                      {shop.marchEightPM?.toLocaleString() || 0}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-orange-600 bg-blue-50 border-r">
                      {shop.marchVerve?.toLocaleString() || 0}
                    </td>
                    
                    {/* April data */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-medium bg-green-50 border-l border-r">
                      {shop.aprilTotal?.toLocaleString() || 0}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-purple-600 bg-green-50">
                      {shop.aprilEightPM?.toLocaleString() || 0}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-orange-600 bg-green-50 border-r">
                      {shop.aprilVerve?.toLocaleString() || 0}
                    </td>
                    
                    {/* May data */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-medium bg-yellow-50 border-l border-r">
                      {shop.mayTotal?.toLocaleString() || 0}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-purple-600 bg-yellow-50">
                      {shop.mayEightPM?.toLocaleString() || 0}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-orange-600 bg-yellow-50 border-r">
                      {shop.mayVerve?.toLocaleString() || 0}
                    </td>
                    
                    {/* 🔧 FIXED: Current Month data - Dynamic based on actual current month */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-bold bg-red-50 border-l border-r">
                      {currentTotal.toLocaleString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-purple-600 font-bold bg-red-50">
                      {current8PM.toLocaleString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-orange-600 font-bold bg-red-50 border-r">
                      {currentVERVE.toLocaleString()}
                    </td>
                    
                    {/* 3-Month Averages */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-600 bg-purple-50 border-l border-r">
                      {shop.threeMonthAvgTotal?.toFixed(1) || '0.0'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-bold text-purple-600 bg-purple-50">
                      {shop.threeMonthAvg8PM?.toFixed(1) || '0.0'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-bold text-orange-600 bg-purple-50 border-r">
                      {shop.threeMonthAvgVERVE?.toFixed(1) || '0.0'}
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

      {/* Legend and Summary - Mobile Responsive */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Summary & Legend</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Mobile View Features:</h4>
            <div className="space-y-1 text-sm">
              <div>• <strong>Card Layout:</strong> Easy mobile browsing</div>
              <div>• <strong>Key Metrics:</strong> 3M avg prominently displayed</div>
              <div>• <strong>Current Performance:</strong> {getMonthName(data.currentMonth)} highlighted</div>
              <div>• <strong>Historical Trends:</strong> Mar-Apr-May progression</div>
              <div>• <strong>Growth Indicators:</strong> Visual badges for trends</div>
            </div>
          </div>
          <div className="hidden lg:block">
            <h4 className="font-medium text-gray-900 mb-2">Desktop Color Coding:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <span>March 2025 Data</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 rounded"></div>
                <span>April 2025 Data</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-100 rounded"></div>
                <span>May 2025 Data</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 rounded"></div>
                <span>{getMonthName(data.currentMonth)} 2025 Data</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-100 rounded"></div>
                <span>3-Month Averages</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <h4 className="font-medium text-gray-900 mb-2">✅ FIXED - Dynamic Current Month:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>• <strong>July Column:</strong> Shows actual July 2025 data (0s on July 1st)</div>
              <div>• <strong>August Column:</strong> Will show August 2025 data (0s on Aug 1st)</div>
              <div>• <strong>Auto-Detection:</strong> Current month column adjusts automatically</div>
              <div>• <strong>Data Integrity:</strong> No more June data in July columns</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopShopsTab;
