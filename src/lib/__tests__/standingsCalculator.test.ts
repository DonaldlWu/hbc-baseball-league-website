// Jest 測試
import {
  calculatePoints,
  calculateWinRate,
  calculateGamesBehind,
  calculateStandings,
  calculateStreaks,
  calculateSpecialTags,
} from '../standingsCalculator';
import type { TeamRecordRaw, SeasonGame, TeamStreak } from '@/src/types';

describe('standingsCalculator', () => {
  describe('calculatePoints', () => {
    it('應該正確計算積分（勝3分、和1分）', () => {
      // Line Drive: 16勝 1和 = 49分
      expect(calculatePoints(16, 1)).toBe(49);
      // 飛尼克斯: 13勝 0和 = 39分
      expect(calculatePoints(13, 0)).toBe(39);
      // 永春TB: 12勝 1和 = 37分
      expect(calculatePoints(12, 1)).toBe(37);
    });

    it('應該處理零勝零和的情況', () => {
      expect(calculatePoints(0, 0)).toBe(0);
    });

    it('應該處理只有和局的情況', () => {
      expect(calculatePoints(0, 3)).toBe(3);
    });
  });

  describe('calculateWinRate', () => {
    it('應該正確計算勝率', () => {
      // Line Drive: 16勝3敗 = 84.2%
      expect(calculateWinRate(16, 3)).toBeCloseTo(0.842, 2);
      // 飛尼克斯: 13勝5敗 = 72.2%
      expect(calculateWinRate(13, 5)).toBeCloseTo(0.722, 2);
    });

    it('應該處理全勝的情況', () => {
      expect(calculateWinRate(10, 0)).toBe(1);
    });

    it('應該處理全敗的情況', () => {
      expect(calculateWinRate(0, 10)).toBe(0);
    });

    it('應該處理零勝零敗的情況（避免除以零）', () => {
      expect(calculateWinRate(0, 0)).toBe(0);
    });
  });

  describe('calculateGamesBehind', () => {
    it('應該正確計算勝差', () => {
      const leader = { wins: 16, losses: 3 };
      // 飛尼克斯: (16-13 + 5-3) / 2 = 2.5
      expect(calculateGamesBehind(leader, { wins: 13, losses: 5 })).toBe(2.5);
      // 永春TB: (16-12 + 4-3) / 2 = 2.5
      expect(calculateGamesBehind(leader, { wins: 12, losses: 4 })).toBe(2.5);
      // 楚奧特: (16-12 + 5-3) / 2 = 3
      expect(calculateGamesBehind(leader, { wins: 12, losses: 5 })).toBe(3);
    });

    it('第一名的勝差應該是 0', () => {
      const leader = { wins: 16, losses: 3 };
      expect(calculateGamesBehind(leader, leader)).toBe(0);
    });
  });

  describe('calculateStandings', () => {
    const mockTeams: TeamRecordRaw[] = [
      {
        teamId: 'PHE',
        teamName: '飛尼克斯',
        wins: 13,
        losses: 5,
        draws: 0,
        runsAllowed: 5.1,
        runsScored: 11.2,
      },
      {
        teamId: 'ROO',
        teamName: 'Line Drive',
        wins: 16,
        losses: 3,
        draws: 1,
        runsAllowed: 4.0,
        runsScored: 14.2,
      },
      {
        teamId: 'YCT',
        teamName: '永春TB',
        wins: 12,
        losses: 4,
        draws: 1,
        runsAllowed: 6.6,
        runsScored: 8.2,
      },
    ];

    it('應該依積分排序球隊', () => {
      const result = calculateStandings(mockTeams);

      expect(result[0].teamId).toBe('ROO'); // 49分
      expect(result[1].teamId).toBe('PHE'); // 39分
      expect(result[2].teamId).toBe('YCT'); // 37分
    });

    it('應該正確計算每隊的積分', () => {
      const result = calculateStandings(mockTeams);

      expect(result[0].points).toBe(49); // Line Drive
      expect(result[1].points).toBe(39); // 飛尼克斯
      expect(result[2].points).toBe(37); // 永春TB
    });

    it('應該正確計算每隊的勝率', () => {
      const result = calculateStandings(mockTeams);

      expect(result[0].winRate).toBeCloseTo(0.842, 2); // Line Drive
      expect(result[1].winRate).toBeCloseTo(0.722, 2); // 飛尼克斯
      expect(result[2].winRate).toBeCloseTo(0.75, 2); // 永春TB
    });

    it('應該正確計算勝差', () => {
      const result = calculateStandings(mockTeams);

      expect(result[0].gamesBehind).toBeNull(); // 第一名
      expect(result[1].gamesBehind).toBe(2.5); // 飛尼克斯
      expect(result[2].gamesBehind).toBe(2.5); // 永春TB
    });

    it('應該正確更新排名', () => {
      const result = calculateStandings(mockTeams);

      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
      expect(result[2].rank).toBe(3);
    });

    it('應該計算已賽場數', () => {
      const result = calculateStandings(mockTeams);

      expect(result[0].gamesPlayed).toBe(20); // 16+3+1
      expect(result[1].gamesPlayed).toBe(18); // 13+5+0
      expect(result[2].gamesPlayed).toBe(17); // 12+4+1
    });

    it('積分相同時應依勝率排序', () => {
      const teamsWithSamePoints: TeamRecordRaw[] = [
        {
          teamId: 'A',
          teamName: 'Team A',
          wins: 12,
          losses: 5,
          draws: 1, // 37分, 勝率 70.6%
          runsAllowed: 5,
          runsScored: 10,
        },
        {
          teamId: 'B',
          teamName: 'Team B',
          wins: 12,
          losses: 4,
          draws: 1, // 37分, 勝率 75%
          runsAllowed: 5,
          runsScored: 10,
        },
      ];

      const result = calculateStandings(teamsWithSamePoints);

      expect(result[0].teamId).toBe('B'); // 勝率較高
      expect(result[1].teamId).toBe('A');
    });

    it('不傳 streaks 時，streak 欄位應為 undefined', () => {
      const result = calculateStandings(mockTeams);

      expect(result[0].streak).toBeUndefined();
    });

    it('傳入 streaks 時，streak 應附加到對應球隊', () => {
      const streaks: TeamStreak[] = [
        { teamName: 'Line Drive', type: 'W', count: 3 },
        { teamName: '飛尼克斯', type: 'L', count: 1 },
      ];

      const result = calculateStandings(mockTeams, streaks);

      const lineDrive = result.find((t) => t.teamId === 'ROO');
      expect(lineDrive?.streak).toEqual({ teamName: 'Line Drive', type: 'W', count: 3 });

      const phoenix = result.find((t) => t.teamId === 'PHE');
      expect(phoenix?.streak).toEqual({ teamName: '飛尼克斯', type: 'L', count: 1 });

      const yct = result.find((t) => t.teamId === 'YCT');
      expect(yct?.streak).toBeUndefined();
    });

    it('傳入 specialTags 時，specialTag 應附加到對應球隊', () => {
      const specialTags = new Map<string, string>([['Line Drive', '雨神同行']]);

      const result = calculateStandings(mockTeams, undefined, specialTags);

      const lineDrive = result.find((t) => t.teamId === 'ROO');
      expect(lineDrive?.specialTag).toBe('雨神同行');

      const phoenix = result.find((t) => t.teamId === 'PHE');
      expect(phoenix?.specialTag).toBeUndefined();
    });

    describe('並列排名處理', () => {
      const makeTiedTeam = (id: string, name: string, extra: Partial<TeamRecordRaw> = {}): TeamRecordRaw => ({
        teamId: id,
        teamName: name,
        wins: 12,
        losses: 7,
        draws: 1, // 37分, winRate 12/19
        runsAllowed: 6.0,
        runsScored: 9.0,
        ...extra,
      });

      it('提供 games 時：對戰成績勝利方排在前面', () => {
        const teams = [
          makeTiedTeam('A', 'Team A'),
          makeTiedTeam('B', 'Team B'),
        ];
        const games: Record<string, SeasonGame> = {
          g1: makeGame({ homeTeam: 'Team A', awayTeam: 'Team B', date: '2026-01-01', status: 'finished', homeScore: 5, awayScore: 3 }),
        };

        const result = calculateStandings(teams, undefined, undefined, games);

        expect(result[0].teamId).toBe('A'); // 對戰勝利
        expect(result[1].teamId).toBe('B');
      });

      it('提供 games 且對戰積分相同時：對戰失分少的排前面', () => {
        const teams = [
          makeTiedTeam('A', 'Team A', { runsAllowed: 6.0 }),
          makeTiedTeam('B', 'Team B', { runsAllowed: 5.0 }),
        ];
        const games: Record<string, SeasonGame> = {
          // A vs B: 7:7 平手
          g1: makeGame({ homeTeam: 'Team A', awayTeam: 'Team B', date: '2026-01-01', status: 'finished', homeScore: 7, awayScore: 7 }),
        };

        const result = calculateStandings(teams, undefined, undefined, games);

        // 對戰平手 → 比整體均失（B: 5.0 < A: 6.0，B 排前）
        expect(result[0].teamId).toBe('B');
        expect(result[1].teamId).toBe('A');
      });

      it('提供 games：三隊並列時依對戰積分排序', () => {
        const teams = [
          makeTiedTeam('MUZ', '木柵OB', { runsAllowed: 6.8 }),
          makeTiedTeam('YAN', '陽明OB', { runsAllowed: 6.2 }),
          makeTiedTeam('ACE', 'ACES', { runsAllowed: 7.7 }),
        ];
        const games: Record<string, SeasonGame> = {
          // 木柵OB beat 陽明OB
          g1: makeGame({ homeTeam: '木柵OB', awayTeam: '陽明OB', date: '2026-01-01', status: 'finished', homeScore: 10, awayScore: 7 }),
          // 木柵OB beat ACES
          g2: makeGame({ homeTeam: '木柵OB', awayTeam: 'ACES', date: '2026-01-08', status: 'finished', homeScore: 10, awayScore: 8 }),
          // 陽明OB vs ACES: draw
          g3: makeGame({ homeTeam: '陽明OB', awayTeam: 'ACES', date: '2026-01-15', status: 'finished', homeScore: 7, awayScore: 7 }),
        };

        const result = calculateStandings(teams, undefined, undefined, games);

        // 木柵OB: 2 wins (6pts H2H), 陽明OB: 0 wins 1 draw (1pt H2H), ACES: 0 wins 1 draw (1pt H2H)
        // 陽明OB vs ACES: both 1 H2H pt; 陽明OB H2H allowed = 7+7=14, ACES H2H allowed = 7+8=15
        // 所以排名: 木柵OB > 陽明OB > ACES
        expect(result[0].teamId).toBe('MUZ');
        expect(result[1].teamId).toBe('YAN');
        expect(result[2].teamId).toBe('ACE');
      });

      it('未提供 games 且有 tiebreakRank 時：依 tiebreakRank 排序', () => {
        const teams = [
          makeTiedTeam('ACE', 'ACES', { tiebreakRank: 8 }),
          makeTiedTeam('YAN', '陽明OB', { tiebreakRank: 7 }),
          makeTiedTeam('MUZ', '木柵OB', { tiebreakRank: 6 }),
        ];

        const result = calculateStandings(teams); // 不傳 games

        expect(result[0].teamId).toBe('MUZ'); // tiebreakRank: 6
        expect(result[1].teamId).toBe('YAN'); // tiebreakRank: 7
        expect(result[2].teamId).toBe('ACE'); // tiebreakRank: 8
      });

      it('未提供 games 且無 tiebreakRank 時：維持輸入順序（stable sort）', () => {
        const teams = [
          makeTiedTeam('B', 'Team B'),
          makeTiedTeam('A', 'Team A'),
        ];

        const result = calculateStandings(teams);

        expect(result[0].teamId).toBe('B'); // 輸入順序保留
        expect(result[1].teamId).toBe('A');
      });

      it('非並列隊伍不受對戰排名影響', () => {
        const teams = [
          { teamId: 'TOP', teamName: 'Top Team', wins: 16, losses: 3, draws: 1, runsAllowed: 4.0, runsScored: 14.0 },
          makeTiedTeam('A', 'Team A'),
          makeTiedTeam('B', 'Team B', { tiebreakRank: 2 }),
        ];
        teams[1].tiebreakRank = 1; // explicitly set

        const result = calculateStandings(teams);

        expect(result[0].teamId).toBe('TOP'); // 49分，絕對領先
        expect(result[1].teamId).toBe('A');   // tiebreakRank: 1
        expect(result[2].teamId).toBe('B');   // tiebreakRank: 2
      });
    });
  });
});

