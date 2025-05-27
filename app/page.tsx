'use client';

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, MapPin, TrendingUp, Users, ShoppingBag, BarChart3, Calendar, Trophy, Building, Target, Activity } from 'lucide-react';

// Types
interface ShopData {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  total: number;
  eightPM: number;
  verve: number;
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
}

const RadicoDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

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

  // Process data exactly like your Apps Script but enhanced
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

    // Process sales data for May 2025
    const mayChallans = challans.filter(row => 
      row[1] && row[1].toString().includes('-05-') && row[1].toString().includes('2025')
    );

    // Calculate sales metrics
    let total8PM = 0, totalVERVE = 0;
    const shopSales: Record<string, ShopData> = {};
    const uniqueShops = new Set<string>();

    // Process challans
    mayChallans.forEach(row => {
      if (row.length >= 15) {
        const shopId = row[8]?.toString().trim();
        const shopName = row[9]?.toString().trim();
        const brand = row[11]?.toString().trim();
        const cases = parseFloat(row[14]) || 0;
        
        if (shopId && brand && cases > 0) {
          uniqueShops.add(shopId);
          const parentBrand = brandFamily[brand];
          
          if (parentBrand === "8PM") total8PM += cases;
          else if (parentBrand === "VERVE") totalVERVE += cases;

          if (!shopSales[shopId]) {
            shopSales[shopId] = { 
              shopId,
              shopName: shopName || 'Unknown',
              department: 'Unknown',
              salesman: 'Unknown',
              total: 0, 
              eightPM: 0, 
              verve: 0 
            };
          }
          
          shopSales[shopId].total += cases;
          if (parentBrand === "8PM") shopSales[shopId].eightPM += cases;
          else if (parentBrand === "VERVE") shopSales[shopId].verve += cases;
        }
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
      visitData: visitData.length - 1,
      lastUpdated,
      salespersonStats
    };
  };

  // Generate PDF Report
  const generatePDFReport = async () => {
    if (!dashboardData) return;

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const jsPDFModule = await import('jspdf-autotable');

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Radico Khaitan Dashboard Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
      
      // Summary Section
      doc.setFontSize(16);
      doc.text('Executive Summary', 20, 50);
      
      const summaryData = [
        ['Total Shops', dashboardData.summary.totalShops.toString()],
        ['Billed Shops', dashboardData.summary.billedShops.toString()],
        ['Coverage', `${dashboardData.summary.coverage}%`],
        ['8PM Sales', `${dashboardData.summary.total8PM} cases`],
        ['8PM Target', `${dashboardData.summary.total8PMTarget} cases`],
        ['8PM Achievement', `${dashboardData.summary.eightPmAchievement}%`],
        ['VERVE Sales', `${dashboardData.summary.totalVERVE} cases`],
        ['VERVE Target', `${dashboardData.summary.totalVerveTarget} cases`],
        ['VERVE Achievement', `${dashboardData.summary.verveAchievement}%`],
        ['Total Sales', `${dashboardData.summary.totalSales} cases`]
      ];

      (doc as any).autoTable({
        head: [['Metric', 'Value']],
        body: summaryData,
        startY: 60,
        theme: 'grid'
      });

      // Top Shops Section
      doc.setFontSize(16);
      doc.text('Top 10 Performing Shops', 20, (doc as any).lastAutoTable.finalY + 20);

      const topShopsData = dashboardData.topShops.slice(0, 10).map((shop, index) => [
        (index + 1).toString(),
        shop.shopName || 'Unknown',
        shop.department,
        shop.salesman,
        shop.total.toString(),
        shop.eightPM.toString(),
        shop.verve.toString()
      ]);

      (doc as any).autoTable({
        head: [['Rank', 'Shop Name', 'Department', 'Salesman', 'Total', '8PM', 'VERVE']],
        body: topShopsData,
        startY: (doc as any).lastAutoTable.finalY + 30,
        theme: 'striped',
        styles: { fontSize: 8 }
      });

      // Department Performance
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Department Performance', 20, 20);

      const deptData = Object.entries(dashboardData.deptPerformance).map(([dept, data]) => [
        dept,
        data.totalShops.toString(),
        data.billedShops.toString(),
        `${((data.billedShops / data.totalShops) * 100).toFixed(1)}%`,
        data.sales.toString()
      ]);

      (doc as any).autoTable({
        head: [['Department', 'Total Shops', 'Billed Shops', 'Coverage', 'Total Sales']],
        body: deptData,
        startY: 30,
        theme: 'grid'
      });

      // Save PDF
      doc.save(`Radico_Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-radico-blue" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Radico Dashboard</h2>
          <p className="text-gray-600">Fetching data from Google Sheets...</p>
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
            className="mt-4 bg-radico-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Radico Khaitan Dashboard</h1>
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Live from Google Sheets
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              <button
                onClick={fetchDashboardData}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={generatePDFReport}
                className="bg-radico-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Sales Overview', icon: BarChart3 },
              { id: 'shops', label: 'Top Shops', icon: Trophy },
              { id: 'territory', label: 'Territory Analysis', icon: Building },
              { id: 'performance', label: 'Performance', icon: Target }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-radico-blue text-radico-blue'
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dashboardData && (
          <>
            {activeTab === 'overview' && <OverviewTab data={dashboardData} />}
            {activeTab === 'shops' && <TopShopsTab data={dashboardData} />}
            {activeTab === 'territory' && <TerritoryTab data={dashboardData} />}
            {activeTab === 'performance' && <PerformanceTab data={dashboardData} />}
          </>
        )}
      </main>
    </div>
  );
};

// Overview Tab Component
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
                className="bg-radico-purple h-2 rounded-full" 
                style={{ width: `${Math.min(parseFloat(data.summary.eightPmAchievement), 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-radico-purple">{data.summary.total8PM.toLocaleString()}</div>
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
                className="bg-radico-orange h-2 rounded-full" 
                style={{ width: `${Math.min(parseFloat(data.summary.verveAchievement), 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-radico-orange">{data.summary.totalVERVE.toLocaleString()}</div>
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
          <div className="text-3xl font-bold text-radico-blue">{data.summary.totalSales.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Cases Sold</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-radico-green">{data.summary.coverage}%</div>
          <div className="text-sm text-gray-500">Market Coverage</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-radico-purple">{data.topShops.length}</div>
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-radico-purple">{shop.eightPM.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-radico-orange">{shop.verve.toLocaleString()}</td>
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
                className="bg-radico-purple h-3 rounded-full" 
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
                className="bg-radico-orange h-3 rounded-full" 
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
                <div className="text-2xl font-bold text-radico-blue">{performance.sales.toLocaleString()}</div>
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
    blue: 'bg-radico-blue',
    green: 'bg-radico-green',
    purple: 'bg-radico-purple',
    orange: 'bg-radico-orange'
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
