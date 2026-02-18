# 棒球聯盟統計網站 (Baseball League Stats)

## 專案概述

建立一個展示棒球聯盟球員統計資料的網站，以球團為中心，提供球員資料查詢、統計排行榜、數據視覺化等功能。

**核心特色：**
- 🏟️ 球團頁面：展示球團資訊與該隊球員列表
- 👤 球員 Modal：點擊球員顯示完整生涯資料
- 📊 統計排行榜：各項數據排名
- 📈 數據視覺化：圖表展示球員表現
- 📱 響應式設計：支援桌面與手機

## 技術架構

### 核心技術
- **框架：** Next.js 14 (App Router)
- **UI：** React 18 + TypeScript
- **樣式：** Tailwind CSS
- **狀態管理：** ahooks
- **圖表：** Recharts
- **測試：** Vitest + Testing Library + Playwright
- **部署：** Vercel

### 資料架構
- **資料來源：** 靜態 JSON 檔案（從 CSV 轉換）
- **未來擴展：** 可遷移至 API + 資料庫

### 設計模式
- **整體架構：** MVVM (精簡版)
- **程式碼組織：** Feature-Sliced Design (簡化)
- **開發原則：** YAGNI + KISS + TDD

## 開發準則 ⭐ 重要

### 核心原則

1. **版本管理與相容性**
   - ⚠️ **安裝任何套件前必須先檢查：**
     - 是否有更新的穩定版本
     - 各套件之間的相容性
     - Node.js 版本需求（建議使用最新 LTS 版本）
   - 使用 `npm outdated` 檢查過時套件
   - 查閱套件官方文件確認版本相容性
   - 記錄所有主要依賴的版本號

2. **YAGNI (You Aren't Gonna Need It)**
   - 只實作當下需要的功能
   - 不預測未來需求
   - 刪除所有「just in case」的程式碼

3. **KISS (Keep It Simple, Stupid)**
   - 從最簡單的方案開始
   - 避免過早抽象
   - 優先使用函數而非類別

4. **Rule of Three**
   - 第 1 次：直接寫
   - 第 2 次：複製貼上
   - 第 3 次：才抽象化

5. **TDD (Test-Driven Development)**
   - Red → Green → Refactor
   - 測試覆蓋率目標：80%+
   - 只測試公開 API，不測實作細節

### 決策樹：何時加抽象

```
需要新功能？
├─ 現有程式碼能處理嗎？
│  ├─ 是 → 直接使用
│  └─ 否 ↓
├─ 已經有類似邏輯嗎？
│  ├─ 第 1 次 → 直接寫
│  ├─ 第 2 次 → 複製貼上（記錄 TODO）
│  └─ 第 3 次 → 提取共用函數
└─ 需要支援多種實作嗎？
   ├─ 目前只有 1 種 → 寫死即可
   ├─ 已確定有 2 種 → 簡單 if/switch
   └─ 預計有 3+ 種 → 考慮設計模式
```

## 專案結構

```
baseball-stats/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD 設定
├── data/
│   ├── raw/
│   │   └── data.csv           # 原始 CSV
│   └── processed/             # 處理後的 JSON（gitignore）
├── public/
│   └── data/                  # 靜態 JSON 檔案（部署用）
├── scripts/
│   └── csv-to-json.ts         # 資料轉換腳本
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx           # 首頁
│   │   ├── teams/
│   │   │   └── [teamId]/
│   │   │       └── page.tsx   # 球團頁
│   │   └── rankings/
│   │       └── page.tsx       # 排行榜
│   ├── components/            # UI 組件
│   │   ├── PlayerCard.tsx
│   │   ├── PlayerModal.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FilterPanel.tsx
│   │   └── Navigation.tsx
│   ├── hooks/                 # Custom Hooks
│   │   ├── usePlayerList.ts
│   │   ├── usePlayerSearch.ts
│   │   └── usePlayerModal.ts
│   ├── lib/                   # 純函數工具
│   │   ├── statsCalculator.ts
│   │   ├── dataLoader.ts
│   │   └── formatters.ts
│   └── types/
│       └── index.ts           # TypeScript 型別定義
├── e2e/                       # E2E 測試
│   └── team-page.spec.ts
├── claude.md                  # 本檔案
├── skills.md                  # 技能指南
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

## 開發階段

### Phase 1: 專案初始化 + 資料處理 🚀

#### 1.1 建立 Next.js 專案

```bash
# 使用 create-next-app
npx create-next-app@latest baseball-stats --typescript --tailwind --app --no-src-dir --import-alias "@/*"

cd baseball-stats
```

#### 1.2 安裝依賴

```bash
# 核心依賴
npm install ahooks recharts

# 開發依賴
npm install -D @types/node
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D playwright @playwright/test
npm install -D eslint-plugin-unused-imports ts-prune
npm install -D csv-parse
```

#### 1.3 建立基礎設定檔

**vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.config.*', '**/test/**', '**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**src/test/setup.ts**
```typescript
import '@testing-library/jest-dom';
```

**playwright.config.ts**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**tailwind.config.ts**
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

**.eslintrc.json**
```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": "warn",
    "complexity": ["warn", 10],
    "max-lines-per-function": ["warn", 50],
    "max-params": ["warn", 3]
  },
  "plugins": ["unused-imports"],
  "rules": {
    "unused-imports/no-unused-imports": "error"
  }
}
```

**package.json scripts**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "convert-data": "tsx scripts/csv-to-json.ts",
    "analyze": "npx ts-prune",
    "unused": "npx depcheck"
  }
}
```

