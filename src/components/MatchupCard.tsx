'use client';

import Image from 'next/image';
import type { PostseasonMatchup } from '@/src/types';
import { formatSeriesScore, formatGamesInfoLine, formatGamesOneLine } from '@/src/lib/bracketLayout';

interface MatchupCardProps {
  matchup: PostseasonMatchup;
  variant?: 'light' | 'dark';
}

interface TeamRowProps {
  teamId: string;
  teamName: string;
  seed: number;
  isWinner: boolean;
  isPending: boolean;
  variant: 'light' | 'dark';
}

function TeamRow({ teamId, teamName, seed, isWinner, isPending, variant }: TeamRowProps) {
  const isDark = variant === 'dark';

  const containerClasses = isDark
    ? 'flex items-center gap-2.5 px-3 py-2 border-b border-slate-700 last:border-b-0'
    : 'flex items-center gap-2.5 px-3 py-2 border-b border-gray-100 last:border-b-0';

  const logoClasses = isDark
    ? 'h-8 w-8 flex-shrink-0 rounded-full overflow-hidden ring-1 ring-slate-600 bg-slate-700 flex items-center justify-center'
    : 'h-8 w-8 flex-shrink-0 rounded-full overflow-hidden ring-1 ring-gray-200 bg-gray-100 flex items-center justify-center';

  const nameClasses = isDark
    ? isWinner ? 'text-sm font-semibold text-slate-100 truncate flex-1' : 'text-sm text-slate-500 truncate flex-1'
    : isWinner ? 'text-sm font-semibold text-gray-900 truncate flex-1' : 'text-sm text-gray-400 truncate flex-1';

  const seedClasses = isDark ? 'text-xs text-slate-500' : 'text-xs text-gray-400';

  const badgeClasses = isDark
    ? 'text-xs font-medium bg-amber-500 text-slate-950 rounded px-1.5 py-0.5'
    : 'text-xs font-medium bg-green-100 text-green-700 rounded px-1.5 py-0.5';

  return (
    <div className={containerClasses}>
      <div className={logoClasses}>
        {isPending ? (
          <span className={seedClasses}>{seed}</span>
        ) : (
          <Image
            src={`/assets/teams/${teamId}.png`}
            alt={teamName}
            width={32}
            height={32}
            className="h-full w-full object-contain p-0.5"
          />
        )}
      </div>
      <span className={nameClasses}>
        {isPending ? '待定' : teamName}
      </span>
      {isWinner && !isPending && (
        <span className={badgeClasses}>勝</span>
      )}
    </div>
  );
}

export default function MatchupCard({ matchup, variant = 'dark' }: MatchupCardProps) {
  const isPending = matchup.status === 'pending';
  const isDark = variant === 'dark';

  const cardClasses = isDark
    ? `w-44 rounded-lg overflow-hidden shadow-lg bg-slate-800 ring-1 ring-slate-700${isPending ? ' opacity-60' : ''}`
    : `w-44 rounded-lg overflow-hidden shadow-sm bg-white ring-1 ring-gray-200${isPending ? ' opacity-60' : ''}`;

  const scoreRowClasses = isDark
    ? 'px-3 py-1.5 bg-slate-900/50 border-t border-slate-700 text-xs text-slate-500'
    : 'px-3 py-1.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500';

  const seriesRowClasses = isDark
    ? 'px-3 py-1.5 bg-slate-900/50 border-t border-slate-700 text-sm font-bold text-center text-slate-100'
    : 'px-3 py-1.5 bg-gray-50 border-t border-gray-100 text-sm font-bold text-center text-gray-900';

  const infoRowClasses = isDark
    ? 'px-3 py-1 text-xs text-slate-500'
    : 'px-3 py-1 text-xs text-gray-400';

  const hasByeGame = matchup.games.some((g) => g.byeGame);
  const seriesScore = hasByeGame ? formatSeriesScore(matchup.games) : '';
  const infoLine = hasByeGame ? formatGamesInfoLine(matchup.games) : '';
  const gamesLine = !hasByeGame && !isPending ? formatGamesOneLine(matchup.games) : '';

  return (
    <div className={cardClasses}>
      <TeamRow
        teamId={matchup.team1.teamId}
        teamName={matchup.team1.teamName}
        seed={matchup.seed1}
        isWinner={matchup.winner === 'team1'}
        isPending={isPending}
        variant={variant}
      />
      <TeamRow
        teamId={matchup.team2.teamId}
        teamName={matchup.team2.teamName}
        seed={matchup.seed2}
        isWinner={matchup.winner === 'team2'}
        isPending={isPending}
        variant={variant}
      />
      {!isPending && hasByeGame && (
        <>
          <div className={seriesRowClasses}>{seriesScore}</div>
          <div className={infoRowClasses}>{infoLine}</div>
        </>
      )}
      {!isPending && !hasByeGame && gamesLine && (
        <div className={scoreRowClasses}>
          {gamesLine}
        </div>
      )}
    </div>
  );
}
