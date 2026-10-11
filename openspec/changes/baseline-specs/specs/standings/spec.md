## ADDED Requirements

### Requirement: Points system
Each team's points SHALL be calculated as: `points = wins × 3 + draws × 1`. Losses contribute `0` points.

#### Scenario: Points calculation
- **WHEN** a team has `wins=3`, `draws=1`, `losses=2`
- **THEN** `points = 10`

##### Example: points table
| W | D | L | Points |
|---|---|---|--------|
| 3 | 1 | 2 | 10 |
| 0 | 0 | 5 | 0 |
| 2 | 2 | 0 | 8 |

### Requirement: Win rate calculation
Win rate SHALL be `wins / (wins + losses)`. Draws are excluded from both numerator and denominator. If `wins + losses = 0`, win rate SHALL be `0`.

#### Scenario: Draw excluded from win rate
- **WHEN** a team has `wins=2`, `draws=1`, `losses=2`
- **THEN** `winRate = 0.500` (2 out of 4 decisions)

### Requirement: Games behind calculation
Games Behind (GB) SHALL be `(leader.wins − team.wins + team.losses − leader.losses) / 2`. The leader's GB is `null`.

#### Scenario: GB for a trailing team
- **WHEN** the leader has `wins=5, losses=1` and the trailing team has `wins=3, losses=3`
- **THEN** `GB = (5 − 3 + 3 − 1) / 2 = 2.0`

### Requirement: Ranking sort order — primary
Teams SHALL be sorted primarily by points descending, then by win rate descending.

#### Scenario: Higher points ranks first
- **WHEN** team A has 12 points and team B has 9 points
- **THEN** team A SHALL be ranked 1, team B ranked 2

### Requirement: Tiebreaker — game-data mode (2026+)
When `SeasonData.standings.source !== "manual"` and game records are available, tied groups (same points AND same win rate) SHALL be resolved in this priority order:

1. Head-to-head points within the tied group (higher is better)
2. Head-to-head runs allowed within the tied group (lower is better)
3. Games Behind from the overall leader (lower is better)
4. Overall season runs allowed / `runsAllowed` field (lower is better)

Only finished games between teams within the tied group count for head-to-head stats.

#### Scenario: H2H points breaks tie
- **WHEN** teams A and B have equal points and win rate, but A beat B 2–1 in their head-to-head game
- **THEN** A's H2H points = 3, B's H2H points = 0, and A ranks above B

##### Example: tiebreaker priority
| Priority | Criterion | Direction |
|----------|-----------|-----------|
| 1 | H2H points among tied group | higher first |
| 2 | H2H runs allowed among tied group | lower first |
| 3 | Games Behind (GB) | lower first |
| 4 | Overall runsAllowed | lower first |

### Requirement: Tiebreaker — manual mode (2025 season)
When `SeasonData.standings.source === "manual"`, tied groups SHALL be resolved by `tiebreakRank` (lower integer ranks higher). If any team in the tied group lacks a `tiebreakRank`, the group order is preserved as-is (stable sort).

#### Scenario: tiebreakRank resolves tie
- **WHEN** teams A (tiebreakRank=1) and B (tiebreakRank=2) are tied
- **THEN** A ranks above B

#### Scenario: Partial tiebreakRank — no reorder
- **WHEN** one team in a tied group has no `tiebreakRank`
- **THEN** the group order is kept unchanged

### Requirement: Streak calculation
For each team, the streak SHALL be computed from the team's full history of finished games sorted by date ascending, scanning backwards from the most recent game until the result type changes.

- `type`: `"W"` (win), `"L"` (loss), or `"D"` (draw)
- `count`: number of consecutive identical results

Only games with `status === "finished"` and non-null scores are considered.

#### Scenario: Current streak
- **WHEN** a team's last 4 finished games were W, W, L, W (oldest to newest)
- **THEN** `streak = { type: "W", count: 1 }`

##### Example: streak scanning
| Game history (oldest → newest) | Streak |
|---------------------------------|--------|
| W, W, L, W | W1 |
| L, L, L | L3 |
| W, D, D | D2 |

### Requirement: Special tag "雨神同行"
A team SHALL receive the special tag `"雨神同行"` when its last 2 entries in the combined `(finished | rain)` game history are both `rain`. Scheduled and cancelled games are excluded from this history.

#### Scenario: Two consecutive rain games triggers tag
- **WHEN** a team's most recent 2 relevant games (finished or rain) both have `status: "rain"`
- **THEN** `calculateSpecialTags` SHALL include that team with tag `"雨神同行"`

#### Scenario: One rain game is not enough
- **WHEN** a team's history ends with `finished` then `rain`
- **THEN** the team SHALL NOT receive the special tag
