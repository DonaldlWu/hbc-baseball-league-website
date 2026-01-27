# Skills Guide - 棒球聯盟統計網站技能指南

本文件提供開發本專案所需的技術指南、最佳實踐和範例程式碼。

## 目錄

1. [Model Layer - 純函數與工具](#model-layer)
2. [ViewModel Layer - Custom Hooks](#viewmodel-layer)
3. [View Layer - React 組件](#view-layer)
4. [Next.js 14 最佳實踐](#nextjs-14)
5. [Tailwind CSS 使用指南](#tailwind-css)
6. [ahooks 使用模式](#ahooks)
7. [TDD 實施指南](#tdd)
8. [效能優化](#performance)
9. [程式碼品質標準](#code-quality)
10. [賽程資料產生指引](#schedule-generation)

---

## Model Layer - 純函數與工具 {#model-layer}

### 統計計算器 (statsCalculator.ts)

#### TDD 開發流程

**Step 1: 先寫測試**

```typescript
// src/lib/__tests__/statsCalculator.test.ts

import { describe, it, expect } from 'vitest';
import {
  calculateBattingAvg,
  calculateOBP,
  calculateSLG,
  calculateOPS,
  calculateISO,
  calculateBABIP,
  calculateStats,
} from '../statsCalculator';
import type { BattingStats } from '@/types';

describe('statsCalculator', () => {
  const mockStats: BattingStats = {
    games: 10,
    pa: 45,
    ab: 40,
    hits: 12,
    singles: 8,
    doubles: 3,
    triples: 0,
    hr: 1,
    rbi: 8,
    runs: 7,
    bb: 4,
    so: 8,
    sb: 2,
    sf: 1,
    totalBases: 18,
  };

  describe('calculateBattingAvg', () => {
    it('應該正確計算打擊率', () => {
      expect(calculateBattingAvg(12, 40)).toBe(0.300);
    });

    it('打數為 0 應該返回 0', () => {
      expect(calculateBattingAvg(0, 0)).toBe(0);
    });

    it('應該四捨五入到小數點後三位', () => {
      expect(calculateBattingAvg(1, 3)).toBe(0.333);
    });
  });

  describe('calculateOBP', () => {
    it('應該正確計算上壘率', () => {
      const result = calculateOBP(12, 4, 0, 40, 1);
      expect(result).toBeCloseTo(0.372, 3);
    });

    it('分母為 0 應該返回 0', () => {
      expect(calculateOBP(0, 0, 0, 0, 0)).toBe(0);
    });
  });

  describe('calculateSLG', () => {
    it('應該正確計算長打率', () => {
      expect(calculateSLG(18, 40)).toBe(0.450);
    });
  });

  describe('calculateOPS', () => {
    it('應該正確計算 OPS', () => {
      const obp = 0.372;
      const slg = 0.450;
      expect(calculateOPS(obp, slg)).toBeCloseTo(0.822, 3);
    });
  });

  describe('calculateISO', () => {
    it('應該正確計算 ISO', () => {
      expect(calculateISO(0.450, 0.300)).toBe(0.150);
    });
  });

  describe('calculateBABIP', () => {
    it('應該正確計算 BABIP', () => {
      const result = calculateBABIP(12, 1, 40, 8);
      expect(result).toBeCloseTo(0.355, 3);
    });

    it('分母為 0 或負數應該返回 0', () => {
      expect(calculateBABIP(1, 0, 1, 1)).toBe(0);
    });
  });

  describe('calculateStats', () => {
    it('應該計算所有基本統計數據', () => {
      const result = calculateStats(mockStats);

      expect(result.avg).toBeCloseTo(0.300, 3);
      expect(result.obp).toBeCloseTo(0.372, 3);
      expect(result.slg).toBeCloseTo(0.450, 3);
      expect(result.ops).toBeCloseTo(0.822, 3);
      expect(result.iso).toBeCloseTo(0.150, 3);
      expect(result.babip).toBeCloseTo(0.355, 3);
      expect(result.kPct).toBeCloseTo(17.78, 2);
      expect(result.bbPct).toBeCloseTo(8.89, 2);
    });

    it('應該處理邊界情況', () => {
      const emptyStats: BattingStats = {
        games: 0,
        pa: 0,
        ab: 0,
        hits: 0,
        singles: 0,
        doubles: 0,
        triples: 0,
        hr: 0,
        rbi: 0,
        runs: 0,
        bb: 0,
        so: 0,
        sb: 0,
        sf: 0,
        totalBases: 0,
      };

      const result = calculateStats(emptyStats);

      expect(result.avg).toBe(0);
      expect(result.obp).toBe(0);
      expect(result.slg).toBe(0);
    });
  });
});
```

**Step 2: 實作功能**

```typescript
// src/lib/statsCalculator.ts

import type { BattingStats, CalculatedStats } from '@/types';

/**
 * 四捨五入到指定小數位
 */
function roundToDecimals(value: number, decimals: number = 3): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * 計算打擊率 (AVG)
 * 公式: 安打 / 打數
 */
export function calculateBattingAvg(hits: number, atBats: number): number {
  if (atBats === 0) return 0;
  return roundToDecimals(hits / atBats);
}

/**
 * 計算上壘率 (OBP)
 * 公式: (安打 + 四死 + 觸身) / (打數 + 四死 + 觸身 + 高飛犧牲)
 */
export function calculateOBP(
  hits: number,
  walks: number,
  hbp: number,
  atBats: number,
  sf: number
): number {
  const denominator = atBats + walks + hbp + sf;
  if (denominator === 0) return 0;
  return roundToDecimals((hits + walks + hbp) / denominator);
}

/**
 * 計算長打率 (SLG)
 * 公式: 壘打數 / 打數
 */
export function calculateSLG(totalBases: number, atBats: number): number {
  if (atBats === 0) return 0;
  return roundToDecimals(totalBases / atBats);
}

/**
 * 計算 OPS
 * 公式: OBP + SLG
 */
export function calculateOPS(obp: number, slg: number): number {
  return roundToDecimals(obp + slg);
}

/**
 * 計算 ISO (Isolated Power)
 * 公式: SLG - AVG
 */
export function calculateISO(slg: number, avg: number): number {
  return roundToDecimals(slg - avg);
}

/**
 * 計算 BABIP (Batting Average on Balls In Play)
 * 公式: (安打 - 全壘打) / (打數 - 三振 - 全壘打 + 高飛犧牲)
 */
export function calculateBABIP(
  hits: number,
  homeRuns: number,
  atBats: number,
  strikeouts: number
): number {
  const denominator = atBats - strikeouts - homeRuns;
  if (denominator <= 0) return 0;
  return roundToDecimals((hits - homeRuns) / denominator);
}

/**
 * 計算三振率 (K%)
 * 公式: (三振 / 打席) × 100
 */
export function calculateKPct(strikeouts: number, plateAppearances: number): number {
  if (plateAppearances === 0) return 0;
  return roundToDecimals((strikeouts / plateAppearances) * 100, 2);
}

/**
 * 計算保送率 (BB%)
 * 公式: (四死 / 打席) × 100
 */
export function calculateBBPct(walks: number, plateAppearances: number): number {
  if (plateAppearances === 0) return 0;
  return roundToDecimals((walks / plateAppearances) * 100, 2);
}

/**
 * 計算所有基本統計數據
 */
export function calculateStats(stats: BattingStats): CalculatedStats {
  const avg = calculateBattingAvg(stats.hits, stats.ab);
  const obp = calculateOBP(stats.hits, stats.bb, 0, stats.ab, stats.sf);
  const slg = calculateSLG(stats.totalBases, stats.ab);
  const ops = calculateOPS(obp, slg);

  return {
    avg,
    obp,
    slg,
    ops,
    iso: calculateISO(slg, avg),
    babip: calculateBABIP(stats.hits, stats.hr, stats.ab, stats.so),
    kPct: calculateKPct(stats.so, stats.pa),
    bbPct: calculateBBPct(stats.bb, stats.pa),
  };
}
```

**Step 3: 進階統計 - OPS+, wOBA (可選)**

```typescript
// src/lib/__tests__/advancedStats.test.ts

import { describe, it, expect } from 'vitest';
import { calculateOPSPlus, calculateWOBA } from '../advancedStats';
import type { BattingStats, LeagueStats } from '@/types';

describe('advancedStats', () => {
  const mockLeagueStats: LeagueStats = {
    year: 2025,
    avgBattingAvg: 0.250,
    avgOBP: 0.320,
    avgSLG: 0.400,
    avgOPS: 0.720,
    totalPA: 10000,
    totalAB: 8000,
    wOBAScale: 1.20,
    wOBAWeights: {
      BB: 0.69,
      HBP: 0.72,
      '1B': 0.88,
      '2B': 1.24,
      '3B': 1.56,
      HR: 1.95,
    },
  };

  describe('calculateOPSPlus', () => {
    it('OPS 等於聯盟平均時應該返回 100', () => {
      expect(calculateOPSPlus(0.720, mockLeagueStats.avgOPS)).toBe(100);
    });

    it('OPS 高於聯盟平均時應該大於 100', () => {
      expect(calculateOPSPlus(0.900, mockLeagueStats.avgOPS)).toBeGreaterThan(100);
    });

    it('OPS 低於聯盟平均時應該小於 100', () => {
      expect(calculateOPSPlus(0.600, mockLeagueStats.avgOPS)).toBeLessThan(100);
    });
  });

  describe('calculateWOBA', () => {
    it('應該根據加權計算 wOBA', () => {
      const stats: BattingStats = {
        games: 10,
        pa: 45,
        ab: 40,
        hits: 12,
        singles: 8,
        doubles: 3,
        triples: 0,
        hr: 1,
        rbi: 8,
        runs: 7,
        bb: 4,
        so: 8,
        sb: 2,
        sf: 1,
        totalBases: 18,
      };

      const result = calculateWOBA(stats, mockLeagueStats.wOBAWeights);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });
  });
});
```

```typescript
// src/lib/advancedStats.ts

import type { BattingStats, LeagueStats } from '@/types';

/**
 * 計算 OPS+
 * 公式: (球員 OPS / 聯盟平均 OPS) × 100
 */
export function calculateOPSPlus(playerOPS: number, leagueAvgOPS: number): number {
  if (leagueAvgOPS === 0) return 0;
  return Math.round((playerOPS / leagueAvgOPS) * 100);
}

/**
 * 計算 wOBA (Weighted On-Base Average)
 */
export function calculateWOBA(
  stats: BattingStats,
  weights: LeagueStats['wOBAWeights']
): number {
  const numerator =
    weights.BB * stats.bb +
    weights['1B'] * stats.singles +
    weights['2B'] * stats.doubles +
    weights['3B'] * stats.triples +
    weights.HR * stats.hr;

  const denominator = stats.ab + stats.bb + stats.sf;

  if (denominator === 0) return 0;

  return Math.round((numerator / denominator) * 1000) / 1000;
}
```

### 資料載入器 (dataLoader.ts)

```typescript
// src/lib/__tests__/dataLoader.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadTeams, loadSeasonSummary, loadPlayer } from '../dataLoader';

// Mock fetch
global.fetch = vi.fn();

describe('dataLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadTeams', () => {
    it('應該載入球團列表', async () => {
      const mockTeams = {
        teams: [
          { id: 'phoenix', name: '飛尼克斯', code: 'PHE' },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTeams,
      });

      const result = await loadTeams();

      expect(global.fetch).toHaveBeenCalledWith('/data/teams.json');
      expect(result).toEqual(mockTeams.teams);
    });

    it('載入失敗時應該拋出錯誤', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(loadTeams()).rejects.toThrow('Failed to load teams');
    });
  });

  describe('loadSeasonSummary', () => {
    it('應該載入指定年度的摘要', async () => {
      const mockSummary = {
        year: 2025,
        teams: {
          phoenix: { players: [] },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      });

      const result = await loadSeasonSummary(2025);

      expect(global.fetch).toHaveBeenCalledWith('/data/seasons/2025_summary.json');
      expect(result.year).toBe(2025);
    });
  });

  describe('loadPlayer', () => {
    it('應該載入球員詳細資料', async () => {
      const mockPlayer = {
        id: 'COL064',
        name: '陳重任',
        seasons: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlayer,
      });

      const result = await loadPlayer('COL064');

      expect(global.fetch).toHaveBeenCalledWith('/data/players/COL064.json');
      expect(result.name).toBe('陳重任');
    });
  });
});
```

```typescript
// src/lib/dataLoader.ts

import type { Team, SeasonSummary, Player } from '@/types';

/**
 * 載入球團列表
 */
export async function loadTeams(): Promise<Team[]> {
  const response = await fetch('/data/teams.json');

  if (!response.ok) {
    throw new Error('Failed to load teams');
  }

  const data = await response.json();
  return data.teams;
}

/**
 * 載入指定年度摘要
 */
export async function loadSeasonSummary(year: number): Promise<SeasonSummary> {
  const response = await fetch(`/data/seasons/${year}_summary.json`);

  if (!response.ok) {
    throw new Error(`Failed to load season ${year}`);
  }

  return response.json();
}

/**
 * 載入球員詳細資料
 */
export async function loadPlayer(playerId: string): Promise<Player> {
  const response = await fetch(`/data/players/${playerId}.json`);

  if (!response.ok) {
    throw new Error(`Failed to load player ${playerId}`);
  }

  return response.json();
}

/**
 * 載入球團球員列表
 */
export async function loadTeamPlayers(teamId: string, year: number = 2025) {
  const summary = await loadSeasonSummary(year);
  const teamData = summary.teams[teamId];

  if (!teamData) {
    throw new Error(`Team ${teamId} not found`);
  }

  return teamData.players;
}
```

### 格式化工具 (formatters.ts)

```typescript
// src/lib/__tests__/formatters.test.ts

import { describe, it, expect } from 'vitest';
import { formatAvg, formatNumber, formatPercentage } from '../formatters';

describe('formatters', () => {
  describe('formatAvg', () => {
    it('應該格式化打擊率', () => {
      expect(formatAvg(0.285)).toBe('.285');
      expect(formatAvg(0.3)).toBe('.300');
      expect(formatAvg(1.0)).toBe('1.000');
    });

    it('應該處理邊界值', () => {
      expect(formatAvg(0)).toBe('.000');
      expect(formatAvg(0.9999)).toBe('.999');
    });
  });

  describe('formatNumber', () => {
    it('應該格式化數字加千分位', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
    });
  });

  describe('formatPercentage', () => {
    it('應該格式化百分比', () => {
      expect(formatPercentage(15.789)).toBe('15.8%');
      expect(formatPercentage(100)).toBe('100.0%');
    });
  });
});
```

```typescript
// src/lib/formatters.ts

/**
 * 格式化打擊率（顯示前導點）
 */
export function formatAvg(avg: number): string {
  return avg.toFixed(3);
}

/**
 * 格式化數字（加千分位）
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * 格式化百分比
 */
export function formatPercentage(pct: number, decimals: number = 1): string {
  return `${pct.toFixed(decimals)}%`;
}

/**
 * 格式化排名（加 # 符號）
 */
export function formatRanking(rank: number): string {
  return `#${rank}`;
}
```

---

## ViewModel Layer - Custom Hooks {#viewmodel-layer}

### usePlayerList (球員列表邏輯)

```typescript
// src/hooks/__tests__/usePlayerList.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePlayerList } from '../usePlayerList';
import * as dataLoader from '@/lib/dataLoader';

vi.mock('@/lib/dataLoader');

describe('usePlayerList', () => {
  const mockPlayers = [
    { id: '1', name: '陳重任', seasonStats: { avg: 0.125 } },
    { id: '2', name: '林坤泰', seasonStats: { avg: 0.571 } },
    { id: '3', name: '孔睦驊', seasonStats: { avg: 0.306 } },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(dataLoader, 'loadTeamPlayers').mockResolvedValue(mockPlayers as any);
  });

  it('應該載入球員列表', async () => {
    const { result } = renderHook(() => usePlayerList('phoenix'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.players).toHaveLength(3);
  });

  it('載入失敗時應該設定錯誤', async () => {
    vi.spyOn(dataLoader, 'loadTeamPlayers').mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => usePlayerList('phoenix'));

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });
});
```

```typescript
// src/hooks/usePlayerList.ts

import { useState, useEffect } from 'react';
import { loadTeamPlayers } from '@/lib/dataLoader';
import type { PlayerSummary } from '@/types';

interface UsePlayerListResult {
  players: PlayerSummary[];
  loading: boolean;
  error: string | null;
}

export function usePlayerList(teamId: string, year: number = 2025): UsePlayerListResult {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPlayers() {
      try {
        setLoading(true);
        setError(null);

        const data = await loadTeamPlayers(teamId, year);

        if (!cancelled) {
          setPlayers(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPlayers();

    return () => {
      cancelled = true;
    };
  }, [teamId, year]);

  return { players, loading, error };
}
```

### usePlayerSearch (搜尋邏輯)

```typescript
// src/hooks/__tests__/usePlayerSearch.test.ts

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePlayerSearch } from '../usePlayerSearch';

describe('usePlayerSearch', () => {
  const mockPlayers = [
    { id: '1', name: '陳重任', number: '0' },
    { id: '2', name: '林坤泰', number: '1' },
    { id: '3', name: '孔睦驊', number: '2' },
  ];

  it('初始狀態應該返回所有球員', () => {
    const { result } = renderHook(() => usePlayerSearch(mockPlayers as any));

    expect(result.current.filteredPlayers).toHaveLength(3);
  });

  it('應該根據姓名過濾球員', async () => {
    const { result } = renderHook(() => usePlayerSearch(mockPlayers as any));

    act(() => {
      result.current.setSearchTerm('陳');
    });

    await waitFor(
      () => {
        expect(result.current.filteredPlayers).toHaveLength(1);
        expect(result.current.filteredPlayers[0].name).toBe('陳重任');
      },
      { timeout: 500 }
    );
  });

  it('應該根據背號過濾球員', async () => {
    const { result } = renderHook(() => usePlayerSearch(mockPlayers as any));

    act(() => {
      result.current.setSearchTerm('1');
    });

    await waitFor(
      () => {
        expect(result.current.filteredPlayers).toHaveLength(1);
        expect(result.current.filteredPlayers[0].number).toBe('1');
      },
      { timeout: 500 }
    );
  });

  it('搜尋詞清空時應該返回所有球員', async () => {
    const { result } = renderHook(() => usePlayerSearch(mockPlayers as any));

    act(() => {
      result.current.setSearchTerm('陳');
    });

    await waitFor(() => {
      expect(result.current.filteredPlayers).toHaveLength(1);
    });

    act(() => {
      result.current.setSearchTerm('');
    });

    await waitFor(() => {
      expect(result.current.filteredPlayers).toHaveLength(3);
    });
  });
});
```

```typescript
// src/hooks/usePlayerSearch.ts

import { useState, useMemo } from 'react';
import { useDebounce } from 'ahooks';
import type { PlayerSummary } from '@/types';

interface UsePlayerSearchResult {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredPlayers: PlayerSummary[];
}

export function usePlayerSearch(players: PlayerSummary[]): UsePlayerSearchResult {
  const [searchTerm, setSearchTerm] = useState('');

  // 防抖，避免每次輸入都觸發過濾
  const debouncedSearch = useDebounce(searchTerm, { wait: 300 });

  const filteredPlayers = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return players;
    }

    const term = debouncedSearch.toLowerCase();

    return players.filter(
      (player) =>
        player.name.toLowerCase().includes(term) ||
        player.number.includes(term)
    );
  }, [players, debouncedSearch]);

  return {
    searchTerm,
    setSearchTerm,
    filteredPlayers,
  };
}
```

### usePlayerModal (Modal 狀態管理)

```typescript
// src/hooks/__tests__/usePlayerModal.test.ts

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePlayerModal } from '../usePlayerModal';
import * as dataLoader from '@/lib/dataLoader';

vi.mock('@/lib/dataLoader');

describe('usePlayerModal', () => {
  const mockPlayer = {
    id: 'COL064',
    name: '陳重任',
    seasons: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(dataLoader, 'loadPlayer').mockResolvedValue(mockPlayer as any);
  });

  it('初始狀態應該是關閉的', () => {
    const { result } = renderHook(() => usePlayerModal());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.player).toBeNull();
  });

  it('openModal 應該載入並顯示球員資料', async () => {
    const { result } = renderHook(() => usePlayerModal());

    await act(async () => {
      await result.current.openModal('COL064');
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.player).toEqual(mockPlayer);
    expect(result.current.loading).toBe(false);
  });

  it('closeModal 應該清空球員資料', async () => {
    const { result } = renderHook(() => usePlayerModal());

    await act(async () => {
      await result.current.openModal('COL064');
    });

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.player).toBeNull();
  });

  it('載入失敗時應該設定錯誤', async () => {
    vi.spyOn(dataLoader, 'loadPlayer').mockRejectedValue(
      new Error('Player not found')
    );

    const { result } = renderHook(() => usePlayerModal());

    await act(async () => {
      await result.current.openModal('INVALID');
    });

    expect(result.current.error).toBe('Player not found');
    expect(result.current.isOpen).toBe(false);
  });
});
```

```typescript
// src/hooks/usePlayerModal.ts

import { useState } from 'react';
import { loadPlayer } from '@/lib/dataLoader';
import type { Player } from '@/types';

interface UsePlayerModalResult {
  isOpen: boolean;
  player: Player | null;
  loading: boolean;
  error: string | null;
  openModal: (playerId: string) => Promise<void>;
  closeModal: () => void;
}

export function usePlayerModal(): UsePlayerModalResult {
  const [isOpen, setIsOpen] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = async (playerId: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await loadPlayer(playerId);

      setPlayer(data);
      setIsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setPlayer(null);
    setError(null);
  };

  return {
    isOpen,
    player,
    loading,
    error,
    openModal,
    closeModal,
  };
}
```

---

## View Layer - React 組件 {#view-layer}

### PlayerCard 組件

```typescript
// src/components/__tests__/PlayerCard.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlayerCard } from '../PlayerCard';
import type { PlayerSummary } from '@/types';

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
      iso: 0.0,
      babip: 0.286,
      kPct: 36.84,
      bbPct: 15.79,
    },
    rankings: {
      avg: 422,
      hr: 1304,
    },
  };

  it('應該顯示球員基本資訊', () => {
    render(<PlayerCard player={mockPlayer} />);

    expect(screen.getByText('陳重任')).toBeInTheDocument();
    expect(screen.getByText('#0')).toBeInTheDocument();
  });

  it('應該顯示球員統計數據', () => {
    render(<PlayerCard player={mockPlayer} />);

    expect(screen.getByText('AVG')).toBeInTheDocument();
    expect(screen.getByText('.125')).toBeInTheDocument();
  });

  it('點擊卡片應該觸發 onClick', () => {
    const handleClick = vi.fn();
    render(<PlayerCard player={mockPlayer} onClick={handleClick} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledWith(mockPlayer);
  });
});
```

```typescript
// src/components/PlayerCard.tsx

