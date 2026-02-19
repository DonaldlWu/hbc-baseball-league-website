import {
  loadSeasonData,
  getGamesByMonth,
  getGamesByTeam,
  loadStandingsFromSeason,
  loadSeasonIndex,
  findSeasonByMonth,
  loadGamesByCalendarMonth,
  resetSeasonIndexCache,
} from '../seasonDataLoader';
import type { SeasonData, SeasonIndexEntry } from '@/src/types';

// Mock fetch
global.fetch = jest.fn();

const mockSeasonData: SeasonData = {
  season: 2025,
  lastUpdated: '2026-02-18T00:00:00Z',
  calendarRange: { start: '2025-04', end: '2026-02' },
  standings: {
    source: 'manual',
    teams: [
      {
        teamId: 'ROO',
        teamName: 'Line Drive',
        wins: 16,
        losses: 3,
        draws: 1,
        runsAllowed: 4.0,
        runsScored: 13.75,
      },
    ],
  },
  games: {
    '2025201': {
      date: '2026-01-03',
      homeTeam: 'Line Drive',
      awayTeam: '陽明OB',
      venue: '中正A',
      timeSlot: '上午',
      startTime: '08:00',
      endTime: '11:00',
      status: 'finished',
      homeScore: 10,
      awayScore: 3,
      sheetId: '1dM8woBhSnNPms3YKPEptfw3o4F3neBWa-JrbRoW1iak',
    },
    '2025202': {
      date: '2026-01-03',
      homeTeam: '永春TB',
      awayTeam: '楚奧特',
      venue: '中正B',
      timeSlot: '下午',
      startTime: '14:00',
      endTime: '17:00',
      status: 'finished',
      homeScore: 5,
      awayScore: 2,
      sheetId: '',
    },
    '2025207': {
      date: '2026-02-07',
      homeTeam: '永春TB',
      awayTeam: '少林棒球隊',
      venue: '中正A',
      timeSlot: '上午',
      startTime: '08:00',
      endTime: '11:00',
      status: 'scheduled',
      homeScore: null,
      awayScore: null,
      sheetId: '',
    },
    '2025208': {
      date: '2026-01-03',
      homeTeam: '飛尼克斯',
      awayTeam: 'ACES',
      venue: '中正A',
      timeSlot: '下午',
      startTime: '14:00',
      endTime: '17:00',
      status: 'finished',
      homeScore: 5,
      awayScore: 3,
      sheetId: 'abc123',
      rescheduledDates: [{ date: '2026-03-07' }],
    },
    '2025209': {
      date: '2026-01-10',
      homeTeam: '少林棒球隊',
      awayTeam: '楚奧特',
      venue: '中正B',
      timeSlot: '上午',
      startTime: '08:00',
      endTime: '11:00',
      status: 'rain',
      homeScore: null,
      awayScore: null,
      sheetId: '',
    },
    '2025210': {
      date: '2025-01-21',
      homeTeam: '飛尼克斯',
      awayTeam: '永春TB',
      venue: '中正B',
      timeSlot: '上午',
      startTime: '08:00',
      endTime: '11:00',
      status: 'finished',
      homeScore: 4,
      awayScore: 2,
      sheetId: 'xyz789',
      rescheduledDates: [
        { date: '2025-03-21', venue: '清溪', timeSlot: '中午', startTime: '12:00', endTime: '14:30' },
        { date: '2025-05-10', venue: '中正A', timeSlot: '下午', startTime: '14:00', endTime: '17:00' },
      ],
    },
    '2025211': {
      date: '2025-02-01',
      homeTeam: '楚奧特',
      awayTeam: 'Line Drive',
      venue: '中正A',
      timeSlot: '上午',
      startTime: '08:00',
      endTime: '11:00',
      status: 'rain',
      homeScore: null,
      awayScore: null,
      sheetId: '',
      rescheduledDates: [],
    },
  },
};

const mockSeasonIndex: SeasonIndexEntry[] = [
  { season: 2025, start: '2025-04', end: '2026-02' },
  { season: 2026, start: '2026-03', end: '2027-02' },
];

