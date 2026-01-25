// Jest 測試
import {
  calculatePoints,
  calculateWinRate,
  calculateGamesBehind,
  calculateStandings,
} from '../standingsCalculator';
import type { TeamRecordRaw } from '@/src/types';

describe('standingsCalculator', () => {
  describe('calculatePoints', () => {
    it('應該正確計算積分（勝3分、和1分）', () => {
      // Line Drive: 16勝 1和 = 49分
      expect(calculatePoints(16, 1)).toBe(49);
      // 飛尼克斯: 13勝 0和 = 39分
      expect(calculatePoints(13, 0)).toBe(39);
      // 永春TB: 12勝 1和 = 37分
      expect(calculatePoints(12, 1)).toBe(37);
    });

    it('應該處理零勝零和的情況', () => {
      expect(calculatePoints(0, 0)).toBe(0);
    });

    it('應該處理只有和局的情況', () => {
      expect(calculatePoints(0, 3)).toBe(3);
    });
  });

  describe('calculateWinRate', () => {
    it('應該正確計算勝率', () => {
      // Line Drive: 16勝3敗 = 84.2%
      expect(calculateWinRate(16, 3)).toBeCloseTo(0.842, 2);
      // 飛尼克斯: 13勝5敗 = 72.2%
      expect(calculateWinRate(13, 5)).toBeCloseTo(0.722, 2);
    });

    it('應該處理全勝的情況', () => {
      expect(calculateWinRate(10, 0)).toBe(1);
    });

    it('應該處理全敗的情況', () => {
      expect(calculateWinRate(0, 10)).toBe(0);
    });

    it('應該處理零勝零敗的情況（避免除以零）', () => {
      expect(calculateWinRate(0, 0)).toBe(0);
    });
  });

  describe('calculateGamesBehind', () => {
    it('應該正確計算勝差', () => {
      const leader = { wins: 16, losses: 3 };
      // 飛尼克斯: (16-13 + 5-3) / 2 = 2.5
      expect(calculateGamesBehind(leader, { wins: 13, losses: 5 })).toBe(2.5);
      // 永春TB: (16-12 + 4-3) / 2 = 2.5
      expect(calculateGamesBehind(leader, { wins: 12, losses: 4 })).toBe(2.5);
      // 楚奧特: (16-12 + 5-3) / 2 = 3
      expect(calculateGamesBehind(leader, { wins: 12, losses: 5 })).toBe(3);
    });

    it('第一名的勝差應該是 0', () => {
      const leader = { wins: 16, losses: 3 };
      expect(calculateGamesBehind(leader, leader)).toBe(0);
    });
  });

  describe('calculateStandings', () => {
    const mockTeams: TeamRecordRaw[] = [
      {
        teamId: 'PHE',
        teamName: '飛尼克斯',
        wins: 13,
        losses: 5,
        draws: 0,
        runsAllowed: 5.1,
        runsScored: 11.2,
      },
      {
        teamId: 'ROO',
        teamName: 'Line Drive',
        wins: 16,
        losses: 3,
        draws: 1,
        runsAllowed: 4.0,
        runsScored: 14.2,
      },
      {
        teamId: 'YCT',
        teamName: '永春TB',
        wins: 12,
        losses: 4,
        draws: 1,
        runsAllowed: 6.6,
        runsScored: 8.2,
      },
    ];

    it('應該依積分排序球隊', () => {
      const result = calculateStandings(mockTeams);

      expect(result[0].teamId).toBe('ROO'); // 49分
      expect(result[1].teamId).toBe('PHE'); // 39分
      expect(result[2].teamId).toBe('YCT'); // 37分
    });

    it('應該正確計算每隊的積分', () => {
      const result = calculateStandings(mockTeams);

      expect(result[0].points).toBe(49); // Line Drive
      expect(result[1].points).toBe(39); // 飛尼克斯
      expect(result[2].points).toBe(37); // 永春TB
    });

    it('應該正確計算每隊的勝率', () => {
      const result = calculateStandings(mockTeams);

      expect(result[0].winRate).toBeCloseTo(0.842, 2); // Line Drive
      expect(result[1].winRate).toBeCloseTo(0.722, 2); // 飛尼克斯
      expect(result[2].winRate).toBeCloseTo(0.75, 2); // 永春TB
    });

    it('應該正確計算勝差', () => {
      const result = calculateStandings(mockTeams);

      expect(result[0].gamesBehind).toBeNull(); // 第一名
      expect(result[1].gamesBehind).toBe(2.5); // 飛尼克斯
      expect(result[2].gamesBehind).toBe(2.5); // 永春TB
    });

    it('應該正確更新排名', () => {
      const result = calculateStandings(mockTeams);

      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
      expect(result[2].rank).toBe(3);
    });

    it('應該計算已賽場數', () => {
      const result = calculateStandings(mockTeams);

      expect(result[0].gamesPlayed).toBe(20); // 16+3+1
      expect(result[1].gamesPlayed).toBe(18); // 13+5+0
      expect(result[2].gamesPlayed).toBe(17); // 12+4+1
    });

    it('積分相同時應依勝率排序', () => {
      const teamsWithSamePoints: TeamRecordRaw[] = [
        {
          teamId: 'A',
          teamName: 'Team A',
          wins: 12,
          losses: 5,
          draws: 1, // 37分, 勝率 70.6%
          runsAllowed: 5,
          runsScored: 10,
        },
        {
          teamId: 'B',
          teamName: 'Team B',
          wins: 12,
          losses: 4,
          draws: 1, // 37分, 勝率 75%
          runsAllowed: 5,
          runsScored: 10,
        },
      ];

      const result = calculateStandings(teamsWithSamePoints);

      expect(result[0].teamId).toBe('B'); // 勝率較高
      expect(result[1].teamId).toBe('A');
    });
  });
});
