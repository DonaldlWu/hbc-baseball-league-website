import { useState } from "react";
import { formatAvg } from "@/src/lib/formatters";
import type { TeamSummary } from "@/src/types";

interface TeamCardProps {
  team: TeamSummary;
  onClick?: (team: TeamSummary) => void;
}

/**
 * TeamCard 組件
 *
 * 顯示球隊摘要資訊的卡片組件，包含球隊名稱和主要統計數據。
 *
 * @param team - 球隊摘要資料
 * @param onClick - 點擊卡片時的回調函數（可選）
 *
 * @example
 * ```tsx
 * <TeamCard
 *   team={teamData}
 *   onClick={(team) => router.push(`/teams/${team.teamId}`)}
 * />
 * ```
 */
export function TeamCard({ team, onClick }: TeamCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      onClick={() => onClick?.(team)}
      className="w-full rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition-all hover:shadow-md hover:border-primary-500"
    >
      {/* 球隊名稱與圖標 */}
      <div className="mb-4 flex items-center gap-3">
        {team.iconUrl && !imageError ? (
          <img
            src={`/${team.iconUrl}`}
            alt={`${team.teamName} 圖標`}
            className="h-12 w-12 object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-400">
              {team.teamName.substring(0, 1)}
            </span>
          </div>
        )}
        <h3 className="text-2xl font-bold text-gray-900">{team.teamName}</h3>
      </div>

      {/* 統計數據 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-gray-500">球員數</div>
          <div className="text-2xl font-bold text-gray-900">
            {team.playerCount}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">隊平均</div>
          <div
            className={`text-2xl font-bold ${
              team.stats.avgBattingAvg > 0.25 ? "text-red-500" : "text-black"
            }`}
          >
            {formatAvg(team.stats.avgBattingAvg)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">全壘打</div>
          <div className="text-2xl font-bold text-gray-900">
            {team.stats.totalHomeRuns}
          </div>
        </div>
      </div>

      {/* 查看詳情提示 */}
      <div className="mt-4 text-sm text-primary-600 font-medium">
        查看球隊詳情 →
      </div>
    </button>
  );
}
