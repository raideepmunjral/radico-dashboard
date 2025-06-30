'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Download, RefreshCw, Calendar, Package, CheckCircle, Clock, Users, Building, Filter, X, ChevronDown, ChevronUp, Search, AlertTriangle } from 'lucide-react';
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
  scanningDate?: string; // New field for scanning date
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

// 🆕 NEW: Daily Scanning Report Types
interface DepartmentScanningData {
  challans: ChallanData[];
  total: number;
  salesmen: string[];
}

interface DailyScanningReport {
  scanningDate: string;
  formattedScanningDate: string; // DD-MM-YYYY format for display
  departments: Record<string, DepartmentScanningData>;
  grandTotal: number;
  totalSalesmen: number;
}

// ==========================================
// 🔧 COMPLETELY REWRITTEN HELPER FUNCTIONS
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

// 🔧 FIXED: Date comparison function with extensive logging
const isDateInRange = (dateStr: string, startDate: Date, endDate: Date): boolean => {
  if (!dateStr) {
    return false;
  }
  
  try {
    const parts = dateStr.trim().split('-');
    if (parts.length !== 3) {
      return false;
    }
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed in JavaScript
    const year = parseInt(parts[2]);
    
    // Validate parsed values
    if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 0 || month > 11) {
      return false;
    }
    
    // Create date object and normalize to start of day
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    
    // Normalize comparison dates to start of day
    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setHours(0, 0, 0, 0);
    
    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setHours(23, 59, 59, 999); // End of day for inclusive comparison
    
    const isInRange = date >= normalizedStartDate && date <= normalizedEndDate;
    
    return isInRange;
  } catch (error) {
    return false;
  }
};

// 🔧 FIXED: Create date from YYYY-MM-DD input with proper handling
const createDateFromInput = (inputDateStr: string): Date => {
  if (!inputDateStr) return new Date();
  
  // Input is in YYYY-MM-DD format from HTML date input
  const [year, month, day] = inputDateStr.split('-').map(num => parseInt(num));
  const date = new Date(year, month - 1, day); // month - 1 because JS months are 0-indexed
  date.setHours(0, 0, 0, 0);
  return date;
};

// 🔧 COMPLETELY REWRITTEN: Exact scanning date match function with extensive debugging
const isScanningDateMatch = (scanningDateStr: string, targetDateInput: string): boolean => {
  if (!scanningDateStr || !targetDateInput) {
    return false;
  }
  
  try {
    // scanningDateStr is in DD-MM-YYYY format from CSV (e.g., "21-06-2025")
    // targetDateInput is in YYYY-MM-DD format from HTML input (e.g., "2025-06-21")
    
    // Parse scanning date (DD-MM-YYYY)
    const scanParts = scanningDateStr.trim().split('-');
    if (scanParts.length !== 3) {
      return false;
    }
    
    const scanDay = scanParts[0].padStart(2, '0');
    const scanMonth = scanParts[1].padStart(2, '0');
    const scanYear = scanParts[2];
    
    // Parse target date (YYYY-MM-DD)
    const targetParts = targetDateInput.split('-');
    if (targetParts.length !== 3) {
      return false;
    }
    
    const targetYear = targetParts[0];
    const targetMonth = targetParts[1].padStart(2, '0');
    const targetDay = targetParts[2].padStart(2, '0');
    
    // Create normalized date strings for comparison
    const normalizedScanDate = `${scanDay}-${scanMonth}-${scanYear}`;
    const normalizedTargetDate = `${targetDay}-${targetMonth}-${targetYear}`;
    
    const isMatch = normalizedScanDate === normalizedTargetDate;
    
    // Enhanced debugging for date matching issues
    if (scanningDateStr === "21-06-2025" || targetDateInput === "2025-06-21") {
      console.log(`🔍 CRITICAL DATE MATCH DEBUG:`, {
        scanningDate: scanningDateStr,
        targetInput: targetDateInput,
        scanParts: { day: scanDay, month: scanMonth, year: scanYear },
        targetParts: { day: targetDay, month: targetMonth, year: targetYear },
        normalizedScan: normalizedScanDate,
        normalizedTarget: normalizedTargetDate,
        isMatch
      });
    }
    
    return isMatch;
    
  } catch (error) {
    console.error('❌ Error in date matching:', error);
    return false;
  }
};

// 🆕 FIXED: Format date for display (DD-MM-YYYY)
const formatDateForDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    // If it's already in DD-MM-YYYY format, return as is
    if (dateStr.includes('-') && dateStr.split('-')[0].length <= 2) {
      return dateStr;
    }
    
    // If it's in YYYY-MM-DD format, convert to DD-MM-YYYY
    const [year, month, day] = dateStr.split('-');
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  } catch {
    return dateStr;
  }
};

