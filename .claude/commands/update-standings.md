更新賽季戰績排行。

## 使用方式

`/update-standings [賽季年度]`

範例：
- `/update-standings` → 自動偵測最新賽季
- `/update-standings 2025` → 指定更新 2025 賽季

## 執行步驟

### Step 1：確認目標賽季

若使用者未指定年度，讀取 `public/data/seasons/index.json` 找出最新賽季。
讀取對應的 `public/data/seasons/YYYY.json`，顯示目前 standings 給使用者確認。

### Step 2：收集更新資料

詢問使用者要更新哪支球隊的戰績，需要以下資訊：
- 球隊名稱（需與現有 `teamName` 完全一致）
- 勝場數（wins）
- 敗場數（losses）
- 和局場數（draws）
- 平均得分（runsScored，總得分 ÷ 已賽場數，保留三位小數）
- 平均失分（runsAllowed，總失分 ÷ 已賽場數，保留三位小數）

若使用者一次提供多支球隊，全部一起更新。

### Step 3：更新並驗證

1. 編輯 `public/data/seasons/YYYY.json`：
   - 找到對應球隊的 entry，更新數字
   - 依積分（勝×3 + 和×1）重新排序 `teams` 陣列
   - 更新頂層 `lastUpdated` 為今天日期（ISO 8601 格式）

2. 驗證 JSON 格式：
   ```bash
   python3 -m json.tool public/data/seasons/YYYY.json > /dev/null && echo "JSON 格式正確"
   ```

### Step 4：摘要確認

顯示所有變更的球隊，讓使用者確認無誤後詢問是否要 commit。

若使用者確認，執行 git commit：
```
chore: 更新 YYYY 賽季戰績排行 YYYY-MM-DD
```

## 注意事項

- `teamId` 與 `teamName` 不可更動
- 積分公式：勝×3 + 和×1（敗不計分）
- 同積分時，依均得分（runsScored）降序排列
- `runsScored` 和 `runsAllowed` 是**平均值**，非總和
- 數字用數字型別，不加引號（`16` 而非 `"16"`）
