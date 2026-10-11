## ADDED Requirements

### Requirement: Two-phase bracket structure
The postseason SHALL be organised into two phases stored in `/data/postseason/{year}.json`:

- **Phase 1**: `r16` (round of 16, single-elimination) → `r8` (quarter-finals)
- **Phase 2**: `top4-w1` → `top4-l1` → `top4-w2` → `top4-l2` → `top4-championship` (double-elimination for top 4)

Each round has `roundId`, `name`, `phase`, `bestOf`, and `homeAdvantage` fields.

#### Scenario: Phases are independent
- **WHEN** `getRoundsByPhase(data, "phase1")` is called
- **THEN** only `r16` and `r8` rounds are returned

### Requirement: Seed-to-team mapping for R16
R16 matchup `seed1` and `seed2` SHALL correspond to the team's regular-season rank computed by `calculateStandings`. The team name is NOT stored in the postseason JSON for R16; it is derived dynamically at load time.

#### Scenario: Seed 1 is the top-ranked team
- **WHEN** `loadPostseasonData(2025)` is called and the 2025 standings rank 甲 first
- **THEN** the matchup with `seed1 = 1` SHALL have `team1.teamName = "甲"`

#### Scenario: Unknown seed falls back to placeholder
- **WHEN** no team maps to a given seed number
- **THEN** `team1.teamName` SHALL be `"第 N 種子"` where N is the seed number

### Requirement: R8+ team enrichment
For rounds R8 and beyond, the JSON stores only `teamId` (not `teamName` or `regularSeasonRank`). The loader SHALL enrich each team reference with `teamName` and `regularSeasonRank` from the computed standings.

#### Scenario: R8 team name resolved
- **WHEN** an R8 matchup has `team1: { teamId: "phoenix" }` and standings map "phoenix" to rank 3
- **THEN** the enriched matchup SHALL have `team1 = { teamId: "phoenix", teamName: "飛尼克斯", regularSeasonRank: 3 }`

### Requirement: Winner and status computed from schedule
Matchup `winner` and `status` SHALL be computed at load time from `{year}postseason.json` schedule data, not read from the postseason JSON. The JSON values are ignored.

- `status`:
  - `"pending"` — no wins recorded for either team
  - `"in_progress"` — at least one team has a win but neither has reached `requiredWins`
  - `"completed"` — one team has reached `ceil(bestOf / 2)` wins

#### Scenario: Matchup completes at requiredWins
- **WHEN** `bestOf = 3` and team1 wins 2 games
- **THEN** `winner = "team1"`, `status = "completed"`, regardless of remaining games

### Requirement: Bye game (home advantage)
A `PostseasonGame` with `byeGame: true` grants team1 an automatic win without a real game being played. Bye games are used for:

- R16/R8 home advantage (higher seed hosts, gets 1 free win in best-of-1)
- Championship winners-bracket advantage (see championship rule below)

#### Scenario: Bye game counts as team1 win
- **WHEN** a matchup has a bye game and `bestOf = 1`
- **THEN** team1 immediately has 1 win, reaching `requiredWins = 1`, so `status = "completed"` and `winner = "team1"`

### Requirement: Phase 2 auto-generation
When a Phase 2 round's `matchups` array is empty in the JSON, the loader SHALL auto-generate matchup stubs from the completed results of the preceding rounds. The auto-generation cascade is:

1. **top4-w1** (if empty): pair R8 winners — `r8[0].winner vs r8[1].winner`, `r8[2].winner vs r8[3].winner`
2. **top4-l1** (if empty): `top4-w1[0].loser vs top4-w1[1].loser`
3. **top4-w2** (if empty): `top4-w1[0].winner vs top4-w1[1].winner`
4. **top4-l2** (if empty): `top4-w2[0].loser vs top4-l1[0].winner` (losers-bracket revival)
5. **top4-championship** (if empty): `top4-w2[0].winner vs top4-l2[0].winner`

Teams not yet determined are represented with `teamId: "TBD"`, `teamName: "待定"`.

#### Scenario: Auto-generation cascades through all rounds
- **WHEN** all Phase 2 round matchups arrays are empty and R8 is fully complete
- **THEN** stubs for all 5 Phase 2 rounds are generated and enriched with schedule results

#### Scenario: TBD team when prerequisite incomplete
- **WHEN** R8 is still in progress and top4-w1 is being generated
- **THEN** the unresolved slot SHALL use `teamName: "待定"`

### Requirement: Championship winners-bracket advantage
The `top4-championship` matchup SHALL give the winners-bracket team (team1, winner of top4-w2) a bye game as game 1. With `bestOf = 3` and `requiredWins = ceil(3/2) = 2`:

- The losers-bracket team (team2) needs **2** actual wins to claim the championship
- The winners-bracket team (team1) needs only **1** actual win to clinch

#### Scenario: Winners bracket team wins in 1 game
- **WHEN** team1 (winners bracket) wins game 2 of the championship
- **THEN** `winner = "team1"`, `status = "completed"` after 1 real game (bye + 1 win)

#### Scenario: Losers bracket team forces final game
- **WHEN** team2 wins game 2 (first real game)
- **THEN** a deciding game 3 SHALL be played; team2 needs game 3 as well to win

### Requirement: Champion resolution
`getChampion(data)` SHALL return the winning team entry of the `top4-championship` matchup, or `null` if the championship has not yet been completed.

#### Scenario: Champion identified
- **WHEN** the championship matchup has `winner = "team2"`
- **THEN** `getChampion` SHALL return `team2`'s `PostseasonTeamEntry`
