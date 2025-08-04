/*
  ==========================================
  STOCK LEVEL TRACKING DASHBOARD
  Complete inventory visibility across all shops with supply data integration
  ==========================================
*/

'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Package, Clock, MapPin, Users, Filter, Download, BarChart3, AlertTriangle, CheckCircle, Eye, Calendar, Truck } from 'lucide-react';

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
  rawSupplyData?: {
    recentSupplies: Record<string, Date>;
    supplyHistory: Record<string, Date>;
    pendingChallansData: any[][];
  };
}

interface StockRecord {
  id: string;
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  salesmanUid?: string;
  sku: string;
  bottleSize: string;
  currentStockLevel: number;
  lastVisitDate: Date | null;
  lastSupplyDate: Date | null;
  daysSinceLastVisit: number | null;
  daysSinceLastSupply: number | null;
  totalSupplied: number;
  casesSupplied: number;
  bottlesSupplied: number;
  theoreticalStock: number;
  stockVariance: number;
  consumptionRate: number;
  stockStatus: 'healthy' | 'low' | 'out' | 'overstocked' | 'no_data';
  stockTrend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
  supplyFrequency: number;
  visitFrequency: number;
  dataQuality: 'complete' | 'partial' | 'supply_only' | 'visit_only';
  reasonNoStock?: string;
  conversionRate: number;
  supplyHistory: Array<{date: Date, cases: number}>;
  visitHistory: Array<{date: Date, stock: number}>;
}

interface StockFilters {
  department: string;
  salesman: string;
  stockStatus: string;
  dataQuality: string;
  bottleSize: string;
  stockTrend: string;
  searchText: string;
  trackingPeriod: number;
}

// ==========================================
// MAIN COMPONENT
// ==========================================

