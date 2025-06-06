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
  visitDate: Date;
  items: Record<string, any>;
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
    rollingPeriodDays: number;
    periodStartDate: Date;
    periodEndDate: Date;
  };
  shops: Record<string, ShopInventory>;
  skuPerformance: Array<{
    name: string;
    trackedShops: number;
    inStockCount: number;
    outOfStockCount: number;
    outOfStockPercentage: number;
    agingLocations: Array<any>;
  }>;
  allAgingLocations: Array<any>;
  outOfStockItems: Array<any>;
  visitCompliance: {
    totalSalesmen: number;
    activeSalesmen: number;
    rollingPeriodVisits: number;
    yesterdayVisits: number;
    lastWeekVisits: number;
    salesmenStats: Array<{
      name: string;
      rollingPeriodVisits: number;
      uniqueShops: number;
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

  // CONFIGURATION
  const SHEETS_CONFIG = {
    visitSheetId: process.env.NEXT_PUBLIC_VISIT_SHEET_ID || '1XG4c_Lrpk-YglTq3G3ZY9Qjt7wSnUq0UZWDSYT61eWE',
    historicalSheetId: process.env.NEXT_PUBLIC_HISTORICAL_SHEET_ID || '1yXzEYHJeHlETrEmU4TZ9F2_qv4OE10N4DPdYX0Iqfx0',
    masterSheetId: process.env.NEXT_PUBLIC_MASTER_SHEET_ID || '1pRz9CgOoamTrFipnmF-XuBCg9IZON9br5avgRlKYtxM',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  };

  // ==========================================
  // ENHANCED BRAND NORMALIZATION SYSTEM
  // ==========================================

  const BRAND_MAPPING: { [key: string]: string } = {
    // 8 PM BRAND FAMILY - ENHANCED WITH ALL SIZE VARIATIONS
    '8 PM BLACK': '8 PM PREMIUM BLACK BLENDED WHISKY',
    '8 PM BLACK 750': '8 PM PREMIUM BLACK BLENDED WHISKY',
    '8 PM BLACK 375': '8 PM PREMIUM BLACK BLENDED WHISKY', 
    '8 PM BLACK 180': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
    '8 PM BLACK 180 P': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
    '8 PM BLACK 90': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
    '8 PM BLACK 60': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
    '8 PM BLACK 60 P': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
    
    // Direct supply sheet mappings
    '8 PM PREMIUM BLACK BLENDED WHISKY': '8 PM PREMIUM BLACK BLENDED WHISKY',
    '8 PM PREMIUM BLACK BLENDED WHISKY Pet': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
    
    // VERVE BRAND FAMILY
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
  // DATA FETCHING FUNCTIONS
  // ==========================================

  const fetchInventoryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!SHEETS_CONFIG.apiKey) {
        throw new Error('Google API key not configured');
      }

      const [visitData, historicalData, masterData] = await Promise.all([
        fetchVisitSheetData(),
        fetchHistoricalSheetData(),
        fetchMasterSheetData()
      ]);
      
      const processedData = processEnhancedInventoryData(visitData, historicalData, masterData, rollingPeriodDays);
      setInventoryData(processedData);
      
    } catch (error: any) {
      console.error('Error fetching inventory data:', error);
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
      return result.values || [];
    } catch (error) {
      console.error('Error fetching visit data:', error);
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
            return result.values || [];
          }
        } catch (err) {
          continue;
        }
      }
      
      return [];
    } catch (error) {
      console.warn('Error fetching historical data:', error);
      return [];
    }
  };

  const fetchMasterSheetData = async () => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.masterSheetId}/values/Pending%20Challans?key=${SHEETS_CONFIG.apiKey}`
      );
      
      if (!response.ok) {
        return [];
      }
      
      const result = await response.json();
      return result.values || [];
    } catch (error) {
      console.warn('Error fetching pending challans:', error);
      return [];
    }
  };

  // ==========================================
  // DATA PROCESSING LOGIC
  // ==========================================

  const processEnhancedInventoryData = (visitData: any[][], historicalData: any[][], pendingChallans: any[][], rollingDays: number = 15): InventoryData => {
    if (visitData.length === 0) {
      throw new Error('No visit data found');
    }

    const headers = visitData[0];
    const rows = visitData.slice(1);

    const getColumnIndex = (searchTerms: string[]) => {
      for (const term of searchTerms) {
        const index = headers.findIndex(header => 
          header && header.toString().toLowerCase().includes(term.toLowerCase())
        );
        if (index !== -1) {
          return index;
        }
      }
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

    const requiredColumns = ['shopId', 'shopName', 'invBrand', 'invQuantity', 'checkInDateTime'];
    for (const col of requiredColumns) {
      if (columnIndices[col as keyof typeof columnIndices] === -1) {
        throw new Error(`Required column '${col}' not found`);
      }
    }

    // Process supply data
    const supplyHistory = processHistoricalSupplyData(historicalData);
    const recentSupplies = processPendingChallans(pendingChallans);
    
    // Forward hierarchical processing
    let currentShopInfo: any = null;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (row[columnIndices.shopId] && row[columnIndices.shopName]) {
        currentShopInfo = {
          shopId: row[columnIndices.shopId],
          shopName: row[columnIndices.shopName],
          checkInDateTime: row[columnIndices.checkInDateTime],
          department: row[columnIndices.department],
          salesman: row[columnIndices.salesman]
        };
      }
      
      const invBrand = row[columnIndices.invBrand];
      if (invBrand && invBrand.toString().trim() && !row[columnIndices.shopId] && currentShopInfo) {
        row[columnIndices.shopId] = currentShopInfo.shopId;
        row[columnIndices.shopName] = currentShopInfo.shopName;
        row[columnIndices.checkInDateTime] = currentShopInfo.checkInDateTime;
        row[columnIndices.department] = currentShopInfo.department;
        row[columnIndices.salesman] = currentShopInfo.salesman;
      }
    }

    // Rolling period logic
    const today = new Date();
    const rollingPeriodStart = new Date(today.getTime() - (rollingDays * 24 * 60 * 60 * 1000));
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

    const rollingPeriodRows = rows.filter(row => {
      const dateStr = row[columnIndices.checkInDateTime];
      if (!dateStr) return false;
      
      try {
        const rowDate = parseDate(dateStr);
        if (!rowDate) return false;
        
        const isWithinRollingPeriod = rowDate >= rollingPeriodStart && rowDate <= today;
        return isWithinRollingPeriod;
      } catch (error) {
        return false;
      }
    });

    if (rollingPeriodRows.length === 0) {
      const extendedPeriodStart = new Date(today.getTime() - (60 * 24 * 60 * 60 * 1000));
      return processEnhancedInventoryData(visitData, historicalData, pendingChallans, 60);
    }

    // Find latest visits for each shop
    const shopLatestVisits: Record<string, any> = {};
    
    rollingPeriodRows.forEach(row => {
      const shopId = row[columnIndices.shopId];
      const shopName = row[columnIndices.shopName];
      const checkInDateTime = row[columnIndices.checkInDateTime];
      
      if (!shopId || !checkInDateTime) return;
      
      try {
        const visitDate = parseDate(checkInDateTime);
        if (!visitDate) return;
        
        if (!shopLatestVisits[shopId] || visitDate > shopLatestVisits[shopId].visitDate) {
          shopLatestVisits[shopId] = {
            shopId,
            shopName: shopName || 'Unknown Shop',
            department: row[columnIndices.department] || 'Unknown',
            salesman: row[columnIndices.salesman] || 'Unknown',
            visitDate,
            rows: []
          };
        }
      } catch (error) {
        // Skip invalid dates
      }
    });
    
    const shopLatestVisitRows: Record<string, any[]> = {};
    
    rollingPeriodRows.forEach(row => {
      const shopId = row[columnIndices.shopId];
      const checkInDateTime = row[columnIndices.checkInDateTime];
      
      if (!shopId || !checkInDateTime) return;
      
      try {
        const visitDate = parseDate(checkInDateTime);
        if (!visitDate) return;
        
        const latestVisit = shopLatestVisits[shopId];
        
        if (latestVisit && visitDate.getTime() === latestVisit.visitDate.getTime()) {
          if (!shopLatestVisitRows[shopId]) {
            shopLatestVisitRows[shopId] = [];
          }
          shopLatestVisitRows[shopId].push(row);
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
    const salesmenVisits: Record<string, any> = {};
    const processedSKUs = new Set<string>();

    let rollingPeriodVisitCount = 0;
    let yesterdayVisitCount = 0;
    let lastWeekVisitCount = 0;

    Object.values(shopLatestVisits).forEach((shopVisit: any) => {
      rollingPeriodVisitCount++;
      
      if (shopVisit.visitDate.toDateString() === yesterday.toDateString()) {
        yesterdayVisitCount++;
      }
      
      if (shopVisit.visitDate >= lastWeek) {
        lastWeekVisitCount++;
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

      if (!salesmenVisits[shopVisit.salesman]) {
        salesmenVisits[shopVisit.salesman] = {
          name: shopVisit.salesman,
          rollingPeriodVisits: 0,
          uniqueShops: new Set(),
          yesterdayVisits: 0,
          lastWeekVisits: 0
        };
      }
      salesmenVisits[shopVisit.salesman].rollingPeriodVisits++;
      salesmenVisits[shopVisit.salesman].uniqueShops.add(shopVisit.shopId);
      
      if (shopVisit.visitDate.toDateString() === yesterday.toDateString()) {
        salesmenVisits[shopVisit.salesman].yesterdayVisits++;
      }
      
      if (shopVisit.visitDate >= lastWeek) {
        salesmenVisits[shopVisit.salesman].lastWeekVisits++;
      }

      const visitRows = shopLatestVisitRows[shopVisit.shopId] || [];
      
      visitRows.forEach((row: any[], rowIndex: number) => {
        const brand = row[columnIndices.invBrand]?.toString().trim();
        const quantity = parseFloat(row[columnIndices.invQuantity]) || 0;
        const reasonNoStock = row[columnIndices.reasonNoStock]?.toString().trim() || '';
        const lsDate = row[columnIndices.lsDate];

        if (!brand) return;
        
        processedSKUs.add(brand);
        
        // Enhanced supply check
        const supplyCheckResult = checkSuppliedAfterOutOfStock(
          shopVisit.shopId, 
          brand, 
          shopVisit.visitDate, 
          recentSupplies
        );

        let lastSupplyDate: Date | undefined;
        let isEstimatedAge = true;
        let ageInDays = 0;
        
        if (supplyCheckResult.supplyDate) {
          lastSupplyDate = supplyCheckResult.supplyDate;
          isEstimatedAge = false;
          ageInDays = Math.floor((shopVisit.visitDate.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24));
        } else {
          const lastSupplyFromHistory = getLastSupplyDate(shopVisit.shopId, brand, supplyHistory);
          const lastSupplyFromLS = lsDate ? parseDate(lsDate) : null;
          
          if (lastSupplyFromHistory && lastSupplyFromHistory < shopVisit.visitDate) {
            lastSupplyDate = lastSupplyFromHistory;
            isEstimatedAge = false;
            ageInDays = Math.floor((shopVisit.visitDate.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24));
          } else if (lastSupplyFromLS && lastSupplyFromLS < shopVisit.visitDate) {
            lastSupplyDate = lastSupplyFromLS;
            isEstimatedAge = false;
            ageInDays = Math.floor((shopVisit.visitDate.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24));
          } else {
            const fallbackDate = new Date('2025-04-01');
            lastSupplyDate = fallbackDate;
            ageInDays = Math.floor((shopVisit.visitDate.getTime() - fallbackDate.getTime()) / (1000 * 60 * 60 * 24));
            isEstimatedAge = true;
          }
        }

        if (ageInDays < 0) {
          ageInDays = Math.abs(ageInDays);
        }

        let ageCategory: InventoryItem['ageCategory'] = 'lessThan30Days';
        if (ageInDays >= 90) ageCategory = 'over90Days';
        else if (ageInDays >= 75) ageCategory = 'days75to90';
        else if (ageInDays >= 60) ageCategory = 'days60to75';
        else if (ageInDays >= 45) ageCategory = 'days45to60';
        else if (ageInDays >= 30) ageCategory = 'days30to45';

        // Enhanced supply status
        const advancedSupplyStatus = getEnhancedSupplyStatus(
          quantity,
          shopVisit.visitDate,
          supplyCheckResult,
          lastSupplyDate
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
          daysSinceLastSupply: lastSupplyDate ? Math.floor((shopVisit.visitDate.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined,
          supplyStatus
        };

        // Add enhanced properties
        (inventoryItem as any).daysOutOfStock = supplyCheckResult.daysOutOfStock;
        (inventoryItem as any).supplyDateAfterVisit = supplyCheckResult.supplyDate;
        (inventoryItem as any).currentDaysOutOfStock = isOutOfStock ? calculateDaysCurrentlyOutOfStock(shopVisit.visitDate) : undefined;
        (inventoryItem as any).isInGracePeriod = supplyCheckResult.isInGracePeriod;
        (inventoryItem as any).enhancedSupplyStatus = advancedSupplyStatus;
        (inventoryItem as any).daysSinceSupply = supplyCheckResult.daysSinceSupply;

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
            visitDate: shopInventory.visitDate
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
            currentDaysOutOfStock: calculateDaysCurrentlyOutOfStock(shopVisit.visitDate),
            supplyDateAfterVisit: supplyCheckResult.supplyDate,
            isInGracePeriod: supplyCheckResult.isInGracePeriod,
            enhancedSupplyStatus: advancedSupplyStatus,
            daysSinceSupply: supplyCheckResult.daysSinceSupply,
            daysSinceLastSupply: lastSupplyDate ? Math.floor((today.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined
          } as any;
          
          outOfStockItems.push(outOfStockItem);
        }

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
          const agingLocation = {
            shopName: shopInventory.shopName,
            department: shopInventory.department,
            salesman: shopInventory.salesman,
            ageInDays,
            quantity,
            lastSupplyDate,
            suppliedAfterOutOfStock: supplyCheckResult.wasRestocked
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
    const visitedShops = totalShops;
    const totalSKUs = Object.keys(skuTracker).length;
    const totalOutOfStock = Object.values(shops).reduce((sum, shop) => sum + shop.outOfStockCount, 0);
    const totalLowStock = Object.values(shops).reduce((sum, shop) => sum + shop.lowStockCount, 0);
    const totalAging = Object.values(shops).reduce((sum, shop) => sum + shop.agingInventoryCount, 0);
    const avgAge = allAgingLocations.length > 0 ? 
      Math.round(allAgingLocations.reduce((sum, item) => sum + item.ageInDays, 0) / allAgingLocations.length) : 0;
    const recentlyRestockedItems = Object.values(shops).reduce((sum, shop) => 
      sum + Object.values(shop.items).filter(item => {
        const isRestocked = item.suppliedAfterOutOfStock || (item as any).enhancedSupplyStatus?.includes('Restocked');
        return isRestocked;
      }).length, 0);

    const salesmenStats = Object.values(salesmenVisits).map((salesman: any) => ({
      name: salesman.name,
      rollingPeriodVisits: salesman.rollingPeriodVisits,
      uniqueShops: salesman.uniqueShops.size,
      yesterdayVisits: salesman.yesterdayVisits,
      lastWeekVisits: salesman.lastWeekVisits
    })).sort((a, b) => b.rollingPeriodVisits - a.rollingPeriodVisits);

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
        periodEndDate: today
      },
      shops,
      skuPerformance,
      allAgingLocations,
      outOfStockItems,
      visitCompliance: {
        totalSalesmen: salesmenStats.length,
        activeSalesmen: salesmenStats.filter(s => s.rollingPeriodVisits > 0).length,
        rollingPeriodVisits: rollingPeriodVisitCount,
        yesterdayVisits: yesterdayVisitCount,
        lastWeekVisits: lastWeekVisitCount,
        salesmenStats
      }
    };
  };

  // ==========================================
  // SUPPLY DATA PROCESSING FUNCTIONS
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
    
    const shopIdIndex = headers.findIndex(h => h?.toLowerCase().includes('shop_id'));
    const brandShortIndex = headers.findIndex(h => h?.toLowerCase().includes('brand_short'));
    const brandIndex = headers.findIndex(h => h?.toLowerCase().includes('brand') && !h?.toLowerCase().includes('short'));
    const sizeIndex = headers.findIndex(h => h?.toLowerCase().includes('size'));
    const dateIndex = headers.findIndex(h => h?.toLowerCase().includes('date'));
    const casesIndex = headers.findIndex(h => h?.toLowerCase().includes('cases'));
    
    if (shopIdIndex === -1 || (brandShortIndex === -1 && brandIndex === -1) || dateIndex === -1) {
      return supplyHistory;
    }
    
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
          }
        }
      }
    });
    
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
          }
        }
      }
    });
    
    return recentSupplies;
  };

  const getLastSupplyDate = (shopId: string, brandName: string, supplyHistory: Record<string, Date>) => {
    const brandInfo = normalizeBrandInfo(brandName);
    const possibleKeys = [
      `${shopId}_${brandInfo.normalizedName}_${brandInfo.size}`,
      `${shopId}_${brandInfo.normalizedName}`,
      `${shopId}_${brandInfo.family}_${brandInfo.size}`,
      `${shopId}_${brandInfo.family}`
    ];
    
    for (const key of possibleKeys) {
      if (supplyHistory[key]) {
        return supplyHistory[key];
      }
    }
    
    return null;
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

  // Enhanced supply status with comprehensive information
  const getEnhancedSupplyStatus = (
    quantity: number,
    visitDate: Date,
    supplyCheckResult: any,
    lastSupplyDate?: Date
  ): string => {
    const today = new Date();
    
    if (quantity === 0) {
      if (supplyCheckResult.wasRestocked) {
        const { daysSinceSupply, daysOutOfStock } = supplyCheckResult;
        return `Restocked (${daysSinceSupply}d ago, was out ${daysOutOfStock}d)`;
      } else {
        const daysOutOfStock = Math.floor((today.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceLastSupply = lastSupplyDate ? Math.floor((today.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
        
        if (daysSinceLastSupply !== null) {
          return `Awaiting Supply (${daysOutOfStock}d since visit, ${daysSinceLastSupply}d since last supply)`;
        } else {
          return `Awaiting Supply (${daysOutOfStock}d since visit)`;
        }
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
  // FILTERING & UTILITIES
  // ==========================================

  const getEnhancedSupplyStatusDisplay = (item: any) => {
    if ((item as any).enhancedSupplyStatus) {
      return (item as any).enhancedSupplyStatus;
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
      const matchesSupplyStatus = !filters.supplyStatus || 
        (item.supplyStatus === filters.supplyStatus) ||
        ((item as any).enhancedSupplyStatus?.toLowerCase().includes(filters.supplyStatus.toLowerCase()));
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
      'recently_restocked',
      'awaiting_supply', 
      'current',
      'aging_30_45',
      'aging_45_60', 
      'aging_60_75',
      'aging_75_90',
      'aging_critical'
    ];
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
      doc.text(`${rollingPeriodDays}-Day Rolling Inventory Report`, 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
      doc.text(`Period: ${inventoryData.summary.periodStartDate.toLocaleDateString()} - ${inventoryData.summary.periodEndDate.toLocaleDateString()}`, 20, 40);
      
      const summaryData = [
        ['Total Shops Visited', inventoryData.summary.visitedShops.toString()],
        ['Total SKUs Tracked', inventoryData.summary.totalSKUs.toString()],
        ['Out of Stock Items', inventoryData.summary.totalOutOfStock.toString()],
        ['Aging Items (30+ days)', inventoryData.summary.totalAging.toString()],
        ['Recently Restocked', inventoryData.summary.recentlyRestockedItems.toString()],
        ['Average Age (days)', inventoryData.summary.avgAge.toString()],
        ['Rolling Period', `${rollingPeriodDays} days`]
      ];

      (doc as any).autoTable({
        head: [['Metric', 'Value']],
        body: summaryData,
        startY: 60,
        theme: 'grid'
      });

      doc.save(`Rolling_${rollingPeriodDays}Day_Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  const exportToCSV = async () => {
    if (!inventoryData) return;

    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `${rollingPeriodDays}-Day Rolling Inventory Analytics Report - ` + new Date().toLocaleDateString() + "\n";
      csvContent += `Period: ${inventoryData.summary.periodStartDate.toLocaleDateString()} - ${inventoryData.summary.periodEndDate.toLocaleDateString()}\n`;
      csvContent += "Filters Applied: " + JSON.stringify(filters) + "\n\n";
      
      if (activeTab === 'alerts') {
        csvContent += "OUT OF STOCK ANALYSIS\n";
        csvContent += "SKU,Shop Name,Department,Salesman,Reason,Visit Date,Supply Status,Days Since Supply\n";
        
        inventoryData.outOfStockItems.forEach(item => {
          const status = (item as any).enhancedSupplyStatus || 'Unknown';
          const daysSinceSupply = (item as any).daysSinceSupply || 'N/A';
          
          csvContent += `"${item.sku}","${item.shopName}","${item.department}","${item.salesman}","${item.reasonNoStock}","${item.visitDate.toLocaleDateString()}","${status}","${daysSinceSupply}"\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Rolling_${rollingPeriodDays}Day_Inventory_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  // Enhanced Stock Intelligence CSV Export
  const exportStockIntelligenceCSV = async () => {
    if (!inventoryData) return;

    try {
      const filteredOutOfStock = getFilteredItems(inventoryData.outOfStockItems);
      
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `Stock Intelligence Report - ${new Date().toLocaleDateString()}\n`;
      csvContent += `Period: ${inventoryData.summary.periodStartDate.toLocaleDateString()} - ${inventoryData.summary.periodEndDate.toLocaleDateString()}\n`;
      csvContent += `Filtered Results: ${filteredOutOfStock.length} items\n\n`;
      
      csvContent += "SKU,Shop Name,Department,Salesman,Reason,Visit Date,Days Since Visit,Days Since Last Supply,Out of Stock Duration,Enhanced Supply Status\n";
      
      filteredOutOfStock.forEach(item => {
        const daysSinceVisit = Math.floor((new Date().getTime() - item.visitDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceLastSupply = (item as any).daysSinceLastSupply || 'N/A';
        const outOfStockDuration = (item as any).daysOutOfStock || 'N/A';
        const enhancedStatus = (item as any).enhancedSupplyStatus || 'Unknown';
        
        csvContent += `"${item.sku}","${item.shopName}","${item.department}","${item.salesman}","${item.reasonNoStock}","${item.visitDate.toLocaleDateString()}","${daysSinceVisit}","${daysSinceLastSupply}","${outOfStockDuration}","${enhancedStatus}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Stock_Intelligence_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting Stock Intelligence CSV:', error);
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Inventory Dashboard</h2>
          <p className="text-gray-600">Processing inventory data...</p>
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inventory Analytics Dashboard</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Rolling Period Selector */}
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
                >
                  <Table className="w-4 h-4" />
                  <span>CSV</span>
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
        {activeTab === 'overview' && <InventoryOverviewTab data={inventoryData} />}
        {activeTab === 'shops' && (
          <ShopInventoryTab 
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
          <AgingAnalysisTab 
            data={inventoryData} 
            filters={filters}
            setFilters={setFilters}
            getFilteredItems={getFilteredItems}
            getEnhancedSupplyStatusDisplay={getEnhancedSupplyStatusDisplay}
            departments={getDepartments()}
            salesmen={getSalesmen()}
            brands={getBrands()}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
          />
        )}
        {activeTab === 'visits' && <VisitComplianceTab data={inventoryData} />}
        {activeTab === 'alerts' && (
          <StockIntelligenceTab 
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
            exportStockIntelligenceCSV={exportStockIntelligenceCSV}
          />
        )}
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
      <p className="text-gray-600">
        Real-time inventory status ({data.summary.rollingPeriodDays}-Day Rolling Period)
      </p>
      <p className="text-sm text-gray-500">
        Period: {data.summary.periodStartDate.toLocaleDateString()} - {data.summary.periodEndDate.toLocaleDateString()}
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

    {/* SKU Performance - EXPLANATION */}
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">All SKU Stock Status</h3>
        <p className="text-sm text-gray-500">
          Complete inventory status for {data.summary.rollingPeriodDays}-day rolling period.
          <span className="font-medium text-blue-600 ml-2">
            Out of Stock counts represent shops where items had zero quantity during their latest visit (not adjusted for subsequent restocking).
          </span>
        </p>
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

const ShopInventoryTab = ({ data, filteredShops, filters, setFilters, getEnhancedSupplyStatusDisplay, departments, salesmen, expandedShop, setExpandedShop }: any) => (
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

    {/* Shop Inventory List */}
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Shop Inventory Status</h3>
        <p className="text-sm text-gray-500">Showing {filteredShops.length} shops ({data.summary.rollingPeriodDays}-day rolling period)</p>
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

const AgingAnalysisTab = ({ data, filters, setFilters, getFilteredItems, getEnhancedSupplyStatusDisplay, departments, salesmen, brands, currentPage, setCurrentPage, itemsPerPage }: any) => {
  const filteredAging = getFilteredItems(data.allAgingLocations);
  const totalPages = Math.ceil(filteredAging.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAging.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aging Inventory Analysis</h2>
        <p className="text-gray-600">All aging products (30+ days) ({data.summary.rollingPeriodDays}-day rolling period)</p>
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
            <option value="current">Current Stock</option>
            <option value="recently_restocked">Recently Restocked</option>
            <option value="aging_30_45">Aging 30-45 Days</option>
            <option value="aging_45_60">Aging 45-60 Days</option>
            <option value="aging_60_75">Aging 60-75 Days</option>
            <option value="aging_75_90">Aging 75-90 Days</option>
            <option value="aging_critical">Critical (90+ Days)</option>
          </select>

          <button
            onClick={() => setFilters({ ...filters, department: '', salesman: '', brand: '', ageCategory: '', supplyStatus: '' })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
