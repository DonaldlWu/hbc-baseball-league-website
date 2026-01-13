// Jest globals (describe, it, expect) are automatically available
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePlayerSearch } from '../usePlayerSearch';
import type { PlayerSummary } from '@/src/types';

// Mock ahooks useDebounce
jest.mock('ahooks', () => ({
  useDebounce: jest.fn((value) => value), // 預設不延遲，測試時可以覆寫
}));

import { useDebounce } from 'ahooks';

const mockUseDebounce = useDebounce as jest.MockedFunction<typeof useDebounce>;

describe('usePlayerSearch', () => {
  const mockPlayers: PlayerSummary[] = [
    {
      id: 'COL064',
      name: '陳重任',
      number: '0',
      photo: '',
      team: '飛尼克斯',
      seasonStats: {
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
        avg: 0.125,
        obp: 0.263,
        slg: 0.125,
        ops: 0.388,
      },
      rankings: { avg: 422 },
    },
    {
      id: 'COL065',
      name: '林坤泰',
      number: '1',
      photo: '',
      team: '飛尼克斯',
      seasonStats: {
        games: 10,
        pa: 50,
        ab: 45,
        hits: 25,
        singles: 20,
        doubles: 3,
        triples: 1,
        hr: 1,
        rbi: 15,
        runs: 12,
        bb: 4,
        so: 8,
        sb: 3,
        sf: 1,
        totalBases: 32,
        avg: 0.556,
        obp: 0.6,
        slg: 0.711,
        ops: 1.311,
      },
      rankings: { avg: 5 },
    },
    {
      id: 'COL066',
      name: '孔睦驊',
      number: '10',
      photo: '',
      team: '老鷹',
      seasonStats: {
        games: 8,
        pa: 35,
        ab: 30,
        hits: 10,
        singles: 8,
        doubles: 2,
        triples: 0,
        hr: 0,
        rbi: 5,
        runs: 6,
        bb: 4,
        so: 6,
        sb: 2,
        sf: 1,
        totalBases: 12,
        avg: 0.333,
        obp: 0.4,
        slg: 0.4,
        ops: 0.8,
      },
      rankings: { avg: 100 },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // 預設行為：不延遲
    mockUseDebounce.mockImplementation((value) => value);
  });

  describe('初始狀態', () => {
    it('應該返回所有球員', () => {
      const { result } = renderHook(() => usePlayerSearch(mockPlayers));

      expect(result.current.searchTerm).toBe('');
      expect(result.current.filteredPlayers).toEqual(mockPlayers);
      expect(result.current.filteredPlayers).toHaveLength(3);
    });

    it('空球員列表應該返回空陣列', () => {
      const { result } = renderHook(() => usePlayerSearch([]));

      expect(result.current.filteredPlayers).toEqual([]);
      expect(result.current.filteredPlayers).toHaveLength(0);
    });
  });

  describe('按名稱搜尋', () => {
    it('應該能搜尋完整姓名', () => {
      const { result } = renderHook(() => usePlayerSearch(mockPlayers));

      act(() => {
        result.current.setSearchTerm('陳重任');
      });

      expect(result.current.searchTerm).toBe('陳重任');
      expect(result.current.filteredPlayers).toHaveLength(1);
      expect(result.current.filteredPlayers[0].name).toBe('陳重任');
    });

    it('應該能搜尋部分姓名', () => {
      const { result } = renderHook(() => usePlayerSearch(mockPlayers));

      act(() => {
        result.current.setSearchTerm('林');
      });

      expect(result.current.filteredPlayers).toHaveLength(1);
      expect(result.current.filteredPlayers[0].name).toBe('林坤泰');
    });

    it('應該能搜尋姓氏找到多位球員', () => {
      const playersWithSameSurname: PlayerSummary[] = [
        ...mockPlayers,
        {
          ...mockPlayers[0],
          id: 'COL067',
          name: '陳大明',
          number: '99',
        },
      ];

      const { result } = renderHook(() => usePlayerSearch(playersWithSameSurname));

      act(() => {
        result.current.setSearchTerm('陳');
      });

      expect(result.current.filteredPlayers).toHaveLength(2);
      expect(result.current.filteredPlayers[0].name).toContain('陳');
      expect(result.current.filteredPlayers[1].name).toContain('陳');
    });

    it('搜尋不存在的名稱應該返回空陣列', () => {
      const { result } = renderHook(() => usePlayerSearch(mockPlayers));

      act(() => {
        result.current.setSearchTerm('不存在的球員');
      });

      expect(result.current.filteredPlayers).toHaveLength(0);
    });
  });

  describe('按背號搜尋', () => {
    it('應該能搜尋完整背號', () => {
      const { result } = renderHook(() => usePlayerSearch(mockPlayers));

      act(() => {
        result.current.setSearchTerm('10');
      });

      expect(result.current.filteredPlayers).toHaveLength(1);
      expect(result.current.filteredPlayers[0].number).toBe('10');
    });

    it('應該能搜尋部分背號', () => {
      const { result } = renderHook(() => usePlayerSearch(mockPlayers));

      act(() => {
        result.current.setSearchTerm('1');
      });

      // 應該找到 '1' 和 '10'
      expect(result.current.filteredPlayers.length).toBeGreaterThanOrEqual(1);
      expect(
        result.current.filteredPlayers.some((p) => p.number.includes('1'))
      ).toBe(true);
    });

    it('搜尋不存在的背號應該返回空陣列', () => {
      const { result } = renderHook(() => usePlayerSearch(mockPlayers));

      act(() => {
        result.current.setSearchTerm('999');
      });

      expect(result.current.filteredPlayers).toHaveLength(0);
    });
  });

  describe('混合搜尋（名稱或背號）', () => {
    it('應該能同時搜尋名稱和背號', () => {
      const { result } = renderHook(() => usePlayerSearch(mockPlayers));

      // 搜尋 '0' 應該找到背號 0 的球員
      act(() => {
        result.current.setSearchTerm('0');
      });

      expect(result.current.filteredPlayers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('大小寫處理', () => {
    it('搜尋應該不區分大小寫（英文）', () => {
      const playersWithEnglish: PlayerSummary[] = [
        {
          ...mockPlayers[0],
          id: 'ENG001',
          name: 'John Smith',
        },
        {
          ...mockPlayers[1],
          id: 'ENG002',
          name: 'MARY JOHNSON',
        },
      ];

      const { result } = renderHook(() => usePlayerSearch(playersWithEnglish));

      act(() => {
        result.current.setSearchTerm('john');
      });

      expect(result.current.filteredPlayers).toHaveLength(2);
      expect(
        result.current.filteredPlayers.some((p) => p.name.toLowerCase().includes('john'))
      ).toBe(true);
    });
  });

  describe('清空搜尋', () => {
    it('清空搜尋詞應該返回所有球員', () => {
      const { result } = renderHook(() => usePlayerSearch(mockPlayers));

      // 先搜尋
      act(() => {
        result.current.setSearchTerm('陳');
      });

      expect(result.current.filteredPlayers).toHaveLength(1);

      // 清空搜尋
      act(() => {
        result.current.setSearchTerm('');
      });

      expect(result.current.searchTerm).toBe('');
      expect(result.current.filteredPlayers).toEqual(mockPlayers);
      expect(result.current.filteredPlayers).toHaveLength(3);
    });

    it('只有空白的搜尋詞應該返回所有球員', () => {
      const { result } = renderHook(() => usePlayerSearch(mockPlayers));

      act(() => {
        result.current.setSearchTerm('   ');
      });

      expect(result.current.filteredPlayers).toEqual(mockPlayers);
    });
  });

  describe('防抖功能', () => {
    it('應該使用 useDebounce hook', () => {
      renderHook(() => usePlayerSearch(mockPlayers));

      // 驗證 useDebounce 被調用
      expect(mockUseDebounce).toHaveBeenCalled();
    });

    it('防抖應該延遲 300ms', () => {
      renderHook(() => usePlayerSearch(mockPlayers));

      // 驗證 useDebounce 使用正確的延遲時間
      expect(mockUseDebounce).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ wait: 300 })
      );
    });
  });

  describe('動態更新球員列表', () => {
    it('球員列表改變時應該重新過濾', () => {
      const { result, rerender } = renderHook(
        ({ players }) => usePlayerSearch(players),
        { initialProps: { players: mockPlayers } }
      );

      act(() => {
        result.current.setSearchTerm('陳');
      });

      expect(result.current.filteredPlayers).toHaveLength(1);

      // 更新球員列表
      const newPlayers = mockPlayers.slice(1); // 移除第一個球員（陳重任）

      rerender({ players: newPlayers });

      expect(result.current.filteredPlayers).toHaveLength(0);
    });

    it('搜尋詞不變時，球員列表改變應該更新結果', () => {
      const { result, rerender } = renderHook(
        ({ players }) => usePlayerSearch(players),
        { initialProps: { players: mockPlayers } }
      );

      // 不設定搜尋詞，應該返回所有球員
      expect(result.current.filteredPlayers).toHaveLength(3);

      // 更新球員列表
      const newPlayers = mockPlayers.slice(0, 2);

      rerender({ players: newPlayers });

      expect(result.current.filteredPlayers).toHaveLength(2);
    });
  });

  describe('邊界情況', () => {
    it('應該處理 null 或 undefined 的球員資料', () => {
      const playersWithNull: PlayerSummary[] = [
        mockPlayers[0],
        { ...mockPlayers[1], name: null as any },
        { ...mockPlayers[2], number: undefined as any },
      ];

      const { result } = renderHook(() => usePlayerSearch(playersWithNull));

      act(() => {
        result.current.setSearchTerm('陳');
      });

      // 應該不會崩潰，並返回有效結果
      expect(result.current.filteredPlayers.length).toBeGreaterThanOrEqual(0);
    });

    it('應該處理特殊字元搜尋', () => {
      const { result } = renderHook(() => usePlayerSearch(mockPlayers));

      act(() => {
        result.current.setSearchTerm('()[]{}');
      });

      // 應該不會崩潰
      expect(result.current.filteredPlayers).toHaveLength(0);
    });
  });
});
