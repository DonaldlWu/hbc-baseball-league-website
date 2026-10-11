# HBC Baseball League — Canonical Vocabulary

This file is the project's shared vocabulary. All specs, design docs, and code comments SHOULD use the canonical terms listed here.

Each entry includes:
- **definition**: what the term means in this codebase
- **avoid**: near-synonyms that cause ambiguity or collide with other domain concepts
- **why**: the reason the distinction matters

---

## gameNumber

**Definition**: The unique string identifier for a game. Regular-season format: `YYYYNNN` (4-digit year + 3-digit zero-padded game sequence number, e.g., `"2026018"`). Postseason format: `YYYY{MMDD}G{N}` (date + game index, e.g., `"20250413G1"`). Used as the key in `SeasonData.games` and as a path parameter in the API route `/api/game-reports/[gameNumber]`.

**Avoid**: `gameId`, `game_id`, `比賽編號`

**Why**: `gameNumber` is the exact field name in TypeScript types and the API route parameter. Using `gameId` or other variants breaks grep-based navigation and causes confusion with database-style IDs.

---

## SeasonData

**Definition**: The TypeScript interface (and corresponding JSON file at `/data/seasons/{year}.json`) that holds all data for one season: standings, team records, and a `games` map keyed by `gameNumber`. The primary data source for standings, schedule calendar, and game report lookups.

**Avoid**: `season JSON`, `seasonJson`, `赛季档案`

**Why**: `SeasonData` is the exact TypeScript type name exported from `src/types/index.ts`. Using informal alternatives makes type-level searches unreliable.

---

## standings

**Definition**: The ranked table of team win-loss-draw records and points for a given season. Computed by `calculateStandings()` from `TeamRecordRaw[]`, sorted by points then win-rate. Stored under `SeasonData.standings`.

**Avoid**: `leaderboard` (use for player stat rankings only), `rankings` (refers to player stat rankings in this codebase, not team records)

**Why**: `standings` and `rankings` refer to different pages and data layers. The team win-loss page is `/standings`; the player stats page is `/rankings`. Mixing the terms causes confusion about which data source and calculation logic applies.

---

## tiebreaker

**Definition**: The ordered rule set used to resolve equal-ranked teams within a standings group (same points + win-rate). For auto-calculated seasons: H2H points → H2H runs-allowed → games-behind → overall runs-allowed. For manual seasons: the `tiebreakRank` field on each `TeamRecordRaw`.

**Avoid**: `tie-break` (hyphenated), `tiebreak` (no suffix), `並列規則`

**Why**: `tiebreakRank` is the existing field name in `TeamRecordRaw`. Consistent casing (camelCase, no hyphen) ensures code searches work. The plural noun "tiebreaker" refers to the rule, while `tiebreakRank` is the data field.

---

## bye game

**Definition**: A placeholder game in a postseason matchup where team1 automatically wins without playing. Used in the `top4-championship` round to give the winners-bracket team a 1-0 head start. Represented as `{ byeGame: true }` on a `PostseasonGame` entry.

**Avoid**: `auto win`, `walkover`, `輪空`, `free win`

**Why**: `byeGame` is the exact boolean field name in the `PostseasonGame` type. Using other terms obscures the connection to the data model.

---

## seed

**Definition**: A team's regular-season rank used to determine its bracket position at the start of the postseason. Stored as `regularSeasonRank` in `PostseasonTeamEntry`. Seeds 1–8 participate in R16; top 4 seeds advance to Phase 2.

**Avoid**: `seeding` (the verb/process), `種子隊`, `bracket rank`

**Why**: "seed" is the universal sports term for bracket position. It maps directly to `regularSeasonRank`, not to any other rank computed during the postseason itself.

---

## phase1 / phase2

**Definition**: The two phases of the postseason bracket. `phase1` contains rounds `r16` (R16) and `r8` (R8, quarter-finals). `phase2` contains the top-4 double-elimination rounds: `top4-w1`, `top4-l1`, `top4-w2`, `top4-l2`, `top4-championship`. The `phase` field on each `PostseasonRound` holds the literal values `"phase1"` or `"phase2"`.

**Avoid**: `round 1 / round 2` (ambiguous — "round" also refers to individual rounds within a phase), `初賽/決賽` (too informal for spec use)

**Why**: `phase` is the exact field name in `PostseasonRound`. The values `"phase1"` and `"phase2"` appear in JSON and are used in loader logic to identify which auto-generation rules apply.

---

## DaySchedule

**Definition**: The TypeScript type that groups games for a single calendar date: `{ date: string; venues: Record<string, Game[]> }`. Returned by `loadGamesByCalendarMonth()` and `loadPostseasonSchedule()` for display in `ScheduleCalendar`.

**Avoid**: `schedule entry`, `day entry`, `日曆資料`, `CalendarDay`

**Why**: `DaySchedule` is the exported TypeScript type name. It is distinct from `SeasonGame` (raw game data) and `Game` (calendar-display game shape).

---

## sheetId

**Definition**: The Google Sheets spreadsheet ID stored in `SeasonGame.sheetId`. Used by the `/api/game-reports/[gameNumber]` route to fetch CSV data from Google Sheets via the `gviz/tq` endpoint. An empty string (`""`) means no report is available.

**Avoid**: `spreadsheetId`, `google sheet ID`, `reportId`, `sheetID` (wrong casing)

**Why**: `sheetId` is the exact field name in `SeasonGame`. The casing (`sheetId`, not `sheetID`) matches the TypeScript convention used throughout the codebase.
