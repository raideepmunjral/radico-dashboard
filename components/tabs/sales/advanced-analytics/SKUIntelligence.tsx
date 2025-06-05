'use client';

import React, { useState, useMemo } from 'react';
import { Zap, Target, TrendingUp, Package, Search, Download, Filter, X, ChevronLeft, ChevronRight, ArrowRight, Star, AlertCircle, BarChart3 } from 'lucide-react';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface ShopData {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  total: number;
  eightPM: number;
  verve: number;
  marchTotal?: number;
  marchEightPM?: number;
  marchVerve?: number;
  aprilTotal?: number;
  aprilEightPM?: number;
  aprilVerve?: number;
  mayTotal?: number;
  mayEightPM?: number;
  mayVerve?: number;
  juneTotal?: number;
  juneEightPM?: number;
  juneVerve?: number;
  skuBreakdown?: SKUData[];
  threeMonthAvgTotal?: number;
  threeMonthAvg8PM?: number;
  threeMonthAvgVERVE?: number;
}

interface SKUData {
  brand: string;
  cases: number;
  percentage: number;
  month?: string;
}

interface DashboardData {
  allShopsComparison: ShopData[];
  customerInsights: any;
  currentMonth: string;
  currentYear: string;
}

interface SKUOpportunity {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  currentProducts: string[];
  missingProducts: string[];
  opportunityValue: number;
  confidenceScore: number;
  recommendationType: '8PM_VARIANT' | 'VERVE_FLAVOR' | 'SIZE_MIGRATION' | 'CROSS_BRAND';
  currentVolume: number;
  potentialVolume: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
}

interface SKUAnalysis {
  eightPMVariants: SKUOpportunity[];
  verveFlavors: SKUOpportunity[];
  sizeMigration: SKUOpportunity[];
  crossBrand: SKUOpportunity[];
  territoryGaps: TerritoryGap[];
}

interface TerritoryGap {
  department: string;
  salesman: string;
  missingProducts: string[];
  shopCount: number;
  totalVolume: number;
  penetrationRate: number;
}

// ==========================================
// SKU MAPPING & INTELLIGENCE
// ==========================================

const SKU_FAMILIES = {
  '8PM': {
    variants: ['8PM 750ml', '8PM 375ml', '8PM 180ml', '8PM 90ml', '8PM 60ml'],
    sizes: ['750ml', '375ml', '180ml', '90ml', '60ml']
  },
  'VERVE': {
    flavors: ['VERVE Grain', 'VERVE Cranberry', 'VERVE Green Apple', 'VERVE Lemon Lush'],
    sizes: ['750ml', '375ml', '180ml']
  }
};

