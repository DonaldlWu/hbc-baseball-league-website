新增比賽場次到賽季資料，支援貼上公告批量新增，自動偵測補賽情境。支援一般賽季場次（`No.98`）及季後賽場次（`No.20250314G1`）兩種格式。

## 使用方式

**批量模式（推薦）：** 直接貼上聯盟賽程公告全文，自動解析所有場次
**單場模式：** `/add-game [比賽資訊]`

```
/add-game                  # 批量：貼上公告全文
/add-game 2026/3/7 No.100 Line Drive VS 飛尼克斯--中正A--下午(14:30~17:00)  # 單場（一般賽季）
/add-game 2026/4/4 No.20250314G1 華江OB VS 莫拉克--中正A--上午(08:00~11:00)  # 單場（季後賽）
```

---

## 批量模式（貼上公告全文）

### 輸入範例

使用者貼上以下格式的月賽程公告：

```
2025/12/6
中正A
No.98 Mechanics VS 陽明OB--中正A--中午(12:00~14:30)
No.202 ACES VS 飛尼克斯--中正A--下午(14:30~17:00)

2025/12/27
中正A
No.47 世新超乙組 VS 台大醫學院棒--中正A--上午(08:00~11:00)
No.106 實踐OB VS MIRACLE--中正A--中午(11:00~14:00)
清溪
No.207 永春TB VS 少林棒球隊--清溪--中午(12:00~14:30)
```

### Step 1：解析公告

逐行解析所有 `No.XXX` 場次。

**場次格式分兩種：**

#### 一般賽季格式（`No.98`）

| 欄位 | 來源 |
|------|------|
| date | 最近一個日期行，格式 `YYYY/M/D` → `YYYY-MM-DD` |
| gameNumber | `No.98` + 賽季前綴 → `2025098` |
| awayTeam | VS **前**的隊伍（客隊，先攻） |
| homeTeam | VS **後**的隊伍（主隊，後攻） |
| venue | `--場地--` 中間段，或日期下方的場地行 |
| timeSlot | 依實際開始時間判斷（見下表） |
| startTime / endTime | 括號內時間 |
| 目標檔案 | `public/data/seasons/YYYY.json` |

**賽季年度判斷：**
讀取 `public/data/seasons/index.json`，依比賽日期找出所屬賽季。

**gameNumber 轉換：**
`No.98` + 賽季 2025 → `2025098`（補零至三位數）

#### 季後賽格式（`No.20250314G1`）

| 欄位 | 來源 |
|------|------|
| date | 最近一個日期行，格式 `YYYY/M/D` → `YYYY-MM-DD` |
| gameNumber | 完整保留 `No.` 後的內容 → `20250314G1` |
| awayTeam | VS **前**的隊伍（客隊，先攻） |
| homeTeam | VS **後**的隊伍（主隊，後攻） |
| venue | `--場地--` 中間段，或日期下方的場地行 |
| timeSlot | 依實際開始時間判斷（見下表） |
| startTime / endTime | 括號內時間 |
| 目標檔案 | `public/data/seasons/{賽季年}postseason.json` |

**季後賽識別規則：**
gameNumber 符合正則 `^\d{8}G\d+$`（8 位數字 + G + 數字），例如 `20250314G1`。

**賽季年度：** 直接取 gameNumber 前 4 位（如 `2025`）。

**目標檔案：** `public/data/seasons/2025postseason.json`（不是 `2025.json`）。

**gameNumber 不轉換：** 保留原始格式 `20250314G1`，不補零不拼接。

**時段對應（兩種格式均適用）：**

| 開始時間 | timeSlot |
|---------|---------|
| 08:xx | 上午 |
| 10:30 / 11:00 / 12:00 | 中午 |
| 14:00 / 14:30 | 下午 |

> ⚠️ 公告標示的「上午/中午/下午」文字僅供參考，以**實際開始時間**判斷 timeSlot。
> 例如：「下午(12:00~14:30)」→ 實際開始 12:00 → timeSlot = 中午

略過非場次行（備註說明、空行、場地標題行等）。

### Step 2：偵測每場是否為補賽

根據場次格式讀取對應的目標檔案：
- 一般賽季：讀取 `public/data/seasons/YYYY.json`
- 季後賽：讀取 `public/data/seasons/YYYYpostseason.json`

逐一檢查 gameNumber 是否已存在：