#### 1.4 建立 TypeScript 型別定義

**src/types/index.ts** (使用 TDD，先寫測試)

```typescript
// 球員打擊數據
export interface BattingStats {
  games: number;           // 出賽
  pa: number;             // 打席
  ab: number;             // 打數
  hits: number;           // 安打
  singles: number;        // 一壘安打
  doubles: number;        // 二壘安打
  triples: number;        // 三壘安打
  hr: number;             // 全壘打
  rbi: number;            // 打點
  runs: number;           // 得分
  bb: number;             // 四死球
  so: number;             // 三振
  sb: number;             // 盜壘成功
  sf: number;             // 高飛犧牲打
  totalBases: number;     // 壘打數
}

// 計算數據
export interface CalculatedStats {
  avg: number;            // 打擊率
  obp: number;            // 上壘率
  slg: number;            // 長打率
  ops: number;            // OPS
  iso: number;            // ISO
  babip: number;          // BABIP
  kPct: number;           // 三振率 %
  bbPct: number;          // 保送率 %
}

// 加權數據
export interface WeightedStats {
  wOBA: number | null;    // wOBA
  wRC: number | null;     // wRC
  wRCPlus: number | null; // wRC+
  opsPlus: number | null; // OPS+
}

// 球員單季數據
export interface PlayerSeason {
  year: number;
  team: string;
  number: string;
  batting: BattingStats;
  calculated?: CalculatedStats;
  weighted?: WeightedStats;
  rankings: Record<string, number>;
}

// 球員完整資料
export interface Player {
  id: string;
  code: string;
  name: string;
  photo: string;
  career: {
    debut: number;
    teams: string[];
    totalSeasons: number;
  };
  seasons: PlayerSeason[];
  careerTotals?: BattingStats & CalculatedStats;
}

// 球員摘要（用於列表）
export interface PlayerSummary {
  id: string;
  name: string;
  number: string;
  photo: string;
  team: string;
  seasonStats: BattingStats & CalculatedStats;
  rankings: Record<string, number>;
}

// 球團資料
export interface Team {
  id: string;
  name: string;
  code: string;
  logo: string;
  founded?: number;
  description?: string;
  colors?: {
    primary: string;
    secondary: string;
  };
}

// 賽季摘要
export interface SeasonSummary {
  year: number;
  lastUpdated: string;
  teams: Record<string, {
    teamId: string;
    teamName: string;
    stats: {
      totalPlayers: number;
      avgBattingAvg: number;
      totalHomeRuns: number;
    };
    players: PlayerSummary[];
  }>;
}

// 聯盟統計
export interface LeagueStats {
  year: number;
  avgBattingAvg: number;
  avgOBP: number;
  avgSLG: number;
  avgOPS: number;
  totalPA: number;
  totalAB: number;
  wOBAScale: number;
  wOBAWeights: {
    BB: number;
    HBP: number;
    '1B': number;
    '2B': number;
    '3B': number;
    HR: number;
  };
}
```

#### 1.5 建立 CSV 轉 JSON 腳本 (TDD)

**scripts/__tests__/csv-to-json.test.ts** (先寫測試)

