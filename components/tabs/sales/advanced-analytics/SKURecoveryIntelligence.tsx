'use client';

import React, { useState, useMemo } from 'react';
import { Target, Search, Filter, Download, X, ChevronLeft, ChevronRight, AlertTriangle, TrendingDown, UserPlus, Package, Calendar, Eye, Clock, RefreshCw, BarChart3, Truck, CheckCircle, XCircle } from 'lucide-react';

// ==========================================
// ENHANCED TYPE DEFINITIONS
// ==========================================

interface ShopData {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  total: number;
  eightPM: number;
  verve: number;
  // Extended historical data (matching app/page.tsx interface)
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
  historicalData?: {
    june: any;
    may: any;
    april: any;
    march: any;
    february: any;
    january: any;
    december2024: any;
    november2024: any;
    october2024: any;
    september2024: any;
    august2024: any;
    july2024: any;
    juneLastYear: any;
  };
}

interface InventoryData {
  shops: Record<string, {
    shopId: string;
    shopName: string;
    department: string;
    salesman: string;
    visitDate: Date;
    items: Record<string, {
      brand: string;
      quantity: number;
      isInStock: boolean;
      isOutOfStock: boolean;
      reasonNoStock?: string;
      suppliedAfterOutOfStock?: boolean;
      ageInDays?: number;
      lastSupplyDate?: Date;
      agingDataSource?: string;
      supplyStatus?: string;
    }>;
    lastVisitDays: number;
  }>;
}

interface EnhancedSKURecoveryOpportunity {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  sku: string;
  skuFamily: string;
  skuVariant: string;
  
  // Enhanced Historical Analysis
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
  
  // Timeline Analysis
  orderingPattern: 'CONSISTENT' | 'SEASONAL' | 'DECLINING' | 'STOPPED';
  dropOffMonth?: string;
  timelineAnalysis: string;
  totalMonthsAnalyzed: number;
}

interface Filters {
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
}

// ==========================================
// FIXED BRAND NORMALIZATION & SIZE EXTRACTION
// ==========================================

const VALID_SIZES = ['60ML', '90ML', '180ML', '375ML', '750ML']; // Only valid whisky/vodka sizes
const DEFAULT_SIZE = '750ML';

const DETAILED_SKU_MAPPING: { [key: string]: string } = {
  // 8PM Family with proper sizes
  '8 PM BLACK 375': '8PM BLACK 375ML',
  '8 PM BLACK 750': '8PM BLACK 750ML', 
  '8 PM BLACK 180': '8PM BLACK 180ML PET',
  '8 PM BLACK 90': '8PM BLACK 90ML PET',
  '8 PM BLACK 60': '8PM BLACK 60ML PET',
  '8PM BLACK 375': '8PM BLACK 375ML',
  '8PM BLACK 750': '8PM BLACK 750ML',
  '8PM BLACK 180': '8PM BLACK 180ML PET',
  '8PM BLACK 90': '8PM BLACK 90ML PET',
  '8PM BLACK 60': '8PM BLACK 60ML PET',
  
  // Handle the data issues - these might be in the source data incorrectly
  '8PM BLACK 8': '8PM BLACK 375ML', // Assume 8 is a typo for 375
  '8 PM BLACK 8': '8PM BLACK 375ML',
  '8PM BLACK 8ML': '8PM BLACK 375ML', // Fix the 8ML error
  '8 PM BLACK 8ML': '8PM BLACK 375ML',
  
  // VERVE Family with variants and sizes
  'VERVE LEMON LUSH 750': 'VERVE LEMON LUSH 750ML',
  'VERVE LEMON LUSH 375': 'VERVE LEMON LUSH 375ML',
  'VERVE LEMON LUSH 180': 'VERVE LEMON LUSH 180ML',
  'VERVE GRAIN 750': 'VERVE GRAIN 750ML',
  'VERVE GRAIN 375': 'VERVE GRAIN 375ML',
  'VERVE GRAIN 180': 'VERVE GRAIN 180ML',
  'VERVE CRANBERRY 750': 'VERVE CRANBERRY 750ML',
  'VERVE CRANBERRY 375': 'VERVE CRANBERRY 375ML',
  'VERVE CRANBERRY 180': 'VERVE CRANBERRY 180ML',
  'VERVE GREEN APPLE 750': 'VERVE GREEN APPLE 750ML',
  'VERVE GREEN APPLE 375': 'VERVE GREEN APPLE 375ML',
  'VERVE GREEN APPLE 180': 'VERVE GREEN APPLE 180ML',
  
  // Long form VERVE names
  'M2M VERVE LEMON LUSH SUP FL VODKA 750ml': 'VERVE LEMON LUSH 750ML',
  'M2M VERVE LEMON LUSH SUP FL VODKA 375ml': 'VERVE LEMON LUSH 375ML',
  'M2M VERVE SUPERIOR GRAIN VODKA 750ml': 'VERVE GRAIN 750ML',
  'M2M VERVE SUPERIOR GRAIN VODKA 375ml': 'VERVE GRAIN 375ML',
  'M2M VERVE CRANBERRY TEASE SP FL VODKA 750ml': 'VERVE CRANBERRY 750ML',
  'M2M VERVE CRANBERRY TEASE SP FL VODKA 375ml': 'VERVE CRANBERRY 375ML',
  'M2M VERVE GREEN APPLE SUPERIOR FL VODKA 750ml': 'VERVE GREEN APPLE 750ML',
  'M2M VERVE GREEN APPLE SUPERIOR FL VODKA 375ml': 'VERVE GREEN APPLE 375ML',
};

const extractValidSize = (brand: string): string => {
  if (!brand) return DEFAULT_SIZE;
  
  const upperBrand = brand.toString().trim().toUpperCase();
  
  // Check for valid sizes in order of specificity
  for (const size of VALID_SIZES) {
    const sizeNumber = size.replace('ML', '');
    
    // Look for size patterns
    if (upperBrand.includes(size) || 
        upperBrand.includes(`${sizeNumber}ML`) ||
        upperBrand.includes(`${sizeNumber} ML`) ||
        upperBrand.includes(`${sizeNumber}ml`) ||
        (upperBrand.includes(sizeNumber) && (upperBrand.includes('ML') || upperBrand.includes('PET')))) {
      
      // Special handling for PET sizes
      if (['60', '90', '180'].includes(sizeNumber) && (upperBrand.includes('PET') || upperBrand.includes('Pet'))) {
        return `${sizeNumber}ML PET`;
      }
      
      return size;
    }
  }
  
  // Handle edge cases and data errors
  if (upperBrand.includes('8ML') || upperBrand.includes('8 ML')) {
    console.warn(`⚠️ Invalid size "8ML" found in brand: ${brand}, defaulting to 375ML`);
    return '375ML'; // 8ML doesn't exist, assume it's a data error for 375ML
  }
  
  // Default fallback
  return DEFAULT_SIZE;
};

