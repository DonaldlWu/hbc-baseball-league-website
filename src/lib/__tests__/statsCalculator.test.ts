// Jest globals (describe, it, expect) are automatically available
import {
  calculateAVG,
  calculateOBP,
  calculateSLG,
  calculateOPS,
  calculateISO,
  calculateBABIP,
  calculateKPct,
  calculateBBPct,
  calculateWOBA,
  calculateWRC,
  calculateWRCPlus,
  calculateOPSPlus,
  calculateAllStats,
} from '../statsCalculator';
import type { BattingStats, LeagueStats } from '@/src/types';

describe('statsCalculator', () => {
  // 測試數據
  const sampleBatting: BattingStats = {
    games: 10,
    pa: 50,
    ab: 40,
    hits: 15,
    singles: 10,
    doubles: 3,
    triples: 1,
    hr: 1,
    rbi: 10,
    runs: 8,
    bb: 8,
    so: 10,
    sb: 2,
    sf: 2,
    totalBases: 22,
  };

  const sampleLeague: LeagueStats = {
    year: 2025,
    avgBattingAvg: 0.300,
    avgOBP: 0.380,
    avgSLG: 0.420,
    avgOPS: 0.800,
    totalPA: 10000,
    totalAB: 8500,
    wOBAScale: 1.20,
    wOBAWeights: {
      BB: 0.69,
      HBP: 0.72,
      '1B': 0.88,
      '2B': 1.24,
      '3B': 1.56,
      HR: 1.95,
    },
  };

  describe('calculateAVG', () => {
    it('應該正確計算打擊率', () => {
      const result = calculateAVG(sampleBatting);
      expect(result).toBeCloseTo(0.375, 3); // 15/40
    });

    it('打數為 0 時應該返回 0', () => {
      const batting = { ...sampleBatting, ab: 0 };
      expect(calculateAVG(batting)).toBe(0);
    });
  });

  describe('calculateOBP', () => {
    it('應該正確計算上壘率', () => {
      // OBP = (H + BB + HBP) / (AB + BB + HBP + SF)
      // = (15 + 8 + 0) / (40 + 8 + 0 + 2) = 23/50 = 0.460
      const result = calculateOBP(sampleBatting);
      expect(result).toBeCloseTo(0.460, 3);
    });

    it('分母為 0 時應該返回 0', () => {
      const batting = { ...sampleBatting, ab: 0, bb: 0, sf: 0 };
      expect(calculateOBP(batting)).toBe(0);
    });
  });

  describe('calculateSLG', () => {
    it('應該正確計算長打率', () => {
      // SLG = TB / AB = 22 / 40 = 0.550
      const result = calculateSLG(sampleBatting);
      expect(result).toBeCloseTo(0.550, 3);
    });

    it('打數為 0 時應該返回 0', () => {
      const batting = { ...sampleBatting, ab: 0 };
      expect(calculateSLG(batting)).toBe(0);
    });
  });

  describe('calculateOPS', () => {
    it('應該正確計算 OPS', () => {
      // OPS = OBP + SLG = 0.460 + 0.550 = 1.010
      const result = calculateOPS(sampleBatting);
      expect(result).toBeCloseTo(1.010, 3);
    });
  });

  describe('calculateISO', () => {
    it('應該正確計算 ISO', () => {
      // ISO = SLG - AVG = 0.550 - 0.375 = 0.175
      const result = calculateISO(sampleBatting);
      expect(result).toBeCloseTo(0.175, 3);
    });
  });

  describe('calculateBABIP', () => {
    it('應該正確計算 BABIP', () => {
      // BABIP = (H - HR) / (AB - SO - HR + SF)
      // = (15 - 1) / (40 - 10 - 1 + 2) = 14 / 31 = 0.452
      const result = calculateBABIP(sampleBatting);
      expect(result).toBeCloseTo(0.452, 3);
    });

    it('分母為 0 時應該返回 0', () => {
      const batting = { ...sampleBatting, ab: 11, so: 10, hr: 1, sf: 0 };
      expect(calculateBABIP(batting)).toBe(0);
    });
  });

  describe('calculateKPct', () => {
    it('應該正確計算三振率', () => {
      // K% = SO / PA * 100 = 10 / 50 * 100 = 20
      const result = calculateKPct(sampleBatting);
      expect(result).toBeCloseTo(20.0, 1);
    });

    it('打席為 0 時應該返回 0', () => {
      const batting = { ...sampleBatting, pa: 0 };
      expect(calculateKPct(batting)).toBe(0);
    });
  });

  describe('calculateBBPct', () => {
    it('應該正確計算保送率', () => {
      // BB% = BB / PA * 100 = 8 / 50 * 100 = 16
      const result = calculateBBPct(sampleBatting);
      expect(result).toBeCloseTo(16.0, 1);
    });

    it('打席為 0 時應該返回 0', () => {
      const batting = { ...sampleBatting, pa: 0 };
      expect(calculateBBPct(batting)).toBe(0);
    });
  });

  describe('calculateWOBA', () => {
    it('應該正確計算 wOBA', () => {
      // wOBA = (0.69×BB + 0.88×1B + 1.24×2B + 1.56×3B + 1.95×HR) / PA
      // = (0.69×8 + 0.88×10 + 1.24×3 + 1.56×1 + 1.95×1) / 50
      // = (5.52 + 8.8 + 3.72 + 1.56 + 1.95) / 50
      // = 21.55 / 50 = 0.431
      const result = calculateWOBA(sampleBatting, sampleLeague);
      expect(result).toBeCloseTo(0.431, 3);
    });

    it('打席為 0 時應該返回 null', () => {
      const batting = { ...sampleBatting, pa: 0 };
      expect(calculateWOBA(batting, sampleLeague)).toBeNull();
    });
  });

  describe('calculateWRC', () => {
    it('應該正確計算 wRC', () => {
      const woba = calculateWOBA(sampleBatting, sampleLeague);
      const lgWOBA = 0.340; // 假設聯盟平均

      // wRC = ((wOBA - lgwOBA) / wOBAScale) × PA
      // = ((0.431 - 0.340) / 1.20) × 50
      // = 0.0758 × 50 = 3.79
      const result = calculateWRC(sampleBatting, sampleLeague, lgWOBA);
      expect(result).toBeCloseTo(3.79, 2);
    });

    it('wOBA 為 null 時應該返回 null', () => {
      const batting = { ...sampleBatting, pa: 0 };
      expect(calculateWRC(batting, sampleLeague, 0.340)).toBeNull();
    });
  });

  describe('calculateWRCPlus', () => {
    it('應該正確計算 wRC+', () => {
      const wrc = calculateWRC(sampleBatting, sampleLeague, 0.340);
      const lgRunsPerPA = 0.12; // 假設聯盟平均

      // wRC+ = ((wRC/PA) / lgRunsPerPA) × 100
      // = ((3.79/50) / 0.12) × 100 = 0.0758 / 0.12 × 100 = 63.17
      const result = calculateWRCPlus(sampleBatting, sampleLeague, 0.340, lgRunsPerPA);
      expect(result).toBeCloseTo(63.17, 1);
    });

    it('wRC 為 null 時應該返回 null', () => {
      const batting = { ...sampleBatting, pa: 0 };
      expect(calculateWRCPlus(batting, sampleLeague, 0.340, 0.12)).toBeNull();
    });
  });

  describe('calculateOPSPlus', () => {
    it('應該正確計算 OPS+', () => {
      // OPS+ = 100 × (OBP/lgOBP + SLG/lgSLG - 1)
      // = 100 × (0.460/0.380 + 0.550/0.420 - 1)
      // = 100 × (1.2105 + 1.3095 - 1)
      // = 100 × 1.520 = 152.0
      const result = calculateOPSPlus(sampleBatting, sampleLeague);
      expect(result).toBeCloseTo(152.0, 0);
    });

    it('聯盟數據為 0 時應該返回 null', () => {
      const league = { ...sampleLeague, avgOBP: 0, avgSLG: 0 };
      expect(calculateOPSPlus(sampleBatting, league)).toBeNull();
    });
  });

  describe('calculateAllStats', () => {
    it('應該計算所有數據', () => {
      const result = calculateAllStats(sampleBatting, sampleLeague);

      expect(result.calculated.avg).toBeCloseTo(0.375, 3);
      expect(result.calculated.obp).toBeCloseTo(0.460, 3);
      expect(result.calculated.slg).toBeCloseTo(0.550, 3);
      expect(result.calculated.ops).toBeCloseTo(1.010, 3);
      expect(result.calculated.iso).toBeCloseTo(0.175, 3);
      expect(result.calculated.babip).toBeCloseTo(0.452, 3);
      expect(result.calculated.kPct).toBeCloseTo(20.0, 1);
      expect(result.calculated.bbPct).toBeCloseTo(16.0, 1);

      expect(result.weighted.wOBA).toBeCloseTo(0.431, 3);
      expect(result.weighted.opsPlus).toBeCloseTo(152.0, 0);
      expect(result.weighted.wRC).not.toBeNull();
      expect(result.weighted.wRCPlus).not.toBeNull();
    });

    it('無聯盟數據時，加權數據應為 null', () => {
      const result = calculateAllStats(sampleBatting);

      expect(result.calculated.avg).toBeCloseTo(0.375, 3);
      expect(result.weighted.wOBA).toBeNull();
      expect(result.weighted.opsPlus).toBeNull();
      expect(result.weighted.wRC).toBeNull();
      expect(result.weighted.wRCPlus).toBeNull();
    });
  });
});