```typescript
import { describe, it, expect } from 'vitest';
import { parseCSVRow, transformPlayerData, calculateLeagueStats } from '../csv-to-json';

describe('CSV to JSON Converter', () => {
  describe('parseCSVRow', () => {
    it('應該正確解析 CSV 行', () => {
      const row = {
        聯盟編碼: 'COL064',
        年份: '2025',
        所屬球團: '飛尼克斯',
        背號: '0',
        球員: '陳重任',
        打席: '19',
        打數: '16',
        安打: '2',
        // ... 其他欄位
      };

      const result = parseCSVRow(row);

      expect(result.id).toBe('COL0642025');
      expect(result.code).toBe('COL064');
      expect(result.year).toBe(2025);
      expect(result.name).toBe('陳重任');
    });

    it('應該處理無效數值', () => {
      const row = {
        打席: 'invalid',
        打數: '',
        安打: '-1',
      };

      const result = parseCSVRow(row);

      expect(result.batting.pa).toBe(0);
      expect(result.batting.ab).toBe(0);
      expect(result.batting.hits).toBe(0);
    });
  });

  describe('transformPlayerData', () => {
    it('應該將多個年度數據合併為生涯資料', () => {
      const rows = [
        { id: 'COL064', year: 2025, name: '陳重任', /* ... */ },
        { id: 'COL064', year: 2024, name: '陳重任', /* ... */ },
      ];

      const result = transformPlayerData(rows);

      expect(result.seasons).toHaveLength(2);
      expect(result.career.totalSeasons).toBe(2);
      expect(result.career.debut).toBe(2024);
    });
  });

  describe('calculateLeagueStats', () => {
    it('應該正確計算聯盟平均數據', () => {
      const players = [
        { batting: { hits: 10, ab: 30, bb: 5 } },
        { batting: { hits: 15, ab: 40, bb: 8 } },
      ];

      const result = calculateLeagueStats(players, 2025);

      expect(result.year).toBe(2025);
      expect(result.avgBattingAvg).toBeCloseTo(0.357, 3);
    });
  });
});
```

**scripts/csv-to-json.ts** (實作)

