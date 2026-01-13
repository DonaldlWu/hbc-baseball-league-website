'use client';

import { useState, useEffect } from 'react';
import { getTeamIcon } from '@/src/lib/dataLoader';
import type { TeamRecord } from '@/src/types';

interface LeagueLeadersProps {
  teams: TeamRecord[];
}

interface LeaderStat {
  title: string;
  team: string;
  value: string;
  iconUrl?: string;
}

export default function LeagueLeaders({ teams }: LeagueLeadersProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [leaders, setLeaders] = useState<LeaderStat[]>([]);

  useEffect(() => {
    if (teams.length === 0) return;

    // 找出各項數據的領先者
    const winLeader = [...teams].sort((a, b) => b.wins - a.wins)[0];
    const defenseLeader = [...teams].sort((a, b) => a.runsAllowed - b.runsAllowed)[0];
    const offenseLeader = [...teams].sort((a, b) => b.runsScored - a.runsScored)[0];

    // 載入球隊圖標
    async function loadIcons() {
      const [winIcon, defenseIcon, offenseIcon] = await Promise.all([
        getTeamIcon(winLeader.teamName),
        getTeamIcon(defenseLeader.teamName),
        getTeamIcon(offenseLeader.teamName),
      ]);

      setLeaders([
        {
          title: '勝場王',
          team: winLeader.teamName,
          value: winLeader.wins.toString(),
          iconUrl: winIcon,
        },
        {
          title: '最佳防守',
          team: defenseLeader.teamName,
          value: defenseLeader.runsAllowed.toFixed(1),
          iconUrl: defenseIcon,
        },
        {
          title: '最強火力',
          team: offenseLeader.teamName,
          value: offenseLeader.runsScored.toFixed(1),
          iconUrl: offenseIcon,
        },
      ]);
    }

    loadIcons();
  }, [teams]);

  if (teams.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        目前沒有數據
      </div>
    );
  }

  const handleImageError = (teamName: string) => {
    setImageErrors(prev => ({ ...prev, [teamName]: true }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">聯盟領先者</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaders.map((leader) => (
          <div
            key={leader.title}
            className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200"
          >
            <div className="text-sm font-medium text-primary-600 mb-2">
              {leader.title}
            </div>
            <div className="flex items-center gap-2 mb-1">
              {leader.iconUrl && !imageErrors[leader.team] ? (
                <img
                  src={`/${leader.iconUrl}`}
                  alt={`${leader.team} 圖標`}
                  className="h-8 w-8 object-contain"
                  onError={() => handleImageError(leader.team)}
                />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-400">
                    {leader.team.substring(0, 1)}
                  </span>
                </div>
              )}
              <div className="text-lg font-bold text-gray-900">
                {leader.team}
              </div>
            </div>
            <div className="text-2xl font-bold text-primary-700">
              {leader.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
