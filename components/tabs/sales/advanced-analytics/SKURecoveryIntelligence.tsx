'use client';

import React, { useState, useMemo } from 'react';
import { Target, Search, Filter, Download, X, ChevronLeft, ChevronRight, AlertTriangle, TrendingDown, UserPlus, Package, Calendar, Eye, Clock, RefreshCw, BarChart3 } from 'lucide-react';

// ==========================================
// TYPE DEFINITIONS
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
    items: Record<string, {
      brand: string;
      quantity: number;
      isInStock: boolean;
      isOutOfStock: boolean;
      reasonNoStock?: string;
      suppliedAfterOutOfStock?: boolean;
      ageInDays?: number;
      lastSupplyDate?: Date;
    }>;
    lastVisitDays: number;
  }>;
}

interface SKURecoveryOpportunity {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  sku: string;
  skuFamily: string;
  lastVolume: number;
  historicalVolume: number;
  avgHistoricalVolume: number;
  daysOutOfStock: number;
  recoveryPotential: number;
  recoveryScore: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  lastActiveMonth: string;
  reasonNoStock?: string;
  isCurrentlyOutOfStock: boolean;
  recentSupplyAttempts: boolean;
  visitDate?: Date;
  actionRequired: string;
  category: 'IMMEDIATE_ACTION' | 'RELATIONSHIP_MAINTENANCE' | 'VIP_CUSTOMER' | 'GAP_ANALYSIS';
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
}

// ==========================================
// ENHANCED SKU PROCESSING FUNCTIONS
// ==========================================

const getDetailedSKUInfo = (brand: string) => {
  const cleanBrand = brand?.toString().trim().toUpperCase();
  
  // Extract size information
  let size = '750ML';
  let variant = '';
  let family = '';
  
  if (cleanBrand.includes('180')) size = '180ML';
  else if (cleanBrand.includes('375')) size = '375ML';
  else if (cleanBrand.includes('90')) size = '90ML';
  else if (cleanBrand.includes('60')) size = '60ML';
  
  // Determine family and variant
  if (cleanBrand.includes('8 PM') || cleanBrand.includes('8PM') || cleanBrand.includes('PREMIUM BLACK')) {
    family = '8PM';
    if (cleanBrand.includes('PET') || cleanBrand.includes('180') || cleanBrand.includes('90') || cleanBrand.includes('60')) {
      variant = `8PM BLACK ${size} PET`;
    } else {
      variant = `8PM BLACK ${size}`;
    }
  } else if (cleanBrand.includes('VERVE') || cleanBrand.includes('M2M') || cleanBrand.includes('MAGIC MOMENTS')) {
    family = 'VERVE';
    if (cleanBrand.includes('CRANBERRY')) {
      variant = `VERVE CRANBERRY ${size}`;
    } else if (cleanBrand.includes('GREEN APPLE') || cleanBrand.includes('APPLE')) {
      variant = `VERVE GREEN APPLE ${size}`;
    } else if (cleanBrand.includes('LEMON')) {
      variant = `VERVE LEMON LUSH ${size}`;
    } else if (cleanBrand.includes('GRAIN')) {
      variant = `VERVE GRAIN ${size}`;
    } else {
      variant = `VERVE ${size}`;
    }
  } else {
    family = 'OTHER';
    variant = cleanBrand;
  }
  
  return {
    originalBrand: brand,
    family,
    variant,
    size,
    displayName: variant || brand
  };
};

const getAllSKUsFromShops = (shops: ShopData[]): string[] => {
  const allSKUs = new Set<string>();
  
  shops.forEach(shop => {
    if (shop.skuBreakdown) {
      shop.skuBreakdown.forEach(sku => {
        const skuInfo = getDetailedSKUInfo(sku.brand);
        allSKUs.add(skuInfo.displayName);
      });
    }
  });
  
  return Array.from(allSKUs).sort();
};

// ==========================================
// ENHANCED RECOVERY ANALYSIS ENGINE
// ==========================================