```typescript
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import type { Player, PlayerSeason, SeasonSummary, LeagueStats, Team } from '../src/types';

// 解析 CSV 行
export function parseCSVRow(row: any): any {
  const safeParseInt = (value: string): number => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  };

  const safeParseFloat = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  return {
    id: row['聯盟編碼'] + row['年份'],
    code: row['聯盟編碼'],
    year: safeParseInt(row['年份']),
    team: row['所屬球團'],
    number: row['背號'],
    name: row['球員'],
    photo: row['頒獎照片'] || '',
    batting: {
      games: safeParseInt(row['出賽']),
      pa: safeParseInt(row['打席']),
      ab: safeParseInt(row['打數']),
      hits: safeParseInt(row['安打']),
      singles: safeParseInt(row['一安']),
      doubles: safeParseInt(row['二安']),
      triples: safeParseInt(row['三安']),
      hr: safeParseInt(row['全打']),
      rbi: safeParseInt(row['打點']),
      runs: safeParseInt(row['得分']),
      bb: safeParseInt(row['四死']),
      so: safeParseInt(row['三振']),
      sb: safeParseInt(row['盜壘成功']),
      sf: safeParseInt(row['犧打']),
      totalBases: safeParseInt(row['壘打數']),
    },
    advanced: {
      rc: safeParseFloat(row['RC數據']),
    },
    rankings: {
      rc: safeParseInt(row['RC排名']),
      hits: safeParseInt(row['安打排名']),
      hr: safeParseInt(row['全壘打排名']),
      rbi: safeParseInt(row['打點排名']),
      avg: safeParseInt(row['打擊率排名']),
    },
  };
}

// 轉換球員資料
export function transformPlayerData(rows: any[]): Player {
  const seasons = rows.map(row => ({
    year: row.year,
    team: row.team,
    number: row.number,
    batting: row.batting,
    rankings: row.rankings,
  }));

  const sortedSeasons = seasons.sort((a, b) => b.year - a.year);

  return {
    id: rows[0].code,
    code: rows[0].code,
    name: rows[0].name,
    photo: rows[0].photo,
    career: {
      debut: Math.min(...seasons.map(s => s.year)),
      teams: [...new Set(seasons.map(s => s.team))],
      totalSeasons: seasons.length,
    },
    seasons: sortedSeasons,
  };
}

// 計算聯盟統計
export function calculateLeagueStats(players: any[], year: number): LeagueStats {
  const totalAB = players.reduce((sum, p) => sum + p.batting.ab, 0);
  const totalHits = players.reduce((sum, p) => sum + p.batting.hits, 0);
  const totalBB = players.reduce((sum, p) => sum + p.batting.bb, 0);
  const totalPA = players.reduce((sum, p) => sum + p.batting.pa, 0);
  const totalTB = players.reduce((sum, p) => sum + p.batting.totalBases, 0);

  const avgBattingAvg = totalHits / totalAB;
  const avgOBP = (totalHits + totalBB) / (totalAB + totalBB);
  const avgSLG = totalTB / totalAB;

  return {
    year,
    avgBattingAvg,
    avgOBP,
    avgSLG,
    avgOPS: avgOBP + avgSLG,
    totalPA,
    totalAB,
    wOBAScale: 1.20, // 需要更複雜的計算
    wOBAWeights: {
      BB: 0.69,
      HBP: 0.72,
      '1B': 0.88,
      '2B': 1.24,
      '3B': 1.56,
      HR: 1.95,
    },
  };
}

// 主函數
async function main() {
  console.log('🚀 開始轉換 CSV 到 JSON...');

  // 讀取 CSV
  const csvPath = path.join(process.cwd(), 'data/raw/data.csv');
  const csvContent = await fs.readFile(csvPath, 'utf-8');

  // 解析 CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📄 讀取 ${records.length} 筆資料`);

  // 跳過第一行（聯盟統計）
  const playerRecords = records.slice(1);

  // 解析所有行
  const parsedRows = playerRecords
    .map(parseCSVRow)
    .filter(row => row.year > 0 && row.name); // 過濾無效資料

  // 按年份分組
  const byYear = parsedRows.reduce((acc, row) => {
    if (!acc[row.year]) acc[row.year] = [];
    acc[row.year].push(row);
    return acc;
  }, {} as Record<number, any[]>);

  // 按球員分組
  const byPlayer = parsedRows.reduce((acc, row) => {
    if (!acc[row.code]) acc[row.code] = [];
    acc[row.code].push(row);
    return acc;
  }, {} as Record<string, any[]>);

  // 建立輸出目錄
  const outputDir = path.join(process.cwd(), 'public/data');
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(path.join(outputDir, 'seasons'), { recursive: true });
  await fs.mkdir(path.join(outputDir, 'players'), { recursive: true });

  // 1. 生成各年度摘要
  for (const [year, rows] of Object.entries(byYear)) {
    const byTeam = rows.reduce((acc, row) => {
      if (!acc[row.team]) acc[row.team] = [];
      acc[row.team].push(row);
      return acc;
    }, {} as Record<string, any[]>);

    const summary: any = {
      year: parseInt(year),
      lastUpdated: new Date().toISOString(),
      teams: {},
    };

    for (const [teamName, teamPlayers] of Object.entries(byTeam)) {
      const teamId = teamName.toLowerCase().replace(/\s+/g, '-');
      summary.teams[teamId] = {
        teamId,
        teamName,
        stats: {
          totalPlayers: teamPlayers.length,
          avgBattingAvg: teamPlayers.reduce((sum, p) => sum + (p.batting.hits / p.batting.ab || 0), 0) / teamPlayers.length,
          totalHomeRuns: teamPlayers.reduce((sum, p) => sum + p.batting.hr, 0),
        },
        players: teamPlayers.map(p => ({
          id: p.code,
          name: p.name,
          number: p.number,
          photo: p.photo,
          team: p.team,
          seasonStats: {
            ...p.batting,
            avg: p.batting.hits / p.batting.ab || 0,
            obp: (p.batting.hits + p.batting.bb) / (p.batting.ab + p.batting.bb) || 0,
            slg: p.batting.totalBases / p.batting.ab || 0,
            ops: ((p.batting.hits + p.batting.bb) / (p.batting.ab + p.batting.bb) || 0) + (p.batting.totalBases / p.batting.ab || 0),
          },
          rankings: p.rankings,
        })),
      };
    }

    await fs.writeFile(
      path.join(outputDir, 'seasons', `${year}_summary.json`),
      JSON.stringify(summary, null, 2)
    );

    console.log(`✅ ${year} 年度摘要已生成`);
  }

  // 2. 生成球員詳細資料
  for (const [code, rows] of Object.entries(byPlayer)) {
    const player = transformPlayerData(rows);

    await fs.writeFile(
      path.join(outputDir, 'players', `${code}.json`),
      JSON.stringify(player, null, 2)
    );
  }

  console.log(`✅ ${Object.keys(byPlayer).length} 位球員資料已生成`);

  // 3. 生成球團列表
  const teams = [...new Set(parsedRows.map(row => row.team))].map(teamName => ({
    id: teamName.toLowerCase().replace(/\s+/g, '-'),
    name: teamName,
    code: teamName.substring(0, 3).toUpperCase(),
    logo: '', // 待補充
  }));

  await fs.writeFile(
    path.join(outputDir, 'teams.json'),
    JSON.stringify({ teams }, null, 2)
  );

  console.log(`✅ ${teams.length} 個球團資料已生成`);

  // 4. 生成聯盟統計
  for (const [year, rows] of Object.entries(byYear)) {
    const leagueStats = calculateLeagueStats(rows, parseInt(year));

    await fs.writeFile(
      path.join(outputDir, 'seasons', `${year}_league.json`),
      JSON.stringify(leagueStats, null, 2)
    );
  }

  console.log('🎉 轉換完成！');
}

