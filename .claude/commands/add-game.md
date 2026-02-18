新增比賽場次到賽季資料，支援貼上公告批量新增，自動偵測補賽情境。

## 使用方式

**批量模式（推薦）：** 直接貼上聯盟賽程公告全文，自動解析所有場次
**單場模式：** `/add-game [比賽資訊]`

```
/add-game                  # 批量：貼上公告全文
/add-game 2026/3/7 No.100 Line Drive VS 飛尼克斯--中正A--下午(14:30~17:00)  # 單場
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

**解析規則：**

| 欄位 | 來源 |
|------|------|
| date | 最近一個日期行，格式 `YYYY/M/D` → `YYYY-MM-DD` |
| gameNumber | `No.98` + 賽季前綴 → `2025098` |
| homeTeam | VS 前的隊伍 |
| awayTeam | VS 後的隊伍 |
| venue | `--場地--` 中間段，或日期下方的場地行 |
| timeSlot | 依實際開始時間判斷（見下表） |
| startTime / endTime | 括號內時間 |

**賽季年度判斷：**
讀取 `public/data/seasons/index.json`，依比賽日期找出所屬賽季。

**時段對應：**

| 開始時間 | timeSlot |
|---------|---------|
| 08:xx | 上午 |
| 10:30 / 11:00 / 12:00 | 中午 |
| 14:00 / 14:30 | 下午 |

> ⚠️ 公告標示的「上午/中午/下午」文字僅供參考，以**實際開始時間**判斷 timeSlot。
> 例如：「下午(12:00~14:30)」→ 實際開始 12:00 → timeSlot = 中午

略過非場次行（備註說明、空行、場地標題行等）。

### Step 2：偵測每場是否為補賽

讀取目標 `public/data/seasons/YYYY.json`，逐一檢查 gameNumber 是否已存在：

| 情況 | 處理方式 |
|------|---------|
| 不存在 | 一般新增 |
| 已存在，status 為 `rain` | 補賽情境 → append `rescheduledDates` |
| 已存在，status 非 `rain` | 標記衝突，不自動更新，請使用者確認 |

### Step 3：顯示摘要，一次確認

```
解析完成，共 5 場：

  ✅ 一般新增（4 場）
  gameNumber  日期        主隊           客隊           場地   時段
  ──────────────────────────────────────────────────────────────────
  2025098     2025-12-06  Mechanics      陽明OB         中正A  中午
  2025202     2025-12-06  ACES           飛尼克斯       中正A  下午
  2025106     2025-12-27  實踐OB         MIRACLE        中正A  中午
  2025207     2025-12-27  永春TB         少林棒球隊     清溪   中午

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

**一般新增**，新增 game entry，預設值：
```json
"2025098": {
  "date": "2025-12-06",
  "homeTeam": "Mechanics",
  "awayTeam": "陽明OB",
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

更新頂層 `lastUpdated` 為今天日期。

驗證 JSON：
```bash
python3 -m json.tool public/data/seasons/YYYY.json > /dev/null && echo "JSON 格式正確"
```

### Step 5：詢問是否 commit

```
chore: 新增 N 場賽程 (YYYY-MM)
```

若同時有補賽：
```
chore: 新增 N 場賽程，含 M 場補賽安排 (YYYY-MM)
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
  主隊：Line Drive vs 客隊：飛尼克斯
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
