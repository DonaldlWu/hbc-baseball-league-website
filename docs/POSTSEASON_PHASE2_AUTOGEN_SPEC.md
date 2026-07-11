# Spec：四強雙敗淘汰（敗部復活）自動推導

> 📅 建立日期：2026-07-11
> 📌 狀態：待審核（spec only，尚未實作）
> 🔗 相關：`src/lib/postseasonLoader.ts`、`public/data/postseason/2025.json`

## 1. 背景與目標

`postseasonLoader.ts` 目前自動推導止於「四強勝部第一輪（top4-w1）」的隊伍配對，
且 top4-w1 的 stubs **未掛比賽結果**（`generateTop4W1Stubs` 產生 `games: []`，
未經 `enrichGeneratedMatchup` 處理）。top4-l1 之後的 rounds 完全沒有生成邏輯。

2025 賽季 R8 即將全部結束（僅剩 20250405G1，補賽 2026-07-18），
四強賽事最快 2026-07-25 開打。若不擴充，四強比賽結果寫入
`seasons/2025postseason.json` 後籤表頁**無法顯示**。

**目標：** phase2 全部 5 個 rounds（top4-w1 / top4-l1 / top4-w2 / top4-l2 /
top4-championship）的 matchups 皆由 loader 自動生成並掛上比賽結果，
資料維護方式維持不變 —— 每週只更新 `seasons/YYYYpostseason.json`。

## 2. 賽制規則（4 隊雙敗淘汰）

rounds 定義已存在於 `public/data/postseason/2025.json`，不需改資料：

| roundId | 名稱 | bestOf | 隊伍來源 |
|---------|------|--------|----------|
| top4-w1 | 四強勝部第一輪 | 1 | 2 組：R8 勝者依序配對（r8[0]勝 vs r8[1]勝、r8[2]勝 vs r8[3]勝） |
| top4-l1 | 四強敗部第一輪 | 1 | 1 組：w1 兩場的**敗者**互戰 |
| top4-w2 | 四強勝部決賽 | 1 | 1 組：w1 兩場的勝者互戰 |
| top4-l2 | 四強敗部決賽 | 1 | 1 組：l1 勝者 vs w2 **敗者**（敗部復活） |
| top4-championship | 總冠軍戰 | 2 | 1 組：w2 勝者（勝部）vs l2 勝者（敗部） |

**總冠軍戰優勢規則**（`winnersBracketAdvantage: true`，UI 已定案於
`ChampionshipCard.tsx:86`）：勝部隊**只需 1 勝**奪冠、敗部隊**需 2 勝**奪冠。

實作模型：沿用既有 byeGame 機制 —— championship matchup 的 `games[0]` 為
勝部隊（team1）的虛擬勝場（`byeGame: true, note: '勝部優勢'`），
`requiredWins = 2`，實際比賽最多 2 場。此模型與 R16/R8 的主場優勢
byeGame 完全同構，`calcMatchupResult` 不需修改。

## 3. 隊伍推導規則

每個 matchup 的 team1/team2 來源（沿用 `generateR8Stubs` 的 TBD 慣例，
來源 matchup 未完成時填 `TBD_ENTRY`）：

| roundId | team1 | team2 |
|---------|-------|-------|
| top4-w1[0] | r8[0] 勝者 | r8[1] 勝者 |
| top4-w1[1] | r8[2] 勝者 | r8[3] 勝者 |
| top4-l1[0] | w1[0] **敗者** | w1[1] **敗者** |
| top4-w2[0] | w1[0] 勝者 | w1[1] 勝者 |
| top4-l2[0] | w2[0] **敗者** | l1[0] 勝者 |
| top4-championship[0] | w2[0] 勝者（勝部） | l2[0] 勝者（敗部） |

新增「敗者」取法：`matchup.winner === 'team1' ? matchup.team2 : matchup.team1`，
winner 為 null 時 → TBD。

> team1/team2 順序即 UI 上下排序；championship 的 team1 必須是勝部隊
> （`ChampionshipCard` 以 `isWinnersTeam` 判斷樣式與標語）。

## 4. 比賽自動配對規則（關鍵設計）

沿用 `findScheduleGamesForMatchup` 的隊名比對，但有一個**既有邏輯不足以應付的情境**：

⚠️ **同兩隊在 phase2 可能交手兩次。** 例：A 在 w1 勝 B、B 從敗部殺回總冠軍戰，
A vs B 交手第二次。單純隊名比對會把 w1 那場也掛到 championship matchup 上。

**解法：按輪次順序、時間順序分配，累加排除集合。**

