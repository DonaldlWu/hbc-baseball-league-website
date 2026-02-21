'use client';

import type { PostseasonRound, PostseasonMatchup } from '@/src/types';
import MatchupCard from '@/src/components/MatchupCard';
import ChampionshipCard from '@/src/components/ChampionshipCard';
import { BracketLine } from '@/src/components/BracketLine';

interface DoubleEliminationBracketProps {
  rounds: PostseasonRound[];
}

const CARD_W = 176;
const CONNECTOR_W = 48;
const CARD_H = 108;
const CARD_GAP = 24;
const PAIR_GAP = 48;

// W bracket: 2 cards stacked
const W_PAIR_H = CARD_H * 2 + CARD_GAP; // 240

// L bracket starts below W pair
const L_TOP = W_PAIR_H + PAIR_GAP; // 288

// Total height
const TOTAL_HEIGHT = L_TOP + CARD_H; // 396

// Key Y midpoints
const W1M1_MID_Y = CARD_H / 2; // 54
const W1M2_MID_Y = CARD_H + CARD_GAP + CARD_H / 2; // 186
const W_FINAL_TOP = (W_PAIR_H - CARD_H) / 2; // 66
const W_FINAL_MID_Y = W_FINAL_TOP + CARD_H / 2; // 120
const L_MID_Y = L_TOP + CARD_H / 2; // 342
const CHAMP_MID_Y = (W_FINAL_MID_Y + L_MID_Y) / 2; // 231
const CHAMP_TOP = CHAMP_MID_Y - CARD_H / 2; // 177

// Column X positions
const COL0_X = 0;
const COL2_X = CARD_W + CONNECTOR_W; // 224
const COL4_X = (CARD_W + CONNECTOR_W) * 2; // 448

// Connection point X values
const COL0_RIGHT = CARD_W; // 176
const COL2_LEFT = COL2_X; // 224
const COL2_RIGHT = COL2_X + CARD_W; // 400
const COL4_LEFT = COL4_X; // 448

// Connector midX values
const C1_MID_X = CARD_W + CONNECTOR_W / 2; // 200
const C2_MID_X = CARD_W * 2 + CONNECTOR_W + CONNECTOR_W / 2; // 424

// Phase 2 total width
const PHASE2_W = CARD_W * 3 + CONNECTOR_W * 2; // 624

// Colors
const SKY = '#38bdf8';
const SKY_DIM = '#1e3a5f';
const ORG = '#fb923c';
const ORG_DIM = '#431407';
const AMB = '#f59e0b';
const AMB_DIM = '#451a03';

function matchupColor(
  matchup: PostseasonMatchup | null,
  done: string,
  pending: string,
): string {
  return matchup?.status === 'completed' ? done : pending;
}

interface PendingCardProps {
  label: string;
}

