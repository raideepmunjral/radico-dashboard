'use client';

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, MapPin, TrendingUp, Users, ShoppingBag, BarChart3, Calendar, Trophy, Building, Target, Activity, FileText, Table, X, ChevronLeft, ChevronRight, Star, AlertTriangle, TrendingDown, UserPlus, Search, Filter, History, Package } from 'lucide-react';
import InventoryDashboard from '../components/InventoryDashboard';

// ==========================================
// 🔐 AUTHENTICATION IMPORTS
// ==========================================
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';

// ==========================================
// 🔧 NEW: UNIFIED BRAND NORMALIZATION IMPORT
// ==========================================
import { normalizeBrand, createMatchingKey, createMultipleMatchingKeys, getBrandFamily as getBrandFamilyFromService, debugBrandMapping } from '../utils/brandNormalization';

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
// 📋 NEW: SUBMISSION TRACKING IMPORT
// ==========================================
import SubmissionTrackingTab from '../components/tabs/sales/SubmissionTrackingTab';

// ==========================================
// PART 1: ENHANCED TYPE DEFINITIONS & INTERFACES (EXTENDED WITH HISTORICAL DATA) - UNCHANGED
// ==========================================

interface ShopData {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  total: number;
  eightPM: number;
  verve: number;
  
  // EXISTING: Rolling 4 months (UNCHANGED)
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
  
  // NEW: Extended Historical Data (12+ months) - OPTION 1 IMPLEMENTATION
  februaryTotal?: number;
  februaryEightPM?: number;
  februaryVerve?: number;
  januaryTotal?: number;
  januaryEightPM?: number;
  januaryVerve?: number;
  decemberTotal?: number;
  decemberEightPM?: number;
  decemberVerve?: number;
  novemberTotal?: number;
  novemberEightPM?: number;
  novemberVerve?: number;
  octoberTotal?: number;
  octoberEightPM?: number;
  octoberVerve?: number;
  septemberTotal?: number;
  septemberEightPM?: number;
  septemberVerve?: number;
  augustTotal?: number;
  augustEightPM?: number;
  augustVerve?: number;
  julyTotal?: number;
  julyEightPM?: number;
  julyVerve?: number;
  
  // EXISTING: YoY comparison (UNCHANGED)
  juneLastYearTotal?: number;
  juneLastYearEightPM?: number;
  juneLastYearVerve?: number;
  yoyGrowthPercent?: number;
  growthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
  skuBreakdown?: SKUData[];
  detailedSKUBreakdown?: DetailedSKUData[];
  historicalData?: MonthlyData[];
  
