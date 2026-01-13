// Jest globals (describe, it, expect) are automatically available
import {
  loadSeasonSummary,
  loadPlayerDetail,
  loadTeams,
  loadLeagueStats,
  getPlayersByTeam,
  getTeamPlayers,
  getAvailableYears,
  extractTeamsFromSeason,
} from '../dataLoader';

// Mock fetch
global.fetch = jest.fn();

describe('dataLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadSeasonSummary', () => {
    it('應該正確載入年度摘要', async () => {
      const mockData = {
        year: 2025,
        lastUpdated: '2025-01-01',
        teams: {
          'phoenix': {
            teamId: 'phoenix',
            teamName: '飛尼克斯',
            stats: { totalPlayers: 10, avgBattingAvg: 0.300, totalHomeRuns: 50 },
            players: [],
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await loadSeasonSummary(2025);

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/data/seasons/2025_summary.json');
    });

    it('載入失敗時應該拋出錯誤', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(loadSeasonSummary(2025)).rejects.toThrow('Failed to load season 2025');
    });

    it('JSON 解析失敗時應該拋出錯誤', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(loadSeasonSummary(2025)).rejects.toThrow();
    });
  });

  describe('loadPlayerDetail', () => {
    it('應該正確載入球員詳細資料', async () => {
      const mockData = {
        id: 'COL064',
        code: 'COL064',
        name: '陳重任',
        photo: '',
        career: {
          debut: 2024,
          teams: ['飛尼克斯'],
          totalSeasons: 2,
        },
        seasons: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await loadPlayerDetail('COL064');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/data/players/COL064.json');
    });

    it('載入失敗時應該拋出錯誤', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(loadPlayerDetail('INVALID')).rejects.toThrow('Failed to load player INVALID');
    });
  });

  describe('loadTeams', () => {
    it('應該正確載入球團列表', async () => {
      const mockData = {
        teams: [
          {
            id: 'phoenix',
            name: '飛尼克斯',
            code: 'PHX',
            logo: '',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await loadTeams();

      expect(result).toEqual(mockData.teams);
      expect(global.fetch).toHaveBeenCalledWith('/data/teams.json');
    });

    it('載入失敗時應該拋出錯誤', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(loadTeams()).rejects.toThrow('Failed to load teams');
    });
  });

  describe('loadLeagueStats', () => {
    it('應該正確載入聯盟統計', async () => {
      const mockData = {
        year: 2025,
        avgBattingAvg: 0.300,
        avgOBP: 0.380,
        avgSLG: 0.420,
        avgOPS: 0.800,
        totalPA: 10000,
        totalAB: 8500,
        wOBAScale: 1.20,
        wOBAWeights: {
          BB: 0.69,
          HBP: 0.72,
          '1B': 0.88,
          '2B': 1.24,
          '3B': 1.56,
          HR: 1.95,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await loadLeagueStats(2025);

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/data/seasons/2025_league.json');
    });

    it('載入失敗時應該拋出錯誤', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(loadLeagueStats(2025)).rejects.toThrow('Failed to load league stats for 2025');
    });
  });

  describe('getPlayersByTeam', () => {
    it('應該正確從年度摘要中取得指定球團球員', async () => {
      const mockData = {
        year: 2025,
        lastUpdated: '2025-01-01',
        teams: {
          'phoenix': {
            teamId: 'phoenix',
            teamName: '飛尼克斯',
            stats: { totalPlayers: 2, avgBattingAvg: 0.300, totalHomeRuns: 10 },
            players: [
              {
                id: 'COL064',
                name: '陳重任',
                number: '0',
                photo: '',
                team: '飛尼克斯',
                seasonStats: {
                  games: 10,
                  pa: 50,
                  ab: 40,
                  hits: 15,
                  singles: 10,
                  doubles: 3,
                  triples: 1,
                  hr: 1,
                  rbi: 10,
                  runs: 8,
                  bb: 8,
                  so: 10,
                  sb: 2,
                  sf: 2,
                  totalBases: 22,
                  avg: 0.375,
                  obp: 0.460,
                  slg: 0.550,
                  ops: 1.010,
                },
                rankings: {},
              },
            ],
          },
          'eagles': {
            teamId: 'eagles',
            teamName: '老鷹',
            stats: { totalPlayers: 1, avgBattingAvg: 0.250, totalHomeRuns: 5 },
            players: [],
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getPlayersByTeam(2025, 'phoenix');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('陳重任');
    });

    it('球團不存在時應該返回空陣列', async () => {
      const mockData = {
        year: 2025,
        lastUpdated: '2025-01-01',
        teams: {},
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getPlayersByTeam(2025, 'nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('getTeamPlayers', () => {
    it('應該正確從年度摘要中取得球團資訊', async () => {
      const mockData = {
        year: 2025,
        lastUpdated: '2025-01-01',
        teams: {
          'phoenix': {
            teamId: 'phoenix',
            teamName: '飛尼克斯',
            stats: { totalPlayers: 10, avgBattingAvg: 0.300, totalHomeRuns: 50 },
            players: [{ id: 'COL064', name: '陳重任' }],
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getTeamPlayers(2025, 'phoenix');

      expect(result).toBeDefined();
      expect(result?.teamId).toBe('phoenix');
      expect(result?.teamName).toBe('飛尼克斯');
      expect(result?.stats.totalPlayers).toBe(10);
    });

    it('球團不存在時應該返回 undefined', async () => {
      const mockData = {
        year: 2025,
        lastUpdated: '2025-01-01',
        teams: {},
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await getTeamPlayers(2025, 'nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('getAvailableYears', () => {
    it('應該返回所有可用的年份列表', async () => {
      // 從 2026 往回查：2026(fail), 2025(ok), 2024(ok), 2023(fail)...
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false })  // 2026
        .mockResolvedValueOnce({ ok: true, json: async () => ({ year: 2025 }) })  // 2025
        .mockResolvedValueOnce({ ok: true, json: async () => ({ year: 2024 }) })  // 2024
        .mockResolvedValueOnce({ ok: false })  // 2023
        .mockResolvedValueOnce({ ok: false })  // 2022
        .mockResolvedValueOnce({ ok: false })  // 2021
        .mockResolvedValueOnce({ ok: false }); // 2020

      const result = await getAvailableYears();

      expect(result).toEqual([2025, 2024]);
      expect(result).toHaveLength(2);
    });

    it('應該按降序排列年份', async () => {
      // 從 2026 往回查：2026(ok), 2025(ok), 2024(ok), 2023(fail), 2022(fail), 2021(fail), 2020(fail)
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ year: 2026 }) })  // 2026
        .mockResolvedValueOnce({ ok: true, json: async () => ({ year: 2025 }) })  // 2025
        .mockResolvedValueOnce({ ok: true, json: async () => ({ year: 2024 }) })  // 2024
        .mockResolvedValueOnce({ ok: false })  // 2023
        .mockResolvedValueOnce({ ok: false })  // 2022
        .mockResolvedValueOnce({ ok: false })  // 2021
        .mockResolvedValueOnce({ ok: false }); // 2020

      const result = await getAvailableYears();

      expect(result).toEqual([2026, 2025, 2024]);
      expect(result[0]).toBeGreaterThan(result[1]);
      expect(result[1]).toBeGreaterThan(result[2]);
    });

    it('沒有可用年份時應該返回空陣列', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValue({ ok: false });

      const result = await getAvailableYears();

      expect(result).toEqual([]);
    });
  });

  describe('extractTeamsFromSeason', () => {
    it('應該從年度摘要中提取球隊列表', () => {
      const mockSummary = {
        year: 2025,
        lastUpdated: '2025-01-01',
        teams: {
          '飛尼克斯': {
            teamId: '飛尼克斯',
            teamName: '飛尼克斯',
            stats: { totalPlayers: 43, avgBattingAvg: 0.218, totalHomeRuns: 5 },
            players: [{}, {}, {}] as any,
          },
          'miracle': {
            teamId: 'miracle',
            teamName: 'MIRACLE',
            stats: { totalPlayers: 25, avgBattingAvg: 0.250, totalHomeRuns: 10 },
            players: [{}, {}] as any,
          },
        },
      };

      const result = extractTeamsFromSeason(mockSummary);

      expect(result).toHaveLength(2);
      // 按 localeCompare 排序，MIRACLE 會排在飛尼克斯前面
      expect(result[0]).toEqual({
        teamId: 'miracle',
        teamName: 'MIRACLE',
        year: 2025,
        stats: { totalPlayers: 25, avgBattingAvg: 0.250, totalHomeRuns: 10 },
        playerCount: 2,
      });
      expect(result[1]).toEqual({
        teamId: '飛尼克斯',
        teamName: '飛尼克斯',
        year: 2025,
        stats: { totalPlayers: 43, avgBattingAvg: 0.218, totalHomeRuns: 5 },
        playerCount: 3,
      });
    });

    it('應該按球隊名稱排序', () => {
      const mockSummary = {
        year: 2025,
        lastUpdated: '2025-01-01',
        teams: {
          'z-team': {
            teamId: 'z-team',
            teamName: 'Z Team',
            stats: { totalPlayers: 10, avgBattingAvg: 0.200, totalHomeRuns: 2 },
            players: [] as any,
          },
          'a-team': {
            teamId: 'a-team',
            teamName: 'A Team',
            stats: { totalPlayers: 15, avgBattingAvg: 0.300, totalHomeRuns: 5 },
            players: [] as any,
          },
        },
      };

      const result = extractTeamsFromSeason(mockSummary);

      expect(result[0].teamName).toBe('A Team');
      expect(result[1].teamName).toBe('Z Team');
    });

    it('空的年度摘要應該返回空陣列', () => {
      const mockSummary = {
        year: 2025,
        lastUpdated: '2025-01-01',
        teams: {},
      };

      const result = extractTeamsFromSeason(mockSummary);

      expect(result).toEqual([]);
    });
  });
});
