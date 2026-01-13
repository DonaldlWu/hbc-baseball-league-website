import { renderHook, act, waitFor } from '@testing-library/react';
import { usePlayerModal } from '../usePlayerModal';
import * as dataLoader from '@/src/lib/dataLoader';
import type { Player } from '@/src/types';

// Mock dataLoader module
jest.mock('@/src/lib/dataLoader', () => ({
  loadPlayer: jest.fn(),
}));

describe('usePlayerModal', () => {
  const mockPlayer: Player = {
    id: 'COL064',
    code: 'COL064',
    name: '陳重任',
    photo: 'https://example.com/photo.jpg',
    career: {
      debut: 2024,
      teams: ['飛尼克斯'],
      totalSeasons: 2,
    },
    seasons: [
      {
        year: 2025,
        team: '飛尼克斯',
        number: '0',
        batting: {
          games: 9,
          pa: 19,
          ab: 16,
          hits: 2,
          singles: 2,
          doubles: 0,
          triples: 0,
          hr: 0,
          rbi: 2,
          runs: 4,
          bb: 3,
          so: 7,
          sb: 1,
          sf: 0,
          totalBases: 2,
        },
        rankings: { avg: 422 },
      },
    ],
  };

  const mockLoadPlayer = dataLoader.loadPlayer as jest.MockedFunction<
    typeof dataLoader.loadPlayer
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('初始狀態', () => {
    it('Modal 應該是關閉的', () => {
      const { result } = renderHook(() => usePlayerModal());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.player).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('openModal', () => {
    it('應該載入並顯示球員資料', async () => {
      mockLoadPlayer.mockResolvedValueOnce(mockPlayer);

      const { result } = renderHook(() => usePlayerModal());

      // 開始載入前
      expect(result.current.isOpen).toBe(false);
      expect(result.current.loading).toBe(false);

      // 開啟 Modal
      await act(async () => {
        await result.current.openModal('COL064');
      });

      // 載入完成後
      expect(mockLoadPlayer).toHaveBeenCalledWith('COL064');
      expect(result.current.isOpen).toBe(true);
      expect(result.current.player).toEqual(mockPlayer);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('載入過程中 loading 應該為 true', async () => {
      let resolveLoadPlayer: (value: Player) => void;
      const loadPlayerPromise = new Promise<Player>((resolve) => {
        resolveLoadPlayer = resolve;
      });

      mockLoadPlayer.mockReturnValueOnce(loadPlayerPromise);

      const { result } = renderHook(() => usePlayerModal());

      // 開始載入
      act(() => {
        result.current.openModal('COL064');
      });

      // 載入中
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // 完成載入
      await act(async () => {
        resolveLoadPlayer!(mockPlayer);
        await loadPlayerPromise;
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.player).toEqual(mockPlayer);
    });

    it('載入失敗時應該設定錯誤', async () => {
      mockLoadPlayer.mockRejectedValueOnce(new Error('Player not found'));

      const { result } = renderHook(() => usePlayerModal());

      await act(async () => {
        await result.current.openModal('INVALID_ID');
      });

      expect(result.current.error).toBe('Player not found');
      expect(result.current.isOpen).toBe(false);
      expect(result.current.player).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('載入失敗時應該處理非 Error 型別的錯誤', async () => {
      mockLoadPlayer.mockRejectedValueOnce('Unknown error');

      const { result } = renderHook(() => usePlayerModal());

      await act(async () => {
        await result.current.openModal('INVALID_ID');
      });

      expect(result.current.error).toBe('Unknown error');
      expect(result.current.isOpen).toBe(false);
    });

    it('應該能連續開啟不同球員的 Modal', async () => {
      const mockPlayer2: Player = {
        ...mockPlayer,
        id: 'COL065',
        code: 'COL065',
        name: '林坤泰',
      };

      mockLoadPlayer
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(mockPlayer2);

      const { result } = renderHook(() => usePlayerModal());

      // 開啟第一個球員
      await act(async () => {
        await result.current.openModal('COL064');
      });

      expect(result.current.player?.name).toBe('陳重任');

      // 開啟第二個球員
      await act(async () => {
        await result.current.openModal('COL065');
      });

      expect(result.current.player?.name).toBe('林坤泰');
      expect(mockLoadPlayer).toHaveBeenCalledTimes(2);
    });
  });

  describe('closeModal', () => {
    it('應該關閉 Modal 並清空球員資料', async () => {
      mockLoadPlayer.mockResolvedValueOnce(mockPlayer);

      const { result } = renderHook(() => usePlayerModal());

      // 先開啟 Modal
      await act(async () => {
        await result.current.openModal('COL064');
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.player).toEqual(mockPlayer);

      // 關閉 Modal
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.player).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('關閉 Modal 應該清除錯誤訊息', async () => {
      mockLoadPlayer.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => usePlayerModal());

      // 載入失敗
      await act(async () => {
        await result.current.openModal('INVALID_ID');
      });

      expect(result.current.error).toBe('Network error');

      // 關閉 Modal
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.error).toBeNull();
    });

    it('關閉未開啟的 Modal 不應該造成錯誤', () => {
      const { result } = renderHook(() => usePlayerModal());

      // 直接關閉（未開啟）
      expect(() => {
        act(() => {
          result.current.closeModal();
        });
      }).not.toThrow();

      expect(result.current.isOpen).toBe(false);
      expect(result.current.player).toBeNull();
    });
  });

  describe('多個 usePlayerModal 實例', () => {
    it('每個實例應該獨立運作', async () => {
      mockLoadPlayer.mockResolvedValue(mockPlayer);

      const { result: result1 } = renderHook(() => usePlayerModal());
      const { result: result2 } = renderHook(() => usePlayerModal());

      // 開啟第一個實例
      await act(async () => {
        await result1.current.openModal('COL064');
      });

      expect(result1.current.isOpen).toBe(true);
      expect(result2.current.isOpen).toBe(false); // 第二個應該保持關閉
    });
  });

  describe('API 一致性', () => {
    it('應該提供所有必要的 API', () => {
      const { result } = renderHook(() => usePlayerModal());

      // 驗證所有必要的屬性和方法都存在
      expect(result.current).toHaveProperty('isOpen');
      expect(result.current).toHaveProperty('player');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('openModal');
      expect(result.current).toHaveProperty('closeModal');

      // 驗證方法型別
      expect(typeof result.current.openModal).toBe('function');
      expect(typeof result.current.closeModal).toBe('function');
    });
  });
});
