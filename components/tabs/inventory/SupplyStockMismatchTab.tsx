/*
  ==========================================
  IMPORTANT: MAIN DASHBOARD INTEGRATION
  ==========================================
  
  To enable actual case quantity detection, add this to your main dashboard:
  
  1. In the processEnhancedInventoryDataWithMaster function, add:
     
     rawSupplyData: {
       recentSupplies,
       supplyHistory,
       pendingChallansData: pendingChallans
     }
     
  2. This will allow the component to read actual case quantities instead of hardcoding 1 case
  
  ==========================================
*/

'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, AlertTriangle, Phone, Eye, MapPin, Clock, Package, TrendingUp, Filter, Download } from 'lucide-react';

// ==========================================
// TYPES AND INTERFACES
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
  rawVisitData?: {
    rollingPeriodRows: any[][];
    columnIndices: any;
    shopSalesmanMap: Map<string, any>;
    rollingDays: number;
    parseDate: (dateStr: string) => Date | null;
  };
  // Add supply data for actual case quantities
  rawSupplyData?: {
    recentSupplies: Record<string, Date>;
    supplyHistory: Record<string, Date>;
    pendingChallansData: any[][];
  };
}

interface SuspiciousReport {
  id: string;
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  salesmanUid?: string;
  visitDate: Date;
  sku: string;
  reportedStock: number;
  lastSupplyDate: Date;
  daysSinceSupply: number;
  bottleSize: string;
  casesSupplied: number;
  bottlesSupplied: number;
  conversionRate: number;
  expectedDailyConsumption: number;
  theoreticalRemaining: number;
  alertSeverity: 'critical' | 'high' | 'medium' | 'low';
  suspicionScore: number;
  reasonNoStock: string;
  supplySources: string[];
  investigationStatus: 'pending' | 'investigating' | 'resolved' | 'false_positive';
  notes: string;
}

interface MismatchFilters {
  department: string;
  salesman: string;
  severity: string;
  bottleSize: string;
  daysSinceSupply: string;
  searchText: string;
}

// ==========================================
// MAIN COMPONENT
// ==========================================

