import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, Room, TimeSlot, EventConfig, ColumnMapping, AppSettings, SetupStep, DayConfig, PresenterAvailabilityEntry } from './types';
import { detectWeekdayAvailabilityColumns } from '../utils/csvParser';
import { parseAvailabilityEnhanced, buildPresenterAvailabilityEntry } from '../utils/availabilityParser';

interface SchedulerState {
  // Sessions
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  removeSession: (id: string) => void;
  duplicateSession: (id: string) => void;
  removeDuplicateSession: (id: string) => void;

  // Event config
  eventConfig: EventConfig;
  setEventConfig: (config: EventConfig) => void;
  setEventName: (name: string) => void;
  setDays: (days: DayConfig[]) => void;
  addDay: (day: DayConfig) => void;
  updateDay: (id: string, updates: Partial<DayConfig>) => void;
  removeDay: (id: string) => void;
  reorderDays: (days: DayConfig[]) => void;

  // Rooms
  addRoom: (room: Room) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  removeRoom: (id: string) => void;
  reorderRooms: (rooms: Room[]) => void;

  // Time slots
  setTimeSlots: (slots: TimeSlot[]) => void;
  addTimeSlot: (slot: TimeSlot) => void;
  removeTimeSlot: (id: string) => void;
  setDayTimeSlots: (dayId: string, slots: TimeSlot[]) => void;

  // Column mapping (for CSV import)
  columnMapping: ColumnMapping;
  setColumnMapping: (mapping: ColumnMapping) => void;

  // Raw CSV data
  rawCsvData: Record<string, string>[];
  setRawCsvData: (data: Record<string, string>[]) => void;
  csvHeaders: string[];
  setCsvHeaders: (headers: string[]) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Setup wizard
  setupStep: SetupStep;
  setSetupStep: (step: SetupStep) => void;
  setupComplete: boolean;
  setSetupComplete: (complete: boolean) => void;

  // UI state
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  scheduledCollapsed: boolean;
  setScheduledCollapsed: (collapsed: boolean) => void;
  unscheduledCollapsed: boolean;
  setUnscheduledCollapsed: (collapsed: boolean) => void;

  // Drag state
  draggedSessionId: string | null;
  setDraggedSessionId: (id: string | null) => void;

  // Selected session for details popup
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;

  // Session selection for auto-schedule
  selectionMode: boolean;
  setSelectionMode: (mode: boolean) => void;
  selectedSessionIds: Set<string>;
  toggleSessionSelection: (id: string) => void;
  selectAllUnscheduled: () => void;
  clearSelection: () => void;

  // Reset
  resetAll: () => void;
  resetSchedule: () => void;

  // Auto-schedule state for undo
  lastAutoScheduleState: Session[] | null;
  setLastAutoScheduleState: (sessions: Session[] | null) => void;

  // V1.1.4a: Presenter availability database
  presenterAvailability: Record<string, PresenterAvailabilityEntry>;
  setPresenterAvailability: (presenterId: string, entry: PresenterAvailabilityEntry) => void;
  updatePresenterAvailability: (presenterId: string, updates: Partial<PresenterAvailabilityEntry>) => void;
  clearPresenterAvailability: () => void;

  // V1.1.4b: Re-parse availability for all sessions from their original CSV data
  reParseAvailability: () => void;
}

const defaultEventConfig: EventConfig = {
  name: 'My Conference',
  days: [{ id: '1', name: 'Day 1', order: 0 }],
  timeSlots: [],
  rooms: [],
};

const defaultSettings: AppSettings = {
  theme: 'system',
  fontSize: 'medium',
  timeFormat: '12h',
  showConflicts: true,
  autoSave: true,
  scheduledSessionsCollapsed: false,
  allowEditPresenters: false,
  allowEditSessions: false,
  allowEditAll: false, // V1.1.4: Combined editing toggle
};

