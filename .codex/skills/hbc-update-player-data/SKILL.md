---
name: hbc-update-player-data
description: Refresh HBC player statistics from a CSV source. Use this skill when the user provides a CSV path or date and wants the raw data symlink, conversion command, generated JSON output, and optional commit flow handled consistently.
---

# HBC Update Player Data

Use this skill when the user wants to import player stats from CSV into generated site data.

## Workflow

1. Resolve the CSV source:
   - Date input like `2026-02-07` -> `data/raw/2026-02-07.csv`
   - Explicit file path -> use that path
2. Confirm the file exists and inspect basic file info.
3. If the source file is outside `data/raw/`, copy it into `data/raw/YYYY-MM-DD.csv`.
4. Update the symlink:
   - `data/raw/data.csv` -> selected file
5. Run `npm run convert-data`.
6. Review the conversion output:
   - row count should be reasonable, typically above 3000
   - no conversion errors
7. Inspect the modified files and optionally validate representative JSON output.
8. If the user wants, stage and commit the generated data changes.

## Constraints

- CSV must be UTF-8
- Row 1 is league summary and should be skipped by the converter
- Row 2 is the header row
- Player data starts on row 3
- If converted player counts drop unexpectedly, stop before commit and surface the risk

## Common Failures

- Missing parser dependency such as `csv-parse` -> install project dependencies
- Missing `data/raw/data.csv` symlink -> recreate the symlink
- Suspiciously small output set -> verify encoding and CSV layout

## Commit Message

`chore: 更新球員數據 YYYY-MM-DD`

## Source

For the full original operating guide and troubleshooting notes, see `.claude/commands/update-player-data.md`.
