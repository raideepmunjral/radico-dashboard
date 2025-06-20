// ==========================================
// UNIFIED BRAND NORMALIZATION SERVICE
// Single source of truth for all brand mapping across all systems
// ==========================================

export interface BrandInfo {
  family: string;           // "8PM" or "VERVE"
  variant: string;          // "PREMIUM_BLACK_BLENDED_WHISKY" or "GREEN_APPLE"
  size: string;             // "375", "750", "180", etc.
  packaging: string;        // "GLASS" or "PET"
  flavor: string;           // "N/A" for 8PM, "GREEN_APPLE", "CRANBERRY", etc. for VERVE
  normalizedKey: string;    // Final unique identifier
  displayName: string;      // Human readable name
  fullSupplyName: string;   // Exact name as it appears in supply sheets
}

// ==========================================
// MASTER BRAND MAPPING TABLE
// ==========================================

const BRAND_MAPPING: { [key: string]: BrandInfo } = {
  // 8PM WHISKY FAMILY - GLASS BOTTLES
  '8 PM BLACK': { 
    family: '8PM', variant: 'PREMIUM_BLACK_BLENDED_WHISKY', size: '750', packaging: 'GLASS', flavor: 'N/A',
    normalizedKey: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_750', displayName: '8PM Black 750ML',
    fullSupplyName: '8 PM PREMIUM BLACK BLENDED WHISKY'
  },
  '8 PM BLACK 750': { 
    family: '8PM', variant: 'PREMIUM_BLACK_BLENDED_WHISKY', size: '750', packaging: 'GLASS', flavor: 'N/A',
    normalizedKey: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_750', displayName: '8PM Black 750ML',
    fullSupplyName: '8 PM PREMIUM BLACK BLENDED WHISKY'
  },
  '8 PM BLACK 375': { 
    family: '8PM', variant: 'PREMIUM_BLACK_BLENDED_WHISKY', size: '375', packaging: 'GLASS', flavor: 'N/A',
    normalizedKey: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_375', displayName: '8PM Black 375ML',
    fullSupplyName: '8 PM PREMIUM BLACK BLENDED WHISKY'
  },
  '8 PM BLACK 180': { 
    family: '8PM', variant: 'PREMIUM_BLACK_BLENDED_WHISKY', size: '180', packaging: 'GLASS', flavor: 'N/A',
    normalizedKey: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_180', displayName: '8PM Black 180ML Glass',
    fullSupplyName: '8 PM PREMIUM BLACK BLENDED WHISKY'
  },
  
  // 8PM WHISKY FAMILY - PET BOTTLES
  '8 PM BLACK 180P': { 
    family: '8PM', variant: 'PREMIUM_BLACK_BLENDED_WHISKY', size: '180', packaging: 'PET', flavor: 'N/A',
    normalizedKey: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_PET_180', displayName: '8PM Black 180P PET',
    fullSupplyName: '8 PM PREMIUM BLACK BLENDED WHISKY Pet'
  },
  '8 PM BLACK 180-P': { 
    family: '8PM', variant: 'PREMIUM_BLACK_BLENDED_WHISKY', size: '180', packaging: 'PET', flavor: 'N/A',
    normalizedKey: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_PET_180', displayName: '8PM Black 180P PET',
    fullSupplyName: '8 PM PREMIUM BLACK BLENDED WHISKY Pet'
  },
  '8 PM BLACK 90A': { 
    family: '8PM', variant: 'PREMIUM_BLACK_BLENDED_WHISKY', size: '90', packaging: 'PET', flavor: 'N/A',
    normalizedKey: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_PET_90', displayName: '8PM Black 90A PET',
    fullSupplyName: '8 PM PREMIUM BLACK BLENDED WHISKY Pet'
  },
  '8 PM BLACK 90': { 
    family: '8PM', variant: 'PREMIUM_BLACK_BLENDED_WHISKY', size: '90', packaging: 'PET', flavor: 'N/A',
    normalizedKey: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_PET_90', displayName: '8PM Black 90A PET',
    fullSupplyName: '8 PM PREMIUM BLACK BLENDED WHISKY Pet'
  },
  '8 PM BLACK 60P': { 
    family: '8PM', variant: 'PREMIUM_BLACK_BLENDED_WHISKY', size: '60', packaging: 'PET', flavor: 'N/A',
    normalizedKey: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_PET_60', displayName: '8PM Black 60P PET',
    fullSupplyName: '8 PM PREMIUM BLACK BLENDED WHISKY Pet'
  },
  '8 PM BLACK 60': { 
    family: '8PM', variant: 'PREMIUM_BLACK_BLENDED_WHISKY', size: '60', packaging: 'PET', flavor: 'N/A',
    normalizedKey: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_PET_60', displayName: '8PM Black 60P PET',
    fullSupplyName: '8 PM PREMIUM BLACK BLENDED WHISKY Pet'
  },
  
  // DIRECT SUPPLY SHEET MAPPINGS FOR 8PM
  '8 PM PREMIUM BLACK BLENDED WHISKY': { 
    family: '8PM', variant: 'PREMIUM_BLACK_BLENDED_WHISKY', size: '750', packaging: 'GLASS', flavor: 'N/A',
    normalizedKey: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_750', displayName: '8PM Black 750ML',
    fullSupplyName: '8 PM PREMIUM BLACK BLENDED WHISKY'
  },
  '8 PM PREMIUM BLACK BLENDED WHISKY Pet': { 
    family: '8PM', variant: 'PREMIUM_BLACK_BLENDED_WHISKY', size: '180', packaging: 'PET', flavor: 'N/A',
    normalizedKey: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_PET_180', displayName: '8PM Black 180P PET',
    fullSupplyName: '8 PM PREMIUM BLACK BLENDED WHISKY Pet'
  },
  
  // VERVE VODKA FAMILY - GREEN APPLE (GLASS ONLY)
  'VERVE GREEN APPLE': { 
    family: 'VERVE', variant: 'GREEN_APPLE', size: '750', packaging: 'GLASS', flavor: 'GREEN_APPLE',
    normalizedKey: 'VERVE_GREEN_APPLE_750', displayName: 'VERVE Green Apple 750ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE GREEN APPLE SUPERIOR FLAVOURED VODKA'
  },
  'VERVE GREEN APPLE 750': { 
    family: 'VERVE', variant: 'GREEN_APPLE', size: '750', packaging: 'GLASS', flavor: 'GREEN_APPLE',
    normalizedKey: 'VERVE_GREEN_APPLE_750', displayName: 'VERVE Green Apple 750ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE GREEN APPLE SUPERIOR FLAVOURED VODKA'
  },
  'VERVE GREEN APPLE 375': { 
    family: 'VERVE', variant: 'GREEN_APPLE', size: '375', packaging: 'GLASS', flavor: 'GREEN_APPLE',
    normalizedKey: 'VERVE_GREEN_APPLE_375', displayName: 'VERVE Green Apple 375ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE GREEN APPLE SUPERIOR FLAVOURED VODKA'
  },
  
  // VERVE VODKA FAMILY - CRANBERRY (GLASS ONLY)
  'VERVE CRANBERRY': { 
    family: 'VERVE', variant: 'CRANBERRY', size: '750', packaging: 'GLASS', flavor: 'CRANBERRY',
    normalizedKey: 'VERVE_CRANBERRY_750', displayName: 'VERVE Cranberry 750ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE CRANBERRY TEASE SUPERIOR FLAVOUR'
  },
  'VERVE CRANBERRY 750': { 
    family: 'VERVE', variant: 'CRANBERRY', size: '750', packaging: 'GLASS', flavor: 'CRANBERRY',
    normalizedKey: 'VERVE_CRANBERRY_750', displayName: 'VERVE Cranberry 750ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE CRANBERRY TEASE SUPERIOR FLAVOUR'
  },
  'VERVE CRANBERRY 375': { 
    family: 'VERVE', variant: 'CRANBERRY', size: '375', packaging: 'GLASS', flavor: 'CRANBERRY',
    normalizedKey: 'VERVE_CRANBERRY_375', displayName: 'VERVE Cranberry 375ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE CRANBERRY TEASE SUPERIOR FLAVOUR'
  },
  
  // VERVE VODKA FAMILY - LEMON LUSH (GLASS ONLY)
  'VERVE LEMON LUSH': { 
    family: 'VERVE', variant: 'LEMON_LUSH', size: '750', packaging: 'GLASS', flavor: 'LEMON_LUSH',
    normalizedKey: 'VERVE_LEMON_LUSH_750', displayName: 'VERVE Lemon Lush 750ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE LEMON LUSH SUPERIOR FLAVOURED VODKA'
  },
  'VERVE LEMON LUSH 750': { 
    family: 'VERVE', variant: 'LEMON_LUSH', size: '750', packaging: 'GLASS', flavor: 'LEMON_LUSH',
    normalizedKey: 'VERVE_LEMON_LUSH_750', displayName: 'VERVE Lemon Lush 750ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE LEMON LUSH SUPERIOR FLAVOURED VODKA'
  },
  'VERVE LEMON LUSH 375': { 
    family: 'VERVE', variant: 'LEMON_LUSH', size: '375', packaging: 'GLASS', flavor: 'LEMON_LUSH',
    normalizedKey: 'VERVE_LEMON_LUSH_375', displayName: 'VERVE Lemon Lush 375ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE LEMON LUSH SUPERIOR FLAVOURED VODKA'
  },
  
  // VERVE VODKA FAMILY - GRAIN (GLASS ONLY)
  'VERVE GRAIN': { 
    family: 'VERVE', variant: 'GRAIN', size: '750', packaging: 'GLASS', flavor: 'GRAIN',
    normalizedKey: 'VERVE_GRAIN_750', displayName: 'VERVE Grain 750ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE SUPERIOR GRAIN VODKA'
  },
  'VERVE GRAIN 750': { 
    family: 'VERVE', variant: 'GRAIN', size: '750', packaging: 'GLASS', flavor: 'GRAIN',
    normalizedKey: 'VERVE_GRAIN_750', displayName: 'VERVE Grain 750ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE SUPERIOR GRAIN VODKA'
  },
  'VERVE GRAIN 375': { 
    family: 'VERVE', variant: 'GRAIN', size: '375', packaging: 'GLASS', flavor: 'GRAIN',
    normalizedKey: 'VERVE_GRAIN_375', displayName: 'VERVE Grain 375ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE SUPERIOR GRAIN VODKA'
  },
  
  // DIRECT SUPPLY SHEET MAPPINGS FOR VERVE
  'M2 MAGIC MOMENTS VERVE GREEN APPLE SUPERIOR FLAVOURED VODKA': { 
    family: 'VERVE', variant: 'GREEN_APPLE', size: '750', packaging: 'GLASS', flavor: 'GREEN_APPLE',
    normalizedKey: 'VERVE_GREEN_APPLE_750', displayName: 'VERVE Green Apple 750ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE GREEN APPLE SUPERIOR FLAVOURED VODKA'
  },
  'M2 MAGIC MOMENTS VERVE CRANBERRY TEASE SUPERIOR FLAVOUR': { 
    family: 'VERVE', variant: 'CRANBERRY', size: '750', packaging: 'GLASS', flavor: 'CRANBERRY',
    normalizedKey: 'VERVE_CRANBERRY_750', displayName: 'VERVE Cranberry 750ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE CRANBERRY TEASE SUPERIOR FLAVOUR'
  },
  'M2 MAGIC MOMENTS VERVE LEMON LUSH SUPERIOR FLAVOURED VODKA': { 
    family: 'VERVE', variant: 'LEMON_LUSH', size: '750', packaging: 'GLASS', flavor: 'LEMON_LUSH',
    normalizedKey: 'VERVE_LEMON_LUSH_750', displayName: 'VERVE Lemon Lush 750ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE LEMON LUSH SUPERIOR FLAVOURED VODKA'
  },
  'M2 MAGIC MOMENTS VERVE SUPERIOR GRAIN VODKA': { 
    family: 'VERVE', variant: 'GRAIN', size: '750', packaging: 'GLASS', flavor: 'GRAIN',
    normalizedKey: 'VERVE_GRAIN_750', displayName: 'VERVE Grain 750ML',
    fullSupplyName: 'M2 MAGIC MOMENTS VERVE SUPERIOR GRAIN VODKA'
  }
};

