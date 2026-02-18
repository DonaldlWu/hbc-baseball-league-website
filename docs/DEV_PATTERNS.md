# 開發模式參考 - 棒球聯盟統計網站

本文件提供開發本專案所需的技術參考、程式碼範例與最佳實踐。

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
        games: 0, pa: 0, ab: 0, hits: 0, singles: 0,
        doubles: 0, triples: 0, hr: 0, rbi: 0, runs: 0,
        bb: 0, so: 0, sb: 0, sf: 0, totalBases: 0,
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

function roundToDecimals(value: number, decimals: number = 3): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

export function calculateBattingAvg(hits: number, atBats: number): number {
  if (atBats === 0) return 0;
  return roundToDecimals(hits / atBats);
}

export function calculateOBP(
  hits: number, walks: number, hbp: number, atBats: number, sf: number
): number {
  const denominator = atBats + walks + hbp + sf;
  if (denominator === 0) return 0;
  return roundToDecimals((hits + walks + hbp) / denominator);
}

export function calculateSLG(totalBases: number, atBats: number): number {
  if (atBats === 0) return 0;
  return roundToDecimals(totalBases / atBats);
}

export function calculateOPS(obp: number, slg: number): number {
  return roundToDecimals(obp + slg);
}

export function calculateISO(slg: number, avg: number): number {
  return roundToDecimals(slg - avg);
}

export function calculateBABIP(
  hits: number, homeRuns: number, atBats: number, strikeouts: number
): number {
  const denominator = atBats - strikeouts - homeRuns;
  if (denominator <= 0) return 0;
  return roundToDecimals((hits - homeRuns) / denominator);
}

export function calculateKPct(strikeouts: number, plateAppearances: number): number {
  if (plateAppearances === 0) return 0;
  return roundToDecimals((strikeouts / plateAppearances) * 100, 2);
}

export function calculateBBPct(walks: number, plateAppearances: number): number {
  if (plateAppearances === 0) return 0;
  return roundToDecimals((walks / plateAppearances) * 100, 2);
}

export function calculateStats(stats: BattingStats): CalculatedStats {
  const avg = calculateBattingAvg(stats.hits, stats.ab);
  const obp = calculateOBP(stats.hits, stats.bb, 0, stats.ab, stats.sf);
  const slg = calculateSLG(stats.totalBases, stats.ab);
  const ops = calculateOPS(obp, slg);

  return {
    avg, obp, slg, ops,
    iso: calculateISO(slg, avg),
    babip: calculateBABIP(stats.hits, stats.hr, stats.ab, stats.so),
    kPct: calculateKPct(stats.so, stats.pa),
    bbPct: calculateBBPct(stats.bb, stats.pa),
  };
}
```

**Step 3: 進階統計 - OPS+, wOBA (可選)**

```typescript
// src/lib/advancedStats.ts

import type { BattingStats, LeagueStats } from '@/types';

export function calculateOPSPlus(playerOPS: number, leagueAvgOPS: number): number {
  if (leagueAvgOPS === 0) return 0;
  return Math.round((playerOPS / leagueAvgOPS) * 100);
}

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

### 格式化工具 (formatters.ts)

```typescript
// src/lib/formatters.ts

export function formatAvg(avg: number): string {
  return avg.toFixed(3);
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export function formatPercentage(pct: number, decimals: number = 1): string {
  return `${pct.toFixed(decimals)}%`;
}

export function formatRanking(rank: number): string {
  return `#${rank}`;
}
```

---

## ViewModel Layer - Custom Hooks {#viewmodel-layer}

### usePlayerList (球員列表邏輯)

```typescript
// src/hooks/usePlayerList.ts

import { useState, useEffect } from 'react';
import { loadTeamPlayers } from '@/lib/dataLoader';
import type { PlayerSummary } from '@/types';

export function usePlayerList(teamId: string, year: number = 2025) {
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
        if (!cancelled) setPlayers(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPlayers();
    return () => { cancelled = true; };
  }, [teamId, year]);

  return { players, loading, error };
}
```

### usePlayerSearch (搜尋邏輯)

```typescript
// src/hooks/usePlayerSearch.ts

import { useState, useMemo } from 'react';
import { useDebounce } from 'ahooks';
import type { PlayerSummary } from '@/types';

export function usePlayerSearch(players: PlayerSummary[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, { wait: 300 });

  const filteredPlayers = useMemo(() => {
    if (!debouncedSearch.trim()) return players;
    const term = debouncedSearch.toLowerCase();
    return players.filter(
      (p) => p.name.toLowerCase().includes(term) || p.number.includes(term)
    );
  }, [players, debouncedSearch]);

  return { searchTerm, setSearchTerm, filteredPlayers };
}
```

### usePlayerModal (Modal 狀態管理)

```typescript
// src/hooks/usePlayerModal.ts

