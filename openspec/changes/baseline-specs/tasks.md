## 1. 確認現有文件完整性

- [x] 1.1 [P] 驗證 `openspec/specs/player-stats/spec.md` 的計算公式與 `src/lib/statsCalculator.ts` 一致
- [x] 1.2 [P] 驗證 `openspec/specs/standings/spec.md` 的排序規則與 `src/lib/standingsCalculator.ts` 及 `docs/STANDINGS_RULES.md` 一致
- [x] 1.3 [P] 驗證 `openspec/specs/postseason/spec.md` 的自動推導規則與 `src/lib/postseasonLoader.ts` 及 `docs/POSTSEASON_PHASE2_AUTOGEN_SPEC.md` 一致
- [x] 1.4 [P] 驗證 `openspec/specs/season-data/spec.md` 的 gameNumber 格式與 `src/lib/formatters.ts` 中 `parseGameNumber` 實作一致
- [x] 1.5 [P] 驗證 `openspec/specs/schedule-calendar/spec.md` 的跨賽季邏輯與 `src/lib/seasonDataLoader.ts` 中 `loadGamesByCalendarMonth` 實作一致
- [x] 1.6 [P] 驗證 `openspec/specs/game-reports/spec.md` 的快取 header 值與 `src/lib/config.ts` 中 `CACHE_CONFIG` 實作一致

## 2. 建立詞彙表

- [x] 2.1 建立 `openspec/LANGUAGE.md`，收錄以下標準術語：gameNumber、SeasonData、standings、tiebreaker、bye game、seed、phase1/phase2、DaySchedule、sheetId。每個術語包含 definition、避免混用的近義詞 (avoid)、說明原因 (why)

## 3. 歸檔現有 docs/ 設計文件（選做）

- [x] 3.1 確認 `docs/STANDINGS_RULES.md` 內容已完整反映在 `openspec/specs/standings/spec.md` 後，在 docs 檔案頂部加入指向 spec 的參考連結
- [x] 3.2 確認 `docs/POSTSEASON_PHASE2_AUTOGEN_SPEC.md` 內容已完整反映在 `openspec/specs/postseason/spec.md` 後，在 docs 檔案頂部加入指向 spec 的參考連結
