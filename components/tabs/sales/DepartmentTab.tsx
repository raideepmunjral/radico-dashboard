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
}

interface DashboardData {
  deptPerformance: Record<string, any>;
  salesData: Record<string, ShopData>;
  summary: {
    total8PM: number;
    totalVERVE: number;
  };
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

const DepartmentTab = ({ data }: { data: DashboardData }) => {
  // STATE for different drill-down modals
  const [showDepartmentShops, setShowDepartmentShops] = useState(false);
  const [selectedDepartmentShops, setSelectedDepartmentShops] = useState<{
    department: string;
    title: string;
    subtitle: string;
    shops: any[];
    type: 'all' | 'active' | 'inactive' | '8pm' | 'verve' | 'both' | 'monthly';
    monthData?: { month: string; total: number; eightPM: number; verve: number; };
  } | null>(null);

  // FUNCTIONS to handle different drill-down clicks
  const handleDepartmentShopsClick = (
    department: string, 
    title: string, 
    subtitle: string, 
    shops: any[], 
    type: 'all' | 'active' | 'inactive' | '8pm' | 'verve' | 'both' | 'monthly',
    monthData?: { month: string; total: number; eightPM: number; verve: number; }
  ) => {
    setSelectedDepartmentShops({
      department,
      title,
      subtitle,
      shops,
      type,
      monthData
    });
    setShowDepartmentShops(true);
  };

  // MEMOIZED department shop data
  const departmentShopsData = useMemo(() => {
    const deptData: Record<string, any> = {};
    
    Object.keys(data.deptPerformance).forEach(dept => {
      const allShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept);
      const activeShops = allShops.filter((shop: any) => shop.total > 0);
      const inactiveShops = allShops.filter((shop: any) => shop.total === 0);
      const shops8PM = activeShops.filter((shop: any) => (shop.eightPM || 0) > 0);
      const shopsVERVE = activeShops.filter((shop: any) => (shop.verve || 0) > 0);
      const shopsBoth = activeShops.filter((shop: any) => (shop.eightPM || 0) > 0 && (shop.verve || 0) > 0);
      
      deptData[dept] = {
        allShops,
        activeShops,
        inactiveShops,
        shops8PM,
        shopsVERVE,
        shopsBoth
      };
    });
    
    return deptData;
  }, [data.salesData]);

