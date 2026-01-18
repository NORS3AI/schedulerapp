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
  // Original CSV data for preservation
  originalData?: Record<string, string>;
  // Reference to source presenter row
  sourceRowIndex?: number;
}

// Rooms are manually entered
export interface Room {
  id: string;
  name: string;
  capacity: number;
  features?: string[];
  order: number; // For drag-drop reordering
}

// Day configuration with order
export interface DayConfig {
  id: string;
  name: string;
  order: number;
}

// Time slot configuration
export interface TimeSlot {
  id: string;
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  label?: string; // Optional display label
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
}

// Setup wizard state
export type SetupStep = 'welcome' | 'import' | 'columns' | 'availability' | 'event' | 'rooms' | 'timeslots' | 'complete';
