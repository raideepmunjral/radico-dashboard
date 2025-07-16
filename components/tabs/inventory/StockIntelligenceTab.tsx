'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, AlertTriangle, Truck, Clock, TrendingUp } from 'lucide-react';

// ==========================================
// INVENTORY DATA TYPES (copied from main file)
// ==========================================

interface InventoryData {
  summary: {
    totalShops: number;
    visitedShops: number;
    totalSKUs: number;
    totalOutOfStock: number;
    totalLowStock: number;
    totalAging: number;
    avgAge: number;
    coveragePercent: number;
    recentlyRestockedItems: number;
    rollingPeriodDays: number;
    periodStartDate: Date;
    periodEndDate: Date;
    masterDataIntegration: {
      totalMasterShops: number;
      masterDataAssignments: number;
      visitDataFallbacks: number;
      assignmentCoverage: number;
    };
  };
  shops: Record<string, any>;
  skuPerformance: Array<any>;
  allAgingLocations: Array<any>;
  outOfStockItems: Array<any>;
  visitCompliance: any;
}

interface StockIntelligenceFilters {
  department: string;
  salesman: string;
  stockStatus: string;
  ageCategory: string;
  brand: string;
  supplyStatus: string;
  searchText: string;
}

// ==========================================
// INDEPENDENT STOCK INTELLIGENCE TAB COMPONENT
// ==========================================

