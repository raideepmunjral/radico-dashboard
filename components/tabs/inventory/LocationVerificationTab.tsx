'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, AlertTriangle, CheckCircle, Download, Filter, Search, Eye, X, Navigation, Target, Zap, Clock, Users, BarChart3, TrendingUp } from 'lucide-react';

// ==========================================
// ENHANCED LOCATION VERIFICATION TYPES WITH CONSENSUS-BASED FRAUD DETECTION
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
  // 🆕 NEW: Enhanced stability with consensus-based fraud detection
  stabilityMeters?: number;
  stabilityStatus?: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  stabilityColor?: string;
  totalVisitsForShop?: number;
  coordinatesAveraged?: number;
  outliersRemoved?: number;
  isOutlierVisit?: boolean;
  outlierDistance?: number;
  // 🆕 NEW: Enhanced consensus-based fraud detection fields
  consensusStatus?: 'consistent' | 'mostly_consistent' | 'inconsistent' | 'highly_suspicious' | 'single_visit' | 'two_distant_locations' | 'insufficient_data';
  fraudRiskScore?: number;
  isNormalLocation?: boolean;
  isDominantLocation?: boolean;
  deviationFromConsensus?: number;
  visitPattern?: string;
  distanceBetweenVisits?: number;
  allVisitLocations?: {lat: number, lng: number, date: string, isConsensus?: boolean, isDeviant?: boolean}[];
  isBothLocationsSuspicious?: boolean;
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
  // 🆕 NEW: Enhanced stability with consensus fraud detection
  averageStability: number;
  excellentStability: number;
  poorStability: number;
  outlierVisits: number;
  totalOutliersRemoved: number;
  // 🆕 NEW: Consensus-based fraud metrics
  consistentVisits: number;
  suspiciousPatterns: number;
  fraudRiskScore: number;
  consensusRate: number;
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
  // 🆕 NEW: Consensus analysis summary
  consistentShops: number;
  suspiciousShops: number;
  avgFraudRisk: number;
  totalFraudFlags: number;
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
// ENHANCED CONSENSUS-BASED FRAUD DETECTION UTILITIES
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

