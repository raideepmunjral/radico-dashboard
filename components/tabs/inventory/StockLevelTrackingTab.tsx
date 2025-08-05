/*
  ==========================================
  STOCK LEVEL TRACKING DASHBOARD - FIXED
  🎯 PERIOD FILTERS VISITS (not supply data)
  📦 SUPPLY DATA: Goes back as far as available for visited shops
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
  visitPeriod: number; // 🔧 RENAMED: Now clearly indicates it's for visit filtering
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
    visitPeriod: 15 // 🔧 RENAMED: Clear that this filters visits
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

  // 🎯 FIXED: Get MOST RECENT supply delivery for a shop/SKU (NO TIME FILTERING)
  const getMostRecentSupplyForSKU = (shopId: string, brandName: string): {date: Date, cases: number} | null => {
    let mostRecentSupply: {date: Date, cases: number} | null = null;
    
    if (!data.rawSupplyData?.pendingChallansData) {
      return mostRecentSupply;
    }
    
    const pendingChallans = data.rawSupplyData.pendingChallansData;
    if (pendingChallans.length <= 1) {
      return mostRecentSupply;
    }
    
    const headers = pendingChallans[0];
    const rows = pendingChallans.slice(1);
    
    const challansDateIndex = 1;
    const shopIdIndex = 8;
    const brandIndex = 11;
    const sizeIndex = 12;
    const casesIndex = 14;
    
    // 🔧 EXTRACT TARGET SIZE FROM BRAND NAME
    const targetBrandInfo = getBottleSizeInfo(brandName);
    const targetSize = targetBrandInfo.size.replace('ml', ''); // Extract numeric size (750, 375, 180, etc.)
    
    // 🔧 SIZE-SPECIFIC MATCHING FUNCTION
    const isExactSizeAndBrandMatch = (supplyBrand: string, supplySize: string, targetBrand: string, targetSize: string): boolean => {
      const supplyBrandUpper = supplyBrand.toUpperCase();
      const targetBrandUpper = targetBrand.toUpperCase();
      
      // Extract size from supply data (handle various formats)
      let normalizedSupplySize = '';
      if (supplySize) {
        const sizeMatch = supplySize.toString().match(/(\d+)/);
        normalizedSupplySize = sizeMatch ? sizeMatch[1] : '';
      }
      
      // If no size column, try to extract from brand name
      if (!normalizedSupplySize) {
        const brandSizeMatch = supplyBrand.match(/(\d+)(?:ML|P)?/i);
        normalizedSupplySize = brandSizeMatch ? brandSizeMatch[1] : '';
      }
      
      // 🎯 EXACT SIZE MATCHING REQUIRED
      const sizeMatches = normalizedSupplySize === targetSize;
      
      if (!sizeMatches) {
        return false; // ❌ Size mismatch - reject immediately
      }
      
      // 🎯 BRAND FAMILY MATCHING (only after size matches)
      if (supplyBrandUpper.includes('8 PM') && targetBrandUpper.includes('8 PM')) {
        if (supplyBrandUpper.includes('BLACK') && targetBrandUpper.includes('BLACK')) {
          return true; // ✅ 8 PM BLACK + exact size match
        }
      } else if (supplyBrandUpper.includes('VERVE') && targetBrandUpper.includes('VERVE')) {
        if (supplyBrandUpper.includes('LEMON') && targetBrandUpper.includes('LEMON')) {
          return true; // ✅ VERVE LEMON + exact size match
        } else if (supplyBrandUpper.includes('CRANBERRY') && targetBrandUpper.includes('CRANBERRY')) {
          return true; // ✅ VERVE CRANBERRY + exact size match
        } else if (supplyBrandUpper.includes('GREEN') && targetBrandUpper.includes('GREEN')) {
          return true; // ✅ VERVE GREEN + exact size match
        } else if (supplyBrandUpper.includes('GRAIN') && targetBrandUpper.includes('GRAIN')) {
          return true; // ✅ VERVE GRAIN + exact size match
        }
      } else {
        // Fallback: word matching but only with exact size
        const brandWords = targetBrandUpper.split(' ').filter(word => word.length > 2);
        const supplyWords = supplyBrandUpper.split(' ').filter(word => word.length > 2);
        const commonWords = brandWords.filter(word => supplyWords.includes(word));
        return commonWords.length >= 2; // ✅ Multiple word match + exact size
      }
      
      return false;
    };
    
    // 🔧 FIND MOST RECENT MATCHING SUPPLY
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (row.length > Math.max(shopIdIndex, brandIndex, casesIndex)) {
        const rowShopId = row[shopIdIndex]?.toString().trim();
        
        // ⚡ PERFORMANCE: Skip early if shop doesn't match
        if (rowShopId !== shopId) continue;
        
        const rowBrand = row[brandIndex]?.toString().trim();
        const rowSize = row[sizeIndex]?.toString().trim() || '';
        const rowDateStr = row[challansDateIndex]?.toString().trim();
        const rawCaseValue = row[casesIndex];
        
        if (rowBrand && rowDateStr) {
          const rowDate = parseDate(rowDateStr);
          if (rowDate) {
            // 🔧 ENHANCED CASE PARSING
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
            
            // 🎯 CRITICAL: Use size-specific matching
            const isMatch = isExactSizeAndBrandMatch(rowBrand, rowSize, brandName, targetSize);
            
            if (isMatch && rowCases > 0) {
              // 🎯 KEEP ONLY THE MOST RECENT
              if (!mostRecentSupply || rowDate > mostRecentSupply.date) {
                mostRecentSupply = {
                  date: rowDate,
                  cases: rowCases
                };
              }
            }
          }
        }
      }
    }
    
    return mostRecentSupply;
  };

  // 🎯 FIXED: Visit data filtered by visitPeriod only
  const getVisitDataForSKU = (shopId: string, brandName: string, visitPeriod: number): Array<{date: Date, stock: number}> => {
    const visitHistory: Array<{date: Date, stock: number}> = [];
    
    if (!data.rawVisitData?.rollingPeriodRows) {
      return visitHistory;
    }
    
    const rows = data.rawVisitData.rollingPeriodRows;
    const columnIndices = data.rawVisitData.columnIndices;
    
    // 🎯 VISIT CUTOFF: Only filter visits by period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - visitPeriod);
    
    // 🔧 EXTRACT TARGET SIZE for precise matching
    const targetBrandInfo = getBottleSizeInfo(brandName);
    const targetSize = targetBrandInfo.size.replace('ml', '');
    
    // 🔧 SIZE-SPECIFIC VISIT MATCHING
    const isExactVisitMatch = (visitBrand: string, targetBrand: string, targetSize: string): boolean => {
      const visitBrandUpper = visitBrand.toUpperCase();
      const targetBrandUpper = targetBrand.toUpperCase();
      
      // Extract size from visit brand
      let visitSize = '';
      const sizeMatch = visitBrand.match(/(\d+)(?:ML|P)?/i);
      if (sizeMatch) {
        visitSize = sizeMatch[1];
      }
      
      // Size must match exactly
      if (visitSize !== targetSize) {
        return false;
      }
      
      // Brand family matching (same logic as supply but size-aware)
      if (visitBrandUpper.includes('8 PM') && targetBrandUpper.includes('8 PM')) {
        return visitBrandUpper.includes('BLACK') && targetBrandUpper.includes('BLACK');
      } else if (visitBrandUpper.includes('VERVE') && targetBrandUpper.includes('VERVE')) {
        return (visitBrandUpper.includes('LEMON') && targetBrandUpper.includes('LEMON')) ||
               (visitBrandUpper.includes('CRANBERRY') && targetBrandUpper.includes('CRANBERRY')) ||
               (visitBrandUpper.includes('GREEN') && targetBrandUpper.includes('GREEN')) ||
               (visitBrandUpper.includes('GRAIN') && targetBrandUpper.includes('GRAIN'));
      }
      
      // Fallback: exact brand name matching
      return visitBrandUpper === targetBrandUpper;
    };
    
    rows.forEach(row => {
      const rowShopId = row[columnIndices.shopId];
      
      // ⚡ PERFORMANCE: Skip early if shop doesn't match
      if (rowShopId !== shopId) return;
      
      const rowBrand = row[columnIndices.invBrand]?.toString().trim();
      const rowQuantity = parseFloat(row[columnIndices.invQuantity]) || 0;
      const rowDateStr = row[columnIndices.checkInDateTime];
      
      if (rowBrand && rowDateStr) {
        const rowDate = parseDate(rowDateStr);
        if (rowDate && rowDate >= cutoffDate) { // ✅ Filter visits by period
          // 🎯 CRITICAL: Use size-specific matching for visits too
          if (isExactVisitMatch(rowBrand, brandName, targetSize)) {
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

  // 🎯 STEP 1: Get shops visited in the period
  const getShopsVisitedInPeriod = (visitPeriod: number): Set<string> => {
    const visitedShops = new Set<string>();
    
    if (!data.rawVisitData?.rollingPeriodRows) {
      return visitedShops;
    }
    
    const rows = data.rawVisitData.rollingPeriodRows;
    const columnIndices = data.rawVisitData.columnIndices;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - visitPeriod);
    
    rows.forEach(row => {
      const rowShopId = row[columnIndices.shopId];
      const rowDateStr = row[columnIndices.checkInDateTime];
      
      if (rowShopId && rowDateStr) {
        const rowDate = parseDate(rowDateStr);
        if (rowDate && rowDate >= cutoffDate) {
          visitedShops.add(rowShopId);
        }
      }
    });
    
    return visitedShops;
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
      
      // 🎯 STEP 1: Get shops visited in the period
      const shopsVisitedInPeriod = getShopsVisitedInPeriod(filters.visitPeriod);
      console.log(`🎯 Shops visited in last ${filters.visitPeriod} days:`, shopsVisitedInPeriod.size);
      
      // 🎯 STEP 2: Process only visited shops from inventory data
      Object.values(data.shops).forEach(shop => {
        // 🔥 KEY FILTER: Only process shops visited in the period
        if (!shopsVisitedInPeriod.has(shop.shopId)) {
          return; // Skip shops not visited in period
        }
        
        try {
          Object.values(shop.items).forEach((item: any) => {
            try {
              const combinationKey = `${shop.shopId}_${item.brand}`;
              if (processedCombinations.has(combinationKey)) return;
              processedCombinations.add(combinationKey);
              
              const bottleInfo = getBottleSizeInfo(item.brand);
              
              // 🎯 KEY CHANGE: Get MOST RECENT supply delivery only
              const mostRecentSupply = getMostRecentSupplyForSKU(shop.shopId, item.brand);
              
              // 🎯 Get visit data filtered by period
              const visitHistory = getVisitDataForSKU(shop.shopId, item.brand, filters.visitPeriod);
              
              // Calculate metrics based on MOST RECENT supply only
              const totalCasesSupplied = mostRecentSupply ? mostRecentSupply.cases : 0;
              const totalBottlesSupplied = totalCasesSupplied * bottleInfo.conversionRate;
              
              const daysSinceLastVisit = shop.visitDate ? 
                Math.floor((today.getTime() - shop.visitDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
              
              const lastSupplyDate = mostRecentSupply ? mostRecentSupply.date : null;
              const daysSinceLastSupply = lastSupplyDate ?
                Math.floor((today.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
              
              // Calculate theoretical stock based on MOST RECENT supply and expected consumption
              let theoreticalStock = 0;
              if (mostRecentSupply && daysSinceLastSupply !== null) {
                const expectedConsumed = daysSinceLastSupply * bottleInfo.expectedDailyConsumption;
                theoreticalStock = Math.max(0, totalBottlesSupplied - expectedConsumed);
              }
              
              const stockVariance = item.quantity - theoreticalStock;
              const consumptionRate = bottleInfo.expectedDailyConsumption;
              
              const { status, trend } = calculateStockStatus(item.quantity, theoreticalStock, visitHistory);
              
              // Supply frequency: N/A for single delivery
              const supplyFrequency = mostRecentSupply ? daysSinceLastSupply || 0 : 0;
              const visitFrequency = visitHistory.length > 0 ? filters.visitPeriod / visitHistory.length : 0;
              
              let dataQuality: 'complete' | 'partial' | 'supply_only' | 'visit_only' = 'complete';
              if (!mostRecentSupply && visitHistory.length > 0) dataQuality = 'visit_only';
              else if (mostRecentSupply && visitHistory.length === 0) dataQuality = 'supply_only';
              else if (!mostRecentSupply || visitHistory.length === 0) dataQuality = 'partial';
              
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
                supplyHistory: mostRecentSupply ? [{date: mostRecentSupply.date, cases: mostRecentSupply.cases}] : [],
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
      
      console.log(`✅ Processed ${records.length} stock records for ${shopsVisitedInPeriod.size} visited shops`);
      
    } catch (error) {
      console.error('Error in stock records processing:', error);
    }
    
    return records;
  }, [data.shops, data.rawSupplyData, data.rawVisitData, filters.visitPeriod]);

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
    
    const visitedShops = Array.from(new Set(filteredRecords.map(r => r.shopId))).length;
    const totalSupplyRecords = filteredRecords.reduce((sum, record) => sum + record.supplyHistory.length, 0);
    
    return { 
      total, healthy, low, out, overstocked, noData, 
      totalStock, totalSupplied, avgStockLevel, visitedShops, totalSupplyRecords 
    };
  }, [filteredRecords]);

  // ==========================================
  // CSV EXPORT FUNCTIONALITY
  // ==========================================
  const exportStockTrackingCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Header
      csvContent += "STOCK LEVEL TRACKING DASHBOARD REPORT - MOST RECENT SUPPLY\n";
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `🎯 VISIT PERIOD: ${filters.visitPeriod} days (filters which shops to analyze)\n`;
      csvContent += `📦 SUPPLY DATA: Most recent delivery only for visited shops\n`;
      csvContent += `Total Records: ${filteredRecords.length}\n`;
      csvContent += `Visited Shops in Period: ${stats.visitedShops}\n`;
      csvContent += `Supply Records: ${stats.totalSupplyRecords} (latest delivery per shop/SKU)\n`;
      csvContent += `Stock Status: Healthy: ${stats.healthy} | Low: ${stats.low} | Out: ${stats.out} | Overstocked: ${stats.overstocked}\n\n`;
      
      // Column headers
      csvContent += "Shop Name,Shop ID,Department,Salesman,SKU,Bottle Size,Current Stock,Last Visit Date,Last Supply Date,Days Since Visit,Days Since Supply,Cases Supplied (LATEST),Bottles Supplied (LATEST),Theoretical Stock,Stock Variance,Stock Status,Stock Trend,Consumption Rate,Supply Frequency,Visit Frequency,Data Quality,Reason No Stock\n";
      
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
        csvContent += `"${record.reasonNoStock || 'N/A'}",`;
        csvContent += `"${record.supplyHistory.length}",`;
        csvContent += `"${record.visitHistory.length}"\n`;
      });
      
      // Add most recent supply details
      csvContent += "\n\nMOST RECENT SUPPLY FOR VISITED SHOPS\n";
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
      csvContent += "\n\nVISIT HISTORY (PERIOD-FILTERED)\n";
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
      link.setAttribute("download", `Stock_Level_Tracking_FIXED_Visit${filters.visitPeriod}Days_AllSupply_${new Date().toISOString().split('T')[0]}.csv`);
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center space-x-2">
          <span>Stock Level Tracking Dashboard - MOST RECENT SUPPLY</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            ✅ VISITS: {filters.visitPeriod}d | SUPPLY: LATEST ONLY
          </span>
        </h2>
        <p className="text-gray-600">
          🎯 <strong>Visit Period Filtering:</strong> Shows shops visited in last {filters.visitPeriod} days<br/>
          📦 <strong>Supply Data:</strong> Most recent supply delivery only for those shops
        </p>
        <p className="text-sm text-gray-500">
          Logic: Visit Period = {filters.visitPeriod} days • 
          Supply Data = Latest delivery only • 
          Coverage: Only shops visited in period
        </p>
        <div className="mt-2 flex items-center justify-center space-x-4">
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            🎯 FIXED: Visit period filters shops, LATEST supply delivery only
          </span>
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            📊 Size-Specific: Accurate case-to-bottle conversion per SKU size
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Visit Period (Shop Filter):</label>
              <select
                value={filters.visitPeriod}
                onChange={(e) => setFilters({ ...filters, visitPeriod: parseInt(e.target.value) })}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={7}>Last 7 Days</option>
                <option value={15}>Last 15 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
              <span className="text-xs text-gray-500">(Filters which shops to analyze)</span>
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
            title="Export FIXED logic: Visit period filters shops, MOST RECENT supply delivery included"
          >
            <Download className="w-4 h-4" />
            <span>Export FIXED Report</span>
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
              visitPeriod: filters.visitPeriod
            })}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Stock Level Records - FIXED LOGIC</h3>
          <p className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} stock records • 
            🎯 Visit Filter: {filters.visitPeriod} days • 📦 Supply Data: ALL time
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
                  Latest Supply
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
                        <div className="flex items-center space-x-1">
                          <Truck className="w-3 h-3 text-green-400" />
                          <span className="text-xs font-medium">{record.casesSupplied} cases</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Package className="w-3 h-3 text-blue-400" />
                          <span className="text-xs">{record.bottlesSupplied} bottles</span>
                        </div>
                        <div className="text-xs text-gray-500">Latest delivery</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                        className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                        title="View all-time supply details"
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
                              <h4 className="font-medium text-gray-900 mb-2">Latest Supply Activity</h4>
                              <div className="space-y-1 text-sm">
                                <div>Latest Cases: {record.casesSupplied}</div>
                                <div>Latest Bottles: {record.bottlesSupplied}</div>
                                <div>Supply Date: {record.lastSupplyDate ? record.lastSupplyDate.toLocaleDateString('en-GB') : 'No Supply'}</div>
                                <div>Days Since Supply: {record.daysSinceLastSupply || 'N/A'}</div>
                                <div>Conversion Rate: {record.conversionRate} bottles/case</div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Visit Activity (Period)</h4>
                              <div className="space-y-1 text-sm">
                                <div>Last Visit: {record.lastVisitDate ? record.lastVisitDate.toLocaleDateString('en-GB') : 'No Visit'}</div>
                                <div>Days Since Visit: {record.daysSinceLastVisit || 'N/A'}</div>
                                <div>Visit Records: {record.visitHistory.length}</div>
                                <div>Data Quality: {record.dataQuality.replace('_', ' ').toUpperCase()}</div>
                                {record.reasonNoStock && <div>Reason: {record.reasonNoStock}</div>}
                              </div>
                            </div>
                          </div>
                          
                          {/* Most Recent Supply */}
                          {record.supplyHistory.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Most Recent Supply Delivery</h4>
                              <div className="bg-white p-3 rounded border">
                                {record.supplyHistory[0].date.toLocaleDateString('en-GB')}: {record.supplyHistory[0].cases} cases
                                ({record.supplyHistory[0].cases * record.conversionRate} bottles)
                              </div>
                            </div>
                          )}
                          
                          {/* Visit History (Period-Filtered) */}
                          {record.visitHistory.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Visit History - Last {filters.visitPeriod} Days ({record.visitHistory.length} visits)</h4>
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} stock records • 
            🎯 Shops visited in {filters.visitPeriod} days with LATEST supply data
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
