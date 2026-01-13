'use client';

import type { TeamRecord } from '@/src/types';

interface LeagueLeadersProps {
  teams: TeamRecord[];
}

interface LeaderStat {
  title: string;
  team: string;
  value: string;
}

export default function LeagueLeaders({ teams }: LeagueLeadersProps) {
  if (teams.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        目前沒有數據
      </div>
    );
  }

  // 找出各項數據的領先者
  const winLeader = [...teams].sort((a, b) => b.wins - a.wins)[0];
  const defenseLeader = [...teams].sort((a, b) => a.runsAllowed - b.runsAllowed)[0];
  const offenseLeader = [...teams].sort((a, b) => b.runsScored - a.runsScored)[0];

  const leaders: LeaderStat[] = [
    {
      title: '勝場王',
      team: winLeader.teamName,
      value: winLeader.wins.toString(),
    },
    {
      title: '最佳防守',
      team: defenseLeader.teamName,
      value: defenseLeader.runsAllowed.toFixed(1),
    },
    {
      title: '最強火力',
      team: offenseLeader.teamName,
      value: offenseLeader.runsScored.toFixed(1),
    },
  ];

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
            <div className="text-lg font-bold text-gray-900 mb-1">
              {leader.team}
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
