import type { TimeFormat } from '../store/types';

/**
 * Formats a time string based on the user's time format preference
 * @param time - Time in 24h format (e.g., "09:00", "14:30")
 * @param format - '12h' or '24h'
 * @returns Formatted time string
 */
export function formatTime(time: string, format: TimeFormat): string {
  if (!time) return '';

  // Handle already formatted times (e.g., "9:00 AM")
  if (time.includes('AM') || time.includes('PM')) {
    if (format === '24h') {
      return convertTo24Hour(time);
    }
    return time;
  }

  // Parse 24h format
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';

  if (isNaN(hours)) return time;

  if (format === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  }

  // 24h format
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Converts 12h time to 24h format
 */
export function convertTo24Hour(time: string): string {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Converts 24h time to 12h format
 */
export function convertTo12Hour(time: string): string {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';

  if (isNaN(hours)) return time;

  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
}

/**
 * Formats a time range
 */
export function formatTimeRange(start: string, end: string, format: TimeFormat): string {
  return `${formatTime(start, format)} - ${formatTime(end, format)}`;
}
