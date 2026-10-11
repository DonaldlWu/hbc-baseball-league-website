## Why

`openspec/specs/` 目前為空，導致每次提出 change proposal 都需重新解釋現有系統背景。建立 baseline specs 讓所有後續 change 能直接引用現況規格，而非每次從頭描述。

## What Changes

- 新增六個 spec 檔案，記錄現有六大功能域的規格與行為規則
- 建立 `openspec/LANGUAGE.md` 作為專案標準詞彙表
- 不修改任何原始碼

## Non-Goals

- 不提議任何功能改動
- 不修改現有資料格式或 API 行為
- 不包含投手統計（`PitchingStats` 存在但尚未有完整 UI，留待後續 change）

## Capabilities

### New Capabilities

- `player-stats`: 球員打擊統計展示、計算欄位、排序規則、出賽門檻過濾、PlayerModal 生涯資料
- `season-data`: 統一賽季資料結構（`SeasonData`）、賽季索引（`seasons/index.json`）、跨版本相容格式
- `schedule-calendar`: 月曆賽程展示、跨賽季月份對應、比賽狀態顯示（finished / rain / cancelled / scheduled）
- `standings`: 球隊戰績計算規則（積分制）、排名、勝差、連勝連敗、特殊標籤
- `postseason`: 季後賽制（雙敗淘汰 + 冠軍賽）、對戰圖資料格式、種子排名推導
- `game-reports`: 比賽戰報資料格式、API route、Google Sheets 來源整合

### Modified Capabilities

(none)

## Impact

- Affected specs: player-stats, season-data, schedule-calendar, standings, postseason, game-reports（全為新增）
- Affected code:
  - New: openspec/specs/player-stats/spec.md
  - New: openspec/specs/season-data/spec.md
  - New: openspec/specs/schedule-calendar/spec.md
  - New: openspec/specs/standings/spec.md
  - New: openspec/specs/postseason/spec.md
  - New: openspec/specs/game-reports/spec.md
  - New: openspec/LANGUAGE.md
