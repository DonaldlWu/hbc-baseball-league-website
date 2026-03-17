"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  calculateAVG,
  calculateOBP,
  calculateSLG,
  calculateOPS,
  calculateOPSPlus,
  calculateISO,
  calculateBABIP,
  calculateKPct,
  calculateBBPct,
  calculateWOBA,
  calculateWRC,
  calculateWRCPlus,
  calculatePercentileRank,
} from "@/src/lib/statsCalculator";
import { formatAvg } from "@/src/lib/formatters";
import { loadLeagueStats, loadSeasonSummary } from "@/src/lib/dataLoader";
import type {
  Player,
  LeagueStats,
  PlayerSummary,
  PlayerSeason,
} from "@/src/types";

export interface PlayerModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
}

// ─── StatPRRow ───────────────────────────────────────────────────────────────

function StatPRRow({
  label,
  pr,
  value,
}: {
  label: string;
  pr: number;
  value: string;
}) {
  const barColor =
    pr >= 70 ? "bg-green-500" : pr >= 40 ? "bg-blue-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="w-12 text-xs font-bold text-gray-600 flex-shrink-0">
        {label}
      </div>
      <div className="flex-1 relative h-3 bg-gray-200 rounded-full">
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${pr}%` }}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full ${barColor} text-white text-xs font-bold flex items-center justify-center shadow-md`}
          style={{ left: `${pr}%` }}
        >
          {pr}
        </div>
      </div>
      <div className="w-14 text-right text-xs font-mono text-gray-700 flex-shrink-0">
        {value}
      </div>
    </div>
  );
}

// ─── PRTabContent ─────────────────────────────────────────────────────────────