import Image from 'next/image';
import { formatAvg } from '@/lib/formatters';
import type { PlayerSummary } from '@/types';

interface PlayerCardProps {
  player: PlayerSummary;
  onClick?: (player: PlayerSummary) => void;
}

export function PlayerCard({ player, onClick }: PlayerCardProps) {
  return (
    <button
      onClick={() => onClick?.(player)}
      className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md hover:border-primary-500"
    >
      <div className="flex items-start gap-3">
        {/* 球員照片 */}
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
          <Image
            src={player.photo || '/default-avatar.png'}
            alt={player.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>

        {/* 球員資訊 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {player.name}
            </h3>
            <span className="text-sm text-gray-500">#{player.number}</span>
          </div>

          {/* 統計數據 */}
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs text-gray-500">AVG</div>
              <div className="font-semibold text-gray-900">
                {formatAvg(player.seasonStats.avg)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">HR</div>
              <div className="font-semibold text-gray-900">
                {player.seasonStats.hr}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">RBI</div>
              <div className="font-semibold text-gray-900">
                {player.seasonStats.rbi}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-primary-600 font-medium">
        查看詳細資料 →
      </div>
    </button>
  );
}
```

### SearchBar 組件

```typescript
// src/components/SearchBar.tsx

import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = '搜尋球員姓名或背號...',
}: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
    </div>
  );
}
```

---

## Next.js 14 最佳實踐 {#nextjs-14}

### Server Components vs Client Components

```typescript
// app/teams/[teamId]/page.tsx
// Server Component - 用於資料載入

