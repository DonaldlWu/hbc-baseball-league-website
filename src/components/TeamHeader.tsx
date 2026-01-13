import { useState } from "react";
import { formatAvg } from "@/src/lib/formatters";
import type { TeamSummary } from "@/src/types";

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
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-8 text-gray-700 shadow-lg">
      <div className="mx-auto max-w-7xl">
        {/* 球團名稱、圖標與年份 */}
        <div className="mb-6 flex items-center gap-4">
          {team.iconUrl && !imageError ? (
            <img
              src={`/${team.iconUrl}`}
              alt={`${team.teamName} 圖標`}
              className="h-20 w-20 object-contain bg-white bg-opacity-20 rounded-lg p-2 backdrop-blur-sm"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="h-20 w-20 rounded-lg bg-black bg-opacity-30 flex items-center justify-center border border-white border-opacity-30">
              <span className="text-3xl font-bold text-gray-700 drop-shadow-lg">
                {team.teamName.substring(0, 1)}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold mb-2 text-gray-700 drop-shadow-md">
              {team.teamName}
            </h1>
            <p className="text-xl text-gray-700 font-medium">
              {team.year} 賽季
            </p>
          </div>
        </div>

        {/* 統計資訊 */}
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-lg bg-black bg-opacity-20 p-4 backdrop-blur-sm border border-white border-opacity-30">
            <div className="text-sm text-gray-700 font-medium">球員數</div>
            <div className="text-3xl font-bold text-white drop-shadow-lg">
              {team.playerCount}
            </div>
          </div>
          <div className="rounded-lg bg-black bg-opacity-20 p-4 backdrop-blur-sm border border-white border-opacity-30">
            <div className="text-sm text-white font-medium">隊平均</div>
            <div
              className={`text-3xl font-bold drop-shadow-lg ${
                team.stats.avgBattingAvg > 0.25 ? "text-red-500" : "text-white"
              }`}
            >
              {formatAvg(team.stats.avgBattingAvg)}
            </div>
          </div>
          <div className="rounded-lg bg-black bg-opacity-20 p-4 backdrop-blur-sm border border-white border-opacity-30">
            <div className="text-sm text-white font-medium">全壘打</div>
            <div className="text-3xl font-bold text-white drop-shadow-lg">
              {team.stats.totalHomeRuns}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