const SupplyStockMismatchTab = ({ data }: { data: InventoryData }) => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [filters, setFilters] = useState<MismatchFilters>({
    department: '',
    salesman: '',
    severity: '',
    bottleSize: '',
    daysSinceSupply: '',
    searchText: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof SuspiciousReport>('suspicionScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [detectionThreshold, setDetectionThreshold] = useState(7); // days
  const itemsPerPage = 25;

  // ==========================================
  // BOTTLE SIZE CONVERSION LOGIC
  // ==========================================
  const getBottleSizeInfo = (skuName: string): { size: string; conversionRate: number; expectedDailyConsumption: number } => {
    const sku = skuName.toUpperCase();
    
    // Extract size from SKU name
    if (sku.includes('750') || sku.includes('750ML')) {
      return { size: '750ml', conversionRate: 12, expectedDailyConsumption: 2 };
    } else if (sku.includes('375') || sku.includes('375ML')) {
      return { size: '375ml', conversionRate: 24, expectedDailyConsumption: 4 };
    } else if (sku.includes('180') || sku.includes('180ML') || sku.includes('180P')) {
      return { size: '180ml', conversionRate: 48, expectedDailyConsumption: 8 };
    } else if (sku.includes('90') || sku.includes('90ML') || sku.includes('90P')) {
      return { size: '90ml', conversionRate: 96, expectedDailyConsumption: 15 };
    } else if (sku.includes('60') || sku.includes('60ML') || sku.includes('60P')) {
      return { size: '60ml', conversionRate: 150, expectedDailyConsumption: 25 };
    }
    
    // Default to 750ml if size cannot be determined
    return { size: '750ml', conversionRate: 12, expectedDailyConsumption: 2 };
  };

  // ==========================================
  // ACTUAL SUPPLY DATA FUNCTIONS
  // ==========================================
  const createMultipleBrandKeys = (shopId: string, brandName: string, size?: string): string[] => {
    const brandInfo = getBottleSizeInfo(brandName);
    const actualSize = size || brandInfo.size.replace('ml', '');
    
    const keys = [
      `${shopId}_${brandName.toUpperCase()}_${actualSize}`,
      `${shopId}_${brandName.toUpperCase()}`,
      `${shopId}_${brandName}`,
    ];
    
    return [...new Set(keys)];
  };

  const getActualSupplyData = (shopId: string, brandName: string, lastSupplyDate: Date): number => {
    // Try to get actual supply data from pending challans
    if (data.rawSupplyData?.pendingChallansData) {
      const pendingChallans = data.rawSupplyData.pendingChallansData;
      
      if (pendingChallans.length > 1) {
        const headers = pendingChallans[0];
        const rows = pendingChallans.slice(1);
        
        // Column indices for Pending Challans (as per main dashboard)
        const challansDateIndex = 1;
        const shopIdIndex = 8;
        const brandIndex = 11;
        const sizeIndex = 12;
        const casesIndex = 14;
        
        // Find matching supply record
        for (const row of rows) {
          if (row.length > Math.max(shopIdIndex, brandIndex, casesIndex)) {
            const rowShopId = row[shopIdIndex]?.toString().trim();
            const rowBrand = row[brandIndex]?.toString().trim();
            const rowSize = row[sizeIndex]?.toString().trim() || '';
            const rowDateStr = row[challansDateIndex]?.toString().trim();
            const rowCases = parseFloat(row[casesIndex]) || 0;
            
            if (rowShopId === shopId && rowBrand && rowCases > 0) {
              // Check if brand matches (basic matching)
              if (rowBrand.toUpperCase().includes(brandName.toUpperCase().split(' ')[0]) ||
                  brandName.toUpperCase().includes(rowBrand.toUpperCase().split(' ')[0])) {
                
                // Check if date matches approximately
                if (rowDateStr) {
                  const rowDate = new Date(rowDateStr);
                  if (!isNaN(rowDate.getTime())) {
                    const daysDiff = Math.abs(rowDate.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24);
                    if (daysDiff <= 2) { // Within 2 days
                      return rowCases;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Fallback to 1 case if no matching data found
    return 1;
  };

  const calculateAlertSeverity = (
    daysSinceSupply: number, 
    bottleSize: string, 
    casesSupplied: number, 
    theoreticalRemaining: number
  ): { severity: 'critical' | 'high' | 'medium' | 'low'; score: number } => {
    let score = 0;
    let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
    
    // Base score on days since supply
    if (daysSinceSupply <= 1) score += 100;
    else if (daysSinceSupply <= 2) score += 80;
    else if (daysSinceSupply <= 3) score += 60;
    else if (daysSinceSupply <= 5) score += 40;
    else if (daysSinceSupply <= 7) score += 20;
    
    // Adjust for bottle size (smaller bottles = higher consumption expected)
    const sizeMultiplier = {
      '750ml': 1.5,
      '375ml': 1.2,
      '180ml': 1.0,
      '90ml': 0.8,
      '60ml': 0.6
    }[bottleSize] || 1.0;
    
    score = score * sizeMultiplier;
    
    // Adjust for supply volume
    if (casesSupplied >= 5) score += 30;
    else if (casesSupplied >= 3) score += 20;
    else if (casesSupplied >= 2) score += 10;
    
    // Adjust for theoretical remaining (higher remaining = more suspicious)
    if (theoreticalRemaining >= 50) score += 25;
    else if (theoreticalRemaining >= 30) score += 15;
    else if (theoreticalRemaining >= 20) score += 10;
    
    // Determine severity
    if (score >= 120) severity = 'critical';
    else if (score >= 80) severity = 'high';
    else if (score >= 50) severity = 'medium';
    else severity = 'low';
    
    return { severity, score: Math.round(score) };
  };

  // ==========================================
  // CSV EXPORT FUNCTIONALITY
  // ==========================================
  const exportSupplyMismatchCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Header
      csvContent += "SUPPLY-STOCK MISMATCH DETECTION REPORT\n";
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `Period: ${data.summary.periodStartDate.toLocaleDateString()} - ${data.summary.periodEndDate.toLocaleDateString()}\n`;
      csvContent += `Detection Threshold: ${detectionThreshold} days\n`;
      csvContent += `Total Suspicious Reports: ${filteredReports.length}\n`;
      csvContent += `Critical: ${stats.critical} | High: ${stats.high} | Medium: ${stats.medium} | Low: ${stats.low}\n\n`;
      
      // Column headers
      csvContent += "Severity,Shop Name,Shop ID,Department,Salesman,SKU,Bottle Size,Supply Date,Visit Date,Days Since Supply,Cases Delivered,Bottles Delivered,Expected Daily Consumption,Expected Consumed,Should Still Have,Actually Reported,Missing Bottles,Suspicion Score,Reason Given,Investigation Status\n";
      
      // Data rows
      filteredReports.forEach(report => {
        const expectedConsumed = report.daysSinceSupply * report.expectedDailyConsumption;
        const missingBottles = Math.round(report.theoreticalRemaining);
        
        csvContent += `"${report.alertSeverity.toUpperCase()}",`;
        csvContent += `"${report.shopName}",`;
        csvContent += `"${report.shopId}",`;
        csvContent += `"${report.department}",`;
        csvContent += `"${report.salesman}",`;
        csvContent += `"${report.sku}",`;
        csvContent += `"${report.bottleSize}",`;
        csvContent += `"${report.lastSupplyDate.toLocaleDateString('en-GB')}",`;
        csvContent += `"${report.visitDate.toLocaleDateString('en-GB')}",`;
        csvContent += `"${report.daysSinceSupply}",`;
        csvContent += `"${report.casesSupplied}",`;
        csvContent += `"${report.bottlesSupplied}",`;
        csvContent += `"${report.expectedDailyConsumption}",`;
        csvContent += `"${expectedConsumed}",`;
        csvContent += `"${Math.round(report.theoreticalRemaining)}",`;
        csvContent += `"${report.reportedStock}",`;
        csvContent += `"${missingBottles}",`;
        csvContent += `"${report.suspicionScore}",`;
        csvContent += `"${report.reasonNoStock}",`;
        csvContent += `"${report.investigationStatus}"\n`;
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Supply_Stock_Mismatch_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV report. Please try again.');
    }
  };
  const suspiciousReports = useMemo(() => {
    const reports: SuspiciousReport[] = [];
    
    try {
      if (!data.rawVisitData || !data.shops) return reports;
      
      console.log('🔍 Processing supply-stock mismatch detection...');
      console.log('📦 Raw supply data available:', !!data.rawSupplyData?.pendingChallansData);
      
      // Process each shop's inventory
      Object.values(data.shops).forEach(shop => {
        try {
          if (!shop.visitDate) return; // Skip shops without visit dates
          
          Object.values(shop.items).forEach((item: any) => {
            try {
              // Only check items reported as out of stock (0 quantity)
              if (item.quantity !== 0) return;
              
              // Must have a recent supply date
              if (!item.lastSupplyDate) return;
              
              const daysSinceSupply = Math.floor(
                (shop.visitDate.getTime() - item.lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              
              // CRITICAL FIX: Only flag if supply was BEFORE visit (positive days)
              // We want: Supply delivered → Next day zero stock reported
              // NOT: Zero stock reported → Supply delivered later
              if (daysSinceSupply <= 0) return; // Skip if supply was after visit
              
              // Only flag if within detection threshold
              if (daysSinceSupply > detectionThreshold) return;
              
              // Get bottle size information
              const bottleInfo = getBottleSizeInfo(item.brand);
              
              // Get actual supply data (NOW READS REAL CASE QUANTITIES)
              const casesSupplied = getActualSupplyData(shop.shopId, item.brand, item.lastSupplyDate);
              const bottlesSupplied = casesSupplied * bottleInfo.conversionRate;
              
              // Log for debugging
              if (casesSupplied > 1) {
                console.log(`📊 Found ${casesSupplied} cases for ${shop.shopName} - ${item.brand}`);
              }
              
              // Calculate theoretical remaining stock
              const theoreticalRemaining = Math.max(0, 
                bottlesSupplied - (daysSinceSupply * bottleInfo.expectedDailyConsumption)
              );
              
              // Only flag if theoretical remaining is > 0 (suspicious)
              if (theoreticalRemaining <= 0) return;
              
              // Calculate alert severity
              const alertInfo = calculateAlertSeverity(
                daysSinceSupply, 
                bottleInfo.size, 
                casesSupplied, 
                theoreticalRemaining
              );
              
              const report: SuspiciousReport = {
                id: `${shop.shopId}_${item.brand}_${shop.visitDate.getTime()}`,
                shopId: shop.shopId,
                shopName: shop.shopName,
                department: shop.department,
                salesman: shop.salesman,
                salesmanUid: shop.salesmanUid,
                visitDate: shop.visitDate,
                sku: item.brand,
                reportedStock: 0,
                lastSupplyDate: item.lastSupplyDate,
                daysSinceSupply,
                bottleSize: bottleInfo.size,
                casesSupplied: casesSupplied,
                bottlesSupplied,
                conversionRate: bottleInfo.conversionRate,
                expectedDailyConsumption: bottleInfo.expectedDailyConsumption,
                theoreticalRemaining,
                alertSeverity: alertInfo.severity,
                suspicionScore: alertInfo.score,
                reasonNoStock: item.reasonNoStock || 'No reason provided',
                supplySources: [item.agingDataSource || 'unknown'],
                investigationStatus: 'pending',
                notes: ''
              };
              
              reports.push(report);
            } catch (itemError) {
              console.error('Error processing item:', itemError);
            }
          });
        } catch (shopError) {
          console.error('Error processing shop:', shopError);
        }
      });
      
      console.log(`✅ Generated ${reports.length} suspicious reports`);
      const multiCaseReports = reports.filter(r => r.casesSupplied > 1);
      console.log(`📦 Reports with multiple cases: ${multiCaseReports.length}`);
      
    } catch (error) {
      console.error('Error in suspicious reports detection:', error);
    }
    
    return reports;
  }, [data.shops, data.rawVisitData, data.rawSupplyData, detectionThreshold]);

  // ==========================================
  // FILTERING AND SORTING
  // ==========================================
  const filteredReports = useMemo(() => {
    let filtered = suspiciousReports.filter(report => {
      const matchesDepartment = !filters.department || report.department === filters.department;
      const matchesSalesman = !filters.salesman || report.salesman === filters.salesman;
      const matchesSeverity = !filters.severity || report.alertSeverity === filters.severity;
      const matchesBottleSize = !filters.bottleSize || report.bottleSize === filters.bottleSize;
      const matchesDaysSince = !filters.daysSinceSupply || 
        (filters.daysSinceSupply === '1' && report.daysSinceSupply <= 1) ||
        (filters.daysSinceSupply === '2' && report.daysSinceSupply <= 2) ||
        (filters.daysSinceSupply === '3' && report.daysSinceSupply <= 3) ||
        (filters.daysSinceSupply === '7' && report.daysSinceSupply <= 7);
      
      const matchesSearch = !filters.searchText || 
        report.shopName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        report.salesman.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        report.sku.toLowerCase().includes(filters.searchText.toLowerCase());
      
      return matchesDepartment && matchesSalesman && matchesSeverity && 
             matchesBottleSize && matchesDaysSince && matchesSearch;
    });
    
    // Sort the filtered results
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [suspiciousReports, filters, sortField, sortDirection]);

  // ==========================================
  // PAGINATION
  // ==========================================
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  const getDepartments = () => {
    return Array.from(new Set(suspiciousReports.map(r => r.department))).sort();
  };

  const getSalesmen = () => {
    return Array.from(new Set(suspiciousReports.map(r => r.salesman))).sort();
  };

  const getBottleSizes = () => {
    return Array.from(new Set(suspiciousReports.map(r => r.bottleSize))).sort();
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟡';
      case 'medium': return '🟠';
      case 'low': return '🔵';
      default: return '⚪';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSort = (field: keyof SuspiciousReport) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // ==========================================
  // STATISTICS
  // ==========================================
  const stats = useMemo(() => {
    const total = filteredReports.length;
    const critical = filteredReports.filter(r => r.alertSeverity === 'critical').length;
    const high = filteredReports.filter(r => r.alertSeverity === 'high').length;
    const medium = filteredReports.filter(r => r.alertSeverity === 'medium').length;
    const low = filteredReports.filter(r => r.alertSeverity === 'low').length;
    
    const topOffenders = suspiciousReports.reduce((acc, report) => {
      acc[report.salesman] = (acc[report.salesman] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, critical, high, medium, low, topOffenders };
  }, [filteredReports, suspiciousReports]);

  // ==========================================
  // RENDER COMPONENT
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Supply-Stock Mismatch Detection Report
        </h2>
        <p className="text-gray-600">
          Detection and analysis of discrepancies between recent supply deliveries and reported zero stock levels. This report identifies cases where inventory was delivered within the detection threshold but subsequently reported as out of stock, indicating potential stock misreporting or rapid depletion requiring investigation.
        </p>
        <p className="text-sm text-gray-500">
          Detection threshold: {detectionThreshold} days • Now reads actual case quantities from supply data • Only shows cases where supply was delivered BEFORE visit • Period: {data.summary.periodStartDate.toLocaleDateString()} - {data.summary.periodEndDate.toLocaleDateString()}
        </p>
        <p className="text-xs text-blue-600">
          {stats.total > 0 && `Found ${suspiciousReports.filter(r => r.casesSupplied > 1).length} cases with multiple cases delivered`}
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Detection Threshold:</label>
            <select
              value={detectionThreshold}
              onChange={(e) => setDetectionThreshold(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={1}>1 day</option>
              <option value={2}>2 days</option>
              <option value={3}>3 days</option>
              <option value={5}>5 days</option>
              <option value={7}>7 days</option>
            </select>
          </div>
          
          <button
            onClick={exportSupplyMismatchCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            title="Export supply-stock mismatch report to CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
        
        {/* Warning if raw supply data not available */}
        {!data.rawSupplyData?.pendingChallansData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Currently using default 1 case per supply. To show actual case quantities (2, 3, 5+ cases), 
                please update the main dashboard to pass raw supply data to this component.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
            />
          </div>

          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">All Departments</option>
            {getDepartments().map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filters.salesman}
            onChange={(e) => setFilters({ ...filters, salesman: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">All Salesmen</option>
            {getSalesmen().map(salesman => (
              <option key={salesman} value={salesman}>{salesman}</option>
            ))}
          </select>

          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.bottleSize}
            onChange={(e) => setFilters({ ...filters, bottleSize: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">All Sizes</option>
            {getBottleSizes().map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>

          <button
            onClick={() => setFilters({ 
              department: '', 
              salesman: '', 
              severity: '', 
              bottleSize: '', 
              daysSinceSupply: '',
              searchText: ''
            })}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Suspicious Reports</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow text-center border border-red-200">
          <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          <div className="text-sm text-red-700">Critical</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow text-center border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.high}</div>
          <div className="text-sm text-yellow-700">High</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg shadow text-center border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{stats.medium}</div>
          <div className="text-sm text-orange-700">Medium</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow text-center border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
          <div className="text-sm text-blue-700">Low</div>
        </div>
      </div>

      {/* Suspicious Reports Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Suspicious Zero Stock Reports</h3>
          <p className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredReports.length)} of {filteredReports.length} suspicious reports
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('suspicionScore')}
                >
                  Score {sortField === 'suspicionScore' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('alertSeverity')}
                >
                  Severity {sortField === 'alertSeverity' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('shopName')}
                >
                  Shop {sortField === 'shopName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('salesman')}
                >
                  Salesman {sortField === 'salesman' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('sku')}
                >
                  SKU {sortField === 'sku' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('daysSinceSupply')}
                >
                  Days Since Supply Delivered {sortField === 'daysSinceSupply' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('bottlesSupplied')}
                >
                  Supply Delivered {sortField === 'bottlesSupplied' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('theoreticalRemaining')}
                >
                  Should Still Have {sortField === 'theoreticalRemaining' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentReports.map((report) => (
                <React.Fragment key={report.id}>
                  <tr className={`hover:bg-gray-50 ${
                    report.alertSeverity === 'critical' ? 'bg-red-50' : 
                    report.alertSeverity === 'high' ? 'bg-yellow-50' : ''
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900">{report.suspicionScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(report.alertSeverity)}`}>
                        {getSeverityIcon(report.alertSeverity)} {report.alertSeverity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {report.shopName}
                      <div className="text-xs text-gray-500">{report.department}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {report.salesman}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {report.sku}
                      <div className="text-xs text-gray-500">{report.bottleSize}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{report.daysSinceSupply} days ago</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Delivered: {report.lastSupplyDate.toLocaleDateString('en-GB')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span>{report.casesSupplied} cases delivered</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        = {report.bottlesSupplied} bottles
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-orange-600">{Math.round(report.theoreticalRemaining)} bottles</span>
                      </div>
                      <div className="text-xs text-red-600">
                        but reported 0 bottles
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                          className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded"
                          title="Call shop"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-800 p-1 hover:bg-gray-50 rounded"
                          title="View location"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Details */}
                  {expandedReport === report.id && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Supply Timeline</h4>
                              <div className="space-y-1 text-sm">
                                <div>Supply Delivered: {report.lastSupplyDate.toLocaleDateString('en-GB')}</div>
                                <div>Visit Date: {report.visitDate.toLocaleDateString('en-GB')}</div>
                                <div>Days Between: {report.daysSinceSupply} days after delivery</div>
                                <div>Cases Delivered: {report.casesSupplied}</div>
                                <div>Bottles Delivered: {report.bottlesSupplied}</div>
                                <div>Conversion Rate: {report.conversionRate} bottles/case</div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Consumption Analysis</h4>
                              <div className="space-y-1 text-sm">
                                <div>Expected Daily Consumption: {report.expectedDailyConsumption} bottles</div>
                                <div>Days Since Delivery: {report.daysSinceSupply}</div>
                                <div>Expected Consumed: {report.daysSinceSupply * report.expectedDailyConsumption} bottles</div>
                                <div>Should Still Have: {Math.round(report.theoreticalRemaining)} bottles</div>
                                <div>Actually Reported: {report.reportedStock} bottles</div>
                                <div className="font-medium text-red-600">Missing: {Math.round(report.theoreticalRemaining)} bottles</div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Investigation</h4>
                              <div className="space-y-1 text-sm">
                                <div>Reason Given: {report.reasonNoStock}</div>
                                <div>Visit Date: {report.visitDate.toLocaleDateString('en-GB')}</div>
                                <div>Status: {report.investigationStatus}</div>
                                <div>Suspicion Score: {report.suspicionScore}/150</div>
                              </div>
                            </div>
                          </div>
                          <div className="border-t pt-4">
                            <h4 className="font-medium text-gray-900 mb-2">Investigation Notes</h4>
                            <textarea
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                              rows={3}
                              placeholder="Add investigation notes..."
                              value={report.notes}
                              onChange={(e) => {
                                // In real implementation, update the report notes
                                console.log('Notes updated:', e.target.value);
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length} suspicious reports
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

export default SupplyStockMismatchTab;