const normalizeDetailedSKUName = (brand: string): string => {
  if (!brand) return '';
  
  const cleanBrand = brand.toString().trim();
  
  // Direct mapping first
  if (DETAILED_SKU_MAPPING[cleanBrand]) {
    return DETAILED_SKU_MAPPING[cleanBrand];
  }
  
  // Parse the brand to extract components
  const upperBrand = cleanBrand.toUpperCase();
  let normalizedName = '';
  
  // Extract size using improved function
  const size = extractValidSize(cleanBrand);
  
  // Determine family and create normalized name
  if (upperBrand.includes('8 PM') || upperBrand.includes('8PM') || upperBrand.includes('PREMIUM BLACK')) {
    normalizedName = `8PM BLACK ${size}`;
  } else if (upperBrand.includes('VERVE') || upperBrand.includes('M2M') || upperBrand.includes('MAGIC MOMENTS')) {
    if (upperBrand.includes('LEMON')) {
      normalizedName = `VERVE LEMON LUSH ${size}`;
    } else if (upperBrand.includes('GRAIN')) {
      normalizedName = `VERVE GRAIN ${size}`;
    } else if (upperBrand.includes('CRANBERRY')) {
      normalizedName = `VERVE CRANBERRY ${size}`;
    } else if (upperBrand.includes('GREEN') || upperBrand.includes('APPLE')) {
      normalizedName = `VERVE GREEN APPLE ${size}`;
    } else {
      normalizedName = `VERVE ${size}`;
    }
  } else {
    normalizedName = cleanBrand;
  }
  
  console.log(`🔧 SKU Normalization: "${cleanBrand}" → "${normalizedName}"`);
  return normalizedName;
};

const getEnhancedSKUInfo = (brand: string) => {
  const normalizedName = normalizeDetailedSKUName(brand);
  
  // Extract family
  let family = '';
  if (normalizedName.includes('8PM')) {
    family = '8PM';
  } else if (normalizedName.includes('VERVE')) {
    family = 'VERVE';
  } else {
    family = 'OTHER';
  }
  
  // Extract size
  const size = extractValidSize(normalizedName);
  
  return {
    originalBrand: brand,
    family,
    variant: normalizedName,
    size,
    displayName: normalizedName,
    normalizedName
  };
};

// ==========================================
// FIXED: SKU-SPECIFIC HISTORICAL ANALYSIS WITH DEDUPLICATION
// ==========================================

const getDetailedSKUVolumeFromMonth = (
  shopId: string, 
  targetSKU: string, 
  monthData: any,
  fallbackToShopProperties?: { eightPM?: number; verve?: number }
): number => {
  // First, try to get from detailed SKU breakdown in the month data
  if (monthData && monthData.shopDetailedSKUs && monthData.shopDetailedSKUs[shopId]) {
    const detailedSKUs = monthData.shopDetailedSKUs[shopId];
    const matchingSKU = detailedSKUs.find((sku: any) => 
      sku.displayName === targetSKU || 
      sku.variant === targetSKU ||
      normalizeDetailedSKUName(sku.originalBrand) === targetSKU
    );
    
    if (matchingSKU) {
      console.log(`✅ Found detailed SKU data: ${targetSKU} = ${matchingSKU.cases} cases in ${monthData.name || 'unknown month'}`);
      return matchingSKU.cases;
    }
  }
  
  // Second, try to get from regular SKU breakdown in the month data
  if (monthData && monthData.shopSKUs && monthData.shopSKUs[shopId]) {
    const regularSKUs = monthData.shopSKUs[shopId];
    const matchingBrands = Object.keys(regularSKUs).filter(brand => 
      normalizeDetailedSKUName(brand) === targetSKU
    );
    
    if (matchingBrands.length > 0) {
      const totalCases = matchingBrands.reduce((sum, brand) => sum + (regularSKUs[brand] || 0), 0);
      console.log(`✅ Found regular SKU data: ${targetSKU} = ${totalCases} cases from ${matchingBrands.length} variants`);
      return totalCases;
    }
  }
  
  // Don't use fallback for individual SKU analysis
  return 0;
};

