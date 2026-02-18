import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getGameReport } from '@/src/lib/gameReportParser';
import { CACHE_CONFIG } from '@/src/lib/config';
import { parseGameNumber } from '@/src/lib/formatters';
import type { SeasonData } from '@/src/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameNumber: string }> }
) {
  try {
    const { gameNumber } = await params;
    const decodedGameNumber = decodeURIComponent(gameNumber);

    // 從 gameNumber 解析賽季年度
    const parsed = parseGameNumber(decodedGameNumber);
    if (!parsed) {
      return NextResponse.json(
        { error: `無效的比賽編號 ${decodedGameNumber}` },
        { status: 400 }
      );
    }

    // 從 filesystem 讀取賽季資料（server-side only，避免 browser bundle 引入 fs）
    const filePath = path.join(process.cwd(), 'public', 'data', 'seasons', `${parsed.season}.json`);
    const seasonData = JSON.parse(await fs.readFile(filePath, 'utf-8')) as SeasonData;
    const gameInfo = seasonData.games[decodedGameNumber];

    if (!gameInfo) {
      return NextResponse.json(
        { error: `找不到比賽 ${decodedGameNumber}` },
        { status: 404 }
      );
    }

    // 處理特殊狀態
    if (gameInfo.status === 'rain' && (!gameInfo.rescheduledDates || gameInfo.rescheduledDates.length === 0)) {
      return NextResponse.json(
        { error: `比賽 ${decodedGameNumber} 因雨延賽，尚未補賽` },
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
