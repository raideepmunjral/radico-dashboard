'use client';

import React from 'react';

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
// INDEPENDENT VISIT COMPLIANCE TAB COMPONENT
// ==========================================

const VisitComplianceTab = ({ data }: { data: InventoryData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Visit Compliance Dashboard with Today's Tracking</h2>
        <p className="text-gray-600">Enhanced visit metrics with master data integration and today's visit tracking ({data.summary.rollingPeriodDays}-day rolling period)</p>
        <p className="text-sm text-gray-500">
          Period: {data.summary.periodStartDate.toLocaleDateString()} - {data.summary.periodEndDate.toLocaleDateString()}
        </p>
      </div>

      {/* Enhanced Visit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-3xl font-bold text-blue-600">{data.visitCompliance.totalSalesmen}</div>
          <div className="text-sm text-gray-500">Total Salesmen</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-3xl font-bold text-green-600">{data.visitCompliance.rollingPeriodVisits}</div>
          <div className="text-sm text-gray-500">Total {data.summary.rollingPeriodDays}-Day Visits</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-3xl font-bold text-orange-600">{data.visitCompliance.todayVisits}</div>
          <div className="text-sm text-gray-500">🆕 Today's Visits</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-3xl font-bold text-purple-600">{data.visitCompliance.yesterdayVisits}</div>
          <div className="text-sm text-gray-500">Yesterday's Visits</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-3xl font-bold text-teal-600">{data.visitCompliance.lastWeekVisits}</div>
          <div className="text-sm text-gray-500">Last 7 Days</div>
        </div>
      </div>

      {/* Enhanced Salesman Performance with Today's Visits */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Enhanced {data.summary.rollingPeriodDays}-Day Rolling Salesman Performance with Today's Tracking</h3>
          <p className="text-sm text-gray-500">Individual visit statistics with master data integration and real-time today's visits (Last {data.summary.rollingPeriodDays} Days)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total {data.summary.rollingPeriodDays}-Day Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unique Shops</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">🆕 Today's Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yesterday Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last 7 Days</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{salesman.rollingPeriodVisits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.uniqueShops}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      salesman.todayVisits > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {salesman.todayVisits > 0 && <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>}
                      {salesman.todayVisits}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">{salesman.yesterdayVisits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{salesman.lastWeekVisits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VisitComplianceTab;
