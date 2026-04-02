'use client';

import { useState, useEffect } from 'react';
import type { DaySchedule, Game } from '@/src/types';
import { loadPostseasonSchedule } from '@/src/lib/seasonDataLoader';
import { displayGameNumber } from '@/src/lib/formatters';

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  finished:  { label: '已完賽', cls: 'bg-green-900/40 text-green-400 border border-green-700/50' },
  scheduled: { label: '待比賽', cls: 'bg-slate-700/60 text-slate-300 border border-slate-600' },
  rain:      { label: '雨延',   cls: 'bg-amber-900/40 text-amber-400 border border-amber-700/50' },
  cancelled: { label: '取消',   cls: 'bg-red-900/40  text-red-400   border border-red-700/50'  },
};

function GameRow({ game }: { game: Game }) {
  const statusInfo = STATUS_LABEL[game.status ?? 'scheduled'] ?? STATUS_LABEL.scheduled;
  const hasResult = game.result != null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50 transition-colors">
      {/* 時間 */}
      <div className="w-24 shrink-0 text-xs text-slate-400">
        {game.startTime}–{game.endTime}
      </div>

      {/* 隊伍 */}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-slate-200">{game.awayTeam}</span>
        <span className="mx-1.5 text-slate-500 text-xs">VS</span>
        <span className="text-sm text-slate-200">{game.homeTeam}</span>
      </div>

      {/* 比分 */}
      {hasResult && (
        <div className="shrink-0 text-sm font-mono text-amber-300">
          {game.result!.awayScore} – {game.result!.homeScore}
        </div>
      )}

      {/* 狀態 */}
      <span className={`shrink-0 text-xs rounded px-1.5 py-0.5 ${statusInfo.cls}`}>
        {statusInfo.label}
      </span>

      {/* 場次編號 */}
      <div className="shrink-0 text-xs text-slate-500 w-24 text-right">
        {displayGameNumber(game.gameNumber)}
      </div>
    </div>
  );
}

function VenueGroup({ venue, games }: { venue: string; games: Game[] }) {
  return (
    <div>
      <div className="px-4 py-1.5 bg-slate-800/80 text-xs font-medium text-slate-400 border-b border-slate-700">
        {venue}
      </div>
      {games.map((g) => (
        <GameRow key={g.gameNumber} game={g} />
      ))}
    </div>
  );
}

function DateBlock({ day }: { day: DaySchedule }) {
  const date = new Date(day.date + 'T00:00:00');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const label = `${date.getMonth() + 1}/${date.getDate()}（${weekdays[date.getDay()]}）`;

  return (
    <div className="rounded-lg overflow-hidden ring-1 ring-slate-700">
      {/* 日期 header */}
      <div className="px-4 py-2 bg-slate-700/50 text-sm font-semibold text-slate-200">
        {label}
      </div>
      {Object.entries(day.venues).map(([venue, games]) => (
        <VenueGroup key={venue} venue={venue} games={games} />
      ))}
    </div>
  );
}

interface PostseasonScheduleProps {
  year: number;
}

export default function PostseasonSchedule({ year }: PostseasonScheduleProps) {
  const [days, setDays] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadPostseasonSchedule(year)
      .then(setDays)
      .catch(() => setError('無法載入季後賽賽程'))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) {
    return <p className="text-sm text-slate-400 text-center py-6">載入中...</p>;
  }
  if (error) {
    return <p className="text-sm text-red-400 text-center py-6">{error}</p>;
  }
  if (days.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-6">尚無已排定的季後賽賽程</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {days.map((day) => (
        <DateBlock key={day.date} day={day} />
      ))}
    </div>
  );
}
