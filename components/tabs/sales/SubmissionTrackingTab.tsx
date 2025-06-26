'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Download, RefreshCw, Calendar, Package, CheckCircle, Clock, Users, Building, Filter, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface ChallanData {
  challanNo: string;
  challanDate: string;
  shopName: string;
  shopId: string;
  department: string;
  salesman: string;
  brand: string;
  cases: number;
  isScanned: boolean;
}

interface SalesmanSummary {
  salesmanName: string;
  collectedChallans: number;
  collectedShops: number;
  pendingChallans: number;
  pendingShops: number;
  totalChallans: number;
  totalShops: number;
  collectedChallansList: ChallanData[];
  pendingChallansList: ChallanData[];
}

interface SubmissionSummary {
  totalCollectedChallans: number;
  totalCollectedShops: number;
  totalPendingChallans: number;
  totalPendingShops: number;
  weekRange: string;
  salesmanSummaries: SalesmanSummary[];
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${day}-${month}-${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const isDateInRange = (dateStr: string, startDate: Date, endDate: Date): boolean => {
  if (!dateStr) return false;
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const year = parseInt(parts[2]);
      const date = new Date(year, month, day);
      return date >= startDate && date <= endDate;
    }
    return false;
  } catch {
    return false;
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const SubmissionTrackingTab = () => {
  const { user } = useAuth();
  
  // State Management
  const [submissionData, setSubmissionData] = useState<SubmissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Date Range State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Filter State
  const [selectedSalesman, setSelectedSalesman] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'summary' | 'collected' | 'pending'>('summary');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedSalesmen, setExpandedSalesmen] = useState<Set<string>>(new Set());
  
  // Initialize default date range (current week)
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    setStartDate(monday.toISOString().split('T')[0]);
    setEndDate(sunday.toISOString().split('T')[0]);
  }, []);

  // ==========================================
  // DATA FETCHING FUNCTIONS
  // ==========================================

  const fetchSubmissionData = async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const submissionSheetId = process.env.NEXT_PUBLIC_SUBMISSION_SHEET_ID;
      const masterSheetId = process.env.NEXT_PUBLIC_MASTER_SHEET_ID;
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      
      if (!submissionSheetId || !masterSheetId || !apiKey) {
        throw new Error('Submission tracking configuration missing. Please check environment variables.');
      }

      console.log('🔧 Fetching submission data:', {
        submissionSheetId,
        masterSheetId,
        apiKey: apiKey ? 'Set' : 'Missing',
        dateRange: `${startDate} to ${endDate}`
      });

      // Fetch submission data AND shop details for proper salesman mapping
      const scannedUrl = `https://sheets.googleapis.com/v4/spreadsheets/${submissionSheetId}/values/scanned%20challans?key=${apiKey}`;
      const detailsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${submissionSheetId}/values/Sheet1?key=${apiKey}`;
      const shopDetailsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${masterSheetId}/values/Shop%20Details?key=${apiKey}`;
      
      console.log('📋 Fetching URLs:', { scannedUrl, detailsUrl, shopDetailsUrl });

      const [scannedResponse, detailsResponse, shopDetailsResponse] = await Promise.all([
        fetch(scannedUrl).catch(err => {
          console.error('❌ Error fetching scanned challans:', err);
          throw new Error(`Failed to fetch "scanned challans" tab: ${err.message}`);
        }),
        fetch(detailsUrl).catch(err => {
          console.error('❌ Error fetching sheet1:', err);
          throw new Error(`Failed to fetch "Sheet1" tab: ${err.message}`);
        }),
        fetch(shopDetailsUrl).catch(err => {
          console.error('❌ Error fetching shop details:', err);
          throw new Error(`Failed to fetch "Shop Details" tab: ${err.message}`);
        })
      ]);

      // Check response status with detailed error messages
      if (!scannedResponse.ok) {
        const errorText = await scannedResponse.text();
        console.error('❌ Scanned challans response error:', {
          status: scannedResponse.status,
          statusText: scannedResponse.statusText,
          errorText
        });
        
        if (scannedResponse.status === 403) {
          throw new Error(`Access denied to "scanned challans" tab. Please make sure:\n1. Google Sheet is publicly accessible\n2. Sheet has "scanned challans" tab\n3. API key has proper permissions`);
        } else if (scannedResponse.status === 404) {
          throw new Error(`Sheet or "scanned challans" tab not found. Please verify:\n1. Sheet ID is correct\n2. Tab name is exactly "scanned challans"`);
        } else {
          throw new Error(`Failed to fetch "scanned challans" tab (${scannedResponse.status}): ${scannedResponse.statusText}`);
        }
      }

      if (!detailsResponse.ok) {
        const errorText = await detailsResponse.text();
        console.error('❌ Sheet1 response error:', {
          status: detailsResponse.status,
          statusText: detailsResponse.statusText,
          errorText
        });
        
        if (detailsResponse.status === 403) {
          throw new Error(`Access denied to "Sheet1" tab. Please make sure:\n1. Google Sheet is publicly accessible\n2. Sheet has "Sheet1" tab\n3. API key has proper permissions`);
        } else if (detailsResponse.status === 404) {
          throw new Error(`Sheet or "Sheet1" tab not found. Please verify:\n1. Sheet ID is correct\n2. Tab name is exactly "Sheet1"`);
        } else {
          throw new Error(`Failed to fetch "Sheet1" tab (${detailsResponse.status}): ${detailsResponse.statusText}`);
        }
      }

      if (!shopDetailsResponse.ok) {
        console.warn('⚠️ Shop Details not accessible, continuing with limited salesman mapping');
      }

      const scannedData = await scannedResponse.json();
      const detailsData = await detailsResponse.json();
      const shopDetailsData = shopDetailsResponse.ok ? await shopDetailsResponse.json() : { values: [] };
      
      console.log('✅ Successfully fetched data:', {
        scannedRows: scannedData.values?.length || 0,
        detailsRows: detailsData.values?.length || 0,
        shopDetailsRows: shopDetailsData.values?.length || 0
      });
      
      const processedData = processSubmissionData(scannedData.values || [], detailsData.values || [], shopDetailsData.values || []);
      setSubmissionData(processedData);
      setLastUpdated(new Date());
      
    } catch (error: any) {
      console.error('❌ Error fetching submission data:', error);
      setError(error.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // DATA PROCESSING FUNCTION
  // ==========================================

  const processSubmissionData = (scannedValues: any[][], detailsValues: any[][], shopDetailsValues: any[][]): SubmissionSummary => {
    // Extract scanned challan numbers
    const scannedChallans = new Set<string>();
    scannedValues.slice(1).forEach(row => {
      if (row[0]) {
        scannedChallans.add(row[0].toString().trim());
      }
    });

    console.log(`📦 Found ${scannedChallans.size} scanned challans`);

    // 🔧 FIXED: Build shop details mapping for proper salesman names
    const shopDetailsMap: Record<string, any> = {};
    shopDetailsValues.slice(1).forEach((row, index) => {
      const shopId = row[0]?.toString().trim();
      const salesmanEmail = row[1]?.toString().trim();
      const dept = row[2]?.toString().trim() === "DSIIDC" ? "DSIDC" : row[2]?.toString().trim();
      const shopName = row[3]?.toString().trim();
      const salesman = row[4]?.toString().trim(); // ✅ This is the correct salesman name column!
      
      if (shopId && shopName && salesman) {
        shopDetailsMap[shopId] = { shopName, dept, salesman, salesmanEmail };
        // Also map by shop name for fallback
        shopDetailsMap[shopName] = { shopId, shopName, dept, salesman, salesmanEmail };
        
        // 🔧 DEBUG: Log first few shop details mappings
        if (index < 5) {
          console.log(`📋 Shop Details Row ${index + 1}:`, {
            shopId,
            shopName,
            salesman,
            dept
          });
        }
      }
    });

    console.log(`👥 Found ${Object.keys(shopDetailsMap).length / 2} shops with salesman mapping`);
    console.log(`🔍 Sample shop IDs:`, Object.keys(shopDetailsMap).filter(key => key.startsWith('01/')).slice(0, 5));
    console.log(`🔍 Sample shop names:`, Object.keys(shopDetailsMap).filter(key => !key.startsWith('01/')).slice(0, 5));

    // Process detailed challan data
    const headers = detailsValues[0] || [];
    const challanMap = new Map<string, ChallanData>();
    const dateRangeStart = new Date(startDate);
    const dateRangeEnd = new Date(endDate);

    detailsValues.slice(1).forEach((row, index) => {
      if (row.length >= 15) {
        const challanNo = row[0]?.toString().trim();
        const challanDate = row[1]?.toString().trim();
        const shopName = row[4]?.toString().trim();
        const shopId = row[7]?.toString().trim();
        const actualShopName = row[8]?.toString().trim(); // This might be the real shop name
        const department = row[10]?.toString().trim() === "DSIIDC" ? "DSIDC" : row[10]?.toString().trim();
        const brand = row[11]?.toString().trim();
        const cases = parseFloat(row[14]) || 0;

        // 🔧 ENHANCED: Multiple strategies for salesman mapping with debugging
        let salesmanName = 'Unknown';
        let mappingMethod = 'none';

        // Strategy 1: Direct shop ID match
        if (shopId && shopDetailsMap[shopId]) {
          salesmanName = shopDetailsMap[shopId].salesman;
          mappingMethod = 'shopId';
        }
        // Strategy 2: Direct shop name match (column 4)
        else if (shopName && shopDetailsMap[shopName]) {
          salesmanName = shopDetailsMap[shopName].salesman;
          mappingMethod = 'shopName';
        }
        // Strategy 3: Try actual shop name (column 8)
        else if (actualShopName && shopDetailsMap[actualShopName]) {
          salesmanName = shopDetailsMap[actualShopName].salesman;
          mappingMethod = 'actualShopName';
        }
        // Strategy 4: Partial shop name matching
        else if (shopName || actualShopName) {
          const searchName = actualShopName || shopName;
          const matchingShop = Object.keys(shopDetailsMap).find(key => {
            const keyLower = key.toLowerCase();
            const searchLower = searchName.toLowerCase();
            return keyLower.includes(searchLower) || searchLower.includes(keyLower);
          });
          if (matchingShop && shopDetailsMap[matchingShop]) {
            salesmanName = shopDetailsMap[matchingShop].salesman;
            mappingMethod = 'partial';
          }
        }

        // 🔧 DEBUG: Log mapping details for first few rows
        if (index < 5) {
          console.log(`🔍 Row ${index + 1} mapping:`, {
            challanNo,
            shopId,
            shopName,
            actualShopName,
            salesmanName,
            mappingMethod
          });
        }

        // Filter by date range
        if (challanNo && challanDate && isDateInRange(challanDate, dateRangeStart, dateRangeEnd)) {
          const isScanned = scannedChallans.has(challanNo);
          
          // Use challan number as key for deduplication
          if (!challanMap.has(challanNo)) {
            challanMap.set(challanNo, {
              challanNo,
              challanDate,
              shopName: actualShopName || shopName || 'Unknown Shop',
              shopId: shopId || '',
              department: department || 'Unknown',
              salesman: salesmanName,
              brand,
              cases,
              isScanned
            });
          }
        }
      }
    });

    console.log(`📋 Processed ${challanMap.size} unique challans in date range`);

    // Group by salesman
    const salesmanMap = new Map<string, {
      collectedChallans: ChallanData[],
      pendingChallans: ChallanData[]
    }>();

    challanMap.forEach(challan => {
      let salesmanName = challan.salesman;
      
      // Apply role-based filtering
      if (user && user.role === 'salesman') {
        const userMatches = salesmanName === user.name || 
                           salesmanName === user.email ||
                           salesmanName?.toLowerCase() === user.name?.toLowerCase();
        if (!userMatches) return; // Skip this challan for salesman role
      }

      if (!salesmanMap.has(salesmanName)) {
        salesmanMap.set(salesmanName, {
          collectedChallans: [],
          pendingChallans: []
        });
      }

      const salesmanData = salesmanMap.get(salesmanName)!;
      if (challan.isScanned) {
        salesmanData.collectedChallans.push(challan);
      } else {
        salesmanData.pendingChallans.push(challan);
      }
    });

    // Calculate summaries
    const salesmanSummaries: SalesmanSummary[] = [];
    let totalCollectedChallans = 0;
    let totalPendingChallans = 0;
    const totalCollectedShops = new Set<string>();
    const totalPendingShops = new Set<string>();

    salesmanMap.forEach((data, salesmanName) => {
      const collectedShops = new Set(data.collectedChallans.map(c => c.shopId || c.shopName));
      const pendingShops = new Set(data.pendingChallans.map(c => c.shopId || c.shopName));
      const allShops = new Set([...collectedShops, ...pendingShops]);

      salesmanSummaries.push({
        salesmanName,
        collectedChallans: data.collectedChallans.length,
        collectedShops: collectedShops.size,
        pendingChallans: data.pendingChallans.length,
        pendingShops: pendingShops.size,
        totalChallans: data.collectedChallans.length + data.pendingChallans.length,
        totalShops: allShops.size,
        collectedChallansList: data.collectedChallans,
        pendingChallansList: data.pendingChallans
      });

      totalCollectedChallans += data.collectedChallans.length;
      totalPendingChallans += data.pendingChallans.length;
      
      data.collectedChallans.forEach(c => totalCollectedShops.add(c.shopId || c.shopName));
      data.pendingChallans.forEach(c => totalPendingShops.add(c.shopId || c.shopName));
    });

    // Sort by total challans descending
    salesmanSummaries.sort((a, b) => b.totalChallans - a.totalChallans);

    const weekRange = `${formatDate(startDate)} to ${formatDate(endDate)}`;

    return {
      totalCollectedChallans,
      totalCollectedShops: totalCollectedShops.size,
      totalPendingChallans,
      totalPendingShops: totalPendingShops.size,
      weekRange,
      salesmanSummaries
    };
  };

  // ==========================================
  // CSV EXPORT FUNCTION
  // ==========================================

  const exportToExcel = () => {
    if (!submissionData) return;

    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Summary data
      csvContent += "Radico Submission Tracking Report\n";
      csvContent += `Generated:,${new Date().toLocaleString()}\n`;
      csvContent += `Week:,${submissionData.weekRange}\n`;
      csvContent += "\n";
      csvContent += "OVERALL SUMMARY\n";
      csvContent += `Total Collected Challans,${submissionData.totalCollectedChallans}\n`;
      csvContent += `Total Collected Shops,${submissionData.totalCollectedShops}\n`;
      csvContent += `Total Pending Challans,${submissionData.totalPendingChallans}\n`;
      csvContent += `Total Pending Shops,${submissionData.totalPendingShops}\n`;
      csvContent += "\n";
      csvContent += "SALESMAN SUMMARY\n";
      csvContent += "Salesman,Collected Challans,Collected Shops,Pending Challans,Pending Shops,Total Challans,Total Shops\n";
      
      submissionData.salesmanSummaries.forEach(s => {
        csvContent += `"${s.salesmanName}",${s.collectedChallans},${s.collectedShops},${s.pendingChallans},${s.pendingShops},${s.totalChallans},${s.totalShops}\n`;
      });

      csvContent += "\n\nCOLLECTED CHALLANS\n";
      csvContent += "Salesman,Challan No,Challan Date,Shop Name,Department\n";
      
      submissionData.salesmanSummaries.forEach(s => {
        s.collectedChallansList.forEach(c => {
          csvContent += `"${s.salesmanName}","${c.challanNo}","${c.challanDate}","${c.shopName}","${c.department}"\n`;
        });
      });

      csvContent += "\n\nPENDING CHALLANS\n";
      csvContent += "Salesman,Challan No,Challan Date,Shop Name,Department\n";
      
      submissionData.salesmanSummaries.forEach(s => {
        s.pendingChallansList.forEach(c => {
          csvContent += `"${s.salesmanName}","${c.challanNo}","${c.challanDate}","${c.shopName}","${c.department}"\n`;
        });
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Radico_Submission_Tracking_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ CSV export completed successfully');
      
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Error exporting data. Please try again.');
    }
  };

  // ==========================================
  // FILTERED DATA FOR DISPLAY
  // ==========================================

  const filteredSummaries = useMemo(() => {
    if (!submissionData) return [];
    
    return submissionData.salesmanSummaries.filter(s => 
      !selectedSalesman || s.salesmanName === selectedSalesman
    );
  }, [submissionData, selectedSalesman]);

  // ==========================================
  // SEARCH FILTERED DATA
  // ==========================================

  const getFilteredChallans = (challans: ChallanData[]) => {
    if (!searchTerm) return challans;
    
    return challans.filter(challan =>
      challan.challanNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.salesman.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // ==========================================
  // TOGGLE SALESMAN EXPANSION
  // ==========================================

  const toggleSalesmanExpansion = (salesmanName: string) => {
    const newExpanded = new Set(expandedSalesmen);
    if (newExpanded.has(salesmanName)) {
      newExpanded.delete(salesmanName);
    } else {
      newExpanded.add(salesmanName);
    }
    setExpandedSalesmen(newExpanded);
  };

  // ==========================================
  // EFFECTS
  // ==========================================

  useEffect(() => {
    if (startDate && endDate) {
      fetchSubmissionData();
    }
  }, [startDate, endDate]);

  // ==========================================
  // DETAILED CHALLAN TABLE COMPONENT
  // ==========================================

  const ChallanTable = ({ challans, type }: { challans: ChallanData[], type: 'collected' | 'pending' }) => {
    const filteredChallans = getFilteredChallans(challans);
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Challan No
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shop Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Salesman
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredChallans.map((challan, index) => (
              <tr key={challan.challanNo} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {challan.challanNo}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(challan.challanDate)}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {challan.shopName}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {challan.department}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {challan.salesman}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredChallans.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {type} challans found {searchTerm && `matching "${searchTerm}"`}
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // MOBILE CHALLAN CARD COMPONENT
  // ==========================================

  const MobileChallanCard = ({ challan }: { challan: ChallanData }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium text-gray-900">{challan.challanNo}</div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          challan.isScanned ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
        }`}>
          {challan.isScanned ? 'Collected' : 'Pending'}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 space-y-1">
        <div><span className="font-medium">Date:</span> {formatDate(challan.challanDate)}</div>
        <div><span className="font-medium">Shop:</span> {challan.shopName}</div>
        <div><span className="font-medium">Department:</span> {challan.department}</div>
        <div><span className="font-medium">Salesman:</span> {challan.salesman}</div>
      </div>
    </div>
  );

  // ==========================================
  // MOBILE SALESMAN CARD COMPONENT
  // ==========================================

  const MobileSalesmanCard = ({ salesman }: { salesman: SalesmanSummary }) => {
    const isExpanded = expandedSalesmen.has(salesman.salesmanName);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div 
          className="flex justify-between items-start mb-3 cursor-pointer"
          onClick={() => toggleSalesmanExpansion(salesman.salesmanName)}
        >
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 text-base">{salesman.salesmanName}</h3>
            <p className="text-sm text-gray-500">{salesman.totalShops} shops • {salesman.totalChallans} challans</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">{salesman.collectedChallans}</div>
              <div className="text-xs text-gray-500">Collected</div>
            </div>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>
        
        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{salesman.collectedChallans}</div>
            <div className="text-xs text-gray-500">Collected Challans</div>
            <div className="text-xs text-gray-400">{salesman.collectedShops} shops</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">{salesman.pendingChallans}</div>
            <div className="text-xs text-gray-500">Pending Challans</div>
            <div className="text-xs text-gray-400">{salesman.pendingShops} shops</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-green-600 h-3 rounded-full transition-all duration-500" 
            style={{ 
              width: `${salesman.totalChallans > 0 ? (salesman.collectedChallans / salesman.totalChallans) * 100 : 0}%` 
            }}
          ></div>
        </div>
        <div className="text-center text-xs text-gray-500">
          {salesman.totalChallans > 0 ? Math.round((salesman.collectedChallans / salesman.totalChallans) * 100) : 0}% Complete
        </div>

        {/* Expanded Challan Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {salesman.collectedChallans > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-green-700 mb-2">Collected Challans ({salesman.collectedChallans})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getFilteredChallans(salesman.collectedChallansList).map(challan => (
                    <MobileChallanCard key={challan.challanNo} challan={challan} />
                  ))}
                </div>
              </div>
            )}
            
            {salesman.pendingChallans > 0 && (
              <div>
                <h4 className="font-medium text-orange-700 mb-2">Pending Challans ({salesman.pendingChallans})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getFilteredChallans(salesman.pendingChallansList).map(challan => (
                    <MobileChallanCard key={challan.challanNo} challan={challan} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==========================================
  // RENDER
  // ==========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Submission Data</h3>
          <p className="text-gray-600">Processing challan submission status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 p-6 rounded-lg max-w-2xl mx-auto">
          <h3 className="text-lg font-medium text-red-800 mb-4">⚠️ Submission Tracking Configuration Issue</h3>
          <div className="text-red-700 text-sm mb-6 text-left">
            <p className="font-medium mb-2">Error Details:</p>
            <div className="bg-red-50 p-3 rounded border text-xs font-mono whitespace-pre-wrap">
              {error}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg text-left mb-4">
            <h4 className="font-medium text-blue-800 mb-3">🔧 Quick Fix Checklist:</h4>
            <ol className="text-sm text-blue-700 space-y-2">
              <li>
                <strong>1. Check Google Sheet Access:</strong>
                <br />• Open: <a href={`https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_SUBMISSION_SHEET_ID}`} target="_blank" className="text-blue-600 underline">Your Submission Sheet</a>
                <br />• Make sure it's set to "Anyone with the link can view"
              </li>
              <li>
                <strong>2. Check Master Sheet Access:</strong>
                <br />• Open: <a href={`https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_MASTER_SHEET_ID}`} target="_blank" className="text-blue-600 underline">Your Master Sheet (Shop Details)</a>
                <br />• Make sure "Shop Details" tab is accessible for salesman mapping
              </li>
              <li>
                <strong>3. Verify Tab Names:</strong>
                <br />• Must have tab named exactly: <code className="bg-gray-200 px-1">scanned challans</code>
                <br />• Must have tab named exactly: <code className="bg-gray-200 px-1">Sheet1</code>
              </li>
              <li>
                <strong>4. Check Environment Variables:</strong>
                <br />• NEXT_PUBLIC_SUBMISSION_SHEET_ID: {process.env.NEXT_PUBLIC_SUBMISSION_SHEET_ID ? '✅ Set' : '❌ Missing'}
                <br />• NEXT_PUBLIC_MASTER_SHEET_ID: {process.env.NEXT_PUBLIC_MASTER_SHEET_ID ? '✅ Set' : '❌ Missing'}
                <br />• NEXT_PUBLIC_GOOGLE_API_KEY: {process.env.NEXT_PUBLIC_GOOGLE_API_KEY ? '✅ Set' : '❌ Missing'}
              </li>
              <li>
                <strong>5. API Key Permissions:</strong>
                <br />• Make sure your Google API key has Google Sheets API enabled
              </li>
            </ol>
          </div>
          
          <div className="flex space-x-3 justify-center">
            <button
              onClick={fetchSubmissionData}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              🔄 Retry Connection
            </button>
            <a
              href={`https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_SUBMISSION_SHEET_ID}/edit`}
              target="_blank"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              📋 Open Sheet
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Submission Tracking Dashboard</h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Challan collection status: {submissionData?.weekRange}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Week Range:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            
            <button
              onClick={fetchSubmissionData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Update</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {submissionData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    {submissionData.totalCollectedChallans}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">Collected Challans</div>
                  <div className="text-xs text-gray-400">{submissionData.totalCollectedShops} shops</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">
                    {submissionData.totalPendingChallans}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">Pending Challans</div>
                  <div className="text-xs text-gray-400">{submissionData.totalPendingShops} shops</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {submissionData.totalCollectedChallans + submissionData.totalPendingChallans}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">Total Challans</div>
                  <div className="text-xs text-gray-400">
                    {submissionData.totalCollectedShops + submissionData.totalPendingShops} shops
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">
                    {filteredSummaries.length}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">Active Salesmen</div>
                  <div className="text-xs text-gray-400">
                    {submissionData.totalCollectedChallans + submissionData.totalPendingChallans > 0 
                      ? Math.round((submissionData.totalCollectedChallans / (submissionData.totalCollectedChallans + submissionData.totalPendingChallans)) * 100)
                      : 0}% completion
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'summary'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('collected')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'collected'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Collected Challans ({submissionData.totalCollectedChallans})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'pending'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pending Challans ({submissionData.totalPendingChallans})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'summary' && (
                <>
                  {/* Filters and Export */}
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 mb-6">
                    <div className="flex items-center space-x-3">
                      <Filter className="w-5 h-5 text-gray-400" />
                      <select
                        value={selectedSalesman}
                        onChange={(e) => setSelectedSalesman(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">All Salesmen</option>
                        {submissionData.salesmanSummaries.map(s => (
                          <option key={s.salesmanName} value={s.salesmanName}>
                            {s.salesmanName}
                          </option>
                        ))}
                      </select>
                      
                      {selectedSalesman && (
                        <button
                          onClick={() => setSelectedSalesman('')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <button
                      onClick={exportToExcel}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Data</span>
                    </button>
                  </div>

                  {/* Mobile View */}
                  <div className="block lg:hidden">
                    <div className="space-y-4">
                      {filteredSummaries.map((salesman) => (
                        <MobileSalesmanCard key={salesman.salesmanName} salesman={salesman} />
                      ))}
                    </div>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden lg:block">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Salesman
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Collected Challans
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Collected Shops
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Pending Challans
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Pending Shops
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Challans
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Completion %
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredSummaries.map((salesman, index) => (
                            <tr key={salesman.salesmanName} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {salesman.salesmanName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                {salesman.collectedChallans}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {salesman.collectedShops}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                                {salesman.pendingChallans}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {salesman.pendingShops}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                                {salesman.totalChallans}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                    <div 
                                      className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                                      style={{ 
                                        width: `${salesman.totalChallans > 0 ? (salesman.collectedChallans / salesman.totalChallans) * 100 : 0}%` 
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium">
                                    {salesman.totalChallans > 0 ? Math.round((salesman.collectedChallans / salesman.totalChallans) * 100) : 0}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'collected' && (
                <>
                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search by challan number, shop name, department, or salesman..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  {/* Collected Challans Table */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="px-4 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-green-700">
                        Collected Challans ({submissionData.totalCollectedChallans})
                      </h3>
                      <p className="text-sm text-gray-500">
                        Challans that have been scanned and submitted
                      </p>
                    </div>
                    
                    <div className="hidden sm:block">
                      <ChallanTable 
                        challans={filteredSummaries.flatMap(s => s.collectedChallansList)} 
                        type="collected" 
                      />
                    </div>
                    
                    {/* Mobile View */}
                    <div className="block sm:hidden p-4">
                      <div className="space-y-3">
                        {getFilteredChallans(filteredSummaries.flatMap(s => s.collectedChallansList)).map(challan => (
                          <MobileChallanCard key={challan.challanNo} challan={challan} />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'pending' && (
                <>
                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search by challan number, shop name, department, or salesman..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Pending Challans Table */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="px-4 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-orange-700">
                        Pending Challans ({submissionData.totalPendingChallans})
                      </h3>
                      <p className="text-sm text-gray-500">
                        Challans that are waiting to be scanned and submitted
                      </p>
                    </div>
                    
                    <div className="hidden sm:block">
                      <ChallanTable 
                        challans={filteredSummaries.flatMap(s => s.pendingChallansList)} 
                        type="pending" 
                      />
                    </div>
                    
                    {/* Mobile View */}
                    <div className="block sm:hidden p-4">
                      <div className="space-y-3">
                        {getFilteredChallans(filteredSummaries.flatMap(s => s.pendingChallansList)).map(challan => (
                          <MobileChallanCard key={challan.challanNo} challan={challan} />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SubmissionTrackingTab;
