// ==========================================
// 🔧 CURRENTANALYTICS.TSX - COMPLETE PHANTOM DATA PREVENTION & FUTURE-PROOF
// ==========================================

'use client';

import React, { useState, useMemo } from 'react';
import { Download, UserPlus, AlertTriangle, TrendingDown, Star, Search, Filter, X, ChevronLeft, ChevronRight, RefreshCw, CheckCircle } from 'lucide-react';

// ==========================================
// 🚀 FUTURE-READY HELPER FUNCTIONS (ENHANCED)
// ==========================================

const getMonthName = (monthNum: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

const getShortMonthName = (monthNum: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

// 🚀 ENHANCED: Complete month information with year handling
const getMonthInfo = (monthNum: string, year: string) => {
  const monthInt = parseInt(monthNum);
  const yearInt = parseInt(year);
  return {
    month: monthNum.padStart(2, '0'),
    year: year,
    name: getMonthName(monthNum),
    shortName: getShortMonthName(monthNum),
    key: getMonthKey(monthNum),
    isCurrent: true, // This will be the current month
    displayLabel: `${getShortMonthName(monthNum)} ${year}`
  };
};

// 🚀 ENHANCED: Dynamic previous month calculation with year rollover
const getPreviousMonth = (currentMonth: string, currentYear: string) => {
  const monthNum = parseInt(currentMonth);
  const yearNum = parseInt(currentYear);
  
  if (monthNum === 1) {
    // January -> Previous December of previous year
    return {
      month: '12',
      year: (yearNum - 1).toString(),
      name: 'December',
      shortName: 'Dec',
      key: 'december',
      isCurrent: false,
      displayLabel: `Dec ${yearNum - 1}`
    };
  } else {
    // Any other month -> Previous month same year
    const prevMonth = (monthNum - 1).toString().padStart(2, '0');
    return {
      month: prevMonth,
      year: currentYear,
      name: getMonthName(prevMonth),
      shortName: getShortMonthName(prevMonth),
      key: getMonthKey(prevMonth),
      isCurrent: false,
      displayLabel: `${getShortMonthName(prevMonth)} ${currentYear}`
    };
  }
};

// 🚀 ENHANCED: DYNAMIC ROLLING WINDOW CALCULATION (PHANTOM DATA SAFE)
const getRolling4MonthWindow = (currentMonth: string, currentYear: string) => {
  const monthNum = parseInt(currentMonth);
  const yearNum = parseInt(currentYear);
  const months = [];
  
  // Calculate last 4 months including current (ALWAYS DYNAMIC)
  for (let i = 3; i >= 0; i--) {
    let targetMonth = monthNum - i;
    let targetYear = yearNum;
    
    // Handle year rollover
    while (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    
    const monthStr = targetMonth.toString().padStart(2, '0');
    const yearStr = targetYear.toString();
    
    months.push({
      month: monthStr,
      year: yearStr,
      name: getMonthName(monthStr),
      shortName: getShortMonthName(monthStr),
      key: getMonthKey(monthStr),
      isCurrent: targetMonth === monthNum && targetYear === yearNum,
      displayLabel: `${getShortMonthName(monthStr)} ${yearStr}`
    });
  }
  
  return months;
};

const getMonthKey = (monthNum: string) => {
  const keys = ['january', 'february', 'march', 'april', 'may', 'june',
                'july', 'august', 'september', 'october', 'november', 'december'];
  return keys[parseInt(monthNum) - 1] || 'unknown';
};

// 🚀 ENHANCED: PHANTOM DATA PREVENTION - Proper data source separation
const getShopDataForMonth = (shop: ShopData, monthInfo: any, dataType: 'Total' | 'EightPM' | 'Verve' = 'Total') => {
  try {
    // CRITICAL: Current month data ONLY from challans (shop.total, shop.eightPM, shop.verve)
    if (monthInfo.isCurrent) {
      switch (dataType) {
        case 'Total':
          return shop.total || 0; // Current month challan data
        case 'EightPM':
          return shop.eightPM || 0; // Current month challan data
        case 'Verve':
          return shop.verve || 0; // Current month challan data
        default:
          return shop.total || 0;
      }
    }
    
    // CRITICAL: Historical month data ONLY from historical fields
    const historicalKey = `${monthInfo.key}${dataType}` as keyof ShopData;
    const historicalValue = shop[historicalKey] as number;
    
    return historicalValue || 0; // Historical data from specific month fields
  } catch (error) {
    console.error('Error getting shop data for month:', error, { shop: shop.shopName, monthInfo, dataType });
    return 0; // Safe fallback
  }
};

// 🚀 NEW: Data validation to prevent phantom data
const validateShopData = (shop: ShopData): boolean => {
  if (!shop || !shop.shopName || !shop.shopId) {
    return false;
  }
  
  // Ensure numeric fields are actually numbers
  const numericFields = ['total', 'eightPM', 'verve'];
  for (const field of numericFields) {
    const value = shop[field as keyof ShopData];
    if (value !== undefined && value !== null && (typeof value !== 'number' || isNaN(value))) {
      console.warn(`Invalid numeric value for ${field} in shop ${shop.shopName}:`, value);
    }
  }
  
  return true;
};

// 🚀 ENHANCED: DYNAMIC ROLLING WINDOW LABEL (ALWAYS ACCURATE)
const getRollingWindowLabel = (currentMonth: string, currentYear: string) => {
  const window = getRolling4MonthWindow(currentMonth, currentYear);
  return window.map(m => m.shortName).join('-') + ` ${currentYear}`;
};

// ==========================================
// TYPE DEFINITIONS (ENHANCED WITH VALIDATION)
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
  julyTotal?: number;
  julyEightPM?: number;
  julyVerve?: number;
  augustTotal?: number;
  augustEightPM?: number;
  augustVerve?: number;
  septemberTotal?: number;
  septemberEightPM?: number;
  septemberVerve?: number;
  octoberTotal?: number;
  octoberEightPM?: number;
  octoberVerve?: number;
  novemberTotal?: number;
  novemberEightPM?: number;
  novemberVerve?: number;
  decemberTotal?: number;
  decemberEightPM?: number;
  decemberVerve?: number;
  januaryTotal?: number;
  januaryEightPM?: number;
  januaryVerve?: number;
  februaryTotal?: number;
  februaryEightPM?: number;
  februaryVerve?: number;
  juneLastYearTotal?: number;
  juneLastYearEightPM?: number;
  juneLastYearVerve?: number;
  yoyGrowthPercent?: number;
  growthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
  skuBreakdown?: SKUData[];
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
}

interface FilterState {
  department: string;
  salesman: string;
  shop: string;
  searchText: string;
}

// ==========================================
// ERROR BOUNDARY FOR PHANTOM DATA PROTECTION
// ==========================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AnalyticsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('Analytics Error Caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analytics Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Analytics Error</h3>
          <p className="text-red-600 mb-4">Something went wrong while processing the data.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Analytics
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ==========================================
// MAIN COMPONENT (ENHANCED WITH PHANTOM DATA PREVENTION)
// ==========================================

const CurrentAnalytics = ({ data }: { data: DashboardData }) => {
  // ==========================================
  // DATA VALIDATION & PHANTOM DATA PREVENTION
  // ==========================================
  
  const dataValidation = useMemo(() => {
    if (!data) {
      console.error('❌ CurrentAnalytics: No data provided');
      return { isValid: false, error: 'No data provided' };
    }
    
    if (!data.allShopsComparison || !Array.isArray(data.allShopsComparison)) {
      console.error('❌ CurrentAnalytics: Invalid shop comparison data');
      return { isValid: false, error: 'Invalid shop comparison data' };
    }
    
    if (!data.currentMonth || !data.currentYear) {
      console.error('❌ CurrentAnalytics: Missing current month/year data');
      return { isValid: false, error: 'Missing current month/year data' };
    }
    
    // Validate individual shop data
    const invalidShops = data.allShopsComparison.filter(shop => !validateShopData(shop));
    if (invalidShops.length > 0) {
      console.warn('⚠️ CurrentAnalytics: Found invalid shop data:', invalidShops.length, 'shops');
    }
    
    console.log('✅ CurrentAnalytics: Data validation passed', {
      totalShops: data.allShopsComparison.length,
      currentMonth: data.currentMonth,
      currentYear: data.currentYear,
      invalidShops: invalidShops.length
    });
    
    return { isValid: true, error: null };
  }, [data]);

  // ==========================================
  // INTERNAL STATE MANAGEMENT
  // ==========================================
  
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

  // ==========================================
  // 🚀 ENHANCED: FUTURE-READY ROLLING WINDOW DATA (PHANTOM DATA SAFE)
  // ==========================================
  
  const monthCalculations = useMemo(() => {
    if (!dataValidation.isValid) return null;
    
    const currentMonthInfo = getMonthInfo(data.currentMonth, data.currentYear);
    const previousMonthInfo = getPreviousMonth(data.currentMonth, data.currentYear);
    const rollingWindow = getRolling4MonthWindow(data.currentMonth, data.currentYear);
    const rollingWindowLabel = getRollingWindowLabel(data.currentMonth, data.currentYear);
    
    console.log('🔧 PHANTOM DATA SAFE: Month calculations', {
      currentMonth: currentMonthInfo,
      previousMonth: previousMonthInfo,
      rollingWindow: rollingWindow.map(m => m.displayLabel),
      rollingWindowLabel
    });
    
    return {
      current: currentMonthInfo,
      previous: previousMonthInfo,
      rollingWindow,
      rollingWindowLabel
    };
  }, [data.currentMonth, data.currentYear, dataValidation.isValid]);

  // ==========================================
  // INTERNAL UTILITY FUNCTIONS (ENHANCED WITH VALIDATION)
  // ==========================================

  const getFilteredShops = useMemo(() => {
    return (shops: ShopData[]): ShopData[] => {
      try {
        return shops.filter(shop => {
          if (!validateShopData(shop)) return false;
          
          const matchesDepartment = !filters.department || shop.department === filters.department;
          const matchesSalesman = !filters.salesman || shop.salesman === filters.salesman;
          const matchesShop = !filters.shop || shop.shopName.toLowerCase().includes(filters.shop.toLowerCase());
          const matchesSearch = !filters.searchText || 
            shop.shopName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
            shop.department.toLowerCase().includes(filters.searchText.toLowerCase()) ||
            shop.salesman.toLowerCase().includes(filters.searchText.toLowerCase());
          
          return matchesDepartment && matchesSalesman && matchesShop && matchesSearch;
        });
      } catch (error) {
        console.error('Error filtering shops:', error);
        return [];
      }
    };
  }, [filters]);

  const filteredShops = useMemo(() => {
    if (!dataValidation.isValid || !data.allShopsComparison) return [];
    return getFilteredShops(data.allShopsComparison);
  }, [data.allShopsComparison, getFilteredShops, dataValidation.isValid]);

  const totalPages = Math.ceil(filteredShops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentShops = filteredShops.slice(startIndex, endIndex);

  const departments = useMemo(() => {
    if (!dataValidation.isValid || !data.allShopsComparison) return [];
    return [...new Set(data.allShopsComparison.map(shop => shop.department))].filter(Boolean).sort();
  }, [data.allShopsComparison, dataValidation.isValid]);

  const salesmen = useMemo(() => {
    if (!dataValidation.isValid || !data.allShopsComparison) return [];
    return [...new Set(data.allShopsComparison.map(shop => shop.salesman))].filter(Boolean).sort();
  }, [data.allShopsComparison, dataValidation.isValid]);

  // ==========================================
  // 🔧 ENHANCED: EXPORT FUNCTION WITH DYNAMIC LABELS (PHANTOM DATA SAFE)
  // ==========================================

  const exportToExcel = async () => {
    try {
      if (!monthCalculations) {
        throw new Error('Month calculations not available');
      }
      
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `Radico Enhanced Shop Analysis Report - PHANTOM DATA SAFE - ${new Date().toLocaleDateString()}\n`;
      csvContent += `Report Period: ${monthCalculations.rollingWindowLabel}\n`;
      csvContent += `Current Month: ${monthCalculations.current.displayLabel}\n`;
      csvContent += `Previous Month: ${monthCalculations.previous.displayLabel}\n`;
      csvContent += `Data Source: Clean separation of current vs historical data\n`;
      
      if (filters.department || filters.salesman || filters.searchText) {
        csvContent += "APPLIED FILTERS: ";
        if (filters.department) csvContent += `Department: ${filters.department}, `;
        if (filters.salesman) csvContent += `Salesman: ${filters.salesman}, `;
        if (filters.searchText) csvContent += `Search: ${filters.searchText}`;
        csvContent += "\n";
      }
      csvContent += "\n";
      
      csvContent += "EXECUTIVE SUMMARY\n";
      csvContent += "Total Shops," + data.allShopsComparison.length + "\n";
      csvContent += "Filtered Shops," + filteredShops.length + "\n";
      csvContent += "First-time Customers," + data.customerInsights.firstTimeCustomers + "\n";
      csvContent += "Lost Customers," + data.customerInsights.lostCustomers + "\n";
      csvContent += "Consistent Performers," + data.customerInsights.consistentPerformers + "\n";
      csvContent += "Declining Performers," + data.customerInsights.decliningPerformers + "\n\n";
      
      // 🔧 ENHANCED: Dynamic column headers (PHANTOM DATA SAFE)
      csvContent += `ROLLING WINDOW SHOP COMPARISON (${monthCalculations.rollingWindowLabel})\n`;
      const headers = ['Shop Name', 'Department', 'Salesman'];
      monthCalculations.rollingWindow.forEach(month => {
        headers.push(`${month.shortName} ${month.year} Cases`);
      });
      headers.push('8PM Cases', 'VERVE Cases', 'Growth %', 'YoY Growth %', 'Monthly Trend');
      csvContent += headers.join(',') + '\n';
      
      filteredShops.forEach(shop => {
        try {
          const row = [
            `"${shop.shopName}"`,
            `"${shop.department}"`,
            `"${shop.salesman}"`
          ];
          
          // 🔧 ENHANCED: Dynamic month data extraction (PHANTOM DATA SAFE)
          monthCalculations.rollingWindow.forEach(month => {
            const monthData = getShopDataForMonth(shop, month, 'Total');
            row.push(monthData.toString());
          });
          
          row.push(
            (shop.eightPM || 0).toString(),
            (shop.verve || 0).toString(),
            `${shop.growthPercent?.toFixed(1) || 0}%`,
            `${shop.yoyGrowthPercent?.toFixed(1) || 0}%`,
            `"${shop.monthlyTrend || 'stable'}"`
          );
          
          csvContent += row.join(',') + '\n';
        } catch (error) {
          console.error('Error processing shop for export:', shop.shopName, error);
        }
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Radico_PHANTOM_DATA_SAFE_Analysis_${getShortMonthName(data.currentMonth)}_${data.currentYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  // ==========================================
  // 🔧 ENHANCED: SKU MODAL COMPONENT (PHANTOM DATA SAFE)
  // ==========================================

  const EnhancedSKUModal = ({ shop, onClose }: { shop: ShopData, onClose: () => void }) => {
    const [activeMonth, setActiveMonth] = useState(monthCalculations?.current.shortName || 'Jul');
    
    if (!monthCalculations) return null;
    
    const getSKUDataForMonth = (month: string) => {
      // Only show SKU data for current month (from challans)
      if (month === monthCalculations.current.shortName) {
        return shop.skuBreakdown || [];
      }
      return []; // No SKU breakdown for historical months to prevent phantom data
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

          {/* 🔧 ENHANCED: Dynamic month tabs (PHANTOM DATA SAFE) */}
          <div className="flex border-b">
            {monthCalculations.rollingWindow.map((month) => (
              <button
                key={`${month.month}-${month.year}`}
                onClick={() => setActiveMonth(month.shortName)}
                className={`px-6 py-3 font-medium ${
                  activeMonth === month.shortName
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {month.displayLabel}
              </button>
            ))}
          </div>

          <div className="p-6 overflow-y-auto">
            {/* 🔧 ENHANCED: Dynamic month data display (PHANTOM DATA SAFE) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {(() => {
                    const selectedMonth = monthCalculations.rollingWindow.find(m => m.shortName === activeMonth);
                    if (selectedMonth) {
                      return getShopDataForMonth(shop, selectedMonth, 'Total');
                    }
                    return shop.total || 0;
                  })()}
                </div>
                <div className="text-sm text-gray-500">Total Cases</div>
              </div>
              <div className="text-center bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {(() => {
                    const selectedMonth = monthCalculations.rollingWindow.find(m => m.shortName === activeMonth);
                    if (selectedMonth) {
                      return getShopDataForMonth(shop, selectedMonth, 'EightPM');
                    }
                    return shop.eightPM || 0;
                  })()}
                </div>
                <div className="text-sm text-gray-500">8PM Cases</div>
              </div>
              <div className="text-center bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {(() => {
                    const selectedMonth = monthCalculations.rollingWindow.find(m => m.shortName === activeMonth);
                    if (selectedMonth) {
                      return getShopDataForMonth(shop, selectedMonth, 'Verve');
                    }
                    return shop.verve || 0;
                  })()}
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
                  {getSKUDataForMonth(activeMonth).length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-sm text-gray-500 text-center">
                        {activeMonth === monthCalculations.current.shortName 
                          ? 'No SKU breakdown available for current month' 
                          : 'Historical SKU data not available (prevents phantom data)'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // INTERNAL HANDLERS
  // ==========================================

  const handleShowSKU = (shop: ShopData) => {
    setSelectedShopSKU(shop);
    setShowSKUModal(true);
  };

  const handleCloseSKUModal = () => {
    setShowSKUModal(false);
    setSelectedShopSKU(null);
  };

  // ==========================================
  // RENDER WITH PHANTOM DATA PROTECTION
  // ==========================================

  // Show error state if data validation failed
  if (!dataValidation.isValid || !monthCalculations) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Data Validation Error</h3>
        <p className="text-red-600 mb-4">{dataValidation.error || 'Invalid data detected'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <AnalyticsErrorBoundary>
      <div className="space-y-6">
        {/* 🔧 ENHANCED: Phantom Data Prevention Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-green-800">Phantom Data Prevention Active</h4>
              <p className="text-sm text-green-600">
                Current month ({monthCalculations.current.displayLabel}) uses challan data only. 
                Historical months use separate historical fields. No data contamination possible.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards (ENHANCED WITH VALIDATION) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{data.customerInsights?.firstTimeCustomers || 0}</div>
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
                <div className="text-2xl font-bold text-gray-900">{data.customerInsights?.lostCustomers || 0}</div>
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
                <div className="text-2xl font-bold text-gray-900">{data.customerInsights?.consistentPerformers || 0}</div>
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
                <div className="text-2xl font-bold text-gray-900">{data.customerInsights?.decliningPerformers || 0}</div>
                <div className="text-sm text-gray-500">Declining Performers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters (ENHANCED) */}
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

            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>

            <div className="text-sm text-gray-500">
              Showing {filteredShops.length} of {data.allShopsComparison.length} shops
            </div>
          </div>
        </div>

        {/* 🔧 ENHANCED: Main Data Table with Dynamic Headers (PHANTOM DATA SAFE) */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Complete Shop Analysis - Rolling 4-Month Comparison ({monthCalculations.rollingWindowLabel})
            </h3>
            <p className="text-sm text-gray-500">
              {filteredShops.length} shops {filters.department || filters.salesman || filters.searchText ? '(filtered)' : ''} 
              ranked by current month performance with phantom data prevention
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
                  {/* 🔧 ENHANCED: Dynamic month headers (PHANTOM DATA SAFE) */}
                  {monthCalculations.rollingWindow.map(month => (
                    <th key={`${month.month}-${month.year}`} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {month.shortName} {month.year} Cases
                    </th>
                  ))}
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
                    {/* 🔧 ENHANCED: Dynamic month data columns (PHANTOM DATA SAFE) */}
                    {monthCalculations.rollingWindow.map(month => (
                      <td key={`${month.month}-${month.year}`} className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getShopDataForMonth(shop, month, 'Total')?.toLocaleString() || 0}
                      </td>
                    ))}
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
                      {(shop.eightPM || 0).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                      {(shop.verve || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

        {/* 🔧 ENHANCED: Customer Insights Sections (PHANTOM DATA SAFE) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center">
              <UserPlus className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                First-time Billing Shops ({data.customerInsights?.firstTimeCustomers || 0})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {monthCalculations.current.displayLabel} Cases
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(data.customerInsights?.newShops || []).slice(0, 10).map((shop) => (
                    <tr key={shop.shopId}>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.shopName}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.salesman}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {/* 🔧 ENHANCED: Use current month data only (PHANTOM DATA SAFE) */}
                        {getShopDataForMonth(shop, monthCalculations.current, 'Total')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Lost Customers ({data.customerInsights?.lostCustomers || 0})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {/* 🔧 ENHANCED: Dynamic previous month reference (PHANTOM DATA SAFE) */}
                      {monthCalculations.previous.displayLabel} Cases
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(data.customerInsights?.lostShops || []).slice(0, 10).map((shop) => (
                    <tr key={shop.shopId}>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.shopName}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{shop.department}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{shop.salesman}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        {/* 🔧 ENHANCED: Use previous month data only (PHANTOM DATA SAFE) */}
                        {getShopDataForMonth(shop, monthCalculations.previous, 'Total')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SKU MODAL (ENHANCED) */}
        {showSKUModal && selectedShopSKU && monthCalculations && (
          <EnhancedSKUModal 
            shop={selectedShopSKU} 
            onClose={handleCloseSKUModal} 
          />
        )}
      </div>
    </AnalyticsErrorBoundary>
  );
};

export default CurrentAnalytics;