import { Suspense } from 'react';
import { TeamPageContent } from './TeamPageContent';

export default function TeamPage({
  params,
}: {
  params: { teamId: string };
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamPageContent teamId={params.teamId} />
    </Suspense>
  );
}
```

```typescript
// app/teams/[teamId]/TeamPageContent.tsx
// Client Component - 用於互動

'use client';

import { usePlayerList } from '@/hooks/usePlayerList';
import { usePlayerSearch } from '@/hooks/usePlayerSearch';
import { usePlayerModal } from '@/hooks/usePlayerModal';
import { PlayerCard } from '@/components/PlayerCard';
import { SearchBar } from '@/components/SearchBar';
import { PlayerModal } from '@/components/PlayerModal';

export function TeamPageContent({ teamId }: { teamId: string }) {
  const { players, loading, error } = usePlayerList(teamId);
  const { searchTerm, setSearchTerm, filteredPlayers } = usePlayerSearch(players);
  const { isOpen, player, openModal, closeModal } = usePlayerModal();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <SearchBar value={searchTerm} onChange={setSearchTerm} />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPlayers.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onClick={() => openModal(player.id)}
          />
        ))}
      </div>

      {isOpen && player && (
        <PlayerModal player={player} onClose={closeModal} />
      )}
    </div>
  );
}
```

### Metadata API

```typescript
// app/teams/[teamId]/page.tsx

