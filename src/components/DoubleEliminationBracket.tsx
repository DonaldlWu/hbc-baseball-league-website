'use client';

import type { PostseasonRound } from '@/src/types';
import MatchupCard from '@/src/components/MatchupCard';
import ChampionshipCard from '@/src/components/ChampionshipCard';

interface DoubleEliminationBracketProps {
  rounds: PostseasonRound[];
}

interface SectionHeaderProps {
  dotColor: string;
  title: string;
  description?: string;
}

function SectionHeader({ dotColor, title, description }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`inline-block w-2 h-2 rounded-full ${dotColor}`} />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {title}
      </span>
      {description && (
        <span className="text-xs text-slate-600">{description}</span>
      )}
    </div>
  );
}

interface FlowIndicatorProps {
  winnerLabel: string;
  loserLabel: string;
}

function FlowIndicator({ winnerLabel, loserLabel }: FlowIndicatorProps) {
  return (
    <div className="flex items-center gap-4 my-2 px-2">
      <div className="flex items-center gap-1 text-xs text-sky-400">
        <span>&#8595;</span>
        <span>{winnerLabel}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-orange-400">
        <span>&#8595;</span>
        <span>{loserLabel}</span>
      </div>
    </div>
  );
}

function MatchupRow({ rounds }: { rounds: PostseasonRound[] }) {
  const hasMatchups = rounds.some(r => r.matchups.length > 0);

  if (!hasMatchups) {
    return <p className="text-sm text-slate-500 italic py-2">待定</p>;
  }

  return (
    <div className="flex flex-wrap gap-4">
      {rounds.map(round =>
        round.matchups.map(matchup => (
          <MatchupCard key={matchup.matchupId} matchup={matchup} variant="dark" />
        ))
      )}
    </div>
  );
}

export default function DoubleEliminationBracket({ rounds }: DoubleEliminationBracketProps) {
  const firstRound = rounds.filter(r => r.roundId === 'top4-w1');
  const winnersRound2 = rounds.filter(r => r.roundId === 'top4-w2');
  const losersRound1 = rounds.filter(r => r.roundId === 'top4-l1');
  const losersRound2 = rounds.filter(r => r.roundId === 'top4-l2');
  const championshipRound = rounds.find(r => r.bracket === 'championship');

  const championshipMatchup = championshipRound?.matchups[0] ?? null;

  return (
    <div className="overflow-x-auto space-y-6 pb-2">
      {/* Section 1: First Round */}
      <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-800">
        <SectionHeader
          dotColor="bg-blue-500"
          title="第一輪"
          description="1v4・2v3，勝者晉勝部決賽，敗者進敗部第一輪"
        />
        {firstRound.length > 0 ? (
          <MatchupRow rounds={firstRound} />
        ) : (
          <p className="text-sm text-slate-500 italic py-2">待定</p>
        )}
      </div>

      <FlowIndicator
        winnerLabel="勝者 -> 勝部決賽"
        loserLabel="敗者 -> 敗部第一輪"
      />

      {/* Section 2: Winners Round 2 + Losers Round 1 */}
      <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-800">
        <div className="flex flex-wrap gap-8">
          <div>
            <SectionHeader
              dotColor="bg-blue-500"
              title="勝部決賽"
              description="勝者晉冠軍戰，敗者進敗部決賽"
            />
            {winnersRound2.length > 0 ? (
              <MatchupRow rounds={winnersRound2} />
            ) : (
              <p className="text-sm text-slate-500 italic py-2">待定</p>
            )}
          </div>
          <div>
            <SectionHeader
              dotColor="bg-orange-500"
              title="敗部第一輪"
              description="勝者晉敗部決賽，敗者淘汰"
            />
            {losersRound1.length > 0 ? (
              <MatchupRow rounds={losersRound1} />
            ) : (
              <p className="text-sm text-slate-500 italic py-2">待定</p>
            )}
          </div>
        </div>
      </div>

      <FlowIndicator
        winnerLabel="勝部勝者 -> 冠軍戰"
        loserLabel="敗部敗者淘汰"
      />

      {/* Section 3: Losers Round 2 (Finals) */}
      {(losersRound2.length > 0 || rounds.some(r => r.roundId === 'top4-l2')) && (
        <>
          <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-800">
            <SectionHeader
              dotColor="bg-orange-500"
              title="敗部決賽"
              description="勝者晉冠軍戰，敗者淘汰"
            />
            {losersRound2.length > 0 ? (
              <MatchupRow rounds={losersRound2} />
            ) : (
              <p className="text-sm text-slate-500 italic py-2">待定</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-400 px-2 my-2">
            <span>&#8595;</span>
            <span>{'勝者 -> 冠軍戰'}</span>
          </div>
        </>
      )}

      {/* Section 4: Championship */}
      <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-800">
        <SectionHeader
          dotColor="bg-amber-500"
          title="冠軍戰"
        />
        {championshipMatchup ? (
          <ChampionshipCard
            matchup={championshipMatchup}
            winnersBracketAdvantage={championshipRound?.winnersBracketAdvantage ?? false}
            variant="dark"
          />
        ) : (
          <p className="text-sm text-slate-500 italic py-2">待定</p>
        )}
      </div>
    </div>
  );
}
