import {
  getRoundsByPhase,
  getChampion,
  getPhase1Rounds,
  getPhase2Rounds,
  loadPostseasonData,
  calcGameWinner,
  calcMatchupResult,
  generateR8Stubs,
} from '../postseasonLoader';
import type {
  PostseasonData,
  PostseasonDataRaw,
  PostseasonMatchup,
  SeasonData,
  SeasonGame,
} from '@/src/types';

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

// ─────────────────────────────────────────────
// Helper: build a minimal SeasonGame for tests
// ─────────────────────────────────────────────
function makeSeasonGame(overrides: Partial<SeasonGame>): SeasonGame {
  return {
    date: '2026-04-05',
    homeTeam: 'HomeTeam',
    awayTeam: 'AwayTeam',
    venue: '中正A',
    timeSlot: '上午',
    startTime: '08:00',
    endTime: '11:00',
    status: 'finished',
    homeScore: 5,
    awayScore: 3,
    sheetId: '',
    ...overrides,
  };
}

describe('calcGameWinner', () => {
  it('homeTeam 名稱符合 team1Name，且 homeScore > awayScore → team1', () => {
    const game = makeSeasonGame({ homeTeam: 'Alpha', awayTeam: 'Beta', homeScore: 7, awayScore: 2 });
    expect(calcGameWinner(game, 'Alpha', 'Beta')).toBe('team1');
  });

  it('awayTeam 名稱符合 team1Name，且 awayScore > homeScore → team1', () => {
    const game = makeSeasonGame({ homeTeam: 'Beta', awayTeam: 'Alpha', homeScore: 1, awayScore: 9 });
    expect(calcGameWinner(game, 'Alpha', 'Beta')).toBe('team1');
  });

  it('awayTeam 名稱符合 team2Name，且 awayScore < homeScore → team2 loses, so team1 wins → team1', () => {
    // awayTeam=Beta (team2), homeScore 12 > awayScore 3 → home wins → team1 wins since home=Alpha=team1
    const game = makeSeasonGame({ homeTeam: 'Alpha', awayTeam: 'Beta', homeScore: 12, awayScore: 3 });
    expect(calcGameWinner(game, 'Alpha', 'Beta')).toBe('team1');
  });

  it('awayTeam 名稱符合 team2Name，且 awayScore > homeScore → team2', () => {
    // awayTeam=Beta (team2) wins
    const game = makeSeasonGame({ homeTeam: 'Alpha', awayTeam: 'Beta', homeScore: 1, awayScore: 8 });
    expect(calcGameWinner(game, 'Alpha', 'Beta')).toBe('team2');
  });

  it('status !== finished → null', () => {
    const game = makeSeasonGame({ status: 'scheduled', homeScore: null, awayScore: null });
    expect(calcGameWinner(game, 'HomeTeam', 'AwayTeam')).toBeNull();
  });

  it('rain status → null', () => {
    const game = makeSeasonGame({ status: 'rain', homeScore: null, awayScore: null });
    expect(calcGameWinner(game, 'HomeTeam', 'AwayTeam')).toBeNull();
  });

  it('隊名都不符合 → null', () => {
    const game = makeSeasonGame({ homeTeam: 'X', awayTeam: 'Y', homeScore: 5, awayScore: 2 });
    expect(calcGameWinner(game, 'Alpha', 'Beta')).toBeNull();
  });

  it('homeScore 為 null → null', () => {
    const game = makeSeasonGame({ homeScore: null, awayScore: 3 });
    expect(calcGameWinner(game, 'HomeTeam', 'AwayTeam')).toBeNull();
  });

  it('awayScore 為 null → null', () => {
    const game = makeSeasonGame({ homeScore: 5, awayScore: null });
    expect(calcGameWinner(game, 'HomeTeam', 'AwayTeam')).toBeNull();
  });
});

