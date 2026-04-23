---
name: hbc-add-game
description: Add scheduled HBC league games into season JSON files when the user provides a single game line or a pasted schedule announcement. Use this skill for regular-season or postseason game creation, including rainout reschedule detection.
---

# HBC Add Game

Use this skill when the user wants to add upcoming games from league schedule text.

## Inputs

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
   - Exists with `status: "rain"`: append to `rescheduledDates`
   - Exists with another status: stop and ask the user how to handle the conflict
7. Update top-level `lastUpdated` to today's date.
8. Validate any modified JSON file.

## Parsing Rules

### Regular season

- Convert `No.98` into `YYYY098` using the detected season year and zero-pad the number to three digits.

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

## Validation

- Run JSON validation on every changed target file.
- Summarize new games, reschedules, and conflicts before any commit.

## Commit Message

- Regular season only: `chore: 新增 N 場賽程 (YYYY-MM)`
- Postseason only: `chore: 新增 N 場季後賽賽程 (YYYY)`
- Mixed: `chore: 新增 N 場賽程，含 M 場季後賽 (YYYY-MM)`

## Source

For the longer original prompt and examples, see `.claude/commands/add-game.md`.
