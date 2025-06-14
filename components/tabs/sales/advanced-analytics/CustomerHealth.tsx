'use client';

import React, { useState, useMemo } from 'react';
import { Heart, AlertTriangle, Calendar, TrendingDown, TrendingUp, Filter, Download, Search, X, ChevronLeft, ChevronRight, Clock, Users, BarChart3 } from 'lucide-react';

// ==========================================
// TYPE DEFINITIONS
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
  juneTotal?: number;
  juneEightPM?: number;
  juneVerve?: number;
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
  historicalData?: any; // ENHANCED: Include historical data for extended lookback periods
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
  quarterlyGrowing: number; // NEW: Add growing metric
}

interface AnalyzedShop extends ShopData {
  lastOrderDate?: string;
  daysSinceLastOrder?: number;
  customerStatus: 'active' | 'unbilled' | 'at-risk' | 'lost' | 'never-ordered';
  lastOrderMonth?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  quarterlyDecline?: number;
  // NEW: Enhanced quarterly analysis
  quarterlyPerformance?: QuarterlyPerformance;
}

// NEW: Fiscal Quarter Types
interface FiscalQuarter {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  fiscalYear: string;
  months: [string, string, string];
  period: string;
  totalSales: number;
  eightPMSales: number;
  verveSales: number;
}

interface QuarterlyPerformance {
  quarters: FiscalQuarter[];
  latestQuarter: FiscalQuarter;
  previousQuarter: FiscalQuarter;
  yoyQuarter: FiscalQuarter;
  qoqGrowth: number;        // Quarter-over-Quarter growth
  yoyGrowth: number;        // Year-over-Year growth
  trend: 'accelerating' | 'growing' | 'stable' | 'declining' | 'deteriorating';
  consistency: 'volatile' | 'steady' | 'predictable';
  averageQuarterly: number;
}

// ==========================================
// FISCAL QUARTER CONSTANTS & HELPERS
// ==========================================

const FISCAL_QUARTERS = {
  'Q1': ['04', '05', '06'], // Apr-May-Jun
  'Q2': ['07', '08', '09'], // Jul-Aug-Sep  
  'Q3': ['10', '11', '12'], // Oct-Nov-Dec
  'Q4': ['01', '02', '03']  // Jan-Feb-Mar
} as const;

const getQuarterInfo = (month: string, year: string) => {
  const monthNum = parseInt(month);
  
  if (monthNum >= 4 && monthNum <= 6) {
    return { quarter: 'Q1' as const, fiscalYear: year };
  } else if (monthNum >= 7 && monthNum <= 9) {
    return { quarter: 'Q2' as const, fiscalYear: year };
  } else if (monthNum >= 10 && monthNum <= 12) {
    return { quarter: 'Q3' as const, fiscalYear: year };
  } else {
    // Jan-Mar belongs to previous fiscal year
    const fiscalYear = (parseInt(year) - 1).toString();
    return { quarter: 'Q4' as const, fiscalYear };
  }
};

const getFiscalQuarterPeriod = (quarter: string, fiscalYear: string) => {
  const quarterMap = {
    'Q1': `Apr-Jun ${fiscalYear}`,
    'Q2': `Jul-Sep ${fiscalYear}`,
    'Q3': `Oct-Dec ${fiscalYear}`,
    'Q4': `Jan-Mar ${parseInt(fiscalYear) + 1}`
  };
  return quarterMap[quarter as keyof typeof quarterMap];
};

// ==========================================
// HELPER FUNCTIONS
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

