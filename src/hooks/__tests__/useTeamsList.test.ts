import { renderHook, waitFor } from '@testing-library/react';
import { useTeamsList } from '../useTeamsList';
import * as dataLoader from '@/src/lib/dataLoader';
import type { TeamSummary, SeasonSummary } from '@/src/types';

// Mock dataLoader
jest.mock('@/src/lib/dataLoader');

describe('useTeamsList', () => {
  const mockTeams: TeamSummary[] = [
    {
      teamId: '飛尼克斯',
      teamName: '飛尼克斯',
      year: 2025,
      stats: { totalPlayers: 43, avgBattingAvg: 0.218, totalHomeRuns: 5 },
      playerCount: 43,
    },
    {
      teamId: 'miracle',
      teamName: 'MIRACLE',
      year: 2025,
      stats: { totalPlayers: 25, avgBattingAvg: 0.250, totalHomeRuns: 10 },
      playerCount: 25,
    },
  ];

  const mockSummary: SeasonSummary = {
    year: 2025,
    lastUpdated: '2025-01-01',
    teams: {
      '飛尼克斯': {
        teamId: '飛尼克斯',
        teamName: '飛尼克斯',
        stats: { totalPlayers: 43, avgBattingAvg: 0.218, totalHomeRuns: 5 },
        players: [],
      },
      'miracle': {
        teamId: 'miracle',
        teamName: 'MIRACLE',
        stats: { totalPlayers: 25, avgBattingAvg: 0.250, totalHomeRuns: 10 },
        players: [],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (dataLoader.getAvailableYears as jest.Mock).mockResolvedValue([2025, 2024, 2023]);
    (dataLoader.loadSeasonSummary as jest.Mock).mockResolvedValue(mockSummary);
    (dataLoader.extractTeamsFromSeason as jest.Mock).mockReturnValue(mockTeams);
    (dataLoader.getTeamIcons as jest.Mock).mockResolvedValue(new Map());
  });

  describe('初始化', () => {
    it('應該初始化狀態', () => {
      const { result } = renderHook(() => useTeamsList());

      expect(result.current.year).toBe(2025);
      expect(result.current.teams).toEqual([]);
      expect(result.current.availableYears).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('應該使用自訂初始年份', () => {
      const { result } = renderHook(() => useTeamsList(2024));

      expect(result.current.year).toBe(2024);
    });
  });

  describe('載入資料', () => {
    it('應該載入可用年份和球隊列表', async () => {
      const { result } = renderHook(() => useTeamsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.availableYears).toEqual([2025, 2024, 2023]);
      expect(result.current.teams).toEqual(mockTeams);
      expect(dataLoader.getAvailableYears).toHaveBeenCalledTimes(1);
      expect(dataLoader.loadSeasonSummary).toHaveBeenCalledWith(2025);
      expect(dataLoader.extractTeamsFromSeason).toHaveBeenCalledWith(mockSummary);
    });

    it('載入失敗時應該設定錯誤', async () => {
      const error = new Error('Failed to load');
      // getAvailableYears 成功，但 loadSeasonSummary 失敗
      (dataLoader.getAvailableYears as jest.Mock).mockResolvedValue([2025]);
      (dataLoader.loadSeasonSummary as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useTeamsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.teams).toEqual([]);
    });
  });

  describe('切換年份', () => {
    it('應該能切換年份並重新載入球隊列表', async () => {
      const { result } = renderHook(() => useTeamsList());

      // 等待初始載入完成
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.year).toBe(2025);

      // 切換到 2024
      const mockTeams2024: TeamSummary[] = [
        {
          teamId: 'team1',
          teamName: 'Team 1',
          year: 2024,
          stats: { totalPlayers: 20, avgBattingAvg: 0.280, totalHomeRuns: 8 },
          playerCount: 20,
        },
      ];

      (dataLoader.extractTeamsFromSeason as jest.Mock).mockReturnValue(mockTeams2024);

      result.current.setYear(2024);

      await waitFor(() => {
        expect(result.current.year).toBe(2024);
      });

      await waitFor(() => {
        expect(result.current.teams).toEqual(mockTeams2024);
      });

      expect(dataLoader.loadSeasonSummary).toHaveBeenCalledWith(2024);
    });

    it('切換年份時會重新載入資料', async () => {
      const { result } = renderHook(() => useTeamsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.year).toBe(2025);

      // 清除 mock 計數
      (dataLoader.loadSeasonSummary as jest.Mock).mockClear();

      result.current.setYear(2024);

      // 等待載入完成
      await waitFor(() => {
        expect(result.current.year).toBe(2024);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 確認重新調用了 loadSeasonSummary
      expect(dataLoader.loadSeasonSummary).toHaveBeenCalledWith(2024);
    });
  });

  describe('錯誤處理', () => {
    it('載入球隊列表失敗時應該設定錯誤', async () => {
      const error = new Error('Failed to load season summary');
      (dataLoader.loadSeasonSummary as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useTeamsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.teams).toEqual([]);
    });

    it('切換年份失敗時應該設定錯誤', async () => {
      const { result } = renderHook(() => useTeamsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 清除之前的 mock，設定新的失敗 mock
      const error = new Error('Failed to load 2024');
      (dataLoader.loadSeasonSummary as jest.Mock).mockReset();
      (dataLoader.loadSeasonSummary as jest.Mock).mockRejectedValue(error);

      result.current.setYear(2024);

      // 等待錯誤被設定
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(error);
    });
  });
});