const StockLevelTrackingTab = ({ data }: { data: InventoryData }) => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [filters, setFilters] = useState<StockFilters>({
    department: '',
    salesman: '',
    stockStatus: '',
    dataQuality: '',
    bottleSize: '',
    stockTrend: '',
    searchText: '',
    trackingPeriod: 15
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof StockRecord>('stockVariance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'summary'>('table');
  const itemsPerPage = 20;

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  const getBottleSizeInfo = (skuName: string): { size: string; conversionRate: number; expectedDailyConsumption: number } => {
    const sku = skuName.toUpperCase();
    
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
    
    return { size: '750ml', conversionRate: 12, expectedDailyConsumption: 2 };
  };

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    try {
      // Handle multiple date formats
      if (dateStr.includes('-') && !dateStr.includes(':')) {
        const dateParts = dateStr.split('-');
        if (dateParts.length === 3) {
          if (dateParts[0].length === 4) {
            return new Date(dateStr);
          } else {
            return new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
          }
        }
      }
      
      if (dateStr.includes('/')) {
        const dateParts = dateStr.split('/');
        if (dateParts.length === 3) {
          return new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
        }
      }
      
      const parsedDate = new Date(dateStr);
      return !isNaN(parsedDate.getTime()) ? parsedDate : null;
    } catch (error) {
      return null;
    }
  };

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

  const getSupplyDataForSKU = (shopId: string, brandName: string, trackingPeriod: number): Array<{date: Date, cases: number}> => {
    const supplyHistory: Array<{date: Date, cases: number}> = [];
    
    if (!data.rawSupplyData?.pendingChallansData) return supplyHistory;
    
    const pendingChallans = data.rawSupplyData.pendingChallansData;
    if (pendingChallans.length <= 1) return supplyHistory;
    
    const headers = pendingChallans[0];
    const rows = pendingChallans.slice(1);
    
    const challansDateIndex = 1;
    const shopIdIndex = 8;
    const brandIndex = 11;
    const sizeIndex = 12;
    const casesIndex = 14;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - trackingPeriod);
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (row.length > Math.max(shopIdIndex, brandIndex, casesIndex)) {
        const rowShopId = row[shopIdIndex]?.toString().trim();
        const rowBrand = row[brandIndex]?.toString().trim();
        const rowDateStr = row[challansDateIndex]?.toString().trim();
        const rawCaseValue = row[casesIndex];
        
        if (rowShopId === shopId && rowBrand && rowDateStr) {
          const rowDate = parseDate(rowDateStr);
          if (rowDate && rowDate >= cutoffDate) {
            // Enhanced case parsing
            let rowCases = 1;
            if (rawCaseValue !== undefined && rawCaseValue !== null) {
              const caseString = String(rawCaseValue).trim();
              if (caseString !== '' && caseString !== '0') {
                const numberValue = Number(caseString);
                if (!isNaN(numberValue) && numberValue > 0) {
                  rowCases = Math.round(numberValue);
                } else {
                  const intValue = parseInt(caseString);
                  if (!isNaN(intValue) && intValue > 0) {
                    rowCases = intValue;
                  }
                }
              }
            }
            
            // Brand matching logic
            const rowBrandUpper = rowBrand.toUpperCase();
            const brandNameUpper = brandName.toUpperCase();
            
            let brandMatch = false;
            
            if (rowBrandUpper.includes('8 PM') && brandNameUpper.includes('8 PM')) {
              if (rowBrandUpper.includes('BLACK') && brandNameUpper.includes('BLACK')) {
                brandMatch = true;
              }
            } else if (rowBrandUpper.includes('VERVE') && brandNameUpper.includes('VERVE')) {
              if (rowBrandUpper.includes('LEMON') && brandNameUpper.includes('LEMON')) {
                brandMatch = true;
              } else if (rowBrandUpper.includes('CRANBERRY') && brandNameUpper.includes('CRANBERRY')) {
                brandMatch = true;
              } else if (rowBrandUpper.includes('GREEN') && brandNameUpper.includes('GREEN')) {
                brandMatch = true;
              } else if (rowBrandUpper.includes('GRAIN') && brandNameUpper.includes('GRAIN')) {
                brandMatch = true;
              }
            } else {
              const brandWords = brandNameUpper.split(' ');
              const rowWords = rowBrandUpper.split(' ');
              const commonWords = brandWords.filter(word => rowWords.includes(word));
              if (commonWords.length >= 2) {
                brandMatch = true;
              }
            }
            
            if (brandMatch && rowCases > 0) {
              supplyHistory.push({
                date: rowDate,
                cases: rowCases
              });
            }
          }
        }
      }
    }
    
    return supplyHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const getVisitDataForSKU = (shopId: string, brandName: string, trackingPeriod: number): Array<{date: Date, stock: number}> => {
    const visitHistory: Array<{date: Date, stock: number}> = [];
    
    if (!data.rawVisitData?.rollingPeriodRows) return visitHistory;
    
    const rows = data.rawVisitData.rollingPeriodRows;
    const columnIndices = data.rawVisitData.columnIndices;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - trackingPeriod);
    
    rows.forEach(row => {
      const rowShopId = row[columnIndices.shopId];
      const rowBrand = row[columnIndices.invBrand]?.toString().trim();
      const rowQuantity = parseFloat(row[columnIndices.invQuantity]) || 0;
      const rowDateStr = row[columnIndices.checkInDateTime];
      
      if (rowShopId === shopId && rowBrand && rowDateStr) {
        const rowDate = parseDate(rowDateStr);
        if (rowDate && rowDate >= cutoffDate) {
          // Brand matching
          if (rowBrand.toUpperCase().includes(brandName.toUpperCase()) || 
              brandName.toUpperCase().includes(rowBrand.toUpperCase())) {
            visitHistory.push({
              date: rowDate,
              stock: rowQuantity
            });
          }
        }
      }
    });
    
    return visitHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const calculateStockStatus = (currentStock: number, theoreticalStock: number, supplyHistory: Array<any>): {
    status: 'healthy' | 'low' | 'out' | 'overstocked' | 'no_data';
    trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
  } => {
    let status: 'healthy' | 'low' | 'out' | 'overstocked' | 'no_data' = 'no_data';
    let trend: 'increasing' | 'decreasing' | 'stable' | 'unknown' = 'unknown';
    
    if (currentStock === 0) {
      status = 'out';
    } else if (currentStock < 5) {
      status = 'low';
    } else if (theoreticalStock > 0 && currentStock > theoreticalStock * 1.5) {
      status = 'overstocked';
    } else if (currentStock > 0) {
      status = 'healthy';
    }
    
    if (supplyHistory.length >= 2) {
      const recent = supplyHistory.slice(-3);
      const stockValues = recent.map(h => h.stock || 0);
      
      if (stockValues.length >= 2) {
        const firstHalf = stockValues.slice(0, Math.floor(stockValues.length / 2));
        const secondHalf = stockValues.slice(Math.floor(stockValues.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg * 1.1) trend = 'increasing';
        else if (secondAvg < firstAvg * 0.9) trend = 'decreasing';
        else trend = 'stable';
      }
    }
    
    return { status, trend };
  };

  // ==========================================
  // MAIN DATA PROCESSING
  // ==========================================
  const stockRecords = useMemo(() => {
    const records: StockRecord[] = [];
    const processedCombinations = new Set<string>();
    
    try {
      const today = new Date();
      
      // Process visited shops from inventory data
      Object.values(data.shops).forEach(shop => {
        try {
          Object.values(shop.items).forEach((item: any) => {
            try {
              const combinationKey = `${shop.shopId}_${item.brand}`;
              if (processedCombinations.has(combinationKey)) return;
              processedCombinations.add(combinationKey);
              
              const bottleInfo = getBottleSizeInfo(item.brand);
              const supplyHistory = getSupplyDataForSKU(shop.shopId, item.brand, filters.trackingPeriod);
              const visitHistory = getVisitDataForSKU(shop.shopId, item.brand, filters.trackingPeriod);
              
              const totalCasesSupplied = supplyHistory.reduce((sum, supply) => sum + supply.cases, 0);
              const totalBottlesSupplied = totalCasesSupplied * bottleInfo.conversionRate;
              
              const daysSinceLastVisit = shop.visitDate ? 
                Math.floor((today.getTime() - shop.visitDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
              
              const lastSupplyDate = supplyHistory.length > 0 ? supplyHistory[supplyHistory.length - 1].date : null;
              const daysSinceLastSupply = lastSupplyDate ?
                Math.floor((today.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
              
              // Calculate theoretical stock based on supply and expected consumption
              let theoreticalStock = 0;
              if (supplyHistory.length > 0 && daysSinceLastSupply !== null) {
                const daysSinceFirstSupply = Math.floor(
                  (today.getTime() - supplyHistory[0].date.getTime()) / (1000 * 60 * 60 * 24)
                );
                const expectedConsumed = daysSinceFirstSupply * bottleInfo.expectedDailyConsumption;
                theoreticalStock = Math.max(0, totalBottlesSupplied - expectedConsumed);
              }
              
              const stockVariance = item.quantity - theoreticalStock;
              const consumptionRate = visitHistory.length >= 2 ? 
                bottleInfo.expectedDailyConsumption : bottleInfo.expectedDailyConsumption;
              
              const { status, trend } = calculateStockStatus(item.quantity, theoreticalStock, visitHistory);
              
              const supplyFrequency = supplyHistory.length > 0 ? filters.trackingPeriod / supplyHistory.length : 0;
              const visitFrequency = visitHistory.length > 0 ? filters.trackingPeriod / visitHistory.length : 0;
              
              let dataQuality: 'complete' | 'partial' | 'supply_only' | 'visit_only' = 'complete';
              if (supplyHistory.length === 0 && visitHistory.length > 0) dataQuality = 'visit_only';
              else if (supplyHistory.length > 0 && visitHistory.length === 0) dataQuality = 'supply_only';
              else if (supplyHistory.length === 0 || visitHistory.length === 0) dataQuality = 'partial';
              
              const record: StockRecord = {
                id: `${shop.shopId}_${item.brand}`,
                shopId: shop.shopId,
                shopName: shop.shopName,
                department: shop.department,
                salesman: shop.salesman,
                salesmanUid: shop.salesmanUid,
                sku: item.brand,
                bottleSize: bottleInfo.size,
                currentStockLevel: item.quantity,
                lastVisitDate: shop.visitDate,
                lastSupplyDate,
                daysSinceLastVisit,
                daysSinceLastSupply,
                totalSupplied: totalBottlesSupplied,
                casesSupplied: totalCasesSupplied,
                bottlesSupplied: totalBottlesSupplied,
                theoreticalStock,
                stockVariance,
                consumptionRate,
                stockStatus: status,
                stockTrend: trend,
                supplyFrequency,
                visitFrequency,
                dataQuality,
                reasonNoStock: item.reasonNoStock,
                conversionRate: bottleInfo.conversionRate,
                supplyHistory,
                visitHistory
              };
              
              records.push(record);
            } catch (itemError) {
              console.error('Error processing item:', itemError);
            }
          });
        } catch (shopError) {
          console.error('Error processing shop:', shopError);
        }
      });
      
      // Process non-visited shops with supply data
      if (data.rawSupplyData?.pendingChallansData) {
        const pendingChallans = data.rawSupplyData.pendingChallansData;
        if (pendingChallans.length > 1) {
          const rows = pendingChallans.slice(1);
          const processedShopSKUs = new Set<string>();
          
          rows.forEach(row => {
            try {
              const shopId = row[8]?.toString().trim();
              const shopName = row[9]?.toString().trim() || 'Unknown Shop';
              const brand = row[11]?.toString().trim();
              const dateStr = row[1]?.toString().trim();
              
              if (shopId && brand && dateStr) {
                const combinationKey = `${shopId}_${brand}`;
                
                // Skip if already processed from visited shops
                if (processedCombinations.has(combinationKey) || processedShopSKUs.has(combinationKey)) {
                  return;
                }
                processedShopSKUs.add(combinationKey);
                
                const bottleInfo = getBottleSizeInfo(brand);
                const supplyHistory = getSupplyDataForSKU(shopId, brand, filters.trackingPeriod);
                
                if (supplyHistory.length > 0) {
                  const totalCasesSupplied = supplyHistory.reduce((sum, supply) => sum + supply.cases, 0);
                  const totalBottlesSupplied = totalCasesSupplied * bottleInfo.conversionRate;
                  
                  const lastSupplyDate = supplyHistory[supplyHistory.length - 1].date;
                  const daysSinceLastSupply = Math.floor((today.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  // For non-visited shops, theoretical stock is based on supplies minus expected consumption
                  const daysSinceFirstSupply = Math.floor(
                    (today.getTime() - supplyHistory[0].date.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const expectedConsumed = daysSinceFirstSupply * bottleInfo.expectedDailyConsumption;
                  const theoreticalStock = Math.max(0, totalBottlesSupplied - expectedConsumed);
                  
                  // Get shop info from master data if available
                  const masterInfo = data.rawVisitData?.shopSalesmanMap?.get(shopId);
                  
                  const record: StockRecord = {
                    id: `${shopId}_${brand}_supply_only`,
                    shopId,
                    shopName: masterInfo?.shopName || shopName,
                    department: masterInfo?.department || 'Unknown',
                    salesman: masterInfo?.salesman || 'Unknown',
                    salesmanUid: masterInfo?.salesmanUid,
                    sku: brand,
                    bottleSize: bottleInfo.size,
                    currentStockLevel: theoreticalStock, // Use theoretical as current for non-visited
                    lastVisitDate: null,
                    lastSupplyDate,
                    daysSinceLastVisit: null,
                    daysSinceLastSupply,
                    totalSupplied: totalBottlesSupplied,
                    casesSupplied: totalCasesSupplied,
                    bottlesSupplied: totalBottlesSupplied,
                    theoreticalStock,
                    stockVariance: 0, // Unknown variance for non-visited
                    consumptionRate: bottleInfo.expectedDailyConsumption,
                    stockStatus: theoreticalStock > 0 ? 'healthy' : 'out',
                    stockTrend: 'unknown',
                    supplyFrequency: filters.trackingPeriod / supplyHistory.length,
                    visitFrequency: 0,
                    dataQuality: 'supply_only',
                    conversionRate: bottleInfo.conversionRate,
                    supplyHistory,
                    visitHistory: []
                  };
                  
                  records.push(record);
                }
              }
            } catch (rowError) {
              console.error('Error processing supply row:', rowError);
            }
          });
        }
      }
      
    } catch (error) {
      console.error('Error in stock records processing:', error);
    }
    
    return records;
  }, [data.shops, data.rawSupplyData, data.rawVisitData, filters.trackingPeriod]);

  // ==========================================
  // FILTERING AND SORTING
  // ==========================================
  const filteredRecords = useMemo(() => {
    let filtered = stockRecords.filter(record => {
      const matchesDepartment = !filters.department || record.department === filters.department;
      const matchesSalesman = !filters.salesman || record.salesman === filters.salesman;
      const matchesStockStatus = !filters.stockStatus || record.stockStatus === filters.stockStatus;
      const matchesDataQuality = !filters.dataQuality || record.dataQuality === filters.dataQuality;
      const matchesBottleSize = !filters.bottleSize || record.bottleSize === filters.bottleSize;
      const matchesStockTrend = !filters.stockTrend || record.stockTrend === filters.stockTrend;
      
      const matchesSearch = !filters.searchText || 
        record.shopName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        record.salesman.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        record.sku.toLowerCase().includes(filters.searchText.toLowerCase());
      
      return matchesDepartment && matchesSalesman && matchesStockStatus && 
             matchesDataQuality && matchesBottleSize && matchesStockTrend && matchesSearch;
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
  }, [stockRecords, filters, sortField, sortDirection]);

  // ==========================================
  // PAGINATION
  // ==========================================
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  // ==========================================
  // HELPER FUNCTIONS FOR UI
  // ==========================================
  const getDepartments = () => {
    return Array.from(new Set(stockRecords.map(r => r.department))).sort();
  };

  const getSalesmen = () => {
    return Array.from(new Set(stockRecords.map(r => r.salesman))).sort();
  };

  const getBottleSizes = () => {
    return Array.from(new Set(stockRecords.map(r => r.bottleSize))).sort();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '🟢';
      case 'low': return '🟡';
      case 'out': return '🔴';
      case 'overstocked': return '🟠';
      case 'no_data': return '⚪';
      default: return '⚪';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out': return 'bg-red-100 text-red-800 border-red-200';
      case 'overstocked': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'no_data': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <BarChart3 className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleSort = (field: keyof StockRecord) => {
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
    const total = filteredRecords.length;
    const healthy = filteredRecords.filter(r => r.stockStatus === 'healthy').length;
    const low = filteredRecords.filter(r => r.stockStatus === 'low').length;
    const out = filteredRecords.filter(r => r.stockStatus === 'out').length;
    const overstocked = filteredRecords.filter(r => r.stockStatus === 'overstocked').length;
    const noData = filteredRecords.filter(r => r.stockStatus === 'no_data').length;
    
    const totalStock = filteredRecords.reduce((sum, record) => sum + record.currentStockLevel, 0);
    const totalSupplied = filteredRecords.reduce((sum, record) => sum + record.totalSupplied, 0);
    const avgStockLevel = total > 0 ? Math.round(totalStock / total) : 0;
    
    const visitedShops = filteredRecords.filter(r => r.lastVisitDate !== null).length;
    const supplyOnlyShops = filteredRecords.filter(r => r.dataQuality === 'supply_only').length;
    
    return { 
      total, healthy, low, out, overstocked, noData, 
      totalStock, totalSupplied, avgStockLevel, visitedShops, supplyOnlyShops 
    };
  }, [filteredRecords]);

  // ==========================================
  // CSV EXPORT FUNCTIONALITY
  // ==========================================
  const exportStockTrackingCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Header
      csvContent += "STOCK LEVEL TRACKING DASHBOARD REPORT\n";
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `Tracking Period: ${filters.trackingPeriod} days\n`;
      csvContent += `Period: ${data.summary.periodStartDate.toLocaleDateString()} - ${data.summary.periodEndDate.toLocaleDateString()}\n`;
      csvContent += `Total Records: ${filteredRecords.length}\n`;
      csvContent += `Visited Shops: ${stats.visitedShops} | Supply-Only Shops: ${stats.supplyOnlyShops}\n`;
      csvContent += `Stock Status: Healthy: ${stats.healthy} | Low: ${stats.low} | Out: ${stats.out} | Overstocked: ${stats.overstocked}\n\n`;
      
      // Column headers
      csvContent += "Shop Name,Shop ID,Department,Salesman,SKU,Bottle Size,Current Stock,Last Visit Date,Last Supply Date,Days Since Visit,Days Since Supply,Cases Supplied,Bottles Supplied,Theoretical Stock,Stock Variance,Stock Status,Stock Trend,Consumption Rate,Supply Frequency,Visit Frequency,Data Quality,Reason No Stock\n";
      
      // Data rows
      filteredRecords.forEach(record => {
        const visitDateStr = record.lastVisitDate ? record.lastVisitDate.toLocaleDateString('en-GB') : 'No Visit';
        const supplyDateStr = record.lastSupplyDate ? record.lastSupplyDate.toLocaleDateString('en-GB') : 'No Supply';
        
        csvContent += `"${record.shopName}",`;
        csvContent += `"${record.shopId}",`;
        csvContent += `"${record.department}",`;
        csvContent += `"${record.salesman}",`;
        csvContent += `"${record.sku}",`;
        csvContent += `"${record.bottleSize}",`;
        csvContent += `"${record.currentStockLevel}",`;
        csvContent += `"${visitDateStr}",`;
        csvContent += `"${supplyDateStr}",`;
        csvContent += `"${record.daysSinceLastVisit || 'N/A'}",`;
        csvContent += `"${record.daysSinceLastSupply || 'N/A'}",`;
        csvContent += `"${record.casesSupplied}",`;
        csvContent += `"${record.bottlesSupplied}",`;
        csvContent += `"${Math.round(record.theoreticalStock)}",`;
        csvContent += `"${Math.round(record.stockVariance)}",`;
        csvContent += `"${record.stockStatus.toUpperCase()}",`;
        csvContent += `"${record.stockTrend.toUpperCase()}",`;
        csvContent += `"${record.consumptionRate}",`;
        csvContent += `"${record.supplyFrequency.toFixed(1)}",`;
        csvContent += `"${record.visitFrequency.toFixed(1)}",`;
        csvContent += `"${record.dataQuality.toUpperCase()}",`;
        csvContent += `"${record.reasonNoStock || 'N/A'}"\n`;
      });
      
      // Add supply history details
      csvContent += "\n\nSUPPLY HISTORY DETAILS\n";
      csvContent += "Shop Name,Shop ID,SKU,Supply Date,Cases Delivered\n";
      
      filteredRecords.forEach(record => {
        record.supplyHistory.forEach(supply => {
          csvContent += `"${record.shopName}",`;
          csvContent += `"${record.shopId}",`;
          csvContent += `"${record.sku}",`;
          csvContent += `"${supply.date.toLocaleDateString('en-GB')}",`;
          csvContent += `"${supply.cases}"\n`;
        });
      });
      
      // Add visit history details
      csvContent += "\n\nVISIT HISTORY DETAILS\n";
      csvContent += "Shop Name,Shop ID,SKU,Visit Date,Reported Stock\n";
      
      filteredRecords.forEach(record => {
        record.visitHistory.forEach(visit => {
          csvContent += `"${record.shopName}",`;
          csvContent += `"${record.shopId}",`;
          csvContent += `"${record.sku}",`;
          csvContent += `"${visit.date.toLocaleDateString('en-GB')}",`;
          csvContent += `"${visit.stock}"\n`;
        });
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Stock_Level_Tracking_${filters.trackingPeriod}Days_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV report. Please try again.');
    }
  };

  // ==========================================
  // RENDER COMPONENT
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Stock Level Tracking Dashboard
        </h2>
        <p className="text-gray-600">
          Comprehensive inventory visibility across all shops with supply data integration. 
          Track stock levels, supply deliveries, consumption patterns, and identify optimization opportunities.
        </p>
        <p className="text-sm text-gray-500">
          Tracking Period: {filters.trackingPeriod} days • 
          Data Sources: Visit Reports + Supply Challans + Master Shop Data • 
          Coverage: Visited shops + Supply-only shops
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Tracking Period:</label>
              <select
                value={filters.trackingPeriod}
                onChange={(e) => setFilters({ ...filters, trackingPeriod: parseInt(e.target.value) })}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={7}>Last 7 Days</option>
                <option value={15}>Last 15 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">View:</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'table' | 'summary')}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="table">Detailed Table</option>
                <option value="summary">Summary View</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={exportStockTrackingCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            title="Export complete stock tracking report to CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export Complete Report</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
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
            value={filters.stockStatus}
            onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="overstocked">Overstocked</option>
            <option value="no_data">No Data</option>
          </select>

          <select
            value={filters.dataQuality}
            onChange={(e) => setFilters({ ...filters, dataQuality: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">All Data Types</option>
            <option value="complete">Complete Data</option>
            <option value="partial">Partial Data</option>
            <option value="supply_only">Supply Only</option>
            <option value="visit_only">Visit Only</option>
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
              stockStatus: '', 
              dataQuality: '',
              bottleSize: '', 
              stockTrend: '',
              searchText: '',
              trackingPeriod: filters.trackingPeriod
            })}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Records</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow text-center border border-green-200">
          <div className="text-2xl font-bold text-green-600">{stats.healthy}</div>
          <div className="text-sm text-green-700">Healthy</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow text-center border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.low}</div>
          <div className="text-sm text-yellow-700">Low Stock</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow text-center border border-red-200">
          <div className="text-2xl font-bold text-red-600">{stats.out}</div>
          <div className="text-sm text-red-700">Out of Stock</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg shadow text-center border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{stats.overstocked}</div>
          <div className="text-sm text-orange-700">Overstocked</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow text-center border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{stats.visitedShops}</div>
          <div className="text-sm text-blue-700">Visited Shops</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow text-center border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{stats.supplyOnlyShops}</div>
          <div className="text-sm text-purple-700">Supply Only</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Stock Level Records</h3>
          <p className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} stock records
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  onClick={() => handleSort('currentStockLevel')}
                >
                  Current Stock {sortField === 'currentStockLevel' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('theoreticalStock')}
                >
                  Expected Stock {sortField === 'theoreticalStock' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('stockVariance')}
                >
                  Variance {sortField === 'stockVariance' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('stockStatus')}
                >
                  Status {sortField === 'stockStatus' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRecords.map((record) => (
                <React.Fragment key={record.id}>
                  <tr className={`hover:bg-gray-50 ${
                    record.stockStatus === 'out' ? 'bg-red-50' : 
                    record.stockStatus === 'low' ? 'bg-yellow-50' : 
                    record.stockStatus === 'overstocked' ? 'bg-orange-50' : ''
                  }`}>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="font-medium">{record.shopName}</div>
                      <div className="text-xs text-gray-500">{record.department}</div>
                      <div className="text-xs text-blue-600">{record.dataQuality.replace('_', ' ').toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {record.salesman}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="font-medium truncate">{record.sku}</div>
                      <div className="text-xs text-gray-500">{record.bottleSize}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{record.currentStockLevel}</span>
                        <span className="text-gray-500">bottles</span>
                      </div>
                      {getTrendIcon(record.stockTrend)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="font-medium">{Math.round(record.theoreticalStock)}</div>
                      <div className="text-xs text-gray-500">bottles</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={`font-medium ${
                        record.stockVariance > 0 ? 'text-green-600' : 
                        record.stockVariance < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {record.stockVariance > 0 ? '+' : ''}{Math.round(record.stockVariance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.stockStatus)}`}>
                        {getStatusIcon(record.stockStatus)} {record.stockStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="space-y-1">
                        {record.lastVisitDate && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3 text-blue-400" />
                            <span className="text-xs">{record.daysSinceLastVisit}d ago</span>
                          </div>
                        )}
                        {record.lastSupplyDate && (
                          <div className="flex items-center space-x-1">
                            <Truck className="w-3 h-3 text-green-400" />
                            <span className="text-xs">{record.daysSinceLastSupply}d ago</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                        className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Details */}
                  {expandedRecord === record.id && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
                              <div className="space-y-1 text-sm">
                                <div>Current Stock: {record.currentStockLevel} bottles</div>
                                <div>Expected Stock: {Math.round(record.theoreticalStock)} bottles</div>
                                <div>Variance: {record.stockVariance > 0 ? '+' : ''}{Math.round(record.stockVariance)} bottles</div>
                                <div>Conversion Rate: {record.conversionRate} bottles/case</div>
                                <div>Consumption Rate: {record.consumptionRate} bottles/day</div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Supply Activity</h4>
                              <div className="space-y-1 text-sm">
                                <div>Total Cases Supplied: {record.casesSupplied}</div>
                                <div>Total Bottles Supplied: {record.bottlesSupplied}</div>
                                <div>Supply Frequency: {record.supplyFrequency.toFixed(1)} days/supply</div>
                                <div>Last Supply: {record.lastSupplyDate ? record.lastSupplyDate.toLocaleDateString('en-GB') : 'No Supply'}</div>
                                <div>Days Since Supply: {record.daysSinceLastSupply || 'N/A'}</div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Visit Activity</h4>
                              <div className="space-y-1 text-sm">
                                <div>Last Visit: {record.lastVisitDate ? record.lastVisitDate.toLocaleDateString('en-GB') : 'No Visit'}</div>
                                <div>Days Since Visit: {record.daysSinceLastVisit || 'N/A'}</div>
                                <div>Visit Frequency: {record.visitFrequency.toFixed(1)} days/visit</div>
                                <div>Data Quality: {record.dataQuality.replace('_', ' ').toUpperCase()}</div>
                                {record.reasonNoStock && <div>Reason: {record.reasonNoStock}</div>}
                              </div>
                            </div>
                          </div>
                          
                          {/* Supply History */}
                          {record.supplyHistory.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Supply History ({record.supplyHistory.length} deliveries)</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                                {record.supplyHistory.slice(-6).map((supply, index) => (
                                  <div key={index} className="bg-white p-2 rounded border">
                                    {supply.date.toLocaleDateString('en-GB')}: {supply.cases} cases
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Visit History */}
                          {record.visitHistory.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Visit History ({record.visitHistory.length} visits)</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                                {record.visitHistory.slice(-6).map((visit, index) => (
                                  <div key={index} className="bg-white p-2 rounded border">
                                    {visit.date.toLocaleDateString('en-GB')}: {visit.stock} bottles
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} stock records
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

export default StockLevelTrackingTab;