const StockIntelligenceTab = ({ data }: { data: InventoryData }) => {
  // ==========================================
  // OWN STATE MANAGEMENT
  // ==========================================
  const [filters, setFilters] = useState<StockIntelligenceFilters>({
    department: '',
    salesman: '',
    stockStatus: '',
    ageCategory: '',
    brand: '',
    supplyStatus: '',
    searchText: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // ==========================================
  // OWN HELPER FUNCTIONS
  // ==========================================

  const getDepartments = () => {
    return Array.from(new Set(Object.values(data.shops).map(shop => shop.department))).sort();
  };

  const getSalesmen = () => {
    return Array.from(new Set(Object.values(data.shops).map(shop => shop.salesman))).sort();
  };

  const getBrands = () => {
    const brands = new Set<string>();
    Object.values(data.shops).forEach(shop => {
      Object.keys(shop.items).forEach(brand => brands.add(brand));
    });
    return Array.from(brands).sort();
  };

  const getStockIntelligenceSupplyStatuses = () => {
    return [
      'recently_restocked',
      'awaiting_supply'
    ];
  };

  const getEnhancedSupplyStatusDisplay = (item: any) => {
    if ((item as any).advancedSupplyStatus) {
      return (item as any).advancedSupplyStatus;
    }
    
    if (item.suppliedAfterOutOfStock && (item as any).daysSinceSupply !== undefined) {
      return `Restocked (${(item as any).daysSinceSupply}d)`;
    } else if (item.supplyStatus === 'awaiting_supply' && (item as any).currentDaysOutOfStock) {
      return `Awaiting Supply (out for ${(item as any).currentDaysOutOfStock} days)`;
    } else {
      return item.supplyStatus?.replace(/_/g, ' ') || 'Unknown';
    }
  };

  const getFilteredItems = (items: any[]) => {
    return items.filter(item => {
      const matchesDepartment = !filters.department || item.department === filters.department;
      const matchesSalesman = !filters.salesman || item.salesman === filters.salesman;
      const matchesBrand = !filters.brand || item.sku?.includes(filters.brand) || item.brand?.includes(filters.brand);
      
      let matchesSupplyStatus = true;
      if (filters.supplyStatus) {
        if (filters.supplyStatus === 'recently_restocked') {
          matchesSupplyStatus = item.suppliedAfterOutOfStock === true || 
            (item as any).advancedSupplyStatus?.includes('Restocked');
        } else if (filters.supplyStatus === 'awaiting_supply') {
          matchesSupplyStatus = (item.suppliedAfterOutOfStock !== true && 
            !(item as any).advancedSupplyStatus?.includes('Restocked')) ||
            item.supplyStatus === 'awaiting_supply' ||
            (item as any).advancedSupplyStatus?.includes('Awaiting Supply');
        } else {
          matchesSupplyStatus = item.supplyStatus === filters.supplyStatus;
        }
      }
      
      const matchesSearch = !filters.searchText || 
        item.shopName?.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        item.sku?.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        item.salesman?.toLowerCase().includes(filters.searchText.toLowerCase());
      
      let matchesAgeCategory = true;
      if (filters.ageCategory) {
        const age = item.ageInDays || 0;
        switch (filters.ageCategory) {
          case '30+': matchesAgeCategory = age >= 30; break;
          case '45+': matchesAgeCategory = age >= 45; break;
          case '60+': matchesAgeCategory = age >= 60; break;
          case '75+': matchesAgeCategory = age >= 75; break;
          case '90+': matchesAgeCategory = age >= 90; break;
          default: matchesAgeCategory = true;
        }
      }
      
      return matchesDepartment && matchesSalesman && matchesBrand && matchesSupplyStatus && matchesSearch && matchesAgeCategory;
    });
  };

  // ==========================================
  // GET FILTERED AND PAGINATED DATA
  // ==========================================
  
  const filteredOutOfStock = getFilteredItems(data.outOfStockItems);
  const totalPages = Math.ceil(filteredOutOfStock.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredOutOfStock.slice(startIndex, endIndex);

  const departments = getDepartments();
  const salesmen = getSalesmen();
  const brands = getBrands();
  const supplyStatuses = getStockIntelligenceSupplyStatuses();

  // ==========================================
  // RENDER COMPONENT
  // ==========================================

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Stock Intelligence & Supply Chain Analysis</h2>
        <p className="text-gray-600">Advanced out-of-stock analysis with master data integration ({data.summary.rollingPeriodDays}-day rolling period)</p>
        <p className="text-sm text-gray-500">
          Period: {data.summary.periodStartDate.toLocaleDateString()} - {data.summary.periodEndDate.toLocaleDateString()}
        </p>
      </div>

      {/* Enhanced Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <select
            value={filters.department}
            onChange={(e) => {
              setFilters({ ...filters, department: e.target.value });
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Departments</option>
            {departments.map((dept: string) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filters.salesman}
            onChange={(e) => {
              setFilters({ ...filters, salesman: e.target.value });
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Salesmen</option>
            {salesmen.map((salesman: string) => (
              <option key={salesman} value={salesman}>{salesman}</option>
            ))}
          </select>

          <select
            value={filters.brand}
            onChange={(e) => {
              setFilters({ ...filters, brand: e.target.value });
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Brands</option>
            {brands.map((brand: string) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          <select
            value={filters.supplyStatus}
            onChange={(e) => {
              setFilters({ ...filters, supplyStatus: e.target.value });
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Supply Status</option>
            <option value="recently_restocked">Recently Restocked</option>
            <option value="awaiting_supply">Awaiting Supply</option>
          </select>

          <input
            type="text"
            placeholder="Search..."
            value={filters.searchText}
            onChange={(e) => {
              setFilters({ ...filters, searchText: e.target.value });
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />

          <button
            onClick={() => {
              setFilters({ 
                department: '', 
                salesman: '', 
                brand: '', 
                searchText: '', 
                supplyStatus: '',
                stockStatus: '',
                ageCategory: ''
              });
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Enhanced Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-red-600">{filteredOutOfStock.length}</div>
              <div className="text-sm text-red-700">Out of Stock Items</div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <div className="flex items-center">
            <Truck className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-blue-600">
                {filteredOutOfStock.filter((item: any) => 
                  item.suppliedAfterOutOfStock || (item as any).advancedSupplyStatus?.includes('Restocked')
                ).length}
              </div>
              <div className="text-sm text-blue-700">Recently Restocked</div>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredOutOfStock.filter((item: any) => 
                  !item.suppliedAfterOutOfStock && !(item as any).advancedSupplyStatus?.includes('Restocked')
                ).length}
              </div>
              <div className="text-sm text-yellow-700">Still Awaiting Supply</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-600">
                {filteredOutOfStock.length > 0 ? Math.round((filteredOutOfStock.filter((item: any) => 
                  item.suppliedAfterOutOfStock || (item as any).advancedSupplyStatus?.includes('Restocked')
                ).length / filteredOutOfStock.length) * 100) : 0}%
              </div>
              <div className="text-sm text-green-700">Response Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Out of Stock Analysis with Master Data Integration */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Enhanced Out of Stock Intelligence with Master Data</h3>
          <p className="text-sm text-gray-500">
            Complete out-of-stock analysis with master data integration. Showing {startIndex + 1}-{Math.min(endIndex, filteredOutOfStock.length)} of {filteredOutOfStock.length} items
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supply Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((item: any, index: number) => (
                <tr key={`${item.shopName}-${item.sku}-${index}`} className={
                  (item as any).advancedSupplyStatus?.includes('Restocked') ? 'bg-green-50' : 
                  item.suppliedAfterOutOfStock ? 'bg-blue-50' : ''
                }>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{item.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{item.shopName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{item.salesman}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.reasonNoStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.visitDate ? item.visitDate.toLocaleDateString('en-GB') : 'No Visit'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      (item as any).advancedSupplyStatus?.includes('Restocked') ? 'bg-green-100 text-green-800' :
                      (item as any).advancedSupplyStatus?.includes('Awaiting Supply') ? 'bg-red-100 text-red-800' :
                      (item as any).advancedSupplyStatus?.includes('In Stock') ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {(item as any).advancedSupplyStatus?.includes('Restocked') && <Truck className="w-3 h-3 mr-1" />}
                      {(item as any).advancedSupplyStatus?.includes('Awaiting Supply') && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {(item as any).advancedSupplyStatus || 'Unknown Status'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination for Stock Intelligence */}
        <div className="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredOutOfStock.length)} of {filteredOutOfStock.length} enhanced out-of-stock items
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
    </div>
  );
};

export default StockIntelligenceTab;
