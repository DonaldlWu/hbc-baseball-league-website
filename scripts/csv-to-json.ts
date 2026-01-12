import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import type { Player, PlayerSeason, LeagueStats } from '../src/types';

// 解析 CSV 行
export function parseCSVRow(row: any): any {
  const safeParseInt = (value: string): number => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  };

  const safeParseFloat = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  return {
    id: row['聯盟編碼'] + row['年份'],
    code: row['聯盟編碼'],
    year: safeParseInt(row['年份']),
    team: row['所屬球團'],
    number: row['背號'],
    name: row['球員'],
    photo: row['頒獎照片'] || '',
    batting: {
      games: safeParseInt(row['出賽']),
      pa: safeParseInt(row['打席']),
      ab: safeParseInt(row['打數']),
      hits: safeParseInt(row['安打']),
      singles: safeParseInt(row['一安']),
      doubles: safeParseInt(row['二安']),
      triples: safeParseInt(row['三安']),
      hr: safeParseInt(row['全打']),
      rbi: safeParseInt(row['打點']),
      runs: safeParseInt(row['得分']),
      bb: safeParseInt(row['四死']),
      so: safeParseInt(row['三振']),
      sb: safeParseInt(row['盜壘成功']),
      sf: safeParseInt(row['犧打']),
      totalBases: safeParseInt(row['壘打數']),
    },
    advanced: {
      rc: safeParseFloat(row['RC數據']),
    },
    rankings: {
      rc: safeParseInt(row['RC排名']),
      hits: safeParseInt(row['安打排名']),
      hr: safeParseInt(row['全壘打排名']),
      rbi: safeParseInt(row['打點排名']),
      avg: safeParseInt(row['打擊率排名']),
    },
  };
}

// 轉換球員資料
export function transformPlayerData(rows: any[]): Player {
  const seasons = rows.map(row => ({
    year: row.year,
    team: row.team,
    number: row.number,
    batting: row.batting,
    rankings: row.rankings,
  }));

  const sortedSeasons = seasons.sort((a, b) => b.year - a.year);

  return {
    id: rows[0].code,
    code: rows[0].code,
    name: rows[0].name,
    photo: rows[0].photo,
    career: {
      debut: Math.min(...seasons.map(s => s.year)),
      teams: [...new Set(seasons.map(s => s.team))],
      totalSeasons: seasons.length,
    },
    seasons: sortedSeasons,
  };
}

// 計算聯盟統計
export function calculateLeagueStats(players: any[], year: number): LeagueStats {
  const totalAB = players.reduce((sum, p) => sum + p.batting.ab, 0);
  const totalHits = players.reduce((sum, p) => sum + p.batting.hits, 0);
  const totalBB = players.reduce((sum, p) => sum + p.batting.bb, 0);
  const totalPA = players.reduce((sum, p) => sum + p.batting.pa, 0);
  const totalTB = players.reduce((sum, p) => sum + p.batting.totalBases, 0);

  const avgBattingAvg = totalHits / totalAB;
  const avgOBP = (totalHits + totalBB) / (totalAB + totalBB);
  const avgSLG = totalTB / totalAB;

  return {
    year,
    avgBattingAvg,
    avgOBP,
    avgSLG,
    avgOPS: avgOBP + avgSLG,
    totalPA,
    totalAB,
    wOBAScale: 1.20,
    wOBAWeights: {
      BB: 0.69,
      HBP: 0.72,
      '1B': 0.88,
      '2B': 1.24,
      '3B': 1.56,
      HR: 1.95,
    },
  };
}

