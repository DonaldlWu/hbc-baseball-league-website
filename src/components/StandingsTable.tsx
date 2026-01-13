'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTeamIconsByIds } from '@/src/lib/dataLoader';
import type { TeamRecord } from '@/src/types';

interface StandingsTableProps {
  teams: TeamRecord[];
  year: number;
}

export default function StandingsTable({ teams, year }: StandingsTableProps) {
  const router = useRouter();
  const [teamIcons, setTeamIcons] = useState<Map<string, string>>(new Map());
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadIcons() {
      if (teams.length === 0) return;

      const teamIds = teams.map(t => t.teamId);
      const iconMap = await getTeamIconsByIds(teamIds);
      setTeamIcons(iconMap);
    }

    loadIcons();
  }, [teams]);

  if (teams.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        目前沒有排名資料
      </div>
    );
  }

  const handleRowClick = (teamId: string) => {
    router.push(`/teams/${teamId}?year=${year}`);
  };

  const handleImageError = (teamId: string) => {
    setImageErrors(prev => ({ ...prev, [teamId]: true }));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              排名
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              球隊
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              勝
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              敗
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              和
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              均失
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              均得
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {teams.map((team) => (
            <tr
              key={team.teamId}
              onClick={() => handleRowClick(team.teamId)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 text-sm text-gray-900">{team.rank}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  {teamIcons.get(team.teamId) && !imageErrors[team.teamId] ? (
                    <img
                      src={`/${teamIcons.get(team.teamId)}`}
                      alt={`${team.teamName} 圖標`}
                      className="h-6 w-6 object-contain"
                      onError={() => handleImageError(team.teamId)}
                    />
                  ) : (
                    <div className="h-6 w-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gray-400">
                        {team.teamName.substring(0, 1)}
                      </span>
                    </div>
                  )}
                  <span>{team.teamName}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-900">
                {team.wins}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-900">
                {team.losses}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-900">
                {team.draws}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-900">
                {team.runsAllowed.toFixed(1)}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-900">
                {team.runsScored.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
