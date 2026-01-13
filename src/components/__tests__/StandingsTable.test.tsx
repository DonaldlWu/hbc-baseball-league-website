import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StandingsTable from '../StandingsTable';
import type { TeamRecord } from '@/src/types';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('StandingsTable', () => {
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
      teamId: '陽明ob',
      teamName: '陽明OB',
      wins: 9,
      losses: 6,
      draws: 1,
      runsAllowed: 6.4,
      runsScored: 11.2,
    },
  ];

  it('應該顯示所有球隊', () => {
    render(<StandingsTable teams={mockTeams} year={2025} />);

    expect(screen.getByText('Line Drive')).toBeInTheDocument();
    expect(screen.getByText('陽明OB')).toBeInTheDocument();
  });

  it('應該顯示排名', () => {
    render(<StandingsTable teams={mockTeams} year={2025} />);

    const ranks = screen.getAllByText('1');
    expect(ranks.length).toBeGreaterThan(0);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('應該顯示勝敗場數', () => {
    render(<StandingsTable teams={mockTeams} year={2025} />);

    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('應該顯示均得均失', () => {
    render(<StandingsTable teams={mockTeams} year={2025} />);

    expect(screen.getByText('14.2')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });

  it('應該顯示和局數', () => {
    render(<StandingsTable teams={mockTeams} year={2025} />);

    const drawsCells = screen.getAllByText('1');
    expect(drawsCells.length).toBeGreaterThan(0);
  });

  it('點擊球隊應該導航到球隊頁面', async () => {
    const user = userEvent.setup();
    mockPush.mockClear();

    render(<StandingsTable teams={mockTeams} year={2025} />);

    const teamRow = screen.getByText('Line Drive').closest('tr');
    expect(teamRow).toBeInTheDocument();

    if (teamRow) {
      await user.click(teamRow);
      expect(mockPush).toHaveBeenCalledWith('/teams/line-drive?year=2025');
    }
  });

  it('應該處理空列表', () => {
    render(<StandingsTable teams={[]} year={2025} />);

    expect(screen.getByText(/目前沒有排名資料/i)).toBeInTheDocument();
  });

  it('滑鼠懸停時應該有視覺效果', () => {
    render(<StandingsTable teams={mockTeams} year={2025} />);

    const teamRow = screen.getByText('Line Drive').closest('tr');
    expect(teamRow).toHaveClass('hover:bg-gray-50');
  });
});
