'use client';

import React from 'react';
import { ShoppingBag, TrendingUp, BarChart3 } from 'lucide-react';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface CustomerInsights {
  firstTimeCustomers: number;
  lostCustomers: number;
  consistentPerformers: number;
  decliningPerformers: number;
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
    lastYearTotal8PM?: number;
    lastYearTotalVERVE?: number;
    yoy8PMGrowth?: string;
    yoyVerveGrowth?: string;
  };
  topShops: any[];
  customerInsights: CustomerInsights;
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
// INTERNAL METRIC CARD COMPONENT
// ==========================================

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
      <div className="p-4 sm:p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <div className="ml-4 sm:ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg sm:text-xl font-bold text-gray-900">{value}</dd>
              {subtitle && <dd className="text-xs sm:text-sm text-gray-500">{subtitle}</dd>}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const OverviewTab = ({ data }: { data: DashboardData }) => {
  return (
    <div className="space-y-6">
      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
          subtitle={`${data.summary.eightPmAchievement}% achievement | YoY: ${data.summary.yoy8PMGrowth}%`}
          icon={BarChart3}
          color="purple"
        />
        <MetricCard
          title="VERVE Sales"
          value={`${data.summary.totalVERVE.toLocaleString()} cases`}
          subtitle={`${data.summary.verveAchievement}% achievement | YoY: ${data.summary.yoyVerveGrowth}%`}
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Enhanced Sales vs Target Cards with YoY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">8PM Performance - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Sales vs Target</span>
                <span>{data.summary.eightPmAchievement}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(parseFloat(data.summary.eightPmAchievement), 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{data.summary.total8PM.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Achieved</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-400">{data.summary.total8PMTarget.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Target</div>
              </div>
            </div>
            {/* YoY Comparison */}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>vs Last Year ({getMonthName(data.currentMonth)} 2024)</span>
                <span className={`font-medium ${parseFloat(data.summary.yoy8PMGrowth || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(data.summary.yoy8PMGrowth || '0') >= 0 ? '+' : ''}{data.summary.yoy8PMGrowth || '0'}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last year: {data.summary.lastYearTotal8PM?.toLocaleString() || 0} cases
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">VERVE Performance - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Sales vs Target</span>
                <span>{data.summary.verveAchievement}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(parseFloat(data.summary.verveAchievement), 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-orange-600">{data.summary.totalVERVE.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Achieved</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-gray-400">{data.summary.totalVerveTarget.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Target</div>
              </div>
            </div>
            {/* YoY Comparison */}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>vs Last Year ({getMonthName(data.currentMonth)} 2024)</span>
                <span className={`font-medium ${parseFloat(data.summary.yoyVerveGrowth || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(data.summary.yoyVerveGrowth || '0') >= 0 ? '+' : ''}{data.summary.yoyVerveGrowth || '0'}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last year: {data.summary.lastYearTotalVERVE?.toLocaleString() || 0} cases
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Brand Distribution and Achievement Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Distribution - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>8PM Family</span>
                <span>{((data.summary.total8PM / data.summary.totalSales) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${(data.summary.total8PM / data.summary.totalSales) * 100}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500 mt-1">{data.summary.total8PM.toLocaleString()} cases</div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>VERVE Family</span>
                <span>{((data.summary.totalVERVE / data.summary.totalSales) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-orange-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${(data.summary.totalVERVE / data.summary.totalSales) * 100}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500 mt-1">{data.summary.totalVERVE.toLocaleString()} cases</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Achievement Summary - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
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
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">YoY Growth:</span>
              <span className={`text-lg font-bold ${
                parseFloat(data.summary.yoy8PMGrowth || '0') >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {parseFloat(data.summary.yoy8PMGrowth || '0') >= 0 ? '+' : ''}{data.summary.yoy8PMGrowth || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Statistics */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Statistics - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{data.summary.totalSales.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Cases Sold</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{data.summary.coverage}%</div>
            <div className="text-sm text-gray-500">Market Coverage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">{data.topShops.length}</div>
            <div className="text-sm text-gray-500">Active Shops</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-orange-600">{data.customerInsights.firstTimeCustomers}</div>
            <div className="text-sm text-gray-500">New Customers</div>
          </div>
        </div>
      </div>

      {/* Enhanced Customer Insights Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Rolling 4-Month Customer Journey Analysis</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{data.customerInsights.firstTimeCustomers}</div>
            <div className="text-xs text-gray-600">New Customers</div>
            <div className="text-xs text-gray-400">Started billing in {getMonthName(data.currentMonth)}</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{data.customerInsights.lostCustomers}</div>
            <div className="text-xs text-gray-600">Lost Customers</div>
            <div className="text-xs text-gray-400">Active in May, not in {getMonthName(data.currentMonth)}</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{data.customerInsights.consistentPerformers}</div>
            <div className="text-xs text-gray-600">Consistent</div>
            <div className="text-xs text-gray-400">Stable or growing</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{data.customerInsights.decliningPerformers}</div>
            <div className="text-xs text-gray-600">Declining</div>
            <div className="text-xs text-gray-400">Negative trend</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
