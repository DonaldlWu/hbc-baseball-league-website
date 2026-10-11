## ADDED Requirements

### Requirement: Batting stat fields
`PlayerSummary.seasonStats` SHALL expose the following raw batting fields sourced from `YYYY_summary.json`: `games`, `pa`, `ab`, `hits`, `singles`, `doubles`, `triples`, `hr`, `rbi`, `runs`, `bb`, `so`, `sb`, `sf`, `totalBases`.

#### Scenario: All raw fields present
- **WHEN** a `PlayerSummary` is loaded for a player who participated in the season
- **THEN** all 15 raw batting fields SHALL be non-negative integers

### Requirement: Calculated batting rates
The system SHALL compute derived rate statistics from raw batting data using the following formulas. All rate stats SHALL return `0` when the denominator is `0`.

- `avg` = `hits / ab`
- `obp` = `(hits + bb) / (ab + bb + sf)` — HBP is excluded; no HBP data is collected
- `slg` = `totalBases / ab`
- `ops` = `obp + slg`
- `iso` = `slg - avg`
- `babip` = `(hits - hr) / (ab - so - hr + sf)`
- `kPct` = `(so / pa) × 100`
- `bbPct` = `(bb / pa) × 100`

#### Scenario: Standard calculation
- **WHEN** a player has `ab=30`, `hits=10`, `bb=4`, `sf=1`, `hr=1`, `so=6`, `totalBases=14`, `pa=35`
- **THEN** `avg ≈ 0.333`, `obp ≈ 0.400`, `slg ≈ 0.467`, `ops ≈ 0.867`, `iso ≈ 0.133`

#### Scenario: Zero denominator guard
- **WHEN** a player has `ab=0` and `pa=0`
- **THEN** `avg`, `obp`, `slg`, `ops`, `iso`, `babip`, `kPct`, `bbPct` SHALL all equal `0`

##### Example: OBP formula excludes HBP
| Stat | Formula | Note |
|------|---------|------|
| OBP | (H + BB) / (AB + BB + SF) | HBP omitted — data not collected |
| SLG | TB / AB | |
| BABIP | (H - HR) / (AB - SO - HR + SF) | |

### Requirement: Weighted advanced statistics
The system SHALL compute `wOBA`, `wRC`, `wRC+`, and `OPS+` when a `LeagueStats` object is available. All four SHALL return `null` when `pa = 0` or when no `LeagueStats` is supplied.

- `wOBA` = `(wBB×BB + w1B×1B + w2B×2B + w3B×3B + wHR×HR) / PA`
- `wRC` = `((wOBA − lgwOBA) / wOBAScale) × PA`
- `wRC+` = `((wRC / PA) / lgRunsPerPA) × 100`
- `OPS+` = `100 × (OBP / lgOBP + SLG / lgSLG − 1)`

#### Scenario: Weighted stats require league context
- **WHEN** no `LeagueStats` is passed to `calculateAllStats`
- **THEN** `wOBA`, `wRC`, `wRC+`, `OPS+` SHALL all be `null`

#### Scenario: OPS+ requires non-zero league averages
- **WHEN** `LeagueStats.avgOBP = 0` or `LeagueStats.avgSLG = 0`
- **THEN** `OPS+` SHALL return `null`

### Requirement: Player list sorting
The system SHALL sort a `PlayerSummary[]` by any `SortableStatField`. The default sort direction for all currently supported fields is descending.

Supported sort fields: `games`, `pa`, `avg`, `hits`, `hr`, `rbi`, `ops`, `obp`.

Sort is applied in-place by replacing the array with a sorted copy; the source data in the data loader cache is not mutated.

#### Scenario: Sort descending by avg
- **WHEN** `sortPlayers(players, 'avg', 'desc')` is called
- **THEN** players SHALL be ordered from highest `avg` to lowest

#### Scenario: Sort ascending supported
- **WHEN** `sortPlayers(players, 'avg', 'asc')` is called
- **THEN** players SHALL be ordered from lowest `avg` to highest

#### Scenario: Missing stat treated as zero
- **WHEN** a player's `seasonStats[field]` is `undefined` or `null`
- **THEN** it SHALL be treated as `0` for comparison purposes

### Requirement: Minimum games filter
The team page (`/teams/[teamId]`) SHALL expose a `minGames` state (default `0`) that hides players with `seasonStats.games < minGames` from the displayed list. The filter is applied after sorting. No minimum PA threshold is enforced by default.

#### Scenario: Filter excludes zero-game players when minGames > 0
- **WHEN** `minGames = 1` and a player has `games = 0`
- **THEN** that player SHALL NOT appear in the rendered list

### Requirement: PlayerModal career detail
Clicking a player in the team page or player list SHALL open a `PlayerModal` that loads full career data from `/data/players/{code}.json`. The modal SHALL display stats for each season the player participated in, including team name, year, and all batting fields.

#### Scenario: Modal loads on click
- **WHEN** a user clicks a `PlayerCard`
- **THEN** the system SHALL fetch `/data/players/{code}.json` and render the modal with career seasons sorted newest-first

#### Scenario: Modal loading state
- **WHEN** the player detail fetch is in progress
- **THEN** the modal SHALL display a loading indicator

### Requirement: Percentile rank display
The system SHALL compute a percentile rank (0–100) indicating what percentage of comparison players a given value beats. Higher-is-better fields (e.g., `avg`, `ops`) use ascending comparison; lower-is-better fields (e.g., `kPct`) use descending comparison.

#### Scenario: Percentile rank calculation
- **WHEN** a player's `avg = 0.350` and league values are `[0.200, 0.300, 0.350, 0.400]`
- **THEN** `calculatePercentileRank(0.350, allValues, true)` SHALL return `50` (beats 2 out of 4)
