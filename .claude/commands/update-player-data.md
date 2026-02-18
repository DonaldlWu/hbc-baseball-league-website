更新球員統計資料：從 CSV 轉換並產生 JSON。

## 使用方式

`/update-player-data [CSV檔案路徑或日期]`

範例：
- `/update-player-data` → 互動式詢問路徑
- `/update-player-data 2026-02-07` → 使用 `data/raw/2026-02-07.csv`
- `/update-player-data ~/Downloads/球員統計.csv` → 指定完整路徑

## 執行步驟

### Step 1：確認 CSV 檔案

若使用者提供日期（如 `2026-02-07`），CSV 路徑為 `data/raw/2026-02-07.csv`。
若使用者提供完整路徑，確認檔案存在。
若未提供，詢問使用者。

確認檔案存在後，顯示基本資訊：
```bash
ls -lh <csv_path>
```

### Step 2：放置 CSV（若需要）

若 CSV 不在 `data/raw/` 目錄下，提示使用者複製：
```bash
cp <來源路徑> data/raw/YYYY-MM-DD.csv
```

### Step 3：更新 data.csv 符號連結

```bash
ln -sf YYYY-MM-DD.csv data/raw/data.csv
```

確認連結更新：
```bash
ls -la data/raw/data.csv
```

### Step 4：執行資料轉換

```bash
npm run convert-data
```

顯示轉換輸出，確認：
- 讀取筆數正常（應 > 3000）
- 無錯誤訊息
- 轉換完成訊息

若轉換失敗，顯示錯誤並停止，提示使用者檢查 CSV 格式。

### Step 5：驗證結果

```bash
git status
```

顯示被修改的檔案數量。

選擇性驗證（若使用者想確認）：
```bash
python3 -m json.tool public/data/seasons/2026_summary.json > /dev/null && echo "格式正確"
```

### Step 6：詢問是否 commit

顯示變更摘要，詢問是否提交。

若確認，staging 並 commit：
```bash
git add data/raw/ public/data/
git commit -m "chore: 更新球員數據 YYYY-MM-DD"
```

詢問是否要 `git push`。

## 注意事項

- CSV 必須是 **UTF-8** 編碼
- 第 1 行：聯盟統計（會被跳過）
- 第 2 行：欄位標題
- 第 3 行起：球員資料
- 若轉換後球員數量明顯減少，先不要 commit，請使用者確認 CSV 格式

## 常見問題快速排查

| 錯誤訊息 | 解決方法 |
|----------|----------|
| `Cannot find module 'csv-parse'` | 執行 `npm install` |
| `ENOENT: no such file or directory 'data/raw/data.csv'` | 確認符號連結存在 |
| 轉換後球員數量少 | 檢查 CSV 編碼與格式 |
