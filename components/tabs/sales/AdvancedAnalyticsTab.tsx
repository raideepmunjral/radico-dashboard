'use client';

import React, { useState } from 'react';
import { Brain, BarChart3, Heart, Zap, Target } from 'lucide-react';

// REGULAR IMPORTS - NO LAZY LOADING
import CurrentAnalytics from './advanced-analytics/CurrentAnalytics';
import CustomerHealth from './advanced-analytics/CustomerHealth';
import SKURecoveryIntelligence from './advanced-analytics/SKURecoveryIntelligence';
import SKUIntelligence from './advanced-analytics/SKUIntelligence';

// Sub-tab configuration
const subTabs = [
  { 
    id: 'current', 
    label: 'Current Analytics', 
    icon: BarChart3,
    description: 'Rolling 4-month comparison & shop rankings'
  },
  { 
    id: 'customer-health', 
    label: 'Customer Health', 
    icon: Heart,
    description: 'Unbilled, lost customers & lifecycle analysis'
  },
  { 
    id: 'sku-recovery', 
    label: 'SKU Recovery Intelligence', 
    icon: Target,
    description: 'Advanced SKU-level customer recovery with real historical data'
  },
  { 
    id: 'sku-intelligence', 
    label: 'SKU Intelligence', 
    icon: Zap,
    description: 'Cross-selling opportunities & variant analysis'
  }
];

interface DashboardData {
  allShopsComparison: any[];
  customerInsights: any;
  currentMonth: string;
  currentYear: string;
  historicalData?: any; // ENHANCED: Include historical data for extended lookback periods
}

interface InventoryData {
  shops: Record<string, {
    shopId: string;
    shopName: string;
    department: string;
    salesman: string;
    visitDate: Date;
    items: Record<string, {
      brand: string;
      quantity: number;
      isInStock: boolean;
      isOutOfStock: boolean;
      reasonNoStock?: string;
      suppliedAfterOutOfStock?: boolean;
      ageInDays?: number;
      lastSupplyDate?: Date;
    }>;
    lastVisitDays: number;
  }>;
}

const AdvancedAnalyticsTab = ({ data, inventoryData }: { 
  data: DashboardData; 
  inventoryData?: InventoryData;
}) => {
  const [activeSubTab, setActiveSubTab] = useState('current');

  // Render active sub-tab content - NO SUSPENSE NEEDED
  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'current':
        return <CurrentAnalytics data={data} />;
      case 'customer-health':
        return <CustomerHealth data={data} />;
      case 'sku-recovery':
        return <SKURecoveryIntelligence data={data} inventoryData={inventoryData} />;
      case 'sku-intelligence':
        return <SKUIntelligence data={data} />;
      default:
        return <CurrentAnalytics data={data} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-blue-600" />
                Advanced Analytics & Intelligence
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {subTabs.find(tab => tab.id === activeSubTab)?.description}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">
                {data?.currentMonth ? `${data.currentMonth}/${data.currentYear}` : 'Live Data'}
              </span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Live Data"></div>
              
              {/* ENHANCED: Show inventory connection status */}
              {inventoryData && activeSubTab === 'sku-recovery' && (
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Inventory Connected</span>
                </div>
              )}
              
              {/* NEW: Show extended historical data availability */}
              {data?.historicalData && activeSubTab === 'sku-recovery' && (
                <div className="flex items-center space-x-1 text-xs text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Extended Historical Data</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sub-tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap border-b-2 ${
                activeSubTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'customer-health' && data?.customerInsights?.lostCustomers && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {data.customerInsights.lostCustomers}
                </span>
              )}
              {/* ENHANCED: Updated badge for SKU Recovery */}
              {tab.id === 'sku-recovery' && (
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  ENHANCED
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tab Content */}
      <div className="min-h-[500px]">
        {renderSubTabContent()}
      </div>
    </div>
  );
};

export default AdvancedAnalyticsTab;
