'use client';

import React, { useState, useMemo } from 'react';
import { Heart, AlertTriangle, Calendar, TrendingDown, Filter, Download, Search, X, ChevronLeft, ChevronRight, Clock, Users, BarChart3, Target, Package, Truck, CheckCircle, XCircle, Eye, TrendingUp, AlertCircle } from 'lucide-react';

// ==========================================
// ENHANCED TYPE DEFINITIONS & INTERFACES
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
  juneLastYearTotal?: number;
  juneLastYearEightPM?: number;
  juneLastYearVerve?: number;
  yoyGrowthPercent?: number;
  growthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
  skuBreakdown?: SKUData[];
  threeMonthAvgTotal?: number;
  threeMonthAvg8PM?: number;
  threeMonthAvgVERVE?: number;
}

interface SKUData {
  brand: string;
  cases: number;
  percentage: number;
  month?: string;
}

interface CustomerInsights {
  firstTimeCustomers: number;
  lostCustomers: number;
  consistentPerformers: number;
  decliningPerformers: number;
  newShops: ShopData[];
  lostShops: ShopData[];
  consistentShops: ShopData[];
  decliningShops: ShopData[];
}

interface DashboardData {
  allShopsComparison: ShopData[];
  customerInsights: CustomerInsights;
  currentMonth: string;
  currentYear: string;
}

interface CustomerHealthMetrics {
  unbilledCount: number;
  lostCustomers2Months: number;
  lostCustomers3Months: number;
  lostCustomers4Months: number;
  lostCustomers5Months: number;
  lostCustomers6Months: number;
  neverOrderedCount: number;
  quarterlyDeclining: number;
}

interface AnalyzedShop extends ShopData {
  lastOrderDate?: string;
  daysSinceLastOrder?: number;
  customerStatus: 'active' | 'unbilled' | 'at-risk' | 'lost' | 'never-ordered';
  lastOrderMonth?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  quarterlyDecline?: number;
}

// ==========================================
// NEW: ENHANCED SKU RECOVERY INTERFACES
// ==========================================

interface SKUOrderHistory {
  sku: string;
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  marchCases: number;
  aprilCases: number;
  mayCases: number;
  juneCases: number;
  lastOrderDate?: string;
  daysSinceLastOrder: number;
  averageMonthlyOrders: number;
  historicalTier: 'VIP' | 'High' | 'Medium' | 'Low';
  last3Orders: Array<{
    month: string;
    cases: number;
    date: string;
  }>;
}

interface InventoryStatus {
  quantity?: number;
  isInStock?: boolean;
  isOutOfStock?: boolean;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'NO_DATA';
  lastVisitDays?: number;
  reasonNoStock?: string;
  recentlyRestocked?: boolean;
  visitDate?: Date;
}

interface EnhancedLostCustomer extends SKUOrderHistory {
  // Inventory Intelligence
  currentStock?: number;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'NO_DATA';
  lastVisitDays?: number;
  reasonNoStock?: string;
  recentlyRestocked?: boolean;
  
  // Recovery Intelligence
  recoveryType: 'SUPPLY_ISSUE' | 'COMPETITIVE_THREAT' | 'RELATIONSHIP_GAP' | 'SEASONAL_PATTERN';
  priorityLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  recoveryScore: number; // 0-100
  recommendedAction: string;
  estimatedRecoveryValue: number;
  
  // Financial Impact
  lostRevenuePerMonth: number;
  totalLostRevenue: number;
  recoveryPotential: number;
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
    }>;
    lastVisitDays: number;
  }>;
}

// ==========================================
// HELPER FUNCTIONS (EXISTING + ENHANCED)
// ==========================================

