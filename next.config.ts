import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 圖片格式優先順序（WebP 最佳，體積小且相容性好）
    formats: ['image/webp'],

    // 自訂圖片尺寸（球員照片主要是小尺寸）
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],

    // ⭐ 關鍵：超長快取時間以減少重複處理
    // Google Photos 圖片 URL 包含版本資訊，不會變動
    // 設定 1 年快取，最大化利用 Vercel Image Optimization cache
    minimumCacheTTL: 31536000, // 365 天

    // 支援遠端圖片來源（Google Photos）
    remotePatterns: [
      // Google Photos 使用多個 CDN 域名 (lh3, lh4, lh5, lh6, lh7 等)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh7.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'photos.fife.usercontent.google.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // ⚠️ 重要：Vercel Image Optimization 行為
  // - 遠端圖片首次訪問：會優化並快取在 Vercel Edge CDN
  // - 後續訪問：直接從 CDN 返回（不消耗配額）
  // - 本地開發：快取在 .next/cache/images
  //
  // 💡 快取策略：
  // 1. 瀏覽器層：Cache-Control: public, max-age=31536000, immutable
  // 2. CDN 層：Vercel Edge Network 全球快取
  // 3. 原始層：Google Photos CDN
  //
  // 📊 預期配額消耗（假設 1000 球員，10000 訪問/月）：
  // - 首次訪問（冷啟動）：~1000 次優化
  // - 後續訪問：0 次（從 CDN 快取）
  // - 月均：~50-100 次（新用戶 + CDN 過期）

  // 效能優化
  compiler: {
    // 移除 console.log（生產環境）
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Headers 優化（可選，Vercel 會自動設定）
  async headers() {
    return [
      {
        // 為靜態資源設定長期快取
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
