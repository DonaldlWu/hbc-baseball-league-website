# 賽程功能說明

## 功能概述

月賽程表功能，以月為單位顯示賽程，支援月份切換，已整合到首頁。

## 檔案結構

```
src/
├── types/index.ts                    # 型別定義
│   ├── TimeSlot                      # 時段型別
│   ├── Game                          # 單場比賽
│   ├── DaySchedule                   # 單日賽程
│   ├── MonthSchedule                 # 月賽程
│   └── ScheduleData                  # 賽程資料（含 metadata）
├── lib/dataLoader.ts                 # 資料載入
│   ├── loadMonthSchedule()           # 載入指定月份賽程
│   └── getCurrentMonthSchedule()     # 載入當月賽程
├── hooks/useSchedule.ts              # 賽程 Hook
│   ├── goToMonth()                   # 切換到指定月份
│   ├── goToPreviousMonth()           # 上個月
│   ├── goToNextMonth()               # 下個月
│   └── goToToday()                   # 回到當月
└── components/ScheduleCalendar.tsx   # 賽程日曆組件
    ├── ScheduleCalendar              # 主組件
    ├── DayScheduleCard               # 單日賽程卡片
    └── GameCard                      # 單場比賽卡片

public/data/schedules/
└── 2026-01.json                      # 2026 年 1 月賽程資料
```

## 資料格式

### JSON 檔案命名

```
public/data/schedules/YYYY-MM.json
```

範例：`2026-01.json`, `2026-02.json`

### 資料結構

```json
{
  "schedule": {
    "year": 2026,
    "month": 1,
    "days": [
      {
        "date": "2026-01-03",
        "venues": {
          "中正A": [
            {
              "gameNumber": "No.201",
              "homeTeam": "Line Drive",
              "awayTeam": "陽明OB",
              "venue": "中正A",
              "timeSlot": "上午",
              "startTime": "08:00",
              "endTime": "11:00",
              "result": {
                "homeScore": 5,
                "awayScore": 3,
                "status": "finished"
              }
            }
          ]
        }
      }
    ]
  },
  "meta": {
    "lastUpdated": "2026-01-01T00:00:00Z",
    "totalGames": 19,
    "venues": ["中正A", "清溪", "三鶯A"]
  }
}
```

### 欄位說明

| 欄位 | 型別 | 說明 | 範例 |
|------|------|------|------|
| `date` | string | 日期 (ISO 8601) | "2026-01-03" |
| `gameNumber` | string | 賽程編號 | "No.201" |
| `homeTeam` | string | 主隊名稱 | "Line Drive" |
| `awayTeam` | string | 客隊名稱 | "陽明OB" |
| `venue` | string | 場地 | "中正A" |
| `timeSlot` | string | 時段 | "上午" / "中午" / "下午" |
| `startTime` | string | 開始時間 | "08:00" |
| `endTime` | string | 結束時間 | "11:00" |
| `result` | object (選填) | 比賽結果 | - |
| `result.homeScore` | number | 主隊得分 | 5 |
| `result.awayScore` | number | 客隊得分 | 3 |
| `result.status` | string | 狀態 | "finished" / "in_progress" / "postponed" / "cancelled" |

## 使用方式

### 1. 新增月賽程資料

建立新的 JSON 檔案：

```bash
# 建立 2026 年 2 月賽程
touch public/data/schedules/2026-02.json
```

複製 `2026-01.json` 的格式，填入新月份的賽程資料。

### 2. 在其他頁面使用

```tsx
import { ScheduleCalendar } from '@/src/components/ScheduleCalendar';

export default function SchedulePage() {
  return (
    <div>
      <ScheduleCalendar />
    </div>
  );
}
```

### 3. 使用 Hook 自訂功能

```tsx
import { useSchedule } from '@/src/hooks/useSchedule';

export default function CustomSchedule() {
  const { data, loading, currentYear, currentMonth, goToNextMonth } = useSchedule();

  return (
    <div>
      <h1>{currentYear} 年 {currentMonth} 月</h1>
      <button onClick={goToNextMonth}>下個月</button>
      {/* 自訂 UI ... */}
    </div>
  );
}
```