// ==========================================
// MAIN NORMALIZATION FUNCTIONS
// ==========================================

/**
 * Normalize brand name from any input format to consistent BrandInfo
 * Handles inputs from visit sheets, historical sheets, and pending challans
 */
export const normalizeBrand = (brandInput: string, sizeInput?: string): BrandInfo => {
  const brand = brandInput?.toString().trim().toUpperCase() || '';
  let size = sizeInput?.toString().trim() || '';
  
  console.log(`🔍 Normalizing: "${brandInput}" + "${sizeInput}"`);
  
  // Step 1: Try direct mapping with concatenated brand+size
  if (size) {
    const concatenated = `${brand} ${size}`;
    if (BRAND_MAPPING[concatenated]) {
      console.log(`✅ Direct match: "${concatenated}"`);
      return BRAND_MAPPING[concatenated];
    }
  }
  
  // Step 2: Try direct mapping with brand only
  if (BRAND_MAPPING[brand]) {
    const result = BRAND_MAPPING[brand];
    // If size provided, update the result with the specific size
    if (size && size !== result.size) {
      const updatedResult = { ...result };
      updatedResult.size = size;
      updatedResult.normalizedKey = `${result.family}_${result.variant}_${result.packaging === 'PET' ? 'PET_' : ''}${size}`;
      updatedResult.displayName = `${result.family} ${result.variant.replace(/_/g, ' ')} ${size}ML${result.packaging === 'PET' ? ' PET' : ''}`;
      console.log(`✅ Brand match with size override: "${brand}" -> ${updatedResult.normalizedKey}`);
      return updatedResult;
    }
    console.log(`✅ Brand match: "${brand}"`);
    return result;
  }
  
  // Step 3: Intelligent fallback logic
  const fallbackResult = intelligentBrandMapping(brand, size);
  if (fallbackResult) {
    console.log(`✅ Fallback match: "${brand}" + "${size}" -> ${fallbackResult.normalizedKey}`);
    return fallbackResult;
  }
  
  // Step 4: Default unknown brand
  console.log(`❌ Unknown brand: "${brand}" + "${size}"`);
  return {
    family: 'UNKNOWN',
    variant: 'UNKNOWN',
    size: size || '750',
    packaging: 'GLASS',
    flavor: 'N/A',
    normalizedKey: `UNKNOWN_${brand.replace(/\s+/g, '_')}_${size || '750'}`,
    displayName: `${brand} ${size || '750'}ML`,
    fullSupplyName: brand
  };
};

