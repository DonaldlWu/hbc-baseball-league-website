"use client";

import { useState, useEffect } from "react";
import { loadStandingsFromSeason, loadSeasonIndex } from "@/src/lib/seasonDataLoader";
import StandingsTable from "@/src/components/StandingsTable";
import AnnouncementCarousel from "@/src/components/AnnouncementCarousel";
import { ScheduleCalendar } from "@/src/components/ScheduleCalendar";
import type { LeagueStandings, SeasonIndexEntry } from "@/src/types";

export default function Home() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [availableSeasons, setAvailableSeasons] = useState<SeasonIndexEntry[]>([]);
  const [standings, setStandings] = useState<LeagueStandings | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [standingsError, setStandingsError] = useState<string | null>(null);

  // 載入賽季列表（只跑一次）
  useEffect(() => {
    loadSeasonIndex().then(setAvailableSeasons).catch(() => {});
  }, []);

  // 依 selectedYear 載入戰績
  useEffect(() => {
    setStandingsLoading(true);
    setStandingsError(null);
    loadStandingsFromSeason(selectedYear)
      .then(setStandings)
      .catch(() => setStandingsError("無法載入排名資料"))
      .finally(() => setStandingsLoading(false));
  }, [selectedYear]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* 公告輪播 */}
          <AnnouncementCarousel />

          {/* 賽程月曆 */}
          <section id="schedule">
            <ScheduleCalendar />
          </section>

          {/* 聯盟排名 */}
          <section id="standings" className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">聯盟排名</h2>
              {availableSeasons.length > 0 && (
                <div className="flex gap-2">
                  {availableSeasons.filter((s) => !s.file).map((s) => (
                    <button
                      key={s.season}
                      onClick={() => setSelectedYear(s.season)}
                      className={
                        selectedYear === s.season
                          ? "px-3 py-1 rounded text-sm font-medium bg-primary-600 text-white"
                          : "px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      }
                    >
                      {s.season}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {standingsLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                  <p className="mt-4 text-gray-700">載入中...</p>
                </div>
              </div>
            )}

            {standingsError && !standingsLoading && (
              <div className="rounded-lg bg-red-50 p-6 text-center">
                <p className="text-red-700">{standingsError}</p>
              </div>
            )}

            {standings && !standingsLoading && (
              <StandingsTable teams={standings.teams} year={standings.year} />
            )}
          </section>

          {/* 賽季資訊 */}
          {standings && !standingsLoading && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                賽季資訊
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">賽季年度：</span>
                  <span className="ml-2">{standings.year}</span>
                </div>
                <div>
                  <span className="font-medium">球團數量：</span>
                  <span className="ml-2">{standings.teams.length} 隊</span>
                </div>
                <div>
                  <span className="font-medium">最後更新：</span>
                  <span className="ml-2">
                    {new Date(standings.lastUpdated).toLocaleDateString("zh-TW")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-16 bg-white border-t">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>HBC 棒球聯盟統計網站</p>
          <p className="text-sm mt-1">Co-Authored-By: Claude Sonnet 4.5</p>
        </div>
      </footer>
    </div>
  );
}
