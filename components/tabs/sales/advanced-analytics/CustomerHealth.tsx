'use client';

import React, { useState, useMemo } from 'react';
import { Heart, AlertTriangle, Calendar, TrendingDown, TrendingUp, Filter, Download, Search, X, ChevronLeft, ChevronRight, Clock, Users, BarChart3 } from 'lucide-react';

// ==========================================
// TYPE DEFINITIONS (ENHANCED WITH HISTORICAL DATA)
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
  
  // NEW: Extended Historical Data (NOW AVAILABLE!)
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
  
  // EXISTING: YoY and other metrics (UNCHANGED)
  juneLastYearTotal?: number;
  juneLastYearEightPM?: number;
  juneLastYearVerve?: number;
  yoyGrowthPercent?: number;
  growthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
  skuBreakdown?: any[];
  threeMonthAvgTotal?: number;
  threeMonthAvg8PM?: number;
  threeMonthAvgVERVE?: number;
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
  historicalData?: any;
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
  quarterlyGrowing: number;
}

interface AnalyzedShop extends ShopData {
  lastOrderDate?: string;
  daysSinceLastOrder?: number;
  customerStatus: 'active' | 'unbilled' | 'at-risk' | 'lost' | 'never-ordered';
  lastOrderMonth?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  quarterlyDecline?: number;
  // NEW: Enhanced quarterly performance metrics
  q1FY2024?: number;
  q1FY2025?: number;
  q4FY2024?: number;
  qoqGrowth?: number;
  yoyGrowth?: number;
}

// ==========================================
// HELPER FUNCTIONS (UNCHANGED)
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
// MAIN COMPONENT
// ==========================================

