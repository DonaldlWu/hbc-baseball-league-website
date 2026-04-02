'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSchedule } from '@/src/hooks/useSchedule';
import { displayGameNumber, parseGameNumber } from '@/src/lib/formatters';
import { VENUE_MAP_URLS } from '@/src/lib/venueData';
import { AddToCalendarButton } from '@/src/components/AddToCalendarButton';
import type { Game, DaySchedule } from '@/src/types';

/**
 * ScheduleCalendar 組件
 *
 * 顯示月賽程表，支援月份切換和球團篩選
 *
 * @example
 * ```tsx
 * <ScheduleCalendar />
 * ```
 */
export function ScheduleCalendar() {
  const {
    data,
    loading,
    error,
    currentYear,
    currentMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
  } = useSchedule();

  // 篩選狀態
  const [selectedTeam, setSelectedTeam] = useState<string>('全部');
  const [selectedSeason, setSelectedSeason] = useState<string>('全部');

  // 從賽程資料中提取所有球團名稱
  const allTeams = useMemo(() => {
    if (!data || !data.length) return [];

    const teamSet = new Set<string>();
    data.forEach((day) => {
      Object.values(day.venues).forEach((games) => {
        games.forEach((game) => {
          teamSet.add(game.homeTeam);
          teamSet.add(game.awayTeam);
        });
      });
    });

    return ['全部', ...Array.from(teamSet).sort()];
  }, [data]);

  // 從 ParsedGameNumber 取得賽季複合 key（正規賽 "2025"，季後賽 "2025postseason"）
  function getSeasonKey(parsed: { season: number; isPostseason?: boolean }): string {
    return parsed.isPostseason ? `${parsed.season}postseason` : String(parsed.season);
  }

  // 從賽季複合 key 產生顯示標籤
  function formatSeasonLabel(key: string): string {
    if (key === '全部') return '全部賽季';
    if (key.endsWith('postseason')) return `${key.replace('postseason', '')} 季後賽`;
    return `${key} 賽季`;
  }

  // 從賽程資料中提取所有賽季
  const availableSeasons = useMemo(() => {
    if (!data || !data.length) return [];

    const seasonSet = new Set<string>();
    data.forEach((day) => {
      Object.values(day.venues).forEach((games) => {
        games.forEach((game) => {
          const parsed = parseGameNumber(game.gameNumber);
          if (parsed) {
            seasonSet.add(getSeasonKey(parsed));
          }
        });
      });
    });

    return [
      '全部',
      ...Array.from(seasonSet).sort((a, b) => {
        const yearA = parseInt(a);
        const yearB = parseInt(b);
        if (yearA !== yearB) return yearB - yearA;
        // 同年：季後賽排在正規賽前面（時間較晚）
        return a.endsWith('postseason') ? -1 : b.endsWith('postseason') ? 1 : 0;
      }),
    ];
  }, [data]);

  // 計算各賽季比賽數量
  const seasonCounts = useMemo(() => {
    if (!data || !data.length) return new Map<string, number>();

    const counts = new Map<string, number>();
    data.forEach((day) => {
      Object.values(day.venues).forEach((games) => {
        games.forEach((game) => {
          const parsed = parseGameNumber(game.gameNumber);
          if (parsed) {
            const key = getSeasonKey(parsed);
            counts.set(key, (counts.get(key) || 0) + 1);
          }
        });
      });
    });

    return counts;
  }, [data]);

  // 計算總比賽數與場地列表
  const { totalGames, venues } = useMemo(() => {
    if (!data || !data.length) return { totalGames: 0, venues: [] };

    const venueSet = new Set<string>();
    let count = 0;
    data.forEach((day) => {
      Object.entries(day.venues).forEach(([venueName, games]) => {
        venueSet.add(venueName);
        count += games.length;
      });
    });

    return { totalGames: count, venues: Array.from(venueSet).sort() };
  }, [data]);

  // 篩選賽程資料（同時支援球團和賽季篩選）
  const filteredDays = useMemo(() => {
    if (!data) return [];

    // 如果兩個篩選都是「全部」，直接返回所有資料
    if (selectedTeam === '全部' && selectedSeason === '全部') {
      return data;
    }

    return data
      .map((day) => {
        const filteredVenues: DaySchedule['venues'] = {};

        Object.entries(day.venues).forEach(([venueName, games]) => {
          const filteredGames = games.filter((game) => {
            // 球團篩選條件
            const teamMatch =
              selectedTeam === '全部' ||
              game.homeTeam === selectedTeam ||
              game.awayTeam === selectedTeam;

            // 賽季篩選條件
            let seasonMatch = selectedSeason === '全部';
            if (!seasonMatch) {
              const parsed = parseGameNumber(game.gameNumber);
              seasonMatch = parsed !== null && getSeasonKey(parsed) === selectedSeason;
            }

            return teamMatch && seasonMatch;
          });

          if (filteredGames.length > 0) {
            filteredVenues[venueName] = filteredGames;
          }
        });

        return {
          ...day,
          venues: filteredVenues,
        };
      })
      .filter((day) => Object.keys(day.venues).length > 0);
  }, [data, selectedTeam, selectedSeason]);

  // 計算篩選後的比賽數量
  const filteredGamesCount = useMemo(() => {
    return filteredDays.reduce((total, day) => {
      return (
        total +
        Object.values(day.venues).reduce(
          (sum, games) => sum + games.length,
          0
        )
      );
    }, 0);
  }, [filteredDays]);

  // Loading 狀態
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
          <span className="ml-3 text-gray-600">載入賽程中...</span>
        </div>
      </div>
    );
  }

  // 錯誤狀態或無資料 - 統一顯示「尚待安排」
  if (error || !data || !data.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* 標題與導航 */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentYear} 年 {currentMonth} 月賽程
            </h2>
            <div className="flex items-center gap-2">
              {/* 回到今天 */}
              <button
                onClick={goToToday}
                className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                今天
              </button>
              {/* 上個月 */}
              <button
                onClick={goToPreviousMonth}
                className="rounded-md bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
                aria-label="上個月"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              {/* 下個月 */}
              <button
                onClick={goToNextMonth}
                className="rounded-md bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
                aria-label="下個月"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 尚待安排訊息 */}
        <div className="p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-900">賽程尚待安排</p>
          <p className="mt-1 text-sm text-gray-500">
            {currentYear} 年 {currentMonth} 月的賽程資料尚未公布
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* 標題與導航 */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 左側：標題 */}
          <h2 className="text-2xl font-bold text-gray-900">
            {currentYear} 年 {currentMonth} 月賽程
          </h2>

          {/* 右側：篩選與導航 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 賽季篩選 */}
            {availableSeasons.length > 1 && (
              <div className="relative">
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 pr-8 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {availableSeasons.map((season) => (
                    <option key={season} value={season}>
                      {formatSeasonLabel(season)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 球團篩選 */}
            {allTeams.length > 0 && (
              <div className="relative">
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 pr-8 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {allTeams.map((team) => (
                    <option key={team} value={team}>
                      {team === '全部' ? '全部球團' : team}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 回到今天 */}
            <button
              onClick={goToToday}
              className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              今天
            </button>
            {/* 上個月 */}
            <button
              onClick={goToPreviousMonth}
              className="rounded-md bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
              aria-label="上個月"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            {/* 下個月 */}
            <button
              onClick={goToNextMonth}
              className="rounded-md bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
              aria-label="下個月"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
        {/* 統計資訊 */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          <span>
            {selectedTeam === '全部' && selectedSeason === '全部' ? (
              <>共 {totalGames} 場比賽</>
            ) : (
              <>
                顯示 {filteredGamesCount} 場比賽
                <span className="text-gray-400">
                  （共 {totalGames} 場）
                </span>
              </>
            )}
          </span>
          {/* 顯示賽季分布（只在有多賽季且選擇「全部」時顯示） */}
          {selectedSeason === '全部' && seasonCounts.size > 1 && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">
                {Array.from(seasonCounts.entries())
                  .sort((a, b) => Number(b[0]) - Number(a[0]))
                  .map(([season, count]) => `${season}賽季: ${count}場`)
                  .join(', ')}
              </span>
            </>
          )}
          <span className="text-gray-400">•</span>
          <span>{venues.join('、')}</span>
        </div>
      </div>

      {/* 賽程列表 */}
      {filteredDays.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {filteredDays.map((day) => (
            <DayScheduleCard
              key={day.date}
              daySchedule={day}
              highlightTeam={selectedTeam !== '全部' ? selectedTeam : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center">
          <p className="text-gray-500">
            {selectedTeam} 在本月暫無賽程
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 單日賽程卡片
 */
function DayScheduleCard({
  daySchedule,
  highlightTeam
}: {
  daySchedule: DaySchedule;
  highlightTeam?: string;
}) {
  // 格式化日期顯示
  const date = new Date(daySchedule.date);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekday = weekdays[date.getDay()];
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

  // 檢查是否有比賽
  const hasGames = Object.keys(daySchedule.venues).length > 0;

  return (
    <div className="p-6">
      {/* 日期標題 */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{dateStr}</span>
          <span className="text-lg text-gray-600">週{weekday}</span>
        </div>
        {/* 當日備註 */}
        {daySchedule.note && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            {daySchedule.note}
          </span>
        )}
      </div>

      {/* 無比賽時顯示備註 */}
      {!hasGames && daySchedule.note && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-amber-700">{daySchedule.note}</p>
        </div>
      )}

      {/* 按場地分組 */}
      <div className="space-y-6">
        {Object.entries(daySchedule.venues).map(([venueName, games]) => (
          <div key={venueName}>
            {/* 場地名稱 */}
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900">
                {venueName}
              </h4>
              {VENUE_MAP_URLS[venueName] && (
                <a
                  href={VENUE_MAP_URLS[venueName]}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="在 Google Maps 開啟"
                  className="text-primary-500 hover:text-primary-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
              <span className="text-sm text-gray-500">
                ({games.length} 場)
              </span>
            </div>

            {/* 比賽列表 */}
            <div className="space-y-2">
              {games.map((game) => (
                <GameCard
                  key={game.gameNumber}
                  game={game}
                  highlightTeam={highlightTeam}
                  date={daySchedule.date}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 比賽狀態顯示設定
const STATUS_CONFIG = {
  finished: {
    label: '已完賽',
    className: 'bg-green-100 border-green-300 text-green-700',
  },
  rain: {
    label: '雨延',
    className: 'bg-blue-100 border-blue-300 text-blue-700',
  },
  cancelled: {
    label: '取消',
    className: 'bg-red-100 border-red-300 text-red-700',
  },
  scheduled: null, // 已排程不顯示標籤
} as const;

/**
 * 單場比賽卡片
 */
function GameCard({ game, highlightTeam, date }: { game: Game; highlightTeam?: string; date?: string }) {
  // 時段顏色
  const timeSlotColors = {
    上午: 'bg-amber-50 border-amber-200 text-amber-700',
    中午: 'bg-orange-50 border-orange-200 text-orange-700',
    下午: 'bg-red-50 border-red-200 text-red-700',
  };

  // 判斷是否需要高亮球隊
  const isHomeTeamHighlighted = highlightTeam && game.homeTeam === highlightTeam;
  const isAwayTeamHighlighted = highlightTeam && game.awayTeam === highlightTeam;

  // 取得比賽狀態設定
  const statusConfig = game.status && game.status !== 'scheduled'
    ? STATUS_CONFIG[game.status] ?? null
    : null;

  return (
    <Link
      href={`/games/${encodeURIComponent(game.gameNumber)}`}
      className="block rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary-300 hover:shadow-md cursor-pointer"
    >
      <div className="flex items-center justify-between">
        {/* 左側：球隊資訊 */}
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">
              {displayGameNumber(game.gameNumber)}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${timeSlotColors[game.timeSlot]}`}
            >
              {game.timeSlot}
            </span>
            {/* 比賽狀態標籤 */}
            {statusConfig && (
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusConfig.className}`}
              >
                {statusConfig.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`${
                isAwayTeamHighlighted
                  ? 'font-bold text-primary-700'
                  : 'font-medium text-gray-700'
              }`}
            >
              {game.awayTeam}
            </span>
            {game.result ? (
              <>
                <span
                  className={`font-bold ${
                    game.result.awayScore > game.result.homeScore
                      ? 'text-green-600'
                      : game.result.awayScore < game.result.homeScore
                        ? 'text-red-500'
                        : 'text-gray-900'
                  }`}
                >
                  {game.result.awayScore}
                </span>
                <span className="font-medium text-gray-400">:</span>
                <span
                  className={`font-bold ${
                    game.result.homeScore > game.result.awayScore
                      ? 'text-green-600'
                      : game.result.homeScore < game.result.awayScore
                        ? 'text-red-500'
                        : 'text-gray-900'
                  }`}
                >
                  {game.result.homeScore}
                </span>
              </>
            ) : (
              <span className="text-gray-500">VS</span>
            )}
            <span
              className={`${
                isHomeTeamHighlighted
                  ? 'font-bold text-primary-700'
                  : 'font-medium text-gray-700'
              }`}
            >
              {game.homeTeam}
            </span>
          </div>
        </div>

        {/* 右側：時間、行事曆按鈕與箭頭 */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {game.startTime} - {game.endTime}
            </div>
          </div>
          {date && <AddToCalendarButton game={game} date={date} />}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
      {/* 比賽備註 */}
      {game.note && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{game.note}</span>
        </div>
      )}
    </Link>
  );
}
