import { renderHook, act } from '@testing-library/react';
import { useSchedule } from '../useSchedule';
import { loadGamesByCalendarMonth } from '@/src/lib/seasonDataLoader';
import type { DaySchedule } from '@/src/types';

jest.mock('@/src/lib/seasonDataLoader');

const mockLoadGamesByCalendarMonth = loadGamesByCalendarMonth as jest.MockedFunction<
  typeof loadGamesByCalendarMonth
>;

const STORAGE_KEY = 'hbc:schedule:month';

describe('useSchedule', () => {
  const mockData: DaySchedule[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockLoadGamesByCalendarMonth.mockResolvedValue(mockData);
  });

  describe('初始月份狀態', () => {
    it('若有傳入 initialYear/initialMonth props 應優先使用', () => {
      const { result } = renderHook(() => useSchedule(2025, 4));

      expect(result.current.currentYear).toBe(2025);
      expect(result.current.currentMonth).toBe(4);
    });

    it('(a) sessionStorage 有效時應正確恢復月份', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ year: 2025, month: 8 }));

      const { result } = renderHook(() => useSchedule());

      expect(result.current.currentYear).toBe(2025);
      expect(result.current.currentMonth).toBe(8);
    });

    it('(b) sessionStorage 不存在時應 fallback 到今天', () => {
      const now = new Date();

      const { result } = renderHook(() => useSchedule());

      expect(result.current.currentYear).toBe(now.getFullYear());
      expect(result.current.currentMonth).toBe(now.getMonth() + 1);
    });

    it('(c) sessionStorage 內容為亂碼時應 fallback 到今天', () => {
      sessionStorage.setItem(STORAGE_KEY, 'invalid-json-###');
      const now = new Date();

      const { result } = renderHook(() => useSchedule());

      expect(result.current.currentYear).toBe(now.getFullYear());
      expect(result.current.currentMonth).toBe(now.getMonth() + 1);
    });

    it('sessionStorage month 超出 1-12 範圍時應 fallback 到今天', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ year: 2025, month: 13 }));
      const now = new Date();

      const { result } = renderHook(() => useSchedule());

      expect(result.current.currentYear).toBe(now.getFullYear());
      expect(result.current.currentMonth).toBe(now.getMonth() + 1);
    });

    it('sessionStorage month 為 0 時應 fallback 到今天', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ year: 2025, month: 0 }));
      const now = new Date();

      const { result } = renderHook(() => useSchedule());

      expect(result.current.currentYear).toBe(now.getFullYear());
      expect(result.current.currentMonth).toBe(now.getMonth() + 1);
    });

    it('props 優先於 sessionStorage', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ year: 2024, month: 6 }));

      const { result } = renderHook(() => useSchedule(2025, 4));

      expect(result.current.currentYear).toBe(2025);
      expect(result.current.currentMonth).toBe(4);
    });
  });

  describe('goToMonth', () => {
    it('(d) goToMonth 呼叫後 sessionStorage 應有正確值', () => {
      const { result } = renderHook(() => useSchedule());

      act(() => {
        result.current.goToMonth(2026, 3);
      });

      expect(result.current.currentYear).toBe(2026);
      expect(result.current.currentMonth).toBe(3);

      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) as string);
      expect(stored).toEqual({ year: 2026, month: 3 });
    });
  });

  describe('goToPreviousMonth', () => {
    it('一般情況下應切換到上個月並寫入 sessionStorage', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ year: 2026, month: 5 }));
      const { result } = renderHook(() => useSchedule());

      act(() => {
        result.current.goToPreviousMonth();
      });

      expect(result.current.currentYear).toBe(2026);
      expect(result.current.currentMonth).toBe(4);

      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) as string);
      expect(stored).toEqual({ year: 2026, month: 4 });
    });

    it('從 1 月往前應切換到上一年 12 月並寫入 sessionStorage', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ year: 2026, month: 1 }));
      const { result } = renderHook(() => useSchedule());

      act(() => {
        result.current.goToPreviousMonth();
      });

      expect(result.current.currentYear).toBe(2025);
      expect(result.current.currentMonth).toBe(12);

      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) as string);
      expect(stored).toEqual({ year: 2025, month: 12 });
    });
  });

  describe('goToNextMonth', () => {
    it('一般情況下應切換到下個月並寫入 sessionStorage', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ year: 2026, month: 5 }));
      const { result } = renderHook(() => useSchedule());

      act(() => {
        result.current.goToNextMonth();
      });

      expect(result.current.currentYear).toBe(2026);
      expect(result.current.currentMonth).toBe(6);

      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) as string);
      expect(stored).toEqual({ year: 2026, month: 6 });
    });

    it('從 12 月往後應切換到下一年 1 月並寫入 sessionStorage', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ year: 2025, month: 12 }));
      const { result } = renderHook(() => useSchedule());

      act(() => {
        result.current.goToNextMonth();
      });

      expect(result.current.currentYear).toBe(2026);
      expect(result.current.currentMonth).toBe(1);

      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) as string);
      expect(stored).toEqual({ year: 2026, month: 1 });
    });
  });

  describe('goToToday', () => {
    it('(e) goToToday 呼叫後 sessionStorage 應被清除', () => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ year: 2025, month: 8 }));
      const { result } = renderHook(() => useSchedule());
      const now = new Date();

      act(() => {
        result.current.goToToday();
      });

      expect(result.current.currentYear).toBe(now.getFullYear());
      expect(result.current.currentMonth).toBe(now.getMonth() + 1);
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('對外 API 不變', () => {
    it('應回傳所有預期的屬性', () => {
      const { result } = renderHook(() => useSchedule());

      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('currentYear');
      expect(result.current).toHaveProperty('currentMonth');
      expect(result.current).toHaveProperty('goToMonth');
      expect(result.current).toHaveProperty('goToPreviousMonth');
      expect(result.current).toHaveProperty('goToNextMonth');
      expect(result.current).toHaveProperty('goToToday');
      expect(result.current).toHaveProperty('refresh');
    });
  });
});