function PRTabContent({
  season,
  allPlayers,
  leagueStats,
}: {
  season: PlayerSeason;
  allPlayers: PlayerSummary[];
  leagueStats: LeagueStats | undefined;
}) {
  const qualifiedBatters = allPlayers.filter((p) => p.seasonStats.pa >= 10);
  const batting = season.batting;

  // Batting PR
  const avgPR = calculatePercentileRank(
    calculateAVG(batting),
    qualifiedBatters.map((p) => calculateAVG(p.seasonStats))
  );
  const obpPR = calculatePercentileRank(
    calculateOBP(batting),
    qualifiedBatters.map((p) => calculateOBP(p.seasonStats))
  );
  const slgPR = calculatePercentileRank(
    calculateSLG(batting),
    qualifiedBatters.map((p) => calculateSLG(p.seasonStats))
  );
  const opsPR = calculatePercentileRank(
    calculateOPS(batting),
    qualifiedBatters.map((p) => calculateOPS(p.seasonStats))
  );
  const isoPR = calculatePercentileRank(
    calculateISO(batting),
    qualifiedBatters.map((p) => calculateISO(p.seasonStats))
  );
  const babipPR = calculatePercentileRank(
    calculateBABIP(batting),
    qualifiedBatters.map((p) => calculateBABIP(p.seasonStats))
  );
  const kPctPR = calculatePercentileRank(
    calculateKPct(batting),
    qualifiedBatters.map((p) => calculateKPct(p.seasonStats)),
    false // 越低越好
  );
  const bbPctPR = calculatePercentileRank(
    calculateBBPct(batting),
    qualifiedBatters.map((p) => calculateBBPct(p.seasonStats))
  );

  // Weighted stats PR (computed only when leagueStats is ready)
  const weightedStats = leagueStats
    ? (() => {
        const lgWOBA =
          qualifiedBatters.length > 0
            ? qualifiedBatters.reduce(
                (sum, p) =>
                  sum + (calculateWOBA(p.seasonStats, leagueStats) ?? 0),
                0
              ) / qualifiedBatters.length
            : 0.34;
        const lgRunsPerPA = 0.12;

        const myWOBA = calculateWOBA(batting, leagueStats);
        const myWRC = calculateWRC(batting, leagueStats, lgWOBA);
        const myWRCPlus = calculateWRCPlus(
          batting,
          leagueStats,
          lgWOBA,
          lgRunsPerPA
        );
        const myOPSPlus = calculateOPSPlus(batting, leagueStats);

        const wobaPR =
          myWOBA !== null
            ? calculatePercentileRank(
                myWOBA,
                qualifiedBatters.map(
                  (p) => calculateWOBA(p.seasonStats, leagueStats) ?? 0
                )
              )
            : 0;
        const wrcPR =
          myWRC !== null
            ? calculatePercentileRank(
                myWRC,
                qualifiedBatters.map(
                  (p) => calculateWRC(p.seasonStats, leagueStats, lgWOBA) ?? 0
                )
              )
            : 0;
        const wrcPlusPR =
          myWRCPlus !== null
            ? calculatePercentileRank(
                myWRCPlus,
                qualifiedBatters.map(
                  (p) =>
                    calculateWRCPlus(
                      p.seasonStats,
                      leagueStats,
                      lgWOBA,
                      lgRunsPerPA
                    ) ?? 0
                )
              )
            : 0;
        const opsPlusPR =
          myOPSPlus !== null
            ? calculatePercentileRank(
                myOPSPlus,
                qualifiedBatters.map(
                  (p) => calculateOPSPlus(p.seasonStats, leagueStats) ?? 0
                )
              )
            : 0;

        return {
          wobaPR,
          wrcPR,
          wrcPlusPR,
          opsPlusPR,
          myWOBA,
          myWRC,
          myWRCPlus,
          myOPSPlus,
        };
      })()
    : null;

  // Pitching PR (optional)
  const pitchingStats =
    season.pitching && season.pitchingCalculated
      ? (() => {
          const pitcherPlayers = allPlayers.filter(
            (p) => p.pitchingStats && p.pitchingStats.ip >= 1
          );
          const calc = season.pitchingCalculated!;

          const eraPR = calculatePercentileRank(
            calc.era,
            pitcherPlayers.map((p) => p.pitchingStats!.era),
            false
          );
          const whipPR = calculatePercentileRank(
            calc.whip,
            pitcherPlayers.map((p) => p.pitchingStats!.whip),
            false
          );
          const fipValues = pitcherPlayers
            .filter((p) => p.pitchingStats!.fip !== null)
            .map((p) => p.pitchingStats!.fip as number);
          const fipPR =
            calc.fip !== null
              ? calculatePercentileRank(calc.fip, fipValues, false)
              : 0;
          const kPer9PR = calculatePercentileRank(
            calc.kPer9,
            pitcherPlayers.map((p) => p.pitchingStats!.kPer9)
          );

          return { eraPR, whipPR, fipPR, kPer9PR, calc };
        })()
      : null;

  return (
    <div className="py-2">
      <p className="text-xs text-gray-500 mb-3">
        與同年度打席 ≥ 10 的聯盟球員相比（共 {qualifiedBatters.length} 人）
      </p>

      <h4 className="text-sm font-bold text-gray-700 mb-2">打擊表現</h4>
      <StatPRRow
        label="AVG"
        pr={avgPR}
        value={formatAvg(calculateAVG(batting))}
      />
      <StatPRRow
        label="OBP"
        pr={obpPR}
        value={formatAvg(calculateOBP(batting))}
      />
      <StatPRRow
        label="SLG"
        pr={slgPR}
        value={formatAvg(calculateSLG(batting))}
      />
      <StatPRRow
        label="OPS"
        pr={opsPR}
        value={formatAvg(calculateOPS(batting))}
      />
      <StatPRRow
        label="ISO"
        pr={isoPR}
        value={formatAvg(calculateISO(batting))}
      />
      <StatPRRow
        label="BABIP"
        pr={babipPR}
        value={formatAvg(calculateBABIP(batting))}
      />
      <StatPRRow
        label="K%"
        pr={kPctPR}
        value={`${calculateKPct(batting).toFixed(1)}%`}
      />
      <StatPRRow
        label="BB%"
        pr={bbPctPR}
        value={`${calculateBBPct(batting).toFixed(1)}%`}
      />

      <h4 className="text-sm font-bold text-gray-700 mt-4 mb-2">進階加權</h4>
      {weightedStats ? (
        <>
          <StatPRRow
            label="wOBA"
            pr={weightedStats.wobaPR}
            value={
              weightedStats.myWOBA !== null
                ? formatAvg(weightedStats.myWOBA)
                : "-"
            }
          />
          <StatPRRow
            label="wRC"
            pr={weightedStats.wrcPR}
            value={
              weightedStats.myWRC !== null
                ? weightedStats.myWRC.toFixed(1)
                : "-"
            }
          />
          <StatPRRow
            label="wRC+"
            pr={weightedStats.wrcPlusPR}
            value={
              weightedStats.myWRCPlus !== null
                ? Math.round(weightedStats.myWRCPlus).toString()
                : "-"
            }
          />
          <StatPRRow
            label="OPS+"
            pr={weightedStats.opsPlusPR}
            value={
              weightedStats.myOPSPlus !== null
                ? Math.round(weightedStats.myOPSPlus).toString()
                : "-"
            }
          />
        </>
      ) : (
        <div className="text-xs text-gray-400 py-2 animate-pulse">
          載入中...
        </div>
      )}

      {pitchingStats && (
        <>
          <h4 className="text-sm font-bold text-gray-700 mt-4 mb-2">
            投球表現
          </h4>
          <StatPRRow
            label="ERA"
            pr={pitchingStats.eraPR}
            value={pitchingStats.calc.era.toFixed(2)}
          />
          <StatPRRow
            label="WHIP"
            pr={pitchingStats.whipPR}
            value={pitchingStats.calc.whip.toFixed(2)}
          />
          <StatPRRow
            label="FIP"
            pr={pitchingStats.fipPR}
            value={
              pitchingStats.calc.fip !== null
                ? pitchingStats.calc.fip.toFixed(2)
                : "-"
            }
          />
          <StatPRRow
            label="K/9"
            pr={pitchingStats.kPer9PR}
            value={pitchingStats.calc.kPer9.toFixed(2)}
          />
        </>
      )}
    </div>
  );
}