// 🆕 NEW: Enhanced consensus-based fraud detection with proper 2-visit handling
const analyzeLocationConsensus = (visits: any[], shopId: string): {
  dominantLocation: {lat: number, lng: number};
  dominantClusterSize: number;
  visitClassifications: any[];
  consensusMetrics: {
    consensusStatus: string;
    fraudRisk: number;
    visitPattern: string;
    distanceBetweenVisits?: number;
    allVisitLocations: {lat: number, lng: number, date: string, isConsensus?: boolean, isDeviant?: boolean}[];
  };
} => {
  // Collect all visit locations for map plotting with consensus info
  const allVisitLocations = visits.map(v => ({
    lat: v.actualLatitude,
    lng: v.actualLongitude,
    date: v.visitDate.toLocaleDateString(),
    isConsensus: false, // Will be updated below
    isDeviant: false    // Will be updated below
  }));

  if (visits.length <= 1) {
    allVisitLocations[0] && (allVisitLocations[0].isConsensus = true);
    return {
      dominantLocation: visits[0] ? {lat: visits[0].actualLatitude, lng: visits[0].actualLongitude} : {lat: 0, lng: 0},
      dominantClusterSize: visits.length,
      visitClassifications: visits.map(v => ({
        ...v, 
        isNormalLocation: true, 
        deviationFromConsensus: 0,
        isDominantLocation: true
      })),
      consensusMetrics: {
        consensusStatus: 'single_visit',
        fraudRisk: 0.5,
        visitPattern: 'Single visit - verification needed',
        allVisitLocations
      }
    };
  }

  // 🆕 ENHANCED: Special handling for 2-visit scenarios
  if (visits.length === 2) {
    const distanceBetween = calculateDistance(
      visits[0].actualLatitude, visits[0].actualLongitude,
      visits[1].actualLatitude, visits[1].actualLongitude
    );

    if (distanceBetween <= 200) {
      // Both visits close together = consistent
      const avgLat = (visits[0].actualLatitude + visits[1].actualLatitude) / 2;
      const avgLng = (visits[0].actualLongitude + visits[1].actualLongitude) / 2;
      
      // Mark both as consensus
      allVisitLocations.forEach(loc => loc.isConsensus = true);
      
      return {
        dominantLocation: {lat: avgLat, lng: avgLng},
        dominantClusterSize: 2,
        visitClassifications: visits.map(v => ({
          ...v,
          isNormalLocation: true,
          isDominantLocation: true,
          deviationFromConsensus: Math.round(distanceBetween / 2),
          isSuspiciousVisit: false
        })),
        consensusMetrics: {
          consensusStatus: 'consistent',
          fraudRisk: 0.1,
          visitPattern: `Both visits from same location (${Math.round(distanceBetween)}m apart) - CONSISTENT`,
          distanceBetweenVisits: Math.round(distanceBetween),
          allVisitLocations
        }
      };
    } else {
      // Visits far apart = both suspicious, no consensus possible
      // Mark both as deviant (suspicious)
      allVisitLocations.forEach(loc => loc.isDeviant = true);
      
      return {
        dominantLocation: {lat: visits[0].actualLatitude, lng: visits[0].actualLongitude}, // Arbitrary reference point
        dominantClusterSize: 0, // No true consensus
        visitClassifications: visits.map(v => ({
          ...v,
          isNormalLocation: false,
          isDominantLocation: false,
          deviationFromConsensus: Math.round(distanceBetween),
          isSuspiciousVisit: true,
          isBothLocationsSuspicious: true
        })),
        consensusMetrics: {
          consensusStatus: 'two_distant_locations',
          fraudRisk: 0.8, // High risk - definitely suspicious
          visitPattern: `2 visits ${Math.round(distanceBetween)}m apart - BOTH LOCATIONS SUSPICIOUS`,
          distanceBetweenVisits: Math.round(distanceBetween),
          allVisitLocations
        }
      };
    }
  }

  // STEP 1: Create location clusters for 3+ visits (original logic)
  const CONSENSUS_THRESHOLD = 200;
  const clusters: {coordinates: {lat: number, lng: number}, visits: any[]}[] = [];

  visits.forEach(visit => {
    let addedToCluster = false;
    
    for (let cluster of clusters) {
      const distance = calculateDistance(
        cluster.coordinates.lat, cluster.coordinates.lng,
        visit.actualLatitude, visit.actualLongitude
      );
      
      if (distance <= CONSENSUS_THRESHOLD) {
        cluster.visits.push(visit);
        addedToCluster = true;
        break;
      }
    }
    
    if (!addedToCluster) {
      clusters.push({
        coordinates: {lat: visit.actualLatitude, lng: visit.actualLongitude},
        visits: [visit]
      });
    }
  });

  // STEP 2: Find dominant cluster (most frequently visited location = "normal" location)
  const dominantCluster = clusters.reduce((largest, current) => 
    current.visits.length > largest.visits.length ? current : largest
  );

  // STEP 3: Classify each visit based on consensus AND mark locations
  const visitClassifications = visits.map((visit, visitIndex) => {
    const distanceFromDominant = calculateDistance(
      dominantCluster.coordinates.lat, dominantCluster.coordinates.lng,
      visit.actualLatitude, visit.actualLongitude
    );
    
    const isNormalLocation = distanceFromDominant <= CONSENSUS_THRESHOLD;
    const isDominantLocation = dominantCluster.visits.some(cv => cv.visitId === visit.visitId);
    
    // 🆕 NEW: Mark consensus vs deviant in allVisitLocations
    if (allVisitLocations[visitIndex]) {
      allVisitLocations[visitIndex].isConsensus = isNormalLocation;
      allVisitLocations[visitIndex].isDeviant = !isNormalLocation && distanceFromDominant > 500;
    }
    
    return {
      ...visit,
      isNormalLocation,
      isDominantLocation,
      deviationFromConsensus: Math.round(distanceFromDominant),
      isSuspiciousVisit: !isNormalLocation && distanceFromDominant > 500
    };
  });

  // STEP 4: Calculate consensus metrics for 3+ visits
  const dominantVisits = dominantCluster.visits.length;
  const totalVisits = visits.length;
  const consensusRate = dominantVisits / totalVisits;
  const suspiciousCount = visitClassifications.filter(v => v.isSuspiciousVisit).length;

  // Determine consensus status based on pattern
  let consensusStatus = 'consistent';
  let fraudRisk = 0.1;
  
  if (consensusRate >= 0.8) {
    consensusStatus = 'consistent';
    fraudRisk = 0.1;
  } else if (consensusRate >= 0.6) {
    consensusStatus = 'mostly_consistent';
    fraudRisk = 0.3;
  } else if (consensusRate >= 0.4) {
    consensusStatus = 'inconsistent';
    fraudRisk = 0.6;
  } else {
    consensusStatus = 'highly_suspicious';
    fraudRisk = 0.9;
  }

  // Generate pattern description for fraud analysis
  let visitPattern = '';
  if (dominantVisits === totalVisits) {
    visitPattern = `All ${totalVisits} visits from same location - CONSISTENT`;
  } else if (dominantVisits === totalVisits - 1) {
    visitPattern = `${dominantVisits}/${totalVisits} visits normal, 1 deviant - investigate`;
  } else if (suspiciousCount > 0) {
    visitPattern = `${dominantVisits}/${totalVisits} normal, ${suspiciousCount} highly suspicious - FRAUD RISK`;
  } else {
    visitPattern = `${dominantVisits}/${totalVisits} visits from dominant location - mixed pattern`;
  }

  return {
    dominantLocation: dominantCluster.coordinates,
    dominantClusterSize: dominantVisits,
    visitClassifications,
    consensusMetrics: {
      consensusStatus,
      fraudRisk,
      visitPattern,
      allVisitLocations
    }
  };
};

// Enhanced outlier detection using consensus analysis
const detectOutlierVisits = (visits: any[], shopId: string): any[] => {
  if (visits.length <= 1) return visits.map(v => ({...v, isOutlierVisit: false, outlierDistance: 0}));
  
  // Use consensus analysis to detect outliers
  const consensusResult = analyzeLocationConsensus(visits, shopId);
  
  return consensusResult.visitClassifications.map(visit => ({
    ...visit,
    isOutlierVisit: !visit.isNormalLocation && visit.deviationFromConsensus > 500,
    outlierDistance: visit.deviationFromConsensus
  }));
};

