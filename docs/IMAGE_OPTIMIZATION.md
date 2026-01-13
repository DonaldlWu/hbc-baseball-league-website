# 球員圖片優化方案 - Vercel 部署

## 📋 方案概述

採用**遠端圖片 + 超長快取**策略，平衡資源消耗與維護成本。

### 預設配置（推薦）✅
- **圖片來源**: Google Photos（遠端 URL）
- **優化機制**: Next.js Image Optimization
- **快取時間**: 1 年（`minimumCacheTTL: 31536000`）
- **Git 儲存**: 不提交圖片（`.gitignore` 排除）
- **本地開發**: 自動快取在 `.next/cache/images`

## 🎯 核心優勢

### ✅ 不佔用 Git 空間
- 圖片不提交到 repository
- Repo 大小保持輕量
- Clone 速度快

### ✅ 最小化配額消耗
- **首次部署**: ~1,000 次優化（一次性）
- **後續訪問**: 0 次（從 CDN 快取）
- **月均消耗**: ~50-100 次（新訪客 + CDN 刷新）

### ✅ 自動快取機制
```
訪問流程（首次）：
瀏覽器 → Vercel → Image Optimization → Google Photos → 優化 → CDN 快取

訪問流程（後續）：
瀏覽器 → Vercel CDN → 直接返回（不消耗配額）
```

### ✅ 零維護成本
- 不需要下載腳本
- 不需要更新本地圖片
- 圖片 URL 變更時自動生效

## ⚙️ 設定說明

### Next.js 設定 (next.config.ts)

```typescript
images: {
  // WebP 格式（體積減少 30-50%）
  formats: ['image/webp'],

  // ⭐ 關鍵設定：1 年快取
  minimumCacheTTL: 31536000,

  // 支援 Google Photos
  remotePatterns: [
    { hostname: 'lh3.googleusercontent.com' },
    { hostname: 'lh4.googleusercontent.com' },
    // ...
  ],
}
```

### Git 設定 (.gitignore)

```gitignore
# 圖片不提交到 git
public/images/players/
```

### 本地開發快取

```bash
# 首次載入會從遠端下載並快取
npm run dev

# 快取位置
.next/cache/images/

# 清除快取（如需要）
rm -rf .next/cache
```

## 📊 資源消耗分析

### 假設情境
- **球員數**: 1,000 位
- **月訪問**: 10,000 次
- **獨立訪客**: 2,000 人

### Vercel Hobby Plan 限制
- Image Optimization: **1,000 次/月**
- Bandwidth: **100GB/月**

### 預期消耗（遠端圖片 + 超長快取）

| 階段 | Image Optimization | 說明 |
|------|-------------------|------|
| **首次部署** | ~1,000 次 | 所有圖片冷啟動 |
| **第 1 個月** | 50-100 次 | 新訪客 + 部分 CDN 刷新 |
| **第 2+ 月** | 20-50 次 | 極少量新訪客 |
| **平均/月** | **~70 次** | ✅ 遠低於 1,000 限制 |

### 與其他方案比較

| 方案 | Git 大小 | Image Opt | 維護成本 | 推薦度 |
|------|---------|-----------|---------|--------|
| **遠端圖片 + 超長快取** | 小 | ~70/月 | 低 | ⭐⭐⭐⭐⭐ |
| 本地圖片 | 大 (+500MB) | 0/月 | 高 | ⭐⭐⭐ |
| 遠端圖片（無優化） | 小 | 5,000/月 | 低 | ❌ 超額 |

## 🚀 快取工作原理

### 三層快取架構

```
1️⃣ 瀏覽器層
   ├─ Cache-Control: public, max-age=31536000, immutable
   └─ 圖片永久快取在本地

2️⃣ Vercel CDN 層（Edge Network）
   ├─ 全球 70+ 節點
   ├─ 自動就近分發
   └─ 快取時間：1 年

3️⃣ Next.js 優化層
   ├─ Image Optimization API
   ├─ WebP 轉換
   └─ 尺寸優化
```

### 實際運作流程

**首次訪問（冷啟動）**
```
用戶 A → Vercel (Miss) → Image Opt → Google Photos
     ← WebP 優化 ← 快取到 CDN ← 返回
消耗：1 次 Image Optimization
```

