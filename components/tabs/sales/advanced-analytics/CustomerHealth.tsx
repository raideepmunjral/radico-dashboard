'use client';

import React, { useState, useMemo } from 'react';
import { Heart, AlertTriangle, Calendar, TrendingDown, TrendingUp, Filter, Download, Search, X, ChevronLeft, ChevronRight, Clock, Users, BarChart3, CheckCircle } from 'lucide-react';

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
  activeCount: number;
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
  // ENHANCED: Dual quarterly performance metrics (Q1 + Q2)
  q1FY2024?: number;
  q1FY2025?: number;
  q1FY2025Status?: string;
  q2FY2024?: number;
  q2FY2025?: number;
  q2FY2025Status?: string;
  q2CompletionPct?: number;
  q4FY2024?: number;
  qoqGrowth?: number;
  q1YoyGrowth?: number;
  q2YoyGrowth?: number;
  yoyGrowth?: number; // Legacy compatibility
  isNewCustomer?: boolean;
  isQ2NewCustomer?: boolean;
  // NEW: Enhanced tracking
  hadJulyOrders?: boolean;
  hadAugustOrders?: boolean;
  julyValue?: number;
  augustValue?: number;
}

// ==========================================
// 🔧 FUTURE-READY HELPER FUNCTIONS
// ==========================================