const analyzeRecoveryOpportunities = (
  shops: ShopData[], 
  inventoryData: InventoryData | undefined, 
  lookbackPeriod: number
): SKURecoveryOpportunity[] => {
  console.log('🔍 Starting Enhanced SKU Recovery Analysis...', {
    totalShops: shops.length,
    lookbackPeriod,
    hasInventoryData: !!inventoryData
  });

  const opportunities: SKURecoveryOpportunity[] = [];
  const today = new Date();

  shops.forEach(shop => {
    if (!shop.skuBreakdown || shop.skuBreakdown.length === 0) return;

    // Get inventory data for this shop if available
    const inventoryShop = inventoryData?.shops[shop.shopId];
    
    // Analyze each SKU historically purchased by this shop
    shop.skuBreakdown.forEach(sku => {
      const skuInfo = getDetailedSKUInfo(sku.brand);
      
      // Skip if no meaningful volume
      if (sku.cases < 1) return;

      // Calculate historical performance
      const currentMonthVolume = getCurrentMonthVolume(shop, skuInfo.family);
      const historicalVolumes = getHistoricalVolumes(shop, skuInfo.family, lookbackPeriod);
      const avgHistoricalVolume = historicalVolumes.length > 0 
        ? historicalVolumes.reduce((sum, vol) => sum + vol, 0) / historicalVolumes.length 
        : sku.cases;

      // Check current stock status from inventory
      let isCurrentlyOutOfStock = false;
      let reasonNoStock = '';
      let daysOutOfStock = 0;
      let visitDate: Date | undefined;
      let recentSupplyAttempts = false;

      if (inventoryShop) {
        visitDate = inventoryShop.visitDate;
        
        // Look for this SKU in inventory
        Object.values(inventoryShop.items).forEach(item => {
          const itemSKUInfo = getDetailedSKUInfo(item.brand);
          if (itemSKUInfo.displayName === skuInfo.displayName || itemSKUInfo.family === skuInfo.family) {
            if (item.isOutOfStock) {
              isCurrentlyOutOfStock = true;
              reasonNoStock = item.reasonNoStock || 'Out of stock';
              daysOutOfStock = Math.floor((today.getTime() - inventoryShop.visitDate.getTime()) / (1000 * 60 * 60 * 24));
            }
            if (item.suppliedAfterOutOfStock) {
              recentSupplyAttempts = true;
            }
          }
        });
      }

      // Determine if this is a recovery opportunity
      const hasDeclinedRecently = currentMonthVolume < (avgHistoricalVolume * 0.7);
      const hasStoppedPurchasing = currentMonthVolume === 0 && avgHistoricalVolume > 5;
      const isRecoveryOpportunity = hasDeclinedRecently || hasStoppedPurchasing || isCurrentlyOutOfStock;

      if (isRecoveryOpportunity) {
        // Calculate recovery potential and score
        const recoveryPotential = Math.max(avgHistoricalVolume - currentMonthVolume, avgHistoricalVolume * 0.5);
        const recoveryScore = calculateRecoveryScore(
          avgHistoricalVolume,
          currentMonthVolume,
          isCurrentlyOutOfStock,
          recentSupplyAttempts,
          daysOutOfStock
        );

        // Determine priority and category
        const priority = getPriority(recoveryScore, recoveryPotential, isCurrentlyOutOfStock);
        const category = getCategory(isCurrentlyOutOfStock, avgHistoricalVolume, recentSupplyAttempts);
        
        // Generate action required
        const actionRequired = generateActionRequired(
          isCurrentlyOutOfStock,
          reasonNoStock,
          recentSupplyAttempts,
          daysOutOfStock,
          avgHistoricalVolume
        );

        // Determine last active month
        const lastActiveMonth = getLastActiveMonth(shop, skuInfo.family);

        opportunities.push({
          shopId: shop.shopId,
          shopName: shop.shopName,
          department: shop.department,
          salesman: shop.salesman,
          sku: skuInfo.displayName,
          skuFamily: skuInfo.family,
          lastVolume: currentMonthVolume,
          historicalVolume: sku.cases,
          avgHistoricalVolume,
          daysOutOfStock,
          recoveryPotential,
          recoveryScore,
          priority,
          lastActiveMonth,
          reasonNoStock,
          isCurrentlyOutOfStock,
          recentSupplyAttempts,
          visitDate,
          actionRequired,
          category
        });
      }
    });
  });

  console.log('✅ Recovery Analysis Complete:', {
    totalOpportunities: opportunities.length,
    byPriority: {
      CRITICAL: opportunities.filter(o => o.priority === 'CRITICAL').length,
      HIGH: opportunities.filter(o => o.priority === 'HIGH').length,
      MEDIUM: opportunities.filter(o => o.priority === 'MEDIUM').length,
      LOW: opportunities.filter(o => o.priority === 'LOW').length
    },
    byCategory: {
      IMMEDIATE_ACTION: opportunities.filter(o => o.category === 'IMMEDIATE_ACTION').length,
      RELATIONSHIP_MAINTENANCE: opportunities.filter(o => o.category === 'RELATIONSHIP_MAINTENANCE').length,
      VIP_CUSTOMER: opportunities.filter(o => o.category === 'VIP_CUSTOMER').length,
      GAP_ANALYSIS: opportunities.filter(o => o.category === 'GAP_ANALYSIS').length
    }
  });

  return opportunities.sort((a, b) => b.recoveryScore - a.recoveryScore);
};

