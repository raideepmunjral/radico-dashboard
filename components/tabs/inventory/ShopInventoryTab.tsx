'use client';

import React, { useState } from 'react';
import { Search, X, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle, Truck } from 'lucide-react';

// ==========================================
// INVENTORY DATA TYPES (copied from main file)
// ==========================================

interface InventoryItem {
  brand: string;
  quantity: number;
  isInStock: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
  isNeverOrdered: boolean;
  isDiscontinued: boolean;
  reasonNoStock: string;
  ageInDays: number;
  ageCategory: 'lessThan30Days' | 'days30to45' | 'days45to60' | 'days60to75' | 'days75to90' | 'over90Days';
  lastSupplyDate?: Date;
  isEstimatedAge: boolean;
  suppliedAfterOutOfStock?: boolean;
  daysSinceLastSupply?: number;
  daysOutOfStock?: number;
  supplyDateAfterVisit?: Date;
  currentDaysOutOfStock?: number;
  supplyStatus: 'current' | 'aging_30_45' | 'aging_45_60' | 'aging_60_75' | 'aging_75_90' | 'aging_critical' | 'recently_restocked' | 'awaiting_supply' | 'unknown';
}

interface ShopInventory {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  visitDate: Date | null;
  items: Record<string, any>;
  totalItems: number;
  inStockCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  agingInventoryCount: number;
  lastVisitDays: number | null;
  dataSource: 'master_data' | 'visit_data' | 'master_data_only';
  salesmanUid?: string;
}

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
  shops: Record<string, ShopInventory>;
  skuPerformance: Array<any>;
  allAgingLocations: Array<any>;
  outOfStockItems: Array<any>;
  visitCompliance: any;
}

interface ShopInventoryFilters {
  department: string;
  salesman: string;
  stockStatus: string;
  ageCategory: string;
  brand: string;
  supplyStatus: string;
  searchText: string;
}

// ==========================================
// INDEPENDENT SHOP INVENTORY TAB COMPONENT
// ==========================================

