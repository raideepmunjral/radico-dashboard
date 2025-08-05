'use client';

import React, { useState, useMemo } from 'react';
import { X, AlertTriangle } from 'lucide-react';

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
  growthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
}

interface DashboardData {
  salesData: Record<string, ShopData>;
  salespersonStats: Record<string, any>;
  currentMonth: string;
  currentYear: string;
  allShopsComparison: ShopData[]; // Legacy - now unused
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const getMonthName = (monthNum: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
};

// ==========================================
// ROLLING 5-MONTH WINDOW UTILITY
// ==========================================

const getRolling5MonthWindow = (currentMonth: string) => {
  const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthAbbrev = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const currentMonthIndex = parseInt(currentMonth) - 1; // Convert to 0-based index
  const rolling5Months = [];
  
  // Get the last 5 months including current month
  for (let i = 4; i >= 0; i--) {
    let targetMonthIndex = currentMonthIndex - i;
    if (targetMonthIndex < 0) targetMonthIndex += 12; // Handle year wraparound
    
    rolling5Months.push({
      key: monthKeys[targetMonthIndex],
      name: monthNames[targetMonthIndex],
      abbrev: monthAbbrev[targetMonthIndex],
      index: targetMonthIndex + 1 // Convert back to 1-based for display
    });
  }
  
  return rolling5Months;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const SalesmanPerformanceTab = ({ data }: { data: DashboardData }) => {
  // INTERNAL STATE for breakdown modal
  const [showSalesmanBreakdown, setShowSalesmanBreakdown] = useState(false);
  const [selectedSalesmanBreakdown, setSelectedSalesmanBreakdown] = useState<{
    salesmanName: string;
    month: string;
    monthName: string;
    total: number;
    eightPM: number;
    verve: number;
  } | null>(null);

  // NEW STATE for customer penetration modal
  const [showPenetrationBreakdown, setShowPenetrationBreakdown] = useState(false);
  const [selectedPenetrationBreakdown, setSelectedPenetrationBreakdown] = useState<{
    salesmanName: string;
    totalShops: number;
    billedShops: number;
    shops: any[];
  } | null>(null);

  // NEW STATE for shop list modal
  const [showShopList, setShowShopList] = useState(false);
  const [selectedShopList, setSelectedShopList] = useState<{
    title: string;
    subtitle: string;
    shops: any[];
    type: '8pm' | 'verve' | 'both' | '8pm-only' | 'verve-only' | 'zero-sales';
  } | null>(null);

  // Get the rolling 5-month window
  const rolling5Months = useMemo(() => {
    return getRolling5MonthWindow(data.currentMonth);
  }, [data.currentMonth]);

  // INTERNAL FUNCTION to handle case breakdown click
  const handleCaseBreakdownClick = (salesmanName: string, month: string, monthName: string, total: number, eightPM: number, verve: number) => {
    setSelectedSalesmanBreakdown({
      salesmanName,
      month,
      monthName,
      total,
      eightPM,
      verve
    });
    setShowSalesmanBreakdown(true);
  };

  // NEW FUNCTION to handle customer penetration breakdown click
  const handlePenetrationBreakdownClick = (salesmanName: string, totalShops: number, billedShops: number, shops: any[]) => {
    setSelectedPenetrationBreakdown({
      salesmanName,
      totalShops,
      billedShops,
      shops
    });
    setShowPenetrationBreakdown(true);
  };

  // NEW FUNCTION to handle shop list click
  const handleShopListClick = (title: string, subtitle: string, shops: any[], type: '8pm' | 'verve' | 'both' | '8pm-only' | 'verve-only' | 'zero-sales') => {
    setSelectedShopList({
      title,
      subtitle,
      shops,
      type
    });
    setShowShopList(true);
  };

  // ==========================================
  // MOBILE CARD COMPONENT
  // ==========================================

  const MobileSalesmanCard = ({ salesman, index }: { salesman: any, index: number }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <span className="text-lg font-bold text-gray-900 mr-2">#{index + 1}</span>
            {index < 3 && (
              <span>
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
              </span>
            )}
          </div>
          <h3 className="font-medium text-gray-900 text-base">{salesman.name}</h3>
          <button
            onClick={() => handlePenetrationBreakdownClick(salesman.name, salesman.totalShops, salesman.billedShops, salesman.shops)}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
          >
            {salesman.billedShops}/{salesman.totalShops} shops
          </button>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">{salesman.totalSales.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Total Cases</div>
        </div>
      </div>
      
      {/* Current Month Performance */}
      <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-blue-50 rounded-lg">
        <div className="text-center">
          <div className="text-sm font-bold text-purple-600">{salesman.total8PM.toLocaleString()}</div>
          <div className="text-xs text-gray-500">8PM Cases</div>
          <div className="text-xs text-gray-400">Target: {salesman.target8PM.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-orange-600">{salesman.totalVERVE.toLocaleString()}</div>
          <div className="text-xs text-gray-500">VERVE Cases</div>
          <div className="text-xs text-gray-400">Target: {salesman.targetVERVE.toLocaleString()}</div>
        </div>
      </div>

      {/* Achievements */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className={`text-sm font-medium ${
            salesman.coverage >= 80 ? 'text-green-600' :
            salesman.coverage >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {salesman.coverage.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">Coverage</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded">
          <div className={`text-sm font-medium ${
            salesman.achievement8PM >= 100 ? 'text-green-600' :
            salesman.achievement8PM >= 80 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {salesman.target8PM > 0 ? `${salesman.achievement8PM.toFixed(0)}%` : 'N/A'}
          </div>
          <div className="text-xs text-gray-500">8PM Achievement</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded">
          <div className={`text-sm font-medium ${
            salesman.achievementVERVE >= 100 ? 'text-green-600' :
            salesman.achievementVERVE >= 80 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {salesman.targetVERVE > 0 ? `${salesman.achievementVERVE.toFixed(0)}%` : 'N/A'}
          </div>
          <div className="text-xs text-gray-500">VERVE Achievement</div>
        </div>
      </div>

      {/* Historical Trend - Rolling 5 Months */}
      <div className="grid grid-cols-5 gap-1 mb-3">
        {rolling5Months.map((month, index) => {
          const totalField = `${month.key}Total`;
          const eightPMField = `${month.key}EightPM`;
          const verveField = `${month.key}Verve`;
          
          // For current month, use live data
          let total, eightPM, verve;
          if (month.index.toString().padStart(2, '0') === data.currentMonth) {
            total = (Number(salesman.total8PM) || 0) + (Number(salesman.totalVERVE) || 0);
            eightPM = Number(salesman.total8PM) || 0;
            verve = Number(salesman.totalVERVE) || 0;
          } else {
            total = Number(salesman[totalField]) || 0;
            eightPM = Number(salesman[eightPMField]) || 0;
            verve = Number(salesman[verveField]) || 0;
          }
          
          const colors = [
            'bg-blue-100 hover:bg-blue-200', 
            'bg-green-100 hover:bg-green-200', 
            'bg-yellow-100 hover:bg-yellow-200', 
            'bg-purple-100 hover:bg-purple-200',
            'bg-red-100 hover:bg-red-200'
          ];
          
          return (
            <button
              key={month.key}
              onClick={() => handleCaseBreakdownClick(salesman.name, month.key, month.name, total, eightPM, verve)}
              className={`text-center p-2 ${colors[index]} rounded transition-colors`}
            >
              <div className="text-sm font-medium text-gray-900">{total.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{month.abbrev}</div>
            </button>
          );
        })}
      </div>

      {/* 5-Month Average */}
      <div className="grid grid-cols-2 gap-3 mt-3 mb-3">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-sm font-bold text-blue-600">
            {(() => {
              // Calculate 5-month average
              const monthTotals = rolling5Months.map(month => {
                const totalField = `${month.key}Total`;
                if (month.index.toString().padStart(2, '0') === data.currentMonth) {
                  return (Number(salesman.total8PM) || 0) + (Number(salesman.totalVERVE) || 0);
                }
                return Number(salesman[totalField]) || 0;
              });
              const avg = monthTotals.reduce((sum, total) => sum + total, 0) / 5;
              return Math.round(avg).toLocaleString();
            })()}
          </div>
          <div className="text-xs text-gray-500">5M Avg</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-sm font-bold text-gray-600">
            {rolling5Months.map(m => m.abbrev).join('-')}
          </div>
          <div className="text-xs text-gray-500">Window</div>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="flex justify-center">
        {(() => {
          // Calculate trend using rolling 5-month data
          const monthTotals = rolling5Months.map(month => {
            const totalField = `${month.key}Total`;
            if (month.index.toString().padStart(2, '0') === data.currentMonth) {
              return (Number(salesman.total8PM) || 0) + (Number(salesman.totalVERVE) || 0);
            }
            return Number(salesman[totalField]) || 0;
          });
          
          // Compare recent 3 months vs earlier 2 months
          const recent3Avg = (monthTotals[2] + monthTotals[3] + monthTotals[4]) / 3;
          const earlier2Avg = (monthTotals[0] + monthTotals[1]) / 2;
          const trend = recent3Avg > earlier2Avg * 1.1 ? 'improving' :
                      recent3Avg < earlier2Avg * 0.9 ? 'declining' : 'stable';
          
          return (
            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
              trend === 'improving' ? 'bg-green-100 text-green-800' :
              trend === 'declining' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {trend === 'improving' ? '📈 Growing' : trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
            </span>
          );
        })()}
      </div>
    </div>
  );

  // INTERNAL COMPONENT: Salesman Breakdown Modal
  const SalesmanBreakdownModal = ({ onClose }: { onClose: () => void }) => {
    if (!selectedSalesmanBreakdown) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b">
            <h3 className="text-lg font-semibold">
              {selectedSalesmanBreakdown.salesmanName} - {selectedSalesmanBreakdown.monthName} 2025 Breakdown
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
              <div className="text-center bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {selectedSalesmanBreakdown.total.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Cases</div>
                <div className="text-xs text-gray-400">{selectedSalesmanBreakdown.monthName} 2025</div>
              </div>
              <div className="text-center bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                  {selectedSalesmanBreakdown.eightPM.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">8PM Cases</div>
                <div className="text-xs text-gray-400">
                  {selectedSalesmanBreakdown.total > 0 ? 
                    `${((selectedSalesmanBreakdown.eightPM / selectedSalesmanBreakdown.total) * 100).toFixed(1)}%` : '0%'} of total
                </div>
              </div>
              <div className="text-center bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                  {selectedSalesmanBreakdown.verve.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">VERVE Cases</div>
                <div className="text-xs text-gray-400">
                  {selectedSalesmanBreakdown.total > 0 ? 
                    `${((selectedSalesmanBreakdown.verve / selectedSalesmanBreakdown.total) * 100).toFixed(1)}%` : '0%'} of total
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Brand Performance Distribution</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>8PM Family</span>
                    <span>{selectedSalesmanBreakdown.total > 0 ? 
                      `${((selectedSalesmanBreakdown.eightPM / selectedSalesmanBreakdown.total) * 100).toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-purple-600 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${selectedSalesmanBreakdown.total > 0 ? (selectedSalesmanBreakdown.eightPM / selectedSalesmanBreakdown.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>VERVE Family</span>
                    <span>{selectedSalesmanBreakdown.total > 0 ? 
                      `${((selectedSalesmanBreakdown.verve / selectedSalesmanBreakdown.total) * 100).toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-orange-600 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${selectedSalesmanBreakdown.total > 0 ? (selectedSalesmanBreakdown.verve / selectedSalesmanBreakdown.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // NEW COMPONENT: Shop List Modal
  const ShopListModal = ({ onClose }: { onClose: () => void }) => {
    if (!selectedShopList) return null;

    const { title, subtitle, shops, type } = selectedShopList;

    const getTypeStyles = (type: string) => {
      switch(type) {
        case '8pm': return {
          bg: 'bg-purple-50',
          text: 'text-purple-600',
          border: 'border-purple-200'
        };
        case 'verve': return {
          bg: 'bg-orange-50',
          text: 'text-orange-600',
          border: 'border-orange-200'
        };
        case 'both': return {
          bg: 'bg-green-50',
          text: 'text-green-600',
          border: 'border-green-200'
        };
        case '8pm-only': return {
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-200'
        };
        case 'verve-only': return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-600',
          border: 'border-yellow-200'
        };
        case 'zero-sales': return {
          bg: 'bg-red-50',
          text: 'text-red-600',
          border: 'border-red-200'
        };
        default: return {
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200'
        };
      }
    };

    const typeStyles = getTypeStyles(type);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b flex-shrink-0">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {shops.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No shops found in this category.</p>
              </div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className={`${typeStyles.bg} p-4 rounded-lg text-center border ${typeStyles.border}`}>
                    <div className={`text-2xl font-bold ${typeStyles.text}`}>{shops.length}</div>
                    <div className="text-sm text-gray-600">Total Shops</div>
                  </div>
                  <div className={`${typeStyles.bg} p-4 rounded-lg text-center border ${typeStyles.border}`}>
                    <div className={`text-2xl font-bold ${typeStyles.text}`}>
                      {shops.reduce((sum, shop) => sum + (shop.total || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Cases</div>
                  </div>
                  <div className={`${typeStyles.bg} p-4 rounded-lg text-center border ${typeStyles.border}`}>
                    <div className={`text-2xl font-bold ${typeStyles.text}`}>
                      {shops.length > 0 ? Math.round(shops.reduce((sum, shop) => sum + (shop.total || 0), 0) / shops.length) : 0}
                    </div>
                    <div className="text-sm text-gray-600">Avg Cases/Shop</div>
                  </div>
                </div>

                {/* Shop List Table - Fixed Scrolling */}
                <div className="border border-gray-200 rounded-lg">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cases</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">8PM Cases</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VERVE Cases</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {shops
                          .sort((a, b) => (b.total || 0) - (a.total || 0)) // Sort by total cases descending
                          .map((shop, index) => (
                          <tr key={shop.shopId} className={index === 0 && shop.total > 0 ? 'bg-yellow-50' : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {index + 1}
                              {index === 0 && shop.total > 0 && <span className="ml-1">🏆</span>}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {shop.shopName || 'Unknown Shop'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {shop.department || 'Unknown'}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">
                              {(shop.total || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-purple-600">
                              {(shop.eightPM || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-orange-600">
                              {(shop.verve || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {(shop.eightPM || 0) > 0 && (shop.verve || 0) > 0 ? (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Both</span>
                              ) : (shop.eightPM || 0) > 0 ? (
                                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">8PM</span>
                              ) : (shop.verve || 0) > 0 ? (
                                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">VERVE</span>
                              ) : (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">No Sales</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Insights for specific types */}
                {type === 'both' && (
                  <div className="mt-6 bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">🎉 Cross-Selling Champions!</h4>
                    <p className="text-sm text-green-700">
                      These shops buy both 8PM and VERVE. They're your most valuable customers - 
                      focus on maintaining their loyalty and understanding what makes them successful.
                    </p>
                  </div>
                )}

                {type === '8pm-only' && (
                  <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">🎯 VERVE Upselling Opportunity</h4>
                    <p className="text-sm text-blue-700">
                      These shops already trust you with 8PM sales. They're prime candidates for VERVE introduction.
                      Consider offering VERVE samples or promotions to these loyal customers.
                    </p>
                  </div>
                )}

                {type === 'verve-only' && (
                  <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">🎯 8PM Upselling Opportunity</h4>
                    <p className="text-sm text-yellow-700">
                      These shops already buy VERVE. Introduce them to 8PM premium offerings.
                      They might be interested in expanding their whisky selection.
                    </p>
                  </div>
                )}

                {type === 'zero-sales' && (
                  <div className="mt-6 bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">⚠️ Urgent Follow-Up Required</h4>
                    <p className="text-sm text-red-700">
                      These shops are assigned but have zero sales. Priority actions: Visit, understand barriers, 
                      check competition, verify shop details, and develop recovery plan.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t p-4 sm:p-6 flex justify-end space-x-3 flex-shrink-0">
            <button
              onClick={() => {
                // Future: Export functionality
                const csvContent = shops.map(shop => 
                  `${shop.shopName},${shop.department},${shop.total},${shop.eightPM || 0},${shop.verve || 0}`
                ).join('\n');
                const header = 'Shop Name,Department,Total Cases,8PM Cases,VERVE Cases\n';
                const blob = new Blob([header + csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CustomerPenetrationModal = ({ onClose }: { onClose: () => void }) => {
    if (!selectedPenetrationBreakdown) return null;

    const { salesmanName, totalShops, billedShops, shops } = selectedPenetrationBreakdown;
    
    // Calculate penetration metrics
    const shopsWithSales = shops.filter(shop => shop.total > 0);
    const shops8PM = shopsWithSales.filter(shop => (shop.eightPM || 0) > 0);
    const shopsVERVE = shopsWithSales.filter(shop => (shop.verve || 0) > 0);
    const shopsBoth = shopsWithSales.filter(shop => (shop.eightPM || 0) > 0 && (shop.verve || 0) > 0);
    const shops8PMOnly = shopsWithSales.filter(shop => (shop.eightPM || 0) > 0 && (shop.verve || 0) === 0);
    const shopsVERVEOnly = shopsWithSales.filter(shop => (shop.verve || 0) > 0 && (shop.eightPM || 0) === 0);
    const shopsZeroSales = shops.filter(shop => shop.total === 0);
    
    const total8PMCases = shops8PM.reduce((sum, shop) => sum + (shop.eightPM || 0), 0);
    const totalVERVECases = shopsVERVE.reduce((sum, shop) => sum + (shop.verve || 0), 0);
    
    const penetration8PM = billedShops > 0 ? (shops8PM.length / billedShops * 100) : 0;
    const penetrationVERVE = billedShops > 0 ? (shopsVERVE.length / billedShops * 100) : 0;
    const crossSellRate = billedShops > 0 ? (shopsBoth.length / billedShops * 100) : 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b">
            <h3 className="text-lg font-semibold">
              🏪 {salesmanName} - Customer Penetration ({billedShops} Billed Shops)
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto">
            {/* Brand Penetration by Customer Count */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">📊 BRAND PENETRATION BY CUSTOMER COUNT</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{shops8PM.length}/{billedShops}</div>
                  <div className="text-sm text-gray-600">8PM BUYERS</div>
                  <div className="text-xs text-gray-500">{penetration8PM.toFixed(1)}% shops</div>
                  <button
                    onClick={() => handleShopListClick(
                      `${salesmanName} - 8PM Buyers`,
                      `${shops8PM.length} shops purchased 8PM products`,
                      shops8PM,
                      '8pm'
                    )}
                    className="text-xs text-purple-600 hover:text-purple-800 hover:underline cursor-pointer font-medium"
                  >
                    📦 {total8PMCases.toLocaleString()} cases
                  </button>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{shopsVERVE.length}/{billedShops}</div>
                  <div className="text-sm text-gray-600">VERVE BUYERS</div>
                  <div className="text-xs text-gray-500">{penetrationVERVE.toFixed(1)}% shops</div>
                  <button
                    onClick={() => handleShopListClick(
                      `${salesmanName} - VERVE Buyers`,
                      `${shopsVERVE.length} shops purchased VERVE products`,
                      shopsVERVE,
                      'verve'
                    )}
                    className="text-xs text-orange-600 hover:text-orange-800 hover:underline cursor-pointer font-medium"
                  >
                    📦 {totalVERVECases.toLocaleString()} cases
                  </button>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{shopsBoth.length}/{billedShops}</div>
                  <div className="text-sm text-gray-600">BOTH BRANDS</div>
                  <div className="text-xs text-gray-500">{crossSellRate.toFixed(1)}% shops</div>
                  <div className="text-xs text-green-600">💰 Best buyers</div>
                </div>
              </div>
            </div>

            {/* Customer Behavior Analysis */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">🎯 CUSTOMER BEHAVIOR ANALYSIS</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <button
                    onClick={() => handleShopListClick(
                      `${salesmanName} - 8PM Only Customers`,
                      `${shops8PMOnly.length} shops buy only 8PM (VERVE upselling opportunity)`,
                      shops8PMOnly,
                      '8pm-only'
                    )}
                    className="text-xl font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    {shops8PMOnly.length}
                  </button>
                  <div className="text-sm text-gray-600">8PM ONLY</div>
                  <div className="text-xs text-gray-500">{billedShops > 0 ? (shops8PMOnly.length / billedShops * 100).toFixed(1) : 0}%</div>
                  <div className="text-xs text-blue-600">🎯 Upsell VERVE</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <button
                    onClick={() => handleShopListClick(
                      `${salesmanName} - VERVE Only Customers`,
                      `${shopsVERVEOnly.length} shops buy only VERVE (8PM upselling opportunity)`,
                      shopsVERVEOnly,
                      'verve-only'
                    )}
                    className="text-xl font-bold text-yellow-600 hover:text-yellow-800 hover:underline cursor-pointer"
                  >
                    {shopsVERVEOnly.length}
                  </button>
                  <div className="text-sm text-gray-600">VERVE ONLY</div>
                  <div className="text-xs text-gray-500">{billedShops > 0 ? (shopsVERVEOnly.length / billedShops * 100).toFixed(1) : 0}%</div>
                  <div className="text-xs text-yellow-600">🎯 Upsell 8PM</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <button
                    onClick={() => handleShopListClick(
                      `${salesmanName} - Cross-Selling Champions`,
                      `${shopsBoth.length} shops buy both 8PM and VERVE (your best customers!)`,
                      shopsBoth,
                      'both'
                    )}
                    className="text-xl font-bold text-green-600 hover:text-green-800 hover:underline cursor-pointer"
                  >
                    {shopsBoth.length}
                  </button>
                  <div className="text-sm text-gray-600">CROSS-SELL SUCCESS</div>
                  <div className="text-xs text-gray-500">{crossSellRate.toFixed(1)}% rate</div>
                  <div className="text-xs text-green-600">🎉 Both brands</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <button
                    onClick={() => handleShopListClick(
                      `${salesmanName} - Zero Sales Shops`,
                      `${shopsZeroSales.length} shops assigned but no sales (urgent follow-up needed)`,
                      shopsZeroSales,
                      'zero-sales'
                    )}
                    className="text-xl font-bold text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                  >
                    {shopsZeroSales.length}
                  </button>
                  <div className="text-sm text-gray-600">ZERO SALES</div>
                  <div className="text-xs text-gray-500">{totalShops > 0 ? (shopsZeroSales.length / totalShops * 100).toFixed(1) : 0}% of assigned</div>
                  <div className="text-xs text-red-600">⚠️ Urgent follow-up</div>
                </div>
              </div>
            </div>

            {/* Actionable Insights */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">📈 ACTIONABLE INSIGHTS</h4>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center text-sm">
                  <span className="mr-2">🎉</span>
                  <span><strong>{shopsBoth.length} shops</strong> buy both brands = <strong>{crossSellRate.toFixed(1)}%</strong> cross-sell rate</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="mr-2">📈</span>
                  <span><strong>{shops8PMOnly.length} shops</strong> only buy 8PM = VERVE opportunity</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="mr-2">📈</span>
                  <span><strong>{shopsVERVEOnly.length} shops</strong> only buy VERVE = 8PM opportunity</span>
                </div>
                {shopsZeroSales.length > 0 && (
                  <div className="flex items-center text-sm">
                    <span className="mr-2">⚠️</span>
                    <span><strong>{shopsZeroSales.length} shops</strong> assigned but no sales = urgent follow-up needed</span>
                  </div>
                )}
                {shopsBoth.length > 0 && (
                  <div className="flex items-center text-sm">
                    <span className="mr-2">💰</span>
                    <span>Cross-buyers average <strong>{(shopsBoth.reduce((sum, shop) => sum + shop.total, 0) / shopsBoth.length).toFixed(0)} cases</strong> vs single-brand buyers</span>
                  </div>
                )}
              </div>
            </div>

            {/* Top Performing Shops */}
            {shopsWithSales.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">🏆 TOP 5 PERFORMING SHOPS</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Cases</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">8PM</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">VERVE</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {shopsWithSales.sort((a, b) => b.total - a.total).slice(0, 5).map((shop, index) => (
                        <tr key={shop.shopId} className={index === 0 ? 'bg-yellow-50' : ''}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{shop.shopName}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 font-bold">{shop.total.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-purple-600">{(shop.eightPM || 0).toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-orange-600">{(shop.verve || 0).toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm">
                            {(shop.eightPM || 0) > 0 && (shop.verve || 0) > 0 ? (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Both</span>
                            ) : (shop.eightPM || 0) > 0 ? (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">8PM</span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">VERVE</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Future: Export functionality
                  alert('Export functionality coming soon!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Export Shop List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // ✅ ENHANCED SALESMAN PERFORMANCE CALCULATION WITH ROLLING 5-MONTH SUPPORT
  // ==========================================
  
  const salesmanPerformance = useMemo(() => {
    try {
      const performanceMap: Record<string, any> = {};
      
      // Helper function to normalize salesman names (case-insensitive)
      const normalizeName = (name: string): string => {
        if (!name) return 'unknown';
        return name.toString().trim().toLowerCase().replace(/\s+/g, ' ');
      };

      // Helper function to get the best display name (prefer proper case)
      const getBestDisplayName = (names: string[]): string => {
        // Prefer names with proper capitalization
        const properCase = names.find(name => /^[A-Z]/.test(name) && /[a-z]/.test(name));
        if (properCase) return properCase;
        
        // Fallback to first name found
        return names[0] || 'Unknown';
      };
      
      console.log('🔧 Processing salesman performance data with rolling 5-month window...');
      
      // ✅ CRITICAL FIX: Use data.salesData instead of contaminated data.allShopsComparison
      if (!data?.salesData) {
        console.warn('⚠️ No salesData available');
        return [];
      }
      
      const allShops = Object.values(data.salesData);
      console.log(`📊 Processing ${allShops.length} shops from clean salesData source`);
      
      // 🔍 DEBUG: Check sample shop data for June/July availability
      const sampleShop = allShops[0];
      if (sampleShop) {
        console.log('🔍 SAMPLE SHOP DATA CHECK:', {
          shopName: sampleShop.shopName,
          currentTotal: sampleShop.total,
          rolling5MonthFields: rolling5Months.map(month => ({
            month: month.name,
            totalField: `${month.key}Total`,
            value: (sampleShop as any)[`${month.key}Total`] || 0
          })),
          availableFields: Object.keys(sampleShop).filter(key => key.includes('Total'))
        });
      }
      
      // Track all name variations for each normalized name
      const nameVariations: Record<string, string[]> = {};
      
      allShops.forEach(shop => {
        const originalSalesmanName = shop.salesman;
        const normalizedName = normalizeName(originalSalesmanName);
        
        // Skip shops with unknown/invalid salesman
        if (!originalSalesmanName || normalizedName === 'unknown' || normalizedName.trim() === '') {
          return;
        }
        
        // Track name variations
        if (!nameVariations[normalizedName]) {
          nameVariations[normalizedName] = [];
        }
        if (!nameVariations[normalizedName].includes(originalSalesmanName)) {
          nameVariations[normalizedName].push(originalSalesmanName);
        }
        
        if (!performanceMap[normalizedName]) {
          performanceMap[normalizedName] = {
            name: originalSalesmanName, // Will be updated to best display name later
            originalNames: [originalSalesmanName],
            totalShops: 0,
            billedShops: 0,
            coverage: 0,
            total8PM: 0,        // CRITICAL: Initialize as NUMBER
            totalVERVE: 0,      // CRITICAL: Initialize as NUMBER  
            totalSales: 0,      // CRITICAL: Initialize as NUMBER
            target8PM: 0,
            targetVERVE: 0,
            achievement8PM: 0,
            achievementVERVE: 0,
            // Historical data for all months (rolling 5-month support)
            marchTotal: 0, marchEightPM: 0, marchVerve: 0,
            aprilTotal: 0, aprilEightPM: 0, aprilVerve: 0,
            mayTotal: 0, mayEightPM: 0, mayVerve: 0,
            juneTotal: 0, juneEightPM: 0, juneVerve: 0,
            julyTotal: 0, julyEightPM: 0, julyVerve: 0,
            augustTotal: 0, augustEightPM: 0, augustVerve: 0,
            septemberTotal: 0, septemberEightPM: 0, septemberVerve: 0,
            octoberTotal: 0, octoberEightPM: 0, octoberVerve: 0,
            novemberTotal: 0, novemberEightPM: 0, novemberVerve: 0,
            decemberTotal: 0, decemberEightPM: 0, decemberVerve: 0,
            januaryTotal: 0, januaryEightPM: 0, januaryVerve: 0,
            februaryTotal: 0, februaryEightPM: 0, februaryVerve: 0,
            shops: []
          };
        } else {
          // Add to existing entry
          if (!performanceMap[normalizedName].originalNames.includes(originalSalesmanName)) {
            performanceMap[normalizedName].originalNames.push(originalSalesmanName);
          }
        }
        
        // Count ALL assigned shops (this is the key fix)
        performanceMap[normalizedName].totalShops++;
        performanceMap[normalizedName].shops.push(shop);
        
        // ✅ CRITICAL FIX: Use current month data properly (phantom data prevention)
        // Only count as billed if shop has sales in current month from challans
        if ((shop.total || 0) > 0) {
          performanceMap[normalizedName].billedShops++;
          
          // ✅ PHANTOM DATA PREVENTION: Use current month data only
          const shop8PM = Number(shop.eightPM) || 0;
          const shopVERVE = Number(shop.verve) || 0;
          const shopTotal = Number(shop.total) || 0;
          
          // Debug log for problematic values
          if (isNaN(shop8PM) || isNaN(shopVERVE) || isNaN(shopTotal)) {
            console.warn(`⚠️  Invalid numeric values for shop ${shop.shopName}:`, {
              eightPM: shop.eightPM,
              verve: shop.verve, 
              total: shop.total,
              converted8PM: shop8PM,
              convertedVERVE: shopVERVE,
              convertedTotal: shopTotal
            });
          }
          
          // CRITICAL FIX: Ensure numeric addition using explicit type conversion
          performanceMap[normalizedName].total8PM = Number(performanceMap[normalizedName].total8PM) + shop8PM;
          performanceMap[normalizedName].totalVERVE = Number(performanceMap[normalizedName].totalVERVE) + shopVERVE;
          performanceMap[normalizedName].totalSales = Number(performanceMap[normalizedName].totalSales) + shopTotal;
          
          // Validation after each addition
          if (isNaN(performanceMap[normalizedName].totalSales)) {
            console.error(`❌ NaN detected for ${originalSalesmanName} after adding ${shopTotal}`);
            performanceMap[normalizedName].totalSales = shopTotal; // Reset to current shop total
          }
        }
          
        // ✅ FIXED: Add ALL historical data properly (use historical fields only)
        // Support for rolling 5-month window
        const allMonthKeys = ['march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'january', 'february'];
        
        allMonthKeys.forEach(monthKey => {
          const totalField = `${monthKey}Total`;
          const eightPMField = `${monthKey}EightPM`;
          const verveField = `${monthKey}Verve`;
          
          performanceMap[normalizedName][totalField] += Number(shop[totalField as keyof ShopData]) || 0;
          performanceMap[normalizedName][eightPMField] += Number(shop[eightPMField as keyof ShopData]) || 0;
          performanceMap[normalizedName][verveField] += Number(shop[verveField as keyof ShopData]) || 0;
        });
      });
      
      // Update display names to best format
      Object.keys(performanceMap).forEach(normalizedName => {
        const variations = nameVariations[normalizedName] || [];
        performanceMap[normalizedName].name = getBestDisplayName(variations);
      });
      
      // STEP 2: Add target data from salespersonStats with case-insensitive matching and Sahir Kumar fix
      Object.values(data.salespersonStats || {}).forEach((stats: any) => {
        const originalStatsName = stats.name;
        const normalizedStatsName = normalizeName(originalStatsName);
        
        if (performanceMap[normalizedStatsName]) {
          // ENSURE NUMERIC VALUES
          let target8PM = Number(stats.eightPmTarget) || 0;
          let targetVERVE = Number(stats.verveTarget) || 0;
          
          // 🔍 DEBUG: Log all target processing for Sahir Kumar variants
          if (originalStatsName.toLowerCase().includes('sahir')) {
            console.log('🔍 PROCESSING SAHIR KUMAR VARIANT:', {
              originalName: originalStatsName,
              normalizedName: normalizedStatsName,
              target8PM: target8PM,
              targetVERVE: targetVERVE,
              foundInPerformanceMap: !!performanceMap[normalizedStatsName]
            });
          }
          
          // 🛠️ FIX: Handle case sensitivity issue - skip problematic low-target entries for Sahir
          if (originalStatsName.toLowerCase().includes('sahir') && target8PM < 50) {
            console.warn(`⚠️ Case sensitivity issue detected for ${originalStatsName}: low target suggests incomplete data. Current: 8PM=${target8PM}, VERVE=${targetVERVE}`);
            
            // Look for the main entry (should have much higher targets)
            const mainSahirEntry = Object.keys(performanceMap).find(key => 
              key.includes('sahir') && key !== normalizedStatsName
            );
            
            if (mainSahirEntry) {
              console.log(`🔧 Found main Sahir entry: ${mainSahirEntry}. Skipping low target variant.`);
              return; // Skip this low target entry
            }
          }
          
          // 🛠️ FIX: Detect and correct suspiciously low targets for other cases
          if (target8PM > 0 && target8PM < 50 && !originalStatsName.toLowerCase().includes('sahir')) {
            console.warn(`⚠️ Suspicious 8PM target for ${originalStatsName}: ${target8PM}. Auto-correcting...`);
            target8PM = target8PM * 100; // Likely missing two zeros
          }
          
          if (targetVERVE > 0 && targetVERVE < 50 && !originalStatsName.toLowerCase().includes('sahir')) {
            console.warn(`⚠️ Suspicious VERVE target for ${originalStatsName}: ${targetVERVE}. Auto-correcting...`);
            targetVERVE = targetVERVE * 100; // Likely missing two zeros
          }
          
          performanceMap[normalizedStatsName].target8PM = target8PM;
          performanceMap[normalizedStatsName].targetVERVE = targetVERVE;
          
          // 🔍 DEBUG: Log final target assignment
          if (originalStatsName.toLowerCase().includes('sahir')) {
            console.log('🔍 FINAL SAHIR KUMAR TARGET ASSIGNMENT:', {
              name: originalStatsName,
              normalizedName: normalizedStatsName,
              final8PM: target8PM,
              finalVERVE: targetVERVE
            });
          }
        } else {
          // 🔍 DEBUG: Log when salesman not found in performance map
          if (originalStatsName.toLowerCase().includes('sahir')) {
            console.warn(`⚠️ Sahir variant not found in performance map: ${originalStatsName} -> ${normalizedStatsName}`);
          }
        }
      });
      
      // STEP 3: Calculate coverage and achievements with FINAL NUMERIC VALIDATION
      Object.values(performanceMap).forEach((perf: any) => {
        perf.coverage = perf.totalShops > 0 ? (perf.billedShops / perf.totalShops) * 100 : 0;
        perf.achievement8PM = perf.target8PM > 0 ? (perf.total8PM / perf.target8PM) * 100 : 0;
        perf.achievementVERVE = perf.targetVERVE > 0 ? (perf.totalVERVE / perf.targetVERVE) * 100 : 0;
        
        // CRITICAL: Final validation and type conversion
        perf.totalSales = Number(perf.totalSales) || 0;
        perf.total8PM = Number(perf.total8PM) || 0;
        perf.totalVERVE = Number(perf.totalVERVE) || 0;
        
        // Additional validation
        if (isNaN(perf.totalSales) || perf.totalSales < 0) {
          console.error(`❌ Invalid totalSales for ${perf.name}: ${perf.totalSales}`);
          perf.totalSales = 0;
        }
      });
      
      const result = Object.values(performanceMap).filter((p: any) => p.name !== 'Unknown');
      
      console.log(`✅ Processed ${result.length} salesmen with rolling 5-month window support`);
      console.log(`📊 Current rolling window: ${rolling5Months.map(m => m.abbrev).join('-')} ${data.currentYear}`);
      
      return result;
    } catch (error) {
      console.error('❌ Error in salesmanPerformance calculation:', error);
      return [];
    }
  }, [data, rolling5Months]);

  // AGGRESSIVE FIX: Force React to completely re-render
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const sortedSalesmen = useMemo(() => {
    try {
      // Create a completely new array with new objects to force React re-render
      const sorted = salesmanPerformance.map(salesman => ({
        ...salesman,
        // Force new object identity for React rendering
        _sortKey: `${salesman.name}-${salesman.totalSales}-${Date.now()}`
      })).sort((a: any, b: any) => {
        const aTotal = parseFloat(String(a.totalSales)) || 0;
        const bTotal = parseFloat(String(b.totalSales)) || 0;
        return bTotal - aTotal; // Descending order (highest first)
      });
      
      return sorted;
    } catch (error) {
      console.error('❌ Error in sortedSalesmen calculation:', error);
      return [];
    }
  }, [salesmanPerformance, data.currentMonth]);

  // 🔍 DETECT SUSPICIOUS TARGETS
  const suspiciousTargets = sortedSalesmen.filter(salesman => 
    (salesman.target8PM > 0 && salesman.target8PM < 50) ||
    (salesman.targetVERVE > 0 && salesman.targetVERVE < 50)
  );

  // ✅ SAFETY CHECK: Ensure data exists
  if (!data || !data.salesData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">Salesman data is not available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Salesman Performance Dashboard</h2>
        <p className="text-gray-600 text-sm sm:text-base">Individual salesman achievements and targets for {getMonthName(data.currentMonth)} {data.currentYear}</p>
        <div className="mt-2 text-xs text-green-600 bg-green-50 rounded-full px-3 py-1 inline-block">
          ✅ Rolling 5-Month Window: {rolling5Months.map(m => m.abbrev).join('-')} {data.currentYear}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Automatically updates each month • Current window shows last 5 months including {getMonthName(data.currentMonth)}
        </p>
      </div>

      {/* 🛠️ WARNING BANNER FOR SUSPICIOUS TARGETS */}
      {suspiciousTargets.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                ⚠️ Suspicious Target Values Detected
              </h3>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>The following salesmen have unusually low targets that may need review:</p>
                <ul className="list-disc ml-5 space-y-1">
                  {suspiciousTargets.map(salesman => (
                    <li key={salesman.name}>
                      <strong>{salesman.name}</strong>: 
                      {salesman.target8PM < 50 && salesman.target8PM > 0 && (
                        <span className="ml-1">8PM Target: {salesman.target8PM} cases</span>
                      )}
                      {salesman.targetVERVE < 50 && salesman.targetVERVE > 0 && (
                        <span className="ml-1">VERVE Target: {salesman.targetVERVE} cases</span>
                      )}
                      <span className="text-yellow-600 ml-2">
                        (Achievement: {salesman.achievement8PM?.toFixed(0)}% / {salesman.achievementVERVE?.toFixed(0)}%)
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  💡 <strong>Possible causes:</strong> Data entry error, case sensitivity issue, missing decimal places, or incorrect units. 
                  Please verify these targets in the Google Sheet.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Summary Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Top Performer</h3>
          {sortedSalesmen.length > 0 && (
            <div>
              <div className="text-lg sm:text-2xl font-bold text-blue-600 truncate">{sortedSalesmen[0].name}</div>
              <div className="text-xs sm:text-sm text-gray-500">{Number(sortedSalesmen[0].totalSales).toLocaleString()} cases</div>
            </div>
          )}
        </div>
        
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Best 8PM</h3>
          {(() => {
            const best8PM = sortedSalesmen.filter((s: any) => s.target8PM > 0).sort((a: any, b: any) => b.achievement8PM - a.achievement8PM)[0];
            return best8PM ? (
              <div>
                <div className="text-lg sm:text-2xl font-bold text-purple-600 truncate">{best8PM.name}</div>
                <div className="text-xs sm:text-sm text-gray-500">{best8PM.achievement8PM.toFixed(1)}%</div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-gray-500">No targets set</div>
            );
          })()}
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Best VERVE</h3>
          {(() => {
            const bestVERVE = sortedSalesmen.filter((s: any) => s.targetVERVE > 0).sort((a: any, b: any) => b.achievementVERVE - a.achievementVERVE)[0];
            return bestVERVE ? (
              <div>
                <div className="text-lg sm:text-2xl font-bold text-orange-600 truncate">{bestVERVE.name}</div>
                <div className="text-xs sm:text-sm text-gray-500">{bestVERVE.achievementVERVE.toFixed(1)}%</div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-gray-500">No targets set</div>
            );
          })()}
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">Best Coverage</h3>
          {(() => {
            const bestCoverage = [...sortedSalesmen].sort((a: any, b: any) => b.coverage - a.coverage)[0];
            return bestCoverage ? (
              <div>
                <div className="text-lg sm:text-2xl font-bold text-green-600 truncate">{bestCoverage.name}</div>
                <div className="text-xs sm:text-sm text-gray-500">{bestCoverage.coverage.toFixed(1)}%</div>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="block lg:hidden">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Salesman Performance - Mobile View
            </h3>
            <p className="text-sm text-gray-500">
              Ranked by total sales • Rolling 5-month window: {rolling5Months.map(m => m.abbrev).join('-')}
            </p>
          </div>
          
          <div className="p-4">
            {sortedSalesmen.map((salesman, index) => (
              <MobileSalesmanCard key={salesman._sortKey} salesman={salesman} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop View - Enhanced Table */}
      <div className="hidden lg:block bg-white rounded-lg shadow">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Shops</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billed Shops</th>
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
                <tr key={salesman._sortKey} className={index < 3 ? 'bg-yellow-50' : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{salesman.totalShops}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handlePenetrationBreakdownClick(salesman.name, salesman.totalShops, salesman.billedShops, salesman.shops)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                    >
                      {salesman.billedShops}
                    </button>
                  </td>
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
                    <div className="font-medium">{Number(salesman.total8PM).toLocaleString()}/{Number(salesman.target8PM).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      {Number(salesman.total8PM).toLocaleString()} cases, target {Number(salesman.target8PM).toLocaleString()}
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
                    <div className="font-medium">{Number(salesman.totalVERVE).toLocaleString()}/{Number(salesman.targetVERVE).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      {Number(salesman.totalVERVE).toLocaleString()} cases, target {Number(salesman.targetVERVE).toLocaleString()}
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
                    {Number(salesman.totalSales).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rolling 5-Month Historical Performance - Desktop Only */}
      <div className="hidden lg:block bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Rolling 5-Month Performance Trend</h3>
          <p className="text-sm text-gray-500">
            Rolling window automatically updates each month • Current: {rolling5Months.map(m => m.abbrev).join('-')} {data.currentYear}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                {rolling5Months.map((month, index) => (
                  <th key={month.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {month.name} Total
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">5-Month Avg</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSalesmen.slice(0, 10).map((salesman: any) => {
                // Calculate rolling 5-month data
                const rollingData = rolling5Months.map(month => {
                  const totalField = `${month.key}Total`;
                  const eightPMField = `${month.key}EightPM`;
                  const verveField = `${month.key}Verve`;
                  
                  // For current month, use live data
                  let total, eightPM, verve;
                  if (month.index.toString().padStart(2, '0') === data.currentMonth) {
                    total = (Number(salesman.total8PM) || 0) + (Number(salesman.totalVERVE) || 0);
                    eightPM = Number(salesman.total8PM) || 0;
                    verve = Number(salesman.totalVERVE) || 0;
                  } else {
                    total = Number(salesman[totalField]) || 0;
                    eightPM = Number(salesman[eightPMField]) || 0;
                    verve = Number(salesman[verveField]) || 0;
                  }
                  
                  return {
                    month: month.index,
                    monthName: month.name,
                    monthKey: month.key,
                    total,
                    eightPM,
                    verve
                  };
                });
                
                // Calculate 5-month average
                const avg5Month = (rollingData.reduce((sum, month) => sum + month.total, 0) / 5).toFixed(0);
                
                // Calculate trend (latest 3 months vs earlier 2 months)
                const recent3Avg = (rollingData[2].total + rollingData[3].total + rollingData[4].total) / 3;
                const earlier2Avg = (rollingData[0].total + rollingData[1].total) / 2;
                const trend = recent3Avg > earlier2Avg * 1.1 ? 'improving' :
                            recent3Avg < earlier2Avg * 0.9 ? 'declining' : 'stable';
                
                return (
                  <tr key={salesman._sortKey}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{salesman.name}</td>
                    {rollingData.map((monthData, index) => (
                      <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => handleCaseBreakdownClick(
                            salesman.name, 
                            monthData.monthKey, 
                            monthData.monthName, 
                            monthData.total, 
                            monthData.eightPM, 
                            monthData.verve
                          )}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                        >
                          {monthData.total.toLocaleString()}
                        </button>
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        trend === 'improving' ? 'bg-green-100 text-green-800' :
                        trend === 'declining' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {trend === 'improving' ? '📈 Growing' : trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{avg5Month}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Charts - Mobile Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Achievement Comparison</h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {sortedSalesmen.slice(0, 8).map((salesman: any) => (
                <div key={salesman._sortKey}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium truncate flex-1 mr-2">{salesman.name}</span>
                    <span className="whitespace-nowrap text-xs sm:text-sm">
                      8PM: {salesman.achievement8PM.toFixed(1)}% | VERVE: {salesman.achievementVERVE.toFixed(1)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(salesman.achievement8PM, 100)}%` }}
                      ></div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-500" 
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
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Coverage vs Sales Performance</h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {sortedSalesmen.slice(0, 8).map((salesman: any) => (
                <div key={salesman._sortKey} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{salesman.name}</div>
                    <div className="text-xs text-gray-500">
                      {salesman.billedShops}/{salesman.totalShops} shops • {Number(salesman.totalSales).toLocaleString()} cases
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 sm:space-x-4 ml-2">
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
                      <div className="text-lg font-bold text-blue-600">{Number(salesman.totalSales).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Cases</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary - Mobile Responsive */}
      <div className="bg-gradient-to-r from-purple-50 to-orange-50 p-4 sm:p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Salesman Achievement Summary - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {sortedSalesmen.filter((s: any) => s.achievement8PM >= 100 && s.target8PM > 0).length}
            </div>
            <div className="text-xs text-gray-600">8PM Target Achieved</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {sortedSalesmen.filter((s: any) => s.achievementVERVE >= 100 && s.targetVERVE > 0).length}
            </div>
            <div className="text-xs text-gray-600">VERVE Target Achieved</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {sortedSalesmen.filter((s: any) => s.coverage >= 80).length}
            </div>
            <div className="text-xs text-gray-600">High Coverage ({'>'}80%)</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              {sortedSalesmen.length}
            </div>
            <div className="text-xs text-gray-600">Active Salesmen</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-gray-600">
              {rolling5Months.map(m => m.abbrev).join('-')}
            </div>
            <div className="text-xs text-gray-600">Rolling Window</div>
          </div>
        </div>
        
        {/* Future Month Preview */}
        <div className="mt-6 p-4 bg-white bg-opacity-60 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">🔮 Next Month Preview</h4>
          <p className="text-xs text-gray-600">
            When {getMonthName(String(parseInt(data.currentMonth) + 1).padStart(2, '0'))} {data.currentYear} begins, 
            the window will automatically shift to: {(() => {
              const nextMonth = parseInt(data.currentMonth) + 1 > 12 ? '01' : String(parseInt(data.currentMonth) + 1).padStart(2, '0');
              const nextWindow = getRolling5MonthWindow(nextMonth);
              return nextWindow.map(m => m.abbrev).join('-');
            })()} {parseInt(data.currentMonth) === 12 ? parseInt(data.currentYear) + 1 : data.currentYear}
          </p>
        </div>
      </div>

      {/* Modals */}
      {showSalesmanBreakdown && (
        <SalesmanBreakdownModal 
          onClose={() => {
            setShowSalesmanBreakdown(false);
            setSelectedSalesmanBreakdown(null);
          }} 
        />
      )}

      {showPenetrationBreakdown && (
        <CustomerPenetrationModal 
          onClose={() => {
            setShowPenetrationBreakdown(false);
            setSelectedPenetrationBreakdown(null);
          }} 
        />
      )}

      {showShopList && (
        <ShopListModal 
          onClose={() => {
            setShowShopList(false);
            setSelectedShopList(null);
          }} 
        />
      )}
    </div>
  );
};

export default SalesmanPerformanceTab;
