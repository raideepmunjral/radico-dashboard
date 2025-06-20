'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Target, Search, Filter, Download, X, ChevronLeft, ChevronRight, AlertTriangle, TrendingDown, UserPlus, Package, Calendar, Eye, Clock, RefreshCw, BarChart3, Truck, CheckCircle, XCircle, Users, Timer, Star, Zap } from 'lucide-react';

// ==========================================
// IMPORT UNIFIED BRAND NORMALIZATION SERVICE
// ==========================================
import { 
  normalizeBrand, 
  createMatchingKey, 
  createMultipleMatchingKeys, 
  getBrandFamily, 
  debugBrandMapping,
  validateBrandMapping,
  type BrandInfo 
} from '../../../../utils/brandNormalization';

// ==========================================
// TYPE DEFINITIONS FOR REAL GOOGLE SHEETS DATA
// ==========================================

interface ShopData {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  total: number;
  eightPM: number;
  verve: number;
  marchTotal?: number;
  marchEightPM?: number;
  marchVerve?: number;
  aprilTotal?: number;
  aprilEightPM?: number;
  aprilVerve?: number;
  mayTotal?: number;
  mayEightPM?: number;
  mayVerve?: number;
  juneTotal?: number;
  juneEightPM?: number;
  juneVerve?: number;
  skuBreakdown?: SKUData[];
  detailedSKUBreakdown?: DetailedSKUData[];
  threeMonthAvgTotal?: number;
  threeMonthAvg8PM?: number;
  threeMonthAvgVERVE?: number;
  yoyGrowthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
}

interface SKUData {
  brand: string;
  cases: number;
  percentage: number;
  month?: string;
}

interface DetailedSKUData {
  originalBrand: string;
  displayName: string;
  family: string;
  variant: string;
  size: string;
  cases: number;
  percentage: number;
  month?: string;
}

interface DashboardData {
  allShopsComparison: ShopData[];
  customerInsights: any;
  currentMonth: string;
  currentYear: string;
  historicalData?: any;
}

interface InventoryData {
  shops: Record<string, {
    shopId: string;
    shopName: string;
    department: string;
    salesman: string;
    visitDate: Date;
    items: Record<string, any>;
    lastVisitDays: number;
  }>;
}

interface RealSupplyTransaction {
  date: Date;
  dateStr: string;
  cases: number;
  fullBrand: string;
  brandShort: string;
  size: string;
  shopId: string;
  shopName: string;
  orderNo: string;
  source: 'pending_challans' | 'historical';
  normalizedBrandInfo: BrandInfo;
  matchingKey: string;
}

interface RealSKURecoveryOpportunity {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  sku: string;
  skuFamily: string;
  skuVariant: string;
  skuSize: string;
  skuFlavor?: string;
  
  // Real Historical Analysis from Google Sheets
  lastOrderDate: string;
  daysSinceLastOrder: number;
  lastOrderVolume: number;
  peakMonthVolume: number;
  peakMonth: string;
  historicalAverage: number;
  totalHistoricalVolume: number;
  monthsActive: number;
  
  // Current Status from Inventory
  currentStockQuantity: number;
  isCurrentlyOutOfStock: boolean;
  lastVisitDate?: Date;
  daysSinceLastVisit: number;
  lastSupplyDate?: Date;
  daysSinceLastSupply: number;
  supplyDataSource: string;
  reasonNoStock?: string;
  recentSupplyAttempts: boolean;
  
  // Recovery Analysis
  recoveryPotential: number;
  recoveryScore: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'IMMEDIATE_ACTION' | 'RELATIONSHIP_MAINTENANCE' | 'VIP_CUSTOMER' | 'GAP_ANALYSIS' | 'SUPPLY_CHAIN_ISSUE';
  actionRequired: string;
  
  // Time-Based Customer Segmentation
  customerStatus: 'CURRENT' | 'RECENTLY_STOPPED' | 'SHORT_DORMANT' | 'LONG_DORMANT' | 'INACTIVE';
  timeSegment: '0-30d' | '1-2m' | '3-4m' | '5-8m' | '8m+';
  
  // Timeline Analysis
  orderingPattern: 'CONSISTENT' | 'SEASONAL' | 'DECLINING' | 'STOPPED';
  dropOffMonth?: string;
  timelineAnalysis: string;
  totalMonthsAnalyzed: number;
  
  // Unified Normalization Data
  normalizedKey: string;
  matchingKey: string;
}

interface EnhancedFilters {
  department: string;
  salesman: string;
  skuFilter: string;
  priority: string;
  category: string;
  searchText: string;
  lookbackPeriod: number;
  showOnlyOutOfStock: boolean;
  minimumRecoveryPotential: number;
  showOnlyWithSupplyData: boolean;
  minimumHistoricalAverage: number;
  customerStatus: string;
  timeSegment: string;
  brandFamily: string;
  skuSize: string;
  skuFlavor: string;
}

// ==========================================
// GOOGLE SHEETS CONFIGURATION
// ==========================================

const SHEETS_CONFIG = {
  masterSheetId: process.env.NEXT_PUBLIC_MASTER_SHEET_ID || '1pRz9CgOoamTrFipnmF-XuBCg9IZON9br5avgRlKYtxM',
  historicalSheetId: process.env.NEXT_PUBLIC_HISTORICAL_SHEET_ID || '1yXzEYHJeHlETrEmU4TZ9F2_qv4OE10N4DPdYX0Iqfx0',
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
};

// ==========================================
// REAL GOOGLE SHEETS DATA FETCHING
// ==========================================

const fetchRealSKUData = async (lookbackPeriod: number): Promise<Record<string, RealSupplyTransaction[]>> => {
  console.log('🔄 Fetching REAL SKU data from Google Sheets with UNIFIED normalization...', {
    lookbackPeriod,
    sheetsConfig: SHEETS_CONFIG
  });

  // Validate brand mapping on startup
  const validation = validateBrandMapping();
  if (!validation.success) {
    console.error('❌ Brand mapping validation failed:', validation.errors);
  } else {
    console.log('✅ Brand mapping validation passed');
  }

  if (!SHEETS_CONFIG.apiKey) {
    console.error('❌ Google API key not configured');
    return {};
  }

  try {
    // Fetch both Pending Challans and Historical data
    const [pendingChallansData, historicalData] = await Promise.all([
      fetchPendingChallansData(),
      fetchHistoricalData()
    ]);

    // Process and combine data with unified normalization
    const combinedSKUData = processCombinedSKUData(pendingChallansData, historicalData, lookbackPeriod);
    
    console.log('✅ Real SKU data fetched and processed with UNIFIED normalization:', {
      totalShops: Object.keys(combinedSKUData).length,
      totalTransactions: Object.values(combinedSKUData).flat().length,
      dataSource: 'LIVE_GOOGLE_SHEETS_UNIFIED_NORMALIZATION'
    });

    return combinedSKUData;
  } catch (error) {
    console.error('❌ Error fetching real SKU data:', error);
    return {};
  }
};

