import { NextRequest, NextResponse } from 'next/server';
import { getGameReport } from '@/src/lib/gameReportParser';
import { CACHE_CONFIG } from '@/src/lib/config';

// 比賽對應 Google Sheet ID 的索引
interface GameIndex {
  games: Record<string, {
    sheetId: string;
    date: string;
    homeTeam: string;
    awayTeam: string;
    venue: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameNumber: string }> }
) {
  try {
    const { gameNumber } = await params;
    const decodedGameNumber = decodeURIComponent(gameNumber);

    // 讀取比賽索引
    const indexUrl = new URL('/data/game-reports/index.json', request.url);
    const indexRes = await fetch(indexUrl);

    if (!indexRes.ok) {
      return NextResponse.json(
        { error: '無法讀取比賽索引' },
        { status: 500 }
      );
    }

    const index: GameIndex = await indexRes.json();
    const gameInfo = index.games[decodedGameNumber];

    if (!gameInfo) {
      return NextResponse.json(
        { error: `找不到比賽 ${decodedGameNumber}` },
        { status: 404 }
      );
    }

    if (!gameInfo.sheetId) {
      return NextResponse.json(
        { error: `比賽 ${decodedGameNumber} 尚未有戰報資料` },
        { status: 404 }
      );
    }

    // 從 Google Sheet 取得並解析戰報
    const report = await getGameReport(
      gameInfo.sheetId,
      decodedGameNumber,
      gameInfo.venue
    );

    // 設定 CDN 快取 headers
    return NextResponse.json(report, {
      headers: {
        'Cache-Control': CACHE_CONFIG.getCacheControlHeader(),
      },
    });
  } catch (error) {
    console.error('Error fetching game report:', error);
    return NextResponse.json(
      { error: '載入戰報失敗' },
      { status: 500 }
    );
  }
}
