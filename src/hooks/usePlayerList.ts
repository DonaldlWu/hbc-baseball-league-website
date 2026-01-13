import { useState, useEffect, useCallback } from 'react';
import { loadSeasonSummary } from '@/src/lib/dataLoader';
import type { PlayerSummary } from '@/src/types';

type SortOrder = 'asc' | 'desc';

interface UsePlayerListResult {
  players: PlayerSummary[];
  loading: boolean;
  error: string | null;
  sortBy: (field: keyof PlayerSummary['seasonStats'], order: SortOrder) => void;
  refresh: () => void;
}

/**
 * 球員列表 Hook
 *
 * @param year - 賽季年份
 * @param teamId - 可選的球團 ID，用於篩選特定球團的球員
 * @returns 球員列表、載入狀態、錯誤訊息、排序函數和重新整理函數
 */
export function usePlayerList(
  year: number,
  teamId?: string
): UsePlayerListResult {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 載入球員資料
  useEffect(() => {
    let cancelled = false;

    async function fetchPlayers() {
      try {
        setLoading(true);
        setError(null);

        const seasonData = await loadSeasonSummary(year);

        if (cancelled) return;

        // 如果指定了 teamId，只返回該球團的球員
        if (teamId) {
          const teamData = seasonData.teams[teamId];
          if (teamData) {
            setPlayers(teamData.players);
          } else {
            setPlayers([]);
          }
        } else {
          // 返回所有球團的球員
          const allPlayers = Object.values(seasonData.teams).flatMap(
            (team) => team.players
          );
          setPlayers(allPlayers);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setPlayers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPlayers();

    return () => {
      cancelled = true;
    };
  }, [year, teamId, refreshTrigger]);

  // 排序功能
  const sortBy = useCallback(
    (field: keyof PlayerSummary['seasonStats'], order: SortOrder) => {
      setPlayers((prevPlayers) => {
        const sorted = [...prevPlayers].sort((a, b) => {
          const aValue = a.seasonStats[field] as number;
          const bValue = b.seasonStats[field] as number;

          if (order === 'asc') {
            return aValue - bValue;
          } else {
            return bValue - aValue;
          }
        });

        return sorted;
      });
    },
    []
  );

  // 重新整理功能
  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return {
    players,
    loading,
    error,
    sortBy,
    refresh,
  };
}
