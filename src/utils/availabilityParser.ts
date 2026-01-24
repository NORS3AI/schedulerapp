import type { UnavailabilitySlot, PresenterAvailabilityEntry, AvailabilityDisplayItem, AvailabilityDayDisplay } from '../store/types';

/**
 * Availability Parser Utility - V1.1.4c
 *
 * Parses raw availability text from CSV imports into:
 * 1. Human-readable display format with color coding
 * 2. Structured data for auto-scheduling
 * 3. Database entries for persistent storage
 *
 * Handles:
 * - "I will not be able to teach Thursday, Aug. 31" → Unavailable (orange)
 * - "2:45p - 3:35p 3:45p - 4:35p" → Available times (green)
 * - Multiple days from spreadsheet columns (THURSDAY, August 31, etc.)
 *
 * V1.1.4c: Clean display format with bold day headers and times underneath
 */

// Re-export types for convenience
export type { AvailabilityDisplayItem, AvailabilityDayDisplay } from '../store/types';

// Day of week mapping
const dayOfWeekMap: Record<string, string> = {
  sunday: 'Sunday', sun: 'Sunday',
  monday: 'Monday', mon: 'Monday',
  tuesday: 'Tuesday', tue: 'Tuesday', tues: 'Tuesday',
  wednesday: 'Wednesday', wed: 'Wednesday',
  thursday: 'Thursday', thu: 'Thursday', thur: 'Thursday', thurs: 'Thursday',
  friday: 'Friday', fri: 'Friday',
  saturday: 'Saturday', sat: 'Saturday',
};

// Month abbreviations for display
const monthDisplayMap: Record<string, string> = {
  jan: 'Jan', january: 'Jan',
  feb: 'Feb', february: 'Feb',
  mar: 'Mar', march: 'Mar',
  apr: 'Apr', april: 'Apr',
  may: 'May',
  jun: 'Jun', june: 'Jun',
  jul: 'Jul', july: 'Jul',
  aug: 'Aug', august: 'Aug',
  sep: 'Sep', sept: 'Sep', september: 'Sep',
  oct: 'Oct', october: 'Oct',
  nov: 'Nov', november: 'Nov',
  dec: 'Dec', december: 'Dec',
};

// Time range structure for available/unavailable periods
export interface TimeRange {
  start: string; // "09:15" in 24h format
  end: string; // "10:05" in 24h format
  startDisplay: string; // "9:15 AM"
  endDisplay: string; // "10:05 AM"
}

// Structured availability for a single day
export interface DayAvailability {
  day: string; // "Monday", "Tuesday", etc. or "Day 1", "Day 2"
  dateInfo?: string; // Optional date like "Aug. 31"
  unavailableAllDay: boolean;
  availableTimeRanges: TimeRange[];
  unavailableTimeRanges: TimeRange[];
}

// Full parsed availability structure
export interface ParsedAvailability {
  days: DayAvailability[];
  rawText: string;
  humanReadable: string[];
  // V1.1.4a: Enhanced display items with color coding
  displayItems?: AvailabilityDisplayItem[];
  // V1.1.4c: Structured day display for cleaner presentation
  dayDisplays?: AvailabilityDayDisplay[];
}

/**
 * Parse time string to 24h format and display format
 * Handles: "9:15a", "9:15 AM", "14:00", "2:45p", "2:45pm", etc.
 * V1.1.4: Added validation for hours (0-23) and minutes (0-59)
 */
