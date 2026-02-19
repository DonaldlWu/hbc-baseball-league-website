import { SORT_OPTIONS } from '@/src/lib/playerSorter';
import type { SortableStatField, SortOrder } from '@/src/types';

interface PlayerSortBarProps {
  currentField: SortableStatField;
  currentOrder: SortOrder;
  onChange: (field: SortableStatField) => void;
}

export function PlayerSortBar({ currentField, currentOrder, onChange }: PlayerSortBarProps) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="player-sort" className="text-sm font-medium text-gray-700">
        排序：
      </label>
      <select
        id="player-sort"
        value={currentField}
        onChange={(e) => onChange(e.target.value as SortableStatField)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.field} value={opt.field}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        onClick={() => onChange(currentField)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        aria-label={currentOrder === 'desc' ? '目前降序，點擊切換升序' : '目前升序，點擊切換降序'}
      >
        {currentOrder === 'desc' ? '高 → 低' : '低 → 高'}
      </button>
    </div>
  );
}
