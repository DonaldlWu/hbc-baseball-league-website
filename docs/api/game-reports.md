# Game Reports API

## 概述

比賽戰報 API 提供從 Google Sheet 即時取得並解析比賽紀錄單的功能。

## API Endpoint

### GET `/api/game-reports/[gameNumber]`

根據比賽編號取得戰報資料。

#### 請求參數

| 參數 | 類型 | 說明 |
|------|------|------|
| `gameNumber` | string | 比賽編號，格式為 `YYYYNNN`（賽季年度+場次編號），如 `2025142` |

#### 回應格式

**成功 (200)**

```json
{
  "gameNumber": "2025142",
  "date": "2026-1-10",
  "venue": "中正A",
  "innings": {
    "home": [6, 1, 0, 1, 6, 0, 2, null, null],
    "away": [2, 0, 0, 0, 0, 2, 0, null, null]
  },
  "homeTeam": {
    "name": "永春TB",
    "runs": 16,
    "hits": 18,
    "errors": 2,
    "battingAvg": 0.529,
    "pitchers": [...],
    "batters": [...]
  },
  "awayTeam": {
    "name": "台大經濟OB",
    "runs": 4,
    "hits": 8,
    "errors": 7,
    "pitchers": [...],
    "batters": [...]
  }
}
```

**錯誤回應**

| 狀態碼 | 說明 |
|--------|------|
| 404 | 找不到比賽或尚未有戰報資料 |
| 500 | 伺服器錯誤（無法讀取索引或解析失敗）|

```json
{
  "error": "錯誤訊息"
}
```

## 資料流程

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client    │────▶│  API Route       │────▶│  index.json     │
│             │     │  /api/game-      │     │  (查找 sheetId) │
└─────────────┘     │  reports/[no]    │     └─────────────────┘
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Google Sheet    │
                    │  (CSV export)    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  gameReportParser│
                    │  (解析 CSV)      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  GameReport JSON │
                    └──────────────────┘
```

## 相關檔案

| 檔案 | 說明 |
|------|------|
| `app/api/game-reports/[gameNumber]/route.ts` | API Route Handler |
| `src/lib/gameReportParser.ts` | Google Sheet CSV 解析器 |
| `public/data/game-reports/index.json` | 比賽編號對應 sheetId 索引 |
| `src/types/index.ts` | TypeScript 型別定義 |

## index.json 格式

```json
{
  "games": {
    "2025142": {
      "sheetId": "1rXHJwsXGEp4ir1Nqm40258atNnXJ2U8tgcFTN_v6Hb4",
      "date": "2026-01-10",
      "homeTeam": "永春TB",
      "awayTeam": "台大經濟OB",
      "venue": "中正A"
    }
  }
}
```

- **gameNumber 格式**：`YYYYNNN`（賽季年度 + 場次編號）
  - 範例：`2025142` = 2025 賽季第 142 場

- `sheetId`: Google Sheet ID（從 URL 的 `/d/` 和 `/edit` 之間取得）
- 若 `sheetId` 為空字串，API 會回傳 404

## Google Sheet CSV 欄位對應

紀錄單的 CSV 結構：

| Row | 內容 |
|-----|------|
| 0 | 日期 (column 13) |
| 1 | 局數標題 |
| 2 | 主隊逐局得分 + R/H/E (columns 14-16) |
| 3 | 客隊逐局得分 + R/H/E |
| 4 | 隊名 (column 1=主隊, column 11=客隊) |
| 5-7 | 投手數據 |
| 8 | TOTAL 行 |
| 9 | 隊名 + 打擊率 |
| 10+ | 打者數據 |

**局數欄位對應：**
- Columns 4-9 = 1-6 局
- Column 10 = 空欄（跳過）
- Columns 11-13 = 7-9 局

**投手欄位對應 (主隊 col 0-8, 客隊 col 10-18)：**
| Column | 欄位 |
|--------|------|
| 0/10 | 背號 |
| 1/11 | 名字 |
| 2/12 | 局數 (IP) |
| 3/13 | 人次 (NP) |
| 4/14 | 奪三振 (K) |
| 5/15 | 四死 (BB) |
| 6/16 | 被安打 (H) |
| 7/17 | 被全壘打 |
| 8/18 | 失分 |

**打者欄位對應 (主隊 col 0-8, 客隊 col 10-18)：**
| Column | 欄位 |
|--------|------|
| 0/10 | 背號 |
| 1/11 | 名字 |
| 2/12 | 打席 (PA) |
| 3/13 | 安打 (H) |
| 4/14 | 三振 (SO) |
| 5/15 | 四死 (BB) |
| 6/16 | 打點 (RBI) |
| 7/17 | 得分 (R) |
| 8/18 | 盜壘 (SB) |

> **注意：** CSV 中沒有「打數」欄位，打數由 `打席 - 四死` 計算（簡化）

## 使用範例

```typescript
// 前端呼叫
const res = await fetch(`/api/game-reports/${encodeURIComponent('2025142')}`);
const data = await res.json();

if (!res.ok) {
  console.error(data.error);
  return;
}

// data 即為 GameReport 型別
console.log(data.homeTeam.name, data.homeTeam.runs);
```

## gameNumber 格式說明

| 格式 | 說明 | 範例 |
|------|------|------|
| 儲存格式 | `YYYYNNN`（賽季年度+場次編號） | `2025142` |
| 顯示格式 | `No.NNN`（友善顯示） | `No.142` |

使用 `displayGameNumber()` 函數可將儲存格式轉換為顯示格式。
