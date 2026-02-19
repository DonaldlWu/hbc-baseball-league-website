/**
 * Season Data Loader
 * 載入統一賽季資料（seasons/YYYY.json）的純函數（客戶端用）
 */

import type { SeasonData, SeasonGame, SeasonIndexEntry, LeagueStandings, DaySchedule, Game } from '@/src/types';
import { calculateStandings, calculateStreaks, calculateSpecialTags } from './standingsCalculator';

/**
 * 載入統一賽季資料
 * @param year 賽季年份
 * @returns 統一賽季資料
 */
export async function loadSeasonData(year: number): Promise<SeasonData> {
  const response = await fetch(`/data/seasons/${year}.json`);

  if (!response.ok) {
    throw new Error(`Failed to load season data for ${year}: ${response.status}`);
  }

  return response.json();
}

/**
 * 取得指定月份的比賽（含 gameNumber）
 * @param data 賽季資料
 * @param year 日曆年份
 * @param month 月份 (1-12)
 * @returns 比賽陣列（每筆含 gameNumber 欄位）
 */
export function getGamesByMonth(
  data: SeasonData,
  year: number,
  month: number
): Array<SeasonGame & { gameNumber: string }> {
  const prefix = `${year}-${month.toString().padStart(2, '0')}`;
  const result: Array<SeasonGame & { gameNumber: string }> = [];

  for (const [gameNumber, game] of Object.entries(data.games)) {
    if (game.date.startsWith(prefix)) {
      const hasReschedule = game.rescheduledDates && game.rescheduledDates.length > 0;
      result.push({
        gameNumber,
        ...game,
        status: hasReschedule ? 'rain' : game.status,
      });
    }
    if (game.rescheduledDates && game.rescheduledDates.length > 0) {
      game.rescheduledDates.forEach((reschedule, index) => {
        if (reschedule.date.startsWith(prefix)) {
          const isLast = index === game.rescheduledDates!.length - 1;
          result.push({
            gameNumber,
            ...game,
            date: reschedule.date,
            ...(reschedule.venue && { venue: reschedule.venue }),
            ...(reschedule.timeSlot && { timeSlot: reschedule.timeSlot }),
            ...(reschedule.startTime && { startTime: reschedule.startTime }),
            ...(reschedule.endTime && { endTime: reschedule.endTime }),
            status: isLast ? game.status : 'rain',
          });
        }
      });
    }
  }

  return result;
}

/**
 * 取得指定球隊的比賽（含 gameNumber）
 * @param data 賽季資料
 * @param teamName 球隊名稱
 * @returns 比賽陣列（每筆含 gameNumber 欄位）
 */
export function getGamesByTeam(
  data: SeasonData,
  teamName: string
): Array<SeasonGame & { gameNumber: string }> {
  return Object.entries(data.games)
    .filter(([, game]) => game.homeTeam === teamName || game.awayTeam === teamName)
    .map(([gameNumber, game]) => ({ gameNumber, ...game }));
}

/**
 * 從統一賽季資料載入聯盟戰績排名
 * @param year 賽季年份
 * @returns 聯盟戰績排名（含計算欄位、連勝連敗近況、特殊標籤）
 */
export async function loadStandingsFromSeason(year: number): Promise<LeagueStandings> {
  const data = await loadSeasonData(year);
  const streaks = calculateStreaks(data.games);
  const specialTags = calculateSpecialTags(data.games);
  const teamsWithStats = calculateStandings(data.standings.teams, streaks, specialTags);

  return {
    year: data.season,
    league: '新和週六野球聯盟',
    lastUpdated: data.lastUpdated,
    teams: teamsWithStats,
  };
}

// 賽季索引快取
let seasonIndexCache: SeasonIndexEntry[] | null = null;

/**
 * 重置賽季索引快取（僅供測試使用）
 * @internal
 */
export function resetSeasonIndexCache(): void {
  seasonIndexCache = null;
}

/**
 * 載入賽季索引（含快取）
 * @returns 賽季索引項目陣列
 */
export async function loadSeasonIndex(): Promise<SeasonIndexEntry[]> {
  if (seasonIndexCache) {
    return seasonIndexCache;
  }

  const response = await fetch('/data/seasons/index.json');

  if (!response.ok) {
    throw new Error(`Failed to load season index: ${response.status}`);
  }

  const data: SeasonIndexEntry[] = await response.json();
  seasonIndexCache = data;
  return data;
}

/**
 * 根據日曆年月找出對應的賽季年份
 * @param index 賽季索引
 * @param calYear 日曆年份
 * @param calMonth 日曆月份 (1-12)
 * @returns 對應的賽季年份；若無精確匹配，回傳第一個賽季年份
 */
export function findSeasonByMonth(
  index: SeasonIndexEntry[],
  calYear: number,
  calMonth: number
): number {
  const target = `${calYear}-${calMonth.toString().padStart(2, '0')}`;

  const match = index.find((entry) => entry.start <= target && target <= entry.end);

  return match ? match.season : index[0].season;
}

/**
 * 將 SeasonGame 轉換為 DaySchedule 可用的 Game 格式
 */
function toGame(gameNumber: string, seasonGame: SeasonGame): Game {
  const isFinished = seasonGame.status === 'finished';
  const hasScore = seasonGame.homeScore !== null && seasonGame.awayScore !== null;

  return {
    gameNumber,
    homeTeam: seasonGame.homeTeam,
    awayTeam: seasonGame.awayTeam,
    venue: seasonGame.venue,
    timeSlot: seasonGame.timeSlot,
    startTime: seasonGame.startTime,
    endTime: seasonGame.endTime,
    status: seasonGame.status,
    note: seasonGame.note,
    ...(isFinished && hasScore
      ? {
          result: {
            homeScore: seasonGame.homeScore as number,
            awayScore: seasonGame.awayScore as number,
            status: 'finished' as const,
          },
        }
      : {}),
  };
}

/**
 * 載入指定日曆月份的比賽，自動跨賽季處理，回傳 DaySchedule[] 格式
 * @param calYear 日曆年份
 * @param calMonth 日曆月份 (1-12)
 * @returns 按日期分組的賽程陣列
 */
export async function loadGamesByCalendarMonth(
  calYear: number,
  calMonth: number
): Promise<DaySchedule[]> {
  const index = await loadSeasonIndex();
  const target = `${calYear}-${calMonth.toString().padStart(2, '0')}`;

  const matchingSeasons = index.filter((entry) => entry.start <= target && target <= entry.end);
  const seasonsToLoad = matchingSeasons.length > 0 ? matchingSeasons : [index[0]];

  const allGames: Array<SeasonGame & { gameNumber: string }> = [];
  for (const entry of seasonsToLoad) {
    const data = await loadSeasonData(entry.season);
    allGames.push(...getGamesByMonth(data, calYear, calMonth));
  }

  // Group by date, then by venue
  const byDate = new Map<string, Map<string, Game[]>>();

  for (const game of allGames) {
    if (!byDate.has(game.date)) {
      byDate.set(game.date, new Map());
    }
    const byVenue = byDate.get(game.date)!;
    if (!byVenue.has(game.venue)) {
      byVenue.set(game.venue, []);
    }
    byVenue.get(game.venue)!.push(toGame(game.gameNumber, game));
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, byVenue]) => ({
      date,
      venues: Object.fromEntries(
        Array.from(byVenue.entries()).map(([venue, vGames]) => [
          venue,
          vGames.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        ])
      ),
    }));
}
