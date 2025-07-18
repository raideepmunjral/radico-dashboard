'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, AlertTriangle, CheckCircle, Download, Filter, Search, Eye, X, Navigation, Target, Zap, Clock, Users, BarChart3, TrendingUp } from 'lucide-react';

// ==========================================
// LOCATION VERIFICATION TYPES
// ==========================================

interface LocationDiscrepancy {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  visitDate: Date;
  checkInDateTime: string;
  masterLatitude: number;
  masterLongitude: number;
  actualLatitude: number;
  actualLongitude: number;
  distanceMeters: number;
  accuracyStatus: 'accurate' | 'acceptable' | 'questionable' | 'suspicious' | 'impossible';
  accuracyColor: string;
  accuracyIcon: any;
  accuracyLabel: string;
  isGPSError: boolean;
  isParkingLot: boolean;
  isCluster: boolean;
  salesmanUid?: string;
  visitId: string;
}

interface SalesmanAccuracy {
  salesman: string;
  totalVisits: number;
  accurateVisits: number;
  acceptableVisits: number;
  questionableVisits: number;
  suspiciousVisits: number;
  impossibleVisits: number;
  accuracyPercentage: number;
  averageDistance: number;
  worstDistance: number;
  consistentError: boolean;
  visits: LocationDiscrepancy[];
}

interface InventoryData {
  summary: {
    totalShops: number;
    visitedShops: number;
    rollingPeriodDays: number;
    periodStartDate: Date;
    periodEndDate: Date;
    masterDataIntegration: {
      totalMasterShops: number;
      masterDataAssignments: number;
      visitDataFallbacks: number;
      assignmentCoverage: number;
    };
  };
  shops: Record<string, any>;
  rawVisitData?: {
    rollingPeriodRows: any[][];
    columnIndices: any;
    shopSalesmanMap: Map<string, any>;
    rollingDays: number;
    parseDate: (dateStr: string) => Date | null;
  };
}

// ==========================================
// DISTANCE CALCULATION UTILITIES
// ==========================================

// Haversine formula for calculating distance between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Get accuracy status based on distance
const getAccuracyStatus = (distance: number): {
  status: LocationDiscrepancy['accuracyStatus'];
  color: string;
  icon: any;
  label: string;
} => {
  if (distance <= 50) {
    return {
      status: 'accurate',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      label: 'ACCURATE'
    };
  } else if (distance <= 200) {
    return {
      status: 'acceptable',
      color: 'bg-yellow-100 text-yellow-800',
      icon: Target,
      label: 'ACCEPTABLE'
    };
  } else if (distance <= 500) {
    return {
      status: 'questionable',
      color: 'bg-orange-100 text-orange-800',
      icon: AlertTriangle,
      label: 'QUESTIONABLE'
    };
  } else if (distance <= 5000) {
    return {
      status: 'suspicious',
      color: 'bg-red-100 text-red-800',
      icon: AlertTriangle,
      label: 'SUSPICIOUS'
    };
  } else {
    return {
      status: 'impossible',
      color: 'bg-purple-100 text-purple-800',
      icon: Zap,
      label: 'IMPOSSIBLE'
    };
  }
};

