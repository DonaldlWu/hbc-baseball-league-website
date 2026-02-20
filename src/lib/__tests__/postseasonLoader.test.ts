import { getRoundsByPhase, getChampion, getPhase1Rounds, getPhase2Rounds } from '../postseasonLoader';
import type { PostseasonData } from '@/src/types';

const mockData: PostseasonData = {
  season: 2025,
  lastUpdated: '2026-02-20T00:00:00Z',
  rounds: [
    {
      roundId: 'r16', name: '16強', phase: 'phase1', bestOf: 3, homeAdvantage: true,
      matchups: [
        {
          matchupId: 'r16-1', seed1: 1, seed2: 16,
          team1: { teamId: 'ROO', teamName: 'Line Drive', regularSeasonRank: 1 },
          team2: { teamId: 'EAG', teamName: '火把老鷹', regularSeasonRank: 16 },
          games: [{ gameSeq: 1, byeGame: true, winner: 'team1', homeScore: null, awayScore: null, gameNumber: null }],
          winner: 'team1',
          status: 'completed',
        },
      ],
    },
    {
      roundId: 'r8', name: '8強', phase: 'phase1', bestOf: 3, homeAdvantage: true,
      matchups: [],
    },
    {
      roundId: 'top4-championship', name: '總冠軍戰', phase: 'phase2',
      bracket: 'championship', bestOf: 2, homeAdvantage: false, winnersBracketAdvantage: true,
      matchups: [
        {
          matchupId: 'champ-1', seed1: 1, seed2: 2,
          team1: { teamId: 'ROO', teamName: 'Line Drive', regularSeasonRank: 1 },
          team2: { teamId: 'YCT', teamName: '永春TB', regularSeasonRank: 2 },
          games: [{ gameSeq: 1, byeGame: false, winner: 'team1', homeScore: 7, awayScore: 3, gameNumber: '20259001' }],
          winner: 'team1',
          status: 'completed',
        },
      ],
    },
  ],
};

describe('postseasonLoader pure functions', () => {
  describe('getRoundsByPhase', () => {
    it('應回傳 phase1 的輪次', () => {
      const result = getRoundsByPhase(mockData, 'phase1');
      expect(result).toHaveLength(2);
      expect(result.every(r => r.phase === 'phase1')).toBe(true);
    });

    it('應回傳 phase2 的輪次', () => {
      const result = getRoundsByPhase(mockData, 'phase2');
      expect(result).toHaveLength(1);
      expect(result[0].roundId).toBe('top4-championship');
    });
  });

  describe('getPhase1Rounds / getPhase2Rounds', () => {
    it('getPhase1Rounds 應只回傳 phase1', () => {
      expect(getPhase1Rounds(mockData).every(r => r.phase === 'phase1')).toBe(true);
    });

    it('getPhase2Rounds 應只回傳 phase2', () => {
      expect(getPhase2Rounds(mockData).every(r => r.phase === 'phase2')).toBe(true);
    });
  });

  describe('getChampion', () => {
    it('應回傳冠軍戰的勝者', () => {
      const champion = getChampion(mockData);
      expect(champion?.teamId).toBe('ROO');
      expect(champion?.teamName).toBe('Line Drive');
    });

    it('冠軍戰尚未結束時應回傳 null', () => {
      const noChampData: PostseasonData = {
        ...mockData,
        rounds: mockData.rounds.map(r =>
          r.roundId === 'top4-championship'
            ? { ...r, matchups: [{ ...r.matchups[0], winner: null, status: 'pending' }] }
            : r
        ),
      };
      expect(getChampion(noChampData)).toBeNull();
    });

    it('沒有冠軍戰輪次時應回傳 null', () => {
      const noChampRound: PostseasonData = { ...mockData, rounds: [] };
      expect(getChampion(noChampRound)).toBeNull();
    });
  });
});
