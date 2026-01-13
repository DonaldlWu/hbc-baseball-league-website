import { formatAvg } from '@/src/lib/formatters';
import type { TeamSummary } from '@/src/types';

interface TeamHeaderProps {
  team: TeamSummary;
}

/**
 * TeamHeader 組件
 *
 * 顯示球團詳細頁面的標題區塊，包含球團名稱、年份和統計資訊。
 *
 * @param team - 球團摘要資料
 *
 * @example
 * ```tsx
 * <TeamHeader team={teamData} />
 * ```
 */
export function TeamHeader({ team }: TeamHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-8 text-white shadow-lg">
      <div className="mx-auto max-w-7xl">
        {/* 球團名稱與年份 */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">{team.teamName}</h1>
          <p className="text-xl opacity-90">{team.year} 賽季</p>
        </div>

        {/* 統計資訊 */}
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-lg bg-white bg-opacity-20 p-4 backdrop-blur-sm">
            <div className="text-sm opacity-75">球員數</div>
            <div className="text-3xl font-bold">{team.playerCount}</div>
          </div>
          <div className="rounded-lg bg-white bg-opacity-20 p-4 backdrop-blur-sm">
            <div className="text-sm opacity-75">隊平均</div>
            <div className="text-3xl font-bold">
              {formatAvg(team.stats.avgBattingAvg)}
            </div>
          </div>
          <div className="rounded-lg bg-white bg-opacity-20 p-4 backdrop-blur-sm">
            <div className="text-sm opacity-75">全壘打</div>
            <div className="text-3xl font-bold">{team.stats.totalHomeRuns}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
