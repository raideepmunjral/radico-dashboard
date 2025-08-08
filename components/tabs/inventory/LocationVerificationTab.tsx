'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, AlertTriangle, CheckCircle, Download, Filter, Search, Eye, X, Navigation, Target, Zap, Clock, Users, BarChart3, TrendingUp } from 'lucide-react';

// Enhanced interfaces for consensus-based fraud detection
interface LocationConsensus {
  shopId: string;
  shopName: string;
  totalVisits: number;
  dominantLocation: { lat: number; lng: number };
  dominantVisits: number;
  consensusLevel: 'PERFECT' | 'STRONG' | 'WEAK' | 'SUSPICIOUS' | 'CRITICAL';
  fraudRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  deviatingVisits: number;
  locationClusters: number;
  consistencyScore: number;
  visitDetails: ConsensusVisitDetail[];
}

interface ConsensusVisitDetail {
  visitId: string;
  visitDate: string;
  salesmanName: string;
  latitude: number;
  longitude: number;
  isConsensus: boolean;
  deviationDistance: number;
  fraudFlag: 'NORMAL' | 'MINOR_DEVIATION' | 'SUSPICIOUS' | 'LIKELY_FRAUD';
}

interface SalesmanConsensusAccuracy {
  salesmanName: string;
  totalShops: number;
  perfectConsensus: number;
  strongConsensus: number;
  suspiciousVisits: number;
  fraudFlags: number;
  consistencyRate: number;
  avgConsensusScore: number;
  totalOutliers: number;
}

interface LocationVerificationTabProps {
  data: {
    rawMasterData?: any[];
    rawVisitData?: any[];
  };
}

