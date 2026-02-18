新增比賽場次到賽季資料。

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

### Step 2：確認 gameNumber 不重複

讀取目標 `public/data/seasons/YYYY.json`，確認 `games` 中沒有相同的 gameNumber。
若有衝突，告知使用者並請確認正確的場次編號。

### Step 3：顯示預覽，請使用者確認

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

### Step 4：寫入並驗證

新增 game entry 到 `public/data/seasons/YYYY.json`，格式：
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

若使用者提供備註，加入 `"note"` 欄位。

更新頂層 `lastUpdated` 為今天日期。

驗證 JSON：
```bash
python3 -m json.tool public/data/seasons/YYYY.json > /dev/null && echo "JSON 格式正確"
```

### Step 5：詢問是否 commit

若確認，執行 git commit：
```
chore: 新增比賽 XXXX (主隊 vs 客隊 YYYY-MM-DD)
```

## 批次新增

若使用者提供整個月的賽程文字（多場），逐一解析後**一次全部新增**，最後一次 commit。

## 注意事項

- 新比賽 `status` 預設為 `scheduled`
- 新比賽 `homeScore`、`awayScore` 預設為 `null`
- 新比賽 `sheetId` 預設為 `""`
- `gameNumber` 在整個 `games` 物件中必須唯一
