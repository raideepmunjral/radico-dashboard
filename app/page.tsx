'use client';

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, MapPin, TrendingUp, Users, ShoppingBag, BarChart3, Calendar, Trophy, Building, Target, Activity, FileText, Table, X, ChevronLeft, ChevronRight, Star, AlertTriangle, TrendingDown, UserPlus, Search, Filter, History, Package } from 'lucide-react';
import InventoryDashboard from '../components/InventoryDashboard';

// ==========================================
// IMPORTED EXTRACTED COMPONENTS (UNCHANGED)
// ==========================================
import AdvancedAnalyticsTab from '../components/tabs/sales/AdvancedAnalyticsTab';
import HistoricalAnalysisTab from '../components/tabs/sales/HistoricalAnalysisTab';
import SalesmanPerformanceTab from '../components/tabs/sales/SalesmanPerformanceTab';
import FocusShopsTab from '../components/tabs/sales/FocusShopsTab';
import TopShopsTab from '../components/tabs/sales/TopShopsTab';
import DepartmentTab from '../components/tabs/sales/DepartmentTab';
import OverviewTab from '../components/tabs/sales/OverviewTab';

// ==========================================
// PART 1: TYPE DEFINITIONS & INTERFACES (ENHANCED BUT BACKWARD COMPATIBLE)
// ==========================================

