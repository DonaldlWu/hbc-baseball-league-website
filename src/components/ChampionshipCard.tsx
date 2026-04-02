'use client';

import type { PostseasonMatchup, PostseasonGame } from '@/src/types';

interface ChampionshipCardProps {
  matchup: PostseasonMatchup;
  winnersBracketAdvantage: boolean;
  variant?: 'light' | 'dark';
}

function GameCell({ game, variant }: { game: PostseasonGame | undefined; variant: 'light' | 'dark' }) {
  const isDark = variant === 'dark';

  const emptyClasses = isDark
    ? 'flex flex-col items-center justify-center h-12 rounded border border-slate-700 bg-slate-900/50'
    : 'flex flex-col items-center justify-center h-12 rounded border border-gray-200 bg-gray-50';

  if (!game) {
    return (
      <div className={emptyClasses}>
        <span className={isDark ? 'text-xs text-slate-600' : 'text-xs text-gray-400'}>-</span>
      </div>
    );
  }

  const hasScore = game.homeScore !== null && game.awayScore !== null;
  const cellClasses = isDark
    ? 'flex flex-col items-center justify-center h-12 rounded border border-slate-700 bg-slate-900/50 p-1.5 text-center overflow-hidden'
    : 'flex flex-col items-center justify-center h-12 rounded border border-amber-200 bg-amber-50 p-1.5 text-center overflow-hidden';

  return (
    <div className={cellClasses}>
      <span className={isDark ? 'text-xs text-slate-400' : 'text-xs text-amber-600 font-medium'}>
        G{game.gameSeq}
      </span>
      {hasScore ? (
        <span className={isDark ? 'text-sm font-bold text-slate-100' : 'text-sm font-semibold text-gray-800'}>
          {game.homeScore}-{game.awayScore}
        </span>
      ) : (
        <>
          {game.venue && (
            <span className={`text-xs truncate w-full text-center ${isDark ? 'text-slate-300' : 'text-amber-700'}`}>
              {game.venue}
            </span>
          )}
          {game.startTime && (
            <span className={isDark ? 'text-xs text-slate-500' : 'text-xs text-amber-500'}>
              {game.startTime}
            </span>
          )}
          {!game.venue && !game.startTime && (
            <span className={isDark ? 'text-xs text-slate-600' : 'text-xs text-gray-400'}>待賽</span>
          )}
        </>
      )}
    </div>
  );
}

function TeamRow({
  name,
  seed,
  isWinnersTeam,
  isChampion,
  winnersBracketAdvantage,
  variant,
}: {
  name: string;
  seed: number;
  isWinnersTeam: boolean;
  isChampion: boolean;
  winnersBracketAdvantage: boolean;
  variant: 'light' | 'dark';
}) {
  const isDark = variant === 'dark';

  const rowClasses = isDark
    ? isWinnersTeam
      ? 'bg-blue-900/30 border border-blue-500/20 rounded p-2'
      : 'bg-orange-900/30 border border-orange-500/20 rounded p-2'
    : isWinnersTeam
    ? 'bg-blue-50 border border-blue-100 rounded-lg px-3 py-2'
    : 'bg-orange-50 border border-orange-100 rounded-lg px-3 py-2';

  const subLabel = isWinnersTeam ? '勝部・只需 1 勝奪冠' : '敗部・需 2 勝奪冠';

  const subLabelClass = isDark
    ? isWinnersTeam ? 'text-xs text-blue-400' : 'text-xs text-orange-400'
    : isWinnersTeam ? 'text-blue-500' : 'text-orange-500';

  const nameClass = isDark
    ? isChampion ? 'text-sm font-semibold text-amber-400 truncate' : 'text-sm font-semibold text-slate-200 truncate'
    : isChampion ? 'text-sm font-semibold text-amber-800 truncate' : 'text-sm font-semibold text-gray-700 truncate';

  const seedClass = isDark ? 'text-xs text-slate-500' : 'text-xs text-gray-400';

  return (
    <div className={rowClasses}>
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={seedClass}>{seed}</span>
            <span className={nameClass}>{name}</span>
            {isChampion && winnersBracketAdvantage && (
              <span className={isDark
                ? 'ml-1 shrink-0 text-xs font-bold bg-amber-500 text-slate-950 rounded px-2 py-0.5'
                : 'ml-1 shrink-0 text-xs font-bold bg-amber-400 text-white rounded px-1.5 py-0.5'
              }>
                冠軍
              </span>
            )}
          </div>
          <div className={`text-xs mt-0.5 ${subLabelClass}`}>{subLabel}</div>
        </div>
      </div>
    </div>
  );
}

export default function ChampionshipCard({
  matchup,
  winnersBracketAdvantage,
  variant = 'dark',
}: ChampionshipCardProps) {
  const isDark = variant === 'dark';
  const game1 = matchup.games.find(g => g.gameSeq === 1);
  const game2 = matchup.games.find(g => g.gameSeq === 2);

  const isTeam1Champion = matchup.winner === 'team1';
  const isTeam2Champion = matchup.winner === 'team2';
  const team1IsWinners = matchup.seed1 < matchup.seed2;

  const outerClasses = isDark
    ? 'border-2 border-amber-500/40 bg-slate-800/80 rounded-lg p-4 w-full max-w-md'
    : 'rounded-xl border-2 border-amber-300 bg-amber-50 p-4 w-full max-w-md';

  const titleClass = isDark
    ? 'text-sm font-bold text-amber-400 uppercase tracking-wider'
    : 'text-sm font-bold text-amber-700 uppercase tracking-wider';

  const vsClass = isDark ? 'text-center text-xs text-slate-600' : 'text-center text-xs text-gray-400';

  return (
    <div className={outerClasses}>
      <div className="text-center mb-3">
        <span className={titleClass}>總冠軍戰</span>
      </div>

      <div className="space-y-2 mb-4">
        <TeamRow
          name={matchup.team1.teamName}
          seed={matchup.seed1}
          isWinnersTeam={team1IsWinners}
          isChampion={isTeam1Champion}
          winnersBracketAdvantage={winnersBracketAdvantage}
          variant={variant}
        />
        <div className={vsClass}>vs</div>
        <TeamRow
          name={matchup.team2.teamName}
          seed={matchup.seed2}
          isWinnersTeam={!team1IsWinners}
          isChampion={isTeam2Champion}
          winnersBracketAdvantage={winnersBracketAdvantage}
          variant={variant}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <GameCell game={game1} variant={variant} />
        <GameCell game={game2} variant={variant} />
      </div>
    </div>
  );
}
