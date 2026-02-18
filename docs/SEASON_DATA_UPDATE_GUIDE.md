# 賽季資料更新指南

本文件說明新版統一賽季資料結構（`public/data/seasons/YYYY.json`）的欄位意義，以及各種常見更新情境的操作步驟。

---

## 目錄

1. [資料結構總覽](#資料結構總覽)
2. [欄位規格參考表](#欄位規格參考表)
3. [常見更新情境](#常見更新情境)
4. [更新後的驗證步驟](#更新後的驗證步驟)
5. [常見錯誤](#常見錯誤)

---

## 資料結構總覽

每個賽季的所有資料，現在都集中在一個檔案：

```
public/data/seasons/
├── 2025.json    ← 2025 賽季全部資料
└── 2026.json    ← 2026 賽季全部資料
```

### 頂層結構

```json
{
  "season": 2025,
  "lastUpdated": "2026-02-18T08:17:48.301Z",
  "standings": { ... },
  "games": { ... }
}
```

| 欄位 | 說明 |
|------|------|
| `season` | 賽季年度，整數，例如 `2025` |
| `lastUpdated` | 此檔案最後更新的時間，ISO 8601 格式 |
| `standings` | 戰績排行資料（詳見下方） |
| `games` | 所有比賽資料，key 為 `gameNumber`（詳見下方） |

---

### standings 欄位說明

```json
"standings": {
  "source": "manual",
  "teams": [
    {
      "teamId": "ROO",
      "teamName": "Line Drive",
      "wins": 16,
      "losses": 3,
      "draws": 1,
      "runsAllowed": 4,
      "runsScored": 13.75
    }
  ]
}
```

| 欄位 | 說明 |
|------|------|
| `source` | 戰績資料的來源，見下方說明 |
| `teams` | 所有球隊的戰績陣列，依排名排序 |

#### standings.source 三種值的意義

| 值 | 意義 | 何時使用 |
|----|------|---------|
| `"manual"` | 戰績由管理員手動維護 | 目前預設值，直接編輯 `teams` 陣列即可 |
| `"partial"` | 部分來自比賽比分計算，部分手動補差 | 過渡期使用 |
| `"calculated"` | 完全從比賽比分自動計算 | 將來比分資料完整後使用 |

目前（2026-02-18）所有賽季均使用 `"manual"`，直接編輯 `teams` 陣列更新戰績。

#### teams 陣列欄位說明

| 欄位 | 型別 | 說明 |
|------|------|------|
| `teamId` | string | 球隊代碼（三碼英文大寫，例如 `"ROO"`, `"PHE"`） |
| `teamName` | string | 球隊名稱，需與其他資料一致 |
| `wins` | number | 勝場數（整數） |
| `losses` | number | 敗場數（整數） |
| `draws` | number | 和局場數（整數） |
| `runsAllowed` | number | 均失（平均每場失分，保留三位小數） |
| `runsScored` | number | 均得（平均每場得分，保留三位小數） |

---

### games 欄位說明

```json
"games": {
  "202523": {
    "date": "2026-01-10",
    "homeTeam": "世新超乙組",
    "awayTeam": "十號馬",
    "venue": "三鶯A",
    "timeSlot": "上午",
    "startTime": "08:00",
    "endTime": "10:30",
    "status": "finished",
    "homeScore": null,
    "awayScore": null,
    "sheetId": "1L_l4GkaG5B8e5EMBfBKtBSi3lBOdd9cmJk8oSv-lj8M"
  }
}
```

`games` 是一個物件，每個 key 是 `gameNumber`，值是該場比賽的完整資料。

| 欄位 | 型別 | 說明 |
|------|------|------|
| `date` | string | 比賽日期，格式 `YYYY-MM-DD`，例如 `"2026-01-10"` |
| `homeTeam` | string | 主隊名稱 |
| `awayTeam` | string | 客隊名稱 |
| `venue` | string | 場地，例如 `"三鶯A"`, `"中正A"`, `"清溪"` |
| `timeSlot` | string | 時段，只能是 `"上午"`, `"中午"`, `"下午"` 其中一個 |
| `startTime` | string | 開始時間，格式 `HH:mm`，例如 `"08:00"` |
| `endTime` | string | 結束時間，格式 `HH:mm`，例如 `"11:00"` |
| `status` | string | 比賽狀態，見下方說明 |
| `homeScore` | number 或 null | 主隊得分。**尚未比賽或未填入時為 `null`** |
| `awayScore` | number 或 null | 客隊得分。**尚未比賽或未填入時為 `null`** |
| `sheetId` | string | 戰報 Google Sheet ID。**尚無戰報時填空字串 `""`** |
| `note` | string | 備註（選填），例如 `"2026新球季"` |

#### status 可能的值

| 值 | 意義 |
|----|------|
| `"scheduled"` | 尚未比賽（預定賽程） |
| `"finished"` | 比賽已完成 |
| `"rain"` | 雨天延賽 |
| `"cancelled"` | 取消（非雨延） |

#### homeScore / awayScore 為 null 的意義

`null` 表示「比分尚未填入」。即使 `status` 已是 `"finished"`，比分仍可能是 `null`（代表比賽已完成但比分資料尚未錄入）。當比分確認後，將 `null` 改為整數即可。

---

## 欄位規格參考表

### gameNumber 格式

```
格式：YYYYNNN
      ^^^^--- 賽季年度（4 位數）
          ^^^--- 場次編號（無固定位數）

範例：
  "202523"  = 2025 賽季第 23 場
  "2025201" = 2025 賽季第 201 場
  "2026018" = 2026 賽季第 18 場
```

gameNumber 同時作為 JSON 的 key，不可重複。

### 可用時段（timeSlot）

| 值 | 常見時間範圍 |
|----|------------|
| `"上午"` | 08:00 ~ 11:00 |
| `"中午"` | 11:00 ~ 14:00（或 10:30 ~ 13:00 等） |
| `"下午"` | 14:00 ~ 17:00（或 14:30 ~ 17:00 等） |

---

## 常見更新情境

### 情境 A：更新戰績排行（Standings）

適用時機：每次結算本週賽況後，更新戰績表。

**編輯檔案**：`public/data/seasons/2025.json`（或對應賽季）

找到 `standings.teams` 陣列，直接修改對應球隊的數字。

**範例**：Line Drive 新增一場勝利

修改前：
```json
{
  "teamId": "ROO",
  "teamName": "Line Drive",
  "wins": 16,
  "losses": 3,
  "draws": 1,
  "runsAllowed": 4.0,
  "runsScored": 13.75
}
```

修改後：
```json
{
  "teamId": "ROO",
  "teamName": "Line Drive",
  "wins": 17,
  "losses": 3,
  "draws": 1,
  "runsAllowed": 3.95,
  "runsScored": 14.12
}
```

**注意事項**：
- `teamId` 與 `teamName` 不可更動，需與現有資料一致
- `runsAllowed` 和 `runsScored` 為平均值（總失分 / 已賽場數），保留適當小數
- 陣列順序代表名次，依積分排列（積分 = 勝 x 3 + 和 x 1）
- 更新後記得同步更新 `lastUpdated` 欄位為當下時間

---

### 情境 B：更新比賽結果（加入比分）

適用時機：比賽完成後，將實際比分填入。

**編輯檔案**：`public/data/seasons/YYYY.json`

在 `games` 物件中找到對應的 `gameNumber`，更新 `homeScore`、`awayScore`，並確認 `status` 為 `"finished"`。

**範例**：比賽 `202523` 已完成，主隊 8 分、客隊 3 分

修改前：
```json
"202523": {
  "date": "2026-01-10",
  "homeTeam": "世新超乙組",
  "awayTeam": "十號馬",
  "venue": "三鶯A",
  "timeSlot": "上午",
  "startTime": "08:00",
  "endTime": "10:30",
  "status": "finished",
  "homeScore": null,
  "awayScore": null,
  "sheetId": "1L_l4GkaG5B8e5EMBfBKtBSi3lBOdd9cmJk8oSv-lj8M"
}
```

修改後：
```json
"202523": {
  "date": "2026-01-10",
  "homeTeam": "世新超乙組",
  "awayTeam": "十號馬",
  "venue": "三鶯A",
  "timeSlot": "上午",
  "startTime": "08:00",
  "endTime": "10:30",
  "status": "finished",
  "homeScore": 8,
  "awayScore": 3,
  "sheetId": "1L_l4GkaG5B8e5EMBfBKtBSi3lBOdd9cmJk8oSv-lj8M"
}
```

**注意事項**：
- `homeScore` 和 `awayScore` 填整數，不要加引號（`8` 而非 `"8"`）
- 若比分尚未確認，維持 `null` 不動，不要填 `0`（`0` 代表真的 0 分）

---

### 情境 C：新增比賽（加入新場次）

適用時機：新增預定比賽到賽季資料中。

**編輯檔案**：`public/data/seasons/YYYY.json`

在 `games` 物件中，用 `gameNumber` 作為 key 新增一個比賽物件。

**步驟**：

1. 確認新場次的 `gameNumber`。格式為 `賽季年度 + 場次編號`，場次編號需查閱賽程表（不可與現有 key 重複）
2. 在 `games` 物件的末尾新增比賽資料
3. 尚未有戰報時，`sheetId` 填 `""`

**範例**：新增 2026 賽季第 99 場

```json
"games": {
  "2026018": { ... },
  "2026066": { ... },
  "2026099": {
    "date": "2026-03-07",
    "homeTeam": "Line Drive",
    "awayTeam": "飛尼克斯",
    "venue": "中正A",
    "timeSlot": "下午",
    "startTime": "14:30",
    "endTime": "17:00",
    "status": "scheduled",
    "homeScore": null,
    "awayScore": null,
    "sheetId": ""
  }
}
```

**注意事項**：
- `gameNumber` 在整個 `games` 物件中必須唯一
- 新預定的比賽，`status` 填 `"scheduled"`，`homeScore` 和 `awayScore` 填 `null`
- 若有備註（如「時間暫定」），加入選填的 `"note"` 欄位

---

### 情境 D：新增賽季（全新 YYYY.json）

適用時機：全新一個賽季開始前，建立賽季資料檔案。

#### 方法一：執行遷移腳本（有舊格式資料時）

若有舊格式的 `standings_YYYY.json`、`season_games/YYYY.json`、`schedules/*.json`、`game-reports/index.json`，可以執行遷移腳本自動合併：

```bash
# 在專案根目錄執行
npx tsx scripts/migrate-season-data.ts
```

腳本會自動讀取舊格式資料，輸出至 `public/data/seasons/2025.json` 和 `public/data/seasons/2026.json`。

若要新增其他年份，請修改 `scripts/migrate-season-data.ts` 末尾的 `main()` 函式，加入對應年份的 `await migrateSeason(YYYY)` 呼叫。

#### 方法二：手動建立新賽季檔案

直接在 `public/data/seasons/` 目錄下建立 `YYYY.json`，填入以下最小結構：

```json
{
  "season": 2027,
  "lastUpdated": "2027-01-01T00:00:00Z",
  "standings": {
    "source": "manual",
    "teams": []
  },
  "games": {}
}
```

建立後，依照情境 A 加入球隊戰績，依照情境 C 逐一加入比賽。

---

### 情境 E：新增戰報連結

適用時機：比賽完成後，取得 Google Sheet 戰報連結，填入資料。

**編輯檔案**：`public/data/seasons/YYYY.json`

找到對應的 `gameNumber`，將 `sheetId` 從 `""` 改為 Google Sheet 的 ID。

**如何取得 Google Sheet ID**：

從 Google Sheet 的網址中複製 ID：

```
https://docs.google.com/spreadsheets/d/【這段就是 ID】/edit
```

範例：
```
https://docs.google.com/spreadsheets/d/1dM8woBhSnNPms3YKPEptfw3o4F3neBWa-JrbRoW1iak/edit
                                        ↑
                           sheetId = "1dM8woBhSnNPms3YKPEptfw3o4F3neBWa-JrbRoW1iak"
```

**範例**：為比賽 `202552` 加入戰報

修改前：
```json
"202552": {
  "status": "finished",
  "homeScore": null,
  "awayScore": null,
  "sheetId": ""
}
```

修改後：
```json
"202552": {
  "status": "finished",
  "homeScore": null,
  "awayScore": null,
  "sheetId": "1pMLlfdHtA_8yTT5XGN9P_CVUhECPbnynu-DTt2P_8Gk"
}
```

**注意事項**：
- 雨天延賽的場次，`sheetId` 填 `""`，並將 `status` 改為 `"rain"`
- 不要填入完整網址，只填 ID 部分

---

## 更新後的驗證步驟

### 步驟 1：驗證 JSON 格式正確

```bash
# 驗證 2025 賽季檔案
python3 -m json.tool public/data/seasons/2025.json > /dev/null && echo "2025.json 格式正確"

# 驗證 2026 賽季檔案
python3 -m json.tool public/data/seasons/2026.json > /dev/null && echo "2026.json 格式正確"
```

若輸出 `格式正確` 表示 JSON 無誤；若出現錯誤訊息，代表有語法問題需要修正。

### 步驟 2：本機啟動確認顯示正常

```bash
npm run dev
```

開啟瀏覽器，進入賽程頁面與戰績頁面，確認資料正確顯示。

### 步驟 3：確認 TypeScript 編譯無誤

```bash
npx tsc --noEmit
```

---

## 常見錯誤

### 錯誤 1：比分填了字串而非數字

```json
// 錯誤
"homeScore": "8"

// 正確
"homeScore": 8
```

### 錯誤 2：空比分填了 0 而非 null

```json
// 錯誤（會被誤解為主隊 0 分）
"homeScore": 0

// 正確（表示尚未填入）
"homeScore": null
```

`0` 和 `null` 意義不同：`0` 代表比賽結果真的是 0 分，`null` 代表尚未有資料。

### 錯誤 3：日期格式錯誤

```json
// 錯誤
"date": "2026/01/10"
"date": "26-01-10"

// 正確
"date": "2026-01-10"
```

日期格式必須是 `YYYY-MM-DD`，使用連字號分隔。

### 錯誤 4：JSON 結尾多了逗號

```json
// 錯誤（最後一個物件後面不可有逗號）
{
  "teamId": "ROO",
  "wins": 16,   ← 這個逗號會造成錯誤
}

// 正確
{
  "teamId": "ROO",
  "wins": 16
}
```

### 錯誤 5：gameNumber 與現有 key 重複

每個 `gameNumber` 在 `games` 物件中必須是唯一的。新增前，先搜尋確認不重複。

---

**建立日期**：2026-02-18
**適用版本**：重構後的統一賽季資料結構（`public/data/seasons/YYYY.json`）
