新增比賽場次到賽季資料，自動偵測補賽情境。

## 使用方式

`/add-game`

或直接提供比賽資訊：
`/add-game 2026/3/7 中正A No.100 Line Drive VS 飛尼克斯--中正A--下午(14:30~17:00)`

## 執行步驟

### Step 1：解析比賽資訊

若使用者直接提供賽程文字，解析以下欄位。
若未提供，逐一詢問。

**解析規則：**

```
No.100 Line Drive VS 飛尼克斯--中正A--下午(14:30~17:00)
  ↓
gameNumber: "2025100"  （賽季年度 + 場次號碼，賽季年度見下方）
homeTeam:   "Line Drive"   （VS 前的隊伍）
awayTeam:   "飛尼克斯"      （VS 後的隊伍）
venue:      "中正A"
timeSlot:   "下午"
startTime:  "14:30"
endTime:    "17:00"
```

**賽季年度判斷：**
讀取 `public/data/seasons/index.json`，依比賽日期找出所屬賽季。
例如：比賽在 2026-03-07，若 2026 賽季的 start 是 "2026-03"，則屬於 2026 賽季，gameNumber 前綴用 `2026`。

**時段對應：**
| 時間範圍 | timeSlot |
|----------|----------|
| 08:00 開始 | 上午 |
| 10:30 / 11:00 / 12:00 開始 | 中午 |
| 14:00 / 14:30 開始 | 下午 |

> ⚠️ 公告中偶爾標示「下午(12:00~14:30)」，以實際開始時間判斷 timeSlot（12:00 開始→中午），公告標籤僅供參考。

### Step 2：偵測是否為補賽

讀取目標 `public/data/seasons/YYYY.json`，檢查 `games` 中是否已存在相同的 gameNumber。

#### 情況 A：gameNumber 不存在 → 一般新增

繼續 Step 3（正常新增流程）。

#### 情況 B：gameNumber 已存在，且 status 為 `rain` → **補賽情境**

這場比賽之前因雨延賽，現在排入新月份的賽程，就是補賽安排。

顯示現有資料讓使用者確認：

```
⚠️ 比賽 2025209 已存在（狀態：雨延）

原定資料：
  日期：2025-12-25
  主隊：莫拉克 vs 客隊：甜心暴龍
  延賽歷史：（無）

即將新增為補賽日：
  日期：2026-02-01
  場地：中正A（原：中正A）
  時段：上午 08:00~11:00（原：上午 08:00~11:00）

這是補賽安排嗎？
```

若確認 → 將新日期 **append** 到 `rescheduledDates` 陣列，**不建立新 entry，不修改原有欄位**。

若取消 → 詢問使用者是否有正確的 gameNumber。

#### 情況 C：gameNumber 已存在，且 status **不是** `rain` → 衝突警告

```
⚠️ 比賽 2025209 已存在（狀態：finished / scheduled / cancelled）
   這不像是補賽安排，請確認場次號碼是否正確？
```

不自動更新，等使用者確認後再操作。

### Step 3：顯示預覽，請使用者確認

**一般新增：**
```
即將新增比賽：
  gameNumber：2025100
  日期：2026-03-07
  主隊：Line Drive vs 客隊：飛尼克斯
  場地：中正A
  時段：下午（14:30–17:00）
  狀態：scheduled

確認新增？
```

**補賽新增：**
```
即將更新補賽資料：
  gameNumber：2025209
  原定日期：2025-12-25（雨延）
  補賽日：2026-02-01
  場地：中正A
  時段：上午（08:00–11:00）

確認新增補賽日？
```

### Step 4：寫入並驗證

**一般新增**，新增 game entry：
```json
"2025100": {
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
```

**補賽新增**，只 append `rescheduledDates`，其餘欄位不動：
```json
"2025209": {
  "date": "2025-12-25",
  "homeTeam": "莫拉克",
  "awayTeam": "甜心暴龍",
  "status": "rain",
  "homeScore": null,
  "awayScore": null,
  "sheetId": "",
  "rescheduledDates": [
    { "date": "2026-02-01", "venue": "中正A", "timeSlot": "上午", "startTime": "08:00", "endTime": "11:00" }
  ]
}
```

> 場地、時間若與原賽相同，對應欄位可省略：
> `{ "date": "2026-02-01" }` — 月曆自動沿用原賽場地時間

> 若 `rescheduledDates` 已有值（再次補賽），繼續 append，不覆蓋：
> ```json
> "rescheduledDates": [
>   { "date": "2026-02-01", "venue": "中正A", "timeSlot": "上午", "startTime": "08:00", "endTime": "11:00" },
>   { "date": "2026-03-15", "venue": "清溪", "timeSlot": "中午", "startTime": "12:00", "endTime": "14:30" }
> ]
> ```

若使用者提供備註，加入 `"note"` 欄位（僅限一般新增）。

更新頂層 `lastUpdated` 為今天日期。

驗證 JSON：
```bash
python3 -m json.tool public/data/seasons/YYYY.json > /dev/null && echo "JSON 格式正確"
```

### Step 5：詢問是否 commit

依情況選擇 commit message：

| 情況 | Commit message |
|------|----------------|
| 一般新增 | `chore: 新增比賽 XXXX (主隊 vs 客隊 YYYY-MM-DD)` |
| 補賽安排 | `chore: 比賽 XXXX 補賽日安排 YYYY-MM-DD` |
| 多場一次 | `chore: 新增 N 場賽程 (YYYY-MM)` |

## 批次新增

若使用者提供整個月的賽程文字（多場），**逐一解析並執行補賽偵測**，最後一次 commit。

批次中若有補賽場次，在摘要中單獨標示：

```
解析完成，共 8 場：
  ✅ 新增 7 場（一般賽程）
  🔄 偵測到 1 場補賽：2025209（2025-12-25 雨延 → 補賽日 2026-02-01）

確認全部寫入？
```

## 注意事項

- 新比賽 `status` 預設為 `scheduled`
- 新比賽 `homeScore`、`awayScore` 預設為 `null`
- 新比賽 `sheetId` 預設為 `""`
- **補賽場次不建立新 entry**，只 append `rescheduledDates`，其他欄位（比分、sheetId）等比賽完成後由 `/update-game` 填入
- `gameNumber` 在整個 `games` 物件中必須唯一（補賽不算重複）
