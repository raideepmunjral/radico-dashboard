'use client';

import React, { useState } from 'react';
import { Search, X, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle, Truck } from 'lucide-react';

// ==========================================
// INVENTORY DATA TYPES (copied from main file)
// ==========================================

interface InventoryItem {
  brand: string;
  quantity: number;
  isInStock: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
  isNeverOrdered: boolean;
  isDiscontinued: boolean;
  reasonNoStock: string;
  ageInDays: number;
  ageCategory: 'lessThan30Days' | 'days30to45' | 'days45to60' | 'days60to75' | 'days75to90' | 'over90Days';
  lastSupplyDate?: Date;
  isEstimatedAge: boolean;
  suppliedAfterOutOfStock?: boolean;
  daysSinceLastSupply?: number;
  daysOutOfStock?: number;
  supplyDateAfterVisit?: Date;
  currentDaysOutOfStock?: number;
  supplyStatus: 'current' | 'aging_30_45' | 'aging_45_60' | 'aging_60_75' | 'aging_75_90' | 'aging_critical' | 'recently_restocked' | 'awaiting_supply' | 'unknown';
}

interface ShopInventory {
  shopId: string;
  shopName: string;
  department: string;
  salesman: string;
  visitDate: Date | null;
  items: Record<string, any>;
  totalItems: number;
  inStockCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  agingInventoryCount: number;
  lastVisitDays: number | null;
  dataSource: 'master_data' | 'visit_data' | 'master_data_only';
  salesmanUid?: string;
}

