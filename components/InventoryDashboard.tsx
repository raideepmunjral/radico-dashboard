'use client';

import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, Clock, MapPin, Users, Filter, Search, X, ChevronDown, ChevronUp, BarChart3, Calendar, Eye, AlertCircle, CheckCircle, XCircle, Truck, ShoppingBag } from 'lucide-react';

// ==========================================
// INVENTORY TYPES & INTERFACES
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
  ageCategory: 'lessThan7Days' | 'days7to14' | 'days15to30' | 'days30to60' | 'over60Days';
  supplyDate?: Date;
  isEstimatedAge: boolean;
}

interface ShopInventory {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  visitDate: Date;
  items: Record<string, InventoryItem>;
  totalItems: number;
  inStockCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  agingInventoryCount: number;
  lastVisitDays: number;
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
  };
  shops: Record<string, ShopInventory>;
  skuPerformance: Array<{
    name: string;
    trackedShops: number;
    inStockCount: number;
    outOfStockCount: number;
    outOfStockPercentage: number;
    agingLocations: Array<{
      shopName: string;
      department: string;
      salesman: string;
      ageInDays: number;
      quantity: number;
    }>;
  }>;
  topAgingLocations: Array<{
    sku: string;
    shopName: string;
    department: string;
    salesman: string;
    ageInDays: number;
    quantity: number;
  }>;
  visitCompliance: {
    totalSalesmen: number;
    activeSalesmen: number;
    avgVisitsPerSalesman: number;
    salesmenStats: Array<{
      name: string;
      totalVisits: number;
      uniqueShops: number;
      avgPerDay: number;
      lastVisitDays: number;
    }>;
  };
}

interface InventoryFilters {
  department: string;
  salesman: string;
  stockStatus: string;
  ageCategory: string;
  searchText: string;
}

// ==========================================
// INVENTORY DASHBOARD COMPONENT
// ==========================================

