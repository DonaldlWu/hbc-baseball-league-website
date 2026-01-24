"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import GameReport from "@/src/components/GameReport";
import type { GameReport as GameReportType } from "@/src/types";

export default function GameDetailPage() {
  const params = useParams();
  const gameNumber = params.gameNumber as string;
  const [report, setReport] = useState<GameReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        // 目前使用範例資料，之後可以根據 gameNumber 載入對應的戰報
        const res = await fetch("/data/game-reports/sample.json");
        if (!res.ok) {
          throw new Error("Failed to load game report");
        }
        const data = await res.json();
        // 用 URL 的 gameNumber 覆蓋範例資料的 gameNumber
        setReport({ ...data, gameNumber: decodeURIComponent(gameNumber) });
      } catch (err) {
        setError("無法載入戰報資料");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [gameNumber]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* 返回連結 */}
        <div className="mb-6">
          <Link
            href="/#schedule"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            返回賽程表
          </Link>
        </div>

        {/* Loading 狀態 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-700">載入戰報中...</p>
            </div>
          </div>
        )}

        {/* 錯誤狀態 */}
        {error && (
          <div className="rounded-lg bg-red-50 p-6 text-center">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 戰報內容 */}
        {report && !loading && !error && <GameReport data={report} />}
      </main>
    </div>
  );
}
