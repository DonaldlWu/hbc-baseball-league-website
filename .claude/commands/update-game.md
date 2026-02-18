更新比賽結果：支援貼上聯盟週報批量更新，或單場互動更新。自動偵測延賽情境。

## 使用方式

**批量模式（推薦）：** 直接貼上聯盟戰報全文，自動解析所有場次
**單場模式：** `/update-game [gameNumber]`

```
/update-game 202523        # 更新單場
/update-game               # 互動式詢問
```

---

## 批量模式（聯盟戰報全文）

### 輸入範例

使用者貼上以下格式的週報：

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

### Step 1：解析週報

從文字中提取所有比賽結果，解析規則：

| 欄位 | 來源 |
|------|------|
| gameNumber | `No.2025147` → `2025147` |
| homeScore | 比分左側（主隊得分） |
| awayScore | 比分右側（客隊得分） |
| sheetId | Google Sheet URL 中 `/d/` 後的 ID |

> ⚠️ 若戰報連結不完整（如 `https://docs.google.com/....../1cPH7y-gcLVqLwtJK......`），sheetId 標記為「待補」，不填入，等使用者後續補充。

### Step 2：確認摘要

顯示解析結果，讓使用者一次確認：

```
解析完成，共 3 場：

  gameNumber  主隊          比分   客隊           sheetId
  ─────────────────────────────────────────────────────────
  2025147     甜心暴龍       1:19   Line Drive     ✅ 1mnB7Sa...
  2025030     台大經濟OB     3:21   木柵OB         ✅ 14Wfern...
  2025122     Mechanics     7:8    逆轉星球        ✅ 1Xy8-e0...

全部 status 更新為 finished。

確認寫入？
```

若有 sheetId 待補：

```
  2025098     Mechanics     6:14   陽明OB         ⚠️ 待補（連結不完整）
```

### Step 3：批量寫入

**一次** 讀取並修改所有涉及的賽季 JSON 檔案（可能橫跨 2025.json / 2026.json）。

每場更新：
- `status` → `finished`
- `homeScore` → 整數
- `awayScore` → 整數
- `sheetId` → ID 字串（待補的維持 `""`）

更新所有涉及賽季的頂層 `lastUpdated`。

驗證 JSON：
```bash
python3 -m json.tool public/data/seasons/YYYY.json > /dev/null && echo "JSON 格式正確"
```

### Step 4：確認並 commit

```
chore: 更新 N 場比賽結果 (YYYY-MM-DD 週報)
```

---

## 單場模式

### Step 1：找到比賽

由 gameNumber 前四碼判斷賽季年度，讀取對應的 `public/data/seasons/YYYY.json`。

顯示該場比賽目前的資料，**包含延賽歷史**：

```
找到比賽：
  日期：2026-01-10（原定）
  主隊：世新超乙組 vs 客隊：十號馬
  場地：三鶯A
  目前狀態：rain
  延賽歷史：
    第 1 次補賽日：2026-03-21 清溪 中午（又延賽）
  目前待補賽日：2026-03-21
  比分：null : null
  戰報：（無）
```

### Step 2：自動偵測情境

#### 情境 A：一般比賽（無 rescheduledDates）

詢問更新內容：

| 欄位 | 說明 |
|------|------|
| `status` | `finished` / `rain` / `cancelled` / `scheduled` |
| `homeScore` | 主隊得分（整數） |
| `awayScore` | 客隊得分（整數） |
| `sheetId` | Google Sheet ID |

**若 status 為 `rain` 或 `cancelled`**：比分保持 `null`，sheetId 保持 `""`，額外詢問是否已知補賽日期。

#### 情境 B：已有延賽歷史，最新補賽日又延賽

1. 詢問下一次補賽日期與場地時間
2. append 到 `rescheduledDates` 陣列尾端

#### 情境 C：已有延賽歷史，最新補賽日完成比賽

1. 更新 root `status` → `finished`（或 `cancelled`）
2. 填入 `homeScore`、`awayScore`、`sheetId`
3. `rescheduledDates` 陣列不動

#### 情境 D：補賽日期尚未確認，現在補填

1. 建立 `rescheduledDates: [{ date, venue, timeSlot, startTime, endTime }]`
2. `status` 保持 `rain`

若情境不明確，列出選項讓使用者選擇。

### Step 3：更新並驗證

1. 編輯 `public/data/seasons/YYYY.json`
2. 更新頂層 `lastUpdated`
3. 驗證 JSON 格式

### Step 4：摘要確認與 commit

| 情境 | Commit message |
|------|----------------|
| 比賽結果 | `chore: 更新比賽 XXXX 結果 (主隊N:M客隊)` |
| 雨延 | `chore: 比賽 XXXX 雨延，補賽日 YYYY-MM-DD` |
| 再次延賽 | `chore: 比賽 XXXX 補賽日再次延賽，新補賽日 YYYY-MM-DD` |
| 補賽結果 | `chore: 更新比賽 XXXX 補賽結果 (主隊N:M客隊)` |

---

## 注意事項

- `homeScore: 0` 表示主隊真的 0 分，`null` 表示尚未填入，**意義不同**
- sheetId 只填 ID 部分，不填完整網址
- 比分填整數（`8`），不加引號
- `rescheduledDates` 只能 append，不修改歷史記錄
- 戰報中若出現延賽公告（無比分、無戰報連結），**不在批量模式中處理**，另行使用單場模式更新 status
