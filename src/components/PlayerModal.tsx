'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { calculateAVG, calculateOBP, calculateSLG, calculateOPS, calculateOPSPlus } from '@/src/lib/statsCalculator';
import { formatAvg } from '@/src/lib/formatters';
import { loadLeagueStats } from '@/src/lib/dataLoader';
import type { Player, LeagueStats } from '@/src/types';

export interface PlayerModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerModal({ player, isOpen, onClose }: PlayerModalProps) {
  // 聯盟數據 state
  const [leagueStats, setLeagueStats] = useState<Record<number, LeagueStats>>({});

  // 載入聯盟數據
  useEffect(() => {
    if (!isOpen) return;

    const loadAllLeagueStats = async () => {
      const stats: Record<number, LeagueStats> = {};
      for (const season of player.seasons) {
        try {
          const data = await loadLeagueStats(season.year);
          stats[season.year] = data;
        } catch (error) {
          console.error(`Failed to load league stats for ${season.year}:`, error);
        }
      }
      setLeagueStats(stats);
    };

    loadAllLeagueStats();
  }, [isOpen, player.seasons]);

  // ESC 鍵關閉
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 未開啟時不渲染
  if (!isOpen) return null;

  // 點擊遮罩關閉
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      data-testid="modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`player-modal-title-${player.id}`}
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl"
      >
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          aria-label="關閉"
          className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-gray-500 shadow-md transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* 球員基本資訊 */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-6 text-white">
          <div className="flex items-start gap-6">
            <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
              <Image
                src={player.photo || '/default-avatar.png'}
                alt={player.name}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
            <div className="flex-1">
              <h2
                id={`player-modal-title-${player.id}`}
                className="text-3xl font-bold"
              >
                {player.name}
              </h2>
              <p className="mt-1 text-lg opacity-90">編碼：{player.code}</p>

              {/* 生涯資訊 */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm opacity-75">首次登場</div>
                  <div className="text-xl font-semibold">{player.career.debut}</div>
                </div>
                <div>
                  <div className="text-sm opacity-75">總賽季數</div>
                  <div className="text-xl font-semibold">{player.career.totalSeasons}</div>
                </div>
                <div>
                  <div className="text-sm opacity-75">效力球團</div>
                  <div className="text-lg font-semibold">
                    {player.career.teams.join('、')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 賽季統計 */}
        <div className="px-8 py-6">
          <h3 className="mb-4 text-2xl font-bold text-gray-900">賽季統計</h3>

          <div className="space-y-6">
            {player.seasons.map((season) => (
              <div
                key={`${season.year}-${season.team}`}
                className="rounded-lg border border-gray-200 bg-gray-50 p-5"
              >
                {/* 賽季標題 */}
                <div className="mb-4 flex items-center justify-between border-b-2 border-gray-400 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-900">
                      {season.year}
                    </span>
                    <span className="text-lg font-bold text-gray-800">
                      {season.team}
                    </span>
                    <span className="rounded bg-gray-300 px-2 py-1 text-sm font-bold text-gray-800">
                      #{season.number}
                    </span>
                  </div>
                </div>

                {/* 進階數據 */}
                <div className="mb-4 grid grid-cols-5 gap-3 rounded-lg border-2 border-gray-400 bg-blue-50 p-4">
                  <div>
                    <div className="text-xs font-bold uppercase text-gray-900">AVG</div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatAvg(calculateAVG(season.batting))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase text-gray-900">OBP</div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatAvg(calculateOBP(season.batting))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase text-gray-900">SLG</div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatAvg(calculateSLG(season.batting))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase text-gray-900">OPS</div>
                    <div className="text-xl font-bold text-blue-600">
                      {formatAvg(calculateOPS(season.batting))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase text-gray-900">OPS+</div>
                    <div className="text-xl font-bold text-orange-600">
                      {leagueStats[season.year]
                        ? Math.round(calculateOPSPlus(season.batting, leagueStats[season.year]) || 0)
                        : '-'}
                    </div>
                  </div>
                </div>

                {/* 基礎統計數據 */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
                  <div>
                    <div className="text-xs text-gray-500">打席</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {season.batting.pa}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">打數</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {season.batting.ab}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">安打</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {season.batting.hits}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">全壘打</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {season.batting.hr}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">打點</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {season.batting.rbi}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">得分</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {season.batting.runs}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">四死球</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {season.batting.bb}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">三振</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {season.batting.so}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">盜壘</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {season.batting.sb}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">一安</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {season.batting.singles}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">二安</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {season.batting.doubles}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">三安</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {season.batting.triples}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