  // COMPONENT: Department Shops Modal
  const DepartmentShopsModal = ({ onClose }: { onClose: () => void }) => {
    if (!selectedDepartmentShops) return null;

    const { department, title, subtitle, shops, type, monthData } = selectedDepartmentShops;

    const getTypeStyles = (type: string) => {
      switch(type) {
        case 'all': return {
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-200'
        };
        case 'active': return {
          bg: 'bg-green-50',
          text: 'text-green-600',
          border: 'border-green-200'
        };
        case 'inactive': return {
          bg: 'bg-red-50',
          text: 'text-red-600',
          border: 'border-red-200'
        };
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
        case 'monthly': return {
          bg: 'bg-indigo-50',
          text: 'text-indigo-600',
          border: 'border-indigo-200'
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
        <div className="bg-white rounded-lg max-w-5xl w-full h-[90vh] flex flex-col">
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                      {shops.reduce((sum, shop) => sum + (shop.eightPM || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">8PM Cases</div>
                  </div>
                  <div className={`${typeStyles.bg} p-4 rounded-lg text-center border ${typeStyles.border}`}>
                    <div className={`text-2xl font-bold ${typeStyles.text}`}>
                      {shops.reduce((sum, shop) => sum + (shop.verve || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">VERVE Cases</div>
                  </div>
                </div>

                {/* Monthly Data Summary (if monthly type) */}
                {type === 'monthly' && monthData && (
                  <div className="mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h4 className="font-medium text-indigo-800 mb-2">📅 {monthData.month} 2025 Department Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold text-indigo-600">{monthData.total.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Total Cases</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-purple-600">{monthData.eightPM.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">8PM Cases</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-orange-600">{monthData.verve.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">VERVE Cases</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Department Performance Insights */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">🏢 {department} Department Insights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Performance Metrics:</div>
                      <div className="text-gray-600">
                        • Average per shop: {shops.length > 0 ? Math.round(shops.reduce((sum, shop) => sum + (shop.total || 0), 0) / shops.length) : 0} cases
                      </div>
                      <div className="text-gray-600">
                        • 8PM dominance: {shops.reduce((sum, shop) => sum + (shop.total || 0), 0) > 0 ? 
                          ((shops.reduce((sum, shop) => sum + (shop.eightPM || 0), 0) / shops.reduce((sum, shop) => sum + (shop.total || 0), 0)) * 100).toFixed(1) : 0}%
                      </div>
                      <div className="text-gray-600">
                        • VERVE penetration: {shops.filter(shop => (shop.verve || 0) > 0).length} shops ({shops.length > 0 ? ((shops.filter(shop => (shop.verve || 0) > 0).length / shops.length) * 100).toFixed(1) : 0}%)
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Salesmen Coverage:</div>
                      {Array.from(new Set(shops.map(shop => shop.salesman))).slice(0, 3).map(salesman => {
                        const salesmanShops = shops.filter(shop => shop.salesman === salesman);
                        return (
                          <div key={salesman} className="text-gray-600">
                            • {salesman}: {salesmanShops.length} shops
                          </div>
                        );
                      })}
                      {Array.from(new Set(shops.map(shop => shop.salesman))).length > 3 && (
                        <div className="text-gray-600">• +{Array.from(new Set(shops.map(shop => shop.salesman))).length - 3} more salesmen</div>
                      )}
                    </div>
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cases</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">8PM Cases</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VERVE Cases</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Mix</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {shop.salesman || 'Unknown'}
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
                              {shop.total > 0 ? (
                                <div className="flex space-x-1">
                                  <div 
                                    className="h-3 bg-purple-600 rounded" 
                                    style={{ width: `${Math.max(10, (shop.eightPM || 0) / shop.total * 40)}px` }}
                                    title={`8PM: ${((shop.eightPM || 0) / shop.total * 100).toFixed(1)}%`}
                                  ></div>
                                  <div 
                                    className="h-3 bg-orange-600 rounded" 
                                    style={{ width: `${Math.max(10, (shop.verve || 0) / shop.total * 40)}px` }}
                                    title={`VERVE: ${((shop.verve || 0) / shop.total * 100).toFixed(1)}%`}
                                  ></div>
                                </div>
                              ) : (
                                <span className="text-gray-400">No sales</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {(shop.eightPM || 0) > 0 && (shop.verve || 0) > 0 ? (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Both Brands</span>
                              ) : (shop.eightPM || 0) > 0 ? (
                                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">8PM Only</span>
                              ) : (shop.verve || 0) > 0 ? (
                                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">VERVE Only</span>
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

                {/* Actionable Insights by Type */}
                {type === 'inactive' && (
                  <div className="mt-6 bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">⚠️ Inactive Shops - Action Required</h4>
                    <p className="text-sm text-red-700">
                      These {shops.length} shops in {department} have zero sales. Priority actions: 
                      Visit shops, understand barriers, verify shop details, check competition, and develop recovery plans.
                    </p>
                  </div>
                )}

                {type === '8pm' && (
                  <div className="mt-6 bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">🟣 8PM Strong Territory</h4>
                    <p className="text-sm text-purple-700">
                      {department} shows strong 8PM performance with {shops.length} buying shops. 
                      Consider introducing VERVE to these existing 8PM customers for cross-selling opportunities.
                    </p>
                  </div>
                )}

                {type === 'verve' && (
                  <div className="mt-6 bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-800 mb-2">🟠 VERVE Growth Potential</h4>
                    <p className="text-sm text-orange-700">
                      {shops.length} shops in {department} buy VERVE. Analyze what makes this department 
                      VERVE-friendly and replicate success in other territories.
                    </p>
                  </div>
                )}

                {type === 'both' && (
                  <div className="mt-6 bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">🎉 Cross-Selling Champions</h4>
                    <p className="text-sm text-green-700">
                      These {shops.length} shops in {department} buy both brands - your most valuable customers! 
                      Study their success factors and replicate across other shops.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t p-4 sm:p-6 flex justify-end space-x-3 flex-shrink-0">
            <button
              onClick={() => {
                const csvContent = shops.map(shop => 
                  `${shop.shopName},${shop.salesman},${shop.total},${shop.eightPM || 0},${shop.verve || 0}`
                ).join('\n');
                const header = 'Shop Name,Salesman,Total Cases,8PM Cases,VERVE Cases\n';
                const blob = new Blob([header + csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${department}_${type}_shops.csv`;
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

  return (
    <div className="space-y-6">
      {/* Department Performance Overview */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Department Performance Overview - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.deptPerformance).map(([dept, performance]) => {
            const coveragePercent = (performance.billedShops / performance.totalShops) * 100;
            const deptShops = departmentShopsData[dept];
            
            return (
              <div key={dept} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-medium text-gray-900 mb-2 truncate">{dept}</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => handleDepartmentShopsClick(
                      dept,
                      `${dept} Department - All Shops`,
                      `${deptShops?.allShops.length || 0} total shops in ${dept} department`,
                      deptShops?.allShops || [],
                      'all'
                    )}
                    className="text-xl sm:text-2xl font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    {performance.sales.toLocaleString()}
                  </button>
                  <div className="text-sm text-gray-500">Total Sales</div>
                  <div className="text-sm">
                    <button
                      onClick={() => handleDepartmentShopsClick(
                        dept,
                        `${dept} Department - Coverage Breakdown`,
                        `${performance.billedShops} active shops out of ${performance.totalShops} total`,
                        deptShops?.activeShops || [],
                        'active'
                      )}
                      className="font-medium text-green-600 hover:text-green-800 hover:underline cursor-pointer"
                    >
                      {performance.billedShops}
                    </button>
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

      {/* Department Performance Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Department Performance Analysis - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
          <p className="text-sm text-gray-500">Coverage and sales performance by territory (click numbers for details)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Shops</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Shops</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg per Shop</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">8PM Share</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VERVE Share</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(data.deptPerformance).map(([dept, performance]) => {
                const coveragePercent = (performance.billedShops / performance.totalShops) * 100;
                const avgPerShop = performance.billedShops > 0 ? (performance.sales / performance.billedShops).toFixed(1) : 0;
                
                const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept && shop.total > 0);
                const dept8PM = deptShops.reduce((sum: number, shop: any) => sum + shop.eightPM, 0);
                const deptVERVE = deptShops.reduce((sum: number, shop: any) => sum + shop.verve, 0);
                const deptTotal = dept8PM + deptVERVE;
                const eightPMShare = deptTotal > 0 ? ((dept8PM / deptTotal) * 100).toFixed(1) : '0';
                const verveShare = deptTotal > 0 ? ((deptVERVE / deptTotal) * 100).toFixed(1) : '0';
                
                const deptData = departmentShopsData[dept];
                
                return (
                  <tr key={dept} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{performance.totalShops}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleDepartmentShopsClick(
                            dept,
                            `${dept} - Active Shops`,
                            `${performance.billedShops} shops with sales in ${dept}`,
                            deptData?.activeShops || [],
                            'active'
                          )}
                          className="text-green-600 hover:text-green-800 hover:underline cursor-pointer font-medium"
                        >
                          {performance.billedShops}
                        </button>
                        {deptData?.inactiveShops.length > 0 && (
                          <span className="text-gray-400">
                            (<button
                              onClick={() => handleDepartmentShopsClick(
                                dept,
                                `${dept} - Inactive Shops`,
                                `${deptData.inactiveShops.length} shops with zero sales need attention`,
                                deptData.inactiveShops,
                                'inactive'
                              )}
                              className="text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                            >
                              {deptData.inactiveShops.length} inactive
                            </button>)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      <button
                        onClick={() => handleDepartmentShopsClick(
                          dept,
                          `${dept} Department - All Shops`,
                          `Complete shop list for ${dept} department (${performance.sales.toLocaleString()} total cases)`,
                          deptData?.allShops || [],
                          'all'
                        )}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {performance.sales.toLocaleString()}
                      </button>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{avgPerShop}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                      <button
                        onClick={() => handleDepartmentShopsClick(
                          dept,
                          `${dept} - 8PM Buyers`,
                          `${deptData?.shops8PM.length || 0} shops buying 8PM in ${dept}`,
                          deptData?.shops8PM || [],
                          '8pm'
                        )}
                        className="hover:text-purple-800 hover:underline cursor-pointer"
                      >
                        {eightPMShare}%
                      </button>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                      <button
                        onClick={() => handleDepartmentShopsClick(
                          dept,
                          `${dept} - VERVE Buyers`,
                          `${deptData?.shopsVERVE.length || 0} shops buying VERVE in ${dept}`,
                          deptData?.shopsVERVE || [],
                          'verve'
                        )}
                        className="hover:text-orange-800 hover:underline cursor-pointer"
                      >
                        {verveShare}%
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-Month Historical Department Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">3-Month Department Trend (Mar-Apr-May {data.currentYear})</h3>
          <p className="text-sm text-gray-500">Historical sales performance by department (click for monthly details)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">March Sales</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">April Sales</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">May Sales</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3-Month Avg</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(data.deptPerformance).map(([dept, performance]) => {
                // Calculate historical data for this department
                const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept);
                const marchTotal = deptShops.reduce((sum: number, shop: any) => sum + (shop.marchTotal || 0), 0);
                const aprilTotal = deptShops.reduce((sum: number, shop: any) => sum + (shop.aprilTotal || 0), 0);
                const mayTotal = deptShops.reduce((sum: number, shop: any) => sum + (shop.mayTotal || 0), 0);
                const avg3Month = ((marchTotal + aprilTotal + mayTotal) / 3).toFixed(0);
                
                const marchEightPM = deptShops.reduce((sum: number, shop: any) => sum + (shop.marchEightPM || 0), 0);
                const marchVERVE = deptShops.reduce((sum: number, shop: any) => sum + (shop.marchVerve || 0), 0);
                const aprilEightPM = deptShops.reduce((sum: number, shop: any) => sum + (shop.aprilEightPM || 0), 0);
                const aprilVERVE = deptShops.reduce((sum: number, shop: any) => sum + (shop.aprilVerve || 0), 0);
                const mayEightPM = deptShops.reduce((sum: number, shop: any) => sum + (shop.mayEightPM || 0), 0);
                const mayVERVE = deptShops.reduce((sum: number, shop: any) => sum + (shop.mayVerve || 0), 0);
                
                const trend = mayTotal > aprilTotal && aprilTotal > marchTotal ? 'improving' :
                            mayTotal < aprilTotal && aprilTotal < marchTotal ? 'declining' : 'stable';
                
                const deptData = departmentShopsData[dept];
                
                return (
                  <tr key={dept} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleDepartmentShopsClick(
                          dept,
                          `${dept} - March 2025 Performance`,
                          `March sales breakdown for ${dept} department`,
                          deptData?.allShops || [],
                          'monthly',
                          { month: 'March', total: marchTotal, eightPM: marchEightPM, verve: marchVERVE }
                        )}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {marchTotal.toLocaleString()}
                      </button>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleDepartmentShopsClick(
                          dept,
                          `${dept} - April 2025 Performance`,
                          `April sales breakdown for ${dept} department`,
                          deptData?.allShops || [],
                          'monthly',
                          { month: 'April', total: aprilTotal, eightPM: aprilEightPM, verve: aprilVERVE }
                        )}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {aprilTotal.toLocaleString()}
                      </button>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleDepartmentShopsClick(
                          dept,
                          `${dept} - May 2025 Performance`,
                          `May sales breakdown for ${dept} department`,
                          deptData?.allShops || [],
                          'monthly',
                          { month: 'May', total: mayTotal, eightPM: mayEightPM, verve: mayVERVE }
                        )}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {mayTotal.toLocaleString()}
                      </button>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{avg3Month}</td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        trend === 'improving' ? 'bg-green-100 text-green-800' :
                        trend === 'declining' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {trend === 'improving' ? '📈 Growing' : trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Brand Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">8PM Performance by Department</h3>
            <p className="text-sm text-gray-500">Brand distribution across territories (click bars for shop details)</p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {Object.entries(data.deptPerformance).map(([dept, performance]) => {
                const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept && shop.total > 0);
                const dept8PM = deptShops.reduce((sum: number, shop: any) => sum + shop.eightPM, 0);
                const sharePercent = data.summary.total8PM > 0 ? (dept8PM / data.summary.total8PM) * 100 : 0;
                const deptData = departmentShopsData[dept];
                
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate flex-1 mr-2">{dept}</span>
                      <span className="whitespace-nowrap">{dept8PM.toLocaleString()} cases ({sharePercent.toFixed(1)}%)</span>
                    </div>
                    <button
                      onClick={() => handleDepartmentShopsClick(
                        dept,
                        `${dept} - 8PM Buyers`,
                        `${deptData?.shops8PM.length || 0} shops buying 8PM in ${dept} (${dept8PM.toLocaleString()} cases)`,
                        deptData?.shops8PM || [],
                        '8pm'
                      )}
                      className="w-full bg-gray-200 rounded-full h-2 hover:bg-gray-300 transition-colors cursor-pointer"
                    >
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${sharePercent}%` }}
                      ></div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">VERVE Performance by Department</h3>
            <p className="text-sm text-gray-500">Brand distribution across territories (click bars for shop details)</p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {Object.entries(data.deptPerformance).map(([dept, performance]) => {
                const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept && shop.total > 0);
                const deptVERVE = deptShops.reduce((sum: number, shop: any) => sum + shop.verve, 0);
                const sharePercent = data.summary.totalVERVE > 0 ? (deptVERVE / data.summary.totalVERVE) * 100 : 0;
                const deptData = departmentShopsData[dept];
                
                return (
                  <div key={dept}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate flex-1 mr-2">{dept}</span>
                      <span className="whitespace-nowrap">{deptVERVE.toLocaleString()} cases ({sharePercent.toFixed(1)}%)</span>
                    </div>
                    <button
                      onClick={() => handleDepartmentShopsClick(
                        dept,
                        `${dept} - VERVE Buyers`,
                        `${deptData?.shopsVERVE.length || 0} shops buying VERVE in ${dept} (${deptVERVE.toLocaleString()} cases)`,
                        deptData?.shopsVERVE || [],
                        'verve'
                      )}
                      className="w-full bg-gray-200 rounded-full h-2 hover:bg-gray-300 transition-colors cursor-pointer"
                    >
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${sharePercent}%` }}
                      ></div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Department Performance Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Department Analysis Summary - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.deptPerformance).slice(0, 4).map(([dept, performance]) => {
            const coveragePercent = (performance.billedShops / performance.totalShops) * 100;
            const deptShops = Object.values(data.salesData).filter((shop: any) => shop.department === dept);
            const marchTotal = deptShops.reduce((sum: number, shop: any) => sum + (shop.marchTotal || 0), 0);
            const aprilTotal = deptShops.reduce((sum: number, shop: any) => sum + (shop.aprilTotal || 0), 0);
            const mayTotal = deptShops.reduce((sum: number, shop: any) => sum + (shop.mayTotal || 0), 0);
            const trend = mayTotal > aprilTotal && aprilTotal > marchTotal ? '📈' :
                        mayTotal < aprilTotal && aprilTotal < marchTotal ? '📉' : '➡️';
            const deptData = departmentShopsData[dept];
            
            return (
              <button
                key={dept}
                onClick={() => handleDepartmentShopsClick(
                  dept,
                  `${dept} Department Overview`,
                  `Complete department analysis for ${dept}`,
                  deptData?.allShops || [],
                  'all'
                )}
                className="text-center bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="text-lg font-bold text-gray-900 mb-1">{dept}</div>
                <div className="text-sm text-blue-600 font-medium">{performance.sales.toLocaleString()} cases</div>
                <div className="text-xs text-gray-500">{coveragePercent.toFixed(1)}% coverage</div>
                <div className="text-lg mt-2">{trend}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showDepartmentShops && (
        <DepartmentShopsModal 
          onClose={() => {
            setShowDepartmentShops(false);
            setSelectedDepartmentShops(null);
          }} 
        />
      )}
    </div>
  );
};

export default DepartmentTab;
