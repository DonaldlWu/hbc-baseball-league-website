## ADDED Requirements

### Requirement: Calendar month to season mapping
The system SHALL map any calendar month (`YYYY-MM`) to the correct season year using the season index. The mapping rule: find the first `SeasonIndexEntry` where `entry.start <= target <= entry.end`. If no entry matches, fall back to the first season in the index.

#### Scenario: Month within a single season
- **WHEN** `findSeasonByMonth(index, 2025, 9)` is called and the 2025 entry spans 2025-04 to 2026-02
- **THEN** it SHALL return `2025`

#### Scenario: Cross-season month (no match)
- **WHEN** the target month falls before all index entries
- **THEN** the system SHALL return `index[0].season`

##### Example: season resolution table
| Calendar month | Matching entry | Returned season |
|----------------|---------------|-----------------|
| 2025-06 | 2025 (2025-04 to 2026-02) | 2025 |
| 2026-01 | 2025 (2025-04 to 2026-02) | 2025 |
| 2026-04 | 2026 (2026-03 to 2027-02) | 2026 |

### Requirement: Load games by calendar month
`loadGamesByCalendarMonth(calYear, calMonth)` SHALL return all games whose original date or any rescheduled date falls in the target calendar month, grouped as `DaySchedule[]` sorted by date ascending.

The function SHALL also load the season immediately preceding the matched season, to capture rain-rescheduled games whose final reschedule date falls outside the preceding season's declared `calendarRange`.

#### Scenario: Standard month load
- **WHEN** `loadGamesByCalendarMonth(2026, 1)` is called (January 2026 belongs to 2025 season)
- **THEN** the system SHALL fetch `/data/seasons/2025.json` and return DaySchedule[] for 2026-01

#### Scenario: Previous season loaded for overflow
- **WHEN** the matched season is the 2026 season (index position > 0)
- **THEN** `loadGamesByCalendarMonth` SHALL also fetch the 2025 season to catch any rain-makeup games that spilled past 2026-02

### Requirement: Rescheduled game calendar display
When a `SeasonGame` has a non-empty `rescheduledDates` array, its appearance on the calendar SHALL follow these rules:

- The original `SeasonGame.date` SHALL always be displayed with status `"rain"`, regardless of `SeasonGame.status`
- Each intermediate reschedule date (not the last) SHALL be displayed with status `"rain"`
- The final reschedule date SHALL be displayed with the game's actual `status`; if `SeasonGame.status === "rain"` (still pending), the final date shows as `"scheduled"`

#### Scenario: Game rained out twice, finally played
- **WHEN** a game has `date: "2026-01-10"`, `status: "finished"`, `rescheduledDates: [{date: "2026-01-17"}, {date: "2026-01-24"}]`
- **THEN** the calendar SHALL show:
  - `2026-01-10`: status `"rain"` (original date)
  - `2026-01-17`: status `"rain"` (intermediate reschedule)
  - `2026-01-24`: status `"finished"` (final reschedule, game played)

#### Scenario: Game still pending after one reschedule
- **WHEN** a game has `status: "rain"` and `rescheduledDates: [{date: "2026-02-07"}]`
- **THEN** the calendar SHALL show `2026-02-07` with status `"scheduled"`

### Requirement: DaySchedule grouping and ordering
The `DaySchedule[]` returned by the loader SHALL be:
- Sorted by `date` ascending (ISO 8601 string comparison)
- Within each day, `venues` is a map of venue name to `Game[]`
- Within each venue, games SHALL be sorted by `startTime` ascending

#### Scenario: Same-day multi-venue sorting
- **WHEN** a day has games at "中正A" starting 08:00 and "中正B" starting 09:00
- **THEN** both venues appear under the same date entry, each game ordered by startTime

### Requirement: Selected month persistence
`useSchedule` SHALL persist the currently selected calendar month in `sessionStorage` under the key `hbc:schedule:month` as a JSON object `{"year": N, "month": N}`. On initialization, it SHALL restore the persisted month; if no stored value or the store is unavailable (SSR), it SHALL default to the current calendar month.

#### Scenario: Persist selected month
- **WHEN** the user navigates to August 2026
- **THEN** `sessionStorage.getItem("hbc:schedule:month")` SHALL equal `'{"year":2026,"month":8}'`

#### Scenario: SSR fallback
- **WHEN** `useSchedule` initializes on the server (`typeof window === "undefined"`)
- **THEN** it SHALL default to the current calendar month without reading sessionStorage

### Requirement: Game status display mapping
The calendar UI SHALL map `GameStatusExtended` to display labels and visual styles:

| Status | Label | Colour hint |
|--------|-------|-------------|
| `finished` | 已完賽 | green |
| `scheduled` | 待比賽 | gray |
| `rain` | 雨延 | amber |
| `cancelled` | 取消 | red |

#### Scenario: Unknown status does not crash
- **WHEN** a game carries an unrecognised status string
- **THEN** the calendar SHALL render without throwing, falling back to a neutral style