describe('loadSeasonData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('應該正確載入賽季資料', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSeasonData,
    });

    const result = await loadSeasonData(2025);

    expect(result.season).toBe(2025);
    expect(result.standings.source).toBe('manual');
    expect(Object.keys(result.games)).toHaveLength(7);
    expect(global.fetch).toHaveBeenCalledWith('/data/seasons/2025.json');
  });

  it('載入失敗時應該拋出錯誤', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(loadSeasonData(2025)).rejects.toThrow(
      'Failed to load season data for 2025'
    );
  });
});

describe('getGamesByMonth', () => {
  it('應該回傳指定月份的比賽', () => {
    const result = getGamesByMonth(mockSeasonData, 2026, 1);

    expect(result).toHaveLength(4);
    expect(result.map((g) => g.gameNumber)).toContain('2025201');
  });

  it('無比賽時應回傳空陣列', () => {
    const result = getGamesByMonth(mockSeasonData, 2026, 4);

    expect(result).toHaveLength(0);
  });

  it('應該正確回傳 2 月份的比賽', () => {
    const result = getGamesByMonth(mockSeasonData, 2026, 2);

    expect(result).toHaveLength(1);
    expect(result[0].gameNumber).toBe('2025207');
  });

  it('雨延且有 rescheduledDates 的比賽，在原定月份應顯示 status: rain（即使 root status 是 finished）', () => {
    const result = getGamesByMonth(mockSeasonData, 2026, 1);

    const rainGame = result.find((g) => g.gameNumber === '2025208');
    expect(rainGame).toBeDefined();
    expect(rainGame?.status).toBe('rain');
    expect(rainGame?.date).toBe('2026-01-03');
  });

  it('雨延且有補賽日期的比賽，在補賽月份也應出現，date 為 rescheduledDates[0]，status 為 finished', () => {
    const result = getGamesByMonth(mockSeasonData, 2026, 3);

    const makeupGame = result.find((g) => g.gameNumber === '2025208');
    expect(makeupGame).toBeDefined();
    expect(makeupGame?.date).toBe('2026-03-07');
    expect(makeupGame?.status).toBe('finished');
    expect(makeupGame?.homeScore).toBe(5);
  });

  it('雨延但尚未補賽（無 rescheduledDates），不應在其他月份出現', () => {
    // 2025209 is rain with no rescheduledDates, original date 2026-01-10
    const resultMarch = getGamesByMonth(mockSeasonData, 2026, 3);

    const noMakeupGame = resultMarch.find((g) => g.gameNumber === '2025209');
    expect(noMakeupGame).toBeUndefined();
  });

  it('多次延賽的比賽，中間補賽日應顯示 status: rain', () => {
    const result = getGamesByMonth(mockSeasonData, 2025, 3);

    const midMakeupGame = result.find((g) => g.gameNumber === '2025210');
    expect(midMakeupGame).toBeDefined();
    expect(midMakeupGame?.date).toBe('2025-03-21');
    expect(midMakeupGame?.status).toBe('rain');
  });

  it('多次延賽的比賽，最終補賽日應顯示原 game 的 status 與比分', () => {
    const result = getGamesByMonth(mockSeasonData, 2025, 5);

    const finalMakeupGame = result.find((g) => g.gameNumber === '2025210');
    expect(finalMakeupGame).toBeDefined();
    expect(finalMakeupGame?.date).toBe('2025-05-10');
    expect(finalMakeupGame?.status).toBe('finished');
    expect(finalMakeupGame?.homeScore).toBe(4);
  });

  it('rescheduledDates 為空陣列時，不應在其他月份出現', () => {
    // 2025211 has rescheduledDates: [], original date 2025-02-01
    const resultMarch = getGamesByMonth(mockSeasonData, 2025, 3);

    const noMakeupGame = resultMarch.find((g) => g.gameNumber === '2025211');
    expect(noMakeupGame).toBeUndefined();
  });
});

