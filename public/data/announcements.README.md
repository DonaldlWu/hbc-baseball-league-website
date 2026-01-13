# 公告資料格式說明

## 檔案位置
`public/data/announcements.json`

## 資料結構

### 主要結構
```json
{
  "announcements": [...],  // 公告列表
  "meta": {...}            // 元資料
}
```

### 公告欄位說明

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `id` | string | 是 | 唯一識別碼，建議格式：ann-YYYY-MM-NNN |
| `title` | string | 是 | 公告標題 |
| `content` | string | 是 | 公告內文 |
| `publishedAt` | string | 是 | 發布時間（ISO 8601 格式，含時區） |
| `images` | array | 否 | 圖片列表，每個圖片包含 url 和 alt |
| `links` | array | 否 | 連結列表，每個連結包含 label 和 url |
| `category` | string | 是 | 公告分類（如：賽事公告、球員異動等） |
| `priority` | number | 是 | 優先級（數字越小優先級越高） |
| `pinned` | boolean | 是 | 是否置頂 |

### 圖片格式
```json
{
  "url": "assets/announcements/image.jpg",
  "alt": "圖片說明文字"
}
```

### 連結格式
```json
{
  "label": "連結文字",
  "url": "/path/to/page"
}
```

## 使用範例

### 新增公告
1. 開啟 `announcements.json`
2. 在 `announcements` 陣列中新增一筆資料
3. 確保 `id` 唯一
4. 更新 `meta.lastUpdated` 和 `meta.totalCount`
5. 如有新分類，需加入 `meta.categories`

### 置頂公告
將 `pinned` 設為 `true`，並設定較小的 `priority` 值

### 公告排序
- 置頂公告：依 `priority` 由小到大
- 一般公告：依 `publishedAt` 由新到舊

## API 函數

```typescript
// 載入所有公告
const data = await loadAnnouncements();

// 取得置頂公告
const pinned = await getPinnedAnnouncements();

// 取得最新 N 筆公告
const latest = await getLatestAnnouncements(5);
```

## 圖片資源

公告圖片請放置於 `public/assets/announcements/` 目錄下。

## 注意事項

1. **時間格式**：必須使用 ISO 8601 格式，並包含時區（+08:00）
2. **圖片路徑**：使用相對於 `public/` 的路徑
3. **連結路徑**：內部連結使用相對路徑，外部連結使用完整 URL
4. **ID 格式**：建議使用 `ann-YYYY-MM-NNN` 格式，便於管理
5. **分類管理**：新增分類時記得更新 `meta.categories`

## 範例公告

```json
{
  "id": "ann-2025-01-001",
  "title": "2025 賽季開幕戰資訊",
  "content": "新和聯盟 2025 賽季將於 2 月 15 日正式開打！",
  "publishedAt": "2025-01-10T10:00:00+08:00",
  "images": [
    {
      "url": "assets/announcements/opening-2025.jpg",
      "alt": "2025 開幕戰海報"
    }
  ],
  "links": [
    {
      "label": "查看完整賽程",
      "url": "/schedule"
    }
  ],
  "category": "賽事公告",
  "priority": 1,
  "pinned": true
}
```
