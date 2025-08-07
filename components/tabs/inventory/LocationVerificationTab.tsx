'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, AlertTriangle, CheckCircle, Download, Filter, Search, Eye, X, Navigation, Target, Zap, Clock, Users, BarChart3, TrendingUp } from 'lucide-react';

// ==========================================
// ENHANCED LOCATION VERIFICATION TYPES WITH STABILITY
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
  // 🆕 NEW: Stability and outlier detection
  stabilityMeters?: number;
  stabilityStatus?: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  stabilityColor?: string;
  totalVisitsForShop?: number;
  coordinatesAveraged?: number;
  outliersRemoved?: number;
  isOutlierVisit?: boolean;
  outlierDistance?: number;
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
  // 🆕 NEW: Stability metrics
  averageStability: number;
  excellentStability: number;
  poorStability: number;
  outlierVisits: number;
  totalOutliersRemoved: number;
}

interface StabilityAnalysis {
  totalShops: number;
  shopsWithMultipleVisits: number;
  excellentStability: number;
  goodStability: number;
  moderateStability: number;
  poorStability: number;
  criticalStability: number;
  totalOutliers: number;
  avgStabilityMeters: number;
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
// STABILITY ANALYSIS UTILITIES
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

// Get stability status based on variance in meters
const getStabilityStatus = (stabilityMeters: number): {
  status: LocationDiscrepancy['stabilityStatus'];
  color: string;
  label: string;
} => {
  if (stabilityMeters <= 10) {
    return {
      status: 'excellent',
      color: 'bg-green-100 text-green-800',
      label: 'EXCELLENT'
    };
  } else if (stabilityMeters <= 50) {
    return {
      status: 'good',
      color: 'bg-blue-100 text-blue-800',
      label: 'GOOD'
    };
  } else if (stabilityMeters <= 200) {
    return {
      status: 'moderate',
      color: 'bg-yellow-100 text-yellow-800',
      label: 'MODERATE'
    };
  } else if (stabilityMeters <= 1000) {
    return {
      status: 'poor',
      color: 'bg-orange-100 text-orange-800',
      label: 'POOR'
    };
  } else {
    return {
      status: 'critical',
      color: 'bg-red-100 text-red-800',
      label: 'CRITICAL'
    };
  }
};

// Detect outlier visits within a shop's visit history
const detectOutlierVisits = (visits: any[], shopId: string): any[] => {
  if (visits.length <= 2) return visits;
  
  // Calculate average coordinates for this shop
  const avgLat = visits.reduce((sum, v) => sum + v.actualLatitude, 0) / visits.length;
  const avgLng = visits.reduce((sum, v) => sum + v.actualLongitude, 0) / visits.length;
  
  // Mark outliers (>500m from average)
  return visits.map(visit => {
    const distanceFromCenter = calculateDistance(
      avgLat, avgLng,
      visit.actualLatitude, visit.actualLongitude
    );
    
    const isOutlier = distanceFromCenter > 500; // 500m threshold
    
    return {
      ...visit,
      isOutlierVisit: isOutlier,
      outlierDistance: Math.round(distanceFromCenter)
    };
  });
};

// Calculate stability metrics for shops with multiple visits
const calculateShopStability = (visits: any[], shopId: string): number => {
  if (visits.length <= 1) return 0;
  
  const avgLat = visits.reduce((sum, v) => sum + v.actualLatitude, 0) / visits.length;
  const avgLng = visits.reduce((sum, v) => sum + v.actualLongitude, 0) / visits.length;
  
  // Calculate variance and convert to meters
  const latVariance = visits.reduce((sum, v) => sum + Math.pow(v.actualLatitude - avgLat, 2), 0) / visits.length;
  const lngVariance = visits.reduce((sum, v) => sum + Math.pow(v.actualLongitude - avgLng, 2), 0) / visits.length;
  
  return Math.sqrt(latVariance + lngVariance) * 111000; // Convert to meters
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
  const [selectedStability, setSelectedStability] = useState('All');
  const [showOutliersOnly, setShowOutliersOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'shopName' | 'salesman' | 'visitDate' | 'stability'>('distance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showVisitDetails, setShowVisitDetails] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  // Processing state
  const [locationDiscrepancies, setLocationDiscrepancies] = useState<LocationDiscrepancy[]>([]);
  const [salesmanAccuracies, setSalesmanAccuracies] = useState<SalesmanAccuracy[]>([]);
  const [stabilityAnalysis, setStabilityAnalysis] = useState<StabilityAnalysis | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<'distance' | 'stability'>('distance');

  // ==========================================
  // ENHANCED PROCESSING WITH STABILITY ANALYSIS
  // ==========================================

  const processLocationDiscrepancies = useMemo(() => {
    if (!data.rawVisitData || processed) return { discrepancies: [], accuracies: [], stability: null };

    console.log('🔄 Processing location discrepancies with GPS stability analysis...');
    const { rollingPeriodRows, columnIndices, shopSalesmanMap, parseDate } = data.rawVisitData;

    const discrepancies: LocationDiscrepancy[] = [];
    const salesmanStats: Record<string, SalesmanAccuracy> = {};
    const shopVisitGroups: Record<string, any[]> = {}; // Group visits by shop for stability analysis

    // ==========================================
    // STEP 1: Process each visit and group by shop
    // ==========================================
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

      // Group visits by shop for stability analysis
      if (!shopVisitGroups[shopId]) {
        shopVisitGroups[shopId] = [];
      }

      const visitRecord = {
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
        salesmanUid: masterShop.salesmanUid,
        visitId: `${shopId}_${checkInDateTime}_${index}`
      };

      shopVisitGroups[shopId].push(visitRecord);
    });

    // ==========================================
    // STEP 2: Calculate stability and detect outliers per shop
    // ==========================================
    const stabilityStats = {
      totalShops: 0,
      shopsWithMultipleVisits: 0,
      excellentStability: 0,
      goodStability: 0,
      moderateStability: 0,
      poorStability: 0,
      criticalStability: 0,
      totalOutliers: 0,
      totalStabilitySum: 0
    };

    Object.keys(shopVisitGroups).forEach(shopId => {
      const shopVisits = shopVisitGroups[shopId];
      stabilityStats.totalShops++;

      if (shopVisits.length > 1) {
        stabilityStats.shopsWithMultipleVisits++;
        
        // Calculate stability for this shop
        const stabilityMeters = calculateShopStability(shopVisits, shopId);
        stabilityStats.totalStabilitySum += stabilityMeters;

        // Categorize stability
        if (stabilityMeters <= 10) stabilityStats.excellentStability++;
        else if (stabilityMeters <= 50) stabilityStats.goodStability++;
        else if (stabilityMeters <= 200) stabilityStats.moderateStability++;
        else if (stabilityMeters <= 1000) stabilityStats.poorStability++;
        else stabilityStats.criticalStability++;

        // Detect outliers in this shop's visits
        const visitsWithOutliers = detectOutlierVisits(shopVisits, shopId);
        const outliers = visitsWithOutliers.filter(v => v.isOutlierVisit);
        stabilityStats.totalOutliers += outliers.length;

        // Add stability info to each visit
        shopVisits.forEach((visit, index) => {
          const visitWithOutlier = visitsWithOutliers[index];
          visit.stabilityMeters = stabilityMeters;
          visit.totalVisitsForShop = shopVisits.length;
          visit.coordinatesAveraged = shopVisits.length;
          visit.outliersRemoved = outliers.length;
          visit.isOutlierVisit = visitWithOutlier.isOutlierVisit;
          visit.outlierDistance = visitWithOutlier.outlierDistance;
        });
      } else {
        // Single visit shops
        shopVisits[0].stabilityMeters = 0;
        shopVisits[0].totalVisitsForShop = 1;
        shopVisits[0].coordinatesAveraged = 1;
        shopVisits[0].outliersRemoved = 0;
        shopVisits[0].isOutlierVisit = false;
      }
    });

    // ==========================================
    // STEP 3: Create discrepancy records with stability data
    // ==========================================
    Object.values(shopVisitGroups).flat().forEach(visit => {
      // Calculate distance
      const distance = calculateDistance(
        visit.masterLatitude, visit.masterLongitude, 
        visit.actualLatitude, visit.actualLongitude
      );
      
      const accuracy = getAccuracyStatus(distance);
      const stability = getStabilityStatus(visit.stabilityMeters || 0);

      // Create enhanced discrepancy record
      const discrepancy: LocationDiscrepancy = {
        ...visit,
        distanceMeters: Math.round(distance),
        accuracyStatus: accuracy.status,
        accuracyColor: accuracy.color,
        accuracyIcon: accuracy.icon,
        accuracyLabel: accuracy.label,
        isGPSError: distance > 20 && distance < 100,
        isParkingLot: distance > 50 && distance < 300,
        isCluster: false, // Will be set by clustering detection
        // 🆕 NEW: Stability data
        stabilityStatus: stability.status,
        stabilityColor: stability.color
      };

      discrepancies.push(discrepancy);

      // Track enhanced salesman statistics
      if (!salesmanStats[visit.salesman]) {
        salesmanStats[visit.salesman] = {
          salesman: visit.salesman,
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
          visits: [],
          // 🆕 NEW: Stability metrics
          averageStability: 0,
          excellentStability: 0,
          poorStability: 0,
          outlierVisits: 0,
          totalOutliersRemoved: 0
        };
      }

      const stats = salesmanStats[visit.salesman];
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

      // 🆕 NEW: Track stability metrics
      if (visit.isOutlierVisit) stats.outlierVisits++;
      stats.totalOutliersRemoved += visit.outliersRemoved || 0;
      
      if (stability.status === 'excellent') stats.excellentStability++;
      else if (['poor', 'critical'].includes(stability.status)) stats.poorStability++;
    });

    // Detect clustering (unchanged)
    const clusteredDiscrepancies = detectClustering(discrepancies);

    // Calculate final salesman stats
    Object.values(salesmanStats).forEach(stats => {
      const goodVisits = stats.accurateVisits + stats.acceptableVisits;
      stats.accuracyPercentage = stats.totalVisits > 0 ? (goodVisits / stats.totalVisits) * 100 : 0;
      stats.averageDistance = stats.totalVisits > 0 ? 
        stats.visits.reduce((sum, visit) => sum + visit.distanceMeters, 0) / stats.totalVisits : 0;
      
      // Calculate average stability for this salesman
      const stabilityValues = stats.visits.map(v => v.stabilityMeters || 0).filter(s => s > 0);
      stats.averageStability = stabilityValues.length > 0 ?
        stabilityValues.reduce((sum, s) => sum + s, 0) / stabilityValues.length : 0;
      
      // Detect consistent GPS error pattern (unchanged)
      const distances = stats.visits.map(v => v.distanceMeters);
      const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
      const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
      stats.consistentError = variance < 50 && avgDistance > 50;
    });

    // Create final stability analysis
    const finalStabilityAnalysis: StabilityAnalysis = {
      totalShops: stabilityStats.totalShops,
      shopsWithMultipleVisits: stabilityStats.shopsWithMultipleVisits,
      excellentStability: stabilityStats.excellentStability,
      goodStability: stabilityStats.goodStability,
      moderateStability: stabilityStats.moderateStability,
      poorStability: stabilityStats.poorStability,
      criticalStability: stabilityStats.criticalStability,
      totalOutliers: stabilityStats.totalOutliers,
      avgStabilityMeters: stabilityStats.shopsWithMultipleVisits > 0 ?
        stabilityStats.totalStabilitySum / stabilityStats.shopsWithMultipleVisits : 0
    };

    console.log('✅ Enhanced location discrepancies with stability processed:', {
      totalDiscrepancies: clusteredDiscrepancies.length,
      shopsAnalyzed: stabilityStats.totalShops,
      multiVisitShops: stabilityStats.shopsWithMultipleVisits,
      outliersDetected: stabilityStats.totalOutliers,
      avgStability: finalStabilityAnalysis.avgStabilityMeters.toFixed(1) + 'm'
    });

    return {
      discrepancies: clusteredDiscrepancies,
      accuracies: Object.values(salesmanStats).sort((a, b) => b.suspiciousVisits - a.suspiciousVisits),
      stability: finalStabilityAnalysis
    };
  }, [data.rawVisitData, processed]);

  // Process data when component mounts
  useEffect(() => {
    if (data.rawVisitData && !processed) {
      setProcessing(true);
      const { discrepancies, accuracies, stability } = processLocationDiscrepancies;
      setLocationDiscrepancies(discrepancies);
      setSalesmanAccuracies(accuracies);
      setStabilityAnalysis(stability);
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

  const stabilityOptions = [
    { value: 'excellent', label: 'Excellent (≤10m)', color: 'text-green-600' },
    { value: 'good', label: 'Good (≤50m)', color: 'text-blue-600' },
    { value: 'moderate', label: 'Moderate (≤200m)', color: 'text-yellow-600' },
    { value: 'poor', label: 'Poor (≤1000m)', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical (>1000m)', color: 'text-red-600' }
  ];

  const filteredAndSortedData = useMemo(() => {
    let filtered = locationDiscrepancies.filter(discrepancy => {
      const matchesSearch = discrepancy.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           discrepancy.shopId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           discrepancy.salesman.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSalesman = selectedSalesman === 'All' || discrepancy.salesman === selectedSalesman;
      const matchesStatus = selectedStatus === 'All' || discrepancy.accuracyStatus === selectedStatus;
      const matchesStability = selectedStability === 'All' || discrepancy.stabilityStatus === selectedStability;
      const matchesOutlierFilter = !showOutliersOnly || discrepancy.isOutlierVisit;
      
      return matchesSearch && matchesSalesman && matchesStatus && matchesStability && matchesOutlierFilter;
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
      } else if (sortBy === 'stability') {
        aValue = a.stabilityMeters || 0;
        bValue = b.stabilityMeters || 0;
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
  }, [locationDiscrepancies, searchTerm, selectedSalesman, selectedStatus, selectedStability, showOutliersOnly, sortBy, sortOrder]);

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
  // ENHANCED EXPORT FUNCTIONS WITH STABILITY DATA
  // ==========================================

  const exportDetailedCSV = () => {
    const csvData = [
      [
        'Visit ID', 'Shop Name', 'Shop ID', 'Department', 'Salesman', 'Visit Date', 'Visit Time',
        'Master Latitude', 'Master Longitude', 'Actual Latitude', 'Actual Longitude',
        'Distance (meters)', 'Accuracy Status', 
        'Stability (meters)', 'Stability Status', 'Total Visits for Shop', 'Coordinates Averaged',
        'Is GPS Outlier', 'Outlier Distance', 'Outliers Removed from Shop',
        'GPS Error', 'Parking Lot', 'Cluster',
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
        Math.round(d.stabilityMeters || 0),
        `"${d.stabilityStatus?.toUpperCase() || 'N/A'}"`,
        d.totalVisitsForShop || 1,
        d.coordinatesAveraged || 1,
        d.isOutlierVisit ? 'Yes' : 'No',
        d.outlierDistance || 0,
        d.outliersRemoved || 0,
        d.isGPSError ? 'Yes' : 'No',
        d.isParkingLot ? 'Yes' : 'No',
        d.isCluster ? 'Yes' : 'No',
        `"https://maps.google.com/maps?q=${d.masterLatitude},${d.masterLongitude}"`,
        `"https://maps.google.com/maps?q=${d.actualLatitude},${d.actualLongitude}"`
      ].join(','))
    ].join('\n');

    downloadCSV(csvData, 'enhanced_location_stability_detailed_report');
  };

  const exportSalesmanSummaryCSV = () => {
    const csvData = [
      [
        'Salesman', 'Total Visits', 'Accuracy Rate (%)', 'Average Distance (m)', 'Worst Distance (m)',
        'Accurate Visits', 'Acceptable Visits', 'Questionable Visits', 'Suspicious Visits', 'Impossible Visits',
        'Average Stability (m)', 'Excellent Stability', 'Poor Stability', 'Outlier Visits', 'Total Outliers Removed',
        'Excellence Rate (%)', 'Consistent GPS Error'
      ].join(','),
      ...salesmanAccuracies.map(s => [
        `"${s.salesman}"`,
        s.totalVisits,
        s.accuracyPercentage.toFixed(1),
        Math.round(s.averageDistance),
        Math.round(s.worstDistance),
        s.accurateVisits,
        s.acceptableVisits,
        s.questionableVisits,
        s.suspiciousVisits,
        s.impossibleVisits,
        Math.round(s.averageStability),
        s.excellentStability,
        s.poorStability,
        s.outlierVisits,
        s.totalOutliersRemoved,
        ((s.excellentStability / s.totalVisits) * 100).toFixed(1),
        s.consistentError ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    downloadCSV(csvData, 'enhanced_salesman_location_stability_summary');
  };

  const exportExecutiveSummaryCSV = () => {
    const csvData = [
      ['Metric', 'Distance Analysis', 'Stability Analysis'].join(','),
      ['Total Visits Analyzed', summaryStats.total, summaryStats.total],
      ['Excellent Performance', summaryStats.accurate, stabilityAnalysis?.excellentStability || 0],
      ['Good Performance', summaryStats.acceptable, stabilityAnalysis?.goodStability || 0],
      ['Moderate Performance', summaryStats.questionable, stabilityAnalysis?.moderateStability || 0],
      ['Poor Performance', summaryStats.suspicious, stabilityAnalysis?.poorStability || 0],
      ['Critical Issues', summaryStats.impossible, stabilityAnalysis?.criticalStability || 0],
      ['Overall Score', `${summaryStats.overallAccuracy.toFixed(1)}%`, `${Math.round(stabilityAnalysis?.avgStabilityMeters || 0)}m avg`],
      ['GPS Outliers Detected', 'N/A', stabilityAnalysis?.totalOutliers || 0],
      ['Shops with Multiple Visits', 'N/A', stabilityAnalysis?.shopsWithMultipleVisits || 0],
      ['Analysis Period', `${data.summary.periodStartDate.toLocaleDateString()} - ${data.summary.periodEndDate.toLocaleDateString()}`, `${data.summary.periodStartDate.toLocaleDateString()} - ${data.summary.periodEndDate.toLocaleDateString()}`],
      ['Total Salesmen Analyzed', salesmanAccuracies.length, salesmanAccuracies.length]
    ].join('\n');

    downloadCSV(csvData, 'enhanced_location_verification_executive_summary');
  };

  const exportOutlierAnalysisCSV = () => {
    const outliers = filteredAndSortedData.filter(d => d.isOutlierVisit);
    const csvData = [
      [
        'Shop ID', 'Shop Name', 'Salesman', 'Visit Date', 'Outlier Distance from Shop Center (m)',
        'Shop Stability (m)', 'Total Visits for Shop', 'Total Outliers in Shop',
        'Actual Latitude', 'Actual Longitude', 'Distance from Master (m)',
        'Google Maps Link'
      ].join(','),
      ...outliers.map(d => [
        `"${d.shopId}"`,
        `"${d.shopName}"`,
        `"${d.salesman}"`,
        d.visitDate.toLocaleDateString(),
        d.outlierDistance || 0,
        Math.round(d.stabilityMeters || 0),
        d.totalVisitsForShop || 1,
        d.outliersRemoved || 0,
        d.actualLatitude,
        d.actualLongitude,
        d.distanceMeters,
        `"https://maps.google.com/maps?q=${d.actualLatitude},${d.actualLongitude}"`
      ].join(','))
    ].join('\n');

    downloadCSV(csvData, 'gps_outlier_visits_analysis');
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
          <p className="text-gray-600">Processing enhanced location discrepancies with GPS stability analysis...</p>
          <p className="text-sm text-gray-500">
            Analyzing {data.rawVisitData?.rollingPeriodRows?.length || 0} visit records with outlier detection
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
          <p className="text-gray-600">Enhanced location data not available</p>
          <p className="text-sm text-gray-500">Raw visit data with coordinates is required for GPS stability analysis</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER COMPONENT
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📍 Enhanced Location Verification & GPS Stability Analysis
        </h2>
        <p className="text-gray-600">
          {selectedAnalysis === 'distance' 
            ? 'Analyze visit location accuracy and identify coordinate discrepancies'
            : 'Analyze GPS coordinate stability, detect outliers, and assess data quality'
          }
        </p>
        <p className="text-sm text-gray-500">
          Period: {data.summary.periodStartDate.toLocaleDateString()} - {data.summary.periodEndDate.toLocaleDateString()}
          {stabilityAnalysis && (
            <span className="ml-4">
              • {stabilityAnalysis.totalShops} shops analyzed 
              • {stabilityAnalysis.shopsWithMultipleVisits} with multiple visits
              {stabilityAnalysis.totalOutliers > 0 && <span className="text-red-600"> • {stabilityAnalysis.totalOutliers} GPS outliers detected</span>}
            </span>
          )}
        </p>
      </div>

      {/* Analysis Mode Toggle */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3 items-center justify-center">
          <button
            onClick={() => setSelectedAnalysis('distance')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              selectedAnalysis === 'distance' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Distance Analysis</span>
          </button>
          <button
            onClick={() => setSelectedAnalysis('stability')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              selectedAnalysis === 'stability' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>GPS Stability Analysis</span>
          </button>
        </div>
      </div>

      {/* Summary Cards - Dynamic based on analysis mode */}
      {selectedAnalysis === 'distance' ? (
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
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600">{stabilityAnalysis?.excellentStability || 0}</div>
            <div className="text-sm text-gray-500">Excellent (≤10m)</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">{stabilityAnalysis?.goodStability || 0}</div>
            <div className="text-sm text-gray-500">Good (≤50m)</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-yellow-600">{stabilityAnalysis?.moderateStability || 0}</div>
            <div className="text-sm text-gray-500">Moderate (≤200m)</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-orange-600">{stabilityAnalysis?.poorStability || 0}</div>
            <div className="text-sm text-gray-500">Poor (≤1000m)</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-red-600">{stabilityAnalysis?.criticalStability || 0}</div>
            <div className="text-sm text-gray-500">Critical (>1000m)</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-purple-600">{stabilityAnalysis?.totalOutliers || 0}</div>
            <div className="text-sm text-gray-500">GPS Outliers</div>
          </div>
        </div>
      )}

      {/* Enhanced Export Buttons */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportDetailedCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Enhanced Detailed Report</span>
          </button>
          <button
            onClick={exportSalesmanSummaryCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Salesman Performance</span>
          </button>
          <button
            onClick={exportExecutiveSummaryCSV}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Executive Summary</span>
          </button>
          {selectedAnalysis === 'stability' && (
            <button
              onClick={exportOutlierAnalysisCSV}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>GPS Outliers Report</span>
            </button>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {selectedAnalysis === 'distance' 
            ? 'Export traditional location accuracy analysis with distance-based metrics'
            : 'Export GPS stability analysis with coordinate consistency and outlier detection'
          }
        </div>
      </div>

      {/* Enhanced Filters */}
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

          {selectedAnalysis === 'distance' ? (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Accuracy</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          ) : (
            <select
              value={selectedStability}
              onChange={(e) => setSelectedStability(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Stability</option>
              {stabilityOptions.map(stability => (
                <option key={stability.value} value={stability.value}>{stability.label}</option>
              ))}
            </select>
          )}

          {selectedAnalysis === 'stability' && (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOutliersOnly}
                onChange={(e) => setShowOutliersOnly(e.target.checked)}
                className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50"
              />
              <span className="text-sm text-gray-700">GPS Outliers Only</span>
            </label>
          )}
        </div>
      </div>

      {/* Enhanced Salesman Performance Summary */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Salesman {selectedAnalysis === 'distance' ? 'Location Accuracy' : 'GPS Stability'} Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedAnalysis === 'distance' ? 'Accuracy Rate' : 'Avg Stability'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedAnalysis === 'distance' ? 'Suspicious' : 'Outliers'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedAnalysis === 'distance' ? 'Avg Distance' : 'GPS Quality'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedAnalysis === 'distance' ? 'Worst Distance' : 'Poor Stability'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedAnalysis === 'distance' ? 'GPS Issue' : 'Excellence Rate'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesmanAccuracies.slice(0, 10).map((salesman, index) => (
                <tr key={salesman.salesman} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {salesman.salesman}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {selectedAnalysis === 'distance' ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        salesman.accuracyPercentage >= 90 ? 'bg-green-100 text-green-800' :
                        salesman.accuracyPercentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {salesman.accuracyPercentage.toFixed(1)}%
                      </span>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        salesman.averageStability <= 50 ? 'bg-green-100 text-green-800' :
                        salesman.averageStability <= 200 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(salesman.averageStability)}m
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.totalVisits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {selectedAnalysis === 'distance' ? (
                      <span className="text-red-600">{salesman.suspiciousVisits + salesman.impossibleVisits}</span>
                    ) : (
                      <span className="text-orange-600">{salesman.outlierVisits}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {selectedAnalysis === 'distance' ? (
                      `${Math.round(salesman.averageDistance)}m`
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        salesman.excellentStability > salesman.poorStability ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {salesman.excellentStability > salesman.poorStability ? 'High' : 'Low'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {selectedAnalysis === 'distance' ? (
                      `${Math.round(salesman.worstDistance)}m`
                    ) : (
                      salesman.poorStability
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {selectedAnalysis === 'distance' ? (
                      salesman.consistentError ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          No
                        </span>
                      )
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        salesman.excellentStability / salesman.totalVisits > 0.7 ? 'bg-green-100 text-green-800' :
                        salesman.excellentStability / salesman.totalVisits > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {((salesman.excellentStability / salesman.totalVisits) * 100).toFixed(0)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Detailed Visit Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Detailed {selectedAnalysis === 'distance' ? 'Visit Discrepancies' : 'GPS Stability Analysis'}
            </h3>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedAnalysis === 'distance' ? 'Distance Error' : 'Stability & Visits'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedAnalysis === 'distance' ? 'Accuracy Status' : 'Stability Status'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedAnalysis === 'distance' ? 'Coordinates' : 'GPS Quality'}
                </th>
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
                      {selectedAnalysis === 'stability' && discrepancy.isOutlierVisit && (
                        <div className="text-xs text-red-600 font-medium">🔴 GPS OUTLIER VISIT</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {discrepancy.salesman}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {selectedAnalysis === 'distance' ? (
                      <div>
                        <div className="font-medium text-gray-900">{discrepancy.distanceMeters}m</div>
                        {discrepancy.isGPSError && (
                          <div className="text-xs text-orange-600">GPS Drift</div>
                        )}
                        {discrepancy.isParkingLot && (
                          <div className="text-xs text-blue-600">Parking Lot</div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-gray-900">{Math.round(discrepancy.stabilityMeters || 0)}m</div>
                        <div className="text-xs text-gray-500">
                          {discrepancy.totalVisitsForShop} visits
                          {(discrepancy.outliersRemoved || 0) > 0 && (
                            <span className="text-red-600"> • {discrepancy.outliersRemoved} outliers</span>
                          )}
                        </div>
                        {discrepancy.isOutlierVisit && (
                          <div className="text-xs text-red-600">{discrepancy.outlierDistance}m from center</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {selectedAnalysis === 'distance' ? (
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${discrepancy.accuracyColor}`}>
                        <discrepancy.accuracyIcon className="w-3 h-3 mr-1" />
                        {discrepancy.accuracyLabel}
                      </span>
                    ) : (
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${discrepancy.stabilityColor}`}>
                          <Target className="w-3 h-3 mr-1" />
                          {discrepancy.stabilityStatus?.toUpperCase()}
                        </span>
                        {discrepancy.isOutlierVisit && (
                          <div className="text-xs text-red-600 font-medium">OUTLIER</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {selectedAnalysis === 'distance' ? (
                      <div>
                        <div>Master: {discrepancy.masterLatitude.toFixed(6)}, {discrepancy.masterLongitude.toFixed(6)}</div>
                        <div>Actual: {discrepancy.actualLatitude.toFixed(6)}, {discrepancy.actualLongitude.toFixed(6)}</div>
                      </div>
                    ) : (
                      <div>
                        <div className={`font-medium ${
                          (discrepancy.stabilityMeters || 0) <= 50 ? 'text-green-600' : 
                          (discrepancy.stabilityMeters || 0) <= 200 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          GPS Consistency: {(discrepancy.stabilityMeters || 0) <= 50 ? 'Excellent' : 
                          (discrepancy.stabilityMeters || 0) <= 200 ? 'Good' : 'Poor'}
                        </div>
                        <div>Visits averaged: {discrepancy.coordinatesAveraged}</div>
                        {(discrepancy.outliersRemoved || 0) > 0 && (
                          <div className="text-red-600">Outliers removed: {discrepancy.outliersRemoved}</div>
                        )}
                      </div>
                    )}
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
