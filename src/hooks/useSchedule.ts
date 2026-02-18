import { useState } from 'react';
import { useRequest } from 'ahooks';
import { loadGamesByCalendarMonth } from '@/src/lib/seasonDataLoader';
import type { DaySchedule } from '@/src/types';

const STORAGE_KEY = 'hbc:schedule:month';

function getInitialMonth(
  initialYear?: number,
  initialMonth?: number
): { year: number; month: number } {
  const now = new Date();
  const today = { year: now.getFullYear(), month: now.getMonth() + 1 };

  if (initialYear !== undefined && initialMonth !== undefined) {
    return { year: initialYear, month: initialMonth };
  }

  if (typeof window === 'undefined') {
    return today;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return today;

    const parsed = JSON.parse(raw) as { year: number; month: number };
    if (parsed.month < 1 || parsed.month > 12) return today;

    return { year: parsed.year, month: parsed.month };
  } catch {
    return today;
  }
}

function saveToSession(year: number, month: number): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ year, month }));
  } catch {
    // 靜默處理 storage quota 錯誤
  }
}

/**
 * useSchedule Hook
 *
 * 管理賽程資料載入和月份切換
 *
 * @param initialYear 初始年份（預設為當前年份）
 * @param initialMonth 初始月份（預設為當前月份）
 *
 * @example
 * ```tsx
 * const { data, loading, error, currentYear, currentMonth, goToMonth } = useSchedule();
 *
 * // 切換月份
 * goToMonth(2026, 2);
 * ```
 */
export function useSchedule(
  initialYear?: number,
  initialMonth?: number
) {
  const initial = getInitialMonth(initialYear, initialMonth);
  const [currentYear, setCurrentYear] = useState(initial.year);
  const [currentMonth, setCurrentMonth] = useState(initial.month);

  // 載入賽程資料
  const { data, loading, error, run } = useRequest(
    (): Promise<DaySchedule[]> => loadGamesByCalendarMonth(currentYear, currentMonth),
    {
      refreshDeps: [currentYear, currentMonth],
    }
  );

  /**
   * 切換到指定年月
   */
  const goToMonth = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    saveToSession(year, month);
  };

  /**
   * 切換到上個月
   */
  const goToPreviousMonth = () => {
    const newYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const newMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    saveToSession(newYear, newMonth);
  };

  /**
   * 切換到下個月
   */
  const goToNextMonth = () => {
    const newYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const newMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    saveToSession(newYear, newMonth);
  };

  /**
   * 回到當前月份
   */
  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    data,
    loading,
    error,
    currentYear,
    currentMonth,
    goToMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    refresh: run,
  };
}
