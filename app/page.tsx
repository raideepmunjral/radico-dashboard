'use client';

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, MapPin, TrendingUp, Users, ShoppingBag, BarChart3, Calendar, Trophy, Building, Target, Activity, FileText, Table, X, ChevronLeft, ChevronRight, Star, AlertTriangle, TrendingDown, UserPlus, Search, Filter, History, Package } from 'lucide-react';
import InventoryDashboard from '../components/InventoryDashboard';

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

interface FilterState {
  department: string;
  salesman: string;
  shop: string;
  searchText: string;
}

// NEW: Enhanced Filter State for Top Shops
interface TopShopsFilterState {
  department: string;
  salesman: string;
  searchText: string;
  minCases: string;
  performanceTrend: string;
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
  const [showSKUModal, setShowSKUModal] = useState(false);
  const [selectedShopSKU, setSelectedShopSKU] = useState<ShopData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [filters, setFilters] = useState<FilterState>({
    department: '',
    salesman: '',
    shop: '',
    searchText: ''
  });
  const [showInventory, setShowInventory] = useState(false);

  // NEW: Top Shops specific state
  const [topShopsCurrentPage, setTopShopsCurrentPage] = useState(1);
  const [topShopsItemsPerPage] = useState(25);
  const [topShopsFilters, setTopShopsFilters] = useState<TopShopsFilterState>({
    department: '',
    salesman: '',
    searchText: '',
    minCases: '',
    performanceTrend: ''
  });

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
  // PART 4: ENHANCED DATA PROCESSING WITH DYNAMIC MONTH DETECTION & YoY
  // ==========================================

  const processEnhancedRadicoData = (masterData: Record<string, any[]>, visitData: any[], historicalData: any[]): DashboardData => {
    const shopDetails = masterData['Shop Details'] || [];
    const targets = masterData['Target Vs Achievement'] || [];
    const challans = masterData['Pending Challans'] || [];
    
    console.log(`🔧 PROCESSING DATA WITH DYNAMIC MONTH DETECTION: ${currentMonth}-${currentYear}`);
    console.log('🔄 ROLLING 4-MONTH WINDOW: Mar-Apr-May-Jun 2025 + YoY (Jun 2024)');
    
    // ENHANCED MONTHLY DATA PROCESSING WITH DYNAMIC DATES
    const processMonthlyData = (monthNumber: string, year: string = currentYear, useHistorical: boolean = false) => {
      let monthShopSales: Record<string, any> = {};
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
                    }
                    
                    monthShopSales[shopIdentifier].total += cases;
                    if (parentBrand === "8PM") monthShopSales[shopIdentifier].eightPM += cases;
                    else if (parentBrand === "VERVE") monthShopSales[shopIdentifier].verve += cases;
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
        console.log(`📋 Sample challan dates:`, challans.slice(0, 5).map(row => row[1]?.toString()));

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
              }
              
