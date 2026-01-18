import type { UnavailabilitySlot } from '../store/types';

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
