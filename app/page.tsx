"use client";

import { useState, useEffect } from "react";
import { loadStandings } from "@/src/lib/dataLoader";
import StandingsTable from "@/src/components/StandingsTable";
import AnnouncementCarousel from "@/src/components/AnnouncementCarousel";
import { ScheduleCalendar } from "@/src/components/ScheduleCalendar";
import type { LeagueStandings } from "@/src/types";

export default function Home() {
  const [standings, setStandings] = useState<LeagueStandings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStandings() {
      try {
        setLoading(true);
        const data = await loadStandings(2025);
        setStandings(data);
      } catch (err) {
        console.error("Failed to load standings:", err);
        setError("無法載入排名資料");
      } finally {
        setLoading(false);
      }
    }

    fetchStandings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-700">載入中...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-6 text-center">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {standings && !loading && !error && (
          <div className="space-y-8">
            {/* Announcements */}
            <AnnouncementCarousel />

            {/* Schedule Calendar */}
            <section id="schedule">
              <ScheduleCalendar />
            </section>

            {/* Standings Table */}
            <section id="standings" className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                聯盟排名
              </h2>
              <StandingsTable teams={standings.teams} year={standings.year} />
            </section>

            {/* Season Info */}
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
                    {new Date(standings.lastUpdated).toLocaleDateString(
                      "zh-TW"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>HBC 棒球聯盟統計網站</p>
          <p className="text-sm mt-1">Co-Authored-By: Claude Sonnet 4.5</p>
        </div>
      </footer>
    </div>
  );
}