import { useState } from 'react';
import { loadPlayer } from '@/lib/dataLoader';
import type { Player } from '@/types';

export function usePlayerModal() {
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

  return { isOpen, player, loading, error, openModal, closeModal };
}
```

---

## View Layer - React 組件 {#view-layer}

### PlayerCard 組件

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
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
          <Image
            src={player.photo || '/default-avatar.png'}
            alt={player.name}
            fill className="object-cover" sizes="64px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{player.name}</h3>
            <span className="text-sm text-gray-500">#{player.number}</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs text-gray-500">AVG</div>
              <div className="font-semibold">{formatAvg(player.seasonStats.avg)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">HR</div>
              <div className="font-semibold">{player.seasonStats.hr}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">RBI</div>
              <div className="font-semibold">{player.seasonStats.rbi}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-primary-600 font-medium">查看詳細資料 →</div>
    </button>
  );
}
```

### 頁面組裝模式（Server + Client）

```typescript
// app/teams/[teamId]/page.tsx（Server Component）
import { Suspense } from 'react';
import { TeamPageContent } from './TeamPageContent';

export default function TeamPage({ params }: { params: { teamId: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamPageContent teamId={params.teamId} />
    </Suspense>
  );
}
```

```typescript
// app/teams/[teamId]/TeamPageContent.tsx（Client Component）
'use client';

import { usePlayerList } from '@/hooks/usePlayerList';
import { usePlayerSearch } from '@/hooks/usePlayerSearch';
import { usePlayerModal } from '@/hooks/usePlayerModal';
import { PlayerCard } from '@/components/PlayerCard';

export function TeamPageContent({ teamId }: { teamId: string }) {
  const { players, loading, error } = usePlayerList(teamId);
  const { searchTerm, setSearchTerm, filteredPlayers } = usePlayerSearch(players);
  const { isOpen, player, openModal, closeModal } = usePlayerModal();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPlayers.map((p) => (
          <PlayerCard key={p.id} player={p} onClick={() => openModal(p.id)} />
        ))}
      </div>
    </div>
  );
}
```

---

## Next.js 14 最佳實踐 {#nextjs-14}

- **Server Components** 用於靜態資料載入；**Client Components** 用於互動
- `'use client'` 只在真正需要 state/effect 的元件加
- Metadata API：在 page.tsx 用 `generateMetadata()` 設定 SEO

---

## Tailwind CSS 使用指南 {#tailwind-css}

### 響應式設計

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

### 常用模式

```
間距：p-4, mt-6, gap-4
文字：text-sm, font-semibold, text-gray-900
佈局：flex, items-center, justify-between
邊框：rounded-lg, border, border-gray-200
互動：hover:shadow-md, transition-all, cursor-pointer
```

---

## ahooks 使用模式 {#ahooks}

```typescript
// useRequest - 資料請求
const { data, loading, error } = useRequest(() => loadTeamPlayers(teamId), {
  refreshDeps: [teamId],
});

// useDebounce - 搜尋防抖
const debouncedSearch = useDebounce(searchTerm, { wait: 300 });

// useLocalStorageState - 持久化狀態
const [filters, setFilters] = useLocalStorageState('player-filters', {
  defaultValue: { sortBy: 'avg', order: 'desc' },
});
```

---

## TDD 實施指南 {#tdd}

### 循環

```
🔴 Red   → 寫一個失敗的測試
🟢 Green → 用最簡單的方式讓測試通過
🔵 Refactor → 重構，保持測試通過
```

### 測試金字塔

```
E2E (5%)          - Playwright
Integration (15%) - Testing Library
Unit (80%)        - Vitest
```

### 原則

1. 一次只測一個行為
2. 測試「做什麼」而非「怎麼做」
3. 避免測試實作細節
4. 保持測試獨立

---

## 效能優化 {#performance}

```typescript
// 圖片優化
<Image src={player.photo} alt={player.name} fill sizes="64px" />

// 代碼分割
const PlayerModal = dynamic(() => import('@/components/PlayerModal'));

// 資料快取
export const revalidate = 3600; // 1 小時
```

---

## 程式碼品質標準 {#code-quality}

| 項目 | 標準 |
|------|------|
| 單一函數行數 | ≤ 50 行 |
| Cyclomatic Complexity | < 10 |
| 函數參數 | ≤ 3 個 |
| Model Layer 測試覆蓋率 | 95% |
| ViewModel Layer 測試覆蓋率 | 85% |
| View Layer 測試覆蓋率 | 70% |
| 整體測試覆蓋率 | 80% |

### 命名規範

```typescript
// 函數：動詞開頭
calculateAvg(), loadPlayer(), formatNumber()

// 布林值：is/has/should 開頭
isLoading, hasError, shouldShow

// Hook：use 開頭
usePlayerList(), usePlayerSearch()

// 組件：PascalCase
PlayerCard, SearchBar
```
