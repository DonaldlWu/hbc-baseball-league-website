import { render, screen, fireEvent } from '@testing-library/react';
import { TeamCard } from '../TeamCard';
import type { TeamSummary } from '@/src/types';

describe('TeamCard', () => {
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
    it('應該顯示球隊名稱', () => {
      render(<TeamCard team={mockTeam} />);

      expect(screen.getByText('飛尼克斯')).toBeInTheDocument();
    });

    it('應該顯示球員數量', () => {
      render(<TeamCard team={mockTeam} />);

      expect(screen.getByText('球員數')).toBeInTheDocument();
      expect(screen.getByText('43')).toBeInTheDocument();
    });

    it('應該顯示平均打擊率', () => {
      render(<TeamCard team={mockTeam} />);

      expect(screen.getByText('隊平均')).toBeInTheDocument();
      expect(screen.getByText('.218')).toBeInTheDocument();
    });

    it('應該顯示全壘打數', () => {
      render(<TeamCard team={mockTeam} />);

      expect(screen.getByText('全壘打')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('互動功能', () => {
    it('卡片應該是可點擊的按鈕', () => {
      render(<TeamCard team={mockTeam} />);

      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
    });

    it('點擊卡片應該觸發 onClick 回調', () => {
      const handleClick = jest.fn();
      render(<TeamCard team={mockTeam} onClick={handleClick} />);

      const card = screen.getByRole('button');
      fireEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(mockTeam);
    });

    it('沒有提供 onClick 時點擊不應該報錯', () => {
      render(<TeamCard team={mockTeam} />);

      const card = screen.getByRole('button');

      expect(() => {
        fireEvent.click(card);
      }).not.toThrow();
    });

    it('應該顯示查看詳細資料提示', () => {
      render(<TeamCard team={mockTeam} />);

      expect(screen.getByText('查看球隊詳情 →')).toBeInTheDocument();
    });
  });

  describe('樣式與佈局', () => {
    it('卡片應該有正確的基礎樣式', () => {
      render(<TeamCard team={mockTeam} />);

      const card = screen.getByRole('button');
      expect(card.className).toContain('rounded-lg');
      expect(card.className).toContain('border');
      expect(card.className).toContain('bg-white');
    });

    it('應該有懸停效果樣式', () => {
      render(<TeamCard team={mockTeam} />);

      const card = screen.getByRole('button');
      expect(card.className).toContain('hover:shadow-md');
    });
  });

  describe('不同球隊資料', () => {
    it('應該正確顯示不同球隊的資料', () => {
      const anotherTeam: TeamSummary = {
        teamId: 'miracle',
        teamName: 'MIRACLE',
        year: 2025,
        stats: {
          totalPlayers: 25,
          avgBattingAvg: 0.315,
          totalHomeRuns: 15,
        },
        playerCount: 25,
      };

      render(<TeamCard team={anotherTeam} />);

      expect(screen.getByText('MIRACLE')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('.315')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  describe('邊界情況', () => {
    it('應該處理打擊率為 0 的情況', () => {
      const teamWithZeroAvg: TeamSummary = {
        ...mockTeam,
        stats: {
          ...mockTeam.stats,
          avgBattingAvg: 0,
        },
      };

      render(<TeamCard team={teamWithZeroAvg} />);

      expect(screen.getByText('.000')).toBeInTheDocument();
    });

    it('應該處理極高打擊率', () => {
      const teamWithHighAvg: TeamSummary = {
        ...mockTeam,
        stats: {
          ...mockTeam.stats,
          avgBattingAvg: 0.450,
        },
      };

      render(<TeamCard team={teamWithHighAvg} />);

      expect(screen.getByText('.450')).toBeInTheDocument();
    });

    it('應該處理大量球員數', () => {
      const teamWithManyPlayers: TeamSummary = {
        ...mockTeam,
        playerCount: 100,
        stats: {
          ...mockTeam.stats,
          totalPlayers: 100,
        },
      };

      render(<TeamCard team={teamWithManyPlayers} />);

      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('應該處理很長的球隊名稱', () => {
      const teamWithLongName: TeamSummary = {
        ...mockTeam,
        teamName: '這是一個非常非常長的球隊名稱測試',
      };

      render(<TeamCard team={teamWithLongName} />);

      expect(screen.getByText('這是一個非常非常長的球隊名稱測試')).toBeInTheDocument();
    });
  });
});
