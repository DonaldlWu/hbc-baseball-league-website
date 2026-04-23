# Skills - 可用指令清單

本專案提供以下 Claude Code slash commands，用於常見的資料更新作業。

另外也提供對應的 Codex skills 版本，放在 `.codex/skills/`：

- `$hbc-add-game`
- `$hbc-update-game`
- `$hbc-update-player-data`
- `$hbc-update-standings`

在 Codex 中可直接用這類提示：

```text
使用 $hbc-add-game，依照以下公告新增賽程
使用 $hbc-update-game，根據以下週報更新比賽結果
使用 $hbc-update-player-data，從 data/raw/2026-02-07.csv 更新球員資料
使用 $hbc-update-standings，重算 2026 賽季戰績
```

> `.claude/commands/` 保留作為原始 Claude command 規格；`.codex/skills/` 是轉換後的 Codex skill 定義。

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

更新比賽結果，支援**批量模式**（貼上聯盟週報全文）與**單場模式**，自動偵測延賽情境。

```
/update-game               # 批量：貼上週報全文，自動解析所有場次
/update-game 202523        # 單場：指定場次互動更新
```

**批量模式**：解析週報中所有 `No.XXXXXXX 主隊 N:M 客隊` 與戰報連結，顯示摘要確認後一次寫入，一個 commit。

**單場模式**：顯示比賽資料（含延賽歷史），自動判斷情境：

| 情境 | 自動偵測條件 | 操作 |
|------|------------|------|
| 一般比賽 | 無 `rescheduledDates` | 收集 status / 比分 / sheetId |
| 雨延並安排補賽 | status 改為 `rain` | 額外詢問補賽日 → 寫入 `rescheduledDates` |
| 補賽日又延賽 | 已有 `rescheduledDates`，又延 | append 新補賽日到陣列 |
| 補賽完成 | 已有 `rescheduledDates`，已賽 | 更新 status + 比分（不動陣列） |
| 補充補賽日 | status 已是 `rain`，補填日期 | 寫入 `rescheduledDates` |

**sheetId 取得方式：**
```
https://docs.google.com/spreadsheets/d/【這段】/edit
```

---

### `/add-game`

新增預定比賽場次，支援**貼上公告全文批量新增**，自動偵測補賽情境。

```
/add-game                  # 批量：貼上月賽程公告全文
/add-game 2026/3/7 No.100 Line Drive VS 飛尼克斯--中正A--下午(14:30~17:00)  # 單場
```

解析所有 `No.XXX 主隊 VS 客隊--場地--時段(開始~結束)` 場次，自動偵測補賽（gameNumber 已存在且為雨延），顯示摘要確認後一次寫入，一個 commit。

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

- [Skill 實戰操作範例](docs/SKILL_USAGE_EXAMPLES.md) - 以真實聯盟公告示範新增賽程、更新結果、處理延賽的完整流程
- [賽季資料更新指南](docs/SEASON_DATA_UPDATE_GUIDE.md) - 完整欄位說明與手動更新情境
- [球員統計資料更新指南](docs/DATA_UPDATE_GUIDE.md) - CSV 轉換流程詳細說明
- [開發模式參考](docs/DEV_PATTERNS.md) - 程式碼範例與最佳實踐
