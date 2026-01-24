/**
 * 解析 Google Sheet 紀錄單資料並轉換為 JSON
 *
 * 使用方式：
 * npx tsx scripts/parse-game-report.ts <SHEET_ID> [OUTPUT_PATH]
 */

import { parse } from 'csv-parse/sync';

// 比賽資料型別
interface GameReport {
  date: string;
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  innings: {
    home: (number | null)[];
    away: (number | null)[];
  };
}

interface TeamStats {
  name: string;
  runs: number;
  hits: number;
  errors: number;
  battingAvg?: number;
  pitchers: PitcherStats[];
  batters: BatterStats[];
}

interface PitcherStats {
  number: string;
  name: string;
  ip: string;      // 投球局數
  np: number;      // 投球數
  h: number;       // 被安打
  r: number;       // 失分
  er: number;      // 自責分
  bb: number;      // 保送
  k: number;       // 三振
}

interface BatterStats {
  number: string;
  name: string;
  ab: number;      // 打數
  r: number;       // 得分
  h: number;       // 安打
  rbi: number;     // 打點
  bb: number;      // 保送
  so: number;      // 三振
  sb: number;      // 盜壘
}

/**
 * 從 Google Sheet 取得 CSV 資料
 */
async function fetchSheetCSV(sheetId: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet: ${response.status}`);
  }
  return response.text();
}

/**
 * 安全解析數字
 */
function safeParseInt(value: string): number {
  const cleaned = value?.toString().trim();
  if (!cleaned) return 0;
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 安全解析浮點數
 */
function safeParseFloat(value: string): number {
  const cleaned = value?.toString().trim();
  if (!cleaned) return 0;
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 解析 CSV 資料為 GameReport
 */
function parseGameReport(csvContent: string): GameReport {
  const rows: string[][] = parse(csvContent, {
    skip_empty_lines: false,
    relax_column_count: true,
  });

  // Row 0: 日期在 column 13
  const dateStr = rows[0]?.[13] || '';
  const date = dateStr.replace(/\//g, '-');

  // Row 1: 局數 (columns 4-13 = innings 1-9)
  // Row 2: 主隊每局得分 + R(14), H(15), E(16)
  // Row 3: 客隊每局得分
  const homeInnings: (number | null)[] = [];
  const awayInnings: (number | null)[] = [];

  for (let i = 4; i <= 13; i++) {
    if (i === 10) continue; // 跳過空欄
    const homeVal = rows[2]?.[i]?.trim();
    const awayVal = rows[3]?.[i]?.trim();
    homeInnings.push(homeVal ? safeParseInt(homeVal) : null);
    awayInnings.push(awayVal ? safeParseInt(awayVal) : null);
  }

  const homeRuns = safeParseInt(rows[2]?.[14] || '0');
  const homeHits = safeParseInt(rows[2]?.[15] || '0');
  const homeErrors = safeParseInt(rows[2]?.[16] || '0');

  const awayRuns = safeParseInt(rows[3]?.[14] || '0');
  const awayHits = safeParseInt(rows[3]?.[15] || '0');
  const awayErrors = safeParseInt(rows[3]?.[16] || '0');

  // Row 4: 隊名 (column 1 = 主隊, column 11 = 客隊)
  const homeTeamName = rows[4]?.[1]?.trim() || '';
  const awayTeamName = rows[4]?.[11]?.trim() || '';

  // Row 5-7: 投手數據
  const homePitchers: PitcherStats[] = [];
  const awayPitchers: PitcherStats[] = [];

  for (let i = 5; i <= 7; i++) {
    const row = rows[i];
    if (!row) continue;

    // 主隊投手 (columns 0-8)
    if (row[0]?.trim() || row[1]?.trim()) {
      const name = row[1]?.trim();
      if (name && name !== 'TOTAL') {
        homePitchers.push({
          number: row[0]?.trim() || '',
          name,
          ip: row[2]?.trim() || '0',
          np: safeParseInt(row[3]),
          h: safeParseInt(row[4]),
          r: safeParseInt(row[5]),
          er: safeParseInt(row[6]),
          bb: safeParseInt(row[7]),
          k: safeParseInt(row[8]),
        });
      }
    }

    // 客隊投手 (columns 10-18)
    if (row[10]?.trim() || row[11]?.trim()) {
      const name = row[11]?.trim();
      if (name && name !== 'TOTAL') {
        awayPitchers.push({
          number: row[10]?.trim() || '',
          name,
          ip: row[12]?.trim() || '0',
          np: safeParseInt(row[13]),
          h: safeParseInt(row[14]),
          r: safeParseInt(row[15]),
          er: safeParseInt(row[16]),
          bb: safeParseInt(row[17]),
          k: safeParseInt(row[18]),
        });
      }
    }
  }

  // Row 8: 隊名 + 打擊率
  const homeBattingAvg = safeParseFloat(rows[8]?.[9] || '0');

  // Row 9+: 打者數據
  const homeBatters: BatterStats[] = [];
  const awayBatters: BatterStats[] = [];

  for (let i = 9; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    // 主隊打者 (columns 0-8)
    const homeName = row[1]?.trim();
    if (homeName && homeName !== 'TOTAL' && homeName !== homeTeamName) {
      homeBatters.push({
        number: row[0]?.trim() || '',
        name: homeName,
        ab: safeParseInt(row[2]),
        r: safeParseInt(row[3]),
        h: safeParseInt(row[4]),
        rbi: safeParseInt(row[5]),
        bb: safeParseInt(row[6]),
        so: safeParseInt(row[7]),
        sb: safeParseInt(row[8]),
      });
    }

    // 客隊打者 (columns 10-18)
    const awayName = row[11]?.trim();
    if (awayName && awayName !== 'TOTAL' && awayName !== awayTeamName) {
      awayBatters.push({
        number: row[10]?.trim() || '',
        name: awayName,
        ab: safeParseInt(row[12]),
        r: safeParseInt(row[13]),
        h: safeParseInt(row[14]),
        rbi: safeParseInt(row[15]),
        bb: safeParseInt(row[16]),
        so: safeParseInt(row[17]),
        sb: safeParseInt(row[18]),
      });
    }
  }

  return {
    date,
    innings: {
      home: homeInnings,
      away: awayInnings,
    },
    homeTeam: {
      name: homeTeamName,
      runs: homeRuns,
      hits: homeHits,
      errors: homeErrors,
      battingAvg: homeBattingAvg,
      pitchers: homePitchers,
      batters: homeBatters,
    },
    awayTeam: {
      name: awayTeamName,
      runs: awayRuns,
      hits: awayHits,
      errors: awayErrors,
      pitchers: awayPitchers,
      batters: awayBatters,
    },
  };
}

// 主程式
async function main() {
  const sheetId = process.argv[2] || '1Yy33d0is6kLcauQ2dws1kroMMBMzMxEsFXNT00aulqo';

  console.log(`Fetching sheet: ${sheetId}`);

  const csv = await fetchSheetCSV(sheetId);
  const report = parseGameReport(csv);

  console.log('\n=== Parsed Game Report ===\n');
  console.log(JSON.stringify(report, null, 2));
}

main().catch(console.error);