## UI 設計

### 功能特色

✅ **月份導航**
- 上個月 / 下個月按鈕
- 回到今天按鈕

✅ **球團篩選** 🆕
- 下拉選單選擇球團
- 自動從賽程提取球團名稱
- 支援「全部球團」選項
- 篩選後高亮顯示球隊名稱
- 顯示篩選後的比賽數量
- 切換月份時保留篩選狀態

✅ **日期顯示**
- 日期 + 星期
- 按日期分組

✅ **場地分組**
- 同一天不同場地分開顯示
- 顯示場地圖示和比賽數量

✅ **比賽卡片**
- 賽程編號
- 時段標籤（上午/中午/下午，不同顏色）
- 對戰球隊
- 時間範圍
- 比賽結果（如有）
- 選中球團時以主色高亮顯示

✅ **響應式設計**
- 桌面版：完整顯示
- 手機版：堆疊布局

### 配色方案

```css
/* 時段顏色 */
上午: bg-amber-50 border-amber-200 text-amber-700
中午: bg-orange-50 border-orange-200 text-orange-700
下午: bg-red-50 border-red-200 text-red-700

/* 主色調 */
標題: bg-gradient-to-r from-primary-50 to-primary-100
卡片: border-gray-200 hover:border-primary-300
```

## 維護流程

### 新增新月份賽程

1. **建立 JSON 檔案**
   ```bash
   cp public/data/schedules/2026-01.json public/data/schedules/2026-02.json
   ```

2. **更新資料**
   - 修改 `year` 和 `month`
   - 更新 `days` 陣列中的日期和賽程
   - 更新 `meta` 中的統計資訊

3. **驗證格式**
   ```bash
   # 使用 JSON validator 檢查格式
   cat public/data/schedules/2026-02.json | jq .
   ```

4. **提交**
   ```bash
   git add public/data/schedules/2026-02.json
   git commit -m "feat: 新增 2026 年 2 月賽程"
   ```

### 更新比賽結果

在對應的比賽物件中加入 `result` 欄位：

```json
{
  "gameNumber": "No.201",
  "homeTeam": "Line Drive",
  "awayTeam": "陽明OB",
  "result": {
    "homeScore": 5,
    "awayScore": 3,
    "status": "finished"
  }
}
```

### 修正賽程資料

直接編輯對應月份的 JSON 檔案即可。

## 球團篩選功能 🆕

### 使用方式

1. **選擇球團**
   - 點擊標題右側的下拉選單
   - 選擇想要查看的球團名稱
   - 選擇「🏆 全部球團」可取消篩選

2. **篩選效果**
   - 只顯示包含該球團的比賽
   - 球團名稱會以主色高亮顯示
   - 統計資訊會更新顯示篩選後的比賽數量

3. **篩選行為**
   - 篩選條件：主隊或客隊包含選中球團即顯示
   - 切換月份時保留篩選狀態
   - 如果該球團在當月無賽程，顯示「XX 在本月暫無賽程」

### 實作細節

```typescript
// 1. 自動從賽程提取球團名稱
const allTeams = useMemo(() => {
  const teamSet = new Set<string>();
  data.schedule.days.forEach((day) => {
    Object.values(day.venues).forEach((games) => {
      games.forEach((game) => {
        teamSet.add(game.homeTeam);
        teamSet.add(game.awayTeam);
      });
    });
  });
  return ['全部', ...Array.from(teamSet).sort()];
}, [data]);

// 2. 篩選賽程
const filteredDays = useMemo(() => {
  if (selectedTeam === '全部') return data?.schedule.days || [];

  return data.schedule.days
    .map((day) => {
      const filteredVenues = {};
      Object.entries(day.venues).forEach(([venue, games]) => {
        const filtered = games.filter(
          (game) => game.homeTeam === selectedTeam ||
                   game.awayTeam === selectedTeam
        );
        if (filtered.length > 0) {
          filteredVenues[venue] = filtered;
        }
      });
      return { ...day, venues: filteredVenues };
    })
    .filter((day) => Object.keys(day.venues).length > 0);
}, [data, selectedTeam]);
```

