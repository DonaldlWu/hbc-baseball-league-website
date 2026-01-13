/**
 * Data Loader
 * 載入球員、球團、賽季資料的純函數
 */

import type {
  Player,
  Team,
  TeamInfo,
  SeasonSummary,
  LeagueStats,
  TeamSummary,
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

/**
 * 取得所有可用的年份列表
 * 從 2009 年開始往後檢查，直到找不到資料為止
 * @returns 年份陣列（降序排列）
 */
export async function getAvailableYears(): Promise<number[]> {
  const years: number[] = [];
  const currentYear = new Date().getFullYear();
  const startYear = 2009; // 資料從 2009 年開始

  // 從當前年份往回查詢到起始年份
  for (let year = currentYear; year >= startYear; year--) {
    try {
      const response = await fetch(`/data/seasons/${year}_summary.json`);
      if (response.ok) {
        years.push(year);
      }
    } catch (error) {
      // 檔案不存在，繼續查詢下一年
      continue;
    }
  }

  return years;
}

/**
 * 從年度摘要中提取球隊列表
 * @param summary 年度摘要資料
 * @returns 球隊摘要陣列（按名稱排序）
 */
export function extractTeamsFromSeason(summary: SeasonSummary): TeamSummary[] {
  const teams: TeamSummary[] = [];

  for (const [, teamData] of Object.entries(summary.teams)) {
    teams.push({
      teamId: teamData.teamId,
      teamName: teamData.teamName,
      year: summary.year,
      stats: teamData.stats,
      playerCount: teamData.players.length,
    });
  }

  // 按球隊名稱排序
  return teams.sort((a, b) => a.teamName.localeCompare(b.teamName));
}

/**
 * 載入聯盟排名資料
 * @param year 年份
 * @returns 聯盟排名資料
 */
export async function loadStandings(year: number): Promise<import('@/src/types').LeagueStandings> {
  const response = await fetch(`/data/standings_${year}.json`);

  if (!response.ok) {
    throw new Error(`Failed to load standings for ${year}: ${response.status}`);
  }

  return response.json();
}

/**
 * 載入所有球隊資訊（all_teams.json）
 * @returns 所有球隊資訊陣列
 */
export async function loadAllTeams(): Promise<TeamInfo[]> {
  const response = await fetch('/data/all_teams.json');

  if (!response.ok) {
    throw new Error(`Failed to load all teams: ${response.status}`);
  }

  return response.json();
}

// 快取球隊資訊
let teamsCache: TeamInfo[] | null = null;

/**
 * 根據球隊名稱取得球隊 ID
 * @param teamName 球隊名稱
 * @returns 球隊 ID，如果找不到則返回球隊名稱本身
 */
export async function getTeamIdByName(teamName: string): Promise<string> {
  try {
    // 如果快取不存在，載入球隊資訊
    if (!teamsCache) {
      teamsCache = await loadAllTeams();
    }

    // 根據球隊名稱尋找對應的球隊資訊
    const team = teamsCache.find(t => t.name === teamName);

    // 如果找到就返回 id，否則返回原始名稱
    return team?.id || teamName;
  } catch (error) {
    console.error(`Failed to get team id for ${teamName}:`, error);
    return teamName;
  }
}

/**
 * 根據球隊 ID 取得球隊名稱
 * @param teamId 球隊 ID
 * @returns 球隊名稱，如果找不到則返回球隊 ID 本身
 */
export async function getTeamNameById(teamId: string): Promise<string> {
  try {
    // 如果快取不存在，載入球隊資訊
    if (!teamsCache) {
      teamsCache = await loadAllTeams();
    }

    // 根據球隊 ID 尋找對應的球隊資訊
    const team = teamsCache.find(t => t.id === teamId);

    // 如果找到就返回 name，否則返回原始 ID
    return team?.name || teamId;
  } catch (error) {
    console.error(`Failed to get team name for ${teamId}:`, error);
    return teamId;
  }
}

/**
 * 根據球隊名稱取得球隊圖標 URL
 * @param teamName 球隊名稱
 * @returns 球隊圖標 URL，如果找不到則返回 undefined
 */
export async function getTeamIcon(teamName: string): Promise<string | undefined> {
  try {
    // 如果快取不存在，載入球隊資訊
    if (!teamsCache) {
      teamsCache = await loadAllTeams();
    }

    // 根據球隊名稱尋找對應的球隊資訊
    const team = teamsCache.find(t => t.name === teamName);

    return team?.iconUrl;
  } catch (error) {
    console.error(`Failed to get team icon for ${teamName}:`, error);
    return undefined;
  }
}

/**
 * 批量取得多個球隊的圖標 URL
 * @param teamNames 球隊名稱陣列
 * @returns 球隊名稱到圖標 URL 的映射
 */
export async function getTeamIcons(teamNames: string[]): Promise<Map<string, string>> {
  const iconMap = new Map<string, string>();

  try {
    if (!teamsCache) {
      teamsCache = await loadAllTeams();
    }

    for (const teamName of teamNames) {
      const team = teamsCache.find(t => t.name === teamName);
      if (team?.iconUrl) {
        iconMap.set(teamName, team.iconUrl);
      }
    }
  } catch (error) {
    console.error('Failed to get team icons:', error);
  }

  return iconMap;
}

/**
 * 根據球隊 ID 取得球隊圖標 URL
 * @param teamId 球隊 ID
 * @returns 球隊圖標 URL，如果找不到則返回 undefined
 */
export async function getTeamIconById(teamId: string): Promise<string | undefined> {
  try {
    // 如果快取不存在，載入球隊資訊
    if (!teamsCache) {
      teamsCache = await loadAllTeams();
    }

    // 根據球隊 ID 尋找對應的球隊資訊
    const team = teamsCache.find(t => t.id === teamId);

    return team?.iconUrl;
  } catch (error) {
    console.error(`Failed to get team icon for ${teamId}:`, error);
    return undefined;
  }
}

/**
 * 批量取得多個球隊的圖標 URL（根據 ID）
 * @param teamIds 球隊 ID 陣列
 * @returns 球隊 ID 到圖標 URL 的映射
 */
export async function getTeamIconsByIds(teamIds: string[]): Promise<Map<string, string>> {
  const iconMap = new Map<string, string>();

  try {
    if (!teamsCache) {
      teamsCache = await loadAllTeams();
    }

    for (const teamId of teamIds) {
      const team = teamsCache.find(t => t.id === teamId);
      if (team?.iconUrl) {
        iconMap.set(teamId, team.iconUrl);
      }
    }
  } catch (error) {
    console.error('Failed to get team icons by ids:', error);
  }

  return iconMap;
}
