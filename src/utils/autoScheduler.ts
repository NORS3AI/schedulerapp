import type { Session, Room, TimeSlot, DayConfig, PresenterAvailabilityEntry } from '../store/types';
import { isPresenterAvailable, isPresenterAvailableFromEntry } from './availabilityParser';

interface ScheduleSlot {
  day: string;
  timeSlot: string;
  roomId: string;
}

/**
 * Normalize a time string to 24-hour format for comparison
 * Handles: "9:00 AM", "09:00", "9:00am", "9:00 AM - 10:00 AM", etc.
 */
function normalizeTime(time: string): string {
  if (!time) return '';

  // If it's a range, take the start time
  const rangeMatch = time.match(/^([^-]+)(?:\s*-\s*[^-]+)?$/);
  const timePart = rangeMatch ? rangeMatch[1].trim() : time.trim();

  // Parse 12-hour format
  const match12 = timePart.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] || '00';
    const meridiem = match12[3]?.toLowerCase();

    if (meridiem === 'pm' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  // Already in 24-hour format
  const match24 = timePart.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return `${match24[1].padStart(2, '0')}:${match24[2]}`;
  }

  return time.toLowerCase().replace(/\s/g, '');
}

/**
 * Check if two time values match (handles different formats)
 */
function timesMatch(time1: string, time2: string): boolean {
  const norm1 = normalizeTime(time1);
  const norm2 = normalizeTime(time2);
  return norm1 === norm2;
}

export interface AutoScheduleResult {
  scheduledSessions: Session[];
  unscheduledSessions: Session[];
  message: string;
}

