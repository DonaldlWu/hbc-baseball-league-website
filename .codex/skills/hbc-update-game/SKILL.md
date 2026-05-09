---
name: hbc-update-game
description: Update HBC game results from a weekly report or a single game number. Use this skill when the user needs score updates, sheet IDs, rainouts, cancellations, or rescheduled-game handling.
---

# HBC Update Game

Use this skill when the user provides league report text, asks to update a single game, or needs rainout and reschedule handling.

## Modes

- Batch mode: pasted weekly report containing `No.XXXXXXX`, score, and Google Sheets links
- Single-game mode: one `gameNumber`

## Batch Workflow

1. Parse each result block.
2. Extract:
   - `gameNumber`: strip the `No.` prefix
   - `awayScore`: left side of `N:M`
   - `homeScore`: right side of `N:M`
   - `sheetId`: the Google Sheets ID after `/d/`
3. For each affected season file, update the game:
   - `status` -> `finished`
   - `homeScore`, `awayScore`
   - `sheetId`, or leave empty when the link is incomplete
4. If `standings.source === "calculated"`, recalculate `standings.teams` from all `status === "finished"` games in that file.
5. Update top-level `lastUpdated`.
6. Validate changed JSON files.

## Single-Game Workflow

1. Use the first four digits of the game number to locate `public/data/seasons/YYYY.json`.
2. Show the current game record, including `rescheduledDates` if present.
3. Pick the scenario:
   - No `rescheduledDates`: normal update
   - Existing `rescheduledDates` and latest makeup date is rained out again: append another date
   - Existing `rescheduledDates` and game is now completed: update root result fields only
   - Status already `rain` and makeup date is now known: create `rescheduledDates`
4. If the game becomes `finished` and standings are calculated, recompute standings.
5. Update `lastUpdated` and validate JSON.

## Standings Calculation

- Use every finished game in the season file.
- Home team: scored `homeScore`, allowed `awayScore`
- Away team: scored `awayScore`, allowed `homeScore`
- Win = 3 points, draw = 1 point
- `runsScored` and `runsAllowed` are averages rounded to three decimals
- Reuse existing `teamId` by matching `teamName`; otherwise derive a fallback from the team name

**Applying adjustments (if present):**

After raw calculation, read `standings.adjustments` (if the field exists and is non-empty):
- For each adjustment entry, find the team with matching `teamName` in the calculated results
- If not found, create a new entry with wins/losses/draws/runsScored/runsAllowed all set to 0
- Apply `delta.wins / delta.losses / delta.draws` (only fields present in delta)
- wins/losses/draws must not go negative after applying delta; clamp to 0
- The `standings.adjustments` array itself is **never modified**; preserve it as-is

- Sort by points descending, then `runsScored` descending

## Constraints

- `homeScore: 0` is different from `null`
- `sheetId` should contain only the ID, not the full URL
- `rescheduledDates` is append-only; never rewrite history
- Batch mode does not process rainout-only announcements without scores

## Commit Message

- Result update: `chore: 更新比賽 XXXX 結果 (客隊N:M主隊)`
- Rainout: `chore: 比賽 XXXX 雨延，補賽日 YYYY-MM-DD`
- Rainout again: `chore: 比賽 XXXX 補賽日再次延賽，新補賽日 YYYY-MM-DD`
- Makeup result: `chore: 更新比賽 XXXX 補賽結果 (客隊N:M主隊)`

## Source

For the full original operating guide and examples, see `.claude/commands/update-game.md`.
