# CLAUDE.md TODO 備份 (2026-02-18)

此檔案備份已完成或已棄用的 TODO 項目。

---

## 已完成：gameNumber 加入賽季年度

### 背景
- 目前 `schedule/2026-01.json` 的 `year: 2026` 是日曆年，但比賽屬於 2025 賽季
- 需要新增 `season` 欄位區分「賽季年度」與「日曆年度」
- `gameNumber` 從 `"No.201"` 格式改為 `"2025201"`（賽季年度 + 場次編號）

### 任務清單 (TDD 流程)

#### Phase 1: Model Layer (類型與工具函數)

- [x] **1.1** 更新 TypeScript 類型定義 (`src/types/index.ts`) ✅
- [x] **1.2** 新增 gameNumber 格式化函數 (TDD) ✅

#### Phase 2: Data Layer (JSON 資料)

- [x] **2.1** 更新 `public/data/schedules/2026-01.json` ✅
- [x] **2.2** 更新 `public/data/game-reports/index.json` ✅
- [x] **2.3** 更新 `public/data/game-reports/sample.json` ✅

#### Phase 3: Parser Layer (解析器)

- [x] **3.1** 更新 gameReportParser (TDD) ✅

#### Phase 4: View Layer (UI 元件)

- [x] **4.1** 更新 `src/components/GameReport.tsx` ✅
- [x] **4.2** 更新 `src/components/ScheduleCalendar.tsx` ✅

#### Phase 5: Documentation

- [x] **5.1** 更新 `docs/SCHEDULE_FEATURE.md` ✅
- [x] **5.2** 更新 `docs/api/game-reports.md` ✅

### 進度追蹤

| Phase | 狀態 | 完成日期 |
|-------|------|---------|
| Phase 1 | ✅ 完成 | 2026-01-24 |
| Phase 2 | ✅ 完成 | 2026-01-24 |
| Phase 3 | ✅ 完成 | 2026-01-24 |
| Phase 4 | ✅ 完成 | 2026-01-24 |
| Phase 5 | ✅ 完成 | 2026-01-24 |

---

## 已完成：實作 CDN 快取減少 API 呼叫

### 背景
- Google Sheets API 每天有呼叫配額限制
- 需要使用 Vercel Edge Network CDN 快取減少 API 呼叫

### 解決方案：CDN Cache Headers

- CDN 快取時間：1 天（86400 秒）
- Stale-While-Revalidate：2 天（172800 秒）
- 效果：1000 個使用者（同一天）= **1 次 Google Sheets API 呼叫** ✅

### 進度追蹤

| Phase | 狀態 | 完成日期 |
|-------|------|---------|
| Phase 1 | ✅ 完成 | 2026-01-24 |
| Phase 2 | ✅ 完成 | 2026-01-24 |
| Phase 3 | ✅ 完成 | 2026-01-24 |

---

## 已棄用：球隊近況功能（舊架構）

> ⚠️ 此 TODO 已棄用，因資料架構重構而取消。
> 新的實作方式請參考「統一賽季資料結構」TODO。

### 原始背景
- 使用者希望在排行榜看到每隊的「近況」資訊
- 需要結合 `standings` 和 `schedule` (或 `game-reports`) 的資料

### 棄用原因
- 原架構將 standings、schedules、game-reports、season_games 分散在多個 JSON
- 資料冗餘且難以維護
- 決定先重構資料架構，再實作近況功能

---

## 已棄用：賽季對戰紀錄功能（舊架構）

> ⚠️ 此 TODO 部分完成，但因資料架構重構而需要調整。
> 新的實作方式請參考「統一賽季資料結構」TODO。

### 原始進度

| Phase | 狀態 | 完成日期 |
|-------|------|---------|
| Phase 1: 類型定義 | ✅ 完成 | 2026-01-29 |
| Phase 2: 資料層 | ✅ 完成 | 2026-01-29 |
| Phase 3: 賽季 Filter | ✅ 完成 | 2026-01-29 |
| Phase 4: 賽季紀錄頁面 | ✅ 完成 | 2026-01-29 |
| Phase 5: 導航更新 | ✅ 完成 | 2026-01-29 |
| Phase 6: 文件更新 | ⏳ 待開始 | - |

### 調整說明
- 已完成的 UI 元件可保留
- 資料載入邏輯需配合新架構調整
- `season_games/*.json` 將合併至 `seasons/*.json`
