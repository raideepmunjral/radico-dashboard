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
  // Extended to 4 months
  februaryTotal?: number;
  februaryEightPM?: number;
  februaryVerve?: number;
  marchTotal?: number;
  marchEightPM?: number;
  marchVerve?: number;
  aprilTotal?: number;
  aprilEightPM?: number;
  aprilVerve?: number;
  mayTotal?: number;
  mayEightPM?: number;
  mayVerve?: number;
  growthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
  skuBreakdown?: SKUData[];
  historicalData?: MonthlyData[];
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
}

interface FilterState {
  department: string;
  salesman: string;
  shop: string;
  searchText: string;
}

// ==========================================
// PART 2: CONFIGURATION & CONSTANTS
// ==========================================

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
  // NEW: Add inventory toggle state
  const [showInventory, setShowInventory] = useState(false);

  // FIXED CONFIGURATION WITH PROPER HISTORICAL DATA SHEET
  const SHEETS_CONFIG = {
    masterSheetId: process.env.NEXT_PUBLIC_MASTER_SHEET_ID || '1pRz9CgOoamTrFipnmF-XuBCg9IZON9br5avgRlKYtxM',
    visitSheetId: process.env.NEXT_PUBLIC_VISIT_SHEET_ID || '1XG4c_Lrpk-YglTq3G3ZY9Qjt7wSnUq0UZWDSYT61eWE',
    historicalSheetId: process.env.NEXT_PUBLIC_HISTORICAL_SHEET_ID || '1yXzEYHJeHlETrEmU4TZ9F2_qv4OE10N4DPdYX0Iqfx0',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  };

  // ENHANCED BRAND FAMILY MAPPING - CONSISTENT WITH CURRENT DATA PROCESSING
  const brandFamily: Record<string, string> = {
    // Historical Data Brand Short Variations (FIXED to match your data)
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
    
    // VERVE Variations (current data)
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
  
  // FIXED: Helper function to determine brand family with consistent logic
  const getBrandFamily = (brandShort?: string, brand?: string): string | null => {
    // Clean and trim inputs
    const cleanBrandShort = brandShort?.toString().trim();
    const cleanBrand = brand?.toString().trim();
    
    // Try exact match first with brand short (priority for historical data)
    if (cleanBrandShort && brandFamily[cleanBrandShort]) {
      return brandFamily[cleanBrandShort];
    }
    
    // Try exact match with full brand name
    if (cleanBrand && brandFamily[cleanBrand]) {
      return brandFamily[cleanBrand];
    }
    
    // Try partial matching for consistent patterns
    const combinedText = ((cleanBrandShort || '') + ' ' + (cleanBrand || '')).toUpperCase();
    
    // VERVE pattern matching
    if (combinedText.includes('VERVE') || combinedText.includes('M2 MAGIC MOMENTS VERVE')) return 'VERVE';
    
    // 8PM pattern matching
    if (combinedText.includes('8PM') || combinedText.includes('8 PM')) return '8PM';
    if (combinedText.includes('PREMIUM BLACK') && (combinedText.includes('WHISKY') || combinedText.includes('BLENDED'))) return '8PM';
    
    return null;
  };

  // ==========================================
  // PART 3: DATA FETCHING FUNCTIONS
  // ==========================================

  // ENHANCED MAIN DATA FETCHING FUNCTION
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!SHEETS_CONFIG.apiKey) {
        throw new Error('Google API key not configured. Please set NEXT_PUBLIC_GOOGLE_API_KEY environment variable.');
      }

      // Fetch all data sources
      const [masterData, visitData, historicalData] = await Promise.all([
        fetchMasterSheetData(),
        fetchVisitSheetData(),
        fetchHistoricalSheetData()
      ]);
      
      // Process data with enhanced logic
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

  // EXISTING MASTER SHEET FETCH (UNCHANGED)
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

  // EXISTING VISIT SHEET FETCH (UNCHANGED)
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

  // COMPLETELY FIXED HISTORICAL DATA FETCH FUNCTION
  const fetchHistoricalSheetData = async () => {
    try {
      // Try the known sheet name first
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
  // PART 4: ENHANCED DATA PROCESSING LOGIC (UPDATED FOR 6 MONTHS HISTORICAL + 4 MONTHS SHOP ANALYSIS)
  // ==========================================

  const processEnhancedRadicoData = (masterData: Record<string, any[]>, visitData: any[], historicalData: any[]): DashboardData => {
    const shopDetails = masterData['Shop Details'] || [];
    const targets = masterData['Target Vs Achievement'] || [];
    const challans = masterData['Pending Challans'] || [];
    
    console.log('🔧 PROCESSING DATA WITH EXTENDED HISTORICAL ANALYSIS (6 MONTHS) AND SHOP ANALYSIS (4 MONTHS)');
    console.log('Historical Data Length:', historicalData?.length || 0);
    
    // ENHANCED MONTHLY DATA PROCESSING WITH PROPER DATE HANDLING (EXTENDED TO 6 MONTHS)
    const processMonthlyData = (monthNumber: string, year: string = '2025', useHistorical: boolean = false) => {
      let monthShopSales: Record<string, any> = {};
      let monthlyUniqueShops = new Set<string>();
      let monthly8PM = 0, monthlyVERVE = 0;

      if (useHistorical && historicalData.length > 1) {
        console.log(`📊 Processing historical data for month ${monthNumber}-${year}`);
        
        const headers = historicalData[0] || [];
        console.log('📋 Historical headers:', headers);
        
        // Process historical data rows
        let processedRows = 0;
        let targetMonthRows = 0;
        
        historicalData.slice(1).forEach((row, index) => {
          if (row && row.length >= 13) {
            processedRows++;
            
            const shopName = row[0]?.toString().trim(); // shop_name
            const brandShort = row[3]?.toString().trim(); // Brand short  
            const cases = parseFloat(row[5]) || 0; // cases
            const dateStr = row[7]?.toString().trim(); // Date
            const fullBrand = row[10]?.toString().trim(); // brand
            const shopId = row[12]?.toString().trim(); // shop_id
            
            // FIXED: Parse DD-MM-YYYY format and check for target month
            if (dateStr && cases > 0) {
              const dateParts = dateStr.split('-');
              if (dateParts.length === 3) {
                const day = dateParts[0];
                const month = dateParts[1]; 
                const yearPart = dateParts[2];
                
                // Check if this row is for the target month
                if (month === monthNumber && yearPart === year) {
                  targetMonthRows++;
                  
                  const shopIdentifier = shopId || shopName;
                  if (shopIdentifier) {
                    monthlyUniqueShops.add(shopIdentifier);
                    
                    // FIXED: Use consistent brand family mapping
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
          totalVERVE: monthlyVERVE,
          shopSalesCount: Object.keys(monthShopSales).length
        });
        
      } else {
        // Use current data source for April and May
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

    // EXTENDED: Process 6 months for historical analysis + 4 months for shop analysis
    const mayData = processMonthlyData('05', '2025', false);
    const aprilData = processMonthlyData('04', '2025', false);
    const marchData = processMonthlyData('03', '2025', true); // Use historical data for March
    const februaryData = processMonthlyData('02', '2025', true); // NEW: February for 4-month shop analysis
    const januaryData = processMonthlyData('01', '2025', true); // NEW: January for 6-month historical
    const decemberData = processMonthlyData('12', '2024', true); // NEW: December for 6-month historical
    
    console.log('📊 EXTENDED MONTH PROCESSING RESULTS (6 MONTHS):');
    console.log('May:', { total8PM: mayData.total8PM, totalVERVE: mayData.totalVERVE, shops: mayData.uniqueShops.size });
    console.log('April:', { total8PM: aprilData.total8PM, totalVERVE: aprilData.totalVERVE, shops: aprilData.uniqueShops.size });
    console.log('March:', { total8PM: marchData.total8PM, totalVERVE: marchData.totalVERVE, shops: marchData.uniqueShops.size });
    console.log('February:', { total8PM: februaryData.total8PM, totalVERVE: februaryData.totalVERVE, shops: februaryData.uniqueShops.size });
    console.log('January:', { total8PM: januaryData.total8PM, totalVERVE: januaryData.totalVERVE, shops: januaryData.uniqueShops.size });
    console.log('December:', { total8PM: decemberData.total8PM, totalVERVE: decemberData.totalVERVE, shops: decemberData.uniqueShops.size });
    
    // Current month primary data
    const total8PM = mayData.total8PM;
    const totalVERVE = mayData.totalVERVE;
    const uniqueShops = mayData.uniqueShops;

    // ENHANCED SHOP DATA BUILDING WITH PROPER SHOP NAME MAPPING (EXTENDED TO 4 MONTHS)
    const shopSales: Record<string, ShopData> = {};
    
    // Build comprehensive shop name mapping from Shop Details
    const shopNameMap: Record<string, string> = {};
    const shopDetailsMap: Record<string, any> = {};
    
    shopDetails.slice(1).forEach(row => {
      const shopId = row[0]?.toString().trim();
      const salesmanEmail = row[1]?.toString().trim(); // This is the email
      const dept = row[2]?.toString().trim() === "DSIIDC" ? "DSIDC" : row[2]?.toString().trim();
      const shopName = row[3]?.toString().trim(); // FIXED: Shop name is in column D (index 3)
      const salesman = row[4]?.toString().trim();
      
      if (shopId && shopName) {
        shopNameMap[shopId] = shopName;
        shopDetailsMap[shopId] = { shopName, dept, salesman, salesmanEmail };
        // Also map by shop name for historical data matching
        shopNameMap[shopName] = shopName;
        shopDetailsMap[shopName] = { shopName, dept, salesman, shopId, salesmanEmail };
      }
    });

    // Process May data (current month) - ENHANCED FOR 4 MONTHS
    mayData.challans.forEach(row => {
      if (row.length >= 15) {
        const shopId = row[8]?.toString().trim();
        const shopNameFromChallan = row[9]?.toString().trim();
        const brand = row[11]?.toString().trim();
        const cases = parseFloat(row[14]) || 0;
        
        if (shopId && brand && cases > 0) {
          // Get actual shop name from Shop Details, not from challan
          const actualShopName = shopNameMap[shopId] || shopNameFromChallan || 'Unknown Shop';
          
          if (!shopSales[shopId]) {
            const shopDetails = shopDetailsMap[shopId] || {};
            shopSales[shopId] = { 
              shopId,
              shopName: actualShopName, // Use actual shop name
              department: shopDetails.dept || 'Unknown',
              salesman: shopDetails.salesman || 'Unknown',
              total: 0,
              eightPM: 0,
              verve: 0,
              mayTotal: 0,
              mayEightPM: 0,
              mayVerve: 0,
              aprilTotal: 0,
              aprilEightPM: 0,
              aprilVerve: 0,
              marchTotal: 0,
              marchEightPM: 0,
              marchVerve: 0,
              // NEW: February data for 4-month analysis
              februaryTotal: 0,
              februaryEightPM: 0,
              februaryVerve: 0,
              monthlyTrend: 'stable',
              skuBreakdown: []
            };
          }
          
          const parentBrand = getBrandFamily(brand, brand);
          shopSales[shopId].total += cases;
          shopSales[shopId].mayTotal! += cases;
          
          if (parentBrand === "8PM") {
            shopSales[shopId].eightPM += cases;
            shopSales[shopId].mayEightPM! += cases;
          } else if (parentBrand === "VERVE") {
            shopSales[shopId].verve += cases;
            shopSales[shopId].mayVerve! += cases;
          }

          // Enhanced SKU breakdown
          const existing = shopSales[shopId].skuBreakdown!.find(sku => sku.brand === brand);
          if (existing) {
            existing.cases += cases;
          } else {
            shopSales[shopId].skuBreakdown!.push({ brand, cases, percentage: 0, month: 'May' });
          }
        }
      }
    });

    // ENHANCED: Add April, March, and February data with proper shop identification (4 MONTHS)
    [aprilData, marchData, februaryData].forEach((monthData, index) => {
      const monthKey = index === 0 ? 'april' : index === 1 ? 'march' : 'february';
      
      Object.keys(monthData.shopSales).forEach(shopIdentifier => {
        const monthShopData = monthData.shopSales[shopIdentifier];
        
        // ENHANCED: Handle both shop ID and shop name based identification
        let actualShopId = shopIdentifier;
        let actualShopName = monthShopData.shopName || shopIdentifier;
        
        // First, try direct shop ID lookup
        if (shopDetailsMap[shopIdentifier]) {
          const details = shopDetailsMap[shopIdentifier];
          actualShopId = details.shopId || shopIdentifier;
          actualShopName = details.shopName || actualShopName;
        } else {
          // Try to find by shop name in Shop Details
          const matchingShop = shopDetails.slice(1).find(row => 
            row[1]?.toString().trim() === shopIdentifier
          );
          
          if (matchingShop) {
            actualShopId = matchingShop[0]?.toString().trim();
            actualShopName = matchingShop[1]?.toString().trim();
          } else {
            // If no match found, use the identifier as shop name if it looks like a name
            if (!shopIdentifier.includes('@') && !shopIdentifier.includes('.com')) {
              actualShopName = shopIdentifier;
            }
          }
        }
        
        if (!shopSales[actualShopId]) {
          // Shop existed in previous month but not current month
          const shopDetails = shopDetailsMap[actualShopId] || shopDetailsMap[actualShopName] || {};
          shopSales[actualShopId] = {
            shopId: actualShopId,
            shopName: actualShopName, // Use resolved shop name
            department: shopDetails.dept || 'Unknown',
            salesman: shopDetails.salesman || 'Unknown',
            total: 0,
            eightPM: 0,
            verve: 0,
            mayTotal: 0,
            mayEightPM: 0,
            mayVerve: 0,
            aprilTotal: 0,
            aprilEightPM: 0,
            aprilVerve: 0,
            marchTotal: 0,
            marchEightPM: 0,
            marchVerve: 0,
            // NEW: February data
            februaryTotal: 0,
            februaryEightPM: 0,
            februaryVerve: 0,
            monthlyTrend: 'declining',
            skuBreakdown: []
          };
        }
        
        // Add historical data
        if (monthKey === 'april') {
          shopSales[actualShopId].aprilTotal = monthShopData.total;
          shopSales[actualShopId].aprilEightPM = monthShopData.eightPM;
          shopSales[actualShopId].aprilVerve = monthShopData.verve;
        } else if (monthKey === 'march') {
          shopSales[actualShopId].marchTotal = monthShopData.total;
          shopSales[actualShopId].marchEightPM = monthShopData.eightPM;
          shopSales[actualShopId].marchVerve = monthShopData.verve;
        } else if (monthKey === 'february') {
          // NEW: February data
          shopSales[actualShopId].februaryTotal = monthShopData.total;
          shopSales[actualShopId].februaryEightPM = monthShopData.eightPM;
          shopSales[actualShopId].februaryVerve = monthShopData.verve;
        }
      });
    });

    // ENHANCED GROWTH AND TREND CALCULATION (UPDATED FOR 4 MONTHS)
    Object.keys(shopSales).forEach(shopId => {
      const shop = shopSales[shopId];
      const may = shop.mayTotal || 0;
      const april = shop.aprilTotal || 0;
      const march = shop.marchTotal || 0;
      const february = shop.februaryTotal || 0; // NEW
      
      // Calculate month-over-month growth (April to May)
      if (april > 0) {
        shop.growthPercent = Math.round(((may - april) / april) * 100 * 100) / 100;
      } else if (may > 0) {
        shop.growthPercent = 100; // New customer
      } else {
        shop.growthPercent = -100; // Lost customer
      }
      
      // ENHANCED TREND LOGIC (4 MONTHS)
      if (february === 0 && march === 0 && april === 0 && may > 0) {
        shop.monthlyTrend = 'new';
      } else if ((february > 0 || march > 0 || april > 0) && may === 0) {
        shop.monthlyTrend = 'declining';
      } else if (february > 0 && march > february && april > march && may > april) {
        shop.monthlyTrend = 'improving';
      } else if (february > 0 && march < february && april < march && may < april && may > 0) {
        shop.monthlyTrend = 'declining';
      } else if (may > 0 && april > 0 && Math.abs(shop.growthPercent!) <= 10) {
        shop.monthlyTrend = 'stable';
      } else if (may > april && april > 0) {
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

    // Enhance shop data with department and salesman info - CORRECTED COLUMN MAPPING
    shopDetails.slice(1).forEach(row => {
      const shopId = row[0]?.toString().trim();
      const dept = row[2]?.toString().trim() === "DSIIDC" ? "DSIDC" : row[2]?.toString().trim();
      const salesman = row[4]?.toString().trim(); // Actual salesman name is in column E (index 4)
      
      if (shopId && shopSales[shopId]) {
        shopSales[shopId].department = dept || 'Unknown';
        shopSales[shopId].salesman = salesman || 'Unknown';
      }
    });

    // ENHANCED CUSTOMER INSIGHTS ANALYSIS (4 MONTHS)
    const allCurrentShops = Object.values(shopSales).filter(shop => shop.mayTotal! > 0);
    
    const newShops = Object.values(shopSales).filter(shop => 
      shop.mayTotal! > 0 && shop.aprilTotal === 0 && shop.marchTotal === 0 && shop.februaryTotal === 0
    );
    
    const lostShops = Object.values(shopSales).filter(shop => 
      shop.mayTotal === 0 && shop.aprilTotal! > 0
    );

    const consistentShops = Object.values(shopSales).filter(shop => 
      shop.mayTotal! > 0 && shop.aprilTotal! > 0 && 
      (shop.monthlyTrend === 'improving' || (shop.monthlyTrend === 'stable' && shop.growthPercent! >= -5))
    );

    const decliningShops = Object.values(shopSales).filter(shop => 
      shop.monthlyTrend === 'declining' || (shop.mayTotal! > 0 && shop.growthPercent! < -10)
    );

    const customerInsights: CustomerInsights = {
      firstTimeCustomers: newShops.length,
      lostCustomers: lostShops.length,
      consistentPerformers: consistentShops.length,
      decliningPerformers: decliningShops.length,
      newShops: newShops.sort((a, b) => b.mayTotal! - a.mayTotal!),
      lostShops: lostShops.sort((a, b) => b.aprilTotal! - a.aprilTotal!),
      consistentShops: consistentShops.sort((a, b) => b.growthPercent! - a.growthPercent!),
      decliningShops: decliningShops.sort((a, b) => a.growthPercent! - b.growthPercent!)
    };

    console.log('🎯 ENHANCED CUSTOMER INSIGHTS SUMMARY (4 MONTHS):', {
      firstTime: customerInsights.firstTimeCustomers,
      lost: customerInsights.lostCustomers,
      consistent: customerInsights.consistentPerformers,
      declining: customerInsights.decliningPerformers
    });

    // Rest of the processing logic remains the same...
    const allShopsComparison = Object.values(shopSales)
      .sort((a, b) => (b.mayTotal! || 0) - (a.mayTotal! || 0));

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

    // FIXED: Process targets for May 2025 - SUM TARGETS BY SALESMAN
    let total8PMTarget = 0, totalVerveTarget = 0;
    const salespersonStats: Record<string, any> = {};

    // First, create a mapping of shop IDs to salesmen from Shop Details
    const shopToSalesmanMap: Record<string, string> = {};
    shopDetails.slice(1).forEach(row => {
      const shopId = row[0]?.toString().trim();
      const salesmanName = row[4]?.toString().trim(); // Column E (index 4) is salesman name
      if (shopId && salesmanName) {
        shopToSalesmanMap[shopId] = salesmanName;
      }
    });

    // Now process targets and sum by salesman
    targets.slice(1).forEach(row => {
      if (row.length >= 10) {
        const shopId = row[0]?.toString().trim(); // Shop ID from target sheet
        const targetMonth = row[9]?.toString().trim();
        
        if (targetMonth && targetMonth.includes('05-2025') && shopId) {
          const eightPMTarget = parseFloat(row[5]) || 0;
          const verveTarget = parseFloat(row[7]) || 0;
          
          total8PMTarget += eightPMTarget;
          totalVerveTarget += verveTarget;
          
          // Get salesman name for this shop
          const salesmanName = shopToSalesmanMap[shopId];
          
          if (salesmanName) {
            if (!salespersonStats[salesmanName]) {
              salespersonStats[salesmanName] = {
                name: salesmanName,
                eightPmTarget: 0,
                verveTarget: 0
              };
            }
            // Sum targets for this salesman
            salespersonStats[salesmanName].eightPmTarget += eightPMTarget;
            salespersonStats[salesmanName].verveTarget += verveTarget;
          }
        }
      }
    });

    console.log('🎯 FIXED SALESMAN TARGETS:', salespersonStats);

    // Calculate achievements
    const eightPmAchievement = total8PMTarget > 0 ? ((total8PM / total8PMTarget) * 100).toFixed(1) : '0';
    const verveAchievement = totalVerveTarget > 0 ? ((totalVERVE / totalVerveTarget) * 100).toFixed(1) : '0';

    // Top performing shops
    const topShops = Object.values(shopSales)
      .sort((a, b) => b.total - a.total)
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
        verveAchievement
      },
      topShops,
      deptPerformance,
      salesData: shopSales,
      visitData: visitData.length > 1 ? visitData.length - 1 : 0,
      lastUpdated,
      salespersonStats,
      customerInsights,
      allShopsComparison,
      // Store 6-month historical data for the Historical Analysis tab
      historicalData: {
        may: mayData,
        april: aprilData,
        march: marchData,
        february: februaryData,
        january: januaryData,
        december: decemberData
      }
    };
  };

  // Filter shops based on current filter state
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

  // Get unique values for filter dropdowns
  const getFilterOptions = (shops: ShopData[], field: keyof ShopData): string[] => {
    const values = shops.map(shop => shop[field] as string).filter(Boolean);
    return Array.from(new Set(values)).sort();
  };

  // Enhanced SKU Modal Component
  const EnhancedSKUModal = ({ shop, onClose }: { shop: ShopData, onClose: () => void }) => {
    const [activeMonth, setActiveMonth] = useState('May');
    
    const getSKUDataForMonth = (month: string) => {
      if (month === 'May') {
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
            {['February', 'March', 'April', 'May'].map((month) => (
              <button
                key={month}
                onClick={() => setActiveMonth(month)}
                className={`px-6 py-3 font-medium ${
                  activeMonth === month
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {month} 2025
              </button>
            ))}
          </div>

          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {activeMonth === 'May' ? shop.mayTotal || shop.total :
                   activeMonth === 'April' ? shop.aprilTotal || 0 :
                   activeMonth === 'March' ? shop.marchTotal || 0 :
                   shop.februaryTotal || 0}
                </div>
                <div className="text-sm text-gray-500">Total Cases</div>
              </div>
              <div className="text-center bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {activeMonth === 'May' ? shop.mayEightPM || shop.eightPM :
                   activeMonth === 'April' ? shop.aprilEightPM || 0 :
                   activeMonth === 'March' ? shop.marchEightPM || 0 :
                   shop.februaryEightPM || 0}
                </div>
                <div className="text-sm text-gray-500">8PM Cases</div>
              </div>
              <div className="text-center bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {activeMonth === 'May' ? shop.mayVerve || shop.verve :
                   activeMonth === 'April' ? shop.aprilVerve || 0 :
                   activeMonth === 'March' ? shop.marchVerve || 0 :
                   shop.februaryVerve || 0}
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
      
      doc.setFontSize(16);
      doc.text('Executive Summary', 20, 50);
      
      const summaryData = [
        ['Total Shops', dashboardData.summary.totalShops.toString()],
        ['Billed Shops', dashboardData.summary.billedShops.toString()],
        ['Coverage', `${dashboardData.summary.coverage}%`],
        ['8PM Sales', `${dashboardData.summary.total8PM} cases`],
        ['8PM Achievement', `${dashboardData.summary.eightPmAchievement}%`],
        ['VERVE Sales', `${dashboardData.summary.totalVERVE} cases`],
        ['VERVE Achievement', `${dashboardData.summary.verveAchievement}%`],
        ['Total Sales', `${dashboardData.summary.totalSales} cases`]
      ];

      (doc as any).autoTable({
        head: [['Metric', 'Value']],
        body: summaryData,
        startY: 60,
        theme: 'grid'
      });

      doc.save(`Radico_Enhanced_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
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
      csvContent += "Radico Enhanced Shop Analysis Report - 4-Month Comparison - " + new Date().toLocaleDateString() + "\n";
      
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
      csvContent += "VERVE Sales," + dashboardData.summary.totalVERVE + " cases\n\n";
      
      csvContent += "CUSTOMER INSIGHTS\n";
      csvContent += "First-time Customers," + dashboardData.customerInsights.firstTimeCustomers + "\n";
      csvContent += "Lost Customers," + dashboardData.customerInsights.lostCustomers + "\n";
      csvContent += "Consistent Performers," + dashboardData.customerInsights.consistentPerformers + "\n";
      csvContent += "Declining Performers," + dashboardData.customerInsights.decliningPerformers + "\n\n";
      
      csvContent += "FILTERED SHOP COMPARISON (FEB-MAR-APR-MAY 2025)\n";
      csvContent += "Shop Name,Department,Salesman,Feb Cases,Mar Cases,Apr Cases,May Cases,8PM Cases,VERVE Cases,Growth %,Monthly Trend\n";
      
      filteredShops.forEach(shop => {
        csvContent += `"${shop.shopName}","${shop.department}","${shop.salesman}",${shop.februaryTotal || 0},${shop.marchTotal || 0},${shop.aprilTotal || 0},${shop.mayTotal || shop.total},${shop.eightPM},${shop.verve},${shop.growthPercent?.toFixed(1) || 0}%,"${shop.monthlyTrend || 'stable'}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Radico_Enhanced_Analysis_${new Date().toISOString().split('T')[0]}.csv`);
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
          <p className="text-gray-600">Processing live data with enhanced analytics...</p>
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
                Live Data
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              <div className="flex space-x-2">
                {/* NEW: Inventory Toggle Button */}
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

      {/* Conditional Rendering: Show Inventory or Sales Dashboard */}
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
                {activeTab === 'shops' && <TopShopsTab data={dashboardData} />}
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

// FIXED: Salesman Performance Tab Component (WITH CORRECTED TARGET CALCULATION)
const SalesmanPerformanceTab = ({ data }: { data: DashboardData }) => {
  // Calculate salesman performance data
  const salesmanPerformance = React.useMemo(() => {
    const performanceMap: Record<string, any> = {};
    
    // Initialize from shop details to get all salesmen and their assigned shops
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
          shops: []
        };
      }
      
      performanceMap[salesmanName].totalShops++;
      
      if (shop.total > 0) {
        performanceMap[salesmanName].billedShops++;
        performanceMap[salesmanName].total8PM += shop.eightPM;
        performanceMap[salesmanName].totalVERVE += shop.verve;
        performanceMap[salesmanName].totalSales += shop.total;
        performanceMap[salesmanName].shops.push(shop);
      }
    });
    
    // FIXED: Add target data from salespersonStats (which now contains summed targets)
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

  // Sort by total sales
  const sortedSalesmen = salesmanPerformance.sort((a: any, b: any) => b.totalSales - a.totalSales);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Salesman Performance Dashboard</h2>
        <p className="text-gray-600">Individual salesman achievements and targets for May 2025 (FIXED TARGET CALCULATION)</p>
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
          <h3 className="text-lg font-medium text-gray-900">Salesman Performance Details (FIXED TARGETS)</h3>
          <p className="text-sm text-gray-500">Complete performance breakdown with corrected targets (sum of all shop targets per salesman)</p>
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

      {/* Performance Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievement Chart */}
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

        {/* Coverage vs Sales */}
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

      {/* Individual Achievements Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-orange-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Salesman Achievement Summary</h3>
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

// Tab Components
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
          <h3 className="text-lg font-medium text-gray-900">Complete Shop Analysis - 4-Month Comparison (Feb-Mar-Apr-May 2025)</h3>
          <p className="text-sm text-gray-500">
            {filteredShops.length} shops {filters.department || filters.salesman || filters.searchText ? '(filtered)' : ''} 
            ranked by current month performance with extended historical data integration
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
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feb Cases</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mar Cases</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apr Cases</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">May Cases</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth %</th>
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
                    {shop.februaryTotal?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shop.marchTotal?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shop.aprilTotal?.toLocaleString() || 0}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    <button
                      onClick={() => onShowSKU(shop)}  
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {shop.mayTotal?.toLocaleString() || 0}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">May Cases</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.customerInsights.newShops.slice(0, 10).map((shop) => (
                  <tr key={shop.shopId}>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.shopName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.salesman}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">{shop.mayTotal || shop.total}</td>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apr Cases</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.customerInsights.lostShops.slice(0, 10).map((shop) => (
                  <tr key={shop.shopId}>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.shopName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.salesman}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600">{shop.aprilTotal}</td>
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

// ENHANCED: Historical Analysis Tab Component (UPDATED TO 6 MONTHS)
const HistoricalAnalysisTab = ({ data }: { data: DashboardData }) => {
  const [debugInfo, setDebugInfo] = React.useState<any>(null);

  useEffect(() => {
    if (data.historicalData) {
      setDebugInfo({
        hasHistoricalData: !!data.historicalData,
        historicalData: data.historicalData,
        customerInsights: data.customerInsights,
        // Calculate totals for all 6 months
        monthlyTotals: {
          december: {
            shops: data.historicalData.december?.uniqueShops?.size || 0,
            total8PM: data.historicalData.december?.total8PM || 0,
            totalVERVE: data.historicalData.december?.totalVERVE || 0
          },
          january: {
            shops: data.historicalData.january?.uniqueShops?.size || 0,
            total8PM: data.historicalData.january?.total8PM || 0,
            totalVERVE: data.historicalData.january?.totalVERVE || 0
          },
          february: {
            shops: data.historicalData.february?.uniqueShops?.size || 0,
            total8PM: data.historicalData.february?.total8PM || 0,
            totalVERVE: data.historicalData.february?.totalVERVE || 0
          },
          march: {
            shops: data.historicalData.march?.uniqueShops?.size || 0,
            total8PM: data.historicalData.march?.total8PM || 0,
            totalVERVE: data.historicalData.march?.totalVERVE || 0
          },
          april: {
            shops: data.historicalData.april?.uniqueShops?.size || 0,
            total8PM: data.historicalData.april?.total8PM || 0,
            totalVERVE: data.historicalData.april?.totalVERVE || 0
          },
          may: {
            shops: data.historicalData.may?.uniqueShops?.size || 0,
            total8PM: data.historicalData.may?.total8PM || 0,
            totalVERVE: data.historicalData.may?.totalVERVE || 0
          }
        }
      });
    }
  }, [data]);

  // Calculate month-over-month growth for 6 months
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100);
  };

  // Monthly data for 6 months
  const monthlyData = debugInfo?.monthlyTotals ? [
    { 
      month: 'December 2024',
      total: debugInfo.monthlyTotals.december.total8PM + debugInfo.monthlyTotals.december.totalVERVE,
      total8PM: debugInfo.monthlyTotals.december.total8PM,
      totalVERVE: debugInfo.monthlyTotals.december.totalVERVE,
      shops: debugInfo.monthlyTotals.december.shops,
      growth: 0 // Base month
    },
    { 
      month: 'January 2025',
      total: debugInfo.monthlyTotals.january.total8PM + debugInfo.monthlyTotals.january.totalVERVE,
      total8PM: debugInfo.monthlyTotals.january.total8PM,
      totalVERVE: debugInfo.monthlyTotals.january.totalVERVE,
      shops: debugInfo.monthlyTotals.january.shops,
      growth: calculateGrowth(
        debugInfo.monthlyTotals.january.total8PM + debugInfo.monthlyTotals.january.totalVERVE,
        debugInfo.monthlyTotals.december.total8PM + debugInfo.monthlyTotals.december.totalVERVE
      )
    },
    { 
      month: 'February 2025',
      total: debugInfo.monthlyTotals.february.total8PM + debugInfo.monthlyTotals.february.totalVERVE,
      total8PM: debugInfo.monthlyTotals.february.total8PM,
      totalVERVE: debugInfo.monthlyTotals.february.totalVERVE,
      shops: debugInfo.monthlyTotals.february.shops,
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
      growth: calculateGrowth(
        debugInfo.monthlyTotals.april.total8PM + debugInfo.monthlyTotals.april.totalVERVE,
        debugInfo.monthlyTotals.march.total8PM + debugInfo.monthlyTotals.march.totalVERVE
      )
    },
    { 
      month: 'May 2025 (Current)',
      total: debugInfo.monthlyTotals.may.total8PM + debugInfo.monthlyTotals.may.totalVERVE,
      total8PM: debugInfo.monthlyTotals.may.total8PM,
      totalVERVE: debugInfo.monthlyTotals.may.totalVERVE,
      shops: debugInfo.monthlyTotals.may.shops,
      growth: calculateGrowth(
        debugInfo.monthlyTotals.may.total8PM + debugInfo.monthlyTotals.may.totalVERVE,
        debugInfo.monthlyTotals.april.total8PM + debugInfo.monthlyTotals.april.totalVERVE
      )
    }
  ] : [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Historical Analysis & Trends</h2>
        <p className="text-gray-600">6-Month Business Performance Analysis (December 2024 - May 2025)</p>
      </div>

      {/* ENHANCED: 6-Month Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* ENHANCED: 6-Month Sales Trend */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">6-Month Sales Trend</h3>
        <div className="space-y-6">
          {/* 8PM Trend */}
          <div>
            <h4 className="font-medium text-purple-600 mb-2">8PM Family Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {monthlyData.map((month) => (
                <div key={month.month} className="text-center">
                  <div className="text-lg font-bold text-purple-600">{month.total8PM.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* VERVE Trend */}
          <div>
            <h4 className="font-medium text-orange-600 mb-2">VERVE Family Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {monthlyData.map((month) => (
                <div key={month.month} className="text-center">
                  <div className="text-lg font-bold text-orange-600">{month.totalVERVE.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Sales Trend */}
          <div>
            <h4 className="font-medium text-blue-600 mb-2">Total Sales Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {monthlyData.map((month) => (
                <div key={month.month} className="text-center">
                  <div className="text-lg font-bold text-blue-600">{month.total.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{month.month.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Journey Analysis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Journey Analysis (4-Month Comparison)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.customerInsights.firstTimeCustomers}</div>
            <div className="text-sm text-gray-500">New Customers</div>
            <div className="text-xs text-gray-400">Started in May</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{data.customerInsights.lostCustomers}</div>
            <div className="text-sm text-gray-500">Lost Customers</div>
            <div className="text-xs text-gray-400">Active in April, not in May</div>
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

      {/* ENHANCED: 6-Month Performance Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">6-Month Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Growth Analysis</h4>
            <div className="space-y-2">
              {monthlyData.slice(1).map((month) => (
                <div key={month.month} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{month.month.split(' ')[0]}:</span>
                  <span className={`text-sm font-medium ${month.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {month.growth >= 0 ? '+' : ''}{month.growth.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Brand Mix Trends</h4>
            <div className="space-y-2">
              {monthlyData.slice(-3).map((month) => (
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
              <h3 className="text-lg font-medium text-green-900 mb-2">6-Month Historical Data Integration: Complete</h3>
              <p className="text-green-700 mb-4">
                Successfully integrated 6 months of historical data with enhanced trend analysis and performance insights.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-blue-600">6</div>
                  <div className="text-sm text-gray-600">Months Analyzed</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-purple-600">
                    {(debugInfo.monthlyTotals.march?.total8PM + debugInfo.monthlyTotals.april?.total8PM + debugInfo.monthlyTotals.may?.total8PM).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total 8PM (Q2)</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-2xl font-bold text-orange-600">
                    {(debugInfo.monthlyTotals.march?.totalVERVE + debugInfo.monthlyTotals.april?.totalVERVE + debugInfo.monthlyTotals.may?.totalVERVE).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total VERVE (Q2)</div>
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

const DepartmentTab = ({ data }: { data: DashboardData }) => (
  <div className="space-y-6">
    {/* Department Performance Overview */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Department Performance Overview - May 2025</h3>
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
        <h3 className="text-lg font-medium text-gray-900">Department Performance Analysis</h3>
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
              
              // Calculate brand share for this department
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

const OverviewTab = ({ data }: { data: DashboardData }) => (
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
        subtitle={`${data.summary.eightPmAchievement}% achievement`}
        icon={BarChart3}
        color="purple"
      />
      <MetricCard
        title="VERVE Sales"
        value={`${data.summary.totalVERVE.toLocaleString()} cases`}
        subtitle={`${data.summary.verveAchievement}% achievement`}
        icon={BarChart3}
        color="orange"
      />
    </div>

    {/* Enhanced Sales vs Target Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">8PM Performance - May 2025</h3>
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
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">VERVE Performance - May 2025</h3>
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
        </div>
      </div>
    </div>

    {/* Enhanced Brand Distribution and Achievement Summary */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Distribution - May 2025</h3>
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Achievement Summary - May 2025</h3>
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
        </div>
      </div>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Statistics - May 2025</h3>
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
      <h3 className="text-lg font-medium text-gray-900 mb-4">4-Month Customer Journey Analysis</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">{data.customerInsights.firstTimeCustomers}</div>
          <div className="text-xs text-gray-600">New Customers</div>
          <div className="text-xs text-gray-400">Started billing in May</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">{data.customerInsights.lostCustomers}</div>
          <div className="text-xs text-gray-600">Lost Customers</div>
          <div className="text-xs text-gray-400">Active in April, not in May</div>
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

// ENHANCED: Top Shops Tab (UPDATED TO 4 MONTHS)
const TopShopsTab = ({ data }: { data: DashboardData }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">Top 20 Performing Shops - May 2025</h3>
      <p className="text-sm text-gray-500">Ranked by total cases sold with complete 4-month comparison (Feb-Mar-Apr-May)</p>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feb Cases</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mar Cases</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apr Cases</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">May Cases</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth %</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">8PM Cases</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VERVE Cases</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.topShops.map((shop, index) => (
            <tr key={shop.shopId} className={index < 3 ? 'bg-yellow-50' : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
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
              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.shopName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.salesman}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{shop.februaryTotal?.toLocaleString() || 0}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shop.marchTotal?.toLocaleString() || 0}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shop.aprilTotal?.toLocaleString() || 0}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{shop.total.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">{shop.eightPM.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{shop.verve.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

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