const BRAND_PATTERNS = {
  '8PM': [
    '8 PM PREMIUM BLACK BLENDED WHISKY',
    '8PM PREMIUM BLACK BLENDED WHISKY',
    '8 PM BLACK',
    '8PM BLACK',
    '8PM',
    '8 PM'
  ],
  'VERVE_GRAIN': [
    'M2M VERVE SUPERIOR GRAIN VODKA',
    'VERVE GRAIN',
    'M2 MAGIC MOMENTS VERVE SUPERIOR GRAIN VODKA'
  ],
  'VERVE_CRANBERRY': [
    'M2M VERVE CRANBERRY TEASE SP FL VODKA',
    'VERVE CRANBERRY',
    'M2 MAGIC MOMENTS VERVE CRANBERRY TEASE SUPERIOR FLAVOURED VODKA'
  ],
  'VERVE_GREEN_APPLE': [
    'M2M VERVE GREEN APPLE SUPERIOR FL. VODKA',
    'VERVE GREEN APPLE',
    'M2 MAGIC MOMENTS VERVE GREEN APPLE SUPERIOR FLAVOURED VODKA'
  ],
  'VERVE_LEMON_LUSH': [
    'M2M VERVE LEMON LUSH SUP FL VODKA',
    'VERVE LEMON LUSH',
    'M2 MAGIC MOMENTS VERVE LEMON LUSH SUPERIOR FLAVOURED VODKA'
  ]
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const classifyBrand = (brandName: string): string => {
  const brand = brandName.toUpperCase();
  
  if (BRAND_PATTERNS['8PM'].some(pattern => brand.includes(pattern.toUpperCase()))) {
    return '8PM';
  }
  if (BRAND_PATTERNS['VERVE_GRAIN'].some(pattern => brand.includes(pattern.toUpperCase()))) {
    return 'VERVE_GRAIN';
  }
  if (BRAND_PATTERNS['VERVE_CRANBERRY'].some(pattern => brand.includes(pattern.toUpperCase()))) {
    return 'VERVE_CRANBERRY';
  }
  if (BRAND_PATTERNS['VERVE_GREEN_APPLE'].some(pattern => brand.includes(pattern.toUpperCase()))) {
    return 'VERVE_GREEN_APPLE';
  }
  if (BRAND_PATTERNS['VERVE_LEMON_LUSH'].some(pattern => brand.includes(pattern.toUpperCase()))) {
    return 'VERVE_LEMON_LUSH';
  }
  
  return 'OTHER';
};

const extractSize = (brandName: string): string => {
  const sizePattern = /(\d+)\s*(ml|ML)/;
  const match = brandName.match(sizePattern);
  return match ? `${match[1]}ml` : 'Unknown';
};

const calculateOpportunityValue = (currentVolume: number, benchmarkVolume: number): number => {
  return Math.max(0, benchmarkVolume - currentVolume);
};

const getConfidenceScore = (shopVolume: number, averageVolume: number, consistency: number): number => {
  const volumeScore = Math.min(100, (shopVolume / averageVolume) * 50);
  const consistencyScore = consistency * 50;
  return Math.round(volumeScore + consistencyScore);
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const SKUIntelligence = ({ data }: { data: DashboardData }) => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  
  const [activeSection, setActiveSection] = useState<'8pm_variants' | 'verve_flavors' | 'size_migration' | 'territory_gaps'>('8pm_variants');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [salesmanFilter, setSalesmanFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [minimumVolume, setMinimumVolume] = useState(50);

  // ==========================================
  // SKU ANALYSIS ENGINE
  // ==========================================

  const skuAnalysis = useMemo((): SKUAnalysis => {
    console.log('🔍 Starting SKU Intelligence Analysis...');
    
    // Process shop SKU data
    const processedShops = data.allShopsComparison.map(shop => {
      const skus = shop.skuBreakdown || [];
      const classifiedSKUs = skus.map(sku => ({
        ...sku,
        classification: classifyBrand(sku.brand),
        size: extractSize(sku.brand)
      }));

      return {
        ...shop,
        classifiedSKUs,
        has8PM: classifiedSKUs.some(s => s.classification === '8PM'),
        hasVerveGrain: classifiedSKUs.some(s => s.classification === 'VERVE_GRAIN'),
        hasVerveCranberry: classifiedSKUs.some(s => s.classification === 'VERVE_CRANBERRY'),
        hasVerveGreenApple: classifiedSKUs.some(s => s.classification === 'VERVE_GREEN_APPLE'),
        hasVerveLemonLush: classifiedSKUs.some(s => s.classification === 'VERVE_LEMON_LUSH'),
        eightPMSizes: [...new Set(classifiedSKUs.filter(s => s.classification === '8PM').map(s => s.size))],
        verveFlavors: [...new Set(classifiedSKUs.filter(s => s.classification.startsWith('VERVE_')).map(s => s.classification))]
      };
    });

    // 8PM Variant Opportunities
    const eightPMVariants: SKUOpportunity[] = [];
    processedShops.forEach(shop => {
      if (shop.has8PM && shop.eightPM >= minimumVolume) {
        const currentSizes = shop.eightPMSizes;
        const missingSizes = SKU_FAMILIES['8PM'].sizes.filter(size => !currentSizes.includes(size));
        
        if (missingSizes.length > 0) {
          const avgVolume = shop.threeMonthAvg8PM || shop.eightPM;
          const potentialVolume = avgVolume * 0.3; // 30% expansion potential
          
          eightPMVariants.push({
            shopId: shop.shopId,
            shopName: shop.shopName,
            department: shop.department,
            salesman: shop.salesman,
            currentProducts: currentSizes.map(size => `8PM ${size}`),
            missingProducts: missingSizes.map(size => `8PM ${size}`),
            opportunityValue: potentialVolume,
            confidenceScore: getConfidenceScore(avgVolume, 100, 0.8),
            recommendationType: '8PM_VARIANT',
            currentVolume: avgVolume,
            potentialVolume,
            priority: potentialVolume > 50 ? 'HIGH' : potentialVolume > 25 ? 'MEDIUM' : 'LOW',
            reasoning: `Strong 8PM performer (${avgVolume.toFixed(0)} cases/month) missing ${missingSizes.length} size variants`
          });
        }
      }
    });

    // VERVE Flavor Opportunities
    const verveFlavors: SKUOpportunity[] = [];
    processedShops.forEach(shop => {
      const verveVolume = shop.threeMonthAvgVERVE || shop.verve;
      if (verveVolume >= minimumVolume * 0.5) { // Lower threshold for VERVE
        const currentFlavors = shop.verveFlavors;
        const allVerveFlavors = ['VERVE_GRAIN', 'VERVE_CRANBERRY', 'VERVE_GREEN_APPLE', 'VERVE_LEMON_LUSH'];
        const missingFlavors = allVerveFlavors.filter(flavor => !currentFlavors.includes(flavor));
        
        if (missingFlavors.length > 0 && currentFlavors.length > 0) {
          const potentialVolume = verveVolume * 0.4; // 40% expansion potential for flavors
          
          verveFlavors.push({
            shopId: shop.shopId,
            shopName: shop.shopName,
            department: shop.department,
            salesman: shop.salesman,
            currentProducts: currentFlavors.map(f => f.replace('VERVE_', 'VERVE ')),
            missingProducts: missingFlavors.map(f => f.replace('VERVE_', 'VERVE ')),
            opportunityValue: potentialVolume,
            confidenceScore: getConfidenceScore(verveVolume, 50, 0.7),
            recommendationType: 'VERVE_FLAVOR',
            currentVolume: verveVolume,
            potentialVolume,
            priority: potentialVolume > 30 ? 'HIGH' : potentialVolume > 15 ? 'MEDIUM' : 'LOW',
            reasoning: `VERVE customer (${verveVolume.toFixed(0)} cases/month) ready for ${missingFlavors.length} new flavors`
          });
        }
      }
    });

    // Size Migration Opportunities
    const sizeMigration: SKUOpportunity[] = [];
    processedShops.forEach(shop => {
      // Identify shops with high volume in large sizes that could adopt smaller sizes
      if (shop.has8PM && shop.eightPM >= 100) {
        const large8PM = shop.classifiedSKUs?.filter(s => 
          s.classification === '8PM' && 
          (s.size === '750ml' || s.size === '375ml')
        ).reduce((sum, sku) => sum + sku.cases, 0) || 0;

        const small8PM = shop.classifiedSKUs?.filter(s => 
          s.classification === '8PM' && 
          (s.size === '180ml' || s.size === '90ml' || s.size === '60ml')
        ).reduce((sum, sku) => sum + sku.cases, 0) || 0;

        if (large8PM > 80 && small8PM < 20) {
          const potentialSmallSize = large8PM * 0.2; // 20% migration potential
          
          sizeMigration.push({
            shopId: shop.shopId,
            shopName: shop.shopName,
            department: shop.department,
            salesman: shop.salesman,
            currentProducts: ['8PM Large Sizes (750ml, 375ml)'],
            missingProducts: ['8PM Small Sizes (180ml, 90ml, 60ml)'],
            opportunityValue: potentialSmallSize,
            confidenceScore: getConfidenceScore(large8PM, 100, 0.9),
            recommendationType: 'SIZE_MIGRATION',
            currentVolume: large8PM,
            potentialVolume: potentialSmallSize,
            priority: potentialSmallSize > 30 ? 'HIGH' : potentialSmallSize > 15 ? 'MEDIUM' : 'LOW',
            reasoning: `High volume large size buyer (${large8PM} cases) - ideal for small size introduction`
          });
        }
      }
    });

    // Cross-Brand Opportunities
    const crossBrand: SKUOpportunity[] = [];
    processedShops.forEach(shop => {
      // 8PM customers who could try VERVE
      if (shop.has8PM && !shop.hasVerveGrain && shop.eightPM >= 75) {
        crossBrand.push({
          shopId: shop.shopId,
          shopName: shop.shopName,
          department: shop.department,
          salesman: shop.salesman,
          currentProducts: ['8PM Products'],
          missingProducts: ['VERVE Portfolio'],
          opportunityValue: shop.eightPM * 0.15, // 15% cross-brand potential
          confidenceScore: getConfidenceScore(shop.eightPM, 100, 0.6),
          recommendationType: 'CROSS_BRAND',
          currentVolume: shop.eightPM,
          potentialVolume: shop.eightPM * 0.15,
          priority: shop.eightPM > 150 ? 'HIGH' : 'MEDIUM',
          reasoning: `Strong 8PM customer (${shop.eightPM} cases) - excellent VERVE prospect`
        });
      }
      
      // VERVE customers who could try 8PM
      if (shop.verve >= 30 && !shop.has8PM) {
        crossBrand.push({
          shopId: shop.shopId,
          shopName: shop.shopName,
          department: shop.department,
          salesman: shop.salesman,
          currentProducts: ['VERVE Products'],
          missingProducts: ['8PM Portfolio'],
          opportunityValue: shop.verve * 2, // Higher potential for vodka→whiskey
          confidenceScore: getConfidenceScore(shop.verve, 50, 0.7),
          recommendationType: 'CROSS_BRAND',
          currentVolume: shop.verve,
          potentialVolume: shop.verve * 2,
          priority: shop.verve > 50 ? 'HIGH' : 'MEDIUM',
          reasoning: `VERVE loyalist (${shop.verve} cases) - premium whiskey opportunity`
        });
      }
    });

    // Territory Gap Analysis
    const territoryGaps: TerritoryGap[] = [];
    const deptSalesmanGroups = data.allShopsComparison.reduce((acc, shop) => {
      const key = `${shop.department}-${shop.salesman}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(shop);
      return acc;
    }, {} as Record<string, ShopData[]>);

    Object.entries(deptSalesmanGroups).forEach(([key, shops]) => {
      const [department, salesman] = key.split('-');
      const totalShops = shops.length;
      const activeShops = shops.filter(s => (s.juneTotal || 0) > 0);
      
      if (activeShops.length >= 3) { // Only analyze territories with sufficient data
        const penetrationRate = (activeShops.length / totalShops) * 100;
        const avgVolume = activeShops.reduce((sum, s) => sum + (s.juneTotal || 0), 0);
        
        if (penetrationRate < 80) { // Territory with expansion potential
          territoryGaps.push({
            department,
            salesman,
            missingProducts: ['Territory Expansion Opportunity'],
            shopCount: totalShops - activeShops.length,
            totalVolume: avgVolume,
            penetrationRate
          });
        }
      }
    });

    console.log('✅ SKU Analysis Complete:', {
      eightPMVariants: eightPMVariants.length,
      verveFlavors: verveFlavors.length,
      sizeMigration: sizeMigration.length,
      crossBrand: crossBrand.length,
      territoryGaps: territoryGaps.length
    });

    return {
      eightPMVariants: eightPMVariants.sort((a, b) => b.opportunityValue - a.opportunityValue),
      verveFlavors: verveFlavors.sort((a, b) => b.opportunityValue - a.opportunityValue),
      sizeMigration: sizeMigration.sort((a, b) => b.opportunityValue - a.opportunityValue),
      crossBrand: crossBrand.sort((a, b) => b.opportunityValue - a.opportunityValue),
      territoryGaps: territoryGaps.sort((a, b) => b.totalVolume - a.totalVolume)
    };
  }, [data, minimumVolume]);

  // ==========================================
  // FILTERED DATA
  // ==========================================

  const getActiveData = () => {
    let activeData: (SKUOpportunity | TerritoryGap)[] = [];
    
    switch (activeSection) {
      case '8pm_variants':
        activeData = skuAnalysis.eightPMVariants;
        break;
      case 'verve_flavors':
        activeData = skuAnalysis.verveFlavors;
        break;
      case 'size_migration':
        activeData = skuAnalysis.sizeMigration;
        break;
      case 'territory_gaps':
        activeData = skuAnalysis.territoryGaps;
        break;
    }

    return activeData.filter(item => {
      if ('shopName' in item) {
        const shop = item as SKUOpportunity;
        const matchesSearch = !searchText || 
          shop.shopName.toLowerCase().includes(searchText.toLowerCase()) ||
          shop.department.toLowerCase().includes(searchText.toLowerCase()) ||
          shop.salesman.toLowerCase().includes(searchText.toLowerCase());
        
        const matchesDepartment = !departmentFilter || shop.department === departmentFilter;
        const matchesSalesman = !salesmanFilter || shop.salesman === salesmanFilter;
        const matchesPriority = !priorityFilter || shop.priority === priorityFilter;

        return matchesSearch && matchesDepartment && matchesSalesman && matchesPriority;
      } else {
        const territory = item as TerritoryGap;
        const matchesSearch = !searchText || 
          territory.department.toLowerCase().includes(searchText.toLowerCase()) ||
          territory.salesman.toLowerCase().includes(searchText.toLowerCase());
        
        const matchesDepartment = !departmentFilter || territory.department === departmentFilter;
        const matchesSalesman = !salesmanFilter || territory.salesman === salesmanFilter;

        return matchesSearch && matchesDepartment && matchesSalesman;
      }
    });
  };

  const filteredData = getActiveData();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  // Filter options
  const departments = [...new Set(data.allShopsComparison.map(shop => shop.department))].sort();
  const salesmen = [...new Set(data.allShopsComparison.map(shop => shop.salesman))].sort();

  // ==========================================
  // EXPORT FUNCTION
  // ==========================================

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Radico SKU Intelligence - ${activeSection.toUpperCase().replace('_', ' ')} - ${new Date().toLocaleDateString()}\n`;
    csvContent += `Minimum Volume Threshold: ${minimumVolume} cases\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    if (activeSection === 'territory_gaps') {
      csvContent += `TERRITORY GAP ANALYSIS\n`;
      csvContent += `Department,Salesman,Inactive Shops,Total Volume,Penetration Rate\n`;
      
      (filteredData as TerritoryGap[]).forEach(territory => {
        csvContent += `"${territory.department}","${territory.salesman}",${territory.shopCount},${territory.totalVolume.toFixed(0)},${territory.penetrationRate.toFixed(1)}%\n`;
      });
    } else {
      csvContent += `SKU CROSS-SELLING OPPORTUNITIES\n`;
      csvContent += `Shop Name,Department,Salesman,Current Products,Missing Products,Current Volume,Opportunity Value,Priority,Confidence Score,Reasoning\n`;
      
      (filteredData as SKUOpportunity[]).forEach(opp => {
        csvContent += `"${opp.shopName}","${opp.department}","${opp.salesman}","${opp.currentProducts.join(', ')}","${opp.missingProducts.join(', ')}",${opp.currentVolume.toFixed(0)},${opp.opportunityValue.toFixed(0)},"${opp.priority}",${opp.confidenceScore}%,"${opp.reasoning}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SKU_Intelligence_${activeSection}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const getPriorityBadge = (priority: string) => {
    const colors = {
      HIGH: 'bg-red-100 text-red-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800'
    };
    return `px-2 py-1 text-xs font-semibold rounded-full ${colors[priority as keyof typeof colors]}`;
  };

  const getOpportunityIcon = (type: string) => {
    switch (type) {
      case '8PM_VARIANT': return <Package className="w-4 h-4 text-purple-600" />;
      case 'VERVE_FLAVOR': return <Star className="w-4 h-4 text-orange-600" />;
      case 'SIZE_MIGRATION': return <ArrowRight className="w-4 h-4 text-blue-600" />;
      case 'CROSS_BRAND': return <Target className="w-4 h-4 text-green-600" />;
      default: return <Zap className="w-4 h-4 text-yellow-600" />;
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center mb-2">
              <Zap className="w-6 h-6 mr-2 text-yellow-500" />
              SKU Cross-Selling Intelligence
            </h2>
            <p className="text-gray-600">AI-powered product expansion and cross-selling opportunities</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Min Volume:</span>
              <input
                type="number"
                value={minimumVolume}
                onChange={(e) => setMinimumVolume(parseInt(e.target.value) || 50)}
                className="border border-gray-300 rounded px-3 py-1 w-20 text-sm"
                min="10"
                max="200"
              />
              <span className="text-sm text-gray-600">cases</span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Package className="w-5 h-5 text-purple-600 mr-2" />
              <h4 className="font-medium text-purple-800">8PM Variants</h4>
            </div>
            <div className="text-2xl font-bold text-purple-600">{skuAnalysis.eightPMVariants.length}</div>
            <p className="text-sm text-purple-600">Size expansion opportunities</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Star className="w-5 h-5 text-orange-600 mr-2" />
              <h4 className="font-medium text-orange-800">VERVE Flavors</h4>
            </div>
            <div className="text-2xl font-bold text-orange-600">{skuAnalysis.verveFlavors.length}</div>
            <p className="text-sm text-orange-600">Flavor expansion prospects</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <ArrowRight className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-800">Size Migration</h4>
            </div>
            <div className="text-2xl font-bold text-blue-600">{skuAnalysis.sizeMigration.length}</div>
            <p className="text-sm text-blue-600">Large to small size potential</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Target className="w-5 h-5 text-green-600 mr-2" />
              <h4 className="font-medium text-green-800">Cross-Brand</h4>
            </div>
            <div className="text-2xl font-bold text-green-600">{skuAnalysis.crossBrand.length}</div>
            <p className="text-sm text-green-600">8PM ↔ VERVE opportunities</p>
          </div>
        </div>
      </div>

      {/* Analysis Sections */}
      <div className="bg-white rounded-lg shadow">
        {/* Section Navigation */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            {[
              { id: '8pm_variants', label: '8PM Variants', icon: Package, color: 'purple' },
              { id: 'verve_flavors', label: 'VERVE Flavors', icon: Star, color: 'orange' },
              { id: 'size_migration', label: 'Size Migration', icon: ArrowRight, color: 'blue' },
              { id: 'territory_gaps', label: 'Territory Gaps', icon: BarChart3, color: 'green' }
            ].map(section => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id as any);
                  setCurrentPage(1);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? `bg-${section.color}-600 text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <section.icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search shops, departments, salesmen..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-64"
              />
            </div>
            
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={salesmanFilter}
              onChange={(e) => setSalesmanFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Salesmen</option>
              {salesmen.map(salesman => (
                <option key={salesman} value={salesman}>{salesman}</option>
              ))}
            </select>

            {activeSection !== 'territory_gaps' && (
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            )}

            <button
              onClick={() => {
                setSearchText('');
                setDepartmentFilter('');
                setSalesmanFilter('');
                setPriorityFilter('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>

            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <div className="text-sm text-gray-500">
              {filteredData.length} opportunities
            </div>
          </div>
        </div>

        {/* Opportunity Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {currentData.map((item, index) => {
              if ('shopName' in item) {
                const opportunity = item as SKUOpportunity;
                return (
                  <div key={`${opportunity.shopId}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getOpportunityIcon(opportunity.recommendationType)}
                        <h3 className="font-medium text-gray-900 truncate">{opportunity.shopName}</h3>
                      </div>
                      <span className={getPriorityBadge(opportunity.priority)}>
                        {opportunity.priority}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Department:</span> {opportunity.department}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Salesman:</span> {opportunity.salesman}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Current Volume:</span> {opportunity.currentVolume.toFixed(0)} cases/month
                      </div>
                    </div>

                    <div className="border-t pt-3 mb-3">
                      <div className="text-sm text-gray-700 mb-2">
                        <span className="font-medium text-green-600">Has:</span> {opportunity.currentProducts.join(', ')}
                      </div>
                      <div className="text-sm text-gray-700">
                        <span className="font-medium text-blue-600">Missing:</span> {opportunity.missingProducts.join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-green-600">
                        +{opportunity.opportunityValue.toFixed(0)} cases
                      </div>
                      <div className="text-sm text-gray-500">
                        {opportunity.confidenceScore}% confidence
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      {opportunity.reasoning}
                    </div>
                  </div>
                );
              } else {
                const territory = item as TerritoryGap;
                return (
                  <div key={`${territory.department}-${territory.salesman}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-green-600" />
                        <h3 className="font-medium text-gray-900">{territory.department}</h3>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        TERRITORY
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Salesman:</span> {territory.salesman}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Inactive Shops:</span> {territory.shopCount}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Territory Volume:</span> {territory.totalVolume.toFixed(0)} cases
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-orange-600">
                        {territory.penetrationRate.toFixed(1)}% penetrated
                      </div>
                      <div className="text-sm text-gray-500">
                        Expansion potential
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      Territory with {territory.shopCount} inactive shops - high expansion potential
                    </div>
                  </div>
                );
              }
            })}
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Opportunities Found</h3>
              <p className="text-gray-500">Try adjusting your filters or minimum volume threshold.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-700 mb-2 sm:mb-0">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} opportunities
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SKUIntelligence;