// V1.1.4a: Enhanced auto-schedule that uses availability database
export function autoSchedule(
  sessions: Session[],
  rooms: Room[],
  days: DayConfig[],
  timeSlots: TimeSlot[],
  presenterAvailabilityDb?: Record<string, PresenterAvailabilityEntry> // V1.1.4a: Optional availability database
): AutoScheduleResult {
  const unscheduledSessions = sessions.filter(
    (s) => !s.day || !s.timeSlot || !s.roomId
  );
  const alreadyScheduled = sessions.filter(
    (s) => s.day && s.timeSlot && s.roomId
  );

  if (unscheduledSessions.length === 0) {
    return {
      scheduledSessions: sessions,
      unscheduledSessions: [],
      message: 'All sessions are already scheduled!',
    };
  }

  if (rooms.length === 0) {
    return {
      scheduledSessions: sessions,
      unscheduledSessions,
      message: 'No rooms available. Please add rooms first.',
    };
  }

  if (timeSlots.length === 0) {
    return {
      scheduledSessions: sessions,
      unscheduledSessions,
      message: 'No time slots available. Please add time slots first.',
    };
  }

  // Sort days and rooms by order
  const sortedDays = [...days].sort((a, b) => a.order - b.order);
  const sortedRooms = [...rooms].sort((a, b) => a.order - b.order);

  // Build occupation map from already scheduled sessions
  const occupied = new Set<string>();
  const presenterSchedule = new Map<string, Set<string>>();

  for (const session of alreadyScheduled) {
    const slotKey = `${session.day}-${session.timeSlot}-${session.roomId}`;
    occupied.add(slotKey);

    const presenterKey = session.presenterName.toLowerCase();
    const timeKey = `${session.day}-${session.timeSlot}`;
    if (!presenterSchedule.has(presenterKey)) {
      presenterSchedule.set(presenterKey, new Set());
    }
    presenterSchedule.get(presenterKey)!.add(timeKey);
  }

  // Generate all available slots (excluding break time slots)
  const allSlots: ScheduleSlot[] = [];
  for (const day of sortedDays) {
    // Use day-specific time slots if available, otherwise use global
    const dayTimeSlots = day.timeSlots && day.timeSlots.length > 0 ? day.timeSlots : timeSlots;
    for (const timeSlot of dayTimeSlots) {
      // Skip break time slots
      if (timeSlot.isBreak) {
        continue;
      }
      for (const room of sortedRooms) {
        allSlots.push({
          day: day.name,
          timeSlot: timeSlot.startTime,
          roomId: room.id,
        });
      }
    }
  }

  // Sort sessions by constraints (more constrained first)
  const sortedSessions = [...unscheduledSessions].sort((a, b) => {
    // Sessions with room preference are more constrained
    const aRoomPref = a.preferStayInRoom ? 1 : 0;
    const bRoomPref = b.preferStayInRoom ? 1 : 0;
    if (aRoomPref !== bRoomPref) return bRoomPref - aRoomPref;

    // Sessions with unavailability are more constrained
    const aUnavail = a.unavailability?.length || 0;
    const bUnavail = b.unavailability?.length || 0;
    if (aUnavail !== bUnavail) return bUnavail - aUnavail;

    // Sessions with capacity requirements are more constrained
    const aCapacity = a.expectedAttendees || 0;
    const bCapacity = b.expectedAttendees || 0;
    return bCapacity - aCapacity;
  });

  // Build presenter room assignment map (for room preference)
  const presenterRoomAssignment = new Map<string, string>();
  for (const session of alreadyScheduled) {
    if (session.preferStayInRoom && session.roomId) {
      const presenterKey = session.presenterName.toLowerCase();
      if (!presenterRoomAssignment.has(presenterKey)) {
        presenterRoomAssignment.set(presenterKey, session.roomId);
      }
    }
  }

  const scheduledResults: Session[] = [...alreadyScheduled];
  const stillUnscheduled: Session[] = [];

  for (const session of sortedSessions) {
    const presenterKey = session.presenterName.toLowerCase();
    let scheduled = false;

    // Determine preferred room for this session
    let preferredRoom: string | undefined = session.preferredRoomId;
    if (session.preferStayInRoom && !preferredRoom && presenterRoomAssignment.has(presenterKey)) {
      preferredRoom = presenterRoomAssignment.get(presenterKey);
    }

    // Sort slots to prioritize preferred room
    const sortedSlots = preferredRoom
      ? [...allSlots].sort((a, b) => {
          if (a.roomId === preferredRoom && b.roomId !== preferredRoom) return -1;
          if (b.roomId === preferredRoom && a.roomId !== preferredRoom) return 1;
          return 0;
        })
      : allSlots;

    // Find a valid slot
    for (const slot of sortedSlots) {
      const slotKey = `${slot.day}-${slot.timeSlot}-${slot.roomId}`;
      const timeKey = `${slot.day}-${slot.timeSlot}`;

      // Check if slot is occupied
      if (occupied.has(slotKey)) {
        continue;
      }

      // Check if presenter is available at this time (not scheduled elsewhere)
      if (presenterSchedule.has(presenterKey)) {
        if (presenterSchedule.get(presenterKey)!.has(timeKey)) {
          continue;
        }
      }

      // V1.1.4a: Check presenter availability using database first
      if (presenterAvailabilityDb) {
        const dbEntry = presenterAvailabilityDb[presenterKey] || presenterAvailabilityDb[session.presenterName];
        if (dbEntry) {
          if (!isPresenterAvailableFromEntry(dbEntry, slot.day, slot.timeSlot)) {
            continue;
          }
          // Also check room preference from database
          if (dbEntry.preferStayInRoom && dbEntry.preferredRoomId && dbEntry.preferredRoomId !== slot.roomId) {
            // Skip this slot if it's not the preferred room (but don't block entirely)
            // Only skip if there might be preferred room slots available
            const hasPreferredRoomSlot = allSlots.some(s =>
              s.roomId === dbEntry.preferredRoomId &&
              !occupied.has(`${s.day}-${s.timeSlot}-${s.roomId}`)
            );
            if (hasPreferredRoomSlot) {
              continue;
            }
          }
        }
      }

      // Check presenter availability using parsed availability (V1.1.0)
      // First try the new parsed availability format
      if (session.parsedAvailability) {
        if (!isPresenterAvailable(session.parsedAvailability, slot.day, slot.timeSlot)) {
          continue;
        }
      }
      // Fallback: Check legacy unavailability format
      else if (session.unavailability && session.unavailability.length > 0) {
        const isUnavailable = session.unavailability.some((u) => {
          // Check day match (case insensitive, partial match for weekday names)
          const dayMatch =
            u.day === slot.day ||
            u.day.toLowerCase() === slot.day.toLowerCase() ||
            slot.day.toLowerCase().includes(u.day.toLowerCase()) ||
            u.day.toLowerCase().includes(slot.day.toLowerCase());

          if (!dayMatch) return false;

          // Check time slot - 'all' or '*' means entire day is unavailable
          if (u.timeSlot === 'all' || u.timeSlot === '*') return true;

          // Use flexible time matching to handle different formats (12h vs 24h, ranges, etc.)
          return timesMatch(u.timeSlot, slot.timeSlot);
        });
        if (isUnavailable) {
          continue;
        }
      }

      // Check room capacity
      if (session.expectedAttendees) {
        const room = rooms.find((r) => r.id === slot.roomId);
        if (room && session.expectedAttendees > room.capacity) {
          continue;
        }
      }

      // Valid slot found - schedule the session
      const scheduledSession: Session = {
        ...session,
        day: slot.day,
        timeSlot: slot.timeSlot,
        roomId: slot.roomId,
      };
      scheduledResults.push(scheduledSession);
      occupied.add(slotKey);

      if (!presenterSchedule.has(presenterKey)) {
        presenterSchedule.set(presenterKey, new Set());
      }
      presenterSchedule.get(presenterKey)!.add(timeKey);

      // Track room assignment for room preference
      if (session.preferStayInRoom && !presenterRoomAssignment.has(presenterKey)) {
        presenterRoomAssignment.set(presenterKey, slot.roomId);
      }

      scheduled = true;
      break;
    }

    if (!scheduled) {
      stillUnscheduled.push(session);
    }
  }

  const scheduledCount = sortedSessions.length - stillUnscheduled.length;
  let message: string;

  if (stillUnscheduled.length === 0) {
    message = `Successfully scheduled all ${scheduledCount} sessions!`;
  } else if (scheduledCount > 0) {
    message = `Scheduled ${scheduledCount} sessions. ${stillUnscheduled.length} sessions could not be scheduled due to conflicts, availability restrictions, or capacity constraints.`;
  } else {
    message = 'No sessions could be scheduled. Please add more rooms or time slots, or check presenter availability.';
  }

  return {
    scheduledSessions: scheduledResults,
    unscheduledSessions: stillUnscheduled,
    message,
  };
}

// Clear scheduling for specific sessions
export function unscheduleSession(session: Session): Session {
  return {
    ...session,
    day: undefined,
    timeSlot: undefined,
    roomId: undefined,
  };
}

// Clear all scheduling
export function clearAllScheduling(sessions: Session[]): Session[] {
  return sessions.map(unscheduleSession);
}
