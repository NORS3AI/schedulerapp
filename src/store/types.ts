// Breakout session (topic) within a presenter's row
export interface BreakoutSession {
  id: string;
  topicTitle: string;
  description?: string;
  breakoutNumber: 1 | 2 | 3;
  // Scheduling
  day?: string;
  timeSlot?: string;
  roomId?: string;
  // Reference to parent presenter
  presenterId: string;
}

// Presenter information (one row from CSV can have multiple breakouts)
export interface Presenter {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string; // Job title
  // Co-presenter info
  coPresenterFirstName?: string;
  coPresenterLastName?: string;
  coPresenterEmail?: string;
  coPresenterPhone?: string;
  // Availability - time slots when presenter is NOT available
  unavailability: UnavailabilitySlot[];
  // Original CSV data for preservation
  originalData?: Record<string, string>;
}

// Unavailability slot
export interface UnavailabilitySlot {
  day: string;
  timeSlot: string;
}

// Time range for availability (when presenter CAN teach)
export interface AvailabilityTimeRange {
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
  availableTimeRanges: AvailabilityTimeRange[];
  unavailableTimeRanges: AvailabilityTimeRange[];
}

// V1.1.4a: Display item with color coding for availability
export interface AvailabilityDisplayItem {
  text: string;
  type: 'unavailable' | 'available' | 'neutral';
  timeRanges?: AvailabilityTimeRange[]; // For available times, store parsed ranges
}

// V1.1.4c: Structured day display for cleaner availability presentation
export interface AvailabilityDayDisplay {
  dayName: string; // e.g., "Thursday"
  dateInfo?: string; // e.g., "August 31"
  type: 'available' | 'unavailable';
  timeRanges: AvailabilityTimeRange[]; // Times available on this day (empty if unavailable all day)
}

// Full parsed availability structure for human-readable display and auto-scheduling
export interface ParsedAvailability {
  days: DayAvailability[];
  rawText: string;
  humanReadable: string[]; // Array of formatted strings for display
  // V1.1.4a: Enhanced display items with color coding
  displayItems?: AvailabilityDisplayItem[];
  // V1.1.4c: Structured day display for cleaner presentation
  dayDisplays?: AvailabilityDayDisplay[];
}

// V1.1.4a: Presenter availability database entry
export interface PresenterAvailabilityEntry {
  presenterId: string;
  presenterName: string;
  // Days the presenter is unavailable (all day)
  unavailableDays: string[];
  // Days the presenter is available with specific time ranges
  availableDays: {
    day: string;
    timeRanges: AvailabilityTimeRange[];
  }[];
  // Room preference (if any)
  preferredRoomId?: string;
  preferStayInRoom?: boolean;
  // Raw text for reference
  rawAvailabilityText?: string;
  // Timestamp for when this was last updated
  lastUpdated: number;
}

// Legacy Session type - now represents a breakout that can be scheduled
export interface Session {
  id: string;
  presenterName: string; // Combined first + last name
  presenterFirstName?: string;
  presenterLastName?: string;
  presenterEmail?: string;
  presenterPhone?: string;
  presenterCompany?: string;
  presenterTitle?: string;
  // Co-presenters (can have multiple)
  coPresenterName?: string;
  coPresenterFirstName?: string;
  coPresenterLastName?: string;
  coPresenterTitle?: string;
  coPresenterCompany?: string;
  coPresenterEmail?: string;
  coPresenterPhone?: string;
  // Additional co-presenters
  coPresenters?: Array<{
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }>;
  // Session/Breakout info
  sessionTitle: string;
  description?: string;
  duration: number; // in minutes
  breakoutNumber?: 1 | 2 | 3;
  masteryLevel?: MasteryLevel;
  // Scheduling (can be from CSV or assigned via drag-drop)
  day?: string;
  timeSlot?: string;
  roomId?: string;
  expectedAttendees?: number;
  // Availability - time slots when presenter is NOT available
  unavailability?: UnavailabilitySlot[];
  // Raw unavailability text for display
  unavailabilityText?: string;
  // Parsed availability with human-readable format (V1.1.0)
  parsedAvailability?: ParsedAvailability;
  // Original CSV data for preservation
  originalData?: Record<string, string>;
  // Reference to source presenter row
  sourceRowIndex?: number;
  // Capacity level indicator
  capacityLevel?: 'low' | 'medium' | 'high';
  // Manual capacity override (ignores conflict)
  capacityOverride?: boolean;
  // V1.1.2: Number of times this session should be taught (for duplicates)
  instanceNumber?: number; // 1, 2, 3, etc. for duplicate sessions
  originalSessionId?: string; // Reference to the original session if this is a duplicate
  // V1.1.2: Presenter room preference - stay in one room all day
  preferredRoomId?: string;
  preferStayInRoom?: boolean; // If true, auto-scheduler will try to keep presenter in same room
}

