# Skill 實戰操作範例

本文件以真實聯盟公告為範例，示範如何使用 `/add-game` 與 `/update-game` skill 完成常見的賽程資料更新作業。

---

## 目錄

1. [一般操作流程](#一般操作流程)
2. [新增賽程：收到賽程公告後](#新增賽程收到賽程公告後)
3. [更新結果：收到聯盟戰報後](#更新結果收到聯盟戰報後)
4. [處理延賽：收到延賽公告後](#處理延賽收到延賽公告後)
5. [補賽流程：延賽後安排補賽](#補賽流程延賽後安排補賽)
6. [多次延賽的處理](#多次延賽的處理)
7. [常見判斷技巧](#常見判斷技巧)

---

## 一般操作流程

每週從聯盟群組收到的訊息類型，對應使用的 skill：

| 訊息類型 | 使用 Skill |
|---------|-----------|
| 月賽程公告 | `/add-game` |
| 聯盟戰報（比賽結果） | `/update-game` |
| 延賽公告 | `/update-game`（標記 rain + 補賽日） |
| 補賽日確認通知 | `/update-game`（補充 rescheduledDates） |

---

## 新增賽程：收到賽程公告後

### 原始公告（聯盟十二月賽程公告-251127）

```
2025/12/6
中正A
No.98 Mechanics VS 陽明OB--中正A--中午(12:00~14:30)
No.202 ACES VS 飛尼克斯--中正A--下午(14:30~17:00)

2025/12/27
中正A
No.47 世新超乙組 VS 台大醫學院棒--中正A--上午(08:00~11:00)
No.106 實踐OB VS MIRACLE--中正A--中午(11:00~14:00)
No.32 HOLYBAT VS 陽明OB--中正A--下午(14:00~17:00)
清溪
No.207 永春TB VS 少林棒球隊--清溪--中午(12:00~14:30)
No.181 華江OB VS ACES--清溪--下午(14:30~17:00)
```

### 操作方式

直接將公告文字貼給 Claude，說明要新增賽程：

```
利用以下資訊幫我產生本月賽程資料：

2025/12/6
中正A
No.98 Mechanics VS 陽明OB--中正A--中午(12:00~14:30)
No.202 ACES VS 飛尼克斯--中正A--下午(14:30~17:00)
...（完整公告）
```

或逐場使用 `/add-game`：

```
/add-game 2025/12/6 No.98 Mechanics VS 陽明OB--中正A--中午(12:00~14:30)
```

### 解析規則說明

**gameNumber 格式**

公告中的 `No.98` → 系統儲存為 `2025098`（2025 賽季 + 三位場次號碼）

| 公告寫法 | 系統 gameNumber |
|---------|---------------|
| No.23 | 2025023 |
| No.98 | 2025098 |
| No.181 | 2025181 |
| No.202 | 2025202 |

**timeSlot 對應**

| 公告時間 | timeSlot | startTime | endTime |
|---------|---------|-----------|---------|
| 上午(08:00~11:00) | 上午 | 08:00 | 11:00 |
| 中午(11:00~14:00) | 中午 | 11:00 | 14:00 |
| 中午(12:00~14:30) | 中午 | 12:00 | 14:30 |
| 下午(14:00~17:00) | 下午 | 14:00 | 17:00 |
| 下午(14:30~17:00) | 下午 | 14:30 | 17:00 |

> ⚠️ **注意**：公告中偶爾出現「下午(12:00~14:30)」這種標示，實際時間是中午時段。以實際時間（12:xx 開始）判斷 `timeSlot` 為「中午」，公告標籤僅供參考。

### 新增後的 JSON 結果（以 12/6 為例）

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
},
"2025202": {
  "date": "2025-12-06",
  "homeTeam": "ACES",
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

---

## 更新結果：收到聯盟戰報後

### 原始公告（聯盟戰報-251220）

```
No.2025147  甜心暴龍  1:19  Line Drive  (Line Drive勝)
戰報連結
https://docs.google.com/spreadsheets/d/1mnB7SasgknR--XxuKYR2TED5x5pLU-EXqWjkzwnro1M

No.2025030  台大經濟OB  3:21  木柵OB  (木柵OB勝)
戰報連結
https://docs.google.com/spreadsheets/d/14Wfernibi419hnN6uGlsRMRtYhPWWjyzpvR-nEHn4Hc

No.2025122  Mechanics  7:8  逆轉星球  (逆轉星球勝)
戰報連結
https://docs.google.com/spreadsheets/d/1Xy8-e0YJfO89HgbmmeK-JMlArs0x8-hCjDPifLCKRm8
```

### 操作方式（批量模式）

直接將週報全文貼給 Claude，不需逐場操作：

```
/update-game

（貼上週報全文）
```

skill 自動解析所有場次，顯示摘要讓使用者一次確認：

```
解析完成，共 3 場：

  gameNumber  主隊           比分    客隊           sheetId
  ──────────────────────────────────────────────────────────
  2025147     甜心暴龍        1:19   Line Drive     ✅ 1mnB7Sa...
  2025030     台大經濟OB      3:21   木柵OB         ✅ 14Wfern...
  2025122     Mechanics      7:8    逆轉星球        ✅ 1Xy8-e0...

全部 status 更新為 finished。

確認寫入？
```

確認後一次寫入，一個 commit：
```
chore: 更新 3 場比賽結果 (2025-12-20 週報)
```

### 如何從比賽記錄判斷主客隊

JSON 中的 `homeTeam`（主隊）對應戰報格式的**左側隊伍**，`awayTeam`（客隊）對應**右側隊伍**：

```
甜心暴龍  1:19  Line Drive
  ↑                ↑
homeTeam         awayTeam
homeScore=1   awayScore=19
```

### 戰報連結不完整時

部分週報的連結會顯示為截斷格式（如 `https://docs.google.com/....../1cPH7y-gcLVqLwtJK......`），skill 無法取得完整 sheetId：

```
  2025098     Mechanics      6:14   陽明OB         ⚠️ 待補（連結不完整）
```

這類場次的 `sheetId` 暫時維持 `""`，之後取得完整連結再單獨執行一次 `/update-game 2025098` 補填。

### 更新後的 JSON 結果

```json
"2025147": {
  "date": "2025-12-20",
  "homeTeam": "甜心暴龍",
  "awayTeam": "Line Drive",
  "status": "finished",
  "homeScore": 1,
  "awayScore": 19,
  "sheetId": "1mnB7SasgknR--XxuKYR2TED5x5pLU-EXqWjkzwnro1M"
}
```

---

## 處理延賽：收到延賽公告後

### 原始公告（延賽公告-251225）

```
由於深夜開始下雨，目前雨勢還沒停歇。
聯盟這邊宣佈先宣布今日所有比賽延賽。
請各隊伍和主審不要到場。
```

12/25 排定的三場比賽全數延賽：
- No.209 莫拉克 VS 甜心暴龍（上午）→ gameNumber: `2025209`
- No.45 火把老鷹 VS DH戰將（中午）→ gameNumber: `2025045`
- No.84 飛尼克斯 VS 楚奧特（下午）→ gameNumber: `2025084`

### 操作方式

三場各執行一次 `/update-game`，若已知補賽日一併填入：

```
/update-game 2025209
```

skill 偵測到尚無 `rescheduledDates`，詢問後：
- status: `rain`
- 是否有補賽日：若尚未確認 → 不填；若已知 → 填入日期

**補賽日尚未確認時的 JSON：**

```json
"2025209": {
  "date": "2025-12-25",
  "homeTeam": "莫拉克",
  "awayTeam": "甜心暴龍",
  "status": "rain",
  "homeScore": null,
  "awayScore": null,
  "sheetId": ""
}
```

**補賽日確認後補填：**

補賽通常不會單獨公告，而是排入下個月的賽程公告中。直接把公告貼給 Claude 執行批次新增，`/add-game` 會自動偵測補賽場次（gameNumber 已存在且為雨延），並詢問確認後 append `rescheduledDates`。

若要手動補填（`/update-game`），skill 偵測情境 D，填入補賽日與場地：

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

> 補賽場地、時間若與原賽相同，可省略只填日期：
> `{ "date": "2026-02-01" }`

月曆效果：
- 12/25：顯示「雨延」（原定場地 中正A 上午）
- 2/1：顯示「待賽」（補賽場地 中正A 上午，等比賽結束後更新）

---

### 原始公告（延賽公告-251227）

```
緊急通知。剛剛5點40分時又開始下雨。目前雨勢頗大。
聯盟這邊宣佈早上第一場比賽延賽。請第一場的隊伍和主審先不要到場。
第二～三場比賽，最晚9點前公告。
```

12/27 中正A 排定：
- **上午**（第一場）No.47 世新超乙組 VS 台大醫學院棒 → **已確定延賽**
- **中午**（第二場）No.106 實踐OB VS MIRACLE → 9 點前公告
- **下午**（第三場）No.32 HOLYBAT VS 陽明OB → 9 點前公告

### 操作方式

**立即處理第一場（已確定延賽）：**

```
/update-game 2025047
```

- status: `rain`
- 補賽日：尚未確認，暫不填

**等待第二、三場公告後，若也延賽：**

```
/update-game 2025106
/update-game 2025032
```

若當天比賽如期進行，待戰報發出後再更新比分。

---

## 補賽流程：延賽後安排補賽

### 情境：12/25 延賽的比賽已確認補賽日

當聯盟通知「No.209 補賽日為 2/1」：

```
/update-game 2025209
```

skill 自動偵測：
- 現有 `status: rain`，無 `rescheduledDates` → **情境 D（補充補賽日）**
- 填入日期 `2026-02-01`

結果：`rescheduledDates: ["2026-02-01"]`

### 情境：補賽日比賽完成，填入結果

比賽在 2/1 完成，主隊 5:3 客隊，取得戰報連結：

```
/update-game 2025209
```

skill 顯示延賽歷史後，自動偵測：
- 有 `rescheduledDates: ["2026-02-01"]`，使用者表示已完成 → **情境 C（補賽完成）**

填入：
- status: `finished`
- homeScore: `5`
- awayScore: `3`
- sheetId: `（戰報 ID）`

最終 JSON：

```json
"2025209": {
  "date": "2025-12-25",
  "homeTeam": "莫拉克",
  "awayTeam": "甜心暴龍",
  "status": "finished",
  "homeScore": 5,
  "awayScore": 3,
  "sheetId": "1abc...",
  "rescheduledDates": [
    { "date": "2026-02-01", "venue": "中正A", "timeSlot": "上午", "startTime": "08:00", "endTime": "11:00" }
  ]
}
```

月曆效果：
- 12/25：顯示「雨延」（原定場地 中正A 上午）
- 2/1：顯示「已完賽 5:3」（補賽場地 中正A 上午）

---

## 多次延賽的處理

### 情境：補賽日當天又延賽

假設 12/25 延賽的 No.209，補賽日 2/1 當天又遇雨：

```
/update-game 2025209
```

skill 顯示：
```
找到比賽：
  日期：2025-12-25（原定）
  主隊：莫拉克 vs 客隊：甜心暴龍
  目前狀態：rain
  延賽歷史：
    第 1 次補賽日：2026-02-01（待賽）
```

情境不明確時，skill 詢問：
```
1. 填入最新補賽日的比賽結果（finished/cancelled）
2. 最新補賽日又延賽了，要新增下一個補賽日   ← 選這個
3. 補充補賽日期（尚未填入）
4. 其他更新
```

選 2，填入下一次補賽日（例如 3/15）：

最終 JSON：
```json
"2025209": {
  "date": "2025-12-25",
  "status": "rain",
  "homeScore": null,
  "awayScore": null,
  "sheetId": "",
  "rescheduledDates": [
    { "date": "2026-02-01", "venue": "中正A", "timeSlot": "上午", "startTime": "08:00", "endTime": "11:00" },
    { "date": "2026-03-15", "venue": "清溪", "timeSlot": "中午", "startTime": "12:00", "endTime": "14:30" }
  ]
}
```

月曆效果：
- 12/25：「雨延」（原定 中正A 上午）
- 2/1：「雨延」（補賽日又延賽，清溪 中午）
- 3/15：「待賽」（最新補賽日，清溪 中午）

> **`rescheduledDates` 陣列規則**：
> - 陣列最後一筆 = 最新補賽日（目前計畫比賽的日期）
> - 中間每筆 = 曾嘗試補賽但又延賽的日期
> - **只能 append 新物件，不修改歷史記錄**
> - 場地、時間若與原賽相同，對應欄位可省略

---

## 常見判斷技巧

### 判斷哪場是「第一場」

公告說「早上第一場延賽」時，對照當天賽程找時段最早的：

```
當天中正A賽程（12/27）：
  上午 08:00 → No.47（第一場）← 延賽
  中午 11:00 → No.106（第二場）← 待確認
  下午 14:00 → No.32（第三場）← 待確認
```

### 場地有多個時，各場地各自算順序

```
12/27 有兩個場地：
  中正A：上午第一場 No.47 → 延賽
  清溪：中午第一場 No.207 → 公告未提及，視為正常進行
```

### 戰報沒有 sheetId 時

部分早期戰報只有文字，無 Google Sheet 連結（如 251206 的兩場比賽 sheetId 只有部分）。這種情況：

```
/update-game 2025098
```

- status: `finished`
- homeScore: `6`
- awayScore: `14`
- sheetId: `（暫不填，等連結確認後再補）` → 填 `""`

後續取得連結時再次執行 `/update-game 2025098` 補填 sheetId。

### 確認公告中的主客隊

公告格式固定：**主隊 VS 客隊**，左側為主隊。

```
No.98 Mechanics VS 陽明OB
       ↑主隊          ↑客隊
homeTeam=Mechanics  awayTeam=陽明OB
```

戰報比分格式同樣：**主隊比分:客隊比分**

```
Mechanics  6:14  陽明OB
           ↑  ↑
    homeScore  awayScore
```

---

**建立日期**：2026-02-18
**適用 Skills**：`/add-game`、`/update-game`
