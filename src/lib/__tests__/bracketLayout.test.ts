import { formatGamesOneLine, getCardMidY, getCardRightX, getCardLeftX } from '../bracketLayout';
import type { PostseasonGame } from '@/src/types';

describe('bracketLayout', () => {
  describe('formatGamesOneLine', () => {
    it('bye game 顯示「主優勢」', () => {
      const games: PostseasonGame[] = [
        { gameSeq: 1, byeGame: true, winner: 'team1', homeScore: null, awayScore: null, gameNumber: null },
      ];
      expect(formatGamesOneLine(games)).toBe('G1: 主優勢');
    });

    it('已完賽顯示比分', () => {
      const games: PostseasonGame[] = [
        { gameSeq: 1, byeGame: true, winner: 'team1', homeScore: null, awayScore: null, gameNumber: null },
        { gameSeq: 2, byeGame: false, winner: 'team1', homeScore: 8, awayScore: 3, gameNumber: '20259001' },
      ];
      expect(formatGamesOneLine(games)).toBe('G1: 主優勢 · G2: 8-3');
    });

    it('待賽顯示「待賽」', () => {
      const games: PostseasonGame[] = [
        { gameSeq: 1, byeGame: true, winner: 'team1', homeScore: null, awayScore: null, gameNumber: null },
        { gameSeq: 2, byeGame: false, winner: null, homeScore: null, awayScore: null, gameNumber: null },
      ];
      expect(formatGamesOneLine(games)).toBe('G1: 主優勢 · G2: 待賽');
    });

    it('空陣列回傳空字串', () => {
      expect(formatGamesOneLine([])).toBe('');
    });
  });

  describe('座標計算', () => {
    const CARD_W = 176;
    const CONNECTOR_W = 48;

    it('getCardRightX：第 0 欄右邊緣 = CARD_W', () => {
      expect(getCardRightX(0, CARD_W, CONNECTOR_W)).toBe(176);
    });

    it('getCardLeftX：第 1 欄左邊緣 = CARD_W + CONNECTOR_W', () => {
      expect(getCardLeftX(1, CARD_W, CONNECTOR_W)).toBe(224);
    });

    it('getCardMidY：第 0 列，高度 100，gap 24，midY = 50', () => {
      expect(getCardMidY(0, [100, 100], 24)).toBe(50);
    });

    it('getCardMidY：第 1 列，高度 100，gap 24，midY = 174', () => {
      expect(getCardMidY(1, [100, 100], 24)).toBe(174);
    });
  });
});
