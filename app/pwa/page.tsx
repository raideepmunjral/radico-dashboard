'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, BarChart3, MapPin, Smartphone } from 'lucide-react';

export default function PWALanding() {
  const [selectedSalesman, setSelectedSalesman] = useState('');
  const router = useRouter();

  // Temporary salesman list - we'll make this dynamic later
  const salesmen = [
    'John Doe',
    'Jane Smith', 
    'Raj Kumar',
    'Priya Sharma',
    'Mike Johnson',
    'Sarah Wilson'
  ];

  const handleStartVisit = () => {
    if (selectedSalesman) {
      router.push(`/pwa/visit?salesman=${encodeURIComponent(selectedSalesman)}`);
    }
  };

  const handleViewDashboard = () => {
    if (selectedSalesman) {
      router.push(`/pwa/dashboard?salesman=${encodeURIComponent(selectedSalesman)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📱 Radico Field Collection
          </h1>
          <p className="text-gray-600 text-lg">
            Market Visit & Performance Tracking
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            {/* Salesman Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Users className="w-4 h-4 inline mr-2" />
                Select Your Name:
              </label>
              <select
                value={selectedSalesman}
                onChange={(e) => setSelectedSalesman(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose Your Name...</option>
                {salesmen.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            {selectedSalesman && (
              <div className="space-y-4">
                <button
                  onClick={handleStartVisit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg text-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <MapPin className="w-5 h-5" />
                  <span>🚀 Start Market Visit</span>
                </button>
                
                <button
                  onClick={handleViewDashboard}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg text-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>📊 View My Performance</span>
                </button>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">📱 Mobile Optimized</h3>
            <p className="text-blue-700 text-sm">
              Works offline and syncs when connection is available. 
              Add this page to your home screen for easy access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
