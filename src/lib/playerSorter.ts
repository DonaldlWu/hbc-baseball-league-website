import type { PlayerSummary, SortableStatField, SortOrder, SortOption } from '@/src/types';

export function sortPlayers(
  players: PlayerSummary[],
  field: SortableStatField,
  order: SortOrder
): PlayerSummary[] {
  return [...players].sort((a, b) => {
    const aVal = a.seasonStats[field] ?? 0;
    const bVal = b.seasonStats[field] ?? 0;
    return order === 'desc' ? bVal - aVal : aVal - bVal;
  });
}

export const SORT_OPTIONS: readonly SortOption[] = [
  { field: 'games', label: '出賽數', defaultOrder: 'desc' },
  { field: 'pa',    label: '打席數', defaultOrder: 'desc' },
  { field: 'avg',   label: '打擊率', defaultOrder: 'desc' },
  { field: 'hits',  label: '安打',   defaultOrder: 'desc' },
  { field: 'hr',    label: '全壘打', defaultOrder: 'desc' },
  { field: 'rbi',   label: '打點',   defaultOrder: 'desc' },
  { field: 'ops',   label: 'OPS',   defaultOrder: 'desc' },
  { field: 'obp',   label: '上壘率', defaultOrder: 'desc' },
] as const;
