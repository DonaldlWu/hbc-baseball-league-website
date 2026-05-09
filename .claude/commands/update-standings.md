更新賽季戰績排行。支援從比賽資料自動計算，或手動輸入兩種模式。

## 使用方式

`/update-standings [賽季年度]`

範例：
- `/update-standings` → 自動偵測最新賽季
- `/update-standings 2025` → 指定更新 2025 賽季

---

## 執行步驟

### Step 1：確認目標賽季

若使用者未指定年度，讀取 `public/data/seasons/index.json` 找出最新賽季。
讀取對應的 `public/data/seasons/YYYY.json`，顯示目前 standings 與已完賽場次數。

### Step 2：選擇更新模式

依下列條件決定預設模式：

| 情況 | 預設模式 |
|------|---------|
| `standings.source === "calculated"` | 自動計算（重新計算） |
| `standings.teams` 為空陣列 | 自動計算 |
| `standings.source === "manual"` 且 teams 非空 | 詢問使用者 |

**當 teams 非空時，詢問使用者：**
```
目前戰績資料來源：手動 (manual)，共 N 支球隊。
是否要改為從比賽資料自動計算？
(1) 自動計算（從 games 中 status=finished 的比賽計算）
(2) 手動輸入（沿用現有數據，逐一更新）
```

### Step 2A：自動計算模式

從 `games` 中篩選 `status === "finished"` 的比賽，計算所有出現過球隊的戰績。

**計算規則：**

對每支球隊，掃描所有 finished 比賽（包含主場與客場）：

- 主場（homeTeam）：得分 = homeScore，失分 = awayScore
- 客場（awayTeam）：得分 = awayScore，失分 = homeScore

勝負判斷：
- 得分 > 失分 → wins + 1
- 得分 < 失分 → losses + 1
- 得分 = 失分 → draws + 1

```
runsScored  = 總得分 ÷ 已賽場數（保留三位小數）
runsAllowed = 總失分 ÷ 已賽場數（保留三位小數）
```

**teamId 對應規則：**
1. 優先從現有 `standings.teams` 中比對 `teamName` 取得 `teamId`
2. 若無對應，以 teamName 前三個字作為 teamId（英文球隊取前三字母大寫）

顯示計算結果供使用者確認：

```
自動計算完成（共 N 場已完賽，涵蓋 M 支球隊）：

  球隊           勝  敗  和  積分  均得分   均失分
  ──────────────────────────────────────────────
  楚奧特          1   0   0    3   18.000   1.000
  十號馬          1   0   0    3    8.000   4.000
  Line Drive     1   0   0    3    9.000   8.000
  少林棒球隊      0   1   0    0    4.000   8.000
  逆轉星球        0   1   0    0    8.000   9.000
  櫻砲魂         0   1   0    0    1.000  18.000

standings.source 將設為 "calculated"。

確認寫入？
```

### Step 2B：手動輸入模式

詢問使用者要更新哪支球隊的戰績，需要以下資訊：
- 球隊名稱（需與現有 `teamName` 完全一致）
- 勝場數（wins）
- 敗場數（losses）
- 和局場數（draws）
- 平均得分（runsScored，總得分 ÷ 已賽場數，保留三位小數）
- 平均失分（runsAllowed，總失分 ÷ 已賽場數，保留三位小數）

若使用者一次提供多支球隊，全部一起更新。
`standings.source` 保持 `"manual"`。

### Step 3：更新並驗證

1. 編輯 `public/data/seasons/YYYY.json`：
   - 更新 `standings.teams` 陣列
     - 自動計算：完整替換整個 teams 陣列；替換前套用 `standings.adjustments`（若存在且非空）：
       - 對每個 adjustment entry，找到 `teamName` 對應球隊
       - 若不存在則建立（wins/losses/draws/runsScored/runsAllowed 均為 0）
       - 套用 `delta.wins / delta.losses / delta.draws`（僅套用有提供的欄位）
       - ⚠️ 套用後 wins/losses/draws 不得為負數，若為負則強制設為 0
       - `standings.adjustments` 欄位本身**不修改**，原封不動保留
     - 手動：只更新使用者指定的球隊，其餘保留不動
   - 更新 `standings.source`
     - 自動計算 → `"calculated"`
     - 手動 → `"manual"`
   - 依積分（勝×3 + 和×1）重新排序 `teams` 陣列，同積分依 runsScored 降序
   - 更新頂層 `lastUpdated` 為今天日期（ISO 8601 格式）

2. 驗證 JSON 格式：
   ```bash
   python3 -m json.tool public/data/seasons/YYYY.json > /dev/null && echo "JSON 格式正確"
   ```

### Step 4：摘要確認

顯示所有變更，讓使用者確認無誤後詢問是否要 commit。

若使用者確認，執行 git commit：
- 自動計算：`chore: 自動計算 YYYY 賽季戰績排行 YYYY-MM-DD`
- 手動更新：`chore: 更新 YYYY 賽季戰績排行 YYYY-MM-DD`

---

## 注意事項

- `teamId` 與 `teamName` 不可更動（手動模式）；自動計算若找不到現有 teamId，以 teamName 前三字元作為 teamId
- 積分公式：勝×3 + 和×1（敗不計分）
- 同積分時，依 runsScored（均得分）降序排列
- `runsScored` 和 `runsAllowed` 是**平均值**，非總和
- 數字用數字型別，不加引號（`16` 而非 `"16"`）
- 雨延（rain）和取消（cancelled）比賽**不計入**自動計算
- 自動計算只包含至少出現在一場 finished 比賽中的球隊
