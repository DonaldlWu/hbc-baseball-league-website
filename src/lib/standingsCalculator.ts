/**
 * 排行榜積分計算工具
 *
 * 積分規則：
 * - 勝 = 3 分
 * - 和 = 1 分
 * - 敗 = 0 分
 *
 * 勝率 = 勝 / (勝 + 敗)，和局不計入
 * 勝差 = (領先者勝 - 該隊勝 + 該隊敗 - 領先者敗) / 2
 */

import type { TeamRecordRaw, TeamRecord, TeamStreak, StreakType, SeasonGame } from '@/src/types';

// 積分常數
const POINTS_WIN = 3;
const POINTS_DRAW = 1;
const POINTS_LOSS = 0;

/**
 * 計算積分
 * @param wins 勝場數
 * @param draws 和局數
 * @returns 積分
 */
export function calculatePoints(wins: number, draws: number): number {
  return wins * POINTS_WIN + draws * POINTS_DRAW;
}

/**
 * 計算勝率
 * @param wins 勝場數
 * @param losses 敗場數
 * @returns 勝率（0-1 之間的小數）
 */
export function calculateWinRate(wins: number, losses: number): number {
  const totalDecisions = wins + losses;
  if (totalDecisions === 0) return 0;
  return wins / totalDecisions;
}

/**
 * 計算勝差
 * @param leader 領先者的勝敗數據
 * @param team 該隊的勝敗數據
 * @returns 勝差
 */
export function calculateGamesBehind(
  leader: { wins: number; losses: number },
  team: { wins: number; losses: number }
): number {
  return (leader.wins - team.wins + team.losses - leader.losses) / 2;
}

/**
 * 計算並排序所有球隊的戰績
 * @param teams 原始球隊資料
 * @param streaks 各隊近況（選填）
 * @param specialTags 各隊特殊標籤（選填）
 * @returns 計算後並依積分排序的球隊資料
 */
export function calculateStandings(
  teams: TeamRecordRaw[],
  streaks?: TeamStreak[],
  specialTags?: Map<string, string>
): TeamRecord[] {
  const streakByName = new Map<string, TeamStreak>(
    (streaks ?? []).map((s) => [s.teamName, s])
  );

  // 計算每隊的積分和勝率
  const teamsWithStats = teams.map((team) => ({
    ...team,
    gamesPlayed: team.wins + team.losses + team.draws,
    points: calculatePoints(team.wins, team.draws),
    winRate: calculateWinRate(team.wins, team.losses),
    gamesBehind: null as number | null,
    streak: streakByName.get(team.teamName),
    specialTag: specialTags?.get(team.teamName),
  }));

  // 依積分排序（積分相同則依勝率）
  teamsWithStats.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return b.winRate - a.winRate;
  });

  // 計算勝差並更新排名
  const leader = teamsWithStats[0];
  return teamsWithStats.map((team, index) => ({
    ...team,
    rank: index + 1,
    gamesBehind:
      index === 0
        ? null
        : calculateGamesBehind(
            { wins: leader.wins, losses: leader.losses },
            { wins: team.wins, losses: team.losses }
          ),
  }));
}

/**
 * 計算每支球隊的連勝/連敗/連平近況
 * @param games 賽季比賽資料
 * @returns 各隊近況陣列
 */
export function calculateStreaks(games: Record<string, SeasonGame>): TeamStreak[] {
  // 只看 finished 且有比分的場次
  const finished = Object.values(games).filter(
    (g) => g.status === 'finished' && g.homeScore !== null && g.awayScore !== null
  );

  if (finished.length === 0) return [];

  // 按日期升序排序
  finished.sort((a, b) => a.date.localeCompare(b.date));

  // 建立每隊的勝敗平時序
  const historyByTeam = new Map<string, StreakType[]>();

  for (const game of finished) {
    const homeResult: StreakType =
      (game.homeScore as number) > (game.awayScore as number) ? 'W'
        : (game.homeScore as number) < (game.awayScore as number) ? 'L'
          : 'D';
    const awayResult: StreakType = homeResult === 'W' ? 'L' : homeResult === 'L' ? 'W' : 'D';

    const homeHistory = historyByTeam.get(game.homeTeam) ?? [];
    homeHistory.push(homeResult);
    historyByTeam.set(game.homeTeam, homeHistory);

    const awayHistory = historyByTeam.get(game.awayTeam) ?? [];
    awayHistory.push(awayResult);
    historyByTeam.set(game.awayTeam, awayHistory);
  }

  // 從最後一場往前掃，計算連續相同結果
  const streaks: TeamStreak[] = [];
  for (const [teamName, history] of historyByTeam.entries()) {
    const last = history[history.length - 1];
    let count = 1;
    for (let i = history.length - 2; i >= 0; i--) {
      if (history[i] === last) {
        count++;
      } else {
        break;
      }
    }
    streaks.push({ teamName, type: last, count });
  }

  return streaks;
}

/**
 * 計算特殊標籤（如「雨神同行」）
 * 規則：取 finished 或 rain 的場次（排除 scheduled/cancelled），
 * 若某球隊最後 2 場都是 rain，則標記「雨神同行」
 * @param games 賽季比賽資料
 * @returns 球隊名稱 → 特殊標籤的 Map
 */
export function calculateSpecialTags(
  games: Record<string, SeasonGame>
): Map<string, string> {
  // 只取 finished 或 rain 的場次
  const relevant = Object.values(games).filter(
    (g) => g.status === 'finished' || g.status === 'rain'
  );

  // 按日期升序
  relevant.sort((a, b) => a.date.localeCompare(b.date));

  // 建立每隊的狀態時序（只記 finished/rain）
  const historyByTeam = new Map<string, Array<'finished' | 'rain'>>();

  for (const game of relevant) {
    const status = game.status as 'finished' | 'rain';

    const homeHist = historyByTeam.get(game.homeTeam) ?? [];
    homeHist.push(status);
    historyByTeam.set(game.homeTeam, homeHist);

    const awayHist = historyByTeam.get(game.awayTeam) ?? [];
    awayHist.push(status);
    historyByTeam.set(game.awayTeam, awayHist);
  }

  const result = new Map<string, string>();

  for (const [teamName, history] of historyByTeam.entries()) {
    if (
      history.length >= 2 &&
      history[history.length - 1] === 'rain' &&
      history[history.length - 2] === 'rain'
    ) {
      result.set(teamName, '雨神同行');
    }
  }

  return result;
}
