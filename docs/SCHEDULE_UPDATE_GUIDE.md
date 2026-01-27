# 賽程更新指南 (Schedule Update Guide)

本文件說明如何新增或更新賽程資料，包含所有需要更新的 JSON 檔案。

---

## 目錄

1. [快速開始](#快速開始)
2. [需要更新的檔案清單](#需要更新的檔案清單)
3. [檔案格式說明](#檔案格式說明)
4. [完整範例](#完整範例)
5. [驗證與測試](#驗證與測試)
6. [常見問題](#常見問題)

---

## 快速開始

新增一個月份的賽程需要更新 **2 個檔案**：

| 檔案 | 用途 | 必要性 |
|------|------|--------|
| `public/data/schedules/YYYY-MM.json` | 月賽程表顯示 | **必要** |
| `public/data/game-reports/index.json` | 戰報連結與載入 | **必要** |

### 快速流程

```bash
# 1. 建立月賽程檔案
cp public/data/schedules/2026-01.json public/data/schedules/2026-02.json
# 編輯 2026-02.json 填入賽程資料

# 2. 更新戰報索引
# 編輯 public/data/game-reports/index.json 新增對應的比賽

# 3. 驗證 JSON 格式
cat public/data/schedules/2026-02.json | python3 -m json.tool > /dev/null && echo "OK"
cat public/data/game-reports/index.json | python3 -m json.tool > /dev/null && echo "OK"

# 4. 提交
git add public/data/schedules/ public/data/game-reports/
git commit -m "feat: 新增 2026 年 2 月賽程"
```

---

## 需要更新的檔案清單

### 1. 月賽程檔案 (必要)

**路徑**: `public/data/schedules/YYYY-MM.json`

**用途**:
- 首頁賽程表顯示
- 月份切換功能
- 比賽列表與連結

### 2. 戰報索引檔案 (必要)

**路徑**: `public/data/game-reports/index.json`

**用途**:
- 定義每場比賽的 Google Sheets ID
- 提供比賽基本資訊（日期、隊伍、場地）
- 戰報頁面載入資料

**重要**: 如果沒有在此檔案新增比賽資訊，點擊賽程表的比賽連結會顯示「找不到比賽資料」。

---

## 檔案格式說明

### 1. 月賽程檔案格式

**檔案**: `public/data/schedules/YYYY-MM.json`

```json
{
  "schedule": {
    "year": 2026,           // 日曆年份
    "month": 2,             // 月份 (1-12)
    "season": 2025,         // 賽季年度（比賽所屬賽季）
    "days": [
      {
        "date": "2026-02-07",
        "venues": {
          "中正A": [
            {
              "gameNumber": "202595",
              "homeTeam": "世新超乙組",
              "awayTeam": "華江OB",
              "venue": "中正A",
              "timeSlot": "中午",
              "startTime": "12:00",
              "endTime": "14:30",
              "note": "開賽時間暫定"
            }
          ]
        },
        "note": "當日備註（選填）"
      }
    ]
  },
  "meta": {
    "lastUpdated": "2026-01-28T00:00:00Z",
    "totalGames": 11,
    "venues": ["中正A", "清溪", "三鶯B"]
  }
}
```

#### 欄位說明

| 欄位 | 型別 | 必要 | 說明 |
|------|------|------|------|
| `schedule.year` | number | 是 | 日曆年份 |
| `schedule.month` | number | 是 | 月份 (1-12) |
| `schedule.season` | number | 是 | 賽季年度 |
| `schedule.days` | array | 是 | 有比賽的日期陣列 |
| `days[].date` | string | 是 | ISO 8601 日期格式 |
| `days[].venues` | object | 是 | 場地 -> 比賽陣列 |
| `days[].note` | string | 否 | 當日備註（如「新年快樂！」） |
| `game.gameNumber` | string | 是 | 比賽編號（賽季年度+場次） |
| `game.homeTeam` | string | 是 | 主隊名稱 |
| `game.awayTeam` | string | 是 | 客隊名稱 |
| `game.venue` | string | 是 | 場地名稱 |
| `game.timeSlot` | string | 是 | 時段：上午/中午/下午 |
| `game.startTime` | string | 是 | 開始時間 (HH:mm) |
| `game.endTime` | string | 是 | 結束時間 (HH:mm) |
| `game.note` | string | 否 | 比賽備註 |
| `game.result` | object | 否 | 比賽結果（完賽後填入） |
| `meta.lastUpdated` | string | 是 | 最後更新時間 |
| `meta.totalGames` | number | 是 | 總比賽場數 |
| `meta.venues` | array | 是 | 使用的場地列表 |

#### gameNumber 格式

```
格式: YYYYNNN
     ^^^^--- 賽季年度
        ^^^--- 場次編號

範例: "2025201" = 2025 賽季第 201 場
      "202595"  = 2025 賽季第 95 場
```

UI 顯示時會自動轉換為 `No.201` 格式。

---

### 2. 戰報索引檔案格式

**檔案**: `public/data/game-reports/index.json`

```json
{
  "games": {
    "202595": {
      "sheetId": "",
      "date": "2026-02-07",
      "homeTeam": "世新超乙組",
      "awayTeam": "華江OB",
      "venue": "中正A"
    },
    "202599": {
      "sheetId": "1ABC...xyz",
      "date": "2026-02-07",
      "homeTeam": "台大醫學院棒",
      "awayTeam": "莫拉克",
      "venue": "中正A"
    }
  }
}
```

#### 欄位說明

| 欄位 | 型別 | 必要 | 說明 |
|------|------|------|------|
| `sheetId` | string | 是 | Google Sheets ID（未有戰報填空字串） |
| `date` | string | 是 | 比賽日期 (YYYY-MM-DD) |
| `homeTeam` | string | 是 | 主隊名稱 |
| `awayTeam` | string | 是 | 客隊名稱 |
| `venue` | string | 是 | 場地名稱 |

#### sheetId 特殊值

| 值 | 說明 |
|------|------|
| `""` (空字串) | 尚未有戰報資料 |
| `"rain"` | 雨天延賽 |
| `"1ABC...xyz"` | Google Sheets 文件 ID |

---

## 完整範例

### 情境：新增 2026 年 2 月賽程

#### 原始資料

```
2026/2/7
中正A
No.95 世新超乙組 VS 華江OB--中正A--中午(12:00~14:30)
No.99 台大醫學院棒 VS 莫拉克--中正A--下午(14:30~17:00)

2026/2/21
新年快樂！（無比賽）
```

#### Step 1: 建立月賽程檔案

**檔案**: `public/data/schedules/2026-02.json`

```json
{
  "schedule": {
    "year": 2026,
    "month": 2,
    "season": 2025,
    "days": [
      {
        "date": "2026-02-07",
        "venues": {
          "中正A": [
            {
              "gameNumber": "202595",
              "homeTeam": "世新超乙組",
              "awayTeam": "華江OB",
              "venue": "中正A",
              "timeSlot": "中午",
              "startTime": "12:00",
              "endTime": "14:30"
            },
            {
              "gameNumber": "202599",
              "homeTeam": "台大醫學院棒",
              "awayTeam": "莫拉克",
              "venue": "中正A",
              "timeSlot": "下午",
              "startTime": "14:30",
              "endTime": "17:00"
            }
          ]
        }
      },
      {
        "date": "2026-02-21",
        "venues": {},
        "note": "新年快樂！"
      }
    ]
  },
  "meta": {
    "lastUpdated": "2026-01-28T00:00:00Z",
    "totalGames": 2,
    "venues": ["中正A"]
  }
}
```

#### Step 2: 更新戰報索引

**檔案**: `public/data/game-reports/index.json`

在 `games` 物件中新增：

```json
{
  "games": {
    "202595": {
      "sheetId": "",
      "date": "2026-02-07",
      "homeTeam": "世新超乙組",
      "awayTeam": "華江OB",
      "venue": "中正A"
    },
    "202599": {
      "sheetId": "",
      "date": "2026-02-07",
      "homeTeam": "台大醫學院棒",
      "awayTeam": "莫拉克",
      "venue": "中正A"
    }
  }
}
```

---

## 驗證與測試

### 1. 驗證 JSON 格式

```bash
# 驗證月賽程檔案
cat public/data/schedules/2026-02.json | python3 -m json.tool > /dev/null && echo "schedules OK"

# 驗證戰報索引
cat public/data/game-reports/index.json | python3 -m json.tool > /dev/null && echo "game-reports OK"
```

### 2. 本地測試

```bash
# 啟動開發伺服器
npm run dev

# 測試項目：
# 1. 首頁切換到新月份，確認賽程顯示
# 2. 點擊比賽卡片，確認能進入戰報頁面
# 3. 確認備註（note）正確顯示
```

### 3. 檢查清單

- [ ] `schedules/YYYY-MM.json` 已建立
- [ ] `game-reports/index.json` 已更新
- [ ] JSON 格式驗證通過
- [ ] `gameNumber` 格式正確（賽季年度+場次）
- [ ] 隊伍名稱與 `all_teams.json` 一致
- [ ] 本地測試賽程顯示正常
- [ ] 本地測試戰報連結正常

---

## 常見問題

### Q1: 點擊比賽卡片顯示「找不到比賽資料」？

**原因**: 該場比賽未在 `game-reports/index.json` 中定義。

**解決**: 在 `index.json` 的 `games` 物件中新增該場比賽。

### Q2: gameNumber 格式是什麼？

**格式**: `賽季年度 + 場次編號`

```
No.95  → 202595  (2025 賽季第 95 場)
No.201 → 2025201 (2025 賽季第 201 場)
```

### Q3: 如何標記雨天延賽？

在 `game-reports/index.json` 中將 `sheetId` 設為 `"rain"`：

```json
{
  "202595": {
    "sheetId": "rain",
    ...
  }
}
```

### Q4: 如何新增當日備註（如「新年快樂」）？

在 `days` 陣列中加入 `note` 欄位：

```json
{
  "date": "2026-02-21",
  "venues": {},
  "note": "新年快樂！"
}
```

### Q5: 如何新增比賽備註（如「時間暫定」）？

在比賽物件中加入 `note` 欄位：

```json
{
  "gameNumber": "202595",
  "homeTeam": "世新超乙組",
  "awayTeam": "華江OB",
  "note": "開賽時間暫定，待確認場地後調整"
}
```

### Q6: 隊伍名稱要從哪裡查？

參考 `public/data/all_teams.json`，使用 `name` 欄位的值。

---

## 相關文件

- [賽程功能說明](./SCHEDULE_FEATURE.md) - UI 與元件說明
- [戰報 API 文件](./api/game-reports.md) - API 格式說明
- [資料更新指南](./DATA_UPDATE_GUIDE.md) - 球員統計資料更新

---

**建立日期**: 2026-01-28
**最後更新**: 2026-01-28
