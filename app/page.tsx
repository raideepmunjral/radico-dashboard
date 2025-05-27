'use client';

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, MapPin, TrendingUp, Users, ShoppingBag, BarChart3, Calendar, Trophy, Building, Target, Activity, FileText, Table, X, ChevronLeft, ChevronRight, Star, AlertTriangle, TrendingDown, UserPlus } from 'lucide-react';

// Types
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
}

interface SKUData {
  brand: string;
  cases: number;
  percentage: number;
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
}

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

  // Your actual Google Sheets configuration - UPDATED WITH CORRECT IDs
  const SHEETS_CONFIG = {
    masterSheetId: process.env.NEXT_PUBLIC_MASTER_SHEET_ID || '1pRz9CgOoamTrFipnmF-XuBCg9IZON9br5avgRlKYtxM',
    visitSheetId: process.env.NEXT_PUBLIC_VISIT_SHEET_ID || '1XG4c_Lrpk-YglTq3G3ZY9Qjt7wSnUq0UZWDSYT61eWE',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  };

  // Fetch data from your Google Sheets
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!SHEETS_CONFIG.apiKey) {
        throw new Error('Google API key not configured. Please set NEXT_PUBLIC_GOOGLE_API_KEY environment variable.');
      }

      // Fetch all sheets from Radico Master Final
      const masterData = await fetchMasterSheetData();
      const visitData = await fetchVisitSheetData();
      
      // Process data using your existing logic
      const processedData = processRadicoData(masterData, visitData);
      setDashboardData(processedData);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch from your Radico Master Final spreadsheet
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

  // Fetch from your Radico Visit Final spreadsheet - UPDATED SHEET NAME
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

  // Enhanced data processing with 3-month comparison and dynamic customer insights
  const processRadicoData = (masterData: Record<string, any[]>, visitData: any[]): DashboardData => {
    const shopDetails = masterData['Shop Details'] || [];
    const targets = masterData['Target Vs Achievement'] || [];
    const challans = masterData['Pending Challans'] || [];
    
    // Brand family mapping (from your code)
    const brandFamily: Record<string, string> = {
      "8 PM PREMIUM BLACK BLENDED WHISKY": "8PM",
      "8 PM PREMIUM BLACK BLENDED WHISKY Pet": "8PM",
      "8 PM PREMIUM BLACK BLENDED WHISKY PET": "8PM",
      "8 PM BLACK 750": "8PM",
      "8 PM BLACK 375": "8PM",
      "8 PM BLACK 180 P": "8PM",
      "8 PM BLACK 90": "8PM",
      "8 PM BLACK 60 P": "8PM",
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
      "VERVE GRAIN 180": "VERVE"
    };

    // Function to process monthly data dynamically
    const processMonthlyData = (monthFilter: string, year: string = '2025') => {
      const monthChallans = challans.filter(row => 
        row[1] && row[1].toString().includes(`-${monthFilter}-`) && row[1].toString().includes(year)
      );
      
      const monthlyShopSales: Record<string, any> = {};
      const monthlyUniqueShops = new Set<string>();
      let monthly8PM = 0, monthlyVERVE = 0;

      monthChallans.forEach(row => {
        if (row.length >= 15) {
          const shopId = row[8]?.toString().trim();
          const brand = row[11]?.toString().trim();
          const cases = parseFloat(row[14]) || 0;
          
          if (shopId && brand && cases > 0) {
            monthlyUniqueShops.add(shopId);
            const parentBrand = brandFamily[brand];
            
            if (parentBrand === "8PM") monthly8PM += cases;
            else if (parentBrand === "VERVE") monthlyVERVE += cases;

            if (!monthlyShopSales[shopId]) {
              monthlyShopSales[shopId] = { total: 0, eightPM: 0, verve: 0 };
            }
            
            monthlyShopSales[shopId].total += cases;
            if (parentBrand === "8PM") monthlyShopSales[shopId].eightPM += cases;
            else if (parentBrand === "VERVE") monthlyShopSales[shopId].verve += cases;
          }
        }
      });

      return { 
        shopSales: monthlyShopSales, 
        uniqueShops: monthlyUniqueShops, 
        total8PM: monthly8PM, 
        totalVERVE: monthlyVERVE,
        challans: monthChallans
      };
    };

    // Process last 3 months dynamically - March, April, May 2025
    const mayData = processMonthlyData('05');
    const aprilData = processMonthlyData('04');
    const marchData = processMonthlyData('03');

    // Use current month (May) as primary data for dashboard
    const total8PM = mayData.total8PM;
    const totalVERVE = mayData.totalVERVE;
    const uniqueShops = mayData.uniqueShops;

    // Build comprehensive shop data with 3-month comparison
    const shopSales: Record<string, ShopData> = {};
    
    // Start with May data (current month)
    mayData.challans.forEach(row => {
      if (row.length >= 15) {
        const shopId = row[8]?.toString().trim();
        const shopName = row[9]?.toString().trim();
        const brand = row[11]?.toString().trim();
        const cases = parseFloat(row[14]) || 0;
        
        if (shopId && brand && cases > 0) {
          if (!shopSales[shopId]) {
            shopSales[shopId] = { 
              shopId,
              shopName: shopName || 'Unknown',
              department: 'Unknown',
              salesman: 'Unknown',
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
          
          const parentBrand = brandFamily[brand];
          shopSales[shopId].total += cases;
          shopSales[shopId].mayTotal! += cases;
          
          if (parentBrand === "8PM") {
            shopSales[shopId].eightPM += cases;
            shopSales[shopId].mayEightPM! += cases;
          } else if (parentBrand === "VERVE") {
            shopSales[shopId].verve += cases;
            shopSales[shopId].mayVerve! += cases;
          }

          // Build SKU breakdown for current month
          const existing = shopSales[shopId].skuBreakdown!.find(sku => sku.brand === brand);
          if (existing) {
            existing.cases += cases;
          } else {
            shopSales[shopId].skuBreakdown!.push({ brand, cases, percentage: 0 });
          }
        }
      }
    });

    // Add April and March data to existing shops and create entries for shops that only existed in previous months
    [aprilData, marchData].forEach((monthData, index) => {
      const monthKey = index === 0 ? 'april' : 'march';
      
      Object.keys(monthData.shopSales).forEach(shopId => {
        const monthShopData = monthData.shopSales[shopId];
        
        if (!shopSales[shopId]) {
          // Shop existed in previous month but not current month
          const shopName = shopDetails.find(row => row[0] === shopId)?.[1] || 'Unknown';
          shopSales[shopId] = {
            shopId,
            shopName,
            department: 'Unknown',
            salesman: 'Unknown',
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
        
        // Add historical data
        if (monthKey === 'april') {
          shopSales[shopId].aprilTotal = monthShopData.total;
          shopSales[shopId].aprilEightPM = monthShopData.eightPM;
          shopSales[shopId].aprilVerve = monthShopData.verve;
        } else {
          shopSales[shopId].marchTotal = monthShopData.total;
          shopSales[shopId].marchEightPM = monthShopData.eightPM;
          shopSales[shopId].marchVerve = monthShopData.verve;
        }
      });
    });

    // Calculate growth trends and percentages
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
      
      // Determine monthly trend based on 3-month pattern
      if (march === 0 && april === 0 && may > 0) {
        shop.monthlyTrend = 'new';
      } else if (march > 0 && april > 0 && may === 0) {
        shop.monthlyTrend = 'declining';
      } else if (march > 0 && april > march && may > april) {
        shop.monthlyTrend = 'improving';
      } else if (march > 0 && april < march && may < april) {
        shop.monthlyTrend = 'declining';
      } else {
        shop.monthlyTrend = 'stable';
      }

      // Calculate SKU percentages based on current month total
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

    // Dynamic Customer Insights Analysis based on 3-month data
    const allCurrentShops = Object.values(shopSales).filter(shop => shop.mayTotal! > 0);
    const allPreviousShops = Object.values(shopSales).filter(shop => shop.aprilTotal! > 0);
    
    // New shops: didn't exist in previous months but exist in current month
    const newShops = Object.values(shopSales).filter(shop => 
      shop.mayTotal! > 0 && shop.aprilTotal === 0 && shop.marchTotal === 0
    );
    
    // Lost shops: existed in previous month but not in current month
    const lostShops = Object.values(shopSales).filter(shop => 
      shop.mayTotal === 0 && shop.aprilTotal! > 0
    );

    // Consistent performers: positive growth trend and active for multiple months
    const consistentShops = Object.values(shopSales).filter(shop => 
      shop.mayTotal! > 0 && shop.aprilTotal! > 0 && 
      (shop.monthlyTrend === 'improving' || (shop.monthlyTrend === 'stable' && shop.growthPercent! >= 0))
    );

    // Declining performers: negative growth or declining trend
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

    // All shops comparison (combine current + lost shops, sorted by current month performance)
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
        
        // Check if this is May 2025 target
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
      allShopsComparison
    };
  };

  // Enhanced PDF Report Generation
  const generatePDFReport = async () => {
    if (!dashboardData) return;

    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Radico Khaitan Advanced Analytics Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
      
      // Executive Summary
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

      // Customer Insights
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Customer Insights - 3-Month Analysis (Mar-Apr-May 2025)', 20, 20);

      const insightsData = [
        ['First-time Customers', dashboardData.customerInsights.firstTimeCustomers.toString()],
        ['Lost Customers', dashboardData.customerInsights.lostCustomers.toString()],
        ['Consistent Performers', dashboardData.customerInsights.consistentPerformers.toString()],
        ['Declining Performers', dashboardData.customerInsights.decliningPerformers.toString()]
      ];

      (doc as any).autoTable({
        head: [['Category', 'Count']],
        body: insightsData,
        startY: 30,
        theme: 'striped'
      });

      // Top Performing Shops with 3-month data
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Top 12 Performing Shops - 3-Month Comparison', 20, 20);

      const topShopsData = dashboardData.topShops.slice(0, 12).map((shop, index) => [
        (index + 1).toString(),
        shop.shopName,
        shop.department,
        (shop.marchTotal || 0).toString(),
        (shop.aprilTotal || 0).toString(),
        (shop.mayTotal || shop.total).toString(),
        `${shop.growthPercent?.toFixed(1) || '0'}%`,
        shop.monthlyTrend || 'stable'
      ]);

      (doc as any).autoTable({
        head: [['Rank', 'Shop Name', 'Department', 'Mar', 'Apr', 'May', 'Growth %', 'Trend']],
        body: topShopsData,
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 8 }
      });

      doc.save(`Radico_Advanced_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  // Excel Export Function
  const exportToExcel = async () => {
    if (!dashboardData) return;

    try {
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Add header
      csvContent += "Shop Analysis Report - 3-Month Comparison - " + new Date().toLocaleDateString() + "\n\n";
      
      // Add summary
      csvContent += "EXECUTIVE SUMMARY\n";
      csvContent += "Total Shops," + dashboardData.summary.totalShops + "\n";
      csvContent += "Billed Shops," + dashboardData.summary.billedShops + "\n";
      csvContent += "Coverage," + dashboardData.summary.coverage + "%\n";
      csvContent += "8PM Sales," + dashboardData.summary.total8PM + " cases\n";
      csvContent += "VERVE Sales," + dashboardData.summary.totalVERVE + " cases\n\n";
      
      // Add customer insights
      csvContent += "CUSTOMER INSIGHTS\n";
      csvContent += "First-time Customers," + dashboardData.customerInsights.firstTimeCustomers + "\n";
      csvContent += "Lost Customers," + dashboardData.customerInsights.lostCustomers + "\n";
      csvContent += "Consistent Performers," + dashboardData.customerInsights.consistentPerformers + "\n";
      csvContent += "Declining Performers," + dashboardData.customerInsights.decliningPerformers + "\n\n";
      
      // Add shop comparison data with 3-month view
      csvContent += "SHOP COMPARISON (MAR-APR-MAY 2025)\n";
      csvContent += "Shop Name,Department,Salesman,Mar Cases,Apr Cases,May Cases,8PM Cases,VERVE Cases,Growth %,Monthly Trend\n";
      
      dashboardData.allShopsComparison.forEach(shop => {
        csvContent += `"${shop.shopName}","${shop.department}","${shop.salesman}",${shop.marchTotal || 0},${shop.aprilTotal || 0},${shop.mayTotal || shop.total},${shop.eightPM},${shop.verve},${shop.growthPercent?.toFixed(1) || 0}%,"${shop.monthlyTrend || 'stable'}"\n`;
      });

      // Download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Radico_3Month_Analysis_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  // SKU Modal Component
  const SKUModal = ({ shop, onClose }: { shop: ShopData, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold">SKU Breakdown - {shop.shopName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{shop.total}</div>
              <div className="text-sm text-gray-500">Total Cases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{shop.growthPercent?.toFixed(1) || 0}%</div>
              <div className="text-sm text-gray-500">Growth vs April</div>
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
                {shop.skuBreakdown?.map((sku, index) => (
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Radico Dashboard</h2>
          <p className="text-gray-600">Getting Live Data...</p>
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
              <li>3. Make sure your Google Sheets are publicly accessible</li>
              <li>4. Refresh this page</li>
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-4 sm:py-0">
            <div className="flex items-center mb-4 sm:mb-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Radico Khaitan Dashboard</h1>
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Live Data
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
                  <span>Excel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 sm:space-x-8 min-w-max">
            {[
              { id: 'overview', label: 'Sales Overview', icon: BarChart3 },
              { id: 'shops', label: 'Top Shops', icon: Trophy },
              { id: 'territory', label: 'Territory Analysis', icon: Building },
              { id: 'performance', label: 'Performance', icon: Target },
              { id: 'analytics', label: 'Advanced Analytics', icon: Activity }
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {dashboardData && (
          <>
            {activeTab === 'overview' && <OverviewTab data={dashboardData} />}
            {activeTab === 'shops' && <TopShopsTab data={dashboardData} />}
            {activeTab === 'territory' && <TerritoryTab data={dashboardData} />}
            {activeTab === 'performance' && <PerformanceTab data={dashboardData} />}
            {activeTab === 'analytics' && <AdvancedAnalyticsTab 
              data={dashboardData} 
              onShowSKU={(shop) => {
                setSelectedShopSKU(shop);
                setShowSKUModal(true);
              }}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
            />}
          </>
        )}
      </main>

      {/* SKU Modal */}
      {showSKUModal && selectedShopSKU && (
        <SKUModal 
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

// Advanced Analytics Tab Component
const AdvancedAnalyticsTab = ({ 
  data, 
  onShowSKU, 
  currentPage, 
  setCurrentPage, 
  itemsPerPage 
}: { 
  data: DashboardData, 
  onShowSKU: (shop: ShopData) => void,
  currentPage: number,
  setCurrentPage: (page: number) => void,
  itemsPerPage: number
}) => {
  const totalPages = Math.ceil(data.allShopsComparison.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentShops = data.allShopsComparison.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Customer Insights Cards */}
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

      {/* Complete Shop Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Complete Shop Analysis - 3-Month Comparison (Mar-Apr-May 2025)</h3>
          <p className="text-sm text-gray-500">All shops ranked by current month performance with 3-month trend analysis</p>
        </div>
        
        {/* Mobile-friendly table */}
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

        {/* Pagination */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            Showing {startIndex + 1} to {Math.min(endIndex, data.allShopsComparison.length)} of {data.allShopsComparison.length} shops
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

      {/* Category Breakdown Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Customers */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <UserPlus className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">First-time Billing Shops (New in Current Month)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Month Cases</th>
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

        {/* Lost Customers */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Lost Customers (Active previously, not in current month)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Month Cases</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lost Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.customerInsights.lostShops.slice(0, 10).map((shop) => (
                  <tr key={shop.shopId}>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.shopName}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.salesman}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{shop.aprilTotal}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600">{shop.aprilTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Consistent Performers */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <Star className="w-5 h-5 text-yellow-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Consistent Performers (Good performance across months)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mar Cases</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apr Cases</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">May Cases</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Growth %</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.customerInsights.consistentShops.slice(0, 15).map((shop) => (
                <tr key={shop.shopId}>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{shop.shopName}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{shop.salesman}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shop.marchTotal || 0}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shop.aprilTotal || 0}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shop.mayTotal || shop.total}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {shop.growthPercent?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      shop.monthlyTrend === 'improving' ? 'bg-green-100 text-green-800' :
                      shop.monthlyTrend === 'stable' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {shop.monthlyTrend === 'improving' ? 'Improving 📈' :
                       shop.monthlyTrend === 'stable' ? 'Stable ➡️' : 
                       'Consistent ✅'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Keep all existing tab components (OverviewTab, TopShopsTab, TerritoryTab, PerformanceTab) unchanged
const OverviewTab = ({ data }: { data: DashboardData }) => (
  <div className="space-y-6">
    {/* Key Metrics Cards */}
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

    {/* Sales vs Target Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">8PM Performance</h3>
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">VERVE Performance</h3>
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

    {/* Quick Stats */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Statistics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>
    </div>
  </div>
);

// Top Shops Tab Component
const TopShopsTab = ({ data }: { data: DashboardData }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">Top 20 Performing Shops - May 2025</h3>
      <p className="text-sm text-gray-500">Ranked by total cases sold</p>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cases</th>
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">{shop.eightPM.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{shop.verve.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Territory Tab Component
const TerritoryTab = ({ data }: { data: DashboardData }) => (
  <div className="space-y-6">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billed Shops</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg per Shop</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(data.deptPerformance).map(([dept, performance]) => {
              const coveragePercent = (performance.billedShops / performance.totalShops) * 100;
              const avgPerShop = performance.billedShops > 0 ? (performance.sales / performance.billedShops).toFixed(1) : 0;
              
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Performance Tab Component
const PerformanceTab = ({ data }: { data: DashboardData }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Brand Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Distribution</h3>
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

      {/* Achievement Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Achievement Summary</h3>
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

    {/* Department Performance Chart */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Department Performance Overview</h3>
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

// Metric Card Component
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