export const useSchedulerStore = create<SchedulerState>()(
  persist(
    (set) => ({
      // Sessions
      sessions: [],
      setSessions: (sessions) => set({ sessions }),
      addSession: (session) => set((state) => ({
        sessions: [...state.sessions, session]
      })),
      updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      })),
      removeSession: (id) => set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
      })),
      duplicateSession: (id) => set((state) => {
        const original = state.sessions.find((s) => s.id === id);
        if (!original) return state;

        // Count existing instances of this session
        const originalId = original.originalSessionId || original.id;
        const existingInstances = state.sessions.filter(
          (s) => s.id === originalId || s.originalSessionId === originalId
        );
        const nextInstanceNumber = existingInstances.length + 1;

        // Create duplicate with new ID
        const duplicate: Session = {
          ...original,
          id: `${originalId}-instance-${nextInstanceNumber}-${Date.now()}`,
          originalSessionId: originalId,
          instanceNumber: nextInstanceNumber,
          // Clear scheduling for the duplicate
          day: undefined,
          timeSlot: undefined,
          roomId: undefined,
        };

        // Update original to have instanceNumber 1 if not set
        const updatedSessions = state.sessions.map((s) => {
          if (s.id === originalId && !s.instanceNumber) {
            return { ...s, instanceNumber: 1 };
          }
          return s;
        });

        return { sessions: [...updatedSessions, duplicate] };
      }),
      removeDuplicateSession: (id) => set((state) => {
        const session = state.sessions.find((s) => s.id === id);
        if (!session || !session.originalSessionId) {
          // Can't remove original session, only duplicates
          return state;
        }
        return { sessions: state.sessions.filter((s) => s.id !== id) };
      }),

      // Event config
      eventConfig: defaultEventConfig,
      setEventConfig: (config) => set({ eventConfig: config }),
      setEventName: (name) => set((state) => ({
        eventConfig: { ...state.eventConfig, name },
      })),
      setDays: (days) => set((state) => ({
        eventConfig: { ...state.eventConfig, days },
        selectedDay: days[0]?.name || 'Day 1',
      })),
      addDay: (day) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          days: [...state.eventConfig.days, day]
        },
      })),
      updateDay: (id, updates) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          days: state.eventConfig.days.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        },
      })),
      removeDay: (id) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          days: state.eventConfig.days.filter((d) => d.id !== id),
        },
      })),
      reorderDays: (days) => set((state) => ({
        eventConfig: { ...state.eventConfig, days },
      })),

      // Rooms
      addRoom: (room) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          rooms: [...state.eventConfig.rooms, room],
        },
      })),
      updateRoom: (id, updates) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          rooms: state.eventConfig.rooms.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        },
      })),
      removeRoom: (id) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          rooms: state.eventConfig.rooms.filter((r) => r.id !== id),
        },
      })),
      reorderRooms: (rooms) => set((state) => ({
        eventConfig: { ...state.eventConfig, rooms },
      })),

      // Time slots
      setTimeSlots: (slots) => set((state) => ({
        eventConfig: { ...state.eventConfig, timeSlots: slots },
      })),
      addTimeSlot: (slot) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          timeSlots: [...state.eventConfig.timeSlots, slot],
        },
      })),
      removeTimeSlot: (id) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          timeSlots: state.eventConfig.timeSlots.filter((t) => t.id !== id),
        },
      })),
      setDayTimeSlots: (dayId, slots) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          days: state.eventConfig.days.map((d) =>
            d.id === dayId ? { ...d, timeSlots: slots } : d
          ),
        },
      })),

      // Column mapping
      columnMapping: {},
      setColumnMapping: (mapping) => set({ columnMapping: mapping }),

      // Raw CSV data
      rawCsvData: [],
      setRawCsvData: (data) => set({ rawCsvData: data }),
      csvHeaders: [],
      setCsvHeaders: (headers) => set({ csvHeaders: headers }),

      // Settings
      settings: defaultSettings,
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),

      // Setup wizard
      setupStep: 'welcome',
      setSetupStep: (step) => set({ setupStep: step }),
      setupComplete: false,
      setSetupComplete: (complete) => set({ setupComplete: complete }),

      // UI state
      selectedDay: 'Day 1',
      setSelectedDay: (day) => set({ selectedDay: day }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      scheduledCollapsed: false,
      setScheduledCollapsed: (collapsed) => set({ scheduledCollapsed: collapsed }),
      unscheduledCollapsed: false,
      setUnscheduledCollapsed: (collapsed) => set({ unscheduledCollapsed: collapsed }),

      // Drag state
      draggedSessionId: null,
      setDraggedSessionId: (id) => set({ draggedSessionId: id }),

      // Selected session
      selectedSessionId: null,
      setSelectedSessionId: (id) => set({ selectedSessionId: id }),

      // Session selection for auto-schedule
      selectionMode: false,
      setSelectionMode: (mode) => set((state) => ({
        selectionMode: mode,
        // Only clear selections when turning mode OFF, preserve when turning ON
        selectedSessionIds: mode ? state.selectedSessionIds : new Set()
      })),
      selectedSessionIds: new Set(),
      toggleSessionSelection: (id) => set((state) => {
        const newSet = new Set(state.selectedSessionIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return { selectedSessionIds: newSet };
      }),
      selectAllUnscheduled: () => set((state) => {
        const unscheduledIds = state.sessions
          .filter((s) => !s.day || !s.timeSlot || !s.roomId)
          .map((s) => s.id);
        return { selectedSessionIds: new Set(unscheduledIds) };
      }),
      clearSelection: () => set({ selectedSessionIds: new Set() }),

      // Reset
      resetAll: () => set({
        sessions: [],
        eventConfig: defaultEventConfig,
        columnMapping: {},
        rawCsvData: [],
        csvHeaders: [],
        setupStep: 'welcome',
        setupComplete: false,
        selectedDay: 'Day 1',
        searchQuery: '',
        draggedSessionId: null,
        selectedSessionId: null,
        scheduledCollapsed: false,
        unscheduledCollapsed: false,
        selectionMode: false,
        selectedSessionIds: new Set(),
        lastAutoScheduleState: null,
      }),

      resetSchedule: () => set((state) => ({
        sessions: state.sessions.map((s) => ({
          ...s,
          day: undefined,
          timeSlot: undefined,
          roomId: undefined,
        })),
        lastAutoScheduleState: null,
      })),

      // Auto-schedule state
      lastAutoScheduleState: null,
      setLastAutoScheduleState: (sessions) => set({ lastAutoScheduleState: sessions }),

      // V1.1.4a: Presenter availability database
      presenterAvailability: {},
      setPresenterAvailability: (presenterId, entry) => set((state) => ({
        presenterAvailability: {
          ...state.presenterAvailability,
          [presenterId]: entry,
        },
      })),
      updatePresenterAvailability: (presenterId, updates) => set((state) => {
        const existing = state.presenterAvailability[presenterId];
        if (!existing) return state;
        return {
          presenterAvailability: {
            ...state.presenterAvailability,
            [presenterId]: { ...existing, ...updates, lastUpdated: Date.now() },
          },
        };
      }),
      clearPresenterAvailability: () => set({ presenterAvailability: {} }),

      // V1.1.4b: Re-parse availability for all sessions from their original CSV data
      reParseAvailability: () => set((state) => {
        // Detect weekday columns from stored CSV headers
        const weekdayColumns = detectWeekdayAvailabilityColumns(state.csvHeaders);

        // Map to track which presenters we've already processed
        const processedPresenters = new Set<string>();
        const newPresenterAvailability: Record<string, PresenterAvailabilityEntry> = {};

        // Re-parse each session
        const updatedSessions = state.sessions.map((session) => {
          if (!session.originalData) {
            return session; // No original data to re-parse
          }

          // Collect availability from ALL weekday columns
          const weekdayAvailabilityData: Record<string, string> = {};
          for (const colName of weekdayColumns) {
            const value = session.originalData[colName]?.trim();
            if (value) {
              weekdayAvailabilityData[colName] = value;
            }
          }

          // Get the original unavailability text
          const unavailabilityStr = session.unavailabilityText || '';

          // Build combined raw text
          let combinedRawText = unavailabilityStr;
          for (const [colName, value] of Object.entries(weekdayAvailabilityData)) {
            if (combinedRawText) combinedRawText += '\n';
            combinedRawText += `${colName}: ${value}`;
          }

          // Re-parse with enhanced parser
          const parsedAvailability = parseAvailabilityEnhanced(unavailabilityStr, weekdayAvailabilityData);

          // Build presenter availability database entry (once per presenter)
          const presenterKey = session.presenterName.toLowerCase();
          if (!processedPresenters.has(presenterKey) && parsedAvailability) {
            processedPresenters.add(presenterKey);
            const entry = buildPresenterAvailabilityEntry(
              presenterKey,
              session.presenterName,
              parsedAvailability,
              session.preferredRoomId,
              session.preferStayInRoom,
              combinedRawText
            );
            newPresenterAvailability[presenterKey] = entry;
          }

          return {
            ...session,
            unavailabilityText: combinedRawText || unavailabilityStr,
            parsedAvailability: parsedAvailability || session.parsedAvailability,
          };
        });

        return {
          sessions: updatedSessions,
          presenterAvailability: { ...state.presenterAvailability, ...newPresenterAvailability },
        };
      }),
    }),
    {
      name: 'scheduler-2026-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        eventConfig: state.eventConfig,
        settings: state.settings,
        setupComplete: state.setupComplete,
        selectedDay: state.selectedDay,
        scheduledCollapsed: state.scheduledCollapsed,
        unscheduledCollapsed: state.unscheduledCollapsed,
        presenterAvailability: state.presenterAvailability, // V1.1.4a: Persist availability database
      }),
    }
  )
);

// Helper function to get time slots for a specific day
export function getTimeSlotsForDay(dayName: string): TimeSlot[] {
  const state = useSchedulerStore.getState();
  const day = state.eventConfig.days.find((d) => d.name === dayName);
  // Return per-day time slots if defined and non-empty, otherwise fall back to global
  return (day?.timeSlots && day.timeSlots.length > 0) ? day.timeSlots : state.eventConfig.timeSlots;
}