// 主函數
async function main() {
  console.log('🚀 開始轉換 CSV 到 JSON...');

  // 讀取 CSV
  const csvPath = path.join(process.cwd(), 'data/raw/data.csv');
  const csvContent = await fs.readFile(csvPath, 'utf-8');

  // 解析 CSV (跳過第一行聯盟統計，從第二行標題開始)
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    from_line: 2, // 從第2行開始讀取（第1行是聯盟統計）
  });

  console.log(`📄 讀取 ${records.length} 筆資料`);

  // 解析所有行
  const parsedRows = records
    .map(parseCSVRow)
    .filter(row => row.year > 0 && row.name);

  console.log(`✅ 過濾後 ${parsedRows.length} 筆有效資料`);

  // 按年份分組
  const byYear = parsedRows.reduce((acc, row) => {
    if (!acc[row.year]) acc[row.year] = [];
    acc[row.year].push(row);
    return acc;
  }, {} as Record<number, any[]>);

  // 按球員分組
  const byPlayer = parsedRows.reduce((acc, row) => {
    if (!acc[row.code]) acc[row.code] = [];
    acc[row.code].push(row);
    return acc;
  }, {} as Record<string, any[]>);

  // 建立輸出目錄
  const outputDir = path.join(process.cwd(), 'public/data');
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(path.join(outputDir, 'seasons'), { recursive: true });
  await fs.mkdir(path.join(outputDir, 'players'), { recursive: true });

  // 1. 生成各年度摘要
  for (const [year, rows] of Object.entries(byYear)) {
    const byTeam = rows.reduce((acc, row) => {
      if (!acc[row.team]) acc[row.team] = [];
      acc[row.team].push(row);
      return acc;
    }, {} as Record<string, any[]>);

    const summary: any = {
      year: parseInt(year),
      lastUpdated: new Date().toISOString(),
      teams: {},
    };

    for (const [teamName, teamPlayers] of Object.entries(byTeam)) {
      const teamId = teamName.toLowerCase().replace(/\s+/g, '-');
      summary.teams[teamId] = {
        teamId,
        teamName,
        stats: {
          totalPlayers: teamPlayers.length,
          avgBattingAvg: teamPlayers.reduce((sum, p) => sum + (p.batting.hits / p.batting.ab || 0), 0) / teamPlayers.length,
          totalHomeRuns: teamPlayers.reduce((sum, p) => sum + p.batting.hr, 0),
        },
        players: teamPlayers.map(p => ({
          id: p.code,
          name: p.name,
          number: p.number,
          photo: p.photo,
          team: p.team,
          seasonStats: {
            ...p.batting,
            avg: p.batting.hits / p.batting.ab || 0,
            obp: (p.batting.hits + p.batting.bb) / (p.batting.ab + p.batting.bb) || 0,
            slg: p.batting.totalBases / p.batting.ab || 0,
            ops: ((p.batting.hits + p.batting.bb) / (p.batting.ab + p.batting.bb) || 0) + (p.batting.totalBases / p.batting.ab || 0),
            iso: 0,
            babip: 0,
            kPct: 0,
            bbPct: 0,
          },
          rankings: p.rankings,
        })),
      };
    }

    await fs.writeFile(
      path.join(outputDir, 'seasons', `${year}_summary.json`),
      JSON.stringify(summary, null, 2)
    );

    console.log(`✅ ${year} 年度摘要已生成`);
  }

  // 2. 生成球員詳細資料
  for (const [code, rows] of Object.entries(byPlayer)) {
    const player = transformPlayerData(rows);

    await fs.writeFile(
      path.join(outputDir, 'players', `${code}.json`),
      JSON.stringify(player, null, 2)
    );
  }

  console.log(`✅ ${Object.keys(byPlayer).length} 位球員資料已生成`);

  // 3. 生成球團列表
  const teams = [...new Set(parsedRows.map(row => row.team))].map(teamName => ({
    id: teamName.toLowerCase().replace(/\s+/g, '-'),
    name: teamName,
    code: teamName.substring(0, 3).toUpperCase(),
    logo: '',
  }));

  await fs.writeFile(
    path.join(outputDir, 'teams.json'),
    JSON.stringify({ teams }, null, 2)
  );

  console.log(`✅ ${teams.length} 個球團資料已生成`);

  // 4. 生成聯盟統計
  for (const [year, rows] of Object.entries(byYear)) {
    const leagueStats = calculateLeagueStats(rows, parseInt(year));

    await fs.writeFile(
      path.join(outputDir, 'seasons', `${year}_league.json`),
      JSON.stringify(leagueStats, null, 2)
    );
  }

  console.log('🎉 轉換完成！');
}

// 執行
main().catch(console.error);