## 未來擴展

### 可能的功能增強

1. **篩選功能** ✅ 已完成
   - ✅ 按球隊篩選
   - 按場地篩選
   - 只顯示未完賽 / 已完賽

2. **搜尋功能**
   - 搜尋球隊名稱（可使用現有篩選）
   - 搜尋賽程編號

3. **詳細資訊**
   - 點擊比賽顯示 Modal
   - 顯示天氣、場地資訊
   - 顯示球員名單

4. **互動功能**
   - 加入行事曆
   - 設定提醒
   - 分享連結

5. **數據統計**
   - 球隊勝率統計
   - 場地使用統計
   - 時段分布圖表

## 測試建議

### 單元測試

```typescript
// src/hooks/__tests__/useSchedule.test.ts
describe('useSchedule', () => {
  it('應該載入當月賽程', async () => {
    const { result } = renderHook(() => useSchedule());
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });

  it('應該能切換到下個月', () => {
    const { result } = renderHook(() => useSchedule(2026, 1));
    act(() => {
      result.current.goToNextMonth();
    });
    expect(result.current.currentMonth).toBe(2);
  });
});
```

### E2E 測試

```typescript
// e2e/schedule.spec.ts
test('應該顯示賽程並能切換月份', async ({ page }) => {
  await page.goto('/');

  // 檢查賽程區塊存在
  await expect(page.locator('text=2026 年 1 月賽程')).toBeVisible();

  // 點擊下個月
  await page.click('button[aria-label="下個月"]');

  // 檢查月份已變更
  await expect(page.locator('text=2026 年 2 月賽程')).toBeVisible();
});
```

## 常見問題

### Q: 如何處理跨年月份切換？

A: `useSchedule` hook 已自動處理：
```typescript
// 12 月 → 1 月（年份 +1）
goToNextMonth() // 2026/12 → 2027/01

// 1 月 → 12 月（年份 -1）
goToPreviousMonth() // 2026/01 → 2025/12
```

### Q: 如果某月沒有賽程資料會怎樣？

A: 會顯示「暫無賽程」訊息，不會報錯。

### Q: 如何修改時段顏色？

A: 編輯 `ScheduleCalendar.tsx` 中的 `timeSlotColors` 物件：
```typescript
const timeSlotColors = {
  上午: 'bg-amber-50 border-amber-200 text-amber-700',
  中午: 'bg-orange-50 border-orange-200 text-orange-700',
  下午: 'bg-red-50 border-red-200 text-red-700',
};
```

### Q: 如何新增第四個時段（如「晚上」）？

1. 修改型別定義：
   ```typescript
   export type TimeSlot = '上午' | '中午' | '下午' | '晚上';
   ```

2. 新增配色：
   ```typescript
   const timeSlotColors = {
     // ...
     晚上: 'bg-purple-50 border-purple-200 text-purple-700',
   };
   ```

### Q: 球團篩選如何運作？

A: 球團篩選會顯示所有包含該球團的比賽（主隊或客隊）：
- 自動從賽程資料提取球團名稱
- 使用 `useMemo` 優化效能
- 篩選時高亮顯示球團名稱（主色）
- 切換月份時保留篩選狀態

### Q: 如果球團名稱變更怎麼辦？

A: 球團名稱是從 JSON 資料讀取的，更新 JSON 即可：
1. 修改對應月份的 JSON 檔案
2. 更新球隊名稱
3. 重新載入頁面即生效

### Q: 可以同時篩選多個球團嗎？

A: 目前不支援，只能選擇單一球團。如需此功能，可以修改為多選：
```typescript
// 改用陣列儲存選中的球團
const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

// 篩選條件改為
const filtered = games.filter(
  (game) =>
    selectedTeams.includes(game.homeTeam) ||
    selectedTeams.includes(game.awayTeam)
);
```

---

**建立日期**: 2026-01-14
**最後更新**: 2026-01-14（新增球團篩選功能）
