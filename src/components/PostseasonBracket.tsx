'use client';

import type { PostseasonRound, PostseasonMatchup } from '@/src/types';
import MatchupCard from '@/src/components/MatchupCard';
import { BracketLine } from '@/src/components/BracketLine';

interface PostseasonBracketProps {
  rounds: PostseasonRound[];
}

const CARD_W = 176;
const CONNECTOR_W = 48;
// 122 = 2×(py-2 + h-8) rows + border + score-row (py-1.5 + text)
// Must match the tallest possible MatchupCard (completed, with score row)
const CARD_H = 122;
const CARD_GAP = 24;
const PAIR_GAP = 48;

const PAIR_HEIGHT = CARD_H * 2 + CARD_GAP;
const TOTAL_HEIGHT = 4 * PAIR_HEIGHT + 3 * PAIR_GAP;
const TOTAL_SVG_WIDTH = CARD_W + CONNECTOR_W + CARD_W + CONNECTOR_W + 24;

interface PendingMatchupCardProps {
  seed1: number;
  seed2: number;
}

function PendingMatchupCard({ seed1, seed2 }: PendingMatchupCardProps) {
  return (
    <div className="w-44 rounded-lg overflow-hidden bg-slate-800 ring-1 ring-slate-700 opacity-60">
      <div className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-700">
        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-slate-700 ring-1 ring-slate-600 flex items-center justify-center">
          <span className="text-xs text-slate-500">{seed1}</span>
        </div>
        <span className="text-sm text-slate-500 truncate flex-1">待定</span>
      </div>
      <div className="flex items-center gap-2.5 px-3 py-2">
        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-slate-700 ring-1 ring-slate-600 flex items-center justify-center">
          <span className="text-xs text-slate-500">{seed2}</span>
        </div>
        <span className="text-sm text-slate-500 truncate flex-1">待定</span>
      </div>
    </div>
  );
}

interface BracketPair {
  top: PostseasonMatchup;
  bottom: PostseasonMatchup;
}

function buildPairs(r16Matchups: PostseasonMatchup[]): BracketPair[] {
  const pairs: BracketPair[] = [];
  for (let i = 0; i < r16Matchups.length; i += 2) {
    pairs.push({
      top: r16Matchups[i],
      bottom: r16Matchups[i + 1] ?? r16Matchups[i],
    });
  }
  return pairs;
}

export default function PostseasonBracket({ rounds }: PostseasonBracketProps) {
  const r16Round = rounds.find(r => r.roundId === 'r16');
  const r8Round = rounds.find(r => r.roundId === 'r8');

  const r16Matchups = r16Round?.matchups ?? [];
  const r8Matchups = r8Round?.matchups ?? [];

  const pairs = buildPairs(r16Matchups);

  return (
    <div className="relative inline-block min-w-max">
      <div
        className="inline-grid"
        style={{
          gridTemplateColumns: `${CARD_W}px ${CONNECTOR_W}px ${CARD_W}px ${CONNECTOR_W}px`,
        }}
      >
        {/* Column 1: r16 cards — each card wrapper is exactly CARD_H so SVG midpoints stay correct */}
        <div className="flex flex-col" style={{ gap: `${PAIR_GAP}px` }}>
          {pairs.map((pair, i) => (
            <div key={i} className="flex flex-col" style={{ gap: `${CARD_GAP}px` }}>
              <div style={{ height: `${CARD_H}px`, display: 'flex', alignItems: 'center' }}>
                <MatchupCard matchup={pair.top} variant="dark" />
              </div>
              <div style={{ height: `${CARD_H}px`, display: 'flex', alignItems: 'center' }}>
                <MatchupCard matchup={pair.bottom} variant="dark" />
              </div>
            </div>
          ))}
        </div>

        {/* Column 2: connector space */}
        <div />

        {/* Column 3: r8 cards centered within each pair */}
        <div className="flex flex-col" style={{ gap: `${PAIR_GAP}px` }}>
          {pairs.map((pair, i) => (
            <div
              key={i}
              className="flex items-center"
              style={{ height: `${PAIR_HEIGHT}px` }}
            >
              {r8Matchups[i] ? (
                <MatchupCard matchup={r8Matchups[i]} variant="dark" />
              ) : (
                <PendingMatchupCard seed1={pair.top.seed1} seed2={pair.bottom.seed1} />
              )}
            </div>
          ))}
        </div>

        {/* Column 4: connector space */}
        <div />
      </div>

      {/* SVG connector lines overlay */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={TOTAL_SVG_WIDTH}
        height={TOTAL_HEIGHT}
      >
        {/* r16 -> r8 lines (2 lines per pair) */}
        {pairs.map((pair, i) => {
          const pairTopY = i * (PAIR_HEIGHT + PAIR_GAP);
          const topMidY = pairTopY + CARD_H / 2;
          const bottomMidY = pairTopY + CARD_H + CARD_GAP + CARD_H / 2;
          const r8MidY = pairTopY + PAIR_HEIGHT / 2;
          const midX = CARD_W + CONNECTOR_W / 2;
          const completed = pair.top.status === 'completed';
          const color = completed ? '#38bdf8' : '#1e3a5f';
          return (
            <g key={i}>
              <BracketLine
                x1={CARD_W}
                y1={topMidY}
                x2={CARD_W + CONNECTOR_W}
                y2={r8MidY}
                midX={midX}
                color={color}
                dashed={!completed}
              />
              <BracketLine
                x1={CARD_W}
                y1={bottomMidY}
                x2={CARD_W + CONNECTOR_W}
                y2={r8MidY}
                midX={midX}
                color={color}
                dashed={!completed}
              />
            </g>
          );
        })}

        {/* r8 -> semi-final lines (2 pairs each feeding one semi-final entry) */}
        {[0, 1].map((i) => {
          const r8_0_TopY = i * 2 * (PAIR_HEIGHT + PAIR_GAP);
          const r8_0_MidY = r8_0_TopY + PAIR_HEIGHT / 2;
          const r8_1_TopY = r8_0_TopY + PAIR_HEIGHT + PAIR_GAP;
          const r8_1_MidY = r8_1_TopY + PAIR_HEIGHT / 2;
          const finalMidY = (r8_0_MidY + r8_1_MidY) / 2;
          const fromX = CARD_W + CONNECTOR_W + CARD_W;
          const toX = fromX + CONNECTOR_W;
          const midX = fromX + CONNECTOR_W / 2;
          const matchup0 = r8Matchups[i * 2];
          const matchup1 = r8Matchups[i * 2 + 1];
          const completed = matchup0?.status === 'completed' && matchup1?.status === 'completed';
          const color = completed ? '#f59e0b' : '#451a03';
          return (
            <g key={i}>
              <BracketLine
                x1={fromX}
                y1={r8_0_MidY}
                x2={toX}
                y2={finalMidY}
                midX={midX}
                color={color}
                dashed={!completed}
              />
              <BracketLine
                x1={fromX}
                y1={r8_1_MidY}
                x2={toX}
                y2={finalMidY}
                midX={midX}
                color={color}
                dashed={!completed}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