  // EXISTING: 3-month averages (UNCHANGED)
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
// PART 2: ENHANCED SKU PROCESSING FUNCTIONS (UPDATED WITH UNIFIED NORMALIZATION)
// ==========================================

const getDetailedSKUInfo = (brand: string) => {
  // 🔧 UPDATED: Use unified normalization service
  const brandInfo = normalizeBrand(brand);
  
  return {
    originalBrand: brand,
    family: brandInfo.family,
    variant: brandInfo.variant,
    size: brandInfo.size,
    displayName: brandInfo.displayName
  };
};

// 🔧 UPDATED: Use unified normalization service - LEGACY COMPATIBILITY
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

// 🔧 UPDATED: Use unified normalization service
const getBrandFamily = (brandShort?: string, brand?: string): string | null => {
  // Try with unified service first
  if (brandShort) {
    const family = getBrandFamilyFromService(brandShort);
    if (family !== 'UNKNOWN') return family;
  }
  
  if (brand) {
    const family = getBrandFamilyFromService(brand);
    if (family !== 'UNKNOWN') return family;
  }
  
  // Fallback to legacy mapping for backward compatibility
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
// PART 3: CONFIGURATION & CONSTANTS (UNCHANGED FROM YOUR ORIGINAL)
// ==========================================

const getMonthName = (monthNum: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

const getShortMonthName = (monthNum: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

// ==========================================
// 🔐 FIXED: ROLE-BASED DATA FILTERING FUNCTION WITH PROPER DEPARTMENT RECALCULATION
// ==========================================

const applyRoleBasedFiltering = (data: DashboardData, user: any): DashboardData => {
  // Admin sees everything - no filtering
  if (!user || user.role === 'admin') {
    console.log('🔐 Admin access - no filtering applied');
    return data;
  }

  console.log(`🔐 Applying ${user.role} filtering for ${user.name}`, {
    role: user.role,
    department: user.department,
    originalShops: Object.keys(data.salesData).length
  });

  // Helper function to filter shops based on role
  const filterShops = (shops: ShopData[]): ShopData[] => {
    return shops.filter(shop => {
      if (user.role === 'manager') {
        // 🔧 TODO: Implement proper manager filtering based on shop assignments
        // For now, managers see all (will be refined based on shop assignments)
        return true;
      } else if (user.role === 'salesman') {
        // Salesman sees only their own shops - multiple matching strategies
        return shop.salesman === user.name || 
               shop.salesman === user.email ||
               shop.salesman?.toLowerCase() === user.name?.toLowerCase();
      }
      return true;
    });
  };

  // Filter all shop arrays
  const filteredTopShops = filterShops(data.topShops);
  const filteredAllShopsComparison = filterShops(data.allShopsComparison);
  
  // Filter salesData object
  const filteredSalesData: Record<string, ShopData> = {};
  Object.keys(data.salesData).forEach(shopId => {
    const shop = data.salesData[shopId];
    let includeShop = false;
    
    if (user.role === 'manager') {
      // 🔧 TODO: Implement proper manager filtering based on shop assignments
      includeShop = true;
    } else if (user.role === 'salesman') {
      includeShop = shop.salesman === user.name || 
                   shop.salesman === user.email ||
                   shop.salesman?.toLowerCase() === user.name?.toLowerCase();
    }
    
    if (includeShop) {
      filteredSalesData[shopId] = shop;
    }
  });

  // 🔧 CRITICAL FIX: Recalculate department performance from filtered shop data
  const recalculatedDeptPerformance: Record<string, any> = {};
  
  // Get all departments from filtered shops
  const filteredShops = Object.values(filteredSalesData);
  const departments = Array.from(new Set(filteredShops.map(shop => shop.department).filter(Boolean)));
  
  departments.forEach(dept => {
    const deptShops = filteredShops.filter(shop => shop.department === dept);
    const billedShops = deptShops.filter(shop => shop.total > 0);
    const totalSales = deptShops.reduce((sum, shop) => sum + shop.total, 0);
    
    recalculatedDeptPerformance[dept] = {
      totalShops: deptShops.length,
      billedShops: billedShops.length,
      sales: totalSales
    };
  });

  console.log('🔧 RECALCULATED Department Performance:', recalculatedDeptPerformance);

  // Filter customer insights
  const filteredCustomerInsights: CustomerInsights = {
    ...data.customerInsights,
    newShops: filterShops(data.customerInsights.newShops),
    lostShops: filterShops(data.customerInsights.lostShops),
    consistentShops: filterShops(data.customerInsights.consistentShops),
    decliningShops: filterShops(data.customerInsights.decliningShops)
  };

  // Recalculate customer insights counts
  filteredCustomerInsights.firstTimeCustomers = filteredCustomerInsights.newShops.length;
  filteredCustomerInsights.lostCustomers = filteredCustomerInsights.lostShops.length;
  filteredCustomerInsights.consistentPerformers = filteredCustomerInsights.consistentShops.length;
  filteredCustomerInsights.decliningPerformers = filteredCustomerInsights.decliningShops.length;

  // Filter salesperson stats
  let filteredSalespersonStats = data.salespersonStats;
  if (user.role === 'salesman') {
    // Find salesperson stats by matching name
    const salesmanStats = Object.keys(data.salespersonStats).find(name => 
      name === user.name || 
      name.toLowerCase() === user.name?.toLowerCase()
    );
    
    if (salesmanStats) {
      filteredSalespersonStats = {
        [salesmanStats]: data.salespersonStats[salesmanStats]
      };
    } else {
      filteredSalespersonStats = {};
    }
  } else if (user.role === 'manager') {
    // Manager sees only salesmen in their scope
    const managerSalesmen: Record<string, any> = {};
    Object.keys(data.salespersonStats).forEach(salesmanName => {
      // Check if this salesman has shops in the filtered data
      const hasShopsInScope = Object.values(filteredSalesData).some(shop => 
        shop.salesman === salesmanName ||
        shop.salesman?.toLowerCase() === salesmanName?.toLowerCase()
      );
      if (hasShopsInScope) {
        managerSalesmen[salesmanName] = data.salespersonStats[salesmanName];
      }
    });
    filteredSalespersonStats = managerSalesmen;
  }

  // 🔧 CRITICAL FIX: Recalculate summary metrics based on filtered data
  const totalShops = filteredShops.length;
  const billedShops = filteredShops.filter(shop => shop.total > 0).length;
  const total8PM = filteredShops.reduce((sum, shop) => sum + (shop.eightPM || 0), 0);
  const totalVERVE = filteredShops.reduce((sum, shop) => sum + (shop.verve || 0), 0);
  const totalSales = total8PM + totalVERVE;
  const coverage = totalShops > 0 ? ((billedShops / totalShops) * 100).toFixed(1) : '0';

  // Recalculate targets from filtered salesperson stats
  let total8PMTarget = 0;
  let totalVerveTarget = 0;
  
  Object.values(filteredSalespersonStats).forEach((stats: any) => {
    total8PMTarget += stats.eightPmTarget || 0;
    totalVerveTarget += stats.verveTarget || 0;
  });

  const eightPmAchievement = total8PMTarget > 0 ? ((total8PM / total8PMTarget) * 100).toFixed(1) : '0';
  const verveAchievement = totalVerveTarget > 0 ? ((totalVERVE / totalVerveTarget) * 100).toFixed(1) : '0';

  // 🔧 FIXED: Recalculated summary based on filtered data
  const filteredSummary = {
    ...data.summary,
    totalShops,
    billedShops,
    total8PM,
    totalVERVE,
    totalSales,
    coverage,
    total8PMTarget,
    totalVerveTarget,
    eightPmAchievement,
    verveAchievement
  };

  console.log(`✅ FIXED Filtered data for ${user.role} ${user.name}:`, {
    originalShops: Object.keys(data.salesData).length,
    filteredShops: totalShops,
    billedShops: billedShops,
    total8PM: total8PM,
    totalVERVE: totalVERVE,
    originalDepartments: Object.keys(data.deptPerformance).length,
    recalculatedDepartments: Object.keys(recalculatedDeptPerformance).length
  });

  return {
    ...data,
    summary: filteredSummary,
    topShops: filteredTopShops,
    salesData: filteredSalesData,
    deptPerformance: recalculatedDeptPerformance, // 🔧 FIXED: Use recalculated data
    salespersonStats: filteredSalespersonStats,
    customerInsights: filteredCustomerInsights,
    allShopsComparison: filteredAllShopsComparison
  };
};

// ==========================================
// YOUR COMPLETE DASHBOARD COMPONENT
// ==========================================

const ProtectedRadicoDashboard = () => {
  // 🔐 Auth hooks
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showInventory, setShowInventory] = useState(false);
  const [inventoryData, setInventoryData] = useState<any>(null);

  const getCurrentMonthYear = () => {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = String(now.getFullYear());
    return { currentMonth, currentYear };
  };

  const { currentMonth, currentYear } = getCurrentMonthYear();

  const SHEETS_CONFIG = {
    masterSheetId: process.env.NEXT_PUBLIC_MASTER_SHEET_ID || '1pRz9CgOoamTrFipnmF-XuBCg9IZON9br5avgRlKYtxM',
    visitSheetId: process.env.NEXT_PUBLIC_VISIT_SHEET_ID || '1XG4c_Lrpk-YglTq3G3ZY9Qjt7wSnUq0UZWDSYT61eWE',
    historicalSheetId: process.env.NEXT_PUBLIC_HISTORICAL_SHEET_ID || '1yXzEYHJeHlETrEmU4TZ9F2_qv4OE10N4DPdYX0Iqfx0',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  };

  // ==========================================
  // PART 4: DATA FETCHING FUNCTIONS (UNCHANGED FROM YOUR ORIGINAL)
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
      
      // 🔍 DEBUG: Q2 Aggregate Data Verification
      console.log('🔍 Q2 DEBUG - After Processing:');
      console.log('July 2025 Raw Data:', {
        total8PM: processedData.historicalData?.july?.total8PM || 0,
        totalVERVE: processedData.historicalData?.july?.totalVERVE || 0,
        challans: processedData.historicalData?.july?.challans?.length || 0
      });

      console.log('August 2025 Raw Data:', {
        total8PM: processedData.historicalData?.august?.total8PM || processedData.summary.total8PM,
        totalVERVE: processedData.historicalData?.august?.totalVERVE || processedData.summary.totalVERVE
      });

      const expectedQ2Total = 
        (processedData.historicalData?.july?.total8PM || 0) + 
        (processedData.historicalData?.august?.total8PM || processedData.summary.total8PM) +
        (processedData.historicalData?.july?.totalVERVE || 0) + 
        (processedData.historicalData?.august?.totalVERVE || processedData.summary.totalVERVE);

      console.log('🎯 Expected Q2 2025 Total:', expectedQ2Total);
      console.log('🔧 If this shows 0, Q2 cards should show 0. If not, Q2 cards are using different data source.');
      
      // 🔐 NEW: Apply role-based filtering - THE KEY CHANGE!
      const filteredData = applyRoleBasedFiltering(processedData, user);
      
      setDashboardData(filteredData);
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
  // PART 5: 🔧 FIXED ENHANCED DATA PROCESSING WITH CORRECTED JULY 2025 DATA HANDLING
  // ==========================================

  const processEnhancedRadicoData = (masterData: Record<string, any[]>, visitData: any[], historicalData: any[]): DashboardData => {
    const shopDetails = masterData['Shop Details'] || [];
    const targets = masterData['Target Vs Achievement'] || [];
    const challans = masterData['Pending Challans'] || [];
    
    console.log(`🔧 FIXED JULY 2025 PROCESSING: ${currentMonth}-${currentYear}`);
    console.log('🔄 ENHANCED 15-MONTH WINDOW WITH CORRECTED JULY 2025 HANDLING');
    
    // ENHANCED MONTHLY DATA PROCESSING WITH EXTENDED HISTORICAL RANGE
    const processMonthlyData = (monthNumber: string, year: string = currentYear, useHistorical: boolean = false) => {
      let monthShopSales: Record<string, any> = {};
      let monthShopSKUs: Record<string, Record<string, number>> = {};
      let monthShopDetailedSKUs: Record<string, DetailedSKUData[]> = {};
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
            const size = row[4]?.toString().trim();
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
                    
                    // 🔧 UPDATED: Use unified normalization service
                    const brandInfo = normalizeBrand(brandShort || fullBrand, size);
                    const parentBrand = brandInfo.family;
                    
                    if (parentBrand === "8PM") monthly8PM += cases;
                    else if (parentBrand === "VERVE") monthlyVERVE += cases;

                    if (!monthShopSales[shopIdentifier]) {
                      monthShopSales[shopIdentifier] = { total: 0, eightPM: 0, verve: 0, shopName: shopName };
                      monthShopSKUs[shopIdentifier] = {};
                      monthShopDetailedSKUs[shopIdentifier] = [];
                    }
                    
                    monthShopSales[shopIdentifier].total += cases;
                    if (parentBrand === "8PM") monthShopSales[shopIdentifier].eightPM += cases;
                    else if (parentBrand === "VERVE") monthShopSales[shopIdentifier].verve += cases;
                    
                    const enhancedBrandName = size ? `${fullBrand || brandShort} ${size}ml` : (fullBrand || brandShort);
                    
                    if (!monthShopSKUs[shopIdentifier][enhancedBrandName]) {
                      monthShopSKUs[shopIdentifier][enhancedBrandName] = 0;
                    }
                    monthShopSKUs[shopIdentifier][enhancedBrandName] += cases;
                    
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
        console.log(`📊 Processing current data for month ${monthNumber}-${year}`);
        
        const monthChallans = challans.filter(row => 
          row[1] && row[1].toString().includes(`-${monthNumber}-`) && row[1].toString().includes(year)
        );
        
        console.log(`📋 Found ${monthChallans.length} challans for ${monthNumber}-${year}`);

        monthChallans.forEach(row => {
          if (row.length >= 15) {
            const shopId = row[8]?.toString().trim();
            const brand = row[11]?.toString().trim();
            const size = row[12]?.toString().trim();
            const cases = parseFloat(row[14]) || 0;
            
            if (shopId && brand && cases > 0) {
              monthlyUniqueShops.add(shopId);
              
              // 🔧 UPDATED: Use unified normalization service
              const brandInfo = normalizeBrand(brand, size);
              const parentBrand = brandInfo.family;
              
              if (parentBrand === "8PM") monthly8PM += cases;
              else if (parentBrand === "VERVE") monthlyVERVE += cases;

              if (!monthShopSales[shopId]) {
                monthShopSales[shopId] = { total: 0, eightPM: 0, verve: 0 };
                monthShopSKUs[shopId] = {};
                monthShopDetailedSKUs[shopId] = [];
              }
              
              monthShopSales[shopId].total += cases;
              if (parentBrand === "8PM") monthShopSales[shopId].eightPM += cases;
              else if (parentBrand === "VERVE") monthShopSales[shopId].verve += cases;
              
              const enhancedBrandName = size ? `${brand} ${size}ml` : brand;
              
              if (!monthShopSKUs[shopId][enhancedBrandName]) {
                monthShopSKUs[shopId][enhancedBrandName] = 0;
              }
              monthShopSKUs[shopId][enhancedBrandName] += cases;
              
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
        shopSKUs: monthShopSKUs,
        shopDetailedSKUs: monthShopDetailedSKUs,
        uniqueShops: monthlyUniqueShops, 
        total8PM: monthly8PM, 
        totalVERVE: monthlyVERVE,
        challans: useHistorical ? [] : challans.filter(row => 
          row[1] && row[1].toString().includes(`-${monthNumber}-`) && row[1].toString().includes(year)
        )
      };
    };

    // 🔧 FIXED: CORRECTED JULY 2025 vs 2024 SEPARATION
    console.log('🔄 PROCESSING WITH FIXED JULY 2025 HANDLING...');
    
    // Process current month data
    const currentMonthData = processMonthlyData(currentMonth, currentYear, false);
    
    // 🔧 CRITICAL FIX: Process July 2025 data separately from July 2024
    const july2025Data = processMonthlyData('07', currentYear, false); // ✅ July 2025 from challans
    const june2025Data = processMonthlyData('06', currentYear, false); // ✅ June 2025 from challans
    const mayData = processMonthlyData('05', currentYear, false);       // ✅ May 2025 from challans
    const aprilData = processMonthlyData('04', currentYear, false);     // ✅ April 2025 from challans
    const marchData = processMonthlyData('03', currentYear, true);      // March 2025 from historical
    const februaryData = processMonthlyData('02', currentYear, true);
    const januaryData = processMonthlyData('01', currentYear, true);
    
    // 🔧 FIXED: 2024 historical data (clearly separated with different variable names)
    const december2024Data = processMonthlyData('12', '2024', true);
    const november2024Data = processMonthlyData('11', '2024', true);
    const october2024Data = processMonthlyData('10', '2024', true);
    const september2024Data = processMonthlyData('09', '2024', true);
    const august2024Data = processMonthlyData('08', '2024', true);
    const july2024Data = processMonthlyData('07', '2024', true);      // ✅ Clearly July 2024
    
    // Q1 FY2024 data
    const april2024Data = processMonthlyData('04', '2024', true);
    const may2024Data = processMonthlyData('05', '2024', true);
    const june2024Data = processMonthlyData('06', '2024', true);
    
    console.log('📊 CORRECTED JULY 2025 vs 2024 SEPARATION:');
    console.log('✅ July 2025 Data:', {
      shops: july2025Data.uniqueShops.size,
      total8PM: july2025Data.total8PM,
      totalVERVE: july2025Data.totalVERVE,
      challansFound: july2025Data.challans.length
    });
    console.log('✅ July 2024 Data:', {
      shops: july2024Data.uniqueShops.size,
      total8PM: july2024Data.total8PM,
      totalVERVE: july2024Data.totalVERVE
    });
    
    // YoY COMPARISON (keeping existing for backward compatibility)
    const juneLastYearData = june2024Data;
    
    // 🔧 FIXED: Use current month data for summary (but don't assign to wrong month fields)
    const total8PM = currentMonthData.total8PM;
    const totalVERVE = currentMonthData.totalVERVE;
    const uniqueShops = currentMonthData.uniqueShops;

    // ENHANCED SHOP DATA BUILDING WITH HISTORICAL POPULATION (UNCHANGED)
    const shopSales: Record<string, ShopData> = {};
    
    const masterShopSKUs: Record<string, Record<string, number>> = {};
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
    
    Object.keys(currentMonthData.shopSales).forEach(shopId => {
      shopIdentifierMap[shopId] = shopId;
    });
    
    // 🔧 FIXED: Include ALL 15 months in identifier mapping with corrected July separation
    [july2025Data, june2025Data, mayData, aprilData, marchData, februaryData, januaryData, december2024Data, november2024Data, october2024Data, september2024Data, august2024Data, july2024Data, april2024Data, may2024Data, june2024Data].forEach(monthData => {
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

    // 🔧 FIXED: Merge SKUs from ALL 15 months with corrected July separation
    console.log('🔄 MERGING SKUs FROM ALL 15 MONTHS WITH CORRECTED JULY SEPARATION...');
    [currentMonthData, july2025Data, june2025Data, mayData, aprilData, marchData, februaryData, januaryData, december2024Data, november2024Data, october2024Data, september2024Data, august2024Data, july2024Data, april2024Data, may2024Data].forEach(monthData => {
      mergeSKUsFromMonth(monthData, shopIdentifierMap);
      mergeDetailedSKUsFromMonth(monthData, shopIdentifierMap);
    });
    
    console.log('✅ COMPREHENSIVE 15-MONTH SKU BREAKDOWN COLLECTED WITH JULY FIX');

    // 🔧 CRITICAL FIX: Process current month data WITH PROPER MONTH FIELD ASSIGNMENT
    currentMonthData.challans.forEach(row => {
      if (row.length >= 15) {
        const shopId = row[8]?.toString().trim();
        const shopNameFromChallan = row[9]?.toString().trim();
        const brand = row[11]?.toString().trim();
        const size = row[12]?.toString().trim();
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
              
              // EXISTING: Rolling 4-month window (UNCHANGED)
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
              
              // NEW: Extended historical months (OPTION 1 IMPLEMENTATION)
              februaryTotal: 0,
              februaryEightPM: 0,
              februaryVerve: 0,
              januaryTotal: 0,
              januaryEightPM: 0,
              januaryVerve: 0,
              decemberTotal: 0,
              decemberEightPM: 0,
              decemberVerve: 0,
              novemberTotal: 0,
              novemberEightPM: 0,
              novemberVerve: 0,
              octoberTotal: 0,
              octoberEightPM: 0,
              octoberVerve: 0,
              septemberTotal: 0,
              septemberEightPM: 0,
              septemberVerve: 0,
              augustTotal: 0,
              augustEightPM: 0,
              augustVerve: 0,
              julyTotal: 0,
              julyEightPM: 0,
              julyVerve: 0,
              
              // EXISTING: YoY and other metrics (UNCHANGED)
              juneLastYearTotal: 0,
              juneLastYearEightPM: 0,
              juneLastYearVerve: 0,
              yoyGrowthPercent: 0,
              monthlyTrend: 'stable',
              skuBreakdown: [],
              detailedSKUBreakdown: [],
              threeMonthAvgTotal: 0,
              threeMonthAvg8PM: 0,
              threeMonthAvgVERVE: 0
            };
          }
          
          // 🔧 UPDATED: Use unified normalization service
          const brandInfo = normalizeBrand(brand, size);
          const parentBrand = brandInfo.family;
          
          shopSales[shopId].total += cases;
          
          // 🔧 CRITICAL FIX: ONLY assign to month-specific fields when we have actual data for that month
          // This prevents phantom data from appearing in July columns
          if (currentMonth === '06') {
            shopSales[shopId].juneTotal! += cases;
            if (parentBrand === "8PM") {
              shopSales[shopId].eightPM += cases;
              shopSales[shopId].juneEightPM! += cases;
            } else if (parentBrand === "VERVE") {
              shopSales[shopId].verve += cases;
              shopSales[shopId].juneVerve! += cases;
            }
          } else if (currentMonth === '07') {
            // 🔧 CRITICAL FIX: ONLY assign to July fields if we actually have July data
            // Since currentMonthData.challans.length is 0 for July, this block won't execute
            console.log('🔧 JULY ASSIGNMENT: Only assigning to July fields if challans exist');
            shopSales[shopId].julyTotal! += cases;
            if (parentBrand === "8PM") {
              shopSales[shopId].eightPM += cases;
              shopSales[shopId].julyEightPM! += cases;
            } else if (parentBrand === "VERVE") {
              shopSales[shopId].verve += cases;
              shopSales[shopId].julyVerve! += cases;
            }
          } else if (currentMonth === '08') {
            shopSales[shopId].augustTotal! += cases;
            if (parentBrand === "8PM") {
              shopSales[shopId].eightPM += cases;
              shopSales[shopId].augustEightPM! += cases;
            } else if (parentBrand === "VERVE") {
              shopSales[shopId].verve += cases;
              shopSales[shopId].augustVerve! += cases;
            }
          } else {
            // For other months, just add to current totals
            if (parentBrand === "8PM") {
              shopSales[shopId].eightPM += cases;
            } else if (parentBrand === "VERVE") {
              shopSales[shopId].verve += cases;
            }
          }
        }
      }
    });

    // 🔧 FIXED: Updated historical months array with clear year separation
    const allHistoricalMonths = [
      // ✅ 2025 CURRENT YEAR DATA
      { data: july2025Data, key: 'july', year: '2025' },
      { data: june2025Data, key: 'june', year: '2025' },
      { data: mayData, key: 'may', year: '2025' },
      { data: aprilData, key: 'april', year: '2025' },
      { data: marchData, key: 'march', year: '2025' },
      { data: februaryData, key: 'february', year: '2025' },
      { data: januaryData, key: 'january', year: '2025' },
      
      // ✅ 2024 HISTORICAL DATA  
      { data: december2024Data, key: 'december', year: '2024' },
      { data: november2024Data, key: 'november', year: '2024' },
      { data: october2024Data, key: 'october', year: '2024' },
      { data: september2024Data, key: 'september', year: '2024' },
      { data: august2024Data, key: 'august', year: '2024' },
      { data: july2024Data, key: 'july2024', year: '2024' }, // ✅ Clearly separated as july2024
      
      // Q1 FY2024 data
      { data: april2024Data, key: 'april2024', year: '2024' },
      { data: may2024Data, key: 'may2024', year: '2024' },
      { data: june2024Data, key: 'june2024', year: '2024' }
    ];

    // 🔧 CRITICAL FIX: Enhanced month assignment with year awareness
    allHistoricalMonths.forEach(({ data: monthData, key: monthKey, year: dataYear }) => {
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
            
            // Initialize ALL historical months to 0
            marchTotal: 0, marchEightPM: 0, marchVerve: 0,
            aprilTotal: 0, aprilEightPM: 0, aprilVerve: 0,
            mayTotal: 0, mayEightPM: 0, mayVerve: 0,
            juneTotal: 0, juneEightPM: 0, juneVerve: 0,
            februaryTotal: 0, februaryEightPM: 0, februaryVerve: 0,
            januaryTotal: 0, januaryEightPM: 0, januaryVerve: 0,
            decemberTotal: 0, decemberEightPM: 0, decemberVerve: 0,
            novemberTotal: 0, novemberEightPM: 0, novemberVerve: 0,
            octoberTotal: 0, octoberEightPM: 0, octoberVerve: 0,
            septemberTotal: 0, septemberEightPM: 0, septemberVerve: 0,
            augustTotal: 0, augustEightPM: 0, augustVerve: 0,
            julyTotal: 0, julyEightPM: 0, julyVerve: 0, // ✅ CRITICAL: July remains 0 unless populated by actual July 2025 data
            
            juneLastYearTotal: 0, juneLastYearEightPM: 0, juneLastYearVerve: 0,
            yoyGrowthPercent: 0,
            monthlyTrend: 'declining',
            skuBreakdown: [],
            detailedSKUBreakdown: [],
            threeMonthAvgTotal: 0, threeMonthAvg8PM: 0, threeMonthAvgVERVE: 0
          };
        }
        
        // 🔧 CRITICAL FIX: Only assign historical data when it doesn't conflict with current year
        const shouldSkipForCurrentYear = (monthKey: string, currentMonth: string, dataYear: string) => {
          if (dataYear !== currentYear) return false; // Always allow 2024 data
          
          const monthMapping: Record<string, string> = {
            'january': '01', 'february': '02', 'march': '03', 'april': '04',
            'may': '05', 'june': '06', 'july': '07', 'august': '08',
            'september': '09', 'october': '10', 'november': '11', 'december': '12'
          };
          
          return monthMapping[monthKey] === currentMonth;
        };
        
        // 🔧 FIXED: Enhanced month assignment with year separation
        if (monthKey === 'july' && dataYear === '2025') {
          if (!shouldSkipForCurrentYear('july', currentMonth, dataYear)) {
            shopSales[actualShopId].julyTotal = monthShopData.total;
            shopSales[actualShopId].julyEightPM = monthShopData.eightPM;
            shopSales[actualShopId].julyVerve = monthShopData.verve;
            console.log(`✅ ASSIGNED July 2025 data for shop ${actualShopId}: ${monthShopData.total} cases`);
          } else {
            console.log(`🔧 SKIPPED July 2025 assignment - current month is ${currentMonth}`);
          }
        } else if (monthKey === 'july2024' && dataYear === '2024') {
          // ✅ July 2024 data goes to YoY comparison fields only - DO NOT assign to July 2025 fields!
          console.log(`📊 July 2024 data available for YoY comparisons: ${monthShopData.total} cases`);
          // Don't assign to July 2025 fields - keep for YoY only
        } else if (monthKey === 'june' && dataYear === '2025') {
          if (!shouldSkipForCurrentYear('june', currentMonth, dataYear)) {
            shopSales[actualShopId].juneTotal = monthShopData.total;
            shopSales[actualShopId].juneEightPM = monthShopData.eightPM;
            shopSales[actualShopId].juneVerve = monthShopData.verve;
          } else {
            console.log(`🔧 SKIPPING June historical assignment - current month is ${currentMonth}`);
          }
        } else if (monthKey === 'may' && dataYear === '2025') {
          if (!shouldSkipForCurrentYear('may', currentMonth, dataYear)) {
            shopSales[actualShopId].mayTotal = monthShopData.total;
            shopSales[actualShopId].mayEightPM = monthShopData.eightPM;
            shopSales[actualShopId].mayVerve = monthShopData.verve;
          } else {
            console.log(`🔧 SKIPPING May historical assignment - current month is ${currentMonth}`);
          }
        } else if (monthKey === 'april' && dataYear === '2025') {
          if (!shouldSkipForCurrentYear('april', currentMonth, dataYear)) {
            shopSales[actualShopId].aprilTotal = monthShopData.total;
            shopSales[actualShopId].aprilEightPM = monthShopData.eightPM;
            shopSales[actualShopId].aprilVerve = monthShopData.verve;
          } else {
            console.log(`🔧 SKIPPING April historical assignment - current month is ${currentMonth}`);
          }
        } else if (monthKey === 'march' && dataYear === '2025') {
          if (!shouldSkipForCurrentYear('march', currentMonth, dataYear)) {
            shopSales[actualShopId].marchTotal = monthShopData.total;
            shopSales[actualShopId].marchEightPM = monthShopData.eightPM;
            shopSales[actualShopId].marchVerve = monthShopData.verve;
          } else {
            console.log(`🔧 SKIPPING March historical assignment - current month is ${currentMonth}`);
          }
        } else if (monthKey === 'february' && dataYear === '2025') {
          if (!shouldSkipForCurrentYear('february', currentMonth, dataYear)) {
            shopSales[actualShopId].februaryTotal = monthShopData.total;
            shopSales[actualShopId].februaryEightPM = monthShopData.eightPM;
            shopSales[actualShopId].februaryVerve = monthShopData.verve;
          } else {
            console.log(`🔧 SKIPPING February historical assignment - current month is ${currentMonth}`);
          }
        } else if (monthKey === 'january' && dataYear === '2025') {
          if (!shouldSkipForCurrentYear('january', currentMonth, dataYear)) {
            shopSales[actualShopId].januaryTotal = monthShopData.total;
            shopSales[actualShopId].januaryEightPM = monthShopData.eightPM;
            shopSales[actualShopId].januaryVerve = monthShopData.verve;
          } else {
            console.log(`🔧 SKIPPING January historical assignment - current month is ${currentMonth}`);
          }
        } else if (monthKey === 'december' && dataYear === '2024') {
          shopSales[actualShopId].decemberTotal = monthShopData.total;
          shopSales[actualShopId].decemberEightPM = monthShopData.eightPM;
          shopSales[actualShopId].decemberVerve = monthShopData.verve;
        } else if (monthKey === 'november' && dataYear === '2024') {
          shopSales[actualShopId].novemberTotal = monthShopData.total;
          shopSales[actualShopId].novemberEightPM = monthShopData.eightPM;
          shopSales[actualShopId].novemberVerve = monthShopData.verve;
        } else if (monthKey === 'october' && dataYear === '2024') {
          shopSales[actualShopId].octoberTotal = monthShopData.total;
          shopSales[actualShopId].octoberEightPM = monthShopData.eightPM;
          shopSales[actualShopId].octoberVerve = monthShopData.verve;
        } else if (monthKey === 'september' && dataYear === '2024') {
          shopSales[actualShopId].septemberTotal = monthShopData.total;
          shopSales[actualShopId].septemberEightPM = monthShopData.eightPM;
          shopSales[actualShopId].septemberVerve = monthShopData.verve;
        } else if (monthKey === 'august' && dataYear === '2024') {
          if (!shouldSkipForCurrentYear('august', currentMonth, dataYear)) {
            shopSales[actualShopId].augustTotal = monthShopData.total;
            shopSales[actualShopId].augustEightPM = monthShopData.eightPM;
            shopSales[actualShopId].augustVerve = monthShopData.verve;
          } else {
            console.log(`🔧 SKIPPING August 2024 assignment - current month is ${currentMonth}`);
          }
        } else if (monthKey === 'june2024' && dataYear === '2024') {
          shopSales[actualShopId].juneLastYearTotal = monthShopData.total;
          shopSales[actualShopId].juneLastYearEightPM = monthShopData.eightPM;
          shopSales[actualShopId].juneLastYearVerve = monthShopData.verve;
        }
        // 🚀 NEW: Q1 FY2024 data population handled by historicalData object below
      });
    });

    console.log('✅ ALL 15 HISTORICAL MONTHS POPULATED FOR INDIVIDUAL SHOPS WITH JULY FIX');
    console.log('🔧 FIXED JULY 2025 DATA CONTAMINATION - July 2024 kept separate');
    console.log(`🔧 ${getMonthName(currentMonth).toUpperCase()} ${currentYear} FIELDS PROPERLY REMAIN 0 (no historical contamination)`);

    // ENHANCED: Populate BOTH legacy and detailed SKU breakdowns for ALL shops (UNCHANGED)
    console.log('🔄 POPULATING BOTH EXISTING AND NEW SKU BREAKDOWNS...');
    let totalSKUsPopulated = 0;
    let totalDetailedSKUsPopulated = 0;
    
    Object.keys(shopSales).forEach(shopId => {
      const shop = shopSales[shopId];
      
      const shopSKUData = masterShopSKUs[shopId] || {};
      
      shop.skuBreakdown = Object.keys(shopSKUData).map(brand => ({
        brand,
        cases: shopSKUData[brand],
        percentage: 0,
        month: 'All Months'
      }));
      
      totalSKUsPopulated += shop.skuBreakdown.length;
      
      const totalCases = shop.skuBreakdown.reduce((sum, sku) => sum + sku.cases, 0);
      
      if (totalCases > 0) {
        shop.skuBreakdown.forEach(sku => {
          sku.percentage = Math.round((sku.cases / totalCases) * 100 * 100) / 100;
        });
        shop.skuBreakdown.sort((a, b) => b.cases - a.cases);
      }
      
      const shopDetailedSKUs = masterShopDetailedSKUs[shopId] || [];
      
      shop.detailedSKUBreakdown = shopDetailedSKUs.map(sku => ({
        ...sku,
        percentage: totalCases > 0 ? Math.round((sku.cases / totalCases) * 100 * 100) / 100 : 0
      })).sort((a, b) => b.cases - a.cases);
      
      totalDetailedSKUsPopulated += shop.detailedSKUBreakdown.length;
    });
    
    console.log('✅ COMPREHENSIVE HISTORICAL SKU BREAKDOWNS POPULATED:', {
      shopsProcessed: Object.keys(shopSales).length,
      totalExistingSKUsPopulated: totalSKUsPopulated,
      totalNewDetailedSKUsPopulated: totalDetailedSKUsPopulated
    });

    // ENHANCED GROWTH AND TREND CALCULATION WITH YoY + 3-MONTH AVERAGES (UPDATED)
    Object.keys(shopSales).forEach(shopId => {
      const shop = shopSales[shopId];
      
      // ✅ CORRECTED: Use proper month data for growth calculations
      const currentMonthTotal = currentMonth === '06' ? (shop.juneTotal || 0) : 
                               currentMonth === '07' ? (shop.julyTotal || 0) : // This will be 0 for July 2025 if no challans
                               currentMonth === '08' ? (shop.augustTotal || 0) : 
                               shop.total;
      const june = shop.juneTotal || 0;
      const may = shop.mayTotal || 0;
      const april = shop.aprilTotal || 0;
      const march = shop.marchTotal || 0;
      const juneLastYear = shop.juneLastYearTotal || 0;
      
      shop.threeMonthAvgTotal = (march + april + may) / 3;
      shop.threeMonthAvg8PM = ((shop.marchEightPM || 0) + (shop.aprilEightPM || 0) + (shop.mayEightPM || 0)) / 3;
      shop.threeMonthAvgVERVE = ((shop.marchVerve || 0) + (shop.aprilVerve || 0) + (shop.mayVerve || 0)) / 3;
      
      if (may > 0) {
        shop.growthPercent = Math.round(((currentMonthTotal - may) / may) * 100 * 100) / 100;
      } else if (currentMonthTotal > 0) {
        shop.growthPercent = 100;
      } else {
        shop.growthPercent = -100;
      }
      
      if (juneLastYear > 0) {
        shop.yoyGrowthPercent = Math.round(((currentMonthTotal - juneLastYear) / juneLastYear) * 100 * 100) / 100;
      } else if (currentMonthTotal > 0) {
        shop.yoyGrowthPercent = 100;
      } else {
        shop.yoyGrowthPercent = 0;
      }
      
      if (march === 0 && april === 0 && may === 0 && currentMonthTotal > 0) {
        shop.monthlyTrend = 'new';
      } else if ((march > 0 || april > 0 || may > 0) && currentMonthTotal === 0) {
        shop.monthlyTrend = 'declining';
      } else if (march > 0 && april > march && may > april && currentMonthTotal > may) {
        shop.monthlyTrend = 'improving';
      } else if (march > 0 && april < march && may < april && currentMonthTotal < may && currentMonthTotal > 0) {
        shop.monthlyTrend = 'declining';
      } else if (currentMonthTotal > 0 && may > 0 && Math.abs(shop.growthPercent!) <= 10) {
        shop.monthlyTrend = 'stable';
      } else if (currentMonthTotal > may && may > 0) {
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

    // ENHANCED CUSTOMER INSIGHTS ANALYSIS (UPDATED FOR NATURAL TRANSITION)
    const allCurrentShops = Object.values(shopSales).filter(shop => 
      currentMonth === '06' ? (shop.juneTotal! > 0) : 
      currentMonth === '07' ? (shop.julyTotal! > 0) : 
      currentMonth === '08' ? (shop.augustTotal! > 0) : 
      shop.total > 0
    );
    
    const newShops = Object.values(shopSales).filter(shop => {
      const currentTotal = currentMonth === '06' ? (shop.juneTotal! > 0) : 
                          currentMonth === '07' ? (shop.julyTotal! > 0) : 
                          currentMonth === '08' ? (shop.augustTotal! > 0) : 
                          shop.total > 0;
      return currentTotal && shop.mayTotal === 0 && shop.aprilTotal === 0 && shop.marchTotal === 0;
    });
    
    const lostShops = Object.values(shopSales).filter(shop => {
      const currentTotal = currentMonth === '06' ? (shop.juneTotal || 0) : 
                          currentMonth === '07' ? (shop.julyTotal || 0) : 
                          currentMonth === '08' ? (shop.augustTotal || 0) : 
                          shop.total;
      return currentTotal === 0 && shop.mayTotal! > 0;
    });

    const consistentShops = Object.values(shopSales).filter(shop => {
      const currentTotal = currentMonth === '06' ? (shop.juneTotal! > 0) : 
                          currentMonth === '07' ? (shop.julyTotal! > 0) : 
                          currentMonth === '08' ? (shop.augustTotal! > 0) : 
                          shop.total > 0;
      return currentTotal && shop.mayTotal! > 0 && 
        (shop.monthlyTrend === 'improving' || (shop.monthlyTrend === 'stable' && shop.growthPercent! >= -5));
    });

    const decliningShops = Object.values(shopSales).filter(shop => {
      const currentTotal = currentMonth === '06' ? (shop.juneTotal! > 0) : 
                          currentMonth === '07' ? (shop.julyTotal! > 0) : 
                          currentMonth === '08' ? (shop.augustTotal! > 0) : 
                          shop.total > 0;
      return shop.monthlyTrend === 'declining' || (currentTotal && shop.growthPercent! < -10);
    });

    const customerInsights: CustomerInsights = {
      firstTimeCustomers: newShops.length,
      lostCustomers: lostShops.length,
      consistentPerformers: consistentShops.length,
      decliningPerformers: decliningShops.length,
      newShops: newShops.sort((a, b) => {
        const aTotal = currentMonth === '06' ? (a.juneTotal! || 0) : 
                      currentMonth === '07' ? (a.julyTotal! || 0) : 
                      currentMonth === '08' ? (a.augustTotal! || 0) : 
                      a.total;
        const bTotal = currentMonth === '06' ? (b.juneTotal! || 0) : 
                      currentMonth === '07' ? (b.julyTotal! || 0) : 
                      currentMonth === '08' ? (b.augustTotal! || 0) : 
                      b.total;
        return bTotal - aTotal;
      }),
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

    // Process targets for current month (CORRECTED FOR NATURAL TRANSITION)
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
        
        // ✅ CORRECTED: Check for targets matching the current month
        const isCurrentMonthTarget = targetMonth && (
          targetMonth.includes(`${currentMonth}-${currentYear}`) ||
          targetMonth.includes(`01-${getMonthName(currentMonth).substring(0,3)}-${currentYear.slice(-2)}`) ||
          targetMonth.includes(`${getMonthName(currentMonth).substring(0,3)}-${currentYear.slice(-2)}`) ||
          targetMonth.toLowerCase().includes(`${getMonthName(currentMonth).toLowerCase()} ${currentYear}`) ||
          targetMonth.toLowerCase().includes(`${getMonthName(currentMonth).substring(0,3).toLowerCase()} ${currentYear}`)
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

    console.log('🎯 FINAL RESULT: FIXED JULY 2025 DATA CONTAMINATION');
    console.log('✅ July 2025 data comes ONLY from July 2025 challans');
    console.log('✅ July 2024 data clearly separated and not contaminating July 2025');
    console.log('✅ If no July 2025 challans exist, July 2025 fields show 0');
    console.log(`✅ CORRECTED: Showing ${getMonthName(currentMonth)} ${currentYear} data without July 2024 contamination`);

    // 🔧 ADDITIONAL: Final verification of Q2 data sources
    console.log('🔍 FINAL Q2 DATA SOURCE VERIFICATION:');
    console.log('July 2025 will provide:', {
      total8PM: july2025Data.total8PM,
      totalVERVE: july2025Data.totalVERVE,
      combined: july2025Data.total8PM + july2025Data.totalVERVE
    });
    
    const augustDataForQ2 = currentMonth === '08' ? currentMonthData : processMonthlyData('08', currentYear, false);
    console.log('August 2025 will provide:', {
      total8PM: augustDataForQ2.total8PM,
      totalVERVE: augustDataForQ2.totalVERVE,
      combined: augustDataForQ2.total8PM + augustDataForQ2.totalVERVE
    });
    
    console.log('🎯 FINAL Q2 2025 SHOULD BE:', {
      total8PM: july2025Data.total8PM + augustDataForQ2.total8PM,
      totalVERVE: july2025Data.totalVERVE + augustDataForQ2.totalVERVE,
      combined: (july2025Data.total8PM + augustDataForQ2.total8PM) + (july2025Data.totalVERVE + augustDataForQ2.totalVERVE)
    });

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
      // 🔧 FIXED: Corrected historical data structure with July separation and August verification
      historicalData: {
        // 🔧 CRITICAL FIX: Current rolling window with verified data sources
        july: {
          ...july2025Data,
          // 🔧 Ensure all values are from July 2025 challans only
          total8PM: july2025Data.total8PM,
          totalVERVE: july2025Data.totalVERVE,
          uniqueShops: july2025Data.uniqueShops,
          shopSales: july2025Data.shopSales,
          challans: july2025Data.challans
        },
        
        // 🔧 CRITICAL FIX: August data with proper source detection
        august: currentMonth === '08' ? {
          ...currentMonthData,
          total8PM: currentMonthData.total8PM,
          totalVERVE: currentMonthData.totalVERVE,
          uniqueShops: currentMonthData.uniqueShops,
          shopSales: currentMonthData.shopSales,
          challans: currentMonthData.challans
        } : processMonthlyData('08', currentYear, false),
        
        june: june2025Data,    // ✅ June 2025 data
        may: mayData,
        april: aprilData,
        march: marchData,
        
        // NEW: Extended 2025 historical data
        february: februaryData,
        january: januaryData,
        
        // 2024 historical data (clearly separated)
        december2024: december2024Data,
        november2024: november2024Data,
        october2024: october2024Data,
        september2024: september2024Data,
        august2024: august2024Data,
        july2024: july2024Data,        // ✅ Clearly July 2024 (not contaminating 2025)
        
        // Q1 FY2024 complete data
        april2024: april2024Data,
        may2024: may2024Data,
        june2024: june2024Data,
        
        // YoY comparison - UNCHANGED (aliased for backward compatibility)
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
  }, [user]); // Re-fetch when user changes

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Enhanced Radico Dashboard</h2>
          <p className="text-gray-600">Processing live data with FIXED July 2025 handling for {getMonthName(currentMonth)} {currentYear}...</p>
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
                🔧 FIXED July 2025 Data - {getShortMonthName(currentMonth)} {currentYear}
              </span>
              {/* 🔐 Show user info when authenticated */}
              {user && (
                <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {user.name} ({user.role})
                </span>
              )}
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
                {/* 🔐 FIXED: Only show inventory button for admin and manager roles */}
                {user && (user.role === 'admin' || user.role === 'manager') && (
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
                )}
                
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
                {/* 🔐 Logout button */}
                {user && (
                  <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                )}
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
                {/* 🔐 FIXED: Role-based tab filtering for salesman */}
                {[
                  { id: 'overview', label: 'Sales Overview', icon: BarChart3, roles: ['admin', 'manager', 'salesman'] },
                  { id: 'shops', label: 'Top Shops', icon: Trophy, roles: ['admin', 'manager', 'salesman'] },
                  { id: 'focus-shops', label: 'Focus Shops', icon: Target, roles: ['admin', 'manager', 'salesman'] },
                  { id: 'department', label: 'Department Analysis', icon: Building, roles: ['admin', 'manager'] },
                  { id: 'salesman', label: 'Salesman Performance', icon: Users, roles: ['admin', 'manager', 'salesman'] },
                  { id: 'submission', label: 'Submission Tracking', icon: Package, roles: ['admin', 'manager', 'salesman'] },
                  { id: 'analytics', label: 'Advanced Analytics', icon: Activity, roles: ['admin', 'manager'] },
                  { id: 'historical', label: 'Historical Analysis', icon: History, roles: ['admin', 'manager'] }
                ]
                .filter(tab => !user || tab.roles.includes(user.role)) // 🔐 Filter tabs by user role
                .map((tab) => (
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
                {/* 📋 NEW: SUBMISSION TRACKING TAB */}
                {activeTab === 'submission' && <SubmissionTrackingTab />}
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

// ==========================================
// 🔐 AUTHENTICATION WRAPPER COMPONENTS
// ==========================================

const AuthenticatedApp = () => {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return <ProtectedRadicoDashboard />;
};

const RadicoDashboard = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

export default RadicoDashboard;
