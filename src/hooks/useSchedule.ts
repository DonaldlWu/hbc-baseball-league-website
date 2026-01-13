import { useState, useEffect } from 'react';
import { useRequest } from 'ahooks';
import { loadMonthSchedule } from '@/src/lib/dataLoader';
import type { ScheduleData } from '@/src/types';

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
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(initialYear || now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialMonth || now.getMonth() + 1);

  // 載入賽程資料
  const { data, loading, error, run } = useRequest(
    () => loadMonthSchedule(currentYear, currentMonth),
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
  };

  /**
   * 切換到上個月
   */
  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  /**
   * 切換到下個月
   */
  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  /**
   * 回到當前月份
   */
  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
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
