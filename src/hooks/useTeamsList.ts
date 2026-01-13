import { useState, useEffect } from 'react';
import { getAvailableYears, loadSeasonSummary, extractTeamsFromSeason, getTeamIcons } from '@/src/lib/dataLoader';
import type { TeamSummary } from '@/src/types';

export interface UseTeamsListReturn {
  year: number;
  teams: TeamSummary[];
  availableYears: number[];
  loading: boolean;
  error: Error | null;
  setYear: (year: number) => void;
}

/**
 * useTeamsList Hook
 * 管理球隊列表的狀態和載入邏輯
 *
 * @param initialYear 初始年份（預設為當前年份）
 * @returns 球隊列表狀態和操作函數
 *
 * @example
 * ```tsx
 * const { year, teams, availableYears, loading, error, setYear } = useTeamsList();
 *
 * if (loading) return <div>載入中...</div>;
 * if (error) return <div>錯誤：{error.message}</div>;
 *
 * return (
 *   <div>
 *     <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
 *       {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
 *     </select>
 *     {teams.map(team => <TeamCard key={team.teamId} team={team} />)}
 *   </div>
 * );
 * ```
 */
export function useTeamsList(initialYear?: number): UseTeamsListReturn {
  const [year, setYearState] = useState(initialYear || 2025);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 載入可用年份（只在初始化時載入一次）
  useEffect(() => {
    let mounted = true;

    async function loadYears() {
      try {
        const years = await getAvailableYears();
        if (mounted) {
          setAvailableYears(years);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    loadYears();

    return () => {
      mounted = false;
    };
  }, []);

  // 載入該年度的球隊列表
  useEffect(() => {
    let mounted = true;

    async function loadTeams() {
      setLoading(true);
      setError(null);

      try {
        const summary = await loadSeasonSummary(year);
        const teamsList = extractTeamsFromSeason(summary);

        // 載入球隊圖標
        const teamNames = teamsList.map(t => t.teamName);
        const iconMap = await getTeamIcons(teamNames);

        // 將圖標資訊整合到球隊列表
        const teamsWithIcons = teamsList.map(team => ({
          ...team,
          iconUrl: iconMap.get(team.teamName),
        }));

        if (mounted) {
          setTeams(teamsWithIcons);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setTeams([]);
          setLoading(false);
        }
      }
    }

    loadTeams();

    return () => {
      mounted = false;
    };
  }, [year]);

  // 切換年份
  const setYear = (newYear: number) => {
    setYearState(newYear);
  };

  return {
    year,
    teams,
    availableYears,
    loading,
    error,
    setYear,
  };
}