import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { teamId: string };
}): Promise<Metadata> {
  // 載入球團資料
  const team = await loadTeam(params.teamId);

  return {
    title: `${team.name} - 球員名單 | 棒球聯盟統計`,
    description: `查看 ${team.name} 的球員名單與統計數據`,
  };
}
```

---

## Tailwind CSS 使用指南 {#tailwind-css}

### 響應式設計

```tsx
<div className="
  grid 
  grid-cols-1      /* 手機：1 欄 */
  sm:grid-cols-2   /* 平板：2 欄 */
  lg:grid-cols-3   /* 桌面：3 欄 */
  gap-4
">
  {/* 內容 */}
</div>
```

### 常用 Utility Classes

```tsx
/* 間距 */
p-4              /* padding: 1rem */
mt-6             /* margin-top: 1.5rem */
gap-4            /* gap: 1rem */

/* 文字 */
text-sm          /* font-size: 0.875rem */
font-semibold    /* font-weight: 600 */
text-gray-900    /* color: gray-900 */

/* 佈局 */
flex             /* display: flex */
items-center     /* align-items: center */
justify-between  /* justify-content: space-between */

/* 邊框 */
rounded-lg       /* border-radius: 0.5rem */
border           /* border-width: 1px */
border-gray-200  /* border-color: gray-200 */

