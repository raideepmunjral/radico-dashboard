'use client';

import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, Clock, MapPin, Users, Filter, Search, X, ChevronDown, ChevronUp, BarChart3, Calendar, Eye, AlertCircle, CheckCircle, XCircle, Truck, ShoppingBag, Download, RefreshCw, ChevronLeft, ChevronRight, FileText, Table } from 'lucide-react';

// ==========================================
// ENHANCED INVENTORY TYPES & INTERFACES
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

interface MasterShopInfo {
  shopId: string;
  shopName: string;
  salesman: string;
  department: string;
  salesmanUid: string;
  source: 'master_data';
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

interface EnhancedInventoryFilters {
  department: string;
  salesman: string;
  stockStatus: string;
  ageCategory: string;
  brand: string;
  supplyStatus: string;
  searchText: string;
}

// ==========================================
// ENHANCED INVENTORY DASHBOARD COMPONENT
// ==========================================

const InventoryDashboard = () => {
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [rollingPeriodDays, setRollingPeriodDays] = useState(15);
  const [filters, setFilters] = useState<EnhancedInventoryFilters>({
    department: '',
    salesman: '',
    stockStatus: '',
    ageCategory: '',
    brand: '',
    supplyStatus: '',
    searchText: ''
  });
  const [expandedShop, setExpandedShop] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // ENHANCED CONFIGURATION WITH MASTER DATA
  const SHEETS_CONFIG = {
    visitSheetId: process.env.NEXT_PUBLIC_VISIT_SHEET_ID || '1XG4c_Lrpk-YglTq3G3ZY9Qjt7wSnUq0UZWDSYT61eWE',
    visitArchiveSheetId: process.env.NEXT_PUBLIC_VISIT_ARCHIVE_SHEET_ID || '1U8JVEITLaGwbAGGCKhL7MYV8ns320dDoFF-_6yNxq2o',
    historicalSheetId: process.env.NEXT_PUBLIC_HISTORICAL_SHEET_ID || '1yXzEYHJeHlETrEmU4TZ9F2_qv4OE10N4DPdYX0Iqfx0',
    masterSheetId: process.env.NEXT_PUBLIC_MASTER_SHEET_ID || '1pRz9CgOoamTrFipnmF-XuBCg9IZON9br5avgRlKYtxM',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  };

  // ==========================================
  // ENHANCED BRAND NORMALIZATION SYSTEM
  // ==========================================

  const BRAND_MAPPING: { [key: string]: string } = {
    // 8 PM BRAND FAMILY - ENHANCED WITH ALL SIZE VARIATIONS TO MATCH SUPPLY DATA
    '8 PM BLACK': '8 PM PREMIUM BLACK BLENDED WHISKY',
    '8 PM BLACK 750': '8 PM PREMIUM BLACK BLENDED WHISKY',
    '8 PM BLACK 375': '8 PM PREMIUM BLACK BLENDED WHISKY', 
    '8 PM BLACK 180': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
    '8 PM BLACK 180 P': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
    '8 PM BLACK 90': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
    '8 PM BLACK 60': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
    '8 PM BLACK 60 P': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
    
    // Direct supply sheet mappings (for reverse matching)
    '8 PM PREMIUM BLACK BLENDED WHISKY': '8 PM PREMIUM BLACK BLENDED WHISKY',
    '8 PM PREMIUM BLACK BLENDED WHISKY Pet': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
    
    // VERVE BRAND FAMILY - EXACT NAMES FROM SUPPLY SHEET
    'VERVE LEMON LUSH': 'M2M VERVE LEMON LUSH SUP FL VODKA',
    'VERVE GRAIN': 'M2M VERVE SUPERIOR GRAIN VODKA',
    'VERVE CRANBERRY': 'M2M VERVE CRANBERRY TEASE SP FL VODKA',
    'VERVE GREEN APPLE': 'M2M VERVE GREEN APPLE SUPERIOR FL VODKA',
    
    // Direct supply sheet mappings for VERVE
    'M2M VERVE LEMON LUSH SUP FL VODKA': 'M2M VERVE LEMON LUSH SUP FL VODKA',
    'M2M VERVE SUPERIOR GRAIN VODKA': 'M2M VERVE SUPERIOR GRAIN VODKA',
    'M2M VERVE CRANBERRY TEASE SP FL VODKA': 'M2M VERVE CRANBERRY TEASE SP FL VODKA',
    'M2M VERVE GREEN APPLE SUPERIOR FL VODKA': 'M2M VERVE GREEN APPLE SUPERIOR FL VODKA'
  };

  const normalizeBrandInfo = (brandName: string): { family: string, size: string, normalizedName: string } => {
    let cleanBrand = brandName?.toString().trim().toUpperCase();
    let extractedSize = '';
    
    // Enhanced size extraction to handle "180 P" -> "180P" matching
    const sizeMatch = cleanBrand.match(/(\d+)\s?(P|ML)?$/);
    if (sizeMatch) {
      extractedSize = sizeMatch[1] + (sizeMatch[2] || '');
      cleanBrand = cleanBrand.replace(/\s*\d+\s?(P|ML)?$/, '').trim();
    }
    
    if (!extractedSize) {
      extractedSize = '750';
    }
    
    let normalizedName = cleanBrand;
    const fullBrandWithSize = `${cleanBrand} ${extractedSize}`.trim();
    
    if (BRAND_MAPPING[fullBrandWithSize]) {
      normalizedName = BRAND_MAPPING[fullBrandWithSize];
    } else if (BRAND_MAPPING[cleanBrand]) {
      normalizedName = BRAND_MAPPING[cleanBrand];
    } else {
      if (cleanBrand.includes('8 PM') && cleanBrand.includes('BLACK')) {
        if (extractedSize === '180P' || extractedSize === '60P' || extractedSize === '90P') {
          normalizedName = '8 PM PREMIUM BLACK BLENDED WHISKY Pet';
        } else {
          normalizedName = '8 PM PREMIUM BLACK BLENDED WHISKY';
        }
      }
      else if (cleanBrand.includes('VERVE')) {
        if (cleanBrand.includes('LEMON')) {
          normalizedName = 'M2M VERVE LEMON LUSH SUP FL VODKA';
        } else if (cleanBrand.includes('GRAIN')) {
          normalizedName = 'M2M VERVE SUPERIOR GRAIN VODKA';
        } else if (cleanBrand.includes('CRANBERRY')) {
          normalizedName = 'M2M VERVE CRANBERRY TEASE SP FL VODKA';
        } else if (cleanBrand.includes('GREEN') || cleanBrand.includes('APPLE')) {
          normalizedName = 'M2M VERVE GREEN APPLE SUPERIOR FL VODKA';
        }
      }
    }
    
    return { family: normalizedName, size: extractedSize, normalizedName };
  };

  const createBrandMatchingKey = (shopId: string, brandName: string): string => {
    const brandInfo = normalizeBrandInfo(brandName);
    return `${shopId}_${brandInfo.normalizedName}_${brandInfo.size}`;
  };

  const createMultipleBrandKeys = (shopId: string, brandName: string, size?: string): string[] => {
    const brandInfo = normalizeBrandInfo(brandName);
    const actualSize = size || brandInfo.size;
    
    const keys = [
      `${shopId}_${brandInfo.normalizedName}_${actualSize}`,
      `${shopId}_${brandInfo.family}_${actualSize}`,
      `${shopId}_${brandName.toUpperCase()}_${actualSize}`,
    ];
    
    return [...new Set(keys)];
  };

  // ==========================================
  // NEW: MASTER DATA INTEGRATION FUNCTIONS
  // ==========================================

  const fetchMasterShopData = async (): Promise<any[][]> => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.masterSheetId}/values/Shop%20Details?key=${SHEETS_CONFIG.apiKey}`
      );
      
      if (!response.ok) {
        console.warn('Shop Details sheet not accessible, falling back to visit-based assignment');
        return [];
      }
      
      const result = await response.json();
      console.log('✅ Master shop data fetched:', result.values?.length || 0, 'rows');
      return result.values || [];
    } catch (error) {
      console.warn('❌ Error fetching master shop data:', error);
      return [];
    }
  };

  const processMasterShopData = (masterShopData: any[][]): Map<string, MasterShopInfo> => {
    const shopSalesmanMap = new Map<string, MasterShopInfo>();
    
    if (masterShopData.length <= 1) return shopSalesmanMap;
    
    const headers = masterShopData[0];
    const rows = masterShopData.slice(1);
    
    // Find column indices based on your sheet structure
    const shopIdIndex = headers.findIndex((h: any) => h?.toLowerCase().includes('shop_id'));
    const shopNameIndex = headers.findIndex((h: any) => h?.toLowerCase().includes('shop_name'));
    const shopSalesmanIndex = headers.findIndex((h: any) => h?.toLowerCase().includes('shop_salesman'));
    const departmentIndex = headers.findIndex((h: any) => h?.toLowerCase().includes('shop_dep'));
    const salesmanUidIndex = headers.findIndex((h: any) => h?.toLowerCase().includes('salesman_uid'));
    
    console.log('📊 Master data column indices:', {
      shopId: shopIdIndex,
      shopName: shopNameIndex,
      shopSalesman: shopSalesmanIndex,
      department: departmentIndex,
      salesmanUid: salesmanUidIndex
    });
    
    if (shopIdIndex === -1 || shopSalesmanIndex === -1) {
      console.warn('❌ Required columns not found in master data');
      return shopSalesmanMap;
    }
    
    let processedCount = 0;
    
    rows.forEach((row: any[], index: number) => {
      if (row.length > Math.max(shopIdIndex, shopSalesmanIndex)) {
        const shopId = row[shopIdIndex]?.toString().trim();
        const shopName = row[shopNameIndex]?.toString().trim() || 'Unknown Shop';
        const salesman = row[shopSalesmanIndex]?.toString().trim();
        const department = row[departmentIndex]?.toString().trim() || 'Unknown Department';
        const salesmanUid = row[salesmanUidIndex]?.toString().trim() || '';
        
        if (shopId && salesman) {
          shopSalesmanMap.set(shopId, {
            shopId,
            shopName,
            salesman,
            department,
            salesmanUid,
            source: 'master_data'
          });
          processedCount++;
        }
      }
    });
    
    console.log(`✅ Master shop assignments processed: ${processedCount} shops mapped to salesmen`);
    return shopSalesmanMap;
  };

  // ==========================================
  // ENHANCED DATA FETCHING FUNCTIONS
  // ==========================================

  const fetchInventoryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!SHEETS_CONFIG.apiKey) {
        throw new Error('Google API key not configured');
      }

      console.log(`🔄 Fetching inventory data with master data integration for ${rollingPeriodDays}-day rolling period...`);

      // STEP 1: Fetch master shop data first
      const masterShopData = await fetchMasterShopData();
      
      // STEP 2: Fetch other data sources
      const visitData = await fetchVisitSheetData();
      const needsArchiveData = await checkIfArchiveNeeded(visitData, rollingPeriodDays);
      const archiveData = needsArchiveData ? await fetchVisitArchiveData(rollingPeriodDays) : [];
      const [historicalData, pendingChallans] = await Promise.all([
        fetchHistoricalSheetData(),
        fetchMasterSheetData() // This is for Pending Challans
      ]);
      
      // STEP 3: Process master shop assignments
      const shopSalesmanMap = processMasterShopData(masterShopData);
      
      // STEP 4: Merge and process with master data integration
      const combinedVisitData = mergeVisitData(visitData, archiveData);
      const processedData = processEnhancedInventoryDataWithMaster(
        combinedVisitData, 
        historicalData, 
        pendingChallans, 
        shopSalesmanMap,
        rollingPeriodDays
      );
      setInventoryData(processedData);
      
    } catch (error: any) {
      console.error('❌ Error fetching inventory data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitSheetData = async () => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.visitSheetId}/values/Radico%20Visit%20Final?key=${SHEETS_CONFIG.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch current visit data');
      }
      
      const result = await response.json();
      console.log('✅ Current visit data fetched:', result.values?.length || 0, 'rows');
      return result.values || [];
    } catch (error) {
      console.error('❌ Error fetching current visit data:', error);
      return [];
    }
  };

  const checkIfArchiveNeeded = async (visitData: any[][], rollingPeriodDays: number): Promise<boolean> => {
    if (visitData.length <= 1) {
      console.log('📋 No current visit data, fetching archive...');
      return true;
    }

    const today = new Date();
    const rollingPeriodStart = new Date(today.getTime() - (rollingPeriodDays * 24 * 60 * 60 * 1000));
    
    console.log(`📅 Checking data coverage for ${rollingPeriodDays}-day period: ${rollingPeriodStart.toLocaleDateString()} to ${today.toLocaleDateString()}`);

    const headers = visitData[0];
    const rows = visitData.slice(1);
    
    const dateColumnIndex = headers.findIndex((header: any) => 
      header && header.toString().toLowerCase().includes('check in date') ||
      header && header.toString().toLowerCase().includes('check_in') ||
      header && header.toString().toLowerCase().includes('datetime')
    );
    
    if (dateColumnIndex === -1) {
      console.warn('⚠️ Date column not found, fetching archive as safety measure');
      return true;
    }

    let earliestDate: Date | null = null;
    let validDatesFound = 0;
    
    for (const row of rows) {
      const dateStr = row[dateColumnIndex];
      if (dateStr) {
        const rowDate = parseDate(dateStr);
        if (rowDate) {
          validDatesFound++;
          if (!earliestDate || rowDate < earliestDate) {
            earliestDate = rowDate;
          }
        }
      }
    }

    if (!earliestDate) {
      console.log('📋 No valid dates found in current data, fetching archive...');
      return true;
    }

    const dataCoverageStartsAt = earliestDate;
    const requiredCoverageStartsAt = rollingPeriodStart;
    
    const daysCovered = Math.floor((today.getTime() - dataCoverageStartsAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysRequired = rollingPeriodDays;
    
    console.log(`📊 Data Coverage Analysis:`, {
      earliestDataDate: dataCoverageStartsAt.toLocaleDateString(),
      requiredStartDate: requiredCoverageStartsAt.toLocaleDateString(),
      daysCoveredByCurrent: daysCovered,
      daysRequiredForPeriod: daysRequired,
      validDatesInCurrent: validDatesFound,
      totalRowsInCurrent: rows.length
    });

    const needsArchive = dataCoverageStartsAt > requiredCoverageStartsAt;
    
    if (needsArchive) {
      const missingDays = Math.floor((dataCoverageStartsAt.getTime() - requiredCoverageStartsAt.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`🔄 Archive needed: Current data missing ${missingDays} days from start of rolling period`);
    } else {
      console.log(`✅ Current data sufficient: Covers full ${rollingPeriodDays}-day period`);
    }
    
    return needsArchive;
  };

  const fetchVisitArchiveData = async (rollingPeriodDays: number) => {
    try {
      console.log(`📋 Fetching archive data to fill gaps in ${rollingPeriodDays}-day rolling period...`);
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.visitArchiveSheetId}/values/Archive%201?key=${SHEETS_CONFIG.apiKey}`
      );
      
      if (!response.ok) {
        console.warn('⚠️ Archive sheet not accessible, continuing with available data only');
        return [];
      }
      
      const result = await response.json();
      console.log('✅ Archive visit data fetched:', result.values?.length || 0, 'rows');
      return result.values || [];
    } catch (error) {
      console.warn('⚠️ Error fetching archive data:', error);
      return [];
    }
  };

  const mergeVisitData = (currentData: any[][], archiveData: any[][]) => {
    if (archiveData.length === 0) {
      console.log('📋 Using current data only - no archive data needed/available');
      return currentData;
    }

    if (currentData.length === 0) {
      console.log('📋 Using archive data only - no current data available');
      return archiveData;
    }

    const headers = currentData[0] || archiveData[0] || [];
    const currentRows = currentData.slice(1);
    const archiveRows = archiveData.slice(1);
    
    const mergedData = [headers, ...currentRows, ...archiveRows];
    
    console.log('🔄 Visit data intelligently merged:', {
      currentRows: currentRows.length,
      archiveRows: archiveRows.length,
      totalMerged: mergedData.length - 1,
      headers: headers.length,
      strategy: 'Smart gap-filling based on data coverage analysis'
    });
    
    return mergedData;
  };

  const fetchHistoricalSheetData = async () => {
    try {
      const possibleSheetNames = ['MASTER', 'radico 24 25', 'Sheet1', 'Data'];
      
      for (const sheetName of possibleSheetNames) {
        try {
          const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.historicalSheetId}/values/${encodeURIComponent(sheetName)}?key=${SHEETS_CONFIG.apiKey}`
          );
          
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Historical data fetched from ${sheetName}:`, result.values?.length || 0, 'rows');
            return result.values || [];
          }
        } catch (err) {
          continue;
        }
      }
      
      console.warn('❌ No accessible historical sheet found');
      return [];
    } catch (error) {
      console.warn('❌ Error fetching historical data:', error);
      return [];
    }
  };

  const fetchMasterSheetData = async () => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.masterSheetId}/values/Pending%20Challans?key=${SHEETS_CONFIG.apiKey}`
      );
      
      if (!response.ok) {
        console.warn('Pending Challans sheet not accessible');
        return [];
      }
      
      const result = await response.json();
      console.log('✅ Pending Challans data fetched:', result.values?.length || 0, 'rows');
      return result.values || [];
    } catch (error) {
      console.warn('❌ Error fetching pending challans:', error);
      return [];
    }
  };

  // ==========================================
  // ENHANCED DATA PROCESSING WITH MASTER DATA
  // ==========================================

  const processEnhancedInventoryDataWithMaster = (
    visitData: any[][], 
    historicalData: any[][], 
    pendingChallans: any[][], 
    shopSalesmanMap: Map<string, MasterShopInfo>,
    rollingDays: number = 15
  ): InventoryData => {
    console.log(`🔧 Processing inventory data WITH MASTER DATA INTEGRATION (${rollingDays}-day rolling period)...`);
    
    if (visitData.length === 0) {
      throw new Error('No visit data found');
    }

    const headers = visitData[0];
    const rows = visitData.slice(1);

    console.log('📋 Headers found:', headers);

    const getColumnIndex = (searchTerms: string[]) => {
      for (const term of searchTerms) {
        const index = headers.findIndex((header: any) => 
          header && header.toString().toLowerCase().includes(term.toLowerCase())
        );
        if (index !== -1) {
          console.log(`✅ Found column "${term}" at index ${index}: "${headers[index]}"`);
          return index;
        }
      }
      console.warn(`❌ Column not found for terms:`, searchTerms);
      return -1;
    };

    const columnIndices = {
      shopId: getColumnIndex(['shop id', 'shop_id']),
      shopName: getColumnIndex(['shop name', 'shop_name']),
      department: getColumnIndex(['department']),
      salesman: getColumnIndex(['salesman']),
      checkInDateTime: getColumnIndex(['check in date', 'check_in', 'datetime']),
      invBrand: getColumnIndex(['inv brand', 'inv_brand', 'brand', 'tva brand']),
      invQuantity: getColumnIndex(['inv quantity', 'inv_quantity', 'quantity', 'tva target', 'bottles']),
      reasonNoStock: getColumnIndex(['reason', 'no stock', 'reason for no stock']),
      lsDate: getColumnIndex(['ls date', 'ls_date'])
    };

    console.log('📊 Column indices found:', columnIndices);

    const requiredColumns = ['shopId', 'shopName', 'invBrand', 'invQuantity', 'checkInDateTime'];
    for (const col of requiredColumns) {
      if (columnIndices[col as keyof typeof columnIndices] === -1) {
        throw new Error(`Required column '${col}' not found`);
      }
    }

    const supplyHistory = processHistoricalSupplyData(historicalData);
    const recentSupplies = processPendingChallans(pendingChallans);
    
    console.log('📊 Supply data processed:', {
      historicalEntries: Object.keys(supplyHistory).length,
      recentSupplies: Object.keys(recentSupplies).length
    });
    
    // ENHANCED: Master data integration with fallback logic
    console.log('🏪 Applying master data assignments with visit data fallback...');
    
    let masterDataAssignments = 0;
    let visitDataFallbacks = 0;
    let currentShopInfo: any = null;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const shopId = row[columnIndices.shopId];
      
      // Priority 1: Use master data if available
      if (shopId && shopSalesmanMap.has(shopId)) {
        const masterInfo = shopSalesmanMap.get(shopId)!;
        row[columnIndices.shopId] = masterInfo.shopId;
        row[columnIndices.shopName] = masterInfo.shopName;
        row[columnIndices.department] = masterInfo.department;
        row[columnIndices.salesman] = masterInfo.salesman;
        
        currentShopInfo = {
          ...masterInfo,
          checkInDateTime: row[columnIndices.checkInDateTime]
        };
        masterDataAssignments++;
        
        if (i % 100 === 0) { // Log every 100th for performance
          console.log(`🎯 Master assignment: ${masterInfo.shopName} → ${masterInfo.salesman}`);
        }
      }
      // Priority 2: Fallback to visit data logic (existing forward propagation)
      else if (shopId && row[columnIndices.shopName]) {
        currentShopInfo = {
          shopId: row[columnIndices.shopId],
          shopName: row[columnIndices.shopName],
          checkInDateTime: row[columnIndices.checkInDateTime],
          department: row[columnIndices.department],
          salesman: row[columnIndices.salesman],
          source: 'visit_data'
        };
        visitDataFallbacks++;
        
        if (i % 100 === 0) { // Log every 100th for performance
          console.log(`📋 Visit fallback: ${currentShopInfo.shopName} → ${currentShopInfo.salesman}`);
        }
      }
      
      // Apply current shop info to inventory rows
      const invBrand = row[columnIndices.invBrand];
      if (invBrand && invBrand.toString().trim() && !row[columnIndices.shopId] && currentShopInfo) {
        row[columnIndices.shopId] = currentShopInfo.shopId;
        row[columnIndices.shopName] = currentShopInfo.shopName;
        row[columnIndices.checkInDateTime] = currentShopInfo.checkInDateTime;
        row[columnIndices.department] = currentShopInfo.department;
        row[columnIndices.salesman] = currentShopInfo.salesman;
      }
    }
    
    console.log(`🎉 Assignment complete:`, {
      masterDataAssignments,
      visitDataFallbacks,
      totalShopsWithMasterData: shopSalesmanMap.size,
      assignmentStrategy: 'Master Data Priority with Visit Data Fallback'
    });

    // ROLLING PERIOD LOGIC
    const today = new Date();
    const rollingPeriodStart = new Date(today.getTime() - (rollingDays * 24 * 60 * 60 * 1000));
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

    console.log(`📅 ${rollingDays}-Day Rolling Period: ${rollingPeriodStart.toLocaleDateString()} to ${today.toLocaleDateString()}`);

    const rollingPeriodRows = rows.filter(row => {
      const dateStr = row[columnIndices.checkInDateTime];
      if (!dateStr) return false;
      
      try {
        const rowDate = parseDate(dateStr);
        if (!rowDate) return false;
        
        const isWithinRollingPeriod = rowDate >= rollingPeriodStart && rowDate <= today;
        return isWithinRollingPeriod;
      } catch (error) {
        console.warn(`Failed to parse date: ${dateStr}`, error);
        return false;
      }
    });

    console.log(`📅 Rolling period visits: ${rollingPeriodRows.length} out of ${rows.length} total rows`);

    if (rollingPeriodRows.length === 0) {
      console.log(`⚠️ No data found in ${rollingDays}-day period, expanding to 60 days...`);
      
      const extendedPeriodStart = new Date(today.getTime() - (60 * 24 * 60 * 60 * 1000));
      console.log(`📅 Extended period: ${extendedPeriodStart.toLocaleDateString()} to ${today.toLocaleDateString()}`);
      
      return processEnhancedInventoryDataWithMaster(visitData, historicalData, pendingChallans, shopSalesmanMap, 60);
    }

    // Find latest visits for each shop
    const shopLatestVisits: Record<string, any> = {};
    
    rollingPeriodRows.forEach(row => {
      const shopId = row[columnIndices.shopId];
      const checkInDateTime = row[columnIndices.checkInDateTime];
      
      if (!shopId || !checkInDateTime) return;
      
      try {
        const visitDate = parseDate(checkInDateTime);
        if (!visitDate) return;
        
        if (!shopLatestVisits[shopId] || visitDate > shopLatestVisits[shopId].visitDate) {
          // Use master data if available, otherwise fall back to visit data
          const masterInfo = shopSalesmanMap.get(shopId);
          
          shopLatestVisits[shopId] = {
            shopId,
            shopName: masterInfo?.shopName || row[columnIndices.shopName] || 'Unknown Shop',
            department: masterInfo?.department || row[columnIndices.department] || 'Unknown',
            salesman: masterInfo?.salesman || row[columnIndices.salesman] || 'Unknown',
            visitDate,
            dataSource: masterInfo ? 'master_data' : 'visit_data',
            salesmanUid: masterInfo?.salesmanUid || ''
          };
        }
      } catch (error) {
        console.warn(`Invalid date format for shop ${shopId}: ${checkInDateTime}`, error);
      }
    });

    console.log(`🏪 Latest visits found for ${Object.keys(shopLatestVisits).length} unique shops in ${rollingDays}-day rolling period`);
    
    // Add all shops from master data that might not have been visited
    shopSalesmanMap.forEach((masterInfo, shopId) => {
      if (!shopLatestVisits[shopId]) {
        console.log(`📋 Adding non-visited shop from master data: ${masterInfo.shopName} → ${masterInfo.salesman}`);
        
        shopLatestVisits[shopId] = {
          shopId: masterInfo.shopId,
          shopName: masterInfo.shopName,
          department: masterInfo.department,
          salesman: masterInfo.salesman,
          visitDate: null, // No recent visit
          dataSource: 'master_data_only',
          salesmanUid: masterInfo.salesmanUid,
          lastVisitDays: null // Will be calculated based on historical data
        };
      }
    });

    console.log(`🎯 Final shop count: ${Object.keys(shopLatestVisits).length} (including non-visited shops from master data)`);
    
    const shopLatestVisitRows: Record<string, any[]> = {};
    
    rollingPeriodRows.forEach(row => {
      const shopId = row[columnIndices.shopId];
      const checkInDateTime = row[columnIndices.checkInDateTime];
      
      if (!shopId || !checkInDateTime) return;
      
      try {
        const visitDate = parseDate(checkInDateTime);
        if (!visitDate) return;
        
        const latestVisit = shopLatestVisits[shopId];
        
        if (latestVisit && latestVisit.visitDate && visitDate.getTime() === latestVisit.visitDate.getTime()) {
          if (!shopLatestVisitRows[shopId]) {
            shopLatestVisitRows[shopId] = [];
          }
          shopLatestVisitRows[shopId].push(row);
        }
      } catch (error) {
        // Skip invalid dates
      }
    });

    // ENHANCED: Count actual total visits vs unique shops  
    let totalActualVisits = 0;
    let todayVisitCount = 0;
    let yesterdayVisitCount = 0;
    let lastWeekVisitCount = 0;
    
    const salesmenVisits: Record<string, any> = {};
    
    // First pass: Count all actual visits for proper totals
    rollingPeriodRows.forEach(row => {
      const shopId = row[columnIndices.shopId];
      const checkInDateTime = row[columnIndices.checkInDateTime];
      const salesman = row[columnIndices.salesman];
      
      if (!shopId || !checkInDateTime || !salesman) return;
      
      try {
        const visitDate = parseDate(checkInDateTime);
        if (!visitDate) return;
        
        totalActualVisits++;
        
        // Initialize salesman tracking
        if (!salesmenVisits[salesman]) {
          salesmenVisits[salesman] = {
            name: salesman,
            totalActualVisits: 0,
            uniqueShops: new Set(),
            todayVisits: 0,
            yesterdayVisits: 0,
            lastWeekVisits: 0
          };
        }
        
        // Count actual visits per salesman
        salesmenVisits[salesman].totalActualVisits++;
        salesmenVisits[salesman].uniqueShops.add(shopId);
        
        // Time-based visit tracking
        if (visitDate.toDateString() === today.toDateString()) {
          todayVisitCount++;
          salesmenVisits[salesman].todayVisits++;
        }
        
        if (visitDate.toDateString() === yesterday.toDateString()) {
          yesterdayVisitCount++;
          salesmenVisits[salesman].yesterdayVisits++;
        }
        
        if (visitDate >= lastWeek) {
          lastWeekVisitCount++;
          salesmenVisits[salesman].lastWeekVisits++;
        }
      } catch (error) {
        // Skip invalid dates
      }
    });

    // Process inventory for each shop
    const shops: Record<string, ShopInventory> = {};
    const skuTracker: Record<string, any> = {};
    const allAgingLocations: Array<any> = [];
    const outOfStockItems: Array<any> = [];
    const processedSKUs = new Set<string>();

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
        lastVisitDays: shopVisit.visitDate ? Math.floor((today.getTime() - shopVisit.visitDate.getTime()) / (1000 * 60 * 60 * 24)) : null,
        dataSource: shopVisit.dataSource,
        salesmanUid: shopVisit.salesmanUid
      };

      const visitRows = shopLatestVisitRows[shopVisit.shopId] || [];
      
      visitRows.forEach((row: any[], rowIndex: number) => {
        const brand = row[columnIndices.invBrand]?.toString().trim();
        const quantity = parseFloat(row[columnIndices.invQuantity]) || 0;
        const reasonNoStock = row[columnIndices.reasonNoStock]?.toString().trim() || '';

        if (!brand) return;
        
        processedSKUs.add(brand);
        
        const supplyCheckResult = checkSuppliedAfterOutOfStock(
          shopVisit.shopId, 
          brand, 
          shopVisit.visitDate || today, 
          recentSupplies
        );

        const agingResult = getLatestSupplyDateForAging(
          shopVisit.shopId,
          brand,
          recentSupplies,
          supplyHistory
        );

        let lastSupplyDate = agingResult.lastSupplyDate!;
        let isEstimatedAge = agingResult.isEstimatedAge;
        let ageInDays = shopVisit.visitDate ? Math.floor((shopVisit.visitDate.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        if (ageInDays < 0) {
          ageInDays = Math.abs(ageInDays);
        }

        let ageCategory: InventoryItem['ageCategory'] = 'lessThan30Days';
        if (ageInDays >= 90) ageCategory = 'over90Days';
        else if (ageInDays >= 75) ageCategory = 'days75to90';
        else if (ageInDays >= 60) ageCategory = 'days60to75';
        else if (ageInDays >= 45) ageCategory = 'days45to60';
        else if (ageInDays >= 30) ageCategory = 'days30to45';

        const advancedSupplyStatus = getAdvancedSupplyStatus(
          quantity,
          shopVisit.visitDate || today,
          supplyCheckResult
        );

        let supplyStatus: InventoryItem['supplyStatus'] = 'unknown';
        
        if (supplyCheckResult.wasRestocked) {
          supplyStatus = 'recently_restocked';
        } else if (quantity === 0) {
          supplyStatus = 'awaiting_supply';
        } else {
          if (ageInDays >= 90) supplyStatus = 'aging_critical';
          else if (ageInDays >= 75) supplyStatus = 'aging_75_90';
          else if (ageInDays >= 60) supplyStatus = 'aging_60_75';
          else if (ageInDays >= 45) supplyStatus = 'aging_45_60';
          else if (ageInDays >= 30) supplyStatus = 'aging_30_45';
          else supplyStatus = 'current';
        }

        const isNeverOrdered = reasonNoStock && reasonNoStock.toLowerCase().includes('never');
        const isDiscontinued = reasonNoStock && reasonNoStock.toLowerCase().includes('discontin');
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
          lastSupplyDate,
          isEstimatedAge,
          suppliedAfterOutOfStock: supplyCheckResult.wasRestocked,
          daysSinceLastSupply: lastSupplyDate ? Math.floor(((shopVisit.visitDate || today).getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined,
          supplyStatus
        };

        (inventoryItem as any).daysOutOfStock = supplyCheckResult.daysOutOfStock;
        (inventoryItem as any).supplyDateAfterVisit = supplyCheckResult.supplyDate;
        (inventoryItem as any).currentDaysOutOfStock = isOutOfStock ? calculateDaysCurrentlyOutOfStock(shopVisit.visitDate || today) : undefined;
        (inventoryItem as any).isInGracePeriod = supplyCheckResult.isInGracePeriod;
        (inventoryItem as any).advancedSupplyStatus = advancedSupplyStatus;
        (inventoryItem as any).daysSinceSupply = supplyCheckResult.daysSinceSupply;
        (inventoryItem as any).agingDataSource = agingResult.source;

        shopInventory.items[brand] = inventoryItem;
        shopInventory.totalItems++;

        if (isInStock) shopInventory.inStockCount++;
        else if (isLowStock) shopInventory.lowStockCount++;
        else if (isOutOfStock) shopInventory.outOfStockCount++;

        if (ageInDays >= 30 && quantity > 0) {
          shopInventory.agingInventoryCount++;
          
          const agingLocation = {
            sku: brand,
            shopName: shopInventory.shopName,
            department: shopInventory.department,
            salesman: shopInventory.salesman,
            ageInDays,
            quantity,
            lastSupplyDate,
            isEstimatedAge,
            supplyStatus,
            visitDate: shopInventory.visitDate,
            agingDataSource: agingResult.source
          } as any;
          
          allAgingLocations.push(agingLocation);
        }

        if (isOutOfStock || supplyCheckResult.wasRestocked) {
          const outOfStockItem = {
            sku: brand,
            shopName: shopInventory.shopName,
            department: shopInventory.department,
            salesman: shopInventory.salesman,
            reasonNoStock,
            visitDate: shopInventory.visitDate,
            suppliedAfterOutOfStock: supplyCheckResult.wasRestocked,
            daysOutOfStock: supplyCheckResult.daysOutOfStock,
            currentDaysOutOfStock: calculateDaysCurrentlyOutOfStock(shopVisit.visitDate || today),
            supplyDateAfterVisit: supplyCheckResult.supplyDate,
            isInGracePeriod: supplyCheckResult.isInGracePeriod,
            advancedSupplyStatus: advancedSupplyStatus,
            daysSinceSupply: supplyCheckResult.daysSinceSupply
          } as any;
          
          outOfStockItems.push(outOfStockItem);
        }

        if (!skuTracker[brand]) {
          skuTracker[brand] = {
            name: brand,
            trackedShops: 0,
            inStockCount: 0,
            outOfStockCount: 0,
            restockedCount: 0, // NEW: Track restocked items
            agingLocations: []
          };
        }

        skuTracker[brand].trackedShops++;
        if (isInStock) skuTracker[brand].inStockCount++;
        else if (isOutOfStock) skuTracker[brand].outOfStockCount++;

        // NEW: Track restocked items per SKU
        if (supplyCheckResult.wasRestocked || (inventoryItem as any).advancedSupplyStatus?.includes('Restocked')) {
          skuTracker[brand].restockedCount++;
        }

        if (ageInDays >= 30 && quantity > 0) {
          const agingLocation = {
            shopName: shopInventory.shopName,
            department: shopInventory.department,
            salesman: shopInventory.salesman,
            ageInDays,
            quantity,
            lastSupplyDate,
            suppliedAfterOutOfStock: supplyCheckResult.wasRestocked,
            agingDataSource: agingResult.source
          } as any;
          
          skuTracker[brand].agingLocations.push(agingLocation);
        }
      });

      shops[shopVisit.shopId] = shopInventory;
    });

    const skuPerformance = Object.values(skuTracker).map((sku: any) => ({
      ...sku,
      outOfStockPercentage: sku.trackedShops > 0 ? Math.round((sku.outOfStockCount / sku.trackedShops) * 100) : 0
    })).sort((a, b) => b.outOfStockPercentage - a.outOfStockPercentage);

    allAgingLocations.sort((a, b) => b.ageInDays - a.ageInDays);

    const totalShops = Object.keys(shops).length;
    const visitedShops = Object.values(shops).filter(shop => shop.visitDate !== null).length;
    const totalSKUs = Object.keys(skuTracker).length;
    const totalOutOfStock = Object.values(shops).reduce((sum, shop) => sum + shop.outOfStockCount, 0);
    const totalLowStock = Object.values(shops).reduce((sum, shop) => sum + shop.lowStockCount, 0);
    const totalAging = Object.values(shops).reduce((sum, shop) => sum + shop.agingInventoryCount, 0);
    const avgAge = allAgingLocations.length > 0 ? 
      Math.round(allAgingLocations.reduce((sum, item) => sum + item.ageInDays, 0) / allAgingLocations.length) : 0;
    const recentlyRestockedItems = Object.values(shops).reduce((sum, shop) => 
      sum + Object.values(shop.items).filter(item => {
        const isRestocked = item.suppliedAfterOutOfStock || (item as any).advancedSupplyStatus?.includes('Restocked');
        return isRestocked;
      }).length, 0);

    const salesmenStats = Object.values(salesmenVisits).map((salesman: any) => ({
      name: salesman.name,
      rollingPeriodVisits: salesman.totalActualVisits, // FIXED: Use actual total visits
      uniqueShops: salesman.uniqueShops.size, // Unique shops visited
      todayVisits: salesman.todayVisits,
      yesterdayVisits: salesman.yesterdayVisits,
      lastWeekVisits: salesman.lastWeekVisits
    })).sort((a, b) => b.rollingPeriodVisits - a.rollingPeriodVisits);

    console.log(`🎉 Enhanced inventory processing complete (${rollingDays}-day rolling):`, {
      totalShops,
      visitedShops,
      totalSKUs,
      totalOutOfStock,
      totalAging,
      recentlyRestockedItems,
      processedSKUs: processedSKUs.size,
      outOfStockItemsCollected: outOfStockItems.length,
      agingLocationsCollected: allAgingLocations.length,
      rollingPeriodDays: rollingDays,
      periodStart: rollingPeriodStart.toLocaleDateString(),
      periodEnd: today.toLocaleDateString(),
      masterDataIntegration: {
        totalMasterShops: shopSalesmanMap.size,
        masterDataAssignments,
        visitDataFallbacks,
        assignmentCoverage: Math.round((masterDataAssignments / (masterDataAssignments + visitDataFallbacks)) * 100)
      },
      dataSourcesUsed: {
        recentSupplies: Object.keys(recentSupplies).length,
        historicalSupplies: Object.keys(supplyHistory).length,
        visitRowsProcessed: rollingPeriodRows.length
      }
    });

    return {
      summary: {
        totalShops,
        visitedShops,
        totalSKUs,
        totalOutOfStock,
        totalLowStock,
        totalAging,
        avgAge,
        coveragePercent: Math.round((visitedShops / totalShops) * 100),
        recentlyRestockedItems,
        rollingPeriodDays: rollingDays,
        periodStartDate: rollingPeriodStart,
        periodEndDate: today,
        masterDataIntegration: {
          totalMasterShops: shopSalesmanMap.size,
          masterDataAssignments,
          visitDataFallbacks,
          assignmentCoverage: Math.round((masterDataAssignments / (masterDataAssignments + visitDataFallbacks)) * 100)
        }
      },
      shops,
      skuPerformance,
      allAgingLocations,
      outOfStockItems,
      visitCompliance: {
        totalSalesmen: salesmenStats.length,
        activeSalesmen: salesmenStats.filter(s => s.rollingPeriodVisits > 0).length,
        rollingPeriodVisits: totalActualVisits, // FIXED: Use actual total visits
        todayVisits: todayVisitCount,
        yesterdayVisits: yesterdayVisitCount,
        lastWeekVisits: lastWeekVisitCount,
        salesmenStats
      }
    };
  };

  // ==========================================
  // EXISTING HELPER FUNCTIONS (UNCHANGED)
  // ==========================================

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    try {
      if (dateStr.includes('-') && (dateStr.includes('Jan') || dateStr.includes('Feb') || dateStr.includes('Mar') || 
          dateStr.includes('Apr') || dateStr.includes('May') || dateStr.includes('Jun') || 
          dateStr.includes('Jul') || dateStr.includes('Aug') || dateStr.includes('Sep') || 
          dateStr.includes('Oct') || dateStr.includes('Nov') || dateStr.includes('Dec'))) {
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
      
      if (dateStr.includes('-') && !dateStr.includes(':')) {
        const dateParts = dateStr.split('-');
        if (dateParts.length === 3) {
          if (dateParts[0].length === 4) {
            const parsedDate = new Date(dateStr);
            return parsedDate;
          } else {
            const parsedDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
            return parsedDate;
          }
        }
      }
      
      if (dateStr.includes('/')) {
        const dateParts = dateStr.split('/');
        if (dateParts.length === 3) {
          const parsedDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
          return parsedDate;
        }
      }
      
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const processHistoricalSupplyData = (historicalData: any[][]) => {
    const supplyHistory: Record<string, Date> = {};
    
    if (historicalData.length <= 1) return supplyHistory;
    
    const headers = historicalData[0];
    const rows = historicalData.slice(1);
    
    const shopIdIndex = headers.findIndex((h: any) => h?.toLowerCase().includes('shop_id'));
    const brandShortIndex = headers.findIndex((h: any) => h?.toLowerCase().includes('brand_short'));
    const brandIndex = headers.findIndex((h: any) => h?.toLowerCase().includes('brand') && !h?.toLowerCase().includes('short'));
    const sizeIndex = headers.findIndex((h: any) => h?.toLowerCase().includes('size'));
    const dateIndex = headers.findIndex((h: any) => h?.toLowerCase().includes('date'));
    const casesIndex = headers.findIndex((h: any) => h?.toLowerCase().includes('cases'));
    
    if (shopIdIndex === -1 || (brandShortIndex === -1 && brandIndex === -1) || dateIndex === -1) {
      console.warn('⚠️ Historical data columns not found');
      return supplyHistory;
    }
    
    let processedEntries = 0;
    
    rows.forEach((row, index) => {
      if (row.length > Math.max(shopIdIndex, brandShortIndex !== -1 ? brandShortIndex : brandIndex, dateIndex)) {
        const shopId = row[shopIdIndex]?.toString().trim();
        const brand = row[brandShortIndex !== -1 ? brandShortIndex : brandIndex]?.toString().trim();
        const size = sizeIndex !== -1 ? row[sizeIndex]?.toString().trim() : '';
        const dateStr = row[dateIndex]?.toString().trim();
        const cases = casesIndex !== -1 ? parseFloat(row[casesIndex]) || 0 : 1;
        
        if (shopId && brand && dateStr && cases > 0) {
          const date = parseDate(dateStr);
          if (date && !isNaN(date.getTime())) {
            const possibleKeys = createMultipleBrandKeys(shopId, brand, size);
            possibleKeys.forEach(key => {
              if (!supplyHistory[key] || date > supplyHistory[key]) {
                supplyHistory[key] = date;
              }
            });
            processedEntries++;
          }
        }
      }
    });
    
    console.log('📊 Historical supply data processed:', processedEntries, 'valid entries');
    return supplyHistory;
  };

  const processPendingChallans = (pendingChallans: any[][]) => {
    const recentSupplies: Record<string, Date> = {};
    
    if (pendingChallans.length <= 1) return recentSupplies;
    
    const headers = pendingChallans[0];
    const rows = pendingChallans.slice(1);
    
    const challansDateIndex = 1;
    const shopIdIndex = 8;
    const shopNameIndex = 9;
    const brandIndex = 11;
    const sizeIndex = 12;
    const packIndex = 13;
    const casesIndex = 14;
    
    console.log('📊 Using column indices for Pending Challans:');
    console.log(`Date: ${challansDateIndex} (B), Shop: ${shopIdIndex} (I), Brand: ${brandIndex} (L), Size: ${sizeIndex} (M), Cases: ${casesIndex} (O)`);
    
    let processedEntries = 0;
    
    rows.forEach((row, index) => {
      if (row.length > Math.max(shopIdIndex, brandIndex, challansDateIndex, casesIndex)) {
        const shopId = row[shopIdIndex]?.toString().trim();
        const brand = row[brandIndex]?.toString().trim();
        const size = row[sizeIndex]?.toString().trim() || '';
        const pack = row[packIndex]?.toString().trim() || '';
        const dateStr = row[challansDateIndex]?.toString().trim();
        const cases = parseFloat(row[casesIndex]) || 0;
        
        if (shopId && brand && dateStr && cases > 0) {
          const date = parseDate(dateStr);
          if (date && !isNaN(date.getTime())) {
            const possibleKeys = createMultipleBrandKeys(shopId, brand, size);
            possibleKeys.forEach(key => {
              if (!recentSupplies[key] || date > recentSupplies[key]) {
                recentSupplies[key] = date;
              }
            });
            
            processedEntries++;
          }
        }
      }
    });
    
    console.log('📦 Pending Challans processed:', processedEntries, 'valid entries');
    console.log('📦 Total supply keys created:', Object.keys(recentSupplies).length);
    
    return recentSupplies;
  };

  const getLatestSupplyDateForAging = (
    shopId: string, 
    brandName: string, 
    recentSupplies: Record<string, Date>,
    supplyHistory: Record<string, Date>
  ): { lastSupplyDate: Date | null, isEstimatedAge: boolean, source: string } => {
    
    const possibleKeys = createMultipleBrandKeys(shopId, brandName);
    
    let latestSupplyDate: Date | null = null;
    let matchedSource = 'no_supply_data';
    
    for (const key of possibleKeys) {
      const supplyDate = recentSupplies[key];
      if (supplyDate) {
        if (!latestSupplyDate || supplyDate > latestSupplyDate) {
          latestSupplyDate = supplyDate;
          matchedSource = 'recent_supply';
        }
      }
    }
    
    if (!latestSupplyDate) {
      for (const key of possibleKeys) {
        const supplyDate = supplyHistory[key];
        if (supplyDate) {
          if (!latestSupplyDate || supplyDate > latestSupplyDate) {
            latestSupplyDate = supplyDate;
            matchedSource = 'historical_supply';
          }
        }
      }
    }
    
    if (!latestSupplyDate) {
      latestSupplyDate = new Date('2024-04-01');
      matchedSource = 'no_supply_data';
    }
    
    return {
      lastSupplyDate: latestSupplyDate,
      isEstimatedAge: matchedSource === 'no_supply_data',
      source: matchedSource
    };
  };

  const checkSuppliedAfterOutOfStock = (
    shopId: string, 
    brandName: string, 
    visitDate: Date, 
    recentSupplies: Record<string, Date>
  ): { 
    wasRestocked: boolean, 
    daysOutOfStock?: number, 
    supplyDate?: Date, 
    isInGracePeriod?: boolean,
    daysSinceSupply?: number,
    matchedKey?: string
  } => {
    const today = new Date();
    const brandInfo = normalizeBrandInfo(brandName);
    
    const possibleKeys = createMultipleBrandKeys(shopId, brandName);
    
    let latestSupplyDate: Date | null = null;
    let matchedKey = '';
    
    for (const key of possibleKeys) {
      const supplyDate = recentSupplies[key];
      if (supplyDate) {
        if (!latestSupplyDate || supplyDate > latestSupplyDate) {
          latestSupplyDate = supplyDate;
          matchedKey = key;
        }
      }
    }
    
    if (latestSupplyDate && latestSupplyDate > visitDate) {
      const daysOutOfStock = Math.floor((latestSupplyDate.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysSinceSupply = Math.floor((today.getTime() - latestSupplyDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const isInGracePeriod = daysSinceSupply <= 7;
      
      return { 
        wasRestocked: true, 
        daysOutOfStock: daysOutOfStock,
        supplyDate: latestSupplyDate,
        isInGracePeriod: isInGracePeriod,
        daysSinceSupply: daysSinceSupply,
        matchedKey: matchedKey
      };
    }
    
    return { wasRestocked: false };
  };

  const getAdvancedSupplyStatus = (
    quantity: number,
    visitDate: Date,
    supplyCheckResult: any
  ): string => {
    if (quantity === 0) {
      if (supplyCheckResult.wasRestocked) {
        const { daysSinceSupply } = supplyCheckResult;
        return `Restocked (${daysSinceSupply}d)`;
      } else {
        const daysOutOfStock = Math.floor((new Date().getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
        return `Awaiting Supply (out for ${daysOutOfStock} days)`;
      }
    } else {
      return 'In Stock';
    }
  };

  const calculateDaysCurrentlyOutOfStock = (visitDate: Date): number => {
    const today = new Date();
    return Math.floor((today.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  // ==========================================
  // FILTERING & UTILITIES (UNCHANGED)
  // ==========================================

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

  const getBrands = () => {
    if (!inventoryData) return [];
    const brands = new Set<string>();
    Object.values(inventoryData.shops).forEach(shop => {
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

  const getStockIntelligenceSupplyStatuses = () => {
    return [
      'recently_restocked',
      'awaiting_supply'
    ];
  };

  // ==========================================
  // ENHANCED DOWNLOAD FUNCTIONALITY
  // ==========================================

  const generatePDFReport = async () => {
    if (!inventoryData) return;

    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text(`Enhanced ${rollingPeriodDays}-Day Rolling Inventory Report`, 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
      doc.text(`Period: ${inventoryData.summary.periodStartDate.toLocaleDateString()} - ${inventoryData.summary.periodEndDate.toLocaleDateString()}`, 20, 40);
      doc.text(`Master Data Integration: ${inventoryData.summary.masterDataIntegration.assignmentCoverage}% coverage`, 20, 50);
      
      const summaryData = [
        ['Total Shops', inventoryData.summary.totalShops.toString()],
        ['Visited Shops', inventoryData.summary.visitedShops.toString()],
        ['Total SKUs Tracked', inventoryData.summary.totalSKUs.toString()],
        ['Out of Stock Items', inventoryData.summary.totalOutOfStock.toString()],
        ['Aging Items (30+ days)', inventoryData.summary.totalAging.toString()],
        ['Recently Restocked', inventoryData.summary.recentlyRestockedItems.toString()],
        ['Average Age (days)', inventoryData.summary.avgAge.toString()],
        ['Rolling Period', `${rollingPeriodDays} days`],
        ['Master Data Coverage', `${inventoryData.summary.masterDataIntegration.assignmentCoverage}%`]
      ];

      (doc as any).autoTable({
        head: [['Metric', 'Value']],
        body: summaryData,
        startY: 70,
        theme: 'grid'
      });

      doc.save(`Enhanced_Master_Integrated_${rollingPeriodDays}Day_Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  const exportToCSV = async () => {
    if (!inventoryData) return;

    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `Enhanced ${rollingPeriodDays}-Day Rolling Inventory Analytics Report with Master Data Integration - ` + new Date().toLocaleDateString() + "\n";
      csvContent += `Period: ${inventoryData.summary.periodStartDate.toLocaleDateString()} - ${inventoryData.summary.periodEndDate.toLocaleDateString()}\n`;
      csvContent += `Master Data Coverage: ${inventoryData.summary.masterDataIntegration.assignmentCoverage}% (${inventoryData.summary.masterDataIntegration.masterDataAssignments} master assignments, ${inventoryData.summary.masterDataIntegration.visitDataFallbacks} visit fallbacks)\n`;
      csvContent += "Filters Applied: " + JSON.stringify(filters) + "\n\n";
      
      if (activeTab === 'overview') {
        csvContent += "ENHANCED SKU PERFORMANCE ANALYSIS WITH RESTOCKED COLUMN\n";
        csvContent += "Product,Tracked Shops,In Stock,Out of Stock,Restocked,Stock Rate %,Aging Locations\n";
        
        inventoryData.skuPerformance.forEach(sku => {
          const stockRate = 100 - sku.outOfStockPercentage;
          csvContent += `"${sku.name}","${sku.trackedShops}","${sku.inStockCount}","${sku.outOfStockCount}","${sku.restockedCount}","${stockRate}","${sku.agingLocations.length}"\n`;
        });
      } else if (activeTab === 'shops') {
        csvContent += "ENHANCED SHOP INVENTORY ANALYSIS WITH MASTER DATA INTEGRATION\n";
        csvContent += "Shop Name,Shop ID,Department,Salesman,Visit Date,Last Visit Days,Data Source,Brand,Quantity,Stock Status,Age Days,Age Estimated,Last Supply Date,Supply Source,Supply Status,Reason No Stock,Advanced Supply Status,Days Since Supply,Days Out of Stock,Recently Restocked\n";
        
        const filteredShops = getFilteredShops();
        filteredShops.forEach(shop => {
          Object.values(shop.items).forEach((item: any) => {
            const stockStatus = item.isInStock ? 'In Stock' : 
                               item.isOutOfStock ? 'Out of Stock' : 
                               item.isLowStock ? 'Low Stock' : 'Unknown';
            
            const lastSupplyStr = item.lastSupplyDate ? 
              item.lastSupplyDate.toLocaleDateString('en-GB') : 'No Supply Data';
            
            const supplySource = item.agingDataSource === 'recent_supply' ? 'Recent Supply' :
                               item.agingDataSource === 'historical_supply' ? 'Historical Supply' :
                               'No Supply Data';
            
            const advancedStatus = item.advancedSupplyStatus || 
                                 getEnhancedSupplyStatusDisplay(item);
            
            const visitDateStr = shop.visitDate ? shop.visitDate.toLocaleDateString('en-GB') : 'No Recent Visit';
            
            csvContent += `"${shop.shopName}","${shop.shopId}","${shop.department}","${shop.salesman}","${visitDateStr}","${shop.lastVisitDays || 'N/A'}","${shop.dataSource}","${item.brand}","${item.quantity}","${stockStatus}","${item.ageInDays}","${item.isEstimatedAge ? 'Yes' : 'No'}","${lastSupplyStr}","${supplySource}","${item.supplyStatus.replace(/_/g, ' ')}","${item.reasonNoStock || 'N/A'}","${advancedStatus}","${item.daysSinceSupply || 'N/A'}","${item.daysOutOfStock || 'N/A'}","${item.suppliedAfterOutOfStock ? 'Yes' : 'No'}"\n`;
          });
        });
      } else if (activeTab === 'visits') {
        csvContent += "ENHANCED VISIT COMPLIANCE ANALYSIS WITH TODAY'S VISITS\n";
        csvContent += "Salesman,Total 15-Day Visits,Unique Shops,Today's Visits,Yesterday Visits,Last 7 Days\n";
        
        inventoryData.visitCompliance.salesmenStats.forEach(salesman => {
          csvContent += `"${salesman.name}","${salesman.rollingPeriodVisits}","${salesman.uniqueShops}","${salesman.todayVisits}","${salesman.yesterdayVisits}","${salesman.lastWeekVisits}"\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Enhanced_Master_Integrated_${rollingPeriodDays}Day_Inventory_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  // ==========================================
  // COMPONENT LIFECYCLE
  // ==========================================

  useEffect(() => {
    fetchInventoryData();
  }, []);

  useEffect(() => {
    if (inventoryData) {
      fetchInventoryData();
    }
  }, [rollingPeriodDays]);

  // ==========================================
  // RENDER FUNCTIONS
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 animate-pulse mx-auto mb-4 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Enhanced Inventory Dashboard</h2>
          <p className="text-gray-600">Processing inventory data with master data integration and enhanced analytics...</p>
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
          <p className="text-gray-600">No recent inventory data found for the rolling period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-4 sm:py-0">
            <div className="flex items-center mb-4 sm:mb-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Enhanced Inventory Analytics Dashboard</h1>
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Master Data Integrated
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <select
                  value={rollingPeriodDays}
                  onChange={(e) => setRollingPeriodDays(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={15}>Last 15 Days</option>
                  <option value={30}>Last 30 Days</option>
                  <option value={45}>Last 45 Days</option>
                  <option value={60}>Last 60 Days</option>
                </select>
              </div>
              
              <span className="text-sm text-gray-500">
                {inventoryData.summary.totalSKUs} SKUs • 
                {inventoryData.summary.periodStartDate.toLocaleDateString()} to {inventoryData.summary.periodEndDate.toLocaleDateString()}
              </span>
              
              <div className="flex space-x-2">
                <button
                  onClick={fetchInventoryData}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={generatePDFReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={exportToCSV}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
                  title="Export enhanced data with master integration"
                >
                  <Table className="w-4 h-4" />
                  <span>Enhanced CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 min-w-max">
            {[
              { id: 'overview', label: 'Enhanced Overview', icon: BarChart3 },
              { id: 'shops', label: 'Master Shop Inventory', icon: ShoppingBag },
              { id: 'aging', label: 'Enhanced Aging Analysis', icon: Clock },
              { id: 'visits', label: 'Enhanced Visit Compliance', icon: Users },
              { id: 'alerts', label: 'Stock Intelligence', icon: AlertTriangle }
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
        {activeTab === 'overview' && <EnhancedInventoryOverviewTab data={inventoryData} />}
        {activeTab === 'shops' && (
          <EnhancedShopInventoryTab 
            data={inventoryData} 
            filteredShops={getFilteredShops()}
            filters={filters}
            setFilters={setFilters}
            getEnhancedSupplyStatusDisplay={getEnhancedSupplyStatusDisplay}
            departments={getDepartments()}
            salesmen={getSalesmen()}
            expandedShop={expandedShop}
            setExpandedShop={setExpandedShop}
          />
        )}
        {activeTab === 'aging' && (
          <EnhancedAgingAnalysisTab 
            data={inventoryData} 
            filters={filters}
            setFilters={setFilters}
            getFilteredItems={getFilteredItems}
            getEnhancedSupplyStatusDisplay={getEnhancedSupplyStatusDisplay}
            departments={getDepartments()}
            salesmen={getSalesmen()}
            brands={getBrands()}
            supplyStatuses={getSupplyStatuses()}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
          />
        )}
        {activeTab === 'visits' && <EnhancedVisitComplianceTab data={inventoryData} />}
        {activeTab === 'alerts' && (
          <CleanStockIntelligenceTab 
            data={inventoryData}
            filters={filters}
            setFilters={setFilters}
            getFilteredItems={getFilteredItems}
            getEnhancedSupplyStatusDisplay={getEnhancedSupplyStatusDisplay}
            departments={getDepartments()}
            salesmen={getSalesmen()}
            brands={getBrands()}
            supplyStatuses={getStockIntelligenceSupplyStatuses()}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
          />
        )}
      </main>
    </div>
  );
};

// ==========================================
// ENHANCED TAB COMPONENTS
// ==========================================

const EnhancedInventoryOverviewTab = ({ data }: { data: InventoryData }) => (
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

const EnhancedShopInventoryTab = ({ data, filteredShops, filters, setFilters, getEnhancedSupplyStatusDisplay, departments, salesmen, expandedShop, setExpandedShop }: any) => (
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
          onClick={() => setFilters({ department: '', salesman: '', stockStatus: '', ageCategory: '', brand: '', supplyStatus: '', searchText: '' })}
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

const EnhancedAgingAnalysisTab = ({ data, filters, setFilters, getFilteredItems, getEnhancedSupplyStatusDisplay, departments, salesmen, brands, supplyStatuses, currentPage, setCurrentPage, itemsPerPage }: any) => {
  const filteredAging = getFilteredItems(data.allAgingLocations);
  const totalPages = Math.ceil(filteredAging.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAging.slice(startIndex, endIndex);

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
            value={filters.brand}
            onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Brands</option>
            {brands.map((brand: string) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          <select
            value={filters.ageCategory}
            onChange={(e) => setFilters({ ...filters, ageCategory: e.target.value })}
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
            onChange={(e) => setFilters({ ...filters, supplyStatus: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Supply Status</option>
            {supplyStatuses.map((status: string) => (
              <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
            ))}
          </select>

          <button
            onClick={() => setFilters({ ...filters, department: '', salesman: '', brand: '', ageCategory: '', supplyStatus: '' })}
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

const EnhancedVisitComplianceTab = ({ data }: { data: InventoryData }) => (
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

const CleanStockIntelligenceTab = ({ data, filters, setFilters, getFilteredItems, getEnhancedSupplyStatusDisplay, departments, salesmen, brands, supplyStatuses, currentPage, setCurrentPage, itemsPerPage }: any) => {
  const filteredOutOfStock = getFilteredItems(data.outOfStockItems);
  const totalPages = Math.ceil(filteredOutOfStock.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredOutOfStock.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Stock Intelligence & Supply Chain Analysis</h2>
        <p className="text-gray-600">Advanced out-of-stock analysis with master data integration ({data.summary.rollingPeriodDays}-day rolling period)</p>
        <p className="text-sm text-gray-500">
          Period: {data.summary.periodStartDate.toLocaleDateString()} - {data.summary.periodEndDate.toLocaleDateString()}
        </p>
      </div>

      {/* Enhanced Filter Controls */}
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
            value={filters.supplyStatus}
            onChange={(e) => {
              setFilters({ ...filters, supplyStatus: e.target.value });
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Supply Status</option>
            <option value="recently_restocked">Recently Restocked</option>
            <option value="awaiting_supply">Awaiting Supply</option>
          </select>

          <input
            type="text"
            placeholder="Search..."
            value={filters.searchText}
            onChange={(e) => {
              setFilters({ ...filters, searchText: e.target.value });
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />

          <button
            onClick={() => {
              setFilters({ ...filters, department: '', salesman: '', brand: '', searchText: '', supplyStatus: '' });
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Enhanced Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-red-600">{filteredOutOfStock.length}</div>
              <div className="text-sm text-red-700">Out of Stock Items</div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <div className="flex items-center">
            <Truck className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-blue-600">
                {filteredOutOfStock.filter((item: any) => 
                  item.suppliedAfterOutOfStock || (item as any).advancedSupplyStatus?.includes('Restocked')
                ).length}
              </div>
              <div className="text-sm text-blue-700">Recently Restocked</div>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredOutOfStock.filter((item: any) => 
                  !item.suppliedAfterOutOfStock && !(item as any).advancedSupplyStatus?.includes('Restocked')
                ).length}
              </div>
              <div className="text-sm text-yellow-700">Still Awaiting Supply</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-600">
                {filteredOutOfStock.length > 0 ? Math.round((filteredOutOfStock.filter((item: any) => 
                  item.suppliedAfterOutOfStock || (item as any).advancedSupplyStatus?.includes('Restocked')
                ).length / filteredOutOfStock.length) * 100) : 0}%
              </div>
              <div className="text-sm text-green-700">Response Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Out of Stock Analysis with Master Data Integration */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Enhanced Out of Stock Intelligence with Master Data</h3>
          <p className="text-sm text-gray-500">
            Complete out-of-stock analysis with master data integration. Showing {startIndex + 1}-{Math.min(endIndex, filteredOutOfStock.length)} of {filteredOutOfStock.length} items
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supply Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((item: any, index: number) => (
                <tr key={`${item.shopName}-${item.sku}-${index}`} className={
                  (item as any).advancedSupplyStatus?.includes('Restocked') ? 'bg-green-50' : 
                  item.suppliedAfterOutOfStock ? 'bg-blue-50' : ''
                }>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{item.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{item.shopName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{item.salesman}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.reasonNoStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.visitDate ? item.visitDate.toLocaleDateString('en-GB') : 'No Visit'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      (item as any).advancedSupplyStatus?.includes('Restocked') ? 'bg-green-100 text-green-800' :
                      (item as any).advancedSupplyStatus?.includes('Awaiting Supply') ? 'bg-red-100 text-red-800' :
                      (item as any).advancedSupplyStatus?.includes('In Stock') ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {(item as any).advancedSupplyStatus?.includes('Restocked') && <Truck className="w-3 h-3 mr-1" />}
                      {(item as any).advancedSupplyStatus?.includes('Awaiting Supply') && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {(item as any).advancedSupplyStatus || 'Unknown Status'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination for Stock Intelligence */}
        <div className="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredOutOfStock.length)} of {filteredOutOfStock.length} enhanced out-of-stock items
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

export default InventoryDashboard;
