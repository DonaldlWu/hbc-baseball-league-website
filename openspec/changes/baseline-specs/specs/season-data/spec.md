## ADDED Requirements

### Requirement: Unified season data file
Each season's data SHALL reside in a single JSON file at `/data/seasons/{year}.json` conforming to the `SeasonData` interface. The file SHALL contain `season` (integer year), `lastUpdated` (ISO 8601), `standings` (team records), and `games` (all season games keyed by `gameNumber`).

#### Scenario: Load season data
- **WHEN** `loadSeasonData(2026)` is called
- **THEN** the system SHALL fetch `/data/seasons/2026.json` and return a `SeasonData` object

#### Scenario: Non-existent season
- **WHEN** `loadSeasonData` receives a year for which no file exists
- **THEN** the function SHALL throw an `Error` with a message containing the HTTP status code

### Requirement: Game number format
A `gameNumber` SHALL be a string encoding both the season year and the game sequence.

- Regular season: `YYYYNNN` where `YYYY` is the 4-digit season year and `NNN` is a 3-digit zero-padded sequence (e.g., `"2025201"` = 2025 season, game 201)
- Postseason: `YYYY{MMDD}G{N}` where `MMDD` is the date and `N` is the game index within that day (e.g., `"20250413G1"` = 2025 season, April 13, game 1)

`parseGameNumber` SHALL extract the season year from the first 4 characters.

#### Scenario: Regular season game number
- **WHEN** `parseGameNumber("2026103")` is called
- **THEN** it SHALL return `{ season: 2026, number: 103, isPostseason: false }`

#### Scenario: Postseason game number
- **WHEN** `parseGameNumber("20250413G2")` is called
- **THEN** it SHALL return `{ season: 2025, isPostseason: true, matchupCode: "0413", gameSeq: 2 }`

### Requirement: SeasonGame record
Each `SeasonGame` entry in `SeasonData.games` SHALL include: `date` (ISO 8601), `homeTeam`, `awayTeam`, `venue`, `timeSlot`, `startTime`, `endTime`, `status` (`finished | scheduled | rain | cancelled`), `homeScore` (number or null), `awayScore` (number or null), and `sheetId` (empty string if no report).

#### Scenario: Unplayed game
- **WHEN** a game has `status: "scheduled"`
- **THEN** `homeScore` and `awayScore` SHALL both be `null`

#### Scenario: Finished game
- **WHEN** a game has `status: "finished"`
- **THEN** `homeScore` and `awayScore` SHALL both be non-null integers

### Requirement: Rescheduled game entries
When a game is rained out and rescheduled, the `SeasonGame` SHALL carry a `rescheduledDates` array. Each entry represents one reschedule attempt in chronological order. The last entry is the final reschedule date. Entries before the last represent failed reschedule attempts.

#### Scenario: Multi-reschedule record
- **WHEN** game `"2026073"` was rained out on its original date, rained out again on first reschedule, and finally played on the second reschedule
- **THEN** `rescheduledDates.length === 2`, `rescheduledDates[0]` is the first (failed) reschedule, `rescheduledDates[1]` is the final completed date

### Requirement: Standings source field
`SeasonData.standings.source` SHALL be one of: `"manual"` (hand-entered W/L/D, tiebreakers use `tiebreakRank`), `"partial"` (partially calculated), or `"calculated"` (fully derived from game results). The standings calculator uses this field to determine the tiebreaker strategy.

#### Scenario: Manual source skips game-based tiebreak
- **WHEN** `standings.source === "manual"`
- **THEN** `loadStandingsFromSeason` SHALL NOT pass `games` to `calculateStandings`, falling back to `tiebreakRank`

### Requirement: Season index file
`/data/seasons/index.json` SHALL contain an array of `SeasonIndexEntry` objects, each with `season` (integer), `start` (first calendar month, `"YYYY-MM"`), and `end` (last calendar month, `"YYYY-MM"`). An optional `file` field overrides the JSON filename (e.g., `"2025postseason"` maps to `/data/seasons/2025postseason.json`).

The index is loaded once per browser session and cached at module level in `seasonDataLoader.ts`.

#### Scenario: Season spanning calendar years
- **WHEN** the 2025 season runs April 2025 through February 2026
- **THEN** its index entry SHALL be `{ season: 2025, start: "2025-04", end: "2026-02" }`

#### Scenario: Index cache hit
- **WHEN** `loadSeasonIndex()` is called a second time in the same module session
- **THEN** it SHALL return the cached result without issuing a network request

### Requirement: Postseason schedule data
Postseason game schedules SHALL reside in a separate file `/data/seasons/{year}postseason.json`, using the same `SeasonData` structure. This file is referenced via a `SeasonIndexEntry` with `file: "{year}postseason"`.

#### Scenario: Load postseason schedule
- **WHEN** `loadPostseasonScheduleData(2025)` is called
- **THEN** the system SHALL fetch `/data/seasons/2025postseason.json`
