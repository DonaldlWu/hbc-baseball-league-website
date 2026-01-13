'use client';

import { useRouter } from 'next/navigation';
import { useTeamsList } from '@/src/hooks/useTeamsList';
import { TeamCard } from '@/src/components/TeamCard';
import type { TeamSummary } from '@/src/types';

export default function TeamsPage() {
  const router = useRouter();
  const { year, teams, availableYears, loading, error, setYear } = useTeamsList(2025);

  if (loading && teams.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-red-800 font-semibold">載入失敗</p>
            <p className="mt-2 text-red-600">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleTeamClick = (team: TeamSummary) => {
    // 帶上當前選擇的年份
    router.push(`/teams/${team.teamId}?year=${year}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* 標題與年份選擇器 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">球團列表</h1>

          {/* 年份選擇器 */}
          {availableYears.length > 0 && (
            <div className="flex items-center gap-4">
              <label htmlFor="year-select" className="text-lg font-medium text-gray-700">
                選擇年份：
              </label>
              <select
                id="year-select"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-lg font-medium text-gray-900 shadow-sm transition-colors hover:border-primary-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y} 年
                  </option>
                ))}
              </select>
              <span className="text-gray-600">
                共 {teams.length} 個球團
              </span>
            </div>
          )}
        </div>

        {/* 球團列表 */}
        {teams.length === 0 ? (
          <div className="rounded-lg bg-white border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">此年度沒有球團資料</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <TeamCard
                key={team.teamId}
                team={team}
                onClick={handleTeamClick}
              />
            ))}
          </div>
        )}

        {/* Loading 覆蓋層（切換年份時） */}
        {loading && teams.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="rounded-lg bg-white p-8 shadow-xl">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">載入中...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