function PendingCard({ label }: PendingCardProps) {
  return (
    <div
      className="rounded-lg overflow-hidden bg-slate-800 ring-1 ring-slate-700 opacity-60 flex items-center justify-center"
      style={{ width: `${CARD_W}px`, height: `${CARD_H}px` }}
    >
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

interface BracketCardsProps {
  w1m1: PostseasonMatchup | null;
  w1m2: PostseasonMatchup | null;
  wFinal: PostseasonMatchup | null;
  l1: PostseasonMatchup | null;
  lFinal: PostseasonMatchup | null;
  champ: PostseasonMatchup | null;
  champAdvantage: boolean;
}

function BracketCards({
  w1m1, w1m2, wFinal, l1, lFinal, champ, champAdvantage,
}: BracketCardsProps) {
  return (
    <>
      <div style={{ position: 'absolute', left: COL0_X, top: 0 }}>
        {w1m1 ? <MatchupCard matchup={w1m1} variant="dark" /> : <PendingCard label="1 vs 4" />}
      </div>
      <div style={{ position: 'absolute', left: COL0_X, top: CARD_H + CARD_GAP }}>
        {w1m2 ? <MatchupCard matchup={w1m2} variant="dark" /> : <PendingCard label="2 vs 3" />}
      </div>
      <div style={{ position: 'absolute', left: COL2_X, top: W_FINAL_TOP }}>
        {wFinal ? <MatchupCard matchup={wFinal} variant="dark" /> : <PendingCard label="W決賽" />}
      </div>
      <div style={{ position: 'absolute', left: COL0_X, top: L_TOP }}>
        {l1 ? <MatchupCard matchup={l1} variant="dark" /> : <PendingCard label="L第一輪" />}
      </div>
      <div style={{ position: 'absolute', left: COL2_X, top: L_TOP }}>
        {lFinal ? <MatchupCard matchup={lFinal} variant="dark" /> : <PendingCard label="L決賽" />}
      </div>
      <div style={{ position: 'absolute', left: COL4_X, top: CHAMP_TOP }}>
        {champ ? (
          <ChampionshipCard matchup={champ} winnersBracketAdvantage={champAdvantage} variant="dark" />
        ) : (
          <PendingCard label="冠軍戰" />
        )}
      </div>
    </>
  );
}

interface BracketLinesProps {
  w1m1: PostseasonMatchup | null;
  w1m2: PostseasonMatchup | null;
  wFinal: PostseasonMatchup | null;
  l1: PostseasonMatchup | null;
  lFinal: PostseasonMatchup | null;
}

function BracketLines({ w1m1, w1m2, wFinal, l1, lFinal }: BracketLinesProps) {
  const w1Color = matchupColor(w1m1, SKY, SKY_DIM);
  const wFinalChampColor = matchupColor(wFinal, AMB, AMB_DIM);
  const l1Color = matchupColor(l1, ORG, ORG_DIM);
  const lFinalChampColor = matchupColor(lFinal, AMB, AMB_DIM);
  const dropColor = matchupColor(w1m1, ORG, ORG_DIM);
  const wDropColor = matchupColor(wFinal, ORG, ORG_DIM);

  return (
    <svg className="absolute inset-0 pointer-events-none" width={PHASE2_W} height={TOTAL_HEIGHT}>
      <BracketLine x1={COL0_RIGHT} y1={W1M1_MID_Y} x2={COL2_LEFT} y2={W_FINAL_MID_Y}
        midX={C1_MID_X} color={w1Color} dashed={w1m1?.status !== 'completed'} />
      <BracketLine x1={COL0_RIGHT} y1={W1M2_MID_Y} x2={COL2_LEFT} y2={W_FINAL_MID_Y}
        midX={C1_MID_X} color={w1Color} dashed={w1m2?.status !== 'completed'} />
      <BracketLine x1={COL2_RIGHT} y1={W_FINAL_MID_Y} x2={COL4_LEFT} y2={CHAMP_MID_Y}
        midX={C2_MID_X} color={wFinalChampColor} dashed={wFinal?.status !== 'completed'} />
      <BracketLine x1={COL0_RIGHT} y1={L_MID_Y} x2={COL2_LEFT} y2={L_MID_Y}
        midX={C1_MID_X} color={l1Color} dashed={l1?.status !== 'completed'} />
      <BracketLine x1={COL2_RIGHT} y1={L_MID_Y} x2={COL4_LEFT} y2={CHAMP_MID_Y}
        midX={C2_MID_X} color={lFinalChampColor} dashed={lFinal?.status !== 'completed'} />
      {/* W1 loser drop lines -> L1 */}
      <path d={`M ${COL0_RIGHT - 8} ${CARD_H} V ${L_TOP}`}
        fill="none" stroke={dropColor} strokeWidth="2"
        strokeLinecap="round" strokeDasharray="3 3" />
      <path d={`M ${COL0_RIGHT - 24} ${W_PAIR_H} V ${L_TOP}`}
        fill="none" stroke={dropColor} strokeWidth="2"
        strokeLinecap="round" strokeDasharray="3 3" />
      {/* W決賽 loser drop line -> L決賽 */}
      <path d={`M ${COL2_X + CARD_W - 8} ${W_FINAL_TOP + CARD_H} V ${L_TOP}`}
        fill="none" stroke={wDropColor} strokeWidth="2"
        strokeLinecap="round" strokeDasharray="3 3" />
    </svg>
  );
}

export default function DoubleEliminationBracket({ rounds }: DoubleEliminationBracketProps) {
  const w1Round = rounds.find(r => r.roundId === 'top4-w1');
  const w2Round = rounds.find(r => r.roundId === 'top4-w2');
  const l1Round = rounds.find(r => r.roundId === 'top4-l1');
  const l2Round = rounds.find(r => r.roundId === 'top4-l2');
  const champRound = rounds.find(r => r.roundId === 'top4-championship');

  const w1m1 = w1Round?.matchups[0] ?? null;
  const w1m2 = w1Round?.matchups[1] ?? null;
  const wFinal = w2Round?.matchups[0] ?? null;
  const l1 = l1Round?.matchups[0] ?? null;
  const lFinal = l2Round?.matchups[0] ?? null;
  const champ = champRound?.matchups[0] ?? null;
  const champAdvantage = champRound?.winnersBracketAdvantage ?? false;

  return (
    <div className="relative flex-shrink-0" style={{ width: `${PHASE2_W}px`, height: `${TOTAL_HEIGHT}px` }}>
      <BracketCards
        w1m1={w1m1} w1m2={w1m2} wFinal={wFinal}
        l1={l1} lFinal={lFinal} champ={champ}
        champAdvantage={champAdvantage}
      />
      <BracketLines w1m1={w1m1} w1m2={w1m2} wFinal={wFinal} l1={l1} lFinal={lFinal} />
    </div>
  );
}