/* 陰影 */
shadow-sm        /* box-shadow: small */
hover:shadow-md  /* hover 時增加陰影 */

/* 過渡 */
transition-all   /* transition: all */
hover:scale-105  /* hover 時放大 */
```

---

## ahooks 使用模式 {#ahooks}

### useRequest - 資料請求

```typescript
import { useRequest } from 'ahooks';
import { loadTeamPlayers } from '@/lib/dataLoader';

export function usePlayerList(teamId: string) {
  const { data, loading, error, run } = useRequest(
    () => loadTeamPlayers(teamId),
    {
      manual: false, // 自動執行
      refreshDeps: [teamId], // teamId 變化時重新請求
    }
  );

  return {
    players: data || [],
    loading,
    error: error?.message,
    refetch: run,
  };
}
```

### useDebounce - 搜尋防抖

```typescript
import { useDebounce } from 'ahooks';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, { wait: 300 });
```

### useLocalStorageState - 持久化狀態

```typescript
import { useLocalStorageState } from 'ahooks';

export function usePlayerFilters() {
  const [filters, setFilters] = useLocalStorageState('player-filters', {
    defaultValue: {
      sortBy: 'avg',
      order: 'desc',
    },
  });

  return { filters, setFilters };
}
```

---

## TDD 實施指南 {#tdd}

### TDD 循環

```
1. 🔴 Red - 寫一個失敗的測試
   ↓