describe('calcMatchupResult', () => {
  const makeScheduleMap = (entries: Array<[string, Partial<SeasonGame>]>): Map<string, SeasonGame> => {
    return new Map(entries.map(([k, v]) => [k, makeSeasonGame(v)]));
  };

  it('byeGame（team1 自動 +1 勝）+ 實際比賽 team1 勝 → winner=team1, status=completed (bestOf=3, requiredWins=2)', () => {
    const scheduleMap = makeScheduleMap([
      ['G001', { homeTeam: 'Alpha', awayTeam: 'Beta', homeScore: 5, awayScore: 1, status: 'finished' }],
    ]);
    const games = [
      { gameSeq: 1, byeGame: true, winner: null, homeScore: null, awayScore: null, gameNumber: null },
      { gameSeq: 2, byeGame: false, winner: null, homeScore: null, awayScore: null, gameNumber: 'G001' },
    ];
    const result = calcMatchupResult(games, scheduleMap, 'Alpha', 'Beta', 2);
    expect(result.winner).toBe('team1');
    expect(result.status).toBe('completed');
    expect(result.team1Wins).toBe(2);
    expect(result.team2Wins).toBe(0);
  });

  it('byeGame + 實際比賽 team2 勝 → winner=null, status=in_progress（1-1 tie）', () => {
    const scheduleMap = makeScheduleMap([
      ['G002', { homeTeam: 'Alpha', awayTeam: 'Beta', homeScore: 1, awayScore: 5, status: 'finished' }],
    ]);
    const games = [
      { gameSeq: 1, byeGame: true, winner: null, homeScore: null, awayScore: null, gameNumber: null },
      { gameSeq: 2, byeGame: false, winner: null, homeScore: null, awayScore: null, gameNumber: 'G002' },
    ];
    const result = calcMatchupResult(games, scheduleMap, 'Alpha', 'Beta', 2);
    expect(result.winner).toBeNull();
    expect(result.status).toBe('in_progress');
    expect(result.team1Wins).toBe(1);
    expect(result.team2Wins).toBe(1);
  });

  it('無任何比賽結果 → winner=null, status=pending', () => {
    const scheduleMap = new Map<string, SeasonGame>();
    const games = [
      { gameSeq: 1, byeGame: false, winner: null, homeScore: null, awayScore: null, gameNumber: 'G003' },
    ];
    const result = calcMatchupResult(games, scheduleMap, 'Alpha', 'Beta', 2);
    expect(result.winner).toBeNull();
    expect(result.status).toBe('pending');
    expect(result.team1Wins).toBe(0);
    expect(result.team2Wins).toBe(0);
  });

  it('兩場皆已完成但各勝 1 場 → in_progress（requiredWins=2 時）', () => {
    const scheduleMap = makeScheduleMap([
      ['G010', { homeTeam: 'Alpha', awayTeam: 'Beta', homeScore: 8, awayScore: 1, status: 'finished' }],
      ['G011', { homeTeam: 'Beta', awayTeam: 'Alpha', homeScore: 7, awayScore: 0, status: 'finished' }],
    ]);
    const games = [
      { gameSeq: 1, byeGame: false, winner: null, homeScore: null, awayScore: null, gameNumber: 'G010' },
      { gameSeq: 2, byeGame: false, winner: null, homeScore: null, awayScore: null, gameNumber: 'G011' },
    ];
    const result = calcMatchupResult(games, scheduleMap, 'Alpha', 'Beta', 2);
    expect(result.winner).toBeNull();
    expect(result.status).toBe('in_progress');
    expect(result.team1Wins).toBe(1);
    expect(result.team2Wins).toBe(1);
  });

  it('games 陣列為空 → pending', () => {
    const scheduleMap = new Map<string, SeasonGame>();
    const result = calcMatchupResult([], scheduleMap, 'Alpha', 'Beta', 2);
    expect(result.winner).toBeNull();
    expect(result.status).toBe('pending');
  });

  it('gameNumber 不在 scheduleMap 中 → 該場不計勝負', () => {
    const scheduleMap = new Map<string, SeasonGame>();
    const games = [
      { gameSeq: 1, byeGame: false, winner: null, homeScore: null, awayScore: null, gameNumber: 'MISSING' },
    ];
    const result = calcMatchupResult(games, scheduleMap, 'Alpha', 'Beta', 2);
    expect(result.team1Wins).toBe(0);
    expect(result.team2Wins).toBe(0);
    expect(result.status).toBe('pending');
  });
});

