import type { PostseasonData, PostseasonRound, PostseasonTeamEntry } from '@/src/types';

export async function loadPostseasonData(year: number): Promise<PostseasonData> {
  const response = await fetch(`/data/postseason/${year}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load postseason data for ${year}: ${response.status}`);
  }
  return response.json();
}

export function getRoundsByPhase(
  data: PostseasonData,
  phase: 'phase1' | 'phase2'
): PostseasonRound[] {
  return data.rounds.filter(r => r.phase === phase);
}

export function getPhase1Rounds(data: PostseasonData): PostseasonRound[] {
  return getRoundsByPhase(data, 'phase1');
}

export function getPhase2Rounds(data: PostseasonData): PostseasonRound[] {
  return getRoundsByPhase(data, 'phase2');
}

export function getChampion(data: PostseasonData): PostseasonTeamEntry | null {
  const championship = data.rounds.find(r => r.roundId === 'top4-championship');
  if (!championship || championship.matchups.length === 0) return null;
  const matchup = championship.matchups[0];
  if (!matchup.winner) return null;
  return matchup.winner === 'team1' ? matchup.team1 : matchup.team2;
}
