import { render, screen } from '@testing-library/react';
import { TeamHeader } from '../TeamHeader';
import type { TeamSummary } from '@/src/types';

describe('TeamHeader', () => {
  const mockTeam: TeamSummary = {
    teamId: '飛尼克斯',
    teamName: '飛尼克斯',
    year: 2025,
    stats: {
      totalPlayers: 43,
      avgBattingAvg: 0.218,
      totalHomeRuns: 5,
    },
    playerCount: 43,
  };

  describe('基本渲染', () => {
    it('應該顯示球團名稱', () => {
      render(<TeamHeader team={mockTeam} />);

      expect(screen.getByText('飛尼克斯')).toBeInTheDocument();
    });

    it('應該顯示年份', () => {
      render(<TeamHeader team={mockTeam} />);

      expect(screen.getByText('2025 賽季')).toBeInTheDocument();
    });

    it('應該顯示球員數量', () => {
      render(<TeamHeader team={mockTeam} />);

      expect(screen.getByText('球員數')).toBeInTheDocument();
      expect(screen.getByText('43')).toBeInTheDocument();
    });

    it('應該顯示隊平均打擊率', () => {
      render(<TeamHeader team={mockTeam} />);

      expect(screen.getByText('隊平均')).toBeInTheDocument();
      expect(screen.getByText('.218')).toBeInTheDocument();
    });

    it('應該顯示全壘打數', () => {
      render(<TeamHeader team={mockTeam} />);

      expect(screen.getByText('全壘打')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('樣式與佈局', () => {
    it('應該有漸層背景', () => {
      const { container } = render(<TeamHeader team={mockTeam} />);

      const header = container.firstChild;
      expect(header).toHaveClass('bg-gradient-to-r');
    });

    it('統計數據應該使用網格布局', () => {
      const { container } = render(<TeamHeader team={mockTeam} />);

      // 尋找包含 grid 的容器
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('不同球團資料', () => {
    it('應該正確顯示不同球團的資料', () => {
      const anotherTeam: TeamSummary = {
        teamId: 'miracle',
        teamName: 'MIRACLE',
        year: 2024,
        stats: {
          totalPlayers: 25,
          avgBattingAvg: 0.315,
          totalHomeRuns: 15,
        },
        playerCount: 25,
      };

      render(<TeamHeader team={anotherTeam} />);

      expect(screen.getByText('MIRACLE')).toBeInTheDocument();
      expect(screen.getByText('2024 賽季')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('.315')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  describe('邊界情況', () => {
    it('應該處理打擊率為 0', () => {
      const teamWithZeroAvg: TeamSummary = {
        ...mockTeam,
        stats: {
          ...mockTeam.stats,
          avgBattingAvg: 0,
        },
      };

      render(<TeamHeader team={teamWithZeroAvg} />);

      expect(screen.getByText('.000')).toBeInTheDocument();
    });

    it('應該處理極高數值', () => {
      const teamWithHighStats: TeamSummary = {
        ...mockTeam,
        stats: {
          totalPlayers: 100,
          avgBattingAvg: 0.450,
          totalHomeRuns: 50,
        },
        playerCount: 100,
      };

      render(<TeamHeader team={teamWithHighStats} />);

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('.450')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });
});