// Detect GPS clustering (multiple shops at same location)
const detectClustering = (discrepancies: LocationDiscrepancy[]): LocationDiscrepancy[] => {
  const clusters: Record<string, LocationDiscrepancy[]> = {};
  
  discrepancies.forEach(disc => {
    const key = `${disc.masterLatitude.toFixed(5)}_${disc.masterLongitude.toFixed(5)}`;
    if (!clusters[key]) clusters[key] = [];
    clusters[key].push(disc);
  });
  
  // Mark shops in clusters
  Object.values(clusters).forEach(clusterShops => {
    if (clusterShops.length > 1) {
      clusterShops.forEach(shop => {
        shop.isCluster = true;
      });
    }
  });
  
  return discrepancies;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const LocationVerificationTab = ({ data }: { data: InventoryData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSalesman, setSelectedSalesman] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'distance' | 'shopName' | 'salesman' | 'visitDate'>('distance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showVisitDetails, setShowVisitDetails] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  // Processing state
  const [locationDiscrepancies, setLocationDiscrepancies] = useState<LocationDiscrepancy[]>([]);
  const [salesmanAccuracies, setSalesmanAccuracies] = useState<SalesmanAccuracy[]>([]);

  // ==========================================
  // CORE PROCESSING FUNCTION
  // ==========================================

  const processLocationDiscrepancies = useMemo(() => {
    if (!data.rawVisitData || processed) return { discrepancies: [], accuracies: [] };

    console.log('🔄 Processing location discrepancies...');
    const { rollingPeriodRows, columnIndices, shopSalesmanMap, parseDate } = data.rawVisitData;

    const discrepancies: LocationDiscrepancy[] = [];
    const salesmanStats: Record<string, SalesmanAccuracy> = {};

    // Process each visit row
    rollingPeriodRows.forEach((row, index) => {
      const shopId = row[columnIndices.shopId];
      const checkInDateTime = row[columnIndices.checkInDateTime];
      const actualLatitude = parseFloat(row[columnIndices.submitterLatitude] || row[columnIndices.latitude] || '0');
      const actualLongitude = parseFloat(row[columnIndices.submitterLongitude] || row[columnIndices.longitude] || '0');

      // Skip if no coordinates available
      if (!shopId || !checkInDateTime || !actualLatitude || !actualLongitude) return;

      // Get master shop data
      const masterShop = shopSalesmanMap.get(shopId);
      if (!masterShop) return;

      const masterLatitude = parseFloat(masterShop.latitude || '0');
      const masterLongitude = parseFloat(masterShop.longitude || '0');

      // Skip if no master coordinates
      if (!masterLatitude || !masterLongitude) return;

      const visitDate = parseDate(checkInDateTime);
      if (!visitDate) return;

      const salesman = masterShop.salesman || row[columnIndices.salesman] || 'Unknown';

      // Calculate distance
      const distance = calculateDistance(masterLatitude, masterLongitude, actualLatitude, actualLongitude);
      const accuracy = getAccuracyStatus(distance);

      // Create discrepancy record
      const discrepancy: LocationDiscrepancy = {
        shopId,
        shopName: masterShop.shopName || row[columnIndices.shopName] || 'Unknown Shop',
        department: masterShop.department || row[columnIndices.department] || 'Unknown',
        salesman,
        visitDate,
        checkInDateTime,
        masterLatitude,
        masterLongitude,
        actualLatitude,
        actualLongitude,
        distanceMeters: Math.round(distance),
        accuracyStatus: accuracy.status,
        accuracyColor: accuracy.color,
        accuracyIcon: accuracy.icon,
        accuracyLabel: accuracy.label,
        isGPSError: distance > 20 && distance < 100, // Consistent GPS drift
        isParkingLot: distance > 50 && distance < 300, // Likely parking lot
        isCluster: false, // Will be set by clustering detection
        salesmanUid: masterShop.salesmanUid,
        visitId: `${shopId}_${checkInDateTime}_${index}`
      };

      discrepancies.push(discrepancy);

      // Track salesman statistics
      if (!salesmanStats[salesman]) {
        salesmanStats[salesman] = {
          salesman,
          totalVisits: 0,
          accurateVisits: 0,
          acceptableVisits: 0,
          questionableVisits: 0,
          suspiciousVisits: 0,
          impossibleVisits: 0,
          accuracyPercentage: 0,
          averageDistance: 0,
          worstDistance: 0,
          consistentError: false,
          visits: []
        };
      }

      const stats = salesmanStats[salesman];
      stats.totalVisits++;
      stats.visits.push(discrepancy);
      stats.worstDistance = Math.max(stats.worstDistance, distance);

      // Count by accuracy status
      switch (accuracy.status) {
        case 'accurate': stats.accurateVisits++; break;
        case 'acceptable': stats.acceptableVisits++; break;
        case 'questionable': stats.questionableVisits++; break;
        case 'suspicious': stats.suspiciousVisits++; break;
        case 'impossible': stats.impossibleVisits++; break;
      }
    });

    // Detect clustering
    const clusteredDiscrepancies = detectClustering(discrepancies);

    // Calculate salesman accuracy percentages and averages
    Object.values(salesmanStats).forEach(stats => {
      const goodVisits = stats.accurateVisits + stats.acceptableVisits;
      stats.accuracyPercentage = stats.totalVisits > 0 ? (goodVisits / stats.totalVisits) * 100 : 0;
      stats.averageDistance = stats.totalVisits > 0 ? 
        stats.visits.reduce((sum, visit) => sum + visit.distanceMeters, 0) / stats.totalVisits : 0;
      
      // Detect consistent GPS error pattern
      const distances = stats.visits.map(v => v.distanceMeters);
      const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
      const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
      stats.consistentError = variance < 50 && avgDistance > 50; // Low variance but consistent error
    });

    console.log('✅ Location discrepancies processed:', {
      totalDiscrepancies: clusteredDiscrepancies.length,
      accurateVisits: clusteredDiscrepancies.filter(d => d.accuracyStatus === 'accurate').length,
      suspiciousVisits: clusteredDiscrepancies.filter(d => d.accuracyStatus === 'suspicious').length,
      salesmenAnalyzed: Object.keys(salesmanStats).length
    });

    return {
      discrepancies: clusteredDiscrepancies,
      accuracies: Object.values(salesmanStats).sort((a, b) => b.suspiciousVisits - a.suspiciousVisits)
    };
  }, [data.rawVisitData, processed]);

  // Process data when component mounts
  useEffect(() => {
    if (data.rawVisitData && !processed) {
      setProcessing(true);
      const { discrepancies, accuracies } = processLocationDiscrepancies;
      setLocationDiscrepancies(discrepancies);
      setSalesmanAccuracies(accuracies);
      setProcessed(true);
      setProcessing(false);
    }
  }, [data.rawVisitData, processLocationDiscrepancies, processed]);

  // ==========================================
  // FILTERING AND SORTING
  // ==========================================

  const uniqueSalesmen = useMemo(() => {
    return Array.from(new Set(locationDiscrepancies.map(d => d.salesman))).filter(s => s).sort();
  }, [locationDiscrepancies]);

  const statusOptions = [
    { value: 'accurate', label: 'Accurate (≤50m)', color: 'text-green-600' },
    { value: 'acceptable', label: 'Acceptable (≤200m)', color: 'text-yellow-600' },
    { value: 'questionable', label: 'Questionable (≤500m)', color: 'text-orange-600' },
    { value: 'suspicious', label: 'Suspicious (≤5km)', color: 'text-red-600' },
    { value: 'impossible', label: 'Impossible (>5km)', color: 'text-purple-600' }
  ];

  const filteredAndSortedData = useMemo(() => {
    let filtered = locationDiscrepancies.filter(discrepancy => {
      const matchesSearch = discrepancy.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           discrepancy.shopId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           discrepancy.salesman.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSalesman = selectedSalesman === 'All' || discrepancy.salesman === selectedSalesman;
      const matchesStatus = selectedStatus === 'All' || discrepancy.accuracyStatus === selectedStatus;
      
      return matchesSearch && matchesSalesman && matchesStatus;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'visitDate') {
        aValue = new Date(a.visitDate).getTime();
        bValue = new Date(b.visitDate).getTime();
      } else if (sortBy === 'distance') {
        aValue = a.distanceMeters;
        bValue = b.distanceMeters;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [locationDiscrepancies, searchTerm, selectedSalesman, selectedStatus, sortBy, sortOrder]);

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ==========================================
  // SUMMARY STATISTICS
  // ==========================================

  const summaryStats = useMemo(() => {
    const total = filteredAndSortedData.length;
    const accurate = filteredAndSortedData.filter(d => d.accuracyStatus === 'accurate').length;
    const acceptable = filteredAndSortedData.filter(d => d.accuracyStatus === 'acceptable').length;
    const questionable = filteredAndSortedData.filter(d => d.accuracyStatus === 'questionable').length;
    const suspicious = filteredAndSortedData.filter(d => d.accuracyStatus === 'suspicious').length;
    const impossible = filteredAndSortedData.filter(d => d.accuracyStatus === 'impossible').length;
    const overallAccuracy = total > 0 ? ((accurate + acceptable) / total) * 100 : 0;
    const avgDistance = total > 0 ? 
      filteredAndSortedData.reduce((sum, d) => sum + d.distanceMeters, 0) / total : 0;

    return {
      total,
      accurate,
      acceptable,
      questionable,
      suspicious,
      impossible,
      overallAccuracy,
      avgDistance
    };
  }, [filteredAndSortedData]);

  // ==========================================
  // EXPORT FUNCTIONS
  // ==========================================

  const exportDetailedCSV = () => {
    const csvData = [
      [
        'Visit ID', 'Shop Name', 'Shop ID', 'Department', 'Salesman', 'Visit Date', 'Visit Time',
        'Master Latitude', 'Master Longitude', 'Actual Latitude', 'Actual Longitude',
        'Distance (meters)', 'Accuracy Status', 'GPS Error', 'Parking Lot', 'Cluster',
        'Google Maps Link (Master)', 'Google Maps Link (Actual)'
      ].join(','),
      ...filteredAndSortedData.map(d => [
        `"${d.visitId}"`,
        `"${d.shopName}"`,
        `"${d.shopId}"`,
        `"${d.department}"`,
        `"${d.salesman}"`,
        d.visitDate.toLocaleDateString(),
        d.visitDate.toLocaleTimeString(),
        d.masterLatitude,
        d.masterLongitude,
        d.actualLatitude,
        d.actualLongitude,
        d.distanceMeters,
        `"${d.accuracyLabel}"`,
        d.isGPSError ? 'Yes' : 'No',
        d.isParkingLot ? 'Yes' : 'No',
        d.isCluster ? 'Yes' : 'No',
        `"https://maps.google.com/maps?q=${d.masterLatitude},${d.masterLongitude}"`,
        `"https://maps.google.com/maps?q=${d.actualLatitude},${d.actualLongitude}"`
      ].join(','))
    ].join('\n');

    downloadCSV(csvData, 'location_discrepancy_detailed_report');
  };

  const exportSalesmanSummaryCSV = () => {
    const csvData = [
      [
        'Salesman', 'Total Visits', 'Accurate Visits', 'Acceptable Visits', 'Questionable Visits',
        'Suspicious Visits', 'Impossible Visits', 'Accuracy Percentage', 'Average Distance (m)',
        'Worst Distance (m)', 'Consistent GPS Error'
      ].join(','),
      ...salesmanAccuracies.map(s => [
        `"${s.salesman}"`,
        s.totalVisits,
        s.accurateVisits,
        s.acceptableVisits,
        s.questionableVisits,
        s.suspiciousVisits,
        s.impossibleVisits,
        s.accuracyPercentage.toFixed(1),
        Math.round(s.averageDistance),
        Math.round(s.worstDistance),
        s.consistentError ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    downloadCSV(csvData, 'salesman_location_accuracy_summary');
  };

  const exportExecutiveSummaryCSV = () => {
    const csvData = [
      ['Metric', 'Value'].join(','),
      ['Total Visits Analyzed', summaryStats.total],
      ['Accurate Visits (≤50m)', summaryStats.accurate],
      ['Acceptable Visits (≤200m)', summaryStats.acceptable],
      ['Questionable Visits (≤500m)', summaryStats.questionable],
      ['Suspicious Visits (≤5km)', summaryStats.suspicious],
      ['Impossible Visits (>5km)', summaryStats.impossible],
      ['Overall Accuracy Rate', `${summaryStats.overallAccuracy.toFixed(1)}%`],
      ['Average Distance Error', `${Math.round(summaryStats.avgDistance)}m`],
      ['Analysis Period', `${data.summary.periodStartDate.toLocaleDateString()} - ${data.summary.periodEndDate.toLocaleDateString()}`],
      ['Total Salesmen Analyzed', salesmanAccuracies.length]
    ].join('\n');

    downloadCSV(csvData, 'location_verification_executive_summary');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (processing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing location discrepancies...</p>
          <p className="text-sm text-gray-500">
            Analyzing {data.rawVisitData?.rollingPeriodRows?.length || 0} visit records
          </p>
        </div>
      </div>
    );
  }

  if (!data.rawVisitData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Location data not available</p>
          <p className="text-sm text-gray-500">Raw visit data with coordinates is required</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER COMPONENT
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📍 Location Verification & Discrepancy Report</h2>
        <p className="text-gray-600">Analyze visit location accuracy and identify potential discrepancies</p>
        <p className="text-sm text-gray-500">
          Period: {data.summary.periodStartDate.toLocaleDateString()} - {data.summary.periodEndDate.toLocaleDateString()}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">{summaryStats.accurate}</div>
          <div className="text-sm text-gray-500">Accurate (≤50m)</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-yellow-600">{summaryStats.acceptable}</div>
          <div className="text-sm text-gray-500">Acceptable (≤200m)</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-orange-600">{summaryStats.questionable}</div>
          <div className="text-sm text-gray-500">Questionable (≤500m)</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-red-600">{summaryStats.suspicious}</div>
          <div className="text-sm text-gray-500">Suspicious (≤5km)</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-purple-600">{summaryStats.impossible}</div>
          <div className="text-sm text-gray-500">Impossible (>5km)</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">{summaryStats.overallAccuracy.toFixed(1)}%</div>
          <div className="text-sm text-gray-500">Overall Accuracy</div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportDetailedCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Detailed Report</span>
          </button>
          <button
            onClick={exportSalesmanSummaryCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Salesman Summary</span>
          </button>
          <button
            onClick={exportExecutiveSummaryCSV}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Executive Summary</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by shop name, ID, or salesman..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={selectedSalesman}
            onChange={(e) => setSelectedSalesman(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Salesmen</option>
            {uniqueSalesmen.map(salesman => (
              <option key={salesman} value={salesman}>{salesman}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Salesman Performance Summary */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Salesman Location Accuracy Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suspicious</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Distance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worst Distance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPS Issue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesmanAccuracies.slice(0, 10).map((salesman, index) => (
                <tr key={salesman.salesman} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {salesman.salesman}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      salesman.accuracyPercentage >= 90 ? 'bg-green-100 text-green-800' :
                      salesman.accuracyPercentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {salesman.accuracyPercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.totalVisits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    {salesman.suspiciousVisits + salesman.impossibleVisits}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(salesman.averageDistance)}m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(salesman.worstDistance)}m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {salesman.consistentError ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        No
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Visit Discrepancies */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Detailed Visit Discrepancies</h3>
            <span className="text-sm text-gray-500">
              Showing {paginatedData.length} of {filteredAndSortedData.length} visits
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop & Visit Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance Error</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordinates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((discrepancy, index) => (
                <tr key={discrepancy.visitId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{discrepancy.shopName}</div>
                      <div className="text-sm text-gray-500">{discrepancy.shopId} • {discrepancy.department}</div>
                      <div className="text-xs text-gray-400">
                        {discrepancy.visitDate.toLocaleDateString()} {discrepancy.visitDate.toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {discrepancy.salesman}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {discrepancy.distanceMeters}m
                    {discrepancy.isGPSError && (
                      <div className="text-xs text-orange-600">GPS Drift</div>
                    )}
                    {discrepancy.isParkingLot && (
                      <div className="text-xs text-blue-600">Parking Lot</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${discrepancy.accuracyColor}`}>
                      <discrepancy.accuracyIcon className="w-3 h-3 mr-1" />
                      {discrepancy.accuracyLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    <div>Master: {discrepancy.masterLatitude.toFixed(6)}, {discrepancy.masterLongitude.toFixed(6)}</div>
                    <div>Actual: {discrepancy.actualLatitude.toFixed(6)}, {discrepancy.actualLongitude.toFixed(6)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(`https://maps.google.com/maps?q=${discrepancy.masterLatitude},${discrepancy.masterLongitude}`, '_blank')}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Master Location"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(`https://maps.google.com/maps?q=${discrepancy.actualLatitude},${discrepancy.actualLongitude}`, '_blank')}
                        className="text-green-600 hover:text-green-900"
                        title="View Actual Location"
                      >
                        <Navigation className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationVerificationTab;