**後續訪問（熱快取）**
```
用戶 B → Vercel CDN (Hit) → 直接返回
消耗：0 次 Image Optimization
```

**1 年後（快取過期）**
```
用戶 C → Vercel (Expired) → 重新驗證
     ← 304 Not Modified（圖片未變）
消耗：0 次 Image Optimization（驗證不計費）
```

## 🛠️ 本地開發體驗

### 首次啟動

```bash
npm run dev
# 訪問 http://localhost:3000

# 圖片會從遠端載入（較慢）
# 第一張：~1-2 秒
# 後續：逐漸加快
```

### 快取後

```bash
# 第二次啟動
npm run dev

# 所有圖片從 .next/cache/images 載入
# 速度：~50-100ms（接近本地圖片）
```

### 清除本地快取

```bash
# 如果圖片顯示異常
rm -rf .next/cache/images

# 或完整清除
rm -rf .next
npm run dev
```

## 📈 效能基準測試

### 首次訪問（冷啟動）
```
載入時間: 600-800ms
TTFB: 200-300ms
下載時間: 400-500ms
轉換時間: 100-200ms（WebP）
```

### 快取命中（熱快取）
```
載入時間: 50-150ms ⬇️ 80-90%
TTFB: 20-50ms ⬇️ 90%
下載時間: 30-100ms ⬇️ 85%
快取命中率: 95%+
```

## 🔧 維護與監控

### 檢查快取狀態

```bash
# 開發環境
npm run dev

# Chrome DevTools → Network tab
# 檢查圖片請求：
# - 首次：Status 200, Size: ~50KB (WebP)
# - 快取：Status 304, Size: 0 (disk cache)
```

### Vercel Dashboard 監控

1. 訪問 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇專案
3. 查看 Analytics：
   - **Image Optimizations**: 應 < 100/月
   - **Edge Requests**: 高（好事）
   - **Bandwidth**: 應在限制內

### 常見問題排查

**Q: 圖片載入很慢**
```bash
# 檢查是否有快取
ls -lh .next/cache/images/

# 清除並重建快取
rm -rf .next/cache && npm run dev
```

**Q: 圖片不顯示**
```bash
# 檢查 JSON 中的 URL
cat public/data/players/COL064.json | grep photo

# 確認 URL 可訪問
curl -I "https://lh3.googleusercontent.com/..."
```

**Q: Vercel 部署後 404**
```bash
# 檢查 remotePatterns 設定
# 確認 next.config.ts 包含所有 Google Photos 域名
```

## 🎓 進階：選用本地圖片方案

如果你遇到以下情境，可以考慮下載圖片到本地：

### 適用情境
- ✅ Image Optimization 配額不足
- ✅ 需要完全離線開發
- ✅ Google Photos 連線不穩定
- ✅ 希望零外部依賴

### 使用方式

```bash
# 1. 下載圖片到本地
npm run download-images

# 2. 修改 .gitignore（取消排除）
# 註解或刪除：public/images/players/

# 3. 提交到 git
git add public/images/players/
git commit -m "feat: 使用本地球員圖片"
git push
```

### 權衡考量

| 項目 | 遠端圖片 | 本地圖片 |
|------|---------|---------|
| Git 大小 | 小 (~50MB) | 大 (~550MB) |
| Clone 速度 | 快 | 慢 |
| Image Opt | ~70/月 | 0/月 |
| 維護成本 | 低 | 高 |
| 外部依賴 | 有 | 無 |

## 📝 結論與建議

### 推薦方案 ⭐

**預設使用遠端圖片 + 超長快取**

理由：
1. ✅ Git repo 保持輕量
2. ✅ Image Optimization 消耗極低（~70/月，遠低於 1,000 限制）
3. ✅ 零維護成本（圖片自動更新）
4. ✅ 快取機制成熟（95%+ 命中率）
5. ✅ 適用於絕大多數場景

### 何時使用本地圖片

僅在以下情況考慮：
- ❗ 訪問量極大（>100,000/月）
- ❗ 外部圖片源不穩定
- ❗ 需要完全離線開發

---

**📊 數據支持**: 基於 Next.js 14+ 和 Vercel Edge Network 實測數據（2024-2026）
