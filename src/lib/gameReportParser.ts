/**
 * 解析 Google Sheet 紀錄單資料
 */

import type { GameReport, PitcherStats, BatterStats } from '@/src/types';

/**
 * 從 Google Sheet 取得 CSV 資料
 */
export async function fetchSheetCSV(sheetId: string): Promise<string> {
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
function safeParseInt(value: string | undefined): number {
  const cleaned = value?.toString().trim();
  if (!cleaned) return 0;
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 安全解析浮點數
 */
function safeParseFloat(value: string | undefined): number {
  const cleaned = value?.toString().trim();
  if (!cleaned) return 0;
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * 簡易 CSV 解析器
 */
function parseCSV(csvContent: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      if (char === '\r') i++;
    } else if (char !== '\r') {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * 解析 CSV 資料為 GameReport
 */
export function parseGameReportCSV(
  csvContent: string,
  gameNumber: string,
  venue?: string
): GameReport {
  const rows = parseCSV(csvContent);

  // Row 0: 日期在 column 13
  const dateStr = rows[0]?.[13] || '';
  const date = dateStr.replace(/\//g, '-');

  // Row 2: 主隊每局得分 + R(14), H(15), E(16)
  // Row 3: 客隊每局得分
  // 局數 column mapping: 4-9 = 1-6局, 10 = 空, 11-13 = 7-9局
  const homeInnings: (number | null)[] = [];
  const awayInnings: (number | null)[] = [];

  const inningColumns = [4, 5, 6, 7, 8, 9, 11, 12, 13]; // 跳過 column 10 (空欄)
  for (const col of inningColumns) {
    const homeVal = rows[2]?.[col]?.trim();
    const awayVal = rows[3]?.[col]?.trim();
    homeInnings.push(homeVal ? safeParseInt(homeVal) : null);
    awayInnings.push(awayVal ? safeParseInt(awayVal) : null);
  }

  const homeRuns = safeParseInt(rows[2]?.[14]);
  const homeHits = safeParseInt(rows[2]?.[15]);
  const homeErrors = safeParseInt(rows[2]?.[16]);

  const awayRuns = safeParseInt(rows[3]?.[14]);
  const awayHits = safeParseInt(rows[3]?.[15]);
  const awayErrors = safeParseInt(rows[3]?.[16]);

  // Row 4: 隊名 (column 1 = 主隊, column 11 = 客隊)
  const homeTeamName = rows[4]?.[1]?.trim() || '';
  const awayTeamName = rows[4]?.[11]?.trim() || '';

  // Row 5-7: 投手數據
  // CSV 格式: 背號, 名字, 局數(IP), 人次(NP), 奪三振(K), 四死(BB), 被安打(H), 被HR, 失分(R)
  // 注意: CSV 中沒有「責失」欄位
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
          k: safeParseInt(row[4]),   // 奪三振
          bb: safeParseInt(row[5]),  // 四死
          h: safeParseInt(row[6]),   // 被安打
          r: safeParseInt(row[8]),   // 失分 (col 8)
          er: safeParseInt(row[8]),  // 責失 (CSV 無此欄位，暫用失分代替)
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
          k: safeParseInt(row[14]),  // 奪三振
          bb: safeParseInt(row[15]), // 四死
          h: safeParseInt(row[16]),  // 被安打
          r: safeParseInt(row[18]),  // 失分 (col 18)
          er: safeParseInt(row[18]), // 責失 (CSV 無此欄位，暫用失分代替)
        });
      }
    }
  }

  // Row 9: 隊名 + 打擊率
  const homeBattingAvg = safeParseFloat(rows[9]?.[9]);

  // Row 10+: 打者數據
  // CSV 格式: 背號, 名字, 打席(PA), 安打(H), 三振(SO), 四死(BB), 打點(RBI), 得分(R), 盜壘(SB)
  const homeBatters: BatterStats[] = [];
  const awayBatters: BatterStats[] = [];

  for (let i = 10; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    // 主隊打者 (columns 0-8)
    const homeName = row[1]?.trim();
    if (homeName && homeName !== 'TOTAL' && homeName !== homeTeamName) {
      const pa = safeParseInt(row[2]);
      const bb = safeParseInt(row[5]);
      homeBatters.push({
        number: row[0]?.trim() || '',
        name: homeName,
        pa: pa,                    // 打席
        ab: pa - bb,               // 打數 = 打席 - 四死 (簡化)
        r: safeParseInt(row[7]),   // 得分
        h: safeParseInt(row[3]),   // 安打
        rbi: safeParseInt(row[6]), // 打點
        bb: bb,                    // 四死
        so: safeParseInt(row[4]),  // 三振
        sb: safeParseInt(row[8]),  // 盜壘
      });
    }

    // 客隊打者 (columns 10-18)
    const awayName = row[11]?.trim();
    if (awayName && awayName !== 'TOTAL' && awayName !== awayTeamName) {
      const pa = safeParseInt(row[12]);
      const bb = safeParseInt(row[15]);
      awayBatters.push({
        number: row[10]?.trim() || '',
        name: awayName,
        pa: pa,                    // 打席
        ab: pa - bb,               // 打數 = 打席 - 四死 (簡化)
        r: safeParseInt(row[17]),  // 得分
        h: safeParseInt(row[13]),  // 安打
        rbi: safeParseInt(row[16]),// 打點
        bb: bb,                    // 四死
        so: safeParseInt(row[14]), // 三振
        sb: safeParseInt(row[18]), // 盜壘
      });
    }
  }

  return {
    gameNumber,
    date,
    venue,
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

/**
 * 從 Google Sheet ID 取得並解析比賽戰報
 */
export async function getGameReport(
  sheetId: string,
  gameNumber: string,
  venue?: string
): Promise<GameReport> {
  const csv = await fetchSheetCSV(sheetId);
  return parseGameReportCSV(csv, gameNumber, venue);
}