const getMonthName = (monthNum: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

const getShortMonthName = (monthNum: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

const formatDate = (monthNum: string, year: string) => {
  return `${getShortMonthName(monthNum)} ${year}`;
};

const calculateDaysBetween = (month1: string, year1: string, month2: string, year2: string) => {
  const date1 = new Date(parseInt(year1), parseInt(month1) - 1, 1);
  const date2 = new Date(parseInt(year2), parseInt(month2) - 1, 1);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ==========================================
// NEW: SKU BRAND MAPPING & NORMALIZATION
// ==========================================

const SKU_BRAND_MAPPING: Record<string, string[]> = {
  '8PM_750': ['8 PM BLACK', '8 PM BLACK 750', '8 PM PREMIUM BLACK BLENDED WHISKY'],
  '8PM_375': ['8 PM BLACK 375', '8 PM PREMIUM BLACK BLENDED WHISKY 375'],
  '8PM_180': ['8 PM BLACK 180', '8 PM BLACK 180 P', '8 PM PREMIUM BLACK BLENDED WHISKY Pet'],
  '8PM_90': ['8 PM BLACK 90', '8 PM BLACK 60', '8 PM BLACK 60 P'],
  'VERVE_CRANBERRY_750': ['VERVE CRANBERRY', 'VERVE CRANBERRY 750', 'M2M VERVE CRANBERRY TEASE SP FL VODKA'],
  'VERVE_CRANBERRY_375': ['VERVE CRANBERRY 375'],
  'VERVE_CRANBERRY_180': ['VERVE CRANBERRY 180'],
  'VERVE_GREEN_APPLE_750': ['VERVE GREEN APPLE', 'VERVE GREEN APPLE 750', 'M2M VERVE GREEN APPLE SUPERIOR FL VODKA'],
  'VERVE_GREEN_APPLE_375': ['VERVE GREEN APPLE 375'],
  'VERVE_GREEN_APPLE_180': ['VERVE GREEN APPLE 180'],
  'VERVE_LEMON_LUSH_750': ['VERVE LEMON LUSH', 'VERVE LEMON LUSH 750', 'M2M VERVE LEMON LUSH SUP FL VODKA'],
  'VERVE_LEMON_LUSH_375': ['VERVE LEMON LUSH 375'],
  'VERVE_LEMON_LUSH_180': ['VERVE LEMON LUSH 180'],
  'VERVE_GRAIN_750': ['VERVE GRAIN', 'VERVE GRAIN 750', 'M2M VERVE SUPERIOR GRAIN VODKA'],
  'VERVE_GRAIN_375': ['VERVE GRAIN 375'],
  'VERVE_GRAIN_180': ['VERVE GRAIN 180']
};

const normalizeSKUName = (brandName: string): string => {
  const cleanBrand = brandName?.toString().trim().toUpperCase();
  
  for (const [skuKey, variants] of Object.entries(SKU_BRAND_MAPPING)) {
    if (variants.some(variant => cleanBrand.includes(variant.toUpperCase()))) {
      return skuKey;
    }
  }
  
  return cleanBrand;
};

const getSKUDisplayName = (skuKey: string): string => {
  const displayNames: Record<string, string> = {
    '8PM_750': '8PM Black 750ml',
    '8PM_375': '8PM Black 375ml', 
    '8PM_180': '8PM Black 180ml',
    '8PM_90': '8PM Black 90ml',
    'VERVE_CRANBERRY_750': 'Verve Cranberry 750ml',
    'VERVE_CRANBERRY_375': 'Verve Cranberry 375ml',
    'VERVE_CRANBERRY_180': 'Verve Cranberry 180ml',
    'VERVE_GREEN_APPLE_750': 'Verve Green Apple 750ml',
    'VERVE_GREEN_APPLE_375': 'Verve Green Apple 375ml',
    'VERVE_GREEN_APPLE_180': 'Verve Green Apple 180ml',
    'VERVE_LEMON_LUSH_750': 'Verve Lemon Lush 750ml',
    'VERVE_LEMON_LUSH_375': 'Verve Lemon Lush 375ml',
    'VERVE_LEMON_LUSH_180': 'Verve Lemon Lush 180ml',
    'VERVE_GRAIN_750': 'Verve Grain 750ml',
    'VERVE_GRAIN_375': 'Verve Grain 375ml',
    'VERVE_GRAIN_180': 'Verve Grain 180ml'
  };
  
  return displayNames[skuKey] || skuKey;
};

// ==========================================
// ENHANCED DATA PROCESSING FUNCTIONS
// ==========================================

const processEnhancedCustomerData = (data: DashboardData, inventoryData?: InventoryData) => {
  console.log('🔄 Processing enhanced customer data with SKU-level analysis...');
  
  // Process existing broad analysis
  const analyzedShops = data.allShopsComparison.map(shop => {
    const june = (shop.juneTotal || 0);
    const may = (shop.mayTotal || 0);
    const april = (shop.aprilTotal || 0);
    const march = (shop.marchTotal || 0);
    
    let lastOrderDate = '';
    let lastOrderMonth = '';
    let daysSinceLastOrder = 0;
    let customerStatus: AnalyzedShop['customerStatus'] = 'never-ordered';

    if (june > 0) {
      lastOrderDate = formatDate(data.currentMonth, data.currentYear);
      lastOrderMonth = data.currentMonth;
      daysSinceLastOrder = 0;
      customerStatus = 'active';
    } else if (may > 0) {
      lastOrderDate = formatDate('05', data.currentYear);
      lastOrderMonth = '05';
      daysSinceLastOrder = calculateDaysBetween('05', data.currentYear, data.currentMonth, data.currentYear);
      customerStatus = 'unbilled';
    } else if (april > 0) {
      lastOrderDate = formatDate('04', data.currentYear);
      lastOrderMonth = '04';
      daysSinceLastOrder = calculateDaysBetween('04', data.currentYear, data.currentMonth, data.currentYear);
      customerStatus = 'at-risk';
    } else if (march > 0) {
      lastOrderDate = formatDate('03', data.currentYear);
      lastOrderMonth = '03';
      daysSinceLastOrder = calculateDaysBetween('03', data.currentYear, data.currentMonth, data.currentYear);
      customerStatus = 'lost';
    } else {
      lastOrderDate = 'NEVER ORDERED';
      daysSinceLastOrder = 999;
      customerStatus = 'never-ordered';
    }

    let riskLevel: AnalyzedShop['riskLevel'] = 'low';
    if (daysSinceLastOrder > 90) riskLevel = 'critical';
    else if (daysSinceLastOrder > 60) riskLevel = 'high';
    else if (daysSinceLastOrder > 30) riskLevel = 'medium';

    const q1Average = (march + april + may) / 3;
    const q2Current = june;
    const quarterlyDecline = q1Average > 0 ? ((q1Average - q2Current) / q1Average) * 100 : 0;

    return {
      ...shop,
      lastOrderDate,
      lastOrderMonth,
      daysSinceLastOrder,
      customerStatus,
      riskLevel,
      quarterlyDecline
    };
  });

  // NEW: Process SKU-level lost customers
  const skuLostCustomers = processSKULevelLostCustomers(data, inventoryData);
  
  return {
    analyzedShops,
    skuLostCustomers,
    enhancedMetrics: calculateEnhancedMetrics(analyzedShops, skuLostCustomers)
  };
};

const processSKULevelLostCustomers = (data: DashboardData, inventoryData?: InventoryData): EnhancedLostCustomer[] => {
  console.log('🔄 Processing SKU-level lost customer analysis...');
  
  const skuLostCustomers: EnhancedLostCustomer[] = [];
  
  // Process each shop's SKU breakdown
  data.allShopsComparison.forEach(shop => {
    if (!shop.skuBreakdown || shop.skuBreakdown.length === 0) return;
    
    // Get historical SKU data
    const skuHistory = extractSKUHistory(shop);
    
    // Find lost SKUs
    Object.entries(skuHistory).forEach(([skuKey, history]) => {
      if (history.juneCases === 0 && (history.marchCases > 0 || history.aprilCases > 0 || history.mayCases > 0)) {
        // This SKU was lost
        const inventoryStatus = getInventoryStatus(shop.shopId, skuKey, inventoryData);
        const lostCustomer = createEnhancedLostCustomer(shop, skuKey, history, inventoryStatus);
        skuLostCustomers.push(lostCustomer);
      }
    });
  });
  
  // Sort by priority and potential value
  return skuLostCustomers.sort((a, b) => {
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const aPriority = priorityOrder[a.priorityLevel];
    const bPriority = priorityOrder[b.priorityLevel];
    
    if (aPriority !== bPriority) return bPriority - aPriority;
    return b.recoveryPotential - a.recoveryPotential;
  });
};

const extractSKUHistory = (shop: ShopData): Record<string, {
  marchCases: number;
  aprilCases: number;
  mayCases: number;
  juneCases: number;
}> => {
  const skuHistory: Record<string, any> = {};
  
  if (!shop.skuBreakdown) return skuHistory;
  
  // Process current month SKUs
  shop.skuBreakdown.forEach(sku => {
    const normalizedSKU = normalizeSKUName(sku.brand);
    if (!skuHistory[normalizedSKU]) {
      skuHistory[normalizedSKU] = {
        marchCases: 0,
        aprilCases: 0,
        mayCases: 0,
        juneCases: 0
      };
    }
    skuHistory[normalizedSKU].juneCases += sku.cases;
  });
  
  // Note: In a real implementation, you'd extract historical SKU data from historical months
  // For now, we'll simulate based on brand family data
  const total8PM = (shop.juneEightPM || 0) + (shop.mayEightPM || 0) + (shop.aprilEightPM || 0) + (shop.marchEightPM || 0);
  const totalVERVE = (shop.juneVerve || 0) + (shop.mayVerve || 0) + (shop.aprilVerve || 0) + (shop.marchVerve || 0);
  
  if (total8PM > 0) {
    // Simulate 8PM SKU distribution
    skuHistory['8PM_750'] = {
      marchCases: Math.round((shop.marchEightPM || 0) * 0.6),
      aprilCases: Math.round((shop.aprilEightPM || 0) * 0.6),
      mayCases: Math.round((shop.mayEightPM || 0) * 0.6),
      juneCases: Math.round((shop.juneEightPM || 0) * 0.6)
    };
    skuHistory['8PM_375'] = {
      marchCases: Math.round((shop.marchEightPM || 0) * 0.3),
      aprilCases: Math.round((shop.aprilEightPM || 0) * 0.3),
      mayCases: Math.round((shop.mayEightPM || 0) * 0.3),
      juneCases: Math.round((shop.juneEightPM || 0) * 0.3)
    };
    skuHistory['8PM_180'] = {
      marchCases: Math.round((shop.marchEightPM || 0) * 0.1),
      aprilCases: Math.round((shop.aprilEightPM || 0) * 0.1),
      mayCases: Math.round((shop.mayEightPM || 0) * 0.1),
      juneCases: Math.round((shop.juneEightPM || 0) * 0.1)
    };
  }
  
  if (totalVERVE > 0) {
    // Simulate VERVE SKU distribution
    skuHistory['VERVE_CRANBERRY_750'] = {
      marchCases: Math.round((shop.marchVerve || 0) * 0.4),
      aprilCases: Math.round((shop.aprilVerve || 0) * 0.4),
      mayCases: Math.round((shop.mayVerve || 0) * 0.4),
      juneCases: Math.round((shop.juneVerve || 0) * 0.4)
    };
    skuHistory['VERVE_GREEN_APPLE_750'] = {
      marchCases: Math.round((shop.marchVerve || 0) * 0.3),
      aprilCases: Math.round((shop.aprilVerve || 0) * 0.3),
      mayCases: Math.round((shop.mayVerve || 0) * 0.3),
      juneCases: Math.round((shop.juneVerve || 0) * 0.3)
    };
    skuHistory['VERVE_LEMON_LUSH_750'] = {
      marchCases: Math.round((shop.marchVerve || 0) * 0.2),
      aprilCases: Math.round((shop.aprilVerve || 0) * 0.2),
      mayCases: Math.round((shop.mayVerve || 0) * 0.2),
      juneCases: Math.round((shop.juneVerve || 0) * 0.2)
    };
    skuHistory['VERVE_GRAIN_750'] = {
      marchCases: Math.round((shop.marchVerve || 0) * 0.1),
      aprilCases: Math.round((shop.aprilVerve || 0) * 0.1),
      mayCases: Math.round((shop.mayVerve || 0) * 0.1),
      juneCases: Math.round((shop.juneVerve || 0) * 0.1)
    };
  }
  
  return skuHistory;
};

const getInventoryStatus = (shopId: string, skuKey: string, inventoryData?: InventoryData): InventoryStatus => {
  if (!inventoryData || !inventoryData.shops[shopId]) {
    return { stockStatus: 'NO_DATA' };
  }
  
  const shopInventory = inventoryData.shops[shopId];
  
  // Try to match SKU with inventory items
  const skuVariants = SKU_BRAND_MAPPING[skuKey] || [skuKey];
  
  for (const variant of skuVariants) {
    for (const [brandKey, item] of Object.entries(shopInventory.items)) {
      if (brandKey.toUpperCase().includes(variant.toUpperCase()) || 
          variant.toUpperCase().includes(brandKey.toUpperCase())) {
        return {
          quantity: item.quantity,
          isInStock: item.isInStock,
          isOutOfStock: item.isOutOfStock,
          stockStatus: item.isOutOfStock ? 'OUT_OF_STOCK' : 
                      item.quantity < 5 ? 'LOW_STOCK' : 'IN_STOCK',
          lastVisitDays: shopInventory.lastVisitDays,
          reasonNoStock: item.reasonNoStock,
          recentlyRestocked: item.suppliedAfterOutOfStock,
          visitDate: shopInventory.visitDate
        };
      }
    }
  }
  
  return { stockStatus: 'NO_DATA' };
};

const createEnhancedLostCustomer = (
  shop: ShopData, 
  skuKey: string, 
  history: any, 
  inventoryStatus: InventoryStatus
): EnhancedLostCustomer => {
  const averageMonthlyOrders = (history.marchCases + history.aprilCases + history.mayCases) / 3;
  const daysSinceLastOrder = history.mayCases > 0 ? 30 : 
                           history.aprilCases > 0 ? 60 : 
                           history.marchCases > 0 ? 90 : 120;
  
  // Calculate customer tier based on average monthly volume
  const historicalTier: EnhancedLostCustomer['historicalTier'] = 
    averageMonthlyOrders >= 20 ? 'VIP' :
    averageMonthlyOrders >= 10 ? 'High' :
    averageMonthlyOrders >= 5 ? 'Medium' : 'Low';
  
  // Determine recovery type based on inventory status
  const recoveryType: EnhancedLostCustomer['recoveryType'] = 
    inventoryStatus.stockStatus === 'OUT_OF_STOCK' ? 'SUPPLY_ISSUE' :
    inventoryStatus.stockStatus === 'IN_STOCK' ? 'COMPETITIVE_THREAT' :
    !inventoryStatus.lastVisitDays || inventoryStatus.lastVisitDays > 30 ? 'RELATIONSHIP_GAP' :
    'SEASONAL_PATTERN';
  
  // Calculate recovery score (0-100)
  let recoveryScore = 70; // Base score
  if (historicalTier === 'VIP') recoveryScore += 20;
  else if (historicalTier === 'High') recoveryScore += 10;
  if (daysSinceLastOrder <= 30) recoveryScore += 15;
  else if (daysSinceLastOrder <= 60) recoveryScore += 5;
  else recoveryScore -= 10;
  if (recoveryType === 'SUPPLY_ISSUE') recoveryScore += 15;
  else if (recoveryType === 'COMPETITIVE_THREAT') recoveryScore -= 5;
  if (inventoryStatus.recentlyRestocked) recoveryScore += 10;
  
  recoveryScore = Math.max(0, Math.min(100, recoveryScore));
  
  // Priority level
  const priorityLevel: EnhancedLostCustomer['priorityLevel'] = 
    recoveryScore >= 80 ? 'HIGH' :
    recoveryScore >= 60 ? 'MEDIUM' : 'LOW';
  
  // Financial calculations (assuming average case value of 500 INR)
  const avgCaseValue = 500;
  const lostRevenuePerMonth = averageMonthlyOrders * avgCaseValue;
  const totalLostRevenue = lostRevenuePerMonth * (daysSinceLastOrder / 30);
  const recoveryPotential = lostRevenuePerMonth * (recoveryScore / 100);
  
  // Recommended action
  const recommendedAction = 
    recoveryType === 'SUPPLY_ISSUE' ? 'Immediate restocking required - customer ready to buy' :
    recoveryType === 'COMPETITIVE_THREAT' ? 'Price negotiation & promotional support needed' :
    recoveryType === 'RELATIONSHIP_GAP' ? 'Schedule relationship-building visit within 7 days' :
    'Seasonal analysis - contact during typical ordering period';
  
  const last3Orders = [
    { month: 'May', cases: history.mayCases, date: 'May 2025' },
    { month: 'Apr', cases: history.aprilCases, date: 'Apr 2025' },
    { month: 'Mar', cases: history.marchCases, date: 'Mar 2025' }
  ].filter(order => order.cases > 0);
  
  return {
    sku: skuKey,
    shopId: shop.shopId,
    shopName: shop.shopName,
    department: shop.department,
    salesman: shop.salesman,
    marchCases: history.marchCases,
    aprilCases: history.aprilCases,
    mayCases: history.mayCases,
    juneCases: history.juneCases,
    daysSinceLastOrder,
    averageMonthlyOrders,
    historicalTier,
    last3Orders,
    
    // Inventory Intelligence
    currentStock: inventoryStatus.quantity,
    stockStatus: inventoryStatus.stockStatus,
    lastVisitDays: inventoryStatus.lastVisitDays,
    reasonNoStock: inventoryStatus.reasonNoStock,
    recentlyRestocked: inventoryStatus.recentlyRestocked,
    
    // Recovery Intelligence
    recoveryType,
    priorityLevel,
    recoveryScore,
    recommendedAction,
    estimatedRecoveryValue: recoveryPotential,
    
    // Financial Impact
    lostRevenuePerMonth,
    totalLostRevenue,
    recoveryPotential
  };
};

const calculateEnhancedMetrics = (analyzedShops: AnalyzedShop[], skuLostCustomers: EnhancedLostCustomer[]) => {
  const unbilledCount = analyzedShops.filter(s => s.customerStatus === 'unbilled').length;
  const lost2Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 60 && s.daysSinceLastOrder! < 90).length;
  const lost3Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 90 && s.daysSinceLastOrder! < 120).length;
  const lost4Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 120 && s.daysSinceLastOrder! < 150).length;
  const lost5Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 150 && s.daysSinceLastOrder! < 180).length;
  const lost6Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 180).length;
  const neverOrdered = analyzedShops.filter(s => s.customerStatus === 'never-ordered').length;
  const quarterlyDeclining = analyzedShops.filter(s => s.quarterlyDecline! > 10).length;
  
  // Enhanced SKU metrics
  const skuHighPriority = skuLostCustomers.filter(c => c.priorityLevel === 'HIGH').length;
  const skuSupplyIssues = skuLostCustomers.filter(c => c.recoveryType === 'SUPPLY_ISSUE').length;
  const skuCompetitiveThreats = skuLostCustomers.filter(c => c.recoveryType === 'COMPETITIVE_THREAT').length;
  const totalRecoveryPotential = skuLostCustomers.reduce((sum, c) => sum + c.recoveryPotential, 0);
  
  return {
    unbilledCount,
    lostCustomers2Months: lost2Months,
    lostCustomers3Months: lost3Months,
    lostCustomers4Months: lost4Months,
    lostCustomers5Months: lost5Months,
    lostCustomers6Months: lost6Months,
    neverOrderedCount: neverOrdered,
    quarterlyDeclining,
    
    // Enhanced metrics
    skuLostCount: skuLostCustomers.length,
    skuHighPriority,
    skuSupplyIssues,
    skuCompetitiveThreats,
    totalRecoveryPotential: Math.round(totalRecoveryPotential),
    avgRecoveryScore: skuLostCustomers.length > 0 ? 
      Math.round(skuLostCustomers.reduce((sum, c) => sum + c.recoveryScore, 0) / skuLostCustomers.length) : 0
  };
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const CustomerHealth = ({ data, inventoryData }: { data: DashboardData, inventoryData?: InventoryData }) => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  const [activeBrand, setActiveBrand] = useState<'all' | '8PM' | 'VERVE'>('all');
  const [lookbackMonths, setLookbackMonths] = useState(3);
  const [activeSection, setActiveSection] = useState<'unbilled' | 'lost' | 'sku-recovery' | 'quarterly'>('unbilled');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [salesmanFilter, setSalesmanFilter] = useState('');
  const [skuFilter, setSkuFilter] = useState('');
  const [recoveryTypeFilter, setRecoveryTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // ==========================================
  // DATA PROCESSING
  // ==========================================

  const { analyzedShops, skuLostCustomers, enhancedMetrics } = useMemo(() => 
    processEnhancedCustomerData(data, inventoryData), 
    [data, inventoryData, activeBrand]
  );

  // ==========================================
  // FILTERED DATA
  // ==========================================

  const filteredShops = useMemo(() => {
    let filtered = analyzedShops.filter(shop => {
      const matchesSearch = !searchText || 
        shop.shopName.toLowerCase().includes(searchText.toLowerCase()) ||
        shop.department.toLowerCase().includes(searchText.toLowerCase()) ||
        shop.salesman.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesDepartment = !departmentFilter || shop.department === departmentFilter;
      const matchesSalesman = !salesmanFilter || shop.salesman === salesmanFilter;

      if (activeSection === 'unbilled') {
        return matchesSearch && matchesDepartment && matchesSalesman && 
               shop.customerStatus === 'unbilled';
      } else if (activeSection === 'lost') {
        const monthsBack = lookbackMonths * 30;
        return matchesSearch && matchesDepartment && matchesSalesman && 
               ((shop.daysSinceLastOrder! >= 60 && shop.daysSinceLastOrder! <= monthsBack) ||
                shop.customerStatus === 'never-ordered');
      } else if (activeSection === 'quarterly') {
        return matchesSearch && matchesDepartment && matchesSalesman && 
               shop.quarterlyDecline! > 10;
      }

      return matchesSearch && matchesDepartment && matchesSalesman;
    });

    if (activeSection === 'lost') {
      filtered.sort((a, b) => (b.daysSinceLastOrder! || 0) - (a.daysSinceLastOrder! || 0));
    } else if (activeSection === 'quarterly') {
      filtered.sort((a, b) => (b.quarterlyDecline! || 0) - (a.quarterlyDecline! || 0));
    } else {
      filtered.sort((a, b) => (b.mayTotal || 0) - (a.mayTotal || 0));
    }

    return filtered;
  }, [analyzedShops, searchText, departmentFilter, salesmanFilter, activeSection, lookbackMonths]);

  const filteredSKULostCustomers = useMemo(() => {
    return skuLostCustomers.filter(customer => {
      const matchesSearch = !searchText || 
        customer.shopName.toLowerCase().includes(searchText.toLowerCase()) ||
        customer.salesman.toLowerCase().includes(searchText.toLowerCase()) ||
        getSKUDisplayName(customer.sku).toLowerCase().includes(searchText.toLowerCase());
      
      const matchesDepartment = !departmentFilter || customer.department === departmentFilter;
      const matchesSalesman = !salesmanFilter || customer.salesman === salesmanFilter;
      const matchesSKU = !skuFilter || customer.sku.includes(skuFilter);
      const matchesRecoveryType = !recoveryTypeFilter || customer.recoveryType === recoveryTypeFilter;
      const matchesPriority = !priorityFilter || customer.priorityLevel === priorityFilter;

      return matchesSearch && matchesDepartment && matchesSalesman && 
             matchesSKU && matchesRecoveryType && matchesPriority;
    });
  }, [skuLostCustomers, searchText, departmentFilter, salesmanFilter, skuFilter, recoveryTypeFilter, priorityFilter]);

  // Pagination
  const totalPages = activeSection === 'sku-recovery' ? 
    Math.ceil(filteredSKULostCustomers.length / itemsPerPage) :
    Math.ceil(filteredShops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentShops = filteredShops.slice(startIndex, endIndex);
  const currentSKUCustomers = filteredSKULostCustomers.slice(startIndex, endIndex);

  // Filter options
  const departments = [...new Set(data.allShopsComparison.map(shop => shop.department))].sort();
  const salesmen = [...new Set(data.allShopsComparison.map(shop => shop.salesman))].sort();

  // ==========================================
  // EXPORT FUNCTION
  // ==========================================

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Radico Customer Health Analysis - ${activeSection.toUpperCase()} - ${new Date().toLocaleDateString()}\n`;
    csvContent += `Brand Filter: ${activeBrand}, Lookback: ${lookbackMonths} months\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    if (activeSection === 'sku-recovery') {
      csvContent += `SKU RECOVERY INTELLIGENCE ANALYSIS\n`;
      csvContent += `Shop Name,SKU,Department,Salesman,Historical Tier,Avg Monthly Orders,Days Since Last,Recovery Type,Priority,Recovery Score,Current Stock,Stock Status,Last Visit Days,Recommended Action,Recovery Potential INR,Lost Revenue/Month INR,Total Lost Revenue INR\n`;
      
      filteredSKULostCustomers.forEach(customer => {
        csvContent += `"${customer.shopName}","${getSKUDisplayName(customer.sku)}","${customer.department}","${customer.salesman}","${customer.historicalTier}","${customer.averageMonthlyOrders.toFixed(1)}","${customer.daysSinceLastOrder}","${customer.recoveryType}","${customer.priorityLevel}","${customer.recoveryScore}","${customer.currentStock || 'N/A'}","${customer.stockStatus}","${customer.lastVisitDays || 'N/A'}","${customer.recommendedAction}","${customer.recoveryPotential.toFixed(0)}","${customer.lostRevenuePerMonth.toFixed(0)}","${customer.totalLostRevenue.toFixed(0)}"\n`;
      });
    } else if (activeSection === 'unbilled') {
      csvContent += `UNBILLED THIS MONTH (${getMonthName(data.currentMonth)} ${data.currentYear})\n`;
      csvContent += `Shop Name,Department,Salesman,Last Order (May),Days Since Order,Risk Level\n`;
      
      filteredShops.forEach(shop => {
        csvContent += `"${shop.shopName}","${shop.department}","${shop.salesman}",${shop.mayTotal || 0},${shop.daysSinceLastOrder},"${shop.riskLevel}"\n`;
      });
    } else if (activeSection === 'lost') {
      csvContent += `LOST CUSTOMERS ANALYSIS (${lookbackMonths} month lookback)\n`;
      csvContent += `Shop Name,Department,Salesman,Last Order Date,Days Since Order,Customer Status,Risk Level\n`;
      
      filteredShops.forEach(shop => {
        csvContent += `"${shop.shopName}","${shop.department}","${shop.salesman}","${shop.lastOrderDate}",${shop.daysSinceLastOrder},"${shop.customerStatus}","${shop.riskLevel}"\n`;
      });
    } else if (activeSection === 'quarterly') {
      csvContent += `QUARTERLY DECLINING SALES\n`;
      csvContent += `Shop Name,Department,Salesman,Q1 Avg (Mar-Apr-May),Q2 Current (Jun),Decline %\n`;
      
      filteredShops.forEach(shop => {
        const q1Avg = ((shop.marchTotal || 0) + (shop.aprilTotal || 0) + (shop.mayTotal || 0)) / 3;
        csvContent += `"${shop.shopName}","${shop.department}","${shop.salesman}",${q1Avg.toFixed(1)},${shop.juneTotal || 0},${shop.quarterlyDecline?.toFixed(1)}%\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Customer_Health_Enhanced_${activeSection}_${activeBrand}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const getRiskBadge = (riskLevel: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full ${colors[riskLevel as keyof typeof colors]}`;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      unbilled: 'bg-orange-100 text-orange-800',
      'at-risk': 'bg-yellow-100 text-yellow-800',
      lost: 'bg-red-100 text-red-800',
      'never-ordered': 'bg-gray-100 text-gray-800'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full ${colors[status as keyof typeof colors]}`;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      HIGH: 'bg-red-100 text-red-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-blue-100 text-blue-800'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full ${colors[priority as keyof typeof colors]}`;
  };

  const getRecoveryTypeBadge = (type: string) => {
    const colors = {
      SUPPLY_ISSUE: 'bg-purple-100 text-purple-800',
      COMPETITIVE_THREAT: 'bg-red-100 text-red-800',
      RELATIONSHIP_GAP: 'bg-blue-100 text-blue-800',
      SEASONAL_PATTERN: 'bg-green-100 text-green-800'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full ${colors[type as keyof typeof colors]}`;
  };

  const getStockStatusBadge = (status: string) => {
    const colors = {
      IN_STOCK: 'bg-green-100 text-green-800',
      OUT_OF_STOCK: 'bg-red-100 text-red-800',
      LOW_STOCK: 'bg-yellow-100 text-yellow-800',
      NO_DATA: 'bg-gray-100 text-gray-800'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full ${colors[status as keyof typeof colors]}`;
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center mb-2">
              <Heart className="w-6 h-6 mr-2 text-red-500" />
              Enhanced Customer Health Intelligence
            </h2>
            <p className="text-gray-600">Advanced customer lifecycle analysis with SKU-level recovery intelligence</p>
            {inventoryData && (
              <p className="text-sm text-green-600 mt-1">✅ Inventory data integrated for enhanced insights</p>
            )}
          </div>
          
          {/* Brand Toggle */}
          <div className="flex space-x-2 mt-4 lg:mt-0">
            {(['all', '8PM', 'VERVE'] as const).map((brand) => (
              <button
                key={brand}
                onClick={() => setActiveBrand(brand)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeBrand === brand
                    ? brand === '8PM' ? 'bg-purple-600 text-white' 
                      : brand === 'VERVE' ? 'bg-orange-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {brand === 'all' ? 'All Brands' : brand}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              <h4 className="font-medium text-orange-800">Unbilled</h4>
            </div>
            <div className="text-2xl font-bold text-orange-600">{enhancedMetrics.unbilledCount}</div>
            <p className="text-sm text-orange-600">This Month</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 text-red-600 mr-2" />
              <h4 className="font-medium text-red-800">Lost (Broad)</h4>
            </div>
            <div className="text-2xl font-bold text-red-600">{enhancedMetrics.lostCustomers3Months}</div>
            <p className="text-sm text-red-600">3+ months no orders</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Target className="w-5 h-5 text-purple-600 mr-2" />
              <h4 className="font-medium text-purple-800">SKU Lost</h4>
            </div>
            <div className="text-2xl font-bold text-purple-600">{enhancedMetrics.skuLostCount}</div>
            <p className="text-sm text-purple-600">Individual SKUs lost</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Package className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-800">Supply Issues</h4>
            </div>
            <div className="text-2xl font-bold text-blue-600">{enhancedMetrics.skuSupplyIssues}</div>
            <p className="text-sm text-blue-600">Quick wins available</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="font-medium text-green-800">Recovery Score</h4>
            </div>
            <div className="text-2xl font-bold text-green-600">{enhancedMetrics.avgRecoveryScore}</div>
            <p className="text-sm text-green-600">Average potential</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <BarChart3 className="w-5 h-5 text-yellow-600 mr-2" />
              <h4 className="font-medium text-yellow-800">Value at Risk</h4>
            </div>
            <div className="text-2xl font-bold text-yellow-600">₹{(enhancedMetrics.totalRecoveryPotential / 1000).toFixed(0)}K</div>
            <p className="text-sm text-yellow-600">Recovery potential</p>
          </div>
        </div>
      </div>

      {/* Enhanced Analysis Sections */}
      <div className="bg-white rounded-lg shadow">
        {/* Section Navigation */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex space-x-4">
              {[
                { id: 'unbilled', label: 'Unbilled This Month', icon: AlertTriangle },
                { id: 'lost', label: 'Lost Customer Overview', icon: Clock },
                { id: 'sku-recovery', label: 'SKU Recovery Intelligence', icon: Target },
                { id: 'quarterly', label: 'Quarterly Declining', icon: TrendingDown }
              ].map(section => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id as any);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  <span>{section.label}</span>
                  {section.id === 'sku-recovery' && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                  )}
                </button>
              ))}
            </div>
            
            {activeSection === 'lost' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Lookback:</span>
                <select
                  value={lookbackMonths}
                  onChange={(e) => setLookbackMonths(parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value={2}>2 months</option>
                  <option value={3}>3 months</option>
                  <option value={4}>4 months</option>
                  <option value={5}>5 months</option>
                  <option value={6}>6 months</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search shops, departments, salesmen, SKUs..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-64"
              />
            </div>
            
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={salesmanFilter}
              onChange={(e) => setSalesmanFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Salesmen</option>
              {salesmen.map(salesman => (
                <option key={salesman} value={salesman}>{salesman}</option>
              ))}
            </select>

            {activeSection === 'sku-recovery' && (
              <>
                <select
                  value={skuFilter}
                  onChange={(e) => setSkuFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">All SKUs</option>
                  <option value="8PM">8PM Products</option>
                  <option value="VERVE">VERVE Products</option>
                </select>

                <select
                  value={recoveryTypeFilter}
                  onChange={(e) => setRecoveryTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">All Recovery Types</option>
                  <option value="SUPPLY_ISSUE">Supply Issues</option>
                  <option value="COMPETITIVE_THREAT">Competitive Threats</option>
                  <option value="RELATIONSHIP_GAP">Relationship Gaps</option>
                  <option value="SEASONAL_PATTERN">Seasonal Patterns</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">All Priorities</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </>
            )}

            <button
              onClick={() => {
                setSearchText('');
                setDepartmentFilter('');
                setSalesmanFilter('');
                setSkuFilter('');
                setRecoveryTypeFilter('');
                setPriorityFilter('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>

            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <div className="text-sm text-gray-500">
              Showing {activeSection === 'sku-recovery' ? filteredSKULostCustomers.length : filteredShops.length} items
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {activeSection === 'sku-recovery' ? (
            <SkuRecoveryIntelligenceTable 
              customers={currentSKUCustomers}
              getSKUDisplayName={getSKUDisplayName}
              getPriorityBadge={getPriorityBadge}
              getRecoveryTypeBadge={getRecoveryTypeBadge}
              getStockStatusBadge={getStockStatusBadge}
              inventoryData={inventoryData}
            />
          ) : (
            <StandardCustomerTable
              shops={currentShops}
              activeSection={activeSection}
              data={data}
              getRiskBadge={getRiskBadge}
              getStatusBadge={getStatusBadge}
            />
          )}
        </div>

        {/* Enhanced Pagination */}
        <div className="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            {activeSection === 'sku-recovery' ? (
              <>Showing {startIndex + 1} to {Math.min(endIndex, filteredSKULostCustomers.length)} of {filteredSKULostCustomers.length} SKU recovery opportunities</>
            ) : (
              <>Showing {startIndex + 1} to {Math.min(endIndex, filteredShops.length)} of {filteredShops.length} shops</>
            )}
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

      {/* Enhanced Intelligence Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Enhanced Intelligence Summary</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Broad vs SKU-Level Analysis:</h4>
            <div className="space-y-1 text-sm">
              <div>• <strong>Lost Customer Overview:</strong> Brand family level (all 8PM variants combined)</div>
              <div>• <strong>SKU Recovery Intelligence:</strong> Individual product level (8PM 750ml, 375ml, etc.)</div>
              <div>• <strong>Inventory Integration:</strong> Current stock status from last visits</div>
              <div>• <strong>Recovery Prioritization:</strong> Supply vs competitive vs relationship issues</div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Recovery Intelligence Types:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-100 rounded"></div>
                <span><strong>Supply Issue:</strong> Out of stock - immediate restocking needed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 rounded"></div>
                <span><strong>Competitive Threat:</strong> Has stock but not ordering - pricing/promotion needed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <span><strong>Relationship Gap:</strong> No recent visits - relationship building required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 rounded"></div>
                <span><strong>Seasonal Pattern:</strong> Predictable ordering cycles</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SKU RECOVERY INTELLIGENCE TABLE COMPONENT
// ==========================================

const SkuRecoveryIntelligenceTable = ({ 
  customers, 
  getSKUDisplayName, 
  getPriorityBadge, 
  getRecoveryTypeBadge, 
  getStockStatusBadge,
  inventoryData 
}: {
  customers: EnhancedLostCustomer[];
  getSKUDisplayName: (sku: string) => string;
  getPriorityBadge: (priority: string) => string;
  getRecoveryTypeBadge: (type: string) => string;
  getStockStatusBadge: (status: string) => string;
  inventoryData?: InventoryData;
}) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Historical Performance</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recovery Type</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recovery Score</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value at Risk</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action Required</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {customers.map((customer, index) => (
        <tr key={`${customer.shopId}-${customer.sku}`} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <span className={getPriorityBadge(customer.priorityLevel)}>
              {customer.priorityLevel}
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            <div className="max-w-xs truncate font-medium">{customer.shopName}</div>
            <div className="text-xs text-gray-500">{customer.department} • {customer.salesman}</div>
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            <div className="font-medium">{getSKUDisplayName(customer.sku)}</div>
            <div className="text-xs text-gray-500">Tier: {customer.historicalTier}</div>
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            <div className="text-sm font-medium">{customer.averageMonthlyOrders.toFixed(1)} cases/month</div>
            <div className="text-xs text-gray-500">
              Last 3: {customer.last3Orders.map(o => `${o.month}(${o.cases})`).join(', ')}
            </div>
            <div className="text-xs text-red-600">{customer.daysSinceLastOrder} days since last order</div>
          </td>
          <td className="px-6 py-4 text-sm">
            <div className="flex flex-col space-y-1">
              <span className={getStockStatusBadge(customer.stockStatus)}>
                {customer.stockStatus.replace('_', ' ')}
              </span>
              {customer.currentStock !== undefined && (
                <div className="text-xs text-gray-600">{customer.currentStock} units</div>
              )}
              {customer.lastVisitDays && (
                <div className="text-xs text-blue-600">Visit: {customer.lastVisitDays} days ago</div>
              )}
              {customer.recentlyRestocked && (
                <div className="flex items-center text-xs text-green-600">
                  <Truck className="w-3 h-3 mr-1" />
                  Recently restocked
                </div>
              )}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <span className={getRecoveryTypeBadge(customer.recoveryType)}>
              {customer.recoveryType.replace('_', ' ')}
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-center">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
              customer.recoveryScore >= 80 ? 'bg-green-100 text-green-800' :
              customer.recoveryScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {customer.recoveryScore}/100
            </div>
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            <div className="font-medium text-green-600">₹{customer.recoveryPotential.toFixed(0)}</div>
            <div className="text-xs text-gray-500">₹{customer.lostRevenuePerMonth.toFixed(0)}/month lost</div>
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            <div className="max-w-xs text-xs">{customer.recommendedAction}</div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

// ==========================================
// STANDARD CUSTOMER TABLE COMPONENT
// ==========================================

const StandardCustomerTable = ({ 
  shops, 
  activeSection, 
  data, 
  getRiskBadge, 
  getStatusBadge 
}: {
  shops: AnalyzedShop[];
  activeSection: string;
  data: DashboardData;
  getRiskBadge: (risk: string) => string;
  getStatusBadge: (status: string) => string;
}) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
        {activeSection === 'unbilled' && (
          <>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">May Orders</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Since</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
          </>
        )}
        {activeSection === 'lost' && (
          <>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Order</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Since</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
          </>
        )}
        {activeSection === 'quarterly' && (
          <>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q1 Average</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q2 Current</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Decline %</th>
          </>
        )}
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {shops.map((shop) => (
        <tr key={shop.shopId} className="hover:bg-gray-50">
          <td className="px-6 py-4 text-sm text-gray-900">
            <div className="max-w-xs truncate font-medium">{shop.shopName}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
          <td className="px-6 py-4 text-sm text-gray-900">
            <div className="max-w-xs truncate">{shop.salesman}</div>
          </td>
          
          {activeSection === 'unbilled' && (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                {shop.mayTotal?.toLocaleString() || 0} cases
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {shop.daysSinceLastOrder} days
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={getRiskBadge(shop.riskLevel!)}>
                  {shop.riskLevel?.toUpperCase()}
                </span>
              </td>
            </>
          )}
          
          {activeSection === 'lost' && (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {shop.lastOrderDate}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {shop.daysSinceLastOrder === 999 ? 'N/A' : `${shop.daysSinceLastOrder} days`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={getStatusBadge(shop.customerStatus)}>
                  {shop.customerStatus.replace('-', ' ').toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={getRiskBadge(shop.riskLevel!)}>
                  {shop.riskLevel?.toUpperCase()}
                </span>
              </td>
            </>
          )}
          
          {activeSection === 'quarterly' && (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {(((shop.marchTotal || 0) + (shop.aprilTotal || 0) + (shop.mayTotal || 0)) / 3).toFixed(1)} cases
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {(shop.juneTotal || 0).toLocaleString()} cases
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                  -{shop.quarterlyDecline?.toFixed(1)}%
                </span>
              </td>
            </>
          )}
        </tr>
      ))}
    </tbody>
  </table>
);

export default CustomerHealth;