function parseTime(timeStr: string): { time24: string; display: string } | null {
  if (!timeStr) return null;

  const cleaned = timeStr.trim().toLowerCase();

  // Pattern: "9:15a", "9:15p", "9:15am", "9:15pm", "9:15 am", "9:15 pm"
  const match = cleaned.match(/^(\d{1,2}):?(\d{2})?\s*([ap])m?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const mins = match[2] ? parseInt(match[2], 10) : 0;
    const isPM = match[3].toLowerCase() === 'p';

    // V1.1.4: Validate hours and minutes
    if (hours < 1 || hours > 12 || mins < 0 || mins > 59) {
      return null; // Invalid time
    }

    // Convert to 24h
    let hours24 = hours;
    if (isPM && hours < 12) hours24 += 12;
    if (!isPM && hours === 12) hours24 = 0;

    // Create display format (12h) - use the original hours for display
    const displayHours = hours;
    const meridiem = isPM ? 'PM' : 'AM';

    const time24 = `${String(hours24).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    const display = `${displayHours}:${String(mins).padStart(2, '0')} ${meridiem}`;

    return { time24, display };
  }

  // Pattern: "14:00" (24h format)
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const mins = parseInt(match24[2], 10);

    // V1.1.4: Validate hours and minutes
    if (hours < 0 || hours > 23 || mins < 0 || mins > 59) {
      return null; // Invalid time
    }

    // Convert to display format
    let displayHours = hours;
    let meridiem = 'AM';
    if (hours >= 12) {
      meridiem = 'PM';
      if (hours > 12) displayHours = hours - 12;
    }
    if (hours === 0) displayHours = 12;

    const time24 = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    const display = `${displayHours}:${String(mins).padStart(2, '0')} ${meridiem}`;

    return { time24, display };
  }

  return null;
}

/**
 * Parse time range string like "9:15a - 10:05a" or "9:15a-10:05a"
 */
function parseTimeRange(rangeStr: string): TimeRange | null {
  // Split on dash with optional spaces
  const parts = rangeStr.split(/\s*-\s*/);
  if (parts.length !== 2) return null;

  const start = parseTime(parts[0].trim());
  const end = parseTime(parts[1].trim());

  if (!start || !end) return null;

  return {
    start: start.time24,
    end: end.time24,
    startDisplay: start.display,
    endDisplay: end.display,
  };
}

/**
 * Normalize day name to standard format
 */
function normalizeDay(dayStr: string): string {
  const lower = dayStr.toLowerCase().trim();
  return dayOfWeekMap[lower] || dayStr.trim();
}

/**
 * Format month for display
 */
function formatMonth(monthStr: string): string {
  const lower = monthStr.toLowerCase().trim().replace('.', '');
  return monthDisplayMap[lower] || monthStr.trim();
}

/**
 * Parse availability text and return structured data
 * Handles formats like:
 * - "Thursday: I will not be able to teach Thursday, Aug. 31"
 * - "Tuesday: 9:15a - 10:05a 2:15p - 3:05p 3:15p - 4:05p"
 */
export function parseAvailabilityText(rawText: string | undefined): ParsedAvailability | null {
  if (!rawText || rawText.trim().length === 0) {
    return null;
  }

  const days: DayAvailability[] = [];
  const humanReadable: string[] = [];

  // Split text into lines/entries (could be separated by newlines, semicolons, or be multiline entries)
  const lines = rawText.split(/[\n;]/).filter(line => line.trim());

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Pattern 1: "WEEKDAY: I will not be able to teach WEEKDAY, Month Day"
    // Example: "Thursday: I will not be able to teach Thursday, Aug. 31"
    const unavailablePattern = /^(\w+):\s*i will not be able to teach\s+(\w+),?\s*(\w+\.?)?\s*(\d+)?/i;
    const unavailableMatch = trimmedLine.match(unavailablePattern);

    if (unavailableMatch) {
      const dayName = normalizeDay(unavailableMatch[1] || unavailableMatch[2]);
      const monthStr = unavailableMatch[3] ? formatMonth(unavailableMatch[3]) : '';
      const dayNum = unavailableMatch[4] || '';

      const dateInfo = monthStr && dayNum ? `${monthStr}. ${dayNum}` : undefined;

      days.push({
        day: dayName,
        dateInfo,
        unavailableAllDay: true,
        availableTimeRanges: [],
        unavailableTimeRanges: [],
      });

      const displayText = dateInfo
        ? `Unavailable on ${dayName}, ${dateInfo}`
        : `Unavailable on ${dayName}`;
      humanReadable.push(displayText);
      continue;
    }

    // Pattern 2: "WEEKDAY: TIME_RANGE TIME_RANGE TIME_RANGE"
    // Example: "Tuesday: 9:15a - 10:05a 2:15p - 3:05p 3:15p - 4:05p"
    const availablePattern = /^(\w+):\s*(.+)$/;
    const availableMatch = trimmedLine.match(availablePattern);

    if (availableMatch) {
      const dayName = normalizeDay(availableMatch[1]);
      const timePart = availableMatch[2].trim();

      // Check if this looks like time ranges (contains digits and dashes/colons)
      if (/\d/.test(timePart) && /[-:]/.test(timePart)) {
        // Extract time ranges - they might be space-separated
        const timeRanges: TimeRange[] = [];

        // Try to find patterns like "9:15a - 10:05a" or "9:15a-10:05a"
        const rangePattern = /(\d{1,2}:?\d{0,2}\s*[ap]m?)\s*-\s*(\d{1,2}:?\d{0,2}\s*[ap]m?)/gi;
        let rangeMatch;

        while ((rangeMatch = rangePattern.exec(timePart)) !== null) {
          const range = parseTimeRange(`${rangeMatch[1]} - ${rangeMatch[2]}`);
          if (range) {
            timeRanges.push(range);
          }
        }

        if (timeRanges.length > 0) {
          days.push({
            day: dayName,
            unavailableAllDay: false,
            availableTimeRanges: timeRanges,
            unavailableTimeRanges: [],
          });

          // Build human-readable string with Oxford comma
          let timesStr = '';
          for (let i = 0; i < timeRanges.length; i++) {
            const r = timeRanges[i];
            if (i === 0) {
              timesStr += `${r.startDisplay} to ${r.endDisplay}`;
            } else if (i === timeRanges.length - 1) {
              timesStr += `, and ${r.startDisplay} to ${r.endDisplay}`;
            } else {
              timesStr += `, ${r.startDisplay} to ${r.endDisplay}`;
            }
          }

          humanReadable.push(`Available on ${dayName} from ${timesStr}`);
          continue;
        }
      }

      // If we couldn't parse time ranges, treat as unavailable text
      // Check for unavailability phrases in the time part
      if (/not\s*(be\s*)?available|cannot|can't|won't|will\s*not/i.test(timePart)) {
        days.push({
          day: dayName,
          unavailableAllDay: true,
          availableTimeRanges: [],
          unavailableTimeRanges: [],
        });
        humanReadable.push(`Unavailable on ${dayName}`);
        continue;
      }
    }

    // Pattern 3: Simple "Not available on WEEKDAY" or "Cannot teach on WEEKDAY"
    const simpleUnavailablePattern = /(?:not\s*available|cannot|can't|won't\s*be\s*able)\s*(?:on|to\s*teach)?\s*(\w+)/i;
    const simpleMatch = trimmedLine.match(simpleUnavailablePattern);

    if (simpleMatch) {
      const dayName = normalizeDay(simpleMatch[1]);
      if (dayOfWeekMap[dayName.toLowerCase()] || dayName.startsWith('Day')) {
        days.push({
          day: dayName,
          unavailableAllDay: true,
          availableTimeRanges: [],
          unavailableTimeRanges: [],
        });
        humanReadable.push(`Unavailable on ${dayName}`);
        continue;
      }
    }

    // If nothing matched, try to extract any day reference
    const anyDayPattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|day\s*\d+)\b/i;
    const anyDayMatch = trimmedLine.match(anyDayPattern);

    if (anyDayMatch) {
      // Couldn't parse structured data, but include in raw display
      humanReadable.push(trimmedLine);
    }
  }

  if (days.length === 0 && humanReadable.length === 0) {
    // No structured data found, just use raw text
    return {
      days: [],
      rawText,
      humanReadable: [rawText],
    };
  }

  return {
    days,
    rawText,
    humanReadable,
  };
}

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
  const [hours, mins] = timeStr.split(':').map(Number);
  return hours * 60 + (mins || 0);
}

/**
 * Check if a presenter is available at a specific day and time slot
 * Returns true if available, false if unavailable
 */
export function isPresenterAvailable(
  availability: ParsedAvailability | null,
  targetDay: string,
  targetTimeSlot: string // in 24h format "09:00"
): boolean {
  if (!availability || availability.days.length === 0) {
    return true; // No availability restrictions
  }

  // Normalize target day for comparison
  const normalizedTarget = targetDay.toLowerCase();

  for (const dayAvail of availability.days) {
    // Check if this day matches
    const normalizedDay = dayAvail.day.toLowerCase();
    const dayMatches =
      normalizedDay === normalizedTarget ||
      normalizedTarget.includes(normalizedDay) ||
      normalizedDay.includes(normalizedTarget);

    if (!dayMatches) continue;

    // If unavailable all day, return false
    if (dayAvail.unavailableAllDay) {
      return false;
    }

    // If there are available time ranges, check if target time falls within any
    if (dayAvail.availableTimeRanges.length > 0) {
      const targetMinutes = timeToMinutes(targetTimeSlot);

      const withinRange = dayAvail.availableTimeRanges.some(range => {
        const startMin = timeToMinutes(range.start);
        const endMin = timeToMinutes(range.end);
        return targetMinutes >= startMin && targetMinutes < endMin;
      });

      if (!withinRange) {
        return false; // Target time is outside all available ranges
      }
    }

    // If there are unavailable time ranges, check if target time falls within any
    if (dayAvail.unavailableTimeRanges.length > 0) {
      const targetMinutes = timeToMinutes(targetTimeSlot);

      const inUnavailableRange = dayAvail.unavailableTimeRanges.some(range => {
        const startMin = timeToMinutes(range.start);
        const endMin = timeToMinutes(range.end);
        return targetMinutes >= startMin && targetMinutes < endMin;
      });

      if (inUnavailableRange) {
        return false;
      }
    }
  }

  return true; // No matching restrictions found
}

/**
 * Get formatted availability summary for display
 */
export function getAvailabilitySummary(availability: ParsedAvailability | null): string[] {
  if (!availability) return [];
  return availability.humanReadable;
}

/**
 * V1.1.4a: Parse raw time ranges text like "2:45p - 3:35p 3:45p - 4:35p"
 * Returns array of properly formatted time ranges
 */
export function parseRawTimeRanges(text: string): TimeRange[] {
  const ranges: TimeRange[] = [];
  if (!text) return ranges;

  // Match patterns like "2:45p - 3:35p" or "2:45pm-3:35pm" or "2:45 PM - 3:35 PM"
  const rangePattern = /(\d{1,2}:?\d{0,2}\s*[ap]m?)\s*-\s*(\d{1,2}:?\d{0,2}\s*[ap]m?)/gi;
  let match;

  while ((match = rangePattern.exec(text)) !== null) {
    const range = parseTimeRange(`${match[1]} - ${match[2]}`);
    if (range) {
      ranges.push(range);
    }
  }

  return ranges;
}

/**
 * V1.1.4a: Format a single time range for display with proper AM/PM
 */
export function formatTimeRangeDisplay(range: TimeRange): string {
  return `${range.startDisplay} - ${range.endDisplay}`;
}

/**
 * V1.1.4a: Check if text indicates unavailability
 */
export function isUnavailabilityText(text: string): boolean {
  const lowerText = text.toLowerCase();
  return (
    lowerText.includes('will not be able to teach') ||
    lowerText.includes('cannot teach') ||
    lowerText.includes("can't teach") ||
    lowerText.includes('not available') ||
    lowerText.includes('unavailable') ||
    lowerText.includes("won't be able") ||
    lowerText.includes('unable to')
  );
}

/**
 * V1.1.4a: Enhanced availability parser that handles multiple days from spreadsheet
 * and returns structured display items with color coding
 */
export function parseAvailabilityEnhanced(
  rawText: string | undefined,
  additionalDayColumns?: Record<string, string> // { "Thursday, August 31": "9:00a - 10:00a" }
): ParsedAvailability | null {
  if ((!rawText || rawText.trim().length === 0) && (!additionalDayColumns || Object.keys(additionalDayColumns).length === 0)) {
    return null;
  }

  const days: DayAvailability[] = [];
  const humanReadable: string[] = [];
  const displayItems: AvailabilityDisplayItem[] = [];

  // Process raw text first
  if (rawText && rawText.trim().length > 0) {
    const lines = rawText.split(/[\n;]/).filter(line => line.trim());

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check for unavailability patterns
      if (isUnavailabilityText(trimmedLine)) {
        // Extract day information if present
        const dayMatch = trimmedLine.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i);
        const dateMatch = trimmedLine.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.\s]*(\d{1,2})\b/i);

        let dayName = dayMatch ? normalizeDay(dayMatch[1]) : undefined;
        let dateInfo = dateMatch ? `${formatMonth(dateMatch[1])}. ${dateMatch[2]}` : undefined;

        if (dayName) {
          days.push({
            day: dayName,
            dateInfo,
            unavailableAllDay: true,
            availableTimeRanges: [],
            unavailableTimeRanges: [],
          });
        }

        // Add to display items as unavailable (orange)
        const displayText = dayName
          ? (dateInfo ? `Unavailable on ${dayName}, ${dateInfo}` : `Unavailable on ${dayName}`)
          : trimmedLine;

        displayItems.push({
          text: displayText,
          type: 'unavailable',
        });
        humanReadable.push(displayText);
        continue;
      }

      // Check for time ranges (available times)
      const timeRanges = parseRawTimeRanges(trimmedLine);
      if (timeRanges.length > 0) {
        // Extract day info if present
        const dayPattern = /^(\w+):\s*/;
        const dayMatch = trimmedLine.match(dayPattern);
        let dayName: string | undefined;

        if (dayMatch) {
          dayName = normalizeDay(dayMatch[1]);
        }

        // Each time range gets its own line in display
        for (const range of timeRanges) {
          const displayText = formatTimeRangeDisplay(range);
          displayItems.push({
            text: displayText,
            type: 'available',
            timeRanges: [range],
          });
          humanReadable.push(dayName ? `Available on ${dayName}: ${displayText}` : displayText);
        }

        if (dayName) {
          days.push({
            day: dayName,
            unavailableAllDay: false,
            availableTimeRanges: timeRanges,
            unavailableTimeRanges: [],
          });
        }
        continue;
      }

      // If we can't parse it, add as neutral
      displayItems.push({
        text: trimmedLine,
        type: 'neutral',
      });
      humanReadable.push(trimmedLine);
    }
  }

  // Process additional day columns from spreadsheet
  if (additionalDayColumns) {
    for (const [columnName, value] of Object.entries(additionalDayColumns)) {
      if (!value || value.trim().length === 0) continue;

      // Extract day from column name (e.g., "THURSDAY, August 31")
      const dayMatch = columnName.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
      const dateMatch = columnName.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\b/i);

      const dayName = dayMatch ? normalizeDay(dayMatch[1]) : undefined;
      const dateInfo = dateMatch ? `${dateMatch[1].charAt(0).toUpperCase() + dateMatch[1].slice(1).toLowerCase()} ${dateMatch[2]}` : undefined;

      // Check if value indicates unavailability
      if (isUnavailabilityText(value)) {
        if (dayName) {
          days.push({
            day: dayName,
            dateInfo,
            unavailableAllDay: true,
            availableTimeRanges: [],
            unavailableTimeRanges: [],
          });
        }

        const displayText = dayName
          ? (dateInfo ? `Unavailable on ${dayName}, ${dateInfo}` : `Unavailable on ${dayName}`)
          : value;

        displayItems.push({
          text: displayText,
          type: 'unavailable',
        });
        humanReadable.push(displayText);
        continue;
      }

      // Parse time ranges from value
      const timeRanges = parseRawTimeRanges(value);
      if (timeRanges.length > 0) {
        // Each time range on its own line for display
        for (const range of timeRanges) {
          const displayText = formatTimeRangeDisplay(range);
          const fullText = dayName
            ? (dateInfo ? `${dayName}, ${dateInfo}: ${displayText}` : `${dayName}: ${displayText}`)
            : displayText;

          displayItems.push({
            text: fullText,
            type: 'available',
            timeRanges: [range],
          });
          humanReadable.push(fullText);
        }

        if (dayName) {
          // Check if we already have this day
          const existingDay = days.find(d => d.day === dayName);
          if (existingDay) {
            existingDay.availableTimeRanges.push(...timeRanges);
          } else {
            days.push({
              day: dayName,
              dateInfo,
              unavailableAllDay: false,
              availableTimeRanges: timeRanges,
              unavailableTimeRanges: [],
            });
          }
        }
      }
    }
  }

  if (days.length === 0 && humanReadable.length === 0) {
    // No structured data found
    const text = rawText || '';
    return {
      days: [],
      rawText: text,
      humanReadable: text ? [text] : [],
      displayItems: text ? [{ text, type: 'neutral' }] : [],
      dayDisplays: [],
    };
  }

  // V1.1.4d: Consolidate duplicate days and build clean dayDisplays structure
  const dayMap = new Map<string, AvailabilityDayDisplay>();

  for (const day of days) {
    const key = day.day.toLowerCase();
    const existing = dayMap.get(key);

    if (existing) {
      // Merge time ranges, avoid duplicates
      if (!day.unavailableAllDay && day.availableTimeRanges.length > 0) {
        for (const range of day.availableTimeRanges) {
          const isDuplicate = existing.timeRanges.some(
            r => r.start === range.start && r.end === range.end
          );
          if (!isDuplicate) {
            existing.timeRanges.push({
              start: range.start,
              end: range.end,
              startDisplay: range.startDisplay,
              endDisplay: range.endDisplay,
            });
          }
        }
      }
      // If any entry says unavailable, mark as unavailable
      if (day.unavailableAllDay) {
        existing.type = 'unavailable';
        existing.timeRanges = []; // Clear time ranges for unavailable days
      }
      // Update dateInfo if not set
      if (!existing.dateInfo && day.dateInfo) {
        existing.dateInfo = day.dateInfo;
      }
    } else {
      dayMap.set(key, {
        dayName: day.day,
        dateInfo: day.dateInfo,
        type: day.unavailableAllDay ? 'unavailable' : 'available',
        timeRanges: day.availableTimeRanges.map(r => ({
          start: r.start,
          end: r.end,
          startDisplay: r.startDisplay,
          endDisplay: r.endDisplay,
        })),
      });
    }
  }

  // Sort time ranges within each day
  for (const dayDisplay of dayMap.values()) {
    dayDisplay.timeRanges.sort((a, b) => a.start.localeCompare(b.start));
  }

  // Convert map to array and sort by day order
  const dayOrder = ['thursday', 'friday', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday'];
  const dayDisplays: AvailabilityDayDisplay[] = Array.from(dayMap.values()).sort((a, b) => {
    const aIdx = dayOrder.indexOf(a.dayName.toLowerCase());
    const bIdx = dayOrder.indexOf(b.dayName.toLowerCase());
    if (aIdx === -1 && bIdx === -1) return a.dayName.localeCompare(b.dayName);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  return {
    days,
    rawText: rawText || '',
    humanReadable,
    displayItems,
    dayDisplays,
  };
}

/**
 * V1.1.4a: Build presenter availability database entry from session data
 */
export function buildPresenterAvailabilityEntry(
  presenterId: string,
  presenterName: string,
  parsedAvailability: ParsedAvailability | null,
  preferredRoomId?: string,
  preferStayInRoom?: boolean,
  rawText?: string
): PresenterAvailabilityEntry {
  const entry: PresenterAvailabilityEntry = {
    presenterId,
    presenterName,
    unavailableDays: [],
    availableDays: [],
    preferredRoomId,
    preferStayInRoom,
    rawAvailabilityText: rawText,
    lastUpdated: Date.now(),
  };

  if (parsedAvailability) {
    for (const day of parsedAvailability.days) {
      if (day.unavailableAllDay) {
        entry.unavailableDays.push(day.day);
      } else if (day.availableTimeRanges.length > 0) {
        entry.availableDays.push({
          day: day.day,
          timeRanges: day.availableTimeRanges.map(r => ({
            start: r.start,
            end: r.end,
            startDisplay: r.startDisplay,
            endDisplay: r.endDisplay,
          })),
        });
      }
    }
  }

  return entry;
}

/**
 * V1.1.4a: Check if a presenter is available at a specific day and time using database entry
 */
export function isPresenterAvailableFromEntry(
  entry: PresenterAvailabilityEntry | undefined,
  targetDay: string,
  targetTimeSlot: string // in 24h format "09:00"
): boolean {
  if (!entry) return true; // No restrictions

  const normalizedTarget = targetDay.toLowerCase();

  // Check if unavailable all day
  for (const unavailDay of entry.unavailableDays) {
    const normalizedDay = unavailDay.toLowerCase();
    if (normalizedDay === normalizedTarget ||
        normalizedTarget.includes(normalizedDay) ||
        normalizedDay.includes(normalizedTarget)) {
      return false;
    }
  }

  // Check if there are specific available times
  for (const availDay of entry.availableDays) {
    const normalizedDay = availDay.day.toLowerCase();
    if (normalizedDay === normalizedTarget ||
        normalizedTarget.includes(normalizedDay) ||
        normalizedDay.includes(normalizedTarget)) {
      // Has specific time ranges - check if target time falls within any
      if (availDay.timeRanges.length > 0) {
        const targetMinutes = timeToMinutes(targetTimeSlot);
        const withinRange = availDay.timeRanges.some(range => {
          const startMin = timeToMinutes(range.start);
          const endMin = timeToMinutes(range.end);
          return targetMinutes >= startMin && targetMinutes < endMin;
        });
        if (!withinRange) {
          return false;
        }
      }
    }
  }

  return true;
}

// ============================================================================
// Legacy Functions (maintained for backwards compatibility)
// ============================================================================

/**
 * Parse unavailability text like:
 * - "I will not be able to teach Thursday, Aug. 31."
 * - "Not available: Monday, Tuesday"
 * - "Cannot teach Wednesday afternoon"
 */
export function parseUnavailabilityText(text: string, eventDays: string[]): { slots: UnavailabilitySlot[]; rawText: string } {
  if (!text || typeof text !== 'string') {
    return { slots: [], rawText: '' };
  }

  const slots: UnavailabilitySlot[] = [];
  const rawText = text.trim();

  // Common patterns for unavailability
  const unavailablePatterns = [
    /will not be able to teach\s+(.+)/i,
    /cannot teach\s+(.+)/i,
    /not available[:\s]+(.+)/i,
    /unavailable[:\s]+(.+)/i,
  ];

  // Day names and abbreviations
  const dayPatterns: Record<string, RegExp> = {
    'sunday': /\b(sunday|sun\.?)\b/i,
    'monday': /\b(monday|mon\.?)\b/i,
    'tuesday': /\b(tuesday|tue\.?|tues\.?)\b/i,
    'wednesday': /\b(wednesday|wed\.?)\b/i,
    'thursday': /\b(thursday|thu\.?|thur\.?|thurs\.?)\b/i,
    'friday': /\b(friday|fri\.?)\b/i,
    'saturday': /\b(saturday|sat\.?)\b/i,
  };

  // Month abbreviations for date matching
  const monthPatterns = [
    /jan(?:uary)?\.?\s*\d{1,2}/i,
    /feb(?:ruary)?\.?\s*\d{1,2}/i,
    /mar(?:ch)?\.?\s*\d{1,2}/i,
    /apr(?:il)?\.?\s*\d{1,2}/i,
    /may\.?\s*\d{1,2}/i,
    /jun(?:e)?\.?\s*\d{1,2}/i,
    /jul(?:y)?\.?\s*\d{1,2}/i,
    /aug(?:ust)?\.?\s*\d{1,2}/i,
    /sep(?:t(?:ember)?)?\.?\s*\d{1,2}/i,
    /oct(?:ober)?\.?\s*\d{1,2}/i,
    /nov(?:ember)?\.?\s*\d{1,2}/i,
    /dec(?:ember)?\.?\s*\d{1,2}/i,
  ];

  // Try to extract the unavailability portion
  let relevantText = text;
  for (const pattern of unavailablePatterns) {
    const match = text.match(pattern);
    if (match) {
      relevantText = match[1];
      break;
    }
  }

  // Look for day names in the text
  for (const [dayName, pattern] of Object.entries(dayPatterns)) {
    if (pattern.test(relevantText)) {
      // Find matching event day
      const matchingDay = eventDays.find(d =>
        d.toLowerCase().includes(dayName) ||
        new RegExp(`day\\s+\\d+`, 'i').test(d) // Skip generic "Day 1" etc
      );

      if (matchingDay) {
        // Add for all time slots (will be refined later)
        slots.push({
          day: matchingDay,
          timeSlot: '*', // Indicates all day
        });
      } else {
        // If no matching event day, use the detected day name capitalized
        slots.push({
          day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          timeSlot: '*',
        });
      }
    }
  }

  // Also check for date patterns (e.g., "Aug. 31")
  for (const pattern of monthPatterns) {
    const match = relevantText.match(pattern);
    if (match) {
      // Try to find matching event day that contains this date
      const dateStr = match[0];
      const matchingDay = eventDays.find(d =>
        d.toLowerCase().includes(dateStr.toLowerCase().replace(/\./g, ''))
      );

      if (matchingDay && !slots.some(s => s.day === matchingDay)) {
        slots.push({
          day: matchingDay,
          timeSlot: '*',
        });
      }
    }
  }

  return { slots, rawText };
}

/**
 * Detect availability column headers that contain date information
 * e.g., "THURSDAY, August 31 (Select ALL times which you would be available to teach this day.)"
 */
export function detectAvailabilityColumns(headers: string[]): Array<{ column: string; dayOfWeek: string; date: string }> {
  const results: Array<{ column: string; dayOfWeek: string; date: string }> = [];

  // Pattern: "DAY_NAME, MONTH DAY" with optional additional text
  const pattern = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i;

  for (const header of headers) {
    const match = header.match(pattern);
    if (match) {
      results.push({
        column: header,
        dayOfWeek: match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase(),
        date: `${match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase()} ${match[3]}`,
      });
    }
  }

  return results;
}

/**
 * Parse availability responses from column data
 * Columns like "THURSDAY, August 31" might have values like "9:00 AM - 10:00 AM, 10:00 AM - 11:00 AM"
 */
export function parseAvailabilityColumnValue(
  value: string,
  column: { dayOfWeek: string; date: string },
  allTimeSlots: string[]
): UnavailabilitySlot[] {
  if (!value || typeof value !== 'string') {
    // If no value, assume unavailable for all slots on this day
    return allTimeSlots.map(slot => ({
      day: column.dayOfWeek,
      timeSlot: slot,
    }));
  }

  // Parse the available times
  const availableTimes = value.split(/,|;/).map(t => t.trim()).filter(Boolean);

  // If specific times are listed, those are AVAILABLE times
  // So unavailable times are all others
  if (availableTimes.length > 0) {
    const unavailable: UnavailabilitySlot[] = [];

    for (const slot of allTimeSlots) {
      // Check if this slot is in the available times
      const isAvailable = availableTimes.some(avail => {
        // Try to match the time
        const slotTime = slot.toLowerCase().replace(/\s/g, '');
        const availTime = avail.toLowerCase().replace(/\s/g, '');
        return availTime.includes(slotTime) || slotTime.includes(availTime.split('-')[0]);
      });

      if (!isAvailable) {
        unavailable.push({
          day: column.dayOfWeek,
          timeSlot: slot,
        });
      }
    }

    return unavailable;
  }

  return [];
}

/**
 * Check if a session is scheduled during an unavailable time
 */
export function isScheduledDuringUnavailableTime(
  sessionDay: string | undefined,
  sessionTimeSlot: string | undefined,
  unavailability: UnavailabilitySlot[]
): boolean {
  if (!sessionDay || !sessionTimeSlot || !unavailability || unavailability.length === 0) {
    return false;
  }

  return unavailability.some(slot => {
    const dayMatch = slot.day === sessionDay ||
                     slot.day.toLowerCase() === sessionDay.toLowerCase() ||
                     sessionDay.toLowerCase().includes(slot.day.toLowerCase());

    if (!dayMatch) return false;

    // Check time slot
    if (slot.timeSlot === '*') {
      // Unavailable all day
      return true;
    }

    return slot.timeSlot === sessionTimeSlot ||
           slot.timeSlot.toLowerCase() === sessionTimeSlot.toLowerCase();
  });
}
