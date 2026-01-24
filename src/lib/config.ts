/**
 * 應用程式設定檔
 */

/**
 * CDN 快取設定
 */
export const CACHE_CONFIG = {
  /**
   * 瀏覽器快取時間（秒）
   * 3600 秒 = 1 小時
   *
   * 本地開發時，瀏覽器會快取 1 小時，避免重複呼叫 API
   */
  BROWSER_MAX_AGE: 3600,

  /**
   * CDN 快取時間（秒）
   * 86400 秒 = 1 天
   *
   * 生產環境時，Vercel Edge Network 會快取 1 天
   */
  CDN_MAX_AGE: 86400,

  /**
   * Stale-While-Revalidate 時間（秒）
   * 172800 秒 = 2 天
   *
   * 快取過期後，仍可使用舊資料並在背景更新
   */
  STALE_WHILE_REVALIDATE: 172800,

  /**
   * 生成完整的 Cache-Control header 字串
   */
  getCacheControlHeader(): string {
    return `public, max-age=${this.BROWSER_MAX_AGE}, s-maxage=${this.CDN_MAX_AGE}, stale-while-revalidate=${this.STALE_WHILE_REVALIDATE}`;
  },
} as const;