2. 🟢 Green - 用最簡單的方式讓測試通過
   ↓
3. 🔵 Refactor - 重構代碼，保持測試通過
   ↓
   回到步驟 1
```

### 測試金字塔

```
E2E Tests (5%)        - Playwright
Integration Tests (15%) - Testing Library
Unit Tests (80%)      - Vitest
```

### 最佳實踐

1. **一次只測一個行為**
2. **測試「做什麼」而非「怎麼做」**
3. **避免測試實作細節**
4. **保持測試獨立**
5. **使用有意義的測試名稱**

---

## 效能優化 {#performance}

### 圖片優化

```tsx
import Image from 'next/image';

<Image
  src={player.photo}
  alt={player.name}
  width={64}
  height={64}
  sizes="64px"
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,..."
/>
```

### 代碼分割

```typescript
import dynamic from 'next/dynamic';

const PlayerModal = dynamic(() => import('@/components/PlayerModal'), {
  loading: () => <div>Loading...</div>,
});
```

### 資料快取

```typescript
// Next.js 自動快取
export const revalidate = 3600; // 1 小時
```

---

## 程式碼品質標準 {#code-quality}

### 函數複雜度限制

- 單一函數最多 50 行
- Cyclomatic Complexity < 10
- 參數最多 3 個

### 測試覆蓋率目標

- Model Layer: 95%
- ViewModel Layer: 85%
- View Layer: 70%
- Overall: 80%

### 命名規範

```typescript
// 函數：動詞開頭
calculateAvg()
loadPlayer()
formatNumber()

