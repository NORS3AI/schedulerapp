import { useEffect, useMemo, useState } from 'react';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { formatTime } from '../../utils/timeFormatter';

interface PresenterListModalProps {
  onClose: () => void;
}

interface CoPresenterInfo {
  name?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
}

interface PresenterSummary {
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  coPresenter?: CoPresenterInfo;
  sessions: Array<{
    id: string;
    sessionTitle: string;
    breakoutNumber?: 1 | 2 | 3;
    description?: string;
    masteryLevel?: string;
    day?: string;
    timeSlot?: string;
    roomName?: string;
  }>;
  unavailability: Array<{ day: string; timeSlot: string }>;
  unavailabilityText?: string;
  sessionIds: string[]; // All session IDs for this presenter
}

export function PresenterListModal({ onClose }: PresenterListModalProps) {
  const { sessions, eventConfig, settings, updateSession, removeSession } = useSchedulerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPresenter, setExpandedPresenter] = useState<string | null>(null);
  const [editingCoPresenter, setEditingCoPresenter] = useState<string | null>(null);
  const [coPresenterForm, setCoPresenterForm] = useState<CoPresenterInfo>({});

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Group sessions by presenter
  const presenters = useMemo(() => {
    const presenterMap = new Map<string, PresenterSummary>();

    for (const session of sessions) {
      const key = session.presenterName.toLowerCase();

      if (!presenterMap.has(key)) {
        // Build co-presenter info if available
        let coPresenter: CoPresenterInfo | undefined;
        if (session.coPresenterName || session.coPresenterFirstName || session.coPresenterLastName) {
          coPresenter = {
            name: session.coPresenterName,
            firstName: session.coPresenterFirstName,
            lastName: session.coPresenterLastName,
            title: session.coPresenterTitle,
            company: session.coPresenterCompany,
            email: session.coPresenterEmail,
            phone: session.coPresenterPhone,
          };
        }

        presenterMap.set(key, {
          name: session.presenterName,
          firstName: session.presenterFirstName,
          lastName: session.presenterLastName,
          email: session.presenterEmail,
          phone: session.presenterPhone,
          company: session.presenterCompany,
          title: session.presenterTitle,
          coPresenter,
          sessions: [],
          unavailability: session.unavailability || [],
          unavailabilityText: session.unavailabilityText,
          sessionIds: [],
        });
      }

      // Track session IDs and get presenter reference
      const presenter = presenterMap.get(key)!;
      presenter.sessionIds.push(session.id);

      const room = session.roomId
        ? eventConfig.rooms.find((r) => r.id === session.roomId)
        : undefined;

      presenter.sessions.push({
        id: session.id,
        sessionTitle: session.sessionTitle,
        breakoutNumber: session.breakoutNumber,
        description: session.description,
        masteryLevel: session.masteryLevel,
        day: session.day,
        timeSlot: session.timeSlot,
        roomName: room?.name,
      });

      // Merge unavailability
      if (session.unavailability) {
        for (const slot of session.unavailability) {
          if (!presenter.unavailability.some(u => u.day === slot.day && u.timeSlot === slot.timeSlot)) {
            presenter.unavailability.push(slot);
          }
        }
      }
    }

    return Array.from(presenterMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [sessions, eventConfig.rooms]);

  const filteredPresenters = useMemo(() => {
    if (!searchQuery.trim()) return presenters;
    const query = searchQuery.toLowerCase();
    return presenters.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.company?.toLowerCase().includes(query) ||
        p.sessions.some((s) => s.sessionTitle.toLowerCase().includes(query))
    );
  }, [presenters, searchQuery]);

  const togglePresenter = (name: string) => {
    setExpandedPresenter(expandedPresenter === name ? null : name);
  };

  // Handle editing co-presenter
  const handleEditCoPresenter = (presenter: PresenterSummary) => {
    setCoPresenterForm(presenter.coPresenter || {});
    setEditingCoPresenter(presenter.name);
  };

  const handleSaveCoPresenter = (presenter: PresenterSummary) => {
    const coName = [coPresenterForm.firstName, coPresenterForm.lastName]
      .filter(Boolean)
      .join(' ') || undefined;

    // Update all sessions for this presenter
    for (const sessionId of presenter.sessionIds) {
      updateSession(sessionId, {
        coPresenterName: coName,
        coPresenterFirstName: coPresenterForm.firstName,
        coPresenterLastName: coPresenterForm.lastName,
        coPresenterTitle: coPresenterForm.title,
        coPresenterCompany: coPresenterForm.company,
        coPresenterEmail: coPresenterForm.email,
        coPresenterPhone: coPresenterForm.phone,
      });
    }
    setEditingCoPresenter(null);
    setCoPresenterForm({});
  };

  const handleDeleteCoPresenter = (presenter: PresenterSummary) => {
    if (confirm('Remove co-presenter from all sessions for this presenter?')) {
      for (const sessionId of presenter.sessionIds) {
        updateSession(sessionId, {
          coPresenterName: undefined,
          coPresenterFirstName: undefined,
          coPresenterLastName: undefined,
          coPresenterTitle: undefined,
          coPresenterCompany: undefined,
          coPresenterEmail: undefined,
          coPresenterPhone: undefined,
        });
      }
    }
  };

  const handleDeletePresenter = (presenter: PresenterSummary) => {
    if (confirm(`Delete presenter "${presenter.name}" and all their sessions (${presenter.sessions.length} sessions)?`)) {
      for (const sessionId of presenter.sessionIds) {
        removeSession(sessionId);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">All Presenters ({presenters.length})</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search presenters, sessions, companies..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Presenter List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredPresenters.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No presenters found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPresenters.map((presenter) => (
                <div
                  key={presenter.name}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Presenter Header */}
                  <button
                    onClick={() => togglePresenter(presenter.name)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{presenter.name}</span>
                        {presenter.coPresenter && (
                          <>
                            <span className="text-gray-400">&</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {presenter.coPresenter.name ||
                               `${presenter.coPresenter.firstName || ''} ${presenter.coPresenter.lastName || ''}`.trim() ||
                               'Co-Presenter'}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-4">
                        {presenter.title && <span>{presenter.title}</span>}
                        {presenter.company && <span>{presenter.company}</span>}
                        <span className="text-primary-600 dark:text-primary-400">
                          {presenter.sessions.length} session{presenter.sessions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {presenter.coPresenter && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                          Co-Presenter
                        </span>
                      )}
                      {presenter.unavailability.length > 0 && (
                        <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs">
                          {presenter.unavailability.length} unavailable
                        </span>
                      )}
                      {settings.allowEditPresenters && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePresenter(presenter); }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          title="Delete presenter and all sessions"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      <svg
                        className={`w-5 h-5 transition-transform ${expandedPresenter === presenter.name ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedPresenter === presenter.name && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 space-y-4">
                      {/* Presenter Contact Info */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Presenter Contact</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {presenter.email && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Email: </span>
                              <a href={`mailto:${presenter.email}`} className="text-primary-600 dark:text-primary-400">
                                {presenter.email}
                              </a>
                            </div>
                          )}
                          {presenter.phone && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Phone: </span>
                              <a href={`tel:${presenter.phone}`} className="text-primary-600 dark:text-primary-400">
                                {presenter.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Co-Presenter Contact Info */}
                      {editingCoPresenter === presenter.name ? (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h4 className="font-medium text-sm mb-3 text-blue-700 dark:text-blue-300">
                            Edit Co-Presenter
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="First Name"
                              value={coPresenterForm.firstName || ''}
                              onChange={(e) => setCoPresenterForm(f => ({ ...f, firstName: e.target.value }))}
                              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Last Name"
                              value={coPresenterForm.lastName || ''}
                              onChange={(e) => setCoPresenterForm(f => ({ ...f, lastName: e.target.value }))}
                              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Title"
                              value={coPresenterForm.title || ''}
                              onChange={(e) => setCoPresenterForm(f => ({ ...f, title: e.target.value }))}
                              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Company"
                              value={coPresenterForm.company || ''}
                              onChange={(e) => setCoPresenterForm(f => ({ ...f, company: e.target.value }))}
                              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                            />
                            <input
                              type="email"
                              placeholder="Email"
                              value={coPresenterForm.email || ''}
                              onChange={(e) => setCoPresenterForm(f => ({ ...f, email: e.target.value }))}
                              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                            />
                            <input
                              type="tel"
                              placeholder="Phone"
                              value={coPresenterForm.phone || ''}
                              onChange={(e) => setCoPresenterForm(f => ({ ...f, phone: e.target.value }))}
                              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                            />
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleSaveCoPresenter(presenter)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setEditingCoPresenter(null); setCoPresenterForm({}); }}
                              className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : presenter.coPresenter ? (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300">
                              Co-Presenter: {presenter.coPresenter.name ||
                                `${presenter.coPresenter.firstName || ''} ${presenter.coPresenter.lastName || ''}`.trim()}
                            </h4>
                            {settings.allowEditPresenters && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditCoPresenter(presenter)}
                                  className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                  title="Edit co-presenter"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteCoPresenter(presenter)}
                                  className="p-1 text-red-500 hover:text-red-700"
                                  title="Remove co-presenter"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {presenter.coPresenter.title && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Title: </span>
                                <span>{presenter.coPresenter.title}</span>
                              </div>
                            )}
                            {presenter.coPresenter.company && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Company: </span>
                                <span>{presenter.coPresenter.company}</span>
                              </div>
                            )}
                            {presenter.coPresenter.email && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Email: </span>
                                <a href={`mailto:${presenter.coPresenter.email}`} className="text-primary-600 dark:text-primary-400">
                                  {presenter.coPresenter.email}
                                </a>
                              </div>
                            )}
                            {presenter.coPresenter.phone && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Phone: </span>
                                <a href={`tel:${presenter.coPresenter.phone}`} className="text-primary-600 dark:text-primary-400">
                                  {presenter.coPresenter.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : settings.allowEditPresenters ? (
                        <button
                          onClick={() => handleEditCoPresenter(presenter)}
                          className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 text-sm"
                        >
                          + Add Co-Presenter
                        </button>
                      ) : null}

                      {/* Sessions/Breakouts */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Sessions</h4>
                        <div className="space-y-2">
                          {presenter.sessions.map((session) => (
                            <div
                              key={session.id}
                              className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium">
                                    {session.breakoutNumber && (
                                      <span className="text-primary-600 dark:text-primary-400 mr-2">
                                        Breakout {session.breakoutNumber}:
                                      </span>
                                    )}
                                    {session.sessionTitle}
                                  </div>
                                  {session.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {session.description}
                                    </p>
                                  )}
                                  {session.masteryLevel && (
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                                      {session.masteryLevel}
                                    </span>
                                  )}
                                </div>
                                {session.day && session.timeSlot && (
                                  <div className="text-right text-sm">
                                    <div className="text-green-600 dark:text-green-400">Scheduled</div>
                                    <div className="text-gray-500 dark:text-gray-400">
                                      {session.day} @ {formatTime(session.timeSlot, settings.timeFormat)}
                                    </div>
                                    {session.roomName && (
                                      <div className="text-gray-500 dark:text-gray-400">
                                        {session.roomName}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Unavailability */}
                      {(presenter.unavailability.length > 0 || presenter.unavailabilityText) && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-amber-600 dark:text-amber-400">
                            Unavailability
                          </h4>
                          {presenter.unavailabilityText && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">
                              "{presenter.unavailabilityText}"
                            </p>
                          )}
                          {presenter.unavailability.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {presenter.unavailability.map((slot, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs"
                                >
                                  {slot.day} @ {formatTime(slot.timeSlot, settings.timeFormat)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
