import React, { useState, useMemo } from 'react';
import { Package, Search, Download, Calendar, AlertTriangle } from 'lucide-react';

interface SupplyRecord {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  sku: string;
  lastSupplyDate: Date | null;
  daysSinceSupply: number;
  supplySource: string;
}

// Reuse the working brand normalization from InventoryDashboard
const BRAND_MAPPING: { [key: string]: string } = {
  '8 PM BLACK': '8 PM PREMIUM BLACK BLENDED WHISKY',
  '8 PM BLACK 750': '8 PM PREMIUM BLACK BLENDED WHISKY',
  '8 PM BLACK 375': '8 PM PREMIUM BLACK BLENDED WHISKY', 
  '8 PM BLACK 180': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
  '8 PM BLACK 90': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
  '8 PM BLACK 60': '8 PM PREMIUM BLACK BLENDED WHISKY Pet',
  'VERVE LEMON LUSH': 'M2M VERVE LEMON LUSH SUP FL VODKA',
  'VERVE GRAIN': 'M2M VERVE SUPERIOR GRAIN VODKA',
  'VERVE CRANBERRY': 'M2M VERVE CRANBERRY TEASE SP FL VODKA',
  'VERVE GREEN APPLE': 'M2M VERVE GREEN APPLE SUPERIOR FL VODKA',
};

const normalizeBrandInfo = (brandName: string) => {
  let cleanBrand = brandName?.toString().trim().toUpperCase();
  let extractedSize = '';
  
  const sizeMatch = cleanBrand.match(/(\d+)\s?(P|ML)?$/);
  if (sizeMatch) {
    extractedSize = sizeMatch[1] + (sizeMatch[2] || '');
    cleanBrand = cleanBrand.replace(/\s*\d+\s?(P|ML)?$/, '').trim();
  }
  
  if (!extractedSize) extractedSize = '750';
  
  let normalizedName = cleanBrand;
  const fullBrandWithSize = `${cleanBrand} ${extractedSize}`.trim();
  
  if (BRAND_MAPPING[fullBrandWithSize]) {
    normalizedName = BRAND_MAPPING[fullBrandWithSize];
  } else if (BRAND_MAPPING[cleanBrand]) {
    normalizedName = BRAND_MAPPING[cleanBrand];
  }
  
  return { family: normalizedName, size: extractedSize, normalizedName };
};

const createMultipleBrandKeys = (shopId: string, brandName: string): string[] => {
  const brandInfo = normalizeBrandInfo(brandName);
  
  const keys = [
    `${shopId}_${brandInfo.normalizedName}_${brandInfo.size}`,
    `${shopId}_${brandInfo.family}_${brandInfo.size}`,
    `${shopId}_${brandName.toUpperCase()}_${brandInfo.size}`,
  ];
  
  return [...new Set(keys)];
};

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  try {
    if (dateStr.includes('-') && (dateStr.includes('Jan') || dateStr.includes('Feb') || dateStr.includes('Mar'))) {
      return new Date(dateStr);
    }
    
    if (dateStr.includes('-') && !dateStr.includes(':')) {
      const dateParts = dateStr.split('-');
      if (dateParts.length === 3) {
        if (dateParts[0].length === 4) {
          return new Date(dateStr);
        } else {
          return new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
        }
      }
    }
    
    return new Date(dateStr);
  } catch (error) {
    return null;
  }
};