// 布林值：is/has/should 開頭
isLoading
hasError
shouldShow

// Hook：use 開頭
usePlayerList()
usePlayerSearch()

// 組件：PascalCase
PlayerCard
SearchBar
```

---

## 結論

本指南提供了開發本專案所需的核心技能和最佳實踐。記住：

1. **YAGNI** - 只實作需要的功能
2. **KISS** - 保持簡單
3. **TDD** - 測試驅動開發
4. **Rule of Three** - 重複三次才抽象

遵循這些原則，可以寫出乾淨、可維護、可測試的程式碼。

---

## 賽程資料產生指引 {#schedule-generation}

當使用者說「利用以下資訊幫我產生本月賽程資料」時，根據提供的原始賽程文字自動產生對應的 JSON 檔案。

### 觸發條件

使用者提供類似以下格式的賽程資訊：

```
2026/2/7
中正A
No.95 世新超乙組 VS 華江OB--中正A--中午(12:00~14:30)
No.99 台大醫學院棒 VS 莫拉克--中正A--下午(14:30~17:00)

2026/2/21
新年快樂!
```

### 需要產生的檔案

| 檔案 | 路徑 | 用途 |
|------|------|------|
| 月賽程 | `public/data/schedules/YYYY-MM.json` | 賽程表顯示 |
| 戰報索引 | `public/data/game-reports/index.json` | 戰報連結 |

### 解析規則

#### 1. 日期解析

```
2026/2/7 → "2026-02-07"
2026/2/14 → "2026-02-14"
```

#### 2. 比賽資訊解析

```
No.95 世新超乙組 VS 華江OB--中正A--中午(12:00~14:30)
```

解析為：
- `gameNumber`: `"202595"` (賽季年度 2025 + 場次 95)
- `homeTeam`: `"世新超乙組"` (VS 前面的隊伍)
- `awayTeam`: `"華江OB"` (VS 後面的隊伍)
- `venue`: `"中正A"`
- `timeSlot`: `"中午"`
- `startTime`: `"12:00"`
- `endTime`: `"14:30"`

#### 3. gameNumber 轉換規則

```
賽季年度 (從 schedule.season 取得，通常是日曆年-1) + 場次編號

