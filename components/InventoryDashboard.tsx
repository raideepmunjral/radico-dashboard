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
  supplyStatus: 'current' | 'restocked_after_oos' | 'awaiting_supply' | 'unknown';
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
    recentlyRestockedItems: number;
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
      lastSupplyDate?: Date;
      suppliedAfterOutOfStock?: boolean;
    }>;
  }>;
  allAgingLocations: Array<{
    sku: string;
    shopName: string;
    department: string;
    salesman: string;
    ageInDays: number;
    quantity: number;
    lastSupplyDate?: Date;
    isEstimatedAge: boolean;
    supplyStatus: string;
    visitDate: Date;
  }>;
  outOfStockItems: Array<{
    sku: string;
    shopName: string;
    department: string;
    salesman: string;
    reasonNoStock: string;
    visitDate: Date;
    suppliedAfterOutOfStock?: boolean;
    daysAfterSupply?: number;
  }>;
  visitCompliance: {
    totalSalesmen: number;
    activeSalesmen: number;
    monthlyVisits: number;
    yesterdayVisits: number;
    lastMonthVisits: number;
    salesmenStats: Array<{
      name: string;
      monthlyVisits: number;
      uniqueShops: number;
      yesterdayVisits: number;
      lastMonthVisits: number;
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

  // CONFIGURATION - ENHANCED WITH HISTORICAL DATA
  const SHEETS_CONFIG = {
    visitSheetId: process.env.NEXT_PUBLIC_VISIT_SHEET_ID || '1XG4c_Lrpk-YglTq3G3ZY9Qjt7wSnUq0UZWDSYT61eWE',
    historicalSheetId: process.env.NEXT_PUBLIC_HISTORICAL_SHEET_ID || '1yXzEYHJeHlETrEmU4TZ9F2_qv4OE10N4DPdYX0Iqfx0',
    masterSheetId: process.env.NEXT_PUBLIC_MASTER_SHEET_ID || '1pRz9CgOoamTrFipnmF-XuBCg9IZON9br5avgRlKYtxM',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  };

  // ==========================================
  // ENHANCED BRAND NORMALIZATION SYSTEM
  // ==========================================

  // Extract brand family and size from different naming conventions
  const normalizeBrandInfo = (brandName: string, size?: string): { family: string, size: string, fullKey: string } => {
    const cleanBrand = brandName?.toString().trim().toUpperCase();
    let extractedSize = size?.toString() || '';
    
    // Extract size from brand name if not provided separately
    if (!extractedSize) {
      const sizeMatch = cleanBrand.match(/(\d+)\s?(P|ML)?$/);
      if (sizeMatch) {
        extractedSize = sizeMatch[1];
      }
    }
    
    // Determine brand family with enhanced matching
    let family = 'OTHER';
    if (cleanBrand.includes('8PM') || cleanBrand.includes('8 PM') || 
        cleanBrand.includes('PREMIUM BLACK') || cleanBrand.includes('BLACK BLENDED') ||
        cleanBrand.includes('BLACK WHISKY')) {
      family = '8PM';
    } else if (cleanBrand.includes('VERVE') || cleanBrand.includes('M2M') || 
               cleanBrand.includes('MAGIC MOMENTS') || cleanBrand.includes('CRANBERRY') ||
               cleanBrand.includes('GREEN APPLE') || cleanBrand.includes('LEMON LUSH') ||
               cleanBrand.includes('GRAIN VODKA')) {
      family = 'VERVE';
    }
    
    // Default size if not found
    if (!extractedSize) {
      extractedSize = '750'; // Default to 750ml
    }
    
    // Create standardized key for matching
    const fullKey = `${family}_${extractedSize}`;
    
    return { family, size: extractedSize, fullKey };
  };

  // Match brands across different sheets using Shop ID + Brand Family + Size
  const createBrandMatchingKey = (shopId: string, brandName: string, size?: string): string => {
    const brandInfo = normalizeBrandInfo(brandName, size);
    return `${shopId}_${brandInfo.fullKey}`;
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

      console.log('🔄 Fetching enhanced inventory data with FIXED Shop ID matching...');

      // Fetch all data sources
      const [visitData, historicalData, masterData] = await Promise.all([
        fetchVisitSheetData(),
        fetchHistoricalSheetData(),
        fetchMasterSheetData()
      ]);
      
      // Process with FIXED logic
      const processedData = processEnhancedInventoryData(visitData, historicalData, masterData);
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
        throw new Error('Failed to fetch visit data');
      }
      
      const result = await response.json();
      console.log('✅ Visit data fetched:', result.values?.length || 0, 'rows');
      return result.values || [];
    } catch (error) {
      console.error('❌ Error fetching visit data:', error);
      return [];
    }
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
  // FIXED DATA PROCESSING LOGIC
  // ==========================================

  const processEnhancedInventoryData = (visitData: any[][], historicalData: any[][], pendingChallans: any[][]): InventoryData => {
    console.log('🔧 Processing FIXED inventory data with correct Shop ID based matching...');
    
    if (visitData.length === 0) {
      throw new Error('No visit data found');
    }

    const headers = visitData[0];
    const rows = visitData.slice(1);

    // Find column indices for visit data
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
      reasonNoStock: getColumnIndex('Reason for No Stock'),
      lsDate: getColumnIndex('LS Date')
    };

    // Validate required columns
    const requiredColumns = ['shopId', 'shopName', 'invBrand', 'invQuantity', 'checkInDateTime'];
    for (const col of requiredColumns) {
      if (columnIndices[col as keyof typeof columnIndices] === -1) {
        throw new Error(`Required column '${col}' not found`);
      }
    }

    // Process historical supply data for accurate aging
    const supplyHistory = processHistoricalSupplyData(historicalData);
    const recentSupplies = processPendingChallans(pendingChallans);
    
    console.log('📊 Supply data processed:', {
      historicalEntries: Object.keys(supplyHistory).length,
      recentSupplies: Object.keys(recentSupplies).length
    });
    
    // Filter for MONTHLY data (current month)
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastMonth = new Date(currentYear, currentMonth - 1, 1);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Get current month visits
    const currentMonthRows = rows.filter(row => {
      const dateStr = row[columnIndices.checkInDateTime];
      if (!dateStr) return false;
      
      try {
        const rowDate = new Date(dateStr);
        return rowDate.getMonth() === currentMonth && rowDate.getFullYear() === currentYear;
      } catch {
        return false;
      }
    });

    console.log(`📅 Current month visits: ${currentMonthRows.length} out of ${rows.length} total rows`);

    // ==========================================
    // FIXED: PROPER SHOP VISIT GROUPING LOGIC
    // ==========================================

    // Step 1: Group ALL rows by exact shop visit (Shop ID + exact timestamp)
    const shopVisitGroups: Record<string, any> = {};

    currentMonthRows.forEach(row => {
      const shopId = row[columnIndices.shopId];
      const shopName = row[columnIndices.shopName];
      const department = row[columnIndices.department];
      const salesman = row[columnIndices.salesman];
      const checkInDateTime = row[columnIndices.checkInDateTime];
      const invBrand = row[columnIndices.invBrand];
      
      if (!shopId || !checkInDateTime || !invBrand) return;
      
      // Create unique visit key: Shop ID + exact timestamp
      const visitKey = `${shopId}_${checkInDateTime}`;
      
      // Initialize visit group if doesn't exist
      if (!shopVisitGroups[visitKey]) {
        try {
          shopVisitGroups[visitKey] = {
            shopId,
            shopName: shopName || 'Unknown Shop',
            department: department || 'Unknown',
            salesman: salesman || 'Unknown',
            visitDate: new Date(checkInDateTime),
            rows: []
          };
        } catch (error) {
          console.warn(`Invalid date format: ${checkInDateTime}`);
          return;
        }
      }
      
      // Add ALL brand rows to this visit
      shopVisitGroups[visitKey].rows.push(row);
    });

    console.log(`🏪 FIXED: Grouped into ${Object.keys(shopVisitGroups).length} unique shop visits`);

    // Step 2: Find latest visit per shop
    const shopLatestVisits: Record<string, any> = {};
    
    Object.values(shopVisitGroups).forEach((visit: any) => {
      const shopId = visit.shopId;
      
      if (!shopLatestVisits[shopId] || visit.visitDate > shopLatestVisits[shopId].visitDate) {
        shopLatestVisits[shopId] = visit;
      }
    });

    console.log(`✅ FIXED: Found latest visits for ${Object.keys(shopLatestVisits).length} unique shops`);

    // DEBUG: Log sample shop data
    const sampleShop = Object.values(shopLatestVisits)[0] as any;
    if (sampleShop) {
      console.log(`🔍 Sample shop: ${sampleShop.shopName}`);
      console.log(`🔍 Brands collected: ${sampleShop.rows.length}`);
      console.log(`🔍 Brand names:`, sampleShop.rows.map((r: any) => r[columnIndices.invBrand]).slice(0, 10));
    }

    // ==========================================
    // PROCESS INVENTORY FOR EACH SHOP
    // ==========================================

    const shops: Record<string, ShopInventory> = {};
    const skuTracker: Record<string, any> = {};
    const allAgingLocations: Array<any> = [];
    const outOfStockItems: Array<any> = [];
    const salesmenVisits: Record<string, any> = {};
    const processedSKUs = new Set<string>();

    // Track monthly visit metrics
    let monthlyVisitCount = 0;
    let yesterdayVisitCount = 0;
    let lastMonthVisitCount = 0;

    Object.values(shopLatestVisits).forEach((shopVisit: any) => {
      monthlyVisitCount++;
      
      // Check if visit was yesterday
      if (shopVisit.visitDate.toDateString() === yesterday.toDateString()) {
        yesterdayVisitCount++;
      }
      
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

      // Track salesman visits (monthly)
      if (!salesmenVisits[shopVisit.salesman]) {
        salesmenVisits[shopVisit.salesman] = {
          name: shopVisit.salesman,
          monthlyVisits: 0,
          uniqueShops: new Set(),
          yesterdayVisits: 0,
          lastMonthVisits: 0
        };
      }
      salesmenVisits[shopVisit.salesman].monthlyVisits++;
      salesmenVisits[shopVisit.salesman].uniqueShops.add(shopVisit.shopId);
      
      if (shopVisit.visitDate.toDateString() === yesterday.toDateString()) {
        salesmenVisits[shopVisit.salesman].yesterdayVisits++;
      }

      // FIXED: Process ALL inventory items for this shop visit
      shopVisit.rows.forEach((row: any[]) => {
        const brand = row[columnIndices.invBrand]?.toString().trim();
        const quantity = parseFloat(row[columnIndices.invQuantity]) || 0;
        const reasonNoStock = row[columnIndices.reasonNoStock]?.toString().trim() || '';
        const lsDate = row[columnIndices.lsDate];

        if (!brand) return;
        
        // Track all unique SKUs
        processedSKUs.add(brand);

        // Get accurate supply date using Shop ID + Brand matching
        const lastSupplyFromHistory = getLastSupplyDate(shopVisit.shopId, brand, supplyHistory);
        const lastSupplyFromLS = lsDate ? new Date(lsDate) : null;
        
        let lastSupplyDate: Date | undefined;
        let isEstimatedAge = true;
        let ageInDays = 0;
        
        // Priority: Historical data > LS Date > April 1 fallback
        if (lastSupplyFromHistory && !isNaN(lastSupplyFromHistory.getTime())) {
          lastSupplyDate = lastSupplyFromHistory;
          ageInDays = Math.floor((shopVisit.visitDate.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24));
          isEstimatedAge = false;
        } else if (lastSupplyFromLS && !isNaN(lastSupplyFromLS.getTime())) {
          lastSupplyDate = lastSupplyFromLS;
          ageInDays = Math.floor((shopVisit.visitDate.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24));
          isEstimatedAge = false;
        } else {
          // Fallback to April 1, 2025
          const fallbackDate = new Date('2025-04-01');
          lastSupplyDate = fallbackDate;
          ageInDays = Math.floor((shopVisit.visitDate.getTime() - fallbackDate.getTime()) / (1000 * 60 * 60 * 24));
          isEstimatedAge = true;
        }

        // Enhanced age categorization
        let ageCategory: InventoryItem['ageCategory'] = 'lessThan30Days';
        if (ageInDays >= 90) ageCategory = 'over90Days';
        else if (ageInDays >= 75) ageCategory = 'days75to90';
        else if (ageInDays >= 60) ageCategory = 'days60to75';
        else if (ageInDays >= 45) ageCategory = 'days45to60';
        else if (ageInDays >= 30) ageCategory = 'days30to45';

        // Check if supplied after out of stock using Shop ID + Brand matching
        const suppliedAfterOutOfStock = checkSuppliedAfterOutOfStock(
          shopVisit.shopId, 
          brand, 
          shopVisit.visitDate, 
          recentSupplies
        );

        // Determine supply status
        let supplyStatus: InventoryItem['supplyStatus'] = 'unknown';
        if (quantity > 0 && !isEstimatedAge) {
          supplyStatus = 'current';
        } else if (suppliedAfterOutOfStock) {
          supplyStatus = 'restocked_after_oos';
        } else if (quantity === 0) {
          supplyStatus = 'awaiting_supply';
        }

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
          lastSupplyDate,
          isEstimatedAge,
          suppliedAfterOutOfStock,
          daysSinceLastSupply: lastSupplyDate ? Math.floor((shopVisit.visitDate.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined,
          supplyStatus
        };

        shopInventory.items[brand] = inventoryItem;
        shopInventory.totalItems++;

        if (isInStock) shopInventory.inStockCount++;
        else if (isLowStock) shopInventory.lowStockCount++;
        else if (isOutOfStock) shopInventory.outOfStockCount++;

        // Track aging inventory (30+ days) ONLY for items with stock > 0
        if (ageInDays >= 30 && quantity > 0) {
          shopInventory.agingInventoryCount++;
          
          allAgingLocations.push({
            sku: brand,
            shopName: shopInventory.shopName,
            department: shopInventory.department,
            salesman: shopInventory.salesman,
            ageInDays,
            quantity,
            lastSupplyDate,
            isEstimatedAge,
            supplyStatus,
            visitDate: shopInventory.visitDate
          });
        }

        // Track out of stock items
        if (isOutOfStock) {
          outOfStockItems.push({
            sku: brand,
            shopName: shopInventory.shopName,
            department: shopInventory.department,
            salesman: shopInventory.salesman,
            reasonNoStock,
            visitDate: shopInventory.visitDate,
            suppliedAfterOutOfStock,
            daysAfterSupply: suppliedAfterOutOfStock ? 
              Math.floor((shopVisit.visitDate.getTime() - (recentSupplies[createBrandMatchingKey(shopVisit.shopId, brand)]?.getTime() || 0)) / (1000 * 60 * 60 * 24)) : 
              undefined
          });
        }

        // Enhanced SKU performance tracking
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

        if (ageInDays >= 30 && quantity > 0) {
          skuTracker[brand].agingLocations.push({
            shopName: shopInventory.shopName,
            department: shopInventory.department,
            salesman: shopInventory.salesman,
            ageInDays,
            quantity,
            lastSupplyDate,
            suppliedAfterOutOfStock
          });
        }
      });

      shops[shopVisit.shopId] = shopInventory;
    });

    console.log(`✅ FIXED: Processed ${Object.keys(shops).length} shops with ${processedSKUs.size} unique SKUs`);

    // Calculate last month visits
    rows.forEach(row => {
      const dateStr = row[columnIndices.checkInDateTime];
      if (!dateStr) return;
      
      try {
        const rowDate = new Date(dateStr);
        if (rowDate >= lastMonth && rowDate < new Date(currentYear, currentMonth, 1)) {
          lastMonthVisitCount++;
          
          const salesman = row[columnIndices.salesman];
          if (salesman && salesmenVisits[salesman]) {
            salesmenVisits[salesman].lastMonthVisits++;
          }
        }
      } catch {
        // Skip invalid dates
      }
    });

    // Calculate enhanced SKU performance metrics
    const skuPerformance = Object.values(skuTracker).map((sku: any) => ({
      ...sku,
      outOfStockPercentage: sku.trackedShops > 0 ? Math.round((sku.outOfStockCount / sku.trackedShops) * 100) : 0
    })).sort((a, b) => b.outOfStockPercentage - a.outOfStockPercentage);

    // Sort aging locations by age
    allAgingLocations.sort((a, b) => b.ageInDays - a.ageInDays);

    // Calculate enhanced summary statistics
    const totalShops = Object.keys(shops).length;
    const visitedShops = totalShops;
    const totalSKUs = Object.keys(skuTracker).length;
    const totalOutOfStock = Object.values(shops).reduce((sum, shop) => sum + shop.outOfStockCount, 0);
    const totalLowStock = Object.values(shops).reduce((sum, shop) => sum + shop.lowStockCount, 0);
    const totalAging = Object.values(shops).reduce((sum, shop) => sum + shop.agingInventoryCount, 0);
    const avgAge = allAgingLocations.length > 0 ? 
      Math.round(allAgingLocations.reduce((sum, item) => sum + item.ageInDays, 0) / allAgingLocations.length) : 0;
    const recentlyRestockedItems = Object.values(shops).reduce((sum, shop) => 
      sum + Object.values(shop.items).filter(item => item.suppliedAfterOutOfStock).length, 0);

    // Process salesman visit compliance (monthly)
    const salesmenStats = Object.values(salesmenVisits).map((salesman: any) => ({
      name: salesman.name,
      monthlyVisits: salesman.monthlyVisits,
      uniqueShops: salesman.uniqueShops.size,
      yesterdayVisits: salesman.yesterdayVisits,
      lastMonthVisits: salesman.lastMonthVisits
    })).sort((a, b) => b.monthlyVisits - a.monthlyVisits);

    console.log('✅ FIXED inventory processing complete:', {
      totalShops,
      totalSKUs,
      totalOutOfStock,
      totalAging,
      recentlyRestockedItems,
      processedSKUs: processedSKUs.size
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
        recentlyRestockedItems
      },
      shops,
      skuPerformance,
      allAgingLocations,
      outOfStockItems,
      visitCompliance: {
        totalSalesmen: salesmenStats.length,
        activeSalesmen: salesmenStats.filter(s => s.monthlyVisits > 0).length,
        monthlyVisits: monthlyVisitCount,
        yesterdayVisits: yesterdayVisitCount,
        lastMonthVisits: lastMonthVisitCount,
        salesmenStats
      }
    };
  };

  // ==========================================
  // ENHANCED SUPPLY DATA PROCESSING FUNCTIONS
  // ==========================================

  const processHistoricalSupplyData = (historicalData: any[][]) => {
    const supplyHistory: Record<string, Date> = {};
    
    if (historicalData.length <= 1) return supplyHistory;
    
    const headers = historicalData[0];
    const rows = historicalData.slice(1);
    
    // Find column indices
    const shopIdIndex = headers.findIndex(h => h?.toLowerCase().includes('shop_id'));
    const brandShortIndex = headers.findIndex(h => h?.toLowerCase().includes('brand short') || h?.toLowerCase().includes('brand_short'));
    const sizeIndex = headers.findIndex(h => h?.toLowerCase().includes('size'));
    const dateIndex = headers.findIndex(h => h?.toLowerCase().includes('date'));
    const casesIndex = headers.findIndex(h => h?.toLowerCase().includes('cases'));
    
    if (shopIdIndex === -1 || brandShortIndex === -1 || dateIndex === -1) {
      console.warn('⚠️ Historical data columns not found', { shopIdIndex, brandShortIndex, dateIndex });
      return supplyHistory;
    }
    
    console.log('📊 Processing historical data with columns:', { shopIdIndex, brandShortIndex, sizeIndex, dateIndex, casesIndex });
    
    let processedEntries = 0;
    
    rows.forEach((row, index) => {
      if (row.length > Math.max(shopIdIndex, brandShortIndex, dateIndex, casesIndex)) {
        const shopId = row[shopIdIndex]?.toString().trim();
        const brandShort = row[brandShortIndex]?.toString().trim();
        const size = sizeIndex !== -1 ? row[sizeIndex]?.toString().trim() : '';
        const dateStr = row[dateIndex]?.toString().trim();
        const cases = casesIndex !== -1 ? parseFloat(row[casesIndex]) || 0 : 1;
        
        if (shopId && brandShort && dateStr && cases > 0) {
          try {
            // Parse DD-MM-YYYY format
            const dateParts = dateStr.split('-');
            if (dateParts.length === 3) {
              const date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
              if (!isNaN(date.getTime())) {
                // Create brand key using Shop ID + Brand + Size
                const key = createBrandMatchingKey(shopId, brandShort, size);
                if (!supplyHistory[key] || date > supplyHistory[key]) {
                  supplyHistory[key] = date;
                  processedEntries++;
                }
              }
            }
          } catch (error) {
            // Skip invalid dates
          }
        }
      }
    });
    
    console.log('📊 Historical supply data processed:', processedEntries, 'valid entries out of', rows.length, 'rows');
    return supplyHistory;
  };

  const processPendingChallans = (pendingChallans: any[][]) => {
    const recentSupplies: Record<string, Date> = {};
    
    if (pendingChallans.length <= 1) return recentSupplies;
    
    const headers = pendingChallans[0];
    const rows = pendingChallans.slice(1);
    
    console.log('📦 Processing Pending Challans headers:', headers);
    
    // CORRECTED: Find the right column indices based on actual structure
    const shopIdIndex = 8; // Column I (index 8) = Shop_Id like "01/2024/0324"
    const shopNameIndex = 9; // Column J (index 9) = shop_name
    const brandIndex = 11; // Column L (index 11) = brand
    const sizeIndex = 12; // Column M (index 12) = size
    const casesIndex = 14; // Column O (index 14) = cases
    const dateIndex = 1; // Column B (index 1) = challandate
    
    console.log('📦 Using CORRECTED column indices:', { 
      shopIdIndex, shopNameIndex, brandIndex, sizeIndex, dateIndex, casesIndex 
    });
    
    let processedEntries = 0;
    
    rows.forEach((row, index) => {
      if (row.length > Math.max(shopIdIndex, brandIndex, dateIndex, casesIndex)) {
        const shopId = row[shopIdIndex]?.toString().trim(); // Real Shop_Id like "01/2024/0324"
        const brand = row[brandIndex]?.toString().trim();
        const size = row[sizeIndex]?.toString().trim() || '';
        const dateStr = row[dateIndex]?.toString().trim();
        const cases = parseFloat(row[casesIndex]) || 0;
        const shopName = row[shopNameIndex]?.toString().trim() || '';
        
        if (shopId && brand && dateStr && cases > 0) {
          try {
            // Parse DD-MM-YYYY format from challandate
            let date: Date;
            if (dateStr.includes('-')) {
              const dateParts = dateStr.split('-');
              if (dateParts.length === 3) {
                date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
              } else {
                date = new Date(dateStr);
              }
            } else {
              date = new Date(dateStr);
            }
            
            if (!isNaN(date.getTime())) {
              // Create keys using the actual Shop_Id format
              const brandInfo = normalizeBrandInfo(brand);
              const possibleKeys = [
                createBrandMatchingKey(shopId, brand, size),
                `${shopId}_${brandInfo.family}_${brandInfo.size}`,
                `${shopId}_8PM_750`,
                `${shopId}_VERVE_750`,
                `${shopId}_8PM_375`,
                `${shopId}_VERVE_375`
              ];
              
              // Store under all possible keys for better matching
              possibleKeys.forEach(key => {
                if (!recentSupplies[key] || date > recentSupplies[key]) {
                  recentSupplies[key] = date;
                }
              });
              
              processedEntries++;
            }
          } catch (error) {
            console.warn(`Error parsing date: ${dateStr}`, error);
          }
        }
      }
    });
    
    console.log('📦 Recent supplies processed:', processedEntries, 'valid entries out of', rows.length, 'rows');
    console.log('📦 Sample recent supply keys:', Object.keys(recentSupplies).slice(0, 10));
    
    return recentSupplies;
  };

  // Get last supply date using Shop ID + Brand family + Size matching
  const getLastSupplyDate = (shopId: string, brandName: string, supplyHistory: Record<string, Date>) => {
    // Try multiple shop ID and brand combinations for better matching
    const brandInfo = normalizeBrandInfo(brandName);
    
    // Create multiple possible keys using the ACTUAL Shop_Id format
    const possibleKeys = [
      createBrandMatchingKey(shopId, brandName),
      `${shopId}_${brandInfo.family}_${brandInfo.size}`,
      `${shopId}_8PM_${brandInfo.size}`,
      `${shopId}_VERVE_${brandInfo.size}`,
      `${shopId}_8PM_750`,
      `${shopId}_VERVE_750`,
      `${shopId}_8PM_375`,
      `${shopId}_VERVE_375`
    ];
    
    for (const key of possibleKeys) {
      if (supplyHistory[key]) {
        return supplyHistory[key];
      }
    }
    
    return null;
  };

  // Check if supplied after out of stock using Shop ID + Brand matching
  const checkSuppliedAfterOutOfStock = (
    shopId: string, 
    brandName: string, 
    visitDate: Date, 
    recentSupplies: Record<string, Date>
  ) => {
    // Try multiple shop ID and brand combinations for better matching
    const brandInfo = normalizeBrandInfo(brandName);
    
    // Create multiple possible keys using the ACTUAL Shop_Id format
    const possibleKeys = [
      createBrandMatchingKey(shopId, brandName),
      `${shopId}_${brandInfo.family}_${brandInfo.size}`,
      `${shopId}_8PM_${brandInfo.size}`,
      `${shopId}_VERVE_${brandInfo.size}`,
      `${shopId}_8PM_750`,
      `${shopId}_VERVE_750`,
      `${shopId}_8PM_375`,
      `${shopId}_VERVE_375`
    ];
    
    for (const key of possibleKeys) {
      const supplyDate = recentSupplies[key];
      if (supplyDate) {
        const daysDiff = Math.floor((supplyDate.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 0 && daysDiff <= 14) { // Extended to 14 days for better detection
          return true;
        }
      }
    }
    
    return false;
  };

  // Helper function for brand family lookup
  const getBrandFamily = (brandShort?: string, brand?: string): string | null => {
    const cleanBrandShort = brandShort?.toString().trim().toUpperCase();
    const cleanBrand = brand?.toString().trim().toUpperCase();
    
    const combinedText = ((cleanBrandShort || '') + ' ' + (cleanBrand || '')).toUpperCase();
    
    // VERVE pattern matching
    if (combinedText.includes('VERVE') || combinedText.includes('M2 MAGIC MOMENTS VERVE')) return 'VERVE';
    
    // 8PM pattern matching
    if (combinedText.includes('8PM') || combinedText.includes('8 PM')) return '8PM';
    if (combinedText.includes('PREMIUM BLACK') && (combinedText.includes('WHISKY') || combinedText.includes('BLENDED'))) return '8PM';
    
    return null;
  };

  // ==========================================
  // ENHANCED FILTERING & UTILITIES
  // ==========================================

  const getFilteredItems = (items: any[]) => {
    return items.filter(item => {
      const matchesDepartment = !filters.department || item.department === filters.department;
      const matchesSalesman = !filters.salesman || item.salesman === filters.salesman;
      const matchesBrand = !filters.brand || item.sku?.includes(filters.brand) || item.brand?.includes(filters.brand);
      const matchesSupplyStatus = !filters.supplyStatus || item.supplyStatus === filters.supplyStatus;
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

  // ==========================================
  // DOWNLOAD FUNCTIONALITY
  // ==========================================

  const generatePDFReport = async () => {
    if (!inventoryData) return;

    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('FIXED Inventory Analytics Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
      
      // Summary Section
      doc.setFontSize(16);
      doc.text('Executive Summary', 20, 50);
      
      const summaryData = [
        ['Total Shops Visited', inventoryData.summary.visitedShops.toString()],
        ['Total SKUs Tracked', inventoryData.summary.totalSKUs.toString()],
        ['Out of Stock Items', inventoryData.summary.totalOutOfStock.toString()],
        ['Aging Items (30+ days)', inventoryData.summary.totalAging.toString()],
        ['Recently Restocked', inventoryData.summary.recentlyRestockedItems.toString()],
        ['Average Age (days)', inventoryData.summary.avgAge.toString()]
      ];

      (doc as any).autoTable({
        head: [['Metric', 'Value']],
        body: summaryData,
        startY: 60,
        theme: 'grid'
      });

      doc.save(`FIXED_Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  const exportToCSV = async () => {
    if (!inventoryData) return;

    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "FIXED Inventory Analytics Report - " + new Date().toLocaleDateString() + "\n";
      csvContent += "Filters Applied: " + JSON.stringify(filters) + "\n\n";
      
      // Aging Inventory Export
      if (activeTab === 'aging') {
        const filteredAging = getFilteredItems(inventoryData.allAgingLocations);
        csvContent += "AGING INVENTORY ANALYSIS (30+ DAYS)\n";
        csvContent += "SKU,Shop Name,Department,Salesman,Age (Days),Quantity,Last Supply Date,Supply Status,Visit Date\n";
        
        filteredAging.forEach(item => {
          csvContent += `"${item.sku}","${item.shopName}","${item.department}","${item.salesman}",${item.ageInDays},${item.quantity},"${item.lastSupplyDate?.toLocaleDateString() || 'Unknown'}","${item.supplyStatus}","${item.visitDate.toLocaleDateString()}"\n`;
        });
      }
      
      // Out of Stock Export
      else if (activeTab === 'alerts') {
        csvContent += "OUT OF STOCK ANALYSIS\n";
        csvContent += "SKU,Shop Name,Department,Salesman,Reason,Visit Date,Supplied After OOS,Days After Supply\n";
        
        inventoryData.outOfStockItems.forEach(item => {
          csvContent += `"${item.sku}","${item.shopName}","${item.department}","${item.salesman}","${item.reasonNoStock}","${item.visitDate.toLocaleDateString()}","${item.suppliedAfterOutOfStock ? 'Yes' : 'No'}","${item.daysAfterSupply || 'N/A'}"\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `FIXED_Inventory_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
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

  // ==========================================
  // RENDER FUNCTIONS
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 animate-pulse mx-auto mb-4 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading FIXED Inventory Dashboard</h2>
          <p className="text-gray-600">Processing comprehensive inventory data with CORRECTED Shop ID based supply intelligence...</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-4 sm:py-0">
            <div className="flex items-center mb-4 sm:mb-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">FIXED Inventory Analytics</h1>
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                CORRECTED • Live Data + Shop ID Intelligence
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-sm text-gray-500">
                Monthly Analytics • {inventoryData.summary.totalSKUs} SKUs Tracked
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
                >
                  <Table className="w-4 h-4" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Navigation */}
      <nav className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 min-w-max">
            {[
              { id: 'overview', label: 'Inventory Overview', icon: BarChart3 },
              { id: 'shops', label: 'Shop Inventory', icon: ShoppingBag },
              { id: 'aging', label: 'Aging Analysis', icon: Clock },
              { id: 'visits', label: 'Visit Compliance', icon: Users },
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
            departments={getDepartments()}
            salesmen={getSalesmen()}
            brands={getBrands()}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
          />
        )}
        {activeTab === 'visits' && <EnhancedVisitComplianceTab data={inventoryData} />}
        {activeTab === 'alerts' && (
          <EnhancedStockIntelligenceTab 
            data={inventoryData}
            filters={filters}
            setFilters={setFilters}
            getFilteredItems={getFilteredItems}
            departments={getDepartments()}
            salesmen={getSalesmen()}
            brands={getBrands()}
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
      <h2 className="text-2xl font-bold text-gray-900 mb-2">FIXED Inventory Overview</h2>
      <p className="text-gray-600">Real-time inventory status with CORRECTED Shop ID based supply intelligence (Current Month)</p>
    </div>

    {/* Enhanced Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
          <div className="p-3 rounded-lg bg-purple-100">
            <Package className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <div className="text-2xl font-bold text-gray-900">{data.summary.totalSKUs}</div>
            <div className="text-sm text-gray-500">SKUs Tracked ✅</div>
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

    {/* Enhanced SKU Performance */}
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">All SKU Stock Status ✅ FIXED</h3>
        <p className="text-sm text-gray-500">Complete inventory status across all tracked products (CORRECTED Shop ID based matching)</p>
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

const EnhancedShopInventoryTab = ({ 
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
    {/* Enhanced Filter Controls */}
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

    {/* Enhanced Shop Inventory List */}
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Shop Inventory Status ✅ FIXED</h3>
        <p className="text-sm text-gray-500">Showing {filteredShops.length} shops with CORRECTED Shop ID based supply intelligence</p>
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
                  <p className="text-xs text-green-600">✅ {shop.totalItems} brands collected</p>
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
                        {item.reasonNoStock && (
                          <div className="text-xs text-red-600">{item.reasonNoStock}</div>
                        )}
                        {item.suppliedAfterOutOfStock && (
                          <div className="text-xs text-green-600">✓ Recently Restocked</div>
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

const EnhancedAgingAnalysisTab = ({ 
  data, 
  filters, 
  setFilters, 
  getFilteredItems, 
  departments, 
  salesmen, 
  brands,
  currentPage,
  setCurrentPage,
  itemsPerPage
}: any) => {
  const filteredAging = getFilteredItems(data.allAgingLocations);
  const totalPages = Math.ceil(filteredAging.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAging.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">FIXED Aging Inventory Analysis</h2>
        <p className="text-gray-600">All aging products (30+ days) with CORRECTED Shop ID based supply intelligence and accurate dating</p>
      </div>

      {/* Enhanced Filter Controls */}
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

          <input
            type="text"
            placeholder="Search..."
            value={filters.searchText}
            onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />

          <button
            onClick={() => setFilters({ ...filters, department: '', salesman: '', brand: '', searchText: '' })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Alert Summary */}
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
                {filteredOutOfStock.filter((item: any) => item.suppliedAfterOutOfStock).length}
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
                {filteredOutOfStock.filter((item: any) => !item.suppliedAfterOutOfStock).length}
              </div>
              <div className="text-sm text-yellow-700">Awaiting Supply</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((filteredOutOfStock.filter((item: any) => item.suppliedAfterOutOfStock).length / Math.max(filteredOutOfStock.length, 1)) * 100)}%
              </div>
              <div className="text-sm text-green-700">Supply Response Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Out of Stock Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Out of Stock Intelligence ✅ FIXED</h3>
          <p className="text-sm text-gray-500">
            Complete out-of-stock analysis with CORRECTED Shop ID based supply chain tracking ({filteredOutOfStock.length} items)
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
              {filteredOutOfStock.map((item: any, index: number) => (
                <tr key={`${item.shopName}-${item.sku}`} className={item.suppliedAfterOutOfStock ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{item.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{item.shopName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{item.salesman}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.reasonNoStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.visitDate.toLocaleDateString('en-GB')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.suppliedAfterOutOfStock ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <Truck className="w-3 h-3 mr-1" />
                        Restocked {item.daysAfterSupply ? `(${item.daysAfterSupply}d)` : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Awaiting Supply
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical SKUs Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            Critical SKUs (High Out-of-Stock Rate) ✅ FIXED
          </h3>
          <p className="text-sm text-gray-500">Products with 30%+ out-of-stock rate requiring immediate attention (CORRECTED Shop ID based tracking)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Out of Stock Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Affected Shops</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recently Restocked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action Required</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.skuPerformance.filter((sku: any) => sku.outOfStockPercentage >= 30).map((sku: any, index: number) => (
                <tr key={sku.name} className={sku.outOfStockPercentage >= 50 ? 'bg-red-50' : 'bg-yellow-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sku.outOfStockPercentage >= 50 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sku.outOfStockPercentage >= 50 ? '🚨 CRITICAL' : '⚠️ HIGH'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{sku.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sku.outOfStockPercentage >= 50 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sku.outOfStockPercentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sku.outOfStockCount}/{sku.trackedShops}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {sku.agingLocations.filter((loc: any) => loc.suppliedAfterOutOfStock).length}
                  </td>
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

      {/* Enhanced Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          AI-Powered Recommendations (CORRECTED Shop ID Intelligence) ✅
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium text-blue-900">Immediate Action Required</div>
                <div className="text-sm text-blue-700">
                  {data.summary.totalOutOfStock} items out of stock. CORRECTED Shop ID based supply chain intervention needed for critical SKUs.
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium text-blue-900">Aging Inventory Management</div>
                <div className="text-sm text-blue-700">
                  {data.summary.totalAging} items aging 30+ days. Consider promotions, redistribution, or demand analysis.
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium text-blue-900">FIXED Supply Chain Intelligence</div>
                <div className="text-sm text-blue-700">
                  {data.summary.recentlyRestockedItems} items recently restocked after out-of-stock reports using CORRECTED Shop ID tracking. Monitor effectiveness.
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
              <div>
                <div className="text-sm font-medium text-blue-900">Visit Optimization</div>
                <div className="text-sm text-blue-700">
                  Focus visits on high out-of-stock locations. {data.visitCompliance.monthlyVisits} monthly visits tracked with CORRECTED Shop ID precision.
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Success Indicators */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
          <h4 className="text-sm font-medium text-green-900 mb-2">✅ FIXED Features Active:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-green-700">
            <div>• CORRECTED Shop ID + exact timestamp grouping</div>
            <div>• ALL brands collected per shop visit (FIXED)</div>
            <div>• April 1 fallback aging calculation</div>
            <div>• Historical data integration</div>
            <div>• Pending Challans supply detection</div>
            <div>• Zero stock aging exclusion</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;={brand} value={brand}>{brand}</option>
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
            <option value="current">Current Stock</option>
            <option value="restocked_after_oos">Recently Restocked</option>
            <option value="awaiting_supply">Awaiting Supply</option>
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

      {/* Aging Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
      </div>

      {/* All Aging Locations with Pagination */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Aging Inventory Locations (30+ Days) ✅ FIXED</h3>
          <p className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAging.length)} of {filteredAging.length} aging items with CORRECTED Shop ID based matching
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
                    {location.lastSupplyDate ? location.lastSupplyDate.toLocaleDateString('en-GB') : 'Apr 1 (fallback)'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      location.supplyStatus === 'current' ? 'bg-green-100 text-green-800' :
                      location.supplyStatus === 'restocked_after_oos' ? 'bg-blue-100 text-blue-800' :
                      location.supplyStatus === 'awaiting_supply' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {location.supplyStatus.replace('_', ' ')}
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredAging.length)} of {filteredAging.length} aging items
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
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Visit Compliance Dashboard</h2>
      <p className="text-gray-600">Monthly visit metrics with yesterday and last month comparisons</p>
    </div>

    {/* Enhanced Visit Summary */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="text-3xl font-bold text-blue-600">{data.visitCompliance.totalSalesmen}</div>
        <div className="text-sm text-gray-500">Total Salesmen</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="text-3xl font-bold text-green-600">{data.visitCompliance.monthlyVisits}</div>
        <div className="text-sm text-gray-500">Monthly Visits</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="text-3xl font-bold text-purple-600">{data.visitCompliance.yesterdayVisits}</div>
        <div className="text-sm text-gray-500">Yesterday's Visits</div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <div className="text-3xl font-bold text-orange-600">{data.visitCompliance.lastMonthVisits}</div>
        <div className="text-sm text-gray-500">Last Month Total</div>
      </div>
    </div>

    {/* Enhanced Salesman Performance */}
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Monthly Salesman Performance</h3>
        <p className="text-sm text-gray-500">Individual visit statistics and compliance (Current Month)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Visits</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unique Shops</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yesterday Visits</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Month Visits</th>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{salesman.monthlyVisits}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.uniqueShops}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">{salesman.yesterdayVisits}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{salesman.lastMonthVisits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const EnhancedStockIntelligenceTab = ({ 
  data, 
  filters, 
  setFilters, 
  getFilteredItems, 
  departments, 
  salesmen, 
  brands
}: any) => {
  const filteredOutOfStock = getFilteredItems(data.outOfStockItems);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Stock Intelligence & Supply Chain Analysis ✅ FIXED</h2>
        <p className="text-gray-600">Advanced out-of-stock analysis with CORRECTED Shop ID based supply chain intelligence</p>
      </div>

      {/* Enhanced Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <option key
