import type { PostseasonGame } from '@/src/types';

export function formatGamesOneLine(games: PostseasonGame[]): string {
  if (!games.length) return '';

  const realGames = games.filter((g) => !g.byeGame);
  const hasAnyScore = realGames.some((g) => g.homeScore !== null);

  // If no real game has been played, show venue/time of first real game (most useful when upcoming)
  if (!hasAnyScore && realGames.length > 0) {
    const first = realGames[0];
    const parts: string[] = [];
    if (first.venue) parts.push(first.venue);
    if (first.date) parts.push(first.date.slice(5).replace('-', '/'));
    if (first.startTime) parts.push(first.startTime);
    if (parts.length > 0) {
      const byePrefix = games.some((g) => g.byeGame) ? '主優 · ' : '';
      return byePrefix + parts.join(' · ');
    }
  }

  // Show compact scores / status for each game
  return games
    .map((g) => {
      if (g.byeGame) return '主優';
      if (g.homeScore === null) return `G${g.gameSeq}:待賽`;
      return `G${g.gameSeq}:${g.homeScore}-${g.awayScore}`;
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
