'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

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

interface AgingAnalysisFilters {
  department: string;
  salesman: string;
  stockStatus: string;
  ageCategory: string;
  brand: string;
  supplyStatus: string;
  searchText: string;
}

// ==========================================
// INDEPENDENT AGING ANALYSIS TAB COMPONENT
// ==========================================

const AgingAnalysisTab = ({ data }: { data: InventoryData }) => {
  // ==========================================
  // OWN STATE MANAGEMENT
  // ==========================================
  const [filters, setFilters] = useState<AgingAnalysisFilters>({
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

  const getSupplyStatuses = () => {
    return [
      'current',
      'recently_restocked',
      'aging_30_45',
      'aging_45_60',
      'aging_60_75',
      'aging_75_90',
      'aging_critical',
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
  
  const filteredAging = getFilteredItems(data.allAgingLocations);
  const totalPages = Math.ceil(filteredAging.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAging.slice(startIndex, endIndex);

  const departments = getDepartments();
  const salesmen = getSalesmen();
  const brands = getBrands();
  const supplyStatuses = getSupplyStatuses();

  // ==========================================
  // RENDER COMPONENT
  // ==========================================

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Aging Inventory Analysis with Master Data</h2>
        <p className="text-gray-600">All aging products (30+ days) with master data integration ({data.summary.rollingPeriodDays}-day rolling period)</p>
        <p className="text-sm text-gray-500">
          Period: {data.summary.periodStartDate.toLocaleDateString()} - {data.summary.periodEndDate.toLocaleDateString()}
        </p>
      </div>

      {/* Filter Controls */}
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
            value={filters.ageCategory}
            onChange={(e) => {
              setFilters({ ...filters, ageCategory: e.target.value });
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Ages</option>
            <option value="30+">30+ Days</option>
            <option value="45+">45+ Days</option>
            <option value="60+">60+ Days</option>
            <option value="75+">75+ Days</option>
            <option value="90+">90+ Days</option>
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
            {supplyStatuses.map((status: string) => (
              <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setFilters({ 
                department: '', 
                salesman: '', 
                brand: '', 
                ageCategory: '', 
                supplyStatus: '', 
                stockStatus: '',
                searchText: ''
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

      {/* Enhanced Aging Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-3xl font-bold text-yellow-600">{filteredAging.length}</div>
          <div className="text-sm text-gray-500">Total Aging Items</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-3xl font-bold text-orange-600">{data.summary.avgAge}</div>
          <div className="text-sm text-gray-500">Average Age (Days)</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-3xl font-bold text-red-600">
            {filteredAging.filter((item: any) => item.ageInDays >= 60).length}
          </div>
          <div className="text-sm text-gray-500">Critical (60+ Days)</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-3xl font-bold text-green-600">
            {filteredAging.filter((item: any) => !item.isEstimatedAge).length}
          </div>
          <div className="text-sm text-gray-500">Accurate Dates</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-3xl font-bold text-blue-600">
            {filteredAging.filter((item: any) => item.agingDataSource === 'recent_supply').length}
          </div>
          <div className="text-sm text-gray-500">Recent Supply Data</div>
        </div>
      </div>

      {/* All Aging Locations with Enhanced Data Sources */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Enhanced Aging Inventory Locations (30+ Days)</h3>
          <p className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAging.length)} of {filteredAging.length} aging items with master data integration
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age (Days)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Supply</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Source</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((location: any, index: number) => (
                <tr key={`${location.shopName}-${location.sku}`} className={startIndex + index < 10 ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {startIndex + index + 1}
                    {startIndex + index < 10 && <span className="ml-2 text-red-600">🔥</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{location.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{location.shopName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{location.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{location.salesman}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      location.ageInDays > 90 ? 'bg-red-100 text-red-800' :
                      location.ageInDays > 60 ? 'bg-orange-100 text-orange-800' :
                      location.ageInDays > 45 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {location.ageInDays} {location.isEstimatedAge && '(est.)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{location.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {location.lastSupplyDate ? location.lastSupplyDate.toLocaleDateString('en-GB') : 'Apr 1, 2024 (fallback)'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      location.supplyStatus === 'current' ? 'bg-green-100 text-green-800' :
                      location.suppliedAfterOutOfStock ? 'bg-blue-100 text-blue-800' :
                      location.supplyStatus === 'awaiting_supply' ? 'bg-red-100 text-red-800' :
                      location.supplyStatus?.startsWith('aging') ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getEnhancedSupplyStatusDisplay(location)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      location.agingDataSource === 'recent_supply' ? 'bg-green-100 text-green-800' :
                      location.agingDataSource === 'historical_supply' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {location.agingDataSource?.replace(/_/g, ' ') || 'no_supply_data'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        <div className="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredAging.length)} of {filteredAging.length} enhanced aging items
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

export default AgingAnalysisTab;
