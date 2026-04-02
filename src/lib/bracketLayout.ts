import type { PostseasonGame } from '@/src/types';

/** 大比分：team1 贏場數 - team2 贏場數（含 bye game） */
export function formatSeriesScore(games: PostseasonGame[]): string {
  const t1 = games.filter((g) => g.winner === 'team1').length;
  const t2 = games.filter((g) => g.winner === 'team2').length;
  return `${t1}-${t2}`;
}

/** 地點時間（未開賽）或各場比分（開賽後），bye game 不計入 */
export function formatGamesInfoLine(games: PostseasonGame[]): string {
  const realGames = games.filter((g) => !g.byeGame);
  if (!realGames.length) return '';

  const hasAnyRealScore = realGames.some((g) => g.homeScore !== null);

  if (!hasAnyRealScore) {
    const first = realGames[0];
    const parts: string[] = [];
    if (first.venue) parts.push(first.venue);
    if (first.date) parts.push(first.date.slice(5).replace('-', '/'));
    if (first.startTime) parts.push(first.startTime);
    return parts.join(' · ');
  }

  return realGames
    .map((g) => {
      if (g.homeScore === null) return `G${g.gameSeq}:待賽`;
      return `G${g.gameSeq}:${g.homeScore}-${g.awayScore}`;
    })
    .join(' · ');
}

/** 非 bye game 組合用的單行顯示（Phase 2 / R8 使用） */
export function formatGamesOneLine(games: PostseasonGame[]): string {
  if (!games.length) return '';
  const realGames = games.filter((g) => !g.byeGame);
  if (!realGames.length) return '';

  const hasAnyRealScore = realGames.some((g) => g.homeScore !== null);

  if (!hasAnyRealScore) {
    const first = realGames[0];
    const parts: string[] = [];
    if (first.venue) parts.push(first.venue);
    if (first.date) parts.push(first.date.slice(5).replace('-', '/'));
    if (first.startTime) parts.push(first.startTime);
    if (parts.length > 0) return parts.join(' · ');
  }

  return realGames
    .map((g) => {
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
