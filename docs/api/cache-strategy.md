# API 快取策略

## 概述

為減少 Google Sheets API 呼叫次數，本專案使用 **Vercel Edge Network CDN 快取**。

## 快取設定

### 瀏覽器快取時間
- **快取時間：** 1 小時（3600 秒）
- **適用於：** 本地開發環境、使用者瀏覽器

### CDN 快取時間
- **快取時間：** 1 天（86400 秒）
- **Stale-While-Revalidate：** 2 天（172800 秒）
- **適用於：** Vercel Edge Network（生產環境）

### Cache-Control Header
```
Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=172800
```

**參數說明：**
- `public`：允許任何快取（包括 CDN）儲存回應
- `max-age=3600`：**瀏覽器**快取的最大存活時間（1 小時）
- `s-maxage=86400`：**CDN** 快取的最大存活時間（1 天）
- `stale-while-revalidate=172800`：快取過期後，仍可使用舊資料並在背景更新（2 天）

## 快取行為

### 生產環境（Vercel）

```
使用者 1 (第 1 次) → Vercel Edge → API Route → Google Sheets API ✅
使用者 2 (同一天) → Vercel Edge (Cache Hit) → 直接返回 ❌ (不呼叫 API)
使用者 3 (同一天) → Vercel Edge (Cache Hit) → 直接返回 ❌ (不呼叫 API)
...
使用者 1000 (同一天) → Vercel Edge (Cache Hit) → 直接返回 ❌ (不呼叫 API)
```

**結果：** 1000 個使用者（同一天）= **1 次 Google Sheets API 呼叫**

### 本地開發環境

```
第 1 次請求 → API Route → Google Sheets API ✅ (呼叫 API)
第 2 次請求 (1 小時內) → 瀏覽器快取 → 直接返回 ❌ (不呼叫 API)
第 3 次請求 (1 小時內) → 瀏覽器快取 → 直接返回 ❌ (不呼叫 API)
1 小時後 → API Route → Google Sheets API ✅ (重新呼叫 API)
```

**結果：** 本地開發時，**每 1 小時**才會呼叫一次 API，大幅提升開發體驗

### 快取過期行為

```
Day 1, 00:00 → 第一次請求，快取建立
Day 1, 23:59 → Cache Hit，使用快取
Day 2, 00:01 → 快取過期，但仍返回舊資料（stale），同時背景更新
Day 2, 00:02 → Cache Hit，使用新快取
```

## 快取配置

快取設定統一管理在 `src/lib/config.ts`：

```typescript
export const CACHE_CONFIG = {
  BROWSER_MAX_AGE: 3600,           // 1 小時（瀏覽器快取）
  CDN_MAX_AGE: 86400,              // 1 天（CDN 快取）
  STALE_WHILE_REVALIDATE: 172800,  // 2 天（SWR）
  getCacheControlHeader(): string {
    return `public, max-age=${this.BROWSER_MAX_AGE}, s-maxage=${this.CDN_MAX_AGE}, stale-while-revalidate=${this.STALE_WHILE_REVALIDATE}`;
  },
};
```

## API Endpoints 快取狀態

| Endpoint | 快取時間 | SWR | 狀態 |
|----------|---------|-----|------|
| `/api/game-reports/[gameNumber]` | 1 天 | 2 天 | ✅ 已啟用 |

## 清除快取

### 自動清除
- 快取會在 1 天後自動失效
- SWR 期間（2 天）內，舊資料仍可使用並背景更新

### 手動清除
目前不支援手動清除快取。如需立即更新資料，需等待快取過期（最多 1 天）。

## 監控

### Vercel Dashboard
1. 前往 Vercel Dashboard
2. 選擇專案
3. 查看 Analytics → Edge Network
4. 監控 Cache Hit Rate

### 預期指標
- **Cache Hit Rate：** > 95%（同一天內重複請求）
- **API Calls to Google Sheets：** 每場比賽每天約 1-2 次

## 費用估算

### Google Sheets API
- **配額：** 每天 500 次讀取（免費）
- **預估使用：**
  - 100 場比賽 × 1-2 次/天 = 100-200 次/天
  - 遠低於免費配額 ✅

### Vercel
- **CDN 快取：** 免費
- **Edge Network：** 免費（Hobby Plan）

## 注意事項

1. ⚠️ **資料延遲：** 資料更新後，最多需要 1 天才會反映在前端
2. ✅ **成本優化：** 大幅減少 Google Sheets API 呼叫
3. ✅ **效能提升：** CDN 快取提供毫秒級回應速度
4. ⚠️ **除錯：** 開發時可在 Network tab 檢查 `X-Vercel-Cache` header

## 除錯

### 檢查快取狀態

在瀏覽器 Network tab 中查看回應 headers：

```
X-Vercel-Cache: HIT        # CDN 快取命中
X-Vercel-Cache: MISS       # CDN 快取未命中，呼叫後端
X-Vercel-Cache: STALE      # 使用過期快取，背景更新中
```

### 繞過快取（開發用）

在請求中加入隨機參數：
```
/api/game-reports/2025142?_t=1234567890
```

或使用 `Cache-Control: no-cache` header（需在開發工具中設定）。
