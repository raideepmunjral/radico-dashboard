'use client';

import React from 'react';
import { Zap, AlertTriangle } from 'lucide-react';

interface DashboardData {
  allShopsComparison: any[];
  customerInsights: any;
  currentMonth: string;
  currentYear: string;
}

const SKUIntelligence = ({ data }: { data: DashboardData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-500" />
            SKU Cross-Selling Intelligence
          </h3>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
            Generate Recommendations
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">8PM Variant Opportunities</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">750ml → 375ml potential</span>
                <span className="text-sm font-medium text-blue-600">34 shops</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Single size → Multi-size</span>
                <span className="text-sm font-medium text-blue-600">67 shops</span>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">Verve Flavor Expansion</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Grain only → Add flavors</span>
                <span className="text-sm font-medium text-purple-600">45 shops</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Single flavor expansion</span>
                <span className="text-sm font-medium text-purple-600">78 shops</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
          <h4 className="font-medium">Advanced Features Coming Soon</h4>
        </div>
        <p className="text-gray-600">
          Micro SKU analysis features including:
          <br />• Cross-selling matrix (8PM variants analysis)
          <br />• Flavor expansion opportunities (Verve variants)
          <br />• Size migration patterns (750ml → 375ml → 180ml)
          <br />• Territory-wise SKU penetration gaps
          <br />• Next Best SKU recommendations
        </p>
      </div>
    </div>
  );
};

export default SKUIntelligence;