interface ShopData {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  total: number;
  eightPM: number;
  verve: number;
  // Updated to rolling 4 months: Mar-Apr-May-June (UNCHANGED)
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
  // YoY comparison (UNCHANGED)
  juneLastYearTotal?: number;
  juneLastYearEightPM?: number;
  juneLastYearVerve?: number;
  yoyGrowthPercent?: number;
  growthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
  skuBreakdown?: SKUData[]; // EXISTING - PRESERVED
  detailedSKUBreakdown?: DetailedSKUData[]; // NEW - ADDITIONAL (doesn't break existing)
  historicalData?: MonthlyData[];
  // NEW: 3-month averages (UNCHANGED)
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

// NEW: Additional detailed SKU structure (doesn't replace existing)
interface DetailedSKUData {
  originalBrand: string;
  displayName: string;
  family: string; // 8PM, VERVE, OTHER
  variant: string; // 8PM BLACK 750ML, VERVE CRANBERRY 180ML, etc.
  size: string; // 750ML, 180ML, etc.
  cases: number;
  percentage: number;
  month?: string;
}

interface MonthlyData {
  month: string;
  total: number;
  eightPM: number;
  verve: number;
  skuBreakdown: SKUData[];
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
  summary: {
    totalShops: number;
    billedShops: number;
    total8PM: number;
    totalVERVE: number;
    totalSales: number;
    coverage: string;
    total8PMTarget: number;
    totalVerveTarget: number;
    eightPmAchievement: string;
    verveAchievement: string;
    // YoY metrics
    lastYearTotal8PM?: number;
    lastYearTotalVERVE?: number;
    yoy8PMGrowth?: string;
    yoyVerveGrowth?: string;
  };
  topShops: ShopData[];
  deptPerformance: Record<string, any>;
  salesData: Record<string, ShopData>;
  visitData: number;
  lastUpdated: Date;
  salespersonStats: Record<string, any>;
  customerInsights: CustomerInsights;
  allShopsComparison: ShopData[];
  historicalData?: any;
  currentMonth: string;
  currentYear: string;
}

// ==========================================
// PART 2: ENHANCED SKU PROCESSING FUNCTIONS (NEW - ADDITIONS ONLY)
// ==========================================

// NEW: Enhanced function that preserves detailed SKU information
const getDetailedSKUInfo = (brand: string) => {
  const cleanBrand = brand?.toString().trim().toUpperCase();
  
  // Extract size information
  let size = '750ML'; // Default
  if (cleanBrand.includes('180')) size = '180ML';
  else if (cleanBrand.includes('375')) size = '375ML';
  else if (cleanBrand.includes('90')) size = '90ML';
  else if (cleanBrand.includes('60')) size = '60ML';
  
  // Determine family and create detailed variant name
  let family = '';
  let variant = '';
  let displayName = '';
  
  if (cleanBrand.includes('8 PM') || cleanBrand.includes('8PM') || cleanBrand.includes('PREMIUM BLACK')) {
    family = '8PM';
    if (cleanBrand.includes('PET') || cleanBrand.includes('180') || cleanBrand.includes('90') || cleanBrand.includes('60')) {
      variant = `8PM BLACK ${size} PET`;
      displayName = `8PM Black ${size} Pet`;
    } else {
      variant = `8PM BLACK ${size}`;
      displayName = `8PM Black ${size}`;
    }
  } else if (cleanBrand.includes('VERVE') || cleanBrand.includes('M2M') || cleanBrand.includes('MAGIC MOMENTS')) {
    family = 'VERVE';
    if (cleanBrand.includes('CRANBERRY')) {
      variant = `VERVE CRANBERRY ${size}`;
      displayName = `VERVE Cranberry ${size}`;
    } else if (cleanBrand.includes('GREEN APPLE') || cleanBrand.includes('APPLE')) {
      variant = `VERVE GREEN APPLE ${size}`;
      displayName = `VERVE Green Apple ${size}`;
    } else if (cleanBrand.includes('LEMON')) {
      variant = `VERVE LEMON LUSH ${size}`;
      displayName = `VERVE Lemon Lush ${size}`;
    } else if (cleanBrand.includes('GRAIN')) {
      variant = `VERVE GRAIN ${size}`;
      displayName = `VERVE Grain ${size}`;
    } else {
      variant = `VERVE ${size}`;
      displayName = `VERVE ${size}`;
    }
  } else {
    family = 'OTHER';
    variant = cleanBrand;
    displayName = brand;
  }
  
  return {
    originalBrand: brand,
    family,
    variant,
    size,
    displayName
  };
};

// EXISTING FUNCTION - UNCHANGED (for backward compatibility)
const brandFamily: Record<string, string> = {
  "VERVE": "VERVE",
  "8 PM BLACK": "8PM", 
  "8PM BLACK": "8PM",
  "8PM": "8PM",
  "8 PM": "8PM",
  "8 PM PREMIUM BLACK BLENDED WHISKY": "8PM",
  "8 PM PREMIUM BLACK BLENDED WHISKY Pet": "8PM",
  "8PM PREMIUM BLACK BLENDED WHISKY": "8PM",
  "8PM PREMIUM BLACK SUPERIOR WHISKY": "8PM",
  "M2M VERVE CRANBERRY TEASE SP FL VODKA": "VERVE",
  "M2M VERVE GREEN APPLE SUPERIOR FL. VODKA": "VERVE",
  "M2M VERVE LEMON LUSH SUP FL VODKA": "VERVE",
  "M2M VERVE SUPERIOR GRAIN VODKA": "VERVE",
  "M2 MAGIC MOMENTS VERVE CRANBERRY TEASE SUPERIOR FLAVOURED VODKA": "VERVE",
  "M2 MAGIC MOMENTS VERVE GREEN APPLE SUPERIOR FLAVOURED VODKA": "VERVE",
  "M2 MAGIC MOMENTS VERVE LEMON LUSH SUPERIOR FLAVOURED VODKA": "VERVE",
  "M2 MAGIC MOMENTS VERVE SUPERIOR GRAIN VODKA": "VERVE"
};

const getBrandFamily = (brandShort?: string, brand?: string): string | null => {
  const cleanBrandShort = brandShort?.toString().trim();
  const cleanBrand = brand?.toString().trim();
  
  if (cleanBrandShort && brandFamily[cleanBrandShort]) {
    return brandFamily[cleanBrandShort];
  }
  
  if (cleanBrand && brandFamily[cleanBrand]) {
    return brandFamily[cleanBrand];
  }
  
  const combinedText = ((cleanBrandShort || '') + ' ' + (cleanBrand || '')).toUpperCase();
  
  if (combinedText.includes('VERVE') || combinedText.includes('M2 MAGIC MOMENTS VERVE')) return 'VERVE';
  if (combinedText.includes('8PM') || combinedText.includes('8 PM')) return '8PM';
  if (combinedText.includes('PREMIUM BLACK') && (combinedText.includes('WHISKY') || combinedText.includes('BLENDED'))) return '8PM';
  
  return null;
};

// ==========================================
// PART 3: CONFIGURATION & CONSTANTS (UNCHANGED)
// ==========================================

// Helper function for month names (used throughout the component)
const getMonthName = (monthNum: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

const getShortMonthName = (monthNum: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

const RadicoDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showInventory, setShowInventory] = useState(false);
  const [inventoryData, setInventoryData] = useState<any>(null); // ✅ FIXED: Will now be populated

  // DYNAMIC DATE DETECTION (UNCHANGED)
  const getCurrentMonthYear = () => {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // June = 06
    const currentYear = String(now.getFullYear()); // 2025
    return { currentMonth, currentYear };
  };

  const { currentMonth, currentYear } = getCurrentMonthYear();

  // FIXED CONFIGURATION WITH PROPER HISTORICAL DATA SHEET (UNCHANGED)
  const SHEETS_CONFIG = {
    masterSheetId: process.env.NEXT_PUBLIC_MASTER_SHEET_ID || '1pRz9CgOoamTrFipnmF-XuBCg9IZON9br5avgRlKYtxM',
    visitSheetId: process.env.NEXT_PUBLIC_VISIT_SHEET_ID || '1XG4c_Lrpk-YglTq3G3ZY9Qjt7wSnUq0UZWDSYT61eWE',
    historicalSheetId: process.env.NEXT_PUBLIC_HISTORICAL_SHEET_ID || '1yXzEYHJeHlETrEmU4TZ9F2_qv4OE10N4DPdYX0Iqfx0',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  };

  // ==========================================
  // 🆕 NEW: INVENTORY DATA FETCHING FUNCTIONS (SAFE ADDITIONS)
  // ==========================================

  const fetchInventoryData = async () => {
    try {
      if (!SHEETS_CONFIG.apiKey) {
        console.warn('Google API key not configured for inventory data');
        return null;
      }

      console.log('🔄 Fetching inventory data for SKU Recovery Intelligence...');

      // Fetch the same data sources as InventoryDashboard
      const [visitData, masterData] = await Promise.all([
        fetchVisitSheetDataForInventory(),
        fetchMasterSheetData()
      ]);

      // Process the inventory data (simplified version of InventoryDashboard logic)
      const processedInventoryData = processInventoryDataForSKURecovery(visitData, masterData);
      
      console.log('✅ Inventory data processed for SKU Recovery:', {
        shopsWithInventory: Object.keys(processedInventoryData.shops).length,
        totalItems: Object.values(processedInventoryData.shops).reduce((sum, shop) => 
          sum + Object.keys(shop.items).length, 0
        )
      });

      return processedInventoryData;
    } catch (error) {
      console.error('❌ Error fetching inventory data:', error);
      return null;
    }
  };

  const fetchVisitSheetDataForInventory = async () => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.visitSheetId}/values/Radico%20Visit%20Final?key=${SHEETS_CONFIG.apiKey}`
      );
      
      if (!response.ok) {
        console.warn('Visit sheet not accessible for inventory data');
        return [];
      }
      
      const result = await response.json();
      console.log('✅ Visit data fetched for inventory:', result.values?.length || 0, 'rows');
      return result.values || [];
    } catch (error) {
      console.warn('❌ Error fetching visit data for inventory:', error);
      return [];
    }
  };

  const processInventoryDataForSKURecovery = (visitData: any[][], masterData: Record<string, any[]>) => {
    // Simplified version of inventory processing for SKU Recovery Intelligence
    const shops: Record<string, any> = {};
    
    if (visitData.length === 0) {
      return { shops };
    }

    const headers = visitData[0];
    const rows = visitData.slice(1);

    console.log('📋 Processing inventory data for SKU Recovery - Headers found:', headers);

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

    // Process recent visits (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Find latest visits for each shop
    const shopLatestVisits: Record<string, any> = {};
    
    rows.forEach(row => {
      const shopId = row[columnIndices.shopId];
      const shopName = row[columnIndices.shopName];
      const checkInDateTime = row[columnIndices.checkInDateTime];
      
      if (!shopId || !checkInDateTime) return;
      
      try {
        const visitDate = new Date(checkInDateTime);
        if (!visitDate || visitDate < thirtyDaysAgo) return;
        
        if (!shopLatestVisits[shopId] || visitDate > shopLatestVisits[shopId].visitDate) {
          shopLatestVisits[shopId] = {
            shopId,
            shopName: shopName || 'Unknown Shop',
            department: row[columnIndices.department] || 'Unknown',
            salesman: row[columnIndices.salesman] || 'Unknown',
            visitDate
          };
        }
      } catch (error) {
        // Skip invalid dates
      }
    });

    // Process inventory for each shop
    Object.values(shopLatestVisits).forEach((shopVisit: any) => {
      const shopInventory = {
        shopId: shopVisit.shopId,
        shopName: shopVisit.shopName,
        department: shopVisit.department,
        salesman: shopVisit.salesman,
        visitDate: shopVisit.visitDate,
        items: {} as Record<string, any>,
        lastVisitDays: Math.floor((today.getTime() - shopVisit.visitDate.getTime()) / (1000 * 60 * 60 * 24))
      };

      // Find all rows for this shop's latest visit
      const shopRows = rows.filter(row => {
        const rowShopId = row[columnIndices.shopId];
        const rowDateTime = row[columnIndices.checkInDateTime];
        
        if (!rowShopId || !rowDateTime) return false;
        
        try {
          const rowVisitDate = new Date(rowDateTime);
          return rowShopId === shopVisit.shopId && 
                 rowVisitDate.getTime() === shopVisit.visitDate.getTime();
        } catch {
          return false;
        }
      });

      shopRows.forEach((row: any[]) => {
        const brand = row[columnIndices.invBrand]?.toString().trim();
        const quantity = parseFloat(row[columnIndices.invQuantity]) || 0;
        const reasonNoStock = row[columnIndices.reasonNoStock]?.toString().trim() || '';

        if (!brand) return;

        const isOutOfStock = quantity === 0;
        const isInStock = quantity > 0;

        shopInventory.items[brand] = {
          brand,
          quantity,
          isInStock,
          isOutOfStock,
          reasonNoStock,
          // Add placeholder values for other properties expected by SKU Recovery Intelligence
          suppliedAfterOutOfStock: false,
          ageInDays: 0,
          lastSupplyDate: undefined,
          agingDataSource: 'no_data',
          supplyStatus: isOutOfStock ? 'awaiting_supply' : 'current'
        };
      });

      shops[shopVisit.shopId] = shopInventory;
    });

    console.log('✅ Inventory data processed for SKU Recovery:', {
      shopsProcessed: Object.keys(shops).length,
      totalItems: Object.values(shops).reduce((sum: number, shop: any) => 
        sum + Object.keys(shop.items).length, 0
      )
    });

    return { shops };
  };

  // ==========================================
  // PART 4: EXISTING DATA FETCHING FUNCTIONS (UNCHANGED)
  // ==========================================

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!SHEETS_CONFIG.apiKey) {
        throw new Error('Google API key not configured. Please set NEXT_PUBLIC_GOOGLE_API_KEY environment variable.');
      }

      // ✅ ENHANCED: Fetch both sales and inventory data in parallel (SAFE - doesn't affect existing flow)
      const [masterData, visitData, historicalData, inventoryDataResult] = await Promise.all([
        fetchMasterSheetData(),
        fetchVisitSheetData(),
        fetchHistoricalSheetData(),
        fetchInventoryData() // ✅ NEW: Fetch inventory data (doesn't block existing functionality)
      ]);
      
      const processedData = processEnhancedRadicoData(masterData, visitData, historicalData);
      setDashboardData(processedData);
      
      // ✅ NEW: Set inventory data state (SAFE - only adds functionality)
      if (inventoryDataResult) {
        setInventoryData(inventoryDataResult);
        console.log('✅ Inventory data connected to SKU Recovery Intelligence');
      } else {
        console.log('⚠️ No inventory data available - SKU Recovery will show "no data" for current stock status');
      }
      
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterSheetData = async () => {
    const sheets = ['Shop Details', 'Target Vs Achievement', 'Pending Challans', 'User Management'];
    const data: Record<string, any[]> = {};

    for (const sheetName of sheets) {
      try {
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.masterSheetId}/values/${encodeURIComponent(sheetName)}?key=${SHEETS_CONFIG.apiKey}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${sheetName}: ${response.statusText}`);
        }
        
        const result = await response.json();
        data[sheetName] = result.values || [];
      } catch (error) {
        console.error(`Error fetching ${sheetName}:`, error);
        data[sheetName] = [];
      }
    }

    return data;
  };

  const fetchVisitSheetData = async () => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.visitSheetId}/values/Radico%20Visit%20Final?key=${SHEETS_CONFIG.apiKey}`
      );
      
      if (!response.ok) {
        console.warn('Visit sheet not accessible, continuing without visit data');
        return [];
      }
      
      const result = await response.json();
      return result.values || [];
    } catch (error) {
      console.warn('Error fetching visit data:', error);
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
            console.log(`✅ Historical data fetched from sheet: ${sheetName}`, {
              totalRows: result.values?.length || 0,
              headers: result.values?.[0] || [],
              sampleRow: result.values?.[1] || []
            });
            return result.values || [];
          }
        } catch (err) {
          console.log(`❌ Failed to fetch from sheet: ${sheetName}`);
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

  // ==========================================
  // PART 5: ENHANCED DATA PROCESSING (ENHANCED BUT PRESERVES ALL EXISTING FUNCTIONALITY)
  // ==========================================

  const processEnhancedRadicoData = (masterData: Record<string, any[]>, visitData: any[], historicalData: any[]): DashboardData => {
    const shopDetails = masterData['Shop Details'] || [];
    const targets = masterData['Target Vs Achievement'] || [];
    const challans = masterData['Pending Challans'] || [];
    
    console.log(`🔧 PROCESSING DATA WITH ENHANCED SKU PRESERVATION: ${currentMonth}-${currentYear}`);
    console.log('🔄 ROLLING 4-MONTH WINDOW: Mar-Apr-May-Jun 2025 + YoY (Jun 2024)');
    
    // ENHANCED MONTHLY DATA PROCESSING WITH DETAILED SKU BREAKDOWN
    const processMonthlyData = (monthNumber: string, year: string = currentYear, useHistorical: boolean = false) => {
      let monthShopSales: Record<string, any> = {};
      let monthShopSKUs: Record<string, Record<string, number>> = {}; // EXISTING - PRESERVED
      let monthShopDetailedSKUs: Record<string, DetailedSKUData[]> = {}; // NEW - ADDITIONAL
      let monthlyUniqueShops = new Set<string>();
      let monthly8PM = 0, monthlyVERVE = 0;

      if (useHistorical && historicalData.length > 1) {
        console.log(`📊 Processing historical data for month ${monthNumber}-${year}`);
        
        const headers = historicalData[0] || [];
        let processedRows = 0;
        let targetMonthRows = 0;
        
        historicalData.slice(1).forEach((row, index) => {
          if (row && row.length >= 13) {
            processedRows++;
            
            const shopName = row[0]?.toString().trim();
            const brandShort = row[3]?.toString().trim();
            const cases = parseFloat(row[5]) || 0;
            const dateStr = row[7]?.toString().trim();
            const fullBrand = row[10]?.toString().trim();
            const shopId = row[12]?.toString().trim();
            
            if (dateStr && cases > 0) {
              const dateParts = dateStr.split('-');
              if (dateParts.length === 3) {
                const month = dateParts[1]; 
                const yearPart = dateParts[2];
                
                if (month === monthNumber && yearPart === year) {
                  targetMonthRows++;
                  
                  const shopIdentifier = shopId || shopName;
                  if (shopIdentifier) {
                    monthlyUniqueShops.add(shopIdentifier);
                    
                    const parentBrand = getBrandFamily(brandShort, fullBrand);
                    
                    if (parentBrand === "8PM") monthly8PM += cases;
                    else if (parentBrand === "VERVE") monthlyVERVE += cases;

                    if (!monthShopSales[shopIdentifier]) {
                      monthShopSales[shopIdentifier] = { total: 0, eightPM: 0, verve: 0, shopName: shopName };
                      monthShopSKUs[shopIdentifier] = {}; // EXISTING
                      monthShopDetailedSKUs[shopIdentifier] = []; // NEW
                    }
                    
                    monthShopSales[shopIdentifier].total += cases;
                    if (parentBrand === "8PM") monthShopSales[shopIdentifier].eightPM += cases;
                    else if (parentBrand === "VERVE") monthShopSales[shopIdentifier].verve += cases;
                    
                    // EXISTING SKU tracking (PRESERVED)
                    const brandName = fullBrand || brandShort || 'Unknown Brand';
                    const sizeInfo = row[4]?.toString().trim();
                    const enhancedBrandName = sizeInfo ? `${brandName} ${sizeInfo}ml` : brandName;
                    
                    if (!monthShopSKUs[shopIdentifier][enhancedBrandName]) {
                      monthShopSKUs[shopIdentifier][enhancedBrandName] = 0;
                    }
                    monthShopSKUs[shopIdentifier][enhancedBrandName] += cases;
                    
                    // NEW: Store detailed SKU information (ADDITIONAL)
                    const detailedSKUInfo = getDetailedSKUInfo(enhancedBrandName);
                    const existingDetailedSKU = monthShopDetailedSKUs[shopIdentifier].find(
                      sku => sku.displayName === detailedSKUInfo.displayName
                    );
                    
                    if (existingDetailedSKU) {
                      existingDetailedSKU.cases += cases;
                    } else {
                      monthShopDetailedSKUs[shopIdentifier].push({
                        originalBrand: enhancedBrandName,
                        displayName: detailedSKUInfo.displayName,
                        family: detailedSKUInfo.family,
                        variant: detailedSKUInfo.variant,
                        size: detailedSKUInfo.size,
                        cases: cases,
                        percentage: 0,
                        month: `${monthNumber}-${year}`
                      });
                    }
                  }
                }
              }
            }
          }
        });
        
        console.log(`📊 Historical processing results for ${monthNumber}-${year}:`, {
          totalRowsProcessed: processedRows,
          targetMonthRows: targetMonthRows,
          uniqueShops: monthlyUniqueShops.size,
          total8PM: monthly8PM,
          totalVERVE: monthlyVERVE
        });
        
      } else {
        // Use current data source for current and recent months
        console.log(`📊 Processing current data for month ${monthNumber}-${year}`);
        
        const monthChallans = challans.filter(row => 
          row[1] && row[1].toString().includes(`-${monthNumber}-`) && row[1].toString().includes(year)
        );
        
        console.log(`📋 Found ${monthChallans.length} challans for ${monthNumber}-${year}`);

        monthChallans.forEach(row => {
          if (row.length >= 15) {
            const shopId = row[8]?.toString().trim();
            const brand = row[11]?.toString().trim();
            const cases = parseFloat(row[14]) || 0;
            
            if (shopId && brand && cases > 0) {
              monthlyUniqueShops.add(shopId);
              const parentBrand = getBrandFamily(brand, brand);
              
              if (parentBrand === "8PM") monthly8PM += cases;
              else if (parentBrand === "VERVE") monthlyVERVE += cases;

              if (!monthShopSales[shopId]) {
                monthShopSales[shopId] = { total: 0, eightPM: 0, verve: 0 };
                monthShopSKUs[shopId] = {}; // EXISTING
                monthShopDetailedSKUs[shopId] = []; // NEW
              }
              
              monthShopSales[shopId].total += cases;
              if (parentBrand === "8PM") monthShopSales[shopId].eightPM += cases;
              else if (parentBrand === "VERVE") monthShopSales[shopId].verve += cases;
              
              // EXISTING SKU tracking (PRESERVED)
              const sizeInfo = row[12]?.toString().trim();
              const enhancedBrandName = sizeInfo ? `${brand} ${sizeInfo}ml` : brand;
              
              if (!monthShopSKUs[shopId][enhancedBrandName]) {
                monthShopSKUs[shopId][enhancedBrandName] = 0;
              }
              monthShopSKUs[shopId][enhancedBrandName] += cases;
              
              // NEW: Store detailed SKU information (ADDITIONAL)
              const detailedSKUInfo = getDetailedSKUInfo(enhancedBrandName);
              const existingDetailedSKU = monthShopDetailedSKUs[shopId].find(
                sku => sku.displayName === detailedSKUInfo.displayName
              );
              
              if (existingDetailedSKU) {
                existingDetailedSKU.cases += cases;
              } else {
                monthShopDetailedSKUs[shopId].push({
                  originalBrand: enhancedBrandName,
                  displayName: detailedSKUInfo.displayName,
                  family: detailedSKUInfo.family,
                  variant: detailedSKUInfo.variant,
                  size: detailedSKUInfo.size,
                  cases: cases,
                  percentage: 0,
                  month: `${monthNumber}-${year}`
                });
              }
            }
          }
        });
      }

      return { 
        shopSales: monthShopSales, 
        shopSKUs: monthShopSKUs, // EXISTING - PRESERVED
        shopDetailedSKUs: monthShopDetailedSKUs, // NEW - ADDITIONAL
        uniqueShops: monthlyUniqueShops, 
        total8PM: monthly8PM, 
        totalVERVE: monthlyVERVE,
        challans: useHistorical ? [] : challans.filter(row => 
          row[1] && row[1].toString().includes(`-${monthNumber}-`) && row[1].toString().includes(year)
        )
      };
    };

    // ENHANCED: Process 12 months for comprehensive historical analysis (ENHANCED FROM EXISTING)
    const juneData = processMonthlyData(currentMonth, currentYear, false);
    const mayData = processMonthlyData('05', currentYear, false);
    const aprilData = processMonthlyData('04', currentYear, false);
    const marchData = processMonthlyData('03', currentYear, true);
    const februaryData = processMonthlyData('02', currentYear, true);
    const januaryData = processMonthlyData('01', currentYear, true);
    
    // EXTENDED: 12-Month Historical Data
    const decemberData = processMonthlyData('12', '2024', true);
    const novemberData = processMonthlyData('11', '2024', true);
    const octoberData = processMonthlyData('10', '2024', true);
    const septemberData = processMonthlyData('09', '2024', true);
    const augustData = processMonthlyData('08', '2024', true);
    const julyData = processMonthlyData('07', '2024', true);
    
    // YoY COMPARISON
    const juneLastYearData = processMonthlyData(currentMonth, '2024', true);
    
    console.log('📊 ENHANCED 12-MONTH PROCESSING WITH DETAILED SKUs COMPLETE');
    
    // Current month primary data (UNCHANGED)
    const total8PM = juneData.total8PM;
    const totalVERVE = juneData.totalVERVE;
    const uniqueShops = juneData.uniqueShops;

    // ENHANCED SHOP DATA BUILDING WITH DETAILED SKU BREAKDOWN
    const shopSales: Record<string, ShopData> = {};
    
    // EXISTING: Master SKU aggregation (PRESERVED)
    const masterShopSKUs: Record<string, Record<string, number>> = {};
    // NEW: Master detailed SKU aggregation (ADDITIONAL)
    const masterShopDetailedSKUs: Record<string, DetailedSKUData[]> = {};
    
    // Build comprehensive shop name mapping (EXISTING - UNCHANGED)
    const shopNameMap: Record<string, string> = {};
    const shopDetailsMap: Record<string, any> = {};
    
    shopDetails.slice(1).forEach(row => {
      const shopId = row[0]?.toString().trim();
      const salesmanEmail = row[1]?.toString().trim();
      const dept = row[2]?.toString().trim() === "DSIIDC" ? "DSIDC" : row[2]?.toString().trim();
      const shopName = row[3]?.toString().trim();
      const salesman = row[4]?.toString().trim();
      
      if (shopId && shopName) {
        shopNameMap[shopId] = shopName;
        shopDetailsMap[shopId] = { shopName, dept, salesman, salesmanEmail };
        shopNameMap[shopName] = shopName;
        shopDetailsMap[shopName] = { shopName, dept, salesman, shopId, salesmanEmail };
      }
    });

    // EXISTING: Function to merge SKUs from multiple months (PRESERVED)
    const mergeSKUsFromMonth = (monthData: any, shopIdentifierMap: Record<string, string>) => {
      Object.keys(monthData.shopSKUs || {}).forEach(shopIdentifier => {
        const actualShopId = shopIdentifierMap[shopIdentifier] || shopIdentifier;
        const skuData = monthData.shopSKUs[shopIdentifier];
        
        if (!masterShopSKUs[actualShopId]) {
          masterShopSKUs[actualShopId] = {};
        }
        
        Object.keys(skuData).forEach(brand => {
          const cases = skuData[brand];
          if (!masterShopSKUs[actualShopId][brand]) {
            masterShopSKUs[actualShopId][brand] = 0;
          }
          masterShopSKUs[actualShopId][brand] += cases;
        });
      });
    };

    // NEW: Function to merge detailed SKUs from multiple months (ADDITIONAL)
    const mergeDetailedSKUsFromMonth = (monthData: any, shopIdentifierMap: Record<string, string>) => {
      Object.keys(monthData.shopDetailedSKUs || {}).forEach(shopIdentifier => {
        const actualShopId = shopIdentifierMap[shopIdentifier] || shopIdentifier;
        const detailedSKUs = monthData.shopDetailedSKUs[shopIdentifier];
        
        if (!masterShopDetailedSKUs[actualShopId]) {
          masterShopDetailedSKUs[actualShopId] = [];
        }
        
        detailedSKUs.forEach((detailedSKU: DetailedSKUData) => {
          const existingSKU = masterShopDetailedSKUs[actualShopId].find(
            sku => sku.displayName === detailedSKU.displayName
          );
          
          if (existingSKU) {
            existingSKU.cases += detailedSKU.cases;
          } else {
            masterShopDetailedSKUs[actualShopId].push({
              ...detailedSKU,
              month: 'All Months'
            });
          }
        });
      });
    };

    // Build identifier mapping for all shops (EXISTING - UNCHANGED)
    const shopIdentifierMap: Record<string, string> = {};
    
    Object.keys(juneData.shopSales).forEach(shopId => {
      shopIdentifierMap[shopId] = shopId;
    });
    
    [mayData, aprilData, marchData, februaryData, januaryData, juneLastYearData].forEach(monthData => {
      Object.keys(monthData.shopSales).forEach(shopIdentifier => {
        if (!shopIdentifierMap[shopIdentifier]) {
          if (shopDetailsMap[shopIdentifier]) {
            shopIdentifierMap[shopIdentifier] = shopDetailsMap[shopIdentifier].shopId || shopIdentifier;
          } else {
            const matchingShop = shopDetails.slice(1).find(row => 
              row[3]?.toString().trim() === shopIdentifier
            );
            if (matchingShop) {
              shopIdentifierMap[shopIdentifier] = matchingShop[0]?.toString().trim();
            } else {
              shopIdentifierMap[shopIdentifier] = shopIdentifier;
            }
          }
        }
      });
    });

    // EXISTING: Merge SKUs from ALL months (PRESERVED)
    console.log('🔄 MERGING EXISTING SKUs FROM ALL MONTHS...');
    mergeSKUsFromMonth(juneData, shopIdentifierMap);
    mergeSKUsFromMonth(mayData, shopIdentifierMap);
    mergeSKUsFromMonth(aprilData, shopIdentifierMap);
    mergeSKUsFromMonth(marchData, shopIdentifierMap);
    mergeSKUsFromMonth(februaryData, shopIdentifierMap);
    mergeSKUsFromMonth(januaryData, shopIdentifierMap);
    
    // NEW: Merge detailed SKUs from ALL months (ADDITIONAL)
    console.log('🔄 MERGING NEW DETAILED SKUs FROM ALL MONTHS...');
    mergeDetailedSKUsFromMonth(juneData, shopIdentifierMap);
    mergeDetailedSKUsFromMonth(mayData, shopIdentifierMap);
    mergeDetailedSKUsFromMonth(aprilData, shopIdentifierMap);
    mergeDetailedSKUsFromMonth(marchData, shopIdentifierMap);
    mergeDetailedSKUsFromMonth(februaryData, shopIdentifierMap);
    mergeDetailedSKUsFromMonth(januaryData, shopIdentifierMap);
    
    console.log('✅ BOTH EXISTING AND DETAILED SKU BREAKDOWNS COLLECTED:', {
      shopsWithSKUs: Object.keys(masterShopSKUs).length,
      shopsWithDetailedSKUs: Object.keys(masterShopDetailedSKUs).length,
      totalDetailedSKUs: Object.values(masterShopDetailedSKUs).reduce((sum, skus) => sum + skus.length, 0)
    });

    // Process current month data (ALL EXISTING LOGIC PRESERVED)
    juneData.challans.forEach(row => {
      if (row.length >= 15) {
        const shopId = row[8]?.toString().trim();
        const shopNameFromChallan = row[9]?.toString().trim();
        const brand = row[11]?.toString().trim();
        const cases = parseFloat(row[14]) || 0;
        
        if (shopId && brand && cases > 0) {
          const actualShopName = shopNameMap[shopId] || shopNameFromChallan || 'Unknown Shop';
          
          if (!shopSales[shopId]) {
            const shopDetails = shopDetailsMap[shopId] || {};
            shopSales[shopId] = { 
              shopId,
              shopName: actualShopName,
              department: shopDetails.dept || 'Unknown',
              salesman: shopDetails.salesman || 'Unknown',
              total: 0,
              eightPM: 0,
              verve: 0,
              // ROLLING 4-MONTH WINDOW
              marchTotal: 0,
              marchEightPM: 0,
              marchVerve: 0,
              aprilTotal: 0,
              aprilEightPM: 0,
              aprilVerve: 0,
              mayTotal: 0,
              mayEightPM: 0,
              mayVerve: 0,
              juneTotal: 0,
              juneEightPM: 0,
              juneVerve: 0,
              // YoY COMPARISON
              juneLastYearTotal: 0,
              juneLastYearEightPM: 0,
              juneLastYearVerve: 0,
              yoyGrowthPercent: 0,
              monthlyTrend: 'stable',
              skuBreakdown: [], // EXISTING - PRESERVED
              detailedSKUBreakdown: [], // NEW - ADDITIONAL
              threeMonthAvgTotal: 0,
              threeMonthAvg8PM: 0,
              threeMonthAvgVERVE: 0
            };
          }
          
          const parentBrand = getBrandFamily(brand, brand);
          shopSales[shopId].total += cases;
          shopSales[shopId].juneTotal! += cases;
          
          if (parentBrand === "8PM") {
            shopSales[shopId].eightPM += cases;
            shopSales[shopId].juneEightPM! += cases;
          } else if (parentBrand === "VERVE") {
            shopSales[shopId].verve += cases;
            shopSales[shopId].juneVerve! += cases;
          }
        }
      }
    });

    // Add historical data for rolling window + YoY (ALL EXISTING LOGIC PRESERVED)
    [mayData, aprilData, marchData, juneLastYearData].forEach((monthData, index) => {
      const monthKey = index === 0 ? 'may' : index === 1 ? 'april' : index === 2 ? 'march' : 'juneLastYear';
      
      Object.keys(monthData.shopSales).forEach(shopIdentifier => {
        const monthShopData = monthData.shopSales[shopIdentifier];
        
        let actualShopId = shopIdentifierMap[shopIdentifier] || shopIdentifier;
        let actualShopName = monthShopData.shopName || shopIdentifier;
        
        if (shopDetailsMap[shopIdentifier]) {
          const details = shopDetailsMap[shopIdentifier];
          actualShopId = details.shopId || shopIdentifier;
          actualShopName = details.shopName || actualShopName;
        } else {
          const matchingShop = shopDetails.slice(1).find(row => 
            row[3]?.toString().trim() === shopIdentifier
          );
          
          if (matchingShop) {
            actualShopId = matchingShop[0]?.toString().trim();
            actualShopName = matchingShop[3]?.toString().trim();
          } else {
            if (!shopIdentifier.includes('@') && !shopIdentifier.includes('.com')) {
              actualShopName = shopIdentifier;
            }
          }
        }
        
        if (!shopSales[actualShopId]) {
          const shopDetails = shopDetailsMap[actualShopId] || shopDetailsMap[actualShopName] || {};
          shopSales[actualShopId] = {
            shopId: actualShopId,
            shopName: actualShopName,
            department: shopDetails.dept || 'Unknown',
            salesman: shopDetails.salesman || 'Unknown',
            total: 0,
            eightPM: 0,
            verve: 0,
            marchTotal: 0,
            marchEightPM: 0,
            marchVerve: 0,
            aprilTotal: 0,
            aprilEightPM: 0,
            aprilVerve: 0,
            mayTotal: 0,
            mayEightPM: 0,
            mayVerve: 0,
            juneTotal: 0,
            juneEightPM: 0,
            juneVerve: 0,
            juneLastYearTotal: 0,
            juneLastYearEightPM: 0,
            juneLastYearVerve: 0,
            yoyGrowthPercent: 0,
            monthlyTrend: 'declining',
            skuBreakdown: [], // EXISTING
            detailedSKUBreakdown: [], // NEW
            threeMonthAvgTotal: 0,
            threeMonthAvg8PM: 0,
            threeMonthAvgVERVE: 0
          };
        }
        
        // Add historical data (EXISTING LOGIC PRESERVED)
        if (monthKey === 'may') {
          shopSales[actualShopId].mayTotal = monthShopData.total;
          shopSales[actualShopId].mayEightPM = monthShopData.eightPM;
          shopSales[actualShopId].mayVerve = monthShopData.verve;
        } else if (monthKey === 'april') {
          shopSales[actualShopId].aprilTotal = monthShopData.total;
          shopSales[actualShopId].aprilEightPM = monthShopData.eightPM;
          shopSales[actualShopId].aprilVerve = monthShopData.verve;
        } else if (monthKey === 'march') {
          shopSales[actualShopId].marchTotal = monthShopData.total;
          shopSales[actualShopId].marchEightPM = monthShopData.eightPM;
          shopSales[actualShopId].marchVerve = monthShopData.verve;
        } else if (monthKey === 'juneLastYear') {
          shopSales[actualShopId].juneLastYearTotal = monthShopData.total;
          shopSales[actualShopId].juneLastYearEightPM = monthShopData.eightPM;
          shopSales[actualShopId].juneLastYearVerve = monthShopData.verve;
        }
      });
    });

    // ENHANCED: Populate BOTH legacy and detailed SKU breakdowns for ALL shops
    console.log('🔄 POPULATING BOTH EXISTING AND NEW SKU BREAKDOWNS...');
    let totalSKUsPopulated = 0;
    let totalDetailedSKUsPopulated = 0;
    
    Object.keys(shopSales).forEach(shopId => {
      const shop = shopSales[shopId];
      
      // EXISTING: Get complete SKU data for this shop (PRESERVED)
      const shopSKUData = masterShopSKUs[shopId] || {};
      
      // EXISTING: Convert to SKUData format (PRESERVED)
      shop.skuBreakdown = Object.keys(shopSKUData).map(brand => ({
        brand,
        cases: shopSKUData[brand],
        percentage: 0,
        month: 'All Months'
      }));
      
      totalSKUsPopulated += shop.skuBreakdown.length;
      
      // EXISTING: Calculate total for percentage calculation (PRESERVED)
      const totalCases = shop.skuBreakdown.reduce((sum, sku) => sum + sku.cases, 0);
      
      // EXISTING: Calculate percentages and sort (PRESERVED)
      if (totalCases > 0) {
        shop.skuBreakdown.forEach(sku => {
          sku.percentage = Math.round((sku.cases / totalCases) * 100 * 100) / 100;
        });
        shop.skuBreakdown.sort((a, b) => b.cases - a.cases);
      }
      
      // NEW: Get detailed SKU data for this shop (ADDITIONAL)
      const shopDetailedSKUs = masterShopDetailedSKUs[shopId] || [];
      
      // NEW: Populate detailed SKU breakdown with percentages (ADDITIONAL)
      shop.detailedSKUBreakdown = shopDetailedSKUs.map(sku => ({
        ...sku,
        percentage: totalCases > 0 ? Math.round((sku.cases / totalCases) * 100 * 100) / 100 : 0
      })).sort((a, b) => b.cases - a.cases);
      
      totalDetailedSKUsPopulated += shop.detailedSKUBreakdown.length;
    });
    
    console.log('✅ BOTH EXISTING AND NEW SKU BREAKDOWNS POPULATED:', {
      shopsProcessed: Object.keys(shopSales).length,
      totalExistingSKUsPopulated: totalSKUsPopulated,
      totalNewDetailedSKUsPopulated: totalDetailedSKUsPopulated,
      sampleShopExistingSKUs: shopSales[Object.keys(shopSales)[0]]?.skuBreakdown?.slice(0, 3),
      sampleShopNewDetailedSKUs: shopSales[Object.keys(shopSales)[0]]?.detailedSKUBreakdown?.slice(0, 3)
    });

    // ALL REMAINING LOGIC PRESERVED UNCHANGED
    // (Growth calculations, customer insights, department performance, etc.)

    // ENHANCED GROWTH AND TREND CALCULATION WITH YoY + 3-MONTH AVERAGES (UNCHANGED)
    Object.keys(shopSales).forEach(shopId => {
      const shop = shopSales[shopId];
      const june = shop.juneTotal || 0;
      const may = shop.mayTotal || 0;
      const april = shop.aprilTotal || 0;
      const march = shop.marchTotal || 0;
      const juneLastYear = shop.juneLastYearTotal || 0;
      
      // Calculate 3-month averages
      shop.threeMonthAvgTotal = (march + april + may) / 3;
      shop.threeMonthAvg8PM = ((shop.marchEightPM || 0) + (shop.aprilEightPM || 0) + (shop.mayEightPM || 0)) / 3;
      shop.threeMonthAvgVERVE = ((shop.marchVerve || 0) + (shop.aprilVerve || 0) + (shop.mayVerve || 0)) / 3;
      
      // Month-over-month growth
      if (may > 0) {
        shop.growthPercent = Math.round(((june - may) / may) * 100 * 100) / 100;
      } else if (june > 0) {
        shop.growthPercent = 100;
      } else {
        shop.growthPercent = -100;
      }
      
      // YoY growth
      if (juneLastYear > 0) {
        shop.yoyGrowthPercent = Math.round(((june - juneLastYear) / juneLastYear) * 100 * 100) / 100;
      } else if (june > 0) {
        shop.yoyGrowthPercent = 100;
      } else {
        shop.yoyGrowthPercent = 0;
      }
      
      // Enhanced trend logic
      if (march === 0 && april === 0 && may === 0 && june > 0) {
        shop.monthlyTrend = 'new';
      } else if ((march > 0 || april > 0 || may > 0) && june === 0) {
        shop.monthlyTrend = 'declining';
      } else if (march > 0 && april > march && may > april && june > may) {
        shop.monthlyTrend = 'improving';
      } else if (march > 0 && april < march && may < april && june < may && june > 0) {
        shop.monthlyTrend = 'declining';
      } else if (june > 0 && may > 0 && Math.abs(shop.growthPercent!) <= 10) {
        shop.monthlyTrend = 'stable';
      } else if (june > may && may > 0) {
        shop.monthlyTrend = 'improving';
      } else {
        shop.monthlyTrend = 'stable';
      }
    });

    // Enhance shop data with department and salesman info (UNCHANGED)
    shopDetails.slice(1).forEach(row => {
      const shopId = row[0]?.toString().trim();
      const dept = row[2]?.toString().trim() === "DSIIDC" ? "DSIDC" : row[2]?.toString().trim();
      const salesman = row[4]?.toString().trim();
      
      if (shopId && shopSales[shopId]) {
        shopSales[shopId].department = dept || 'Unknown';
        shopSales[shopId].salesman = salesman || 'Unknown';
      }
    });

    // ENHANCED CUSTOMER INSIGHTS ANALYSIS (UNCHANGED)
    const allCurrentShops = Object.values(shopSales).filter(shop => shop.juneTotal! > 0);
    
    const newShops = Object.values(shopSales).filter(shop => 
      shop.juneTotal! > 0 && shop.mayTotal === 0 && shop.aprilTotal === 0 && shop.marchTotal === 0
    );
    
    const lostShops = Object.values(shopSales).filter(shop => 
      shop.juneTotal === 0 && shop.mayTotal! > 0
    );

    const consistentShops = Object.values(shopSales).filter(shop => 
      shop.juneTotal! > 0 && shop.mayTotal! > 0 && 
      (shop.monthlyTrend === 'improving' || (shop.monthlyTrend === 'stable' && shop.growthPercent! >= -5))
    );

    const decliningShops = Object.values(shopSales).filter(shop => 
      shop.monthlyTrend === 'declining' || (shop.juneTotal! > 0 && shop.growthPercent! < -10)
    );

    const customerInsights: CustomerInsights = {
      firstTimeCustomers: newShops.length,
      lostCustomers: lostShops.length,
      consistentPerformers: consistentShops.length,
      decliningPerformers: decliningShops.length,
      newShops: newShops.sort((a, b) => b.juneTotal! - a.juneTotal!),
      lostShops: lostShops.sort((a, b) => b.mayTotal! - a.mayTotal!),
      consistentShops: consistentShops.sort((a, b) => b.growthPercent! - a.growthPercent!),
      decliningShops: decliningShops.sort((a, b) => a.growthPercent! - b.growthPercent!)
    };

    // Sort by 3-month average (UNCHANGED)
    const allShopsComparison = Object.values(shopSales)
      .sort((a, b) => (b.threeMonthAvgTotal! || 0) - (a.threeMonthAvgTotal! || 0));

    // Calculate department performance (UNCHANGED)
    const deptPerformance: Record<string, any> = {};
    shopDetails.slice(1).forEach(row => {
      if (row[0] && row[2]) {
        const shopId = row[0]?.toString().trim();
        const dept = row[2]?.toString().trim() === "DSIIDC" ? "DSIDC" : row[2]?.toString().trim();
        
        if (!deptPerformance[dept]) {
          deptPerformance[dept] = { totalShops: 0, billedShops: 0, sales: 0 };
        }
        deptPerformance[dept].totalShops++;
        
        if (uniqueShops.has(shopId)) {
          deptPerformance[dept].billedShops++;
          deptPerformance[dept].sales += shopSales[shopId]?.total || 0;
        }
      }
    });

    // Process targets for current month (UNCHANGED)
    let total8PMTarget = 0, totalVerveTarget = 0;
    const salespersonStats: Record<string, any> = {};

    const shopToSalesmanMap: Record<string, string> = {};
    shopDetails.slice(1).forEach(row => {
      const shopId = row[0]?.toString().trim();
      const salesmanName = row[4]?.toString().trim();
      if (shopId && salesmanName) {
        shopToSalesmanMap[shopId] = salesmanName;
      }
    });

    targets.slice(1).forEach(row => {
      if (row.length >= 10) {
        const shopId = row[0]?.toString().trim();
        const targetMonth = row[9]?.toString().trim();
        
        const isCurrentMonthTarget = targetMonth && (
          targetMonth.includes(`${currentMonth}-${currentYear}`) ||
          targetMonth.includes(`01-Jun-${currentYear.slice(-2)}`) ||
          targetMonth.includes(`Jun-${currentYear.slice(-2)}`) ||
          targetMonth.toLowerCase().includes(`june ${currentYear}`) ||
          targetMonth.toLowerCase().includes(`jun ${currentYear}`)
        );
        
        if (isCurrentMonthTarget && shopId) {
          const eightPMTarget = parseFloat(row[5]) || 0;
          const verveTarget = parseFloat(row[7]) || 0;
          
          total8PMTarget += eightPMTarget;
          totalVerveTarget += verveTarget;
          
          const salesmanName = shopToSalesmanMap[shopId];
          
          if (salesmanName) {
            if (!salespersonStats[salesmanName]) {
              salespersonStats[salesmanName] = {
                name: salesmanName,
                eightPmTarget: 0,
                verveTarget: 0
              };
            }
            salespersonStats[salesmanName].eightPmTarget += eightPMTarget;
            salespersonStats[salesmanName].verveTarget += verveTarget;
          }
        }
      }
    });

    // Calculate achievements and YoY growth (UNCHANGED)
    const eightPmAchievement = total8PMTarget > 0 ? ((total8PM / total8PMTarget) * 100).toFixed(1) : '0';
    const verveAchievement = totalVerveTarget > 0 ? ((totalVERVE / totalVerveTarget) * 100).toFixed(1) : '0';
    
    const yoy8PMGrowth = juneLastYearData.total8PM > 0 ? 
      (((total8PM - juneLastYearData.total8PM) / juneLastYearData.total8PM) * 100).toFixed(1) : '0';
    const yoyVerveGrowth = juneLastYearData.totalVERVE > 0 ? 
      (((totalVERVE - juneLastYearData.totalVERVE) / juneLastYearData.totalVERVE) * 100).toFixed(1) : '0';

    // Sort topShops by 3-month average (UNCHANGED)
    const topShops = Object.values(shopSales)
      .sort((a, b) => (b.threeMonthAvgTotal! || 0) - (a.threeMonthAvgTotal! || 0))
      .slice(0, 20);

    return {
      summary: {
        totalShops: shopDetails.length - 1,
        billedShops: uniqueShops.size,
        total8PM,
        totalVERVE,
        totalSales: total8PM + totalVERVE,
        coverage: ((uniqueShops.size / (shopDetails.length - 1)) * 100).toFixed(1),
        total8PMTarget,
        totalVerveTarget,
        eightPmAchievement,
        verveAchievement,
        lastYearTotal8PM: juneLastYearData.total8PM,
        lastYearTotalVERVE: juneLastYearData.totalVERVE,
        yoy8PMGrowth,
        yoyVerveGrowth
      },
      topShops,
      deptPerformance,
      salesData: shopSales,
      visitData: visitData.length > 1 ? visitData.length - 1 : 0,
      lastUpdated,
      salespersonStats,
      customerInsights,
      allShopsComparison,
      currentMonth: currentMonth,
      currentYear: currentYear,
      historicalData: {
        // Current rolling window (4 months) - UNCHANGED
        june: juneData,
        may: mayData,
        april: aprilData,
        march: marchData,
        february: februaryData,
        january: januaryData,
        // ENHANCED: Extended 12-month historical data (NEW)
        december2024: decemberData,
        november2024: novemberData,
        october2024: octoberData,
        september2024: septemberData,
        august2024: augustData,
        july2024: julyData,
        // YoY comparison - UNCHANGED
        juneLastYear: juneLastYearData
      }
    };
  };

  const generatePDFReport = async () => {
    if (!dashboardData) return;

    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('Radico Khaitan Enhanced Analytics Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
      doc.text(`Report Period: ${getShortMonthName(currentMonth)} ${currentYear}`, 20, 40);
      
      doc.setFontSize(16);
      doc.text('Executive Summary', 20, 60);
      
      const summaryData = [
        ['Total Shops', dashboardData.summary.totalShops.toString()],
        ['Billed Shops', dashboardData.summary.billedShops.toString()],
        ['Coverage', `${dashboardData.summary.coverage}%`],
        ['8PM Sales', `${dashboardData.summary.total8PM} cases`],
        ['8PM Achievement', `${dashboardData.summary.eightPmAchievement}%`],
        ['8PM YoY Growth', `${dashboardData.summary.yoy8PMGrowth || '0'}%`],
        ['VERVE Sales', `${dashboardData.summary.totalVERVE} cases`],
        ['VERVE Achievement', `${dashboardData.summary.verveAchievement}%`],
        ['VERVE YoY Growth', `${dashboardData.summary.yoyVerveGrowth || '0'}%`],
        ['Total Sales', `${dashboardData.summary.totalSales} cases`]
      ];

      (doc as any).autoTable({
        head: [['Metric', 'Value']],
        body: summaryData,
        startY: 70,
        theme: 'grid'
      });

      doc.save(`Radico_Enhanced_Analytics_${getShortMonthName(currentMonth)}_${currentYear}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Enhanced Radico Dashboard</h2>
          <p className="text-gray-600">Processing live data with detailed SKU analytics for {getMonthName(currentMonth)} {currentYear}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 p-4 rounded-lg mb-4">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Configuration Required</h2>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-left">
            <h3 className="font-medium text-blue-800 mb-2">Setup Instructions:</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Get Google API key from Google Cloud Console</li>
              <li>2. Set NEXT_PUBLIC_GOOGLE_API_KEY environment variable</li>
              <li>3. Set NEXT_PUBLIC_HISTORICAL_SHEET_ID environment variable</li>
              <li>4. Make sure your Google Sheets are publicly accessible</li>
              <li>5. Refresh this page</li>
            </ol>
          </div>
          <button
            onClick={fetchDashboardData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-4 sm:py-0">
            <div className="flex items-center mb-4 sm:mb-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Radico Khaitan Enhanced Analytics Dashboard</h1>
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Live Data - {getShortMonthName(currentMonth)} {currentYear}
              </span>
              {dashboardData?.summary.yoy8PMGrowth && (
                <span className={`ml-2 px-3 py-1 text-xs font-medium rounded-full ${
                  parseFloat(dashboardData.summary.yoy8PMGrowth) >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  YoY: {parseFloat(dashboardData.summary.yoy8PMGrowth) >= 0 ? '+' : ''}{dashboardData.summary.yoy8PMGrowth}%
                </span>
              )}
              {/* ✅ NEW: Show inventory connection status in header */}
              {inventoryData && (
                <span className="ml-2 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  Inventory Connected
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowInventory(!showInventory)}
                  className={`px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm font-medium ${
                    showInventory 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>{showInventory ? 'Sales View' : 'Inventory View'}</span>
                </button>
                
                <button
                  onClick={fetchDashboardData}
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
              </div>
            </div>
          </div>
        </div>
      </header>

      {showInventory ? (
      <InventoryDashboard />
      ) : (
        <>
          <nav className="bg-white border-b overflow-x-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-4 sm:space-x-8 min-w-max">
                {[
                  { id: 'overview', label: 'Sales Overview', icon: BarChart3 },
                  { id: 'shops', label: 'Top Shops', icon: Trophy },
                  { id: 'focus-shops', label: 'Focus Shops', icon: Target },
                  { id: 'department', label: 'Department Analysis', icon: Building },
                  { id: 'salesman', label: 'Salesman Performance', icon: Users },
                  { id: 'analytics', label: 'Advanced Analytics', icon: Activity },
                  { id: 'historical', label: 'Historical Analysis', icon: History }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
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

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {dashboardData && (
              <>
                {activeTab === 'overview' && <OverviewTab data={dashboardData} />}
                {activeTab === 'shops' && <TopShopsTab data={dashboardData} />}
                {activeTab === 'focus-shops' && <FocusShopsTab data={dashboardData} />}
                {activeTab === 'department' && <DepartmentTab data={dashboardData} />}
                {activeTab === 'salesman' && <SalesmanPerformanceTab data={dashboardData} />}
                {/* ✅ FIXED: Now passes populated inventoryData instead of null */}
                {activeTab === 'analytics' && <AdvancedAnalyticsTab data={dashboardData} inventoryData={inventoryData} />}
                {activeTab === 'historical' && <HistoricalAnalysisTab data={dashboardData} />}
              </>
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default RadicoDashboard;
