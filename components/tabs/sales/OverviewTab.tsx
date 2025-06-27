'use client';

import React from 'react';
import { ShoppingBag, TrendingUp, BarChart3, Target, Users, Zap, Award, PieChart } from 'lucide-react';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface CustomerInsights {
  firstTimeCustomers: number;
  lostCustomers: number;
  consistentPerformers: number;
  decliningPerformers: number;
}

interface ShopData {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  total: number;
  eightPM: number;
  verve: number;
  juneLastYearTotal?: number;
  juneLastYearEightPM?: number;
  juneLastYearVerve?: number;
  // Enhanced historical data for Q1 calculations
  marchTotal?: number;
  marchEightPM?: number;
  marchVerve?: number;
  aprilTotal?: number;
  aprilEightPM?: number;
  aprilVerve?: number;
  mayTotal?: number;
  mayEightPM?: number;
  mayVerve?: number;
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
// ENHANCED METRIC CARD COMPONENT
// ==========================================

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color, 
  trend,
  trendValue,
  onClick 
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onClick?: () => void;
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600',
    indigo: 'bg-indigo-600'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div 
      className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
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
              {trend && trendValue && (
                <dd className={`text-xs sm:text-sm font-medium ${trendColors[trend]}`}>
                  {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
                </dd>
              )}
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
  
  // ==========================================
  // ENHANCED CALCULATIONS
  // ==========================================
  
  // Brand-wise Market Coverage Calculations
  const shopsWithAnyOrder = data.allShopsComparison.filter(shop => shop.total > 0);
  const shopsWith8PM = data.allShopsComparison.filter(shop => shop.eightPM > 0);
  const shopsWithVERVE = data.allShopsComparison.filter(shop => shop.verve > 0);
  const shopsWithBothBrands = data.allShopsComparison.filter(shop => shop.eightPM > 0 && shop.verve > 0);
  
  const coverage8PM = ((shopsWith8PM.length / data.summary.totalShops) * 100).toFixed(1);
  const coverageVERVE = ((shopsWithVERVE.length / data.summary.totalShops) * 100).toFixed(1);
  const crossSellingRate = shopsWithAnyOrder.length > 0 ? ((shopsWithBothBrands.length / shopsWithAnyOrder.length) * 100).toFixed(1) : '0';
  
  // Q1 Quarterly Calculations (Mar + Apr + May vs Current Month)
  const currentQ1_8PM = data.allShopsComparison.reduce((sum, shop) => 
    sum + (shop.marchEightPM || 0) + (shop.aprilEightPM || 0) + (shop.mayEightPM || 0), 0
  );
  const currentQ1_VERVE = data.allShopsComparison.reduce((sum, shop) => 
    sum + (shop.marchVerve || 0) + (shop.aprilVerve || 0) + (shop.mayVerve || 0), 0
  );
  const currentQ1_Total = currentQ1_8PM + currentQ1_VERVE;
  
  // Last Year Q1 (using June last year as proxy for quarterly comparison)
  const lastYearQ1_8PM = data.summary.lastYearTotal8PM || 0;
  const lastYearQ1_VERVE = data.summary.lastYearTotalVERVE || 0;
  const lastYearQ1_Total = lastYearQ1_8PM + lastYearQ1_VERVE;
  
  // Q1 Growth Calculations
  const q1Growth8PM = lastYearQ1_8PM > 0 ? (((currentQ1_8PM - lastYearQ1_8PM) / lastYearQ1_8PM) * 100).toFixed(1) : '0';
  const q1GrowthVERVE = lastYearQ1_VERVE > 0 ? (((currentQ1_VERVE - lastYearQ1_VERVE) / lastYearQ1_VERVE) * 100).toFixed(1) : '0';
  const q1GrowthTotal = lastYearQ1_Total > 0 ? (((currentQ1_Total - lastYearQ1_Total) / lastYearQ1_Total) * 100).toFixed(1) : '0';
  
  // Average Cases per Shop by Brand
  const avg8PMPerShop = shopsWith8PM.length > 0 ? (data.summary.total8PM / shopsWith8PM.length).toFixed(1) : '0';
  const avgVERVEPerShop = shopsWithVERVE.length > 0 ? (data.summary.totalVERVE / shopsWithVERVE.length).toFixed(1) : '0';
  
  // Sales Velocity (current month vs 3-month average)
  const threeMonthAvg8PM = currentQ1_8PM / 3;
  const threeMonthAvgVERVE = currentQ1_VERVE / 3;
  const velocity8PM = threeMonthAvg8PM > 0 ? ((data.summary.total8PM / threeMonthAvg8PM) * 100).toFixed(0) : '0';
  const velocityVERVE = threeMonthAvgVERVE > 0 ? ((data.summary.totalVERVE / threeMonthAvgVERVE) * 100).toFixed(0) : '0';

  return (
    <div className="space-y-6">
      {/* Main Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Total Market Coverage"
          value={`${data.summary.coverage}%`}
          subtitle={`${data.summary.billedShops} of ${data.summary.totalShops} shops`}
          icon={ShoppingBag}
          color="blue"
          trend={parseFloat(data.summary.coverage) > 70 ? 'up' : parseFloat(data.summary.coverage) > 50 ? 'neutral' : 'down'}
          trendValue={`${data.summary.billedShops} active shops`}
        />
        
        <MetricCard
          title="8PM Market Penetration"
          value={`${coverage8PM}%`}
          subtitle={`${shopsWith8PM.length} shops selling 8PM`}
          icon={Target}
          color="purple"
          trend={parseFloat(coverage8PM) > 60 ? 'up' : parseFloat(coverage8PM) > 40 ? 'neutral' : 'down'}
          trendValue={`${avg8PMPerShop} avg cases/shop`}
        />
        
        <MetricCard
          title="VERVE Market Penetration"
          value={`${coverageVERVE}%`}
          subtitle={`${shopsWithVERVE.length} shops selling VERVE`}
          icon={Zap}
          color="orange"
          trend={parseFloat(coverageVERVE) > 30 ? 'up' : parseFloat(coverageVERVE) > 15 ? 'neutral' : 'down'}
          trendValue={`${avgVERVEPerShop} avg cases/shop`}
        />
        
        <MetricCard
          title="Cross-Selling Success"
          value={`${crossSellingRate}%`}
          subtitle={`${shopsWithBothBrands.length} shops buying both brands`}
          icon={Award}
          color="green"
          trend={parseFloat(crossSellingRate) > 40 ? 'up' : parseFloat(crossSellingRate) > 25 ? 'neutral' : 'down'}
          trendValue={`${shopsWithBothBrands.length} dual-brand shops`}
        />
      </div>

      {/* NEW: Q1 Quarterly Performance Comparison */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Q1 Performance: 2024 vs 2025 (Mar-Apr-May)
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 8PM Q1 Comparison */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-800 mb-3">8PM Quarterly Performance</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Q1 FY2024:</span>
                <span className="font-medium text-gray-900">{lastYearQ1_8PM.toLocaleString()} cases</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Q1 FY2025:</span>
                <span className="font-bold text-purple-600">{currentQ1_8PM.toLocaleString()} cases</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium text-gray-700">YoY Growth:</span>
                <span className={`font-bold ${parseFloat(q1Growth8PM) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(q1Growth8PM) >= 0 ? '+' : ''}{q1Growth8PM}%
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Current month: {data.summary.total8PM.toLocaleString()} cases
              </div>
            </div>
          </div>

          {/* VERVE Q1 Comparison */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-medium text-orange-800 mb-3">VERVE Quarterly Performance</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Q1 FY2024:</span>
                <span className="font-medium text-gray-900">{lastYearQ1_VERVE.toLocaleString()} cases</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Q1 FY2025:</span>
                <span className="font-bold text-orange-600">{currentQ1_VERVE.toLocaleString()} cases</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium text-gray-700">YoY Growth:</span>
                <span className={`font-bold ${parseFloat(q1GrowthVERVE) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(q1GrowthVERVE) >= 0 ? '+' : ''}{q1GrowthVERVE}%
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Current month: {data.summary.totalVERVE.toLocaleString()} cases
              </div>
            </div>
          </div>

          {/* Combined Q1 Performance */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-3">Combined Q1 Performance</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Q1 FY2024:</span>
                <span className="font-medium text-gray-900">{lastYearQ1_Total.toLocaleString()} cases</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Q1 FY2025:</span>
                <span className="font-bold text-blue-600">{currentQ1_Total.toLocaleString()} cases</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium text-gray-700">YoY Growth:</span>
                <span className={`font-bold ${parseFloat(q1GrowthTotal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(q1GrowthTotal) >= 0 ? '+' : ''}{q1GrowthTotal}%
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Current month: {data.summary.totalSales.toLocaleString()} cases
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Brand Performance Cards with Target Achievement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-600" />
            8PM Performance - {getMonthName(data.currentMonth)} {data.currentYear}
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Sales vs Target</span>
                <span className="font-medium">{data.summary.eightPmAchievement}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-600 h-3 rounded-full transition-all duration-500" 
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

            {/* NEW: Enhanced metrics */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t text-center">
              <div>
                <div className="text-lg font-bold text-purple-600">{shopsWith8PM.length}</div>
                <div className="text-xs text-gray-500">Active Shops</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">{velocity8PM}%</div>
                <div className="text-xs text-gray-500">Sales Velocity</div>
              </div>
            </div>
            
            {/* YoY Comparison */}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>vs Last Year</span>
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
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-orange-600" />
            VERVE Performance - {getMonthName(data.currentMonth)} {data.currentYear}
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Sales vs Target</span>
                <span className="font-medium">{data.summary.verveAchievement}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-orange-600 h-3 rounded-full transition-all duration-500" 
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

            {/* NEW: Enhanced metrics */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t text-center">
              <div>
                <div className="text-lg font-bold text-orange-600">{shopsWithVERVE.length}</div>
                <div className="text-xs text-gray-500">Active Shops</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">{velocityVERVE}%</div>
                <div className="text-xs text-gray-500">Sales Velocity</div>
              </div>
            </div>
            
            {/* YoY Comparison */}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>vs Last Year</span>
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

      {/* NEW: Market Intelligence Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Market Intelligence
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>8PM Market Share</span>
                <span>{((data.summary.total8PM / data.summary.totalSales) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(data.summary.total8PM / data.summary.totalSales) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>VERVE Market Share</span>
                <span>{((data.summary.totalVERVE / data.summary.totalSales) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(data.summary.totalVERVE / data.summary.totalSales) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Market Penetration Insights */}
            <div className="pt-3 border-t">
              <h4 className="font-medium text-gray-700 mb-2">Penetration Analysis</h4>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-purple-50 p-2 rounded">
                  <div className="text-sm font-bold text-purple-600">{coverage8PM}%</div>
                  <div className="text-xs text-gray-600">8PM Reach</div>
                </div>
                <div className="bg-orange-50 p-2 rounded">
                  <div className="text-sm font-bold text-orange-600">{coverageVERVE}%</div>
                  <div className="text-xs text-gray-600">VERVE Reach</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Customer Journey Insights
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-green-600">{data.customerInsights.firstTimeCustomers}</div>
                <div className="text-xs text-gray-600">New Customers</div>
                <div className="text-xs text-gray-400">This month</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-600">{data.customerInsights.lostCustomers}</div>
                <div className="text-xs text-gray-600">Lost Customers</div>
                <div className="text-xs text-gray-400">Need attention</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-blue-600">{data.customerInsights.consistentPerformers}</div>
                <div className="text-xs text-gray-600">Consistent</div>
                <div className="text-xs text-gray-400">Growing/Stable</div>
              </div>
              <div>
                <div className="text-xl font-bold text-orange-600">{data.customerInsights.decliningPerformers}</div>
                <div className="text-xs text-gray-600">At Risk</div>
                <div className="text-xs text-gray-400">Declining trend</div>
              </div>
            </div>

            {/* Cross-selling opportunity */}
            <div className="pt-3 border-t">
              <h4 className="font-medium text-gray-700 mb-2">Cross-Selling Opportunity</h4>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{shopsWithAnyOrder.length - shopsWithBothBrands.length}</div>
                  <div className="text-xs text-gray-600">Single-brand shops</div>
                  <div className="text-xs text-gray-500">Potential for cross-selling</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary - Enhanced */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Executive Summary - {getMonthName(data.currentMonth)} {data.currentYear}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.summary.totalSales.toLocaleString()}</div>
            <div className="text-xs text-gray-600">Total Cases</div>
            <div className="text-xs text-gray-400">This month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.summary.coverage}%</div>
            <div className="text-xs text-gray-600">Market Coverage</div>
            <div className="text-xs text-gray-400">Overall reach</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{coverage8PM}%</div>
            <div className="text-xs text-gray-600">8PM Penetration</div>
            <div className="text-xs text-gray-400">Brand reach</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{coverageVERVE}%</div>
            <div className="text-xs text-gray-600">VERVE Penetration</div>
            <div className="text-xs text-gray-400">Brand reach</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{crossSellingRate}%</div>
            <div className="text-xs text-gray-600">Cross-Selling</div>
            <div className="text-xs text-gray-400">Both brands</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${parseFloat(q1GrowthTotal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {parseFloat(q1GrowthTotal) >= 0 ? '+' : ''}{q1GrowthTotal}%
            </div>
            <div className="text-xs text-gray-600">Q1 YoY Growth</div>
            <div className="text-xs text-gray-400">vs last year</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
