更新比賽結果：填入比分、狀態、戰報連結。

## 使用方式

`/update-game [gameNumber]`

範例：
- `/update-game 202523` → 更新第 202523 場
- `/update-game` → 詢問使用者要更新哪場

## 執行步驟

### Step 1：找到比賽

若未提供 gameNumber，詢問使用者。

由 gameNumber 前四碼判斷賽季年度（例如 `202523` → 2025 賽季），讀取對應的 `public/data/seasons/YYYY.json`。

顯示該場比賽目前的資料給使用者確認：
```
找到比賽：
  日期：2026-01-10
  主隊：世新超乙組 vs 客隊：十號馬
  場地：三鶯A
  目前狀態：finished
  目前比分：null : null
  戰報：（無）
```

### Step 2：收集更新資料

詢問使用者要更新哪些欄位（可以只更新部分）：

| 欄位 | 說明 |
|------|------|
| `status` | `finished` / `rain` / `cancelled` / `scheduled` |
| `homeScore` | 主隊得分（整數，未填入為 null） |
| `awayScore` | 客隊得分（整數，未填入為 null） |
| `sheetId` | Google Sheet ID（從網址中複製 `/d/` 後的那段） |

若狀態為 `rain` 或 `cancelled`，比分保持 `null`，sheetId 保持 `""`。

### Step 3：更新並驗證

1. 編輯 `public/data/seasons/YYYY.json` 中對應的 game entry
2. 更新頂層 `lastUpdated` 為今天日期（ISO 8601 格式）
3. 驗證 JSON 格式：
   ```bash
   python3 -m json.tool public/data/seasons/YYYY.json > /dev/null && echo "JSON 格式正確"
   ```

### Step 4：摘要確認

顯示更新後的比賽資料，詢問是否 commit。

若確認，執行 git commit：
```
chore: 更新比賽 XXXX 結果 (主隊N:M客隊)
```

## 注意事項

- `homeScore: 0` 表示主隊真的 0 分，`null` 表示尚未填入，**意義不同**
- sheetId 只填 ID 部分，不填完整網址
  - 正確：`1dM8woBhSnNPms3YKPEptfw3o4F3neBWa-JrbRoW1iak`
  - 錯誤：`https://docs.google.com/spreadsheets/d/...`
- 比分填整數（`8`），不加引號（不是 `"8"`）