const getExtendedHistoricalAnalysis = (shop: ShopData, skuInfo: any, lookbackPeriod: number, historicalData?: any) => {
  const targetSKU = skuInfo.normalizedName;
  console.log(`🔍 Analyzing SKU: ${targetSKU} for shop: ${shop.shopName} (${shop.shopId})`);
  
  // Build comprehensive month data with specific SKU volumes
  const allMonthsData = [];
  
  // Current year months (from shop properties and detailed breakdowns)
  allMonthsData.push(
    { 
      name: 'June 2025', 
      key: 'june', 
      year: 2025, 
      month: 6,
      volume: getDetailedSKUVolumeFromCurrentShop(shop, targetSKU, 'current'),
      source: 'current_shop_data'
    },
    { 
      name: 'May 2025', 
      key: 'may', 
      year: 2025, 
      month: 5,
      volume: getDetailedSKUVolumeFromCurrentShop(shop, targetSKU, 'may'),
      source: 'current_shop_data'
    },
    { 
      name: 'April 2025', 
      key: 'april', 
      year: 2025, 
      month: 4,
      volume: getDetailedSKUVolumeFromCurrentShop(shop, targetSKU, 'april'),
      source: 'current_shop_data'
    },
    { 
      name: 'March 2025', 
      key: 'march', 
      year: 2025, 
      month: 3,
      volume: getDetailedSKUVolumeFromCurrentShop(shop, targetSKU, 'march'),
      source: 'current_shop_data'
    }
  );
  
  // Extended historical data from detailed month data
  if (historicalData) {
    const extendedMonths = [
      { name: 'February 2025', key: 'february', data: historicalData.february, year: 2025, month: 2 },
      { name: 'January 2025', key: 'january', data: historicalData.january, year: 2025, month: 1 },
      { name: 'December 2024', key: 'december2024', data: historicalData.december2024, year: 2024, month: 12 },
      { name: 'November 2024', key: 'november2024', data: historicalData.november2024, year: 2024, month: 11 },
      { name: 'October 2024', key: 'october2024', data: historicalData.october2024, year: 2024, month: 10 },
      { name: 'September 2024', key: 'september2024', data: historicalData.september2024, year: 2024, month: 9 },
      { name: 'August 2024', key: 'august2024', data: historicalData.august2024, year: 2024, month: 8 },
      { name: 'July 2024', key: 'july2024', data: historicalData.july2024, year: 2024, month: 7 },
      { name: 'June 2024', key: 'juneLastYear', data: historicalData.juneLastYear, year: 2024, month: 6 }
    ];
    
    extendedMonths.forEach(monthInfo => {
      const volume = getDetailedSKUVolumeFromMonth(shop.shopId, targetSKU, monthInfo.data);
      allMonthsData.push({
        name: monthInfo.name,
        key: monthInfo.key,
        year: monthInfo.year,
        month: monthInfo.month,
        volume,
        source: 'historical_data'
      });
    });
  }
  
  // Filter months based on lookback period
  const monthsToLookback = Math.ceil(lookbackPeriod / 30);
  const relevantMonths = allMonthsData.slice(0, Math.min(monthsToLookback, allMonthsData.length));
  
  console.log(`📊 Historical analysis for ${targetSKU}:`, relevantMonths.map(m => `${m.name}: ${m.volume} cases`));
  
  const nonZeroVolumes = relevantMonths.filter(v => v.volume > 0);
  const totalVolume = nonZeroVolumes.reduce((sum, v) => sum + v.volume, 0);
  const avgVolume = nonZeroVolumes.length > 0 ? totalVolume / nonZeroVolumes.length : 0;
  
  // Find peak month
  const peakMonth = relevantMonths.reduce((peak, current) => 
    current.volume > peak.volume ? current : peak, 
    { name: '', volume: 0, year: 0, month: 0 }
  );
  
  // Find last active month
  const lastActiveMonth = relevantMonths.find(v => v.volume > 0);
  
  // Calculate days since last order using proper dates
  let daysSinceLastOrder = 999;
  if (lastActiveMonth && lastActiveMonth.year > 0) {
    const today = new Date();
    const lastOrderDate = new Date(lastActiveMonth.year, lastActiveMonth.month - 1, 15);
    daysSinceLastOrder = Math.floor((today.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Determine ordering pattern
  let orderingPattern: 'CONSISTENT' | 'SEASONAL' | 'DECLINING' | 'STOPPED' = 'STOPPED';
  if (nonZeroVolumes.length >= 6) orderingPattern = 'CONSISTENT';
  else if (nonZeroVolumes.length >= 3) orderingPattern = 'DECLINING';
  else if (nonZeroVolumes.length >= 1) orderingPattern = 'STOPPED';
  
  // Find drop-off month
  const dropOffMonth = relevantMonths.find((v, i) => i > 0 && v.volume === 0 && relevantMonths[i-1].volume > 0);
  
  return {
    lastOrderDate: lastActiveMonth?.name || 'Unknown',
    daysSinceLastOrder,
    lastOrderVolume: lastActiveMonth?.volume || 0,
    peakMonthVolume: peakMonth.volume,
    peakMonth: peakMonth.name || 'Unknown',
    historicalAverage: avgVolume,
    totalHistoricalVolume: totalVolume,
    monthsActive: nonZeroVolumes.length,
    currentVolume: relevantMonths[0]?.volume || 0,
    orderingPattern,
    dropOffMonth: dropOffMonth?.name,
    totalMonthsAnalyzed: relevantMonths.length
  };
};

const getDetailedSKUVolumeFromCurrentShop = (shop: ShopData, targetSKU: string, timeFrame: string): number => {
  // First, try detailed SKU breakdown (most accurate)
  if (shop.detailedSKUBreakdown) {
    const matchingSKU = shop.detailedSKUBreakdown.find(sku => 
      sku.displayName === targetSKU || 
      sku.variant === targetSKU ||
      normalizeDetailedSKUName(sku.originalBrand) === targetSKU
    );
    
    if (matchingSKU) {
      console.log(`✅ Found current detailed SKU: ${targetSKU} = ${matchingSKU.cases} cases`);
      return matchingSKU.cases;
    }
  }
  
  // Second, try regular SKU breakdown
  if (shop.skuBreakdown) {
    const matchingBrands = shop.skuBreakdown.filter(sku => 
      normalizeDetailedSKUName(sku.brand) === targetSKU
    );
    
    if (matchingBrands.length > 0) {
      const totalCases = matchingBrands.reduce((sum, sku) => sum + sku.cases, 0);
      console.log(`✅ Found current regular SKU: ${targetSKU} = ${totalCases} cases from ${matchingBrands.length} variants`);
      return totalCases;
    }
  }
  
  // No specific SKU data found
  console.log(`❌ No specific data found for ${targetSKU} in current shop data`);
  return 0;
};

// ==========================================
// ENHANCED RECOVERY ANALYSIS ENGINE WITH DEDUPLICATION
// ==========================================

const analyzeEnhancedRecoveryOpportunities = (
  shops: ShopData[], 
  inventoryData: InventoryData | undefined, 
  lookbackPeriod: number,
  historicalData?: any
): EnhancedSKURecoveryOpportunity[] => {
  console.log('🔍 Starting Enhanced SKU Recovery Analysis with DETAILED SKU BREAKDOWN...', {
    totalShops: shops.length,
    lookbackPeriod,
    hasInventoryData: !!inventoryData,
    hasHistoricalData: !!historicalData
  });

  const opportunities: EnhancedSKURecoveryOpportunity[] = [];
  const processedCombinations = new Set<string>(); // FIXED: Prevent duplicates
  const today = new Date();

  shops.forEach(shop => {
    // Process detailed SKU breakdown first (most accurate)
    const skusToAnalyze = new Set<string>();
    
    // Add from detailed SKU breakdown (preferred)
    if (shop.detailedSKUBreakdown && shop.detailedSKUBreakdown.length > 0) {
      shop.detailedSKUBreakdown.forEach(sku => {
        const normalizedSKU = normalizeDetailedSKUName(sku.originalBrand);
        if (normalizedSKU && !normalizedSKU.includes('8ML')) { // FILTER OUT INVALID 8ML
          skusToAnalyze.add(normalizedSKU);
        }
      });
      console.log(`📊 Shop ${shop.shopName}: Found ${shop.detailedSKUBreakdown.length} detailed SKUs, ${skusToAnalyze.size} valid after normalization`);
    } else if (shop.skuBreakdown && shop.skuBreakdown.length > 0) {
      // Fallback to regular SKU breakdown
      shop.skuBreakdown.forEach(sku => {
        const normalizedName = normalizeDetailedSKUName(sku.brand);
        if (normalizedName && !normalizedName.includes('8ML')) { // FILTER OUT INVALID 8ML
          skusToAnalyze.add(normalizedName);
        }
      });
      console.log(`📊 Shop ${shop.shopName}: Using ${shop.skuBreakdown.length} regular SKUs, ${skusToAnalyze.size} valid after normalization`);
    }

    // Process each unique SKU
    Array.from(skusToAnalyze).forEach(skuName => {
      // FIXED: Create unique combination key to prevent duplicates
      const combinationKey = `${shop.shopId}_${skuName}`;
      if (processedCombinations.has(combinationKey)) {
        console.log(`⚠️ Skipping duplicate combination: ${combinationKey}`);
        return;
      }
      processedCombinations.add(combinationKey);
      
      const skuInfo = getEnhancedSKUInfo(skuName);
      
      // Get extended historical analysis for this specific SKU
      const historicalAnalysis = getExtendedHistoricalAnalysis(shop, skuInfo, lookbackPeriod, historicalData);
      
      // Skip if no meaningful historical data for this specific SKU
      if (historicalAnalysis.totalHistoricalVolume < 5) {
        console.log(`❌ Skipping ${skuName} - insufficient historical data (${historicalAnalysis.totalHistoricalVolume} total cases)`);
        return;
      }
      
      // Get current inventory status
      const inventoryStatus = getCurrentInventoryStatus(shop.shopId, skuInfo, inventoryData);
      
      // Determine if this is a recovery opportunity
      const isRecoveryOpportunity = determineRecoveryOpportunity(historicalAnalysis, inventoryStatus, lookbackPeriod);
      
      if (isRecoveryOpportunity) {
        // Calculate recovery metrics
        const recoveryPotential = Math.max(
          historicalAnalysis.historicalAverage - historicalAnalysis.currentVolume,
          historicalAnalysis.peakMonthVolume * 0.5
        );
        
        const recoveryScore = calculateEnhancedRecoveryScore(
          historicalAnalysis,
          inventoryStatus,
          recoveryPotential
        );
        
        // Determine priority and category
        const priority = getEnhancedPriority(recoveryScore, recoveryPotential, inventoryStatus);
        const category = getEnhancedCategory(historicalAnalysis, inventoryStatus);
        
        // Generate enhanced action required
        const actionRequired = generateEnhancedActionRequired(historicalAnalysis, inventoryStatus);
        
        // Create timeline analysis with proper DD/MM/YYYY dates
        const timelineAnalysis = generateTimelineAnalysis(historicalAnalysis);
        
        const opportunity: EnhancedSKURecoveryOpportunity = {
          shopId: shop.shopId,
          shopName: shop.shopName,
          department: shop.department,
          salesman: shop.salesman,
          sku: skuInfo.displayName,
          skuFamily: skuInfo.family,
          skuVariant: skuInfo.variant,
          
          // Historical Analysis
          lastOrderDate: historicalAnalysis.lastOrderDate,
          daysSinceLastOrder: historicalAnalysis.daysSinceLastOrder,
          lastOrderVolume: historicalAnalysis.lastOrderVolume,
          peakMonthVolume: historicalAnalysis.peakMonthVolume,
          peakMonth: historicalAnalysis.peakMonth,
          historicalAverage: historicalAnalysis.historicalAverage,
          totalHistoricalVolume: historicalAnalysis.totalHistoricalVolume,
          monthsActive: historicalAnalysis.monthsActive,
          
          // Current Status
          currentStockQuantity: inventoryStatus.currentQuantity,
          isCurrentlyOutOfStock: inventoryStatus.isOutOfStock,
          lastVisitDate: inventoryStatus.lastVisitDate,
          daysSinceLastVisit: inventoryStatus.daysSinceLastVisit,
          lastSupplyDate: inventoryStatus.lastSupplyDate,
          daysSinceLastSupply: inventoryStatus.daysSinceLastSupply,
          supplyDataSource: inventoryStatus.supplyDataSource,
          reasonNoStock: inventoryStatus.reasonNoStock,
          recentSupplyAttempts: inventoryStatus.recentSupplyAttempts,
          
          // Recovery Analysis
          recoveryPotential,
          recoveryScore,
          priority,
          category,
          actionRequired,
          
          // Timeline Analysis
          orderingPattern: historicalAnalysis.orderingPattern,
          dropOffMonth: historicalAnalysis.dropOffMonth,
          timelineAnalysis,
          totalMonthsAnalyzed: historicalAnalysis.totalMonthsAnalyzed || 4
        };
        
        opportunities.push(opportunity);
        console.log(`✅ Recovery opportunity: ${skuName} at ${shop.shopName} - ${recoveryPotential.toFixed(0)} cases potential`);
      }
    });
  });

  console.log('✅ Enhanced Recovery Analysis Complete with DETAILED SKU BREAKDOWN:', {
    totalOpportunities: opportunities.length,
    uniqueCombinationsProcessed: processedCombinations.size,
    byPriority: {
      CRITICAL: opportunities.filter(o => o.priority === 'CRITICAL').length,
      HIGH: opportunities.filter(o => o.priority === 'HIGH').length,
      MEDIUM: opportunities.filter(o => o.priority === 'MEDIUM').length,
      LOW: opportunities.filter(o => o.priority === 'LOW').length
    },
    uniqueSKUs: [...new Set(opportunities.map(o => o.sku))].length,
    sampleOpportunities: opportunities.slice(0, 5).map(o => `${o.sku} at ${o.shopName}: ${o.recoveryPotential.toFixed(0)} cases`)
  });

  return opportunities.sort((a, b) => b.recoveryScore - a.recoveryScore);
};

// ==========================================
// ENHANCED HELPER FUNCTIONS (FIXED DATE FORMATS)
// ==========================================

const getCurrentInventoryStatus = (shopId: string, skuInfo: any, inventoryData?: InventoryData) => {
  const defaultStatus = {
    currentQuantity: 0,
    isOutOfStock: false,
    lastVisitDate: undefined,
    daysSinceLastVisit: 999,
    lastSupplyDate: undefined,
    daysSinceLastSupply: 999,
    supplyDataSource: 'no_data',
    reasonNoStock: '',
    recentSupplyAttempts: false
  };
  
  if (!inventoryData?.shops[shopId]) return defaultStatus;
  
  const shop = inventoryData.shops[shopId];
  const today = new Date();
  
  // Find matching SKU in inventory with better matching
  let matchingItem: any = null;
  
  const items = Object.values(shop.items);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemNormalizedName = normalizeDetailedSKUName(item.brand);
    const targetNormalizedName = skuInfo.normalizedName;
    
    if (itemNormalizedName === targetNormalizedName || 
        item.brand === skuInfo.displayName ||
        normalizeDetailedSKUName(item.brand) === normalizeDetailedSKUName(skuInfo.displayName)) {
      matchingItem = item;
      break;
    }
  }
  
  if (!matchingItem) return defaultStatus;
  
  return {
    currentQuantity: matchingItem.quantity,
    isOutOfStock: matchingItem.isOutOfStock,
    lastVisitDate: shop.visitDate,
    daysSinceLastVisit: Math.floor((today.getTime() - shop.visitDate.getTime()) / (1000 * 60 * 60 * 24)),
    lastSupplyDate: matchingItem.lastSupplyDate,
    daysSinceLastSupply: matchingItem.lastSupplyDate ? 
      Math.floor((today.getTime() - matchingItem.lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24)) : 999,
    supplyDataSource: matchingItem.agingDataSource || 'no_data',
    reasonNoStock: matchingItem.reasonNoStock || '',
    recentSupplyAttempts: matchingItem.suppliedAfterOutOfStock || false
  };
};

const determineRecoveryOpportunity = (historical: any, inventory: any, lookbackPeriod: number) => {
  // Recovery opportunity if:
  // 1. Had historical volume but current volume is 0
  // 2. Currently out of stock but used to order
  // 3. Significant decline from peak
  // 4. No orders for extended period but previously active
  
  return (
    historical.historicalAverage > 5 && 
    (historical.currentVolume === 0 || 
     inventory.isOutOfStock || 
     historical.currentVolume < historical.historicalAverage * 0.3 ||
     historical.daysSinceLastOrder > 90)
  );
};

const calculateEnhancedRecoveryScore = (historical: any, inventory: any, recoveryPotential: number) => {
  let score = 0;
  
  // Base score from historical performance
  score += Math.min(historical.historicalAverage * 2, 40);
  
  // Bonus for peak performance
  score += Math.min(historical.peakMonthVolume, 20);
  
  // Time urgency
  if (historical.daysSinceLastOrder > 180) score += 20;
  else if (historical.daysSinceLastOrder > 90) score += 15;
  else if (historical.daysSinceLastOrder > 60) score += 10;
  
  // Current stock status
  if (inventory.isOutOfStock) score += 15;
  if (inventory.recentSupplyAttempts) score += 10;
  
  // Recent visit bonus
  if (inventory.daysSinceLastVisit <= 7) score += 5;
  
  // Supply data reliability
  if (inventory.supplyDataSource === 'recent_supply') score += 5;
  else if (inventory.supplyDataSource === 'historical_supply') score += 3;
  
  return Math.min(score, 100);
};

const getEnhancedPriority = (score: number, potential: number, inventory: any): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' => {
  if (inventory.isOutOfStock && potential > 50) return 'CRITICAL';
  if (score >= 80 || potential > 75) return 'HIGH';
  if (score >= 60 || potential > 30) return 'MEDIUM';
  return 'LOW';
};

const getEnhancedCategory = (historical: any, inventory: any): 'IMMEDIATE_ACTION' | 'RELATIONSHIP_MAINTENANCE' | 'VIP_CUSTOMER' | 'GAP_ANALYSIS' | 'SUPPLY_CHAIN_ISSUE' => {
  if (inventory.isOutOfStock && inventory.recentSupplyAttempts) return 'SUPPLY_CHAIN_ISSUE';
  if (inventory.isOutOfStock) return 'IMMEDIATE_ACTION';
  if (historical.historicalAverage > 50) return 'VIP_CUSTOMER';
  if (historical.monthsActive >= 3) return 'RELATIONSHIP_MAINTENANCE';
  return 'GAP_ANALYSIS';
};

const generateEnhancedActionRequired = (historical: any, inventory: any): string => {
  if (inventory.isOutOfStock && inventory.recentSupplyAttempts) {
    return `Supply chain issue - Recent supply attempt failed, customer still out of stock (${inventory.daysSinceLastSupply}d ago)`;
  } else if (inventory.isOutOfStock) {
    return `Immediate restocking - High-value customer out of stock for ${inventory.daysSinceLastVisit} days`;
  } else if (historical.daysSinceLastOrder > 180) {
    return `Urgent relationship recovery - Customer stopped ordering ${historical.daysSinceLastOrder} days ago (avg: ${historical.historicalAverage.toFixed(0)} cases/month)`;
  } else if (historical.currentVolume === 0 && historical.historicalAverage > 20) {
    return `VIP customer re-engagement - Previously ordered ${historical.historicalAverage.toFixed(0)} cases/month, now zero`;
  } else {
    return `Performance decline investigation - Volume dropped from ${historical.peakMonthVolume} to ${historical.currentVolume} cases`;
  }
};

const generateTimelineAnalysis = (historical: any): string => {
  const timeline = [];
  if (historical.peakMonth && historical.peakMonthVolume > 0) {
    timeline.push(`Peak: ${historical.peakMonth} (${historical.peakMonthVolume} cases)`);
  }
  if (historical.dropOffMonth) {
    timeline.push(`Declined: ${historical.dropOffMonth}`);
  }
  if (historical.lastOrderDate && historical.lastOrderDate !== 'Unknown') {
    timeline.push(`Last order: ${historical.lastOrderDate} (${historical.lastOrderVolume} cases)`);
  }
  timeline.push(`Gap: ${historical.daysSinceLastOrder} days`);
  
  return timeline.join(' → ');
};

// ==========================================
// UTILITY FUNCTIONS (FIXED DATE FORMATS)
// ==========================================

const formatDateDDMMYYYY = (date: Date): string => {
  if (!date) return 'N/A';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const SKURecoveryIntelligence = ({ data, inventoryData }: { 
  data: DashboardData; 
  inventoryData?: InventoryData;
}) => {
  const [filters, setFilters] = useState<Filters>({
    department: '',
    salesman: '',
    skuFilter: '',
    priority: '',
    category: '',
    searchText: '',
    lookbackPeriod: 270, // CHANGED: Default to 9 months since that's where data exists
    showOnlyOutOfStock: false,
    minimumRecoveryPotential: 10, // RAISED: Higher threshold to get meaningful results
    showOnlyWithSupplyData: false,
    minimumHistoricalAverage: 10 // RAISED: Higher threshold for better results
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  // Generate enhanced recovery opportunities with detailed SKU breakdown
  const recoveryOpportunities = useMemo(() => {
    return analyzeEnhancedRecoveryOpportunities(
      data.allShopsComparison, 
      inventoryData, 
      filters.lookbackPeriod,
      data.historicalData
    );
  }, [data.allShopsComparison, inventoryData, filters.lookbackPeriod, data.historicalData]);

  // Get unique values for filters
  const departments = [...new Set(data.allShopsComparison.map(shop => shop.department))].sort();
  const salesmen = [...new Set(data.allShopsComparison.map(shop => shop.salesman))].sort();
  const allSKUs = [...new Set(recoveryOpportunities.map(opp => opp.sku))].sort();
  
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
      const matchesBrand = !selectedBrand || opp.skuFamily.includes(selectedBrand);
      const matchesOutOfStock = !filters.showOnlyOutOfStock || opp.isCurrentlyOutOfStock;
      const matchesMinRecovery = opp.recoveryPotential >= filters.minimumRecoveryPotential;
      const matchesSupplyData = !filters.showOnlyWithSupplyData || opp.supplyDataSource !== 'no_data';
      const matchesMinHistorical = opp.historicalAverage >= filters.minimumHistoricalAverage;

      return matchesDepartment && matchesSalesman && matchesSKU && matchesPriority && 
             matchesCategory && matchesSearch && matchesBrand && matchesOutOfStock && 
             matchesMinRecovery && matchesSupplyData && matchesMinHistorical;
    });
  }, [recoveryOpportunities, filters, selectedBrand]);

  // For SKU-specific analysis when SKU filter is applied
  const skuSpecificAnalysis = useMemo(() => {
    if (!filters.skuFilter) return null;
    
    const skuOpportunities = filteredOpportunities.filter(opp => 
      opp.sku.toLowerCase().includes(filters.skuFilter.toLowerCase())
    );
    
    if (skuOpportunities.length === 0) return null;
    
    const totalShops = skuOpportunities.length;
    const avgHistoricalVolume = skuOpportunities.reduce((sum, opp) => sum + opp.historicalAverage, 0) / totalShops;
    const totalRecoveryPotential = skuOpportunities.reduce((sum, opp) => sum + opp.recoveryPotential, 0);
    const outOfStockShops = skuOpportunities.filter(opp => opp.isCurrentlyOutOfStock).length;
    const avgDaysSinceLastOrder = skuOpportunities.reduce((sum, opp) => sum + opp.daysSinceLastOrder, 0) / totalShops;
    
    return {
      skuName: filters.skuFilter,
      totalShops,
      avgHistoricalVolume,
      totalRecoveryPotential,
      outOfStockShops,
      avgDaysSinceLastOrder
    };
  }, [filteredOpportunities, filters.skuFilter]);

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

    const priorityCounts = {
      CRITICAL: filteredOpportunities.filter(o => o.priority === 'CRITICAL').length,
      HIGH: filteredOpportunities.filter(o => o.priority === 'HIGH').length,
      MEDIUM: filteredOpportunities.filter(o => o.priority === 'MEDIUM').length,
      LOW: filteredOpportunities.filter(o => o.priority === 'LOW').length
    };

    const uniqueSKUs = [...new Set(filteredOpportunities.map(o => o.sku))].length;
    const outOfStockCount = filteredOpportunities.filter(o => o.isCurrentlyOutOfStock).length;
    const withSupplyDataCount = filteredOpportunities.filter(o => o.supplyDataSource !== 'no_data').length;

    return {
      total,
      totalRecoveryPotential,
      avgRecoveryScore,
      priorityCounts,
      uniqueSKUs,
      outOfStockCount,
      withSupplyDataCount
    };
  }, [filteredOpportunities]);

  // Export function with proper DD/MM/YYYY format
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `FIXED Enhanced SKU Recovery Intelligence Report - ${formatDateDDMMYYYY(new Date())}\n`;
    csvContent += `Historical Analysis Period: ${filters.lookbackPeriod} days\n`;
    csvContent += `Total Opportunities: ${summary.total}\n`;
    csvContent += `Total Recovery Potential: ${summary.totalRecoveryPotential.toFixed(0)} cases\n`;
    csvContent += `FIXED: Invalid 8ML sizes removed, proper size extraction, deduplication applied\n`;
    
    if (skuSpecificAnalysis) {
      csvContent += `\nSKU-SPECIFIC ANALYSIS: ${skuSpecificAnalysis.skuName}\n`;
      csvContent += `Shops Affected: ${skuSpecificAnalysis.totalShops}\n`;
      csvContent += `Average Historical Volume: ${skuSpecificAnalysis.avgHistoricalVolume.toFixed(1)} cases/month\n`;
      csvContent += `Total Recovery Potential: ${skuSpecificAnalysis.totalRecoveryPotential.toFixed(0)} cases\n`;
      csvContent += `Currently Out of Stock: ${skuSpecificAnalysis.outOfStockShops} shops\n`;
      csvContent += `Average Days Since Last Order: ${skuSpecificAnalysis.avgDaysSinceLastOrder.toFixed(0)} days\n`;
    }
    
    csvContent += "\n";
    csvContent += `Shop Name,Shop ID,Department,Salesman,FIXED SPECIFIC SKU,SKU Family,Last Order Date,Days Since Last Order,Last Order Volume,Peak Volume,Peak Month,Historical Average,Total Historical,Recovery Potential,Recovery Score,Priority,Category,Current Stock,Out of Stock,Last Visit DD/MM/YYYY,Days Since Visit,Last Supply DD/MM/YYYY,Days Since Supply,Supply Source,Recent Supply Attempts,Reason No Stock,Action Required,Timeline Analysis,Months Analyzed\n`;
    
    filteredOpportunities.forEach(opp => {
      csvContent += `"${opp.shopName}","${opp.shopId}","${opp.department}","${opp.salesman}","${opp.sku}","${opp.skuFamily}","${opp.lastOrderDate}",${opp.daysSinceLastOrder},${opp.lastOrderVolume},${opp.peakMonthVolume},"${opp.peakMonth}",${opp.historicalAverage.toFixed(1)},${opp.totalHistoricalVolume},${opp.recoveryPotential.toFixed(1)},${opp.recoveryScore},"${opp.priority}","${opp.category}",${opp.currentStockQuantity},"${opp.isCurrentlyOutOfStock ? 'Yes' : 'No'}","${opp.lastVisitDate ? formatDateDDMMYYYY(opp.lastVisitDate) : 'N/A'}",${opp.daysSinceLastVisit},"${opp.lastSupplyDate ? formatDateDDMMYYYY(opp.lastSupplyDate) : 'N/A'}",${opp.daysSinceLastSupply},"${opp.supplyDataSource}","${opp.recentSupplyAttempts ? 'Yes' : 'No'}","${opp.reasonNoStock || 'N/A'}","${opp.actionRequired}","${opp.timelineAnalysis}",${opp.totalMonthsAnalyzed}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FIXED_SKU_Recovery_Intelligence_Valid_Sizes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper functions for UI
  const getPriorityBadge = (priority: string) => {
    const colors = {
      CRITICAL: 'bg-red-100 text-red-800 border-red-200',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      LOW: 'bg-green-100 text-green-800 border-green-200'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full border ${colors[priority as keyof typeof colors]}`;
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      IMMEDIATE_ACTION: 'bg-red-50 text-red-700 border-red-200',
      VIP_CUSTOMER: 'bg-purple-50 text-purple-700 border-purple-200',
      RELATIONSHIP_MAINTENANCE: 'bg-blue-50 text-blue-700 border-blue-200',
      GAP_ANALYSIS: 'bg-gray-50 text-gray-700 border-gray-200',
      SUPPLY_CHAIN_ISSUE: 'bg-orange-50 text-orange-700 border-orange-200'
    };
    return `px-2 py-1 text-xs font-medium rounded border ${colors[category as keyof typeof colors]}`;
  };

  const clearAllFilters = () => {
    setFilters({
      department: '',
      salesman: '',
      skuFilter: '',
      priority: '',
      category: '',
      searchText: '',
      lookbackPeriod: 270, // Keep 9 months as default
      showOnlyOutOfStock: false,
      minimumRecoveryPotential: 10,
      showOnlyWithSupplyData: false,
      minimumHistoricalAverage: 10
    });
    setSelectedBrand('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center mb-2">
              <Target className="w-6 h-6 mr-2 text-purple-600" />
              FIXED: Individual SKU Recovery Intelligence
            </h2>
            <p className="text-gray-600">✅ Fixed invalid "8ML" sizes • ✅ Removed duplicates • ✅ Proper size extraction • ✅ 9-month default</p>
            <p className="text-sm text-green-600">✅ Fixed DD/MM/YYYY dates • ✅ Uses detailed SKU breakdown • ✅ Data found at 7+ months lookback</p>
            {inventoryData && (
              <div className="flex items-center mt-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Live inventory data with supply chain tracking connected
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <label className="text-sm text-gray-600">Historical Analysis Period:</label>
              <select
                value={filters.lookbackPeriod}
                onChange={(e) => {
                  setFilters({ ...filters, lookbackPeriod: parseInt(e.target.value) });
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value={90}>90 Days (3 Months) - May show 0</option>
                <option value={180}>180 Days (6 Months) - May show 0</option>
                <option value={270}>270 Days (9 Months) - Recommended</option>
                <option value={365}>365 Days (12 Months)</option>
                <option value={450}>450 Days (15 Months)</option>
                <option value={545}>545 Days (18 Months)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Availability Warning */}
        {filters.lookbackPeriod < 270 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Data Availability Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Most historical data exists from October-December 2024 (7-9 months ago). 
                  If you see 0 opportunities, try increasing the lookback period to 9+ months.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SKU-Specific Analysis Panel */}
        {skuSpecificAnalysis && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">FIXED INDIVIDUAL SKU Analysis: {skuSpecificAnalysis.skuName}</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{skuSpecificAnalysis.totalShops}</div>
                <div className="text-sm text-blue-600">Shops Affected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{skuSpecificAnalysis.avgHistoricalVolume.toFixed(1)}</div>
                <div className="text-sm text-green-600">Avg Historical (Cases/Month)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{skuSpecificAnalysis.totalRecoveryPotential.toFixed(0)}</div>
                <div className="text-sm text-orange-600">Total Recovery Potential</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{skuSpecificAnalysis.outOfStockShops}</div>
                <div className="text-sm text-red-600">Currently Out of Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{skuSpecificAnalysis.avgDaysSinceLastOrder.toFixed(0)}</div>
                <div className="text-sm text-purple-600">Avg Days Since Last Order</div>
              </div>
            </div>
          </div>
        )}

        {/* Brand Selection Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setSelectedBrand('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedBrand === '' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Brands
          </button>
          <button
            onClick={() => setSelectedBrand('8PM')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedBrand === '8PM' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            8PM Whisky (Valid Sizes Only)
          </button>
          <button
            onClick={() => setSelectedBrand('VERVE')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedBrand === 'VERVE' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            VERVE Vodka (Individual Variants)
          </button>
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-sm text-gray-600">FIXED SKU Opportunities</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.priorityCounts.CRITICAL}</div>
            <div className="text-sm text-red-600">Critical Priority</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.uniqueSKUs}</div>
            <div className="text-sm text-blue-600">Valid Individual SKUs</div>
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
            <div className="text-2xl font-bold text-purple-600">{summary.outOfStockCount}</div>
            <div className="text-sm text-purple-600">Currently Out of Stock</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{summary.withSupplyDataCount}</div>
            <div className="text-sm text-indigo-600">With Supply Data</div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
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
            value={filters.skuFilter}
            onChange={(e) => setFilters({ ...filters, skuFilter: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Valid SKUs</option>
            {allSKUs.map(sku => (
              <option key={sku} value={sku}>{sku}</option>
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

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            <option value="IMMEDIATE_ACTION">Immediate Action</option>
            <option value="VIP_CUSTOMER">VIP Customer</option>
            <option value="RELATIONSHIP_MAINTENANCE">Relationship Maintenance</option>
            <option value="GAP_ANALYSIS">Gap Analysis</option>
            <option value="SUPPLY_CHAIN_ISSUE">Supply Chain Issue</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="outOfStock"
              checked={filters.showOnlyOutOfStock}
              onChange={(e) => setFilters({ ...filters, showOnlyOutOfStock: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="outOfStock" className="text-sm text-gray-700">Only Currently Out of Stock</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="supplyData"
              checked={filters.showOnlyWithSupplyData}
              onChange={(e) => setFilters({ ...filters, showOnlyWithSupplyData: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="supplyData" className="text-sm text-gray-700">Only With Supply Data</label>
          </div>

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
            <span className="text-sm text-gray-600">cases/month</span>
          </div>

          <button
            onClick={clearAllFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2 text-sm"
          >
            <X className="w-4 h-4" />
            <span>Clear All</span>
          </button>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export FIXED CSV</span>
          </button>

          <div className="text-sm text-gray-500">
            {filteredOpportunities.length} of {recoveryOpportunities.length} valid SKU opportunities
          </div>
        </div>
      </div>

      {/* Enhanced Recovery Opportunities Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">FIXED: Valid Individual SKU Recovery Opportunities</h3>
          <p className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredOpportunities.length)} of {filteredOpportunities.length} FIXED INDIVIDUAL SKU opportunities 
            ({filters.lookbackPeriod}-day historical analysis • DD/MM/YYYY dates • No invalid sizes • No duplicates)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop & VALID SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Historical Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recovery Analysis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline & Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOpportunities.map((opportunity, index) => (
                <tr key={`${opportunity.shopId}-${opportunity.sku}-${index}`} className={
                  opportunity.priority === 'CRITICAL' ? 'bg-red-50' : 
                  opportunity.priority === 'HIGH' ? 'bg-orange-50' : ''
                }>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{opportunity.shopName}</div>
                      <div className="text-sm text-gray-500">ID: {opportunity.shopId}</div>
                      <div className="text-sm text-gray-500">{opportunity.department} • {opportunity.salesman}</div>
                      <div className="text-sm font-medium text-purple-600 mt-1">{opportunity.sku}</div>
                      <div className="text-xs text-gray-400">{opportunity.skuFamily} Family • Valid Size</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Avg Volume:</span> {opportunity.historicalAverage.toFixed(1)} cases/month</div>
                      <div><span className="font-medium">Peak:</span> {opportunity.peakMonthVolume} cases ({opportunity.peakMonth})</div>
                      <div><span className="font-medium">Total Historical:</span> {opportunity.totalHistoricalVolume} cases</div>
                      <div><span className="font-medium">Active Months:</span> {opportunity.monthsActive}</div>
                      <div className="text-xs text-blue-600">Last Order: {opportunity.lastOrderDate} ({opportunity.lastOrderVolume} cases)</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {opportunity.isCurrentlyOutOfStock ? (
                        <div className="flex items-center text-sm text-red-600">
                          <XCircle className="w-4 h-4 mr-1" />
                          Out of Stock ({opportunity.currentStockQuantity} qty)
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          In Stock ({opportunity.currentStockQuantity} qty)
                        </div>
                      )}
                      
                      {opportunity.lastVisitDate && (
                        <div className="text-xs text-gray-500">
                          Last Visit: {formatDateDDMMYYYY(opportunity.lastVisitDate)} ({opportunity.daysSinceLastVisit}d ago)
                        </div>
                      )}
                      
                      {opportunity.lastSupplyDate && (
                        <div className="text-xs text-blue-600">
                          Last Supply: {formatDateDDMMYYYY(opportunity.lastSupplyDate)} ({opportunity.daysSinceLastSupply}d ago)
                        </div>
                      )}
                      
                      <div className="text-xs">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          opportunity.supplyDataSource === 'recent_supply' ? 'bg-green-100 text-green-800' :
                          opportunity.supplyDataSource === 'historical_supply' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {opportunity.supplyDataSource.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      {opportunity.recentSupplyAttempts && (
                        <div className="flex items-center text-xs text-blue-600">
                          <Truck className="w-3 h-3 mr-1" />
                          Recent supply attempt
                        </div>
                      )}
                      
                      {opportunity.reasonNoStock && (
                        <div className="text-xs text-red-600">
                          Reason: {opportunity.reasonNoStock}
                        </div>
                      )}
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
                      <div className="mt-1">
                        <span className={getCategoryBadge(opportunity.category)}>
                          {opportunity.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {opportunity.daysSinceLastOrder} days since last order
                        {opportunity.totalMonthsAnalyzed && 
                          ` (analyzed ${opportunity.totalMonthsAnalyzed} months)`
                        }
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">Action:</span>
                        <div className="mt-1">{opportunity.actionRequired}</div>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Timeline:</span>
                        <div className="mt-1">{opportunity.timelineAnalysis}</div>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOpportunities.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Valid SKU Recovery Opportunities Found</h3>
            <p className="text-gray-500">Try increasing the lookback period to 9+ months or adjusting your filters.</p>
            <div className="mt-4 text-sm text-gray-600">
              <p>Current filters: {filters.lookbackPeriod} days lookback, min recovery: {filters.minimumRecoveryPotential} cases</p>
              <p>Most data exists from October-December 2024 (7-9 months ago).</p>
            </div>
          </div>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-700 mb-2 sm:mb-0">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredOpportunities.length)} of {filteredOpportunities.length} FIXED VALID SKU opportunities
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