describe('getGamesByTeam', () => {
  it('應該回傳指定球隊的比賽（主隊）', () => {
    const result = getGamesByTeam(mockSeasonData, 'Line Drive');

    // 2025201 (homeTeam), 2025211 (awayTeam: 'Line Drive' as away)
    expect(result).toHaveLength(2);
    expect(result.map((g) => g.gameNumber)).toContain('2025201');
  });

  it('應該回傳指定球隊的比賽（客隊）', () => {
    const result = getGamesByTeam(mockSeasonData, '陽明OB');

    expect(result).toHaveLength(1);
    expect(result[0].gameNumber).toBe('2025201');
  });

  it('應該回傳指定球隊的所有比賽（主客場皆含）', () => {
    const result = getGamesByTeam(mockSeasonData, '永春TB');

    // 2025202 (homeTeam), 2025207 (homeTeam), 2025210 (awayTeam)
    expect(result).toHaveLength(3);
  });

  it('球隊不存在時應回傳空陣列', () => {
    const result = getGamesByTeam(mockSeasonData, '不存在球隊');

    expect(result).toHaveLength(0);
  });
});

describe('loadStandingsFromSeason', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('應該正確載入並計算戰績排名', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSeasonData,
    });

    const result = await loadStandingsFromSeason(2025);

    expect(result.year).toBe(2025);
    expect(result.league).toBe('新和週六野球聯盟');
    expect(result.lastUpdated).toBe('2026-02-18T00:00:00Z');
    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].rank).toBe(1);
    expect(result.teams[0].teamName).toBe('Line Drive');
  });

  it('應該從 games 計算 streak 並附加到對應球隊', async () => {
    // mockSeasonData 有 Line Drive 主場對 陽明OB（2025201, finished, 10:3）
    // 所以 Line Drive 最近一場是勝
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSeasonData,
    });

    const result = await loadStandingsFromSeason(2025);
    const lineDrive = result.teams.find((t) => t.teamName === 'Line Drive');

    expect(lineDrive?.streak).toBeDefined();
    expect(lineDrive?.streak?.type).toBe('W');
    expect(lineDrive?.streak?.count).toBeGreaterThanOrEqual(1);
  });

  it('載入失敗時應該拋出錯誤', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(loadStandingsFromSeason(2025)).rejects.toThrow(
      'Failed to load season data for 2025'
    );
  });
});

describe('loadSeasonIndex', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSeasonIndexCache();
  });

  it('應該正確載入賽季索引', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSeasonIndex,
    });

    const result = await loadSeasonIndex();

    expect(result).toHaveLength(2);
    expect(result[0].season).toBe(2025);
    expect(result[0].start).toBe('2025-04');
    expect(result[0].end).toBe('2026-02');
    expect(global.fetch).toHaveBeenCalledWith('/data/seasons/index.json');
  });

  it('載入失敗時應該拋出錯誤', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(loadSeasonIndex()).rejects.toThrow(
      'Failed to load season index'
    );
  });
});

describe('findSeasonByMonth', () => {
  it('2026 年 1 月應回傳 2025 賽季（跨賽季情況）', () => {
    const result = findSeasonByMonth(mockSeasonIndex, 2026, 1);
    expect(result).toBe(2025);
  });

  it('2026 年 2 月應回傳 2025 賽季（賽季末月）', () => {
    const result = findSeasonByMonth(mockSeasonIndex, 2026, 2);
    expect(result).toBe(2025);
  });

  it('2026 年 3 月應回傳 2026 賽季（新賽季起始月）', () => {
    const result = findSeasonByMonth(mockSeasonIndex, 2026, 3);
    expect(result).toBe(2026);
  });

  it('2025 年 4 月應回傳 2025 賽季（賽季開幕月）', () => {
    const result = findSeasonByMonth(mockSeasonIndex, 2025, 4);
    expect(result).toBe(2025);
  });

  it('找不到對應賽季時應回傳最近一個賽季的年份', () => {
    const result = findSeasonByMonth(mockSeasonIndex, 2024, 1);
    expect(result).toBe(2025);
  });
});

