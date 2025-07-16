'use client';

import React from 'react';
import { Package, AlertTriangle, Clock, TrendingUp, ShoppingBag, Truck } from 'lucide-react';

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
  skuPerformance: Array<{
    name: string;
    trackedShops: number;
    inStockCount: number;
    outOfStockCount: number;
    restockedCount: number;
    outOfStockPercentage: number;
    agingLocations: Array<any>;
  }>;
  allAgingLocations: Array<any>;
  outOfStockItems: Array<any>;
  visitCompliance: {
    totalSalesmen: number;
    activeSalesmen: number;
    rollingPeriodVisits: number;
    todayVisits: number;
    yesterdayVisits: number;
    lastWeekVisits: number;
    salesmenStats: Array<{
      name: string;
      rollingPeriodVisits: number;
      uniqueShops: number;
      todayVisits: number;
      yesterdayVisits: number;
      lastWeekVisits: number;
    }>;
  };
}

// ==========================================
// INDEPENDENT OVERVIEW TAB COMPONENT
// ==========================================

const OverviewTab = ({ data }: { data: InventoryData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Inventory Overview with Master Data Integration</h2>
        <p className="text-gray-600">
          Real-time inventory status with master data integration ({data.summary.rollingPeriodDays}-Day Rolling Period)
        </p>
        <p className="text-sm text-gray-500">
          Period: {data.summary.periodStartDate.toLocaleDateString()} - {data.summary.periodEndDate.toLocaleDateString()}
        </p>
        <p className="text-xs text-green-600">
          Master Data Coverage: {data.summary.masterDataIntegration.assignmentCoverage}% ({data.summary.masterDataIntegration.totalMasterShops} total shops)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{data.summary.totalShops}</div>
              <div className="text-sm text-gray-500">Total Shops</div>
              <div className="text-xs text-blue-600">{data.summary.visitedShops} visited</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{data.summary.totalSKUs}</div>
              <div className="text-sm text-gray-500">SKUs Tracked</div>
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
              <div className="text-sm text-gray-500">Aging Items (30+ Days)</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{data.summary.recentlyRestockedItems}</div>
              <div className="text-sm text-gray-500">Recently Restocked</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced SKU Performance with RESTOCKED Column */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Enhanced SKU Stock Status with Restocked Tracking</h3>
          <p className="text-sm text-gray-500">Complete inventory status with master data integration and restocked column ({data.summary.rollingPeriodDays}-day rolling period)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracked Shops</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">In Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Out of Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">🆕 Restocked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aging Locations</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.skuPerformance.slice(0, 20).map((sku, index) => (
                <tr key={sku.name}>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{sku.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sku.trackedShops}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{sku.inStockCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{sku.outOfStockCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      <Truck className="w-3 h-3 mr-1" />
                      {sku.restockedCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sku.outOfStockPercentage <= 10 ? 'bg-green-100 text-green-800' :
                      sku.outOfStockPercentage <= 30 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {100 - sku.outOfStockPercentage}% in stock
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{sku.agingLocations.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