1. 依 rounds 順序處理（w1 → l1 → w2 → l2 → championship）
2. 每個 matchup 以隊名比對找出**尚未被分配**的場次，按 `date + startTime` 排序
3. 該 round `bestOf` 為 N → 最多取前 N 場（w1/l1/w2/l2 取 1 場，championship 取 2 場）
4. 取用後立即加入排除集合（初始值 = `getReferencedGameNumbers`，即 R16 明確登錄
   的場次；R8 自動配對的場次也須累加進去 —— 現況 R8 enrich 後未回填排除集合，
   需修正）

## 5. 程式變更清單

**`src/lib/postseasonLoader.ts`：**

1. 將 `generateR8Stubs` / `generateTop4W1Stubs` 重構為通用的
   `generateNextRoundStubs(sourceMatchups, pick, matchupIdPrefix, initialGames)`
   - `pick: 'winners' | 'losers' | 自訂選取函數`（l2 與 championship 的
     team1/team2 來源跨 round，需支援明確指定來源）
   - 符合 Rule of Three（第 3 個以上生成器出現，此時才抽象）
2. phase2 各 round `matchups.length === 0` 時依 §3 規則生成 stubs，
   並**全部**經 `enrichGeneratedMatchup` 掛比賽（修正 top4-w1 現況缺漏）
3. `enrichGeneratedMatchup` 增加「配對後回填排除集合」與「最多取 bestOf 場」（§4）
4. championship stub 的 `initialGames` 帶勝部 byeGame（§2）

**不變：**
- `calcGameWinner`、`calcMatchupResult` 介面與邏輯
- 兩張 JSON 的分工與格式（資料檔零變更）
- `getChampion()`（既有實作已讀 top4-championship matchup winner）

## 6. TDD 測試案例（`postseasonLoader.test.ts`）

1. **敗者推導**：w1 兩場完賽 → l1 team1/team2 = 兩敗者；w1 未完 → TBD
2. **敗部復活鏈**：l1 勝者 + w2 敗者 → l2；l2 勝者 → championship team2
3. **championship 優勢**：勝部隊贏 1 場 → `winner: 'team1'`、`status: completed`；
   敗部隊贏第 1 場 → `in_progress`（1:1，byeGame 抵銷）；敗部隊連贏 2 場 → 敗部奪冠
4. **重複交手分配**：A vs B 在 w1 與 championship 各一場（不同日期）→
   較早場次掛 w1、較晚掛 championship，不重複
5. **top4-w1 enrich 回歸**：w1 比賽寫入賽程檔後，w1 matchup 顯示比分與 winner
6. **R8 場次不重複掛載**：R8 自動配對過的場次不出現在 phase2 matchup
7. **全 TBD 情境**：R8 未完賽時 phase2 各 round 生成 TBD stubs 不 crash

## 7. UI 影響確認

- `FullPostseasonBracket` / `MatchupCard`：讀 enriched matchups，資料格式不變 → 無需改動（需人工目測確認版面）
- `ChampionshipCard`：已支援 `winnersBracketAdvantage`、勝部/敗部標語 → 無需改動

## 8. 未決問題（實作前需確認）

| # | 問題 | 影響 | 建議 |
|---|------|------|------|
| 1 | **bestOf 1 平手**怎麼辦？`calcGameWinner` 平手回傳 null，matchup 會卡在 `in_progress` | l1/w2/l2 各輪 | 確認聯盟延長賽／突破僵局規則；若可能加賽，§4 的「最多取 bestOf 場」需放寬為「取到分出勝負」 |
| 2 | w1 配對是否確定為 r8[0]勝 vs r8[1]勝、r8[2]勝 vs r8[3]勝（現行 `generateTop4W1Stubs` 邏輯）？聯盟可能依種子重新排序 | w1 起全部配對 | 7/25 賽程公告出來後核對實際對戰組合 |
| 3 | championship bestOf 2 若 1:1（敗部贏一場後平手或再輸）—— UI 標語規則下 1:1 即勝部奪冠，但 byeGame 模型會顯示 2:1 | 冠軍判定 | 模型上等價（勝部 byeGame+1 real win = 2 ≥ requiredWins），僅顯示用 team1Wins 需確認 UI 呈現方式 |

## 9. 驗收條件

- [ ] 7/18 R8 最後一戰結果寫入後，籤表頁自動顯示四強勝部第一輪對戰組合
- [ ] 四強各場結果只更新 `seasons/2025postseason.json` 即可正確顯示晉級與冠軍
- [ ] 測試案例 §6 全數通過，`postseasonLoader.ts` 覆蓋率維持 95%+
- [ ] `npm run build` + 既有測試全綠
