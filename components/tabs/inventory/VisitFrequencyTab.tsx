'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Calendar, Eye, MapPin, Users, Clock, TrendingUp, AlertCircle, CheckCircle, XCircle, Target, Zap, BarChart3, X } from 'lucide-react';

// ==========================================
// INVENTORY DATA TYPES
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
// VISIT FREQUENCY TAB COMPONENT - CORRECTED
// ==========================================

const VisitFrequencyTab = ({ data }: { data: InventoryData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalesman, setSelectedSalesman] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'shopName' | 'visits' | 'lastVisit' | 'status'>('visits');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showVisitDates, setShowVisitDates] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  // CORRECTED: Process shop visit data to count ALL visits within rolling period
  const processShopVisitData = useMemo(() => {
    const shopVisitData: any[] = [];
    
    // Create a map to track all visits per shop
    const shopVisitTracker = new Map<string, {
      shopInfo: any;
      allVisits: Array<{
        visitDate: Date;
        dateString: string;
        salesman: string;
      }>;
    }>();
    
    // First, collect all shop info and their visits
    Object.values(data.shops).forEach(shop => {
      if (!shopVisitTracker.has(shop.shopId)) {
        shopVisitTracker.set(shop.shopId, {
          shopInfo: shop,
          allVisits: []
        });
      }
      
      // Add this visit if it exists
      if (shop.visitDate) {
        shopVisitTracker.get(shop.shopId)!.allVisits.push({
          visitDate: shop.visitDate,
          dateString: shop.visitDate.toISOString().split('T')[0],
          salesman: shop.salesman || 'Unknown'
        });
      }
    });
    
    // Process each shop to create analytics
    shopVisitTracker.forEach((shopData, shopId) => {
      const shop = shopData.shopInfo;
      const visits = shopData.allVisits;
      
      // CORRECTED: Count all visits within the rolling period
      const visitCount = visits.length;
      const lastVisitDate = visits.length > 0 ? visits[visits.length - 1].visitDate : null;
      const daysSinceLastVisit = lastVisitDate ? 
        Math.floor((new Date().getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
      
      // Determine visit status based on frequency and recency
      let status: 'never_visited' | 'overdue' | 'active' | 'frequent' | 'over_visited' | 'visit_due' = 'never_visited';
      let statusColor = 'bg-red-100 text-red-800';
      let statusIcon = XCircle;
      
      if (visitCount === 0) {
        status = 'never_visited';
        statusColor = 'bg-red-100 text-red-800';
        statusIcon = XCircle;
      } else if (daysSinceLastVisit && daysSinceLastVisit > 14) {
        status = 'overdue';
        statusColor = 'bg-yellow-100 text-yellow-800';
        statusIcon = AlertCircle;
      } else if (daysSinceLastVisit && daysSinceLastVisit > 7) {
        status = 'visit_due';
        statusColor = 'bg-orange-100 text-orange-800';
        statusIcon = Clock;
      } else if (visitCount >= 10) {
        status = 'over_visited';
        statusColor = 'bg-purple-100 text-purple-800';
        statusIcon = Zap;
      } else if (visitCount >= 5) {
        status = 'frequent';
        statusColor = 'bg-blue-100 text-blue-800';
        statusIcon = TrendingUp;
      } else {
        status = 'active';
        statusColor = 'bg-green-100 text-green-800';
        statusIcon = CheckCircle;
      }
      
      // Create visit dates array for modal
      const visitDates = visits.map(visit => visit.dateString).sort((a, b) => b.localeCompare(a));
      
      // Calculate visit frequency per week
      const visitFrequency = visitCount > 0 ? 
        (visitCount / (data.summary.rollingPeriodDays / 7)).toFixed(1) : '0';
      
      shopVisitData.push({
        shopId: shop.shopId,
        shopName: shop.shopName,
        department: shop.department,
        salesman: shop.salesman || 'Unassigned',
        visitCount, // CORRECTED: Now shows total visits in period
        lastVisitDate,
        daysSinceLastVisit,
        status,
        statusColor,
        statusIcon,
        statusLabel: status.replace('_', ' ').toUpperCase(),
        visitDates,
        visitFrequency: parseFloat(visitFrequency),
        dataSource: shop.dataSource,
        salesmanUid: shop.salesmanUid || '',
        allVisits: visits
      });
    });
    
    return shopVisitData;
  }, [data.shops, data.summary.rollingPeriodDays]);

  // Get unique values for filters
  const uniqueSalesmen = useMemo(() => {
    const salesmen = Array.from(new Set(processShopVisitData.map(shop => shop.salesman)));
    return salesmen.filter(s => s && s !== 'Unassigned').sort();
  }, [processShopVisitData]);

  const uniqueDepartments = useMemo(() => {
    const departments = Array.from(new Set(processShopVisitData.map(shop => shop.department)));
    return departments.filter(d => d).sort();
  }, [processShopVisitData]);

  const statusOptions = [
    { value: 'never_visited', label: 'Never Visited', color: 'text-red-600' },
    { value: 'overdue', label: 'Overdue', color: 'text-yellow-600' },
    { value: 'visit_due', label: 'Visit Due', color: 'text-orange-600' },
    { value: 'active', label: 'Active', color: 'text-green-600' },
    { value: 'frequent', label: 'Frequent', color: 'text-blue-600' },
    { value: 'over_visited', label: 'Over-visited', color: 'text-purple-600' }
  ];

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = processShopVisitData.filter(shop => {
      const matchesSearch = shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           shop.shopId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSalesman = selectedSalesman === 'All' || shop.salesman === selectedSalesman;
      const matchesDepartment = selectedDepartment === 'All' || shop.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'All' || shop.status === selectedStatus;
      
      return matchesSearch && matchesSalesman && matchesDepartment && matchesStatus;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'lastVisit') {
        aValue = a.lastVisitDate ? new Date(a.lastVisitDate).getTime() : 0;
        bValue = b.lastVisitDate ? new Date(b.lastVisitDate).getTime() : 0;
      }
      
      if (sortBy === 'shopName' || sortBy === 'status') {
        aValue = aValue?.toString().toLowerCase() || '';
        bValue = bValue?.toString().toLowerCase() || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [processShopVisitData, searchTerm, selectedSalesman, selectedDepartment, selectedStatus, sortBy, sortOrder]);

  // CORRECTED: Calculate status distribution based on actual visit counts
  const statusDistribution = useMemo(() => {
    const distribution = processShopVisitData.reduce((acc, shop) => {
      acc[shop.status] = (acc[shop.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return statusOptions.map(option => ({
      ...option,
      count: distribution[option.value] || 0
    }));
  }, [processShopVisitData]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CORRECTED: Export CSV function with accurate visit counts
  const exportToCSV = () => {
    const csvData = [
      ['Shop Name', 'Shop ID', 'Department', 'Salesman', 'Visit Count', 'Visit Frequency (per week)', 'Last Visit', 'Days Since Last Visit', 'Status', 'Data Source', 'Visit Dates'].join(','),
      ...filteredAndSortedData.map(shop => [
        `"${shop.shopName}"`,
        `"${shop.shopId}"`,
        `"${shop.department}"`,
        `"${shop.salesman}"`,
        shop.visitCount,
        shop.visitFrequency,
        shop.lastVisitDate ? new Date(shop.lastVisitDate).toLocaleDateString() : 'Never',
        shop.daysSinceLastVisit || 'N/A',
        `"${shop.statusLabel}"`,
        `"${shop.dataSource}"`,
        `"${shop.visitDates.join('; ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visit_frequency_detailed_${data.summary.rollingPeriodDays}days_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle sort change
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // CORRECTED: Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalVisits = processShopVisitData.reduce((sum, shop) => sum + shop.visitCount, 0);
    const avgVisitsPerShop = processShopVisitData.length > 0 ? 
      (totalVisits / processShopVisitData.length).toFixed(1) : '0';
    const maxVisits = Math.max(...processShopVisitData.map(shop => shop.visitCount));
    const shopsWithMultipleVisits = processShopVisitData.filter(shop => shop.visitCount > 1).length;
    
    return {
      totalVisits,
      avgVisitsPerShop,
      maxVisits,
      shopsWithMultipleVisits
    };
  }, [processShopVisitData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Visit Frequency & Shop Analysis</h2>
        <p className="text-gray-600">Detailed shop-by-shop visit patterns and frequency analysis</p>
        <p className="text-sm text-gray-500">
          Period: {data.summary.periodStartDate.toLocaleDateString()} - {data.summary.periodEndDate.toLocaleDateString()} 
          ({data.summary.rollingPeriodDays} days)
        </p>
        <div className="mt-2 flex justify-center space-x-6 text-sm text-gray-600">
          <span>Total Visits: <strong>{summaryStats.totalVisits}</strong></span>
          <span>Avg per Shop: <strong>{summaryStats.avgVisitsPerShop}</strong></span>
          <span>Max Visits: <strong>{summaryStats.maxVisits}</strong></span>
          <span>Multi-Visit Shops: <strong>{summaryStats.shopsWithMultipleVisits}</strong></span>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statusDistribution.map((status, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow text-center">
            <div className={`text-2xl font-bold ${status.color}`}>{status.count}</div>
            <div className="text-sm text-gray-500">{status.label}</div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search shops by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Salesman Filter */}
          <select
            value={selectedSalesman}
            onChange={(e) => setSelectedSalesman(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Salesmen</option>
            {uniqueSalesmen.map(salesman => (
              <option key={salesman} value={salesman}>{salesman}</option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Departments</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || selectedSalesman !== 'All' || selectedDepartment !== 'All' || selectedStatus !== 'All') && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                Search: "{searchTerm}"
                <X className="w-4 h-4 ml-1 cursor-pointer" onClick={() => setSearchTerm('')} />
              </span>
            )}
            {selectedSalesman !== 'All' && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                Salesman: {selectedSalesman}
                <X className="w-4 h-4 ml-1 cursor-pointer" onClick={() => setSelectedSalesman('All')} />
              </span>
            )}
            {selectedDepartment !== 'All' && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                Department: {selectedDepartment}
                <X className="w-4 h-4 ml-1 cursor-pointer" onClick={() => setSelectedDepartment('All')} />
              </span>
            )}
            {selectedStatus !== 'All' && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                Status: {statusOptions.find(s => s.value === selectedStatus)?.label}
                <X className="w-4 h-4 ml-1 cursor-pointer" onClick={() => setSelectedStatus('All')} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Showing {paginatedData.length} of {filteredAndSortedData.length} shops
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value as typeof sortBy)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="shopName">Shop Name</option>
              <option value="visits">Visit Count</option>
              <option value="lastVisit">Last Visit</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Detailed Shop Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('shopName')}
                >
                  Shop Details
                  {sortBy === 'shopName' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salesman
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('visits')}
                >
                  Visit Count ({data.summary.rollingPeriodDays}d)
                  {sortBy === 'visits' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency/Week
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastVisit')}
                >
                  Last Visit
                  {sortBy === 'lastVisit' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status
                  {sortBy === 'status' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((shop, index) => (
                <tr key={shop.shopId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{shop.shopName}</div>
                      <div className="text-sm text-gray-500">{shop.shopId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{shop.department}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{shop.salesman}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setShowVisitDates(showVisitDates === shop.shopId ? null : shop.shopId)}
                      className={`text-sm font-medium px-3 py-1 rounded-full ${
                        shop.visitCount > 0 
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {shop.visitCount} visits
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {shop.visitFrequency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {shop.lastVisitDate 
                      ? new Date(shop.lastVisitDate).toLocaleDateString()
                      : 'Never'
                    }
                    {shop.daysSinceLastVisit && (
                      <div className="text-xs text-gray-500">
                        ({shop.daysSinceLastVisit} days ago)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${shop.statusColor}`}>
                      <shop.statusIcon className="w-3 h-3 mr-1" />
                      {shop.statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => setShowVisitDates(showVisitDates === shop.shopId ? null : shop.shopId)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Visit Dates Modal - CORRECTED */}
      {showVisitDates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Visit Dates</h3>
              <button
                onClick={() => setShowVisitDates(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {(() => {
              const shop = processShopVisitData.find(s => s.shopId === showVisitDates);
              return shop ? (
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Shop: <span className="font-medium">{shop.shopName}</span></p>
                    <p className="text-sm text-gray-600">Total Visits: <span className="font-medium">{shop.visitCount}</span></p>
                    <p className="text-sm text-gray-600">Frequency: <span className="font-medium">{shop.visitFrequency} per week</span></p>
                  </div>
                  
                  <div className="space-y-2">
                    {shop.visitDates.length > 0 ? (
                      shop.visitDates.map((date: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{new Date(date).toLocaleDateString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No visit dates recorded</p>
                    )}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitFrequencyTab;
