'use client';

import type { PostseasonData } from '@/src/types';
import PostseasonBracket from '@/src/components/PostseasonBracket';
import DoubleEliminationBracket from '@/src/components/DoubleEliminationBracket';
import { getPhase1Rounds, getPhase2Rounds } from '@/src/lib/postseasonLoader';
import { BracketLine } from '@/src/components/BracketLine';

interface FullPostseasonBracketProps {
  data: PostseasonData;
}

// Phase 1 dimensions — must match PostseasonBracket.tsx constants exactly
const P1_CARD_W = 176;
const P1_CONN_W = 48;
const P1_CARD_H = 150; // matches CARD_H in PostseasonBracket.tsx
const P1_CARD_GAP = 24;
const P1_PAIR_GAP = 48;
const P1_PAIR_H = P1_CARD_H * 2 + P1_CARD_GAP; // 268
const P1_TOTAL_H = 4 * P1_PAIR_H + 3 * P1_PAIR_GAP; // 1216

// Phase 1 right edge X (r8 right edge = end of column 4)
const P1_EXIT_X = P1_CARD_W + P1_CONN_W + P1_CARD_W + P1_CONN_W; // 448

// Phase 1 two exit Y points (upper half and lower half convergence)
const P1_R8_MID_Y = (i: number) =>
  i * (P1_PAIR_H + P1_PAIR_GAP) + P1_PAIR_H / 2;

const P1_EXIT1_Y = (P1_R8_MID_Y(0) + P1_R8_MID_Y(1)) / 2; // (134 + 450) / 2 = 292
const P1_EXIT2_Y = (P1_R8_MID_Y(2) + P1_R8_MID_Y(3)) / 2; // (766 + 1082) / 2 = 924

// Phase 2 dimensions — must match DoubleEliminationBracket.tsx constants exactly
const P2_CARD_H = 108;
const P2_CARD_GAP = 24;
const P2_TOTAL_H = 396;
const P2_W1_M1_MID_Y = P2_CARD_H / 2; // 54
const P2_W1_M2_MID_Y = P2_CARD_H + P2_CARD_GAP + P2_CARD_H / 2; // 186
const P2_TOTAL_W = 176 * 3 + 48 * 2; // 624

// Phase 2 global offsets within the combined canvas
const P2_Y_OFFSET = Math.floor((P1_TOTAL_H - P2_TOTAL_H) / 2); // 410
const P2_X_OFFSET = P1_EXIT_X + P1_CONN_W; // 496

// Midpoint X of the transition gap (between Phase 1 exit and Phase 2 entry)
const TRANSITION_MID_X = P1_EXIT_X + P1_CONN_W / 2; // 472

// Total canvas dimensions
const TOTAL_W = P2_X_OFFSET + P2_TOTAL_W; // 1120

function RoundLabels() {
  return (
    <div className="flex items-center mb-3 text-xs font-medium uppercase tracking-wider select-none">
      <div className="text-slate-500 text-center" style={{ width: `${P1_CARD_W}px` }}>16強</div>
      <div style={{ width: `${P1_CONN_W}px` }} />
      <div className="text-slate-500 text-center" style={{ width: `${P1_CARD_W}px` }}>8強</div>
      <div style={{ width: `${P1_CONN_W * 2}px` }} />
      <div className="text-amber-500 text-center" style={{ width: `${P1_CARD_W}px` }}>四強 W1</div>
      <div style={{ width: `${P1_CONN_W}px` }} />
      <div className="text-amber-500 text-center" style={{ width: `${P1_CARD_W}px` }}>W決賽</div>
      <div style={{ width: `${P1_CONN_W}px` }} />
      <div className="text-amber-400 font-bold text-center" style={{ width: `${P1_CARD_W}px` }}>冠軍戰</div>
    </div>
  );
}

export default function FullPostseasonBracket({ data }: FullPostseasonBracketProps) {
  const phase1Rounds = getPhase1Rounds(data);
  const phase2Rounds = getPhase2Rounds(data);

  // Phase 2 entry points in global canvas coordinates
  const entry1Y = P2_Y_OFFSET + P2_W1_M1_MID_Y; // 354 + 54 = 408
  const entry2Y = P2_Y_OFFSET + P2_W1_M2_MID_Y; // 354 + 186 = 540

  return (
    <div>
      <RoundLabels />
      {/* Fixed-size canvas for absolute positioning of both brackets */}
      <div className="relative" style={{ width: `${TOTAL_W}px`, height: `${P1_TOTAL_H}px` }}>

        {/* Phase 1: 16強 / 8強 bracket */}
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
          <PostseasonBracket rounds={phase1Rounds} />
        </div>

        {/* Phase 2: double elimination bracket, vertically centered */}
        <div style={{ position: 'absolute', top: P2_Y_OFFSET, left: P2_X_OFFSET }}>
          <DoubleEliminationBracket rounds={phase2Rounds} />
        </div>

        {/* Transition SVG: Phase 1 exit → Phase 2 W1 entry */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={TOTAL_W}
          height={P1_TOTAL_H}
        >
          {/* Upper half exit → Phase 2 W1 m1 */}
          <BracketLine
            x1={P1_EXIT_X}
            y1={P1_EXIT1_Y}
            x2={P2_X_OFFSET}
            y2={entry1Y}
            midX={TRANSITION_MID_X}
            color="#f59e0b"
            dashed
          />
          {/* Lower half exit → Phase 2 W1 m2 */}
          <BracketLine
            x1={P1_EXIT_X}
            y1={P1_EXIT2_Y}
            x2={P2_X_OFFSET}
            y2={entry2Y}
            midX={TRANSITION_MID_X}
            color="#f59e0b"
            dashed
          />
        </svg>

      </div>
    </div>
  );
}
