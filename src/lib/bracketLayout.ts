import type { PostseasonGame } from '@/src/types';

export function formatGamesOneLine(games: PostseasonGame[]): string {
  return games
    .map((g) => {
      if (g.byeGame) return `G${g.gameSeq}: 主優勢`;
      if (g.homeScore === null) return `G${g.gameSeq}: 待賽`;
      return `G${g.gameSeq}: ${g.homeScore}-${g.awayScore}`;
    })
    .join(' · ');
}

export function getCardRightX(colIndex: number, cardW: number, connectorW: number): number {
  return (colIndex + 1) * cardW + colIndex * connectorW;
}

export function getCardLeftX(colIndex: number, cardW: number, connectorW: number): number {
  return colIndex * (cardW + connectorW);
}

export function getCardMidY(rowIndex: number, rowHeights: number[], gapY: number): number {
  let y = 0;
  for (let i = 0; i < rowIndex; i++) {
    y += rowHeights[i] + gapY;
  }
  return y + rowHeights[rowIndex] / 2;
}