const LocationVerificationTab: React.FC<LocationVerificationTabProps> = ({ data }) => {
  // State variables for consensus-based analysis
  const [analysisMode, setAnalysisMode] = useState<'distance' | 'consensus'>('consensus');
  const [selectedConsensus, setSelectedConsensus] = useState<string>('all');
  const [showOutliersOnly, setShowOutliersOnly] = useState(false);
  const [selectedSalesman, setSelectedSalesman] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('fraudRisk');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // ==========================================
  // ENHANCED PROCESSING WITH CONSENSUS-BASED FRAUD DETECTION
  // ==========================================

  const processLocationDiscrepancies = useMemo(() => {
    if (!data.rawVisitData) {
      return {
        discrepancies: [],
        consensusData: [],
        salesmanAccuracy: []
      };
    }

    console.log('🔍 Processing location discrepancies with consensus-based fraud detection...');

    // Extract visit data structure (all data comes from rawVisitData)
    const { rollingPeriodRows, columnIndices, shopSalesmanMap, parseDate } = data.rawVisitData;
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371000; // Earth's radius in meters
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Helper function to find location clusters
    const findLocationClusters = (visits: any[], clusterRadius = 100): any[][] => {
      const clusters: any[][] = [];
      const processed = new Set();

      visits.forEach((visit, index) => {
        if (processed.has(index)) return;

        const cluster = [visit];
        processed.add(index);

        visits.forEach((otherVisit, otherIndex) => {
          if (processed.has(otherIndex)) return;

          const distance = calculateDistance(
            visit.latitude, visit.longitude,
            otherVisit.latitude, otherVisit.longitude
          );

          if (distance <= clusterRadius) {
            cluster.push(otherVisit);
            processed.add(otherIndex);
          }
        });

        clusters.push(cluster);
      });

      return clusters.sort((a, b) => b.length - a.length); // Largest cluster first
    };

    // Group visits by shop
    const shopVisitGroups: Record<string, any[]> = {};
    data.rawVisitData.forEach(visit => {
      const shopKey = visit.shop_name || visit.shopName || visit.shop_id || visit.id;
      if (!shopKey) return;

      if (!shopVisitGroups[shopKey]) {
        shopVisitGroups[shopKey] = [];
      }

      shopVisitGroups[shopKey].push({
        visitId: visit.id || `${shopKey}_${Date.now()}`,
        visitDate: visit.visit_date || visit.date || new Date().toISOString(),
        salesmanName: visit.salesman_name || visit.salesman || 'Unknown',
        latitude: parseFloat(visit.latitude || visit.lat || 0),
        longitude: parseFloat(visit.longitude || visit.lng || 0),
        shopId: shopKey,
        shopName: shopKey
      });
    });

    const consensusData: LocationConsensus[] = [];
    const salesmanStats: Record<string, SalesmanConsensusAccuracy> = {};

    // Process each shop for consensus analysis
    Object.entries(shopVisitGroups).forEach(([shopId, visits]) => {
      if (visits.length === 0) return;

      // Filter out invalid coordinates
      const validVisits = visits.filter(v => v.latitude !== 0 && v.longitude !== 0 && 
                                             !isNaN(v.latitude) && !isNaN(v.longitude));

      if (validVisits.length === 0) return;

      // Find location clusters
      const clusters = findLocationClusters(validVisits, 100); // 100m cluster radius
      const dominantCluster = clusters[0]; // Largest cluster
      
      // Calculate dominant location (centroid of largest cluster)
      const dominantLocation = {
        lat: dominantCluster.reduce((sum, v) => sum + v.latitude, 0) / dominantCluster.length,
        lng: dominantCluster.reduce((sum, v) => sum + v.longitude, 0) / dominantCluster.length
      };

      // Analyze each visit for consensus compliance
      const visitDetails: ConsensusVisitDetail[] = validVisits.map(visit => {
        const distanceFromDominant = calculateDistance(
          visit.latitude, visit.longitude,
          dominantLocation.lat, dominantLocation.lng
        );

        const isConsensus = dominantCluster.some(cv => cv.visitId === visit.visitId);
        
        let fraudFlag: 'NORMAL' | 'MINOR_DEVIATION' | 'SUSPICIOUS' | 'LIKELY_FRAUD' = 'NORMAL';
        if (distanceFromDominant > 500) fraudFlag = 'LIKELY_FRAUD';
        else if (distanceFromDominant > 200) fraudFlag = 'SUSPICIOUS';
        else if (distanceFromDominant > 100) fraudFlag = 'MINOR_DEVIATION';

        return {
          visitId: visit.visitId,
          visitDate: visit.visitDate,
          salesmanName: visit.salesmanName,
          latitude: visit.latitude,
          longitude: visit.longitude,
          isConsensus,
          deviationDistance: Math.round(distanceFromDominant),
          fraudFlag
        };
      });

      // Calculate consensus metrics
      const dominantVisits = dominantCluster.length;
      const deviatingVisits = validVisits.length - dominantVisits;
      const consistencyScore = Math.round((dominantVisits / validVisits.length) * 100);

      // Determine consensus level
      let consensusLevel: 'PERFECT' | 'STRONG' | 'WEAK' | 'SUSPICIOUS' | 'CRITICAL' = 'PERFECT';
      if (validVisits.length === 1) {
        consensusLevel = 'PERFECT'; // Single visit = no deviation possible
      } else if (consistencyScore >= 90) {
        consensusLevel = 'STRONG';
      } else if (consistencyScore >= 70) {
        consensusLevel = 'WEAK';
      } else if (consistencyScore >= 50) {
        consensusLevel = 'SUSPICIOUS';
      } else {
        consensusLevel = 'CRITICAL';
      }

      // Determine fraud risk
      let fraudRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      const suspiciousCount = visitDetails.filter(v => v.fraudFlag === 'SUSPICIOUS' || v.fraudFlag === 'LIKELY_FRAUD').length;
      
      if (suspiciousCount === 0) fraudRisk = 'LOW';
      else if (suspiciousCount === 1 && validVisits.length > 3) fraudRisk = 'MEDIUM';
      else if (suspiciousCount <= validVisits.length / 2) fraudRisk = 'HIGH';
      else fraudRisk = 'CRITICAL';

      consensusData.push({
        shopId,
        shopName: shopId,
        totalVisits: validVisits.length,
        dominantLocation,
        dominantVisits,
        consensusLevel,
        fraudRisk,
        deviatingVisits,
        locationClusters: clusters.length,
        consistencyScore,
        visitDetails
      });

      // Update salesman statistics
      validVisits.forEach(visit => {
        const salesmanName = visit.salesmanName;
        if (!salesmanStats[salesmanName]) {
          salesmanStats[salesmanName] = {
            salesmanName,
            totalShops: 0,
            perfectConsensus: 0,
            strongConsensus: 0,
            suspiciousVisits: 0,
            fraudFlags: 0,
            consistencyRate: 0,
            avgConsensusScore: 0,
            totalOutliers: 0
          };
        }

        const stats = salesmanStats[salesmanName];
        const visitDetail = visitDetails.find(v => v.visitId === visit.visitId);
        
        if (visitDetail) {
          if (visitDetail.fraudFlag === 'SUSPICIOUS' || visitDetail.fraudFlag === 'LIKELY_FRAUD') {
            stats.suspiciousVisits++;
            stats.fraudFlags++;
          }
          if (!visitDetail.isConsensus) {
            stats.totalOutliers++;
          }
        }
      });
    });

    // Finalize salesman statistics
    const salesmanAccuracy: SalesmanConsensusAccuracy[] = Object.values(salesmanStats).map(stats => {
      // Count shops by consensus level for this salesman
      const salesmanShops = consensusData.filter(shop => 
        shop.visitDetails.some(visit => visit.salesmanName === stats.salesmanName)
      );

      stats.totalShops = salesmanShops.length;
      stats.perfectConsensus = salesmanShops.filter(s => s.consensusLevel === 'PERFECT').length;
      stats.strongConsensus = salesmanShops.filter(s => s.consensusLevel === 'STRONG').length;
      stats.consistencyRate = stats.totalShops > 0 ? 
        Math.round(((stats.perfectConsensus + stats.strongConsensus) / stats.totalShops) * 100) : 0;
      stats.avgConsensusScore = salesmanShops.length > 0 ?
        Math.round(salesmanShops.reduce((sum, shop) => sum + shop.consistencyScore, 0) / salesmanShops.length) : 0;

      return stats;
    }).sort((a, b) => b.consistencyRate - a.consistencyRate);

    console.log('✅ Enhanced location discrepancies with consensus-based fraud detection processed:', { consensusData, salesmanAccuracy });

    return {
      discrepancies: [], // Legacy field for compatibility
      consensusData,
      salesmanAccuracy
    };
  }, [data.rawVisitData, data.rawMasterData]);

  // Filter and sort consensus data
  const filteredConsensusData = useMemo(() => {
    let filtered = processLocationDiscrepancies.consensusData || [];

    // Filter by consensus level
    if (selectedConsensus !== 'all') {
      filtered = filtered.filter(item => item.consensusLevel === selectedConsensus);
    }

    // Filter by outliers only
    if (showOutliersOnly) {
      filtered = filtered.filter(item => item.deviatingVisits > 0);
    }

    // Filter by salesman
    if (selectedSalesman !== 'all') {
      filtered = filtered.filter(item => 
        item.visitDetails.some(visit => visit.salesmanName === selectedSalesman)
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.visitDetails.some(visit => 
          visit.salesmanName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'fraudRisk':
          const riskOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          aVal = riskOrder[a.fraudRisk];
          bVal = riskOrder[b.fraudRisk];
          break;
        case 'consensusLevel':
          const levelOrder = { 'CRITICAL': 5, 'SUSPICIOUS': 4, 'WEAK': 3, 'STRONG': 2, 'PERFECT': 1 };
          aVal = levelOrder[a.consensusLevel];
          bVal = levelOrder[b.consensusLevel];
          break;
        case 'consistencyScore':
          aVal = a.consistencyScore;
          bVal = b.consistencyScore;
          break;
        case 'totalVisits':
          aVal = a.totalVisits;
          bVal = b.totalVisits;
          break;
        case 'deviatingVisits':
          aVal = a.deviatingVisits;
          bVal = b.deviatingVisits;
          break;
        default:
          aVal = a.shopName;
          bVal = b.shopName;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [processLocationDiscrepancies.consensusData, selectedConsensus, showOutliersOnly, selectedSalesman, searchTerm, sortField, sortDirection]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    const data = processLocationDiscrepancies.consensusData || [];
    
    return {
      totalShops: data.length,
      perfectConsensus: data.filter(item => item.consensusLevel === 'PERFECT').length,
      strongConsensus: data.filter(item => item.consensusLevel === 'STRONG').length,
      weakConsensus: data.filter(item => item.consensusLevel === 'WEAK').length,
      suspiciousShops: data.filter(item => item.consensusLevel === 'SUSPICIOUS').length,
      criticalShops: data.filter(item => item.consensusLevel === 'CRITICAL').length,
      totalOutliers: data.reduce((sum, item) => sum + item.deviatingVisits, 0),
      highRiskShops: data.filter(item => item.fraudRisk === 'HIGH' || item.fraudRisk === 'CRITICAL').length
    };
  }, [processLocationDiscrepancies.consensusData]);

  // Get unique salesmen for filter
  const uniqueSalesmen = useMemo(() => {
    const salesmen = new Set<string>();
    processLocationDiscrepancies.consensusData?.forEach(item => {
      item.visitDetails.forEach(visit => {
        salesmen.add(visit.salesmanName);
      });
    });
    return Array.from(salesmen).sort();
  }, [processLocationDiscrepancies.consensusData]);

  // Export functions
  const exportDetailedCSV = () => {
    const headers = [
      'Shop Name', 'Total Visits', 'Consensus Level', 'Fraud Risk', 
      'Consistency Score', 'Dominant Visits', 'Deviating Visits', 
      'Location Clusters', 'Dominant Lat', 'Dominant Lng'
    ];

    const csvData = filteredConsensusData.map(item => [
      item.shopName,
      item.totalVisits,
      item.consensusLevel,
      item.fraudRisk,
      `${item.consistencyScore}%`,
      item.dominantVisits,
      item.deviatingVisits,
      item.locationClusters,
      item.dominantLocation.lat.toFixed(6),
      item.dominantLocation.lng.toFixed(6)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `location_consensus_analysis_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSalesmanSummaryCSV = () => {
    const headers = [
      'Salesman Name', 'Total Shops', 'Perfect Consensus', 'Strong Consensus',
      'Consistency Rate', 'Avg Consensus Score', 'Suspicious Visits', 
      'Fraud Flags', 'Total Outliers'
    ];

    const csvData = processLocationDiscrepancies.salesmanAccuracy.map(item => [
      item.salesmanName,
      item.totalShops,
      item.perfectConsensus,
      item.strongConsensus,
      `${item.consistencyRate}%`,
      `${item.avgConsensusScore}%`,
      item.suspiciousVisits,
      item.fraudFlags,
      item.totalOutliers
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salesman_consensus_performance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportFraudAnalysisCSV = () => {
    const headers = [
      'Shop Name', 'Visit Date', 'Salesman', 'Latitude', 'Longitude',
      'Is Consensus', 'Deviation Distance (m)', 'Fraud Flag'
    ];

    const csvData: any[] = [];
    filteredConsensusData.forEach(shop => {
      shop.visitDetails.forEach(visit => {
        csvData.push([
          shop.shopName,
          visit.visitDate,
          visit.salesmanName,
          visit.latitude.toFixed(6),
          visit.longitude.toFixed(6),
          visit.isConsensus ? 'YES' : 'NO',
          visit.deviationDistance,
          visit.fraudFlag
        ]);
      });
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraud_analysis_detailed_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper functions for styling
  const getConsensusLevelColor = (level: string) => {
    switch (level) {
      case 'PERFECT': return 'bg-green-100 text-green-800';
      case 'STRONG': return 'bg-blue-100 text-blue-800';
      case 'WEAK': return 'bg-yellow-100 text-yellow-800';
      case 'SUSPICIOUS': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFraudRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFraudFlagColor = (flag: string) => {
    switch (flag) {
      case 'NORMAL': return 'bg-green-100 text-green-800';
      case 'MINOR_DEVIATION': return 'bg-yellow-100 text-yellow-800';
      case 'SUSPICIOUS': return 'bg-orange-100 text-orange-800';
      case 'LIKELY_FRAUD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!data.rawVisitData) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-500">
          Visit data with coordinates is required for location verification analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Target className="mr-3 h-8 w-8 text-blue-600" />
              Location Consensus & Fraud Detection
            </h2>
            <p className="text-gray-600 mt-1">
              Advanced GPS consensus analysis to detect visit fraud and location inconsistencies
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={exportDetailedCSV}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Analysis
            </button>
            <button
              onClick={exportSalesmanSummaryCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Users className="h-4 w-4 mr-2" />
              Salesman Report
            </button>
            <button
              onClick={exportFraudAnalysisCSV}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Fraud Analysis
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Perfect</p>
                <p className="text-2xl font-bold text-green-900">{summaryStats.perfectConsensus}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Strong</p>
                <p className="text-2xl font-bold text-blue-900">{summaryStats.strongConsensus}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Weak</p>
                <p className="text-2xl font-bold text-yellow-900">{summaryStats.weakConsensus}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Suspicious</p>
                <p className="text-2xl font-bold text-orange-900">{summaryStats.suspiciousShops}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Critical</p>
                <p className="text-2xl font-bold text-red-900">{summaryStats.criticalShops}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Navigation className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Outliers</p>
                <p className="text-2xl font-bold text-purple-900">{summaryStats.totalOutliers}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">High Risk</p>
                <p className="text-2xl font-bold text-red-900">{summaryStats.highRiskShops}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Shops</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalShops}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Consensus Level</label>
            <select
              value={selectedConsensus}
              onChange={(e) => setSelectedConsensus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="PERFECT">Perfect</option>
              <option value="STRONG">Strong</option>
              <option value="WEAK">Weak</option>
              <option value="SUSPICIOUS">Suspicious</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Salesman</label>
            <select
              value={selectedSalesman}
              onChange={(e) => setSelectedSalesman(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Salesmen</option>
              {uniqueSalesmen.map(salesman => (
                <option key={salesman} value={salesman}>{salesman}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search shops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="fraudRisk">Fraud Risk</option>
              <option value="consensusLevel">Consensus Level</option>
              <option value="consistencyScore">Consistency Score</option>
              <option value="totalVisits">Total Visits</option>
              <option value="deviatingVisits">Deviating Visits</option>
              <option value="shopName">Shop Name</option>
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="outliersOnly"
                checked={showOutliersOnly}
                onChange={(e) => setShowOutliersOnly(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="outliersOnly" className="text-sm text-gray-700">Outliers Only</label>
            </div>
          </div>
        </div>
      </div>

      {/* Salesman Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="mr-2 h-5 w-5 text-blue-600" />
            Salesman GPS Consensus Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Shops</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perfect</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strong</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consistency Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suspicious</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outliers</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processLocationDiscrepancies.salesmanAccuracy.map((salesman, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {salesman.salesmanName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.totalShops}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{salesman.perfectConsensus}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{salesman.strongConsensus}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${salesman.consistencyRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 font-medium">{salesman.consistencyRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.avgConsensusScore}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      salesman.suspiciousVisits === 0 ? 'bg-green-100 text-green-800' : 
                      salesman.suspiciousVisits <= 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {salesman.suspiciousVisits}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.totalOutliers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Consensus Analysis Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Target className="mr-2 h-5 w-5 text-blue-600" />
            GPS Consensus Analysis
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {filteredConsensusData.length} shops
            </span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consensus Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fraud Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consistency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dominant/Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clusters</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConsensusData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.shopName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.totalVisits}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConsensusLevelColor(item.consensusLevel)}`}>
                      {item.consensusLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFraudRiskColor(item.fraudRisk)}`}>
                      {item.fraudRisk}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className={`h-2 rounded-full ${
                            item.consistencyScore >= 90 ? 'bg-green-600' :
                            item.consistencyScore >= 70 ? 'bg-blue-600' :
                            item.consistencyScore >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${item.consistencyScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 font-medium">{item.consistencyScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="text-green-600 font-medium">{item.dominantVisits}</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span>{item.totalVisits}</span>
                    {item.deviatingVisits > 0 && (
                      <span className="ml-2 text-red-600 text-xs">({item.deviatingVisits} outliers)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.locationClusters}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedShop(selectedShop === item.shopId ? null : item.shopId)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {selectedShop === item.shopId ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Visit Analysis */}
      {selectedShop && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Navigation className="mr-2 h-5 w-5 text-blue-600" />
              Visit Details: {filteredConsensusData.find(item => item.shopId === selectedShop)?.shopName}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordinates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consensus</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deviation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fraud Flag</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConsensusData.find(item => item.shopId === selectedShop)?.visitDetails.map((visit, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(visit.visitDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{visit.salesmanName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {visit.latitude.toFixed(6)}, {visit.longitude.toFixed(6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        visit.isConsensus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {visit.isConsensus ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {visit.deviationDistance}m
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFraudFlagColor(visit.fraudFlag)}`}>
                        {visit.fraudFlag.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationVerificationTab;
