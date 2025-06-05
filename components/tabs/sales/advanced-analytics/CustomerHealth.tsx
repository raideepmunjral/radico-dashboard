'use client';

import React from 'react';
import { Heart, AlertTriangle } from 'lucide-react';

interface DashboardData {
  allShopsComparison: any[];
  customerInsights: any;
  currentMonth: string;
  currentYear: string;
}

const CustomerHealth = ({ data }: { data: DashboardData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <Heart className="w-5 h-5 mr-2 text-red-500" />
            Customer Health Dashboard
          </h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">8PM</button>
            <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">VERVE</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-medium text-orange-800">Unbilled This Month</h4>
            <div className="text-2xl font-bold text-orange-600 mt-2">
              {data?.customerInsights?.lostCustomers || 0}
            </div>
            <p className="text-sm text-orange-600">June non-buyers</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-800">Lost Customers (2+ months)</h4>
            <div className="text-2xl font-bold text-red-600 mt-2">89</div>
            <p className="text-sm text-red-600">No orders since April</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800">Quarterly Declining</h4>
            <div className="text-2xl font-bold text-yellow-600 mt-2">156</div>
            <p className="text-sm text-yellow-600">Q1 vs Q2 decline</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
          <h4 className="font-medium">Coming Soon</h4>
        </div>
        <p className="text-gray-600">
          Advanced customer health features including:
          <br />• Unbilled This Month with 8PM/VERVE toggles
          <br />• Lost Customer Analysis (2-6 month lookback)
          <br />• Quarterly Declining Sales Analysis
          <br />• Customer Lifecycle Management
        </p>
      </div>
    </div>
  );
};

export default CustomerHealth;
