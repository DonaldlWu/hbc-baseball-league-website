// Jest globals (describe, it, expect) are automatically available
import { sortPlayers, SORT_OPTIONS } from '../playerSorter';
import type { PlayerSummary } from '@/src/types';

const makePlayer = (id: string, overrides: Partial<PlayerSummary['seasonStats']>): PlayerSummary => ({
  id,
  name: `Player ${id}`,
  number: '0',
  photo: '',
  team: 'TestTeam',
  seasonStats: {
    games: 10, pa: 40, ab: 35, hits: 10, singles: 8,
    doubles: 2, triples: 0, hr: 0, rbi: 5,
    runs: 5, bb: 4, so: 8, sb: 1, sf: 1, totalBases: 12,
    avg: 0.286, obp: 0.350, slg: 0.343, ops: 0.693,
    iso: 0.057, babip: 0.310, kPct: 20.0, bbPct: 10.0,
    ...overrides,
  },
  rankings: {},
});

describe('sortPlayers', () => {
  it('依 avg 降序排列，最高打擊率在前', () => {
    const players = [
      makePlayer('A', { avg: 0.250 }),
      makePlayer('B', { avg: 0.400 }),
      makePlayer('C', { avg: 0.300 }),
    ];
    const result = sortPlayers(players, 'avg', 'desc');
    expect(result[0].id).toBe('B');
    expect(result[2].id).toBe('A');
  });

  it('依 avg 升序排列，最低打擊率在前', () => {
    const players = [
      makePlayer('A', { avg: 0.250 }),
      makePlayer('B', { avg: 0.400 }),
    ];
    const result = sortPlayers(players, 'avg', 'asc');
    expect(result[0].id).toBe('A');
  });

  it('依 hr 降序排列', () => {
    const players = [
      makePlayer('A', { hr: 1 }),
      makePlayer('B', { hr: 5 }),
      makePlayer('C', { hr: 3 }),
    ];
    const result = sortPlayers(players, 'hr', 'desc');
    expect(result[0].id).toBe('B');
    expect(result[2].id).toBe('A');
  });

  it('依 ops 降序排列', () => {
    const players = [
      makePlayer('A', { ops: 0.700 }),
      makePlayer('B', { ops: 1.050 }),
    ];
    const result = sortPlayers(players, 'ops', 'desc');
    expect(result[0].id).toBe('B');
  });

  it('回傳新陣列，不修改原陣列', () => {
    const players = [makePlayer('A', { avg: 0.300 }), makePlayer('B', { avg: 0.400 })];
    const original = [...players];
    sortPlayers(players, 'avg', 'desc');
    expect(players).toEqual(original);
  });

  it('空陣列回傳空陣列', () => {
    expect(sortPlayers([], 'avg', 'desc')).toEqual([]);
  });

  it('只有一位球員時直接回傳', () => {
    const players = [makePlayer('A', { avg: 0.300 })];
    expect(sortPlayers(players, 'avg', 'desc')).toHaveLength(1);
  });
});

describe('SORT_OPTIONS', () => {
  it('應包含 8 個選項', () => {
    expect(SORT_OPTIONS).toHaveLength(8);
  });

  it('每個選項都有 field、label、defaultOrder', () => {
    for (const opt of SORT_OPTIONS) {
      expect(opt.field).toBeTruthy();
      expect(opt.label).toBeTruthy();
      expect(['asc', 'desc']).toContain(opt.defaultOrder);
    }
  });

  it('包含必要的排序欄位', () => {
    const fields = SORT_OPTIONS.map((o) => o.field);
    expect(fields).toContain('games');
    expect(fields).toContain('avg');
    expect(fields).toContain('ops');
    expect(fields).toContain('hr');
  });
});
