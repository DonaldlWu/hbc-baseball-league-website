/**
 * Data Loader
 * 載入球員、球團、賽季資料的純函數
 */

import type {
  Player,
  Team,
  SeasonSummary,
  LeagueStats,
  PlayerSummary,
} from '@/src/types';

/**
 * 載入年度摘要
 * @param year 年份
 * @returns 年度摘要資料
 */
export async function loadSeasonSummary(year: number): Promise<SeasonSummary> {
  const response = await fetch(`/data/seasons/${year}_summary.json`);

  if (!response.ok) {
    throw new Error(`Failed to load season ${year}: ${response.status}`);
  }

  return response.json();
}

/**
 * 載入球員詳細資料
 * @param playerId 球員 ID (聯盟編碼)
 * @returns 球員完整資料
 */
export async function loadPlayerDetail(playerId: string): Promise<Player> {
  const response = await fetch(`/data/players/${playerId}.json`);

  if (!response.ok) {
    throw new Error(`Failed to load player ${playerId}: ${response.status}`);
  }

  return response.json();
}

/**
 * 載入球團列表
 * @returns 所有球團列表
 */
export async function loadTeams(): Promise<Team[]> {
  const response = await fetch('/data/teams.json');

  if (!response.ok) {
    throw new Error(`Failed to load teams: ${response.status}`);
  }

  const data = await response.json();
  return data.teams;
}

/**
 * 載入聯盟統計
 * @param year 年份
 * @returns 聯盟統計資料
 */
export async function loadLeagueStats(year: number): Promise<LeagueStats> {
  const response = await fetch(`/data/seasons/${year}_league.json`);

  if (!response.ok) {
    throw new Error(`Failed to load league stats for ${year}: ${response.status}`);
  }

  return response.json();
}

/**
 * 從年度摘要中取得指定球團的球員列表
 * @param year 年份
 * @param teamId 球團 ID
 * @returns 球員摘要列表
 */
export async function getPlayersByTeam(
  year: number,
  teamId: string
): Promise<PlayerSummary[]> {
  const summary = await loadSeasonSummary(year);
  const teamData = summary.teams[teamId];

  if (!teamData) {
    return [];
  }

  return teamData.players;
}

/**
 * 從年度摘要中取得球團資訊
 * @param year 年份
 * @param teamId 球團 ID
 * @returns 球團資料 (含球員列表)
 */
export async function getTeamPlayers(
  year: number,
  teamId: string
): Promise<SeasonSummary['teams'][string] | undefined> {
  const summary = await loadSeasonSummary(year);
  return summary.teams[teamId];
}