const InventoryDashboard = () => {
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState<InventoryFilters>({
    department: '',
    salesman: '',
    stockStatus: '',
    ageCategory: '',
    searchText: ''
  });
  const [expandedShop, setExpandedShop] = useState<string | null>(null);

  // CONFIGURATION - SAME AS SALES DASHBOARD
  const SHEETS_CONFIG = {
    visitSheetId: process.env.NEXT_PUBLIC_VISIT_SHEET_ID || '1XG4c_Lrpk-YglTq3G3ZY9Qjt7wSnUq0UZWDSYT61eWE',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  };

  // ==========================================
  // DATA FETCHING & PROCESSING
  // ==========================================

  const fetchInventoryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!SHEETS_CONFIG.apiKey) {
        throw new Error('Google API key not configured');
      }

      // Fetch from Radico Visit Final sheet
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.visitSheetId}/values/Radico%20Visit%20Final?key=${SHEETS_CONFIG.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory data');
      }
      
      const result = await response.json();
      const rawData = result.values || [];
      
      // Process the data
      const processedData = processInventoryData(rawData);
      setInventoryData(processedData);
      
    } catch (error: any) {
      console.error('Error fetching inventory data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const processInventoryData = (rawData: any[][]): InventoryData => {
    if (rawData.length === 0) {
      throw new Error('No data found in sheet');
    }

    const headers = rawData[0];
    const rows = rawData.slice(1);

    // Find column indices
    const getColumnIndex = (columnName: string) => {
      const index = headers.findIndex(header => 
        header.toLowerCase().includes(columnName.toLowerCase())
      );
      return index;
    };

    const columnIndices = {
      shopId: getColumnIndex('Shop ID'),
      shopName: getColumnIndex('Shop Name'),
      department: getColumnIndex('Department'),
      salesman: getColumnIndex('Salesman'),
      checkInDateTime: getColumnIndex('Check In Date-Time'),
      invBrand: getColumnIndex('INV Brand'),
      invQuantity: getColumnIndex('INV Quantity'),
      invDisplayed: getColumnIndex('INV Displayed'),
      invIssued: getColumnIndex('INV Issued'),
      reasonNoStock: getColumnIndex('Reason for No Stock'),
      lsDate: getColumnIndex('LS Date')
    };

    // Validate required columns exist
    const requiredColumns = ['shopId', 'shopName', 'invBrand', 'invQuantity', 'checkInDateTime'];
    for (const col of requiredColumns) {
      if (columnIndices[col as keyof typeof columnIndices] === -1) {
        throw new Error(`Required column '${col}' not found`);
      }
    }

    // Filter for recent data (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const recentRows = rows.filter(row => {
      const dateStr = row[columnIndices.checkInDateTime];
      if (!dateStr) return false;
      
      try {
        const rowDate = new Date(dateStr);
        return rowDate >= sevenDaysAgo;
      } catch {
        return false;
      }
    });

    // Find latest visits for each shop
    const shopLatestVisits: Record<string, any> = {};
    
    recentRows.forEach(row => {
      const shopId = row[columnIndices.shopId];
      const shopName = row[columnIndices.shopName];
      const department = row[columnIndices.department];
      const salesman = row[columnIndices.salesman];
      const checkInDateTime = row[columnIndices.checkInDateTime];
      
      if (!shopId || !checkInDateTime) return;
      
      try {
        const visitDate = new Date(checkInDateTime);
        
        if (!shopLatestVisits[shopId] || visitDate > shopLatestVisits[shopId].visitDate) {
          shopLatestVisits[shopId] = {
            shopId,
            shopName: shopName || 'Unknown Shop',
            department: department || 'Unknown',
            salesman: salesman || 'Unknown',
            visitDate,
            rows: []
          };
        }
      } catch (error) {
        console.warn(`Invalid date format: ${checkInDateTime}`);
      }
    });

    // Group inventory data by shop's latest visit
    recentRows.forEach(row => {
      const shopId = row[columnIndices.shopId];
      const checkInDateTime = row[columnIndices.checkInDateTime];
      const invBrand = row[columnIndices.invBrand];
      
      if (!shopId || !checkInDateTime || !invBrand) return;
      
      try {
        const visitDate = new Date(checkInDateTime);
        const latestVisit = shopLatestVisits[shopId];
        
        if (latestVisit && visitDate.getTime() === latestVisit.visitDate.getTime()) {
          latestVisit.rows.push(row);
        }
      } catch (error) {
        // Skip invalid dates
      }
    });

    // Process inventory for each shop
    const shops: Record<string, ShopInventory> = {};
    const skuTracker: Record<string, any> = {};
    const topAgingLocations: Array<any> = [];
    const salesmenVisits: Record<string, any> = {};

    Object.values(shopLatestVisits).forEach((shopVisit: any) => {
      const shopInventory: ShopInventory = {
        shopId: shopVisit.shopId,
        shopName: shopVisit.shopName,
        department: shopVisit.department,
        salesman: shopVisit.salesman,
        visitDate: shopVisit.visitDate,
        items: {},
        totalItems: 0,
        inStockCount: 0,
        outOfStockCount: 0,
        lowStockCount: 0,
        agingInventoryCount: 0,
        lastVisitDays: Math.floor((today.getTime() - shopVisit.visitDate.getTime()) / (1000 * 60 * 60 * 24))
      };

      // Track salesman visits
      if (!salesmenVisits[shopVisit.salesman]) {
        salesmenVisits[shopVisit.salesman] = {
          name: shopVisit.salesman,
          totalVisits: 0,
          uniqueShops: new Set(),
          lastVisitDate: shopVisit.visitDate
        };
      }
      salesmenVisits[shopVisit.salesman].totalVisits++;
      salesmenVisits[shopVisit.salesman].uniqueShops.add(shopVisit.shopId);
      if (shopVisit.visitDate > salesmenVisits[shopVisit.salesman].lastVisitDate) {
        salesmenVisits[shopVisit.salesman].lastVisitDate = shopVisit.visitDate;
      }

      // Process each inventory item
      shopVisit.rows.forEach((row: any[]) => {
        const brand = row[columnIndices.invBrand]?.toString().trim();
        const quantity = parseFloat(row[columnIndices.invQuantity]) || 0;
        const reasonNoStock = row[columnIndices.reasonNoStock]?.toString().trim() || '';
        const lsDate = row[columnIndices.lsDate];

        if (!brand) return;

        // Calculate age
        let ageInDays = 0;
        let isEstimatedAge = true;
        let supplyDate: Date | undefined;

        if (lsDate) {
          try {
            supplyDate = new Date(lsDate);
            if (!isNaN(supplyDate.getTime())) {
              ageInDays = Math.floor((shopVisit.visitDate.getTime() - supplyDate.getTime()) / (1000 * 60 * 60 * 24));
              isEstimatedAge = false;
            }
          } catch {
            // Use default age calculation
          }
        }

        if (isEstimatedAge) {
          // Estimate age based on data collection start date
          const dataStartDate = new Date('2025-04-01');
          ageInDays = Math.floor((shopVisit.visitDate.getTime() - dataStartDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Categorize age
        let ageCategory: InventoryItem['ageCategory'] = 'lessThan7Days';
        if (ageInDays > 60) ageCategory = 'over60Days';
        else if (ageInDays >= 30) ageCategory = 'days30to60';
        else if (ageInDays >= 15) ageCategory = 'days15to30';
        else if (ageInDays >= 7) ageCategory = 'days7to14';

        // Determine stock status
        const isNeverOrdered = reasonNoStock === 'Never Ordered';
        const isDiscontinued = reasonNoStock === 'Discontinued';
        const isOutOfStock = quantity === 0 && !isNeverOrdered && !isDiscontinued;
        const isLowStock = quantity > 0 && quantity < 5;
        const isInStock = quantity > 0 && !isLowStock;

        const inventoryItem: InventoryItem = {
          brand,
          quantity,
          isInStock,
          isLowStock,
          isOutOfStock,
          isNeverOrdered,
          isDiscontinued,
          reasonNoStock,
          ageInDays,
          ageCategory,
          supplyDate,
          isEstimatedAge
        };

        shopInventory.items[brand] = inventoryItem;
        shopInventory.totalItems++;

        if (isInStock) shopInventory.inStockCount++;
        else if (isLowStock) shopInventory.lowStockCount++;
        else if (isOutOfStock) shopInventory.outOfStockCount++;

        if (ageInDays >= 15) {
          shopInventory.agingInventoryCount++;
          
          // Add to aging locations
          if (quantity > 0) {
            topAgingLocations.push({
              sku: brand,
              shopName: shopInventory.shopName,
              department: shopInventory.department,
              salesman: shopInventory.salesman,
              ageInDays,
              quantity
            });
          }
        }

        // Track SKU performance
        if (!skuTracker[brand]) {
          skuTracker[brand] = {
            name: brand,
            trackedShops: 0,
            inStockCount: 0,
            outOfStockCount: 0,
            agingLocations: []
          };
        }

        skuTracker[brand].trackedShops++;
        if (isInStock) skuTracker[brand].inStockCount++;
        else if (isOutOfStock) skuTracker[brand].outOfStockCount++;

        if (ageInDays >= 15 && quantity > 0) {
          skuTracker[brand].agingLocations.push({
            shopName: shopInventory.shopName,
            department: shopInventory.department,
            salesman: shopInventory.salesman,
            ageInDays,
            quantity
          });
        }
      });

      shops[shopVisit.shopId] = shopInventory;
    });

    // Calculate SKU performance metrics
    const skuPerformance = Object.values(skuTracker).map((sku: any) => ({
      ...sku,
      outOfStockPercentage: sku.trackedShops > 0 ? Math.round((sku.outOfStockCount / sku.trackedShops) * 100) : 0
    })).sort((a, b) => b.outOfStockPercentage - a.outOfStockPercentage);

    // Sort aging locations
    topAgingLocations.sort((a, b) => b.ageInDays - a.ageInDays);

    // Calculate summary statistics
    const totalShops = Object.keys(shops).length;
    const visitedShops = totalShops;
    const totalSKUs = Object.keys(skuTracker).length;
    const totalOutOfStock = Object.values(shops).reduce((sum, shop) => sum + shop.outOfStockCount, 0);
    const totalLowStock = Object.values(shops).reduce((sum, shop) => sum + shop.lowStockCount, 0);
    const totalAging = Object.values(shops).reduce((sum, shop) => sum + shop.agingInventoryCount, 0);
    const avgAge = topAgingLocations.length > 0 ? 
      Math.round(topAgingLocations.reduce((sum, item) => sum + item.ageInDays, 0) / topAgingLocations.length) : 0;

    // Process salesman visit compliance
    const salesmenStats = Object.values(salesmenVisits).map((salesman: any) => ({
      name: salesman.name,
      totalVisits: salesman.totalVisits,
      uniqueShops: salesman.uniqueShops.size,
      avgPerDay: Math.round((salesman.totalVisits / 7) * 10) / 10,
      lastVisitDays: Math.floor((today.getTime() - salesman.lastVisitDate.getTime()) / (1000 * 60 * 60 * 24))
    })).sort((a, b) => b.totalVisits - a.totalVisits);

    return {
      summary: {
        totalShops,
        visitedShops,
        totalSKUs,
        totalOutOfStock,
        totalLowStock,
        totalAging,
        avgAge,
        coveragePercent: Math.round((visitedShops / totalShops) * 100)
      },
      shops,
      skuPerformance,
      topAgingLocations: topAgingLocations.slice(0, 20),
      visitCompliance: {
        totalSalesmen: salesmenStats.length,
        activeSalesmen: salesmenStats.filter(s => s.lastVisitDays <= 3).length,
        avgVisitsPerSalesman: Math.round(salesmenStats.reduce((sum, s) => sum + s.totalVisits, 0) / salesmenStats.length),
        salesmenStats
      }
    };
  };

  // ==========================================
  // FILTERING & UTILITIES
  // ==========================================

  const getFilteredShops = () => {
    if (!inventoryData) return [];
    
    return Object.values(inventoryData.shops).filter(shop => {
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

  const getDepartments = () => {
    if (!inventoryData) return [];
    return Array.from(new Set(Object.values(inventoryData.shops).map(shop => shop.department))).sort();
  };

  const getSalesmen = () => {
    if (!inventoryData) return [];
    return Array.from(new Set(Object.values(inventoryData.shops).map(shop => shop.salesman))).sort();
  };

  // ==========================================
  // COMPONENT LIFECYCLE
  // ==========================================

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // ==========================================
  // RENDER FUNCTIONS
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 animate-pulse mx-auto mb-4 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Inventory Dashboard</h2>
          <p className="text-gray-600">Processing inventory data from recent visits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 p-4 rounded-lg mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Data Loading Error</h2>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button
            onClick={fetchInventoryData}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!inventoryData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Inventory Data</h2>
          <p className="text-gray-600">No recent inventory data found.</p>
        </div>
      </div>
    );
  }

  const filteredShops = getFilteredShops();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 min-w-max">
            {[
              { id: 'overview', label: 'Inventory Overview', icon: BarChart3 },
              { id: 'shops', label: 'Shop Inventory', icon: ShoppingBag },
              { id: 'aging', label: 'Aging Analysis', icon: Clock },
              { id: 'visits', label: 'Visit Compliance', icon: Users },
              { id: 'alerts', label: 'Stock Alerts', icon: AlertTriangle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'overview' && <InventoryOverviewTab data={inventoryData} />}
        {activeTab === 'shops' && (
          <ShopInventoryTab 
            data={inventoryData} 
            filteredShops={filteredShops}
            filters={filters}
            setFilters={setFilters}
            departments={getDepartments()}
            salesmen={getSalesmen()}
            expandedShop={expandedShop}
            setExpandedShop={setExpandedShop}
          />
        )}
        {activeTab === 'aging' && <AgingAnalysisTab data={inventoryData} />}
        {activeTab === 'visits' && <VisitComplianceTab data={inventoryData} />}
        {activeTab === 'alerts' && <StockAlertsTab data={inventoryData} />}
      </main>
    </div>
  );
};

// ==========================================
// TAB COMPONENTS
// ==========================================

const InventoryOverviewTab = ({ data }: { data: InventoryData }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Inventory Overview</h2>
      <p className="text-gray-600">Real-time inventory status across all visited shops (Last 7 Days)</p>
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-blue-100">
            <ShoppingBag className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-2xl font-bold text-gray-900">{data.summary.visitedShops}</div>
            <div className="text-sm text-gray-500">Shops Visited</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="ml-4">
            <div className="text-2xl font-bold text-gray-900">{data.summary.totalOutOfStock}</div>
            <div className="text-sm text-gray-500">Out of Stock Items</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-yellow-100">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <div className="text-2xl font-bold text-gray-900">{data.summary.totalAging}</div>
            <div className="text-sm text-gray-500">Aging Items (15+ Days)</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-orange-100">
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <div className="text-2xl font-bold text-gray-900">{data.summary.totalLowStock}</div>
            <div className="text-sm text-gray-500">Low Stock Items</div>
          </div>
        </div>
      </div>
    </div>

    {/* SKU Performance */}
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">SKU Stock Status</h3>
        <p className="text-sm text-gray-500">Products with highest out-of-stock rates</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracked Shops</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">In Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Out of Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Rate</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.skuPerformance.slice(0, 10).map((sku, index) => (
              <tr key={sku.name}>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{sku.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sku.trackedShops}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{sku.inStockCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{sku.outOfStockCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    sku.outOfStockPercentage <= 10 ? 'bg-green-100 text-green-800' :
                    sku.outOfStockPercentage <= 30 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {100 - sku.outOfStockPercentage}% in stock
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const ShopInventoryTab = ({ 
  data, 
  filteredShops, 
  filters, 
  setFilters, 
  departments, 
  salesmen,
  expandedShop,
  setExpandedShop
}: any) => (
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
          onClick={() => setFilters({ department: '', salesman: '', stockStatus: '', ageCategory: '', searchText: '' })}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
        >
          <X className="w-4 h-4" />
          <span>Clear</span>
        </button>
      </div>
    </div>

    {/* Shop Inventory List */}
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Shop Inventory Status</h3>
        <p className="text-sm text-gray-500">Showing {filteredShops.length} shops</p>
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
                  <p className="text-sm text-gray-500">{shop.department} • {shop.salesman}</p>
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
                    <div className="text-xs text-gray-500">Aging</div>
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
                        {item.isInStock ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : item.isOutOfStock ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                        <div className="text-sm text-gray-600">Age: {item.ageInDays} days</div>
                        {item.reasonNoStock && (
                          <div className="text-xs text-red-600">{item.reasonNoStock}</div>
                        )}
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

const AgingAnalysisTab = ({ data }: { data: InventoryData }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Aging Inventory Analysis</h2>
      <p className="text-gray-600">Products aging 15+ days across all locations</p>
    </div>

    {/* Aging Statistics */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="text-3xl font-bold text-yellow-600">{data.summary.totalAging}</div>
        <div className="text-sm text-gray-500">Total Aging Items</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="text-3xl font-bold text-orange-600">{data.summary.avgAge}</div>
        <div className="text-sm text-gray-500">Average Age (Days)</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="text-3xl font-bold text-red-600">{data.topAgingLocations.length}</div>
        <div className="text-sm text-gray-500">Critical Locations</div>
      </div>
    </div>

    {/* Top Aging Locations */}
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Top 20 Aging Inventory Locations</h3>
        <p className="text-sm text-gray-500">Oldest inventory requiring immediate attention</p>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.topAgingLocations.map((location, index) => (
              <tr key={`${location.shopName}-${location.sku}`} className={index < 5 ? 'bg-red-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {index + 1}
                  {index < 5 && <span className="ml-2 text-red-600">🔥</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{location.sku}</td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{location.shopName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{location.department}</td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{location.salesman}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    location.ageInDays > 60 ? 'bg-red-100 text-red-800' :
                    location.ageInDays > 30 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {location.ageInDays}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{location.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    location.ageInDays > 60 ? 'bg-red-100 text-red-800' :
                    location.ageInDays > 30 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {location.ageInDays > 60 ? 'Critical' :
                     location.ageInDays > 30 ? 'High' : 'Medium'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const VisitComplianceTab = ({ data }: { data: InventoryData }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Visit Compliance Dashboard</h2>
      <p className="text-gray-600">Salesman visit frequency and compliance metrics (Last 7 Days)</p>
    </div>

    {/* Visit Summary */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="text-3xl font-bold text-blue-600">{data.visitCompliance.totalSalesmen}</div>
        <div className="text-sm text-gray-500">Total Salesmen</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="text-3xl font-bold text-green-600">{data.visitCompliance.activeSalesmen}</div>
        <div className="text-sm text-gray-500">Active (Last 3 Days)</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="text-3xl font-bold text-purple-600">{data.visitCompliance.avgVisitsPerSalesman}</div>
        <div className="text-sm text-gray-500">Avg Visits/Salesman</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="text-3xl font-bold text-orange-600">{data.summary.visitedShops}</div>
        <div className="text-sm text-gray-500">Shops Visited</div>
      </div>
    </div>

    {/* Salesman Performance */}
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Salesman Visit Performance</h3>
        <p className="text-sm text-gray-500">Individual visit statistics and compliance</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Visits</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unique Shops</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg/Day</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.visitCompliance.salesmenStats.map((salesman, index) => (
              <tr key={salesman.name} className={index < 3 ? 'bg-green-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {index + 1}
                  {index < 3 && <span className="ml-2">🏆</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{salesman.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.totalVisits}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.uniqueShops}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.avgPerDay}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.lastVisitDays} days ago</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    salesman.lastVisitDays <= 1 ? 'bg-green-100 text-green-800' :
                    salesman.lastVisitDays <= 3 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {salesman.lastVisitDays <= 1 ? 'Active' :
                     salesman.lastVisitDays <= 3 ? 'Recent' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const StockAlertsTab = ({ data }: { data: InventoryData }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Stock Alerts & Recommendations</h2>
      <p className="text-gray-600">Critical inventory alerts requiring immediate attention</p>
    </div>

    {/* Alert Summary */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
        <div className="flex items-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          <div className="ml-4">
            <div className="text-2xl font-bold text-red-600">{data.summary.totalOutOfStock}</div>
            <div className="text-sm text-red-700">Critical Out of Stock</div>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
        <div className="flex items-center">
          <Clock className="w-8 h-8 text-yellow-600" />
          <div className="ml-4">
            <div className="text-2xl font-bold text-yellow-600">{data.topAgingLocations.filter(loc => loc.ageInDays > 30).length}</div>
            <div className="text-sm text-yellow-700">Aging 30+ Days</div>
          </div>
        </div>
      </div>
      
      <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg">
        <div className="flex items-center">
          <TrendingUp className="w-8 h-8 text-orange-600" />
          <div className="ml-4">
            <div className="text-2xl font-bold text-orange-600">{data.summary.totalLowStock}</div>
            <div className="text-sm text-orange-700">Low Stock Items</div>
          </div>
        </div>
      </div>
    </div>

    {/* Critical SKUs */}
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          Critical SKUs (High Out-of-Stock Rate)
        </h3>
        <p className="text-sm text-gray-500">Products with 50%+ out-of-stock rate requiring immediate attention</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Out of Stock Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affected Shops</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action Required</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.skuPerformance.filter(sku => sku.outOfStockPercentage >= 50).map((sku, index) => (
              <tr key={sku.name} className="bg-red-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                  🚨 HIGH
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{sku.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    {sku.outOfStockPercentage}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sku.outOfStockCount}/{sku.trackedShops}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Immediate Replenishment</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Recommendations */}
    <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
      <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
        <Eye className="w-5 h-5 mr-2" />
        Recommendations
      </h3>
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
          <div>
            <div className="text-sm font-medium text-blue-900">Immediate Action Required</div>
            <div className="text-sm text-blue-700">
              {data.summary.totalOutOfStock} items are completely out of stock. Contact suppliers for emergency replenishment.
            </div>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
          <div>
            <div className="text-sm font-medium text-blue-900">Aging Inventory Management</div>
            <div className="text-sm text-blue-700">
              {data.topAgingLocations.filter(loc => loc.ageInDays > 30).length} items aging over 30 days. Consider promotions or redistribution.
            </div>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
          <div>
            <div className="text-sm font-medium text-blue-900">Visit Compliance</div>
            <div className="text-sm text-blue-700">
              {data.visitCompliance.salesmenStats.filter(s => s.lastVisitDays > 3).length} salesmen haven't visited in 3+ days. Schedule visits.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default InventoryDashboard;
