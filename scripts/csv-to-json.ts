import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import type { Player, LeagueStats } from '../src/types';

// 處理重複欄位名稱的函數
export function handleDuplicateColumns(columns: string[]): string[] {
  const seen = new Map<string, number>();
  return columns.map((col) => {
    const count = seen.get(col) || 0;
    seen.set(col, count + 1);
    if (count === 0) {
      return col;
    }
    // 第二個 '四死' 欄位重新命名為 '投手四死'
    if (col === '四死') {
      return '投手四死';
    }
    return `${col}_${count + 1}`;
  });
}

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

  // 投手數據
  const ip = safeParseFloat(row['局數']);
  const bf = safeParseInt(row['人次']);
  const pitchingSO = safeParseInt(row['奪三振']);
  const pitchingBB = safeParseInt(row['投手四死']);  // 投手的保送（被四死球）- 使用重新命名的欄位
  const h = safeParseInt(row['被安打']);
  const pitchingHR = safeParseInt(row['被HR']);
  const r = safeParseInt(row['失分']);
  const er = safeParseInt(row['責失']);
  const pitchingGames = safeParseInt(row['出場']);
  const w = safeParseInt(row['勝']);
  const l = safeParseInt(row['負']);
  const sv = safeParseInt(row['救援點']);
  const hld = safeParseInt(row['和']);
  const cs = safeParseInt(row['阻殺成功']);
  const csAttempts = cs + safeParseInt(row['阻殺失敗']);

  // 判斷是否有投球數據（局數 > 0）
  const hasPitchingData = ip > 0;

  // 計算投球數據
  let pitchingCalculated = null;
  if (hasPitchingData) {
    const era = ip > 0 ? (er * 9) / ip : 0;
    const whip = ip > 0 ? (h + pitchingBB) / ip : 0;
    const fip = safeParseFloat(row['FIP數據']);
    const kPer9 = ip > 0 ? (pitchingSO * 9) / ip : 0;
    const bbPer9 = ip > 0 ? (pitchingBB * 9) / ip : 0;
    const hPer9 = ip > 0 ? (h * 9) / ip : 0;
    const csPercentage = csAttempts > 0 ? cs / csAttempts : 0;

    pitchingCalculated = {
      era,
      whip,
      fip: fip > 0 ? fip : null,
      kPer9,
      bbPer9,
      hPer9,
      csPercentage,
    };
  }

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
    pitching: hasPitchingData ? {
      games: pitchingGames,
      ip,
      bf,
      so: pitchingSO,
      bb: pitchingBB,
      h,
      hr: pitchingHR,
      r,
      er,
      w,
      l,
      sv,
      hld,
      cs,
      csAttempts,
    } : null,
    pitchingCalculated,
    advanced: {
      rc: safeParseFloat(row['RC數據']),
    },
    rankings: {
      rc: safeParseInt(row['RC排名']),
      hits: safeParseInt(row['安打排名']),
      hr: safeParseInt(row['全壘打排名']),
      rbi: safeParseInt(row['打點排名']),
      avg: safeParseInt(row['打擊率排名']),
      // 投手排名
      w: safeParseInt(row['勝排名']),
      sv: safeParseInt(row['救援排名']),
      so: safeParseInt(row['奪三振排名']),
      era: safeParseInt(row['防禦率排名']),
      whip: safeParseInt(row['WHIP排名']),
      fip: safeParseInt(row['FIP排名']),
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
    pitching: row.pitching,
    pitchingCalculated: row.pitchingCalculated,
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

  // 讀取 all_teams.json 建立名稱到 ID 的映射
  const allTeamsPath = path.join(process.cwd(), 'public/data/all_teams.json');
  let teamNameToIdMap: Map<string, string> = new Map();

  try {
    const allTeamsContent = await fs.readFile(allTeamsPath, 'utf-8');
    const allTeams = JSON.parse(allTeamsContent);
    allTeams.forEach((team: any) => {
      teamNameToIdMap.set(team.name, team.id);
    });
    console.log(`✅ 載入 ${teamNameToIdMap.size} 個球隊映射`);
  } catch (error) {
    console.warn('⚠️ 無法載入 all_teams.json，將使用球隊名稱作為 ID');
  }

  // 讀取 CSV
  const csvPath = path.join(process.cwd(), 'data/raw/data.csv');
  const csvContent = await fs.readFile(csvPath, 'utf-8');

  // 解析 CSV (跳過第一行聯盟統計，從第二行標題開始)
  // 使用自訂 columns 函數處理重複的欄位名稱 (如 '四死' 出現兩次)
  const records = parse(csvContent, {
    columns: (header) => handleDuplicateColumns(header),
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
  for (const [year, rows] of Object.entries(byYear) as [string, any[]][]) {
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

    for (const [teamName, teamPlayers] of Object.entries(byTeam) as [string, any[]][]) {
      // 使用 all_teams.json 中的正確 teamId
      const teamId = teamNameToIdMap.get(teamName) || teamName;
      summary.teams[teamId] = {
        teamId,
        teamName,
        stats: {
          totalPlayers: teamPlayers.length,
          avgBattingAvg: (() => {
            const totalH = teamPlayers.reduce((sum, p) => sum + p.batting.hits, 0);
            const totalAB = teamPlayers.reduce((sum, p) => sum + p.batting.ab, 0);
            return totalAB > 0 ? totalH / totalAB : 0;
          })(),
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
          pitchingStats: p.pitching && p.pitchingCalculated ? {
            ...p.pitching,
            ...p.pitchingCalculated,
          } : undefined,
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
  for (const [code, rows] of Object.entries(byPlayer) as [string, any[]][]) {
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
