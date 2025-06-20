// ==========================================
// UNIFIED BRAND NORMALIZATION SERVICE
// Single source of truth for all brand mapping across all systems
// ==========================================

export interface BrandInfo {
  family: string;
  variant: string;
  size: string;
  flavor: string;
  displayName: string;
  normalizedKey: string;
}

// ==========================================
// MASTER BRAND MAPPING - SINGLE SOURCE OF TRUTH
// ==========================================

const BRAND_MAPPING: Record<string, string> = {
  // 8PM WHISKY FAMILY - Glass Bottles
  '8 PM BLACK 750': '8PM_PREMIUM_BLACK_BLENDED_WHISKY_750',
  '8 PM BLACK 375': '8PM_PREMIUM_BLACK_BLENDED_WHISKY_375',
  '8 PM BLACK 180': '8PM_PREMIUM_BLACK_BLENDED_WHISKY_180',  // Glass bottle
  '8PM BLACK 750': '8PM_PREMIUM_BLACK_BLENDED_WHISKY_750',
  '8PM BLACK 375': '8PM_PREMIUM_BLACK_BLENDED_WHISKY_375',
  '8PM BLACK 180': '8PM_PREMIUM_BLACK_BLENDED_WHISKY_180',
  
  // 8PM WHISKY FAMILY - PET Bottles (SEPARATE from glass)
  '8 PM BLACK 180P': '8PM_PREMIUM_BLACK_BLENDED_WHISKY_Pet_180',
  '8 PM BLACK 90A': '8PM_PREMIUM_BLACK_BLENDED_WHISKY_Pet_90',
  '8 PM BLACK 60P': '8PM_PREMIUM_BLACK_BLENDED_WHISKY_Pet_60',
  '8PM BLACK 180P': '8PM_PREMIUM_BLACK_BLENDED_WHISKY_Pet_180',
  '8PM BLACK 90A': '8PM_PREMIUM_BLACK_BLENDED_WHISKY_Pet_90',
  '8PM BLACK 60P': '8PM_PREMIUM_BLACK_BLENDED_WHISKY_Pet_60',
  
  // VERVE VODKA FAMILY - Green Apple
  'VERVE GREEN APPLE 750': 'VERVE_GREEN_APPLE_750',
  'VERVE GREEN APPLE 375': 'VERVE_GREEN_APPLE_375',
  
  // VERVE VODKA FAMILY - Cranberry
  'VERVE CRANBERRY 750': 'VERVE_CRANBERRY_750', 
  'VERVE CRANBERRY 375': 'VERVE_CRANBERRY_375',
  'VERVE CRANBERRY TEASE 750': 'VERVE_CRANBERRY_750',
  'VERVE CRANBERRY TEASE 375': 'VERVE_CRANBERRY_375',
  
  // VERVE VODKA FAMILY - Lemon Lush
  'VERVE LEMON LUSH 750': 'VERVE_LEMON_LUSH_750',
  'VERVE LEMON LUSH 375': 'VERVE_LEMON_LUSH_375',
  
  // VERVE VODKA FAMILY - Grain
  'VERVE GRAIN 750': 'VERVE_GRAIN_750',
  'VERVE GRAIN 375': 'VERVE_GRAIN_375',
  'VERVE SUPERIOR GRAIN 750': 'VERVE_GRAIN_750',
  'VERVE SUPERIOR GRAIN 375': 'VERVE_GRAIN_375',
};

// ==========================================
// CORE NORMALIZATION FUNCTION
// ==========================================

