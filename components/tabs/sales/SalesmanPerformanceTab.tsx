'use client';

import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';

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
  growthPercent?: number;
  monthlyTrend?: 'improving' | 'declining' | 'stable' | 'new';
}

interface DashboardData {
  salesData: Record<string, ShopData>;
  salespersonStats: Record<string, any>;
  currentMonth: string;
  currentYear: string;
  allShopsComparison: ShopData[];
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const getMonthName = (monthNum: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[parseInt(monthNum) - 1] || 'Unknown';
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

      {/* Historical Trend */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <button
          onClick={() => handleCaseBreakdownClick(salesman.name, 'march', 'March', salesman.marchTotal, salesman.marchEightPM, salesman.marchVerve)}
          className="text-center p-2 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
        >
          <div className="text-sm font-medium text-gray-900">{salesman.marchTotal.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Mar</div>
        </button>
        <button
          onClick={() => handleCaseBreakdownClick(salesman.name, 'april', 'April', salesman.aprilTotal, salesman.aprilEightPM, salesman.aprilVerve)}
          className="text-center p-2 bg-green-100 rounded hover:bg-green-200 transition-colors"
        >
          <div className="text-sm font-medium text-gray-900">{salesman.aprilTotal.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Apr</div>
        </button>
        <button
          onClick={() => handleCaseBreakdownClick(salesman.name, 'may', 'May', salesman.mayTotal, salesman.mayEightPM, salesman.mayVerve)}
          className="text-center p-2 bg-yellow-100 rounded hover:bg-yellow-200 transition-colors"
        >
          <div className="text-sm font-medium text-gray-900">{salesman.mayTotal.toLocaleString()}</div>
          <div className="text-xs text-gray-500">May</div>
        </button>
      </div>

      {/* Trend Indicator */}
      <div className="flex justify-center">
        {(() => {
          const trend = salesman.mayTotal > salesman.aprilTotal && salesman.aprilTotal > salesman.marchTotal ? 'improving' :
                      salesman.mayTotal < salesman.aprilTotal && salesman.aprilTotal < salesman.marchTotal ? 'declining' : 'stable';
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
  // FIXED: ENHANCED SALESMAN PERFORMANCE CALCULATION WITH PROPER SORTING
  // ==========================================
  
  const salesmanPerformance = useMemo(() => {
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
    
    console.log('🔧 PROCESSING SALESMAN PERFORMANCE WITH CASE-INSENSITIVE MATCHING');
    
    // STEP 1: Use allShopsComparison which includes ALL shops (assigned + sales data)
    const allShops = data.allShopsComparison || [];
    console.log(`📊 Total shops in allShopsComparison: ${allShops.length}`);
    
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
          total8PM: 0,
          totalVERVE: 0,
          totalSales: 0,
          target8PM: 0,
          targetVERVE: 0,
          achievement8PM: 0,
          achievementVERVE: 0,
          marchTotal: 0,
          marchEightPM: 0,
          marchVerve: 0,
          aprilTotal: 0,
          aprilEightPM: 0,
          aprilVerve: 0,
          mayTotal: 0,
          mayEightPM: 0,
          mayVerve: 0,
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
      
      // Only count as billed if shop has sales in current month
      if (shop.total > 0) {
        performanceMap[normalizedName].billedShops++;
        // ENSURE NUMERIC VALUES - CRITICAL FIX
        performanceMap[normalizedName].total8PM += Number(shop.eightPM) || 0;
        performanceMap[normalizedName].totalVERVE += Number(shop.verve) || 0;
        performanceMap[normalizedName].totalSales += Number(shop.total) || 0;
      }
        
      // Add historical data regardless of current sales - ENSURE NUMERIC
      performanceMap[normalizedName].marchTotal += Number(shop.marchTotal) || 0;
      performanceMap[normalizedName].marchEightPM += Number(shop.marchEightPM) || 0;
      performanceMap[normalizedName].marchVerve += Number(shop.marchVerve) || 0;
      
      performanceMap[normalizedName].aprilTotal += Number(shop.aprilTotal) || 0;
      performanceMap[normalizedName].aprilEightPM += Number(shop.aprilEightPM) || 0;
      performanceMap[normalizedName].aprilVerve += Number(shop.aprilVerve) || 0;
      
      performanceMap[normalizedName].mayTotal += Number(shop.mayTotal) || 0;
      performanceMap[normalizedName].mayEightPM += Number(shop.mayEightPM) || 0;
      performanceMap[normalizedName].mayVerve += Number(shop.mayVerve) || 0;
    });
    
    // Update display names to best format
    Object.keys(performanceMap).forEach(normalizedName => {
      const variations = nameVariations[normalizedName] || [];
      performanceMap[normalizedName].name = getBestDisplayName(variations);
    });
    
    // STEP 2: Add target data from salespersonStats with case-insensitive matching
    Object.values(data.salespersonStats || {}).forEach((stats: any) => {
      const originalStatsName = stats.name;
      const normalizedStatsName = normalizeName(originalStatsName);
      
      if (performanceMap[normalizedStatsName]) {
        // ENSURE NUMERIC VALUES
        performanceMap[normalizedStatsName].target8PM = Number(stats.eightPmTarget) || 0;
        performanceMap[normalizedStatsName].targetVERVE = Number(stats.verveTarget) || 0;
        console.log(`✅ Matched targets for: "${originalStatsName}" (normalized: "${normalizedStatsName}")`);
      } else {
        console.log(`❌ No match found for target: "${originalStatsName}" (normalized: "${normalizedStatsName}")`);
      }
    });
    
    // STEP 3: Calculate coverage and achievements
    Object.values(performanceMap).forEach((perf: any) => {
      perf.coverage = perf.totalShops > 0 ? (perf.billedShops / perf.totalShops) * 100 : 0;
      perf.achievement8PM = perf.target8PM > 0 ? (perf.total8PM / perf.target8PM) * 100 : 0;
      perf.achievementVERVE = perf.targetVERVE > 0 ? (perf.totalVERVE / perf.targetVERVE) * 100 : 0;
      
      // ENSURE ALL VALUES ARE NUMBERS
      perf.totalSales = Number(perf.totalSales) || 0;
      perf.total8PM = Number(perf.total8PM) || 0;
      perf.totalVERVE = Number(perf.totalVERVE) || 0;
    });
    
    const result = Object.values(performanceMap).filter((p: any) => p.name !== 'Unknown');
    
    // Enhanced debug logging
    console.log('🎯 CASE-INSENSITIVE SALESMAN PERFORMANCE SUMMARY:');
    result.forEach((salesman: any) => {
      const nameInfo = salesman.originalNames.length > 1 ? 
        ` (merged ${salesman.originalNames.length} variations: ${salesman.originalNames.join(', ')})` : '';
      console.log(`${salesman.name}: ${salesman.billedShops}/${salesman.totalShops} shops (${salesman.coverage.toFixed(1)}% coverage) - Total Sales: ${salesman.totalSales} (type: ${typeof salesman.totalSales})${nameInfo}`);
    });
    
    // CRITICAL DEBUG: Check if totalSales values are correct
    console.log('🔍 RAW TOTAL SALES VALUES:');
    result.forEach((salesman: any) => {
      console.log(`${salesman.name}: totalSales = ${salesman.totalSales} (${typeof salesman.totalSales}), total8PM = ${salesman.total8PM}, totalVERVE = ${salesman.totalVERVE}`);
    });
    
    return result;
  }, [data]);

  // FIXED: PROPER SORTING WITH DEBUGGING
  const sortedSalesmen = useMemo(() => {
    console.log('🔄 SORTING SALESMEN BY TOTAL SALES...');
    console.log('Raw salesmanPerformance before sorting:', salesmanPerformance.map(s => ({
      name: s.name,
      totalSales: s.totalSales,
      type: typeof s.totalSales
    })));
    
    // Create a copy to avoid mutating original array
    const sorted = [...salesmanPerformance].sort((a: any, b: any) => {
      const aTotal = Number(a.totalSales) || 0;
      const bTotal = Number(b.totalSales) || 0;
      
      // Debug comparison
      console.log(`Comparing ${a.name} (${aTotal}) vs ${b.name} (${bTotal}) - Result: ${bTotal - aTotal}`);
      
      return bTotal - aTotal; // Descending order (highest first)
    });
    
    console.log('✅ FINAL SORTED ORDER BY TOTAL SALES:');
    sorted.forEach((salesman, index) => {
      console.log(`${index + 1}. ${salesman.name}: ${Number(salesman.totalSales).toLocaleString()} total sales`);
    });
    
    // FORCE CHECK: Let's verify the top 3 are correct
    const top3 = sorted.slice(0, 3);
    console.log('🎯 TOP 3 VERIFICATION:');
    top3.forEach((salesman, index) => {
      console.log(`Position ${index + 1}: ${salesman.name} with ${salesman.totalSales} sales`);
    });
    
    return sorted;
  }, [salesmanPerformance]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Salesman Performance Dashboard</h2>
        <p className="text-gray-600 text-sm sm:text-base">Individual salesman achievements and targets for {getMonthName(data.currentMonth)} {data.currentYear}</p>
      </div>



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
            const bestCoverage = sortedSalesmen.sort((a: any, b: any) => b.coverage - a.coverage)[0];
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
              Ranked by total sales ({getMonthName(data.currentMonth)} {data.currentYear})
            </p>
          </div>
          
          <div className="p-4">
            {sortedSalesmen.map((salesman, index) => (
              <MobileSalesmanCard key={salesman.name} salesman={salesman} index={index} />
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

      {/* 3-Month Historical Performance - Desktop Only */}
      <div className="hidden lg:block bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">3-Month Performance Trend (Mar-Apr-May {data.currentYear})</h3>
          <p className="text-sm text-gray-500">Historical performance comparison for 8PM and VERVE by salesman</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">March Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">April Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">May Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3-Month Avg</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSalesmen.slice(0, 10).map((salesman: any) => {
                const avg3Month = ((Number(salesman.marchTotal) + Number(salesman.aprilTotal) + Number(salesman.mayTotal)) / 3).toFixed(0);
                const trend = Number(salesman.mayTotal) > Number(salesman.aprilTotal) && Number(salesman.aprilTotal) > Number(salesman.marchTotal) ? 'improving' :
                            Number(salesman.mayTotal) < Number(salesman.aprilTotal) && Number(salesman.aprilTotal) < Number(salesman.marchTotal) ? 'declining' : 'stable';
                
                return (
                  <tr key={salesman.name}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{salesman.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleCaseBreakdownClick(salesman.name, 'march', 'March', Number(salesman.marchTotal), Number(salesman.marchEightPM), Number(salesman.marchVerve))}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                      >
                        {Number(salesman.marchTotal).toLocaleString()}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleCaseBreakdownClick(salesman.name, 'april', 'April', Number(salesman.aprilTotal), Number(salesman.aprilEightPM), Number(salesman.aprilVerve))}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                      >
                        {Number(salesman.aprilTotal).toLocaleString()}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleCaseBreakdownClick(salesman.name, 'may', 'May', Number(salesman.mayTotal), Number(salesman.mayEightPM), Number(salesman.mayVerve))}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                      >
                        {Number(salesman.mayTotal).toLocaleString()}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        trend === 'improving' ? 'bg-green-100 text-green-800' :
                        trend === 'declining' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {trend === 'improving' ? '📈 Growing' : trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{avg3Month}</td>
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
                <div key={salesman.name}>
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
                <div key={salesman.name} className="flex items-center justify-between">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
