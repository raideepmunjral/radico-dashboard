'use client';

import React, { useState } from 'react';
import { Users, Calendar, MapPin, Target, AlertCircle, CheckCircle, XCircle, TrendingUp, Clock } from 'lucide-react';

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
// ENHANCED VISIT COMPLIANCE TAB COMPONENT
// ==========================================

const VisitComplianceTab = ({ data }: { data: InventoryData }) => {
  const [selectedSalesman, setSelectedSalesman] = useState<string>('All');
  const [showUnvisitedOnly, setShowUnvisitedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'coverage' | 'visits' | 'shops'>('visits');

  // Process visit patterns from existing data
  const processVisitPatterns = () => {
    const visitPatterns: Record<string, any> = {};
    const shopAssignments: Record<string, any> = {};
    
    // Get all shop assignments and visit data
    Object.values(data.shops).forEach(shop => {
      const salesman = shop.salesman || 'Unknown';
      
      if (!shopAssignments[salesman]) {
        shopAssignments[salesman] = {
          assignedShops: 0,
          visitedShops: 0,
          shopDetails: []
        };
      }
      
      shopAssignments[salesman].assignedShops++;
      
      const shopDetail = {
        shopId: shop.shopId,
        shopName: shop.shopName,
        department: shop.department,
        lastVisited: shop.visitDate,
        daysSinceLastVisit: shop.lastVisitDays,
        wasVisited: shop.visitDate !== null,
        dataSource: shop.dataSource,
        salesmanUid: shop.salesmanUid || ''
      };
      
      shopAssignments[salesman].shopDetails.push(shopDetail);
      
      if (shop.visitDate) {
        shopAssignments[salesman].visitedShops++;
      }
    });
    
    return { visitPatterns, shopAssignments };
  };

  const { visitPatterns, shopAssignments } = processVisitPatterns();

  // Calculate visit frequency distribution
  const getVisitFrequencyDistribution = () => {
    const frequencies = {
      unvisited: 0,
      occasional: 0, // 1-2 visits
      regular: 0,    // 3-6 visits  
      frequent: 0    // 7+ visits
    };
    
    data.visitCompliance.salesmenStats.forEach(salesman => {
      if (salesman.rollingPeriodVisits === 0) frequencies.unvisited++;
      else if (salesman.rollingPeriodVisits <= 2) frequencies.occasional++;
      else if (salesman.rollingPeriodVisits <= 6) frequencies.regular++;
      else frequencies.frequent++;
    });
    
    return frequencies;
  };

  const frequencyDistribution = getVisitFrequencyDistribution();

  // Get unvisited shops analysis
  const getUnvisitedShopsAnalysis = () => {
    const unvisitedShops: any[] = [];
    
    Object.entries(shopAssignments).forEach(([salesman, assignment]) => {
      assignment.shopDetails.forEach((shop: any) => {
        if (!shop.wasVisited) {
          unvisitedShops.push({
            ...shop,
            salesman: salesman
          });
        }
      });
    });
    
    return unvisitedShops;
  };

  const unvisitedShops = getUnvisitedShopsAnalysis();

  // Get overdue shops (visited but not recently)
  const getOverdueShops = () => {
    const overdueShops: any[] = [];
    
    Object.entries(shopAssignments).forEach(([salesman, assignment]) => {
      assignment.shopDetails.forEach((shop: any) => {
        if (shop.wasVisited && shop.daysSinceLastVisit && shop.daysSinceLastVisit > 7) {
          overdueShops.push({
            ...shop,
            salesman: salesman
          });
        }
      });
    });
    
    return overdueShops.sort((a, b) => (b.daysSinceLastVisit || 0) - (a.daysSinceLastVisit || 0));
  };

  const overdueShops = getOverdueShops();

  // Calculate territory insights
  const getTerritoryInsights = () => {
    const totalAssignedShops = Object.values(shopAssignments).reduce((sum, assignment) => sum + assignment.assignedShops, 0);
    const totalVisitedShops = Object.values(shopAssignments).reduce((sum, assignment) => sum + assignment.visitedShops, 0);
    const averageCoverage = totalAssignedShops > 0 ? Math.round((totalVisitedShops / totalAssignedShops) * 100) : 0;
    
    return {
      totalAssignedShops,
      totalVisitedShops,
      averageCoverage,
      unvisitedCount: unvisitedShops.length,
      overdueCount: overdueShops.length
    };
  };

  const territoryInsights = getTerritoryInsights();

  // Enhanced salesman data with assignments
  const getEnhancedSalesmenData = () => {
    return data.visitCompliance.salesmenStats.map(salesman => {
      const assignment = shopAssignments[salesman.name] || { assignedShops: 0, visitedShops: 0 };
      const totalVisits = salesman.rollingPeriodVisits;
      const avgVisitsPerShop = assignment.visitedShops > 0 ? (totalVisits / assignment.visitedShops).toFixed(1) : '0';
      const coverage = assignment.assignedShops > 0 ? Math.round((assignment.visitedShops / assignment.assignedShops) * 100) : 0;
      
      return {
        ...salesman,
        assignedShops: assignment.assignedShops,
        visitedShops: assignment.visitedShops,
        coverage,
        avgVisitsPerShop: parseFloat(avgVisitsPerShop),
        efficiency: totalVisits > 0 ? Math.round((assignment.visitedShops / totalVisits) * 100) : 0
      };
    }).sort((a, b) => {
      if (sortBy === 'coverage') return b.coverage - a.coverage;
      if (sortBy === 'shops') return b.assignedShops - a.assignedShops;
      return b.rollingPeriodVisits - a.rollingPeriodVisits;
    });
  };

  const enhancedSalesmenData = getEnhancedSalesmenData();

  // Filter functions
  const filteredUnvisitedShops = showUnvisitedOnly ? 
    unvisitedShops : 
    [...unvisitedShops, ...overdueShops].slice(0, 50);

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Visit Compliance & Territory Management</h2>
        <p className="text-gray-600">Complete visit analytics with shop assignments and territory coverage ({data.summary.rollingPeriodDays}-day rolling period)</p>
        <p className="text-sm text-gray-500">
          Period: {data.summary.periodStartDate.toLocaleDateString()} - {data.summary.periodEndDate.toLocaleDateString()}
        </p>
        <p className="text-xs text-green-600">
          Master Data Integration: {data.summary.masterDataIntegration.assignmentCoverage}% coverage
        </p>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">{data.visitCompliance.totalSalesmen}</div>
          <div className="text-sm text-gray-500">Total Salesmen</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">{data.visitCompliance.rollingPeriodVisits}</div>
          <div className="text-sm text-gray-500">{data.summary.rollingPeriodDays}-Day Visits</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-purple-600">{territoryInsights.totalAssignedShops}</div>
          <div className="text-sm text-gray-500">Assigned Shops</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-teal-600">{territoryInsights.totalVisitedShops}</div>
          <div className="text-sm text-gray-500">Visited Shops</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-orange-600">{data.visitCompliance.todayVisits}</div>
          <div className="text-sm text-gray-500">🆕 Today's Visits</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-red-600">{unvisitedShops.length}</div>
          <div className="text-sm text-gray-500">Unvisited Shops</div>
        </div>
      </div>

      {/* Territory Coverage Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Territory Coverage Analysis</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'coverage' | 'visits' | 'shops')}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="visits">Total Visits</option>
                <option value="coverage">Coverage %</option>
                <option value="shops">Assigned Shops</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Shops</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visited Shops</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coverage %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Visits/Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">🆕 Today</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yesterday</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last 7 Days</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {enhancedSalesmenData.map((salesman, index) => (
                <tr key={salesman.name} className={index < 3 ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index + 1}
                    {index < 3 && <span className="ml-2">🏆</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{salesman.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.assignedShops}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{salesman.visitedShops}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      salesman.coverage >= 80 ? 'bg-green-100 text-green-800' :
                      salesman.coverage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {salesman.coverage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{salesman.rollingPeriodVisits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.avgVisitsPerShop}</td>
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

      {/* Problem Areas Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unvisited Shops */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <XCircle className="w-5 h-5 mr-2 text-red-500" />
                Unvisited Shops
              </h3>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                {unvisitedShops.length} shops
              </span>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="p-4 space-y-3">
              {unvisitedShops.slice(0, 10).map((shop, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{shop.shopName}</p>
                      <p className="text-xs text-gray-500">{shop.shopId} • {shop.department}</p>
                      <p className="text-xs text-gray-600">Assigned to: {shop.salesman}</p>
                    </div>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Never visited
                    </span>
                  </div>
                </div>
              ))}
              {unvisitedShops.length > 10 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  +{unvisitedShops.length - 10} more unvisited shops
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Shops */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-yellow-500" />
                Overdue Shops
              </h3>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                {overdueShops.length} shops
              </span>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="p-4 space-y-3">
              {overdueShops.slice(0, 10).map((shop, index) => (
                <div key={index} className="border-l-4 border-yellow-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{shop.shopName}</p>
                      <p className="text-xs text-gray-500">{shop.shopId} • {shop.department}</p>
                      <p className="text-xs text-gray-600">Assigned to: {shop.salesman}</p>
                      <p className="text-xs text-gray-600">
                        Last visited: {shop.lastVisited ? new Date(shop.lastVisited).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {shop.daysSinceLastVisit} days ago
                    </span>
                  </div>
                </div>
              ))}
              {overdueShops.length > 10 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  +{overdueShops.length - 10} more overdue shops
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visit Frequency Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Salesman Visit Frequency Distribution
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Frequent (7+ visits)', count: frequencyDistribution.frequent, color: 'bg-green-500' },
              { label: 'Regular (3-6 visits)', count: frequencyDistribution.regular, color: 'bg-blue-500' },
              { label: 'Occasional (1-2 visits)', count: frequencyDistribution.occasional, color: 'bg-yellow-500' },
              { label: 'No visits', count: frequencyDistribution.unvisited, color: 'bg-red-500' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${item.color} mr-2`}></div>
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{item.count} salesmen</span>
              </div>
            ))}
          </div>
        </div>

        {/* Territory Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Territory Management Insights
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{unvisitedShops.length} shops never visited</p>
                <p className="text-xs text-gray-500">Require immediate attention</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{overdueShops.length} shops overdue</p>
                <p className="text-xs text-gray-500">Not visited in 7+ days</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{territoryInsights.averageCoverage}% average coverage</p>
                <p className="text-xs text-gray-500">Across all territories</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{data.summary.masterDataIntegration.assignmentCoverage}% master data coverage</p>
                <p className="text-xs text-gray-500">Shop assignments from master data</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitComplianceTab;