// ─── PlayerModal ─────────────────────────────────────────────────────────────

export function PlayerModal({ player, isOpen, onClose }: PlayerModalProps) {
  const [leagueStats, setLeagueStats] = useState<Record<number, LeagueStats>>(
    {}
  );
  const [seasonSummaries, setSeasonSummaries] = useState<
    Record<number, PlayerSummary[]>
  >({});

  const [activeTab, setActiveTab] = useState<"batting" | "pitching" | "pr">(
    "batting"
  );
  const [imageError, setImageError] = useState(false);

  // 載入聯盟數據 + 賽季球員摘要
  useEffect(() => {
    if (!isOpen) return;

    const loadAllData = async () => {
      const stats: Record<number, LeagueStats> = {};
      const summaries: Record<number, PlayerSummary[]> = {};

      for (const season of player.seasons) {
        try {
          const [leagueData, summaryData] = await Promise.all([
            loadLeagueStats(season.year),
            loadSeasonSummary(season.year),
          ]);
          stats[season.year] = leagueData;
          summaries[season.year] = Object.values(summaryData.teams).flatMap(
            (team) => team.players
          );
        } catch (error) {
          console.error(`Failed to load data for ${season.year}:`, error);
        }
      }

      setLeagueStats(stats);
      setSeasonSummaries(summaries);
    };

    loadAllData();
  }, [isOpen, player.seasons]);

  // ESC 鍵關閉
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      data-testid="modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`player-modal-title-${player.id}`}
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl"
      >
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          aria-label="關閉"
          className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-gray-500 shadow-md transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* 球員基本資訊 */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 text-white shadow-inner">
          <div className="flex items-start gap-6">
            <div
              className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-full border-4 border-white shadow-lg"
              style={{ backgroundColor: "gray" }}
            >
              {player.photo && !imageError ? (
                <Image
                  src={player.photo}
                  alt={player.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-primary-700 text-white text-5xl font-bold">
                  {player.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2
                id={`player-modal-title-${player.id}`}
                className="text-3xl font-bold text-white drop-shadow-md"
              >
                {player.name}
              </h2>
              <p className="mt-1 text-lg text-white font-medium">
                編碼：{player.code}
              </p>

              {/* 生涯資訊 */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-white font-medium">
                    首次登場
                  </div>
                  <div className="text-xl font-semibold text-white drop-shadow-md">
                    {player.career.debut}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-white font-medium">
                    總賽季數
                  </div>
                  <div className="text-xl font-semibold text-white drop-shadow-md">
                    {player.career.totalSeasons}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-white font-medium">
                    效力球團
                  </div>
                  <div className="text-lg font-semibold text-white drop-shadow-md">
                    {player.career.teams.join("、")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 賽季統計 */}
        <div className="px-8 py-6">
          <h3 className="mb-4 text-2xl font-bold text-gray-900">賽季統計</h3>

          <div className="space-y-6">
            {player.seasons.map((season) => (
              <div
                key={`${season.year}-${season.team}`}
                className="rounded-lg border border-gray-200 bg-gray-50 p-5"
              >
                {/* 賽季標題與 Tab */}
                <div className="mb-4 border-b-2 border-gray-400">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-900">
                        {season.year}
                      </span>
                      <span className="text-lg font-bold text-gray-800">
                        {season.team}
                      </span>
                      <span className="rounded bg-gray-300 px-2 py-1 text-sm font-bold text-gray-800">
                        #{season.number}
                      </span>
                    </div>
                  </div>

                  {/* Tab 切換 - 永遠顯示三個 Tab */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab("batting")}
                      className={`px-4 py-2 text-sm font-semibold transition-colors ${
                        activeTab === "batting"
                          ? "border-b-4 border-primary-600 text-primary-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      打擊數據
                    </button>
                    <button
                      onClick={
                        season.pitching
                          ? () => setActiveTab("pitching")
                          : undefined
                      }
                      disabled={!season.pitching}
                      className={`px-4 py-2 text-sm font-semibold transition-colors ${
                        !season.pitching
                          ? "text-gray-300 cursor-not-allowed"
                          : activeTab === "pitching"
                          ? "border-b-4 border-primary-600 text-primary-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      投球數據
                    </button>
                    <button
                      onClick={() => setActiveTab("pr")}
                      className={`px-4 py-2 text-sm font-semibold transition-colors ${
                        activeTab === "pr"
                          ? "border-b-4 border-primary-600 text-primary-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      🎯 PR 百分位
                    </button>
                  </div>
                </div>

                {/* 打擊數據 */}
                {activeTab === "batting" && (
                  <>
                    {/* 進階數據 */}
                    <div className="mb-4 grid grid-cols-5 gap-3 rounded-lg border-2 border-gray-400 bg-blue-50 p-4">
                      <div>
                        <div className="text-xs font-bold uppercase text-gray-900">
                          AVG
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {formatAvg(calculateAVG(season.batting))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase text-gray-900">
                          OBP
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {formatAvg(calculateOBP(season.batting))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase text-gray-900">
                          SLG
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {formatAvg(calculateSLG(season.batting))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase text-gray-900">
                          OPS
                        </div>
                        <div className="text-xl font-bold text-blue-600">
                          {formatAvg(calculateOPS(season.batting))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase text-gray-900">
                          OPS+
                        </div>
                        <div className="text-xl font-bold text-orange-600">
                          {leagueStats[season.year]
                            ? Math.round(
                                calculateOPSPlus(
                                  season.batting,
                                  leagueStats[season.year]
                                ) || 0
                              )
                            : "-"}
                        </div>
                      </div>
                    </div>

                    {/* 基礎統計數據 */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
                      <div>
                        <div className="text-xs text-gray-500">出賽</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {season.batting.games}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">打席</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {season.batting.pa}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">打數</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {season.batting.ab}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">安打</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {season.batting.hits}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">全壘打</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {season.batting.hr}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">打點</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {season.batting.rbi}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">得分</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {season.batting.runs}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">四死球</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {season.batting.bb}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">三振</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {season.batting.so}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">盜壘</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {season.batting.sb}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">一安</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {season.batting.singles}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">二安</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {season.batting.doubles}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">三安</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {season.batting.triples}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 投球數據 */}
                {activeTab === "pitching" &&
                  season.pitching &&
                  season.pitchingCalculated && (
                    <>
                      {/* 進階數據 */}
                      <div className="mb-4 grid grid-cols-5 gap-3 rounded-lg border-2 border-gray-400 bg-green-50 p-4">
                        <div>
                          <div className="text-xs font-bold uppercase text-gray-900">
                            ERA
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {season.pitchingCalculated.era.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase text-gray-900">
                            WHIP
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {season.pitchingCalculated.whip.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase text-gray-900">
                            FIP
                          </div>
                          <div className="text-xl font-bold text-gray-900">
                            {season.pitchingCalculated.fip?.toFixed(2) || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase text-gray-900">
                            K/9
                          </div>
                          <div className="text-xl font-bold text-blue-600">
                            {season.pitchingCalculated.kPer9.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase text-gray-900">
                            BB/9
                          </div>
                          <div className="text-xl font-bold text-orange-600">
                            {season.pitchingCalculated.bbPer9.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* 基礎統計數據 */}
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
                        <div>
                          <div className="text-xs text-gray-500">出場</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {season.pitching.games}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">局數</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {season.pitching.ip.toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">面對打者</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {season.pitching.bf}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">奪三振</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {season.pitching.so}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">四死球</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {season.pitching.bb}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">被安打</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {season.pitching.h}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">被全壘打</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {season.pitching.hr}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">失分</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {season.pitching.r}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">責任失分</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {season.pitching.er}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">勝</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {season.pitching.w}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">敗</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {season.pitching.l}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">救援成功</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {season.pitching.sv}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">中繼成功</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {season.pitching.hld}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">阻殺成功</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {season.pitching.cs}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                {/* PR 百分位 */}
                {activeTab === "pr" && (
                  <PRTabContent
                    season={season}
                    allPlayers={seasonSummaries[season.year] ?? []}
                    leagueStats={leagueStats[season.year]}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
