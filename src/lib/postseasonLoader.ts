import type {
  PostseasonData,
  PostseasonDataRaw,
  PostseasonMatchup,
  PostseasonRound,
  PostseasonTeamEntry,
} from '@/src/types';
import { loadSeasonData, loadPostseasonScheduleData } from './seasonDataLoader';
import { calculateStandings } from './standingsCalculator';

/**
 * 從 standings 建立「seed → 隊伍資訊」的對應表
 * 排名以 calculateStandings 計算（積分 → 勝率），與排名頁面一致
 */
function buildSeedMap(
  teams: ReturnType<typeof calculateStandings>
): Map<number, PostseasonTeamEntry> {
  return new Map(
    teams.map((t) => [
      t.rank,
      { teamId: t.teamId, teamName: t.teamName, regularSeasonRank: t.rank },
    ])
  );
}

/**
 * 載入並 enrich 季後賽資料
 *
 * - R16 matchup 的 team1/team2 由 seasons/YYYY.json 排名動態推導（seed N = 排名第 N 的隊伍）
 * - R8+ matchup 的 team1/team2 只在 JSON 中存 teamId，loader 補充 teamName 與 regularSeasonRank
 * - 確保季後賽排名永遠與 seasons/YYYY.json 的排名資料一致（單一事實來源）
 */
export async function loadPostseasonData(year: number): Promise<PostseasonData> {
  const [postseasonResponse, seasonData, scheduleData] = await Promise.all([
    fetch(`/data/postseason/${year}.json`),
    loadSeasonData(year),
    loadPostseasonScheduleData(year).catch(() => null),
  ]);

  if (!postseasonResponse.ok) {
    throw new Error(`Failed to load postseason data for ${year}: ${postseasonResponse.status}`);
  }

  const raw: PostseasonDataRaw = await postseasonResponse.json();

  const scheduleMap = scheduleData
    ? new Map(Object.entries(scheduleData.games))
    : new Map<string, never>();

  // 計算排名（與排名頁面邏輯一致：積分 → 勝率）
  const rankedTeams = calculateStandings(seasonData.standings.teams);

  // seed N → PostseasonTeamEntry
  const seedMap = buildSeedMap(rankedTeams);

  // teamId → PostseasonTeamEntry（供 R8+ matchup enrich 使用）
  const teamIdMap = new Map<string, PostseasonTeamEntry>(
    rankedTeams.map((t) => [
      t.teamId,
      { teamId: t.teamId, teamName: t.teamName, regularSeasonRank: t.rank },
    ])
  );

  const enrichedRounds: PostseasonRound[] = raw.rounds.map((round) => ({
    ...round,
    matchups: round.matchups.map((matchup): PostseasonMatchup => {
      let team1: PostseasonTeamEntry;
      let team2: PostseasonTeamEntry;

      if (round.roundId === 'r16') {
        // R16：seed 直接對應排名，由 standings 推導，不依賴 JSON 中的隊伍資料
        team1 = seedMap.get(matchup.seed1) ?? {
          teamId: 'TBD',
          teamName: `第 ${matchup.seed1} 種子`,
          regularSeasonRank: matchup.seed1,
        };
        team2 = seedMap.get(matchup.seed2) ?? {
          teamId: 'TBD',
          teamName: `第 ${matchup.seed2} 種子`,
          regularSeasonRank: matchup.seed2,
        };
      } else {
        // R8+：JSON 存 teamId，loader 補充 teamName 與 rank
        const ref1 = matchup.team1;
        const ref2 = matchup.team2;
        team1 = (ref1 && teamIdMap.get(ref1.teamId)) ?? {
          teamId: ref1?.teamId ?? 'TBD',
          teamName: ref1?.teamId ?? '待定',
          regularSeasonRank: matchup.seed1,
        };
        team2 = (ref2 && teamIdMap.get(ref2.teamId)) ?? {
          teamId: ref2?.teamId ?? 'TBD',
          teamName: ref2?.teamId ?? '待定',
          regularSeasonRank: matchup.seed2,
        };
      }

      return {
        matchupId: matchup.matchupId,
        seed1: matchup.seed1,
        seed2: matchup.seed2,
        team1,
        team2,
        games: matchup.games.map((g) => {
          const sched = g.gameNumber ? scheduleMap.get(g.gameNumber) : undefined;
          return {
            ...g,
            date: sched?.date ?? null,
            venue: sched?.venue ?? null,
            startTime: sched?.startTime ?? null,
          };
        }),
        winner: matchup.winner,
        status: matchup.status,
      };
    }),
  }));

  return { season: raw.season, lastUpdated: raw.lastUpdated, rounds: enrichedRounds };
}

export function getRoundsByPhase(
  data: PostseasonData,
  phase: 'phase1' | 'phase2'
): PostseasonRound[] {
  return data.rounds.filter((r) => r.phase === phase);
}

export function getPhase1Rounds(data: PostseasonData): PostseasonRound[] {
  return getRoundsByPhase(data, 'phase1');
}

export function getPhase2Rounds(data: PostseasonData): PostseasonRound[] {
  return getRoundsByPhase(data, 'phase2');
}

export function getChampion(data: PostseasonData): PostseasonTeamEntry | null {
  const championship = data.rounds.find((r) => r.roundId === 'top4-championship');
  if (!championship || championship.matchups.length === 0) return null;
  const matchup = championship.matchups[0];
  if (!matchup.winner) return null;
  return matchup.winner === 'team1' ? matchup.team1 : matchup.team2;
}
