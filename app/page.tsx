'use client';

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, MapPin, TrendingUp, Users, ShoppingBag, BarChart3, Calendar, Trophy, Building, Target, Activity, FileText, Table, X, ChevronLeft, ChevronRight, Star, AlertTriangle, TrendingDown, UserPlus, Search, Filter, History } from 'lucide-react';

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
  // PART 4: COMPLETELY REWRITTEN DATA PROCESSING LOGIC
  // ==========================================

  const processEnhancedRadicoData = (masterData: Record<string, any[]>, visitData: any[], historicalData: any[]): DashboardData => {
    const shopDetails = masterData['Shop Details'] || [];
    const targets = masterData['Target Vs Achievement'] || [];
    const challans = masterData['Pending Challans'] || [];
    
    console.log('🔧 PROCESSING DATA WITH FIXED LOGIC');
    console.log('Historical Data Length:', historicalData?.length || 0);
    
    // COMPLETELY REWRITTEN MONTHLY DATA PROCESSING WITH PROPER DATE HANDLING
    const processMonthlyData = (monthNumber: string, year: string = '2025', useHistorical: boolean = false) => {
      let monthShopSales: Record<string, any> = {};
      let monthlyUniqueShops = new Set<string>();
      let monthly8PM = 0, monthlyVERVE = 0;

      if (useHistorical && historicalData.length > 1) {
        console.log(`📊 Processing historical data for month ${monthNumber}-${year}`);
        
        // FIXED: Use correct column indices based on CSV structure
        // shop_name(0), Full Address(1), Cluster(2), Brand short(3), Size(4), cases(5), Pack size(6), Date(7), Party Name(8), excise_code(9), brand(10), ZONE(11), shop_id(12)
        
        const headers = historicalData[0] || [];
        console.log('📋 Historical headers:', headers);
        
        // Process historical data rows
        let processedRows = 0;
        let marchRows = 0;
        
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
                  marchRows++;
                  
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
          targetMonthRows: marchRows,
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

    // Process 3 months with FIXED logic
    const mayData = processMonthlyData('05', '2025', false);
    const aprilData = processMonthlyData('04', '2025', false);
    const marchData = processMonthlyData('03', '2025', true); // Use historical data for March
    
    console.log('📊 FINAL MONTH PROCESSING RESULTS:');
    console.log('May:', { total8PM: mayData.total8PM, totalVERVE: mayData.totalVERVE, shops: mayData.uniqueShops.size });
    console.log('April:', { total8PM: aprilData.total8PM, totalVERVE: aprilData.totalVERVE, shops: aprilData.uniqueShops.size });
    console.log('March:', { total8PM: marchData.total8PM, totalVERVE: marchData.totalVERVE, shops: marchData.uniqueShops.size });
    
    // Current month primary data
    const total8PM = mayData.total8PM;
    const totalVERVE = mayData.totalVERVE;
    const uniqueShops = mayData.uniqueShops;

    // FIXED SHOP DATA BUILDING WITH PROPER SHOP NAME MAPPING
    const shopSales: Record<string, ShopData> = {};
    
    // Build comprehensive shop name mapping from Shop Details
    const shopNameMap: Record<string, string> = {};
    const shopDetailsMap: Record<string, any> = {};
    
    shopDetails.slice(1).forEach(row => {
      const shopId = row[0]?.toString().trim();
      const shopName = row[1]?.toString().trim();
      const dept = row[2]?.toString().trim() === "DSIIDC" ? "DSIDC" : row[2]?.toString().trim();
      const salesman = row[4]?.toString().trim();
      
      if (shopId && shopName) {
        shopNameMap[shopId] = shopName;
        shopDetailsMap[shopId] = { shopName, dept, salesman };
        // Also map by shop name for historical data matching
        shopNameMap[shopName] = shopName;
        shopDetailsMap[shopName] = { shopName, dept, salesman, shopId };
      }
    });

    // Process May data (current month) - FIXED
    mayData.challans.forEach(row => {
      if (row.length >= 15) {
        const shopId = row[8]?.toString().trim();
        const shopName = row[9]?.toString().trim() || shopNameMap[shopId] || 'Unknown';
        const brand = row[11]?.toString().trim();
        const cases = parseFloat(row[14]) || 0;
        
        if (shopId && brand && cases > 0) {
          if (!shopSales[shopId]) {
            const shopDetails = shopDetailsMap[shopId] || {};
            shopSales[shopId] = { 
              shopId,
              shopName: shopDetails.shopName || shopName,
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

    // FIXED: Add April and March data with proper shop identification
    [aprilData, marchData].forEach((monthData, index) => {
      const monthKey = index === 0 ? 'april' : 'march';
      
      Object.keys(monthData.shopSales).forEach(shopIdentifier => {
        const monthShopData = monthData.shopSales[shopIdentifier];
        
        // FIXED: Handle both shop ID and shop name based identification
        let actualShopId = shopIdentifier;
        let actualShopName = monthShopData.shopName || shopIdentifier;
        
        // Try to find the correct shop ID and details
        if (shopDetailsMap[shopIdentifier]) {
          // Direct match found
          const details = shopDetailsMap[shopIdentifier];
          actualShopId = details.shopId || shopIdentifier;
          actualShopName = details.shopName || actualShopName;
        } else {
          // Try to find by shop name
          const matchingEntry = Object.entries(shopDetailsMap).find(([key, details]) => 
            details.shopName === shopIdentifier
          );
          if (matchingEntry) {
            actualShopId = matchingEntry[1].shopId || matchingEntry[0];
            actualShopName = matchingEntry[1].shopName;
          }
        }
        
        if (!shopSales[actualShopId]) {
          // Shop existed in previous month but not current month
          const shopDetails = shopDetailsMap[actualShopId] || shopDetailsMap[actualShopName] || {};
          shopSales[actualShopId] = {
            shopId: actualShopId,
            shopName: actualShopName, // FIXED: Use actual shop name, not identifier
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
            monthlyTrend: 'declining',
            skuBreakdown: []
          };
        }
        
        // Add historical data - FIXED
        if (monthKey === 'april') {
          shopSales[actualShopId].aprilTotal = monthShopData.total;
          shopSales[actualShopId].aprilEightPM = monthShopData.eightPM;
          shopSales[actualShopId].aprilVerve = monthShopData.verve;
        } else {
          shopSales[actualShopId].marchTotal = monthShopData.total;
          shopSales[actualShopId].marchEightPM = monthShopData.eightPM;
          shopSales[actualShopId].marchVerve = monthShopData.verve;
        }
      });
    });

    // ENHANCED GROWTH AND TREND CALCULATION (UNCHANGED)
    Object.keys(shopSales).forEach(shopId => {
      const shop = shopSales[shopId];
      const may = shop.mayTotal || 0;
      const april = shop.aprilTotal || 0;
      const march = shop.marchTotal || 0;
      
      // Calculate month-over-month growth (April to May)
      if (april > 0) {
        shop.growthPercent = Math.round(((may - april) / april) * 100 * 100) / 100;
      } else if (may > 0) {
        shop.growthPercent = 100; // New customer
      } else {
        shop.growthPercent = -100; // Lost customer
      }
      
      // CORRECTED TREND LOGIC
      if (march === 0 && april === 0 && may > 0) {
        shop.monthlyTrend = 'new';
      } else if ((march > 0 || april > 0) && may === 0) {
        shop.monthlyTrend = 'declining';
      } else if (march > 0 && april > march && may > april) {
        shop.monthlyTrend = 'improving';
      } else if (march > 0 && april < march && may < april && may > 0) {
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

    // Enhance shop data with department and salesman info - UPDATED
    shopDetails.slice(1).forEach(row => {
      const shopId = row[0]?.toString().trim();
      const dept = row[2]?.toString().trim() === "DSIIDC" ? "DSIDC" : row[2]?.toString().trim();
      const salesman = row[4]?.toString().trim();
      
      if (shopId && shopSales[shopId]) {
        shopSales[shopId].department = dept || 'Unknown';
        shopSales[shopId].salesman = salesman || 'Unknown';
      }
    });

    // FIXED CUSTOMER INSIGHTS ANALYSIS
    const allCurrentShops = Object.values(shopSales).filter(shop => shop.mayTotal! > 0);
    
    const newShops = Object.values(shopSales).filter(shop => 
      shop.mayTotal! > 0 && shop.aprilTotal === 0 && shop.marchTotal === 0
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

    console.log('🎯 CUSTOMER INSIGHTS SUMMARY:', {
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

    // Process targets for May 2025
    let total8PMTarget = 0, totalVerveTarget = 0;
    const salespersonStats: Record<string, any> = {};

    targets.slice(1).forEach(row => {
      if (row.length >= 10) {
        const salesmanId = row[1]?.toString().trim();
        const salesmanName = row[4]?.toString().trim();
        const targetMonth = row[9]?.toString().trim();
        
        if (targetMonth && targetMonth.includes('05-2025')) {
          const eightPMTarget = parseFloat(row[5]) || 0;
          const verveTarget = parseFloat(row[7]) || 0;
          
          total8PMTarget += eightPMTarget;
          totalVerveTarget += verveTarget;
          
          if (salesmanId && !salespersonStats[salesmanId]) {
            salespersonStats[salesmanId] = {
              name: salesmanName,
              eightPmTarget: eightPMTarget,
              verveTarget: verveTarget
            };
          }
        }
      }
    });

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
      historicalData
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
            {['March', 'April', 'May'].map((month) => (
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
                   shop.marchTotal || 0}
                </div>
                <div className="text-sm text-gray-500">Total Cases</div>
              </div>
              <div className="text-center bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {activeMonth === 'May' ? shop.mayEightPM || shop.eightPM :
                   activeMonth === 'April' ? shop.aprilEightPM || 0 :
                   shop.marchEightPM || 0}
                </div>
                <div className="text-sm text-gray-500">8PM Cases</div>
              </div>
              <div className="text-center bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {activeMonth === 'May' ? shop.mayVerve || shop.verve :
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

      doc.save(`Radico_Fixed_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
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
      csvContent += "Radico Fixed Shop Analysis Report - 3-Month Comparison - " + new Date().toLocaleDateString() + "\n";
      
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
      
      csvContent += "FILTERED SHOP COMPARISON (MAR-APR-MAY 2025)\n";
      csvContent += "Shop Name,Department,Salesman,Mar Cases,Apr Cases,May Cases,8PM Cases,VERVE Cases,Growth %,Monthly Trend\n";
      
      filteredShops.forEach(shop => {
        csvContent += `"${shop.shopName}","${shop.department}","${shop.salesman}",${shop.marchTotal || 0},${shop.aprilTotal || 0},${shop.mayTotal || shop.total},${shop.eightPM},${shop.verve},${shop.growthPercent?.toFixed(1) || 0}%,"${shop.monthlyTrend || 'stable'}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Radico_Fixed_Analysis_${new Date().toISOString().split('T')[0]}.csv`);
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Fixed Radico Dashboard</h2>
          <p className="text-gray-600">Processing Historical Data with Fixed Logic...</p>
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Radico Khaitan FIXED Dashboard</h1>
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                ✅ Historical Fixed
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              <div className="flex space-x-2">
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

      <nav className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 min-w-max">
            {[
              { id: 'overview', label: 'Sales Overview', icon: BarChart3 },
              { id: 'shops', label: 'Top Shops', icon: Trophy },
              { id: 'department', label: 'Department Analysis', icon: Building },
              { id: 'analytics', label: 'Advanced Analytics', icon: Activity },
              { id: 'historical', label: 'Historical Debug', icon: History }
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
          <h3 className="text-lg font-medium text-gray-900">Complete Shop Analysis - FIXED 3-Month Comparison (Mar-Apr-May 2025)</h3>
          <p className="text-sm text-gray-500">
            {filteredShops.length} shops {filters.department || filters.salesman || filters.searchText ? '(filtered)' : ''} 
            ranked by current month performance - Historical data now working correctly
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
            <h3 className="text-lg font-medium text-gray-900">Lost Customers - FIXED ({data.customerInsights.lostCustomers})</h3>
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

const HistoricalAnalysisTab = ({ data }: { data: DashboardData }) => {
  const [debugInfo, setDebugInfo] = React.useState<any>(null);

  useEffect(() => {
    if (data.historicalData) {
      setDebugInfo({
        hasHistoricalData: !!data.historicalData,
        dataLength: data.historicalData?.length || 0,
        sampleData: data.historicalData?.slice(0, 5) || [],
        customerInsights: data.customerInsights,
        marchTotals: {
          shops: Object.values(data.salesData).filter((shop: any) => shop.marchTotal > 0).length,
          total8PM: Object.values(data.salesData).reduce((sum: number, shop: any) => sum + (shop.marchEightPM || 0), 0),
          totalVERVE: Object.values(data.salesData).reduce((sum: number, shop: any) => sum + (shop.marchVerve || 0), 0)
        }
      });
    }
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">FIXED Historical Analysis & Debug</h2>
        <p className="text-gray-600">Complete Historical Data Integration Status</p>
      </div>

      {debugInfo && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🔧 DEBUG INFORMATION</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700">📊 Historical Data Status:</h4>
              <ul className="mt-2 space-y-1">
                <li>Has Historical Data: {debugInfo.hasHistoricalData ? '✅ Yes' : '❌ No'}</li>
                <li>Data Length: <span className="font-bold text-blue-600">{debugInfo.dataLength.toLocaleString()}</span> rows</li>
                <li>March Active Shops: <span className="font-bold text-green-600">{debugInfo.marchTotals.shops}</span></li>
                <li>March 8PM Cases: <span className="font-bold text-purple-600">{debugInfo.marchTotals.total8PM.toLocaleString()}</span></li>
                <li>March VERVE Cases: <span className="font-bold text-orange-600">{debugInfo.marchTotals.totalVERVE.toLocaleString()}</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">👥 Customer Insights (FIXED):</h4>
              <ul className="mt-2 space-y-1">
                <li>New Customers: <span className="font-bold text-green-600">{debugInfo.customerInsights.firstTimeCustomers}</span></li>
                <li>Lost Customers: <span className="font-bold text-red-600">{debugInfo.customerInsights.lostCustomers}</span></li>
                <li>Consistent: <span className="font-bold text-yellow-600">{debugInfo.customerInsights.consistentPerformers}</span></li>
                <li>Declining: <span className="font-bold text-orange-600">{debugInfo.customerInsights.decliningPerformers}</span></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className={`p-6 rounded-lg text-center ${
        debugInfo?.marchTotals.total8PM > 0 || debugInfo?.marchTotals.totalVERVE > 0
          ? 'bg-green-50'
          : 'bg-yellow-50'
      }`}>
        {debugInfo?.marchTotals.total8PM > 0 || debugInfo?.marchTotals.totalVERVE > 0 ? (
          <>
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-lg font-medium text-green-900 mb-2">Historical Data Integration: SUCCESS!</h3>
            <p className="text-green-700 mb-4">
              March 2025 historical data is now properly integrated with {debugInfo.marchTotals.shops} active shops processed.
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-yellow-900 mb-2">Historical Data Status: In Progress</h3>
            <p className="text-yellow-700 mb-4">
              Historical data connection established but processing needs verification.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

const DepartmentTab = ({ data }: { data: DashboardData }) => (
  <div className="space-y-6">
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

    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-4">FIXED 3-Month Customer Insights Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">{data.customerInsights.firstTimeCustomers}</div>
          <div className="text-xs text-gray-600">New Customers</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">{data.customerInsights.lostCustomers}</div>
          <div className="text-xs text-gray-600">Lost Customers</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-yellow-600">{data.customerInsights.consistentPerformers}</div>
          <div className="text-xs text-gray-600">Consistent</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-orange-600">{data.customerInsights.decliningPerformers}</div>
          <div className="text-xs text-gray-600">Declining</div>
        </div>
      </div>
    </div>
  </div>
);

const TopShopsTab = ({ data }: { data: DashboardData }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">Top 20 Performing Shops - May 2025 (FIXED with Historical Data)</h3>
      <p className="text-sm text-gray-500">Ranked by total cases sold with FIXED 3-month comparison</p>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">May Cases</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apr Cases</th>
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
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{shop.total.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shop.aprilTotal?.toLocaleString() || 0}</td>
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
