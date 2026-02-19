import { useState, useEffect, useCallback } from 'react';
import { loadSeasonSummary } from '@/src/lib/dataLoader';
import { sortPlayers } from '@/src/lib/playerSorter';
import type { PlayerSummary, SortableStatField, SortOrder } from '@/src/types';

interface UsePlayerListResult {
  players: PlayerSummary[];
  loading: boolean;
  error: string | null;
  currentSort: { field: SortableStatField; order: SortOrder } | null;
  sortBy: (field: SortableStatField, order: SortOrder) => void;
  refresh: () => void;
}

export function usePlayerList(
  year: number,
  teamId?: string
): UsePlayerListResult {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentSort, setCurrentSort] = useState<{ field: SortableStatField; order: SortOrder } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPlayers() {
      try {
        setLoading(true);
        setError(null);

        const seasonData = await loadSeasonSummary(year);

        if (cancelled) return;

        if (teamId) {
          const teamData = seasonData.teams[teamId];
          if (teamData) {
            setPlayers(teamData.players);
          } else {
            setPlayers([]);
          }
        } else {
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

  const sortBy = useCallback(
    (field: SortableStatField, order: SortOrder) => {
      setCurrentSort({ field, order });
      setPlayers((prev) => sortPlayers(prev, field, order));
    },
    []
  );

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return {
    players,
    loading,
    error,
    currentSort,
    sortBy,
    refresh,
  };
}
