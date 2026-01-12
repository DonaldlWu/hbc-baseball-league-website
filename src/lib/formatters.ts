/**
 * Formatters
 * 格式化數據顯示的純函數
 */

/**
 * 格式化打擊率 (AVG, OBP, SLG 等)
 * @param value 數值
 * @returns 格式化後的字串 (例如：.375)
 */
export function formatAvg(value: number | null | undefined): string {
  if (value === null || value === undefined || value < 0) {
    return '-';
  }

  if (value >= 1) {
    return value.toFixed(3);
  }

  return value.toFixed(3).substring(1); // 移除開頭的 0
}

/**
 * 格式化百分比
 * @param value 數值
 * @param decimals 小數位數 (預設 1)
 * @returns 格式化後的字串 (例如：20.5%)
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || value < 0) {
    return '-';
  }

  return `${value.toFixed(decimals)}%`;
}

/**
 * 格式化數字
 * @param value 數值
 * @param decimals 小數位數 (預設 0)
 * @returns 格式化後的字串
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 0
): string {
  if (value === null || value === undefined) {
    return '-';
  }

  return value.toFixed(decimals);
}

/**
 * 格式化排名
 * @param rank 排名
 * @returns 格式化後的字串 (例如：1st, 2nd, 3rd, 4th)
 */
export function formatRank(rank: number | null | undefined): string {
  if (rank === null || rank === undefined || rank <= 0) {
    return '-';
  }

  const lastDigit = rank % 10;
  const lastTwoDigits = rank % 100;

  // 11, 12, 13 都用 th
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${rank}th`;
  }

  // 其他情況根據最後一位數字判斷
  switch (lastDigit) {
    case 1:
      return `${rank}st`;
    case 2:
      return `${rank}nd`;
    case 3:
      return `${rank}rd`;
    default:
      return `${rank}th`;
  }
}

/**
 * 格式化日期
 * @param date 日期字串或 Date 物件
 * @returns 格式化後的日期字串 (YYYY-MM-DD)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) {
    return '-';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch {
    return '-';
  }
}

/**
 * 格式化年份
 * @param year 年份
 * @returns 格式化後的年份字串
 */
export function formatSeasonYear(year: number | null | undefined): string {
  if (year === null || year === undefined || year <= 0) {
    return '-';
  }

  return String(year);
}

/**
 * 格式化球員名稱
 * @param name 球員名稱
 * @returns 格式化後的名稱
 */
export function formatPlayerName(name: string | null | undefined): string {
  if (!name || name.trim() === '') {
    return '-';
  }

  return name.trim();
}

/**
 * 根據統計類型格式化數值
 * @param statType 統計類型
 * @param value 數值
 * @returns 格式化後的字串
 */
export function formatStatValue(
  statType: string,
  value: number | null | undefined
): string {
  if (value === null || value === undefined) {
    return '-';
  }

  // 打擊率類型 (AVG, OBP, SLG, BABIP, wOBA, ISO)
  if (
    statType === 'avg' ||
    statType === 'obp' ||
    statType === 'slg' ||
    statType === 'babip' ||
    statType === 'wOBA' ||
    statType === 'iso'
  ) {
    return formatAvg(value);
  }

  // OPS 類型 (需要顯示 1.xxx)
  if (statType === 'ops') {
    return formatNumber(value, 3);
  }

  // 百分比類型 (K%, BB%)
  if (statType === 'kPct' || statType === 'bbPct') {
    return formatPercentage(value, 1);
  }

  // 進階數據指標 (OPS+, wRC+)
  if (statType === 'opsPlus' || statType === 'wRCPlus') {
    return formatNumber(value, 0);
  }

  // wRC 保留小數
  if (statType === 'wRC') {
    return formatNumber(value, 1);
  }

  // 預設為整數
  return formatNumber(value, 0);
}
