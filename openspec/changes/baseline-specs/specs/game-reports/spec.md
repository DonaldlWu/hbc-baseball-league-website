## ADDED Requirements

### Requirement: Game report API route
The system SHALL expose a Next.js API route at `GET /api/game-reports/[gameNumber]` that returns a `GameReport` JSON object for a given game.

The `gameNumber` path segment SHALL be URL-decoded before processing.

#### Scenario: Valid game with report
- **WHEN** a GET request is made to `/api/game-reports/2025201` and the game has `status: "finished"` and a non-empty `sheetId`
- **THEN** the response SHALL have HTTP 200 with a `GameReport` body

#### Scenario: Invalid game number format
- **WHEN** `parseGameNumber` returns `null` for the provided `gameNumber`
- **THEN** the response SHALL be HTTP 400 with `{ "error": "無效的比賽編號 <gameNumber>" }`

### Requirement: Game report eligibility conditions
The API SHALL return a 404 response when any of the following conditions apply:
- The `gameNumber` does not exist in `seasons/{year}.json`
- The game has `status: "rain"` AND no `rescheduledDates` (i.e., unplayed rain delay with no makeup scheduled)
- The game has an empty `sheetId`

#### Scenario: Rain game without reschedule
- **WHEN** a game has `status: "rain"` and `rescheduledDates` is absent or empty
- **THEN** the response SHALL be HTTP 404 with `{ "error": "比賽 <gameNumber> 因雨延賽，尚未補賽" }`

#### Scenario: Game missing sheetId
- **WHEN** a game exists but `sheetId === ""`
- **THEN** the response SHALL be HTTP 404 with `{ "error": "比賽 <gameNumber> 尚未有戰報資料" }`

### Requirement: Google Sheets data source
Game report data SHALL be fetched from Google Sheets via the URL:
`https://docs.google.com/spreadsheets/d/{sheetId}/gviz/tq?tqx=out:csv`

The response SHALL be parsed as CSV into a `GameReport` object on the server side. This fetch is performed server-side only (inside the Next.js API route) to avoid exposing the Google Sheets endpoint to the browser.

#### Scenario: Fetch and parse
- **WHEN** the API route fetches the Google Sheet CSV for a valid `sheetId`
- **THEN** it SHALL parse the CSV and return a `GameReport` with correctly populated `innings`, `homeTeam`, and `awayTeam` fields

### Requirement: CDN cache headers
All successful (HTTP 200) responses from the game report API SHALL include the `Cache-Control` header:
`public, max-age=3600, s-maxage=86400, stale-while-revalidate=172800`

This means: browsers cache for 1 hour, Vercel CDN caches for 1 day, and the CDN may serve stale content for up to 2 additional days while revalidating.

#### Scenario: Cache header present on success
- **WHEN** the API returns HTTP 200
- **THEN** the `Cache-Control` header SHALL be `public, max-age=3600, s-maxage=86400, stale-while-revalidate=172800`

### Requirement: GameReport data shape
A `GameReport` SHALL contain:
- `gameNumber`: string
- `date`: ISO 8601 date string
- `venue`: string (optional)
- `season`: integer (optional)
- `innings.home`: array of per-inning scores (number or null)
- `innings.away`: array of per-inning scores (number or null)
- `homeTeam`: `TeamGameStats` with `name`, `runs`, `hits`, `errors`, `pitchers[]`, `batters[]`
- `awayTeam`: `TeamGameStats` (same shape as homeTeam)

Each `PitcherStats` entry SHALL include: `number`, `name`, `ip`, `np`, `h`, `r`, `er`, `bb`, `k`.
Each `BatterStats` entry SHALL include: `number`, `name`, `pa`, `ab`, `r`, `h`, `rbi`, `bb`, `so`, `sb`.

#### Scenario: Innings with null entries
- **WHEN** a game goes extra innings and an inning has no score recorded
- **THEN** that inning's slot in the `innings` array SHALL be `null`

### Requirement: Season resolution from game number
The API SHALL determine the season year by calling `parseGameNumber` on the decoded `gameNumber` and reading the `season` field. The season JSON is then read from the filesystem (not via HTTP) using `fs.readFile`.

#### Scenario: Server-side file read
- **WHEN** the API handler processes a request
- **THEN** it SHALL read `public/data/seasons/{season}.json` via `fs.promises.readFile` rather than `fetch`, to avoid browser-side bundling of the Node.js `fs` module
