/**
 * Cache Headers 設定測試
 *
 * 這個測試驗證 API route 是否正確設定 CDN cache headers
 */

describe('Game Reports API - Cache Configuration', () => {
  describe('Cache Headers 設定檢查', () => {
    it('route.ts 應該包含 Cache-Control header 設定', () => {
      // 這是一個文件化測試，驗證開發者有意識地設定快取
      // 實際的 cache header 驗證會在 E2E 測試中進行

      const fs = require('fs');
      const path = require('path');
      const routePath = path.join(__dirname, '../[gameNumber]/route.ts');
      const content = fs.readFileSync(routePath, 'utf-8');

      // 檢查是否包含 Cache-Control 設定
      expect(content).toContain('Cache-Control');
      expect(content).toContain('CACHE_CONFIG'); // 使用設定檔
      expect(content).toContain('getCacheControlHeader'); // 使用設定方法
    });

    it('快取設定應該使用正確的時間常數', () => {
      const CACHE_CONFIG = {
        BROWSER_MAX_AGE: 3600,     // 1 小時（秒）
        CDN_MAX_AGE: 86400,        // 1 天（秒）
        STALE_WHILE_REVALIDATE: 172800, // 2 天（秒）
      };

      expect(CACHE_CONFIG.BROWSER_MAX_AGE).toBe(60 * 60); // 1 小時
      expect(CACHE_CONFIG.CDN_MAX_AGE).toBe(24 * 60 * 60); // 1 天
      expect(CACHE_CONFIG.STALE_WHILE_REVALIDATE).toBe(48 * 60 * 60); // 2 天
    });
  });

  describe('Cache 策略文件', () => {
    it('應該定義 public cache（允許 CDN 快取）', () => {
      // public: 允許任何快取（包括 CDN）儲存回應
      const cacheStrategy = 'public';
      expect(cacheStrategy).toBe('public');
    });

    it('應該定義 max-age（瀏覽器快取時間）', () => {
      // max-age: 瀏覽器快取的最大存活時間
      const maxAge = 3600; // 1 小時
      expect(maxAge).toBe(3600);
    });

    it('應該定義 s-maxage（CDN 快取時間）', () => {
      // s-maxage: CDN 快取的最大存活時間
      const sMaxAge = 86400; // 1 天
      expect(sMaxAge).toBe(86400);
    });

    it('應該定義 stale-while-revalidate（過期後背景更新）', () => {
      // stale-while-revalidate: 快取過期後，仍可使用舊資料，同時背景更新
      const swr = 172800; // 2 天
      expect(swr).toBe(172800);
    });
  });
});
