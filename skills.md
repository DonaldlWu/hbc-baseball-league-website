# Skills - 可用指令清單

本專案提供以下 Claude Code slash commands，用於常見的資料更新作業。

---

## 資料更新指令

### `/update-standings [賽季年度]`

更新球隊戰績排行（勝/敗/和/均得/均失）。

```
/update-standings          # 自動偵測最新賽季
/update-standings 2025     # 指定賽季
```

會讀取現有 standings 給你確認，收集更新數字後寫入 `seasons/YYYY.json`，依積分自動排序，詢問是否 commit。

---

### `/update-game [gameNumber]`

更新比賽結果：填入比分、狀態、戰報 sheetId。

```
/update-game 202523        # 指定場次
/update-game               # 互動式詢問
```

顯示目前比賽資料後，逐步收集 `status`、`homeScore`、`awayScore`、`sheetId`，寫入後詢問是否 commit。

**sheetId 取得方式：**
```
https://docs.google.com/spreadsheets/d/【這段】/edit
```

---

### `/add-game`

新增預定比賽場次，支援批次輸入整月賽程。

```
/add-game
/add-game 2026/3/7 No.100 Line Drive VS 飛尼克斯--中正A--下午(14:30~17:00)
```

自動解析格式 `No.場次 主隊 VS 客隊--場地--時段(開始~結束)`，確認 gameNumber 不重複後寫入，詢問是否 commit。

---

### `/update-player-data [日期或路徑]`

CSV 球員統計完整更新流程。

```
/update-player-data                        # 互動式
/update-player-data 2026-02-07             # 使用 data/raw/2026-02-07.csv
/update-player-data ~/Downloads/stats.csv  # 指定路徑
```

自動執行：確認 CSV → 更新 symlink → `npm run convert-data` → 驗證結果 → 詢問是否 commit & push。

---

## 賽程文字解析（情境提示）

當使用者說「利用以下資訊幫我產生本月賽程資料」並貼上賽程文字時，解析並批次新增至 `public/data/seasons/YYYY.json`。

**輸入格式：**
```
2026/3/7
中正A
No.100 Line Drive VS 飛尼克斯--中正A--下午(14:30~17:00)
No.101 世新超乙組 VS 華江OB--中正A--中午(12:00~14:30)
```

**解析規則：**

| 項目 | 規則 |
|------|------|
| 日期 | `2026/3/7` → `"2026-03-07"` |
| gameNumber | 讀 `seasons/index.json` 確認賽季年度 + 場次號碼 |
| homeTeam | VS 前的隊伍 |
| awayTeam | VS 後的隊伍 |
| timeSlot | 08:xx→上午 / 10:30~12:xx→中午 / 14:xx→下午 |
| 無比賽備註 | 略過，不產生 game entry |

新比賽預設：`status: "scheduled"`、`homeScore: null`、`awayScore: null`、`sheetId: ""`。

執行完畢後驗證 JSON 格式並詢問是否 commit。

---

## 相關文件

- [賽季資料更新指南](docs/SEASON_DATA_UPDATE_GUIDE.md) - 完整欄位說明與手動更新情境
- [球員統計資料更新指南](docs/DATA_UPDATE_GUIDE.md) - CSV 轉換流程詳細說明
- [開發模式參考](docs/DEV_PATTERNS.md) - 程式碼範例與最佳實踐