// ============ Helper to build minimal SeasonGame ============
function makeGame(
  overrides: Partial<SeasonGame> & { homeTeam: string; awayTeam: string; date: string; status: SeasonGame['status'] }
): SeasonGame {
  return {
    venue: '中正A',
    timeSlot: '上午',
    startTime: '08:00',
    endTime: '11:00',
    homeScore: null,
    awayScore: null,
    sheetId: '',
    ...overrides,
  };
}

describe('calculateStreaks', () => {
  it('無已完賽比賽時應回傳空陣列', () => {
    const games: Record<string, SeasonGame> = {
      g1: makeGame({ homeTeam: 'A', awayTeam: 'B', date: '2025-04-05', status: 'scheduled' }),
    };

    expect(calculateStreaks(games)).toEqual([]);
  });

  it('單場勝利 → type: W, count: 1', () => {
    const games: Record<string, SeasonGame> = {
      g1: makeGame({ homeTeam: 'A', awayTeam: 'B', date: '2025-04-05', status: 'finished', homeScore: 5, awayScore: 2 }),
    };

    const result = calculateStreaks(games);
    const teamA = result.find((s) => s.teamName === 'A');
    const teamB = result.find((s) => s.teamName === 'B');

    expect(teamA).toEqual({ teamName: 'A', type: 'W', count: 1 });
    expect(teamB).toEqual({ teamName: 'B', type: 'L', count: 1 });
  });

  it('連續兩場勝利 → type: W, count: 2', () => {
    const games: Record<string, SeasonGame> = {
      g1: makeGame({ homeTeam: 'A', awayTeam: 'B', date: '2025-04-05', status: 'finished', homeScore: 5, awayScore: 2 }),
      g2: makeGame({ homeTeam: 'A', awayTeam: 'C', date: '2025-04-12', status: 'finished', homeScore: 3, awayScore: 1 }),
    };

    const result = calculateStreaks(games);
    const teamA = result.find((s) => s.teamName === 'A');

    expect(teamA).toEqual({ teamName: 'A', type: 'W', count: 2 });
  });

  it('勝後敗 → type: L, count: 1', () => {
    const games: Record<string, SeasonGame> = {
      g1: makeGame({ homeTeam: 'A', awayTeam: 'B', date: '2025-04-05', status: 'finished', homeScore: 5, awayScore: 2 }),
      g2: makeGame({ homeTeam: 'C', awayTeam: 'A', date: '2025-04-12', status: 'finished', homeScore: 4, awayScore: 1 }),
    };

    const result = calculateStreaks(games);
    const teamA = result.find((s) => s.teamName === 'A');

    expect(teamA).toEqual({ teamName: 'A', type: 'L', count: 1 });
  });

  it('平局 → type: D, count: 1', () => {
    const games: Record<string, SeasonGame> = {
      g1: makeGame({ homeTeam: 'A', awayTeam: 'B', date: '2025-04-05', status: 'finished', homeScore: 3, awayScore: 3 }),
    };

    const result = calculateStreaks(games);
    const teamA = result.find((s) => s.teamName === 'A');
    const teamB = result.find((s) => s.teamName === 'B');

    expect(teamA).toEqual({ teamName: 'A', type: 'D', count: 1 });
    expect(teamB).toEqual({ teamName: 'B', type: 'D', count: 1 });
  });

  it('應忽略 rain 和 scheduled 場次', () => {
    const games: Record<string, SeasonGame> = {
      g1: makeGame({ homeTeam: 'A', awayTeam: 'B', date: '2025-04-05', status: 'finished', homeScore: 5, awayScore: 2 }),
      g2: makeGame({ homeTeam: 'A', awayTeam: 'C', date: '2025-04-12', status: 'rain' }),
      g3: makeGame({ homeTeam: 'A', awayTeam: 'D', date: '2025-04-19', status: 'scheduled' }),
    };

    const result = calculateStreaks(games);
    const teamA = result.find((s) => s.teamName === 'A');

    // rain/scheduled 忽略，只有 g1，所以是 W 1
    expect(teamA).toEqual({ teamName: 'A', type: 'W', count: 1 });
  });

  it('同天多場不同球隊，各自計算正確', () => {
    const games: Record<string, SeasonGame> = {
      g1: makeGame({ homeTeam: 'A', awayTeam: 'B', date: '2025-04-05', status: 'finished', homeScore: 5, awayScore: 2 }),
      g2: makeGame({ homeTeam: 'C', awayTeam: 'D', date: '2025-04-05', status: 'finished', homeScore: 1, awayScore: 3 }),
    };

    const result = calculateStreaks(games);

    expect(result.find((s) => s.teamName === 'A')).toEqual({ teamName: 'A', type: 'W', count: 1 });
    expect(result.find((s) => s.teamName === 'B')).toEqual({ teamName: 'B', type: 'L', count: 1 });
    expect(result.find((s) => s.teamName === 'C')).toEqual({ teamName: 'C', type: 'L', count: 1 });
    expect(result.find((s) => s.teamName === 'D')).toEqual({ teamName: 'D', type: 'W', count: 1 });
  });

  it('homeScore/awayScore 為 null 的 finished 場次應忽略', () => {
    const games: Record<string, SeasonGame> = {
      g1: makeGame({ homeTeam: 'A', awayTeam: 'B', date: '2025-04-05', status: 'finished', homeScore: null, awayScore: null }),
    };

    expect(calculateStreaks(games)).toEqual([]);
  });
});