describe('loadGamesByCalendarMonth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSeasonIndexCache();
  });

  it('應回傳 DaySchedule[] 格式，按日期分組後再按場地分組', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeasonIndex,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeasonData,
      });

    const result = await loadGamesByCalendarMonth(2026, 1);

    // 2026-01 has games on 2026-01-03 (2025201, 2025202, 2025208) and 2026-01-10 (2025209)
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-01-03');
  });

  it('同一天多場地的比賽應正確按場地分組', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeasonIndex,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeasonData,
      });

    const result = await loadGamesByCalendarMonth(2026, 1);

    const day = result[0];
    // 中正A has 2025201 (08:00) and 2025208 (14:00), 中正B has 2025202
    expect(Object.keys(day.venues)).toContain('中正A');
    expect(Object.keys(day.venues)).toContain('中正B');
    expect(day.venues['中正A']).toHaveLength(2);
    expect(day.venues['中正B']).toHaveLength(1);
  });

  it('Game 物件應包含 gameNumber 欄位', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeasonIndex,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeasonData,
      });

    const result = await loadGamesByCalendarMonth(2026, 1);

    const games = Object.values(result[0].venues).flat();
    expect(games[0].gameNumber).toBeDefined();
  });

  it('已完賽的比賽應填充 result 欄位', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeasonIndex,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeasonData,
      });

    const result = await loadGamesByCalendarMonth(2026, 1);

    const game2025201 = Object.values(result[0].venues)
      .flat()
      .find((g) => g.gameNumber === '2025201');
    expect(game2025201?.result).toBeDefined();
    expect(game2025201?.result?.homeScore).toBe(10);
    expect(game2025201?.result?.awayScore).toBe(3);
    expect(game2025201?.result?.status).toBe('finished');
  });

  it('未比賽的比賽 result 欄位應為 undefined', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeasonIndex,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeasonData,
      });

    const result = await loadGamesByCalendarMonth(2026, 2);

    const game2025207 = Object.values(result[0].venues)
      .flat()
      .find((g) => g.gameNumber === '2025207');
    expect(game2025207?.result).toBeUndefined();
  });

  it('2026 年 3 月應從 2026 賽季載入資料', async () => {
    const mockSeason2026: SeasonData = {
      season: 2026,
      lastUpdated: '2026-02-18T00:00:00Z',
      calendarRange: { start: '2026-03', end: '2027-02' },
      standings: { source: 'manual', teams: [] },
      games: {
        '2026101': {
          date: '2026-03-07',
          homeTeam: 'Line Drive',
          awayTeam: '永春TB',
          venue: '中正A',
          timeSlot: '上午',
          startTime: '08:00',
          endTime: '11:00',
          status: 'scheduled',
          homeScore: null,
          awayScore: null,
          sheetId: '',
        },
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeasonIndex,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeason2026,
      });

    const result = await loadGamesByCalendarMonth(2026, 3);

    expect(global.fetch).toHaveBeenCalledWith('/data/seasons/2026.json');
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-03-07');
  });

  it('無比賽的月份應回傳空陣列', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeasonIndex,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSeasonData,
      });

    const result = await loadGamesByCalendarMonth(2026, 5);

    expect(result).toHaveLength(0);
  });

  it('2026 年 2 月橫跨兩個賽季時，應合併兩賽季的比賽', async () => {
    const overlapIndex: SeasonIndexEntry[] = [
      { season: 2025, start: '2025-04', end: '2026-02' },
      { season: 2026, start: '2026-02', end: '2027-02' },
    ];

    const mock2026Data: SeasonData = {
      season: 2026,
      lastUpdated: '2026-02-19T00:00:00Z',
      calendarRange: { start: '2026-02', end: '2027-02' },
      standings: { source: 'manual', teams: [] },
      games: {
        '2026066': {
          date: '2026-02-14',
          homeTeam: '少林棒球隊',
          awayTeam: '十號馬',
          venue: '清溪',
          timeSlot: '下午',
          startTime: '14:00',
          endTime: '17:00',
          status: 'finished',
          homeScore: 4,
          awayScore: 8,
          sheetId: '1Fa5nh08MZzwzVPiphHEiJK6RAXngaeFxiRbAEW2pGqQ',
        },
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => overlapIndex })
      .mockResolvedValueOnce({ ok: true, json: async () => mockSeasonData })
      .mockResolvedValueOnce({ ok: true, json: async () => mock2026Data });

    const result = await loadGamesByCalendarMonth(2026, 2);

    const allDates = result.map((d) => d.date);
    expect(allDates).toContain('2026-02-07');  // 來自 2025 賽季
    expect(allDates).toContain('2026-02-14');  // 來自 2026 賽季

    const allGames = result.flatMap((d) => Object.values(d.venues).flat());
    expect(allGames.find((g) => g.gameNumber === '2025207')).toBeDefined();
    expect(allGames.find((g) => g.gameNumber === '2026066')).toBeDefined();
  });
});