const ShopInventoryTab = ({ data }: { data: InventoryData }) => {
  // ==========================================
  // OWN STATE MANAGEMENT
  // ==========================================
  const [filters, setFilters] = useState<ShopInventoryFilters>({
    department: '',
    salesman: '',
    stockStatus: '',
    ageCategory: '',
    brand: '',
    supplyStatus: '',
    searchText: ''
  });
  
  const [expandedShop, setExpandedShop] = useState<string | null>(null);

  // ==========================================
  // OWN HELPER FUNCTIONS
  // ==========================================
  
  const getDepartments = () => {
    return Array.from(new Set(Object.values(data.shops).map(shop => shop.department))).sort();
  };

  const getSalesmen = () => {
    return Array.from(new Set(Object.values(data.shops).map(shop => shop.salesman))).sort();
  };

  const getFilteredShops = () => {
    return Object.values(data.shops).filter(shop => {
      const matchesDepartment = !filters.department || shop.department === filters.department;
      const matchesSalesman = !filters.salesman || shop.salesman === filters.salesman;
      const matchesSearch = !filters.searchText || 
        shop.shopName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        shop.salesman.toLowerCase().includes(filters.searchText.toLowerCase());
      
      let matchesStockStatus = true;
      if (filters.stockStatus === 'out-of-stock') {
        matchesStockStatus = shop.outOfStockCount > 0;
      } else if (filters.stockStatus === 'low-stock') {
        matchesStockStatus = shop.lowStockCount > 0;
      } else if (filters.stockStatus === 'aging') {
        matchesStockStatus = shop.agingInventoryCount > 0;
      }
      
      return matchesDepartment && matchesSalesman && matchesSearch && matchesStockStatus;
    });
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

  // ==========================================
  // GET FILTERED DATA
  // ==========================================
  
  const filteredShops = getFilteredShops();
  const departments = getDepartments();
  const salesmen = getSalesmen();

  // ==========================================
  // RENDER COMPONENT
  // ==========================================
  
  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search shops, salesmen..."
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
            {departments.map((dept: string) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filters.salesman}
            onChange={(e) => setFilters({ ...filters, salesman: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Salesmen</option>
            {salesmen.map((salesman: string) => (
              <option key={salesman} value={salesman}>{salesman}</option>
            ))}
          </select>

          <select
            value={filters.stockStatus}
            onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Stock Status</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="aging">Aging Inventory</option>
          </select>

          <button
            onClick={() => setFilters({ 
              department: '', 
              salesman: '', 
              stockStatus: '', 
              ageCategory: '', 
              brand: '', 
              supplyStatus: '', 
              searchText: '' 
            })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Shop Inventory List with Master Data Integration */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Master-Integrated Shop Inventory Status</h3>
          <p className="text-sm text-gray-500">Showing {filteredShops.length} shops with master data integration ({data.summary.rollingPeriodDays}-day rolling period)</p>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredShops.map((shop: ShopInventory) => (
            <div key={shop.shopId} className="p-6">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedShop(expandedShop === shop.shopId ? null : shop.shopId)}
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{shop.shopName}</h4>
                    <p className="text-sm text-gray-500">{shop.department} • {shop.salesman} • ID: {shop.shopId}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        shop.dataSource === 'master_data' ? 'bg-green-100 text-green-800' :
                        shop.dataSource === 'master_data_only' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {shop.dataSource === 'master_data' ? '✅ Master Data' :
                         shop.dataSource === 'master_data_only' ? '📋 Master Only' :
                         '📝 Visit Data'}
                      </span>
                      {shop.visitDate ? (
                        <p className="text-xs text-blue-600">Visit: {shop.visitDate.toLocaleDateString('en-GB')} ({shop.lastVisitDays} days ago)</p>
                      ) : (
                        <p className="text-xs text-orange-600">No recent visit</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-600">{shop.inStockCount}</div>
                      <div className="text-xs text-gray-500">In Stock</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-red-600">{shop.outOfStockCount}</div>
                      <div className="text-xs text-gray-500">Out of Stock</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-yellow-600">{shop.agingInventoryCount}</div>
                      <div className="text-xs text-gray-500">Aging (30+)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-blue-600">
                        {Object.values(shop.items).filter(item => item.suppliedAfterOutOfStock).length}
                      </div>
                      <div className="text-xs text-gray-500">Restocked</div>
                    </div>
                  </div>
                </div>
                {expandedShop === shop.shopId ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
              
              {expandedShop === shop.shopId && (
                <div className="mt-4 border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.values(shop.items).map((item: InventoryItem) => (
                      <div key={item.brand} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-900 truncate">{item.brand}</h5>
                          <div className="flex items-center space-x-1">
                            {item.isInStock ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : item.isOutOfStock ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                            )}
                            {item.suppliedAfterOutOfStock && (
                              <div className="relative group">
                                <Truck className="w-4 h-4 text-blue-500" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  Recently Restocked
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                          <div className="text-sm text-gray-600">
                            Age: {item.ageInDays} days {item.isEstimatedAge && '(est.)'}
                          </div>
                          {item.lastSupplyDate && (
                            <div className="text-xs text-blue-600">
                              Last Supply: {item.lastSupplyDate.toLocaleDateString('en-GB')}
                            </div>
                          )}
                          {(item as any).agingDataSource && (
                            <div className="text-xs text-purple-600">
                              Source: {(item as any).agingDataSource}
                            </div>
                          )}
                          {item.reasonNoStock && (
                            <div className="text-xs text-red-600">{item.reasonNoStock}</div>
                          )}
                          <div className="text-xs">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.supplyStatus === 'current' ? 'bg-green-100 text-green-800' :
                              item.suppliedAfterOutOfStock ? 'bg-blue-100 text-blue-800' :
                              item.supplyStatus === 'awaiting_supply' ? 'bg-red-100 text-red-800' :
                              item.supplyStatus?.startsWith('aging') ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {getEnhancedSupplyStatusDisplay(item)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopInventoryTab;
