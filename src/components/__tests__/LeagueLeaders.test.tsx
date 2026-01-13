import { render, screen } from '@testing-library/react';
import LeagueLeaders from '../LeagueLeaders';
import type { TeamRecord } from '@/src/types';

describe('LeagueLeaders', () => {
  const mockTeams: TeamRecord[] = [
    {
      rank: 1,
      teamId: 'line-drive',
      teamName: 'Line Drive',
      wins: 16,
      losses: 3,
      draws: 1,
      runsAllowed: 4.0,
      runsScored: 14.2,
    },
    {
      rank: 2,
      teamId: 'team-b',
      teamName: 'Team B',
      wins: 13,
      losses: 5,
      draws: 0,
      runsAllowed: 8.5,
      runsScored: 10.5,
    },
    {
      rank: 3,
      teamId: 'team-c',
      teamName: 'Team C',
      wins: 12,
      losses: 6,
      draws: 1,
      runsAllowed: 7.0,
      runsScored: 8.0,
    },
  ];

  it('應該顯示勝場王', () => {
    render(<LeagueLeaders teams={mockTeams} />);

    expect(screen.getByText('勝場王')).toBeInTheDocument();
    const teamNames = screen.getAllByText('Line Drive');
    expect(teamNames.length).toBeGreaterThan(0);
    expect(screen.getByText('16')).toBeInTheDocument();
  });

  it('應該顯示最佳防守', () => {
    render(<LeagueLeaders teams={mockTeams} />);

    expect(screen.getByText('最佳防守')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });

  it('應該顯示最強火力', () => {
    render(<LeagueLeaders teams={mockTeams} />);

    expect(screen.getByText('最強火力')).toBeInTheDocument();
    expect(screen.getByText('14.2')).toBeInTheDocument();
  });

  it('應該處理空列表', () => {
    render(<LeagueLeaders teams={[]} />);

    expect(screen.getByText(/目前沒有數據/i)).toBeInTheDocument();
  });

  it('應該顯示標題', () => {
    render(<LeagueLeaders teams={mockTeams} />);

    expect(screen.getByText('聯盟領先者')).toBeInTheDocument();
  });
});