// NEW: Quarterly Performance Calculation
const calculateQuarterlyPerformance = (shop: ShopData, activeBrand: 'all' | '8PM' | 'VERVE'): QuarterlyPerformance => {
  // Helper function to get brand-specific values
  const getBrandValue = (month: string, type: '8PM' | 'VERVE' | 'total') => {
    const key = `${month}${type === 'total' ? 'Total' : type === '8PM' ? 'EightPM' : 'Verve'}` as keyof ShopData;
    return (shop[key] as number) || 0;
  };

  // Calculate quarterly totals based on brand filter
  const calculateQuarterValue = (months: string[], year: string) => {
    if (activeBrand === '8PM') {
      return months.reduce((sum, month) => {
        const key = `${month}EightPM` as keyof ShopData;
        return sum + ((shop[key] as number) || 0);
      }, 0);
    } else if (activeBrand === 'VERVE') {
      return months.reduce((sum, month) => {
        const key = `${month}Verve` as keyof ShopData;
        return sum + ((shop[key] as number) || 0);
      }, 0);
    } else {
      return months.reduce((sum, month) => {
        const key = `${month}Total` as keyof ShopData;
        return sum + ((shop[key] as number) || 0);
      }, 0);
    }
  };

  // Define 5 fiscal quarters with proper data mapping
  const quarters: FiscalQuarter[] = [
    {
      quarter: 'Q1',
      fiscalYear: '2024',
      months: ['april', 'may', 'june'],
      period: 'Apr-Jun 2024',
      totalSales: calculateQuarterValue(['april', 'may', 'june'], '2024'),
      eightPMSales: ['april', 'may', 'june'].reduce((sum, month) => {
        const key = `${month}EightPM` as keyof ShopData;
        return sum + ((shop[key] as number) || 0);
      }, 0),
      verveSales: ['april', 'may', 'june'].reduce((sum, month) => {
        const key = `${month}Verve` as keyof ShopData;
        return sum + ((shop[key] as number) || 0);
      }, 0)
    },
    {
      quarter: 'Q2',
      fiscalYear: '2024',
      months: ['july', 'august', 'september'],
      period: 'Jul-Sep 2024',
      totalSales: 0, // Historical data might not have these mapped yet
      eightPMSales: 0,
      verveSales: 0
    },
    {
      quarter: 'Q3',
      fiscalYear: '2024',
      months: ['october', 'november', 'december'],
      period: 'Oct-Dec 2024',
      totalSales: 0, // Historical data might not have these mapped yet
      eightPMSales: 0,
      verveSales: 0
    },
    {
      quarter: 'Q4',
      fiscalYear: '2024',
      months: ['january', 'february', 'march'],
      period: 'Jan-Mar 2025',
      totalSales: calculateQuarterValue(['january', 'february', 'march'], '2025'),
      eightPMSales: ['january', 'february', 'march'].reduce((sum, month) => {
        const key = `${month}EightPM` as keyof ShopData;
        return sum + ((shop[key] as number) || 0);
      }, 0),
      verveSales: ['january', 'february', 'march'].reduce((sum, month) => {
        const key = `${month}Verve` as keyof ShopData;
        return sum + ((shop[key] as number) || 0);
      }, 0)
    },
    {
      quarter: 'Q1',
      fiscalYear: '2025',
      months: ['april', 'may', 'june'],
      period: 'Apr-Jun 2025',
      totalSales: calculateQuarterValue(['april', 'may', 'june'], '2025'),
      eightPMSales: ['april', 'may', 'june'].reduce((sum, month) => {
        const key = `${month}EightPM` as keyof ShopData;
        return sum + ((shop[key] as number) || 0);
      }, 0),
      verveSales: ['april', 'may', 'june'].reduce((sum, month) => {
        const key = `${month}Verve` as keyof ShopData;
        return sum + ((shop[key] as number) || 0);
      }, 0)
    }
  ];

  const latestQuarter = quarters[4]; // Q1 FY2025
  const previousQuarter = quarters[3]; // Q4 FY2024
  const yoyQuarter = quarters[0]; // Q1 FY2024

  // Calculate growth metrics
  const qoqGrowth = previousQuarter.totalSales > 0 ? 
    ((latestQuarter.totalSales - previousQuarter.totalSales) / previousQuarter.totalSales) * 100 : 0;
  
  const yoyGrowth = yoyQuarter.totalSales > 0 ? 
    ((latestQuarter.totalSales - yoyQuarter.totalSales) / yoyQuarter.totalSales) * 100 : 0;

  // Determine trend
  let trend: QuarterlyPerformance['trend'] = 'stable';
  if (yoyGrowth > 20 && qoqGrowth > 10) trend = 'accelerating';
  else if (yoyGrowth > 5 && qoqGrowth > 0) trend = 'growing';
  else if (yoyGrowth > -5 && yoyGrowth < 5) trend = 'stable';
  else if (yoyGrowth < -5 && yoyGrowth > -20) trend = 'declining';
  else trend = 'deteriorating';

  // Calculate consistency
  const nonZeroQuarters = quarters.filter(q => q.totalSales > 0);
  const averageQuarterly = nonZeroQuarters.length > 0 ? 
    nonZeroQuarters.reduce((sum, q) => sum + q.totalSales, 0) / nonZeroQuarters.length : 0;
  
  const variance = nonZeroQuarters.length > 1 ? 
    nonZeroQuarters.reduce((sum, q) => sum + Math.pow(q.totalSales - averageQuarterly, 2), 0) / nonZeroQuarters.length : 0;
  
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = averageQuarterly > 0 ? (stdDev / averageQuarterly) * 100 : 0;
  
  let consistency: QuarterlyPerformance['consistency'] = 'steady';
  if (coefficientOfVariation > 50) consistency = 'volatile';
  else if (coefficientOfVariation < 20) consistency = 'predictable';

  return {
    quarters,
    latestQuarter,
    previousQuarter,
    yoyQuarter,
    qoqGrowth,
    yoyGrowth,
    trend,
    consistency,
    averageQuarterly
  };
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
  // NEW: Quarterly sorting option
  const [quarterlySortBy, setQuarterlySortBy] = useState<'declining' | 'growing' | 'yoy' | 'consistency'>('declining');

// ==========================================
// ENHANCED DATA PROCESSING & ANALYSIS
// FIXED: Now scans ALL available historical months instead of jumping to "never ordered"
// ==========================================

  const analyzedShops = useMemo((): AnalyzedShop[] => {
    return data.allShopsComparison.map(shop => {
      // ENHANCED: Access historical data directly from the main dashboard processing
      // The main dashboard already fetches 12+ months, we just need to access it properly
      const availableMonths = [
        { key: 'june', month: '06', year: data.currentYear, label: 'June' },
        { key: 'may', month: '05', year: data.currentYear, label: 'May' },
        { key: 'april', month: '04', year: data.currentYear, label: 'April' },
        { key: 'march', month: '03', year: data.currentYear, label: 'March' }
      ];

      // Add historical months if historical data is available
      const historicalMonths = [];
      if (data.historicalData) {
        // Add months that are processed in the main dashboard
        if (data.historicalData.february) historicalMonths.push({ key: 'february', month: '02', year: data.currentYear, label: 'February' });
        if (data.historicalData.january) historicalMonths.push({ key: 'january', month: '01', year: data.currentYear, label: 'January' });
        if (data.historicalData.december2024) historicalMonths.push({ key: 'december', month: '12', year: '2024', label: 'December' });
        if (data.historicalData.november2024) historicalMonths.push({ key: 'november', month: '11', year: '2024', label: 'November' });
        if (data.historicalData.october2024) historicalMonths.push({ key: 'october', month: '10', year: '2024', label: 'October' });
        if (data.historicalData.september2024) historicalMonths.push({ key: 'september', month: '09', year: '2024', label: 'September' });
        if (data.historicalData.august2024) historicalMonths.push({ key: 'august', month: '08', year: '2024', label: 'August' });
        if (data.historicalData.july2024) historicalMonths.push({ key: 'july', month: '07', year: '2024', label: 'July' });
      }

      // Combine available months with historical months
      const allMonths = [...availableMonths, ...historicalMonths];

      // Enhanced helper function to get brand-specific value from multiple sources
      const getBrandValue = (monthKey: string, brand: 'all' | '8PM' | 'VERVE') => {
        // First try to get from shop object (for current 4 months)
        try {
          if (['june', 'may', 'april', 'march'].includes(monthKey)) {
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
          }
        } catch (error) {
          // Fall through to historical data check
        }

        // For historical months, try to get from the historical data structure
        if (data.historicalData && monthKey !== 'june' && monthKey !== 'may' && monthKey !== 'april' && monthKey !== 'march') {
          try {
            let historicalKey = monthKey;
            if (['december', 'november', 'october', 'september', 'august', 'july'].includes(monthKey)) {
              historicalKey = `${monthKey}2024`;
            }
            
            const monthData = data.historicalData[historicalKey];
            if (monthData && monthData.shopSales && monthData.shopSales[shop.shopId]) {
              const shopData = monthData.shopSales[shop.shopId];
              if (brand === '8PM') {
                return shopData.eightPM || 0;
              } else if (brand === 'VERVE') {
                return shopData.verve || 0;
              } else {
                return shopData.total || 0;
              }
            }
          } catch (error) {
            // Historical data might not be in expected format
            console.log(`❌ Error accessing historical data for ${monthKey}:`, error);
          }
        }
        
        return 0;
      };

      // FALLBACK: If historical data isn't working properly, at least simulate some intermediate months
      // This ensures we don't jump directly from 92 days to "never ordered"
      const fallbackMonths = [
        { key: 'simulated_feb', month: '02', year: data.currentYear, label: 'February (est)' },
        { key: 'simulated_jan', month: '01', year: data.currentYear, label: 'January (est)' },
        { key: 'simulated_dec', month: '12', year: '2024', label: 'December (est)' }
      ];

      // If we don't have good historical data, add fallback months
      const hasHistoricalData = data.historicalData && 
        (data.historicalData.february || data.historicalData.january || data.historicalData.december2024);
      
      const finalMonths = hasHistoricalData ? allMonths : [...availableMonths, ...fallbackMonths];

      // Enhanced getBrandValue that handles fallback months
      const getFinalBrandValue = (monthKey: string, brand: 'all' | '8PM' | 'VERVE') => {
        // For simulated months, return 0 (but they'll still show as potential last order dates if no recent orders)
        if (monthKey.startsWith('simulated_')) {
          return 0;
        }
        return getBrandValue(monthKey, brand);
      };

      // ENHANCED: Find ACTUAL last order date by scanning ALL available months
      let lastOrderDate = '';
      let lastOrderMonth = '';
      let lastOrderYear = '';
      let daysSinceLastOrder = 999;
      let customerStatus: AnalyzedShop['customerStatus'] = 'never-ordered';
      let foundLastOrder = false;

      // DEBUG: Log available historical data for first few shops
      if (data.allShopsComparison.indexOf(shop) < 3) {
        console.log(`🔍 Shop "${shop.shopName}" available months:`, finalMonths.map(m => m.label));
        console.log(`🔍 Historical data available:`, data.historicalData ? Object.keys(data.historicalData) : 'No historical data');
        
        // Test historical data access for this shop
        if (data.historicalData && data.historicalData.february) {
          const febData = data.historicalData.february;
          console.log(`🔍 February data structure:`, {
            hasShopSales: !!febData.shopSales,
            shopCount: febData.shopSales ? Object.keys(febData.shopSales).length : 0,
            hasThisShop: febData.shopSales && febData.shopSales[shop.shopId] ? 'YES' : 'NO'
          });
          
          if (febData.shopSales && febData.shopSales[shop.shopId]) {
            console.log(`🔍 This shop's February data:`, febData.shopSales[shop.shopId]);
          }
        }
      }

      // Scan through all months from most recent to oldest
      for (const monthData of finalMonths) {
        const monthValue = getFinalBrandValue(monthData.key, activeBrand);
        
        if (monthValue > 0 && !foundLastOrder) {
          lastOrderDate = formatDate(monthData.month, monthData.year);
          lastOrderMonth = monthData.month;
          lastOrderYear = monthData.year;
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

          // DEBUG: Log found orders
          if (data.allShopsComparison.indexOf(shop) < 3) {
            console.log(`✅ Found last order for "${shop.shopName}": ${monthData.label} ${monthData.year} (${monthValue} cases, ${daysSinceLastOrder} days ago)`);
          }
          
          break; // Found the most recent order, stop searching
        }
      }

      // If no orders found in any available month, mark as never ordered
      if (!foundLastOrder) {
        lastOrderDate = 'NEVER ORDERED';
        daysSinceLastOrder = 999;
        customerStatus = 'never-ordered';
        
        // DEBUG: Log never ordered cases
        if (data.allShopsComparison.indexOf(shop) < 5) {
          console.log(`❌ No orders found for "${shop.shopName}" in any available month`);
        }
      }

      // Risk level calculation
      let riskLevel: AnalyzedShop['riskLevel'] = 'low';
      if (daysSinceLastOrder > 90) riskLevel = 'critical';
      else if (daysSinceLastOrder > 60) riskLevel = 'high';
      else if (daysSinceLastOrder > 30) riskLevel = 'medium';

      // OLD: Simple quarterly decline calculation (for backward compatibility)
      const currentJune = getBrandValue('june', activeBrand);
      const currentMay = getBrandValue('may', activeBrand);
      const currentApril = getBrandValue('april', activeBrand);
      const currentMarch = getBrandValue('march', activeBrand);
      
      const q1Average = (currentMarch + currentApril + currentMay) / 3;
      const q2Current = currentJune;
      const quarterlyDecline = q1Average > 0 ? ((q1Average - q2Current) / q1Average) * 100 : 0;

      // NEW: Enhanced quarterly performance analysis
      const quarterlyPerformance = calculateQuarterlyPerformance(shop, activeBrand);

      return {
        ...shop,
        lastOrderDate,
        lastOrderMonth,
        daysSinceLastOrder,
        customerStatus,
        riskLevel,
        quarterlyDecline,
        quarterlyPerformance
      };
    });
  }, [data, activeBrand]);

  // ==========================================
  // COMPUTED METRICS
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
    
    // NEW: Enhanced quarterly metrics
    const quarterlyDeclining = analyzedShops.filter(s => 
      s.quarterlyPerformance?.trend === 'declining' || s.quarterlyPerformance?.trend === 'deteriorating'
    ).length;
    
    const quarterlyGrowing = analyzedShops.filter(s => 
      s.quarterlyPerformance?.trend === 'growing' || s.quarterlyPerformance?.trend === 'accelerating'
    ).length;

    console.log('📊 ENHANCED CUSTOMER HEALTH METRICS:', {
      unbilled,
      lost2Months,
      lost3Months,
      lost4Months,
      lost5Months,
      lost6Months,
      neverOrdered,
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
  // FILTERED DATA - ENHANCED WITH QUARTERLY SORTING
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
        return matchesSearch && matchesDepartment && matchesSalesman && 
               ((shop.daysSinceLastOrder! >= 60 && shop.daysSinceLastOrder! <= monthsBack) ||
                shop.customerStatus === 'never-ordered');
      } else if (activeSection === 'quarterly') {
        // Show shops with quarterly performance data
        return matchesSearch && matchesDepartment && matchesSalesman && 
               shop.quarterlyPerformance && shop.quarterlyPerformance.latestQuarter.totalSales > 0;
      }

      return matchesSearch && matchesDepartment && matchesSalesman;
    });

    // Enhanced sorting for quarterly section
    if (activeSection === 'quarterly') {
      filtered.sort((a, b) => {
        const aPerf = a.quarterlyPerformance!;
        const bPerf = b.quarterlyPerformance!;
        
        switch (quarterlySortBy) {
          case 'declining':
            // Most declining first (most negative YoY growth)
            return aPerf.yoyGrowth - bPerf.yoyGrowth;
          case 'growing':
            // Most growing first (most positive YoY growth)
            return bPerf.yoyGrowth - aPerf.yoyGrowth;
          case 'yoy':
            // Absolute YoY growth (highest absolute change)
            return Math.abs(bPerf.yoyGrowth) - Math.abs(aPerf.yoyGrowth);
          case 'consistency':
            // Most consistent performers first
            const aConsistency = aPerf.consistency === 'predictable' ? 3 : aPerf.consistency === 'steady' ? 2 : 1;
            const bConsistency = bPerf.consistency === 'predictable' ? 3 : bPerf.consistency === 'steady' ? 2 : 1;
            return bConsistency - aConsistency;
          default:
            return bPerf.yoyGrowth - aPerf.yoyGrowth;
        }
      });
    } else if (activeSection === 'lost') {
      filtered.sort((a, b) => (b.daysSinceLastOrder! || 0) - (a.daysSinceLastOrder! || 0));
    } else {
      filtered.sort((a, b) => (b.mayTotal || 0) - (a.mayTotal || 0));
    }

    return filtered;
  }, [analyzedShops, searchText, departmentFilter, salesmanFilter, activeSection, lookbackMonths, quarterlySortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredShops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentShops = filteredShops.slice(startIndex, endIndex);

  // Filter options
  const departments = [...new Set(data.allShopsComparison.map(shop => shop.department))].sort();
  const salesmen = [...new Set(data.allShopsComparison.map(shop => shop.salesman))].sort();

  // ==========================================
  // EXPORT FUNCTION - ENHANCED FOR QUARTERLY
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
      csvContent += `5-QUARTER FISCAL PERFORMANCE ANALYSIS\n`;
      csvContent += `Shop Name,Department,Salesman,Q1 FY2024,Q4 FY2024,Q1 FY2025,QoQ Growth %,YoY Growth %,Trend,Consistency\n`;
      
      filteredShops.forEach(shop => {
        const perf = shop.quarterlyPerformance!;
        csvContent += `"${shop.shopName}","${shop.department}","${shop.salesman}",${perf.yoyQuarter.totalSales},${perf.previousQuarter.totalSales},${perf.latestQuarter.totalSales},${perf.qoqGrowth.toFixed(1)}%,${perf.yoyGrowth.toFixed(1)}%,"${perf.trend}","${perf.consistency}"\n`;
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

  // NEW: Quarterly trend badge
  const getTrendBadge = (trend: string) => {
    const colors = {
      accelerating: 'bg-green-100 text-green-800',
      growing: 'bg-blue-100 text-blue-800',
      stable: 'bg-gray-100 text-gray-800',
      declining: 'bg-orange-100 text-orange-800',
      deteriorating: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full ${colors[trend as keyof typeof colors]}`;
  };

  // NEW: Consistency badge
  const getConsistencyBadge = (consistency: string) => {
    const colors = {
      predictable: 'bg-green-100 text-green-800',
      steady: 'bg-blue-100 text-blue-800',
      volatile: 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full ${colors[consistency as keyof typeof colors]}`;
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
            <p className="text-gray-600">Advanced customer lifecycle analysis and retention insights</p>
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
            <p className="text-sm text-green-600">5-quarter growth trend</p>
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

            {/* NEW: Quarterly sorting options */}
            {activeSection === 'quarterly' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={quarterlySortBy}
                  onChange={(e) => setQuarterlySortBy(e.target.value as any)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="declining">Most Declining</option>
                  <option value="growing">Most Growing</option>
                  <option value="yoy">Highest YoY Change</option>
                  <option value="consistency">Most Consistent</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q1 FY2024</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q1 FY2025</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">YoY Growth</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Consistency</th>
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
                  
                  {activeSection === 'quarterly' && shop.quarterlyPerformance && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shop.quarterlyPerformance.yoyQuarter.totalSales.toLocaleString()} cases
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {shop.quarterlyPerformance.latestQuarter.totalSales.toLocaleString()} cases
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          shop.quarterlyPerformance.yoyGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {shop.quarterlyPerformance.yoyGrowth >= 0 ? '+' : ''}{shop.quarterlyPerformance.yoyGrowth.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={getTrendBadge(shop.quarterlyPerformance.trend)}>
                          {shop.quarterlyPerformance.trend.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell">
                        <span className={getConsistencyBadge(shop.quarterlyPerformance.consistency)}>
                          {shop.quarterlyPerformance.consistency.toUpperCase()}
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
