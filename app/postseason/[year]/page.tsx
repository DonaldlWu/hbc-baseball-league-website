"use client";

import { use, useState } from 'react';
import { usePostseason } from '@/src/hooks/usePostseason';
import PostseasonBracket from '@/src/components/PostseasonBracket';
import DoubleEliminationBracket from '@/src/components/DoubleEliminationBracket';
import { getPhase1Rounds, getPhase2Rounds, getChampion } from '@/src/lib/postseasonLoader';

type ActiveTab = 'phase1' | 'phase2';

function RoundLabels() {
  return (
    <div className="flex items-center mb-4 text-xs font-medium uppercase tracking-wider">
      <div className="text-slate-500" style={{ width: '176px' }}>16強</div>
      <div style={{ width: '48px' }} />
      <div className="text-slate-500" style={{ width: '176px' }}>8強</div>
      <div style={{ width: '48px' }} />
      <div className="text-amber-500">四強</div>
    </div>
  );
}

export default function PostseasonPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = use(params);
  const yearNum = parseInt(year, 10);
  const { data, loading, error } = usePostseason(yearNum);
  const [activeTab, setActiveTab] = useState<ActiveTab>('phase1');

  const champion = data ? getChampion(data) : null;
  const phase1Rounds = data ? getPhase1Rounds(data) : [];
  const phase2Rounds = data ? getPhase2Rounds(data) : [];

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

          {/* Tab navigation */}
          <div className="bg-slate-900 border-b border-slate-700 px-6">
            <nav className="-mb-px flex gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('phase1')}
                className={
                  activeTab === 'phase1'
                    ? 'border-b-2 border-amber-500 py-4 text-sm font-medium text-amber-400'
                    : 'border-b-2 border-transparent py-4 text-sm font-medium text-slate-400 hover:border-slate-600 hover:text-slate-300'
                }
              >
                淘汰賽（16強 / 8強）
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('phase2')}
                className={
                  activeTab === 'phase2'
                    ? 'border-b-2 border-amber-500 py-4 text-sm font-medium text-amber-400'
                    : 'border-b-2 border-transparent py-4 text-sm font-medium text-slate-400 hover:border-slate-600 hover:text-slate-300'
                }
              >
                四強雙敗淘汰
              </button>
            </nav>
          </div>

          {/* Bracket content */}
          <div className="bg-slate-950 p-6 overflow-x-auto">
            {loading && (
              <p className="text-sm text-slate-400 text-center py-8">載入中...</p>
            )}
            {error && (
              <p className="text-sm text-red-400 text-center py-8">{error}</p>
            )}
            {data && !loading && (
              <>
                {activeTab === 'phase1' && (
                  <>
                    <RoundLabels />
                    <PostseasonBracket rounds={phase1Rounds} />
                  </>
                )}
                {activeTab === 'phase2' && (
                  <DoubleEliminationBracket rounds={phase2Rounds} />
                )}
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