describe('generateR8Stubs', () => {
  const TBD_ENTRY = { teamId: 'TBD', teamName: '待定', regularSeasonRank: 0 };

  const makeCompletedMatchup = (
    matchupId: string,
    winner: 'team1' | 'team2',
    team1Id: string,
    team2Id: string,
  ): PostseasonMatchup => ({
    matchupId,
    seed1: 0,
    seed2: 0,
    team1: { teamId: team1Id, teamName: team1Id, regularSeasonRank: 0 },
    team2: { teamId: team2Id, teamName: team2Id, regularSeasonRank: 0 },
    games: [],
    winner,
    status: 'completed',
  });

  const makePendingMatchup = (matchupId: string): PostseasonMatchup => ({
    matchupId,
    seed1: 0,
    seed2: 0,
    team1: TBD_ENTRY,
    team2: TBD_ENTRY,
    games: [],
    winner: null,
    status: 'pending',
  });

  it('r16 全 8 場未完賽 → 4 stubs，team1/team2 皆為 TBD', () => {
    const r16Matchups = Array.from({ length: 8 }, (_, i) => makePendingMatchup(`r16-${i + 1}`));
    const stubs = generateR8Stubs(r16Matchups);
    expect(stubs).toHaveLength(4);
    stubs.forEach(stub => {
      expect(stub.team1.teamId).toBe('TBD');
      expect(stub.team2.teamId).toBe('TBD');
    });
  });

  it('r16[0] 完賽（team1 勝）、r16[1] 未完賽 → stubs[0].team1=r16[0].team1, team2=TBD', () => {
    const r16Matchups = [
      makeCompletedMatchup('r16-1', 'team1', 'AAA', 'BBB'),
      makePendingMatchup('r16-2'),
      makePendingMatchup('r16-3'),
      makePendingMatchup('r16-4'),
      makePendingMatchup('r16-5'),
      makePendingMatchup('r16-6'),
      makePendingMatchup('r16-7'),
      makePendingMatchup('r16-8'),
    ];
    const stubs = generateR8Stubs(r16Matchups);
    expect(stubs[0].team1.teamId).toBe('AAA');
    expect(stubs[0].team2.teamId).toBe('TBD');
  });

  it('r16[0] team2 勝、r16[1] team2 勝 → stubs[0].team1=r16[0].team2, team2=r16[1].team2', () => {
    const r16Matchups = [
      makeCompletedMatchup('r16-1', 'team2', 'AAA', 'BBB'),
      makeCompletedMatchup('r16-2', 'team2', 'CCC', 'DDD'),
      makePendingMatchup('r16-3'),
      makePendingMatchup('r16-4'),
      makePendingMatchup('r16-5'),
      makePendingMatchup('r16-6'),
      makePendingMatchup('r16-7'),
      makePendingMatchup('r16-8'),
    ];
    const stubs = generateR8Stubs(r16Matchups);
    expect(stubs[0].team1.teamId).toBe('BBB');
    expect(stubs[0].team2.teamId).toBe('DDD');
  });

  it('應生成 4 個 stubs（8 r16 matchups → 4 r8 stubs）', () => {
    const r16Matchups = Array.from({ length: 8 }, (_, i) => makePendingMatchup(`r16-${i + 1}`));
    const stubs = generateR8Stubs(r16Matchups);
    expect(stubs).toHaveLength(4);
  });

  it('stub 的 matchupId 應有一致命名規則（r8-gen-0, r8-gen-1, ...）', () => {
    const r16Matchups = Array.from({ length: 8 }, (_, i) => makePendingMatchup(`r16-${i + 1}`));
    const stubs = generateR8Stubs(r16Matchups);
    expect(stubs[0].matchupId).toBe('r8-gen-0');
    expect(stubs[1].matchupId).toBe('r8-gen-1');
    expect(stubs[2].matchupId).toBe('r8-gen-2');
    expect(stubs[3].matchupId).toBe('r8-gen-3');
  });

  it('r16 matchups 為空陣列 → 回傳空陣列', () => {
    expect(generateR8Stubs([])).toHaveLength(0);
  });

  it('stub 的 seed1 與 seed2 應為 0', () => {
    const r16Matchups = Array.from({ length: 8 }, (_, i) => makePendingMatchup(`r16-${i + 1}`));
    const stubs = generateR8Stubs(r16Matchups);
    stubs.forEach(stub => {
      expect(stub.seed1).toBe(0);
      expect(stub.seed2).toBe(0);
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

// ─────────────────────────────────────────────
// Integration tests: dynamic winner/status calculation
// ─────────────────────────────────────────────
describe('loadPostseasonData dynamic winner calculation', () => {
  const mockSeasonData: SeasonData = {
    season: 2025,
    lastUpdated: '2026-04-01T00:00:00Z',
    standings: {
      source: 'manual',
      teams: [
        { teamId: 'TEAM1', teamName: 'Team One', wins: 10, losses: 0, draws: 0, runsScored: 50, runsAllowed: 10 },
        { teamId: 'TEAM2', teamName: 'Team Two', wins: 8, losses: 2, draws: 0, runsScored: 40, runsAllowed: 20 },
        { teamId: 'TEAM3', teamName: 'Team Three', wins: 5, losses: 5, draws: 0, runsScored: 30, runsAllowed: 30 },
        { teamId: 'TEAM4', teamName: 'Team Four', wins: 2, losses: 8, draws: 0, runsScored: 20, runsAllowed: 40 },
      ],
    },
    games: {},
  };

  it('r16 比賽結果顯示 team2 勝時，enriched r16 matchup winner 應為 team2（覆蓋 JSON 靜態 null）', async () => {
    // seed1=1 → TEAM1, seed2=4 → TEAM4
    // scheduleData game: TEAM4(away) beats TEAM1(home) → team2 wins
    const rawWithGame: PostseasonDataRaw = {
      season: 2025,
      lastUpdated: '2026-04-01T00:00:00Z',
      rounds: [
        {
          roundId: 'r16', name: '16強', phase: 'phase1', bestOf: 3, homeAdvantage: true,
          matchups: [
            {
              matchupId: 'r16-test', seed1: 1, seed2: 4,
              games: [
                { gameSeq: 1, byeGame: true, winner: null, homeScore: null, awayScore: null, gameNumber: null, note: '主場優勢' },
                { gameSeq: 2, byeGame: false, winner: null, homeScore: null, awayScore: null, gameNumber: 'G_TEAM2_WIN' },
              ],
              winner: null,
              status: 'in_progress',
            },
          ],
        },
        {
          roundId: 'r8', name: '8強', phase: 'phase1', bestOf: 3, homeAdvantage: true,
          matchups: [],
        },
      ],
    };

    const scheduleData: SeasonData = {
      season: 2025,
      lastUpdated: '2026-04-01T00:00:00Z',
      standings: { source: 'manual', teams: [] },
      games: {
        'G_TEAM2_WIN': {
          date: '2026-04-05',
          homeTeam: 'Team One',
          awayTeam: 'Team Four',
          venue: '中正A',
          timeSlot: '上午',
          startTime: '08:00',
          endTime: '11:00',
          status: 'finished',
          homeScore: 1,
          awayScore: 8,
          sheetId: '',
        },
      },
    };

    global.fetch = jest.fn((url: string) => {
      if (url.includes('/data/postseason/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(rawWithGame) } as Response);
      }
      if (url.includes('postseason.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(scheduleData) } as Response);
      }
      if (url.includes('/data/seasons/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSeasonData) } as Response);
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }) as jest.Mock;

    const data = await loadPostseasonData(2025);
    const r16 = data.rounds.find(r => r.roundId === 'r16')!;
    const matchup = r16.matchups[0];

    // byeGame → team1 gets 1 win. G_TEAM2_WIN: awayTeam=Team Four=team2, away wins → team2 gets 1 win → tied → in_progress
    expect(matchup.winner).toBeNull();
    expect(matchup.status).toBe('in_progress');
  });

  it('scheduleData 有已完賽的 r16 比賽，且 team1 連勝兩場，r16 matchup winner 應為 team1', async () => {
    const rawTwoGames: PostseasonDataRaw = {
      season: 2025,
      lastUpdated: '2026-04-01T00:00:00Z',
      rounds: [
        {
          roundId: 'r16', name: '16強', phase: 'phase1', bestOf: 3, homeAdvantage: true,
          matchups: [
            {
              matchupId: 'r16-t1wins', seed1: 1, seed2: 4,
              games: [
                { gameSeq: 1, byeGame: false, winner: null, homeScore: null, awayScore: null, gameNumber: 'G_T1_WIN1' },
                { gameSeq: 2, byeGame: false, winner: null, homeScore: null, awayScore: null, gameNumber: 'G_T1_WIN2' },
              ],
              winner: null,
              status: 'pending',
            },
          ],
        },
        {
          roundId: 'r8', name: '8強', phase: 'phase1', bestOf: 3, homeAdvantage: true,
          matchups: [],
        },
      ],
    };

    const scheduleData: SeasonData = {
      season: 2025,
      lastUpdated: '2026-04-01T00:00:00Z',
      standings: { source: 'manual', teams: [] },
      games: {
        'G_T1_WIN1': {
          date: '2026-04-05',
          homeTeam: 'Team One',
          awayTeam: 'Team Four',
          venue: '中正A',
          timeSlot: '上午',
          startTime: '08:00',
          endTime: '11:00',
          status: 'finished',
          homeScore: 8,
          awayScore: 1,
          sheetId: '',
        },
        'G_T1_WIN2': {
          date: '2026-04-06',
          homeTeam: 'Team Four',
          awayTeam: 'Team One',
          venue: '中正A',
          timeSlot: '上午',
          startTime: '08:00',
          endTime: '11:00',
          status: 'finished',
          homeScore: 2,
          awayScore: 9,
          sheetId: '',
        },
      },
    };

    global.fetch = jest.fn((url: string) => {
      if (url.includes('/data/postseason/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(rawTwoGames) } as Response);
      }
      if (url.includes('postseason.json')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(scheduleData) } as Response);
      }
      if (url.includes('/data/seasons/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSeasonData) } as Response);
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }) as jest.Mock;

    const data = await loadPostseasonData(2025);
    const r16 = data.rounds.find(r => r.roundId === 'r16')!;
    const matchup = r16.matchups[0];

    expect(matchup.winner).toBe('team1');
    expect(matchup.status).toBe('completed');
  });

  it('r8 matchups 為空時，應自動生成 r8 stubs', async () => {
    const rawR8Empty: PostseasonDataRaw = {
      season: 2025,
      lastUpdated: '2026-04-01T00:00:00Z',
      rounds: [
        {
          roundId: 'r16', name: '16強', phase: 'phase1', bestOf: 3, homeAdvantage: true,
          matchups: [
            {
              matchupId: 'r16-a', seed1: 1, seed2: 8,
              games: [],
              winner: null,
              status: 'pending',
            },
            {
              matchupId: 'r16-b', seed1: 2, seed2: 7,
              games: [],
              winner: null,
              status: 'pending',
            },
            {
              matchupId: 'r16-c', seed1: 3, seed2: 6,
              games: [],
              winner: null,
              status: 'pending',
            },
            {
              matchupId: 'r16-d', seed1: 4, seed2: 5,
              games: [],
              winner: null,
              status: 'pending',
            },
          ],
        },
        {
          roundId: 'r8', name: '8強', phase: 'phase1', bestOf: 3, homeAdvantage: true,
          matchups: [],
        },
      ],
    };

    global.fetch = jest.fn((url: string) => {
      if (url.includes('/data/postseason/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(rawR8Empty) } as Response);
      }
      if (url.includes('postseason.json')) {
        return Promise.reject(new Error('no postseason schedule'));
      }
      if (url.includes('/data/seasons/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSeasonData) } as Response);
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }) as jest.Mock;

    const data = await loadPostseasonData(2025);
    const r8 = data.rounds.find(r => r.roundId === 'r8')!;

    // 4 r16 matchups → 2 r8 stubs
    expect(r8.matchups).toHaveLength(2);
    expect(r8.matchups[0].matchupId).toBe('r8-gen-0');
    expect(r8.matchups[1].matchupId).toBe('r8-gen-1');
    // All TBD since r16 matchups are pending
    r8.matchups.forEach(stub => {
      expect(stub.team1.teamId).toBe('TBD');
      expect(stub.team2.teamId).toBe('TBD');
    });
  });
});
