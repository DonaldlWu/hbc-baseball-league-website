---
name: hbc-add-game
description: Update HBC schedules from Facebook posts or supplied schedule text. Use for 更新賽程 or 更新本週賽程 to fetch the last seven calendar days, and for adding regular-season or postseason games and rainout makeup arrangements.
---

# HBC Add Game

Use this skill for「更新賽程」「更新本週賽程」or supplied schedule text. Without text, follow [weekly-fetch.md](references/weekly-fetch.md) and fetch once. When asked to update both schedules and reports, fetch once with --kind all and route each result to its skill. Validated local updates are authorized by the update request; do not commit, push, deploy or schedule without separate authorization.

## Inputs

- No announcement supplied: one bounded seven-day fetch using the existing local account ID, or reuse an explicit same-range raw result
- A full schedule announcement with one or more `No....` game lines
- A single game line such as `2026/3/7 No.100 Line Drive VS 飛尼克斯--中正A--下午(14:30~17:00)`

## Workflow

1. Parse each game line under the latest preceding date line in `YYYY/M/D`.
2. Detect format:
   - Regular season: `No.98`
   - Postseason: `No.20250314G1`
3. Read `public/data/seasons/index.json` to determine the target season for regular-season games.
4. Build the target file:
   - Regular season: `public/data/seasons/YYYY.json`
   - Postseason: `public/data/seasons/YYYYpostseason.json`
5. Derive fields:
   - `date`: ISO date from the current date line
   - `awayTeam`: team before `VS`
   - `homeTeam`: team after `VS`
   - `venue`: from the `--場地--` segment, or the most recent venue heading if needed
   - `startTime` and `endTime`: from the parenthesized time range
   - `timeSlot`: infer from actual start time, not the label text
6. Before writing, check whether `gameNumber` already exists:
   - Missing: create a new scheduled game
   - Identical original schedule or normalized makeup entry: no change; never append a duplicate
   - Exists with `status: "rain"` and a genuinely new validated makeup arrangement: append to `rescheduledDates`, preserving the original game and history
   - Exists with conflicting scheduling or team data: leave that game unchanged and report for review; continue independent validated entries
   - Already finished: preserve results and sheetId; do not regress to scheduled
7. Update top-level `lastUpdated` only when the file has substantive changes. Scheduling alone does not recalculate standings.
8. Validate any modified JSON file.

## Parsing Rules

### Regular season

- Full regular-season game numbers retain their explicit season prefix. For short `No.98`, first check existing original/makeup games across relevant indexed seasons using project team identities. Only new games use an unambiguous regular-season index date match to derive `YYYY098`; overlapping seasons or missing year remain review items. Never infer the season from publication date or blindly prepend the current year.

### Postseason

- Match `^\d{8}G\d+$` after `No.`
- Keep the game number exactly as-is, for example `20250314G1`
- Use the first four digits as the season year

### timeSlot

- `08:xx` -> `上午`
- `10:30`, `11:00`, `12:00` -> `中午`
- `14:00`, `14:30` -> `下午`

Ignore non-game lines such as notes, empty lines, and standalone venue headings.

## Write Shapes

New game:

```json
"2025098": {
  "date": "2025-12-06",
  "homeTeam": "陽明OB",
  "awayTeam": "Mechanics",
  "venue": "中正A",
  "timeSlot": "中午",
  "startTime": "12:00",
  "endTime": "14:30",
  "status": "scheduled",
  "homeScore": null,
  "awayScore": null,
  "sheetId": ""
}
```

Rainout reschedule:

```json
"2025047": {
  "date": "2025-12-25",
  "status": "rain",
  "rescheduledDates": [
    { "date": "2025-12-27", "venue": "中正A", "timeSlot": "上午", "startTime": "08:00", "endTime": "11:00" }
  ]
}
```

## Project data and repeat runs

- Project season records and team catalog define canonical team names. Missing/incorrect announcement names do not authorize renaming teams or inventing aliases. Unproven matches remain for review.
- Publication date only selects posts; parse all explicitly dated games in an announcement, including future weeks. Never use post date as game date or inherit a date/venue across unrelated posts.
- New games require unique gameNumber, confirmed teams and season, valid date, venue, and valid ordered start/end times. Missing fields or unsupported timeSlot mappings remain for review.
- Preserve date, results, sheetId and rescheduledDates history of an existing game. A missing game in a new announcement is not a cancellation.

## Validation

- Run JSON validation on every changed target file.
- Summarize new games, reschedules, and conflicts before any commit.

## Commit Message

- Regular season only: `chore: 新增 N 場賽程 (YYYY-MM)`
- Postseason only: `chore: 新增 N 場季後賽賽程 (YYYY)`
- Mixed: `chore: 新增 N 場賽程，含 M 場季後賽 (YYYY-MM)`

## Source

For the longer original prompt and examples, see `.claude/commands/add-game.md`.
