/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/radico-dashboard',
  assetPrefix: '/radico-dashboard',
  images: {
    unoptimized: true
  },
  distDir: 'out',
  env: {
    // 🔑 Google API Configuration
    NEXT_PUBLIC_GOOGLE_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
    
    // 📊 Google Sheets IDs
    NEXT_PUBLIC_MASTER_SHEET_ID: '1pRz9CgOoamTrFipnmF-XuBCg9IZON9br5avgRlKYtxM',
    NEXT_PUBLIC_VISIT_SHEET_ID: '1XG4c_Lrpk-YglTq3G3ZY9Qjt7wSnUq0UZWDSYT61eWE',
    NEXT_PUBLIC_VISIT_ARCHIVE_SHEET_ID: '1U8JVEITLaGwbAGGCKhL7MYV8ns320dDoFF-_6yNxq2o',
    NEXT_PUBLIC_HISTORICAL_SHEET_ID: '1yXzEYHJeHlETrEmU4TZ9F2_qv4OE10N4DPdYX0Iqfx0',
    
    // 🔐 NEW: Authentication Support (uses same master sheet)
    NEXT_PUBLIC_USER_SHEET_ID: '1pRz9CgOoamTrFipnmF-XuBCg9IZON9br5avgRlKYtxM',
  },
  // Suppress build warnings for better performance
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  }
}

module.exports = nextConfig
