import type {
  PostseasonData,
  PostseasonDataRaw,
  PostseasonMatchup,
  PostseasonMatchupStatus,
  PostseasonRound,
  PostseasonTeamEntry,
  PostseasonGame,
  SeasonGame,
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

const TBD_ENTRY: PostseasonTeamEntry = {
  teamId: 'TBD',
  teamName: '待定',
  regularSeasonRank: 0,
};

/**
 * 從一場賽程比賽判斷 team1/team2 誰贏
 * - status 不為 finished → null
 * - 任一分數為 null → null
 * - 隊名不在 homeTeam/awayTeam → null
 */
export function calcGameWinner(
  schedGame: SeasonGame,
  team1Name: string,
  team2Name: string,
): 'team1' | 'team2' | null {
  if (schedGame.status !== 'finished') return null;
  if (schedGame.homeScore === null || schedGame.awayScore === null) return null;

  const homeWon = schedGame.homeScore > schedGame.awayScore;

  if (schedGame.homeTeam === team1Name || schedGame.awayTeam === team1Name) {
    const team1IsHome = schedGame.homeTeam === team1Name;
    return (team1IsHome ? homeWon : !homeWon) ? 'team1' : 'team2';
  }

  if (schedGame.homeTeam === team2Name || schedGame.awayTeam === team2Name) {
    const team2IsHome = schedGame.homeTeam === team2Name;
    return (team2IsHome ? homeWon : !homeWon) ? 'team2' : 'team1';
  }

  return null;
}

/**
 * 計算 matchup 中 team1/team2 的勝場數，回傳 winner 與 status
 * - byeGame → team1 自動 +1 勝
 * - 實際比賽 → 查 scheduleMap 得到結果
 * - requiredWins 達到 → 該隊 winner
 */
export function calcMatchupResult(
  games: PostseasonGame[],
  scheduleMap: Map<string, SeasonGame>,
  team1Name: string,
  team2Name: string,
  requiredWins: number,
): {
  winner: 'team1' | 'team2' | null;
  status: PostseasonMatchupStatus;
  team1Wins: number;
  team2Wins: number;
} {
  let team1Wins = 0;
  let team2Wins = 0;

  for (const game of games) {
    if (game.byeGame) {
      team1Wins += 1;
    } else if (game.gameNumber) {
      const schedGame = scheduleMap.get(game.gameNumber);
      if (schedGame) {
        const gameWinner = calcGameWinner(schedGame, team1Name, team2Name);
        if (gameWinner === 'team1') team1Wins += 1;
        else if (gameWinner === 'team2') team2Wins += 1;
      }
    }

    if (team1Wins >= requiredWins) {
      return { winner: 'team1', status: 'completed', team1Wins, team2Wins };
    }
    if (team2Wins >= requiredWins) {
      return { winner: 'team2', status: 'completed', team1Wins, team2Wins };
    }
  }

  const hasAnyResult = team1Wins > 0 || team2Wins > 0;
  const status: PostseasonMatchupStatus = hasAnyResult ? 'in_progress' : 'pending';

  return { winner: null, status, team1Wins, team2Wins };
}

/**
 * 從已 enrich 的 r16 matchups 生成 r8 matchup stubs
 * 配對規則：pair[i] = r16[i*2] winner vs r16[i*2+1] winner
 * matchupId 命名：'r8-gen-0', 'r8-gen-1', ...
 * 已確定的隊伍直接用，尚未完賽的用 TBD entry
 */
export function generateR8Stubs(
  r16Matchups: PostseasonMatchup[],
): PostseasonMatchup[] {
  const pairCount = Math.floor(r16Matchups.length / 2);
  const stubs: PostseasonMatchup[] = [];

  for (let i = 0; i < pairCount; i++) {
    const left = r16Matchups[i * 2];
    const right = r16Matchups[i * 2 + 1];

    const team1 = left?.winner
      ? (left.winner === 'team1' ? left.team1 : left.team2)
      : TBD_ENTRY;

    const team2 = right?.winner
      ? (right.winner === 'team1' ? right.team1 : right.team2)
      : TBD_ENTRY;

    stubs.push({
      matchupId: `r8-gen-${i}`,
      seed1: 0,
      seed2: 0,
      team1,
      team2,
      games: [],
      winner: null,
      status: 'pending',
    });
  }

  return stubs;
}

/**
 * 載入並 enrich 季後賽資料
 *
 * - R16 matchup 的 team1/team2 由 seasons/YYYY.json 排名動態推導（seed N = 排名第 N 的隊伍）
 * - R8+ matchup 的 team1/team2 只在 JSON 中存 teamId，loader 補充 teamName 與 regularSeasonRank
 * - winner/status 從 scheduleMap 比賽結果動態計算，不依賴 JSON 靜態值
 * - r8 matchups 為空時，自動從 r16 結果生成 stubs
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

  const scheduleMap: Map<string, SeasonGame> = scheduleData
    ? new Map(Object.entries(scheduleData.games))
    : new Map<string, SeasonGame>();

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

  // Find the r16 round and r8 round for stub generation
  const r16Round = raw.rounds.find((r) => r.roundId === 'r16');
  const r8Round = raw.rounds.find((r) => r.roundId === 'r8');

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

      const enrichedGames = matchup.games.map((g) => {
        const sched = g.gameNumber ? scheduleMap.get(g.gameNumber) : undefined;
        const computedWinner = (!g.winner && sched)
          ? calcGameWinner(sched, team1.teamName, team2.teamName)
          : g.winner;
        return {
          ...g,
          winner: computedWinner,
          homeScore: sched?.homeScore ?? g.homeScore,
          awayScore: sched?.awayScore ?? g.awayScore,
          date: sched?.date ?? null,
          venue: sched?.venue ?? null,
          startTime: sched?.startTime ?? null,
        };
      });

      const requiredWins = Math.ceil(round.bestOf / 2);
      const { winner, status } = calcMatchupResult(
        enrichedGames,
        scheduleMap,
        team1.teamName,
        team2.teamName,
        requiredWins,
      );

      return {
        matchupId: matchup.matchupId,
        seed1: matchup.seed1,
        seed2: matchup.seed2,
        team1,
        team2,
        games: enrichedGames,
        winner,
        status,
      };
    }),
  }));

  // Auto-generate r8 stubs if r8 round exists but has no matchups
  if (r8Round && r8Round.matchups.length === 0 && r16Round) {
    const enrichedR16 = enrichedRounds.find((r) => r.roundId === 'r16');
    if (enrichedR16) {
      const stubs = generateR8Stubs(enrichedR16.matchups);
      const r8RoundIndex = enrichedRounds.findIndex((r) => r.roundId === 'r8');
      if (r8RoundIndex !== -1) {
        enrichedRounds[r8RoundIndex] = {
          ...enrichedRounds[r8RoundIndex],
          matchups: stubs,
        };
      }
    }
  }

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
