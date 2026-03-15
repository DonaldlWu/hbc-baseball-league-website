import { getRoundsByPhase, getChampion, getPhase1Rounds, getPhase2Rounds, loadPostseasonData } from '../postseasonLoader';
import type { PostseasonData, PostseasonDataRaw, SeasonData } from '@/src/types';

// 測試用 enriched mock（純函式測試用，不經 loader）
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
          team2: { teamId: 'MOR', teamName: '莫拉克', regularSeasonRank: 16 },
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

describe('loadPostseasonData enrichment', () => {
  // Raw postseason JSON（不含 team1/team2）
  const rawPostseason: PostseasonDataRaw = {
    season: 2025,
    lastUpdated: '2026-03-15T00:00:00Z',
    rounds: [
      {
        roundId: 'r16', name: '16強', phase: 'phase1', bestOf: 3, homeAdvantage: true,
        matchups: [
          {
            matchupId: 'r16-1', seed1: 1, seed2: 3,
            // 無 team1/team2 → 由 standings 推導
            games: [{ gameSeq: 1, byeGame: true, winner: 'team1', homeScore: null, awayScore: null, gameNumber: null, note: '主場優勢' }],
            winner: null,
            status: 'in_progress',
          },
        ],
      },
      {
        roundId: 'r8', name: '8強', phase: 'phase1', bestOf: 3, homeAdvantage: true,
        matchups: [
          {
            matchupId: 'r8-1', seed1: 1, seed2: 2,
            team1: { teamId: 'AAA' },  // 只有 teamId
            team2: { teamId: 'BBB' },
            games: [],
            winner: null,
            status: 'pending',
          },
        ],
      },
    ],
  };

  // 三支隊伍的排名資料
  const mockSeasonData: SeasonData = {
    season: 2025,
    lastUpdated: '2026-03-15T00:00:00Z',
    standings: {
      source: 'manual',
      teams: [
        { teamId: 'AAA', teamName: '甲隊', wins: 10, losses: 0, draws: 0, runsScored: 10, runsAllowed: 2 },
        { teamId: 'BBB', teamName: '乙隊', wins: 8, losses: 2, draws: 0, runsScored: 8, runsAllowed: 4 },
        { teamId: 'CCC', teamName: '丙隊', wins: 5, losses: 5, draws: 0, runsScored: 6, runsAllowed: 6 },
      ],
    },
    games: {},
  };

  beforeEach(() => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/data/postseason/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(rawPostseason) } as Response);
      }
      if (url.includes('/data/seasons/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSeasonData) } as Response);
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('R16 matchup 應從 standings 推導出正確的 team1/team2', async () => {
    const data = await loadPostseasonData(2025);
    const r16 = data.rounds.find(r => r.roundId === 'r16')!;
    const matchup = r16.matchups[0];

    // seed1=1 → 排名第 1 的隊伍（AAA/甲隊）
    expect(matchup.team1.teamId).toBe('AAA');
    expect(matchup.team1.teamName).toBe('甲隊');
    expect(matchup.team1.regularSeasonRank).toBe(1);

    // seed2=3 → 排名第 3 的隊伍（CCC/丙隊）
    expect(matchup.team2.teamId).toBe('CCC');
    expect(matchup.team2.teamName).toBe('丙隊');
    expect(matchup.team2.regularSeasonRank).toBe(3);
  });

  it('R8+ matchup 應用 teamId 從 standings 補充 teamName 與 regularSeasonRank', async () => {
    const data = await loadPostseasonData(2025);
    const r8 = data.rounds.find(r => r.roundId === 'r8')!;
    const matchup = r8.matchups[0];

    expect(matchup.team1.teamId).toBe('AAA');
    expect(matchup.team1.teamName).toBe('甲隊');
    expect(matchup.team1.regularSeasonRank).toBe(1);

    expect(matchup.team2.teamId).toBe('BBB');
    expect(matchup.team2.teamName).toBe('乙隊');
    expect(matchup.team2.regularSeasonRank).toBe(2);
  });

  it('postseason JSON 載入失敗時應拋出 error', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/data/postseason/')) {
        return Promise.resolve({ ok: false, status: 404 } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSeasonData) } as Response);
    }) as jest.Mock;

    await expect(loadPostseasonData(2025)).rejects.toThrow('Failed to load postseason data for 2025: 404');
  });
});
