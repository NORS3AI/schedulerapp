import Papa from 'papaparse';
import type { Session, ColumnMapping, ColumnMappingValue, UnavailabilitySlot } from '../store/types';

export interface ParseResult {
  data: Record<string, string>[];
  headers: string[];
  errors: string[];
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const data = results.data as Record<string, string>[];
        const errors = results.errors.map((e) => e.message);
        resolve({ data, headers, errors });
      },
      error: (error) => {
        resolve({ data: [], headers: [], errors: [error.message] });
      },
    });
  });
}

export function parseExcel(file: File): Promise<ParseResult> {
  return new Promise(async (resolve) => {
    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
        defval: '',
      });

      if (jsonData.length > 0) {
        const headers = Object.keys(jsonData[0]);
        resolve({ data: jsonData, headers, errors: [] });
      } else {
        resolve({ data: [], headers: [], errors: ['Empty spreadsheet'] });
      }
    } catch (error) {
      resolve({
        data: [],
        headers: [],
        errors: [error instanceof Error ? error.message : 'Failed to parse Excel file'],
      });
    }
  });
}

export function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') {
    return parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  }
  return Promise.resolve({
    data: [],
    headers: [],
    errors: ['Unsupported file type. Please use CSV or Excel files.'],
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get value from mapping - handles column, custom, or none
function getMappingValue(
  row: Record<string, string>,
  mapping: ColumnMappingValue | undefined
): string | undefined {
  if (!mapping || mapping.type === 'none') {
    return undefined;
  }
  if (mapping.type === 'custom') {
    return mapping.customValue;
  }
  if (mapping.type === 'column' && mapping.column) {
    return row[mapping.column]?.trim() || undefined;
  }
  return undefined;
}

// Parse time with flexible format: "9:00", "9:00a", "9:00 AM", "14:00", "2:45p", etc.
function parseTimeString(timeStr: string): string | undefined {
  if (!timeStr) return undefined;

  const cleaned = timeStr.trim().toLowerCase();

  // Check for 'a' or 'p' suffix (e.g., "2:45p", "9a", "10:30a")
  const suffixMatch = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])m?$/i);
  if (suffixMatch) {
    let hours = parseInt(suffixMatch[1], 10);
    const mins = suffixMatch[2] ? parseInt(suffixMatch[2], 10) : 0;
    const isPM = suffixMatch[3].toLowerCase() === 'p';

    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  // Check for full AM/PM format (e.g., "9:00 AM", "2:30 PM")
  const fullMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (fullMatch) {
    let hours = parseInt(fullMatch[1], 10);
    const mins = parseInt(fullMatch[2], 10);
    const isPM = fullMatch[3].toLowerCase() === 'pm';

    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  // Check for 24-hour format (e.g., "14:00", "9:00")
  const militaryMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (militaryMatch) {
    const hours = parseInt(militaryMatch[1], 10);
    const mins = parseInt(militaryMatch[2], 10);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  return undefined;
}

// Month abbreviations mapping
const monthMap: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

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

// Parse unavailability from a string with multiple formats:
// - "Day 1: 9:00, 10:00; Day 2: 11:00"
// - "I will not be able to teach Wednesday, Jan 15"
// - "I will not be able to teach Thursday, January 16"
function parseUnavailability(value: string | undefined): UnavailabilitySlot[] {
  if (!value) return [];

  const slots: UnavailabilitySlot[] = [];

  // Pattern 1: "I will not be able to teach WEEKDAY, MONTH DAY"
  // Examples: "I will not be able to teach Wednesday, Jan 15"
  //           "I will not be able to teach Thursday, January 16"
  const teachPattern = /i will not be able to teach\s+(\w+),?\s*(\w+)\.?\s*(\d+)/gi;
  let teachMatch;
  while ((teachMatch = teachPattern.exec(value)) !== null) {
    const weekday = teachMatch[1].toLowerCase();
    const monthStr = teachMatch[2].toLowerCase();
    // dayNum (teachMatch[3]) is captured but not used - we only need the weekday for scheduling

    // Try to parse as weekday + month day
    if (dayOfWeekMap[weekday] && monthMap[monthStr] !== undefined) {
      // Format as "Day X" based on common conference day names, or use the weekday
      const dayLabel = dayOfWeekMap[weekday];
      // Add slot for all time slots on that day (mark as unavailable all day)
      slots.push({ day: dayLabel, timeSlot: 'all' });
    }
  }

  // Pattern 2: Standard format "Day 1: 9:00, 10:00; Day 2: 11:00"
  const dayParts = value.split(';');

  for (const dayPart of dayParts) {
    const colonIdx = dayPart.indexOf(':');
    if (colonIdx === -1) continue;

    const dayName = dayPart.substring(0, colonIdx).trim();
    const times = dayPart.substring(colonIdx + 1).trim();

    if (dayName && times) {
      const timeList = times.split(',').map(t => t.trim());
      for (const time of timeList) {
        if (time) {
          const parsedTime = parseTimeString(time);
          slots.push({ day: dayName, timeSlot: parsedTime || time });
        }
      }
    }
  }

  return slots;
}

export function mapDataToSessions(
  data: Record<string, string>[],
  mapping: ColumnMapping
): Session[] {
  const sessions: Session[] = [];

  data.forEach((row, rowIndex) => {
    const firstName = getMappingValue(row, mapping.presenterFirstName) || '';
    const lastName = getMappingValue(row, mapping.presenterLastName) || '';
    const presenterName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown Presenter';

    const coFirstName = getMappingValue(row, mapping.coPresenterFirstName) || '';
    const coLastName = getMappingValue(row, mapping.coPresenterLastName) || '';
    const coPresenterName = [coFirstName, coLastName].filter(Boolean).join(' ') || undefined;

    const durationStr = getMappingValue(row, mapping.duration);
    const attendeesStr = getMappingValue(row, mapping.expectedAttendees);
    const unavailabilityStr = getMappingValue(row, mapping.unavailableTimes);
    const unavailability = parseUnavailability(unavailabilityStr);

    // Base presenter info for all breakouts from this row
    const baseInfo = {
      presenterName,
      presenterFirstName: firstName || undefined,
      presenterLastName: lastName || undefined,
      presenterEmail: getMappingValue(row, mapping.presenterEmail),
      presenterPhone: getMappingValue(row, mapping.presenterPhone),
      presenterCompany: getMappingValue(row, mapping.presenterCompany),
      presenterTitle: getMappingValue(row, mapping.presenterTitle),
      coPresenterName,
      coPresenterFirstName: coFirstName || undefined,
      coPresenterLastName: coLastName || undefined,
      coPresenterEmail: getMappingValue(row, mapping.coPresenterEmail),
      coPresenterPhone: getMappingValue(row, mapping.coPresenterPhone),
      duration: durationStr ? parseInt(durationStr, 10) || 60 : 60,
      expectedAttendees: attendeesStr ? parseInt(attendeesStr, 10) : undefined,
      unavailability,
      originalData: row,
      sourceRowIndex: rowIndex,
    };

    // Create session for Breakout 1
    const breakout1Title = getMappingValue(row, mapping.breakout1Title);
    if (breakout1Title) {
      sessions.push({
        id: generateId(),
        sessionTitle: breakout1Title,
        description: getMappingValue(row, mapping.breakout1Description),
        breakoutNumber: 1,
        ...baseInfo,
      });
    }

    // Create session for Breakout 2
    const breakout2Title = getMappingValue(row, mapping.breakout2Title);
    if (breakout2Title) {
      sessions.push({
        id: generateId(),
        sessionTitle: breakout2Title,
        description: getMappingValue(row, mapping.breakout2Description),
        breakoutNumber: 2,
        ...baseInfo,
      });
    }

    // Create session for Breakout 3
    const breakout3Title = getMappingValue(row, mapping.breakout3Title);
    if (breakout3Title) {
      sessions.push({
        id: generateId(),
        sessionTitle: breakout3Title,
        description: getMappingValue(row, mapping.breakout3Description),
        breakoutNumber: 3,
        ...baseInfo,
      });
    }

    // If no breakouts defined, create a single session with presenter name as title fallback
    if (!breakout1Title && !breakout2Title && !breakout3Title) {
      sessions.push({
        id: generateId(),
        sessionTitle: presenterName,
        ...baseInfo,
      });
    }
  });

  return sessions;
}

// Auto-detect common column mappings
export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase());

  const findColumn = (patterns: string[]): ColumnMappingValue | undefined => {
    for (let i = 0; i < lowerHeaders.length; i++) {
      const header = lowerHeaders[i];
      if (patterns.some((p) => header.includes(p))) {
        return { type: 'column', column: headers[i] };
      }
    }
    return undefined;
  };

  // Presenter info
  mapping.presenterFirstName = findColumn(['first name', 'firstname', 'first']);
  mapping.presenterLastName = findColumn(['last name', 'lastname', 'surname', 'last']);
  mapping.presenterEmail = findColumn(['email', 'e-mail', 'mail']);
  mapping.presenterPhone = findColumn(['phone', 'tel', 'telephone', 'mobile', 'cell']);
  mapping.presenterCompany = findColumn(['company', 'organization', 'org', 'employer']);
  mapping.presenterTitle = findColumn(['title', 'job title', 'position', 'role']);

  // Co-presenter
  mapping.coPresenterFirstName = findColumn(['co-presenter first', 'copresenter first', 'co presenter first']);
  mapping.coPresenterLastName = findColumn(['co-presenter last', 'copresenter last', 'co presenter last']);

  // Breakouts - look for numbered patterns
  for (let i = 0; i < lowerHeaders.length; i++) {
    const header = lowerHeaders[i];
    if (header.includes('(1)') && (header.includes('topic') || header.includes('title') || header.includes('breakout'))) {
      mapping.breakout1Title = { type: 'column', column: headers[i] };
    }
    if (header.includes('(1)') && header.includes('description')) {
      mapping.breakout1Description = { type: 'column', column: headers[i] };
    }
    if (header.includes('(2)') && (header.includes('topic') || header.includes('title') || header.includes('breakout'))) {
      mapping.breakout2Title = { type: 'column', column: headers[i] };
    }
    if (header.includes('(2)') && header.includes('description')) {
      mapping.breakout2Description = { type: 'column', column: headers[i] };
    }
    if (header.includes('(3)') && (header.includes('topic') || header.includes('title') || header.includes('breakout'))) {
      mapping.breakout3Title = { type: 'column', column: headers[i] };
    }
    if (header.includes('(3)') && header.includes('description')) {
      mapping.breakout3Description = { type: 'column', column: headers[i] };
    }
  }

  // Fallback: if no breakouts found, look for generic title/session columns
  if (!mapping.breakout1Title) {
    mapping.breakout1Title = findColumn(['session', 'topic', 'presentation', 'workshop']);
  }
  if (!mapping.breakout1Description) {
    mapping.breakout1Description = findColumn(['description', 'desc', 'summary', 'abstract']);
  }

  // Other fields
  mapping.duration = findColumn(['duration', 'length', 'minutes', 'mins']);
  mapping.expectedAttendees = findColumn(['attendees', 'capacity', 'expected', 'participants']);
  mapping.unavailableTimes = findColumn(['unavailable', 'not available', 'busy', 'blocked']);

  return mapping;
}
