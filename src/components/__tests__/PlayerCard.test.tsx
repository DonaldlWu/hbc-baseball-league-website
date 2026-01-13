import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerCard } from '../PlayerCard';
import type { PlayerSummary } from '@/src/types';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...rest} />;
  },
}));

describe('PlayerCard', () => {
  const mockPlayer: PlayerSummary = {
    id: 'COL064',
    name: '陳重任',
    number: '0',
    photo: 'https://example.com/photo.jpg',
    team: '飛尼克斯',
    seasonStats: {
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
      avg: 0.125,
      obp: 0.263,
      slg: 0.125,
      ops: 0.388,
    },
    rankings: {
      avg: 422,
      hr: 1304,
    },
  };

  describe('基本渲染', () => {
    it('應該顯示球員姓名', () => {
      render(<PlayerCard player={mockPlayer} />);

      expect(screen.getByText('陳重任')).toBeInTheDocument();
    });

    it('應該顯示球員背號', () => {
      render(<PlayerCard player={mockPlayer} />);

      expect(screen.getByText('#0')).toBeInTheDocument();
    });

    it('應該顯示球員照片', () => {
      render(<PlayerCard player={mockPlayer} />);

      const image = screen.getByAltText('陳重任');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });

    it('照片不存在時應該使用預設頭像', () => {
      const playerWithoutPhoto = { ...mockPlayer, photo: '' };
      render(<PlayerCard player={playerWithoutPhoto} />);

      const image = screen.getByAltText('陳重任');
      expect(image).toHaveAttribute('src', '/default-avatar.png');
    });
  });

  describe('統計數據顯示', () => {
    it('應該顯示打擊率標籤', () => {
      render(<PlayerCard player={mockPlayer} />);

      expect(screen.getByText('AVG')).toBeInTheDocument();
    });

    it('應該顯示格式化的打擊率', () => {
      render(<PlayerCard player={mockPlayer} />);

      // AVG 和 SLG 都是 .125，所以會有兩個
      const avgElements = screen.getAllByText('.125');
      expect(avgElements.length).toBeGreaterThanOrEqual(1);
    });

    it('應該顯示全壘打數', () => {
      render(<PlayerCard player={mockPlayer} />);

      expect(screen.getByText('HR')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('應該顯示打點數', () => {
      render(<PlayerCard player={mockPlayer} />);

      expect(screen.getByText('RBI')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('應該顯示多位數的統計數據', () => {
      const playerWithHighStats = {
        ...mockPlayer,
        seasonStats: {
          ...mockPlayer.seasonStats,
          hr: 25,
          rbi: 88,
          avg: 0.315,
        },
      };

      render(<PlayerCard player={playerWithHighStats} />);

      expect(screen.getByText('.315')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('88')).toBeInTheDocument();
    });

    it('應該顯示 OPS 進階數據', () => {
      render(<PlayerCard player={mockPlayer} />);

      expect(screen.getByText('OPS')).toBeInTheDocument();
      expect(screen.getByText('.388')).toBeInTheDocument();
    });

    it('應該顯示 OBP 進階數據', () => {
      render(<PlayerCard player={mockPlayer} />);

      expect(screen.getByText('OBP')).toBeInTheDocument();
      expect(screen.getByText('.263')).toBeInTheDocument();
    });

    it('應該顯示 SLG 進階數據', () => {
      render(<PlayerCard player={mockPlayer} />);

      expect(screen.getByText('SLG')).toBeInTheDocument();
      // SLG 值是 .125，但 AVG 也是 .125，所以會有兩個
      const slgElements = screen.getAllByText('.125');
      expect(slgElements.length).toBe(2);
    });
  });

  describe('互動功能', () => {
    it('卡片應該是可點擊的按鈕', () => {
      render(<PlayerCard player={mockPlayer} />);

      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
    });

    it('點擊卡片應該觸發 onClick 回調', () => {
      const handleClick = jest.fn();
      render(<PlayerCard player={mockPlayer} onClick={handleClick} />);

      const card = screen.getByRole('button');
      fireEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(mockPlayer);
    });

    it('沒有提供 onClick 時點擊不應該報錯', () => {
      render(<PlayerCard player={mockPlayer} />);

      const card = screen.getByRole('button');

      expect(() => {
        fireEvent.click(card);
      }).not.toThrow();
    });

    it('應該顯示查看詳細資料連結', () => {
      render(<PlayerCard player={mockPlayer} />);

      expect(screen.getByText('查看詳細資料 →')).toBeInTheDocument();
    });
  });

  describe('樣式與佈局', () => {
    it('卡片應該有正確的基礎樣式類別', () => {
      render(<PlayerCard player={mockPlayer} />);

      const card = screen.getByRole('button');
      expect(card.className).toContain('rounded-lg');
      expect(card.className).toContain('border');
      expect(card.className).toContain('bg-white');
    });

    it('應該有過渡效果樣式', () => {
      render(<PlayerCard player={mockPlayer} />);

      const card = screen.getByRole('button');
      expect(card.className).toContain('transition-all');
      expect(card.className).toContain('hover:shadow-md');
    });
  });

  describe('無障礙支援', () => {
    it('按鈕應該有正確的 role', () => {
      render(<PlayerCard player={mockPlayer} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('圖片應該有 alt 文字', () => {
      render(<PlayerCard player={mockPlayer} />);

      const image = screen.getByAltText('陳重任');
      expect(image).toBeInTheDocument();
    });
  });

  describe('邊界情況', () => {
    it('應該處理打擊率為 0 的情況', () => {
      const playerWithZeroAvg = {
        ...mockPlayer,
        seasonStats: {
          ...mockPlayer.seasonStats,
          avg: 0,
        },
      };

      render(<PlayerCard player={playerWithZeroAvg} />);

      expect(screen.getByText('.000')).toBeInTheDocument();
    });

    it('應該處理打擊率為 1 的完美情況', () => {
      const playerWithPerfectAvg = {
        ...mockPlayer,
        seasonStats: {
          ...mockPlayer.seasonStats,
          avg: 1.0,
        },
      };

      render(<PlayerCard player={playerWithPerfectAvg} />);

      expect(screen.getByText('1.000')).toBeInTheDocument();
    });

    it('應該處理很長的球員姓名', () => {
      const playerWithLongName = {
        ...mockPlayer,
        name: '這是一個非常非常長的球員姓名測試',
      };

      render(<PlayerCard player={playerWithLongName} />);

      expect(screen.getByText('這是一個非常非常長的球員姓名測試')).toBeInTheDocument();
    });

    it('應該處理特殊背號（例如 00）', () => {
      const playerWithSpecialNumber = {
        ...mockPlayer,
        number: '00',
      };

      render(<PlayerCard player={playerWithSpecialNumber} />);

      expect(screen.getByText('#00')).toBeInTheDocument();
    });
  });

  describe('不同球員資料', () => {
    it('應該正確顯示不同球員的資料', () => {
      const anotherPlayer: PlayerSummary = {
        id: 'COL065',
        name: '林坤泰',
        number: '1',
        photo: 'https://example.com/player2.jpg',
        team: '飛尼克斯',
        seasonStats: {
          games: 10,
          pa: 50,
          ab: 45,
          hits: 25,
          singles: 20,
          doubles: 3,
          triples: 1,
          hr: 1,
          rbi: 15,
          runs: 12,
          bb: 4,
          so: 8,
          sb: 3,
          sf: 1,
          totalBases: 32,
          avg: 0.556,
          obp: 0.6,
          slg: 0.711,
          ops: 1.311,
        },
        rankings: { avg: 5 },
      };

      render(<PlayerCard player={anotherPlayer} />);

      expect(screen.getByText('林坤泰')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('.556')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });
});
