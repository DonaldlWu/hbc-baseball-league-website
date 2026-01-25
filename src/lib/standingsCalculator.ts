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

import type { TeamRecordRaw, TeamRecord } from '@/src/types';

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
 * @returns 計算後並依積分排序的球隊資料
 */
export function calculateStandings(teams: TeamRecordRaw[]): TeamRecord[] {
  // 計算每隊的積分和勝率
  const teamsWithStats = teams.map((team) => ({
    ...team,
    gamesPlayed: team.wins + team.losses + team.draws,
    points: calculatePoints(team.wins, team.draws),
    winRate: calculateWinRate(team.wins, team.losses),
    gamesBehind: null as number | null,
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
