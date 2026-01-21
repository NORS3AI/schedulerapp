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
  coPresenter?: CoPresenterInfo; // Primary co-presenter
  additionalCoPresenters: CoPresenterInfo[]; // Additional co-presenters
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
  sessionIds: string[];
}

export function PresenterListModal({ onClose }: PresenterListModalProps) {
  const { sessions, eventConfig, settings, updateSession, removeSession } = useSchedulerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPresenter, setExpandedPresenter] = useState<string | null>(null);
  const [editingCoPresenterIndex, setEditingCoPresenterIndex] = useState<{ presenterName: string; index: number } | null>(null);
  const [coPresenterForm, setCoPresenterForm] = useState<CoPresenterInfo>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const presenters = useMemo(() => {
    const presenterMap = new Map<string, PresenterSummary>();

    for (const session of sessions) {
      const key = session.presenterName.toLowerCase();

      if (!presenterMap.has(key)) {
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

        const additionalCoPresenters: CoPresenterInfo[] = session.coPresenters?.map((cp) => ({
          name: cp.name,
          firstName: cp.firstName,
          lastName: cp.lastName,
          email: cp.email,
          phone: cp.phone,
        })) || [];

        presenterMap.set(key, {
          name: session.presenterName,
          firstName: session.presenterFirstName,
          lastName: session.presenterLastName,
          email: session.presenterEmail,
          phone: session.presenterPhone,
          company: session.presenterCompany,
          title: session.presenterTitle,
          coPresenter,
          additionalCoPresenters,
          sessions: [],
          unavailability: session.unavailability || [],
          unavailabilityText: session.unavailabilityText,
          sessionIds: [],
        });
      }

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

      if (session.unavailability) {
        for (const slot of session.unavailability) {
          if (!presenter.unavailability.some((u) => u.day === slot.day && u.timeSlot === slot.timeSlot)) {
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

  const getCoPresenterDisplayName = (cp: CoPresenterInfo): string => {
    return cp.name || `${cp.firstName || ''} ${cp.lastName || ''}`.trim() || 'Co-Presenter';
  };

  const getAllCoPresenters = (presenter: PresenterSummary): CoPresenterInfo[] => {
    const all: CoPresenterInfo[] = [];
    if (presenter.coPresenter) {
      all.push(presenter.coPresenter);
    }
    all.push(...presenter.additionalCoPresenters);
    return all;
  };

  const handleEditCoPresenter = (presenterName: string, index: number, cp?: CoPresenterInfo) => {
    setCoPresenterForm(cp || {});
    setEditingCoPresenterIndex({ presenterName, index });
  };

  const handleSaveCoPresenter = (presenter: PresenterSummary) => {
    if (!editingCoPresenterIndex) return;

    const coName = [coPresenterForm.firstName, coPresenterForm.lastName]
      .filter(Boolean)
      .join(' ') || undefined;

    const { index } = editingCoPresenterIndex;

    if (index === -1) {
      // Adding new co-presenter
      const newCp = {
        name: coName,
        firstName: coPresenterForm.firstName,
        lastName: coPresenterForm.lastName,
        email: coPresenterForm.email,
        phone: coPresenterForm.phone,
      };

      if (!presenter.coPresenter) {
        // No primary co-presenter, set as primary
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
      } else {
        // Add to additional co-presenters
        const existingAdditional = presenter.additionalCoPresenters;
        for (const sessionId of presenter.sessionIds) {
          updateSession(sessionId, {
            coPresenters: [...existingAdditional, newCp],
          });
        }
      }
    } else if (index === 0 && presenter.coPresenter) {
      // Editing primary co-presenter
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
    } else {
      // Editing additional co-presenter
      const additionalIndex = presenter.coPresenter ? index - 1 : index;
      const updatedAdditional = [...presenter.additionalCoPresenters];
      updatedAdditional[additionalIndex] = {
        name: coName,
        firstName: coPresenterForm.firstName,
        lastName: coPresenterForm.lastName,
        email: coPresenterForm.email,
        phone: coPresenterForm.phone,
      };
      for (const sessionId of presenter.sessionIds) {
        updateSession(sessionId, {
          coPresenters: updatedAdditional,
        });
      }
    }

    setEditingCoPresenterIndex(null);
    setCoPresenterForm({});
  };

  const handleDeleteCoPresenter = (presenter: PresenterSummary, index: number) => {
    const allCoPresenters = getAllCoPresenters(presenter);
    if (index < 0 || index >= allCoPresenters.length) return;

    if (!confirm(`Remove co-presenter "${getCoPresenterDisplayName(allCoPresenters[index])}" from all sessions?`)) {
      return;
    }

    if (index === 0 && presenter.coPresenter) {
      // Removing primary co-presenter
      // If there are additional co-presenters, promote the first one
      if (presenter.additionalCoPresenters.length > 0) {
        const promoted = presenter.additionalCoPresenters[0];
        const remaining = presenter.additionalCoPresenters.slice(1);
        for (const sessionId of presenter.sessionIds) {
          updateSession(sessionId, {
            coPresenterName: promoted.name || `${promoted.firstName || ''} ${promoted.lastName || ''}`.trim() || undefined,
            coPresenterFirstName: promoted.firstName,
            coPresenterLastName: promoted.lastName,
            coPresenterTitle: undefined,
            coPresenterCompany: undefined,
            coPresenterEmail: promoted.email,
            coPresenterPhone: promoted.phone,
            coPresenters: remaining.length > 0 ? remaining : undefined,
          });
        }
      } else {
        // No additional co-presenters, just clear primary
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
    } else {
      // Removing additional co-presenter
      const additionalIndex = presenter.coPresenter ? index - 1 : index;
      const updatedAdditional = presenter.additionalCoPresenters.filter((_, i) => i !== additionalIndex);
      for (const sessionId of presenter.sessionIds) {
        updateSession(sessionId, {
          coPresenters: updatedAdditional.length > 0 ? updatedAdditional : undefined,
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

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search presenters, sessions, companies..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredPresenters.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No presenters found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPresenters.map((presenter) => {
                const allCoPresenters = getAllCoPresenters(presenter);
                return (
                  <div
                    key={presenter.name}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => togglePresenter(presenter.name)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{presenter.name}</span>
                          {allCoPresenters.length > 0 && (
                            <>
                              <span className="text-gray-400">&</span>
                              {allCoPresenters.slice(0, 2).map((cp, idx) => (
                                <span key={idx} className="font-medium text-blue-600 dark:text-blue-400">
                                  {getCoPresenterDisplayName(cp)}
                                  {idx < Math.min(allCoPresenters.length, 2) - 1 && ', '}
                                </span>
                              ))}
                              {allCoPresenters.length > 2 && (
                                <span className="text-gray-500 text-sm">
                                  +{allCoPresenters.length - 2} more
                                </span>
                              )}
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
                        {allCoPresenters.length > 0 && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                            {allCoPresenters.length} Co-Presenter{allCoPresenters.length !== 1 ? 's' : ''}
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

                        {/* Co-Presenters Section */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300">
                              Co-Presenters ({allCoPresenters.length})
                            </h4>
                            {settings.allowEditPresenters && (
                              <button
                                onClick={() => handleEditCoPresenter(presenter.name, -1)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                + Add Co-Presenter
                              </button>
                            )}
                          </div>

                          {/* Editing form */}
                          {editingCoPresenterIndex?.presenterName === presenter.name && (
                            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <h5 className="font-medium text-sm mb-3 text-blue-700 dark:text-blue-300">
                                {editingCoPresenterIndex.index === -1 ? 'Add Co-Presenter' : 'Edit Co-Presenter'}
                              </h5>
                              <div className="grid grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  placeholder="First Name"
                                  value={coPresenterForm.firstName || ''}
                                  onChange={(e) => setCoPresenterForm((f) => ({ ...f, firstName: e.target.value }))}
                                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Last Name"
                                  value={coPresenterForm.lastName || ''}
                                  onChange={(e) => setCoPresenterForm((f) => ({ ...f, lastName: e.target.value }))}
                                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Title"
                                  value={coPresenterForm.title || ''}
                                  onChange={(e) => setCoPresenterForm((f) => ({ ...f, title: e.target.value }))}
                                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Company"
                                  value={coPresenterForm.company || ''}
                                  onChange={(e) => setCoPresenterForm((f) => ({ ...f, company: e.target.value }))}
                                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                                />
                                <input
                                  type="email"
                                  placeholder="Email"
                                  value={coPresenterForm.email || ''}
                                  onChange={(e) => setCoPresenterForm((f) => ({ ...f, email: e.target.value }))}
                                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                                />
                                <input
                                  type="tel"
                                  placeholder="Phone"
                                  value={coPresenterForm.phone || ''}
                                  onChange={(e) => setCoPresenterForm((f) => ({ ...f, phone: e.target.value }))}
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
                                  onClick={() => { setEditingCoPresenterIndex(null); setCoPresenterForm({}); }}
                                  className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Co-presenters list */}
                          {allCoPresenters.length > 0 ? (
                            <div className="space-y-2">
                              {allCoPresenters.map((cp, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-medium text-blue-700 dark:text-blue-300">
                                        {getCoPresenterDisplayName(cp)}
                                      </span>
                                      {idx === 0 && presenter.coPresenter && (
                                        <span className="ml-2 text-xs text-gray-500">(Primary)</span>
                                      )}
                                    </div>
                                    {settings.allowEditPresenters && (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleEditCoPresenter(presenter.name, idx, cp)}
                                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                          title="Edit co-presenter"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteCoPresenter(presenter, idx)}
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
                                  {(cp.title || cp.company) && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {cp.title && <span>{cp.title}</span>}
                                      {cp.title && cp.company && <span className="mx-1">•</span>}
                                      {cp.company && <span>{cp.company}</span>}
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                    {cp.email && (
                                      <div>
                                        <span className="text-gray-500 dark:text-gray-400">Email: </span>
                                        <a href={`mailto:${cp.email}`} className="text-primary-600 dark:text-primary-400">
                                          {cp.email}
                                        </a>
                                      </div>
                                    )}
                                    {cp.phone && (
                                      <div>
                                        <span className="text-gray-500 dark:text-gray-400">Phone: </span>
                                        <a href={`tel:${cp.phone}`} className="text-primary-600 dark:text-primary-400">
                                          {cp.phone}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : editingCoPresenterIndex?.presenterName !== presenter.name && settings.allowEditPresenters ? (
                            <button
                              onClick={() => handleEditCoPresenter(presenter.name, -1)}
                              className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 text-sm"
                            >
                              + Add Co-Presenter
                            </button>
                          ) : null}
                        </div>

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

                        {/* Availability */}
                        {(presenter.unavailability.length > 0 || presenter.unavailabilityText) && (
                          <div>
                            <h4 className="font-medium text-sm mb-2 text-gray-700 dark:text-gray-300">
                              Availability
                            </h4>
                            {presenter.unavailabilityText && (
                              <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg mb-2">
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                  {presenter.unavailabilityText}
                                </p>
                              </div>
                            )}
                            {presenter.unavailability.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  Cannot teach during:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {presenter.unavailability.map((slot, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                                    >
                                      {slot.day} @ {slot.timeSlot === 'all' ? 'All Day' : formatTime(slot.timeSlot, settings.timeFormat)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