describe('calculateSpecialTags', () => {
  it('最後 2 場都是 rain（同一球隊）→ 回傳「雨神同行」', () => {
    const games: Record<string, SeasonGame> = {
      g1: makeGame({ homeTeam: 'A', awayTeam: 'B', date: '2025-04-05', status: 'rain' }),
      g2: makeGame({ homeTeam: 'A', awayTeam: 'C', date: '2025-04-12', status: 'rain' }),
    };

    const result = calculateSpecialTags(games);

    expect(result.get('A')).toBe('雨神同行');
    expect(result.get('B')).toBeUndefined();
  });

  it('最後 1 場 rain，前 1 場 finished → 不回傳「雨神同行」', () => {
    const games: Record<string, SeasonGame> = {
      g1: makeGame({ homeTeam: 'A', awayTeam: 'B', date: '2025-04-05', status: 'finished', homeScore: 5, awayScore: 2 }),
      g2: makeGame({ homeTeam: 'A', awayTeam: 'C', date: '2025-04-12', status: 'rain' }),
    };

    const result = calculateSpecialTags(games);

    expect(result.get('A')).toBeUndefined();
  });

  it('只有 1 場 rain（total）→ 不回傳「雨神同行」', () => {
    const games: Record<string, SeasonGame> = {
      g1: makeGame({ homeTeam: 'A', awayTeam: 'B', date: '2025-04-05', status: 'rain' }),
    };

    const result = calculateSpecialTags(games);

    expect(result.get('A')).toBeUndefined();
    expect(result.get('B')).toBeUndefined();
  });

  it('2 場 rain 中間夾 1 場 finished → 不回傳「雨神同行」', () => {
    const games: Record<string, SeasonGame> = {
      g1: makeGame({ homeTeam: 'A', awayTeam: 'B', date: '2025-04-05', status: 'rain' }),
      g2: makeGame({ homeTeam: 'A', awayTeam: 'C', date: '2025-04-12', status: 'finished', homeScore: 3, awayScore: 1 }),
      g3: makeGame({ homeTeam: 'A', awayTeam: 'D', date: '2025-04-19', status: 'rain' }),
    };

    const result = calculateSpecialTags(games);

    expect(result.get('A')).toBeUndefined();
  });

  it('scheduled 場次應排除（只看 finished/rain）', () => {
    const games: Record<string, SeasonGame> = {
      g1: makeGame({ homeTeam: 'A', awayTeam: 'B', date: '2025-04-05', status: 'rain' }),
      g2: makeGame({ homeTeam: 'A', awayTeam: 'C', date: '2025-04-12', status: 'rain' }),
      g3: makeGame({ homeTeam: 'A', awayTeam: 'D', date: '2025-04-19', status: 'scheduled' }),
    };

    // scheduled 排除後，最後 2 場都是 rain → 雨神同行
    const result = calculateSpecialTags(games);

    expect(result.get('A')).toBe('雨神同行');
  });
});
