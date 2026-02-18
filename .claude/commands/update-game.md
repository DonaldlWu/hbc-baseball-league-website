更新比賽結果：填入比分、狀態、戰報連結，自動偵測延賽情境。

## 使用方式

`/update-game [gameNumber]`

範例：
- `/update-game 202523` → 更新第 202523 場
- `/update-game` → 詢問使用者要更新哪場

## 執行步驟

### Step 1：找到比賽

若未提供 gameNumber，詢問使用者。

由 gameNumber 前四碼判斷賽季年度（例如 `202523` → 2025 賽季），讀取對應的 `public/data/seasons/YYYY.json`。

顯示該場比賽目前的資料給使用者確認，**包含延賽歷史**：

```
找到比賽：
  日期：2026-01-10（原定）
  主隊：世新超乙組 vs 客隊：十號馬
  場地：三鶯A
  目前狀態：rain
  延賽歷史：
    第 1 次補賽日：2026-03-21（又延賽）
  目前待補賽日：2026-03-21
  比分：null : null
  戰報：（無）
```

若無 `rescheduledDates`，顯示「延賽歷史：（無）」或不顯示此欄。

### Step 2：自動偵測情境

根據比賽資料自動判斷情境，**不需使用者手動說明**：

---

#### 情境 A：一般比賽（無 rescheduledDates）

適用：`rescheduledDates` 不存在或為空陣列。

詢問使用者要更新的內容：

| 欄位 | 說明 |
|------|------|
| `status` | `finished` / `rain` / `cancelled` / `scheduled` |
| `homeScore` | 主隊得分（整數，未填入為 null） |
| `awayScore` | 客隊得分（整數，未填入為 null） |
| `sheetId` | Google Sheet ID |

**若 status 更新為 `rain` 或 `cancelled`**：
- 比分保持 `null`，sheetId 保持 `""`
- 額外詢問：「是否已知補賽日期？」
  - 若有 → 建立 `rescheduledDates: ["YYYY-MM-DD"]`
  - 若無 → 不建立 `rescheduledDates`，留空等後續更新

---

#### 情境 B：已有延賽歷史，最新補賽日**又**延賽

適用條件：
- `rescheduledDates` 存在且非空
- 使用者表示最新的補賽日也被延賽

操作：
1. 詢問下一次補賽日期
2. 將新日期 **append** 到 `rescheduledDates` 陣列尾端
3. `status` 保持 `'rain'`，比分保持 `null`，sheetId 保持 `""`

---

#### 情境 C：已有延賽歷史，最新補賽日**完成比賽**

適用條件：
- `rescheduledDates` 存在且非空
- 使用者表示最新的補賽日已完成比賽

操作：
1. 更新 root `status` → `'finished'`（或 `'cancelled'`）
2. 填入 `homeScore`、`awayScore`、`sheetId`
3. `rescheduledDates` 陣列**不修改**（最後一筆已是正確的補賽日期）

---

#### 情境 D：補賽日期尚未確認，現在要填入

適用條件：
- `rescheduledDates` 不存在或為空
- `status` 已是 `'rain'`
- 使用者現在告知補賽日期

操作：
1. 建立或更新 `rescheduledDates: ["YYYY-MM-DD"]`
2. `status` 保持 `'rain'`

---

若情境不明確，直接詢問使用者：
```
這場比賽目前狀態為 rain，請問：
1. 填入最新補賽日的比賽結果（finished/cancelled）
2. 最新補賽日又延賽了，要新增下一個補賽日
3. 補充補賽日期（尚未填入）
4. 其他更新
```

### Step 3：更新並驗證

1. 編輯 `public/data/seasons/YYYY.json` 中對應的 game entry
2. 更新頂層 `lastUpdated` 為今天日期（ISO 8601 格式）
3. 驗證 JSON 格式：
   ```bash
   python3 -m json.tool public/data/seasons/YYYY.json > /dev/null && echo "JSON 格式正確"
   ```

### Step 4：摘要確認

顯示更新後的完整比賽資料（含 `rescheduledDates`），詢問是否 commit。

若確認，依情境選擇 commit message：

| 情境 | Commit message |
|------|----------------|
| 比賽結果 | `chore: 更新比賽 XXXX 結果 (主隊N:M客隊)` |
| 雨延補賽 | `chore: 比賽 XXXX 雨延，補賽日 YYYY-MM-DD` |
| 再次延賽 | `chore: 比賽 XXXX 補賽日再次延賽，新補賽日 YYYY-MM-DD` |
| 補賽結果 | `chore: 更新比賽 XXXX 補賽結果 (主隊N:M客隊)` |

## 注意事項

- `homeScore: 0` 表示主隊真的 0 分，`null` 表示尚未填入，**意義不同**
- sheetId 只填 ID 部分，不填完整網址
  - 正確：`1dM8woBhSnNPms3YKPEptfw3o4F3neBWa-JrbRoW1iak`
  - 錯誤：`https://docs.google.com/spreadsheets/d/...`
- 比分填整數（`8`），不加引號（不是 `"8"`）
- `rescheduledDates` 陣列語意：
  - 索引 0..n-2：失敗的補賽嘗試日（月曆顯示「雨延」）
  - 最後一筆：最終補賽日（月曆依 root `status` 顯示）
- **不要手動修改 `rescheduledDates` 中間的歷史紀錄**，只能 append 新日期