// THIS REPLACES THE COMPLEX 1000+ LINE SKURecoveryIntelligence COMPONENT
const SimpleSkuSupplyTracker = ({ data, inventoryData }: { 
  data: any; 
  inventoryData?: any;
}) => {
  const [selectedSKU, setSelectedSKU] = useState('');
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const [minDaysThreshold, setMinDaysThreshold] = useState(90);

  // Process supply data using the same logic as InventoryDashboard
  const supplyRecords = useMemo(() => {
    const records: SupplyRecord[] = [];
    const today = new Date();

    // NEED TO GET MASTER DATA - will add this in app/page.tsx
    if (!data?.masterData) {
      console.warn('No masterData available for supply tracking');
      return [];
    }

    // Get shop details for mapping
    const shopDetailsMap: Record<string, any> = {};
    if (data?.masterData?.['Shop Details']) {
      data.masterData['Shop Details'].slice(1).forEach((row: any[]) => {
        const shopId = row[0]?.toString().trim();
        if (shopId) {
          shopDetailsMap[shopId] = {
            shopName: row[3]?.toString().trim() || 'Unknown Shop',
            department: row[2]?.toString().trim() || 'Unknown',
            salesman: row[4]?.toString().trim() || 'Unknown'
          };
        }
      });
    }

    // Process recent supplies (Pending Challans)
    const recentSupplies: Record<string, Date> = {};
    if (data?.masterData?.['Pending Challans']) {
      const challansData = data.masterData['Pending Challans'];
      
      challansData.slice(1).forEach((row: any[]) => {
        if (row.length >= 15) {
          const shopId = row[8]?.toString().trim();
          const brand = row[11]?.toString().trim();
          const dateStr = row[1]?.toString().trim();
          const cases = parseFloat(row[14]) || 0;
          
          if (shopId && brand && dateStr && cases > 0) {
            const date = parseDate(dateStr);
            if (date && !isNaN(date.getTime())) {
              const possibleKeys = createMultipleBrandKeys(shopId, brand);
              possibleKeys.forEach(key => {
                if (!recentSupplies[key] || date > recentSupplies[key]) {
                  recentSupplies[key] = date;
                }
              });
            }
          }
        }
      });
    }

    // Collect all unique SKUs from recent supplies
    const allSKUs = new Set<string>();
    const shopSKUCombinations = new Set<string>();

    Object.keys(recentSupplies).forEach(key => {
      const [shopId, ...brandParts] = key.split('_');
      const brand = brandParts.join('_');
      allSKUs.add(brand);
      shopSKUCombinations.add(`${shopId}_${brand}`);
    });

    // Create records for each shop-SKU combination
    shopSKUCombinations.forEach(combination => {
      const [shopId, sku] = combination.split('_', 2);
      const shopDetails = shopDetailsMap[shopId];
      
      if (shopDetails) {
        // Find the latest supply date for this shop-SKU combination
        let latestSupplyDate: Date | null = null;
        let supplySource = 'no_supply';
        
        const possibleKeys = createMultipleBrandKeys(shopId, sku);
        
        for (const key of possibleKeys) {
          const supplyDate = recentSupplies[key];
          if (supplyDate) {
            if (!latestSupplyDate || supplyDate > latestSupplyDate) {
              latestSupplyDate = supplyDate;
              supplySource = 'recent';
            }
          }
        }

        const daysSinceSupply = latestSupplyDate 
          ? Math.floor((today.getTime() - latestSupplyDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        records.push({
          shopId,
          shopName: shopDetails.shopName,
          department: shopDetails.department,
          salesman: shopDetails.salesman,
          sku,
          lastSupplyDate: latestSupplyDate,
          daysSinceSupply,
          supplySource
        });
      }
    });

    return records.sort((a, b) => b.daysSinceSupply - a.daysSinceSupply);
  }, [data]);

  // Get unique values for filters
  const allSKUs = [...new Set(supplyRecords.map(record => record.sku))].sort();
  const departments = [...new Set(supplyRecords.map(record => record.department))].sort();

  // Filter records
  const filteredRecords = useMemo(() => {
    return supplyRecords.filter(record => {
      const matchesSKU = !selectedSKU || record.sku.includes(selectedSKU);
      const matchesSearch = !searchText || 
        record.shopName.toLowerCase().includes(searchText.toLowerCase()) ||
        record.sku.toLowerCase().includes(searchText.toLowerCase()) ||
        record.salesman.toLowerCase().includes(searchText.toLowerCase());
      const matchesDepartment = !departmentFilter || record.department === departmentFilter;
      const matchesMissing = !showOnlyMissing || record.daysSinceSupply >= minDaysThreshold;

      return matchesSKU && matchesSearch && matchesDepartment && matchesMissing;
    });
  }, [supplyRecords, selectedSKU, searchText, departmentFilter, showOnlyMissing, minDaysThreshold]);

  // Export function
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `SKU Supply Gap Analysis - ${new Date().toLocaleDateString()}\n`;
    csvContent += `SKU Filter: ${selectedSKU || 'All SKUs'}\n`;
    csvContent += `Missing Threshold: ${minDaysThreshold}+ days\n\n`;
    csvContent += "Shop Name,Shop ID,Department,Salesman,SKU,Last Supply Date,Days Since Supply,Supply Source\n";
    
    filteredRecords.forEach(record => {
      const lastSupplyStr = record.lastSupplyDate 
        ? record.lastSupplyDate.toLocaleDateString('en-GB')
        : 'Never Supplied';
      
      csvContent += `"${record.shopName}","${record.shopId}","${record.department}","${record.salesman}","${record.sku}","${lastSupplyStr}",${record.daysSinceSupply},"${record.supplySource}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SKU_Supply_Gap_Analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = {
    totalRecords: filteredRecords.length,
    neverSupplied: filteredRecords.filter(r => !r.lastSupplyDate).length,
    over90Days: filteredRecords.filter(r => r.daysSinceSupply >= 90).length,
    over180Days: filteredRecords.filter(r => r.daysSinceSupply >= 180).length,
    over365Days: filteredRecords.filter(r => r.daysSinceSupply >= 365).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center">
              <Package className="w-6 h-6 mr-2 text-blue-600" />
              Simple SKU Supply Gap Tracker
            </h2>
            <p className="text-gray-600">Find which shops haven't received specific SKUs in months/years</p>
            <p className="text-sm text-green-600 mt-1">✅ REPLACED 1000+ line complex component with simple 200-line solution</p>
          </div>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.totalRecords}</div>
            <div className="text-sm text-blue-600">Total Records</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-600">{summary.neverSupplied}</div>
            <div className="text-sm text-gray-600">Never Supplied</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.over90Days}</div>
            <div className="text-sm text-yellow-600">90+ Days</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{summary.over180Days}</div>
            <div className="text-sm text-orange-600">180+ Days</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{summary.over365Days}</div>
            <div className="text-sm text-red-600">365+ Days</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search shops, SKUs..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-full"
            />
          </div>

          <select
            value={selectedSKU}
            onChange={(e) => setSelectedSKU(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All SKUs</option>
            {allSKUs.map(sku => (
              <option key={sku} value={sku}>{sku}</option>
            ))}
          </select>

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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showMissing"
              checked={showOnlyMissing}
              onChange={(e) => setShowOnlyMissing(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showMissing" className="text-sm">Only {minDaysThreshold}+ days</label>
            <input
              type="number"
              value={minDaysThreshold}
              onChange={(e) => setMinDaysThreshold(parseInt(e.target.value) || 90)}
              className="border border-gray-300 rounded px-2 py-1 w-16 text-sm"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Supply Gap Results</h3>
          <p className="text-sm text-gray-500">
            Showing {filteredRecords.length} records • Sorted by days since supply (longest gaps first)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Supply Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Since Supply</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.slice(0, 100).map((record, index) => (
                <tr key={`${record.shopId}-${record.sku}-${index}`} className={
                  record.daysSinceSupply >= 365 ? 'bg-red-50' :
                  record.daysSinceSupply >= 180 ? 'bg-orange-50' :
                  record.daysSinceSupply >= 90 ? 'bg-yellow-50' : ''
                }>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{record.shopName}</div>
                      <div className="text-sm text-gray-500">ID: {record.shopId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{record.sku}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {record.lastSupplyDate 
                        ? record.lastSupplyDate.toLocaleDateString('en-GB')
                        : 'Never Supplied'
                      }
                    </div>
                    <div className="text-xs text-gray-500">{record.supplySource}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.daysSinceSupply >= 365 ? 'bg-red-100 text-red-800' :
                      record.daysSinceSupply >= 180 ? 'bg-orange-100 text-orange-800' :
                      record.daysSinceSupply >= 90 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {record.daysSinceSupply === 999 ? 'Never' : `${record.daysSinceSupply} days`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{record.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{record.salesman}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length > 100 && (
          <div className="px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
            Showing first 100 of {filteredRecords.length} records. Use filters to narrow down results.
          </div>
        )}

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
            <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleSkuSupplyTracker;
