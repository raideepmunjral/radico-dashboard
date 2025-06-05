'use client';

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, MapPin, TrendingUp, Users, ShoppingBag, BarChart3, Calendar, Trophy, Building, Target, Activity, FileText, Table, X, ChevronLeft, ChevronRight, Star, AlertTriangle, TrendingDown, UserPlus, Search, Filter, History, Package } from 'lucide-react';
import InventoryDashboard from '../components/InventoryDashboard';

// ==========================================
// IMPORTED EXTRACTED COMPONENTS
// ==========================================
import AdvancedAnalyticsTab from '../components/tabs/sales/AdvancedAnalyticsTab';
import HistoricalAnalysisTab from '../components/tabs/sales/HistoricalAnalysisTab';
import SalesmanPerformanceTab from '../components/tabs/sales/SalesmanPerformanceTab';
import FocusShopsTab from '../components/tabs/sales/FocusShopsTab';
import TopShopsTab from '../components/tabs/sales/TopShopsTab';
import DepartmentTab from '../components/tabs/sales/DepartmentTab';
import OverviewTab from '../components/tabs/sales/OverviewTab';

// ==========================================
// PART 1: TYPE DEFINITIONS & INTERFACES
// ==========================================

interface ShopData {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  total: number;
  eightPM: number;
  verve: number;
  // Updated to rolling 4 months: Mar-Apr-May-June
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
  // YoY comparison
  juneLastYearTotal?: number;
  juneLastYearEightPM?: number;
  juneLastYearVerve?: number;
  yoyGrowthPercent?: number;
  growthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
  skuBreakdown?: SKUData[];
  historicalData?: MonthlyData[];
  // NEW: 3-month averages
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
// PART 2: CONFIGURATION & CONSTANTS
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

  // DYNAMIC DATE DETECTION
  const getCurrentMonthYear = () => {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // June = 06
    const currentYear = String(now.getFullYear()); // 2025
    return { currentMonth, currentYear };
  };

  const { currentMonth, currentYear } = getCurrentMonthYear();

  // FIXED CONFIGURATION WITH PROPER HISTORICAL DATA SHEET
  const SHEETS_CONFIG = {
    masterSheetId: process.env.NEXT_PUBLIC_MASTER_SHEET_ID || '1pRz9CgOoamTrFipnmF-XuBCg9IZON9br5avgRlKYtxM',
    visitSheetId: process.env.NEXT_PUBLIC_VISIT_SHEET_ID || '1XG4c_Lrpk-YglTq3G3ZY9Qjt7wSnUq0UZWDSYT61eWE',
    historicalSheetId: process.env.NEXT_PUBLIC_HISTORICAL_SHEET_ID || '1yXzEYHJeHlETrEmU4TZ9F2_qv4OE10N4DPdYX0Iqfx0',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  };

  // ENHANCED BRAND FAMILY MAPPING
  const brandFamily: Record<string, string> = {
    // Historical Data Brand Short Variations
    "VERVE": "VERVE",
    "8 PM BLACK": "8PM", 
    "8PM BLACK": "8PM",
    "8PM": "8PM",
    "8 PM": "8PM",
    
    // Current Data Variations from Pending Challans
    "8 PM PREMIUM BLACK BLENDED WHISKY": "8PM",
    "8 PM PREMIUM BLACK BLENDED WHISKY Pet": "8PM",
    "8 PM PREMIUM BLACK BLENDED WHISKY PET": "8PM",
    "8 PM BLACK 750": "8PM",
    "8 PM BLACK 375": "8PM",
    "8 PM BLACK 180 P": "8PM",
    "8 PM BLACK 90": "8PM",
    "8 PM BLACK 60 P": "8PM",
    "8PM PREMIUM BLACK BLENDED WHISKY": "8PM",
    "8PM PREMIUM BLACK SUPERIOR WHISKY": "8PM",
    
    // VERVE Variations
    "M2M VERVE CRANBERRY TEASE SP FL VODKA": "VERVE",
    "M2M VERVE GREEN APPLE SUPERIOR FL. VODKA": "VERVE",
    "M2M VERVE LEMON LUSH SUP FL VODKA": "VERVE",
    "M2M VERVE SUPERIOR GRAIN VODKA": "VERVE",
    "VERVE CRANBERRY 750": "VERVE",
    "VERVE CRANBERRY 375": "VERVE",
    "VERVE CRANBERRY 180": "VERVE",
    "VERVE GREEN APPLE 750": "VERVE",
    "VERVE GREEN APPLE 375": "VERVE",
    "VERVE GREEN APPLE 180": "VERVE",
    "VERVE LEMON LUSH 750": "VERVE",
    "VERVE LEMON LUSH 375": "VERVE",
    "VERVE LEMON LUSH 180": "VERVE",
    "VERVE GRAIN 750": "VERVE",
    "VERVE GRAIN 375": "VERVE",
    "VERVE GRAIN 180": "VERVE",
    
    // Full brand name patterns from historical data
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
  // PART 3: DATA FETCHING FUNCTIONS
  // ==========================================

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!SHEETS_CONFIG.apiKey) {
        throw new Error('Google API key not configured. Please set NEXT_PUBLIC_GOOGLE_API_KEY environment variable.');
      }