// 🆕 HELPER: Calculate Monday-Sunday week range for a given date
const getWeekRange = (dateStr: string): string => {
  if (!dateStr) return 'Unknown Week';
  
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return 'Invalid Date';
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed in JavaScript
    const year = parseInt(parts[2]);
    
    const date = new Date(year, month, day);
    
    // Calculate Monday of the week
    const dayOfWeek = date.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday (0) as 7
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);
    
    // Calculate Sunday of the week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    // Format as DD-MM-YYYY
    const formatDate = (d: Date) => {
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear().toString();
      return `${day}-${month}-${year}`;
    };
    
    return `${formatDate(monday)} to ${formatDate(sunday)}`;
  } catch (error) {
    console.error('Error calculating week range:', error);
    return 'Invalid Date';
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
  
  // 🆕 NEW: Daily Scanning Report State with reconciliation
  const [scanningDate, setScanningDate] = useState<string>('');
  const [dailyReport, setDailyReport] = useState<DailyScanningReport | null>(null);
  const [loadingDailyReport, setLoadingDailyReport] = useState(false);
  const [dailyReconciliation, setDailyReconciliation] = useState<{
    totalScannedOnDate: number;
    foundInSheet1: number;
    missingFromSheet1: number;
    missingChallans: string[];
  } | null>(null);
  
  // Filter State
  const [selectedSalesman, setSelectedSalesman] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'summary' | 'collected' | 'pending' | 'daily-report'>('summary');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedSalesmen, setExpandedSalesmen] = useState<Set<string>>(new Set());
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  
  // State for reconciliation report
  const [reconciliationReport, setReconciliationReport] = useState<{
    totalScanned: number;
    foundInRange: number;
    outsideDateRange: number;
    notInSheet1: number;
    missingChallans: string[];
    outsideRangeChallans: string[];
  } | null>(null);
  
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
    
    // Set today's date as default scanning date
    setScanningDate(today.toISOString().split('T')[0]);
  }, []);

  // ==========================================
  // 🆕 COMPLETELY REWRITTEN: DAILY SCANNING REPORT FUNCTIONS
  // ==========================================

  const fetchDailyScanningData = async () => {
    if (!scanningDate) {
      alert('Please select a scanning date first.');
      return;
    }
    
    setLoadingDailyReport(true);
    setError(null);
    
    try {
      const submissionSheetId = process.env.NEXT_PUBLIC_SUBMISSION_SHEET_ID;
      const masterSheetId = process.env.NEXT_PUBLIC_MASTER_SHEET_ID;
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      
      if (!submissionSheetId || !masterSheetId || !apiKey) {
        throw new Error('Daily scanning report configuration missing. Please check environment variables.');
      }

      console.log('🆕 FIXED: Fetching daily scanning data for:', scanningDate);
      console.log('🎯 Target date format (YYYY-MM-DD):', scanningDate);

      // Fetch the same data sources
      const scannedUrl = `https://sheets.googleapis.com/v4/spreadsheets/${submissionSheetId}/values/scanned%20challans?key=${apiKey}`;
      const detailsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${submissionSheetId}/values/Sheet1?key=${apiKey}`;
      const shopDetailsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${masterSheetId}/values/Shop%20Details?key=${apiKey}`;
      
      const [scannedResponse, detailsResponse, shopDetailsResponse] = await Promise.all([
        fetch(scannedUrl),
        fetch(detailsUrl),
        fetch(shopDetailsUrl)
      ]);

      if (!scannedResponse.ok || !detailsResponse.ok) {
        throw new Error('Failed to fetch daily scanning data from Google Sheets');
      }

      const scannedData = await scannedResponse.json();
      const detailsData = await detailsResponse.json();
      const shopDetailsData = shopDetailsResponse.ok ? await shopDetailsResponse.json() : { values: [] };
      
      console.log('📊 Raw data fetched:', {
        scannedRows: scannedData.values?.length || 0,
        detailsRows: detailsData.values?.length || 0,
        shopDetailsRows: shopDetailsData.values?.length || 0
      });
      
      const processedDailyReport = processDailyScanningReport(
        scannedData.values || [], 
        detailsData.values || [], 
        shopDetailsData.values || []
      );
      
      setDailyReport(processedDailyReport);
      
    } catch (error: any) {
      console.error('❌ Error fetching daily scanning data:', error);
      setError(error.message || 'Unknown error occurred while fetching daily report');
    } finally {
      setLoadingDailyReport(false);
    }
  };

  const processDailyScanningReport = (
    scannedValues: any[][], 
    detailsValues: any[][], 
    shopDetailsValues: any[][]
  ): DailyScanningReport => {
    console.log('🆕 COMPLETELY REWRITTEN: PROCESSING DAILY SCANNING REPORT');
    console.log('📅 Target Scanning Date (YYYY-MM-DD):', scanningDate);
    console.log('📅 Target Scanning Date (Display):', formatDateForDisplay(scanningDate));

    // Build shop details mapping
    const shopDetailsMap: Record<string, any> = {};
    shopDetailsValues.slice(1).forEach((row) => {
      const shopId = row[0]?.toString().trim();
      const salesmanEmail = row[1]?.toString().trim();
      const dept = row[2]?.toString().trim() === "DSIIDC" ? "DSIDC" : row[2]?.toString().trim();
      const shopName = row[3]?.toString().trim();
      const salesman = row[4]?.toString().trim();
      
      if (shopId && shopName && salesman) {
        shopDetailsMap[shopId] = { shopName, dept, salesman, salesmanEmail };
        shopDetailsMap[shopName] = { shopId, shopName, dept, salesman, salesmanEmail };
      }
    });

    console.log(`👥 Shop details mapping built: ${Object.keys(shopDetailsMap).length / 2} shops`);

    // 🔧 FIXED: Get challans scanned on EXACT target date with better logging
    const scannedChallansOnTargetDate = new Set<string>();
    const scanningDateMap: Record<string, string> = {}; // challan -> scanning date
    let totalScannedChallans = 0;
    let matchedScannedChallans = 0;
    
    console.log('🔍 ANALYZING SCANNED CHALLANS DATA...');
    console.log('🎯 Target scanning date (input):', scanningDate);
    console.log('🎯 Target scanning date (display):', formatDateForDisplay(scanningDate));
    
    scannedValues.slice(1).forEach((row, index) => {
      if (row.length >= 2) {
        totalScannedChallans++;
        const challanNo = row[0]?.toString().trim();
        const scanDateStr = row[1]?.toString().trim(); // Column B contains scanning date in DD-MM-YYYY format
        
        if (challanNo && scanDateStr) {
          scanningDateMap[challanNo] = scanDateStr;
          
          // Log first 10 rows for debugging
          if (index < 10) {
            console.log(`🔍 Scanned Row ${index + 1}:`, {
              challanNo,
              scanDateStr,
              targetDate: scanningDate,
              isMatch: isScanningDateMatch(scanDateStr, scanningDate)
            });
          }
          
          if (isScanningDateMatch(scanDateStr, scanningDate)) {
            scannedChallansOnTargetDate.add(challanNo);
            matchedScannedChallans++;
            
            if (matchedScannedChallans <= 10) {
              console.log(`✅ MATCHED CHALLAN ${matchedScannedChallans}:`, {
                challanNo,
                scanDateStr,
                targetDate: scanningDate
              });
            }
          }
        }
      }
    });

    console.log(`📦 CRITICAL - SCANNING MATCH RESULTS:`, {
      totalScannedChallans,
      matchedScannedChallans,
      targetDate: scanningDate,
      formattedTargetDate: formatDateForDisplay(scanningDate),
      scannedOnTargetDateSet: scannedChallansOnTargetDate.size
    });

    if (matchedScannedChallans === 0) {
      console.log('🚨 NO CHALLANS FOUND for target date!');
      console.log('🔍 Sample scanning dates from CSV:', 
        scannedValues.slice(1, 10).map((row, i) => `Row ${i+1}: ${row[1]?.toString().trim()}`).filter(x => x.includes(': '))
      );
      console.log('🔍 First 5 challan numbers:', 
        scannedValues.slice(1, 6).map(row => row[0]?.toString().trim()).filter(Boolean)
      );
    } else {
      console.log('✅ Found challans scanned on target date:', Array.from(scannedChallansOnTargetDate).slice(0, 5));
    }

    // 🔧 FIXED: Process detailed challan data ONLY for exactly matched scanned challans
    const dailyChallans: ChallanData[] = [];
    const uniqueChallansProcessed = new Set<string>(); // Track unique challans
    const challansFoundInSheet1 = new Set<string>(); // Track which scanned challans have data
    let totalDetailRows = 0;
    let processedDetailRows = 0;
    let duplicateRowsSkipped = 0;

    console.log('🔍 PROCESSING DETAILED CHALLAN DATA (GROUPING BY UNIQUE CHALLAN)...');

    detailsValues.slice(1).forEach((row, index) => {
      if (row.length >= 15) {
        totalDetailRows++;
        const challanNo = row[0]?.toString().trim();
        const challanDate = row[1]?.toString().trim();
        const shopDept = row[4]?.toString().trim();
        const shopId = row[8]?.toString().trim();
        const shopName = row[9]?.toString().trim();
        const brand = row[11]?.toString().trim();
        const cases = parseFloat(row[14]) || 0;

        // 🎯 CRITICAL FIX: Only include challans that were scanned on the EXACT target date
        if (challanNo && scannedChallansOnTargetDate.has(challanNo)) {
          
          // 🆕 Track that this scanned challan has data in Sheet1
          challansFoundInSheet1.add(challanNo);
          
          // 🔧 NEW: Skip duplicate challan numbers (only process first occurrence)
          if (uniqueChallansProcessed.has(challanNo)) {
            duplicateRowsSkipped++;
            if (duplicateRowsSkipped <= 5) {
              console.log(`⏭️ SKIPPING DUPLICATE ${duplicateRowsSkipped}:`, {
                challanNo,
                brand,
                cases,
                reason: 'Already processed this challan number'
              });
            }
            return; // Skip this row as we've already processed this challan
          }
          
          // Mark this challan as processed
          uniqueChallansProcessed.add(challanNo);
          processedDetailRows++;
          
          // Log first few processed challans
          if (processedDetailRows <= 10) {
            console.log(`✅ PROCESSING UNIQUE CHALLAN ${processedDetailRows}:`, {
              challanNo,
              challanDate,
              shopName,
              brand,
              cases,
              isScanned: true,
              scanningDate: scanningDateMap[challanNo],
              isInTargetDateSet: scannedChallansOnTargetDate.has(challanNo)
            });
          }
          
          // Department processing
          const department = shopDept?.replace(' Limited', '').trim();
          const cleanDept = department === "DSIIDC" ? "DSIDC" : department;

          // Salesman mapping
          let salesmanName = 'Unknown';
          if (shopId && shopDetailsMap[shopId]) {
            salesmanName = shopDetailsMap[shopId].salesman;
          } else if (shopName && shopDetailsMap[shopName]) {
            salesmanName = shopDetailsMap[shopName].salesman;
          } else if (shopName) {
            const matchingShop = Object.keys(shopDetailsMap).find(key => {
              const keyLower = key.toLowerCase();
              const shopLower = shopName.toLowerCase();
              return keyLower === shopLower || 
                     keyLower.includes(shopLower) || 
                     shopLower.includes(keyLower);
            });
            if (matchingShop && shopDetailsMap[matchingShop]) {
              salesmanName = shopDetailsMap[matchingShop].salesman;
            }
          }

          dailyChallans.push({
            challanNo,
            challanDate,
            shopName: shopName || 'Unknown Shop',
            shopId: shopId || '',
            department: cleanDept || 'Unknown',
            salesman: salesmanName,
            brand,
            cases,
            isScanned: true,
            scanningDate: scanningDateMap[challanNo] || ''
          });
        }
      }
    });

    console.log(`📊 DETAILED PROCESSING RESULTS (UNIQUE CHALLANS ONLY):`, {
      totalDetailRows,
      processedDetailRows,
      duplicateRowsSkipped,
      dailyChallansCreated: dailyChallans.length,
      uniqueChallansProcessed: uniqueChallansProcessed.size,
      challansFoundInSheet1: challansFoundInSheet1.size,
      shouldMatch: matchedScannedChallans
    });

    // 🆕 NEW: Calculate missing challans for reconciliation
    const missingChallans = Array.from(scannedChallansOnTargetDate).filter(
      challanNo => !challansFoundInSheet1.has(challanNo)
    );

    console.log(`📋 RECONCILIATION DATA:`, {
      totalScannedOnDate: scannedChallansOnTargetDate.size,
      foundInSheet1: challansFoundInSheet1.size,
      missingFromSheet1: missingChallans.length,
      missingChallans: missingChallans.slice(0, 10) // Show first 10
    });

    // Apply role-based filtering
    const filteredChallans = dailyChallans.filter(challan => {
      if (user && user.role === 'salesman') {
        return challan.salesman === user.name || 
               challan.salesman === user.email ||
               challan.salesman?.toLowerCase() === user.name?.toLowerCase();
      }
      return true;
    });

    console.log(`🔐 ROLE FILTERING: ${dailyChallans.length} -> ${filteredChallans.length} challans`);

    // Group by department
    const departments: Record<string, DepartmentScanningData> = {};
    const allSalesmen = new Set<string>();

    filteredChallans.forEach(challan => {
      const dept = challan.department;
      
      if (!departments[dept]) {
        departments[dept] = {
          challans: [],
          total: 0,
          salesmen: []
        };
      }
      
      departments[dept].challans.push(challan);
      departments[dept].total++;
      allSalesmen.add(challan.salesman);
    });

    // Update salesmen list for each department
    Object.keys(departments).forEach(dept => {
      const deptSalesmen = new Set<string>();
      departments[dept].challans.forEach(challan => {
        deptSalesmen.add(challan.salesman);
      });
      departments[dept].salesmen = Array.from(deptSalesmen);
    });

    const grandTotal = filteredChallans.length;
    const formattedScanningDate = formatDateForDisplay(scanningDate);

    console.log('✅ FINAL DAILY SCANNING REPORT RESULTS:', {
      scanningDate,
      formattedScanningDate,
      departments: Object.keys(departments).length,
      grandTotal,
      totalSalesmen: allSalesmen.size,
      departmentBreakdown: Object.keys(departments).map(dept => ({
        dept,
        count: departments[dept].total
      }))
    });

    // 🚨 CRITICAL VALIDATION CHECK
    console.log(`🚨 VALIDATION CHECK (UNIQUE CHALLANS):`, {
      expectedFromScanning: matchedScannedChallans,
      actualInReport: grandTotal,
      uniqueChallansProcessed: uniqueChallansProcessed.size,
      duplicateRowsSkipped: duplicateRowsSkipped,
      difference: grandTotal - matchedScannedChallans,
      isCorrect: grandTotal === matchedScannedChallans
    });
    
    if (grandTotal !== matchedScannedChallans) {
      console.log(`🚨 ISSUE DETECTED:`);
      console.log(`   Expected: ${matchedScannedChallans} challans (from scanning data)`);
      console.log(`   Got: ${grandTotal} challans (from detailed processing)`);
      console.log(`   Unique challans processed: ${uniqueChallansProcessed.size}`);
      console.log(`   Duplicate rows skipped: ${duplicateRowsSkipped}`);
      console.log(`   Difference: ${grandTotal - matchedScannedChallans}`);
      
      // Debug: Show first few challans in each department to verify
      Object.keys(departments).forEach(dept => {
        const deptChallans = departments[dept].challans.slice(0, 3);
        console.log(`   ${dept} sample challans:`, deptChallans.map(c => ({
          challanNo: c.challanNo,
          scanDate: c.scanningDate,
          isInTargetSet: scannedChallansOnTargetDate.has(c.challanNo)
        })));
      });
    } else {
      console.log(`✅ PERFECT! Expected and actual counts match exactly!`);
      console.log(`   📋 ${matchedScannedChallans} unique challans scanned on target date`);
      console.log(`   📊 ${grandTotal} unique challans in final report`);
      console.log(`   ⏭️ ${duplicateRowsSkipped} duplicate SKU rows properly skipped`);
    }

    // 🆕 NEW: Set reconciliation data for UI
    setDailyReconciliation({
      totalScannedOnDate: scannedChallansOnTargetDate.size,
      foundInSheet1: challansFoundInSheet1.size,
      missingFromSheet1: missingChallans.length,
      missingChallans: missingChallans
    });

    return {
      scanningDate,
      formattedScanningDate,
      departments,
      grandTotal,
      totalSalesmen: allSalesmen.size
    };
  };

  // 🆕 FIXED: Generate PDF for Daily Scanning Report with Professional Letterhead
  const generateDailyScanningPDF = async () => {
    if (!dailyReport) {
      alert('No daily report data available. Please fetch the report first.');
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF();
      
      // Elegant woody color scheme
      const woodyBrown = [101, 67, 33]; // Elegant dark wood color
      
      // Professional Letterhead Header
      try {
        // Try to add company logo
        const logoResponse = await fetch('/radico-dashboard/munjral-logo.png');
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          const logoDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(logoBlob);
          });
          
          // Add Munjral logo (top-left, professional size)
          doc.addImage(logoDataUrl, 'PNG', 20, 15, 25, 25);
        }
      } catch (error) {
        console.log('Munjral logo not found, proceeding without image');
      }
      
      // Company Name and Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(woodyBrown[0], woodyBrown[1], woodyBrown[2]); // Elegant woody brown
      doc.text('MUNJRAL BROTHERS DISTRIBUTION PVT LTD', 55, 25);
      
      // Service Branding Section
      doc.setFontSize(10);
      doc.setTextColor(woodyBrown[0], woodyBrown[1], woodyBrown[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('TERTIARY SALES MANAGEMENT', 55, 33);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      // Elegant separator line
      doc.setLineWidth(0.5);
      doc.setDrawColor(woodyBrown[0], woodyBrown[1], woodyBrown[2]); // Woody brown line
      doc.line(20, 40, 190, 40);
      
      // Client branding - centered under header line
      try {
        const radicoLogoResponse = await fetch('/radico-dashboard/radico-logo.png');
        if (radicoLogoResponse.ok) {
          const radicoLogoBlob = await radicoLogoResponse.blob();
          const radicoLogoDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(radicoLogoBlob);
          });
          
          // Add centered Radico logo under the header line
          doc.addImage(radicoLogoDataUrl, 'PNG', 85, 45, 12, 12);
        }
      } catch (error) {
        console.log('Radico logo not found, proceeding without image');
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(woodyBrown[0], woodyBrown[1], woodyBrown[2]);
      // Center the text (approximate center at x=105, accounting for logo width)
      doc.text('RADICO KHAITAN LTD', 100, 51);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      // Date and recipient information (moved down to accommodate new layout)
      doc.setFontSize(11);
      const currentDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      doc.text(`Date: ${currentDate}`, 20, 70);
      doc.text(`To: M/s Radico Khaitan Limited`, 20, 80);
      
      // Subject line
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SUBJECT:', 20, 95);
      doc.setFont('helvetica', 'normal');
      doc.text(`PHYSICAL CHALLANS SENT TO RADICO KHAITAN ON ${dailyReport.formattedScanningDate}`, 50, 95);
      
      // Formal greeting
      doc.setFontSize(11);
      doc.text(`Dear Sir,`, 20, 115);
      doc.text(`Please see below details of Physical challans collected and`, 20, 125);
      doc.text(`handed over to you on ${dailyReport.formattedScanningDate}.`, 20, 135);
      
      // Summary Table
      const summaryTableData = Object.keys(dailyReport.departments)
        .sort() // Sort departments alphabetically
        .map(deptName => [
          deptName,
          dailyReport.departments[deptName].total.toString()
        ]);
      
      // Add grand total row
      summaryTableData.push(['GRAND TOTAL', dailyReport.grandTotal.toString()]);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY:', 20, 155);
      doc.setFont('helvetica', 'normal');
      
      (doc as any).autoTable({
        head: [['Department', 'Total Challans']],
        body: summaryTableData,
        startY: 165,
        theme: 'striped',
        styles: { 
          fontSize: 11,
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          halign: 'center'
        },
        headStyles: { 
          fillColor: woodyBrown, // Woody brown header
          textColor: [255, 255, 255],
          fontSize: 12,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [248, 246, 244] // Light woody alternate rows
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'normal' },
          1: { halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 60, right: 60 }, // Center the summary table
        didParseCell: (data: any) => {
          // Style the grand total row differently
          if (data.row.index === summaryTableData.length - 1) {
            data.cell.styles.fillColor = woodyBrown; // Woody brown background for grand total
            data.cell.styles.textColor = [255, 255, 255]; // White text
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 12;
          }
        }
      });
      
      let yPosition = (doc as any).lastAutoTable.finalY + 20;
      
      // Detailed breakdown header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DETAILED BREAKDOWN:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      yPosition += 15;
      
      // Department-wise data
      Object.keys(dailyReport.departments)
        .sort() // Sort departments alphabetically
        .forEach(deptName => {
          const deptData = dailyReport.departments[deptName];
          
          // Department header
          doc.setFontSize(13);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(woodyBrown[0], woodyBrown[1], woodyBrown[2]); // Woody brown color for department headers
          doc.text(`${deptName}:`, 20, yPosition);
          doc.setTextColor(0, 0, 0); // Reset to black
          doc.setFont('helvetica', 'normal');
          yPosition += 10;
          
          // Department table with professional styling
          const tableData = deptData.challans.map(challan => [
            challan.salesman,
            challan.challanNo,
            formatDate(challan.challanDate),
            challan.shopName,
            challan.department
          ]);
          
          (doc as any).autoTable({
            head: [['Salesman', 'Challan No', 'Challan Date', 'Shop Name', 'Department']],
            body: tableData,
            startY: yPosition,
            theme: 'striped',
            styles: { 
              fontSize: 8,
              cellPadding: 4,
              lineColor: [200, 200, 200],
              lineWidth: 0.1,
              overflow: 'linebreak',
              cellWidth: 'wrap'
            },
            headStyles: { 
              fillColor: woodyBrown, // Woody brown header
              textColor: [255, 255, 255],
              fontSize: 10,
              fontStyle: 'bold',
              halign: 'center',
              valign: 'middle',
              cellPadding: 5,
              minCellHeight: 12
            },
            columnStyles: {
              0: { cellWidth: 32, halign: 'left' },   // Salesman
              1: { cellWidth: 28, halign: 'center' }, // Challan No
              2: { cellWidth: 22, halign: 'center' }, // Challan Date
              3: { cellWidth: 75, halign: 'left' },   // Shop Name
              4: { cellWidth: 23, halign: 'center' }  // Department
            },
            alternateRowStyles: {
              fillColor: [248, 246, 244] // Light woody alternate rows
            },
            margin: { left: 10, right: 10 },
            tableWidth: 'auto',
            didDrawPage: (data: any) => {
              // Add letterhead to new pages with proper spacing
              if (data.pageNumber > 1) {
                // Only add letterhead if we're starting a new page, not mid-table
                if (data.cursor && data.cursor.y < 50) {
                  doc.setFontSize(14);
                  doc.setFont('helvetica', 'bold');
                  doc.setTextColor(woodyBrown[0], woodyBrown[1], woodyBrown[2]);
                  doc.text('MUNJRAL BROTHERS DISTRIBUTION PVT LTD', 20, 20);
                  doc.setTextColor(0, 0, 0);
                  doc.setFont('helvetica', 'normal');
                  doc.setLineWidth(0.5);
                  doc.setDrawColor(woodyBrown[0], woodyBrown[1], woodyBrown[2]);
                  doc.line(20, 27, 190, 27);
                  doc.setFontSize(9);
                  doc.setTextColor(100, 100, 100);
                  doc.text(`Physical Challans Handover - ${dailyReport.formattedScanningDate} (Continued)`, 20, 35);
                  doc.setTextColor(0, 0, 0);
                }
              }
            },
            didDrawCell: (data: any) => {
              // Ensure headers are clearly visible
              if (data.section === 'head') {
                doc.setFont('helvetica', 'bold');
              }
            }
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 10;
          
          // Department total with professional styling
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(woodyBrown[0], woodyBrown[1], woodyBrown[2]);
          doc.text(`Total ${deptName}: ${deptData.total} challans`, 20, yPosition);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          yPosition += 15;
          
          // Add page break if needed (leaving space for closing)
          if (yPosition > 220) {
            doc.addPage();
            yPosition = 50; // Start position on new page (after letterhead space)
          }
        });
      
      // Grand total
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`GRAND TOTAL: ${dailyReport.grandTotal} challans`, 20, yPosition + 10);
      
      // Professional closing
      const closingYPosition = yPosition + 35;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Yours faithfully,`, 20, closingYPosition);
      
      // Signature space
      doc.text(`For Munjral Brothers Distribution Pvt Ltd`, 20, closingYPosition + 25);
      
      // Signature line
      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);
      doc.line(20, closingYPosition + 35, 80, closingYPosition + 35);
      
      doc.setFontSize(10);
      doc.text(`Authorized Signatory`, 20, closingYPosition + 45);
      
      doc.save(`Physical_Challans_Handover_${dailyReport.formattedScanningDate.replace(/-/g, '_')}.pdf`);
      
      console.log('✅ Daily scanning PDF generated successfully');
      
    } catch (error) {
      console.error('Error generating daily scanning PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  // 🆕 NEW: Export daily scanning CSV with salesmanwise weekly summary
  const exportDailyScanningCSV = () => {
    if (!dailyReport) {
      alert('No daily report data available. Please fetch the report first.');
      return;
    }

    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Header Section
      csvContent += "Physical Challans Handover Report\n";
      csvContent += `Scanning Date,${dailyReport.formattedScanningDate}\n`;
      csvContent += `Generated,${new Date().toLocaleString()}\n`;
      csvContent += `Total Challans,${dailyReport.grandTotal}\n`;
      csvContent += `Total Departments,${Object.keys(dailyReport.departments).length}\n`;
      csvContent += `Total Salesmen,${dailyReport.totalSalesmen}\n`;
      csvContent += "\n";
      
      // Data Quality Section
      if (dailyReconciliation) {
        csvContent += "DATA RECONCILIATION\n";
        csvContent += `Total Scanned on Date,${dailyReconciliation.totalScannedOnDate}\n`;
        csvContent += `Found in Sheet1,${dailyReconciliation.foundInSheet1}\n`;
        csvContent += `Missing from Sheet1,${dailyReconciliation.missingFromSheet1}\n`;
        csvContent += "\n";
      }
      
      // Detailed Challan Data Section
      csvContent += "DETAILED CHALLAN DATA\n";
      csvContent += "Department,Salesman,Challan Number,Challan Date,Shop Name,Shop ID,Scanning Date,Week Range\n";
      
      // Sort departments alphabetically and then challans by salesman
      const sortedDepartments = Object.keys(dailyReport.departments).sort();
      
      sortedDepartments.forEach(deptName => {
        const deptData = dailyReport.departments[deptName];
        const sortedChallans = deptData.challans.sort((a, b) => a.salesman.localeCompare(b.salesman));
        
        sortedChallans.forEach(challan => {
          const weekRange = getWeekRange(challan.challanDate);
          csvContent += `"${deptName}","${challan.salesman}","${challan.challanNo}","${challan.challanDate}","${challan.shopName}","${challan.shopId}","${challan.scanningDate || ''}","${weekRange}"\n`;
        });
      });
      
      csvContent += "\n";
      
      // Salesmanwise Weekly Summary Section
      csvContent += "SALESMANWISE WEEKLY SUMMARY\n";
      csvContent += `Challans by week for scanning date: ${dailyReport.formattedScanningDate}\n`;
      csvContent += "Salesman,Week Range,Challan Count,Challan Numbers\n";
      
      // Collect all challans from all departments
      const allChallans: ChallanData[] = [];
      Object.values(dailyReport.departments).forEach(deptData => {
        allChallans.push(...deptData.challans);
      });
      
      // Group by salesman
      const salesmanWeekMap = new Map<string, Map<string, ChallanData[]>>();
      
      allChallans.forEach(challan => {
        const salesmanName = challan.salesman;
        const weekRange = getWeekRange(challan.challanDate);
        
        if (!salesmanWeekMap.has(salesmanName)) {
          salesmanWeekMap.set(salesmanName, new Map());
        }
        
        const salesmanWeeks = salesmanWeekMap.get(salesmanName)!;
        if (!salesmanWeeks.has(weekRange)) {
          salesmanWeeks.set(weekRange, []);
        }
        
        salesmanWeeks.get(weekRange)!.push(challan);
      });
      
      // Sort salesmen alphabetically and output weekly summary
      const sortedSalesmen = Array.from(salesmanWeekMap.keys()).sort();
      
      sortedSalesmen.forEach(salesmanName => {
        const salesmanWeeks = salesmanWeekMap.get(salesmanName)!;
        
        // Sort weeks chronologically (by first date in range)
        const sortedWeeks = Array.from(salesmanWeeks.keys()).sort((a, b) => {
          // Extract first date from week range for sorting
          const dateA = a.split(' to ')[0];
          const dateB = b.split(' to ')[0];
          
          // Convert DD-MM-YYYY to comparable format
          const [dayA, monthA, yearA] = dateA.split('-').map(Number);
          const [dayB, monthB, yearB] = dateB.split('-').map(Number);
          
          const dateObjA = new Date(yearA, monthA - 1, dayA);
          const dateObjB = new Date(yearB, monthB - 1, dayB);
          
          return dateObjA.getTime() - dateObjB.getTime();
        });
        
        sortedWeeks.forEach(weekRange => {
          const weekChallans = salesmanWeeks.get(weekRange)!;
          const challanNumbers = weekChallans.map(c => c.challanNo).sort().join('; ');
          
          csvContent += `"${salesmanName}","${weekRange}",${weekChallans.length},"${challanNumbers}"\n`;
        });
      });
      
      csvContent += "\n";
      
      // Salesmanwise Total Summary
      csvContent += "SALESMANWISE TOTALS\n";
      csvContent += "Salesman,Total Challans,Week Count,Departments\n";
      
      sortedSalesmen.forEach(salesmanName => {
        const salesmanWeeks = salesmanWeekMap.get(salesmanName)!;
        const totalChallans = Array.from(salesmanWeeks.values()).reduce((sum, challans) => sum + challans.length, 0);
        const weekCount = salesmanWeeks.size;
        
        // Get unique departments for this salesman
        const departments = new Set<string>();
        Array.from(salesmanWeeks.values()).forEach(challans => {
          challans.forEach(challan => departments.add(challan.department));
        });
        const departmentList = Array.from(departments).sort().join('; ');
        
        csvContent += `"${salesmanName}",${totalChallans},${weekCount},"${departmentList}"\n`;
      });
      
      csvContent += "\n";
      
      // Department Summary Section
      csvContent += "DEPARTMENT SUMMARY\n";
      csvContent += "Department,Total Challans,Unique Salesmen,Unique Weeks\n";
      
      sortedDepartments.forEach(deptName => {
        const deptData = dailyReport.departments[deptName];
        const uniqueSalesmen = new Set(deptData.challans.map(c => c.salesman));
        const uniqueWeeks = new Set(deptData.challans.map(c => getWeekRange(c.challanDate)));
        
        csvContent += `"${deptName}",${deptData.total},${uniqueSalesmen.size},${uniqueWeeks.size}\n`;
      });
      
      csvContent += "\n";
      
      // Missing Challans Section (Not Tracked in Master)
      if (dailyReconciliation && dailyReconciliation.missingChallans.length > 0) {
        csvContent += "NOT TRACKED IN MASTER SHEET1\n";
        csvContent += `Total Missing Challans,${dailyReconciliation.missingChallans.length}\n`;
        csvContent += "Challan Number,Status,Notes\n";
        
        dailyReconciliation.missingChallans.forEach(challanNo => {
          csvContent += `"${challanNo}","Scanned but no data in Sheet1","Requires investigation"\n`;
        });
        
        csvContent += "\n";
      }
      
      // Footer
      csvContent += "REPORT SUMMARY\n";
      csvContent += `Grand Total Challans,${dailyReport.grandTotal}\n`;
      csvContent += `Scanning Date,${dailyReport.formattedScanningDate}\n`;
      csvContent += `Total Departments,${Object.keys(dailyReport.departments).length}\n`;
      csvContent += `Total Salesmen,${dailyReport.totalSalesmen}\n`;
      csvContent += `Report Generated,${new Date().toLocaleString()}\n`;

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Physical_Challans_Handover_${dailyReport.formattedScanningDate.replace(/-/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Daily scanning CSV export completed with weekly summary');
      
    } catch (error) {
      console.error('Error exporting daily scanning CSV:', error);
      alert('Error generating CSV report. Please try again.');
    }
  };

  // ==========================================
  // DATA FETCHING FUNCTIONS (UNCHANGED)
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

  const processSubmissionData = (scannedValues: any[][], detailsValues: any[][], shopDetailsValues: any[][]): SubmissionSummary => {
    console.log('🔧 PROCESSING SUBMISSION DATA WITH ENHANCED DATE LOGIC');
    console.log('📅 Selected Date Range:', { startDate, endDate });
    
    // 🔧 FIXED: Create proper Date objects from input strings
    const dateRangeStart = createDateFromInput(startDate);
    const dateRangeEnd = createDateFromInput(endDate);
    
    console.log('📅 Normalized Date Range:', {
      start: dateRangeStart.toDateString(),
      end: dateRangeEnd.toDateString()
    });

    // Extract scanned challan numbers
    const scannedChallans = new Set<string>();
    const allScannedChallans: string[] = [];
    scannedValues.slice(1).forEach(row => {
      if (row[0]) {
        const challanNo = row[0].toString().trim();
        scannedChallans.add(challanNo);
        allScannedChallans.push(challanNo);
      }
    });

    console.log(`📦 Found ${scannedChallans.size} unique scanned challans from ${allScannedChallans.length} total rows`);

    // 🔧 FIXED: Build shop details mapping for proper salesman names
    const shopDetailsMap: Record<string, any> = {};
    shopDetailsValues.slice(1).forEach((row, index) => {
      const shopId = row[0]?.toString().trim();
      const salesmanEmail = row[1]?.toString().trim();
      const dept = row[2]?.toString().trim() === "DSIIDC" ? "DSIDC" : row[2]?.toString().trim();
      const shopName = row[3]?.toString().trim();
      const salesman = row[4]?.toString().trim();
      
      if (shopId && shopName && salesman) {
        shopDetailsMap[shopId] = { shopName, dept, salesman, salesmanEmail };
        shopDetailsMap[shopName] = { shopId, shopName, dept, salesman, salesmanEmail };
      }
    });

    console.log(`👥 Found ${Object.keys(shopDetailsMap).length / 2} shops with salesman mapping`);

    // Process detailed challan data
    const headers = detailsValues[0] || [];
    const challanMap = new Map<string, ChallanData>();
    
    // 🔍 DEBUG: Track which scanned challans are found/missing
    const foundScannedChallans = new Set<string>();
    const scannedChallansOutsideDateRange = new Set<string>();
    const scannedChallansNotInSheet1 = new Set<string>();
    
    let totalRowsProcessed = 0;
    let dateFilteredRows = 0;
    let validChallansCreated = 0;

    console.log('🔍 PROCESSING CHALLAN DATA WITH ENHANCED FILTERING...');

    detailsValues.slice(1).forEach((row, index) => {
      if (row.length >= 15) {
        totalRowsProcessed++;
        
        const challanNo = row[0]?.toString().trim();
        const challanDate = row[1]?.toString().trim();
        const shopDept = row[4]?.toString().trim();
        const shopId = row[8]?.toString().trim();
        const shopName = row[9]?.toString().trim();
        const brand = row[11]?.toString().trim();
        const cases = parseFloat(row[14]) || 0;

        // 🔍 DEBUG: Track scanned challans
        if (scannedChallans.has(challanNo)) {
          if (challanDate && isDateInRange(challanDate, dateRangeStart, dateRangeEnd)) {
            foundScannedChallans.add(challanNo);
          } else {
            scannedChallansOutsideDateRange.add(challanNo);
          }
        }

        // 🔧 CRITICAL: Date range filtering with enhanced logging
        if (challanNo && challanDate) {
          const dateInRange = isDateInRange(challanDate, dateRangeStart, dateRangeEnd);
          
          if (dateInRange) {
            dateFilteredRows++;
            
            // Department processing
            const department = shopDept?.replace(' Limited', '').trim();
            const cleanDept = department === "DSIIDC" ? "DSIDC" : department;

            // Salesman mapping
            let salesmanName = 'Unknown';
            let mappingMethod = 'none';

            if (shopId && shopDetailsMap[shopId]) {
              salesmanName = shopDetailsMap[shopId].salesman;
              mappingMethod = 'shopId';
            } else if (shopName && shopDetailsMap[shopName]) {
              salesmanName = shopDetailsMap[shopName].salesman;
              mappingMethod = 'shopName';
            } else if (shopName) {
              const matchingShop = Object.keys(shopDetailsMap).find(key => {
                const keyLower = key.toLowerCase();
                const shopLower = shopName.toLowerCase();
                return keyLower === shopLower || 
                       keyLower.includes(shopLower) || 
                       shopLower.includes(keyLower);
              });
              if (matchingShop && shopDetailsMap[matchingShop]) {
                salesmanName = shopDetailsMap[matchingShop].salesman;
                mappingMethod = 'partial';
              }
            }

            // Create challan data
            const isScanned = scannedChallans.has(challanNo);
            
            if (!challanMap.has(challanNo)) {
              challanMap.set(challanNo, {
                challanNo,
                challanDate,
                shopName: shopName || 'Unknown Shop',
                shopId: shopId || '',
                department: cleanDept || 'Unknown',
                salesman: salesmanName,
                brand,
                cases,
                isScanned
              });
              validChallansCreated++;
            }
          }
        }
      }
    });

    // 🔍 DEBUG: Find missing scanned challans
    allScannedChallans.forEach(challanNo => {
      if (!foundScannedChallans.has(challanNo) && !scannedChallansOutsideDateRange.has(challanNo)) {
        scannedChallansNotInSheet1.add(challanNo);
      }
    });

    // Set reconciliation report for UI
    setReconciliationReport({
      totalScanned: allScannedChallans.length,
      foundInRange: foundScannedChallans.size,
      outsideDateRange: scannedChallansOutsideDateRange.size,
      notInSheet1: scannedChallansNotInSheet1.size,
      missingChallans: Array.from(scannedChallansNotInSheet1),
      outsideRangeChallans: Array.from(scannedChallansOutsideDateRange)
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

    const weekRange = `${formatDate(startDate.split('-').reverse().join('-'))} to ${formatDate(endDate.split('-').reverse().join('-'))}`;

    console.log('✅ FINAL SUMMARY:', {
      totalCollectedChallans,
      totalPendingChallans,
      totalCollectedShops: totalCollectedShops.size,
      totalPendingShops: totalPendingShops.size,
      salesmenCount: salesmanSummaries.length
    });

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
  // CSV EXPORT FUNCTIONS
  // ==========================================

  // 🆕 NEW: Export missing challans CSV for internal reconciliation
  const exportMissingChallansCSV = () => {
    if (!dailyReconciliation || dailyReconciliation.missingChallans.length === 0) {
      alert('No missing challans to export.');
      return;
    }

    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Header
      csvContent += "Radico Submission Tracking - Missing Challan Reconciliation\n";
      csvContent += `Generated:,${new Date().toLocaleString()}\n`;
      csvContent += `Scanning Date:,${formatDateForDisplay(scanningDate)}\n`;
      csvContent += `Total Scanned on Date:,${dailyReconciliation.totalScannedOnDate}\n`;
      csvContent += `Found in Sheet1:,${dailyReconciliation.foundInSheet1}\n`;
      csvContent += `Missing from Sheet1:,${dailyReconciliation.missingFromSheet1}\n`;
      csvContent += "\n";
      csvContent += "MISSING CHALLAN NUMBERS\n";
      csvContent += "Challan Number,Status,Notes\n";
      
      dailyReconciliation.missingChallans.forEach(challanNo => {
        csvContent += `"${challanNo}","Scanned but no data in Sheet1","Requires investigation"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Missing_Challans_Reconciliation_${formatDateForDisplay(scanningDate).replace(/-/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Missing challans CSV export completed');
      
    } catch (error) {
      console.error('Error exporting missing challans CSV:', error);
      alert('Error exporting missing challans data. Please try again.');
    }
  };

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
  // TOGGLE FUNCTIONS
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

  // 🆕 NEW: Toggle department expansion for daily report
  const toggleDepartmentExpansion = (deptName: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(deptName)) {
      newExpanded.delete(deptName);
    } else {
      newExpanded.add(deptName);
    }
    setExpandedDepartments(newExpanded);
  };

  // ==========================================
  // EFFECTS
  // ==========================================

  useEffect(() => {
    if (startDate && endDate) {
      fetchSubmissionData();
    }
  }, [startDate, endDate]);

  // 🆕 NEW: Auto-fetch daily report when scanning date changes
  useEffect(() => {
    if (scanningDate && activeTab === 'daily-report') {
      // Clear previous data
      setDailyReport(null);
      setDailyReconciliation(null);
      
      // Small delay to prevent rapid API calls
      const timeoutId = setTimeout(() => {
        fetchDailyScanningData();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [scanningDate, activeTab]);

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

          {/* Data Reconciliation Report */}
          {reconciliationReport && (
            <div className="bg-white rounded-lg shadow border-l-4 border-blue-500">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Search className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Data Reconciliation Report</h3>
                      <p className="text-sm text-gray-500">Challan data quality analysis for selected period</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {reconciliationReport.foundInRange}/{reconciliationReport.totalScanned}
                    </div>
                    <div className="text-xs text-gray-500">Found/Scanned</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{reconciliationReport.totalScanned}</div>
                    <div className="text-sm text-gray-600">Total Scanned</div>
                    <div className="text-xs text-gray-500">In "scanned challans" tab</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{reconciliationReport.foundInRange}</div>
                    <div className="text-sm text-gray-600">Found in Range</div>
                    <div className="text-xs text-gray-500">Matched in Sheet1</div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-600">{reconciliationReport.outsideDateRange}</div>
                    <div className="text-sm text-gray-600">Outside Range</div>
                    <div className="text-xs text-gray-500">Before/after date filter</div>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600">{reconciliationReport.notInSheet1}</div>
                    <div className="text-sm text-gray-600">Missing Data</div>
                    <div className="text-xs text-gray-500">Not found in Sheet1</div>
                  </div>
                </div>

                {reconciliationReport.notInSheet1 > 0 && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-red-800">Missing Challan Data</h4>
                        <p className="text-sm text-red-700 mt-1">
                          {reconciliationReport.notInSheet1} challan(s) are marked as scanned but don't have corresponding data in Sheet1.
                        </p>
                        <details className="mt-3">
                          <summary className="text-sm font-medium text-red-800 cursor-pointer hover:text-red-900">
                            View Missing Challan Numbers ({reconciliationReport.missingChallans.length})
                          </summary>
                          <div className="mt-2 p-3 bg-white rounded border">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {reconciliationReport.missingChallans.map(challan => (
                                <div key={challan} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                  {challan}
                                </div>
                              ))}
                            </div>
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>
                )}

                {reconciliationReport.outsideDateRange > 0 && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-orange-800">Challans Outside Date Range</h4>
                        <p className="text-sm text-orange-700 mt-1">
                          {reconciliationReport.outsideDateRange} challan(s) are scanned but fall outside your selected date range.
                        </p>
                        <details className="mt-3">
                          <summary className="text-sm font-medium text-orange-800 cursor-pointer hover:text-orange-900">
                            View Outside Range Challans ({reconciliationReport.outsideRangeChallans.length})
                          </summary>
                          <div className="mt-2 p-3 bg-white rounded border">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {reconciliationReport.outsideRangeChallans.slice(0, 20).map(challan => (
                                <div key={challan} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                  {challan}
                                </div>
                              ))}
                            </div>
                            {reconciliationReport.outsideRangeChallans.length > 20 && (
                              <div className="text-xs text-gray-500 mt-2">
                                ... and {reconciliationReport.outsideRangeChallans.length - 20} more
                              </div>
                            )}
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'summary'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('collected')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'collected'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Collected Challans ({submissionData.totalCollectedChallans})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'pending'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pending Challans ({submissionData.totalPendingChallans})
                </button>
                <button
                  onClick={() => setActiveTab('daily-report')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'daily-report'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Physical Handover Report
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
                              Total Shops
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600">
                                {salesman.totalShops}
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
                        {/* Total Row */}
                        <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              TOTAL
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                              {filteredSummaries.reduce((sum, s) => sum + s.collectedChallans, 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              {filteredSummaries.reduce((sum, s) => sum + s.collectedShops, 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                              {filteredSummaries.reduce((sum, s) => sum + s.pendingChallans, 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              {filteredSummaries.reduce((sum, s) => sum + s.pendingShops, 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                              {filteredSummaries.reduce((sum, s) => sum + s.totalChallans, 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600">
                              {filteredSummaries.reduce((sum, s) => sum + s.totalShops, 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-3 mr-2">
                                  <div 
                                    className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                                    style={{ 
                                      width: `${
                                        filteredSummaries.reduce((sum, s) => sum + s.totalChallans, 0) > 0 
                                          ? (filteredSummaries.reduce((sum, s) => sum + s.collectedChallans, 0) / 
                                             filteredSummaries.reduce((sum, s) => sum + s.totalChallans, 0)) * 100 
                                          : 0
                                      }%` 
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm font-bold text-blue-600">
                                  {
                                    filteredSummaries.reduce((sum, s) => sum + s.totalChallans, 0) > 0 
                                      ? Math.round((filteredSummaries.reduce((sum, s) => sum + s.collectedChallans, 0) / 
                                                   filteredSummaries.reduce((sum, s) => sum + s.totalChallans, 0)) * 100)
                                      : 0
                                  }%
                                </span>
                              </div>
                            </td>
                          </tr>
                        </tfoot>
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

              {/* 🆕 FIXED: Daily Report Tab */}
              {activeTab === 'daily-report' && (
                <>
                  {/* Date Selection for Daily Report */}
                  <div className="mb-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-purple-800">Physical Handover Report</h3>
                            <p className="text-sm text-purple-600">Select scanning date to generate report</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                          <label className="text-sm font-medium text-purple-700">Scanning Date:</label>
                          <input
                            type="date"
                            value={scanningDate}
                            onChange={(e) => setScanningDate(e.target.value)}
                            className="border border-purple-300 rounded-lg px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                          />
                          
                          <button
                            onClick={fetchDailyScanningData}
                            disabled={!scanningDate || loadingDailyReport}
                            className={`px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium ${
                              !scanningDate || loadingDailyReport
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                          >
                            {loadingDailyReport ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Search className="w-4 h-4" />
                            )}
                            <span>{loadingDailyReport ? 'Loading...' : 'Generate Report'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Daily Report Content */}
                  {loadingDailyReport && (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Daily Report</h3>
                        <p className="text-gray-600">Processing challans for {formatDateForDisplay(scanningDate)}...</p>
                      </div>
                    </div>
                  )}

                  {dailyReport && !loadingDailyReport && (
                    <div className="space-y-6">
                      {/* Report Header */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="text-center mb-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-2">
                            PHYSICAL CHALLANS SENT TO RADICO KHAITAN
                          </h2>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            ON {dailyReport.formattedScanningDate}
                          </h3>
                          
                          <div className="text-left max-w-2xl mx-auto bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700 mb-2"><strong>Dear Sir,</strong></p>
                            <p className="text-gray-700">
                              Please see below details of Physical challans collected and handed over to you on {' '}
                              <span className="font-semibold text-purple-700">{dailyReport.formattedScanningDate}</span>.
                            </p>
                          </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div className="bg-purple-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">{dailyReport.grandTotal}</div>
                            <div className="text-sm text-gray-600">Total Challans</div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{Object.keys(dailyReport.departments).length}</div>
                            <div className="text-sm text-gray-600">Departments</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">{dailyReport.totalSalesmen}</div>
                            <div className="text-sm text-gray-600">Salesmen</div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">{dailyReport.formattedScanningDate}</div>
                            <div className="text-sm text-gray-600">Scanning Date</div>
                          </div>
                        </div>

                        {/* 🆕 NEW: Missing Challan Data Reconciliation Section */}
                        {dailyReconciliation && (
                          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Search className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-medium text-blue-900">Data Reconciliation</h3>
                                  <p className="text-sm text-blue-700">Internal tracking - scanned vs available data</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">
                                  {dailyReconciliation.foundInSheet1}/{dailyReconciliation.totalScannedOnDate}
                                </div>
                                <div className="text-xs text-blue-600">Found/Scanned</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div className="bg-blue-100 rounded-lg p-3 text-center">
                                <div className="text-xl font-bold text-blue-700">{dailyReconciliation.totalScannedOnDate}</div>
                                <div className="text-sm text-blue-600">Total Scanned</div>
                                <div className="text-xs text-blue-500">On {formatDateForDisplay(scanningDate)}</div>
                              </div>
                              
                              <div className="bg-green-100 rounded-lg p-3 text-center">
                                <div className="text-xl font-bold text-green-700">{dailyReconciliation.foundInSheet1}</div>
                                <div className="text-sm text-green-600">Found in Data</div>
                                <div className="text-xs text-green-500">Available in Sheet1</div>
                              </div>
                              
                              <div className={`rounded-lg p-3 text-center ${
                                dailyReconciliation.missingFromSheet1 > 0 
                                  ? 'bg-red-100' 
                                  : 'bg-gray-100'
                              }`}>
                                <div className={`text-xl font-bold ${
                                  dailyReconciliation.missingFromSheet1 > 0 
                                    ? 'text-red-700' 
                                    : 'text-gray-600'
                                }`}>
                                  {dailyReconciliation.missingFromSheet1}
                                </div>
                                <div className={`text-sm ${
                                  dailyReconciliation.missingFromSheet1 > 0 
                                    ? 'text-red-600' 
                                    : 'text-gray-500'
                                }`}>
                                  Missing Data
                                </div>
                                <div className={`text-xs ${
                                  dailyReconciliation.missingFromSheet1 > 0 
                                    ? 'text-red-500' 
                                    : 'text-gray-400'
                                }`}>
                                  {dailyReconciliation.missingFromSheet1 > 0 ? 'Needs investigation' : 'All data complete'}
                                </div>
                              </div>
                            </div>

                            {/* Missing Challans Alert */}
                            {dailyReconciliation.missingFromSheet1 > 0 && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <h4 className="text-sm font-medium text-red-800">Missing Challan Data</h4>
                                    <p className="text-sm text-red-700 mt-1">
                                      {dailyReconciliation.missingFromSheet1} challan(s) were scanned on {formatDateForDisplay(scanningDate)} but have no corresponding data in Sheet1.
                                    </p>
                                    <div className="mt-3 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                                      <details className="flex-1">
                                        <summary className="text-sm font-medium text-red-800 cursor-pointer hover:text-red-900">
                                          View Missing Challan Numbers ({dailyReconciliation.missingChallans.length})
                                        </summary>
                                        <div className="mt-2 p-3 bg-white rounded border max-h-32 overflow-y-auto">
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {dailyReconciliation.missingChallans.map(challan => (
                                              <div key={challan} className="text-xs font-mono bg-red-100 px-2 py-1 rounded">
                                                {challan}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </details>
                                      
                                      <button
                                        onClick={exportMissingChallansCSV}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2 text-sm whitespace-nowrap"
                                      >
                                        <Download className="w-4 h-4" />
                                        <span>Export Missing Data CSV</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* All Complete Message */}
                            {dailyReconciliation.missingFromSheet1 === 0 && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center space-x-3">
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                  <div>
                                    <h4 className="text-sm font-medium text-green-800">Data Complete</h4>
                                    <p className="text-sm text-green-700">
                                      All {dailyReconciliation.totalScannedOnDate} scanned challans have corresponding data in Sheet1.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Export Buttons */}
                        <div className="text-center">
                          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                            <button
                              onClick={generateDailyScanningPDF}
                              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center space-x-2 justify-center"
                            >
                              <Download className="w-5 h-5" />
                              <span>Export PDF Report</span>
                            </button>
                            
                            <button
                              onClick={exportDailyScanningCSV}
                              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center space-x-2 justify-center"
                            >
                              <Download className="w-5 h-5" />
                              <span>Export CSV Data</span>
                            </button>
                          </div>
                          
                          <p className="text-sm text-gray-500 mt-3">
                            PDF: Formal handover document | CSV: Detailed data with weekly summary
                          </p>
                        </div>
                      </div>

                      {/* Department-wise Breakdown */}
                      <div className="space-y-4">
                        {Object.keys(dailyReport.departments)
                          .sort() // Sort departments alphabetically
                          .map(deptName => {
                            const deptData = dailyReport.departments[deptName];
                            const isExpanded = expandedDepartments.has(deptName);
                            
                            return (
                              <div key={deptName} className="bg-white border border-gray-200 rounded-lg">
                                <div 
                                  className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                                  onClick={() => toggleDepartmentExpansion(deptName)}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                      <Building className="w-5 h-5 text-purple-600" />
                                      <div>
                                        <h3 className="text-lg font-medium text-gray-900">{deptName}</h3>
                                        <p className="text-sm text-gray-500">
                                          {deptData.total} challans • {deptData.salesmen.length} salesmen
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <div className="text-right">
                                        <div className="text-xl font-bold text-purple-600">{deptData.total}</div>
                                        <div className="text-xs text-gray-500">Challans</div>
                                      </div>
                                      {isExpanded ? 
                                        <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                      }
                                    </div>
                                  </div>
                                </div>

                                {/* Expanded Department Details */}
                                {isExpanded && (
                                  <div className="px-6 py-4">
                                    {/* Desktop Table */}
                                    <div className="hidden md:block">
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                          <thead className="bg-gray-50">
                                            <tr>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Salesman
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Challan No
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Challan Date
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Shop Name
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Scanning Date
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white divide-y divide-gray-200">
                                            {deptData.challans.map((challan, index) => (
                                              <tr key={challan.challanNo} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                  {challan.salesman}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                                                  {challan.challanNo}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                  {formatDate(challan.challanDate)}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-900">
                                                  {challan.shopName}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                                                  {formatDate(challan.scanningDate || '')}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="block md:hidden space-y-3">
                                      {deptData.challans.map(challan => (
                                        <div key={challan.challanNo} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                          <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-purple-600">{challan.challanNo}</div>
                                            <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                              Scanned
                                            </div>
                                          </div>
                                          
                                          <div className="text-sm text-gray-600 space-y-1">
                                            <div><span className="font-medium">Salesman:</span> {challan.salesman}</div>
                                            <div><span className="font-medium">Challan Date:</span> {formatDate(challan.challanDate)}</div>
                                            <div><span className="font-medium">Shop:</span> {challan.shopName}</div>
                                            <div><span className="font-medium">Scanning Date:</span> {formatDate(challan.scanningDate || '')}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Department Total */}
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <div className="flex justify-between items-center">
                                        <span className="text-lg font-medium text-gray-900">
                                          Total {deptName}:
                                        </span>
                                        <span className="text-xl font-bold text-purple-600">
                                          {deptData.total} challans
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>

                      {/* Grand Total */}
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
                        <div className="text-center">
                          <h3 className="text-2xl font-bold mb-2">GRAND TOTAL</h3>
                          <div className="text-4xl font-bold mb-2">{dailyReport.grandTotal}</div>
                          <div className="text-lg">Total Challans Handed Over</div>
                          <div className="text-sm opacity-90 mt-2">
                            Generated on: {new Date().toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Data State */}
                  {!dailyReport && !loadingDailyReport && scanningDate && (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 rounded-lg p-8 max-w-md mx-auto">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
                        <p className="text-gray-600 mb-4">
                          No challans were scanned on {formatDateForDisplay(scanningDate)}.
                        </p>
                        <p className="text-sm text-gray-500">
                          Please verify the scanning date or check if the data is available in the Google Sheet.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  {!scanningDate && !dailyReport && (
                    <div className="text-center py-12">
                      <div className="bg-purple-50 rounded-lg p-8 max-w-lg mx-auto">
                        <Calendar className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-purple-800 mb-2">Generate Physical Handover Report</h3>
                        <p className="text-purple-700 mb-4">
                          Select a scanning date above to generate a detailed report of all challans physically handed over to Radico Khaitan on that date.
                        </p>
                        <div className="text-sm text-purple-600 space-y-1">
                          <p>• Report includes department-wise breakdown</p>
                          <p>• Shows salesman details and challan information</p>
                          <p>• Can be exported as professional PDF</p>
                          <p>• Includes formal greeting for business correspondence</p>
                        </div>
                      </div>
                    </div>
                  )}
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