const CustomerHealth = ({ data }: { data: DashboardData }) => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  const [activeBrand, setActiveBrand] = useState<'all' | '8PM' | 'VERVE'>('all');
  const [lookbackMonths, setLookbackMonths] = useState(3);
  const [activeSection, setActiveSection] = useState<'unbilled' | 'lost' | 'quarterly'>('unbilled');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [salesmanFilter, setSalesmanFilter] = useState('');

  // ==========================================
  // ENHANCED DATA PROCESSING WITH COMPLETE HISTORICAL SCANNING + QUARTERLY PERFORMANCE
  // ==========================================

  const analyzedShops = useMemo((): AnalyzedShop[] => {
    console.log('🔍 ENHANCED CUSTOMER HEALTH: Processing shops with complete historical data...');
    
    return data.allShopsComparison.map(shop => {
      // ENHANCED: Define ALL available months in chronological order (most recent first)
      const availableMonths = [
        { key: 'june', month: '06', year: data.currentYear, label: 'June' },
        { key: 'may', month: '05', year: data.currentYear, label: 'May' },
        { key: 'april', month: '04', year: data.currentYear, label: 'April' },
        { key: 'march', month: '03', year: data.currentYear, label: 'March' },
        
        // NEW: Now available from enhanced main dashboard!
        { key: 'february', month: '02', year: data.currentYear, label: 'February' },
        { key: 'january', month: '01', year: data.currentYear, label: 'January' },
        { key: 'december', month: '12', year: '2024', label: 'December' },
        { key: 'november', month: '11', year: '2024', label: 'November' },
        { key: 'october', month: '10', year: '2024', label: 'October' },
        { key: 'september', month: '09', year: '2024', label: 'September' },
        { key: 'august', month: '08', year: '2024', label: 'August' },
        { key: 'july', month: '07', year: '2024', label: 'July' }
      ];

      // ENHANCED: Helper function to get brand-specific value for any month
      const getBrandValue = (monthKey: string, brand: 'all' | '8PM' | 'VERVE') => {
        if (brand === '8PM') {
          const key = `${monthKey}EightPM` as keyof ShopData;
          return (shop[key] as number) || 0;
        } else if (brand === 'VERVE') {
          const key = `${monthKey}Verve` as keyof ShopData;
          return (shop[key] as number) || 0;
        } else {
          const key = `${monthKey}Total` as keyof ShopData;
          return (shop[key] as number) || 0;
        }
      };

      // ENHANCED: Find ACTUAL last order date by scanning ALL available months
      let lastOrderDate = '';
      let lastOrderMonth = '';
      let daysSinceLastOrder = 999;
      let customerStatus: AnalyzedShop['customerStatus'] = 'never-ordered';
      let foundLastOrder = false;

      // Scan through all months from most recent to oldest
      for (const monthData of availableMonths) {
        const monthValue = getBrandValue(monthData.key, activeBrand);
        
        if (monthValue > 0 && !foundLastOrder) {
          lastOrderDate = formatDate(monthData.month, monthData.year);
          lastOrderMonth = monthData.month;
          daysSinceLastOrder = calculateDaysBetween(monthData.month, monthData.year, data.currentMonth, data.currentYear);
          foundLastOrder = true;

          // Determine customer status based on how recent the last order was
          if (monthData.key === 'june' && monthData.year === data.currentYear) {
            customerStatus = 'active';
          } else if (monthData.key === 'may' && monthData.year === data.currentYear) {
            customerStatus = 'unbilled';
          } else if (daysSinceLastOrder <= 90) {
            customerStatus = 'at-risk';
          } else {
            customerStatus = 'lost';
          }
          
          break; // Found the most recent order, stop searching
        }
      }

      // If no orders found in any available month, mark as never ordered
      if (!foundLastOrder) {
        lastOrderDate = 'NEVER ORDERED';
        daysSinceLastOrder = 999;
        customerStatus = 'never-ordered';
      }

      // Risk level calculation
      let riskLevel: AnalyzedShop['riskLevel'] = 'low';
      if (daysSinceLastOrder > 90) riskLevel = 'critical';
      else if (daysSinceLastOrder > 60) riskLevel = 'high';
      else if (daysSinceLastOrder > 30) riskLevel = 'medium';

      // SIMPLIFIED QUARTERLY PERFORMANCE (using available data)
      const currentJune = getBrandValue('june', activeBrand);
      const currentMay = getBrandValue('may', activeBrand);
      const currentApril = getBrandValue('april', activeBrand);
      
      // Current Quarter: Q1 FY2025 (Apr-May-Jun 2025) - use current 3 months
      const q1FY2025 = currentApril + currentMay + currentJune;
      
      // Previous Quarter: Use Q4 data if available, otherwise use Q1 average as fallback
      const currentMarch = getBrandValue('march', activeBrand);
      const currentFebruary = getBrandValue('february', activeBrand);
      const currentJanuary = getBrandValue('january', activeBrand);
      const q4FY2024 = currentJanuary + currentFebruary + currentMarch;
      
      // Year-over-Year Quarter: Q1 FY2024 - use last year June data
      const juneLastYear = activeBrand === '8PM' ? (shop.juneLastYearEightPM || 0) :
                          activeBrand === 'VERVE' ? (shop.juneLastYearVerve || 0) :
                          (shop.juneLastYearTotal || 0);
      const q1FY2024 = juneLastYear; // Use actual last year data
      
      // Calculate quarterly metrics
      const qoqGrowth = q4FY2024 > 0 ? ((q1FY2025 - q4FY2024) / q4FY2024) * 100 : 0;
      const yoyGrowth = q1FY2024 > 0 ? ((q1FY2025 - q1FY2024) / q1FY2024) * 100 : 0;
      
      // Simple quarterly decline for backward compatibility
      const q1Average = (currentMarch + currentApril + currentMay) / 3;
      const q2Current = currentJune;
      const quarterlyDecline = q1Average > 0 ? ((q1Average - q2Current) / q1Average) * 100 : 0;

      // DEBUG: Log some quarterly calculations for first few shops
      if (data.allShopsComparison.indexOf(shop) < 3) {
        console.log(`🔍 QUARTERLY CALC for "${shop.shopName}":`, {
          q1FY2024: q1FY2024,
          q1FY2025: q1FY2025,
          q4FY2024: q4FY2024,
          yoyGrowth: yoyGrowth.toFixed(1) + '%',
          qoqGrowth: qoqGrowth.toFixed(1) + '%',
          customerStatus: customerStatus,
          daysSinceLastOrder: daysSinceLastOrder
        });
      }

      return {
        ...shop,
        lastOrderDate,
        lastOrderMonth,
        daysSinceLastOrder,
        customerStatus,
        riskLevel,
        quarterlyDecline,
        // NEW: Enhanced quarterly performance metrics
        q1FY2024: q1FY2024,
        q1FY2025: q1FY2025,
        q4FY2024: q4FY2024,
        qoqGrowth: qoqGrowth,
        yoyGrowth: yoyGrowth
      };
    });
  }, [data, activeBrand]);

  // ==========================================
  // COMPUTED METRICS (ENHANCED)
  // ==========================================

  const healthMetrics = useMemo((): CustomerHealthMetrics => {
    const unbilled = analyzedShops.filter(s => s.customerStatus === 'unbilled').length;
    
    // ENHANCED: More granular lost customer categorization
    const lost2Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 60 && s.daysSinceLastOrder! < 90).length;
    const lost3Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 90 && s.daysSinceLastOrder! < 120).length;
    const lost4Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 120 && s.daysSinceLastOrder! < 150).length;
    const lost5Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 150 && s.daysSinceLastOrder! < 180).length;
    const lost6Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 180 && s.daysSinceLastOrder! < 999).length; // Exclude never-ordered
    const neverOrdered = analyzedShops.filter(s => s.customerStatus === 'never-ordered').length;
    
    const quarterlyDeclining = analyzedShops.filter(s => (s.yoyGrowth || 0) < -10).length; // YoY decline > 10%
    const quarterlyGrowing = analyzedShops.filter(s => (s.yoyGrowth || 0) > 10).length; // YoY growth > 10%

    console.log('📊 ENHANCED CUSTOMER HEALTH METRICS:', {
      unbilled,
      lost2Months,
      lost3Months,
      lost4Months,
      lost5Months,
      lost6Months,
      neverOrdered,
      quarterlyDeclining,
      quarterlyGrowing,
      totalAnalyzed: analyzedShops.length
    });

    return {
      unbilledCount: unbilled,
      lostCustomers2Months: lost2Months,
      lostCustomers3Months: lost3Months,
      lostCustomers4Months: lost4Months,
      lostCustomers5Months: lost5Months,
      lostCustomers6Months: lost6Months,
      neverOrderedCount: neverOrdered,
      quarterlyDeclining,
      quarterlyGrowing
    };
  }, [analyzedShops]);

  // ==========================================
  // FILTERED DATA (ENHANCED)
  // ==========================================

  const filteredShops = useMemo(() => {
    let filtered = analyzedShops.filter(shop => {
      const matchesSearch = !searchText || 
        shop.shopName.toLowerCase().includes(searchText.toLowerCase()) ||
        shop.department.toLowerCase().includes(searchText.toLowerCase()) ||
        shop.salesman.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesDepartment = !departmentFilter || shop.department === departmentFilter;
      const matchesSalesman = !salesmanFilter || shop.salesman === salesmanFilter;

      // Section-specific filtering
      if (activeSection === 'unbilled') {
        return matchesSearch && matchesDepartment && matchesSalesman && 
               shop.customerStatus === 'unbilled';
      } else if (activeSection === 'lost') {
        const monthsBack = lookbackMonths * 30;
        // ENHANCED: Include never-ordered customers and lost customers
        return matchesSearch && matchesDepartment && matchesSalesman && 
               ((shop.daysSinceLastOrder! >= 60 && shop.daysSinceLastOrder! <= monthsBack) ||
                shop.customerStatus === 'never-ordered');
      } else if (activeSection === 'quarterly') {
        // ENHANCED: Show shops with quarterly performance data (both declining and growing)
        return matchesSearch && matchesDepartment && matchesSalesman && 
               (shop.q1FY2025! > 0 || shop.q1FY2024! > 0);
      }

      return matchesSearch && matchesDepartment && matchesSalesman;
    });

    // Sort by relevant criteria
    if (activeSection === 'lost') {
      filtered.sort((a, b) => (b.daysSinceLastOrder! || 0) - (a.daysSinceLastOrder! || 0));
    } else if (activeSection === 'quarterly') {
      // ENHANCED: Sort by Year-over-Year growth (most declining first, then most growing)
      filtered.sort((a, b) => (a.yoyGrowth! || 0) - (b.yoyGrowth! || 0));
    } else {
      filtered.sort((a, b) => (b.mayTotal || 0) - (a.mayTotal || 0));
    }

    return filtered;
  }, [analyzedShops, searchText, departmentFilter, salesmanFilter, activeSection, lookbackMonths]);

  // Pagination
  const totalPages = Math.ceil(filteredShops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentShops = filteredShops.slice(startIndex, endIndex);

  // Filter options
  const departments = [...new Set(data.allShopsComparison.map(shop => shop.department))].sort();
  const salesmen = [...new Set(data.allShopsComparison.map(shop => shop.salesman))].sort();

  // ==========================================
  // EXPORT FUNCTION (ENHANCED)
  // ==========================================

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Radico Customer Health Analysis - ${activeSection.toUpperCase()} - ${new Date().toLocaleDateString()}\n`;
    csvContent += `Brand Filter: ${activeBrand}, Lookback: ${lookbackMonths} months\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    if (activeSection === 'unbilled') {
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
      csvContent += `QUARTERLY FISCAL PERFORMANCE ANALYSIS\n`;
      csvContent += `Shop Name,Department,Salesman,Q1 FY2024 (Jun),Q1 FY2025 (Total),YoY Growth %,QoQ Growth %\n`;
      
      filteredShops.forEach(shop => {
        csvContent += `"${shop.shopName}","${shop.department}","${shop.salesman}",${shop.q1FY2024 || 0},${shop.q1FY2025 || 0},${(shop.yoyGrowth || 0).toFixed(1)}%,${(shop.qoqGrowth || 0).toFixed(1)}%\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Customer_Health_${activeSection}_${activeBrand}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // RENDER HELPERS (UNCHANGED)
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
              Customer Health Intelligence
            </h2>
            <p className="text-gray-600">Enhanced customer lifecycle analysis with complete historical data</p>
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

        {/* Key Metrics - ENHANCED */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              <h4 className="font-medium text-orange-800">Unbilled This Month</h4>
            </div>
            <div className="text-2xl font-bold text-orange-600">{healthMetrics.unbilledCount}</div>
            <p className="text-sm text-orange-600">Ordered in May, not June</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 text-red-600 mr-2" />
              <h4 className="font-medium text-red-800">Lost Customers</h4>
            </div>
            <div className="text-2xl font-bold text-red-600">{healthMetrics.lostCustomers3Months}</div>
            <p className="text-sm text-red-600">3+ months no orders</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-gray-600 mr-2" />
              <h4 className="font-medium text-gray-800">Never Ordered</h4>
            </div>
            <div className="text-2xl font-bold text-gray-600">{healthMetrics.neverOrderedCount}</div>
            <p className="text-sm text-gray-600">No history since Apr 2024</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="font-medium text-green-800">Growing Quarterly</h4>
            </div>
            <div className="text-2xl font-bold text-green-600">{healthMetrics.quarterlyGrowing}</div>
            <p className="text-sm text-green-600">Positive growth trend</p>
          </div>
        </div>
      </div>

      {/* Analysis Sections */}
      <div className="bg-white rounded-lg shadow">
        {/* Section Navigation */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex space-x-4">
              {[
                { id: 'unbilled', label: 'Unbilled This Month', icon: AlertTriangle },
                { id: 'lost', label: 'Lost Customer Analysis', icon: Clock },
                { id: 'quarterly', label: 'Quarterly Performance', icon: BarChart3 }
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

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search shops, departments, salesmen..."
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

            <button
              onClick={() => {
                setSearchText('');
                setDepartmentFilter('');
                setSalesmanFilter('');
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
              Showing {filteredShops.length} shops
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q1 FY2024 (Jun)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q1 FY2025 (Total)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">YoY Growth</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentShops.map((shop) => (
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
                        {(shop.q1FY2024 || 0).toLocaleString()} cases
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {(shop.q1FY2025 || 0).toLocaleString()} cases
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          (shop.yoyGrowth || 0) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {(shop.yoyGrowth || 0) >= 0 ? '+' : ''}{(shop.yoyGrowth || 0).toFixed(1)}%
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-700 mb-2 sm:mb-0">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredShops.length)} of {filteredShops.length} shops
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
    </div>
  );
};

export default CustomerHealth;