/**
 * Intelligent brand mapping for cases not in direct mapping
 */
const intelligentBrandMapping = (brand: string, size: string): BrandInfo | null => {
  // Extract size from brand name if not provided separately
  if (!size) {
    const sizeMatch = brand.match(/(\d+)\s?(P|A|ML)?$/);
    if (sizeMatch) {
      size = sizeMatch[1] + (sizeMatch[2] || '');
      brand = brand.replace(/\s*\d+\s?(P|A|ML)?$/, '').trim();
    } else {
      size = '750'; // Default size
    }
  }
  
  // Normalize size format
  size = size.replace(/[^0-9PA]/g, ''); // Remove everything except digits, P, A
  if (!size) size = '750';
  
  // 8PM FAMILY DETECTION
  if (brand.includes('8 PM') || brand.includes('8PM') || brand.includes('PREMIUM BLACK')) {
    const isPET = size.includes('P') || size.includes('A') || ['180', '90', '60'].includes(size.replace(/[PA]/g, ''));
    const cleanSize = size.replace(/[PA]/g, '');
    
    return {
      family: '8PM',
      variant: 'PREMIUM_BLACK_BLENDED_WHISKY',
      size: cleanSize,
      packaging: isPET ? 'PET' : 'GLASS',
      flavor: 'N/A',
      normalizedKey: `8PM_PREMIUM_BLACK_BLENDED_WHISKY_${isPET ? 'PET_' : ''}${cleanSize}`,
      displayName: `8PM Black ${cleanSize}ML${isPET ? ' PET' : ''}`,
      fullSupplyName: isPET ? '8 PM PREMIUM BLACK BLENDED WHISKY Pet' : '8 PM PREMIUM BLACK BLENDED WHISKY'
    };
  }
  
  // VERVE FAMILY DETECTION
  if (brand.includes('VERVE') || brand.includes('M2 MAGIC MOMENTS')) {
    let variant = 'GREEN_APPLE'; // Default
    let flavor = 'GREEN_APPLE';
    let fullSupplyName = 'M2 MAGIC MOMENTS VERVE GREEN APPLE SUPERIOR FLAVOURED VODKA';
    
    if (brand.includes('CRANBERRY') || brand.includes('TEASE')) {
      variant = 'CRANBERRY';
      flavor = 'CRANBERRY';
      fullSupplyName = 'M2 MAGIC MOMENTS VERVE CRANBERRY TEASE SUPERIOR FLAVOUR';
    } else if (brand.includes('LEMON') || brand.includes('LUSH')) {
      variant = 'LEMON_LUSH';
      flavor = 'LEMON_LUSH';
      fullSupplyName = 'M2 MAGIC MOMENTS VERVE LEMON LUSH SUPERIOR FLAVOURED VODKA';
    } else if (brand.includes('GRAIN')) {
      variant = 'GRAIN';
      flavor = 'GRAIN';
      fullSupplyName = 'M2 MAGIC MOMENTS VERVE SUPERIOR GRAIN VODKA';
    }
    
    const cleanSize = size.replace(/[PA]/g, '');
    
    return {
      family: 'VERVE',
      variant: variant,
      size: cleanSize,
      packaging: 'GLASS', // VERVE only comes in glass
      flavor: flavor,
      normalizedKey: `VERVE_${variant}_${cleanSize}`,
      displayName: `VERVE ${variant.replace(/_/g, ' ')} ${cleanSize}ML`,
      fullSupplyName: fullSupplyName
    };
  }
  
  return null;
};

