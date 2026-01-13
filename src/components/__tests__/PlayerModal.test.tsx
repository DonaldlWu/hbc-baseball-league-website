import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerModal } from '../PlayerModal';
import type { Player, LeagueStats } from '@/src/types';
import { loadLeagueStats } from '@/src/lib/dataLoader';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...rest} />;
  },
}));

// Mock dataLoader
jest.mock('@/src/lib/dataLoader', () => ({
  loadLeagueStats: jest.fn(),
}));

describe('PlayerModal', () => {
  const mockPlayer: Player = {
    id: 'COL064',
    code: 'COL064',
    name: '陳重任',
    photo: 'https://example.com/photo.jpg',
    career: {
      debut: 2024,
      teams: ['飛尼克斯', '老鷹'],
      totalSeasons: 2,
    },
    seasons: [
      {
        year: 2025,
        team: '飛尼克斯',
        number: '0',
        batting: {
          games: 9,
          pa: 19,
          ab: 16,
          hits: 2,
          singles: 2,
          doubles: 0,
          triples: 0,
          hr: 0,
          rbi: 2,
          runs: 4,
          bb: 3,
          so: 7,
          sb: 1,
          sf: 0,
          totalBases: 2,
        },
        rankings: { avg: 422 },
      },
      {
        year: 2024,
        team: '老鷹',
        number: '5',
        batting: {
          games: 10,
          pa: 50,
          ab: 45,
          hits: 15,
          singles: 12,
          doubles: 2,
          triples: 0,
          hr: 1,
          rbi: 10,
          runs: 8,
          bb: 4,
          so: 10,
          sb: 2,
          sf: 1,
          totalBases: 20,
        },
        rankings: { avg: 150 },
      },
    ],
  };

  const mockOnClose = jest.fn();

  const mockLeagueStats: LeagueStats = {
    year: 2025,
    avgBattingAvg: 0.250,
    avgOBP: 0.320,
    avgSLG: 0.400,
    avgOPS: 0.720,
    totalPA: 10000,
    totalAB: 9000,
    wOBAScale: 1.2,
    wOBAWeights: {
      BB: 0.69,
      HBP: 0.72,
      '1B': 0.88,
      '2B': 1.24,
      '3B': 1.56,
      HR: 1.95,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (loadLeagueStats as jest.Mock).mockResolvedValue(mockLeagueStats);
  });

  describe('基本渲染', () => {
    it('應該顯示 Modal', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('isOpen 為 false 時不應該渲染', () => {
      render(<PlayerModal player={mockPlayer} isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('應該顯示球員姓名', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('陳重任')).toBeInTheDocument();
    });

    it('應該顯示球員照片', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      const image = screen.getByAltText('陳重任');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });
  });

  describe('生涯資訊顯示', () => {
    it('應該顯示首次登場年份', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      // 首次登場年份會出現在生涯資訊區塊
      expect(screen.getByText('首次登場')).toBeInTheDocument();
      const debutYears = screen.getAllByText('2024');
      expect(debutYears.length).toBeGreaterThan(0);
    });

    it('應該顯示總賽季數', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('總賽季數')).toBeInTheDocument();
      // 總賽季數為 2
      const seasonCounts = screen.getAllByText('2');
      expect(seasonCounts.length).toBeGreaterThan(0);
    });

    it('應該顯示效力球團列表', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('效力球團')).toBeInTheDocument();
      // 效力球團應該包含「飛尼克斯、老鷹」
      expect(screen.getByText('飛尼克斯、老鷹')).toBeInTheDocument();
    });
  });

  describe('賽季統計顯示', () => {
    it('應該顯示所有賽季', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      // 兩個賽季年份都應該顯示
      const year2025 = screen.getAllByText('2025');
      const year2024 = screen.getAllByText('2024');
      expect(year2025.length).toBeGreaterThan(0);
      expect(year2024.length).toBeGreaterThan(0);
    });

    it('應該顯示每個賽季的球團', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      // 2025 年在飛尼克斯
      expect(screen.getByText('2025')).toBeInTheDocument();
      // 2024 年在老鷹
      const phoenixMatches = screen.getAllByText('飛尼克斯');
      const eaglesMatches = screen.getAllByText('老鷹');
      expect(phoenixMatches.length).toBeGreaterThan(0);
      expect(eaglesMatches.length).toBeGreaterThan(0);
    });

    it('應該顯示統計數據標籤', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      // 每個賽季都會顯示這些標籤，所以使用 getAllByText
      expect(screen.getAllByText('打席').length).toBeGreaterThan(0);
      expect(screen.getAllByText('安打').length).toBeGreaterThan(0);
      expect(screen.getAllByText('全壘打').length).toBeGreaterThan(0);
      expect(screen.getAllByText('打點').length).toBeGreaterThan(0);
    });

    it('應該顯示正確的統計數據', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      // 2025 賽季數據
      expect(screen.getByText('19')).toBeInTheDocument(); // PA
      const hitCounts = screen.getAllByText('2');
      expect(hitCounts.length).toBeGreaterThan(0); // Hits (會有多個2)
    });

    it('應該顯示進階數據標籤', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      // 每個賽季都會顯示進階數據
      expect(screen.getAllByText('AVG').length).toBeGreaterThan(0);
      expect(screen.getAllByText('OBP').length).toBeGreaterThan(0);
      expect(screen.getAllByText('SLG').length).toBeGreaterThan(0);
      expect(screen.getAllByText('OPS').length).toBeGreaterThan(0);
      expect(screen.getAllByText('OPS+').length).toBeGreaterThan(0);
    });

    it('應該顯示正確的進階數據數值', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      // 2025 賽季：AVG = 2/16 = 0.125
      // 應該顯示為 .125
      const avgValues = screen.getAllByText('.125');
      expect(avgValues.length).toBeGreaterThan(0);
    });
  });

  describe('關閉功能', () => {
    it('點擊關閉按鈕應該觸發 onClose', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('關閉');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('點擊遮罩背景應該觸發 onClose', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('點擊 Modal 內容區不應該觸發 onClose', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('按下 ESC 鍵應該觸發 onClose', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('按下其他鍵不應該觸發 onClose', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('無障礙支援', () => {
    it('Modal 應該有 dialog role', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('Modal 應該有 aria-modal 屬性', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('Modal 應該有 aria-labelledby 屬性', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('關閉按鈕應該有 aria-label', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByLabelText('關閉')).toBeInTheDocument();
    });
  });

  describe('樣式與佈局', () => {
    it('遮罩應該有半透明背景', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      const overlay = screen.getByTestId('modal-overlay');
      expect(overlay.className).toContain('bg-black');
    });

    it('Modal 應該置中顯示', () => {
      render(<PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />);

      const overlay = screen.getByTestId('modal-overlay');
      expect(overlay.className).toContain('flex');
      expect(overlay.className).toContain('items-center');
      expect(overlay.className).toContain('justify-center');
    });
  });

  describe('邊界情況', () => {
    it('應該處理單一賽季的球員', () => {
      const playerWithOneSeason: Player = {
        ...mockPlayer,
        seasons: [mockPlayer.seasons[0]], // 只有 2025 賽季
        career: {
          debut: 2025, // 更新首次登場年份為 2025
          totalSeasons: 1,
          teams: ['飛尼克斯'],
        },
      };

      render(<PlayerModal player={playerWithOneSeason} isOpen={true} onClose={mockOnClose} />);

      // 應該顯示 2025
      const year2025 = screen.getAllByText('2025');
      expect(year2025.length).toBeGreaterThan(0);
      // 不應該顯示 2024
      expect(screen.queryByText('2024')).not.toBeInTheDocument();
    });

    it('應該處理沒有照片的球員', () => {
      const playerWithoutPhoto: Player = {
        ...mockPlayer,
        photo: '',
      };

      render(<PlayerModal player={playerWithoutPhoto} isOpen={true} onClose={mockOnClose} />);

      const image = screen.getByAltText('陳重任');
      expect(image).toHaveAttribute('src', '/default-avatar.png');
    });

    it('應該處理長球團名稱列表', () => {
      const playerWithManyTeams: Player = {
        ...mockPlayer,
        career: {
          ...mockPlayer.career,
          teams: ['飛尼克斯', '老鷹', '勇士', '獅子', '熊隊'],
        },
      };

      render(<PlayerModal player={playerWithManyTeams} isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText(/飛尼克斯.*老鷹.*勇士.*獅子.*熊隊/)).toBeInTheDocument();
    });
  });

  describe('事件清理', () => {
    it('Modal 關閉時應該移除鍵盤事件監聽', () => {
      const { rerender } = render(
        <PlayerModal player={mockPlayer} isOpen={true} onClose={mockOnClose} />
      );

      // Modal 開啟時按 ESC
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      mockOnClose.mockClear();

      // 關閉 Modal
      rerender(<PlayerModal player={mockPlayer} isOpen={false} onClose={mockOnClose} />);

      // 再按 ESC 不應該觸發
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
