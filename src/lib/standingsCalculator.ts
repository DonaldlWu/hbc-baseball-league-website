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

// 中間計算型別
type TeamWithStats = TeamRecordRaw & {
  gamesPlayed: number;
  points: number;
  winRate: number;
  gamesBehind: number | null;
  streak: TeamStreak | undefined;
  specialTag: string | undefined;
};

/**
 * 計算並排序所有球隊的戰績
 * @param teams 原始球隊資料
 * @param streaks 各隊近況（選填）
 * @param specialTags 各隊特殊標籤（選填）
 * @param games 賽季比賽資料（選填）- 提供時自動依對戰成績處理並列，適用於資料完整的賽季；
 *             未提供時依 tiebreakRank 欄位處理並列，適用於人工排名的賽季
 * @returns 計算後並依積分排序的球隊資料
 */
export function calculateStandings(
  teams: TeamRecordRaw[],
  streaks?: TeamStreak[],
  specialTags?: Map<string, string>,
  games?: Record<string, SeasonGame>
): TeamRecord[] {
  const streakByName = new Map<string, TeamStreak>(
    (streaks ?? []).map((s) => [s.teamName, s])
  );

  // 計算每隊的積分和勝率
  const teamsWithStats: TeamWithStats[] = teams.map((team) => ({
    ...team,
    gamesPlayed: team.wins + team.losses + team.draws,
    points: calculatePoints(team.wins, team.draws),
    winRate: calculateWinRate(team.wins, team.losses),
    gamesBehind: null as number | null,
    streak: streakByName.get(team.teamName),
    specialTag: specialTags?.get(team.teamName),
  }));

  // 依積分排序（積分相同則依勝率；仍相同時 stable sort 保留輸入順序）
  teamsWithStats.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.winRate - a.winRate;
  });

  // 處理並列排名
  if (games !== undefined) {
    // 有賽事資料：自動依對戰成績排名（適用於 2026+ 資料完整的賽季）
    resolveGroupTiesWithGames(teamsWithStats, games, teamsWithStats[0]);
  } else {
    // 無賽事資料：依 tiebreakRank 處理並列（適用於 2025 人工排名）
    resolveGroupTiesWithTiebreakRank(teamsWithStats);
  }

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
 * 取得某隊在並列群組內的對戰成績（積分 + 失分）
 */
function getHeadToHeadStats(
  teamName: string,
  groupNames: Set<string>,
  games: Record<string, SeasonGame>
): { points: number; runsAllowed: number } {
  let points = 0;
  let runsAllowed = 0;

  for (const game of Object.values(games)) {
    if (
      game.status !== 'finished' ||
      game.homeScore === null ||
      game.awayScore === null
    ) continue;
    if (!groupNames.has(game.homeTeam) || !groupNames.has(game.awayTeam)) continue;
    if (game.homeTeam !== teamName && game.awayTeam !== teamName) continue;

    const isHome = game.homeTeam === teamName;
    const scored = isHome ? game.homeScore : game.awayScore;
    const allowed = isHome ? game.awayScore : game.homeScore;

    runsAllowed += allowed;
    if (scored > allowed) points += 3;
    else if (scored === allowed) points += 1;
  }

  return { points, runsAllowed };
}

/**
 * 對積分+勝率相同的並列群組，依對戰成績重新排序
 * 排序優先序：對戰積分 → 對戰失分（少的優先）→ 勝差GB（少的優先）→ 整體均失（少的優先）
 */
function resolveGroupTiesWithGames(
  sorted: TeamWithStats[],
  games: Record<string, SeasonGame>,
  leader: { wins: number; losses: number }
): void {
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (
      j < sorted.length &&
      sorted[j].points === sorted[i].points &&
      sorted[j].winRate === sorted[i].winRate
    ) {
      j++;
    }

    if (j > i + 1) {
      const group = sorted.slice(i, j);
      const groupNames = new Set(group.map((t) => t.teamName));
      const h2hMap = new Map(
        group.map((t) => [t.teamName, getHeadToHeadStats(t.teamName, groupNames, games)])
      );

      group.sort((a, b) => {
        const ah2h = h2hMap.get(a.teamName)!;
        const bh2h = h2hMap.get(b.teamName)!;
        if (bh2h.points !== ah2h.points) return bh2h.points - ah2h.points;
        if (ah2h.runsAllowed !== bh2h.runsAllowed) return ah2h.runsAllowed - bh2h.runsAllowed;
        const aGB = calculateGamesBehind(leader, a);
        const bGB = calculateGamesBehind(leader, b);
        if (aGB !== bGB) return aGB - bGB;
        return a.runsAllowed - b.runsAllowed;
      });

      sorted.splice(i, j - i, ...group);
    }

    i = j;
  }
}

/**
 * 對積分+勝率相同的並列群組，依 tiebreakRank 重新排序
 * 只有群組內所有成員都設有 tiebreakRank 才排序，否則維持穩定排序的原始順序
 */
function resolveGroupTiesWithTiebreakRank(sorted: TeamWithStats[]): void {
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (
      j < sorted.length &&
      sorted[j].points === sorted[i].points &&
      sorted[j].winRate === sorted[i].winRate
    ) {
      j++;
    }

    if (j > i + 1) {
      const group = sorted.slice(i, j);
      if (group.every((t) => t.tiebreakRank !== undefined)) {
        group.sort((a, b) => (a.tiebreakRank ?? 999) - (b.tiebreakRank ?? 999));
        sorted.splice(i, j - i, ...group);
      }
    }

    i = j;
  }
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