              monthShopSales[shopId].total += cases;
              if (parentBrand === "8PM") monthShopSales[shopId].eightPM += cases;
              else if (parentBrand === "VERVE") monthShopSales[shopId].verve += cases;
            }
          }
        });
      }

      return { 
        shopSales: monthShopSales, 
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

    // ENHANCED SHOP DATA BUILDING WITH ROLLING 4-MONTH + YoY
    const shopSales: Record<string, ShopData> = {};
    
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

    // Process current month data (June 2025)
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
              skuBreakdown: [],
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

          const existing = shopSales[shopId].skuBreakdown!.find(sku => sku.brand === brand);
          if (existing) {
            existing.cases += cases;
          } else {
            shopSales[shopId].skuBreakdown!.push({ brand, cases, percentage: 0, month: 'June' });
          }
        }
      }
    });

    // Add historical data for rolling window + YoY
    [mayData, aprilData, marchData, juneLastYearData].forEach((monthData, index) => {
      const monthKey = index === 0 ? 'may' : index === 1 ? 'april' : index === 2 ? 'march' : 'juneLastYear';
      
      Object.keys(monthData.shopSales).forEach(shopIdentifier => {
        const monthShopData = monthData.shopSales[shopIdentifier];
        
        let actualShopId = shopIdentifier;
        let actualShopName = monthShopData.shopName || shopIdentifier;
        
        if (shopDetailsMap[shopIdentifier]) {
          const details = shopDetailsMap[shopIdentifier];
          actualShopId = details.shopId || shopIdentifier;
          actualShopName = details.shopName || actualShopName;
        } else {
          const matchingShop = shopDetails.slice(1).find(row => 
            row[1]?.toString().trim() === shopIdentifier
          );
          
          if (matchingShop) {
            actualShopId = matchingShop[0]?.toString().trim();
            actualShopName = matchingShop[1]?.toString().trim();
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
            skuBreakdown: [],
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

    // ENHANCED GROWTH AND TREND CALCULATION WITH YoY + 3-MONTH AVERAGES
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

      // Calculate SKU percentages
      if (shop.total > 0) {
        shop.skuBreakdown!.forEach(sku => {
          sku.percentage = Math.round((sku.cases / shop.total) * 100 * 100) / 100;
        });
        shop.skuBreakdown!.sort((a, b) => b.cases - a.cases);
      }
    });

    // Enhance shop data with department and salesman info
    shopDetails.slice(1).forEach(row => {
      const shopId = row[0]?.toString().trim();
      const dept = row[2]?.toString().trim() === "DSIIDC" ? "DSIDC" : row[2]?.toString().trim();
      const salesman = row[4]?.toString().trim();
      
      if (shopId && shopSales[shopId]) {
        shopSales[shopId].department = dept || 'Unknown';
        shopSales[shopId].salesman = salesman || 'Unknown';
      }
    });

    // ENHANCED CUSTOMER INSIGHTS ANALYSIS (ROLLING 4 MONTHS)
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

    // Calculate department performance
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

    // Process targets for current month
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
          
          console.log(`✅ Found target for shop ${shopId}: 8PM=${eightPMTarget}, VERVE=${verveTarget}, Month=${targetMonth}`);
          
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

    console.log('🎯 FIXED TARGET PROCESSING RESULTS:', {
      total8PMTarget,
      totalVerveTarget,
      salespersonStats: Object.keys(salespersonStats).length
    });

    // Calculate achievements and YoY growth
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

  // Filter and utility functions remain the same...
  const getFilteredShops = (shops: ShopData[]): ShopData[] => {
    return shops.filter(shop => {
      const matchesDepartment = !filters.department || shop.department === filters.department;
      const matchesSalesman = !filters.salesman || shop.salesman === filters.salesman;
      const matchesShop = !filters.shop || shop.shopName.toLowerCase().includes(filters.shop.toLowerCase());
      const matchesSearch = !filters.searchText || 
        shop.shopName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        shop.department.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        shop.salesman.toLowerCase().includes(filters.searchText.toLowerCase());
      
      return matchesDepartment && matchesSalesman && matchesShop && matchesSearch;
    });
  };

  // NEW: Filtered shops function for Top Shops tab
  const getFilteredTopShops = (shops: ShopData[]): ShopData[] => {
    return shops.filter(shop => {
      const matchesDepartment = !topShopsFilters.department || shop.department === topShopsFilters.department;
      const matchesSalesman = !topShopsFilters.salesman || shop.salesman === topShopsFilters.salesman;
      const matchesSearch = !topShopsFilters.searchText || 
        shop.shopName.toLowerCase().includes(topShopsFilters.searchText.toLowerCase()) ||
        shop.department.toLowerCase().includes(topShopsFilters.searchText.toLowerCase()) ||
        shop.salesman.toLowerCase().includes(topShopsFilters.searchText.toLowerCase());
      const matchesMinCases = !topShopsFilters.minCases || (shop.threeMonthAvgTotal! >= parseFloat(topShopsFilters.minCases));
      const matchesTrend = !topShopsFilters.performanceTrend || shop.monthlyTrend === topShopsFilters.performanceTrend;
      
      return matchesDepartment && matchesSalesman && matchesSearch && matchesMinCases && matchesTrend;
    });
  };

  const getFilterOptions = (shops: ShopData[], field: keyof ShopData): string[] => {
    const values = shops.map(shop => shop[field] as string).filter(Boolean);
    return Array.from(new Set(values)).sort();
  };

  // NEW: CSV Export function for Top Shops
  const exportTopShopsToCSV = async () => {
    if (!dashboardData) return;

    try {
      const filteredShops = getFilteredTopShops(dashboardData.allShopsComparison);
      
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `Radico Top Shops Detailed Analysis Report - ${new Date().toLocaleDateString()}\n`;
      csvContent += `Report Period: Mar-Apr-May-${getShortMonthName(currentMonth)} ${currentYear}\n`;
      csvContent += `Sorted by: 3-Month Average Performance (Mar-Apr-May)\n`;
      
      if (topShopsFilters.department || topShopsFilters.salesman || topShopsFilters.searchText || topShopsFilters.minCases || topShopsFilters.performanceTrend) {
        csvContent += "APPLIED FILTERS: ";
        if (topShopsFilters.department) csvContent += `Department: ${topShopsFilters.department}, `;
        if (topShopsFilters.salesman) csvContent += `Salesman: ${topShopsFilters.salesman}, `;
        if (topShopsFilters.searchText) csvContent += `Search: ${topShopsFilters.searchText}, `;
        if (topShopsFilters.minCases) csvContent += `Min Cases: ${topShopsFilters.minCases}, `;
        if (topShopsFilters.performanceTrend) csvContent += `Trend: ${topShopsFilters.performanceTrend}`;
        csvContent += "\n";
      }
      csvContent += "\n";
      
      csvContent += "EXECUTIVE SUMMARY\n";
      csvContent += "Total Shops," + dashboardData.summary.totalShops + "\n";
      csvContent += "Filtered Shops," + filteredShops.length + "\n";
      csvContent += "Top 3-Month Avg," + (filteredShops[0]?.threeMonthAvgTotal?.toFixed(1) || 0) + " cases\n\n";
      
      csvContent += `DETAILED SHOP ANALYSIS (Mar-Apr-May-${getShortMonthName(currentMonth)} ${currentYear})\n`;
      csvContent += `Rank,Shop Name,Department,Salesman,Mar Total,Mar 8PM,Mar VERVE,Apr Total,Apr 8PM,Apr VERVE,May Total,May 8PM,May VERVE,${getShortMonthName(currentMonth)} Total,${getShortMonthName(currentMonth)} 8PM,${getShortMonthName(currentMonth)} VERVE,3M Avg Total,3M Avg 8PM,3M Avg VERVE,Growth %,YoY Growth %,Monthly Trend\n`;
      
      filteredShops.forEach((shop, index) => {
        csvContent += `${index + 1},"${shop.shopName}","${shop.department}","${shop.salesman}",${shop.marchTotal || 0},${shop.marchEightPM || 0},${shop.marchVerve || 0},${shop.aprilTotal || 0},${shop.aprilEightPM || 0},${shop.aprilVerve || 0},${shop.mayTotal || 0},${shop.mayEightPM || 0},${shop.mayVerve || 0},${shop.juneTotal || shop.total},${shop.juneEightPM || shop.eightPM},${shop.juneVerve || shop.verve},${shop.threeMonthAvgTotal?.toFixed(1) || 0},${shop.threeMonthAvg8PM?.toFixed(1) || 0},${shop.threeMonthAvgVERVE?.toFixed(1) || 0},${shop.growthPercent?.toFixed(1) || 0}%,${shop.yoyGrowthPercent?.toFixed(1) || 0}%,"${shop.monthlyTrend || 'stable'}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Radico_Top_Shops_Detailed_Analysis_${getShortMonthName(currentMonth)}_${currentYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting Top Shops CSV:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  // Enhanced SKU Modal Component
  const EnhancedSKUModal = ({ shop, onClose }: { shop: ShopData, onClose: () => void }) => {
    const [activeMonth, setActiveMonth] = useState(getShortMonthName(currentMonth));
    
    const getSKUDataForMonth = (month: string) => {
      if (month === getShortMonthName(currentMonth)) {
        return shop.skuBreakdown || [];
      }
      return [];
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-lg font-semibold">SKU Analysis - {shop.shopName}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex border-b">
            {['March', 'April', 'May', getShortMonthName(currentMonth)].map((month) => (
              <button
                key={month}
                onClick={() => setActiveMonth(month)}
                className={`px-6 py-3 font-medium ${
                  activeMonth === month
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {month} {currentYear}
              </button>
            ))}
          </div>

          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {activeMonth === getShortMonthName(currentMonth) ? shop.juneTotal || shop.total :
                   activeMonth === 'May' ? shop.mayTotal || 0 :
                   activeMonth === 'April' ? shop.aprilTotal || 0 :
                   shop.marchTotal || 0}
                </div>
                <div className="text-sm text-gray-500">Total Cases</div>
              </div>
              <div className="text-center bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {activeMonth === getShortMonthName(currentMonth) ? shop.juneEightPM || shop.eightPM :
                   activeMonth === 'May' ? shop.mayEightPM || 0 :
                   activeMonth === 'April' ? shop.aprilEightPM || 0 :
                   shop.marchEightPM || 0}
                </div>
                <div className="text-sm text-gray-500">8PM Cases</div>
              </div>
              <div className="text-center bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {activeMonth === getShortMonthName(currentMonth) ? shop.juneVerve || shop.verve :
                   activeMonth === 'May' ? shop.mayVerve || 0 :
                   activeMonth === 'April' ? shop.aprilVerve || 0 :
                   shop.marchVerve || 0}
                </div>
                <div className="text-sm text-gray-500">VERVE Cases</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand/SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cases</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getSKUDataForMonth(activeMonth).map((sku, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4 text-sm text-gray-900">{sku.brand}</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{sku.cases}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{sku.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
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

  const exportToExcel = async () => {
    if (!dashboardData) return;

    try {
      const filteredShops = getFilteredShops(dashboardData.allShopsComparison);
      
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `Radico Enhanced Shop Analysis Report - Rolling 4-Month Comparison - ${new Date().toLocaleDateString()}\n`;
      csvContent += `Report Period: Mar-Apr-May-${getShortMonthName(currentMonth)} ${currentYear}\n`;
      
      if (filters.department || filters.salesman || filters.searchText) {
        csvContent += "APPLIED FILTERS: ";
        if (filters.department) csvContent += `Department: ${filters.department}, `;
        if (filters.salesman) csvContent += `Salesman: ${filters.salesman}, `;
        if (filters.searchText) csvContent += `Search: ${filters.searchText}`;
        csvContent += "\n";
      }
      csvContent += "\n";
      
      csvContent += "EXECUTIVE SUMMARY\n";
      csvContent += "Total Shops," + dashboardData.summary.totalShops + "\n";
      csvContent += "Billed Shops," + dashboardData.summary.billedShops + "\n";
      csvContent += "Coverage," + dashboardData.summary.coverage + "%\n";
      csvContent += "8PM Sales," + dashboardData.summary.total8PM + " cases\n";
      csvContent += "8PM YoY Growth," + (dashboardData.summary.yoy8PMGrowth || '0') + "%\n";
      csvContent += "VERVE Sales," + dashboardData.summary.totalVERVE + " cases\n";
      csvContent += "VERVE YoY Growth," + (dashboardData.summary.yoyVerveGrowth || '0') + "%\n\n";
      
      csvContent += "CUSTOMER INSIGHTS\n";
      csvContent += "First-time Customers," + dashboardData.customerInsights.firstTimeCustomers + "\n";
      csvContent += "Lost Customers," + dashboardData.customerInsights.lostCustomers + "\n";
      csvContent += "Consistent Performers," + dashboardData.customerInsights.consistentPerformers + "\n";
      csvContent += "Declining Performers," + dashboardData.customerInsights.decliningPerformers + "\n\n";
      
      csvContent += `ROLLING WINDOW SHOP COMPARISON (Mar-Apr-May-${getShortMonthName(currentMonth)} ${currentYear})\n`;
      csvContent += `Shop Name,Department,Salesman,Mar Cases,Apr Cases,May Cases,${getShortMonthName(currentMonth)} Cases,8PM Cases,VERVE Cases,Growth %,YoY Growth %,Monthly Trend\n`;
      
      filteredShops.forEach(shop => {
        csvContent += `"${shop.shopName}","${shop.department}","${shop.salesman}",${shop.marchTotal || 0},${shop.aprilTotal || 0},${shop.mayTotal || 0},${shop.juneTotal || shop.total},${shop.eightPM},${shop.verve},${shop.growthPercent?.toFixed(1) || 0}%,${shop.yoyGrowthPercent?.toFixed(1) || 0}%,"${shop.monthlyTrend || 'stable'}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Radico_Enhanced_Analysis_${getShortMonthName(currentMonth)}_${currentYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting data. Please try again.');
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
                <button
                  onClick={exportToExcel}
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
                {activeTab === 'shops' && <TopShopsTab 
                  data={dashboardData}
                  currentPage={topShopsCurrentPage}
                  setCurrentPage={setTopShopsCurrentPage}
                  itemsPerPage={topShopsItemsPerPage}
                  filters={topShopsFilters}
                  setFilters={setTopShopsFilters}
                  getFilteredShops={getFilteredTopShops}
                  exportCSV={exportTopShopsToCSV}
                />}
                {activeTab === 'department' && <DepartmentTab data={dashboardData} />}
                {activeTab === 'salesman' && <SalesmanPerformanceTab data={dashboardData} />}
                {activeTab === 'analytics' && <AdvancedAnalyticsTab 
                  data={dashboardData} 
                  onShowSKU={(shop) => {
                    setSelectedShopSKU(shop);
                    setShowSKUModal(true);
                  }}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  filters={filters}
                  setFilters={setFilters}
                  getFilteredShops={getFilteredShops}
                />}
                {activeTab === 'historical' && <HistoricalAnalysisTab data={dashboardData} />}
              </>
            )}
          </main>
        </>
      )}

      {showSKUModal && selectedShopSKU && (
        <EnhancedSKUModal 
          shop={selectedShopSKU} 
          onClose={() => {
            setShowSKUModal(false);
            setSelectedShopSKU(null);
          }} 
        />
      )}
    </div>
  );
};

// UPDATED TAB COMPONENTS WITH DYNAMIC MONTH DETECTION AND YoY

const SalesmanPerformanceTab = ({ data }: { data: DashboardData }) => {
  // Calculate salesman performance data (FIXED HISTORICAL AGGREGATION)
  const salesmanPerformance = React.useMemo(() => {
    const performanceMap: Record<string, any> = {};
    
    const shopDetails = Object.values(data.salesData);
    
    shopDetails.forEach(shop => {
      const salesmanName = shop.salesman;
      if (!performanceMap[salesmanName]) {
        performanceMap[salesmanName] = {
          name: salesmanName,
          totalShops: 0,
          billedShops: 0,
          coverage: 0,
          total8PM: 0,
          totalVERVE: 0,
          totalSales: 0,
          target8PM: 0,
          targetVERVE: 0,
          achievement8PM: 0,
          achievementVERVE: 0,
          // FIXED: 3-month historical data aggregation
          marchTotal: 0,
          marchEightPM: 0,
          marchVerve: 0,
          aprilTotal: 0,
          aprilEightPM: 0,
          aprilVerve: 0,
          mayTotal: 0,
          mayEightPM: 0,
          mayVerve: 0,
          shops: []
        };
      }
      
      performanceMap[salesmanName].totalShops++;
      
      // FIXED: Current month aggregation (June)
      if (shop.total > 0) {
        performanceMap[salesmanName].billedShops++;
        performanceMap[salesmanName].total8PM += shop.eightPM;
        performanceMap[salesmanName].totalVERVE += shop.verve;
        performanceMap[salesmanName].totalSales += shop.total;
        performanceMap[salesmanName].shops.push(shop);
      }
        
      // FIXED: Historical data aggregation (Mar-Apr-May)
      performanceMap[salesmanName].marchTotal += shop.marchTotal || 0;
      performanceMap[salesmanName].marchEightPM += shop.marchEightPM || 0;
      performanceMap[salesmanName].marchVerve += shop.marchVerve || 0;
      
      performanceMap[salesmanName].aprilTotal += shop.aprilTotal || 0;
      performanceMap[salesmanName].aprilEightPM += shop.aprilEightPM || 0;
      performanceMap[salesmanName].aprilVerve += shop.aprilVerve || 0;
      
      performanceMap[salesmanName].mayTotal += shop.mayTotal || 0;
      performanceMap[salesmanName].mayEightPM += shop.mayEightPM || 0;
      performanceMap[salesmanName].mayVerve += shop.mayVerve || 0;
    });
    
    // Add target data from salespersonStats
    Object.values(data.salespersonStats).forEach((stats: any) => {
      const salesmanName = stats.name;
      if (performanceMap[salesmanName]) {
        performanceMap[salesmanName].target8PM = stats.eightPmTarget || 0;
        performanceMap[salesmanName].targetVERVE = stats.verveTarget || 0;
      }
    });
    
    // Calculate coverage and achievements
    Object.values(performanceMap).forEach((perf: any) => {
      perf.coverage = perf.totalShops > 0 ? (perf.billedShops / perf.totalShops) * 100 : 0;
      perf.achievement8PM = perf.target8PM > 0 ? (perf.total8PM / perf.target8PM) * 100 : 0;
      perf.achievementVERVE = perf.targetVERVE > 0 ? (perf.totalVERVE / perf.targetVERVE) * 100 : 0;
    });
    
    return Object.values(performanceMap).filter((p: any) => p.name !== 'Unknown');
  }, [data]);

  const sortedSalesmen = salesmanPerformance.sort((a: any, b: any) => b.totalSales - a.totalSales);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Salesman Performance Dashboard</h2>
        <p className="text-gray-600">Individual salesman achievements and targets for {getMonthName(data.currentMonth)} {data.currentYear}</p>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Top Performer (Sales)</h3>
          {sortedSalesmen.length > 0 && (
            <div>
              <div className="text-2xl font-bold text-blue-600">{sortedSalesmen[0].name}</div>
              <div className="text-sm text-gray-500">{sortedSalesmen[0].totalSales.toLocaleString()} cases</div>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Best 8PM Achievement</h3>
          {(() => {
            const best8PM = sortedSalesmen.filter((s: any) => s.target8PM > 0).sort((a: any, b: any) => b.achievement8PM - a.achievement8PM)[0];
            return best8PM ? (
              <div>
                <div className="text-2xl font-bold text-purple-600">{best8PM.name}</div>
                <div className="text-sm text-gray-500">{best8PM.achievement8PM.toFixed(1)}%</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No targets set</div>
            );
          })()}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Best VERVE Achievement</h3>
          {(() => {
            const bestVERVE = sortedSalesmen.filter((s: any) => s.targetVERVE > 0).sort((a: any, b: any) => b.achievementVERVE - a.achievementVERVE)[0];
            return bestVERVE ? (
              <div>
                <div className="text-2xl font-bold text-orange-600">{bestVERVE.name}</div>
                <div className="text-sm text-gray-500">{bestVERVE.achievementVERVE.toFixed(1)}%</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No targets set</div>
            );
          })()}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Best Coverage</h3>
          {(() => {
            const bestCoverage = sortedSalesmen.sort((a: any, b: any) => b.coverage - a.coverage)[0];
            return bestCoverage ? (
              <div>
                <div className="text-2xl font-bold text-green-600">{bestCoverage.name}</div>
                <div className="text-sm text-gray-500">{bestCoverage.coverage.toFixed(1)}%</div>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Detailed Performance Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Salesman Performance Details - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
          <p className="text-sm text-gray-500">Complete performance breakdown with current month targets and achievements</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shops</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">8PM Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">8PM Achievement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VERVE Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VERVE Achievement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSalesmen.map((salesman: any, index) => (
                <tr key={salesman.name} className={index < 3 ? 'bg-yellow-50' : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      {index + 1}
                      {index < 3 && (
                        <span className="ml-2">
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{salesman.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.totalShops}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.billedShops}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      salesman.coverage >= 80 ? 'bg-green-100 text-green-800' :
                      salesman.coverage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {salesman.coverage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                    <div className="font-medium">{salesman.total8PM.toLocaleString()}/{salesman.target8PM.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      {salesman.total8PM.toLocaleString()} cases, target {salesman.target8PM.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      salesman.achievement8PM >= 100 ? 'bg-green-100 text-green-800' :
                      salesman.achievement8PM >= 80 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {salesman.target8PM > 0 ? `${salesman.achievement8PM.toFixed(1)}%` : 'No Target'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                    <div className="font-medium">{salesman.totalVERVE.toLocaleString()}/{salesman.targetVERVE.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      {salesman.totalVERVE.toLocaleString()} cases, target {salesman.targetVERVE.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      salesman.achievementVERVE >= 100 ? 'bg-green-100 text-green-800' :
                      salesman.achievementVERVE >= 80 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {salesman.targetVERVE > 0 ? `${salesman.achievementVERVE.toFixed(1)}%` : 'No Target'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {salesman.totalSales.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW: 3-Month Historical Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">3-Month Performance Trend (Mar-Apr-May {data.currentYear})</h3>
          <p className="text-sm text-gray-500">Historical performance comparison for 8PM and VERVE by salesman</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">March Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">April Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">May Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3-Month Avg</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSalesmen.slice(0, 10).map((salesman: any) => {
                const avg3Month = ((salesman.marchTotal + salesman.aprilTotal + salesman.mayTotal) / 3).toFixed(0);
                const trend = salesman.mayTotal > salesman.aprilTotal && salesman.aprilTotal > salesman.marchTotal ? 'improving' :
                            salesman.mayTotal < salesman.aprilTotal && salesman.aprilTotal < salesman.marchTotal ? 'declining' : 'stable';
                
                return (
                  <tr key={salesman.name}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{salesman.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.marchTotal.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.aprilTotal.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.mayTotal.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        trend === 'improving' ? 'bg-green-100 text-green-800' :
                        trend === 'declining' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {trend === 'improving' ? '📈 Growing' : trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{avg3Month}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rest of the component remains the same... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Achievement Comparison</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {sortedSalesmen.slice(0, 8).map((salesman: any) => (
                <div key={salesman.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{salesman.name}</span>
                    <span>8PM: {salesman.achievement8PM.toFixed(1)}% | VERVE: {salesman.achievementVERVE.toFixed(1)}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(salesman.achievement8PM, 100)}%` }}
                      ></div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(salesman.achievementVERVE, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Coverage vs Sales Performance</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {sortedSalesmen.slice(0, 8).map((salesman: any) => (
                <div key={salesman.name} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{salesman.name}</div>
                    <div className="text-xs text-gray-500">
                      {salesman.billedShops}/{salesman.totalShops} shops • {salesman.totalSales.toLocaleString()} cases
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        salesman.coverage >= 80 ? 'text-green-600' :
                        salesman.coverage >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {salesman.coverage.toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">Coverage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{salesman.totalSales.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Cases</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-orange-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Salesman Achievement Summary - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {sortedSalesmen.filter((s: any) => s.achievement8PM >= 100 && s.target8PM > 0).length}
            </div>
            <div className="text-xs text-gray-600">8PM Target Achieved</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">
              {sortedSalesmen.filter((s: any) => s.achievementVERVE >= 100 && s.targetVERVE > 0).length}
            </div>
            <div className="text-xs text-gray-600">VERVE Target Achieved</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">
              {sortedSalesmen.filter((s: any) => s.coverage >= 80).length}
            </div>
            <div className="text-xs text-gray-600">High Coverage ({'>'}80%)</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">
              {sortedSalesmen.length}
            </div>
            <div className="text-xs text-gray-600">Active Salesmen</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdvancedAnalyticsTab = ({ 
  data, 
  onShowSKU, 
  currentPage, 
  setCurrentPage, 
  itemsPerPage,
  filters,
  setFilters,
  getFilteredShops
}: { 
  data: DashboardData, 
  onShowSKU: (shop: ShopData) => void,
  currentPage: number,
  setCurrentPage: (page: number) => void,
  itemsPerPage: number,
  filters: FilterState,
  setFilters: (filters: FilterState) => void,
  getFilteredShops: (shops: ShopData[]) => ShopData[]
}) => {
  const filteredShops = getFilteredShops(data.allShopsComparison);
  const totalPages = Math.ceil(filteredShops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentShops = filteredShops.slice(startIndex, endIndex);

  const departments = [...new Set(data.allShopsComparison.map(shop => shop.department))].sort();
  const salesmen = [...new Set(data.allShopsComparison.map(shop => shop.salesman))].sort();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <UserPlus className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{data.customerInsights.firstTimeCustomers}</div>
              <div className="text-sm text-gray-500">First-time Customers</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{data.customerInsights.lostCustomers}</div>
              <div className="text-sm text-gray-500">Lost Customers</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{data.customerInsights.consistentPerformers}</div>
              <div className="text-sm text-gray-500">Consistent Performers</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <TrendingDown className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{data.customerInsights.decliningPerformers}</div>
              <div className="text-sm text-gray-500">Declining Performers</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search shops, departments, salesmen..."
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
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filters.salesman}
            onChange={(e) => setFilters({ ...filters, salesman: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Salesmen</option>
            {salesmen.map(salesman => (
              <option key={salesman} value={salesman}>{salesman}</option>
            ))}
          </select>

          <button
            onClick={() => setFilters({ department: '', salesman: '', shop: '', searchText: '' })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>

          <div className="text-sm text-gray-500">
            Showing {filteredShops.length} of {data.allShopsComparison.length} shops
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Complete Shop Analysis - Rolling 4-Month Comparison (Mar-Apr-May-{getMonthName(data.currentMonth)} {data.currentYear})</h3>
          <p className="text-sm text-gray-500">
            {filteredShops.length} shops {filters.department || filters.salesman || filters.searchText ? '(filtered)' : ''} 
            ranked by current month performance with rolling window analysis and YoY comparison
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mar Cases</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apr Cases</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">May Cases</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getMonthName(data.currentMonth)} Cases</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth %</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">YoY %</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">8PM</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VERVE</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentShops.map((shop, index) => (
                <tr key={shop.shopId} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{shop.shopName}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{shop.salesman}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shop.marchTotal?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shop.aprilTotal?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shop.mayTotal?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    <button
                      onClick={() => onShowSKU(shop)}  
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {shop.juneTotal?.toLocaleString() || shop.total.toLocaleString()}
                    </button>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (shop.growthPercent || 0) > 0 
                        ? 'bg-green-100 text-green-800' 
                        : (shop.growthPercent || 0) < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {shop.growthPercent?.toFixed(1) || 0}%
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (shop.yoyGrowthPercent || 0) > 0 
                        ? 'bg-blue-100 text-blue-800' 
                        : (shop.yoyGrowthPercent || 0) < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {shop.yoyGrowthPercent?.toFixed(1) || 0}%
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      shop.monthlyTrend === 'improving' ? 'bg-green-100 text-green-800' :
                      shop.monthlyTrend === 'declining' ? 'bg-red-100 text-red-800' :
                      shop.monthlyTrend === 'new' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {shop.monthlyTrend === 'improving' ? '📈' :
                       shop.monthlyTrend === 'declining' ? '📉' :
                       shop.monthlyTrend === 'new' ? '✨' : '➡️'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                    {shop.eightPM.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                    {shop.verve.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredShops.length)} of {filteredShops.length} filtered shops
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <UserPlus className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">First-time Billing Shops ({data.customerInsights.firstTimeCustomers})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{getMonthName(data.currentMonth)} Cases</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.customerInsights.newShops.slice(0, 10).map((shop) => (
                  <tr key={shop.shopId}>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.shopName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.salesman}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">{shop.juneTotal || shop.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Lost Customers ({data.customerInsights.lostCustomers})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">May Cases</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.customerInsights.lostShops.slice(0, 10).map((shop) => (
                  <tr key={shop.shopId}>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.shopName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.salesman}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600">{shop.mayTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ENHANCED: Historical Analysis Tab Component (UPDATED TO 12 MONTHS WITH YoY)
const HistoricalAnalysisTab = ({ data }: { data: DashboardData }) => {
  const [debugInfo, setDebugInfo] = React.useState<any>(null);

  useEffect(() => {
    if (data.historicalData) {
      setDebugInfo({
        hasHistoricalData: !!data.historicalData,
        historicalData: data.historicalData,
        customerInsights: data.customerInsights,
        // EXTENDED: 12 months of data
        monthlyTotals: {
          // Q2 2025 (Current Quarter)
          june: {
            shops: data.historicalData.june?.uniqueShops?.size || 0,
            total8PM: data.historicalData.june?.total8PM || 0,
            totalVERVE: data.historicalData.june?.totalVERVE || 0
          },
          may: {
            shops: data.historicalData.may?.uniqueShops?.size || 0,
            total8PM: data.historicalData.may?.total8PM || 0,
            totalVERVE: data.historicalData.may?.totalVERVE || 0
          },
          april: {
            shops: data.historicalData.april?.uniqueShops?.size || 0,
            total8PM: data.historicalData.april?.total8PM || 0,
            totalVERVE: data.historicalData.april?.totalVERVE || 0
          },
          // Q1 2025
          march: {
            shops: data.historicalData.march?.uniqueShops?.size || 0,
            total8PM: data.historicalData.march?.total8PM || 0,
            totalVERVE: data.historicalData.march?.totalVERVE || 0
          },
          february: {
            shops: data.historicalData.february?.uniqueShops?.size || 0,
            total8PM: data.historicalData.february?.total8PM || 0,
            totalVERVE: data.historicalData.february?.totalVERVE || 0
          },
          january: {
            shops: data.historicalData.january?.uniqueShops?.size || 0,
            total8PM: data.historicalData.january?.total8PM || 0,
            totalVERVE: data.historicalData.january?.totalVERVE || 0
          },
          // Q4 2024
          december2024: {
            shops: data.historicalData.december2024?.uniqueShops?.size || 0,
            total8PM: data.historicalData.december2024?.total8PM || 0,
            totalVERVE: data.historicalData.december2024?.totalVERVE || 0
          },
          november2024: {
            shops: data.historicalData.november2024?.uniqueShops?.size || 0,
            total8PM: data.historicalData.november2024?.total8PM || 0,
            totalVERVE: data.historicalData.november2024?.totalVERVE || 0
          },
          october2024: {
            shops: data.historicalData.october2024?.uniqueShops?.size || 0,
            total8PM: data.historicalData.october2024?.total8PM || 0,
            totalVERVE: data.historicalData.october2024?.totalVERVE || 0
          },
          // Q3 2024
          september2024: {
            shops: data.historicalData.september2024?.uniqueShops?.size || 0,
            total8PM: data.historicalData.september2024?.total8PM || 0,
            totalVERVE: data.historicalData.september2024?.totalVERVE || 0
          },
          august2024: {
            shops: data.historicalData.august2024?.uniqueShops?.size || 0,
            total8PM: data.historicalData.august2024?.total8PM || 0,
            totalVERVE: data.historicalData.august2024?.totalVERVE || 0
          },
          july2024: {
            shops: data.historicalData.july2024?.uniqueShops?.size || 0,
            total8PM: data.historicalData.july2024?.total8PM || 0,
            totalVERVE: data.historicalData.july2024?.totalVERVE || 0
          },
          // YoY Comparison
          lastYear: {
            shops: data.historicalData.juneLastYear?.uniqueShops?.size || 0,
            total8PM: data.historicalData.juneLastYear?.total8PM || 0,
            totalVERVE: data.historicalData.juneLastYear?.totalVERVE || 0
          }
        }
      });
    }
  }, [data]);

  // Calculate month-over-month growth
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100);
  };

  // EXTENDED: 12-month data for comprehensive analysis
  const monthlyData = debugInfo?.monthlyTotals ? [
    // Jul 2024 - Dec 2024
    { 
      month: 'July 2024',
      total: debugInfo.monthlyTotals.july2024.total8PM + debugInfo.monthlyTotals.july2024.totalVERVE,
      total8PM: debugInfo.monthlyTotals.july2024.total8PM,
      totalVERVE: debugInfo.monthlyTotals.july2024.totalVERVE,
      shops: debugInfo.monthlyTotals.july2024.shops,
      quarter: 'Q3 2024',
      growth: 0 // Base month
    },
    { 
      month: 'August 2024',
      total: debugInfo.monthlyTotals.august2024.total8PM + debugInfo.monthlyTotals.august2024.totalVERVE,
      total8PM: debugInfo.monthlyTotals.august2024.total8PM,
      totalVERVE: debugInfo.monthlyTotals.august2024.totalVERVE,
      shops: debugInfo.monthlyTotals.august2024.shops,
      quarter: 'Q3 2024',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.august2024.total8PM + debugInfo.monthlyTotals.august2024.totalVERVE,
        debugInfo.monthlyTotals.july2024.total8PM + debugInfo.monthlyTotals.july2024.totalVERVE
      )
    },
    { 
      month: 'September 2024',
      total: debugInfo.monthlyTotals.september2024.total8PM + debugInfo.monthlyTotals.september2024.totalVERVE,
      total8PM: debugInfo.monthlyTotals.september2024.total8PM,
      totalVERVE: debugInfo.monthlyTotals.september2024.totalVERVE,
      shops: debugInfo.monthlyTotals.september2024.shops,
      quarter: 'Q3 2024',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.september2024.total8PM + debugInfo.monthlyTotals.september2024.totalVERVE,
        debugInfo.monthlyTotals.august2024.total8PM + debugInfo.monthlyTotals.august2024.totalVERVE
      )
    },
    { 
      month: 'October 2024',
      total: debugInfo.monthlyTotals.october2024.total8PM + debugInfo.monthlyTotals.october2024.totalVERVE,
      total8PM: debugInfo.monthlyTotals.october2024.total8PM,
      totalVERVE: debugInfo.monthlyTotals.october2024.totalVERVE,
      shops: debugInfo.monthlyTotals.october2024.shops,
      quarter: 'Q4 2024',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.october2024.total8PM + debugInfo.monthlyTotals.october2024.totalVERVE,
        debugInfo.monthlyTotals.september2024.total8PM + debugInfo.monthlyTotals.september2024.totalVERVE
      )
    },
    { 
      month: 'November 2024',
      total: debugInfo.monthlyTotals.november2024.total8PM + debugInfo.monthlyTotals.november2024.totalVERVE,
      total8PM: debugInfo.monthlyTotals.november2024.total8PM,
      totalVERVE: debugInfo.monthlyTotals.november2024.totalVERVE,
      shops: debugInfo.monthlyTotals.november2024.shops,
      quarter: 'Q4 2024',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.november2024.total8PM + debugInfo.monthlyTotals.november2024.totalVERVE,
        debugInfo.monthlyTotals.october2024.total8PM + debugInfo.monthlyTotals.october2024.totalVERVE
      )
    },
    { 
      month: 'December 2024',
      total: debugInfo.monthlyTotals.december2024.total8PM + debugInfo.monthlyTotals.december2024.totalVERVE,
      total8PM: debugInfo.monthlyTotals.december2024.total8PM,
      totalVERVE: debugInfo.monthlyTotals.december2024.totalVERVE,
      shops: debugInfo.monthlyTotals.december2024.shops,
      quarter: 'Q4 2024',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.december2024.total8PM + debugInfo.monthlyTotals.december2024.totalVERVE,
        debugInfo.monthlyTotals.november2024.total8PM + debugInfo.monthlyTotals.november2024.totalVERVE
      )
    },
    // Jan 2025 - Jun 2025
    { 
      month: 'January 2025',
      total: debugInfo.monthlyTotals.january.total8PM + debugInfo.monthlyTotals.january.totalVERVE,
      total8PM: debugInfo.monthlyTotals.january.total8PM,
      totalVERVE: debugInfo.monthlyTotals.january.totalVERVE,
      shops: debugInfo.monthlyTotals.january.shops,
      quarter: 'Q1 2025',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.january.total8PM + debugInfo.monthlyTotals.january.totalVERVE,
        debugInfo.monthlyTotals.december2024.total8PM + debugInfo.monthlyTotals.december2024.totalVERVE
      )
    },
    { 
      month: 'February 2025',
      total: debugInfo.monthlyTotals.february.total8PM + debugInfo.monthlyTotals.february.totalVERVE,
      total8PM: debugInfo.monthlyTotals.february.total8PM,
      totalVERVE: debugInfo.monthlyTotals.february.totalVERVE,
      shops: debugInfo.monthlyTotals.february.shops,
      quarter: 'Q1 2025',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.february.total8PM + debugInfo.monthlyTotals.february.totalVERVE,
        debugInfo.monthlyTotals.january.total8PM + debugInfo.monthlyTotals.january.totalVERVE
      )
    },
    { 
      month: 'March 2025',
      total: debugInfo.monthlyTotals.march.total8PM + debugInfo.monthlyTotals.march.totalVERVE,
      total8PM: debugInfo.monthlyTotals.march.total8PM,
      totalVERVE: debugInfo.monthlyTotals.march.totalVERVE,
      shops: debugInfo.monthlyTotals.march.shops,
      quarter: 'Q1 2025',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.march.total8PM + debugInfo.monthlyTotals.march.totalVERVE,
        debugInfo.monthlyTotals.february.total8PM + debugInfo.monthlyTotals.february.totalVERVE
      )
    },
    { 
      month: 'April 2025',
      total: debugInfo.monthlyTotals.april.total8PM + debugInfo.monthlyTotals.april.totalVERVE,
      total8PM: debugInfo.monthlyTotals.april.total8PM,
      totalVERVE: debugInfo.monthlyTotals.april.totalVERVE,
      shops: debugInfo.monthlyTotals.april.shops,
      quarter: 'Q2 2025',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.april.total8PM + debugInfo.monthlyTotals.april.totalVERVE,
        debugInfo.monthlyTotals.march.total8PM + debugInfo.monthlyTotals.march.totalVERVE
      )
    },
    { 
      month: 'May 2025',
      total: debugInfo.monthlyTotals.may.total8PM + debugInfo.monthlyTotals.may.totalVERVE,
      total8PM: debugInfo.monthlyTotals.may.total8PM,
      totalVERVE: debugInfo.monthlyTotals.may.totalVERVE,
      shops: debugInfo.monthlyTotals.may.shops,
      quarter: 'Q2 2025',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.may.total8PM + debugInfo.monthlyTotals.may.totalVERVE,
        debugInfo.monthlyTotals.april.total8PM + debugInfo.monthlyTotals.april.totalVERVE
      )
    },
    { 
      month: `${getMonthName(data.currentMonth)} ${data.currentYear} (Current)`,
      total: debugInfo.monthlyTotals.june.total8PM + debugInfo.monthlyTotals.june.totalVERVE,
      total8PM: debugInfo.monthlyTotals.june.total8PM,
      totalVERVE: debugInfo.monthlyTotals.june.totalVERVE,
      shops: debugInfo.monthlyTotals.june.shops,
      quarter: 'Q2 2025',
      growth: calculateGrowth(
        debugInfo.monthlyTotals.june.total8PM + debugInfo.monthlyTotals.june.totalVERVE,
        debugInfo.monthlyTotals.may.total8PM + debugInfo.monthlyTotals.may.totalVERVE
      )
    }
  ] : [];

  // YoY comparison data
  const yoyComparison = debugInfo?.monthlyTotals ? {
    currentYear: {
      total: debugInfo.monthlyTotals.june.total8PM + debugInfo.monthlyTotals.june.totalVERVE,
      total8PM: debugInfo.monthlyTotals.june.total8PM,
      totalVERVE: debugInfo.monthlyTotals.june.totalVERVE,
      shops: debugInfo.monthlyTotals.june.shops
    },
    lastYear: {
      total: debugInfo.monthlyTotals.lastYear.total8PM + debugInfo.monthlyTotals.lastYear.totalVERVE,
      total8PM: debugInfo.monthlyTotals.lastYear.total8PM,
      totalVERVE: debugInfo.monthlyTotals.lastYear.totalVERVE,
      shops: debugInfo.monthlyTotals.lastYear.shops
    },
    growth: {
      total: calculateGrowth(
        debugInfo.monthlyTotals.june.total8PM + debugInfo.monthlyTotals.june.totalVERVE,
        debugInfo.monthlyTotals.lastYear.total8PM + debugInfo.monthlyTotals.lastYear.totalVERVE
      ),
      total8PM: calculateGrowth(debugInfo.monthlyTotals.june.total8PM, debugInfo.monthlyTotals.lastYear.total8PM),
      totalVERVE: calculateGrowth(debugInfo.monthlyTotals.june.totalVERVE, debugInfo.monthlyTotals.lastYear.totalVERVE),
      shops: calculateGrowth(debugInfo.monthlyTotals.june.shops, debugInfo.monthlyTotals.lastYear.shops)
    }
  } : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Historical Analysis & Trends</h2>
        <p className="text-gray-600">Rolling 4-Month Business Performance + Year-over-Year Analysis ({getMonthName(data.currentMonth)} {data.currentYear} vs {getMonthName(data.currentMonth)} 2024)</p>
      </div>

      {/* YoY COMPARISON CARDS */}
      {yoyComparison && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Year-over-Year Comparison ({getMonthName(data.currentMonth)})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{yoyComparison.currentYear.total.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{getMonthName(data.currentMonth)} {data.currentYear}</div>
              <div className="text-xs text-gray-400">vs {yoyComparison.lastYear.total.toLocaleString()} last year</div>
              <div className={`text-sm font-medium ${yoyComparison?.growth?.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(yoyComparison?.growth?.total ?? 0) >= 0 ? '+' : ''}{(yoyComparison?.growth?.total ?? 0).toFixed(1)}% YoY
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{yoyComparison.currentYear.total8PM.toLocaleString()}</div>
              <div className="text-sm text-gray-500">8PM {data.currentYear}</div>
              <div className="text-xs text-gray-400">vs {yoyComparison.lastYear.total8PM.toLocaleString()} last year</div>
              <div className={`text-sm font-medium ${yoyComparison?.growth?.total8PM >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(yoyComparison?.growth?.total8PM ?? 0) >= 0 ? '+' : ''}{(yoyComparison?.growth?.total8PM ?? 0).toFixed(1)}% YoY
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{yoyComparison.currentYear.totalVERVE.toLocaleString()}</div>
              <div className="text-sm text-gray-500">VERVE {data.currentYear}</div>
              <div className="text-xs text-gray-400">vs {yoyComparison.lastYear.totalVERVE.toLocaleString()} last year</div>
              <div className={`text-sm font-medium ${yoyComparison?.growth?.totalVERVE >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(yoyComparison?.growth?.totalVERVE ?? 0) >= 0 ? '+' : ''}{(yoyComparison?.growth?.totalVERVE ?? 0).toFixed(1)}% YoY
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{yoyComparison.currentYear.shops}</div>
              <div className="text-sm text-gray-500">Active Shops {data.currentYear}</div>
              <div className="text-xs text-gray-400">vs {yoyComparison.lastYear.shops} last year</div>
              <div className={`text-sm font-medium ${yoyComparison?.growth?.shops >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(yoyComparison?.growth?.shops ?? 0) >= 0 ? '+' : ''}{(yoyComparison?.growth?.shops ?? 0).toFixed(1)}% YoY
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLLING 4-MONTH COMPARISON */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {monthlyData.map((month, index) => (
          <div key={month.month} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{month.month}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Sales:</span>
                <span className="font-medium">{month.total.toLocaleString()} cases</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">8PM:</span>
                <span className="font-medium text-purple-600">{month.total8PM.toLocaleString()} cases</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">VERVE:</span>
                <span className="font-medium text-orange-600">{month.totalVERVE.toLocaleString()} cases</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Active Shops:</span>
                <span className="font-medium">{month.shops}</span>
              </div>
              {index > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Growth:</span>
                  <span className={`font-medium ${month.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {month.growth >= 0 ? '+' : ''}{month.growth.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 12-MONTH SALES TREND */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">12-Month Sales Trend Analysis</h3>
        <div className="space-y-6">
          {/* Quarterly Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-600 mb-2">Q3 2024</h4>
              <div className="text-sm space-y-1">
                <div>Jul: {monthlyData.find(m => m.month.includes('July'))?.total || 0}</div>
                <div>Aug: {monthlyData.find(m => m.month.includes('August'))?.total || 0}</div>
                <div>Sep: {monthlyData.find(m => m.month.includes('September'))?.total || 0}</div>
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-600 mb-2">Q4 2024</h4>
              <div className="text-sm space-y-1">
                <div>Oct: {monthlyData.find(m => m.month.includes('October'))?.total || 0}</div>
                <div>Nov: {monthlyData.find(m => m.month.includes('November'))?.total || 0}</div>
                <div>Dec: {monthlyData.find(m => m.month.includes('December'))?.total || 0}</div>
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-600 mb-2">Q1 2025</h4>
              <div className="text-sm space-y-1">
                <div>Jan: {monthlyData.find(m => m.month.includes('January'))?.total || 0}</div>
                <div>Feb: {monthlyData.find(m => m.month.includes('February'))?.total || 0}</div>
                <div>Mar: {monthlyData.find(m => m.month.includes('March'))?.total || 0}</div>
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-600 mb-2">Q2 2025</h4>
              <div className="text-sm space-y-1">
                <div>Apr: {monthlyData.find(m => m.month.includes('April'))?.total || 0}</div>
                <div>May: {monthlyData.find(m => m.month.includes('May'))?.total || 0}</div>
                <div>Jun: {monthlyData.find(m => m.month.includes('Jun'))?.total || 0}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-purple-600 mb-2">8PM Family Performance (12 Months)</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {monthlyData.map((month) => (
                <div key={month.month} className="text-center">
                  <div className="text-sm font-bold text-purple-600">{month.total8PM.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0].substring(0, 3)}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-orange-600 mb-2">VERVE Family Performance (12 Months)</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {monthlyData.map((month) => (
                <div key={month.month} className="text-center">
                  <div className="text-sm font-bold text-orange-600">{month.totalVERVE.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0].substring(0, 3)}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-blue-600 mb-2">Total Sales Performance (12 Months)</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {monthlyData.map((month) => (
                <div key={month.month} className="text-center">
                  <div className="text-sm font-bold text-blue-600">{month.total.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0].substring(0, 3)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Journey Analysis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Journey Analysis (Rolling 4-Month Window: Mar-Apr-May-{getMonthName(data.currentMonth)})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.customerInsights.firstTimeCustomers}</div>
            <div className="text-sm text-gray-500">New Customers</div>
            <div className="text-xs text-gray-400">Started in {getMonthName(data.currentMonth)}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{data.customerInsights.lostCustomers}</div>
            <div className="text-sm text-gray-500">Lost Customers</div>
            <div className="text-xs text-gray-400">Active in May, not in {getMonthName(data.currentMonth)}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.customerInsights.consistentPerformers}</div>
            <div className="text-sm text-gray-500">Consistent Performers</div>
            <div className="text-xs text-gray-400">Growing or stable</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{data.customerInsights.decliningPerformers}</div>
            <div className="text-sm text-gray-500">Declining Performers</div>
            <div className="text-xs text-gray-400">Negative growth trend</div>
          </div>
        </div>
      </div>

      {/* ENHANCED: Rolling Window Performance Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">12-Month Performance Insights & Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Quarterly Growth Analysis</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Q3 → Q4 2024:</span>
                <span className="text-sm font-medium">Trend Analysis</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Q4 → Q1 2025:</span>
                <span className="text-sm font-medium">Seasonal Impact</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Q1 → Q2 2025:</span>
                <span className="text-sm font-medium">Current Growth</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Brand Performance Evolution</h4>
            <div className="space-y-2">
              {monthlyData.slice(-6).map((month) => (
                <div key={month.month} className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">{month.month.split(' ')[0]}</div>
                  <div className="flex space-x-4 text-xs">
                    <span className="text-purple-600">
                      8PM: {month.total > 0 ? ((month.total8PM / month.total) * 100).toFixed(1) : 0}%
                    </span>
                    <span className="text-orange-600">
                      VERVE: {month.total > 0 ? ((month.totalVERVE / month.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">12-Month Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Months:</span>
                <span className="text-sm font-medium text-blue-600">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Peak Month:</span>
                <span className="text-sm font-medium text-green-600">
                  {monthlyData.reduce((max, month) => month.total > max.total ? month : max, monthlyData[0])?.month.split(' ')[0] || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Growth:</span>
                <span className="text-sm font-medium text-purple-600">
                  {(monthlyData.reduce((sum, month, index) => index > 0 ? sum + month.growth : sum, 0) / (monthlyData.length - 1)).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Integration Status */}
      {debugInfo && (
        <div className={`p-6 rounded-lg text-center ${
          debugInfo?.monthlyTotals?.march?.total8PM > 0 || debugInfo?.monthlyTotals?.march?.totalVERVE > 0
            ? 'bg-green-50'
            : 'bg-yellow-50'
        }`}>
          {debugInfo?.monthlyTotals?.march?.total8PM > 0 || debugInfo?.monthlyTotals?.march?.totalVERVE > 0 ? (
            <>
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-lg font-medium text-green-900 mb-2">12-Month Historical Data Integration: Complete</h3>
              <p className="text-green-700 mb-4">
                Successfully integrated 12 months of historical data (Jul 2024 - {getMonthName(data.currentMonth)} {data.currentYear}) with comprehensive trend analysis and quarterly insights.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-gray-600">Months Analyzed</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-purple-600">
                    {debugInfo.monthlyTotals.june?.total8PM?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">{getMonthName(data.currentMonth)} 8PM</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-orange-600">
                    {debugInfo.monthlyTotals.june?.totalVERVE?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">{getMonthName(data.currentMonth)} VERVE</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className={`text-2xl font-bold ${(yoyComparison?.growth?.total ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(yoyComparison?.growth?.total ?? 0) >= 0 ? '+' : ''}{(yoyComparison?.growth?.total ?? 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">YoY Growth</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-green-600">4</div>
                  <div className="text-sm text-gray-600">Quarters Covered</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-yellow-900 mb-2">Historical Data: Processing</h3>
              <p className="text-yellow-700 mb-4">
                Historical data connection established. Verification in progress.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const DepartmentTab = ({ data }: { data: DashboardData }) => {
  return (
    <div className="space-y-6">
      {/* Department Performance Overview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Department Performance Overview - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.deptPerformance).map(([dept, performance]) => {
            const coveragePercent = (performance.billedShops / performance.totalShops) * 100;
            return (
              <div key={dept} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{dept}</h4>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">{performance.sales.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Total Sales</div>
                  <div className="text-sm">
                    <span className="font-medium">{performance.billedShops}</span>
                    <span className="text-gray-500">/{performance.totalShops} shops</span>
                  </div>
                  <div className={`text-sm font-medium ${
                    coveragePercent > 80 ? 'text-green-600' : 
                    coveragePercent > 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {coveragePercent.toFixed(1)}% coverage
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Department Performance Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Department Performance Analysis - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
          <p className="text-sm text-gray-500">Coverage and sales performance by territory</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Shops</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Shops</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg per Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">8PM Share</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VERVE Share</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(data.deptPerformance).map(([dept, performance]) => {
                const coveragePercent = (performance.billedShops / performance.totalShops) * 100;
                const avgPerShop = performance.billedShops > 0 ? (performance.sales / performance.billedShops).toFixed(1) : 0;
                
                const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept && shop.total > 0);
                const dept8PM = deptShops.reduce((sum: number, shop: any) => sum + shop.eightPM, 0);
                const deptVERVE = deptShops.reduce((sum: number, shop: any) => sum + shop.verve, 0);
                const deptTotal = dept8PM + deptVERVE;
                const eightPMShare = deptTotal > 0 ? ((dept8PM / deptTotal) * 100).toFixed(1) : '0';
                const verveShare = deptTotal > 0 ? ((deptVERVE / deptTotal) * 100).toFixed(1) : '0';
                
                return (
                  <tr key={dept}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{performance.totalShops}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{performance.billedShops}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          coveragePercent > 80 
                            ? 'bg-green-100 text-green-800' 
                            : coveragePercent > 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {coveragePercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{performance.sales.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{avgPerShop}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">{eightPMShare}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{verveShare}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW: 3-Month Historical Department Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">3-Month Department Trend (Mar-Apr-May {data.currentYear})</h3>
          <p className="text-sm text-gray-500">Historical sales performance by department</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">March Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">April Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">May Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3-Month Avg</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(data.deptPerformance).map(([dept, performance]) => {
                // Calculate historical data for this department
                const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept);
                const marchTotal = deptShops.reduce((sum: number, shop: any) => sum + (shop.marchTotal || 0), 0);
                const aprilTotal = deptShops.reduce((sum: number, shop: any) => sum + (shop.aprilTotal || 0), 0);
                const mayTotal = deptShops.reduce((sum: number, shop: any) => sum + (shop.mayTotal || 0), 0);
                const avg3Month = ((marchTotal + aprilTotal + mayTotal) / 3).toFixed(0);
                
                const trend = mayTotal > aprilTotal && aprilTotal > marchTotal ? 'improving' :
                            mayTotal < aprilTotal && aprilTotal < marchTotal ? 'declining' : 'stable';
                
                return (
                  <tr key={dept}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{marchTotal.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{aprilTotal.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mayTotal.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{avg3Month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        trend === 'improving' ? 'bg-green-100 text-green-800' :
                        trend === 'declining' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {trend === 'improving' ? '📈 Growing' : trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Brand Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">8PM Performance by Department</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(data.deptPerformance).map(([dept, performance]) => {
                const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept && shop.total > 0);
                const dept8PM = deptShops.reduce((sum: number, shop: any) => sum + shop.eightPM, 0);
                const sharePercent = data.summary.total8PM > 0 ? (dept8PM / data.summary.total8PM) * 100 : 0;
                
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-sm">
                      <span>{dept}</span>
                      <span>{dept8PM.toLocaleString()} cases ({sharePercent.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${sharePercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">VERVE Performance by Department</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(data.deptPerformance).map(([dept, performance]) => {
                const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept && shop.total > 0);
                const deptVERVE = deptShops.reduce((sum: number, shop: any) => sum + shop.verve, 0);
                const sharePercent = data.summary.totalVERVE > 0 ? (deptVERVE / data.summary.totalVERVE) * 100 : 0;
                
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-sm">
                      <span>{dept}</span>
                      <span>{deptVERVE.toLocaleString()} cases ({sharePercent.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ width: `${sharePercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OverviewTab = ({ data }: { data: DashboardData }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Shops"
          value={data.summary.totalShops.toLocaleString()}
          icon={ShoppingBag}
          color="blue"
        />
        <MetricCard
          title="Billed Shops"
          value={data.summary.billedShops.toLocaleString()}
          subtitle={`${data.summary.coverage}% coverage`}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="8PM Sales"
          value={`${data.summary.total8PM.toLocaleString()} cases`}
          subtitle={`${data.summary.eightPmAchievement}% achievement | YoY: ${data.summary.yoy8PMGrowth}%`}
          icon={BarChart3}
          color="purple"
        />
        <MetricCard
          title="VERVE Sales"
          value={`${data.summary.totalVERVE.toLocaleString()} cases`}
          subtitle={`${data.summary.verveAchievement}% achievement | YoY: ${data.summary.yoyVerveGrowth}%`}
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Enhanced Sales vs Target Cards with YoY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">8PM Performance - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Sales vs Target</span>
                <span>{data.summary.eightPmAchievement}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(parseFloat(data.summary.eightPmAchievement), 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">{data.summary.total8PM.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Achieved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-400">{data.summary.total8PMTarget.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Target</div>
              </div>
            </div>
            {/* YoY Comparison */}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>vs Last Year ({getMonthName(data.currentMonth)} 2024)</span>
                <span className={`font-medium ${parseFloat(data.summary.yoy8PMGrowth || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(data.summary.yoy8PMGrowth || '0') >= 0 ? '+' : ''}{data.summary.yoy8PMGrowth || '0'}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last year: {data.summary.lastYearTotal8PM?.toLocaleString() || 0} cases
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">VERVE Performance - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Sales vs Target</span>
                <span>{data.summary.verveAchievement}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(parseFloat(data.summary.verveAchievement), 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-600">{data.summary.totalVERVE.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Achieved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-400">{data.summary.totalVerveTarget.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Target</div>
              </div>
            </div>
            {/* YoY Comparison */}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>vs Last Year ({getMonthName(data.currentMonth)} 2024)</span>
                <span className={`font-medium ${parseFloat(data.summary.yoyVerveGrowth || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(data.summary.yoyVerveGrowth || '0') >= 0 ? '+' : ''}{data.summary.yoyVerveGrowth || '0'}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last year: {data.summary.lastYearTotalVERVE?.toLocaleString() || 0} cases
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Brand Distribution and Achievement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Distribution - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>8PM Family</span>
                <span>{((data.summary.total8PM / data.summary.totalSales) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-600 h-3 rounded-full" 
                  style={{ width: `${(data.summary.total8PM / data.summary.totalSales) * 100}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500 mt-1">{data.summary.total8PM.toLocaleString()} cases</div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>VERVE Family</span>
                <span>{((data.summary.totalVERVE / data.summary.totalSales) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-orange-600 h-3 rounded-full" 
                  style={{ width: `${(data.summary.totalVERVE / data.summary.totalSales) * 100}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500 mt-1">{data.summary.totalVERVE.toLocaleString()} cases</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Achievement Summary - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">8PM Achievement:</span>
              <span className={`text-lg font-bold ${
                parseFloat(data.summary.eightPmAchievement) >= 100 ? 'text-green-600' : 
                parseFloat(data.summary.eightPmAchievement) >= 80 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {data.summary.eightPmAchievement}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">VERVE Achievement:</span>
              <span className={`text-lg font-bold ${
                parseFloat(data.summary.verveAchievement) >= 100 ? 'text-green-600' : 
                parseFloat(data.summary.verveAchievement) >= 80 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {data.summary.verveAchievement}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Market Coverage:</span>
              <span className={`text-lg font-bold ${
                parseFloat(data.summary.coverage) >= 80 ? 'text-green-600' : 
                parseFloat(data.summary.coverage) >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {data.summary.coverage}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">YoY Growth:</span>
              <span className={`text-lg font-bold ${
                parseFloat(data.summary.yoy8PMGrowth || '0') >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {parseFloat(data.summary.yoy8PMGrowth || '0') >= 0 ? '+' : ''}{data.summary.yoy8PMGrowth || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Statistics - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{data.summary.totalSales.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Cases Sold</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{data.summary.coverage}%</div>
            <div className="text-sm text-gray-500">Market Coverage</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{data.topShops.length}</div>
            <div className="text-sm text-gray-500">Active Shops</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{data.customerInsights.firstTimeCustomers}</div>
            <div className="text-sm text-gray-500">New Customers</div>
          </div>
        </div>
      </div>

      {/* Enhanced Customer Insights Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rolling 4-Month Customer Journey Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{data.customerInsights.firstTimeCustomers}</div>
            <div className="text-xs text-gray-600">New Customers</div>
            <div className="text-xs text-gray-400">Started billing in {getMonthName(data.currentMonth)}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600">{data.customerInsights.lostCustomers}</div>
            <div className="text-xs text-gray-600">Lost Customers</div>
            <div className="text-xs text-gray-400">Active in May, not in {getMonthName(data.currentMonth)}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-600">{data.customerInsights.consistentPerformers}</div>
            <div className="text-xs text-gray-600">Consistent</div>
            <div className="text-xs text-gray-400">Stable or growing</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">{data.customerInsights.decliningPerformers}</div>
            <div className="text-xs text-gray-600">Declining</div>
            <div className="text-xs text-gray-400">Negative trend</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// NEW: ENHANCED Top Shops Tab Component with Detailed Brand Breakdown
const TopShopsTab = ({ 
  data, 
  currentPage, 
  setCurrentPage, 
  itemsPerPage,
  filters,
  setFilters,
  getFilteredShops,
  exportCSV
}: { 
  data: DashboardData,
  currentPage: number,
  setCurrentPage: (page: number) => void,
  itemsPerPage: number,
  filters: TopShopsFilterState,
  setFilters: (filters: TopShopsFilterState) => void,
  getFilteredShops: (shops: ShopData[]) => ShopData[],
  exportCSV: () => void
}) => {
  const filteredShops = getFilteredShops(data.allShopsComparison);
  const totalPages = Math.ceil(filteredShops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentShops = filteredShops.slice(startIndex, endIndex);

  const departments = [...new Set(data.allShopsComparison.map(shop => shop.department))].sort();
  const salesmen = [...new Set(data.allShopsComparison.map(shop => shop.salesman))].sort();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Shops Analyzed</h3>
          <div className="text-2xl font-bold text-blue-600">{filteredShops.length}</div>
          <div className="text-sm text-gray-500">
            {filters.department || filters.salesman || filters.searchText || filters.minCases || filters.performanceTrend ? 
              `Filtered from ${data.allShopsComparison.length}` : 
              'All shops included'}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Top 3-Month Avg</h3>
          <div className="text-2xl font-bold text-green-600">
            {filteredShops[0]?.threeMonthAvgTotal?.toFixed(1) || 0}
          </div>
          <div className="text-sm text-gray-500">Cases (Mar-Apr-May)</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Average 8PM Performance</h3>
          <div className="text-2xl font-bold text-purple-600">
            {(filteredShops.reduce((sum, shop) => sum + (shop.threeMonthAvg8PM || 0), 0) / Math.max(filteredShops.length, 1)).toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">3-Month Avg Cases</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Average VERVE Performance</h3>
          <div className="text-2xl font-bold text-orange-600">
            {(filteredShops.reduce((sum, shop) => sum + (shop.threeMonthAvgVERVE || 0), 0) / Math.max(filteredShops.length, 1)).toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">3-Month Avg Cases</div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search shops, departments, salesmen..."
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
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filters.salesman}
            onChange={(e) => setFilters({ ...filters, salesman: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Salesmen</option>
            {salesmen.map(salesman => (
              <option key={salesman} value={salesman}>{salesman}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min 3M Avg Cases"
            value={filters.minCases}
            onChange={(e) => setFilters({ ...filters, minCases: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 w-40"
          />

          <select
            value={filters.performanceTrend}
            onChange={(e) => setFilters({ ...filters, performanceTrend: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Trends</option>
            <option value="improving">📈 Improving</option>
            <option value="stable">➡️ Stable</option>
            <option value="declining">📉 Declining</option>
            <option value="new">✨ New</option>
          </select>

          <button
            onClick={() => setFilters({ department: '', salesman: '', searchText: '', minCases: '', performanceTrend: '' })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>

          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <div className="text-sm text-gray-500">
            Showing {filteredShops.length} shops
          </div>
        </div>
      </div>

      {/* Enhanced Top Shops Table with Detailed Brand Breakdown */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Detailed Shop Performance Analysis - Ranked by 3-Month Average (Mar-Apr-May {data.currentYear})
          </h3>
          <p className="text-sm text-gray-500">
            Complete brand breakdown for each month with 3-month averages and growth trends. 
            Sorted by highest 3-month average performance (Mar-Apr-May only).
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Sticky columns */}
                <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  Rank
                </th>
                <th className="sticky left-12 z-10 bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r min-w-48">
                  Shop Name
                </th>
                <th className="sticky left-60 z-10 bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  Department
                </th>
                
                {/* March columns */}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50 border-l border-r">
                  Mar Total
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-purple-500 uppercase tracking-wider bg-blue-50">
                  Mar 8PM
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-orange-500 uppercase tracking-wider bg-blue-50 border-r">
                  Mar VERVE
                </th>
                
                {/* April columns */}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50 border-l border-r">
                  Apr Total
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-purple-500 uppercase tracking-wider bg-green-50">
                  Apr 8PM
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-orange-500 uppercase tracking-wider bg-green-50 border-r">
                  Apr VERVE
                </th>
                
                {/* May columns */}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 border-l border-r">
                  May Total
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-purple-500 uppercase tracking-wider bg-yellow-50">
                  May 8PM
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-orange-500 uppercase tracking-wider bg-yellow-50 border-r">
                  May VERVE
                </th>
                
                {/* June columns */}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-red-50 border-l border-r">
                  {getShortMonthName(data.currentMonth)} Total
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-purple-500 uppercase tracking-wider bg-red-50">
                  {getShortMonthName(data.currentMonth)} 8PM
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-orange-500 uppercase tracking-wider bg-red-50 border-r">
                  {getShortMonthName(data.currentMonth)} VERVE
                </th>
                
                {/* 3-Month Averages */}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50 border-l border-r">
                  3M Avg Total
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-purple-500 uppercase tracking-wider bg-purple-50">
                  3M Avg 8PM
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-orange-500 uppercase tracking-wider bg-purple-50 border-r">
                  3M Avg VERVE
                </th>
                
                {/* Growth metrics */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth %
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  YoY %
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentShops.map((shop, index) => (
                <tr key={shop.shopId} className={`hover:bg-gray-50 ${index < 3 ? 'bg-yellow-50' : ''}`}>
                  {/* Sticky columns */}
                  <td className="sticky left-0 z-10 bg-white px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                    <div className="flex items-center">
                      {startIndex + index + 1}
                      {startIndex + index < 3 && (
                        <span className="ml-2">
                          {startIndex + index === 0 && '🥇'}
                          {startIndex + index === 1 && '🥈'}
                          {startIndex + index === 2 && '🥉'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="sticky left-12 z-10 bg-white px-3 py-4 text-sm text-gray-900 border-r min-w-48">
                    <div className="max-w-xs truncate font-medium">{shop.shopName}</div>
                    <div className="text-xs text-gray-500 truncate">{shop.salesman}</div>
                  </td>
                  <td className="sticky left-60 z-10 bg-white px-3 py-4 whitespace-nowrap text-sm text-gray-900 border-r">
                    {shop.department}
                  </td>
                  
                  {/* March data */}
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-medium bg-blue-50 border-l border-r">
                    {shop.marchTotal?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-purple-600 bg-blue-50">
                    {shop.marchEightPM?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-orange-600 bg-blue-50 border-r">
                    {shop.marchVerve?.toLocaleString() || 0}
                  </td>
                  
                  {/* April data */}
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-medium bg-green-50 border-l border-r">
                    {shop.aprilTotal?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-purple-600 bg-green-50">
                    {shop.aprilEightPM?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-orange-600 bg-green-50 border-r">
                    {shop.aprilVerve?.toLocaleString() || 0}
                  </td>
                  
                  {/* May data */}
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-medium bg-yellow-50 border-l border-r">
                    {shop.mayTotal?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-purple-600 bg-yellow-50">
                    {shop.mayEightPM?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-orange-600 bg-yellow-50 border-r">
                    {shop.mayVerve?.toLocaleString() || 0}
                  </td>
                  
                  {/* June data */}
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-bold bg-red-50 border-l border-r">
                    {shop.juneTotal?.toLocaleString() || shop.total.toLocaleString()}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-purple-600 font-bold bg-red-50">
                    {shop.juneEightPM?.toLocaleString() || shop.eightPM.toLocaleString()}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-orange-600 font-bold bg-red-50 border-r">
                    {shop.juneVerve?.toLocaleString() || shop.verve.toLocaleString()}
                  </td>
                  
                  {/* 3-Month Averages */}
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-600 bg-purple-50 border-l border-r">
                    {shop.threeMonthAvgTotal?.toFixed(1) || '0.0'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-bold text-purple-600 bg-purple-50">
                    {shop.threeMonthAvg8PM?.toFixed(1) || '0.0'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-bold text-orange-600 bg-purple-50 border-r">
                    {shop.threeMonthAvgVERVE?.toFixed(1) || '0.0'}
                  </td>
                  
                  {/* Growth metrics */}
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (shop.growthPercent || 0) > 0 
                        ? 'bg-green-100 text-green-800' 
                        : (shop.growthPercent || 0) < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {shop.growthPercent?.toFixed(1) || 0}%
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (shop.yoyGrowthPercent || 0) > 0 
                        ? 'bg-blue-100 text-blue-800' 
                        : (shop.yoyGrowthPercent || 0) < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {shop.yoyGrowthPercent?.toFixed(1) || 0}%
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      shop.monthlyTrend === 'improving' ? 'bg-green-100 text-green-800' :
                      shop.monthlyTrend === 'declining' ? 'bg-red-100 text-red-800' :
                      shop.monthlyTrend === 'new' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {shop.monthlyTrend === 'improving' ? '📈' :
                       shop.monthlyTrend === 'declining' ? '📉' :
                       shop.monthlyTrend === 'new' ? '✨' : '➡️'}
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredShops.length)} of {filteredShops.length} shops
            {filteredShops.length !== data.allShopsComparison.length && (
              <span className="text-gray-500"> (filtered from {data.allShopsComparison.length} total)</span>
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

      {/* Legend and Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Summary & Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Column Color Coding:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <span>March 2025 Data</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 rounded"></div>
                <span>April 2025 Data</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-100 rounded"></div>
                <span>May 2025 Data</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 rounded"></div>
                <span>{getMonthName(data.currentMonth)} 2025 Data</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-100 rounded"></div>
                <span>3-Month Averages (Mar-Apr-May only)</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Key Metrics:</h4>
            <div className="space-y-1 text-sm">
              <div>• <strong>3M Avg Total:</strong> Average of Mar + Apr + May cases</div>
              <div>• <strong>Growth %:</strong> May to {getMonthName(data.currentMonth)} change</div>
              <div>• <strong>YoY %:</strong> {getMonthName(data.currentMonth)} 2024 vs 2025</div>
              <div>• <strong>Trend:</strong> 4-month performance pattern</div>
              <div>• <strong>Ranking:</strong> Sorted by 3-month average (Mar-Apr-May)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, icon: Icon, color }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: string;
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600'
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-bold text-gray-900">{value}</dd>
              {subtitle && <dd className="text-sm text-gray-500">{subtitle}</dd>}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadicoDashboard;