/**
 * Create a matching key for shop-brand combination
 * Used for connecting different data sources
 */
export const createMatchingKey = (shopId: string, brandInput: string, sizeInput?: string): string => {
  const brandInfo = normalizeBrand(brandInput, sizeInput);
  const cleanShopId = shopId?.toString().trim() || 'UNKNOWN_SHOP';
  return `${cleanShopId}_${brandInfo.normalizedKey}`;
};

/**
 * Create multiple possible matching keys for a shop-brand combination
 * Useful for finding matches across different naming conventions
 */
export const createMultipleMatchingKeys = (shopId: string, brandInput: string, sizeInput?: string): string[] => {
  const primaryKey = createMatchingKey(shopId, brandInput, sizeInput);
  const keys = [primaryKey];
  
  // Add alternative keys for common variations
  const brandInfo = normalizeBrand(brandInput, sizeInput);
  const cleanShopId = shopId?.toString().trim() || 'UNKNOWN_SHOP';
  
  // Alternative with original brand name
  if (brandInput) {
    const altKey = `${cleanShopId}_${brandInput.toUpperCase().replace(/\s+/g, '_')}_${brandInfo.size}`;
    keys.push(altKey);
  }
  
  // Alternative with display name
  const displayKey = `${cleanShopId}_${brandInfo.displayName.toUpperCase().replace(/\s+/g, '_')}`;
  keys.push(displayKey);
  
  return [...new Set(keys)]; // Remove duplicates
};

