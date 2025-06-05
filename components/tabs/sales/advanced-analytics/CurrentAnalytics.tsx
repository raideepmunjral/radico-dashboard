'use client';

import React, { useState, useMemo } from 'react';
import { Download, UserPlus, AlertTriangle, TrendingDown, Star, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  allShopsComparison: ShopData[];
  customerInsights: CustomerInsights;
  currentMonth: string;
  currentYear: string;
}

interface FilterState {
  department: string;
  salesman: string;
  shop: string;
  searchText: string;
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
// MAIN COMPONENT - RENAMED FROM AdvancedAnalyticsTab
// ==========================================

const CurrentAnalytics = ({ data }: { data: DashboardData }) => {
  // ==========================================
  // INTERNAL STATE MANAGEMENT
  // ==========================================
  
  const [showSKUModal, setShowSKUModal] = useState(false);
  const [selectedShopSKU, setSelectedShopSKU] = useState<ShopData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [filters, setFilters] = useState<FilterState>({
    department: '',
    salesman: '',
    shop: '',
    searchText: ''
  });

  // ==========================================
  // INTERNAL UTILITY FUNCTIONS
  // ==========================================

  const getFilteredShops = useMemo(() => {
    return (shops: ShopData[]): ShopData[] => {
      return shops.filter(shop => {
        const matchesDepartment = !filters.department || shop.department === filters.department;
        const matchesSalesman = !filters.salesman || shop.salesman === filters.salesman;
        const matchesShop = !filters.shop || shop.shopName.toLowerCase().includes(filters.shop.toLowerCase());
        const matchesSearch = !filters.searchText || 
          shop.shopName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
          shop.department.toLowerCase().includes(filters.searchText.toLowerCase()) ||
          shop.salesman.toLowerCase().includes(filters.searchText.toLowerCase());
        
        return matchesDepartment && matchesSalesman && matchesShop && matchesSearch;
      });
    };
  }, [filters]);

  const filteredShops = getFilteredShops(data.allShopsComparison);
  const totalPages = Math.ceil(filteredShops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentShops = filteredShops.slice(startIndex, endIndex);

  const departments = [...new Set(data.allShopsComparison.map(shop => shop.department))].sort();
  const salesmen = [...new Set(data.allShopsComparison.map(shop => shop.salesman))].sort();

  // ==========================================
  // INTERNAL EXPORT FUNCTION
  // ==========================================

  const exportToExcel = async () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `Radico Enhanced Shop Analysis Report - Rolling 4-Month Comparison - ${new Date().toLocaleDateString()}\n`;
      csvContent += `Report Period: Mar-Apr-May-${getShortMonthName(data.currentMonth)} ${data.currentYear}\n`;
      
      if (filters.department || filters.salesman || filters.searchText) {
        csvContent += "APPLIED FILTERS: ";
        if (filters.department) csvContent += `Department: ${filters.department}, `;
        if (filters.salesman) csvContent += `Salesman: ${filters.salesman}, `;
        if (filters.searchText) csvContent += `Search: ${filters.searchText}`;
        csvContent += "\n";
      }
      csvContent += "\n";
      
      csvContent += "EXECUTIVE SUMMARY\n";
      csvContent += "Total Shops," + data.allShopsComparison.length + "\n";
      csvContent += "Filtered Shops," + filteredShops.length + "\n";
      csvContent += "First-time Customers," + data.customerInsights.firstTimeCustomers + "\n";
      csvContent += "Lost Customers," + data.customerInsights.lostCustomers + "\n";
      csvContent += "Consistent Performers," + data.customerInsights.consistentPerformers + "\n";
      csvContent += "Declining Performers," + data.customerInsights.decliningPerformers + "\n\n";
      
      csvContent += `ROLLING WINDOW SHOP COMPARISON (Mar-Apr-May-${getShortMonthName(data.currentMonth)} ${data.currentYear})\n`;
      csvContent += `Shop Name,Department,Salesman,Mar Cases,Apr Cases,May Cases,${getShortMonthName(data.currentMonth)} Cases,8PM Cases,VERVE Cases,Growth %,YoY Growth %,Monthly Trend\n`;
      
      filteredShops.forEach(shop => {
        csvContent += `"${shop.shopName}","${shop.department}","${shop.salesman}",${shop.marchTotal || 0},${shop.aprilTotal || 0},${shop.mayTotal || 0},${shop.juneTotal || shop.total},${shop.eightPM},${shop.verve},${shop.growthPercent?.toFixed(1) || 0}%,${shop.yoyGrowthPercent?.toFixed(1) || 0}%,"${shop.monthlyTrend || 'stable'}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Radico_Enhanced_Analysis_${getShortMonthName(data.currentMonth)}_${data.currentYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  // ==========================================
  // INTERNAL SKU MODAL COMPONENT
  // ==========================================

  const EnhancedSKUModal = ({ shop, onClose }: { shop: ShopData, onClose: () => void }) => {
    const [activeMonth, setActiveMonth] = useState(getShortMonthName(data.currentMonth));
    
    const getSKUDataForMonth = (month: string) => {
      if (month === getShortMonthName(data.currentMonth)) {
        return shop.skuBreakdown || [];
      }
      return [];
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-lg font-semibold">SKU Analysis - {shop.shopName}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex border-b">
            {['March', 'April', 'May', getShortMonthName(data.currentMonth)].map((month) => (
              <button
                key={month}
                onClick={() => setActiveMonth(month)}
                className={`px-6 py-3 font-medium ${
                  activeMonth === month
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {month} {data.currentYear}
              </button>
            ))}
          </div>

          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {activeMonth === getShortMonthName(data.currentMonth) ? shop.juneTotal || shop.total :
                   activeMonth === 'May' ? shop.mayTotal || 0 :
                   activeMonth === 'April' ? shop.aprilTotal || 0 :
                   shop.marchTotal || 0}
                </div>
                <div className="text-sm text-gray-500">Total Cases</div>
              </div>
              <div className="text-center bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {activeMonth === getShortMonthName(data.currentMonth) ? shop.juneEightPM || shop.eightPM :
                   activeMonth === 'May' ? shop.mayEightPM || 0 :
                   activeMonth === 'April' ? shop.aprilEightPM || 0 :
                   shop.marchEightPM || 0}
                </div>
                <div className="text-sm text-gray-500">8PM Cases</div>
              </div>
              <div className="text-center bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {activeMonth === getShortMonthName(data.currentMonth) ? shop.juneVerve || shop.verve :
                   activeMonth === 'May' ? shop.mayVerve || 0 :
                   activeMonth === 'April' ? shop.aprilVerve || 0 :
                   shop.marchVerve || 0}
                </div>
                <div className="text-sm text-gray-500">VERVE Cases</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand/SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cases</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getSKUDataForMonth(activeMonth).map((sku, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4 text-sm text-gray-900">{sku.brand}</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{sku.cases}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{sku.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // INTERNAL HANDLERS
  // ==========================================

  const handleShowSKU = (shop: ShopData) => {
    setSelectedShopSKU(shop);
    setShowSKUModal(true);
  };

  const handleCloseSKUModal = () => {
    setShowSKUModal(false);
    setSelectedShopSKU(null);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <UserPlus className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{data.customerInsights.firstTimeCustomers}</div>
              <div className="text-sm text-gray-500">First-time Customers</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{data.customerInsights.lostCustomers}</div>
              <div className="text-sm text-gray-500">Lost Customers</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{data.customerInsights.consistentPerformers}</div>
              <div className="text-sm text-gray-500">Consistent Performers</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <TrendingDown className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{data.customerInsights.decliningPerformers}</div>
              <div className="text-sm text-gray-500">Declining Performers</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search shops, departments, salesmen..."
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 w-64"
            />
          </div>
          
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filters.salesman}
            onChange={(e) => setFilters({ ...filters, salesman: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Salesmen</option>
            {salesmen.map(salesman => (
              <option key={salesman} value={salesman}>{salesman}</option>
            ))}
          </select>

          <button
            onClick={() => setFilters({ department: '', salesman: '', shop: '', searchText: '' })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>

          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>

          <div className="text-sm text-gray-500">
            Showing {filteredShops.length} of {data.allShopsComparison.length} shops
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Complete Shop Analysis - Rolling 4-Month Comparison (Mar-Apr-May-{getMonthName(data.currentMonth)} {data.currentYear})</h3>
          <p className="text-sm text-gray-500">
            {filteredShops.length} shops {filters.department || filters.salesman || filters.searchText ? '(filtered)' : ''} 
            ranked by current month performance with rolling window analysis and YoY comparison
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mar Cases</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apr Cases</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">May Cases</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getMonthName(data.currentMonth)} Cases</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth %</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">YoY %</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">8PM</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VERVE</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentShops.map((shop, index) => (
                <tr key={shop.shopId} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{shop.shopName}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{shop.salesman}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shop.marchTotal?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shop.aprilTotal?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shop.mayTotal?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    <button
                      onClick={() => handleShowSKU(shop)}  
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {shop.juneTotal?.toLocaleString() || shop.total.toLocaleString()}
                    </button>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
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
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
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
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
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
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                    {shop.eightPM.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                    {shop.verve.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredShops.length)} of {filteredShops.length} filtered shops
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <UserPlus className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">First-time Billing Shops ({data.customerInsights.firstTimeCustomers})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{getMonthName(data.currentMonth)} Cases</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.customerInsights.newShops.slice(0, 10).map((shop) => (
                  <tr key={shop.shopId}>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.shopName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.salesman}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">{shop.juneTotal || shop.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Lost Customers ({data.customerInsights.lostCustomers})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">May Cases</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.customerInsights.lostShops.slice(0, 10).map((shop) => (
                  <tr key={shop.shopId}>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.shopName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.salesman}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600">{shop.mayTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SKU MODAL */}
      {showSKUModal && selectedShopSKU && (
        <EnhancedSKUModal 
          shop={selectedShopSKU} 
          onClose={handleCloseSKUModal} 
        />
      )}
    </div>
  );
};

export default CurrentAnalytics;