| 情況 | 處理方式 |
|------|---------|
| 不存在 | 一般新增 |
| 已存在，status 為 `rain` | 補賽情境 → append `rescheduledDates` |
| 已存在，status 非 `rain` | 標記衝突，不自動更新，請使用者確認 |

### Step 3：顯示摘要，一次確認

```
解析完成，共 5 場：

  ✅ 一般新增（4 場）
  gameNumber       日期        客隊           主隊           場地    時段   目標檔案
  ─────────────────────────────────────────────────────────────────────────────────
  2025098          2025-12-06  Mechanics      陽明OB         中正A   中午   2025.json
  20250314G1       2026-04-04  華江OB         莫拉克         中正A   上午   2025postseason.json
  20250215G1       2026-04-04  永春TB         台大經濟OB     中正A   中午   2025postseason.json

  🔄 補賽安排（1 場）
  gameNumber  原定日期    補賽日        場地   時段
  ────────────────────────────────────────────────
  2025047     2025-12-25  2025-12-27   中正A  上午
  （原 2025-12-25 雨延，本次公告排入補賽）

確認全部寫入？
```

若有衝突場次，列出後詢問是否略過並繼續：

```
  ⚠️ 衝突（1 場，略過）
  2025047 已存在且狀態為 scheduled，不像補賽，請確認場次號碼。
```

### Step 4：寫入並驗證

**一般賽季新增**（寫入 `YYYY.json`）：
```json
"2025098": {
  "date": "2025-12-06",
  "homeTeam": "陽明OB",
  "awayTeam": "Mechanics",
  "venue": "中正A",
  "timeSlot": "中午",
  "startTime": "12:00",
  "endTime": "14:30",
  "status": "scheduled",
  "homeScore": null,
  "awayScore": null,
  "sheetId": ""
}
```

**季後賽新增**（寫入 `YYYYpostseason.json`，gameNumber 完整保留）：
```json
"20250314G1": {
  "date": "2026-04-04",
  "homeTeam": "莫拉克",
  "awayTeam": "華江OB",
  "venue": "中正A",
  "timeSlot": "上午",
  "startTime": "08:00",
  "endTime": "11:00",
  "status": "scheduled",
  "homeScore": null,
  "awayScore": null,
  "sheetId": ""
}
```

**補賽新增**，只 append `rescheduledDates`，原有欄位不動：
```json
"2025047": {
  "date": "2025-12-25",
  "status": "rain",
  ...
  "rescheduledDates": [
    { "date": "2025-12-27", "venue": "中正A", "timeSlot": "上午", "startTime": "08:00", "endTime": "11:00" }
  ]
}
```

> 若補賽場地時間與原賽相同，可省略：`{ "date": "2025-12-27" }`

更新對應檔案的頂層 `lastUpdated` 為今天日期。

驗證 JSON（對每個修改的目標檔案個別驗證）：
```bash
python3 -m json.tool public/data/seasons/YYYY.json > /dev/null && echo "JSON 格式正確"
python3 -m json.tool public/data/seasons/YYYYpostseason.json > /dev/null && echo "JSON 格式正確"
```

### Step 5：詢問是否 commit

一般賽季：
```
chore: 新增 N 場賽程 (YYYY-MM)
```

季後賽：
```
chore: 新增 N 場季後賽賽程 (YYYY)
```

混合時分別說明：
```
chore: 新增 N 場賽程，含 M 場季後賽 (YYYY-MM)
```

---

## 單場模式

```
/add-game 2026/3/7 No.100 Line Drive VS 飛尼克斯--中正A--下午(14:30~17:00)
```

解析後顯示預覽：

```
即將新增比賽：
  gameNumber：2026100
  日期：2026-03-07
  客隊（先攻）：Line Drive
  主隊（後攻）：飛尼克斯
  場地：中正A / 下午（14:30–17:00）
  狀態：scheduled

確認新增？
```

補賽情境單場操作時，同樣顯示原定資料與補賽日對比後確認。

---

## 注意事項

- 新比賽 `status` 預設為 `scheduled`，`homeScore` / `awayScore` 為 `null`，`sheetId` 為 `""`
- **補賽場次不建立新 entry**，只 append `rescheduledDates`，比分、sheetId 等比賽完成後由 `/update-game` 填入
- `gameNumber` 在整個 `games` 物件中必須唯一（補賽不算重複）
- 公告中的備註說明行（如「1. 目前日落時間...」）自動略過
