// Jest globals (describe, it, expect) are automatically available
import {
  formatAvg,
  formatPercentage,
  formatNumber,
  formatRank,
  formatDate,
  formatSeasonYear,
  formatPlayerName,
  formatStatValue,
  parseGameNumber,
  formatGameNumber,
  displayGameNumber,
} from '../formatters';

describe('formatters', () => {
  describe('formatAvg', () => {
    it('應該正確格式化打擊率 (三位小數)', () => {
      expect(formatAvg(0.375)).toBe('.375');
      expect(formatAvg(0.3)).toBe('.300');
      expect(formatAvg(0.12345)).toBe('.123');
    });

    it('應該處理 1.000 的情況', () => {
      expect(formatAvg(1.0)).toBe('1.000');
    });

    it('應該處理 0 的情況', () => {
      expect(formatAvg(0)).toBe('.000');
    });

    it('應該處理負數 (返回 - )', () => {
      expect(formatAvg(-0.1)).toBe('-');
    });

    it('應該處理 null/undefined', () => {
      expect(formatAvg(null as any)).toBe('-');
      expect(formatAvg(undefined as any)).toBe('-');
    });
  });

  describe('formatPercentage', () => {
    it('應該正確格式化百分比 (一位小數)', () => {
      expect(formatPercentage(20.5)).toBe('20.5%');
      expect(formatPercentage(16)).toBe('16.0%');
    });

    it('應該處理 0 的情況', () => {
      expect(formatPercentage(0)).toBe('0.0%');
    });

    it('應該處理負數', () => {
      expect(formatPercentage(-5.5)).toBe('-');
    });

    it('應該處理 null/undefined', () => {
      expect(formatPercentage(null as any)).toBe('-');
      expect(formatPercentage(undefined as any)).toBe('-');
    });

    it('應該支援自訂小數位數', () => {
      expect(formatPercentage(20.5555, 2)).toBe('20.56%');
      expect(formatPercentage(16, 0)).toBe('16%');
    });
  });

  describe('formatNumber', () => {
    it('應該正確格式化整數', () => {
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(0)).toBe('0');
    });

    it('應該正確格式化小數', () => {
      expect(formatNumber(1.010, 3)).toBe('1.010');
      expect(formatNumber(0.550, 3)).toBe('0.550');
    });

    it('應該處理預設小數位數 (0)', () => {
      expect(formatNumber(100.789)).toBe('101');
    });

    it('應該處理負數', () => {
      expect(formatNumber(-10)).toBe('-10');
      expect(formatNumber(-1.5, 1)).toBe('-1.5');
    });

    it('應該處理 null/undefined', () => {
      expect(formatNumber(null as any)).toBe('-');
      expect(formatNumber(undefined as any)).toBe('-');
    });
  });

  describe('formatRank', () => {
    it('應該正確格式化排名', () => {
      expect(formatRank(1)).toBe('1st');
      expect(formatRank(2)).toBe('2nd');
      expect(formatRank(3)).toBe('3rd');
      expect(formatRank(4)).toBe('4th');
      expect(formatRank(10)).toBe('10th');
      expect(formatRank(21)).toBe('21st');
      expect(formatRank(22)).toBe('22nd');
      expect(formatRank(23)).toBe('23rd');
      expect(formatRank(24)).toBe('24th');
    });

    it('應該處理 0 或負數', () => {
      expect(formatRank(0)).toBe('-');
      expect(formatRank(-1)).toBe('-');
    });

    it('應該處理 null/undefined', () => {
      expect(formatRank(null as any)).toBe('-');
      expect(formatRank(undefined as any)).toBe('-');
    });
  });

  describe('formatDate', () => {
    it('應該正確格式化日期字串 (YYYY-MM-DD)', () => {
      expect(formatDate('2025-01-13')).toBe('2025-01-13');
    });

    it('應該正確格式化 ISO 日期字串', () => {
      const isoDate = '2025-01-13T10:30:00.000Z';
      expect(formatDate(isoDate)).toBe('2025-01-13');
    });

    it('應該處理 Date 物件', () => {
      const date = new Date('2025-01-13T10:30:00.000Z');
      expect(formatDate(date)).toBe('2025-01-13');
    });

    it('應該處理無效日期', () => {
      expect(formatDate('invalid')).toBe('-');
      expect(formatDate('')).toBe('-');
    });

    it('應該處理 null/undefined', () => {
      expect(formatDate(null as any)).toBe('-');
      expect(formatDate(undefined as any)).toBe('-');
    });
  });

  describe('formatSeasonYear', () => {
    it('應該正確格式化年份', () => {
      expect(formatSeasonYear(2025)).toBe('2025');
      expect(formatSeasonYear(2024)).toBe('2024');
    });

    it('應該處理無效年份', () => {
      expect(formatSeasonYear(0)).toBe('-');
      expect(formatSeasonYear(-1)).toBe('-');
    });

    it('應該處理 null/undefined', () => {
      expect(formatSeasonYear(null as any)).toBe('-');
      expect(formatSeasonYear(undefined as any)).toBe('-');
    });
  });

  describe('formatPlayerName', () => {
    it('應該正確格式化球員名稱', () => {
      expect(formatPlayerName('陳重任')).toBe('陳重任');
      expect(formatPlayerName('王小明')).toBe('王小明');
    });

    it('應該處理空字串', () => {
      expect(formatPlayerName('')).toBe('-');
    });

    it('應該處理只有空白的字串', () => {
      expect(formatPlayerName('   ')).toBe('-');
    });

    it('應該修剪前後空白', () => {
      expect(formatPlayerName('  陳重任  ')).toBe('陳重任');
    });

    it('應該處理 null/undefined', () => {
      expect(formatPlayerName(null as any)).toBe('-');
      expect(formatPlayerName(undefined as any)).toBe('-');
    });
  });

  describe('formatStatValue', () => {
    it('應該根據類型格式化打擊率', () => {
      expect(formatStatValue('avg', 0.375)).toBe('.375');
      expect(formatStatValue('obp', 0.460)).toBe('.460');
      expect(formatStatValue('slg', 0.550)).toBe('.550');
    });

    it('應該根據類型格式化 OPS', () => {
      expect(formatStatValue('ops', 1.010)).toBe('1.010');
      expect(formatStatValue('iso', 0.175)).toBe('.175');
    });

    it('應該根據類型格式化百分比', () => {
      expect(formatStatValue('kPct', 20.0)).toBe('20.0%');
      expect(formatStatValue('bbPct', 16.0)).toBe('16.0%');
    });

    it('應該根據類型格式化整數', () => {
      expect(formatStatValue('hr', 10)).toBe('10');
      expect(formatStatValue('rbi', 50)).toBe('50');
      expect(formatStatValue('hits', 100)).toBe('100');
    });

    it('應該處理進階數據', () => {
      expect(formatStatValue('wOBA', 0.431)).toBe('.431');
      expect(formatStatValue('opsPlus', 152)).toBe('152');
      expect(formatStatValue('wRCPlus', 120)).toBe('120');
    });

    it('應該處理未知類型 (預設為整數)', () => {
      expect(formatStatValue('unknown' as any, 123.456)).toBe('123');
    });

    it('應該處理 null 值', () => {
      expect(formatStatValue('avg', null)).toBe('-');
      expect(formatStatValue('hr', null)).toBe('-');
    });
  });

  // ============ gameNumber 格式化函數 ============

  describe('parseGameNumber', () => {
    it('應該正確解析 gameNumber 字串', () => {
      const result = parseGameNumber('2025201');
      expect(result).toEqual({ season: 2025, number: 201 });
    });

    it('應該正確解析不同場次編號', () => {
      expect(parseGameNumber('202552')).toEqual({ season: 2025, number: 52 });
      expect(parseGameNumber('2025142')).toEqual({ season: 2025, number: 142 });
      expect(parseGameNumber('20241')).toEqual({ season: 2024, number: 1 });
    });

    it('應該處理無效的 gameNumber (返回 null)', () => {
      expect(parseGameNumber('')).toBeNull();
      expect(parseGameNumber('invalid')).toBeNull();
      expect(parseGameNumber('123')).toBeNull(); // 太短
    });

    it('應該處理舊格式 "No.XXX" (返回 null)', () => {
      expect(parseGameNumber('No.201')).toBeNull();
      expect(parseGameNumber('No.52')).toBeNull();
    });
  });

  describe('formatGameNumber', () => {
    it('應該正確組合 season 和 number', () => {
      expect(formatGameNumber(2025, 201)).toBe('2025201');
      expect(formatGameNumber(2025, 52)).toBe('202552');
      expect(formatGameNumber(2024, 1)).toBe('20241');
    });

    it('應該處理無效參數', () => {
      expect(formatGameNumber(0, 201)).toBe('');
      expect(formatGameNumber(2025, 0)).toBe('');
      expect(formatGameNumber(-1, 201)).toBe('');
      expect(formatGameNumber(2025, -1)).toBe('');
    });
  });

  describe('displayGameNumber', () => {
    it('應該將 gameNumber 轉換為友善顯示格式', () => {
      expect(displayGameNumber('2025201')).toBe('No.201');
      expect(displayGameNumber('202552')).toBe('No.52');
      expect(displayGameNumber('2025142')).toBe('No.142');
    });

    it('應該處理無效的 gameNumber', () => {
      expect(displayGameNumber('')).toBe('-');
      expect(displayGameNumber('invalid')).toBe('-');
    });

    it('應該處理已是舊格式的 gameNumber（直接返回）', () => {
      expect(displayGameNumber('No.201')).toBe('No.201');
      expect(displayGameNumber('No.52')).toBe('No.52');
    });
  });
});
