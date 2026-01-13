# Custom Hooks 文檔

本目錄包含棒球聯盟統計網站的自定義 React Hooks，遵循 TDD 開發流程和 MVVM 架構的 ViewModel 層。

## 目錄

- [usePlayerList](#useplayerlist) - 球員列表管理
- [usePlayerSearch](#useplayersearch) - 球員搜尋與篩選
- [usePlayerModal](#useplayermodal) - Modal 狀態管理

---

## usePlayerList

用於載入、篩選和管理球員列表的 Hook。

### 功能特性

- ✅ 載入指定年度的球員資料
- ✅ 支援按球團篩選球員
- ✅ 支援多欄位排序（升序/降序）
- ✅ 提供手動重新整理功能
- ✅ 完整的 Loading 和 Error 狀態管理
- ✅ 自動處理資料載入的取消（避免記憶體洩漏）

### API 文檔

#### 匯入

```typescript
import { usePlayerList } from '@/src/hooks/usePlayerList';
```

#### 函數簽名

```typescript
function usePlayerList(
  year: number,
  teamId?: string
): UsePlayerListResult
```

#### 參數

| 參數名 | 類型 | 必填 | 說明 |
|--------|------|------|------|
| `year` | `number` | ✅ | 賽季年份（例如：2025） |
| `teamId` | `string` | ❌ | 球團 ID，用於篩選特定球團的球員 |

#### 返回值

```typescript
interface UsePlayerListResult {
  players: PlayerSummary[];
  loading: boolean;
  error: string | null;
  sortBy: (field: keyof PlayerSummary['seasonStats'], order: SortOrder) => void;
  refresh: () => void;
}
```

| 屬性 | 類型 | 說明 |
|------|------|------|
| `players` | `PlayerSummary[]` | 球員列表資料 |
| `loading` | `boolean` | 資料載入中狀態 |
| `error` | `string \| null` | 錯誤訊息（無錯誤時為 null） |
| `sortBy` | `function` | 排序函數，接受欄位名稱和排序方向 |
| `refresh` | `function` | 手動重新載入資料 |

#### 排序方向

```typescript
type SortOrder = 'asc' | 'desc';
```

- `'asc'`: 升序排列（由小到大）
- `'desc'`: 降序排列（由大到小）

---

### 使用範例

#### 範例 1: 載入所有球員

```typescript
import { usePlayerList } from '@/src/hooks/usePlayerList';

function AllPlayersPage() {
  const { players, loading, error } = usePlayerList(2025);

  if (loading) return <div>載入中...</div>;
  if (error) return <div>錯誤: {error}</div>;

  return (
    <div>
      <h1>2025 賽季球員列表</h1>
      <ul>
        {players.map(player => (
          <li key={player.id}>
            {player.name} - AVG: {player.seasonStats.avg.toFixed(3)}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### 範例 2: 篩選特定球團的球員

```typescript
import { usePlayerList } from '@/src/hooks/usePlayerList';

function TeamPage({ teamId }: { teamId: string }) {
  const { players, loading, error } = usePlayerList(2025, teamId);

  if (loading) return <div>載入中...</div>;
  if (error) return <div>錯誤: {error}</div>;

  return (
    <div>
      <h1>球團球員列表</h1>
      <p>共 {players.length} 位球員</p>
      {players.map(player => (
        <PlayerCard key={player.id} player={player} />
      ))}
    </div>
  );
}
```

#### 範例 3: 使用排序功能

```typescript
import { usePlayerList } from '@/src/hooks/usePlayerList';

function RankingsPage() {
  const { players, loading, sortBy } = usePlayerList(2025);
  const [sortField, setSortField] = useState<'avg' | 'hr' | 'rbi'>('avg');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 當排序條件改變時，重新排序
  useEffect(() => {
    sortBy(sortField, sortOrder);
  }, [sortField, sortOrder, sortBy]);

  if (loading) return <div>載入中...</div>;

  return (
    <div>
      <h1>球員排行榜</h1>

      {/* 排序控制 */}
      <div>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as any)}
        >
          <option value="avg">打擊率</option>
          <option value="hr">全壘打</option>
          <option value="rbi">打點</option>
        </select>

        <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
          {sortOrder === 'asc' ? '↑ 升序' : '↓ 降序'}
        </button>
      </div>

      {/* 球員列表 */}
      {players.map((player, index) => (
        <div key={player.id}>
          <span>#{index + 1}</span>
          <span>{player.name}</span>
          <span>{player.seasonStats[sortField]}</span>
        </div>
      ))}
    </div>
  );
}
```

#### 範例 4: 手動重新整理

```typescript
import { usePlayerList } from '@/src/hooks/usePlayerList';

function PlayerListWithRefresh() {
  const { players, loading, error, refresh } = usePlayerList(2025);

  return (
    <div>
      <button
        onClick={refresh}
        disabled={loading}
      >
        {loading ? '載入中...' : '🔄 重新整理'}
      </button>

      {error && <div className="error">{error}</div>}

      <ul>
        {players.map(player => (
          <li key={player.id}>{player.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

#### 範例 5: 完整功能整合

```typescript
import { usePlayerList } from '@/src/hooks/usePlayerList';

function AdvancedPlayerList() {
  const [year, setYear] = useState(2025);
  const [teamId, setTeamId] = useState<string>();
  const { players, loading, error, sortBy, refresh } = usePlayerList(year, teamId);

  return (
    <div>
      {/* 年份選擇 */}
      <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
        <option value={2025}>2025</option>
        <option value={2024}>2024</option>
      </select>

      {/* 球團篩選 */}
      <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
        <option value="">所有球團</option>
        <option value="phoenix">飛尼克斯</option>
        <option value="eagles">老鷹</option>
      </select>

      {/* 排序按鈕 */}
      <button onClick={() => sortBy('avg', 'desc')}>依打擊率排序</button>
      <button onClick={() => sortBy('hr', 'desc')}>依全壘打排序</button>

      {/* 重新整理 */}
      <button onClick={refresh}>重新整理</button>

      {/* 狀態顯示 */}
      {loading && <div>載入中...</div>}
      {error && <div>錯誤: {error}</div>}

      {/* 球員列表 */}
      <div>
        {players.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}
```

---

### 實作細節

#### 狀態管理

使用 React 的 `useState` 管理以下狀態：

- `players`: 球員列表資料
- `loading`: 載入狀態
- `error`: 錯誤訊息
- `refreshTrigger`: 重新整理觸發器（內部使用）

#### 資料載入

使用 `useEffect` Hook 在以下情況下載入資料：

- 初始渲染時
- `year` 參數改變時
- `teamId` 參數改變時
- 調用 `refresh()` 函數時

#### 取消機制

實作了取消機制來避免記憶體洩漏：

```typescript
useEffect(() => {
  let cancelled = false;

  async function fetchPlayers() {
    // ... 載入資料
    if (cancelled) return; // 如果組件已卸載，不更新狀態
    // ... 設定狀態
  }

  fetchPlayers();

  return () => {
    cancelled = true; // 清理時設定 cancelled 為 true
  };
}, [year, teamId, refreshTrigger]);
```

#### 效能優化

- 使用 `useCallback` 優化 `sortBy` 和 `refresh` 函數，避免不必要的重新渲染
- 排序操作在客戶端進行，不需要重新請求伺服器資料

---

### 測試覆蓋率

```
測試檔案: src/hooks/__tests__/usePlayerList.test.ts

測試統計:
- 測試數量: 10 個測試
- 測試結果: ✅ 100% 通過
- 執行時間: ~1.3 秒

覆蓋率:
- Statements: 97.72%
- Branches: 71.42%
- Functions: 100%
- Lines: 100%

測試分組:
1. 基本載入功能 (3 tests)
   ✓ 應該成功載入球員列表
   ✓ 載入失敗時應該設定錯誤訊息
   ✓ 年份改變時應該重新載入

2. 球團篩選功能 (3 tests)
   ✓ 應該能依球團篩選球員
   ✓ 球團不存在時應該返回空陣列
   ✓ 球團 ID 改變時應該更新篩選結果

3. 排序功能 (3 tests)
   ✓ 應該能依打擊率排序 (降序)
   ✓ 應該能依打擊率排序 (升序)
   ✓ 應該能依全壘打數排序

4. 重新整理功能 (1 test)
   ✓ 應該能手動重新載入資料
```

---

### 程式碼統計

```
實作檔案: src/hooks/usePlayerList.ts
- 總行數: 111 行
- 純程式碼: ~85 行
- 註解: ~15 行
- 空行: ~11 行

測試檔案: src/hooks/__tests__/usePlayerList.test.ts
- 總行數: 317 行
- 測試數量: 10 個
- Mock 資料: ~130 行
```

測試與實作比例: **2.86:1** (高品質測試覆蓋)

---

### 最佳實踐

#### 1. 正確處理 Loading 狀態

```typescript
const { players, loading } = usePlayerList(2025);

if (loading) {
  return <LoadingSpinner />; // 顯示載入指示器
}

return <PlayerList players={players} />;
```

#### 2. 正確處理錯誤

```typescript
const { players, error } = usePlayerList(2025);

if (error) {
  return (
    <ErrorMessage>
      載入失敗: {error}
      <button onClick={refresh}>重試</button>
    </ErrorMessage>
  );
}
```

#### 3. 避免不必要的重新渲染

```typescript
// ❌ 不好：每次渲染都會改變 teamId
<Component teamId={teams[0]?.id} />

// ✅ 好：使用 useMemo 或將值提升到父組件
const teamId = useMemo(() => teams[0]?.id, [teams]);
<Component teamId={teamId} />
```

#### 4. 合理使用排序功能

```typescript
// ❌ 不好：在每次渲染時排序
function MyComponent() {
  const { players, sortBy } = usePlayerList(2025);
  sortBy('avg', 'desc'); // 無限循環！
  return <div>{players.map(...)}</div>;
}

// ✅ 好：在事件處理或 useEffect 中排序
function MyComponent() {
  const { players, sortBy } = usePlayerList(2025);

  useEffect(() => {
    sortBy('avg', 'desc');
  }, [sortBy]); // 只在初始時排序一次

  return <div>{players.map(...)}</div>;
}
```

#### 5. 正確處理組件卸載

Hook 已經內建取消機制，無需額外處理：

```typescript
// ✅ 不用擔心記憶體洩漏
function MyComponent() {
  const { players } = usePlayerList(2025);
  // 組件卸載時，Hook 會自動取消正在進行的請求
  return <div>{players.map(...)}</div>;
}
```

---

### 常見問題

#### Q: 如何知道資料是否載入完成？

A: 檢查 `loading` 狀態：

```typescript
const { loading } = usePlayerList(2025);
console.log(loading); // true: 載入中, false: 載入完成
```

#### Q: 如何處理載入失敗？

A: 檢查 `error` 狀態並提供重試機制：

```typescript
const { error, refresh } = usePlayerList(2025);

if (error) {
  return (
    <div>
      <p>載入失敗: {error}</p>
      <button onClick={refresh}>重試</button>
    </div>
  );
}
```

#### Q: 排序會重新請求資料嗎？

A: 不會。排序操作在客戶端進行，只是重新排列已載入的資料。

#### Q: 可以同時使用多個實例嗎？

A: 可以！每個實例都是獨立的：

```typescript
const allPlayers = usePlayerList(2025);
const phoenixPlayers = usePlayerList(2025, 'phoenix');
```

#### Q: 如何根據多個欄位排序？

A: 目前只支援單一欄位排序。如需多欄位排序，可以先用 `sortBy` 排序次要欄位，再排序主要欄位。

---

### 依賴關係

- `react`: ^19.2.3
- `@/src/lib/dataLoader`: 資料載入模組
- `@/src/types`: TypeScript 型別定義

---

### 變更歷史

#### v1.0.0 (2025-01-13)

- ✨ 初始版本實作
- ✅ TDD 開發流程完成
- ✅ 10 個測試全部通過
- ✅ 測試覆蓋率達標

---

## usePlayerSearch

用於搜尋和篩選球員的 Hook，支援按名稱或背號搜尋，並使用防抖優化效能。

### 功能特性

- ✅ 按球員姓名搜尋（支援部分匹配）
- ✅ 按球員背號搜尋（支援部分匹配）
- ✅ 不區分大小寫搜尋
- ✅ 300ms 防抖優化
- ✅ 即時搜尋結果更新
- ✅ 空搜尋詞返回所有球員
- ✅ 安全處理 null/undefined 資料

### API 文檔

#### 匯入

```typescript
import { usePlayerSearch } from '@/src/hooks/usePlayerSearch';
```

#### 函數簽名

```typescript
function usePlayerSearch(
  players: PlayerSummary[]
): UsePlayerSearchResult
```

#### 參數

| 參數名 | 類型 | 必填 | 說明 |
|--------|------|------|------|
| `players` | `PlayerSummary[]` | ✅ | 要搜尋的球員列表 |

#### 返回值

```typescript
interface UsePlayerSearchResult {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredPlayers: PlayerSummary[];
}
```

| 屬性 | 類型 | 說明 |
|------|------|------|
| `searchTerm` | `string` | 當前搜尋詞 |
| `setSearchTerm` | `function` | 設定搜尋詞的函數 |
| `filteredPlayers` | `PlayerSummary[]` | 過濾後的球員列表 |

---

### 使用範例

#### 範例 1: 基本搜尋功能

```typescript
import { usePlayerSearch } from '@/src/hooks/usePlayerSearch';
import { usePlayerList } from '@/src/hooks/usePlayerList';

function PlayerSearchPage() {
  const { players, loading } = usePlayerList(2025);
  const { searchTerm, setSearchTerm, filteredPlayers } = usePlayerSearch(players);

  if (loading) return <div>載入中...</div>;

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="搜尋球員姓名或背號..."
        className="w-full px-4 py-2 border rounded"
      />

      <p className="mt-2 text-gray-600">
        找到 {filteredPlayers.length} 位球員
      </p>

      <div className="mt-4">
        {filteredPlayers.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}
```

#### 範例 2: 搜尋框組件

```typescript
import { usePlayerSearch } from '@/src/hooks/usePlayerSearch';

interface SearchBarProps {
  players: PlayerSummary[];
  onResultsChange: (players: PlayerSummary[]) => void;
}

function SearchBar({ players, onResultsChange }: SearchBarProps) {
  const { searchTerm, setSearchTerm, filteredPlayers } = usePlayerSearch(players);

  // 當搜尋結果改變時通知父組件
  useEffect(() => {
    onResultsChange(filteredPlayers);
  }, [filteredPlayers, onResultsChange]);

  return (
    <div className="relative">
      <input
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="搜尋球員..."
        className="w-full px-4 py-2 pl-10 border rounded-lg"
      />
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2" />

      {searchTerm && (
        <button
          onClick={() => setSearchTerm('')}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          ✕
        </button>
      )}
    </div>
  );
}
```

#### 範例 3: 即時搜尋統計

```typescript
import { usePlayerSearch } from '@/src/hooks/usePlayerSearch';

function PlayerSearchWithStats() {
  const { players } = usePlayerList(2025);
  const { searchTerm, setSearchTerm, filteredPlayers } = usePlayerSearch(players);

  // 計算統計資料
  const stats = useMemo(() => {
    if (filteredPlayers.length === 0) return null;

    const totalHR = filteredPlayers.reduce((sum, p) => sum + p.seasonStats.hr, 0);
    const avgBattingAvg = filteredPlayers.reduce((sum, p) => sum + p.seasonStats.avg, 0) / filteredPlayers.length;

    return {
      count: filteredPlayers.length,
      totalHR,
      avgBattingAvg: avgBattingAvg.toFixed(3),
    };
  }, [filteredPlayers]);

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="搜尋球員..."
      />

      {stats && (
        <div className="stats">
          <p>找到 {stats.count} 位球員</p>
          <p>總全壘打: {stats.totalHR}</p>
          <p>平均打擊率: {stats.avgBattingAvg}</p>
        </div>
      )}

      <PlayerList players={filteredPlayers} />
    </div>
  );
}
```

#### 範例 4: 搜尋歷史記錄

```typescript
import { usePlayerSearch } from '@/src/hooks/usePlayerSearch';
import { useLocalStorageState } from 'ahooks';

function PlayerSearchWithHistory() {
  const { players } = usePlayerList(2025);
  const { searchTerm, setSearchTerm, filteredPlayers } = usePlayerSearch(players);
  const [searchHistory, setSearchHistory] = useLocalStorageState<string[]>(
    'player-search-history',
    { defaultValue: [] }
  );

  // 當搜尋時，加入歷史記錄
  const handleSearch = (term: string) => {
    setSearchTerm(term);

    if (term.trim() && !searchHistory.includes(term)) {
      setSearchHistory([term, ...searchHistory.slice(0, 9)]); // 保留最近 10 筆
    }
  };

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="搜尋球員..."
      />

      {/* 搜尋歷史 */}
      {searchHistory.length > 0 && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">最近搜尋：</p>
          <div className="flex gap-2 flex-wrap">
            {searchHistory.map((term, index) => (
              <button
                key={index}
                onClick={() => setSearchTerm(term)}
                className="px-2 py-1 text-sm bg-gray-100 rounded"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      <PlayerList players={filteredPlayers} />
    </div>
  );
}
```

---

### 實作細節

#### 搜尋邏輯

搜尋功能支援：

1. **名稱搜尋**：檢查球員姓名是否包含搜尋詞
2. **背號搜尋**：檢查球員背號是否包含搜尋詞
3. **不區分大小寫**：使用 `toLowerCase()` 進行比較
4. **部分匹配**：使用 `includes()` 支援部分匹配

```typescript
// 搜尋邏輯範例
const name = player.name?.toLowerCase() || '';
const number = player.number?.toString() || '';
return name.includes(searchLower) || number.includes(searchLower);
```

#### 防抖機制

使用 ahooks 的 `useDebounce` 實作 300ms 防抖：

```typescript
const debouncedSearchTerm = useDebounce(searchTerm, { wait: 300 });
```

**為什麼需要防抖？**

- 減少不必要的過濾計算
- 提升使用者體驗（避免輸入時畫面閃爍）
- 降低 CPU 使用率

#### 效能優化

使用 `useMemo` 優化過濾邏輯：

```typescript
const filteredPlayers = useMemo(() => {
  // 過濾邏輯
}, [players, debouncedSearchTerm]);
```

只在 `players` 或 `debouncedSearchTerm` 改變時重新計算。

---

### 測試覆蓋率

```
測試檔案: src/hooks/__tests__/usePlayerSearch.test.ts

測試統計:
- 測試數量: 19 個測試
- 測試結果: ✅ 100% 通過
- 執行時間: ~0.79 秒

覆蓋率:
- Statements: 100% ✅
- Branches: 100% ✅
- Functions: 100% ✅
- Lines: 100% ✅

測試分組:
1. 初始狀態 (2 tests)
   ✓ 應該返回所有球員
   ✓ 空球員列表應該返回空陣列

2. 按名稱搜尋 (4 tests)
   ✓ 應該能搜尋完整姓名
   ✓ 應該能搜尋部分姓名
   ✓ 應該能搜尋姓氏找到多位球員
   ✓ 搜尋不存在的名稱應該返回空陣列

3. 按背號搜尋 (3 tests)
   ✓ 應該能搜尋完整背號
   ✓ 應該能搜尋部分背號
   ✓ 搜尋不存在的背號應該返回空陣列

4. 混合搜尋 (1 test)
   ✓ 應該能同時搜尋名稱和背號

5. 大小寫處理 (1 test)
   ✓ 搜尋應該不區分大小寫

6. 清空搜尋 (2 tests)
   ✓ 清空搜尋詞應該返回所有球員
   ✓ 只有空白的搜尋詞應該返回所有球員

7. 防抖功能 (2 tests)
   ✓ 應該使用 useDebounce hook
   ✓ 防抖應該延遲 300ms

8. 動態更新 (2 tests)
   ✓ 球員列表改變時應該重新過濾
   ✓ 搜尋詞不變時，球員列表改變應該更新結果

9. 邊界情況 (2 tests)
   ✓ 應該處理 null 或 undefined 的球員資料
   ✓ 應該處理特殊字元搜尋
```

---

### 程式碼統計

```
實作檔案: src/hooks/usePlayerSearch.ts
- 總行數: 67 行
- 純程式碼: ~50 行
- 註解與文檔: ~17 行

測試檔案: src/hooks/__tests__/usePlayerSearch.test.ts
- 總行數: 383 行
- 測試數量: 19 個
- Mock 資料: ~100 行
```

測試與實作比例: **5.72:1** (極高品質測試覆蓋)

---

### 最佳實踐

#### 1. 結合 usePlayerList 使用

```typescript
// ✅ 推薦：先載入，再搜尋
const { players, loading } = usePlayerList(2025);
const { searchTerm, setSearchTerm, filteredPlayers } = usePlayerSearch(players);
```

#### 2. 提供清空按鈕

```typescript
// ✅ 好：提供清空功能
{searchTerm && (
  <button onClick={() => setSearchTerm('')}>
    清除搜尋
  </button>
)}
```

#### 3. 顯示搜尋結果數量

```typescript
// ✅ 好：告訴使用者找到多少結果
<p>找到 {filteredPlayers.length} 位球員</p>
```

#### 4. 處理無結果情況

```typescript
// ✅ 好：提供友善的無結果訊息
{filteredPlayers.length === 0 && searchTerm && (
  <div>找不到符合「{searchTerm}」的球員</div>
)}
```

#### 5. 使用防抖避免效能問題

```typescript
// ✅ Hook 已內建防抖，無需額外處理
const { filteredPlayers } = usePlayerSearch(players);
// 防抖會自動延遲 300ms
```

---

### 常見問題

#### Q: 防抖延遲可以調整嗎？

A: 目前固定為 300ms。如需調整，可以修改 Hook 原始碼中的 `wait` 參數：

```typescript
const debouncedSearchTerm = useDebounce(searchTerm, { wait: 500 }); // 改為 500ms
```

#### Q: 如何實作高亮顯示匹配文字？

A: 可以建立一個 highlight 組件：

```typescript
function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <span>{text}</span>;

  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i}>{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// 使用
<HighlightText text={player.name} highlight={searchTerm} />
```

#### Q: 搜尋支援模糊匹配嗎？

A: 目前只支援包含匹配（contains）。如需模糊匹配（fuzzy search），建議使用第三方庫如 `fuse.js`。

#### Q: 可以搜尋其他欄位嗎（例如球團）？

A: 目前只支援名稱和背號。如需擴展，可以修改 Hook：

```typescript
// 在 filter 中加入其他欄位
return name.includes(searchLower) ||
       number.includes(searchLower) ||
       player.team.toLowerCase().includes(searchLower); // 加入球團搜尋
```

#### Q: 如何保存搜尋狀態到 URL？

A: 可以結合 Next.js 的 URL 參數：

```typescript
import { useRouter, useSearchParams } from 'next/navigation';

function MyComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { players } = usePlayerList(2025);
  const { setSearchTerm, filteredPlayers } = usePlayerSearch(players);

  // 從 URL 初始化搜尋詞
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) setSearchTerm(query);
  }, []);

  // 搜尋時更新 URL
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    router.push(`?q=${encodeURIComponent(term)}`);
  };

  // ...
}
```

---

### 依賴關係

- `react`: ^19.2.3
- `ahooks`: ^3.9.6 (useDebounce)
- `@/src/types`: TypeScript 型別定義

---

### 變更歷史

#### v1.0.0 (2025-01-13)

- ✨ 初始版本實作
- ✅ TDD 開發流程完成
- ✅ 19 個測試全部通過
- ✅ 測試覆蓋率 100%
- ✅ 支援名稱和背號搜尋
- ✅ 300ms 防抖優化

---

---

## usePlayerModal

用於管理球員詳細資料 Modal 的 Hook，提供開啟/關閉 Modal、載入球員資料和狀態管理功能。

### 功能特性

- ✅ 開啟/關閉 Modal 控制
- ✅ 自動載入球員詳細資料
- ✅ Loading 狀態管理
- ✅ 錯誤處理（支援 Error 物件和其他型別）
- ✅ 連續開啟不同球員的 Modal
- ✅ 關閉時自動清空狀態
- ✅ 多實例獨立運作

### API 文檔

#### 匯入

```typescript
import { usePlayerModal } from '@/src/hooks/usePlayerModal';
```

#### 函數簽名

```typescript
function usePlayerModal(): UsePlayerModalResult
```

#### 參數

此 Hook 不需要參數。

#### 返回值

```typescript
interface UsePlayerModalResult {
  isOpen: boolean;
  player: Player | null;
  loading: boolean;
  error: string | null;
  openModal: (playerId: string) => Promise<void>;
  closeModal: () => void;
}
```

| 屬性 | 類型 | 說明 |
|------|------|------|
| `isOpen` | `boolean` | Modal 開啟狀態 |
| `player` | `Player \| null` | 球員詳細資料（未載入時為 null） |
| `loading` | `boolean` | 資料載入中狀態 |
| `error` | `string \| null` | 錯誤訊息（無錯誤時為 null） |
| `openModal` | `function` | 開啟 Modal 並載入球員資料 |
| `closeModal` | `function` | 關閉 Modal 並清空狀態 |

---

### 使用範例

#### 範例 1: 基本 Modal 功能

```typescript
import { usePlayerModal } from '@/src/hooks/usePlayerModal';
import { PlayerModal } from '@/components/PlayerModal';

function TeamPage() {
  const { isOpen, player, loading, error, openModal, closeModal } = usePlayerModal();

  return (
    <div>
      {/* 球員列表 */}
      {players.map(player => (
        <button
          key={player.id}
          onClick={() => openModal(player.id)}
        >
          查看 {player.name}
        </button>
      ))}

      {/* Modal */}
      {isOpen && player && (
        <PlayerModal
          player={player}
          onClose={closeModal}
        />
      )}

      {/* Loading 狀態 */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div>載入中...</div>
        </div>
      )}

      {/* 錯誤訊息 */}
      {error && (
        <div className="error-toast">
          {error}
        </div>
      )}
    </div>
  );
}
```

#### 範例 2: 結合球員卡片

```typescript
import { usePlayerModal } from '@/src/hooks/usePlayerModal';

function PlayerCard({ player }: { player: PlayerSummary }) {
  const { openModal } = usePlayerModal();

  return (
    <div
      className="player-card cursor-pointer"
      onClick={() => openModal(player.id)}
    >
      <img src={player.photo} alt={player.name} />
      <h3>{player.name}</h3>
      <p>#{player.number}</p>
      <button>查看詳細資料 →</button>
    </div>
  );
}
```

#### 範例 3: 完整 Modal 組件

```typescript
import { usePlayerModal } from '@/src/hooks/usePlayerModal';

interface PlayerModalProps {
  player: Player;
  onClose: () => void;
}

function PlayerModal({ player, onClose }: PlayerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
        {/* 標題列 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{player.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* 球員資訊 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <img
              src={player.photo}
              alt={player.name}
              className="w-full rounded-lg"
            />
          </div>

          <div>
            <h3>生涯資訊</h3>
            <p>首次登場：{player.career.debut}</p>
            <p>總賽季數：{player.career.totalSeasons}</p>
            <p>效力球團：{player.career.teams.join(', ')}</p>
          </div>
        </div>

        {/* 賽季統計 */}
        <div className="mt-6">
          <h3>賽季統計</h3>
          {player.seasons.map(season => (
            <div key={season.year} className="border-b py-2">
              <h4>{season.year} - {season.team}</h4>
              <div className="grid grid-cols-4 gap-2">
                <div>打席：{season.batting.pa}</div>
                <div>安打：{season.batting.hits}</div>
                <div>全壘打：{season.batting.hr}</div>
                <div>打點：{season.batting.rbi}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### 範例 4: 錯誤處理與重試

```typescript
import { usePlayerModal } from '@/src/hooks/usePlayerModal';

function PlayerListWithModal() {
  const { isOpen, player, loading, error, openModal, closeModal } = usePlayerModal();
  const [lastPlayerId, setLastPlayerId] = useState<string>('');

  const handleOpenModal = (playerId: string) => {
    setLastPlayerId(playerId);
    openModal(playerId);
  };

  const handleRetry = () => {
    if (lastPlayerId) {
      openModal(lastPlayerId);
    }
  };

  return (
    <div>
      {/* 球員列表 */}
      {players.map(player => (
        <button key={player.id} onClick={() => handleOpenModal(player.id)}>
          {player.name}
        </button>
      ))}

      {/* 錯誤提示 */}
      {error && !loading && (
        <div className="error-dialog">
          <p>載入失敗：{error}</p>
          <button onClick={handleRetry}>重試</button>
          <button onClick={closeModal}>關閉</button>
        </div>
      )}

      {/* Modal */}
      {isOpen && player && (
        <PlayerModal player={player} onClose={closeModal} />
      )}
    </div>
  );
}
```

#### 範例 5: 鍵盤快捷鍵支援

```typescript
import { usePlayerModal } from '@/src/hooks/usePlayerModal';

function PlayerModalWithKeyboard() {
  const { isOpen, player, closeModal } = usePlayerModal();

  // ESC 鍵關閉 Modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal]);

  // 防止背景滾動
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ...
}
```

---

### 實作細節

#### 狀態管理

使用 React 的 `useState` 管理以下狀態：

- `isOpen`: Modal 開啟/關閉狀態
- `player`: 球員詳細資料
- `loading`: 資料載入狀態
- `error`: 錯誤訊息

#### 資料載入流程

```typescript
openModal(playerId) →
  setLoading(true) →
  loadPlayer(playerId) →
  成功：setPlayer(data), setIsOpen(true)
  失敗：setError(message), setIsOpen(false) →
  setLoading(false)
```

#### 錯誤處理

支援兩種錯誤類型：

```typescript
try {
  // ...
} catch (err) {
  // Error 物件：使用 err.message
  // 其他類型：使用 String(err)
  setError(err instanceof Error ? err.message : String(err));
}
```

#### 狀態清理

關閉 Modal 時自動清理所有狀態：

```typescript
closeModal() {
  setIsOpen(false);
  setPlayer(null);
  setError(null);
}
```

---

### 測試覆蓋率

```
測試檔案: src/hooks/__tests__/usePlayerModal.test.ts

測試統計:
- 測試數量: 11 個測試
- 測試結果: ✅ 100% 通過
- 執行時間: ~0.72 秒

覆蓋率:
- Statements: 100% ✅ 完美！
- Branches: 100% ✅ 完美！
- Functions: 100% ✅ 完美！
- Lines: 100% ✅ 完美！

測試分組:
1. 初始狀態 (1 test)
   ✓ Modal 應該是關閉的

2. openModal 功能 (5 tests)
   ✓ 應該載入並顯示球員資料
   ✓ 載入過程中 loading 應該為 true
   ✓ 載入失敗時應該設定錯誤
   ✓ 載入失敗時應該處理非 Error 型別的錯誤
   ✓ 應該能連續開啟不同球員的 Modal

3. closeModal 功能 (3 tests)
   ✓ 應該關閉 Modal 並清空球員資料
   ✓ 關閉 Modal 應該清除錯誤訊息
   ✓ 關閉未開啟的 Modal 不應該造成錯誤

4. 多實例支援 (1 test)
   ✓ 每個實例應該獨立運作

5. API 一致性 (1 test)
   ✓ 應該提供所有必要的 API
```

---

### 程式碼統計

```
實作檔案: src/hooks/usePlayerModal.ts
- 總行數: 84 行
- 純程式碼: ~55 行
- 註解與文檔: ~29 行

測試檔案: src/hooks/__tests__/usePlayerModal.test.ts
- 總行數: 277 行
- 測試數量: 11 個
- Mock 資料: ~45 行
```

測試與實作比例: **3.30:1** (高品質測試覆蓋)

---

### 最佳實踐

#### 1. 正確處理 Loading 狀態

```typescript
const { isOpen, loading, player, closeModal } = usePlayerModal();

// ✅ 好：顯示 Loading 遮罩
{loading && (
  <div className="loading-overlay">
    <Spinner />
  </div>
)}

// ✅ 好：禁用按鈕防止重複點擊
<button onClick={() => openModal(id)} disabled={loading}>
  查看詳情
</button>
```

#### 2. 防止背景滾動

```typescript
// ✅ 好：Modal 開啟時鎖定背景滾動
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }
}, [isOpen]);
```

#### 3. 支援鍵盤操作

```typescript
// ✅ 好：ESC 鍵關閉 Modal
useEffect(() => {
  if (!isOpen) return;

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeModal();
  };

  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, [isOpen, closeModal]);
```

#### 4. 點擊背景關閉

```typescript
// ✅ 好：點擊遮罩層關閉 Modal
<div
  className="modal-overlay"
  onClick={closeModal}
>
  <div
    className="modal-content"
    onClick={(e) => e.stopPropagation()} // 防止冒泡
  >
    {/* Modal 內容 */}
  </div>
</div>
```

#### 5. 無障礙支援

```typescript
// ✅ 好：加入 ARIA 屬性
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">{player.name}</h2>
  <button
    onClick={closeModal}
    aria-label="關閉對話框"
  >
    ✕
  </button>
</div>
```

#### 6. 錯誤處理與重試

```typescript
// ✅ 好：提供重試功能
{error && (
  <div className="error-message">
    <p>{error}</p>
    <button onClick={() => openModal(lastPlayerId)}>
      重試
    </button>
  </div>
)}
```

---

### 常見問題

#### Q: 可以同時開啟多個 Modal 嗎？

A: 每個 `usePlayerModal` 實例是獨立的，但通常不建議同時開啟多個 Modal：

```typescript
// ✅ 可以，但不推薦
const modal1 = usePlayerModal();
const modal2 = usePlayerModal();

// ✅ 推薦：使用單一 Modal，根據需要切換內容
const { openModal } = usePlayerModal();
```

#### Q: 如何在開啟 Modal 前執行檢查？

A: 可以包裝 `openModal` 函數：

```typescript
const { openModal } = usePlayerModal();

const handleClick = async (playerId: string) => {
  // 執行檢查
  const hasPermission = await checkPermission();
  if (!hasPermission) {
    alert('沒有權限');
    return;
  }

  // 開啟 Modal
  await openModal(playerId);
};
```

#### Q: 關閉 Modal 時如何執行回調？

A: 可以包裝 `closeModal`：

```typescript
const { closeModal } = usePlayerModal();

const handleClose = () => {
  // 執行清理或回調
  console.log('Modal closed');
  onModalClose?.();

  // 關閉 Modal
  closeModal();
};
```

#### Q: 如何實作 Modal 動畫？

A: 可以使用 CSS transition 或動畫庫（如 Framer Motion）：

```typescript
// 使用 Framer Motion
import { motion, AnimatePresence } from 'framer-motion';

function MyModal() {
  const { isOpen, player, closeModal } = usePlayerModal();

  return (
    <AnimatePresence>
      {isOpen && player && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <PlayerModal player={player} onClose={closeModal} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

#### Q: 載入失敗後如何自動重試？

A: 可以實作重試邏輯：

```typescript
const { openModal, error } = usePlayerModal();
const [retryCount, setRetryCount] = useState(0);

useEffect(() => {
  if (error && retryCount < 3) {
    const timer = setTimeout(() => {
      openModal(playerId);
      setRetryCount(prev => prev + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }
}, [error, retryCount]);
```

#### Q: 如何追蹤 Modal 的開啟/關閉事件？

A: 可以使用 `useEffect` 監聽狀態變化：

```typescript
const { isOpen, player } = usePlayerModal();

useEffect(() => {
  if (isOpen && player) {
    // 追蹤 Modal 開啟事件
    analytics.track('modal_opened', {
      playerId: player.id,
      playerName: player.name,
    });
  }
}, [isOpen, player]);
```

---

### 依賴關係

- `react`: ^19.2.3
- `@/src/lib/dataLoader`: 資料載入模組（loadPlayer）
- `@/src/types`: TypeScript 型別定義（Player）

---

### 變更歷史

#### v1.0.0 (2025-01-13)

- ✨ 初始版本實作
- ✅ TDD 開發流程完成
- ✅ 11 個測試全部通過
- ✅ 測試覆蓋率 100%（完美覆蓋）
- ✅ 支援開啟/關閉 Modal
- ✅ 自動載入球員詳細資料
- ✅ 完整錯誤處理
- ✅ 多實例獨立運作

---

### 授權

此程式碼為棒球聯盟統計網站專案的一部分。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