const fetchPendingChallansData = async (): Promise<any[][]> => {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.masterSheetId}/values/Pending%20Challans?key=${SHEETS_CONFIG.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch Pending Challans');
    }
    
    const result = await response.json();
    console.log('✅ Pending Challans fetched:', result.values?.length || 0, 'rows');
    return result.values || [];
  } catch (error) {
    console.error('❌ Error fetching Pending Challans:', error);
    return [];
  }
};

const fetchHistoricalData = async (): Promise<any[][]> => {
  try {
    const possibleSheetNames = ['MASTER', 'radico 24 25', 'Sheet1'];
    
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
    console.error('❌ Error fetching historical data:', error);
    return [];
  }
};

const processCombinedSKUData = (
  pendingChallansData: any[][], 
  historicalData: any[][], 
  lookbackPeriod: number
): Record<string, RealSupplyTransaction[]> => {
  const shopSKUTransactions: Record<string, RealSupplyTransaction[]> = {};
  const today = new Date();
  const cutoffDate = new Date(today.getTime() - (lookbackPeriod * 24 * 60 * 60 * 1000));

  console.log('🔧 Processing combined SKU data with UNIFIED brand normalization...', {
    pendingChallansRows: pendingChallansData.length,
    historicalRows: historicalData.length,
    lookbackPeriod,
    cutoffDate: cutoffDate.toLocaleDateString()
  });

  // Process Pending Challans (Recent Data)
  if (pendingChallansData.length > 1) {
    const headers = pendingChallansData[0];
    console.log('📋 Pending Challans headers:', headers);
    
    // Map column indices based on your sheet structure
    const columnIndices = {
      orderDate: headers.findIndex((h: string) => h?.toLowerCase().includes('orderdate')),
      shopId: headers.findIndex((h: string) => h?.toLowerCase().includes('shop_id')),
      shopName: headers.findIndex((h: string) => h?.toLowerCase().includes('shop_name')),
      brand: headers.findIndex((h: string) => h?.toLowerCase().includes('brand') && !h?.toLowerCase().includes('_')),
      size: headers.findIndex((h: string) => h?.toLowerCase().includes('size')),
      cases: headers.findIndex((h: string) => h?.toLowerCase().includes('cases')),
      orderNo: headers.findIndex((h: string) => h?.toLowerCase().includes('order_no'))
    };

    console.log('📊 Pending Challans column mapping:', columnIndices);

    pendingChallansData.slice(1).forEach((row, index) => {
      if (row.length >= Math.max(...Object.values(columnIndices).filter(i => i !== -1))) {
        const dateStr = row[columnIndices.orderDate]?.toString().trim();
        const shopId = row[columnIndices.shopId]?.toString().trim();
        const shopName = row[columnIndices.shopName]?.toString().trim();
        const brand = row[columnIndices.brand]?.toString().trim();
        const size = row[columnIndices.size]?.toString().trim();
        const cases = parseFloat(row[columnIndices.cases]) || 0;
        const orderNo = row[columnIndices.orderNo]?.toString().trim();

        if (shopId && brand && dateStr && cases > 0) {
          const transactionDate = parseSheetDate(dateStr);
          
          if (transactionDate && transactionDate >= cutoffDate) {
            // Use UNIFIED brand normalization
            const normalizedBrandInfo = normalizeBrand(brand, size);
            const matchingKey = createMatchingKey(shopName || shopId, normalizedBrandInfo);
            const shopKey = shopId;

            // Special debug logging for NASIR/NASEER shops
            if (shopName?.includes('NASIR') || shopName?.includes('NASEER') || shopId?.includes('NASIR') || shopId?.includes('NASEER')) {
              console.log('🔍 SKU Recovery Pending Challan - NASIR/NASEER found:', {
                shopName,
                shopId,
                originalBrand: brand,
                originalSize: size,
                normalizedBrandInfo,
                matchingKey,
                dateStr,
                cases
              });
              debugBrandMapping(brand, size, shopName || shopId);
            }

            if (!shopSKUTransactions[shopKey]) {
              shopSKUTransactions[shopKey] = [];
            }

            shopSKUTransactions[shopKey].push({
              date: transactionDate,
              dateStr: dateStr,
              cases: cases,
              fullBrand: brand,
              brandShort: normalizedBrandInfo.family,
              size: normalizedBrandInfo.size,
              shopId: shopId,
              shopName: shopName || 'Unknown Shop',
              orderNo: orderNo || '',
              source: 'pending_challans',
              normalizedBrandInfo,
              matchingKey
            });
          }
        }
      }
    });
  }

  // Process Historical Data
  if (historicalData.length > 1) {
    const headers = historicalData[0];
    console.log('📋 Historical data headers:', headers);
    
    const columnIndices = {
      shopName: headers.findIndex((h: string) => h?.toLowerCase().includes('shop_name')),
      brandShort: headers.findIndex((h: string) => h?.toLowerCase().includes('brand short') || h?.toLowerCase().includes('brand_short')),
      brand: headers.findIndex((h: string) => h?.toLowerCase().includes('brand') && !h?.toLowerCase().includes('short')),
      size: headers.findIndex((h: string) => h?.toLowerCase().includes('size')),
      cases: headers.findIndex((h: string) => h?.toLowerCase().includes('cases')),
      date: headers.findIndex((h: string) => h?.toLowerCase().includes('date')),
      shopId: headers.findIndex((h: string) => h?.toLowerCase().includes('shop_id'))
    };

    console.log('📊 Historical data column mapping:', columnIndices);

    historicalData.slice(1).forEach((row, index) => {
      if (row.length >= Math.max(...Object.values(columnIndices).filter(i => i !== -1))) {
        const dateStr = row[columnIndices.date]?.toString().trim();
        const shopName = row[columnIndices.shopName]?.toString().trim();
        const shopId = row[columnIndices.shopId]?.toString().trim();
        const brandShort = row[columnIndices.brandShort]?.toString().trim();
        const brand = row[columnIndices.brand]?.toString().trim();
        const size = row[columnIndices.size]?.toString().trim();
        const cases = parseFloat(row[columnIndices.cases]) || 0;

        if ((shopId || shopName) && (brandShort || brand) && dateStr && cases > 0) {
          const transactionDate = parseSheetDate(dateStr);
          
          if (transactionDate && transactionDate >= cutoffDate) {
            // Use UNIFIED brand normalization - prioritize brandShort if available
            const brandToNormalize = brandShort || brand;
            const normalizedBrandInfo = normalizeBrand(brandToNormalize, size);
            const shopKey = shopId || shopName;
            const matchingKey = createMatchingKey(shopName || shopId || '', normalizedBrandInfo);

            // Special debug logging for NASIR/NASEER shops
            if (shopName?.includes('NASIR') || shopName?.includes('NASEER') || shopId?.includes('NASIR') || shopId?.includes('NASEER')) {
              console.log('🔍 SKU Recovery Historical - NASIR/NASEER found:', {
                shopName,
                shopId,
                originalBrandShort: brandShort,
                originalBrand: brand,
                brandToNormalize,
                originalSize: size,
                normalizedBrandInfo,
                matchingKey,
                dateStr,
                cases
              });
              debugBrandMapping(brandToNormalize, size, shopName || shopId);
            }

            if (!shopSKUTransactions[shopKey]) {
              shopSKUTransactions[shopKey] = [];
            }

            shopSKUTransactions[shopKey].push({
              date: transactionDate,
              dateStr: dateStr,
              cases: cases,
              fullBrand: brand || brandShort,
              brandShort: brandShort || normalizedBrandInfo.family,
              size: normalizedBrandInfo.size,
              shopId: shopId || '',
              shopName: shopName || 'Unknown Shop',
              orderNo: '',
              source: 'historical',
              normalizedBrandInfo,
              matchingKey
            });
          }
        }
      }
    });
  }

  // Sort transactions by date for each shop
  Object.keys(shopSKUTransactions).forEach(shopKey => {
    shopSKUTransactions[shopKey].sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  const totalShops = Object.keys(shopSKUTransactions).length;
  const totalTransactions = Object.values(shopSKUTransactions).flat().length;
  
  console.log('✅ Combined SKU data processed with UNIFIED normalization:', {
    totalShops,
    totalTransactions,
    sampleShops: Object.keys(shopSKUTransactions).slice(0, 5),
    cutoffDate: cutoffDate.toLocaleDateString(),
    normalizationSource: 'UNIFIED_BRAND_NORMALIZATION_SERVICE'
  });

  return shopSKUTransactions;
};

const parseSheetDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;

  try {
    // Handle various date formats from your sheets
    // DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        // Check if DD-MM-YYYY or YYYY-MM-DD
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          return new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
        } else {
          // DD-MM-YYYY
          return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
    
    // Try direct parsing
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  } catch (error) {
    console.warn('Failed to parse date:', dateStr, error);
  }
  
  return null;
};

// ==========================================
// SKU RECOVERY ANALYSIS WITH UNIFIED NORMALIZATION
// ==========================================

const analyzeRealSKURecovery = (
  shops: ShopData[],
  realSKUData: Record<string, RealSupplyTransaction[]>,
  inventoryData: InventoryData | undefined,
  lookbackPeriod: number
): RealSKURecoveryOpportunity[] => {
  console.log('🔍 Analyzing REAL SKU recovery with UNIFIED normalization...', {
    totalShops: shops.length,
    realSKUDataShops: Object.keys(realSKUData).length,
    lookbackPeriod
  });

  const opportunities: RealSKURecoveryOpportunity[] = [];
  const today = new Date();

  // Process each shop's real SKU data
  Object.entries(realSKUData).forEach(([shopKey, transactions]) => {
    // Find matching shop from dashboard data
    const matchingShop = shops.find(shop => 
      shop.shopId === shopKey || 
      shop.shopName === shopKey ||
      shop.shopName.toLowerCase().includes(shopKey.toLowerCase()) ||
      shopKey.toLowerCase().includes(shop.shopName.toLowerCase())
    );

    if (!matchingShop && transactions.length > 0) {
      // Create basic shop info from transaction data
      const sampleTransaction = transactions[0];
      const basicShop = {
        shopId: sampleTransaction.shopId || shopKey,
        shopName: sampleTransaction.shopName || shopKey,
        department: 'Unknown',
        salesman: 'Unknown'
      };
      
      processShopSKUOpportunities(basicShop, transactions, opportunities, inventoryData, lookbackPeriod, today);
    } else if (matchingShop) {
      processShopSKUOpportunities(matchingShop, transactions, opportunities, inventoryData, lookbackPeriod, today);
    }
  });

  console.log('✅ Real SKU recovery analysis complete with UNIFIED normalization:', {
    totalOpportunities: opportunities.length,
    dataSource: 'LIVE_GOOGLE_SHEETS_UNIFIED_NORMALIZATION',
    byCustomerStatus: {
      RECENTLY_STOPPED: opportunities.filter(o => o.customerStatus === 'RECENTLY_STOPPED').length,
      SHORT_DORMANT: opportunities.filter(o => o.customerStatus === 'SHORT_DORMANT').length,
      LONG_DORMANT: opportunities.filter(o => o.customerStatus === 'LONG_DORMANT').length,
      INACTIVE: opportunities.filter(o => o.customerStatus === 'INACTIVE').length
    }
  });

  return opportunities.sort((a, b) => b.recoveryScore - a.recoveryScore);
};

const processShopSKUOpportunities = (
  shop: any,
  transactions: RealSupplyTransaction[],
  opportunities: RealSKURecoveryOpportunity[],
  inventoryData: InventoryData | undefined,
  lookbackPeriod: number,
  today: Date
) => {
  // Group transactions by normalized SKU key (using unified normalization)
  const skuGroups: Record<string, RealSupplyTransaction[]> = {};
  
  transactions.forEach(transaction => {
    const skuKey = transaction.normalizedBrandInfo.normalizedKey;
    
    // Special debug logging for NASIR/NASEER shops
    if (shop.shopName?.includes('NASIR') || shop.shopName?.includes('NASEER')) {
      console.log('🔍 SKU Recovery Transaction - NASIR/NASEER processing:', {
        shopName: shop.shopName,
        skuKey,
        normalizedBrandInfo: transaction.normalizedBrandInfo,
        matchingKey: transaction.matchingKey,
        originalBrand: transaction.fullBrand,
        originalSize: transaction.size
      });
    }
    
    if (!skuGroups[skuKey]) {
      skuGroups[skuKey] = [];
    }
    skuGroups[skuKey].push(transaction);
  });

  // Analyze each SKU variant separately
  Object.entries(skuGroups).forEach(([skuKey, skuTransactions]) => {
    const sortedTransactions = skuTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    const latestTransaction = sortedTransactions[0];
    const skuInfo = latestTransaction.normalizedBrandInfo;
    
    // Calculate historical metrics
    const totalVolume = sortedTransactions.reduce((sum, t) => sum + t.cases, 0);
    const avgVolume = totalVolume / sortedTransactions.length;
    const daysSinceLastOrder = Math.floor((today.getTime() - latestTransaction.date.getTime()) / (1000 * 60 * 60 * 24));
    
    // Find peak transaction
    const peakTransaction = sortedTransactions.reduce((peak, current) => 
      current.cases > peak.cases ? current : peak, sortedTransactions[0]
    );

    // Get customer status based on time since last order
    const { status: customerStatus, timeSegment } = getCustomerStatusFromDays(daysSinceLastOrder);
    
    // Only include recovery opportunities (not current customers)
    if (customerStatus !== 'CURRENT' && avgVolume >= 1 && sortedTransactions.length >= 2) {
      // Calculate recovery metrics
      const recoveryPotential = Math.max(avgVolume * 2, peakTransaction.cases * 0.5);
      const recoveryScore = calculateRecoveryScore(avgVolume, peakTransaction.cases, daysSinceLastOrder, customerStatus);
      
      // Determine priority and category
      const priority = getPriority(recoveryScore, recoveryPotential, customerStatus);
      const category = getCategory(avgVolume, customerStatus);
      
      // Generate action required
      const actionRequired = generateActionRequired(avgVolume, daysSinceLastOrder, customerStatus);
      
      // Create timeline analysis
      const timelineAnalysis = generateTimelineAnalysis({
        peakMonth: peakTransaction.dateStr,
        peakMonthVolume: peakTransaction.cases,
        lastOrderDate: latestTransaction.dateStr,
        lastOrderVolume: latestTransaction.cases,
        daysSinceLastOrder
      });

      const opportunity: RealSKURecoveryOpportunity = {
        shopId: shop.shopId,
        shopName: shop.shopName,
        department: shop.department || 'Unknown',
        salesman: shop.salesman || 'Unknown',
        sku: skuInfo.displayName,
        skuFamily: skuInfo.family,
        skuVariant: skuInfo.variant,
        skuSize: skuInfo.size,
        skuFlavor: skuInfo.flavor,
        
        // Historical Analysis from Real Google Sheets Data
        lastOrderDate: latestTransaction.dateStr,
        daysSinceLastOrder,
        lastOrderVolume: latestTransaction.cases,
        peakMonthVolume: peakTransaction.cases,
        peakMonth: peakTransaction.dateStr,
        historicalAverage: avgVolume,
        totalHistoricalVolume: totalVolume,
        monthsActive: sortedTransactions.length,
        
        // Current Status
        currentStockQuantity: 0, // Would need inventory integration
        isCurrentlyOutOfStock: false,
        lastVisitDate: undefined,
        daysSinceLastVisit: 999,
        lastSupplyDate: latestTransaction.date,
        daysSinceLastSupply: daysSinceLastOrder,
        supplyDataSource: 'google_sheets_unified_normalization',
        reasonNoStock: '',
        recentSupplyAttempts: false,
        
        // Recovery Analysis
        recoveryPotential,
        recoveryScore,
        priority,
        category,
        actionRequired,
        
        // Time-Based Customer Segmentation
        customerStatus,
        timeSegment,
        
        // Timeline Analysis
        orderingPattern: getOrderingPattern(sortedTransactions, daysSinceLastOrder),
        dropOffMonth: daysSinceLastOrder > 90 ? latestTransaction.dateStr : undefined,
        timelineAnalysis,
        totalMonthsAnalyzed: Math.min(Math.ceil(lookbackPeriod / 30), sortedTransactions.length),
        
        // Unified Normalization Data
        normalizedKey: skuInfo.normalizedKey,
        matchingKey: latestTransaction.matchingKey
      };
      
      // Special debug logging for NASIR/NASEER opportunities
      if (shop.shopName?.includes('NASIR') || shop.shopName?.includes('NASEER')) {
        console.log('🔍 SKU Recovery Opportunity created - NASIR/NASEER:', {
          shopName: shop.shopName,
          sku: opportunity.sku,
          normalizedKey: opportunity.normalizedKey,
          matchingKey: opportunity.matchingKey,
          recoveryPotential: opportunity.recoveryPotential,
          customerStatus: opportunity.customerStatus,
          daysSinceLastOrder: opportunity.daysSinceLastOrder
        });
      }
      
      opportunities.push(opportunity);
    }
  });
};

// ==========================================
// HELPER FUNCTIONS FOR ANALYSIS
// ==========================================

const getCustomerStatusFromDays = (daysSinceLastOrder: number): {
  status: RealSKURecoveryOpportunity['customerStatus'];
  timeSegment: RealSKURecoveryOpportunity['timeSegment'];
} => {
  if (daysSinceLastOrder <= 30) {
    return { status: 'CURRENT', timeSegment: '0-30d' };
  } else if (daysSinceLastOrder <= 60) {
    return { status: 'RECENTLY_STOPPED', timeSegment: '1-2m' };
  } else if (daysSinceLastOrder <= 120) {
    return { status: 'SHORT_DORMANT', timeSegment: '3-4m' };
  } else if (daysSinceLastOrder <= 240) {
    return { status: 'LONG_DORMANT', timeSegment: '5-8m' };
  } else {
    return { status: 'INACTIVE', timeSegment: '8m+' };
  }
};

const calculateRecoveryScore = (avgVolume: number, peakVolume: number, daysSinceLastOrder: number, customerStatus: string): number => {
  let score = 0;
  
  // Base score from historical performance
  score += Math.min(avgVolume * 5, 40);
  score += Math.min(peakVolume * 2, 20);
  
  // Time urgency scoring
  if (customerStatus === 'RECENTLY_STOPPED') score += 25;
  else if (customerStatus === 'SHORT_DORMANT') score += 15;
  else if (customerStatus === 'LONG_DORMANT') score += 10;
  else if (customerStatus === 'INACTIVE') score += 5;
  
  return Math.min(score, 100);
};

const getPriority = (score: number, potential: number, customerStatus: string): RealSKURecoveryOpportunity['priority'] => {
  if (customerStatus === 'RECENTLY_STOPPED' && potential > 20) return 'CRITICAL';
  if (score >= 80 || customerStatus === 'RECENTLY_STOPPED') return 'HIGH';
  if (score >= 60 || customerStatus === 'SHORT_DORMANT') return 'MEDIUM';
  return 'LOW';
};

const getCategory = (avgVolume: number, customerStatus: string): RealSKURecoveryOpportunity['category'] => {
  if (customerStatus === 'RECENTLY_STOPPED') return 'IMMEDIATE_ACTION';
  if (avgVolume > 15) return 'VIP_CUSTOMER';
  if (customerStatus === 'SHORT_DORMANT') return 'RELATIONSHIP_MAINTENANCE';
  return 'GAP_ANALYSIS';
};

const generateActionRequired = (avgVolume: number, daysSinceLastOrder: number, customerStatus: string): string => {
  if (customerStatus === 'RECENTLY_STOPPED') {
    return `🚨 URGENT: Customer stopped ordering ${avgVolume.toFixed(1)} avg cases just ${daysSinceLastOrder} days ago - immediate follow-up required`;
  } else if (customerStatus === 'SHORT_DORMANT') {
    return `📞 Call customer: Stopped ordering ${avgVolume.toFixed(1)} avg cases ${daysSinceLastOrder} days ago`;
  } else if (customerStatus === 'LONG_DORMANT') {
    return `🎯 Re-engagement needed: Customer dormant for ${daysSinceLastOrder} days, was ordering ${avgVolume.toFixed(1)} cases average`;
  } else {
    return `💼 Strategic recovery: Long-term inactive customer, consider special incentives`;
  }
};

const getOrderingPattern = (transactions: RealSupplyTransaction[], daysSinceLastOrder: number): RealSKURecoveryOpportunity['orderingPattern'] => {
  if (transactions.length >= 6 && daysSinceLastOrder <= 90) return 'CONSISTENT';
  if (transactions.length >= 3 && daysSinceLastOrder <= 180) return 'SEASONAL';
  if (transactions.length >= 2 && daysSinceLastOrder > 180) return 'DECLINING';
  return 'STOPPED';
};

const generateTimelineAnalysis = (data: {
  peakMonth: string;
  peakMonthVolume: number;
  lastOrderDate: string;
  lastOrderVolume: number;
  daysSinceLastOrder: number;
}): string => {
  const timeline = [];
  if (data.peakMonth && data.peakMonthVolume > 0) {
    timeline.push(`Peak: ${data.peakMonth} (${data.peakMonthVolume} cases)`);
  }
  if (data.lastOrderDate) {
    timeline.push(`Last order: ${data.lastOrderDate} (${data.lastOrderVolume} cases)`);
  }
  timeline.push(`Gap: ${data.daysSinceLastOrder} days`);
  
  return timeline.join(' → ');
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const SKURecoveryIntelligence = ({ data, inventoryData }: { 
  data: DashboardData; 
  inventoryData?: InventoryData;
}) => {
  const [filters, setFilters] = useState<EnhancedFilters>({
    department: '',
    salesman: '',
    skuFilter: '',
    priority: '',
    category: '',
    searchText: '',
    lookbackPeriod: 365,
    showOnlyOutOfStock: false,
    minimumRecoveryPotential: 5,
    showOnlyWithSupplyData: false,
    minimumHistoricalAverage: 2,
    customerStatus: '',
    timeSegment: '',
    brandFamily: '',
    skuSize: '',
    skuFlavor: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [realSKUData, setRealSKUData] = useState<Record<string, RealSupplyTransaction[]>>({});

  // Fetch real SKU data from Google Sheets with unified normalization
  useEffect(() => {
    const loadRealSKUData = async () => {
      setLoading(true);
      try {
        const skuData = await fetchRealSKUData(filters.lookbackPeriod);
        setRealSKUData(skuData);
      } catch (error) {
        console.error('Error loading real SKU data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRealSKUData();
  }, [filters.lookbackPeriod]);

  // Generate recovery opportunities from real Google Sheets data with unified normalization
  const recoveryOpportunities = useMemo(() => {
    if (loading || Object.keys(realSKUData).length === 0) {
      return [];
    }
    
    return analyzeRealSKURecovery(
      data.allShopsComparison,
      realSKUData,
      inventoryData,
      filters.lookbackPeriod
    );
  }, [data.allShopsComparison, realSKUData, inventoryData, filters.lookbackPeriod, loading]);

  // Get unique values for filters
  const departments = [...new Set(data.allShopsComparison.map(shop => shop.department))].sort();
  const salesmen = [...new Set(data.allShopsComparison.map(shop => shop.salesman))].sort();
  const allSKUs = [...new Set(recoveryOpportunities.map(opp => opp.sku))].sort();
  const allSizes = [...new Set(recoveryOpportunities.map(opp => opp.skuSize))].filter(Boolean).sort();
  const allFlavors = [...new Set(recoveryOpportunities.map(opp => opp.skuFlavor))].filter(Boolean).sort();
  
  // Enhanced filtering
  const filteredOpportunities = useMemo(() => {
    return recoveryOpportunities.filter(opp => {
      const matchesDepartment = !filters.department || opp.department === filters.department;
      const matchesSalesman = !filters.salesman || opp.salesman === filters.salesman;
      const matchesSKU = !filters.skuFilter || opp.sku.toLowerCase().includes(filters.skuFilter.toLowerCase());
      const matchesPriority = !filters.priority || opp.priority === filters.priority;
      const matchesCategory = !filters.category || opp.category === filters.category;
      const matchesSearch = !filters.searchText || 
        opp.shopName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        opp.sku.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        opp.salesman.toLowerCase().includes(filters.searchText.toLowerCase());
      const matchesOutOfStock = !filters.showOnlyOutOfStock || opp.isCurrentlyOutOfStock;
      const matchesMinRecovery = opp.recoveryPotential >= filters.minimumRecoveryPotential;
      const matchesSupplyData = !filters.showOnlyWithSupplyData || opp.supplyDataSource !== 'no_data';
      const matchesMinHistorical = opp.historicalAverage >= filters.minimumHistoricalAverage;
      const matchesCustomerStatus = !filters.customerStatus || opp.customerStatus === filters.customerStatus;
      const matchesTimeSegment = !filters.timeSegment || opp.timeSegment === filters.timeSegment;
      const matchesBrandFamily = !filters.brandFamily || opp.skuFamily === filters.brandFamily;
      const matchesSkuSize = !filters.skuSize || opp.skuSize === filters.skuSize;
      const matchesSkuFlavor = !filters.skuFlavor || opp.skuFlavor === filters.skuFlavor;

      return matchesDepartment && matchesSalesman && matchesSKU && matchesPriority && 
             matchesCategory && matchesSearch && matchesOutOfStock && 
             matchesMinRecovery && matchesSupplyData && matchesMinHistorical &&
             matchesCustomerStatus && matchesTimeSegment && matchesBrandFamily &&
             matchesSkuSize && matchesSkuFlavor;
    });
  }, [recoveryOpportunities, filters]);

  // Time-based customer segmentation analysis
  const timeSegmentAnalysis = useMemo(() => {
    const segments: Record<string, { count: number; potential: number; timeRange: string }> = {
      'CURRENT': { count: 0, potential: 0, timeRange: '0-30 days' },
      'RECENTLY_STOPPED': { count: 0, potential: 0, timeRange: '1-2 months' },
      'SHORT_DORMANT': { count: 0, potential: 0, timeRange: '3-4 months' },
      'LONG_DORMANT': { count: 0, potential: 0, timeRange: '5-8 months' },
      'INACTIVE': { count: 0, potential: 0, timeRange: '8+ months' }
    };

    filteredOpportunities.forEach(opp => {
      segments[opp.customerStatus].count++;
      segments[opp.customerStatus].potential += opp.recoveryPotential;
    });

    return segments;
  }, [filteredOpportunities]);

  // SKU Family Analysis
  const skuFamilyAnalysis = useMemo(() => {
    const families: Record<string, { count: number; potential: number; sizes: Set<string>; flavors: Set<string> }> = {};
    filteredOpportunities.forEach(opp => {
      if (!families[opp.skuFamily]) {
        families[opp.skuFamily] = { count: 0, potential: 0, sizes: new Set(), flavors: new Set() };
      }
      families[opp.skuFamily].count++;
      families[opp.skuFamily].potential += opp.recoveryPotential;
      families[opp.skuFamily].sizes.add(opp.skuSize);
      if (opp.skuFlavor) families[opp.skuFamily].flavors.add(opp.skuFlavor);
    });

    return Object.entries(families).map(([family, data]) => ({
      family,
      count: data.count,
      potential: data.potential,
      sizes: Array.from(data.sizes).join(', '),
      flavors: Array.from(data.flavors).join(', ')
    }));
  }, [filteredOpportunities]);

  // Pagination
  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOpportunities = filteredOpportunities.slice(startIndex, endIndex);

  // Summary statistics
  const summary = useMemo(() => {
    const total = filteredOpportunities.length;
    const totalRecoveryPotential = filteredOpportunities.reduce((sum, opp) => sum + opp.recoveryPotential, 0);
    const avgRecoveryScore = total > 0 
      ? filteredOpportunities.reduce((sum, opp) => sum + opp.recoveryScore, 0) / total 
      : 0;

    const priorityCounts: Record<string, number> = {
      CRITICAL: filteredOpportunities.filter(o => o.priority === 'CRITICAL').length,
      HIGH: filteredOpportunities.filter(o => o.priority === 'HIGH').length,
      MEDIUM: filteredOpportunities.filter(o => o.priority === 'MEDIUM').length,
      LOW: filteredOpportunities.filter(o => o.priority === 'LOW').length
    };

    const uniqueSKUs = [...new Set(filteredOpportunities.map(o => o.sku))].length;
    const outOfStockCount = filteredOpportunities.filter(o => o.isCurrentlyOutOfStock).length;

    return {
      total,
      totalRecoveryPotential,
      avgRecoveryScore,
      priorityCounts,
      uniqueSKUs,
      outOfStockCount
    };
  }, [filteredOpportunities]);

  // Export function
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `UNIFIED NORMALIZATION SKU Recovery Intelligence Report - ${new Date().toLocaleDateString()}\n`;
    csvContent += `Data Source: Live Google Sheets with UNIFIED brand normalization\n`;
    csvContent += `Master Sheet: ${SHEETS_CONFIG.masterSheetId}\n`;
    csvContent += `Historical Sheet: ${SHEETS_CONFIG.historicalSheetId}\n`;
    csvContent += `Normalization Service: UNIFIED_BRAND_NORMALIZATION_SERVICE\n`;
    csvContent += `Total Opportunities: ${summary.total}\n`;
    csvContent += `Total Recovery Potential: ${summary.totalRecoveryPotential.toFixed(0)} cases\n\n`;
    
    // Time segment summary
    csvContent += "TIME-BASED CUSTOMER SEGMENTATION SUMMARY:\n";
    Object.entries(timeSegmentAnalysis).forEach(([status, data]) => {
      csvContent += `${status} (${data.timeRange}): ${data.count} opportunities, ${data.potential.toFixed(0)} cases potential\n`;
    });
    
    csvContent += "\nSKU FAMILY ANALYSIS:\n";
    skuFamilyAnalysis.forEach(family => {
      csvContent += `${family.family}: ${family.count} opportunities, ${family.potential.toFixed(0)} cases, Sizes: ${family.sizes}, Flavors: ${family.flavors}\n`;
    });
    
    csvContent += "\n";
    csvContent += `Shop Name,Shop ID,Department,Salesman,Specific SKU,SKU Family,SKU Size,SKU Flavor,Customer Status,Time Segment,Last SKU Supply Date,Days Since Last SKU Supply,Last SKU Volume,Peak SKU Volume,Peak Month,SKU Historical Average,Total SKU Historical,SKU Recovery Potential,Recovery Score,Priority,Category,Action Required,SKU Timeline Analysis,Normalized Key,Matching Key\n`;
    
    filteredOpportunities.forEach(opp => {
      csvContent += `"${opp.shopName}","${opp.shopId}","${opp.department}","${opp.salesman}","${opp.sku}","${opp.skuFamily}","${opp.skuSize}","${opp.skuFlavor || 'N/A'}","${opp.customerStatus}","${opp.timeSegment}","${opp.lastOrderDate}",${opp.daysSinceLastOrder},${opp.lastOrderVolume},${opp.peakMonthVolume},"${opp.peakMonth}",${opp.historicalAverage.toFixed(1)},${opp.totalHistoricalVolume},${opp.recoveryPotential.toFixed(1)},${opp.recoveryScore},"${opp.priority}","${opp.category}","${opp.actionRequired}","${opp.timelineAnalysis}","${opp.normalizedKey}","${opp.matchingKey}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `UNIFIED_NORMALIZATION_SKU_Recovery_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper functions for UI
  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-red-100 text-red-800 border-red-200',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      LOW: 'bg-green-100 text-green-800 border-green-200'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full border ${colors[priority] || colors.LOW}`;
  };

  const getCustomerStatusBadge = (status: string, timeSegment: string) => {
    const colors: Record<string, string> = {
      CURRENT: 'bg-green-100 text-green-800 border-green-200',
      RECENTLY_STOPPED: 'bg-red-100 text-red-800 border-red-200',
      SHORT_DORMANT: 'bg-orange-100 text-orange-800 border-orange-200',
      LONG_DORMANT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return `px-2 py-1 text-xs font-semibold rounded border ${colors[status] || colors.INACTIVE}`;
  };

  const clearAllFilters = () => {
    setFilters({
      department: '',
      salesman: '',
      skuFilter: '',
      priority: '',
      category: '',
      searchText: '',
      lookbackPeriod: 365,
      showOnlyOutOfStock: false,
      minimumRecoveryPotential: 5,
      showOnlyWithSupplyData: false,
      minimumHistoricalAverage: 2,
      customerStatus: '',
      timeSegment: '',
      brandFamily: '',
      skuSize: '',
      skuFlavor: ''
    });
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading UNIFIED SKU Recovery Intelligence</h2>
          <p className="text-gray-600">Fetching real data from Google Sheets with unified brand normalization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center mb-2">
              <Target className="w-6 h-6 mr-2 text-purple-600" />
              UNIFIED NORMALIZATION SKU Recovery Intelligence
            </h2>
            <p className="text-gray-600">Real-time SKU recovery analysis with unified brand normalization across all data sources</p>
            <div className="flex items-center mt-2 text-sm space-x-4">
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Connected to live Google Sheets ({Object.keys(realSKUData).length} shops)
              </div>
              <div className="flex items-center text-blue-600">
                <Timer className="w-4 h-4 mr-2" />
                Real transaction data ({Object.values(realSKUData).flat().length} transactions)
              </div>
              <div className="flex items-center text-purple-600">
                <Star className="w-4 h-4 mr-2" />
                UNIFIED brand normalization service
              </div>
              <div className="flex items-center text-orange-600">
                <Zap className="w-4 h-4 mr-2" />
                Glass vs PET distinction maintained
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <label className="text-sm text-gray-600">Analysis Period:</label>
              <select
                value={filters.lookbackPeriod}
                onChange={(e) => {
                  setFilters({ ...filters, lookbackPeriod: parseInt(e.target.value) });
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value={180}>180 Days (6 Months)</option>
                <option value={270}>270 Days (9 Months)</option>
                <option value={365}>365 Days (12 Months)</option>
                <option value={545}>545 Days (18 Months)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Time-Based Customer Segmentation Dashboard */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            UNIFIED Customer Lifecycle Analysis from Google Sheets
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(timeSegmentAnalysis).map(([status, data]) => (
              <div key={status} className="text-center">
                <div className={`text-2xl font-bold ${
                  status === 'RECENTLY_STOPPED' ? 'text-red-600' :
                  status === 'SHORT_DORMANT' ? 'text-orange-600' :
                  status === 'LONG_DORMANT' ? 'text-yellow-600' :
                  status === 'INACTIVE' ? 'text-gray-600' :
                  'text-green-600'
                }`}>
                  {data.count}
                </div>
                <div className={`text-sm ${
                  status === 'RECENTLY_STOPPED' ? 'text-red-600' :
                  status === 'SHORT_DORMANT' ? 'text-orange-600' :
                  status === 'LONG_DORMANT' ? 'text-yellow-600' :
                  status === 'INACTIVE' ? 'text-gray-600' :
                  'text-green-600'
                }`}>
                  {status.replace('_', ' ')}
                </div>
                <div className="text-xs text-gray-500">{data.timeRange}</div>
                <div className="text-xs font-medium text-purple-600">{data.potential.toFixed(0)} cases</div>
              </div>
            ))}
          </div>
        </div>

        {/* SKU Family Analysis Dashboard */}
        {skuFamilyAnalysis.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-green-900 mb-3 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              UNIFIED SKU Family Analysis from Real Data
            </h3>
            <div className="space-y-2">
              {skuFamilyAnalysis.map(family => (
                <div key={family.family} className="flex items-center justify-between bg-white rounded p-3">
                  <div>
                    <div className="font-medium text-gray-900">{family.family} Family</div>
                    <div className="text-sm text-gray-600">
                      {family.count} opportunities • {family.potential.toFixed(0)} cases potential
                    </div>
                    <div className="text-xs text-blue-600">
                      Sizes: {family.sizes} {family.flavors && `• Flavors: ${family.flavors}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => setFilters({ ...filters, brandFamily: family.family })}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      Filter {family.family}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Filter Buttons for Time Segments */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setFilters({ ...filters, customerStatus: '' })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.customerStatus === '' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Customers
          </button>
          <button
            onClick={() => setFilters({ ...filters, customerStatus: 'RECENTLY_STOPPED' })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.customerStatus === 'RECENTLY_STOPPED' 
                ? 'bg-red-600 text-white' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            🚨 Recently Stopped ({timeSegmentAnalysis.RECENTLY_STOPPED.count})
          </button>
          <button
            onClick={() => setFilters({ ...filters, customerStatus: 'SHORT_DORMANT' })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.customerStatus === 'SHORT_DORMANT' 
                ? 'bg-orange-600 text-white' 
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            ⚠️ Short Dormant ({timeSegmentAnalysis.SHORT_DORMANT.count})
          </button>
          <button
            onClick={() => setFilters({ ...filters, customerStatus: 'LONG_DORMANT' })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.customerStatus === 'LONG_DORMANT' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            🔄 Long Dormant ({timeSegmentAnalysis.LONG_DORMANT.count})
          </button>
          <button
            onClick={() => setFilters({ ...filters, customerStatus: 'INACTIVE' })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.customerStatus === 'INACTIVE' 
                ? 'bg-gray-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            💤 Inactive ({timeSegmentAnalysis.INACTIVE.count})
          </button>
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-sm text-gray-600">UNIFIED Opportunities</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.priorityCounts.CRITICAL}</div>
            <div className="text-sm text-red-600">Critical Priority</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.uniqueSKUs}</div>
            <div className="text-sm text-blue-600">Unique SKU Variants</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.totalRecoveryPotential.toFixed(0)}</div>
            <div className="text-sm text-green-600">Cases at Risk</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{summary.avgRecoveryScore.toFixed(0)}</div>
            <div className="text-sm text-orange-600">Avg Score</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{timeSegmentAnalysis.RECENTLY_STOPPED.count}</div>
            <div className="text-sm text-purple-600">Quick Win Targets</div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search shops, SKUs..."
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-full text-sm"
            />
          </div>

          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filters.salesman}
            onChange={(e) => setFilters({ ...filters, salesman: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Salesmen</option>
            {salesmen.map(salesman => (
              <option key={salesman} value={salesman}>{salesman}</option>
            ))}
          </select>

          <select
            value={filters.brandFamily}
            onChange={(e) => setFilters({ ...filters, brandFamily: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Families</option>
            <option value="8PM">8PM Whisky</option>
            <option value="VERVE">VERVE Vodka</option>
          </select>

          <select
            value={filters.skuSize}
            onChange={(e) => setFilters({ ...filters, skuSize: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Sizes</option>
            {allSizes.map(size => (
              <option key={size} value={size}>{size}ML</option>
            ))}
          </select>

          <select
            value={filters.skuFlavor}
            onChange={(e) => setFilters({ ...filters, skuFlavor: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Flavors</option>
            {allFlavors.map(flavor => (
              <option key={flavor} value={flavor}>{flavor}</option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <button
            onClick={clearAllFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2 text-sm"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Min Recovery:</span>
            <input
              type="number"
              value={filters.minimumRecoveryPotential}
              onChange={(e) => setFilters({ ...filters, minimumRecoveryPotential: parseInt(e.target.value) || 0 })}
              className="border border-gray-300 rounded px-3 py-1 w-20 text-sm"
              min="0"
              max="1000"
            />
            <span className="text-sm text-gray-600">cases</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Min Historical Avg:</span>
            <input
              type="number"
              value={filters.minimumHistoricalAverage}
              onChange={(e) => setFilters({ ...filters, minimumHistoricalAverage: parseInt(e.target.value) || 0 })}
              className="border border-gray-300 rounded px-3 py-1 w-20 text-sm"
              min="0"
              max="500"
            />
            <span className="text-sm text-gray-600">cases/transaction</span>
          </div>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export UNIFIED Data CSV</span>
          </button>

          <div className="text-sm text-gray-500">
            {filteredOpportunities.length} of {recoveryOpportunities.length} unified opportunities
          </div>
        </div>
      </div>

      {/* Enhanced Recovery Opportunities Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">UNIFIED NORMALIZATION SKU Recovery Opportunities</h3>
          <p className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredOpportunities.length)} of {filteredOpportunities.length} unified opportunities 
            from real Google Sheets data with consistent brand normalization
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop & SKU Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Historical Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recovery Analysis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Required</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unified Normalization</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOpportunities.map((opportunity, index) => (
                <tr key={`${opportunity.shopId}-${opportunity.normalizedKey}-${index}`} className={
                  opportunity.customerStatus === 'RECENTLY_STOPPED' ? 'bg-red-50' : 
                  opportunity.customerStatus === 'SHORT_DORMANT' ? 'bg-orange-50' : ''
                }>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{opportunity.shopName}</div>
                      <div className="text-sm text-gray-500">ID: {opportunity.shopId}</div>
                      <div className="text-sm text-gray-500">{opportunity.department} • {opportunity.salesman}</div>
                      <div className="text-sm font-medium text-purple-600 mt-1">{opportunity.sku}</div>
                      <div className="text-xs text-gray-400">
                        {opportunity.skuFamily} Family • {opportunity.skuSize}ML
                        {opportunity.skuFlavor && ` • ${opportunity.skuFlavor}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className={getCustomerStatusBadge(opportunity.customerStatus, opportunity.timeSegment)}>
                        {opportunity.customerStatus.replace('_', ' ')}
                      </span>
                      <div className="text-xs text-gray-500">({opportunity.timeSegment})</div>
                      <div className="text-xs text-blue-600">
                        {opportunity.daysSinceLastOrder} days since last order
                      </div>
                      <div className="text-xs">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          opportunity.orderingPattern === 'CONSISTENT' ? 'bg-green-100 text-green-800' :
                          opportunity.orderingPattern === 'DECLINING' ? 'bg-yellow-100 text-yellow-800' :
                          opportunity.orderingPattern === 'STOPPED' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {opportunity.orderingPattern}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Avg Volume:</span> {opportunity.historicalAverage.toFixed(1)} cases/transaction</div>
                      <div><span className="font-medium">Peak:</span> {opportunity.peakMonthVolume} cases ({opportunity.peakMonth})</div>
                      <div><span className="font-medium">Total Historical:</span> {opportunity.totalHistoricalVolume} cases</div>
                      <div><span className="font-medium">Active Transactions:</span> {opportunity.monthsActive}</div>
                      <div className="text-xs text-blue-600">Last: {opportunity.lastOrderDate} ({opportunity.lastOrderVolume} cases)</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-green-600">
                        {opportunity.recoveryPotential.toFixed(0)} cases
                      </div>
                      <div className="text-sm text-gray-500">
                        Score: {opportunity.recoveryScore}/100
                      </div>
                      <div className="mt-1">
                        <span className={getPriorityBadge(opportunity.priority)}>
                          {opportunity.priority}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        From unified normalization
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium text-gray-700 mb-1">Action:</div>
                        <div>{opportunity.actionRequired}</div>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Timeline:</span>
                        <div className="mt-1">{opportunity.timelineAnalysis}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Normalized Key:</span>
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded">{opportunity.normalizedKey}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Matching Key:</span>
                        <div className="font-mono text-xs bg-blue-100 p-1 rounded truncate">{opportunity.matchingKey}</div>
                      </div>
                      <div className="text-xs text-green-600">
                        ✅ UNIFIED normalization applied
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOpportunities.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No UNIFIED SKU Recovery Opportunities Found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more opportunities.</p>
            <div className="mt-4 text-sm text-gray-600">
              <p>Connected to: {Object.keys(realSKUData).length} shops with {Object.values(realSKUData).flat().length} unified transactions</p>
            </div>
          </div>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-700 mb-2 sm:mb-0">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredOpportunities.length)} of {filteredOpportunities.length} unified opportunities
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
        )}
      </div>
    </div>
  );
};

export default SKURecoveryIntelligence;
