import type { Session, Room, Conflict } from '../store/types';

export function detectConflicts(
  sessions: Session[],
  rooms: Room[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  const scheduledSessions = sessions.filter(
    (s) => s.day && s.timeSlot && s.roomId
  );

  // Check presenter conflicts (same presenter in two places at same time)
  const presenterTimeMap = new Map<string, Session[]>();
  for (const session of scheduledSessions) {
    const key = `${session.presenterName.toLowerCase()}-${session.day}-${session.timeSlot}`;
    const existing = presenterTimeMap.get(key) || [];
    existing.push(session);
    presenterTimeMap.set(key, existing);
  }

  for (const [, sessionsAtTime] of presenterTimeMap) {
    if (sessionsAtTime.length > 1) {
      conflicts.push({
        type: 'presenter',
        sessionIds: sessionsAtTime.map((s) => s.id),
        message: `${sessionsAtTime[0].presenterName} is scheduled for multiple sessions at the same time`,
      });
    }
  }

  // Check room conflicts (two sessions in same room at same time)
  const roomTimeMap = new Map<string, Session[]>();
  for (const session of scheduledSessions) {
    const key = `${session.roomId}-${session.day}-${session.timeSlot}`;
    const existing = roomTimeMap.get(key) || [];
    existing.push(session);
    roomTimeMap.set(key, existing);
  }

  for (const [, sessionsAtTime] of roomTimeMap) {
    if (sessionsAtTime.length > 1) {
      const room = rooms.find((r) => r.id === sessionsAtTime[0].roomId);
      conflicts.push({
        type: 'room',
        sessionIds: sessionsAtTime.map((s) => s.id),
        message: `Multiple sessions scheduled in ${room?.name || 'the same room'} at the same time`,
      });
    }
  }

  // Check capacity warnings
  for (const session of scheduledSessions) {
    if (session.expectedAttendees && session.roomId) {
      const room = rooms.find((r) => r.id === session.roomId);
      if (room && session.expectedAttendees > room.capacity) {
        conflicts.push({
          type: 'capacity',
          sessionIds: [session.id],
          message: `"${session.sessionTitle}" expects ${session.expectedAttendees} attendees but ${room.name} only holds ${room.capacity}`,
        });
      }
    }
  }

  // Check availability conflicts (scheduled during unavailable time)
  for (const session of scheduledSessions) {
    if (session.unavailability && session.unavailability.length > 0) {
      const isUnavailable = session.unavailability.some((slot) => {
        // Check day match (case insensitive, partial match)
        const dayMatch =
          slot.day === session.day ||
          slot.day.toLowerCase() === session.day?.toLowerCase() ||
          session.day?.toLowerCase().includes(slot.day.toLowerCase());

        if (!dayMatch) return false;

        // Check time slot - '*' means all day
        if (slot.timeSlot === '*') return true;

        return (
          slot.timeSlot === session.timeSlot ||
          slot.timeSlot.toLowerCase() === session.timeSlot?.toLowerCase()
        );
      });

      if (isUnavailable) {
        conflicts.push({
          type: 'availability',
          sessionIds: [session.id],
          message: `${session.presenterName} is marked as unavailable for ${session.day} at ${session.timeSlot}`,
        });
      }
    }
  }

  return conflicts;
}

export function getSessionConflicts(
  sessionId: string,
  conflicts: Conflict[]
): Conflict[] {
  return conflicts.filter((c) => c.sessionIds.includes(sessionId));
}

export function hasConflict(sessionId: string, conflicts: Conflict[]): boolean {
  return conflicts.some((c) => c.sessionIds.includes(sessionId));
}

export function getConflictType(
  sessionId: string,
  conflicts: Conflict[]
): 'presenter' | 'room' | 'capacity' | 'availability' | null {
  for (const conflict of conflicts) {
    if (conflict.sessionIds.includes(sessionId)) {
      return conflict.type;
    }
  }
  return null;
}

// Check if a presenter can be scheduled at a specific time
export function isPresenterAvailable(
  session: Session,
  day: string,
  timeSlot: string,
  allSessions: Session[]
): { available: boolean; reason?: string } {
  // Check unavailability
  if (session.unavailability && session.unavailability.length > 0) {
    const isUnavailable = session.unavailability.some((slot) => {
      // Check day match (case insensitive, partial match)
      const dayMatch =
        slot.day === day ||
        slot.day.toLowerCase() === day.toLowerCase() ||
        day.toLowerCase().includes(slot.day.toLowerCase());

      if (!dayMatch) return false;

      // Check time slot - '*' means all day
      if (slot.timeSlot === '*') return true;

      return (
        slot.timeSlot === timeSlot ||
        slot.timeSlot.toLowerCase() === timeSlot.toLowerCase()
      );
    });

    if (isUnavailable) {
      return {
        available: false,
        reason: `${session.presenterName} is unavailable at this time`,
      };
    }
  }

  // Check if presenter already scheduled at this time
  const otherSessionAtSameTime = allSessions.find(
    (s) =>
      s.id !== session.id &&
      s.presenterName.toLowerCase() === session.presenterName.toLowerCase() &&
      s.day === day &&
      s.timeSlot === timeSlot
  );

  if (otherSessionAtSameTime) {
    return {
      available: false,
      reason: `${session.presenterName} is already scheduled for "${otherSessionAtSameTime.sessionTitle}" at this time`,
    };
  }

  return { available: true };
}