      const [masterData, visitData, historicalData] = await Promise.all([
        fetchMasterSheetData(),
        fetchVisitSheetData(),
        fetchHistoricalSheetData()
      ]);
      
      const processedData = processEnhancedRadicoData(masterData, visitData, historicalData);
      setDashboardData(processedData);
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
  // PART 4: ENHANCED DATA PROCESSING WITH COMPLETE SKU BREAKDOWN
  // ==========================================

  const processEnhancedRadicoData = (masterData: Record<string, any[]>, visitData: any[], historicalData: any[]): DashboardData => {
    const shopDetails = masterData['Shop Details'] || [];
    const targets = masterData['Target Vs Achievement'] || [];
    const challans = masterData['Pending Challans'] || [];
    
    console.log(`🔧 PROCESSING DATA WITH DYNAMIC MONTH DETECTION: ${currentMonth}-${currentYear}`);
    console.log('🔄 ROLLING 4-MONTH WINDOW: Mar-Apr-May-Jun 2025 + YoY (Jun 2024)');
    
    // ENHANCED MONTHLY DATA PROCESSING WITH COMPLETE SKU BREAKDOWN
    const processMonthlyData = (monthNumber: string, year: string = currentYear, useHistorical: boolean = false) => {
      let monthShopSales: Record<string, any> = {};
      let monthShopSKUs: Record<string, Record<string, number>> = {}; // NEW: Track SKUs per shop
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
                      monthShopSKUs[shopIdentifier] = {}; // Initialize SKU tracking
                    }
                    
                    monthShopSales[shopIdentifier].total += cases;
                    if (parentBrand === "8PM") monthShopSales[shopIdentifier].eightPM += cases;
                    else if (parentBrand === "VERVE") monthShopSales[shopIdentifier].verve += cases;
                    
                    // NEW: Track individual SKUs
                    const brandName = fullBrand || brandShort || 'Unknown Brand';
                    if (!monthShopSKUs[shopIdentifier][brandName]) {
                      monthShopSKUs[shopIdentifier][brandName] = 0;
                    }
                    monthShopSKUs[shopIdentifier][brandName] += cases;
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
                monthShopSKUs[shopId] = {}; // Initialize SKU tracking
              }
              
              monthShopSales[shopId].total += cases;
              if (parentBrand === "8PM") monthShopSales[shopId].eightPM += cases;
              else if (parentBrand === "VERVE") monthShopSales[shopId].verve += cases;
              