interface InventoryData {
  summary: {
    totalShops: number;
    visitedShops: number;
    totalSKUs: number;
    totalOutOfStock: number;
    totalLowStock: number;
    totalAging: number;
    avgAge: number;
    coveragePercent: number;
    recentlyRestockedItems: number;
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
  shops: Record<string, ShopInventory>;
  skuPerformance: Array<any>;
  allAgingLocations: Array<any>;
  outOfStockItems: Array<any>;
  visitCompliance: any;
  // Add supply data for actual case quantities
  rawSupplyData?: {
    recentSupplies: Record<string, Date>;
    supplyHistory: Record<string, Date>;
    pendingChallansData: any[][];
  };
}

interface ShopInventoryFilters {
  department: string;
  salesman: string;
  stockStatus: string;
  ageCategory: string;
  brand: string;
  supplyStatus: string;
  searchText: string;
}

// ==========================================
// INDEPENDENT SHOP INVENTORY TAB COMPONENT
// ==========================================

const ShopInventoryTab = ({ data }: { data: InventoryData }) => {
  // ==========================================
  // OWN STATE MANAGEMENT
  // ==========================================
  const [filters, setFilters] = useState<ShopInventoryFilters>({
    department: '',
    salesman: '',
    stockStatus: '',
    ageCategory: '',
    brand: '',
    supplyStatus: '',
    searchText: ''
  });
  
  const [expandedShop, setExpandedShop] = useState<string | null>(null);

  // ==========================================
  // BOTTLE SIZE CONVERSION LOGIC (copied from SupplyStockMismatchTab.tsx)
  // ==========================================
  const getBottleSizeInfo = (skuName: string): { size: string; conversionRate: number; expectedDailyConsumption: number } => {
    const sku = skuName.toUpperCase();
    
    // Extract size from SKU name
    if (sku.includes('750') || sku.includes('750ML')) {
      return { size: '750ml', conversionRate: 12, expectedDailyConsumption: 2 };
    } else if (sku.includes('375') || sku.includes('375ML')) {
      return { size: '375ml', conversionRate: 24, expectedDailyConsumption: 4 };
    } else if (sku.includes('180') || sku.includes('180ML') || sku.includes('180P')) {
      return { size: '180ml', conversionRate: 48, expectedDailyConsumption: 8 };
    } else if (sku.includes('90') || sku.includes('90ML') || sku.includes('90P')) {
      return { size: '90ml', conversionRate: 96, expectedDailyConsumption: 15 };
    } else if (sku.includes('60') || sku.includes('60ML') || sku.includes('60P')) {
      return { size: '60ml', conversionRate: 150, expectedDailyConsumption: 25 };
    }
    
    // Default to 750ml if size cannot be determined
    return { size: '750ml', conversionRate: 12, expectedDailyConsumption: 2 };
  };

  // ==========================================
  // ENHANCED ACTUAL SUPPLY DATA FUNCTIONS (copied from SupplyStockMismatchTab.tsx)
  // ==========================================
  const createMultipleBrandKeys = (shopId: string, brandName: string, size?: string): string[] => {
    const brandInfo = getBottleSizeInfo(brandName);
    const actualSize = size || brandInfo.size.replace('ml', '');
    
    const keys = [
      `${shopId}_${brandName.toUpperCase()}_${actualSize}`,
      `${shopId}_${brandName.toUpperCase()}`,
      `${shopId}_${brandName}`,
    ];
    
    return [...new Set(keys)];
  };

  // 🔧 ENHANCED CASE QUANTITY READING WITH SIZE-SPECIFIC MATCHING AND ERROR HANDLING
  const getActualSupplyData = (shopId: string, brandName: string, lastSupplyDate: Date): number => {
    try {
      // Try to get actual supply data from pending challans
      if (data.rawSupplyData?.pendingChallansData) {
        const pendingChallans = data.rawSupplyData.pendingChallansData;
        
        if (pendingChallans.length > 1) {
          const headers = pendingChallans[0];
          const rows = pendingChallans.slice(1);
          
          // 🔧 FIXED COLUMN INDICES - Based on your sheet structure
          const challansDateIndex = 1;  // Column B
          const shopIdIndex = 8;         // Column I  
          const brandIndex = 11;         // Column L
          const sizeIndex = 12;          // Column M
          const casesIndex = 14;         // Column O
          
          // 🆕 NEW: Extract size from visit brand name for better matching
          const visitBottleInfo = getBottleSizeInfo(brandName);
          const visitSizeNumber = visitBottleInfo.size.replace('ml', ''); // "180", "375", etc.
          
          // 🆕 NEW: Collect ALL potential matches first, then find best match
          const potentialMatches = [];
          
          // Find matching supply record
          for (let i = 0; i < rows.length; i++) {
            try {
              const row = rows[i];
              
              if (row && row.length > Math.max(shopIdIndex, brandIndex, casesIndex)) {
                const rowShopId = row[shopIdIndex]?.toString().trim();
                const rowBrand = row[brandIndex]?.toString().trim();
                const rowSize = row[sizeIndex]?.toString().trim() || '';
                const rowDateStr = row[challansDateIndex]?.toString().trim();
                
                // Check if this row matches our target shop
                if (rowShopId === shopId) {
                  // 🔧 ENHANCED CASE PARSING
                  const rawCaseValue = row[casesIndex];
                  let rowCases = 1; // Default fallback
                  
                  if (rawCaseValue !== undefined && rawCaseValue !== null) {
                    const caseString = String(rawCaseValue).trim();
                    
                    if (caseString !== '' && caseString !== '0') {
                      // Method 1: Try direct Number() conversion
                      const numberValue = Number(caseString);
                      if (!isNaN(numberValue) && numberValue > 0) {
                        rowCases = Math.round(numberValue);
                      } else {
                        // Method 2: Try parseInt
                        const intValue = parseInt(caseString);
                        if (!isNaN(intValue) && intValue > 0) {
                          rowCases = intValue;
                        } else {
                          // Method 3: Try parseFloat
                          const floatValue = parseFloat(caseString);
                          if (!isNaN(floatValue) && floatValue > 0) {
                            rowCases = Math.round(floatValue);
                          } else {
                            // Method 4: Try regex to extract numbers
                            const regexMatch = caseString.match(/\d+/);
                            if (regexMatch) {
                              const extractedNumber = parseInt(regexMatch[0]);
                              if (!isNaN(extractedNumber) && extractedNumber > 0) {
                                rowCases = extractedNumber;
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                  
                  if (rowBrand && rowCases > 0) {
                    // 🔧 ENHANCED BRAND MATCHING WITH SIZE CHECKING
                    const rowBrandUpper = rowBrand.toUpperCase();
                    const brandNameUpper = brandName.toUpperCase();
                    
                    let brandMatch = false;
                    let matchStrength = 0; // 🆕 NEW: Match strength scoring
                    
                    // Special matching for 8 PM products
                    if (rowBrandUpper.includes('8 PM') && brandNameUpper.includes('8 PM')) {
                      if (rowBrandUpper.includes('BLACK') && brandNameUpper.includes('BLACK')) {
                        brandMatch = true; 
                        matchStrength = 2; // 8 PM BLACK variants match
                      }
                    }
                    
                    // Special matching for VERVE products  
                    else if (rowBrandUpper.includes('VERVE') && brandNameUpper.includes('VERVE')) {
                      if (rowBrandUpper.includes('LEMON') && brandNameUpper.includes('LEMON')) {
                        brandMatch = true; 
                        matchStrength = 2; // VERVE LEMON variants match
                      } else if (rowBrandUpper.includes('CRANBERRY') && brandNameUpper.includes('CRANBERRY')) {
                        brandMatch = true; 
                        matchStrength = 2; // VERVE CRANBERRY variants match
                      } else if (rowBrandUpper.includes('GREEN') && brandNameUpper.includes('GREEN')) {
                        brandMatch = true; 
                        matchStrength = 2; // VERVE GREEN APPLE variants match
                      } else if (rowBrandUpper.includes('GRAIN') && brandNameUpper.includes('GRAIN')) {
                        brandMatch = true; 
                        matchStrength = 2; // VERVE GRAIN variants match
                      }
                    }
                    
                    // Fallback: Basic word matching
                    else {
                      const brandWords = brandNameUpper.split(' ');
                      const rowWords = rowBrandUpper.split(' ');
                      const commonWords = brandWords.filter(word => rowWords.includes(word));
                      if (commonWords.length >= 2) {
                        brandMatch = true; 
                        matchStrength = 1; // At least 2 words match
                      }
                    }
                    
                    // 🆕 NEW: SIZE MATCHING BOOST - Critical for fixing your issue!
                    if (brandMatch && rowSize) {
                      const supplySizeNumber = rowSize.replace(/[^0-9]/g, ''); // Extract just numbers
                      if (supplySizeNumber === visitSizeNumber) {
                        matchStrength += 10; // 🎯 MAJOR BOOST for exact size match!
                      }
                    }
                    
                    if (brandMatch) {
                      // 🔧 ENHANCED DATE PARSING AND MATCHING
                      if (rowDateStr) {
                        let rowDate = null;
                        
                        // Try multiple date parsing methods
                        const dateFormats = [
                          () => new Date(rowDateStr), // Default parsing
                          () => {
                            // Handle DD-MM-YYYY format: "12-07-2025"
                            const parts = rowDateStr.split('-');
                            if (parts.length === 3) {
                              const day = parseInt(parts[0]);
                              const month = parseInt(parts[1]) - 1; // JS months are 0-based
                              const year = parseInt(parts[2]);
                              return new Date(year, month, day);
                            }
                            return null;
                          },
                          () => {
                            // Handle MM-DD-YYYY format: "07-12-2025"
                            const parts = rowDateStr.split('-');
                            if (parts.length === 3) {
                              const month = parseInt(parts[0]) - 1; // JS months are 0-based
                              const day = parseInt(parts[1]);
                              const year = parseInt(parts[2]);
                              return new Date(year, month, day);
                            }
                            return null;
                          }
                        ];
                        
                        // Try each date format until one works
                        for (const parseMethod of dateFormats) {
                          try {
                            const testDate = parseMethod();
                            if (testDate && !isNaN(testDate.getTime())) {
                              rowDate = testDate;
                              break;
                            }
                          } catch (e) {
                            continue;
                          }
                        }
                        
                        if (rowDate && !isNaN(rowDate.getTime())) {
                          const daysDiff = Math.abs(rowDate.getTime() - lastSupplyDate.getTime()) / (1000 * 60 * 60 * 24);
                          
                          if (daysDiff <= 2) { // Within 2 days
                            // 🆕 NEW: Store as potential match instead of returning immediately
                            potentialMatches.push({
                              rowIndex: i,
                              cases: rowCases,
                              brand: rowBrand,
                              size: rowSize,
                              date: rowDate,
                              daysDiff,
                              matchStrength,
                              supplySizeNumber,
                              visitSizeNumber
                            });
                          }
                        }
                      }
                    }
                  }
                }
              }
            } catch (rowError) {
              // Skip problematic rows and continue processing
              continue;
            }
          }
          
          // 🆕 NEW: Find the BEST match based on match strength (size + brand + date)
          if (potentialMatches.length > 0) {
            try {
              // Sort by match strength (highest first), then by smallest date difference
              potentialMatches.sort((a, b) => {
                if (b.matchStrength !== a.matchStrength) {
                  return b.matchStrength - a.matchStrength; // Higher strength first
                }
                return a.daysDiff - b.daysDiff; // Smaller date diff first
              });
              
              const bestMatch = potentialMatches[0];
              return bestMatch.cases; // 🎯 Return the best match!
            } catch (sortError) {
              // If sorting fails, return first match
              return potentialMatches[0]?.cases || 1;
            }
          }
        }
      }
    } catch (error) {
      // If any error occurs, silently fallback to 1 case
      console.warn('Error in getActualSupplyData:', error);
    }
    
    // Fallback to 1 case if no matching data found or error occurred
    return 1;
  };

  // ==========================================
  // OWN HELPER FUNCTIONS
  // ==========================================
  
  const getDepartments = () => {
    return Array.from(new Set(Object.values(data.shops).map(shop => shop.department))).sort();
  };

  const getSalesmen = () => {
    return Array.from(new Set(Object.values(data.shops).map(shop => shop.salesman))).sort();
  };

  const getFilteredShops = () => {
    return Object.values(data.shops).filter(shop => {
      const matchesDepartment = !filters.department || shop.department === filters.department;
      const matchesSalesman = !filters.salesman || shop.salesman === filters.salesman;
      const matchesSearch = !filters.searchText || 
        shop.shopName.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        shop.salesman.toLowerCase().includes(filters.searchText.toLowerCase());
      
      let matchesStockStatus = true;
      if (filters.stockStatus === 'out-of-stock') {
        matchesStockStatus = shop.outOfStockCount > 0;
      } else if (filters.stockStatus === 'low-stock') {
        matchesStockStatus = shop.lowStockCount > 0;
      } else if (filters.stockStatus === 'aging') {
        matchesStockStatus = shop.agingInventoryCount > 0;
      }
      
      return matchesDepartment && matchesSalesman && matchesSearch && matchesStockStatus;
    });
  };

  const getEnhancedSupplyStatusDisplay = (item: any) => {
    if ((item as any).advancedSupplyStatus) {
      return (item as any).advancedSupplyStatus;
    }
    
    if (item.suppliedAfterOutOfStock && (item as any).daysSinceSupply !== undefined) {
      return `Restocked (${(item as any).daysSinceSupply}d)`;
    } else if (item.supplyStatus === 'awaiting_supply' && (item as any).currentDaysOutOfStock) {
      return `Awaiting Supply (out for ${(item as any).currentDaysOutOfStock} days)`;
    } else {
      return item.supplyStatus?.replace(/_/g, ' ') || 'Unknown';
    }
  };

  // ==========================================
  // SIMPLIFIED AND ROBUST CSV EXPORT WITH BETTER ERROR DETECTION
  // ==========================================
  const exportToCSV = async () => {
    if (!data) {
      alert('No data available for export');
      return;
    }

    try {
      console.log('🔄 Starting CSV export...');
      
      // Step 1: Build header
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `Enhanced ${data.summary.rollingPeriodDays}-Day Rolling Shop Inventory Report with Master Data Integration and Supply Analytics - ` + new Date().toLocaleDateString() + "\n";
      csvContent += `Period: ${data.summary.periodStartDate.toLocaleDateString()} - ${data.summary.periodEndDate.toLocaleDateString()}\n`;
      csvContent += `Master Data Coverage: ${data.summary.masterDataIntegration.assignmentCoverage}% (${data.summary.masterDataIntegration.masterDataAssignments} master assignments, ${data.summary.masterDataIntegration.visitDataFallbacks} visit fallbacks)\n\n`;
      
      console.log('✅ Header created');

      // Step 2: Add column headers
      csvContent += "ENHANCED SHOP INVENTORY ANALYSIS WITH MASTER DATA INTEGRATION AND SUPPLY ANALYTICS\n";
      csvContent += "Shop Name,Shop ID,Department,Salesman,Visit Date,Last Visit Days,Data Source,Brand,Bottle Size,Quantity,Stock Status,Age Days,Age Estimated,Last Supply Date,Supply Source,Supply Status,Cases Delivered,Bottles Delivered,Expected Daily Consumption,Reason No Stock,Advanced Supply Status,Days Since Supply,Days Out of Stock,Recently Restocked\n";
      
      console.log('✅ Column headers added');

      // Step 3: Pre-calculate supply data for all items to avoid doing it during CSV generation
      console.log('🔄 Pre-calculating supply data...');
      const supplyDataCache = new Map();
      
      let itemCount = 0;
      let processedItems = 0;
      let errorItems = 0;

      // Count total items first
      Object.values(data.shops).forEach(shop => {
        itemCount += Object.values(shop.items).length;
      });
      
      console.log(`📊 Processing ${itemCount} inventory items across ${Object.keys(data.shops).length} shops`);

      // Step 4: Process each shop and item with detailed progress tracking
      Object.values(data.shops).forEach((shop, shopIndex) => {
        try {
          Object.values(shop.items).forEach((item: any, itemIndex) => {
            try {
              processedItems++;
              
              // Basic item data (no complex processing)
              const stockStatus = item.isInStock ? 'In Stock' : 
                                 item.isOutOfStock ? 'Out of Stock' : 
                                 item.isLowStock ? 'Low Stock' : 'Unknown';
              
              const lastSupplyStr = item.lastSupplyDate ? 
                item.lastSupplyDate.toLocaleDateString('en-GB') : 'No Supply Data';
              
              const supplySource = item.agingDataSource === 'recent_supply' ? 'Recent Supply' :
                                 item.agingDataSource === 'historical_supply' ? 'Historical Supply' :
                                 'No Supply Data';
              
              const advancedStatus = item.advancedSupplyStatus || 
                                   item.supplyStatus?.replace(/_/g, ' ') || 'Unknown';
              
              const visitDateStr = shop.visitDate ? shop.visitDate.toLocaleDateString('en-GB') : 'No Recent Visit';
              
              // 🔧 ENHANCED SUPPLY DATA READING WITH DEBUGGING FOR GOPAL HEIGHTS
              let bottleSize = '750ml';
              let casesDelivered = '1';
              let bottlesDelivered = '12';
              let expectedDailyConsumption = '2';
              
              try {
                // Step 1: Determine bottle size and conversion rate from brand name
                const brandUpper = (item.brand || '').toUpperCase();
                let conversionRate = 12; // Default for 750ml
                
                if (brandUpper.includes('180')) {
                  bottleSize = '180ml';
                  conversionRate = 48;
                  expectedDailyConsumption = '8';
                } else if (brandUpper.includes('375')) {
                  bottleSize = '375ml';
                  conversionRate = 24;
                  expectedDailyConsumption = '4';
                } else if (brandUpper.includes('750')) {
                  bottleSize = '750ml';
                  conversionRate = 12;
                  expectedDailyConsumption = '2';
                } else if (brandUpper.includes('90')) {
                  bottleSize = '90ml';
                  conversionRate = 96;
                  expectedDailyConsumption = '15';
                } else if (brandUpper.includes('60')) {
                  bottleSize = '60ml';
                  conversionRate = 150;
                  expectedDailyConsumption = '25';
                }

                // Step 2: Try to read actual supply data - SIMPLIFIED AND ROBUST
                let actualCases = 2; // Default fallback
                const isGopalHeights = shop.shopId === '01/2024/0193';
                
                if (item.lastSupplyDate && data.rawSupplyData?.pendingChallansData) {
                  try {
                    const pendingChallans = data.rawSupplyData.pendingChallansData;
                    
                    if (Array.isArray(pendingChallans) && pendingChallans.length > 1) {
                      const rows = pendingChallans.slice(1);
                      let matchesFound = [];
                      
                      // Debug logging for GOPAL HEIGHTS only
                      if (isGopalHeights && brandUpper.includes('VERVE')) {
                        console.log(`🔍 DEBUGGING GOPAL HEIGHTS: ${item.brand} (${bottleSize})`);
                        console.log(`  Looking for: Shop="${shop.shopId}", Brand contains="VERVE", Size="${visitSizeNumber}"`);
                      }
                      
                      // Search through supply data - SAFE ITERATION
                      for (let i = 0; i < Math.min(rows.length, 1000); i++) {
                        const row = rows[i];
                        
                        if (!Array.isArray(row) || row.length <= 14) continue;
                        
                        const rowShopId = String(row[8] || '').trim();
                        const rowBrand = String(row[11] || '').trim().toUpperCase();
                        const rowSize = String(row[12] || '').trim();
                        const rowCases = row[14];
                        const rowDate = String(row[0] || '').trim();
                        
                        // Only process rows for our target shop
                        if (rowShopId !== shop.shopId) continue;
                        
                        // Debug: Log every GOPAL HEIGHTS row for VERVE products
                        if (isGopalHeights && rowBrand.includes('VERVE')) {
                          console.log(`  📋 Supply Row ${i}: Date="${rowDate}", Brand="${rowBrand}", Size="${rowSize}", Cases="${rowCases}"`);
                        }
                        
                        // Check if brand matches
                        let brandMatches = false;
                        
                        if (rowBrand.includes('VERVE') && brandUpper.includes('VERVE')) {
                          if ((rowBrand.includes('CRANBERRY') && brandUpper.includes('CRANBERRY')) ||
                              (rowBrand.includes('LEMON') && brandUpper.includes('LEMON')) ||
                              (rowBrand.includes('GREEN') && brandUpper.includes('GREEN')) ||
                              (rowBrand.includes('GRAIN') && brandUpper.includes('GRAIN'))) {
                            brandMatches = true;
                            if (isGopalHeights) console.log(`    ✅ VERVE variant match found!`);
                          }
                        } else if (rowBrand.includes('8 PM') && brandUpper.includes('8 PM')) {
                          if (rowBrand.includes('BLACK') && brandUpper.includes('BLACK')) {
                            brandMatches = true;
                            if (isGopalHeights) console.log(`    ✅ 8 PM BLACK match found!`);
                          }
                        }
                        
                        if (!brandMatches) continue;
                        
                        // Check if size matches
                        const supplySizeNumber = rowSize.replace(/[^0-9]/g, '');
                        const visitSizeNumber = bottleSize.replace(/[^0-9]/g, '');
                        
                        let sizeMatches = false;
                        if (supplySizeNumber && visitSizeNumber && supplySizeNumber === visitSizeNumber) {
                          sizeMatches = true;
                        } else if (!supplySizeNumber) {
                          sizeMatches = true; // No size specified in supply
                        }
                        
                        if (!sizeMatches) continue;
                        
                        if (isGopalHeights) {
                          console.log(`    🎯 Size match: Supply="${rowSize}" (${supplySizeNumber}) vs Visit="${bottleSize}" (${visitSizeNumber})`);
                        }
                        
                        // Parse cases safely
                        let parsedCases = 1;
                        if (rowCases !== undefined && rowCases !== null) {
                          const caseNum = parseFloat(String(rowCases).trim());
                          if (!isNaN(caseNum) && caseNum > 0 && caseNum < 100) {
                            parsedCases = Math.round(caseNum);
                          }
                        }
                        
                        // Parse date safely
                        let parsedDate = null;
                        if (rowDate) {
                          const parts = rowDate.split('-');
                          if (parts.length === 3) {
                            const day = parseInt(parts[0]);
                            const month = parseInt(parts[1]) - 1;
                            const year = parseInt(parts[2]);
                            parsedDate = new Date(year, month, day);
                            if (isNaN(parsedDate.getTime())) {
                              parsedDate = null;
                            }
                          }
                        }
                        
                        matchesFound.push({
                          cases: parsedCases,
                          date: parsedDate,
                          dateString: rowDate,
                          brand: rowBrand,
                          size: rowSize
                        });
                        
                        if (isGopalHeights) {
                          console.log(`    ✅ Found match: Cases=${parsedCases}, Date=${rowDate}, ParsedDate=${parsedDate ? parsedDate.toLocaleDateString() : 'INVALID'}`);
                        }
                      }
                      
                      // Find the most recent match
                      if (matchesFound.length > 0) {
                        // Sort by date (most recent first)
                        matchesFound.sort((a, b) => {
                          if (!a.date && !b.date) return 0;
                          if (!a.date) return 1;
                          if (!b.date) return -1;
                          return b.date.getTime() - a.date.getTime();
                        });
                        
                        const mostRecentMatch = matchesFound[0];
                        actualCases = mostRecentMatch.cases;
                        
                        if (isGopalHeights) {
                          console.log(`  ✅ MOST RECENT MATCH: ${mostRecentMatch.cases} cases on ${mostRecentMatch.dateString} for ${item.brand}`);
                          console.log(`  All matches found (${matchesFound.length}):`, 
                            matchesFound.map(m => `${m.cases} cases on ${m.dateString}`));
                        }
                      } else if (isGopalHeights) {
                        console.log(`  ❌ NO MATCHES FOUND for ${item.brand}`);
                      }
                    }
                  } catch (supplyDataError) {
                    console.warn('Supply data reading failed for:', shop.shopName, item.brand);
                    actualCases = 2; // Safe fallback
                  }
                }
                
                // Step 3: Set final values
                casesDelivered = actualCases.toString();
                bottlesDelivered = (actualCases * conversionRate).toString();
                
              } catch (overallError) {
                console.warn('Overall supply calculation error for:', shop.shopName, item.brand);
                casesDelivered = '1';
                bottlesDelivered = '12';
                expectedDailyConsumption = '2';
              }
              
              // Escape CSV values safely
              const escapeCSV = (value: any): string => {
                const str = String(value || '');
                return `"${str.replace(/"/g, '""')}"`;
              };
              
              // Build CSV row
              const csvRow = [
                escapeCSV(shop.shopName),
                escapeCSV(shop.shopId),
                escapeCSV(shop.department),
                escapeCSV(shop.salesman),
                escapeCSV(visitDateStr),
                escapeCSV(shop.lastVisitDays || 'N/A'),
                escapeCSV(shop.dataSource),
                escapeCSV(item.brand),
                escapeCSV(bottleSize),
                escapeCSV(item.quantity),
                escapeCSV(stockStatus),
                escapeCSV(item.ageInDays),
                escapeCSV(item.isEstimatedAge ? 'Yes' : 'No'),
                escapeCSV(lastSupplyStr),
                escapeCSV(supplySource),
                escapeCSV(item.supplyStatus?.replace(/_/g, ' ') || 'Unknown'),
                escapeCSV(casesDelivered),
                escapeCSV(bottlesDelivered),
                escapeCSV(expectedDailyConsumption),
                escapeCSV(item.reasonNoStock || 'N/A'),
                escapeCSV(advancedStatus),
                escapeCSV(item.daysSinceSupply || 'N/A'),
                escapeCSV(item.daysOutOfStock || 'N/A'),
                escapeCSV(item.suppliedAfterOutOfStock ? 'Yes' : 'No')
              ].join(',');
              
              csvContent += csvRow + '\n';
              
              // Progress logging for large datasets
              if (processedItems % 100 === 0) {
                console.log(`📊 Processed ${processedItems}/${itemCount} items (${Math.round(processedItems/itemCount*100)}%)`);
              }
              
            } catch (itemError) {
              errorItems++;
              console.warn(`❌ Error processing item ${itemIndex} in shop ${shop.shopName}:`, itemError);
              // Continue processing other items
            }
          });
        } catch (shopError) {
          console.warn(`❌ Error processing shop ${shop.shopName}:`, shopError);
          // Continue processing other shops
        }
      });

      console.log(`✅ Processing complete: ${processedItems} items processed, ${errorItems} errors`);

      // Step 5: Create and download file
      console.log('🔄 Creating download link...');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Enhanced_Master_Integrated_Shop_Inventory_with_Supply_Analytics_${data.summary.rollingPeriodDays}Day_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      console.log('✅ CSV export completed successfully!');
      console.log(`📊 Final stats: ${processedItems} items, ${errorItems} errors, ${Object.keys(data.shops).length} shops`);
      
    } catch (error) {
      console.error('❌ Critical error in CSV export:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // More specific error message
      let errorMessage = 'CSV export failed. ';
      if (error.message.includes('memory')) {
        errorMessage += 'This might be due to large dataset size. Please try with smaller filters.';
      } else if (error.message.includes('network')) {
        errorMessage += 'Network issue detected. Please check your connection.';
      } else {
        errorMessage += `Technical error: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  // ==========================================
  // GET FILTERED DATA
  // ==========================================
  
  const filteredShops = getFilteredShops();
  const departments = getDepartments();
  const salesmen = getSalesmen();

  // ==========================================
  // RENDER COMPONENT
  // ==========================================
  
  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search shops, salesmen..."
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 w-64"
            />
          </div>
          
          {/* 🆕 NEW: Enhanced CSV Export Button */}
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            title="Export enhanced shop inventory with cases/bottles data"
          >
            <span>📊 Export Enhanced CSV</span>
          </button>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Departments</option>
            {departments.map((dept: string) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filters.salesman}
            onChange={(e) => setFilters({ ...filters, salesman: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Salesmen</option>
            {salesmen.map((salesman: string) => (
              <option key={salesman} value={salesman}>{salesman}</option>
            ))}
          </select>

          <select
            value={filters.stockStatus}
            onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Stock Status</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="aging">Aging Inventory</option>
          </select>

          <button
            onClick={() => setFilters({ 
              department: '', 
              salesman: '', 
              stockStatus: '', 
              ageCategory: '', 
              brand: '', 
              supplyStatus: '', 
              searchText: '' 
            })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Shop Inventory List with Master Data Integration */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Master-Integrated Shop Inventory Status</h3>
          <p className="text-sm text-gray-500">Showing {filteredShops.length} shops with master data integration ({data.summary.rollingPeriodDays}-day rolling period)</p>
          <p className="text-xs text-blue-600 mt-1">✨ Enhanced CSV export now includes Cases Delivered, Bottles Delivered, and Expected Daily Consumption for supply analytics</p>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredShops.map((shop: ShopInventory) => (
            <div key={shop.shopId} className="p-6">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedShop(expandedShop === shop.shopId ? null : shop.shopId)}
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{shop.shopName}</h4>
                    <p className="text-sm text-gray-500">{shop.department} • {shop.salesman} • ID: {shop.shopId}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        shop.dataSource === 'master_data' ? 'bg-green-100 text-green-800' :
                        shop.dataSource === 'master_data_only' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {shop.dataSource === 'master_data' ? '✅ Master Data' :
                         shop.dataSource === 'master_data_only' ? '📋 Master Only' :
                         '📝 Visit Data'}
                      </span>
                      {shop.visitDate ? (
                        <p className="text-xs text-blue-600">Visit: {shop.visitDate.toLocaleDateString('en-GB')} ({shop.lastVisitDays} days ago)</p>
                      ) : (
                        <p className="text-xs text-orange-600">No recent visit</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-600">{shop.inStockCount}</div>
                      <div className="text-xs text-gray-500">In Stock</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-red-600">{shop.outOfStockCount}</div>
                      <div className="text-xs text-gray-500">Out of Stock</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-yellow-600">{shop.agingInventoryCount}</div>
                      <div className="text-xs text-gray-500">Aging (30+)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-blue-600">
                        {Object.values(shop.items).filter(item => item.suppliedAfterOutOfStock).length}
                      </div>
                      <div className="text-xs text-gray-500">Restocked</div>
                    </div>
                  </div>
                </div>
                {expandedShop === shop.shopId ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
              
              {expandedShop === shop.shopId && (
                <div className="mt-4 border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.values(shop.items).map((item: InventoryItem) => {
                      // 🆕 NEW: Calculate supply analytics for each item
                      const bottleInfo = getBottleSizeInfo(item.brand);
                      let casesDelivered = 'N/A';
                      let bottlesDelivered = 'N/A';
                      
                      if (item.lastSupplyDate) {
                        const cases = getActualSupplyData(shop.shopId, item.brand, item.lastSupplyDate);
                        casesDelivered = cases.toString();
                        bottlesDelivered = (cases * bottleInfo.conversionRate).toString();
                      }
                      
                      return (
                        <div key={item.brand} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-gray-900 truncate">{item.brand}</h5>
                            <div className="flex items-center space-x-1">
                              {item.isInStock ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : item.isOutOfStock ? (
                                <XCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                              )}
                              {item.suppliedAfterOutOfStock && (
                                <div className="relative group">
                                  <Truck className="w-4 h-4 text-blue-500" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Recently Restocked
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                            <div className="text-sm text-gray-600">Size: {bottleInfo.size}</div>
                            <div className="text-sm text-gray-600">
                              Age: {item.ageInDays} days {item.isEstimatedAge && '(est.)'}
                            </div>
                            {item.lastSupplyDate && (
                              <div className="text-xs text-blue-600">
                                Last Supply: {item.lastSupplyDate.toLocaleDateString('en-GB')}
                              </div>
                            )}
                            {/* 🆕 NEW: Show supply analytics */}
                            {casesDelivered !== 'N/A' && (
                              <div className="text-xs text-green-600">
                                📦 {casesDelivered} cases = {bottlesDelivered} bottles delivered
                              </div>
                            )}
                            <div className="text-xs text-purple-600">
                              Expected consumption: {bottleInfo.expectedDailyConsumption} bottles/day
                            </div>
                            {(item as any).agingDataSource && (
                              <div className="text-xs text-purple-600">
                                Source: {(item as any).agingDataSource}
                              </div>
                            )}
                            {item.reasonNoStock && (
                              <div className="text-xs text-red-600">{item.reasonNoStock}</div>
                            )}
                            <div className="text-xs">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.supplyStatus === 'current' ? 'bg-green-100 text-green-800' :
                                item.suppliedAfterOutOfStock ? 'bg-blue-100 text-blue-800' :
                                item.supplyStatus === 'awaiting_supply' ? 'bg-red-100 text-red-800' :
                                item.supplyStatus?.startsWith('aging') ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {getEnhancedSupplyStatusDisplay(item)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopInventoryTab;
