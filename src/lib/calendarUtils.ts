import type { Game } from '@/src/types';

/**
 * 將台灣時間（UTC+8）的日期與時間轉為 UTC，格式化為 Google Calendar 所需的 YYYYMMDDTHHMMSSZ
 */
function toGoogleCalDateTime(date: string, time: string): string {
  const dt = new Date(`${date}T${time}:00+08:00`);
  return dt.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
}

/**
 * 格式化為 ICS 本地時間：YYYYMMDDTHHMMSS（搭配 TZID=Asia/Taipei）
 */
function toICSLocalDateTime(date: string, time: string): string {
  const [y, m, d] = date.split('-');
  const [h, min] = time.split(':');
  return `${y}${m}${d}T${h}${min}00`;
}

/**
 * 產生 Google Calendar 新增活動的 URL
 */
export function generateGoogleCalendarUrl(
  game: Game,
  date: string,
  venueMapUrl?: string
): string {
  const title = encodeURIComponent(`⚾ ${game.awayTeam} vs ${game.homeTeam}`);
  const start = toGoogleCalDateTime(date, game.startTime);
  const end = toGoogleCalDateTime(date, game.endTime);
  const locationStr = venueMapUrl ? `${game.venue} ${venueMapUrl}` : game.venue;
  const details = encodeURIComponent(
    `HBC 棒球聯盟\n比賽編號：${game.gameNumber}\n客隊：${game.awayTeam}　主隊：${game.homeTeam}`
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${encodeURIComponent(locationStr)}&details=${details}`;
}

/**
 * 產生 ICS 檔案內容（相容 Apple 日曆、Outlook、其他支援 .ics 的行事曆 App）
 */
export function generateICSContent(
  game: Game,
  date: string,
  venueMapUrl?: string
): string {
  const start = toICSLocalDateTime(date, game.startTime);
  const end = toICSLocalDateTime(date, game.endTime);
  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const title = `⚾ ${game.awayTeam} vs ${game.homeTeam}`;
  const location = venueMapUrl ? `${game.venue}\\n${venueMapUrl}` : game.venue;
  const description = `HBC 棒球聯盟\\n比賽編號：${game.gameNumber}\\n客隊：${game.awayTeam}　主隊：${game.homeTeam}`;
  const uid = `${game.gameNumber}@hbc-baseball-league`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HBC Baseball League//TW',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART;TZID=Asia/Taipei:${start}`,
    `DTEND;TZID=Asia/Taipei:${end}`,
    `DTSTAMP:${now}`,
    `UID:${uid}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * 觸發 .ics 檔案下載（iOS 會自動開啟 Apple 日曆）
 */
export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