/**
 * Get brand family (8PM or VERVE) from any brand input
 */
export const getBrandFamily = (brandInput: string, sizeInput?: string): string => {
  const brandInfo = normalizeBrand(brandInput, sizeInput);
  return brandInfo.family;
};

/**
 * Check if two brand inputs represent the same product
 */
export const isSameBrand = (brand1: string, size1: string, brand2: string, size2: string): boolean => {
  const info1 = normalizeBrand(brand1, size1);
  const info2 = normalizeBrand(brand2, size2);
  return info1.normalizedKey === info2.normalizedKey;
};

/**
 * Get all possible brand variations for a normalized key
 * Useful for debugging and validation
 */
export const getBrandVariations = (normalizedKey: string): string[] => {
  const variations: string[] = [];
  
  Object.entries(BRAND_MAPPING).forEach(([key, value]) => {
    if (value.normalizedKey === normalizedKey) {
      variations.push(key);
    }
  });
  
  return variations;
};

// ==========================================
// UTILITY FUNCTIONS FOR DEBUGGING
// ==========================================

export const debugBrandMapping = (shopId: string, brandInput: string, sizeInput?: string) => {
  console.group(`🔍 Debug Brand Mapping: ${shopId} - ${brandInput} ${sizeInput || ''}`);
  
  const brandInfo = normalizeBrand(brandInput, sizeInput);
  const matchingKey = createMatchingKey(shopId, brandInput, sizeInput);
  const allKeys = createMultipleMatchingKeys(shopId, brandInput, sizeInput);
  
  console.log('Input:', { shopId, brandInput, sizeInput });
  console.log('Brand Info:', brandInfo);
  console.log('Primary Matching Key:', matchingKey);
  console.log('All Possible Keys:', allKeys);
  console.log('Variations for this product:', getBrandVariations(brandInfo.normalizedKey));
  
  console.groupEnd();
  
  return { brandInfo, matchingKey, allKeys };
};