// Rooms are manually entered
export interface Room {
  id: string;
  name: string;
  capacity: number;
  features?: string[];
  order: number; // For drag-drop reordering
}

// Day configuration with order and optional per-day time slots
export interface DayConfig {
  id: string;
  name: string;
  order: number;
  // Per-day time slots (if not set, uses global timeSlots)
  timeSlots?: TimeSlot[];
}

// Time slot configuration
export interface TimeSlot {
  id: string;
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  label?: string; // Optional display label
  isBreak?: boolean; // Whether this is a break/lunch slot (not schedulable)
  breakLabel?: string; // Label for break (e.g., "Lunch", "Break")
}

// Event configuration
export interface EventConfig {
  name: string;
  days: DayConfig[];
  timeSlots: TimeSlot[];
  rooms: Room[];
}

// Column mapping value - can be a column name, custom value, or none
export interface ColumnMappingValue {
  type: 'column' | 'custom' | 'none';
  column?: string; // CSV column name
  customValue?: string; // Custom value for all rows
}

// Column mapping for CSV import
export interface ColumnMapping {
  // Presenter info
  presenterFirstName?: ColumnMappingValue;
  presenterLastName?: ColumnMappingValue;
  presenterEmail?: ColumnMappingValue;
  presenterPhone?: ColumnMappingValue;
  presenterCompany?: ColumnMappingValue;
  presenterTitle?: ColumnMappingValue;
  // Optional presenter custom fields
  presenterCustom1?: ColumnMappingValue;
  presenterCustom2?: ColumnMappingValue;
  presenterCustom3?: ColumnMappingValue;
  // Co-presenter info (primary)
  coPresenterFirstName?: ColumnMappingValue;
  coPresenterLastName?: ColumnMappingValue;
  coPresenterTitle?: ColumnMappingValue;
  coPresenterCompany?: ColumnMappingValue;
  coPresenterEmail?: ColumnMappingValue;
  coPresenterPhone?: ColumnMappingValue;
  // Additional co-presenters (dynamic)
  additionalCoPresenters?: Array<{
    firstName?: ColumnMappingValue;
    lastName?: ColumnMappingValue;
    email?: ColumnMappingValue;
    phone?: ColumnMappingValue;
  }>;
  // Breakout 1
  breakout1Title?: ColumnMappingValue;
  breakout1Description?: ColumnMappingValue;
  breakout1MasteryLevel?: ColumnMappingValue;
  // Breakout 2
  breakout2Title?: ColumnMappingValue;
  breakout2Description?: ColumnMappingValue;
  breakout2MasteryLevel?: ColumnMappingValue;
  // Breakout 3
  breakout3Title?: ColumnMappingValue;
  breakout3Description?: ColumnMappingValue;
  breakout3MasteryLevel?: ColumnMappingValue;
  // Other fields (dynamic list)
  duration?: ColumnMappingValue;
  expectedAttendees?: ColumnMappingValue;
  customFields?: Array<{
    key: string;
    label: string;
    mapping: ColumnMappingValue;
  }>;
  // Availability columns (comma-separated or multiple columns)
  unavailableTimes?: ColumnMappingValue;
  // Availability column headers for smart parsing
  availabilityColumns?: string[];
  // Columns to ignore/delete
  ignoredColumns?: string[];
  // Default session duration (in minutes) when no duration column is mapped
  defaultDuration?: number;
}

// Conflict types
export interface Conflict {
  type: 'presenter' | 'room' | 'capacity' | 'availability';
  sessionIds: string[];
  message: string;
}

// Extended font size options
export type FontSize = 'smallest' | 'smaller' | 'small' | 'medium' | 'large' | 'larger' | 'huge';

// Time format options
export type TimeFormat = '12h' | '24h';

// Mastery level options
export type MasteryLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// App settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: FontSize;
  timeFormat: TimeFormat;
  showConflicts: boolean;
  autoSave: boolean;
  scheduledSessionsCollapsed: boolean;
  allowEditPresenters: boolean;
  allowEditSessions: boolean;
  allowEditAll: boolean; // V1.1.4: Combined editing toggle
}

// Setup wizard state
export type SetupStep = 'welcome' | 'import' | 'columns' | 'availability' | 'event' | 'rooms' | 'timeslots' | 'complete';
