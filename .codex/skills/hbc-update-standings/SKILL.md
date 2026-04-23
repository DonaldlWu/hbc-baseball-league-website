---
name: hbc-update-standings
description: Update HBC season standings either by recalculating from finished games or by applying manual team records. Use this skill when the user asks to refresh standings for a season JSON file.
---

# HBC Update Standings

Use this skill when the user wants to refresh `public/data/seasons/YYYY.json` standings data.

## Workflow

1. Determine the target season:
   - explicit year from the user
   - otherwise the latest season from `public/data/seasons/index.json`
2. Read the season file and inspect current `standings`.
3. Choose mode:
   - `standings.source === "calculated"` -> recalculate
   - empty `standings.teams` -> recalculate
   - non-empty manual standings -> ask whether to keep manual input or switch to calculated
4. Apply the selected mode.
5. Update `lastUpdated`.
6. Validate the JSON file.

## Calculated Mode

- Scan all `status === "finished"` games
- For each team, compute:
  - `wins`
  - `losses`
  - `draws`
  - `runsScored` as average runs scored, three decimals
  - `runsAllowed` as average runs allowed, three decimals
- Reuse `teamId` from existing `standings.teams` when `teamName` matches
- Otherwise derive a fallback `teamId` from the team name
- Replace `standings.teams` completely
- Set `standings.source` to `"calculated"`

## Manual Mode

- Update only the teams the user specifies
- Preserve other teams
- Keep `standings.source` as `"manual"`
- Re-sort after editing

## Sorting

- Points = `wins * 3 + draws`
- Sort by points descending, then `runsScored` descending

## Constraints

- Do not change `teamName`
- In manual mode, keep existing `teamId`
- Exclude `rain` and `cancelled` games from calculated standings

## Commit Message

- Calculated: `chore: 自動計算 YYYY 賽季戰績排行 YYYY-MM-DD`
- Manual: `chore: 更新 YYYY 賽季戰績排行 YYYY-MM-DD`

## Source

For the full original operating guide and examples, see `.claude/commands/update-standings.md`.