// 執行
main().catch(console.error);
```

運行轉換：
```bash
npm run convert-data
```

---

### Phase 2: 核心功能開發 (TDD)

⚠️ **開發前環境確認：**
```bash
# 確認使用 Node.js 24.x 穩定版
node --version  # 應顯示 v24.x.x
# 若不是，請執行：nvm use v24.12.0
```

請參考 `skills.md` 中的詳細指南進行開發。

#### 開發順序：

1. **Model Layer (lib/)** - 優先，測試覆蓋率 95%
   - statsCalculator.ts
   - dataLoader.ts
   - formatters.ts

2. **ViewModel Layer (hooks/)** - 次要，測試覆蓋率 85%
   - usePlayerList.ts
   - usePlayerSearch.ts
   - usePlayerModal.ts

3. **View Layer (components/ + app/)** - 最後，測試覆蓋率 70%
   - 基礎組件
   - 頁面組裝

#### TDD 工作流程：

```bash
# 1. 開啟測試監視模式
npm run test:watch

# 2. 建立測試檔案
# src/lib/__tests__/statsCalculator.test.ts

# 3. 寫測試（Red）
# - 測試應該失敗

# 4. 寫實作（Green）
# - 用最簡單的方式讓測試通過

# 5. 重構（Refactor）
# - 優化代碼，確保測試仍通過

# 6. 檢查覆蓋率
npm run test:coverage
```

---

### Phase 3: 整合測試與 E2E

```bash
# Integration tests
npm run test

# E2E tests
npm run test:e2e

# E2E UI mode (開發時使用)
npm run test:e2e:ui
```

---

### Phase 4: 部署

#### 4.1 Vercel 設定

1. 推送到 GitHub
2. 在 Vercel 匯入專案
3. 設定環境變數（如需要）
4. 部署

**vercel.json**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hnd1"]
}
```

#### 4.2 CI/CD

**.github/workflows/ci.yml**
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run build
```

---

## Git 分支開發規範

### 分支命名規則

```
feature/功能名稱   # 新功能開發
fix/修復名稱       # Bug 修復
refactor/重構名稱  # 程式碼重構
test/測試名稱      # 測試相關
docs/文件名稱      # 文件更新
```

### 開發流程

#### 1. 開始新功能開發

```bash
# 確認在 main 分支且是最新狀態
git checkout main
git pull origin main

# 建立功能分支
git checkout -b feature/stats-calculator

# 確認分支
git branch
```

#### 2. 開發過程中提交

```bash
# 檢查變更
git status
git diff

# 加入變更（選擇性加入）
git add src/lib/statsCalculator.ts
git add src/lib/__tests__/statsCalculator.test.ts

# 提交（使用語義化訊息）
git commit -m "feat: 實作打擊數據計算功能

- 新增 calculateAVG, calculateOBP, calculateSLG
- 新增進階數據計算 (wOBA, OPS+)
- 完整測試覆蓋 (24 tests)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### 3. 功能完成後合併

```bash
# 確保測試通過
npm run test
npm run lint
npm run build

# 切換回 main 並更新
git checkout main
git pull origin main

# 合併功能分支（使用 --no-ff 保留分支歷史）
git merge --no-ff feature/stats-calculator

# 推送到遠端
git push origin main

# 刪除本地功能分支（選擇性）
git branch -d feature/stats-calculator
```

### Commit 訊息規範

使用 Conventional Commits 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 類型：**
- `feat`: 新功能
- `fix`: Bug 修復
- `refactor`: 重構（不改變功能）
- `test`: 測試相關
- `docs`: 文件更新
- `style`: 格式調整（不影響程式碼）
- `chore`: 雜項（建置、依賴更新等）

**範例：**