// ==========================================
// BRAND MAPPING VALIDATION FUNCTION
// ==========================================

export const validateBrandMapping = (): { success: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Test known brand combinations
  const testCases = [
    { brand: '8 PM BLACK', size: '375', expected: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_375' },
    { brand: '8 PM BLACK', size: '180P', expected: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_PET_180' },
    { brand: '8 PM BLACK', size: '180', expected: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_180' },
    { brand: 'VERVE GREEN APPLE', size: '750', expected: 'VERVE_GREEN_APPLE_750' },
    { brand: '8 PM BLACK 375', size: '', expected: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_375' },
    { brand: 'M2 MAGIC MOMENTS VERVE GREEN APPLE SUPERIOR FLAVOURED VODKA', size: '750', expected: 'VERVE_GREEN_APPLE_750' }
  ];
  
  testCases.forEach(({ brand, size, expected }) => {
    const result = normalizeBrand(brand, size);
    if (result.normalizedKey !== expected) {
      errors.push(`Failed: ${brand} + ${size} -> ${result.normalizedKey}, expected: ${expected}`);
    }
  });
  
  // Check for duplicate normalized keys
  const normalizedKeys = new Set<string>();
  const duplicates = new Set<string>();
  
  Object.values(BRAND_MAPPING).forEach(brandInfo => {
    if (normalizedKeys.has(brandInfo.normalizedKey)) {
      duplicates.add(brandInfo.normalizedKey);
    }
    normalizedKeys.add(brandInfo.normalizedKey);
  });
  
  if (duplicates.size > 0) {
    errors.push(`Duplicate normalized keys found: ${Array.from(duplicates).join(', ')}`);
  }
  
  return {
    success: errors.length === 0,
    errors
  };
};

// ==========================================
// DEFAULT EXPORT FOR CONVENIENCE
// ==========================================

export default {
  normalizeBrand,
  createMatchingKey,
  createMultipleMatchingKeys,
  getBrandFamily,
  isSameBrand,
  getBrandVariations,
  debugBrandMapping,
  validateBrandMapping,
  BRAND_MAPPING
};
