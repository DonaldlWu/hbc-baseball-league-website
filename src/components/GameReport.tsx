"use client";

import type { GameReport as GameReportType } from "@/src/types";
import { displayGameNumber } from "@/src/lib/formatters";

interface GameReportProps {
  data: GameReportType;
}

export default function GameReport({ data }: GameReportProps) {
  const { homeTeam, awayTeam, innings, date, venue, gameNumber } = data;

  // 判斷勝負
  const homeWin = homeTeam.runs > awayTeam.runs;
  const awayWin = awayTeam.runs > homeTeam.runs;

  return (
    <div className="space-y-6">
      {/* 比賽資訊標題 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">
              {displayGameNumber(gameNumber)} | {date} | {venue}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
              {homeTeam.name} vs {awayTeam.name}
            </h1>
          </div>
          <div className="text-4xl md:text-5xl font-bold">
            <span className={homeWin ? "text-yellow-400" : "text-gray-100"}>{homeTeam.runs}</span>
            <span className="mx-3 text-2xl text-gray-500">:</span>
            <span className={awayWin ? "text-yellow-400" : "text-gray-100"}>{awayTeam.runs}</span>
          </div>
        </div>
      </div>

      {/* 逐局比分 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-800 px-4 py-2 font-semibold text-gray-100">
          逐局比分
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 w-32">球隊</th>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((inning) => (
                  <th key={inning} className="px-3 py-2 text-center font-semibold text-gray-700 w-10">
                    {inning}
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-bold text-gray-900 bg-gray-200 w-12">R</th>
                <th className="px-3 py-2 text-center font-bold text-gray-900 bg-gray-200 w-12">H</th>
                <th className="px-3 py-2 text-center font-bold text-gray-900 bg-gray-200 w-12">E</th>
              </tr>
            </thead>
            <tbody>
              {/* 主隊 */}
              <tr className={`border-b ${homeWin ? "bg-green-50" : ""}`}>
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {homeTeam.name}
                  {homeWin && <span className="ml-2 text-green-600 text-xs">WIN</span>}
                </td>
                {innings.home.map((score, idx) => (
                  <td key={idx} className="px-3 py-3 text-center text-gray-700">
                    {score !== null ? score : "-"}
                  </td>
                ))}
                <td className="px-3 py-3 text-center font-bold text-gray-900 bg-gray-100">{homeTeam.runs}</td>
                <td className="px-3 py-3 text-center font-bold text-gray-900 bg-gray-100">{homeTeam.hits}</td>
                <td className="px-3 py-3 text-center font-bold text-gray-900 bg-gray-100">{homeTeam.errors}</td>
              </tr>
              {/* 客隊 */}
              <tr className={awayWin ? "bg-green-50" : ""}>
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {awayTeam.name}
                  {awayWin && <span className="ml-2 text-green-600 text-xs">WIN</span>}
                </td>
                {innings.away.map((score, idx) => (
                  <td key={idx} className="px-3 py-3 text-center text-gray-700">
                    {score !== null ? score : "-"}
                  </td>
                ))}
                <td className="px-3 py-3 text-center font-bold text-gray-900 bg-gray-100">{awayTeam.runs}</td>
                <td className="px-3 py-3 text-center font-bold text-gray-900 bg-gray-100">{awayTeam.hits}</td>
                <td className="px-3 py-3 text-center font-bold text-gray-900 bg-gray-100">{awayTeam.errors}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 兩隊數據並排 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 主隊 */}
        <TeamStatsCard team={homeTeam} isWinner={homeWin} label="主隊" />
        {/* 客隊 */}
        <TeamStatsCard team={awayTeam} isWinner={awayWin} label="客隊" />
      </div>
    </div>
  );
}

interface TeamStatsCardProps {
  team: GameReportType["homeTeam"];
  isWinner: boolean;
  label: string;
}

function TeamStatsCard({ team, isWinner, label }: TeamStatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* 隊伍標題 */}
      <div className={`px-4 py-3 ${isWinner ? "bg-green-700" : "bg-gray-700"}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-300">{label}</span>
            <h3 className="text-lg font-bold text-gray-100">{team.name}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-100">{team.runs}</div>
            {team.battingAvg && (
              <div className="text-xs text-gray-300">打率 {team.battingAvg.toFixed(3)}</div>
            )}
          </div>
        </div>
      </div>

      {/* 投手數據 */}
      <div className="border-b">
        <div className="bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
          投手成績
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">投手</th>
                <th className="px-3 py-2 text-center">IP</th>
                <th className="px-3 py-2 text-center">NP</th>
                <th className="px-3 py-2 text-center">H</th>
                <th className="px-3 py-2 text-center">R</th>
                <th className="px-3 py-2 text-center">ER</th>
                <th className="px-3 py-2 text-center">BB</th>
                <th className="px-3 py-2 text-center">K</th>
              </tr>
            </thead>
            <tbody>
              {team.pitchers.map((p, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-500">{p.number}</td>
                  <td className="px-3 py-2 font-medium text-gray-900">{p.name}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{p.ip}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{p.np}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{p.h}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{p.r}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{p.er}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{p.bb}</td>
                  <td className="px-3 py-2 text-center font-semibold text-blue-600">{p.k}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 打者數據 */}
      <div>
        <div className="bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
          打擊成績
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">打者</th>
                <th className="px-3 py-2 text-center">PA</th>
                <th className="px-3 py-2 text-center">AB</th>
                <th className="px-3 py-2 text-center">R</th>
                <th className="px-3 py-2 text-center">H</th>
                <th className="px-3 py-2 text-center">RBI</th>
                <th className="px-3 py-2 text-center">BB</th>
                <th className="px-3 py-2 text-center">SO</th>
                <th className="px-3 py-2 text-center">SB</th>
              </tr>
            </thead>
            <tbody>
              {team.batters.map((b, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-500">{b.number}</td>
                  <td className="px-3 py-2 font-medium text-gray-900">{b.name}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{b.pa}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{b.ab}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{b.r > 0 ? <span className="text-green-600 font-semibold">{b.r}</span> : b.r}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{b.h > 0 ? <span className="text-blue-600 font-semibold">{b.h}</span> : b.h}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{b.rbi > 0 ? <span className="text-orange-600 font-semibold">{b.rbi}</span> : b.rbi}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{b.bb}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{b.so}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{b.sb > 0 ? <span className="text-purple-600 font-semibold">{b.sb}</span> : b.sb}</td>
                </tr>
              ))}
              {/* 合計 */}
              <tr className="border-t bg-gray-100 font-semibold text-gray-900">
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2">合計</td>
                <td className="px-3 py-2 text-center">{team.batters.reduce((sum, b) => sum + b.pa, 0)}</td>
                <td className="px-3 py-2 text-center">{team.batters.reduce((sum, b) => sum + b.ab, 0)}</td>
                <td className="px-3 py-2 text-center">{team.batters.reduce((sum, b) => sum + b.r, 0)}</td>
                <td className="px-3 py-2 text-center">{team.batters.reduce((sum, b) => sum + b.h, 0)}</td>
                <td className="px-3 py-2 text-center">{team.batters.reduce((sum, b) => sum + b.rbi, 0)}</td>
                <td className="px-3 py-2 text-center">{team.batters.reduce((sum, b) => sum + b.bb, 0)}</td>
                <td className="px-3 py-2 text-center">{team.batters.reduce((sum, b) => sum + b.so, 0)}</td>
                <td className="px-3 py-2 text-center">{team.batters.reduce((sum, b) => sum + b.sb, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
