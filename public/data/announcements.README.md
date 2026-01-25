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
| `content` | string | 是 | 公告內文（**支援 HTML 格式**） |
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
  "content": "新和週六野球聯盟 2025 賽季將於 2 月 15 日正式開打！",
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

## HTML 內容支援

### 支援的 HTML 標籤

`content` 欄位支援 HTML 格式，可以使用以下標籤：

#### 文字格式
- `<p>` - 段落
- `<br>` - 換行
- `<strong>`, `<b>` - 粗體
- `<em>`, `<i>` - 斜體
- `<u>` - 底線
- `<h1>`, `<h2>`, `<h3>`, `<h4>` - 標題

#### 列表
- `<ul>`, `<ol>`, `<li>` - 無序/有序列表

#### 連結
- `<a href="...">` - 超連結

#### 區塊
- `<blockquote>` - 引用區塊
- `<hr>` - 水平線

#### 程式碼
- `<code>` - 行內程式碼
- `<pre><code>` - 程式碼區塊

#### 表格
- `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`

### HTML 範例

#### 基本格式

```json
{
  "content": "<p>新和聯盟 2025 賽季將於 <strong>2 月 15 日</strong>正式開打！</p><p>首場開幕戰由衛冕冠軍 <em>Line Drive</em> 對戰飛尼克斯。</p>"
}
```

#### 使用列表

```json
{
  "content": "<p>本次開幕戰亮點：</p><ul><li>衛冕冠軍 Line Drive 全新陣容</li><li>飛尼克斯簽下明星打者</li><li>預計吸引超過 5000 名球迷</li></ul>"
}
```

#### 使用連結

```json
{
  "content": "<p>更多詳情請見 <a href='/schedule'>完整賽程表</a>。</p>"
}
```

#### 複雜範例

```json
{
  "id": "ann-2025-01-002",
  "title": "2025 賽季重要變更",
  "content": "<h3>規則調整</h3><p>本賽季將實施以下新規則：</p><ol><li><strong>打擊計時器</strong>：每個打席限時 20 秒</li><li><strong>投球限制</strong>：每場比賽投手最多 100 球</li><li><strong>挑戰制度</strong>：每隊每場 2 次挑戰機會</li></ol><hr><h3>賽程安排</h3><p>常規賽將分為三個階段：</p><ul><li>春季賽段：2-4 月</li><li>夏季賽段：5-7 月</li><li>秋季賽段：8-10 月</li></ul><blockquote>所有比賽時間將提前 30 分鐘公告</blockquote>",
  "publishedAt": "2025-01-10T10:00:00+08:00",
  "images": [],
  "links": [],
  "category": "賽事公告",
  "priority": 1,
  "pinned": true
}
```

### 樣式說明

系統會自動為 HTML 內容套用以下樣式：
- 段落間距：1rem
- 標題字體：粗體，不同大小
- 列表：自動縮排，項目間距
- 連結：藍色文字，底線，hover 效果
- 引用：左側灰色邊線，斜體
- 程式碼：灰色背景（行內），深色背景（區塊）
- 表格：邊框，表頭灰色背景

### 安全提醒

⚠️ **重要安全注意事項**：
1. 只使用受信任的 HTML 內容
2. 避免使用 `<script>` 標籤（會被瀏覽器過濾）
3. 避免使用 `<iframe>` 或其他可能的安全風險標籤
4. 建議只使用上述列出的基本 HTML 標籤