              // NEW: Track individual SKUs
              if (!monthShopSKUs[shopId][brand]) {
                monthShopSKUs[shopId][brand] = 0;
              }
              monthShopSKUs[shopId][brand] += cases;
            }
          }
        });
      }

      return { 
        shopSales: monthShopSales, 
        shopSKUs: monthShopSKUs, // NEW: Return SKU data
        uniqueShops: monthlyUniqueShops, 
        total8PM: monthly8PM, 
        totalVERVE: monthlyVERVE,
        challans: useHistorical ? [] : challans.filter(row => 
          row[1] && row[1].toString().includes(`-${monthNumber}-`) && row[1].toString().includes(year)
        )
      };
    };

    // ENHANCED: Process 12 months for comprehensive historical analysis
    // Current rolling window: Mar-Apr-May-June 2025
    // Extended historical: Jul 2024 - June 2025 (12 months)
    const juneData = processMonthlyData(currentMonth, currentYear, false); // June 2025 from current
    const mayData = processMonthlyData('05', currentYear, false); // May 2025 from current
    const aprilData = processMonthlyData('04', currentYear, false); // April 2025 from current  
    const marchData = processMonthlyData('03', currentYear, true); // March 2025 from historical
    const februaryData = processMonthlyData('02', currentYear, true); // February 2025 from historical
    const januaryData = processMonthlyData('01', currentYear, true); // January 2025 from historical
    
    // EXTENDED: 12-Month Historical Data (Jul 2024 - Dec 2024)
    const decemberData = processMonthlyData('12', '2024', true); // December 2024
    const novemberData = processMonthlyData('11', '2024', true); // November 2024
    const octoberData = processMonthlyData('10', '2024', true); // October 2024
    const septemberData = processMonthlyData('09', '2024', true); // September 2024
    const augustData = processMonthlyData('08', '2024', true); // August 2024
    const julyData = processMonthlyData('07', '2024', true); // July 2024
    
    // YoY COMPARISON: June 2024
    const juneLastYearData = processMonthlyData(currentMonth, '2024', true); // June 2024 from historical
    
    console.log('📊 EXTENDED 12-MONTH PROCESSING RESULTS:');
    console.log(`${currentMonth}/${currentYear}:`, { total8PM: juneData.total8PM, totalVERVE: juneData.totalVERVE, shops: juneData.uniqueShops.size });
    console.log('May/2025:', { total8PM: mayData.total8PM, totalVERVE: mayData.totalVERVE, shops: mayData.uniqueShops.size });
    console.log('April/2025:', { total8PM: aprilData.total8PM, totalVERVE: aprilData.totalVERVE, shops: aprilData.uniqueShops.size });
    console.log('March/2025:', { total8PM: marchData.total8PM, totalVERVE: marchData.totalVERVE, shops: marchData.uniqueShops.size });
    console.log('12-Month Historical Range:', 'Jul 2024 - Jun 2025');
    console.log(`${currentMonth}/2024 (YoY):`, { total8PM: juneLastYearData.total8PM, totalVERVE: juneLastYearData.totalVERVE, shops: juneLastYearData.uniqueShops.size });
    
    // Current month primary data
    const total8PM = juneData.total8PM;
    const totalVERVE = juneData.totalVERVE;
    const uniqueShops = juneData.uniqueShops;

    // ENHANCED SHOP DATA BUILDING WITH COMPLETE SKU BREAKDOWN
    const shopSales: Record<string, ShopData> = {};
    
    // NEW: Master SKU aggregation across ALL months for each shop
    const masterShopSKUs: Record<string, Record<string, number>> = {};
    
    // Build comprehensive shop name mapping
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

    // NEW: Function to merge SKUs from multiple months
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

    // Build identifier mapping for all shops
    const shopIdentifierMap: Record<string, string> = {};
    
    // Map current month shop IDs
    Object.keys(juneData.shopSales).forEach(shopId => {
      shopIdentifierMap[shopId] = shopId;
    });
    
    // Map historical shop identifiers to actual shop IDs
    [mayData, aprilData, marchData, februaryData, januaryData, juneLastYearData].forEach(monthData => {
      Object.keys(monthData.shopSales).forEach(shopIdentifier => {
        if (!shopIdentifierMap[shopIdentifier]) {
          // Try to find the actual shop ID
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

    // NEW: Merge SKUs from ALL months
    console.log('🔄 MERGING SKUs FROM ALL MONTHS...');
    mergeSKUsFromMonth(juneData, shopIdentifierMap);
    mergeSKUsFromMonth(mayData, shopIdentifierMap);
    mergeSKUsFromMonth(aprilData, shopIdentifierMap);
    mergeSKUsFromMonth(marchData, shopIdentifierMap);
    mergeSKUsFromMonth(februaryData, shopIdentifierMap);
    mergeSKUsFromMonth(januaryData, shopIdentifierMap);
    
    console.log('✅ COMPLETE SKU BREAKDOWN COLLECTED:', {
      shopsWithSKUs: Object.keys(masterShopSKUs).length,
      sampleShopSKUs: Object.keys(masterShopSKUs)[0] ? Object.keys(masterShopSKUs[Object.keys(masterShopSKUs)[0]]) : []
    });

    // Process current month data (June 2025) - KEEP EXISTING LOGIC
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
              skuBreakdown: [], // Will be populated from masterShopSKUs
              // NEW: 3-month averages
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

    // Add historical data for rolling window + YoY - KEEP EXISTING LOGIC
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
            skuBreakdown: [], // Will be populated from masterShopSKUs
            threeMonthAvgTotal: 0,
            threeMonthAvg8PM: 0,
            threeMonthAvgVERVE: 0
          };
        }
        
        // Add historical data
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

    // NEW: Populate complete SKU breakdown for ALL shops
    console.log('🔄 POPULATING COMPLETE SKU BREAKDOWN...');
    let totalSKUsPopulated = 0;
    
    Object.keys(shopSales).forEach(shopId => {
      const shop = shopSales[shopId];
      
      // Get complete SKU data for this shop
      const shopSKUData = masterShopSKUs[shopId] || {};
      
      // Convert to SKUData format
      shop.skuBreakdown = Object.keys(shopSKUData).map(brand => ({
        brand,
        cases: shopSKUData[brand],
        percentage: 0, // Will be calculated below
        month: 'All Months'
      }));
      
      totalSKUsPopulated += shop.skuBreakdown.length;
      
      // Calculate total for percentage calculation
      const totalCases = shop.skuBreakdown.reduce((sum, sku) => sum + sku.cases, 0);
      
      // Calculate percentages and sort
      if (totalCases > 0) {
        shop.skuBreakdown.forEach(sku => {
          sku.percentage = Math.round((sku.cases / totalCases) * 100 * 100) / 100;
        });
        shop.skuBreakdown.sort((a, b) => b.cases - a.cases);
      }
    });
    
    console.log('✅ COMPLETE SKU BREAKDOWN POPULATED:', {
      shopsProcessed: Object.keys(shopSales).length,
      totalSKUsPopulated,
      sampleShopSKUs: shopSales[Object.keys(shopSales)[0]]?.skuBreakdown?.slice(0, 3)
    });

    // ENHANCED GROWTH AND TREND CALCULATION WITH YoY + 3-MONTH AVERAGES - KEEP EXISTING LOGIC
    Object.keys(shopSales).forEach(shopId => {
      const shop = shopSales[shopId];
      const june = shop.juneTotal || 0;
      const may = shop.mayTotal || 0;
      const april = shop.aprilTotal || 0;
      const march = shop.marchTotal || 0;
      const juneLastYear = shop.juneLastYearTotal || 0;
      
      // NEW: Calculate 3-month averages (Mar-Apr-May only)
      shop.threeMonthAvgTotal = (march + april + may) / 3;
      shop.threeMonthAvg8PM = ((shop.marchEightPM || 0) + (shop.aprilEightPM || 0) + (shop.mayEightPM || 0)) / 3;
      shop.threeMonthAvgVERVE = ((shop.marchVerve || 0) + (shop.aprilVerve || 0) + (shop.mayVerve || 0)) / 3;
      
      // Month-over-month growth (May to June)
      if (may > 0) {
        shop.growthPercent = Math.round(((june - may) / may) * 100 * 100) / 100;
      } else if (june > 0) {
        shop.growthPercent = 100;
      } else {
        shop.growthPercent = -100;
      }
      
      // YoY growth (June 2024 to June 2025)
      if (juneLastYear > 0) {
        shop.yoyGrowthPercent = Math.round(((june - juneLastYear) / juneLastYear) * 100 * 100) / 100;
      } else if (june > 0) {
        shop.yoyGrowthPercent = 100;
      } else {
        shop.yoyGrowthPercent = 0;
      }
      
      // ENHANCED TREND LOGIC (4 MONTHS)
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

    // Enhance shop data with department and salesman info - KEEP EXISTING LOGIC
    shopDetails.slice(1).forEach(row => {
      const shopId = row[0]?.toString().trim();
      const dept = row[2]?.toString().trim() === "DSIIDC" ? "DSIDC" : row[2]?.toString().trim();
      const salesman = row[4]?.toString().trim();
      
      if (shopId && shopSales[shopId]) {
        shopSales[shopId].department = dept || 'Unknown';
        shopSales[shopId].salesman = salesman || 'Unknown';
      }
    });

    // ENHANCED CUSTOMER INSIGHTS ANALYSIS (ROLLING 4 MONTHS) - KEEP EXISTING LOGIC
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

    console.log('🎯 ENHANCED CUSTOMER INSIGHTS SUMMARY (ROLLING 4 MONTHS):', {
      firstTime: customerInsights.firstTimeCustomers,
      lost: customerInsights.lostCustomers,
      consistent: customerInsights.consistentPerformers,
      declining: customerInsights.decliningPerformers
    });

    // NEW: Sort allShopsComparison by 3-month average (Mar-Apr-May)
    const allShopsComparison = Object.values(shopSales)
      .sort((a, b) => (b.threeMonthAvgTotal! || 0) - (a.threeMonthAvgTotal! || 0));

    // Calculate department performance - KEEP EXISTING LOGIC
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

    // Process targets for current month - KEEP EXISTING LOGIC
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

    // Process targets for current month (FIXED DATE FORMAT HANDLING)
    targets.slice(1).forEach(row => {
      if (row.length >= 10) {
        const shopId = row[0]?.toString().trim();
        const targetMonth = row[9]?.toString().trim();
        
        // FIXED: Handle multiple date formats for June 2025
        // Formats: "06-2025", "01-Jun-25", "June 2025", etc.
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

    // Calculate achievements and YoY growth - KEEP EXISTING LOGIC
    const eightPmAchievement = total8PMTarget > 0 ? ((total8PM / total8PMTarget) * 100).toFixed(1) : '0';
    const verveAchievement = totalVerveTarget > 0 ? ((totalVERVE / totalVerveTarget) * 100).toFixed(1) : '0';
    
    // YoY growth calculations
    const yoy8PMGrowth = juneLastYearData.total8PM > 0 ? 
      (((total8PM - juneLastYearData.total8PM) / juneLastYearData.total8PM) * 100).toFixed(1) : '0';
    const yoyVerveGrowth = juneLastYearData.totalVERVE > 0 ? 
      (((totalVERVE - juneLastYearData.totalVERVE) / juneLastYearData.totalVERVE) * 100).toFixed(1) : '0';

    // NEW: Sort topShops by 3-month average instead of current month
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
        // Current rolling window (4 months)
        june: juneData,
        may: mayData,
        april: aprilData,
        march: marchData,
        february: februaryData,
        january: januaryData,
        // Extended 12-month historical data
        december2024: decemberData,
        november2024: novemberData,
        october2024: octoberData,
        september2024: septemberData,
        august2024: augustData,
        july2024: julyData,
        // YoY comparison
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
      doc.text('Radico Khaitan Advanced Analytics Report', 20, 20);
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Radico Dashboard</h2>
          <p className="text-gray-600">Processing live data with enhanced analytics for {getMonthName(currentMonth)} {currentYear}...</p>
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Radico Khaitan Analytics Dashboard</h1>
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
                {activeTab === 'analytics' && <AdvancedAnalyticsTab data={dashboardData} />}
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