// Calculate stability metrics using consensus approach
const calculateShopStability = (visits: any[], shopId: string): number => {
  if (visits.length <= 1) return 0;
  
  const consensusResult = analyzeLocationConsensus(visits, shopId);
  const dominantLat = consensusResult.dominantLocation.lat;
  const dominantLng = consensusResult.dominantLocation.lng;
  
  // Calculate average deviation from dominant location (consensus center)
  const deviations = visits.map(visit => 
    calculateDistance(dominantLat, dominantLng, visit.actualLatitude, visit.actualLongitude)
  );
  
  return deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
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

// 🔧 FIXED: Multi-location map plotting with working 2-location directions
const plotMultipleLocations = (visitLocations: {lat: number, lng: number, date: string, isConsensus?: boolean, isDeviant?: boolean}[]) => {
  if (visitLocations.length === 1) {
    // Single location
    const location = visitLocations[0];
    window.open(`https://maps.google.com/maps?q=${location.lat},${location.lng}`, '_blank');
  } else if (visitLocations.length === 2) {
    // 🔧 FIXED: Two locations - show both with directions (THIS WORKS!)
    const [loc1, loc2] = visitLocations;
    const url = `https://maps.google.com/maps/dir/${loc1.lat},${loc1.lng}/${loc2.lat},${loc2.lng}`;
    window.open(url, '_blank');
  } else {
    // Multiple locations - show as waypoints
    const origin = visitLocations[0];
    const destination = visitLocations[visitLocations.length - 1];
    const waypoints = visitLocations.slice(1, -1).map(loc => `${loc.lat},${loc.lng}`).join('|');
    const url = `https://maps.google.com/maps/dir/${origin.lat},${origin.lng}/${destination.lat},${destination.lng}${waypoints ? `?waypoints=${waypoints}` : ''}`;
    window.open(url, '_blank');
  }
};

// 🔧 FIXED: Enhanced plotting with proper handling for fraud investigation
const plotEnhancedLocations = (discrepancy: LocationDiscrepancy) => {
  if (!discrepancy.allVisitLocations) return;

  const visitLocations = discrepancy.allVisitLocations;
  
  if (visitLocations.length === 1) {
    // Single location
    const location = visitLocations[0];
    window.open(`https://maps.google.com/maps?q=${location.lat},${location.lng}`, '_blank');
    return;
  }

  if (visitLocations.length === 2) {
    // 🔧 FIXED: Use the working directions approach for 2 locations
    const [loc1, loc2] = visitLocations;
    const url = `https://maps.google.com/maps/dir/${loc1.lat},${loc1.lng}/${loc2.lat},${loc2.lng}`;
    window.open(url, '_blank');
    return;
  }

  // For 3+ locations, try to create a map with colored markers
  // If the complex marker approach fails, fallback to simple directions
  try {
    let baseUrl = 'https://maps.google.com/maps?q=';
    const firstLocation = visitLocations[0];
    baseUrl += `${firstLocation.lat},${firstLocation.lng}`;

    // Create markers for all locations with color coding
    visitLocations.forEach((loc, index) => {
      let color = 'blue'; // Default color
      let label = (index + 1).toString();

      // Color code based on consensus/deviant status
      if (loc.isConsensus) {
        color = 'green';
        label = 'C';
      } else if (loc.isDeviant) {
        color = 'red';
        label = 'D';
      } else {
        // Use consensus status for color coding
        if (discrepancy.consensusStatus === 'consistent') {
          color = 'green';
          label = 'C';
        } else if (discrepancy.consensusStatus === 'mostly_consistent') {
          color = index === 0 ? 'green' : 'yellow';
          label = index === 0 ? 'C' : 'M';
        } else if (discrepancy.consensusStatus === 'inconsistent' || 
                   discrepancy.consensusStatus === 'highly_suspicious') {
          color = 'orange';
          label = 'S';
        }
      }
      
      baseUrl += `&markers=color:${color}|label:${label}|${loc.lat},${loc.lng}`;
    });

    window.open(baseUrl, '_blank');
  } catch (error) {
    // Fallback to simple directions if marker approach fails
    console.warn('Complex marker plotting failed, using simple directions:', error);
    plotMultipleLocations(visitLocations);
  }
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
  // ENHANCED PROCESSING WITH CONSENSUS-BASED FRAUD DETECTION
  // ==========================================

  const processLocationDiscrepancies = useMemo(() => {
    if (!data.rawVisitData || processed) return { discrepancies: [], accuracies: [], stability: null };

    console.log('🔄 Processing location discrepancies with consensus-based fraud detection...');
    const { rollingPeriodRows, columnIndices, shopSalesmanMap, parseDate } = data.rawVisitData;

    const discrepancies: LocationDiscrepancy[] = [];
    const salesmanStats: Record<string, SalesmanAccuracy> = {};
    const shopVisitGroups: Record<string, any[]> = {}; // Group visits by shop for consensus analysis

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

      // Group visits by shop for consensus analysis
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
    // STEP 2: Enhanced consensus analysis and stability calculation per shop
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
      totalStabilitySum: 0,
      // 🆕 NEW: Consensus metrics
      consistentShops: 0,
      suspiciousShops: 0,
      totalFraudRisk: 0,
      totalFraudFlags: 0
    };

    Object.keys(shopVisitGroups).forEach(shopId => {
      const shopVisits = shopVisitGroups[shopId];
      stabilityStats.totalShops++;

      // Perform consensus analysis for fraud detection
      const consensusResult = analyzeLocationConsensus(shopVisits, shopId);

      if (shopVisits.length > 1) {
        stabilityStats.shopsWithMultipleVisits++;
        
        // Calculate stability using consensus approach
        const stabilityMeters = calculateShopStability(shopVisits, shopId);
        stabilityStats.totalStabilitySum += stabilityMeters;

        // Categorize stability
        if (stabilityMeters <= 10) stabilityStats.excellentStability++;
        else if (stabilityMeters <= 50) stabilityStats.goodStability++;
        else if (stabilityMeters <= 200) stabilityStats.moderateStability++;
        else if (stabilityMeters <= 1000) stabilityStats.poorStability++;
        else stabilityStats.criticalStability++;

        // Detect outliers using consensus analysis
        const visitsWithOutliers = detectOutlierVisits(shopVisits, shopId);
        const outliers = visitsWithOutliers.filter(v => v.isOutlierVisit);
        stabilityStats.totalOutliers += outliers.length;

        // 🆕 NEW: Track consensus metrics for fraud detection
        const fraudRisk = consensusResult.consensusMetrics.fraudRisk;
        stabilityStats.totalFraudRisk += fraudRisk;
        
        if (consensusResult.consensusMetrics.consensusStatus === 'consistent' || 
            consensusResult.consensusMetrics.consensusStatus === 'mostly_consistent') {
          stabilityStats.consistentShops++;
        }
        
        if (consensusResult.consensusMetrics.consensusStatus === 'highly_suspicious' || 
            outliers.length > 0) {
          stabilityStats.suspiciousShops++;
          stabilityStats.totalFraudFlags += outliers.length;
        }

        // Add enhanced stability and consensus info to each visit
        shopVisits.forEach((visit, index) => {
          const visitWithOutlier = visitsWithOutliers[index];
          const consensusVisit = consensusResult.visitClassifications[index];
          
          visit.stabilityMeters = stabilityMeters;
          visit.totalVisitsForShop = shopVisits.length;
          visit.coordinatesAveraged = shopVisits.length;
          visit.outliersRemoved = outliers.length;
          visit.isOutlierVisit = visitWithOutlier.isOutlierVisit;
          visit.outlierDistance = visitWithOutlier.outlierDistance;
          
          // 🆕 NEW: Add enhanced consensus-based fraud detection data
          visit.consensusStatus = consensusResult.consensusMetrics.consensusStatus;
          visit.fraudRiskScore = fraudRisk;
          visit.isNormalLocation = consensusVisit.isNormalLocation;
          visit.isDominantLocation = consensusVisit.isDominantLocation;
          visit.deviationFromConsensus = consensusVisit.deviationFromConsensus;
          visit.visitPattern = consensusResult.consensusMetrics.visitPattern;
          visit.distanceBetweenVisits = consensusResult.consensusMetrics.distanceBetweenVisits;
          visit.allVisitLocations = consensusResult.consensusMetrics.allVisitLocations;
          visit.isBothLocationsSuspicious = consensusVisit.isBothLocationsSuspicious || false;
        });
      } else {
        // Single visit shops
        const visit = shopVisits[0];
        visit.stabilityMeters = 0;
        visit.totalVisitsForShop = 1;
        visit.coordinatesAveraged = 1;
        visit.outliersRemoved = 0;
        visit.isOutlierVisit = false;
        visit.consensusStatus = 'single_visit';
        visit.fraudRiskScore = 0.5;
        visit.isNormalLocation = true;
        visit.isDominantLocation = true;
        visit.deviationFromConsensus = 0;
        visit.visitPattern = 'Single visit - verification needed';
        visit.allVisitLocations = [{lat: visit.actualLatitude, lng: visit.actualLongitude, date: visit.visitDate.toLocaleDateString(), isConsensus: true, isDeviant: false}];
        visit.isBothLocationsSuspicious = false;
      }
    });

    // ==========================================
    // STEP 3: Create enhanced discrepancy records with consensus fraud detection
    // ==========================================
    Object.values(shopVisitGroups).flat().forEach(visit => {
      // Calculate distance
      const distance = calculateDistance(
        visit.masterLatitude, visit.masterLongitude, 
        visit.actualLatitude, visit.actualLongitude
      );
      
      const accuracy = getAccuracyStatus(distance);
      const stability = getStabilityStatus(visit.stabilityMeters || 0);

      // Create enhanced discrepancy record with consensus fraud detection
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
        // 🆕 NEW: Enhanced stability with consensus
        stabilityStatus: stability.status,
        stabilityColor: stability.color
      };

      discrepancies.push(discrepancy);

      // Track enhanced salesman statistics with fraud detection
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
          // 🆕 NEW: Enhanced stability metrics
          averageStability: 0,
          excellentStability: 0,
          poorStability: 0,
          outlierVisits: 0,
          totalOutliersRemoved: 0,
          // 🆕 NEW: Consensus fraud detection metrics
          consistentVisits: 0,
          suspiciousPatterns: 0,
          fraudRiskScore: 0,
          consensusRate: 0
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

      // 🆕 NEW: Track enhanced consensus metrics for fraud detection
      if (visit.isOutlierVisit) stats.outlierVisits++;
      stats.totalOutliersRemoved += visit.outliersRemoved || 0;
      stats.fraudRiskScore += visit.fraudRiskScore || 0;
      
      if (visit.consensusStatus === 'consistent' || visit.consensusStatus === 'mostly_consistent') {
        stats.consistentVisits++;
      }
      
      if (visit.isOutlierVisit || (visit.fraudRiskScore || 0) > 0.7) {
        stats.suspiciousPatterns++;
      }
      
      if (stability.status === 'excellent') stats.excellentStability++;
      else if (['poor', 'critical'].includes(stability.status)) stats.poorStability++;
    });

    // Detect clustering (unchanged)
    const clusteredDiscrepancies = detectClustering(discrepancies);

    // Calculate final enhanced salesman stats with fraud detection
    Object.values(salesmanStats).forEach(stats => {
      const goodVisits = stats.accurateVisits + stats.acceptableVisits;
      stats.accuracyPercentage = stats.totalVisits > 0 ? (goodVisits / stats.totalVisits) * 100 : 0;
      stats.averageDistance = stats.totalVisits > 0 ? 
        stats.visits.reduce((sum, visit) => sum + visit.distanceMeters, 0) / stats.totalVisits : 0;
      
      // Calculate average stability for this salesman
      const stabilityValues = stats.visits.map(v => v.stabilityMeters || 0).filter(s => s > 0);
      stats.averageStability = stabilityValues.length > 0 ?
        stabilityValues.reduce((sum, s) => sum + s, 0) / stabilityValues.length : 0;
      
      // 🆕 NEW: Calculate consensus-based fraud metrics
      stats.fraudRiskScore = stats.totalVisits > 0 ? stats.fraudRiskScore / stats.totalVisits : 0;
      stats.consensusRate = stats.totalVisits > 0 ? (stats.consistentVisits / stats.totalVisits) * 100 : 0;
      
      // Detect consistent GPS error pattern (unchanged)
      const distances = stats.visits.map(v => v.distanceMeters);
      const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
      const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
      stats.consistentError = variance < 50 && avgDistance > 50;
    });

    // Create final enhanced stability analysis with consensus fraud detection
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
        stabilityStats.totalStabilitySum / stabilityStats.shopsWithMultipleVisits : 0,
      // 🆕 NEW: Consensus fraud detection summary
      consistentShops: stabilityStats.consistentShops,
      suspiciousShops: stabilityStats.suspiciousShops,
      avgFraudRisk: stabilityStats.shopsWithMultipleVisits > 0 ?
        stabilityStats.totalFraudRisk / stabilityStats.shopsWithMultipleVisits : 0,
      totalFraudFlags: stabilityStats.totalFraudFlags
    };

    console.log('✅ Enhanced location discrepancies with consensus-based fraud detection processed:', {
      totalDiscrepancies: clusteredDiscrepancies.length,
      shopsAnalyzed: stabilityStats.totalShops,
      multiVisitShops: stabilityStats.shopsWithMultipleVisits,
      outliersDetected: stabilityStats.totalOutliers,
      fraudFlags: stabilityStats.totalFraudFlags,
      avgStability: finalStabilityAnalysis.avgStabilityMeters.toFixed(1) + 'm',
      avgFraudRisk: finalStabilityAnalysis.avgFraudRisk.toFixed(2)
    });

    return {
      discrepancies: clusteredDiscrepancies,
      accuracies: Object.values(salesmanStats).sort((a, b) => b.fraudRiskScore - a.fraudRiskScore),
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
  // ENHANCED EXPORT FUNCTIONS WITH CONSENSUS FRAUD DETECTION DATA
  // ==========================================

  const exportDetailedCSV = () => {
    const csvData = [
      [
        'Visit ID', 'Shop Name', 'Shop ID', 'Department', 'Salesman', 'Visit Date', 'Visit Time',
        'Master Latitude', 'Master Longitude', 'Actual Latitude', 'Actual Longitude',
        'Distance (meters)', 'Accuracy Status', 
        'Stability (meters)', 'Stability Status', 'Total Visits for Shop', 'Coordinates Averaged',
        'Is GPS Outlier', 'Outlier Distance', 'Outliers Removed from Shop',
        'Consensus Status', 'Fraud Risk Score', 'Is Normal Location', 'Is Consensus Visit', 'Deviation from Consensus',
        'Distance Between Visits (m)', 'Both Locations Suspicious', 'Visit Pattern', 'GPS Error', 'Parking Lot', 'Cluster',
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
        `"${d.consensusStatus?.toUpperCase() || 'N/A'}"`,
        (d.fraudRiskScore || 0).toFixed(2),
        d.isNormalLocation ? 'Yes' : 'No',
        d.isDominantLocation ? 'Yes' : 'No',
        d.deviationFromConsensus || 0,
        d.distanceBetweenVisits || 0,
        d.isBothLocationsSuspicious ? 'Yes' : 'No',
        `"${d.visitPattern || 'N/A'}"`,
        d.isGPSError ? 'Yes' : 'No',
        d.isParkingLot ? 'Yes' : 'No',
        d.isCluster ? 'Yes' : 'No',
        `"https://maps.google.com/maps?q=${d.masterLatitude},${d.masterLongitude}"`,
        `"https://maps.google.com/maps?q=${d.actualLatitude},${d.actualLongitude}"`
      ].join(','))
    ].join('\n');

    downloadCSV(csvData, 'enhanced_location_consensus_vs_deviant_fraud_detection_report');
  };

  const exportSalesmanSummaryCSV = () => {
    const csvData = [
      [
        'Salesman', 'Total Visits', 'Accuracy Rate (%)', 'Average Distance (m)', 'Worst Distance (m)',
        'Accurate Visits', 'Acceptable Visits', 'Questionable Visits', 'Suspicious Visits', 'Impossible Visits',
        'Average Stability (m)', 'Excellent Stability', 'Poor Stability', 'Outlier Visits', 'Total Outliers Removed',
        'Consistent Visits', 'Suspicious Patterns', 'Fraud Risk Score', 'Consensus Rate (%)',
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
        s.consistentVisits,
        s.suspiciousPatterns,
        s.fraudRiskScore.toFixed(2),
        s.consensusRate.toFixed(1),
        ((s.excellentStability / s.totalVisits) * 100).toFixed(1),
        s.consistentError ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    downloadCSV(csvData, 'enhanced_salesman_consensus_fraud_performance_summary');
  };

  const exportExecutiveSummaryCSV = () => {
    const csvData = [
      ['Metric', 'Distance Analysis', 'Stability Analysis', 'Consensus Fraud Detection'].join(','),
      ['Total Visits Analyzed', summaryStats.total, summaryStats.total, summaryStats.total],
      ['Excellent Performance', summaryStats.accurate, stabilityAnalysis?.excellentStability || 0, stabilityAnalysis?.consistentShops || 0],
      ['Good Performance', summaryStats.acceptable, stabilityAnalysis?.goodStability || 0, 'N/A'],
      ['Moderate Performance', summaryStats.questionable, stabilityAnalysis?.moderateStability || 0, 'N/A'],
      ['Poor Performance', summaryStats.suspicious, stabilityAnalysis?.poorStability || 0, 'N/A'],
      ['Critical Issues', summaryStats.impossible, stabilityAnalysis?.criticalStability || 0, stabilityAnalysis?.suspiciousShops || 0],
      ['Overall Score', `${summaryStats.overallAccuracy.toFixed(1)}%`, `${Math.round(stabilityAnalysis?.avgStabilityMeters || 0)}m avg`, `${((stabilityAnalysis?.avgFraudRisk || 0) * 100).toFixed(1)}% avg fraud risk`],
      ['GPS Outliers Detected', 'N/A', stabilityAnalysis?.totalOutliers || 0, stabilityAnalysis?.totalFraudFlags || 0],
      ['Shops with Multiple Visits', 'N/A', stabilityAnalysis?.shopsWithMultipleVisits || 0, stabilityAnalysis?.shopsWithMultipleVisits || 0],
      ['Analysis Period', `${data.summary.periodStartDate.toLocaleDateString()} - ${data.summary.periodEndDate.toLocaleDateString()}`, `${data.summary.periodStartDate.toLocaleDateString()} - ${data.summary.periodEndDate.toLocaleDateString()}`, `${data.summary.periodStartDate.toLocaleDateString()} - ${data.summary.periodEndDate.toLocaleDateString()}`],
      ['Total Salesmen Analyzed', salesmanAccuracies.length, salesmanAccuracies.length, salesmanAccuracies.length]
    ].join('\n');

    downloadCSV(csvData, 'enhanced_location_verification_consensus_fraud_executive_summary');
  };

  const exportOutlierAnalysisCSV = () => {
    const outliers = filteredAndSortedData.filter(d => d.isOutlierVisit);
    const csvData = [
      [
        'Shop ID', 'Shop Name', 'Salesman', 'Visit Date', 'Outlier Distance from Shop Center (m)',
        'Shop Stability (m)', 'Total Visits for Shop', 'Total Outliers in Shop',
        'Consensus Status', 'Fraud Risk Score', 'Is Consensus Visit', 'Deviation from Consensus (m)', 'Distance Between Visits (m)', 'Visit Pattern',
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
        `"${d.consensusStatus?.toUpperCase() || 'N/A'}"`,
        (d.fraudRiskScore || 0).toFixed(2),
        d.isDominantLocation ? 'Yes' : 'No',
        d.deviationFromConsensus || 0,
        d.distanceBetweenVisits || 0,
        `"${d.visitPattern || 'N/A'}"`,
        d.actualLatitude,
        d.actualLongitude,
        d.distanceMeters,
        `"https://maps.google.com/maps?q=${d.actualLatitude},${d.actualLongitude}"`
      ].join(','))
    ].join('\n');

    downloadCSV(csvData, 'consensus_vs_deviant_fraud_outlier_analysis');
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
          <p className="text-gray-600">Processing enhanced location discrepancies with consensus-based fraud detection...</p>
          <p className="text-sm text-gray-500">
            Analyzing {data.rawVisitData?.rollingPeriodRows?.length || 0} visit records with consensus fraud detection
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
          <p className="text-sm text-gray-500">Raw visit data with coordinates is required for consensus fraud analysis</p>
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
          📍 Enhanced Location Verification & Consensus-Based Fraud Detection
        </h2>
        <p className="text-gray-600">
          {selectedAnalysis === 'distance' 
            ? 'Analyze visit location accuracy and identify coordinate discrepancies'
            : 'Analyze GPS coordinate stability with consensus-based fraud detection and outlier analysis'
          }
        </p>
        <p className="text-sm text-gray-500">
          Period: {data.summary.periodStartDate.toLocaleDateString()} - {data.summary.periodEndDate.toLocaleDateString()}
          {stabilityAnalysis && (
            <span className="ml-4">
              • {stabilityAnalysis.totalShops} shops analyzed 
              • {stabilityAnalysis.shopsWithMultipleVisits} with multiple visits
              {stabilityAnalysis.totalOutliers > 0 && <span className="text-red-600"> • {stabilityAnalysis.totalOutliers} GPS outliers detected</span>}
              {stabilityAnalysis.totalFraudFlags > 0 && <span className="text-red-600"> • {stabilityAnalysis.totalFraudFlags} fraud flags</span>}
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
            <span>Consensus Fraud Detection</span>
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
            <div className="text-2xl font-bold text-green-600">{stabilityAnalysis?.consistentShops || 0}</div>
            <div className="text-sm text-gray-500">Consistent Shops</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">{stabilityAnalysis?.excellentStability || 0}</div>
            <div className="text-sm text-gray-500">Excellent GPS (≤10m)</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-yellow-600">{stabilityAnalysis?.moderateStability || 0}</div>
            <div className="text-sm text-gray-500">Moderate GPS (≤200m)</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-orange-600">{stabilityAnalysis?.suspiciousShops || 0}</div>
            <div className="text-sm text-gray-500">Suspicious Shops</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-red-600">{stabilityAnalysis?.totalFraudFlags || 0}</div>
            <div className="text-sm text-gray-500">Fraud Flags</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-purple-600">{stabilityAnalysis?.totalOutliers || 0}</div>
            <div className="text-sm text-gray-500">GPS Outliers</div>
          </div>
        </div>
      )}

      {/* Enhanced Export Buttons with Fraud Detection Info */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportDetailedCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Enhanced Fraud Detection Report</span>
          </button>
          <button
            onClick={exportSalesmanSummaryCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Salesman Fraud Performance</span>
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
              <span>Consensus Fraud Analysis</span>
            </button>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {selectedAnalysis === 'distance' 
            ? 'Export traditional location accuracy analysis with distance-based metrics'
            : 'Export consensus-based fraud detection analysis with visit pattern recognition and outlier analysis'
          }
        </div>
        {/* 🔧 FIXED: Map plotting legend for fraud investigation */}
        {selectedAnalysis === 'stability' && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">📍 Map Plotting Legend (FIXED - Now Works!):</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Green (C) = Consensus Location</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Red (D) = Deviant/Fraud Location</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>Yellow (M) = Mixed Pattern</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span>Orange (S) = Suspicious Pattern</span>
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium mt-2">
              ✅ 2-Location plotting now works correctly - shows both locations with directions!
            </div>
          </div>
        )}
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
              <span className="text-sm text-gray-700">Fraud Outliers Only</span>
            </label>
          )}
        </div>
      </div>

      {/* Enhanced Salesman Performance Summary with Fraud Detection */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Salesman {selectedAnalysis === 'distance' ? 'Location Accuracy' : 'Consensus Fraud Detection'} Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedAnalysis === 'distance' ? 'Accuracy Rate' : 'Fraud Risk'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedAnalysis === 'distance' ? 'Suspicious' : 'Fraud Patterns'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedAnalysis === 'distance' ? 'Avg Distance' : 'Consensus Rate'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedAnalysis === 'distance' ? 'Worst Distance' : 'Outliers'}
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
                        salesman.fraudRiskScore <= 0.3 ? 'bg-green-100 text-green-800' :
                        salesman.fraudRiskScore <= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(salesman.fraudRiskScore * 100).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{salesman.totalVisits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {selectedAnalysis === 'distance' ? (
                      <span className="text-red-600">{salesman.suspiciousVisits + salesman.impossibleVisits}</span>
                    ) : (
                      <span className="text-orange-600">{salesman.suspiciousPatterns}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {selectedAnalysis === 'distance' ? (
                      `${Math.round(salesman.averageDistance)}m`
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        salesman.consensusRate >= 80 ? 'bg-green-100 text-green-800' :
                        salesman.consensusRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {salesman.consensusRate.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {selectedAnalysis === 'distance' ? (
                      `${Math.round(salesman.worstDistance)}m`
                    ) : (
                      salesman.outlierVisits
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

      {/* Enhanced Detailed Visit Analysis with FIXED Consensus Fraud Detection */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Detailed {selectedAnalysis === 'distance' ? 'Visit Discrepancies' : 'Consensus Fraud Analysis'}
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
                  {selectedAnalysis === 'distance' ? 'Distance Error' : 'Consensus Analysis'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedAnalysis === 'distance' ? 'Accuracy Status' : 'Fraud Detection'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {selectedAnalysis === 'distance' ? 'Coordinates' : 'Visit Pattern'}
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
                        <div className="text-xs text-red-600 font-medium">🚨 FRAUD OUTLIER</div>
                      )}
                      {selectedAnalysis === 'stability' && discrepancy.consensusStatus === 'two_distant_locations' && (
                        <div className="text-xs text-red-600 font-medium">🚨 BOTH LOCATIONS SUSPICIOUS</div>
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
                        {discrepancy.consensusStatus === 'two_distant_locations' ? (
                          <div>
                            <div className="font-medium text-red-600">2 SUSPICIOUS LOCATIONS</div>
                            <div className="text-xs text-gray-600">
                              Distance: {discrepancy.distanceBetweenVisits}m apart
                            </div>
                            <div className="text-xs text-red-600 font-medium">
                              Risk: {((discrepancy.fraudRiskScore || 0) * 100).toFixed(0)}%
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-gray-900">
                              {discrepancy.isNormalLocation ? 'Normal Location' : 'Deviant Location'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {discrepancy.totalVisitsForShop} visits • {discrepancy.deviationFromConsensus}m from consensus
                            </div>
                            <div className="text-xs">
                              <span className={`font-medium ${
                                (discrepancy.fraudRiskScore || 0) <= 0.3 ? 'text-green-600' :
                                (discrepancy.fraudRiskScore || 0) <= 0.6 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                Risk: {((discrepancy.fraudRiskScore || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
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
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                          discrepancy.consensusStatus === 'consistent' ? 'bg-green-100 text-green-800' :
                          discrepancy.consensusStatus === 'mostly_consistent' ? 'bg-blue-100 text-blue-800' :
                          discrepancy.consensusStatus === 'inconsistent' ? 'bg-yellow-100 text-yellow-800' :
                          discrepancy.consensusStatus === 'highly_suspicious' ? 'bg-red-100 text-red-800' :
                          discrepancy.consensusStatus === 'two_distant_locations' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          <Target className="w-3 h-3 mr-1" />
                          {discrepancy.consensusStatus === 'two_distant_locations' ? 'BOTH SUSPICIOUS' : 
                           discrepancy.consensusStatus?.toUpperCase()}
                        </span>
                        {discrepancy.isOutlierVisit && !discrepancy.isBothLocationsSuspicious && (
                          <div className="text-xs text-red-600 font-medium">FRAUD OUTLIER</div>
                        )}
                        {discrepancy.isBothLocationsSuspicious && (
                          <div className="text-xs text-red-600 font-medium">BOTH LOCATIONS SUSPICIOUS</div>
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
                        <div className="font-medium text-gray-700 mb-1">
                          {discrepancy.visitPattern || 'Pattern analysis not available'}
                        </div>
                        {discrepancy.consensusStatus === 'two_distant_locations' ? (
                          <div>
                            <div className="text-red-600 font-medium">⚠ Both locations require investigation</div>
                            <div className="text-red-600">Distance: {discrepancy.distanceBetweenVisits}m apart</div>
                            {discrepancy.allVisitLocations && discrepancy.allVisitLocations.length === 2 && (
                              <button
                                onClick={() => plotMultipleLocations(discrepancy.allVisitLocations || [])}
                                className="mt-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                              >
                                🗺️ Plot Both Suspicious Locations (FIXED!)
                              </button>
                            )}
                          </div>
                        ) : discrepancy.outliersRemoved && discrepancy.outliersRemoved > 0 ? (
                          <div>
                            <div className="text-orange-600 font-medium">
                              {discrepancy.isDominantLocation ? (
                                <span className="text-green-600">✓ Consensus location (normal)</span>
                              ) : (
                                <span className="text-red-600">⚠ Deviant location (fraud?)</span>
                              )}
                            </div>
                            <div className="text-red-600">⚠ {discrepancy.outliersRemoved} outliers in shop</div>
                            {discrepancy.allVisitLocations && discrepancy.allVisitLocations.length > 1 && (
                              <button
                                onClick={() => plotEnhancedLocations(discrepancy)}
                                className="mt-1 bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700"
                              >
                                🗺️ Plot Consensus + Deviant Locations (FIXED!)
                              </button>
                            )}
                          </div>
                        ) : discrepancy.consensusStatus === 'highly_suspicious' || discrepancy.consensusStatus === 'inconsistent' ? (
                          <div>
                            <div className="text-yellow-600 font-medium">⚠ Multiple location pattern detected</div>
                            {discrepancy.allVisitLocations && discrepancy.allVisitLocations.length > 1 && (
                              <button
                                onClick={() => plotEnhancedLocations(discrepancy)}
                                className="mt-1 bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700"
                              >
                                🗺️ Plot All Visit Locations (FIXED!)
                              </button>
                            )}
                          </div>
                        ) : (
                          <div>
                            {discrepancy.isDominantLocation ? (
                              <span className="text-green-600">✓ Consensus location</span>
                            ) : (
                              <span className="text-orange-600">⚠ Minor deviation</span>
                            )}
                          </div>
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
                      {/* 🔧 FIXED: Enhanced multi-location plotting for fraud investigation */}
                      {discrepancy.allVisitLocations && discrepancy.allVisitLocations.length > 1 && (
                        <button
                          onClick={() => {
                            // 🔧 FIXED: Use the working plotMultipleLocations for 2 locations, plotEnhancedLocations for 3+
                            if (discrepancy.allVisitLocations!.length === 2) {
                              plotMultipleLocations(discrepancy.allVisitLocations!);
                            } else {
                              plotEnhancedLocations(discrepancy);
                            }
                          }}
                          className={`hover:opacity-80 ${
                            discrepancy.consensusStatus === 'two_distant_locations' ? 'text-red-600 hover:text-red-900' :
                            (discrepancy.consensusStatus === 'highly_suspicious' || 
                             discrepancy.consensusStatus === 'inconsistent' ||
                             discrepancy.isOutlierVisit) ? 'text-orange-600 hover:text-orange-900' :
                            'text-purple-600 hover:text-purple-900'
                          }`}
                          title={
                            discrepancy.allVisitLocations!.length === 2 ? 'Plot Both Locations with Directions (FIXED!)' :
                            discrepancy.consensusStatus === 'two_distant_locations' ? 'Plot Both Suspicious Locations' :
                            (discrepancy.outliersRemoved && discrepancy.outliersRemoved > 0) ? 'Plot Consensus + Deviant Locations' :
                            'Plot All Visit Locations'
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
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
