import Image from 'next/image';
import { formatAvg } from '@/src/lib/formatters';
import type { PlayerSummary } from '@/src/types';

interface PlayerCardProps {
  player: PlayerSummary;
  onClick?: (player: PlayerSummary) => void;
}

/**
 * PlayerCard 組件
 *
 * 顯示球員摘要資訊的卡片組件，包含照片、姓名、背號和主要統計數據。
 *
 * @param player - 球員摘要資料
 * @param onClick - 點擊卡片時的回調函數（可選）
 *
 * @example
 * ```tsx
 * <PlayerCard
 *   player={playerData}
 *   onClick={(player) => openModal(player.id)}
 * />
 * ```
 */
export function PlayerCard({ player, onClick }: PlayerCardProps) {
  return (
    <button
      onClick={() => onClick?.(player)}
      className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md hover:border-primary-500"
    >
      <div className="flex items-start gap-3">
        {/* 球員照片 */}
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
          <Image
            src={player.photo || '/default-avatar.png'}
            alt={player.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>

        {/* 球員資訊 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {player.name}
            </h3>
            <span className="text-sm text-gray-500">#{player.number}</span>
          </div>

          {/* 統計數據 - 第一行：打擊三圍 */}
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs text-gray-500">AVG</div>
              <div className="font-semibold text-gray-900">
                {formatAvg(player.seasonStats.avg)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">OBP</div>
              <div className="font-semibold text-gray-900">
                {formatAvg(player.seasonStats.obp)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">SLG</div>
              <div className="font-semibold text-gray-900">
                {formatAvg(player.seasonStats.slg)}
              </div>
            </div>
          </div>

          {/* 統計數據 - 第二行：進階數據 + 基礎數據 */}
          <div className="mt-1 grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs text-gray-500">OPS</div>
              <div className="font-semibold text-primary-600">
                {formatAvg(player.seasonStats.ops)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">HR</div>
              <div className="font-semibold text-gray-900">
                {player.seasonStats.hr}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">RBI</div>
              <div className="font-semibold text-gray-900">
                {player.seasonStats.rbi}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-primary-600 font-medium">
        查看詳細資料 →
      </div>
    </button>
  );
}