const getMonthName = (monthNum: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

const getShortMonthName = (monthNum: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

// 🔧 Dynamic month calculation with year handling
const getPreviousMonth = (currentMonth: string, currentYear: string): { month: string; year: string; name: string } => {
  const monthNum = parseInt(currentMonth);
  const yearNum = parseInt(currentYear);
  
  if (monthNum === 1) {
    // January -> Previous December
    return {
      month: '12',
      year: (yearNum - 1).toString(),
      name: 'December'
    };
  } else {
    // Any other month -> Previous month same year
    const prevMonth = (monthNum - 1).toString().padStart(2, '0');
    return {
      month: prevMonth,
      year: currentYear,
      name: getMonthName(prevMonth)
    };
  }
};

// 🔧 Get month key for data access
const getMonthKey = (monthNum: string): string => {
  const monthKeys: Record<string, string> = {
    '01': 'january',
    '02': 'february', 
    '03': 'march',
    '04': 'april',
    '05': 'may',
    '06': 'june',
    '07': 'july',
    '08': 'august',
    '09': 'september',
    '10': 'october',
    '11': 'november',
    '12': 'december'
  };
  return monthKeys[monthNum] || 'unknown';
};

// 🔧 Get brand-specific value for any month (DYNAMIC)
const getBrandValue = (shop: ShopData, monthKey: string, brand: 'all' | '8PM' | 'VERVE'): number => {
  try {
    if (monthKey === 'current') {
      // Current month data from challan
      if (brand === '8PM') return shop.eightPM || 0;
      if (brand === 'VERVE') return shop.verve || 0;
      return shop.total || 0;
    }
    
    // Historical month data
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
  } catch (error) {
    console.warn('Error getting brand value:', error, { shop: shop.shopName, monthKey, brand });
    return 0;
  }
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
  // 🔧 DYNAMIC MONTH CALCULATIONS
  // ==========================================
  
  const currentMonthInfo = useMemo(() => {
    const currentMonth = data.currentMonth;
    const currentYear = data.currentYear;
    const previousMonth = getPreviousMonth(currentMonth, currentYear);
    
    return {
      current: {
        month: currentMonth,
        year: currentYear,
        name: getMonthName(currentMonth),
        key: getMonthKey(currentMonth)
      },
      previous: {
        month: previousMonth.month,
        year: previousMonth.year, 
        name: previousMonth.name,
        key: getMonthKey(previousMonth.month)
      }
    };
  }, [data.currentMonth, data.currentYear]);

  console.log('🔧 DYNAMIC MONTH CALCULATION for 720 shops:', {
    totalShops: data.allShopsComparison.length,
    current: currentMonthInfo.current,
    previous: currentMonthInfo.previous,
    unbilledLogic: `Had orders in ${currentMonthInfo.previous.name}, no orders in ${currentMonthInfo.current.name}`
  });

  // ==========================================
  // 🔧 CRITICAL FIX: ENHANCED DATA PROCESSING FOR 720 SHOPS
  // ==========================================

  const analyzedShops = useMemo((): AnalyzedShop[] => {
    console.log('🔍 PROCESSING 720 SHOPS with CORRECTED UNBILLED LOGIC...', {
      totalShops: data.allShopsComparison.length,
      currentMonth: currentMonthInfo.current.name,
      previousMonth: currentMonthInfo.previous.name
    });
    
    return data.allShopsComparison.map(shop => {
      // 🔧 CRITICAL FIX: Proper current vs previous month detection
      const currentMonthValue = getBrandValue(shop, 'current', activeBrand);
      const previousMonthValue = getBrandValue(shop, currentMonthInfo.previous.key, activeBrand);
      
      // Track specific July/August values for debugging
      const julyValue = getBrandValue(shop, 'july', activeBrand);
      const augustValue = getBrandValue(shop, 'current', activeBrand); // August is current
      const hadJulyOrders = julyValue > 0;
      const hadAugustOrders = augustValue > 0;
      
      // 🔧 ENHANCED: Customer status determination with precise logic
      let customerStatus: AnalyzedShop['customerStatus'] = 'never-ordered';
      let lastOrderDate = '';
      let lastOrderMonth = '';
      let daysSinceLastOrder = 999;
      let foundLastOrder = false;

      // Step 1: Check if shop has current month orders (August 2025)
      if (currentMonthValue > 0) {
        customerStatus = 'active';
        lastOrderDate = formatDate(currentMonthInfo.current.month, currentMonthInfo.current.year);
        lastOrderMonth = currentMonthInfo.current.month;
        daysSinceLastOrder = 0;
        foundLastOrder = true;
      }
      // Step 2: 🔧 CRITICAL - Check if shop had previous month orders but no current month orders
      else if (previousMonthValue > 0) {
        customerStatus = 'unbilled'; // ✅ This is the key fix
        lastOrderDate = formatDate(currentMonthInfo.previous.month, currentMonthInfo.previous.year);
        lastOrderMonth = currentMonthInfo.previous.month;
        daysSinceLastOrder = calculateDaysBetween(
          currentMonthInfo.previous.month, 
          currentMonthInfo.previous.year, 
          currentMonthInfo.current.month, 
          currentMonthInfo.current.year
        );
        foundLastOrder = true;
      }
      // Step 3: Check historical months for lost/at-risk customers
      else {
        const historicalMonths = [
          { key: 'may', month: '05', year: currentMonthInfo.current.year, label: 'May' },
          { key: 'april', month: '04', year: currentMonthInfo.current.year, label: 'April' },
          { key: 'march', month: '03', year: currentMonthInfo.current.year, label: 'March' },
          { key: 'february', month: '02', year: currentMonthInfo.current.year, label: 'February' },
          { key: 'january', month: '01', year: currentMonthInfo.current.year, label: 'January' },
          { key: 'december', month: '12', year: '2024', label: 'December' },
          { key: 'november', month: '11', year: '2024', label: 'November' },
          { key: 'october', month: '10', year: '2024', label: 'October' },
          { key: 'september', month: '09', year: '2024', label: 'September' },
          { key: 'august', month: '08', year: '2024', label: 'August' }
        ];

        for (const monthData of historicalMonths) {
          const monthValue = getBrandValue(shop, monthData.key, activeBrand);
          
          if (monthValue > 0 && !foundLastOrder) {
            lastOrderDate = formatDate(monthData.month, monthData.year);
            lastOrderMonth = monthData.month;
            daysSinceLastOrder = calculateDaysBetween(monthData.month, monthData.year, currentMonthInfo.current.month, currentMonthInfo.current.year);
            foundLastOrder = true;

            if (daysSinceLastOrder <= 90) {
              customerStatus = 'at-risk';
            } else {
              customerStatus = 'lost';
            }
            
            break;
          }
        }
      }

      // Step 4: If no orders found anywhere, mark as never ordered
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

      // 🔧 QUARTERLY PERFORMANCE (keeping existing logic)
      const currentJune = getBrandValue(shop, 'june', activeBrand);
      const currentMay = getBrandValue(shop, 'may', activeBrand);
      const currentApril = getBrandValue(shop, 'april', activeBrand);
      
      const q1FY2025 = currentApril + currentMay + currentJune;
      const q1FY2025Status = 'COMPLETED';
      
      const currentMonthNum = parseInt(data.currentMonth);
      
      let july2025 = 0;
      let august2025 = 0;
      let september2025 = 0;
      
      if (currentMonthNum === 7 && data.currentYear === '2025') {
        july2025 = shop.total || 0;
      } else if (currentMonthNum === 8 && data.currentYear === '2025') {
        august2025 = shop.total || 0; 
      } else if (currentMonthNum === 9 && data.currentYear === '2025') {
        september2025 = shop.total || 0;
      }
      
      const q2FY2025 = july2025 + august2025 + september2025;
      let q2FY2025Status = 'NOT_STARTED';
      let q2CompletionPct = 0;
      
      if (currentMonthNum >= 8) {
        q2FY2025Status = 'IN_PROGRESS_2_3';
        q2CompletionPct = 67;
      } else if (currentMonthNum >= 9) {
        q2FY2025Status = 'COMPLETED';
        q2CompletionPct = 100;
      }
      
      const currentMarch = getBrandValue(shop, 'march', activeBrand);
      const currentFebruary = getBrandValue(shop, 'february', activeBrand);
      const currentJanuary = getBrandValue(shop, 'january', activeBrand);
      const q4FY2024 = currentJanuary + currentFebruary + currentMarch;
      
      const juneLastYear = activeBrand === '8PM' ? (shop.juneLastYearEightPM || 0) :
                          activeBrand === 'VERVE' ? (shop.juneLastYearVerve || 0) :
                          (shop.juneLastYearTotal || 0);
      const q1FY2024 = juneLastYear;
      
      const july2024 = getBrandValue(shop, 'july', activeBrand);
      const august2024 = getBrandValue(shop, 'august', activeBrand);
      const september2024 = getBrandValue(shop, 'september', activeBrand);
      const q2FY2024 = july2024 + august2024 + september2024;
      
      const qoqGrowth = q4FY2024 > 0 ? ((q1FY2025 - q4FY2024) / q4FY2024) * 100 : 0;
      
      let q1YoyGrowth = 0;
      let isNewCustomer = false;
      
      if (q1FY2024 === 0 && q1FY2025 > 0) {
        isNewCustomer = true;
        q1YoyGrowth = 999;
      } else if (q1FY2024 > 0) {
        q1YoyGrowth = ((q1FY2025 - q1FY2024) / q1FY2024) * 100;
      } else {
        q1YoyGrowth = 0;
      }
      
      let q2YoyGrowth = 0;
      let isQ2NewCustomer = false;
      
      if (q2FY2024 === 0 && q2FY2025 > 0) {
        isQ2NewCustomer = true;
        q2YoyGrowth = 999;
      } else if (q2FY2024 > 0 && q2FY2025 > 0) {
        q2YoyGrowth = ((q2FY2025 - q2FY2024) / q2FY2024) * 100;
      } else {
        q2YoyGrowth = 0;
      }
      
      const yoyGrowth = q1YoyGrowth;
      const q1Average = (currentMarch + currentApril + currentMay) / 3;
      const q2Current = currentJune;
      const quarterlyDecline = q1Average > 0 ? ((q1Average - q2Current) / q1Average) * 100 : 0;

      return {
        ...shop,
        lastOrderDate,
        lastOrderMonth,
        daysSinceLastOrder,
        customerStatus,
        riskLevel,
        quarterlyDecline,
        q1FY2024,
        q1FY2025,
        q1FY2025Status,
        q2FY2024,
        q2FY2025,
        q2FY2025Status,
        q2CompletionPct,
        q4FY2024,
        qoqGrowth,
        q1YoyGrowth,
        q2YoyGrowth,
        yoyGrowth,
        isNewCustomer,
        isQ2NewCustomer,
        // Enhanced tracking
        hadJulyOrders,
        hadAugustOrders,
        julyValue,
        augustValue
      };
    });
  }, [data, activeBrand, currentMonthInfo]);

  // ==========================================
  // 🔧 CORRECTED: HEALTH METRICS FOR 720 SHOPS
  // ==========================================

  const healthMetrics = useMemo((): CustomerHealthMetrics => {
    const active = analyzedShops.filter(s => s.customerStatus === 'active').length;
    const unbilled = analyzedShops.filter(s => s.customerStatus === 'unbilled').length;
    const atRisk = analyzedShops.filter(s => s.customerStatus === 'at-risk').length;
    const lost = analyzedShops.filter(s => s.customerStatus === 'lost').length;
    const neverOrdered = analyzedShops.filter(s => s.customerStatus === 'never-ordered').length;
    
    const lost2Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 60 && s.daysSinceLastOrder! < 90).length;
    const lost3Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 90 && s.daysSinceLastOrder! < 120).length;
    const lost4Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 120 && s.daysSinceLastOrder! < 150).length;
    const lost5Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 150 && s.daysSinceLastOrder! < 180).length;
    const lost6Months = analyzedShops.filter(s => s.daysSinceLastOrder! >= 180 && s.daysSinceLastOrder! < 999).length;
    
    const quarterlyDeclining = analyzedShops.filter(s => !s.isNewCustomer && (s.yoyGrowth || 0) < -10).length;
    const quarterlyGrowing = analyzedShops.filter(s => s.isNewCustomer || (s.yoyGrowth || 0) > 10).length;

    // Enhanced verification data
    const hadJulyNoAugust = analyzedShops.filter(s => s.hadJulyOrders && !s.hadAugustOrders).length;
    const hadBothJulyAugust = analyzedShops.filter(s => s.hadJulyOrders && s.hadAugustOrders).length;

    console.log('📊 CORRECTED CUSTOMER HEALTH for 720 SHOPS:', {
      totalShops: analyzedShops.length,
      statusBreakdown: {
        active: active,
        unbilled: unbilled,
        atRisk: atRisk,
        lost: lost,
        neverOrdered: neverOrdered
      },
      verification: {
        hadJulyNoAugust,
        hadBothJulyAugust,
        shouldEqual: 'unbilled should approximately equal hadJulyNoAugust'
      },
      unbilledLogic: `${unbilled} shops had orders in ${currentMonthInfo.previous.name} but no orders in ${currentMonthInfo.current.name}`,
      expectedVsActual: {
        expected: '~620 unbilled (720 total - 100 billed)',
        actual: unbilled
      }
    });

    return {
      unbilledCount: unbilled,
      activeCount: active,
      lostCustomers2Months: lost2Months,
      lostCustomers3Months: lost3Months,
      lostCustomers4Months: lost4Months,
      lostCustomers5Months: lost5Months,
      lostCustomers6Months: lost6Months,
      neverOrderedCount: neverOrdered,
      quarterlyDeclining,
      quarterlyGrowing
    };
  }, [analyzedShops, currentMonthInfo]);

  // ==========================================
  // FILTERED DATA (UNCHANGED)
  // ==========================================

  const filteredShops = useMemo(() => {
    let filtered = analyzedShops.filter(shop => {
      const matchesSearch = !searchText || 
        shop.shopName.toLowerCase().includes(searchText.toLowerCase()) ||
        shop.department.toLowerCase().includes(searchText.toLowerCase()) ||
        shop.salesman.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesDepartment = !departmentFilter || shop.department === departmentFilter;
      const matchesSalesman = !salesmanFilter || shop.salesman === salesmanFilter;

      if (activeSection === 'unbilled') {
        return matchesSearch && matchesDepartment && matchesSalesman && 
               shop.customerStatus === 'unbilled';
      } else if (activeSection === 'lost') {
        const monthsBack = lookbackMonths * 30;
        return matchesSearch && matchesDepartment && matchesSalesman && 
               ((shop.daysSinceLastOrder! >= 60 && shop.daysSinceLastOrder! <= monthsBack) ||
                shop.customerStatus === 'never-ordered');
      } else if (activeSection === 'quarterly') {
        return matchesSearch && matchesDepartment && matchesSalesman && 
               (shop.q1FY2025! > 0 || shop.q1FY2024! > 0);
      }

      return matchesSearch && matchesDepartment && matchesSalesman;
    });

    if (activeSection === 'lost') {
      filtered.sort((a, b) => (b.daysSinceLastOrder! || 0) - (a.daysSinceLastOrder! || 0));
    } else if (activeSection === 'quarterly') {
      filtered.sort((a, b) => {
        const aGrowth = a.isNewCustomer ? 1000 : (a.yoyGrowth || 0);
        const bGrowth = b.isNewCustomer ? 1000 : (b.yoyGrowth || 0);
        return aGrowth - bGrowth;
      });
    } else {
      const previousMonthKey = `${currentMonthInfo.previous.key}Total` as keyof ShopData;
      filtered.sort((a, b) => ((b[previousMonthKey] as number) || 0) - ((a[previousMonthKey] as number) || 0));
    }

    return filtered;
  }, [analyzedShops, searchText, departmentFilter, salesmanFilter, activeSection, lookbackMonths, currentMonthInfo]);

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
    csvContent += `Radico Customer Health Analysis - 720 SHOPS CORRECTED - ${activeSection.toUpperCase()} - ${new Date().toLocaleDateString()}\n`;
    csvContent += `Brand Filter: ${activeBrand}, Lookback: ${lookbackMonths} months\n`;
    csvContent += `Current Month: ${currentMonthInfo.current.name} ${currentMonthInfo.current.year}\n`;
    csvContent += `Previous Month: ${currentMonthInfo.previous.name} ${currentMonthInfo.previous.year}\n`;
    csvContent += `Total Shops: ${data.allShopsComparison.length}\n`;
    csvContent += `Active: ${healthMetrics.activeCount}, Unbilled: ${healthMetrics.unbilledCount}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    if (activeSection === 'unbilled') {
      csvContent += `UNBILLED SHOPS (${currentMonthInfo.current.name} ${currentMonthInfo.current.year})\n`;
      csvContent += `Had orders in ${currentMonthInfo.previous.name}, no orders in ${currentMonthInfo.current.name}\n`;
      csvContent += `Shop Name,Department,Salesman,${currentMonthInfo.previous.name} Orders,Days Since Order,Risk Level,July Value,August Value\n`;
      
      filteredShops.forEach(shop => {
        const previousMonthKey = `${currentMonthInfo.previous.key}Total` as keyof ShopData;
        const previousMonthValue = (shop[previousMonthKey] as number) || 0;
        csvContent += `"${shop.shopName}","${shop.department}","${shop.salesman}",${previousMonthValue},${shop.daysSinceLastOrder},"${shop.riskLevel}",${shop.julyValue || 0},${shop.augustValue || 0}\n`;
      });
    } else if (activeSection === 'lost') {
      csvContent += `LOST CUSTOMERS ANALYSIS (${lookbackMonths} month lookback)\n`;
      csvContent += `Shop Name,Department,Salesman,Last Order Date,Days Since Order,Customer Status,Risk Level\n`;
      
      filteredShops.forEach(shop => {
        csvContent += `"${shop.shopName}","${shop.department}","${shop.salesman}","${shop.lastOrderDate}",${shop.daysSinceLastOrder},"${shop.customerStatus}","${shop.riskLevel}"\n`;
      });
    } else if (activeSection === 'quarterly') {
      csvContent += `QUARTERLY PERFORMANCE ANALYSIS\n`;
      csvContent += `Shop Name,Department,Salesman,Q1 FY2024,Q1 FY2025,Q1 YoY Growth %,Q2 FY2024,Q2 FY2025,Q2 YoY Growth %\n`;
      
      filteredShops.forEach(shop => {
        const q1YoyDisplay = shop.isNewCustomer ? 'NEW' : `${(shop.q1YoyGrowth || 0).toFixed(1)}%`;
        const q2YoyDisplay = shop.isQ2NewCustomer ? 'NEW Q2' : `${(shop.q2YoyGrowth || 0).toFixed(1)}%`;
        
        csvContent += `"${shop.shopName}","${shop.department}","${shop.salesman}",${shop.q1FY2024 || 0},${shop.q1FY2025 || 0},"${q1YoyDisplay}",${shop.q2FY2024 || 0},${shop.q2FY2025 || 0},"${q2YoyDisplay}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Customer_Health_720_SHOPS_${activeSection}_${activeBrand}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // RENDER HELPERS
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
              Customer Health Intelligence - CORRECTED FOR 720 SHOPS
            </h2>
            <p className="text-gray-600">Enhanced customer lifecycle analysis with corrected unbilled logic</p>
            <div className="mt-2 text-sm text-blue-600">
              ✅ Current Month: {currentMonthInfo.current.name} {currentMonthInfo.current.year} | 
              Previous Month: {currentMonthInfo.previous.name} {currentMonthInfo.previous.year}
            </div>
            <div className="mt-1 text-sm text-green-600">
              🔧 Total Shops: {data.allShopsComparison.length} | Active: {healthMetrics.activeCount} | Unbilled: {healthMetrics.unbilledCount}
            </div>
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

        {/* 🔧 CORRECTED: Key Metrics for 720 Shops */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
            <h4 className="font-medium text-blue-800">Corrected Unbilled Logic Active</h4>
          </div>
          <p className="text-sm text-blue-600">
            Unbilled = Shops with orders in {currentMonthInfo.previous.name} but NO orders in {currentMonthInfo.current.name}
          </p>
          <div className="grid grid-cols-5 gap-4 mt-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{data.allShopsComparison.length}</div>
              <div className="text-xs text-blue-600">Total Shops</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{healthMetrics.activeCount}</div>
              <div className="text-xs text-green-600">Active (Aug)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{healthMetrics.unbilledCount}</div>
              <div className="text-xs text-orange-600">Unbilled</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{healthMetrics.lostCustomers3Months}</div>
              <div className="text-xs text-red-600">Lost 3M+</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-600">{healthMetrics.neverOrderedCount}</div>
              <div className="text-xs text-gray-600">Never Ordered</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              <h4 className="font-medium text-orange-800">Unbilled This Month</h4>
            </div>
            <div className="text-2xl font-bold text-orange-600">{healthMetrics.unbilledCount}</div>
            <p className="text-sm text-orange-600">
              Ordered in {currentMonthInfo.previous.name}, not {currentMonthInfo.current.name}
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="font-medium text-green-800">Active This Month</h4>
            </div>
            <div className="text-2xl font-bold text-green-600">{healthMetrics.activeCount}</div>
            <p className="text-sm text-green-600">Billed in {currentMonthInfo.current.name}</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 text-red-600 mr-2" />
              <h4 className="font-medium text-red-800">Lost Customers</h4>
            </div>
            <div className="text-2xl font-bold text-red-600">{healthMetrics.lostCustomers3Months}</div>
            <p className="text-sm text-red-600">3+ months no orders</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-800">Growing Quarterly</h4>
            </div>
            <div className="text-2xl font-bold text-blue-600">{healthMetrics.quarterlyGrowing}</div>
            <p className="text-sm text-blue-600">Positive growth trend</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{currentMonthInfo.previous.name} Orders</th>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q1 FY2024</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q1 FY2025</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q1 YoY Growth</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q2 FY2024</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q2 FY2025</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q2 YoY Growth</th>
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
                        {(() => {
                          const previousMonthKey = `${currentMonthInfo.previous.key}Total` as keyof ShopData;
                          const value = (shop[previousMonthKey] as number) || 0;
                          return `${value.toLocaleString()} cases`;
                        })()}
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
                        <div className="text-xs text-gray-500">Apr-May-Jun 2024</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {(shop.q1FY2025 || 0).toLocaleString()} cases
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {shop.isNewCustomer ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            NEW
                          </span>
                        ) : (shop.q1FY2025 || 0) === 0 && (shop.q1FY2024 || 0) > 0 ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            -100.0%
                          </span>
                        ) : (shop.q1FY2025 || 0) === 0 && (shop.q1FY2024 || 0) === 0 ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                            NO DATA
                          </span>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            (shop.q1YoyGrowth || 0) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {(shop.q1YoyGrowth || 0) >= 0 ? '+' : ''}{(shop.q1YoyGrowth || 0).toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(shop.q2FY2024 || 0).toLocaleString()} cases
                        <div className="text-xs text-gray-500">Jul-Aug-Sep 2024</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {(shop.q2FY2025 || 0).toLocaleString()} cases
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {shop.q2FY2025Status === 'NOT_STARTED' ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                            PENDING
                          </span>
                        ) : (shop.q2FY2025 || 0) === 0 && (shop.q2FY2024 || 0) > 0 ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            -100.0%
                          </span>
                        ) : (shop.q2FY2025 || 0) === 0 && (shop.q2FY2024 || 0) === 0 ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                            NO DATA
                          </span>
                        ) : shop.isQ2NewCustomer ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            NEW Q2
                          </span>
                        ) : shop.q2FY2024 === 0 && (shop.q2FY2025 || 0) > 0 ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            FIRST Q2
                          </span>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            (shop.q2YoyGrowth || 0) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {(shop.q2YoyGrowth || 0) >= 0 ? '+' : ''}{(shop.q2YoyGrowth || 0).toFixed(1)}%
                            {shop.q2FY2025Status?.includes('IN_PROGRESS') && <div className="text-xs opacity-60">*partial</div>}
                          </span>
                        )}
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
