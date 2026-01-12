import type { BattingStats, CalculatedStats, WeightedStats, LeagueStats } from '@/src/types';

/**
 * 計算打擊率 (AVG)
 * AVG = H / AB
 */
export function calculateAVG(batting: BattingStats): number {
  if (batting.ab === 0) return 0;
  return batting.hits / batting.ab;
}

/**
 * 計算上壘率 (OBP)
 * OBP = (H + BB + HBP) / (AB + BB + HBP + SF)
 * 註：目前無 HBP（觸身球）資料，暫不計入
 */
export function calculateOBP(batting: BattingStats): number {
  const denominator = batting.ab + batting.bb + batting.sf;
  if (denominator === 0) return 0;
  return (batting.hits + batting.bb) / denominator;
}

/**
 * 計算長打率 (SLG)
 * SLG = TB / AB
 */
export function calculateSLG(batting: BattingStats): number {
  if (batting.ab === 0) return 0;
  return batting.totalBases / batting.ab;
}

/**
 * 計算 OPS
 * OPS = OBP + SLG
 */
export function calculateOPS(batting: BattingStats): number {
  return calculateOBP(batting) + calculateSLG(batting);
}

/**
 * 計算純長打率 (ISO)
 * ISO = SLG - AVG
 */
export function calculateISO(batting: BattingStats): number {
  return calculateSLG(batting) - calculateAVG(batting);
}

/**
 * 計算 BABIP (Batting Average on Balls In Play)
 * BABIP = (H - HR) / (AB - SO - HR + SF)
 */
export function calculateBABIP(batting: BattingStats): number {
  const denominator = batting.ab - batting.so - batting.hr + batting.sf;
  if (denominator === 0) return 0;
  return (batting.hits - batting.hr) / denominator;
}

/**
 * 計算三振率 (K%)
 * K% = SO / PA × 100
 */
export function calculateKPct(batting: BattingStats): number {
  if (batting.pa === 0) return 0;
  return (batting.so / batting.pa) * 100;
}

/**
 * 計算保送率 (BB%)
 * BB% = BB / PA × 100
 */
export function calculateBBPct(batting: BattingStats): number {
  if (batting.pa === 0) return 0;
  return (batting.bb / batting.pa) * 100;
}

/**
 * 計算 wOBA (Weighted On-Base Average)
 * wOBA = (w_BB×BB + w_1B×1B + w_2B×2B + w_3B×3B + w_HR×HR) / PA
 */
export function calculateWOBA(batting: BattingStats, league: LeagueStats): number | null {
  if (batting.pa === 0) return null;

  const weights = league.wOBAWeights;
  const weightedValue =
    weights.BB * batting.bb +
    weights['1B'] * batting.singles +
    weights['2B'] * batting.doubles +
    weights['3B'] * batting.triples +
    weights.HR * batting.hr;

  return weightedValue / batting.pa;
}

/**
 * 計算 wRC (Weighted Runs Created)
 * wRC = ((wOBA - lgwOBA) / wOBAScale) × PA
 */
export function calculateWRC(
  batting: BattingStats,
  league: LeagueStats,
  lgWOBA: number
): number | null {
  const woba = calculateWOBA(batting, league);
  if (woba === null) return null;

  return ((woba - lgWOBA) / league.wOBAScale) * batting.pa;
}

/**
 * 計算 wRC+ (調整後 wRC)
 * wRC+ = ((wRC/PA) / lgRunsPerPA) × 100
 */
export function calculateWRCPlus(
  batting: BattingStats,
  league: LeagueStats,
  lgWOBA: number,
  lgRunsPerPA: number
): number | null {
  const wrc = calculateWRC(batting, league, lgWOBA);
  if (wrc === null || batting.pa === 0) return null;

  return ((wrc / batting.pa) / lgRunsPerPA) * 100;
}

/**
 * 計算 OPS+ (調整後 OPS)
 * OPS+ = 100 × (OBP/lgOBP + SLG/lgSLG - 1)
 */
export function calculateOPSPlus(batting: BattingStats, league: LeagueStats): number | null {
  if (league.avgOBP === 0 || league.avgSLG === 0) return null;

  const obp = calculateOBP(batting);
  const slg = calculateSLG(batting);

  return 100 * (obp / league.avgOBP + slg / league.avgSLG - 1);
}

/**
 * 計算所有統計數據
 */
export function calculateAllStats(
  batting: BattingStats,
  league?: LeagueStats,
  lgWOBA: number = 0.340,
  lgRunsPerPA: number = 0.12
): {
  calculated: CalculatedStats;
  weighted: WeightedStats;
} {
  const calculated: CalculatedStats = {
    avg: calculateAVG(batting),
    obp: calculateOBP(batting),
    slg: calculateSLG(batting),
    ops: calculateOPS(batting),
    iso: calculateISO(batting),
    babip: calculateBABIP(batting),
    kPct: calculateKPct(batting),
    bbPct: calculateBBPct(batting),
  };

  const weighted: WeightedStats = {
    wOBA: league ? calculateWOBA(batting, league) : null,
    wRC: league ? calculateWRC(batting, league, lgWOBA) : null,
    wRCPlus: league ? calculateWRCPlus(batting, league, lgWOBA, lgRunsPerPA) : null,
    opsPlus: league ? calculateOPSPlus(batting, league) : null,
  };

  return { calculated, weighted };
}
