// Jest globals (describe, it, expect) are automatically available
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePlayerList } from '../usePlayerList';
import { loadSeasonSummary } from '@/src/lib/dataLoader';
import type { SeasonSummary } from '@/src/types';

// Mock dataLoader
jest.mock('@/src/lib/dataLoader');

const mockLoadSeasonSummary = loadSeasonSummary as jest.MockedFunction<
  typeof loadSeasonSummary
>;

describe('usePlayerList', () => {
  const mockSeasonData: SeasonSummary = {
    year: 2025,
    lastUpdated: '2025-01-01',
    teams: {
      phoenix: {
        teamId: 'phoenix',
        teamName: '飛尼克斯',
        stats: {
          totalPlayers: 2,
          avgBattingAvg: 0.3,
          totalHomeRuns: 15,
        },
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
              obp: 0.46,
              slg: 0.55,
              ops: 1.01,
            },
            rankings: { avg: 1 },
          },
          {
            id: 'COL065',
            name: '王小明',
            number: '1',
            photo: '',
            team: '飛尼克斯',
            seasonStats: {
              games: 10,
              pa: 40,
              ab: 35,
              hits: 10,
              singles: 8,
              doubles: 2,
              triples: 0,
              hr: 0,
              rbi: 5,
              runs: 6,
              bb: 4,
              so: 8,
              sb: 3,
              sf: 1,
              totalBases: 12,
              avg: 0.286,
              obp: 0.35,
              slg: 0.343,
              ops: 0.693,
            },
            rankings: { avg: 5 },
          },
        ],
      },
      eagles: {
        teamId: 'eagles',
        teamName: '老鷹',
        stats: {
          totalPlayers: 1,
          avgBattingAvg: 0.25,
          totalHomeRuns: 5,
        },
        players: [
          {
            id: 'EAG001',
            name: '李大華',
            number: '10',
            photo: '',
            team: '老鷹',
            seasonStats: {
              games: 8,
              pa: 30,
              ab: 28,
              hits: 7,
              singles: 5,
              doubles: 2,
              triples: 0,
              hr: 0,
              rbi: 3,
              runs: 4,
              bb: 2,
              so: 5,
              sb: 1,
              sf: 0,
              totalBases: 9,
              avg: 0.25,
              obp: 0.3,
              slg: 0.321,
              ops: 0.621,
            },
            rankings: { avg: 10 },
          },
        ],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本載入功能', () => {
    it('應該成功載入球員列表', async () => {
      mockLoadSeasonSummary.mockResolvedValueOnce(mockSeasonData);

      const { result } = renderHook(() => usePlayerList(2025));

      expect(result.current.loading).toBe(true);
      expect(result.current.players).toEqual([]);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toHaveLength(3);
      expect(result.current.error).toBeNull();
    });

    it('載入失敗時應該設定錯誤訊息', async () => {
      const errorMessage = 'Failed to load';
      mockLoadSeasonSummary.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => usePlayerList(2025));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.players).toEqual([]);
    });

    it('年份改變時應該重新載入', async () => {
      mockLoadSeasonSummary.mockResolvedValue(mockSeasonData);

      const { result, rerender } = renderHook(
        ({ year }) => usePlayerList(year),
        { initialProps: { year: 2025 } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockLoadSeasonSummary).toHaveBeenCalledTimes(1);

      rerender({ year: 2024 });

      await waitFor(() => {
        expect(mockLoadSeasonSummary).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('球團篩選功能', () => {
    it('應該能依球團篩選球員', async () => {
      mockLoadSeasonSummary.mockResolvedValueOnce(mockSeasonData);

      const { result } = renderHook(() => usePlayerList(2025, 'phoenix'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toHaveLength(2);
      expect(result.current.players[0].team).toBe('飛尼克斯');
      expect(result.current.players[1].team).toBe('飛尼克斯');
    });

    it('球團不存在時應該返回空陣列', async () => {
      mockLoadSeasonSummary.mockResolvedValueOnce(mockSeasonData);

      const { result } = renderHook(() => usePlayerList(2025, 'nonexistent'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toEqual([]);
    });

    it('球團 ID 改變時應該更新篩選結果', async () => {
      mockLoadSeasonSummary.mockResolvedValue(mockSeasonData);

      const { result, rerender } = renderHook(
        ({ teamId }) => usePlayerList(2025, teamId),
        { initialProps: { teamId: 'phoenix' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.players).toHaveLength(2);

      rerender({ teamId: 'eagles' });

      await waitFor(() => {
        expect(result.current.players).toHaveLength(1);
        expect(result.current.players[0].team).toBe('老鷹');
      });
    });
  });

  describe('排序功能', () => {
    it('應該能依打擊率排序 (降序)', async () => {
      mockLoadSeasonSummary.mockResolvedValueOnce(mockSeasonData);

      const { result } = renderHook(() => usePlayerList(2025));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.sortBy('avg', 'desc');
      });

      await waitFor(() => {
        expect(result.current.players[0].seasonStats.avg).toBe(0.375);
        expect(result.current.players[2].seasonStats.avg).toBe(0.25);
      });
    });

    it('應該能依打擊率排序 (升序)', async () => {
      mockLoadSeasonSummary.mockResolvedValueOnce(mockSeasonData);

      const { result } = renderHook(() => usePlayerList(2025));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.sortBy('avg', 'asc');
      });

      await waitFor(() => {
        expect(result.current.players[0].seasonStats.avg).toBe(0.25);
        expect(result.current.players[2].seasonStats.avg).toBe(0.375);
      });
    });

    it('應該能依全壘打數排序', async () => {
      mockLoadSeasonSummary.mockResolvedValueOnce(mockSeasonData);

      const { result } = renderHook(() => usePlayerList(2025));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.sortBy('hr', 'desc');
      });

      await waitFor(() => {
        expect(result.current.players[0].seasonStats.hr).toBe(1);
      });
    });
  });

  describe('重新整理功能', () => {
    it('應該能手動重新載入資料', async () => {
      mockLoadSeasonSummary.mockResolvedValue(mockSeasonData);

      const { result } = renderHook(() => usePlayerList(2025));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockLoadSeasonSummary).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(mockLoadSeasonSummary).toHaveBeenCalledTimes(2);
      });
    });
  });
});
