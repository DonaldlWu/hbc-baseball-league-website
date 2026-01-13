import { useState, useMemo } from 'react';
import { useDebounce } from 'ahooks';
import type { PlayerSummary } from '@/src/types';

interface UsePlayerSearchResult {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredPlayers: PlayerSummary[];
}

/**
 * 球員搜尋 Hook
 *
 * 提供球員搜尋功能，支援按名稱或背號搜尋，並使用防抖優化效能。
 *
 * @param players - 球員列表
 * @returns 搜尋詞、設定搜尋詞函數和過濾後的球員列表
 *
 * @example
 * ```tsx
 * const { searchTerm, setSearchTerm, filteredPlayers } = usePlayerSearch(players);
 *
 * <input
 *   value={searchTerm}
 *   onChange={(e) => setSearchTerm(e.target.value)}
 *   placeholder="搜尋球員姓名或背號..."
 * />
 *
 * {filteredPlayers.map(player => (
 *   <PlayerCard key={player.id} player={player} />
 * ))}
 * ```
 */
export function usePlayerSearch(players: PlayerSummary[]): UsePlayerSearchResult {
  const [searchTerm, setSearchTerm] = useState('');

  // 防抖處理，避免每次輸入都觸發過濾
  const debouncedSearchTerm = useDebounce(searchTerm, { wait: 300 });

  // 使用 useMemo 優化過濾邏輯，只在依賴改變時重新計算
  const filteredPlayers = useMemo(() => {
    // 如果搜尋詞為空或只有空白，返回所有球員
    const trimmedSearch = debouncedSearchTerm.trim();
    if (!trimmedSearch) {
      return players;
    }

    // 轉換為小寫以進行不區分大小寫的搜尋
    const searchLower = trimmedSearch.toLowerCase();

    // 過濾球員：搜尋名稱或背號
    return players.filter((player) => {
      // 安全處理 null 或 undefined 的情況
      const name = player.name?.toLowerCase() || '';
      const number = player.number?.toString() || '';

      // 檢查名稱或背號是否包含搜尋詞
      return name.includes(searchLower) || number.includes(searchLower);
    });
  }, [players, debouncedSearchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredPlayers,
  };
}