No.95  → 202595   (2025 賽季)
No.201 → 2025201  (2025 賽季)
```

#### 4. 時段判斷

| 時間範圍 | 時段 |
|----------|------|
| 08:00~11:00 | 上午 |
| 10:30~13:00 | 中午 |
| 11:00~14:00 | 中午 |
| 12:00~14:30 | 中午 |
| 14:00~17:00 | 下午 |
| 14:30~17:00 | 下午 |

#### 5. 備註處理

- 比賽備註：`*開賽時間暫定` → `note: "開賽時間暫定"`
- 當日備註：`新年快樂!` (無比賽) → `note: "新年快樂！"`

### 產出範本

#### 月賽程檔案 (schedules/YYYY-MM.json)

```json
{
  "schedule": {
    "year": 2026,
    "month": 2,
    "season": 2025,
    "days": [
      {
        "date": "2026-02-07",
        "venues": {
          "中正A": [
            {
              "gameNumber": "202595",
              "homeTeam": "世新超乙組",
              "awayTeam": "華江OB",
              "venue": "中正A",
              "timeSlot": "中午",
              "startTime": "12:00",
              "endTime": "14:30",
              "note": "開賽時間暫定，待確認場地後調整"
            }
          ]
        }
      },
      {
        "date": "2026-02-21",
        "venues": {},
        "note": "新年快樂！"
      }
    ]
  },
  "meta": {
    "lastUpdated": "2026-01-28T00:00:00Z",
    "totalGames": 11,
    "venues": ["中正A", "清溪", "三鶯B"]
  }
}
```

#### 戰報索引更新 (game-reports/index.json)

在 `games` 物件中新增每場比賽：

```json
{
  "games": {
    "202595": {
      "sheetId": "",
      "date": "2026-02-07",
      "homeTeam": "世新超乙組",
      "awayTeam": "華江OB",
      "venue": "中正A"
    }
  }
}
```

### 隊伍名稱對照

參考 `public/data/all_teams.json` 確保隊伍名稱正確：

| 常見輸入 | 正確名稱 |
|----------|----------|
| 飛尼克斯 | 飛尼克斯 |
| 華江OB | 華江OB |
| 台大醫學院棒 | 台大醫學院棒 |
| Mechanics | Mechanics |
| HOLYBAT | HOLYBAT |
| ACES | ACES |
| DH戰將 | DH戰將 |

### 執行步驟

1. **解析原始資料**
   - 識別日期、場地、比賽資訊
   - 轉換 gameNumber 格式
   - 識別備註文字

2. **產生 schedules/YYYY-MM.json**
   - 建立完整的月賽程結構
   - 計算 totalGames 和 venues

3. **更新 game-reports/index.json**
   - 新增每場比賽的基本資訊
   - sheetId 留空 `""`

4. **驗證 JSON 格式**
   ```bash
   cat public/data/schedules/2026-02.json | python3 -m json.tool > /dev/null
   cat public/data/game-reports/index.json | python3 -m json.tool > /dev/null
   ```

### 範例對話

**使用者輸入：**
```
利用以下資訊幫我產生本月賽程資料

2026/3/1
中正A
No.100 火把老鷹 VS 飛尼克斯--中正A--中午(12:00~14:30)
```

**Claude 執行：**
1. 建立 `public/data/schedules/2026-03.json`
2. 更新 `public/data/game-reports/index.json` 新增 `"2025100"` 條目
3. 驗證 JSON 格式
4. 回報完成摘要

### 相關文件

- [賽程更新指南](docs/SCHEDULE_UPDATE_GUIDE.md) - 完整操作說明
- [賽程功能說明](docs/SCHEDULE_FEATURE.md) - UI 與元件說明
- [戰報 API 文件](docs/api/game-reports.md) - API 格式說明