export const normalizeBrand = (brandInput: string, sizeInput?: string): BrandInfo => {
  let brand = brandInput?.toString().trim().toUpperCase() || '';
  let size = sizeInput?.toString().trim() || '';
  
  // Handle combined input like "8 PM BLACK 375" 
  if (!size && brand.includes(' ')) {
    const parts = brand.split(' ');
    const lastPart = parts[parts.length - 1];
    
    // Check if last part is a size
    if (/^\d+[PA]?$/.test(lastPart)) {
      size = lastPart;
      brand = parts.slice(0, -1).join(' ');
    }
  }
  
  // Normalize size variations
  size = size.replace(/[^0-9A-Z]/g, ''); // Remove special chars
  if (size === '180-P' || size === 'PETP') size = '180P';
  if (size === '90' && brand.includes('8PM')) size = '90A'; // 8PM 90 is PET
  if (!size || size === '') size = '750'; // Default
  
  let family = '';
  let variant = '';
  let flavor = '';
  let displayName = '';
  
  // Detect brand family and create consistent format
  if (brand.includes('8 PM') || brand.includes('8PM') || brand.includes('PREMIUM BLACK')) {
    family = '8PM';
    
    if (size === '180P' || size === '90A' || size === '60P') {
      variant = `8PM PREMIUM BLACK BLENDED WHISKY Pet ${size.replace(/[PA]/, '')}`;
      displayName = `8PM BLACK ${size} PET`;
    } else {
      variant = `8PM PREMIUM BLACK BLENDED WHISKY ${size}`;
      displayName = `8PM BLACK ${size}ML`;
    }
  }
  else if (brand.includes('VERVE') || brand.includes('M2M') || brand.includes('MAGIC MOMENTS')) {
    family = 'VERVE';
    
    // Detect flavor
    if (brand.includes('GREEN APPLE') || brand.includes('APPLE')) {
      flavor = 'GREEN APPLE';
      variant = `VERVE GREEN APPLE ${size}`;
      displayName = `VERVE GREEN APPLE ${size}ML`;
    } else if (brand.includes('CRANBERRY') || brand.includes('TEASE')) {
      flavor = 'CRANBERRY';
      variant = `VERVE CRANBERRY ${size}`;
      displayName = `VERVE CRANBERRY ${size}ML`;
    } else if (brand.includes('LEMON') || brand.includes('LUSH')) {
      flavor = 'LEMON LUSH';
      variant = `VERVE LEMON LUSH ${size}`;
      displayName = `VERVE LEMON LUSH ${size}ML`;
    } else if (brand.includes('GRAIN')) {
      flavor = 'GRAIN';
      variant = `VERVE GRAIN ${size}`;
      displayName = `VERVE GRAIN ${size}ML`;
    } else {
      flavor = 'CLASSIC';
      variant = `VERVE ${size}`;
      displayName = `VERVE ${size}ML`;
    }
  }
  else {
    family = 'OTHER';
    variant = `${brand} ${size}`;
    displayName = `${brand} ${size}ML`;
  }
  
  // Create normalized key using BRAND_MAPPING
  const lookupKey = displayName.replace('ML', '').replace(' PET', 'P');
  const normalizedKey = BRAND_MAPPING[lookupKey] || `${family}_${variant.replace(/\s+/g, '_')}_${size}`;
  
  return {
    family,
    variant,
    size,
    flavor,
    displayName,
    normalizedKey
  };
};

// ==========================================
// SHOP-BRAND MATCHING KEY GENERATION
// ==========================================

export const createMatchingKey = (shopName: string, brandInfo: BrandInfo): string => {
  const cleanShopName = shopName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
  return `${cleanShopName}_${brandInfo.normalizedKey}`;
};

export const createMultipleMatchingKeys = (shopName: string, brandInput: string, sizeInput?: string): string[] => {
  const brandInfo = normalizeBrand(brandInput, sizeInput);
  const baseKey = createMatchingKey(shopName, brandInfo);
  
  // Generate alternative keys for better matching
  const alternatives = [baseKey];
  
  // Add variation without size
  if (brandInfo.size) {
    const noSizeInfo = { ...brandInfo, normalizedKey: brandInfo.normalizedKey.replace(`_${brandInfo.size}`, '') };
    alternatives.push(createMatchingKey(shopName, noSizeInfo));
  }
  
  return alternatives;
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export const getBrandFamily = (brandInput: string): string => {
  const brandInfo = normalizeBrand(brandInput);
  return brandInfo.family;
};

export const debugBrandMapping = (brandInput: string, sizeInput?: string, shopName?: string): void => {
  console.log('🔍 Brand Mapping Debug:', {
    input: { brand: brandInput, size: sizeInput, shop: shopName },
    normalized: normalizeBrand(brandInput, sizeInput),
    matchingKey: shopName ? createMatchingKey(shopName, normalizeBrand(brandInput, sizeInput)) : 'N/A'
  });
};

// ==========================================
// BRAND VALIDATION
// ==========================================

export const validateBrandMapping = (): { success: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Test known brand combinations
  const testCases = [
    { brand: '8 PM BLACK', size: '375', expected: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_375' },
    { brand: '8 PM BLACK', size: '180P', expected: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_Pet_180' },
    { brand: '8 PM BLACK', size: '180', expected: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_180' },
    { brand: 'VERVE GREEN APPLE', size: '750', expected: 'VERVE_GREEN_APPLE_750' },
    { brand: '8 PM BLACK 375', size: '', expected: '8PM_PREMIUM_BLACK_BLENDED_WHISKY_375' }
  ];
  
  testCases.forEach(({ brand, size, expected }) => {
    const result = normalizeBrand(brand, size);
    if (!result.normalizedKey.includes(expected.split('_')[0])) {
      errors.push(`Failed: ${brand} + ${size} -> ${result.normalizedKey}, expected pattern: ${expected}`);
    }
  });
  
  return {
    success: errors.length === 0,
    errors
  };
};

// ==========================================
// EXPORT ALL FUNCTIONS
// ==========================================

export default {
  normalizeBrand,
  createMatchingKey,
  createMultipleMatchingKeys,
  getBrandFamily,
  debugBrandMapping,
  validateBrandMapping,
  BRAND_MAPPING
};