```bash
# 簡單提交
git commit -m "feat: 新增球員搜尋功能"

# 詳細提交
git commit -m "feat(hooks): 實作 usePlayerSearch hook

新增功能：
- 支援按名稱搜尋球員
- 支援按球團篩選
- 即時搜尋結果更新

測試：
- 單元測試 12/12 通過
- 測試覆蓋率 95%

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 注意事項

⚠️ **不要提交的檔案：**
- `data/raw/*.csv` - 原始 CSV 資料檔（已在 .gitignore）
- `node_modules/` - 依賴套件
- `.env*` - 環境變數檔案
- 個人編輯器設定檔

✅ **需要提交的檔案：**
- `public/data/` - 轉換後的 JSON 資料（用於部署）
- 所有 `src/` 原始碼
- 測試檔案
- 設定檔案

---

## 開發檢查清單

### 開發前
- [ ] 確認使用 Node.js v24.x
- [ ] 建立功能分支
- [ ] 這個功能現在真的需要嗎？（YAGNI）
- [ ] 能用現有程式碼解決嗎？
- [ ] 最簡單的實作方式是什麼？

### 開發中
- [ ] 先寫測試再寫實作（TDD）
- [ ] 測試是否通過？
- [ ] 程式碼是否簡潔？（KISS）
- [ ] 是否有重複邏輯？（Rule of Three）
- [ ] 定期提交（功能完成一個小單元就 commit）

### Code Review
- [ ] 有沒有未使用的 export？
- [ ] 有沒有註解掉的程式碼？
- [ ] 測試覆蓋率是否達標？
- [ ] 是否有過度設計？
- [ ] Commit 訊息是否清楚？

### 合併前
- [ ] 所有測試通過
- [ ] Lint 檢查通過
- [ ] TypeScript 編譯檢查通過（`npx tsc --noEmit`）
- [ ] Build 成功（`npm run build`）
- [ ] E2E 測試通過（如有）
- [ ] 確認沒有提交不該提交的檔案

### 部署前 ⚠️ 重要
- [ ] **TypeScript 編譯檢查**：執行 `npx tsc --noEmit` 確保無編譯錯誤
- [ ] **Production Build 測試**：執行 `npm run build` 確保建置成功
- [ ] **Import 路徑檢查**：確認所有 import 使用正確路徑（`@/src/...` 而非 `@/...`）
- [ ] **檢查 Vercel 部署預覽**：確認預覽環境無錯誤

**常見編譯錯誤：**
1. Import 路徑錯誤：應使用 `@/src/types` 而非 `@/types`
2. Import 位置錯誤：所有 import 必須在檔案最上方
3. 類型缺失：確保所有必要的 interface 屬性都有提供

---

## 常用指令

```bash
# 開發
npm run dev                    # 啟動開發伺服器
npm run build                  # 建置專案
npm run start                  # 啟動生產伺服器

# 測試
npm run test                   # 執行單元測試
npm run test:ui               # 測試 UI 介面
npm run test:coverage         # 測試覆蓋率報告
npm run test:e2e              # E2E 測試
npm run test:e2e:ui           # E2E UI 模式

# 程式碼品質
npm run lint                  # ESLint 檢查
npm run lint:fix              # 自動修復 Lint 錯誤
npm run analyze               # 找出未使用的 exports
npm run unused                # 找出未使用的依賴

# 資料處理
npm run convert-data          # CSV 轉 JSON
```

---

## 疑難排解

### 測試相關

**問題：測試無法找到模組**
```bash
# 檢查 tsconfig.json 和 vitest.config.ts 的 alias 設定是否一致
```

**問題：測試執行很慢**
```bash
# 使用 test.concurrent 平行執行測試
```

### 資料轉換相關

**問題：CSV 編碼錯誤**
```bash
# 確認 CSV 檔案是 UTF-8 編碼
```

**問題：JSON 檔案過大**
```bash
# 檢查是否有重複資料
# 考慮分割成更小的檔案
```

---

## 參考資源

- [Next.js 文件](https://nextjs.org/docs)
- [Tailwind CSS 文件](https://tailwindcss.com/docs)
- [ahooks 文件](https://ahooks.js.org/)
- [Vitest 文件](https://vitest.dev/)
- [Playwright 文件](https://playwright.dev/)
- [Testing Library 文件](https://testing-library.com/)

---

## 版本歷史

- **v0.1.0** - 初始版本，包含專案架構和開發指南

---

## TODO：統一賽季資料結構重構

> 📅 建立日期：2026-02-18
> 📁 舊 TODO 備份：`docs/archive/CLAUDE_TODO_BACKUP_20260218.md`

### 背景

目前賽季相關資料分散在多個 JSON 檔案中，造成：
1. **資料冗餘**：同一場比賽的資訊重複存在多處
2. **維護困難**：更新資料需要改多個檔案
3. **無法計算**：standings 是手動維護，無法自動從比賽結果計算

### 現有問題

| 檔案 | 內容 | 問題 |
|------|------|------|
| `standings_2025.json` | 累計戰績 (W/L/D)、平均得失分 | 手動維護，與比賽結果脫鉤 |
| `season_games/2025.json` | 比賽清單、狀態 | 沒有比分 |
| `schedules/2026-01.json` | 月曆賽程、時間 | 與 season_games 重複 |
| `game-reports/index.json` | 戰報連結 (sheetId) | 與其他檔案重複基本資訊 |

**冗餘欄位：**
- `gameNumber`, `date`, `homeTeam`, `awayTeam`, `venue` 在 3-4 個檔案中重複

---

### 目標：單一賽季資料檔

將所有賽季相關資料合併至 `seasons/YYYY.json`：

```json
{
  "season": 2025,
  "lastUpdated": "2026-02-03T00:00:00Z",

  "standings": {
    "source": "manual",
    "teams": [
      {
        "teamId": "ROO",
        "teamName": "Line Drive",
        "wins": 16,
        "losses": 3,
        "draws": 1,
        "runsAllowed": 4.0,
        "runsScored": 13.75
      }
    ]
  },

  "games": {
    "2025201": {
      "date": "2026-01-03",
      "homeTeam": "Line Drive",
      "awayTeam": "陽明OB",
      "venue": "中正A",
      "timeSlot": "上午",
      "startTime": "08:00",
      "endTime": "11:00",
      "status": "finished",
      "homeScore": 10,
      "awayScore": 3,
      "sheetId": "1dM8woBhSnNPms3YKPEptfw3o4F3neBWa-JrbRoW1iak"
    }
  }
}
```

---

### 檔案結構變化

```
舊結構 (5+ 檔案/賽季):
├── standings_2025.json
├── season_games/2025.json
├── game-reports/index.json
├── schedules/2026-01.json
├── schedules/2026-02.json
└── ...

新結構 (1 檔案/賽季):
└── seasons/
    ├── 2025.json    ← 所有 2025 賽季資料
    └── 2026.json    ← 所有 2026 賽季資料
```

---

### 過渡方案：standings.source

由於目前比賽資料尚未完整（缺少比分），採用混合模式：

| 階段 | standings.source | 說明 |
|------|------------------|------|
| **現在** | `"manual"` | 手動維護 standings，games 逐步補齊 |
| **過渡** | `"partial"` | 部分從 games 計算，部分手動補差 |
| **完成** | `"calculated"` | 完全從 games 計算，standings 變成快取 |

```typescript
function getStandings(seasonData) {
  if (seasonData.standings.source === "manual") {
    return seasonData.standings.teams;
  }
  if (seasonData.standings.source === "calculated") {
    return calculateStandingsFromGames(seasonData.games);
  }
  // partial: 混合模式
}
```

---

### 各功能資料來源

| 功能 | 取得方式 |
|------|----------|
| 📅 月曆賽程 | `Object.values(games).filter(g => g.date.startsWith('2026-01'))` |
| 🏆 戰績排行 | `standings.teams` (現階段) → 未來從 games 計算 |
| 📊 賽季紀錄 | `Object.entries(games)` |
| 📝 戰報連結 | `games[gameNumber].sheetId` |
| 🔥 連勝連敗 | 從 `status: finished` 的比賽比分計算 |
| 📈 平均得失分 | 從 `homeScore/awayScore` 計算 |

---

### 任務清單 (TDD 流程)

#### Phase 1: 類型定義

- [ ] **1.1** 定義新的 TypeScript 類型 (`src/types/index.ts`)
  ```typescript
  // 統一比賽資料
  export interface SeasonGame {
    date: string;
    homeTeam: string;
    awayTeam: string;
    venue: string;
    timeSlot: TimeSlot;
    startTime: string;
    endTime: string;
    status: 'finished' | 'scheduled' | 'rain' | 'cancelled';
    homeScore: number | null;
    awayScore: number | null;
    sheetId: string;
  }

  // 戰績來源類型
  export type StandingsSource = 'manual' | 'partial' | 'calculated';

  // 統一賽季資料
  export interface SeasonData {
    season: number;
    lastUpdated: string;
    standings: {
      source: StandingsSource;
      teams: TeamRecordRaw[];
    };
    games: Record<string, SeasonGame>;
  }
  ```

- [ ] **1.2** 撰寫類型測試（確保向後相容）

#### Phase 2: 資料遷移

- [ ] **2.1** 建立 `public/data/seasons/` 目錄
- [ ] **2.2** 建立遷移腳本 `scripts/migrate-season-data.ts`
  - 合併 standings + season_games + schedules + game-reports
  - 處理重複資料衝突
- [ ] **2.3** 執行遷移，產生 `seasons/2025.json`
- [ ] **2.4** 執行遷移，產生 `seasons/2026.json`
- [ ] **2.5** 驗證遷移結果

#### Phase 3: 資料載入層 (TDD)

- [ ] **3.1** 🔴 Red: 撰寫測試 `src/lib/__tests__/seasonDataLoader.test.ts`
  ```typescript
  describe('loadSeasonData', () => {
    it('應該載入完整賽季資料');
    it('應該正確解析 games 物件');
    it('應該支援篩選特定月份的比賽');
  });
  ```
- [ ] **3.2** 🟢 Green: 實作 `src/lib/seasonDataLoader.ts`
  ```typescript
  export async function loadSeasonData(year: number): Promise<SeasonData>;
  export function getGamesByMonth(data: SeasonData, year: number, month: number): SeasonGame[];
  export function getGamesByTeam(data: SeasonData, teamName: string): SeasonGame[];
  ```
- [ ] **3.3** 🔵 Refactor: 優化與快取

#### Phase 4: 更新現有元件

- [ ] **4.1** 更新 `ScheduleCalendar.tsx`
  - 改用新的 `loadSeasonData()` + `getGamesByMonth()`
- [ ] **4.2** 更新 `app/seasons/[year]/page.tsx`
  - 改用新的資料結構
- [ ] **4.3** 更新 `StandingsTable` / `LeagueLeaders`
  - 從 `seasonData.standings.teams` 取得資料
- [ ] **4.4** 更新戰報相關元件
  - 從 `seasonData.games[gameNumber].sheetId` 取得連結

#### Phase 5: 清理舊檔案

- [ ] **5.1** 確認所有功能正常運作
- [ ] **5.2** 移除舊檔案（或移至 archive）
  - `standings_2025.json`
  - `season_games/*.json`
  - `game-reports/index.json`
  - `schedules/*.json` (保留或合併)
- [ ] **5.3** 更新 `.gitignore`

#### Phase 6: 文件更新

- [ ] **6.1** 更新 `docs/SCHEDULE_FEATURE.md`
- [ ] **6.2** 更新 `docs/api/game-reports.md`
- [ ] **6.3** 建立 `docs/SEASON_DATA_STRUCTURE.md`
- [ ] **6.4** 更新 `docs/SCHEDULE_UPDATE_GUIDE.md`

---

### 進度追蹤

| Phase | 狀態 | 完成日期 |
|-------|------|---------|
| Phase 1: 類型定義 | ⏳ 待開始 | - |
| Phase 2: 資料遷移 | ⏳ 待開始 | - |
| Phase 3: 資料載入層 | ⏳ 待開始 | - |
| Phase 4: 更新元件 | ⏳ 待開始 | - |
| Phase 5: 清理舊檔案 | ⏳ 待開始 | - |
| Phase 6: 文件更新 | ⏳ 待開始 | - |

---

### 相關檔案

**新增：**
- `public/data/seasons/2025.json`
- `public/data/seasons/2026.json`
- `src/lib/seasonDataLoader.ts`
- `scripts/migrate-season-data.ts`

**修改：**
- `src/types/index.ts`
- `src/components/ScheduleCalendar.tsx`
- `app/seasons/[year]/page.tsx`
- `src/components/LeagueLeaders.tsx`

**刪除（遷移後）：**
- `public/data/standings_2025.json`
- `public/data/season_games/`
- `public/data/game-reports/index.json`
- `public/data/schedules/`

---

### 未來擴展（資料完整後）

完成資料遷移後，可以實作：

- [ ] **球隊近況功能**
  - 連勝/連敗計算（從 games 比分）
  - 近 5 場結果
  - 名次變化

- [ ] **自動計算 standings**
  - 當 `standings.source === "calculated"` 時
  - 從 `games` 中 `status: finished` 的比賽計算 W/L/D

- [ ] **對戰統計**
  - A 隊 vs B 隊歷史戰績
  - 各場地勝率