// Helper functions for recovery analysis
const getCurrentMonthVolume = (shop: ShopData, family: string): number => {
  if (family === '8PM') return shop.juneEightPM || 0;
  if (family === 'VERVE') return shop.juneVerve || 0;
  return 0;
};

const getHistoricalVolumes = (shop: ShopData, family: string, lookbackPeriod: number): number[] => {
  const volumes: number[] = [];
  
  if (family === '8PM') {
    if (lookbackPeriod >= 30) volumes.push(shop.mayEightPM || 0);
    if (lookbackPeriod >= 60) volumes.push(shop.aprilEightPM || 0);
    if (lookbackPeriod >= 90) volumes.push(shop.marchEightPM || 0);
  } else if (family === 'VERVE') {
    if (lookbackPeriod >= 30) volumes.push(shop.mayVerve || 0);
    if (lookbackPeriod >= 60) volumes.push(shop.aprilVerve || 0);
    if (lookbackPeriod >= 90) volumes.push(shop.marchVerve || 0);
  }
  
  return volumes.filter(vol => vol > 0);
};

const calculateRecoveryScore = (
  avgHistorical: number,
  current: number,
  isOutOfStock: boolean,
  recentSupply: boolean,
  daysOutOfStock: number
): number => {
  let score = 0;
  
  // Base score from historical volume
  score += Math.min(avgHistorical * 2, 50);
  
  // Penalty for current low volume
  if (current === 0) score += 30;
  else if (current < avgHistorical * 0.5) score += 20;
  
  // Bonus for out of stock with reason
  if (isOutOfStock) score += 25;
  
  // Bonus for recent supply attempts
  if (recentSupply) score += 15;
  
  // Time urgency
  if (daysOutOfStock > 30) score += 10;
  if (daysOutOfStock > 60) score += 10;
  
  return Math.min(score, 100);
};

const getPriority = (score: number, potential: number, isOutOfStock: boolean): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' => {
  if (isOutOfStock && potential > 50) return 'CRITICAL';
  if (score >= 80 || potential > 75) return 'HIGH';
  if (score >= 60 || potential > 40) return 'MEDIUM';
  return 'LOW';
};

const getCategory = (
  isOutOfStock: boolean, 
  avgHistorical: number, 
  recentSupply: boolean
): 'IMMEDIATE_ACTION' | 'RELATIONSHIP_MAINTENANCE' | 'VIP_CUSTOMER' | 'GAP_ANALYSIS' => {
  if (isOutOfStock && recentSupply) return 'IMMEDIATE_ACTION';
  if (avgHistorical > 100) return 'VIP_CUSTOMER';
  if (avgHistorical > 50) return 'RELATIONSHIP_MAINTENANCE';
  return 'GAP_ANALYSIS';
};

