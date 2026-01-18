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

// Parse unavailability from a string (e.g., "Day 1: 9:00, 10:00; Day 2: 11:00")
function parseUnavailability(value: string | undefined): UnavailabilitySlot[] {
  if (!value) return [];

  const slots: UnavailabilitySlot[] = [];
  // Try parsing format: "Day 1: 9:00, 10:00; Day 2: 11:00"
  const dayParts = value.split(';');

  for (const dayPart of dayParts) {
    const [dayName, times] = dayPart.split(':').map(s => s.trim());
    if (dayName && times) {
      const timeList = times.split(',').map(t => t.trim());
      for (const time of timeList) {
        if (time) {
          slots.push({ day: dayName, timeSlot: time });
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
