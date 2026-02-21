"use client";

import { use } from 'react';
import { usePostseason } from '@/src/hooks/usePostseason';
import FullPostseasonBracket from '@/src/components/FullPostseasonBracket';
import { getChampion } from '@/src/lib/postseasonLoader';

export default function PostseasonPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = use(params);
  const yearNum = parseInt(year, 10);
  const { data, loading, error } = usePostseason(yearNum);

  const champion = data ? getChampion(data) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="rounded-lg overflow-hidden shadow-xl border border-slate-700">

          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {yearNum} 賽季季後賽
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                16 隊晉級・三戰二勝 + 四強雙敗淘汰制
              </p>
            </div>
            {champion && (
              <div className="flex items-center gap-2 bg-amber-900/30 border border-amber-500/40 rounded-lg px-4 py-2">
                <div>
                  <div className="text-xs text-amber-400 font-medium">年度冠軍</div>
                  <div className="text-sm font-bold text-amber-300">
                    {champion.teamName}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bracket content */}
          <div className="bg-slate-950 overflow-x-auto">
            {loading && (
              <p className="text-sm text-slate-400 text-center py-8">載入中...</p>
            )}
            {error && (
              <p className="text-sm text-red-400 text-center py-8">{error}</p>
            )}
            {data && !loading && (
              <div className="p-6 min-w-max">
                <FullPostseasonBracket data={data} />
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
