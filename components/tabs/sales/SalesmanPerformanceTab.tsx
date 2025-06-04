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

  // INTERNAL FUNCTION to handle case breakdown click
  const handleCaseBreakdownClick = (salesmanName: string, month: string, monthName: string, total: number, eightPM: number, verve: number) => {
    console.log('🔥 BREAKDOWN CLICKED:', { salesmanName, month, monthName, total, eightPM, verve });
    console.log('🔥 Setting state...');
    setSelectedSalesmanBreakdown({
      salesmanName,
      month,
      monthName,
      total,
      eightPM,
      verve
    });
    setShowSalesmanBreakdown(true);
    console.log('🔥 State set, modal should show');
  };

  // INTERNAL COMPONENT: Salesman Breakdown Modal
  const SalesmanBreakdownModal = ({ onClose }: { onClose: () => void }) => {
    if (!selectedSalesmanBreakdown) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
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

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center bg-blue-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {selectedSalesmanBreakdown.total.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Cases</div>
                <div className="text-xs text-gray-400">{selectedSalesmanBreakdown.monthName} 2025</div>
              </div>
              <div className="text-center bg-purple-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {selectedSalesmanBreakdown.eightPM.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">8PM Cases</div>
                <div className="text-xs text-gray-400">
                  {selectedSalesmanBreakdown.total > 0 ? 
                    `${((selectedSalesmanBreakdown.eightPM / selectedSalesmanBreakdown.total) * 100).toFixed(1)}%` : '0%'} of total
                </div>
              </div>
              <div className="text-center bg-orange-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
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
                      className="bg-purple-600 h-3 rounded-full" 
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
                      className="bg-orange-600 h-3 rounded-full" 
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

  // INTERNAL CALCULATION: Calculate salesman performance data (FIXED HISTORICAL AGGREGATION)
  const salesmanPerformance = useMemo(() => {
    const performanceMap: Record<string, any> = {};
    
    const shopDetails = Object.values(data.salesData);
    
    shopDetails.forEach(shop => {
      const salesmanName = shop.salesman;
      if (!performanceMap[salesmanName]) {
        performanceMap[salesmanName] = {
          name: salesmanName,
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
          // FIXED: 3-month historical data aggregation
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
      }
      
      performanceMap[salesmanName].totalShops++;
      
      // FIXED: Current month aggregation (June)
      if (shop.total > 0) {
        performanceMap[salesmanName].billedShops++;
        performanceMap[salesmanName].total8PM += shop.eightPM;
        performanceMap[salesmanName].totalVERVE += shop.verve;
        performanceMap[salesmanName].totalSales += shop.total;
        performanceMap[salesmanName].shops.push(shop);
      }
        
      // FIXED: Historical data aggregation (Mar-Apr-May)
      performanceMap[salesmanName].marchTotal += shop.marchTotal || 0;
      performanceMap[salesmanName].marchEightPM += shop.marchEightPM || 0;
      performanceMap[salesmanName].marchVerve += shop.marchVerve || 0;
      
      performanceMap[salesmanName].aprilTotal += shop.aprilTotal || 0;
      performanceMap[salesmanName].aprilEightPM += shop.aprilEightPM || 0;
      performanceMap[salesmanName].aprilVerve += shop.aprilVerve || 0;
      
      performanceMap[salesmanName].mayTotal += shop.mayTotal || 0;
      performanceMap[salesmanName].mayEightPM += shop.mayEightPM || 0;
      performanceMap[salesmanName].mayVerve += shop.mayVerve || 0;
    });
    
    // Add target data from salespersonStats
    Object.values(data.salespersonStats).forEach((stats: any) => {
      const salesmanName = stats.name;
      if (performanceMap[salesmanName]) {
        performanceMap[salesmanName].target8PM = stats.eightPmTarget || 0;
        performanceMap[salesmanName].targetVERVE = stats.verveTarget || 0;
      }
    });
    
    // Calculate coverage and achievements
    Object.values(performanceMap).forEach((perf: any) => {
      perf.coverage = perf.totalShops > 0 ? (perf.billedShops / perf.totalShops) * 100 : 0;
      perf.achievement8PM = perf.target8PM > 0 ? (perf.total8PM / perf.target8PM) * 100 : 0;
      perf.achievementVERVE = perf.targetVERVE > 0 ? (perf.totalVERVE / perf.targetVERVE) * 100 : 0;
    });
    
    return Object.values(performanceMap).filter((p: any) => p.name !== 'Unknown');
  }, [data]);

  const sortedSalesmen = salesmanPerformance.sort((a: any, b: any) => b.totalSales - a.totalSales);

  return (
    <div className="space-y-6">
      {/* DEBUG: Show modal state */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-100 p-2 text-xs">
          DEBUG: showSalesmanBreakdown={String(showSalesmanBreakdown)}, selectedData={selectedSalesmanBreakdown?.salesmanName || 'null'}
        </div>
      )}
      
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Salesman Performance Dashboard</h2>
        <p className="text-gray-600">Individual salesman achievements and targets for {getMonthName(data.currentMonth)} {data.currentYear}</p>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Top Performer (Sales)</h3>
          {sortedSalesmen.length > 0 && (
            <div>
              <div className="text-2xl font-bold text-blue-600">{sortedSalesmen[0].name}</div>
              <div className="text-sm text-gray-500">{sortedSalesmen[0].totalSales.toLocaleString()} cases</div>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Best 8PM Achievement</h3>
          {(() => {
            const best8PM = sortedSalesmen.filter((s: any) => s.target8PM > 0).sort((a: any, b: any) => b.achievement8PM - a.achievement8PM)[0];
            return best8PM ? (
              <div>
                <div className="text-2xl font-bold text-purple-600">{best8PM.name}</div>
                <div className="text-sm text-gray-500">{best8PM.achievement8PM.toFixed(1)}%</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No targets set</div>
            );
          })()}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Best VERVE Achievement</h3>
          {(() => {
            const bestVERVE = sortedSalesmen.filter((s: any) => s.targetVERVE > 0).sort((a: any, b: any) => b.achievementVERVE - a.achievementVERVE)[0];
            return bestVERVE ? (
              <div>
                <div className="text-2xl font-bold text-orange-600">{bestVERVE.name}</div>
                <div className="text-sm text-gray-500">{bestVERVE.achievementVERVE.toFixed(1)}%</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No targets set</div>
            );
          })()}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Best Coverage</h3>
          {(() => {
            const bestCoverage = sortedSalesmen.sort((a: any, b: any) => b.coverage - a.coverage)[0];
            return bestCoverage ? (
              <div>
                <div className="text-2xl font-bold text-green-600">{bestCoverage.name}</div>
                <div className="text-sm text-gray-500">{bestCoverage.coverage.toFixed(1)}%</div>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Detailed Performance Table */}
      <div className="bg-white rounded-lg shadow">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shops</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billed</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.totalShops}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.billedShops}</td>
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
                    <div className="font-medium">{salesman.total8PM.toLocaleString()}/{salesman.target8PM.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      {salesman.total8PM.toLocaleString()} cases, target {salesman.target8PM.toLocaleString()}
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
                    <div className="font-medium">{salesman.totalVERVE.toLocaleString()}/{salesman.targetVERVE.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      {salesman.totalVERVE.toLocaleString()} cases, target {salesman.targetVERVE.toLocaleString()}
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
                    {salesman.totalSales.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW: 3-Month Historical Performance */}
      <div className="bg-white rounded-lg shadow">
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
                const avg3Month = ((salesman.marchTotal + salesman.aprilTotal + salesman.mayTotal) / 3).toFixed(0);
                const trend = salesman.mayTotal > salesman.aprilTotal && salesman.aprilTotal > salesman.marchTotal ? 'improving' :
                            salesman.mayTotal < salesman.aprilTotal && salesman.aprilTotal < salesman.marchTotal ? 'declining' : 'stable';
                
                return (
                  <tr key={salesman.name}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{salesman.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => {
                          console.log('March clicked for:', salesman.name);
                          handleCaseBreakdownClick(
                            salesman.name, 
                            'march', 
                            'March', 
                            salesman.marchTotal, 
                            salesman.marchEightPM, 
                            salesman.marchVerve
                          );
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                        style={{ textDecoration: 'none' }}
                      >
                        {salesman.marchTotal.toLocaleString()}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => {
                          console.log('April clicked for:', salesman.name);
                          handleCaseBreakdownClick(
                            salesman.name, 
                            'april', 
                            'April', 
                            salesman.aprilTotal, 
                            salesman.aprilEightPM, 
                            salesman.aprilVerve
                          );
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                        style={{ textDecoration: 'none' }}
                      >
                        {salesman.aprilTotal.toLocaleString()}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => {
                          console.log('May clicked for:', salesman.name);
                          handleCaseBreakdownClick(
                            salesman.name, 
                            'may', 
                            'May', 
                            salesman.mayTotal, 
                            salesman.mayEightPM, 
                            salesman.mayVerve
                          );
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                        style={{ textDecoration: 'none' }}
                      >
                        {salesman.mayTotal.toLocaleString()}
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

      {/* Rest of the component... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Achievement Comparison</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {sortedSalesmen.slice(0, 8).map((salesman: any) => (
                <div key={salesman.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{salesman.name}</span>
                    <span>8PM: {salesman.achievement8PM.toFixed(1)}% | VERVE: {salesman.achievementVERVE.toFixed(1)}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(salesman.achievement8PM, 100)}%` }}
                      ></div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Coverage vs Sales Performance</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {sortedSalesmen.slice(0, 8).map((salesman: any) => (
                <div key={salesman.name} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{salesman.name}</div>
                    <div className="text-xs text-gray-500">
                      {salesman.billedShops}/{salesman.totalShops} shops • {salesman.totalSales.toLocaleString()} cases
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
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
                      <div className="text-lg font-bold text-blue-600">{salesman.totalSales.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Cases</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-orange-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Salesman Achievement Summary - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {sortedSalesmen.filter((s: any) => s.achievement8PM >= 100 && s.target8PM > 0).length}
            </div>
            <div className="text-xs text-gray-600">8PM Target Achieved</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600">
              {sortedSalesmen.filter((s: any) => s.achievementVERVE >= 100 && s.targetVERVE > 0).length}
            </div>
            <div className="text-xs text-gray-600">VERVE Target Achieved</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">
              {sortedSalesmen.filter((s: any) => s.coverage >= 80).length}
            </div>
            <div className="text-xs text-gray-600">High Coverage ({'>'}80%)</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600">
              {sortedSalesmen.length}
            </div>
            <div className="text-xs text-gray-600">Active Salesmen</div>
          </div>
        </div>
      </div>

      {/* MODAL RENDER */}
      {showSalesmanBreakdown && (
        <SalesmanBreakdownModal 
          onClose={() => {
            setShowSalesmanBreakdown(false);
            setSelectedSalesmanBreakdown(null);
          }} 
        />
      )}
    </div>
  );
};

export default SalesmanPerformanceTab;
