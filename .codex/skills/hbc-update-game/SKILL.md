---
name: hbc-update-game
description: Update HBC game reports and results. Use for 更新戰報 or 更新本週戰報 to fetch the last seven calendar days from the configured Facebook group, or for supplied weekly reports and single-game score, sheet ID, rainout and reschedule updates.
---

# HBC Update Game

Use this skill for「更新戰報」「更新本週戰報」, supplied report text, or single-game updates. A request to update reports authorizes one bounded fetch and validated local data updates; it does not authorize commit, push, deployment or scheduling.

## Modes

- Weekly fetch mode (default without report text or a game number): read [weekly-fetch.md](references/weekly-fetch.md), run its helper once, then match and update validated games. Do not ask the user to paste a report before trying the configured fetch.
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
   - `sheetId` only when the complete URL is unambiguously associated with that game; preserve an existing value if the source is incomplete
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

- Project season records are authoritative for team names. Report names can be missing or wrong: never rename project teams or create an alias from a guess. Match by explicit gameNumber and corroborating evidence; leave conflicts for review.
- Publication date is provenance, not the game date. Preserve original date and all rescheduledDates when completing a makeup game.
- Preserve an existing sheetId when the new source is missing/incomplete; do not clear it. Different existing results or sheet IDs require review.
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
