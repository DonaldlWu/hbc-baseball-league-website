'use client';

import { useState, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRequest } from 'ahooks';
import { loadSeasonData } from '@/src/lib/seasonDataLoader';
import { displayGameNumber } from '@/src/lib/formatters';
import type { SeasonGame, GameStatusExtended } from '@/src/types';

type GameWithNumber = SeasonGame & { gameNumber: string };

/**
 * 賽季對戰紀錄頁面
 *
 * 顯示指定賽季的所有比賽列表
 */
export default function SeasonGamesPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const resolvedParams = use(params);
  const year = parseInt(resolvedParams.year, 10);

  // 球團篩選狀態
  const [selectedTeam, setSelectedTeam] = useState<string>('全部');

  // 載入賽季資料
  const { data, loading, error } = useRequest(() => loadSeasonData(year), {
    refreshDeps: [year],
  });

  // 將 games Record 轉為陣列
  const allGames = useMemo((): GameWithNumber[] => {
    if (!data) return [];
    return Object.entries(data.games).map(([gameNumber, game]) => ({
      gameNumber,
      ...game,
    }));
  }, [data]);

  // 從比賽資料中提取所有球團名稱
  const allTeams = useMemo(() => {
    if (!allGames.length) return [];

    const teamSet = new Set<string>();
    allGames.forEach((game) => {
      teamSet.add(game.homeTeam);
      teamSet.add(game.awayTeam);
    });

    return ['全部', ...Array.from(teamSet).sort()];
  }, [allGames]);

  // 篩選比賽資料
  const filteredGames = useMemo(() => {
    if (selectedTeam === '全部') return allGames;

    return allGames.filter(
      (game) =>
        game.homeTeam === selectedTeam || game.awayTeam === selectedTeam
    );
  }, [allGames, selectedTeam]);

  // 計算統計
  const stats = useMemo(() => {
    const counts = { finished: 0, scheduled: 0, rain: 0, cancelled: 0 };
    filteredGames.forEach((game) => {
      counts[game.status]++;
    });
    return counts;
  }, [filteredGames]);

  // Loading 狀態
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
              <span className="ml-3 text-gray-600">載入賽季資料中...</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 錯誤狀態
  if (error || !data) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="mt-4 text-lg font-medium text-gray-900">
              無法載入 {year} 賽季資料
            </p>
            <p className="mt-1 text-sm text-gray-500">
              該賽季資料可能尚未公布，請稍後再試
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              返回首頁
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* 標題區 */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {year} 賽季對戰紀錄
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  共 {allGames.length} 場比賽
                </p>
              </div>

              {/* 球團篩選 */}
              <div className="flex items-center gap-3">
                {allTeams.length > 0 && (
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
                )}
              </div>
            </div>

            {/* 統計資訊 */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              {selectedTeam !== '全部' && (
                <span>
                  顯示 {filteredGames.length} 場
                  <span className="text-gray-400">
                    （共 {allGames.length} 場）
                  </span>
                </span>
              )}
              <span className="text-gray-500">
                已完賽: {stats.finished} | 待比賽: {stats.scheduled}
                {stats.rain > 0 && ` | 雨延: ${stats.rain}`}
                {stats.cancelled > 0 && ` | 取消: ${stats.cancelled}`}
              </span>
            </div>
          </div>

          {/* 比賽列表 */}
          {filteredGames.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      場次
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      日期
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      對戰
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      場地
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      狀態
                    </th>
                    <th scope="col" className="relative px-4 py-3">
                      <span className="sr-only">詳情</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredGames.map((game) => (
                    <GameRow
                      key={game.gameNumber}
                      game={game}
                      highlightTeam={
                        selectedTeam !== '全部' ? selectedTeam : undefined
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">
                {selectedTeam} 在本賽季暫無比賽紀錄
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * 單場比賽列
 */
function GameRow({
  game,
  highlightTeam,
}: {
  game: GameWithNumber;
  highlightTeam?: string;
}) {
  const router = useRouter();
  // 狀態顏色
  const statusStyles: Record<
    GameStatusExtended,
    { bg: string; text: string; label: string }
  > = {
    finished: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      label: '已完賽',
    },
    scheduled: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      label: '待比賽',
    },
    rain: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      label: '雨延',
    },
    cancelled: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      label: '取消',
    },
  };

  const statusStyle = statusStyles[game.status];

  // 判斷是否需要高亮球隊
  const isHomeTeamHighlighted = highlightTeam && game.homeTeam === highlightTeam;
  const isAwayTeamHighlighted = highlightTeam && game.awayTeam === highlightTeam;

  // 格式化日期
  const date = new Date(game.date);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const dateStr = `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`;

  // 只有已完賽且有戰報的比賽可以點擊查看
  const isClickable = game.status === 'finished' && !!game.sheetId;

  const rowContent = (
    <>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
        {displayGameNumber(game.gameNumber)}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
        {dateStr}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm">
        <span
          className={`font-medium ${
            isHomeTeamHighlighted ? 'text-primary-600' : 'text-gray-900'
          }`}
        >
          {game.homeTeam}
        </span>
        <span className="mx-2 text-gray-400">vs</span>
        <span
          className={`font-medium ${
            isAwayTeamHighlighted ? 'text-primary-600' : 'text-gray-900'
          }`}
        >
          {game.awayTeam}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
        {game.venue}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
        >
          {statusStyle.label}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-right text-sm">
        {isClickable && (
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
        )}
      </td>
    </>
  );

  if (isClickable) {
    return (
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => router.push(`/games/${encodeURIComponent(game.gameNumber)}`)}
      >
        {rowContent}
      </tr>
    );
  }

  return <tr className="hover:bg-gray-50">{rowContent}</tr>;
}