const generateActionRequired = (
  isOutOfStock: boolean,
  reasonNoStock: string,
  recentSupply: boolean,
  daysOutOfStock: number,
  avgHistorical: number
): string => {
  if (isOutOfStock && recentSupply) {
    return `Follow up on recent supply - customer still out of stock (${daysOutOfStock} days)`;
  } else if (isOutOfStock) {
    return `Immediate restocking required - ${reasonNoStock || 'Out of stock'} (${daysOutOfStock} days)`;
  } else if (avgHistorical > 50) {
    return `Relationship maintenance visit - VIP customer with declining purchases`;
  } else {
    return `Schedule visit to understand purchase decline and offer support`;
  }
};

const getLastActiveMonth = (shop: ShopData, family: string): string => {
  const months = ['June', 'May', 'April', 'March'];
  const volumes = family === '8PM' 
    ? [shop.juneEightPM || 0, shop.mayEightPM || 0, shop.aprilEightPM || 0, shop.marchEightPM || 0]
    : [shop.juneVerve || 0, shop.mayVerve || 0, shop.aprilVerve || 0, shop.marchVerve || 0];
  
  for (let i = 0; i < volumes.length; i++) {
    if (volumes[i] > 0) return months[i];
  }
  return 'March+';
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
    lookbackPeriod: 120, // 4 months default
    showOnlyOutOfStock: false,
    minimumRecoveryPotential: 10
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  // Generate recovery opportunities with current filters
  const recoveryOpportunities = useMemo(() => {
    return analyzeRecoveryOpportunities(data.allShopsComparison, inventoryData, filters.lookbackPeriod);
  }, [data.allShopsComparison, inventoryData, filters.lookbackPeriod]);

  // Get unique values for filters
  const departments = [...new Set(data.allShopsComparison.map(shop => shop.department))].sort();
  const salesmen = [...new Set(data.allShopsComparison.map(shop => shop.salesman))].sort();
  const allSKUs = getAllSKUsFromShops(data.allShopsComparison);
  
  // Filter opportunities
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
      const matchesBrand = !selectedBrand || opp.skuFamily === selectedBrand;
      const matchesOutOfStock = !filters.showOnlyOutOfStock || opp.isCurrentlyOutOfStock;
      const matchesMinRecovery = opp.recoveryPotential >= filters.minimumRecoveryPotential;

      return matchesDepartment && matchesSalesman && matchesSKU && matchesPriority && 
             matchesCategory && matchesSearch && matchesBrand && matchesOutOfStock && matchesMinRecovery;
    });
  }, [recoveryOpportunities, filters, selectedBrand]);

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
    csvContent += `SKU Recovery Intelligence Report - ${new Date().toLocaleDateString()}\n`;
    csvContent += `Lookback Period: ${filters.lookbackPeriod} days\n`;
    csvContent += `Total Opportunities: ${summary.total}\n`;
    csvContent += `Total Recovery Potential: ${summary.totalRecoveryPotential.toFixed(0)} cases\n\n`;
    
    csvContent += `Shop Name,Shop ID,Department,Salesman,SKU,SKU Family,Last Volume,Historical Volume,Avg Historical,Recovery Potential,Recovery Score,Priority,Category,Days Out of Stock,Currently Out of Stock,Recent Supply Attempts,Last Active Month,Reason No Stock,Action Required,Visit Date\n`;
    
    filteredOpportunities.forEach(opp => {
      csvContent += `"${opp.shopName}","${opp.shopId}","${opp.department}","${opp.salesman}","${opp.sku}","${opp.skuFamily}",${opp.lastVolume},${opp.historicalVolume},${opp.avgHistoricalVolume.toFixed(1)},${opp.recoveryPotential.toFixed(1)},${opp.recoveryScore},"${opp.priority}","${opp.category}",${opp.daysOutOfStock},"${opp.isCurrentlyOutOfStock ? 'Yes' : 'No'}","${opp.recentSupplyAttempts ? 'Yes' : 'No'}","${opp.lastActiveMonth}","${opp.reasonNoStock || 'N/A'}","${opp.actionRequired}","${opp.visitDate ? opp.visitDate.toLocaleDateString() : 'N/A'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SKU_Recovery_Intelligence_${new Date().toISOString().split('T')[0]}.csv`);
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
      GAP_ANALYSIS: 'bg-gray-50 text-gray-700 border-gray-200'
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
      lookbackPeriod: 120,
      showOnlyOutOfStock: false,
      minimumRecoveryPotential: 10
    });
    setSelectedBrand('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center mb-2">
              <Target className="w-6 h-6 mr-2 text-purple-600" />
              SKU Recovery Intelligence
            </h2>
            <p className="text-gray-600">Advanced SKU-level customer recovery with real historical data integration</p>
            {inventoryData && (
              <div className="flex items-center mt-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Live inventory data connected
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={filters.lookbackPeriod}
                onChange={(e) => {
                  setFilters({ ...filters, lookbackPeriod: parseInt(e.target.value) });
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value={60}>60 Days (2 Months)</option>
                <option value={90}>90 Days (3 Months)</option>
                <option value={120}>120 Days (4 Months)</option>
                <option value={180}>180 Days (6 Months)</option>
                <option value={270}>270 Days (9 Months)</option>
              </select>
            </div>
          </div>
        </div>

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
            8PM Whisky
          </button>
          <button
            onClick={() => setSelectedBrand('VERVE')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedBrand === 'VERVE' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            VERVE Vodka
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-sm text-gray-600">Total Opportunities</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.priorityCounts.CRITICAL}</div>
            <div className="text-sm text-red-600">Critical Priority</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.uniqueSKUs}</div>
            <div className="text-sm text-blue-600">Unique SKUs</div>
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
            <div className="text-sm text-purple-600">Currently Out</div>
          </div>
        </div>
      </div>

      {/* Filters */}
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
            <option value="">All SKUs</option>
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
            <span>Export CSV</span>
          </button>

          <div className="text-sm text-gray-500">
            {filteredOpportunities.length} of {recoveryOpportunities.length} opportunities
          </div>
        </div>
      </div>

      {/* Recovery Opportunities Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recovery Opportunities</h3>
          <p className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredOpportunities.length)} of {filteredOpportunities.length} opportunities 
            ({filters.lookbackPeriod}-day lookback period)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop & SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume Analysis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recovery Potential</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Required</th>
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
                      <div className="text-sm font-medium text-purple-600">{opportunity.sku}</div>
                      <div className="text-xs text-gray-400">{opportunity.skuFamily} Family</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{opportunity.department}</div>
                    <div className="text-sm text-gray-500">{opportunity.salesman}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div>Current: <span className="font-medium">{opportunity.lastVolume} cases</span></div>
                      <div>Historical Avg: <span className="font-medium">{opportunity.avgHistoricalVolume.toFixed(0)} cases</span></div>
                      <div className="text-xs text-gray-500">Last Active: {opportunity.lastActiveMonth}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className={getCategoryBadge(opportunity.category)}>
                        {opportunity.category.replace(/_/g, ' ')}
                      </span>
                      {opportunity.isCurrentlyOutOfStock && (
                        <div className="flex items-center text-xs text-red-600">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Out of stock ({opportunity.daysOutOfStock}d)
                        </div>
                      )}
                      {opportunity.recentSupplyAttempts && (
                        <div className="flex items-center text-xs text-blue-600">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Recent supply attempt
                        </div>
                      )}
                      {opportunity.visitDate && (
                        <div className="text-xs text-gray-500">
                          Last visit: {opportunity.visitDate.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {opportunity.actionRequired}
                    </div>
                    {opportunity.reasonNoStock && (
                      <div className="text-xs text-red-600 mt-1">
                        Reason: {opportunity.reasonNoStock}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOpportunities.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recovery Opportunities Found</h3>
            <p className="text-gray-500">Try adjusting your filters or lookback period to see more opportunities.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-700 mb-2 sm:mb-0">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredOpportunities.length)} of {filteredOpportunities.length} opportunities
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
