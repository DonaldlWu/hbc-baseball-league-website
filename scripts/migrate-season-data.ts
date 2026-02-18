/**
 * 資料遷移腳本：將分散的 JSON 合併為統一的 seasons/*.json
 *
 * 資料來源：
 * - standings_2025.json → 戰績資料
 * - season_games/2025.json, 2026.json → 比賽狀態
 * - schedules/2026-01.json, 2026-02.json → 時段、時間
 * - game-reports/index.json → sheetId
 *
 * 輸出：
 * - seasons/2025.json
 * - seasons/2026.json
 */

import fs from 'fs/promises';
import path from 'path';

// 定義 TimeSlot 類型
type TimeSlot = '上午' | '中午' | '下午';
type GameStatusExtended = 'finished' | 'scheduled' | 'rain' | 'cancelled';
type StandingsSource = 'manual' | 'partial' | 'calculated';

// 統一比賽資料
interface SeasonGame {
  date: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  timeSlot: TimeSlot;
  startTime: string;
  endTime: string;
  status: GameStatusExtended;
  homeScore: number | null;
  awayScore: number | null;
  sheetId: string;
  note?: string;
}

// 球隊戰績
interface TeamRecordRaw {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  draws: number;
  runsAllowed: number;
  runsScored: number;
}

// 統一賽季戰績
interface SeasonStandings {
  source: StandingsSource;
  teams: TeamRecordRaw[];
}

// 統一賽季資料
interface SeasonData {
  season: number;
  lastUpdated: string;
  standings: SeasonStandings;
  games: Record<string, SeasonGame>;
}

// 舊資料格式
interface OldScheduleGame {
  gameNumber: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  timeSlot: TimeSlot;
  startTime: string;
  endTime: string;
  note?: string;
}

interface OldScheduleDay {
  date: string;
  venues: Record<string, OldScheduleGame[]>;
}

interface OldSeasonGame {
  gameNumber: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  status: 'finished' | 'scheduled' | 'rain';
}

interface GameReportEntry {
  sheetId: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
}

const DATA_DIR = path.join(process.cwd(), 'public/data');

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️ 無法讀取 ${filePath}`);
    return null;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n');
}

// 從 schedules 提取遊戲資訊
function extractGamesFromSchedules(
  schedules: Array<{ schedule: { days: OldScheduleDay[] } }>
): Map<string, { timeSlot: TimeSlot; startTime: string; endTime: string; note?: string }> {
  const gameTimeInfo = new Map<string, { timeSlot: TimeSlot; startTime: string; endTime: string; note?: string }>();

  for (const scheduleData of schedules) {
    if (!scheduleData?.schedule?.days) continue;

    for (const day of scheduleData.schedule.days) {
      for (const games of Object.values(day.venues)) {
        for (const game of games) {
          gameTimeInfo.set(game.gameNumber, {
            timeSlot: game.timeSlot,
            startTime: game.startTime,
            endTime: game.endTime,
            note: game.note,
          });
        }
      }
    }
  }

  return gameTimeInfo;
}

// 從 game-reports/index.json 提取 sheetId
function extractSheetIds(gameReports: { games: Record<string, GameReportEntry> }): Map<string, string> {
  const sheetIds = new Map<string, string>();

  if (!gameReports?.games) return sheetIds;

  for (const [gameNumber, entry] of Object.entries(gameReports.games)) {
    // 特殊處理 "rain" 值
    const sheetId = entry.sheetId === 'rain' ? '' : entry.sheetId;
    sheetIds.set(gameNumber, sheetId);
  }

  return sheetIds;
}

// 判斷 status
function determineStatus(
  oldStatus: 'finished' | 'scheduled' | 'rain'
): GameStatusExtended {
  if (oldStatus === 'rain') return 'rain';
  if (oldStatus === 'finished') return 'finished';
  return 'scheduled';
}

async function migrateSeason(season: number): Promise<void> {
  console.log(`\n📦 遷移 ${season} 賽季資料...`);

  // 1. 讀取戰績資料
  const standingsPath = path.join(DATA_DIR, `standings_${season}.json`);
  const standingsData = await readJson<{
    teams: TeamRecordRaw[];
    lastUpdated: string;
  }>(standingsPath);

  // 2. 讀取 season_games
  const seasonGamesPath = path.join(DATA_DIR, `season_games/${season}.json`);
  const seasonGamesData = await readJson<{
    games: OldSeasonGame[];
    lastUpdated: string;
  }>(seasonGamesPath);

  // 3. 讀取 schedules 目錄下所有 JSON 檔案
  const schedulesDir = path.join(DATA_DIR, 'schedules');
  let scheduleFiles: string[] = [];
  try {
    scheduleFiles = (await fs.readdir(schedulesDir)).filter(f => f.endsWith('.json'));
  } catch {
    console.warn('⚠️ 無法讀取 schedules 目錄');
  }
  const scheduleResults = await Promise.all(
    scheduleFiles.map(file =>
      readJson<{ schedule: { days: OldScheduleDay[] } }>(path.join(schedulesDir, file))
    )
  );
  const schedules = scheduleResults.filter(Boolean) as Array<{ schedule: { days: OldScheduleDay[] } }>;

  // 4. 讀取 game-reports/index.json
  const gameReportsIndex = await readJson<{ games: Record<string, GameReportEntry> }>(
    path.join(DATA_DIR, 'game-reports/index.json')
  );

  // 5. 提取輔助資訊
  const gameTimeInfo = extractGamesFromSchedules(schedules);
  const sheetIds = extractSheetIds(gameReportsIndex || { games: {} });

  // 6. 建立統一的 games 資料
  const games: Record<string, SeasonGame> = {};

  if (seasonGamesData?.games) {
    for (const oldGame of seasonGamesData.games) {
      const timeInfo = gameTimeInfo.get(oldGame.gameNumber);
      const sheetId = sheetIds.get(oldGame.gameNumber) || '';

      const game: SeasonGame = {
        date: oldGame.date,
        homeTeam: oldGame.homeTeam,
        awayTeam: oldGame.awayTeam,
        venue: oldGame.venue,
        timeSlot: timeInfo?.timeSlot || '上午',
        startTime: timeInfo?.startTime || '08:00',
        endTime: timeInfo?.endTime || '11:00',
        status: determineStatus(oldGame.status),
        homeScore: null,  // 目前沒有比分資料
        awayScore: null,
        sheetId: sheetId,
      };

      // 加入 note（如果有）
      if (timeInfo?.note) {
        game.note = timeInfo.note;
      }

      games[oldGame.gameNumber] = game;
    }
  }

  // 7. 組合最終資料
  const seasonData: SeasonData = {
    season,
    lastUpdated: new Date().toISOString(),
    standings: {
      source: 'manual',  // 目前戰績都是手動維護
      teams: standingsData?.teams || [],
    },
    games,
  };

  // 8. 輸出
  const outputPath = path.join(DATA_DIR, `seasons/${season}.json`);
  await writeJson(outputPath, seasonData);

  console.log(`✅ ${season} 賽季資料已遷移`);
  console.log(`   - 戰績：${seasonData.standings.teams.length} 隊`);
  console.log(`   - 比賽：${Object.keys(games).length} 場`);
}

async function main(): Promise<void> {
  console.log('🚀 開始遷移賽季資料...\n');

  // 遷移 2025 賽季
  await migrateSeason(2025);

  // 遷移 2026 賽季（可能沒有戰績資料）
  await migrateSeason(2026);

  console.log('\n🎉 遷移完成！');
}

main().catch(console.error);
